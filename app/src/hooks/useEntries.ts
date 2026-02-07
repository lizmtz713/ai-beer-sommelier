import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  getEntries,
  getEntry,
  getEntriesNearMe,
  getPublicEntries,
} from '@/services/firebase';
import {
  createNewEntry,
  updateExistingEntry,
  deleteExistingEntry,
  retryFailedEntry,
  quickLog,
} from '@/services/entryService';
import { useUserId } from '@/providers/AuthProvider';
import { EntryDoc, EntryInput, Filter, GeoPoint, PublicEntry } from '@/types';
import { PAGINATION } from '@/config/constants';

// ============================================
// QUERY KEYS
// ============================================

export const entryKeys = {
  all: ['entries'] as const,
  lists: () => [...entryKeys.all, 'list'] as const,
  list: (userId: string, filters?: Filter) => [...entryKeys.lists(), userId, filters] as const,
  details: () => [...entryKeys.all, 'detail'] as const,
  detail: (userId: string, entryId: string) => [...entryKeys.details(), userId, entryId] as const,
  nearby: (userId: string, center: GeoPoint, radius: number) => 
    [...entryKeys.all, 'nearby', userId, center, radius] as const,
  public: () => [...entryKeys.all, 'public'] as const,
};

// ============================================
// ENTRIES LIST QUERY (INFINITE)
// ============================================

interface EntriesPage {
  entries: EntryDoc[];
  lastDoc: DocumentSnapshot | null;
}

export function useEntries(filters?: Filter) {
  const userId = useUserId();
  
  return useInfiniteQuery<EntriesPage, Error>({
    queryKey: entryKeys.list(userId || '', filters),
    queryFn: async ({ pageParam }) => {
      if (!userId) {
        return { entries: [], lastDoc: null };
      }
      return getEntries(userId, filters, PAGINATION.DEFAULT_PAGE_SIZE, pageParam as DocumentSnapshot | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    initialPageParam: undefined as DocumentSnapshot | undefined,
    enabled: !!userId,
  });
}

// ============================================
// SINGLE ENTRY QUERY
// ============================================

export function useEntry(entryId: string) {
  const userId = useUserId();
  
  return useQuery<EntryDoc | null, Error>({
    queryKey: entryKeys.detail(userId || '', entryId),
    queryFn: async () => {
      if (!userId) return null;
      return getEntry(userId, entryId);
    },
    enabled: !!userId && !!entryId,
  });
}

// ============================================
// NEARBY ENTRIES QUERY
// ============================================

export function useNearbyEntries(
  center: GeoPoint | null,
  radiusKm: number,
  filters?: Filter
) {
  const userId = useUserId();
  
  return useQuery({
    queryKey: entryKeys.nearby(userId || '', center || { latitude: 0, longitude: 0 }, radiusKm),
    queryFn: async () => {
      if (!userId || !center) {
        return { entries: [], hasMore: false };
      }
      return getEntriesNearMe(userId, center, radiusKm, filters);
    },
    enabled: !!userId && !!center,
  });
}

// ============================================
// PUBLIC ENTRIES QUERY (INFINITE)
// ============================================

interface PublicEntriesPage {
  entries: PublicEntry[];
  lastDoc: DocumentSnapshot | null;
}

export function usePublicEntries() {
  return useInfiniteQuery<PublicEntriesPage, Error>({
    queryKey: entryKeys.public(),
    queryFn: async ({ pageParam }) => {
      return getPublicEntries(PAGINATION.DEFAULT_PAGE_SIZE, pageParam as DocumentSnapshot | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    initialPageParam: undefined as DocumentSnapshot | undefined,
  });
}

// ============================================
// CREATE ENTRY MUTATION
// ============================================

export function useCreateEntry() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      input,
      photoUris,
    }: {
      input: EntryInput;
      photoUris?: string[];
    }) => {
      if (!userId) throw new Error('Not authenticated');
      return createNewEntry({ input, userId, photoUris });
    },
    onSuccess: () => {
      // Invalidate entries list
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// ============================================
// QUICK LOG MUTATION
// ============================================

export function useQuickLog() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, ratingNum }: { name: string; ratingNum: number }) => {
      if (!userId) throw new Error('Not authenticated');
      return quickLog({ name, ratingNum, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// ============================================
// UPDATE ENTRY MUTATION
// ============================================

export function useUpdateEntry() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      entryId,
      updates,
      newPhotoUris,
    }: {
      entryId: string;
      updates: Partial<EntryInput>;
      newPhotoUris?: string[];
    }) => {
      if (!userId) throw new Error('Not authenticated');
      return updateExistingEntry({ entryId, userId, updates, newPhotoUris });
    },
    onSuccess: (_, variables) => {
      // Invalidate specific entry and list
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(userId || '', variables.entryId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// ============================================
// DELETE ENTRY MUTATION
// ============================================

export function useDeleteEntry() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return deleteExistingEntry(userId, entryId);
    },
    onSuccess: (_, entryId) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: entryKeys.detail(userId || '', entryId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// ============================================
// RETRY ENTRY MUTATION
// ============================================

export function useRetryEntry() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!userId) throw new Error('Not authenticated');
      return retryFailedEntry(userId, entryId);
    },
    onSuccess: (_, entryId) => {
      // Invalidate entry and list
      queryClient.invalidateQueries({ queryKey: entryKeys.detail(userId || '', entryId) });
      queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
    },
  });
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Get all entries as a flat array
 */
export function useAllEntries(filters?: Filter): {
  entries: EntryDoc[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
} {
  const query = useEntries(filters);
  
  const entries = query.data?.pages.flatMap((page) => page.entries) ?? [];
  
  return {
    entries,
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

/**
 * Get all public entries as a flat array
 */
export function useAllPublicEntries(): {
  entries: PublicEntry[];
  isLoading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
} {
  const query = usePublicEntries();
  
  const entries = query.data?.pages.flatMap((page) => page.entries) ?? [];
  
  return {
    entries,
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
