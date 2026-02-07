import { useQuery } from '@tanstack/react-query';
import {
  calculateInsights,
  getTopBeers,
  getFavorites,
  getRepeatBuys,
  getWishlist,
  getEntriesByStyle,
  getRecentEntries,
} from '@/services/insightsService';
import { useUserId } from '@/providers/AuthProvider';
import { Insights, EntryDoc } from '@/types';

// ============================================
// QUERY KEYS
// ============================================

export const insightKeys = {
  all: ['insights'] as const,
  overview: (userId: string) => [...insightKeys.all, 'overview', userId] as const,
  topBeers: (userId: string) => [...insightKeys.all, 'top', userId] as const,
  favorites: (userId: string) => [...insightKeys.all, 'favorites', userId] as const,
  repeatBuys: (userId: string) => [...insightKeys.all, 'repeatBuys', userId] as const,
  wishlist: (userId: string) => [...insightKeys.all, 'wishlist', userId] as const,
  byStyle: (userId: string, style: string) => [...insightKeys.all, 'style', userId, style] as const,
  recent: (userId: string, days: number) => [...insightKeys.all, 'recent', userId, days] as const,
};

// ============================================
// INSIGHTS OVERVIEW
// ============================================

export function useInsights() {
  const userId = useUserId();
  
  return useQuery<Insights, Error>({
    queryKey: insightKeys.overview(userId || ''),
    queryFn: async () => {
      if (!userId) {
        throw new Error('Not authenticated');
      }
      return calculateInsights(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// TOP BEERS
// ============================================

export function useTopBeers(limit: number = 10) {
  const userId = useUserId();
  
  return useQuery<EntryDoc[], Error>({
    queryKey: [...insightKeys.topBeers(userId || ''), limit],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return getTopBeers(userId, limit);
    },
    enabled: !!userId,
  });
}

// ============================================
// FAVORITES
// ============================================

export function useFavorites() {
  const userId = useUserId();
  
  return useQuery<EntryDoc[], Error>({
    queryKey: insightKeys.favorites(userId || ''),
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return getFavorites(userId);
    },
    enabled: !!userId,
  });
}

// ============================================
// REPEAT BUYS
// ============================================

export function useRepeatBuys() {
  const userId = useUserId();
  
  return useQuery<EntryDoc[], Error>({
    queryKey: insightKeys.repeatBuys(userId || ''),
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return getRepeatBuys(userId);
    },
    enabled: !!userId,
  });
}

// ============================================
// WISHLIST
// ============================================

export function useWishlist() {
  const userId = useUserId();
  
  return useQuery<EntryDoc[], Error>({
    queryKey: insightKeys.wishlist(userId || ''),
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return getWishlist(userId);
    },
    enabled: !!userId,
  });
}

// ============================================
// BY STYLE
// ============================================

export function useEntriesByStyle(style: string) {
  const userId = useUserId();
  
  return useQuery<EntryDoc[], Error>({
    queryKey: insightKeys.byStyle(userId || '', style),
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return getEntriesByStyle(userId, style);
    },
    enabled: !!userId && !!style,
  });
}

// ============================================
// RECENT ENTRIES
// ============================================

export function useRecentEntries(days: number = 7) {
  const userId = useUserId();
  
  return useQuery<EntryDoc[], Error>({
    queryKey: insightKeys.recent(userId || '', days),
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return getRecentEntries(userId, days);
    },
    enabled: !!userId,
  });
}
