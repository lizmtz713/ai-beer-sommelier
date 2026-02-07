import AsyncStorage from '@react-native-async-storage/async-storage';
import { RetryQueueItem, RetryQueueItemSchema } from '@/types';
import { STORAGE_KEYS, RETRY_CONFIG } from '@/config/constants';
import { uploadEntryPhoto, updateEntry } from './firebase';
import { z } from 'zod';

// ============================================
// RETRY QUEUE STORAGE
// ============================================

const QueueSchema = z.array(RetryQueueItemSchema);

/**
 * Load retry queue from AsyncStorage
 */
export async function loadRetryQueue(): Promise<RetryQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RETRY_QUEUE);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    const result = QueueSchema.safeParse(parsed);
    
    if (result.success) {
      return result.data;
    }
    
    console.warn('Invalid retry queue data, resetting');
    return [];
  } catch (error) {
    console.error('Failed to load retry queue:', error);
    return [];
  }
}

/**
 * Save retry queue to AsyncStorage
 */
export async function saveRetryQueue(queue: RetryQueueItem[]): Promise<void> {
  try {
    // Limit queue size
    const limitedQueue = queue.slice(0, RETRY_CONFIG.MAX_QUEUE_SIZE);
    await AsyncStorage.setItem(
      STORAGE_KEYS.RETRY_QUEUE,
      JSON.stringify(limitedQueue)
    );
  } catch (error) {
    console.error('Failed to save retry queue:', error);
  }
}

/**
 * Add item to retry queue
 */
export async function addToRetryQueue(
  item: Omit<RetryQueueItem, 'createdAt' | 'attempts'>
): Promise<void> {
  const queue = await loadRetryQueue();
  
  // Check if item already exists (idempotent)
  const existingIndex = queue.findIndex(
    (q) => q.entryId === item.entryId && q.action === item.action
  );
  
  if (existingIndex >= 0) {
    // Update existing item
    queue[existingIndex] = {
      ...item,
      createdAt: queue[existingIndex].createdAt,
      attempts: queue[existingIndex].attempts,
    };
  } else {
    // Add new item
    queue.push({
      ...item,
      createdAt: Date.now(),
      attempts: 0,
    });
  }
  
  await saveRetryQueue(queue);
}

/**
 * Remove item from retry queue
 */
export async function removeFromRetryQueue(
  entryId: string,
  action: RetryQueueItem['action']
): Promise<void> {
  const queue = await loadRetryQueue();
  const filtered = queue.filter(
    (q) => !(q.entryId === entryId && q.action === action)
  );
  await saveRetryQueue(filtered);
}

/**
 * Remove all items for an entry
 */
export async function removeEntryFromRetryQueue(entryId: string): Promise<void> {
  const queue = await loadRetryQueue();
  const filtered = queue.filter((q) => q.entryId !== entryId);
  await saveRetryQueue(filtered);
}

/**
 * Get pending items count
 */
export async function getRetryQueueCount(): Promise<number> {
  const queue = await loadRetryQueue();
  return queue.length;
}

/**
 * Get items for a specific entry
 */
export async function getRetryItemsForEntry(
  entryId: string
): Promise<RetryQueueItem[]> {
  const queue = await loadRetryQueue();
  return queue.filter((q) => q.entryId === entryId);
}

// ============================================
// RETRY EXECUTION
// ============================================

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(attempts: number): number {
  const delay = Math.min(
    RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempts),
    RETRY_CONFIG.MAX_DELAY_MS
  );
  // Add jitter
  return delay + Math.random() * 1000;
}

/**
 * Process a single retry item
 */
async function processRetryItem(item: RetryQueueItem): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    switch (item.action) {
      case 'upload_photo': {
        const { userId, photoUri, photoIndex } = item.payload as {
          userId: string;
          photoUri: string;
          photoIndex: number;
        };
        
        const downloadUrl = await uploadEntryPhoto(
          userId,
          item.entryId,
          photoUri,
          photoIndex
        );
        
        // Update entry with new photo URL
        await updateEntry(userId, item.entryId, {
          photoUrls: [downloadUrl], // Will need to merge in actual implementation
          photoUploadPending: false,
        });
        
        return { success: true };
      }
      
      case 'update_entry': {
        const { userId, updates } = item.payload as {
          userId: string;
          updates: Record<string, unknown>;
        };
        
        await updateEntry(userId, item.entryId, updates);
        return { success: true };
      }
      
      case 'sync_public': {
        // This is handled by Cloud Function trigger
        // Just mark as success - the Cloud Function will process it
        return { success: true };
      }
      
      default:
        return { success: false, error: `Unknown action: ${item.action}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process all items in retry queue
 * Returns results for each item
 */
export async function processRetryQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ entryId: string; error: string }>;
}> {
  const queue = await loadRetryQueue();
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ entryId: string; error: string }>,
  };
  
  const remainingItems: RetryQueueItem[] = [];
  
  for (const item of queue) {
    // Skip if max retries exceeded
    if (item.attempts >= RETRY_CONFIG.MAX_RETRY_ATTEMPTS) {
      results.failed++;
      results.errors.push({
        entryId: item.entryId,
        error: 'Max retry attempts exceeded',
      });
      continue;
    }
    
    // Calculate delay based on attempts
    if (item.lastAttempt) {
      const requiredDelay = calculateRetryDelay(item.attempts);
      const timeSinceLastAttempt = Date.now() - item.lastAttempt;
      
      if (timeSinceLastAttempt < requiredDelay) {
        // Not ready to retry yet
        remainingItems.push(item);
        continue;
      }
    }
    
    results.processed++;
    
    const result = await processRetryItem(item);
    
    if (result.success) {
      results.succeeded++;
      // Item processed successfully, don't add back to queue
    } else {
      // Update item with new attempt info
      const updatedItem: RetryQueueItem = {
        ...item,
        attempts: item.attempts + 1,
        lastAttempt: Date.now(),
        errorMessage: result.error,
      };
      
      if (updatedItem.attempts < RETRY_CONFIG.MAX_RETRY_ATTEMPTS) {
        remainingItems.push(updatedItem);
      } else {
        results.failed++;
        results.errors.push({
          entryId: item.entryId,
          error: result.error || 'Unknown error',
        });
      }
    }
  }
  
  // Save remaining items
  await saveRetryQueue(remainingItems);
  
  return results;
}

/**
 * Retry a specific entry's failed items
 */
export async function retryEntry(entryId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const queue = await loadRetryQueue();
  const entryItems = queue.filter((q) => q.entryId === entryId);
  
  if (entryItems.length === 0) {
    return { success: true }; // Nothing to retry
  }
  
  let allSucceeded = true;
  let lastError: string | undefined;
  
  for (const item of entryItems) {
    // Reset attempts for manual retry
    const resetItem: RetryQueueItem = {
      ...item,
      attempts: 0,
      lastAttempt: undefined,
      errorMessage: undefined,
    };
    
    const result = await processRetryItem(resetItem);
    
    if (!result.success) {
      allSucceeded = false;
      lastError = result.error;
      
      // Update item in queue
      const queueIndex = queue.findIndex(
        (q) => q.entryId === item.entryId && q.action === item.action
      );
      if (queueIndex >= 0) {
        queue[queueIndex] = {
          ...resetItem,
          attempts: 1,
          lastAttempt: Date.now(),
          errorMessage: result.error,
        };
      }
    } else {
      // Remove successful item from queue
      const queueIndex = queue.findIndex(
        (q) => q.entryId === item.entryId && q.action === item.action
      );
      if (queueIndex >= 0) {
        queue.splice(queueIndex, 1);
      }
    }
  }
  
  await saveRetryQueue(queue);
  
  return allSucceeded
    ? { success: true }
    : { success: false, error: lastError };
}

/**
 * Clear all items from retry queue
 */
export async function clearRetryQueue(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.RETRY_QUEUE);
}

/**
 * Get failed items (max retries exceeded)
 */
export async function getFailedItems(): Promise<RetryQueueItem[]> {
  const queue = await loadRetryQueue();
  return queue.filter((q) => q.attempts >= RETRY_CONFIG.MAX_RETRY_ATTEMPTS);
}
