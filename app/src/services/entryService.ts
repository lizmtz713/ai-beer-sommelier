import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EntryDoc,
  EntryInput,
  EntryStatus,
  EntryStatusType,
  EntryInputSchema,
} from '@/types';
import { STORAGE_KEYS } from '@/config/constants';
import {
  createEntry,
  updateEntry,
  uploadEntryPhoto,
  deleteEntry,
  deleteEntryPhotos,
  getEntry,
} from './firebase';
import { addToRetryQueue, removeEntryFromRetryQueue } from './retryQueue';
import { processImageForUpload } from '@/utils/image';
import { getCurrentLocation } from './location';
import { encodeGeohash } from '@/utils/geo';

// ============================================
// DRAFT MANAGEMENT
// ============================================

/**
 * Save draft entry to AsyncStorage
 */
export async function saveDraft(draft: Partial<EntryInput>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_ENTRY, JSON.stringify(draft));
}

/**
 * Load draft entry from AsyncStorage
 */
export async function loadDraft(): Promise<Partial<EntryInput> | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_ENTRY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clear draft entry
 */
export async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_ENTRY);
}

// ============================================
// ENTRY CREATION WITH STATE MACHINE
// ============================================

interface CreateEntryParams {
  input: EntryInput;
  userId: string;
  photoUris?: string[];
}

interface CreateEntryResult {
  success: boolean;
  entryId?: string;
  error?: string;
  status: EntryStatusType;
}

/**
 * Create a new entry with the state machine:
 * draft -> uploading -> complete OR error
 * 
 * CRITICAL: Entry document is saved BEFORE uploads begin.
 * This ensures entry is never lost even if uploads fail.
 */
export async function createNewEntry({
  input,
  userId,
  photoUris = [],
}: CreateEntryParams): Promise<CreateEntryResult> {
  // Validate input
  const validation = EntryInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || 'Validation failed',
      status: EntryStatus.ERROR,
    };
  }
  
  const entryId = uuidv4();
  const now = new Date();
  
  // Get location if not provided
  let location = input.location;
  let geohash = input.geohash;
  
  if (!location) {
    const locationResult = await getCurrentLocation();
    if (locationResult.location) {
      location = locationResult.location;
      geohash = locationResult.geohash || undefined;
    }
  } else if (!geohash && location) {
    geohash = encodeGeohash({ latitude: location.latitude, longitude: location.longitude });
  }
  
  // Create entry document in DRAFT status first
  const entry: EntryDoc = {
    id: entryId,
    userId,
    status: EntryStatus.DRAFT,
    
    // Beer info
    name: input.name,
    barcode: input.barcode,
    brand: input.brand,
    style: input.style,
    abv: input.abv,
    ibu: input.ibu,
    beerCountry: input.beerCountry,
    description: input.description,
    
    // Rating & notes
    ratingNum: input.ratingNum,
    notes: input.notes,
    
    // Price info
    price: input.price,
    currency: input.currency,
    volume: input.volume,
    volumeUnit: input.volumeUnit,
    purchaseLocation: input.purchaseLocation,
    
    // Toggles
    favorite: input.favorite ?? false,
    repeatBuy: input.repeatBuy ?? false,
    wishlist: input.wishlist ?? false,
    
    // Sharing (defaults OFF)
    sharePublic: input.sharePublic ?? false,
    shareMedia: input.shareMedia ?? false,
    sharePrice: input.sharePrice ?? false,
    
    // Location (PRIVATE)
    location,
    geohash,
    
    // Media
    photoUrls: [],
    photoUploadPending: photoUris.length > 0,
    
    // Timestamps
    consumedAt: input.consumedAt || now,
    createdAt: now,
    updatedAt: now,
  };
  
  try {
    // STEP 1: Save entry document immediately (DRAFT status)
    await createEntry(entry);
    
    // STEP 2: Transition to UPLOADING status
    await updateEntry(userId, entryId, { status: EntryStatus.UPLOADING });
    
    // STEP 3: Process and upload photos
    const uploadedUrls: string[] = [];
    let uploadError: string | undefined;
    
    for (let i = 0; i < photoUris.length; i++) {
      try {
        // Strip EXIF GPS data before upload
        const processed = await processImageForUpload(photoUris[i]);
        
        // Upload to Storage (path is deterministic for idempotency)
        const downloadUrl = await uploadEntryPhoto(
          userId,
          entryId,
          processed.uri,
          i
        );
        
        uploadedUrls.push(downloadUrl);
      } catch (photoError) {
        console.error(`Photo ${i} upload failed:`, photoError);
        uploadError = photoError instanceof Error ? photoError.message : 'Upload failed';
        
        // Add to retry queue for later
        await addToRetryQueue({
          entryId,
          action: 'upload_photo',
          payload: {
            userId,
            photoUri: photoUris[i],
            photoIndex: i,
          },
        });
      }
    }
    
    // STEP 4: Update entry with results
    if (uploadError && uploadedUrls.length === 0) {
      // All uploads failed
      await updateEntry(userId, entryId, {
        status: EntryStatus.ERROR,
        errorMessage: uploadError,
        photoUrls: [],
        photoUploadPending: true,
      });
      
      return {
        success: false,
        entryId,
        error: uploadError,
        status: EntryStatus.ERROR,
      };
    }
    
    // At least some uploads succeeded (or no photos)
    const finalStatus = uploadError ? EntryStatus.ERROR : EntryStatus.COMPLETE;
    
    await updateEntry(userId, entryId, {
      status: finalStatus,
      errorMessage: uploadError,
      photoUrls: uploadedUrls,
      photoUploadPending: photoUris.length > uploadedUrls.length,
    });
    
    // Clear draft on success
    if (finalStatus === EntryStatus.COMPLETE) {
      await clearDraft();
    }
    
    return {
      success: finalStatus === EntryStatus.COMPLETE,
      entryId,
      error: uploadError,
      status: finalStatus,
    };
  } catch (error) {
    // Critical failure - try to update status
    try {
      await updateEntry(userId, entryId, {
        status: EntryStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // Entry might not exist, add to retry queue
      await addToRetryQueue({
        entryId,
        action: 'update_entry',
        payload: {
          userId,
          updates: entry,
        },
      });
    }
    
    return {
      success: false,
      entryId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: EntryStatus.ERROR,
    };
  }
}

// ============================================
// ENTRY UPDATE
// ============================================

interface UpdateEntryParams {
  entryId: string;
  userId: string;
  updates: Partial<EntryInput>;
  newPhotoUris?: string[];
}

export async function updateExistingEntry({
  entryId,
  userId,
  updates,
  newPhotoUris = [],
}: UpdateEntryParams): Promise<CreateEntryResult> {
  try {
    // Get current entry
    const currentEntry = await getEntry(userId, entryId);
    if (!currentEntry) {
      return {
        success: false,
        error: 'Entry not found',
        status: EntryStatus.ERROR,
      };
    }
    
    // Update location/geohash if location changed
    let geohash = currentEntry.geohash;
    if (updates.location && !updates.geohash) {
      geohash = encodeGeohash({
        latitude: updates.location.latitude,
        longitude: updates.location.longitude,
      });
    }
    
    // Set status to uploading if new photos
    const status = newPhotoUris.length > 0 ? EntryStatus.UPLOADING : currentEntry.status;
    
    // Apply updates
    await updateEntry(userId, entryId, {
      ...updates,
      geohash,
      status,
      updatedAt: new Date(),
    });
    
    // Upload new photos
    let uploadError: string | undefined;
    const existingUrls = currentEntry.photoUrls || [];
    const newUrls: string[] = [];
    
    for (let i = 0; i < newPhotoUris.length; i++) {
      const photoIndex = existingUrls.length + i;
      
      try {
        const processed = await processImageForUpload(newPhotoUris[i]);
        const downloadUrl = await uploadEntryPhoto(userId, entryId, processed.uri, photoIndex);
        newUrls.push(downloadUrl);
      } catch (photoError) {
        uploadError = photoError instanceof Error ? photoError.message : 'Upload failed';
        
        await addToRetryQueue({
          entryId,
          action: 'upload_photo',
          payload: {
            userId,
            photoUri: newPhotoUris[i],
            photoIndex,
          },
        });
      }
    }
    
    // Update final status
    const finalStatus = uploadError ? EntryStatus.ERROR : EntryStatus.COMPLETE;
    
    await updateEntry(userId, entryId, {
      status: finalStatus,
      errorMessage: uploadError,
      photoUrls: [...existingUrls, ...newUrls],
      photoUploadPending: newPhotoUris.length > newUrls.length,
    });
    
    return {
      success: finalStatus === EntryStatus.COMPLETE,
      entryId,
      error: uploadError,
      status: finalStatus,
    };
  } catch (error) {
    return {
      success: false,
      entryId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: EntryStatus.ERROR,
    };
  }
}

// ============================================
// ENTRY DELETION
// ============================================

export async function deleteExistingEntry(
  userId: string,
  entryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get entry to know photo count
    const entry = await getEntry(userId, entryId);
    if (!entry) {
      return { success: false, error: 'Entry not found' };
    }
    
    // Delete photos from storage
    if (entry.photoUrls && entry.photoUrls.length > 0) {
      await deleteEntryPhotos(userId, entryId, entry.photoUrls.length);
    }
    
    // Delete entry document
    await deleteEntry(userId, entryId);
    
    // Remove from retry queue
    await removeEntryFromRetryQueue(entryId);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

// ============================================
// RETRY FAILED ENTRY
// ============================================

export async function retryFailedEntry(
  userId: string,
  entryId: string
): Promise<CreateEntryResult> {
  try {
    const entry = await getEntry(userId, entryId);
    if (!entry) {
      return {
        success: false,
        error: 'Entry not found',
        status: EntryStatus.ERROR,
      };
    }
    
    if (entry.status !== EntryStatus.ERROR) {
      return {
        success: true,
        entryId,
        status: entry.status,
      };
    }
    
    // Set to uploading
    await updateEntry(userId, entryId, {
      status: EntryStatus.UPLOADING,
      errorMessage: undefined,
      retryCount: (entry.retryCount || 0) + 1,
    });
    
    // Process retry queue items for this entry
    const { retryEntry } = await import('./retryQueue');
    const result = await retryEntry(entryId);
    
    if (result.success) {
      await updateEntry(userId, entryId, {
        status: EntryStatus.COMPLETE,
        photoUploadPending: false,
      });
      
      return {
        success: true,
        entryId,
        status: EntryStatus.COMPLETE,
      };
    }
    
    // Still has errors
    await updateEntry(userId, entryId, {
      status: EntryStatus.ERROR,
      errorMessage: result.error,
    });
    
    return {
      success: false,
      entryId,
      error: result.error,
      status: EntryStatus.ERROR,
    };
  } catch (error) {
    return {
      success: false,
      entryId,
      error: error instanceof Error ? error.message : 'Retry failed',
      status: EntryStatus.ERROR,
    };
  }
}

// ============================================
// QUICK LOG (Minimal fields)
// ============================================

interface QuickLogParams {
  name: string;
  ratingNum: number;
  userId: string;
}

export async function quickLog({
  name,
  ratingNum,
  userId,
}: QuickLogParams): Promise<CreateEntryResult> {
  return createNewEntry({
    input: {
      name,
      ratingNum,
      currency: 'USD',
      volumeUnit: 'ml',
      favorite: false,
      repeatBuy: false,
      wishlist: false,
      sharePublic: false,
      shareMedia: false,
      sharePrice: false,
    },
    userId,
  });
}
