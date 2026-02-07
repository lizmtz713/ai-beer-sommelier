import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { firebaseConfig } from '@/config/firebase.config';
import { EntryDoc, UserProfile, PublicEntry, Filter, GeoPoint } from '@/types';
import { geohashBounds, isWithinRadius, dedupeEntries } from '@/utils/geo';
import { GEO_CONFIG, PAGINATION } from '@/config/constants';
import { subDays } from 'date-fns';

// ============================================
// INITIALIZATION
// ============================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export function initializeFirebase(): void {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export function getFirebaseAuth(): Auth {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) initializeFirebase();
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) initializeFirebase();
  return storage;
}

// ============================================
// AUTH SERVICE
// ============================================

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error?: string }> {
  try {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    return { user: credential.user };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    return { user: null, error: firebaseError.message || 'Sign in failed' };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error?: string }> {
  try {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password
    );
    
    if (displayName && credential.user) {
      await updateProfile(credential.user, { displayName });
    }
    
    // Create user profile document
    if (credential.user) {
      await createUserProfile(credential.user);
    }
    
    return { user: credential.user };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    return { user: null, error: firebaseError.message || 'Sign up failed' };
  }
}

export async function signInWithGoogle(
  idToken: string
): Promise<{ user: User | null; error?: string }> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(getFirebaseAuth(), credential);
    
    // Create/update user profile
    if (result.user) {
      await createUserProfile(result.user);
    }
    
    return { user: result.user };
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    return { user: null, error: firebaseError.message || 'Google sign in failed' };
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export async function resetPassword(email: string): Promise<{ error?: string }> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
    return {};
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    return { error: firebaseError.message || 'Password reset failed' };
  }
}

// ============================================
// USER PROFILE SERVICE
// ============================================

export async function createUserProfile(user: User): Promise<void> {
  const profileRef = doc(getFirebaseDb(), 'users', user.uid);
  const existing = await getDoc(profileRef);
  
  if (!existing.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      preferences: {
        defaultCurrency: 'USD',
        defaultVolumeUnit: 'ml',
        sharePublicDefault: false,
      },
    };
    
    await setDoc(profileRef, {
      ...profile,
      createdAt: Timestamp.fromDate(profile.createdAt),
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const profileRef = doc(getFirebaseDb(), 'users', uid);
  const snapshot = await getDoc(profileRef);
  
  if (!snapshot.exists()) return null;
  
  const data = snapshot.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const profileRef = doc(getFirebaseDb(), 'users', uid);
  await updateDoc(profileRef, updates);
}

// ============================================
// ENTRY SERVICE
// ============================================

function entryDocFromFirestore(docSnap: DocumentSnapshot): EntryDoc | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    consumedAt: data.consumedAt?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as EntryDoc;
}

export async function createEntry(entry: EntryDoc): Promise<void> {
  const entryRef = doc(getFirebaseDb(), 'users', entry.userId, 'entries', entry.id);
  
  await setDoc(entryRef, {
    ...entry,
    consumedAt: Timestamp.fromDate(entry.consumedAt),
    createdAt: Timestamp.fromDate(entry.createdAt),
    updatedAt: Timestamp.fromDate(entry.updatedAt),
  });
}

export async function updateEntry(
  userId: string,
  entryId: string,
  updates: Partial<EntryDoc>
): Promise<void> {
  const entryRef = doc(getFirebaseDb(), 'users', userId, 'entries', entryId);
  
  const processedUpdates: Record<string, unknown> = { ...updates };
  
  // Convert dates to Timestamps
  if (updates.consumedAt) {
    processedUpdates.consumedAt = Timestamp.fromDate(updates.consumedAt);
  }
  processedUpdates.updatedAt = Timestamp.now();
  
  await updateDoc(entryRef, processedUpdates);
}

export async function getEntry(userId: string, entryId: string): Promise<EntryDoc | null> {
  const entryRef = doc(getFirebaseDb(), 'users', userId, 'entries', entryId);
  const snapshot = await getDoc(entryRef);
  return entryDocFromFirestore(snapshot);
}

export async function deleteEntry(userId: string, entryId: string): Promise<void> {
  const entryRef = doc(getFirebaseDb(), 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

export async function getEntries(
  userId: string,
  filters?: Filter,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  lastDoc?: DocumentSnapshot
): Promise<{ entries: EntryDoc[]; lastDoc: DocumentSnapshot | null }> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  
  const constraints: QueryConstraint[] = [
    where('status', '==', 'complete'),
  ];
  
  // Apply filters
  if (filters?.favorite !== undefined) {
    constraints.push(where('favorite', '==', filters.favorite));
  }
  if (filters?.repeatBuy !== undefined) {
    constraints.push(where('repeatBuy', '==', filters.repeatBuy));
  }
  if (filters?.wishlist !== undefined) {
    constraints.push(where('wishlist', '==', filters.wishlist));
  }
  if (filters?.minRating !== undefined) {
    constraints.push(where('ratingNum', '>=', filters.minRating));
  }
  if (filters?.styles && filters.styles.length > 0) {
    constraints.push(where('style', 'in', filters.styles.slice(0, 10)));
  }
  if (filters?.dateFrom) {
    constraints.push(where('consumedAt', '>=', Timestamp.fromDate(filters.dateFrom)));
  }
  if (filters?.dateTo) {
    constraints.push(where('consumedAt', '<=', Timestamp.fromDate(filters.dateTo)));
  }
  
  // Sorting
  const sortField = filters?.sortBy || 'consumedAt';
  const sortDirection = filters?.sortOrder || 'desc';
  constraints.push(orderBy(sortField, sortDirection));
  
  // Pagination
  constraints.push(limit(pageSize));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(entriesRef, ...constraints);
  const snapshot = await getDocs(q);
  
  let entries = snapshot.docs
    .map(entryDocFromFirestore)
    .filter((e): e is EntryDoc => e !== null);
  
  // Client-side search filter (Firestore doesn't support full-text search)
  if (filters?.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.brand?.toLowerCase().includes(searchLower) ||
        e.style?.toLowerCase().includes(searchLower)
    );
  }
  
  const lastDocSnap = snapshot.docs[snapshot.docs.length - 1] || null;
  
  return { entries, lastDoc: lastDocSnap };
}

// ============================================
// GEO QUERIES
// ============================================

export async function getEntriesNearMe(
  userId: string,
  center: GeoPoint,
  radiusKm: number,
  filters?: Filter,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  startAfterEntry?: string
): Promise<{ entries: Array<EntryDoc & { distance: number }>; hasMore: boolean }> {
  // Cap radius
  const cappedRadius = Math.min(radiusKm, GEO_CONFIG.MAX_RADIUS_KM);
  
  // Get geohash prefixes for the search area
  const geohashPrefixes = geohashBounds(center, cappedRadius);
  
  // Determine time window for large radius queries
  const isLargeRadius = cappedRadius > GEO_CONFIG.LARGE_RADIUS_THRESHOLD_KM;
  const timeWindowStart = isLargeRadius
    ? Timestamp.fromDate(subDays(new Date(), GEO_CONFIG.LARGE_RADIUS_TIME_WINDOW_DAYS))
    : null;
  
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  
  // Query each geohash prefix
  const queryPromises = geohashPrefixes.map(async (prefix) => {
    const constraints: QueryConstraint[] = [
      where('status', '==', 'complete'),
      where('geohash', '>=', prefix),
      where('geohash', '<', prefix + '\uf8ff'),
    ];
    
    if (timeWindowStart) {
      constraints.push(where('consumedAt', '>=', timeWindowStart));
    }
    
    constraints.push(orderBy('geohash'));
    constraints.push(orderBy('consumedAt', 'desc'));
    constraints.push(limit(pageSize * 2)); // Fetch extra for filtering
    
    const q = query(entriesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(entryDocFromFirestore)
      .filter((e): e is EntryDoc => e !== null);
  });
  
  // Execute all queries
  const results = await Promise.all(queryPromises);
  const allEntries = results.flat();
  
  // Deduplicate
  let entries = dedupeEntries(allEntries);
  
  // Filter by actual distance (geohash is approximate)
  entries = entries.filter((entry) => {
    if (!entry.location) return false;
    return isWithinRadius(entry.location, center, cappedRadius);
  });
  
  // Apply additional filters
  if (filters?.minRating !== undefined) {
    entries = entries.filter((e) => e.ratingNum >= filters.minRating!);
  }
  if (filters?.styles && filters.styles.length > 0) {
    entries = entries.filter((e) => e.style && filters.styles!.includes(e.style));
  }
  if (filters?.searchQuery) {
    const searchLower = filters.searchQuery.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.brand?.toLowerCase().includes(searchLower)
    );
  }
  
  // Calculate distance and sort by it
  const entriesWithDistance = entries
    .map((entry) => ({
      ...entry,
      distance: entry.location
        ? Math.sqrt(
            Math.pow(entry.location.latitude - center.latitude, 2) +
            Math.pow(entry.location.longitude - center.longitude, 2)
          ) * 111 // Rough km conversion
        : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance);
  
  // Pagination - find start position
  let startIndex = 0;
  if (startAfterEntry) {
    const idx = entriesWithDistance.findIndex((e) => e.id === startAfterEntry);
    if (idx >= 0) startIndex = idx + 1;
  }
  
  const pagedEntries = entriesWithDistance.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < entriesWithDistance.length;
  
  return { entries: pagedEntries, hasMore };
}

// ============================================
// STORAGE SERVICE
// ============================================

export async function uploadEntryPhoto(
  userId: string,
  entryId: string,
  photoUri: string,
  photoIndex: number
): Promise<string> {
  // Path is deterministic for idempotent uploads
  const storagePath = `users/${userId}/entries/${entryId}/photo_${photoIndex}.jpg`;
  const storageRef = ref(getFirebaseStorage(), storagePath);
  
  // Read file and upload
  const response = await fetch(photoUri);
  const blob = await response.blob();
  
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
  });
  
  return getDownloadURL(storageRef);
}

export async function deleteEntryPhotos(
  userId: string,
  entryId: string,
  photoCount: number
): Promise<void> {
  const deletePromises = [];
  
  for (let i = 0; i < photoCount; i++) {
    const storagePath = `users/${userId}/entries/${entryId}/photo_${i}.jpg`;
    const storageRef = ref(getFirebaseStorage(), storagePath);
    deletePromises.push(deleteObject(storageRef).catch(() => {}));
  }
  
  await Promise.all(deletePromises);
}

// ============================================
// PUBLIC ENTRIES SERVICE (READ ONLY)
// ============================================

export async function getPublicEntries(
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  lastDoc?: DocumentSnapshot
): Promise<{ entries: PublicEntry[]; lastDoc: DocumentSnapshot | null }> {
  const publicRef = collection(getFirebaseDb(), 'publicEntries');
  
  const constraints: QueryConstraint[] = [
    orderBy('consumedAt', 'desc'),
    limit(pageSize),
  ];
  
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(publicRef, ...constraints);
  const snapshot = await getDocs(q);
  
  const entries = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      consumedAt: data.consumedAt?.toDate() || new Date(),
      sharedAt: data.sharedAt?.toDate() || new Date(),
    } as PublicEntry;
  });
  
  const lastDocSnap = snapshot.docs[snapshot.docs.length - 1] || null;
  
  return { entries, lastDoc: lastDocSnap };
}

// ============================================
// USER CATALOG SERVICE (for metadata provider)
// ============================================

export async function getUserCatalogEntry(
  userId: string,
  barcode: string
): Promise<EntryDoc | null> {
  const entriesRef = collection(getFirebaseDb(), 'users', userId, 'entries');
  
  const q = query(
    entriesRef,
    where('barcode', '==', barcode),
    where('status', '==', 'complete'),
    orderBy('consumedAt', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return entryDocFromFirestore(snapshot.docs[0]);
}

// ============================================
// BATCH OPERATIONS
// ============================================

export async function batchDeleteEntries(
  userId: string,
  entryIds: string[]
): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  
  for (const entryId of entryIds) {
    const entryRef = doc(getFirebaseDb(), 'users', userId, 'entries', entryId);
    batch.delete(entryRef);
  }
  
  await batch.commit();
}
