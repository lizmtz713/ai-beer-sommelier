import { useMemo, useCallback } from 'react';
import { useSubscription } from '../providers/SubscriptionProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthProvider';

// ===========================================
// CONSTANTS
// ===========================================

const FREE_TIER_LIMITS = {
  AI_CHATS_PER_MONTH: 5,
  BEER_ENTRIES: 50,
} as const;

const STORAGE_KEYS = {
  AI_CHAT_COUNT: 'feature_ai_chat_count',
  AI_CHAT_MONTH: 'feature_ai_chat_month',
  BEER_ENTRY_COUNT: 'feature_beer_entry_count',
} as const;

// ===========================================
// TYPES
// ===========================================

export interface FeatureGate {
  // Premium features
  canUseUnlimitedAI: boolean;
  canExportData: boolean;
  canUseAdvancedStats: boolean;
  canUseUnlimitedBeers: boolean;
  isAdFree: boolean;
  
  // Free tier tracking
  aiChatsRemaining: number;
  aiChatsUsedThisMonth: number;
  beersRemaining: number;
  beersLogged: number;
  
  // Helper functions
  checkAIChatLimit: () => Promise<boolean>;
  incrementAIChatCount: () => Promise<void>;
  checkBeerLimit: () => Promise<boolean>;
  incrementBeerCount: () => Promise<void>;
  getBeerCount: () => Promise<number>;
  resetUsageTracking: () => Promise<void>;
}

// ===========================================
// HOOK
// ===========================================

export function useFeatureGate(): FeatureGate {
  const { isPremium } = useSubscription();
  const { user } = useAuth();

  // Memoized feature flags
  const features = useMemo(() => ({
    // Premium features
    canUseUnlimitedAI: isPremium,
    canExportData: isPremium,
    canUseAdvancedStats: isPremium,
    canUseUnlimitedBeers: isPremium,
    isAdFree: isPremium,
  }), [isPremium]);

  // Get current month key for storage
  const getMonthKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }, []);

  // Get user-specific storage key
  const getUserKey = useCallback((key: string) => {
    return user?.uid ? `${key}_${user.uid}` : key;
  }, [user?.uid]);

  // Get AI chat usage for current month
  const getAIChatUsage = useCallback(async (): Promise<{ count: number; month: string }> => {
    try {
      const [countStr, monthStr] = await Promise.all([
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_COUNT)),
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_MONTH)),
      ]);

      const currentMonth = getMonthKey();
      const storedMonth = monthStr || '';
      
      // Reset if new month
      if (storedMonth !== currentMonth) {
        await AsyncStorage.multiSet([
          [getUserKey(STORAGE_KEYS.AI_CHAT_COUNT), '0'],
          [getUserKey(STORAGE_KEYS.AI_CHAT_MONTH), currentMonth],
        ]);
        return { count: 0, month: currentMonth };
      }

      return {
        count: parseInt(countStr || '0', 10),
        month: storedMonth,
      };
    } catch (error) {
      console.error('[useFeatureGate] Failed to get AI chat usage:', error);
      return { count: 0, month: getMonthKey() };
    }
  }, [getUserKey, getMonthKey]);

  // Check if user can use AI chat
  const checkAIChatLimit = useCallback(async (): Promise<boolean> => {
    if (isPremium) return true; // Unlimited for Premium
    
    const { count } = await getAIChatUsage();
    return count < FREE_TIER_LIMITS.AI_CHATS_PER_MONTH;
  }, [isPremium, getAIChatUsage]);

  // Increment AI chat count
  const incrementAIChatCount = useCallback(async (): Promise<void> => {
    if (isPremium) return; // Don't track for Premium
    
    try {
      const { count } = await getAIChatUsage();
      await AsyncStorage.setItem(
        getUserKey(STORAGE_KEYS.AI_CHAT_COUNT),
        String(count + 1)
      );
    } catch (error) {
      console.error('[useFeatureGate] Failed to increment AI chat count:', error);
    }
  }, [isPremium, getAIChatUsage, getUserKey]);

  // Get beer entry count
  const getBeerCount = useCallback(async (): Promise<number> => {
    try {
      const countStr = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.BEER_ENTRY_COUNT));
      return parseInt(countStr || '0', 10);
    } catch (error) {
      console.error('[useFeatureGate] Failed to get beer count:', error);
      return 0;
    }
  }, [getUserKey]);

  // Check if user can add more beers
  const checkBeerLimit = useCallback(async (): Promise<boolean> => {
    if (isPremium) return true; // Unlimited for Premium
    
    const count = await getBeerCount();
    return count < FREE_TIER_LIMITS.BEER_ENTRIES;
  }, [isPremium, getBeerCount]);

  // Increment beer count
  const incrementBeerCount = useCallback(async (): Promise<void> => {
    if (isPremium) return; // Don't track for Premium
    
    try {
      const count = await getBeerCount();
      await AsyncStorage.setItem(
        getUserKey(STORAGE_KEYS.BEER_ENTRY_COUNT),
        String(count + 1)
      );
    } catch (error) {
      console.error('[useFeatureGate] Failed to increment beer count:', error);
    }
  }, [isPremium, getBeerCount, getUserKey]);

  // Reset all usage tracking (for testing or account changes)
  const resetUsageTracking = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        getUserKey(STORAGE_KEYS.AI_CHAT_COUNT),
        getUserKey(STORAGE_KEYS.AI_CHAT_MONTH),
        getUserKey(STORAGE_KEYS.BEER_ENTRY_COUNT),
      ]);
    } catch (error) {
      console.error('[useFeatureGate] Failed to reset usage tracking:', error);
    }
  }, [getUserKey]);

  // Calculate remaining values (sync version for rendering - actual is async)
  const aiChatsRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return FREE_TIER_LIMITS.AI_CHATS_PER_MONTH;
  }, [isPremium]);

  const beersRemaining = useMemo(() => {
    if (isPremium) return Infinity;
    return FREE_TIER_LIMITS.BEER_ENTRIES;
  }, [isPremium]);

  return {
    ...features,
    aiChatsRemaining,
    aiChatsUsedThisMonth: 0, // Updated async when needed
    beersRemaining,
    beersLogged: 0, // Updated async when needed
    checkAIChatLimit,
    incrementAIChatCount,
    checkBeerLimit,
    incrementBeerCount,
    getBeerCount,
    resetUsageTracking,
  };
}

// ===========================================
// UTILITY HOOK FOR ASYNC USAGE DATA
// ===========================================

export function useFeatureUsage() {
  const { isPremium } = useSubscription();
  const { user } = useAuth();

  const getUserKey = useCallback((key: string) => {
    return user?.uid ? `${key}_${user.uid}` : key;
  }, [user?.uid]);

  const getMonthKey = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }, []);

  // Get async AI chat usage
  const getAIChatUsage = useCallback(async () => {
    if (isPremium) {
      return { used: 0, remaining: Infinity, limit: Infinity };
    }

    try {
      const [countStr, monthStr] = await Promise.all([
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_COUNT)),
        AsyncStorage.getItem(getUserKey(STORAGE_KEYS.AI_CHAT_MONTH)),
      ]);

      const currentMonth = getMonthKey();
      const count = monthStr === currentMonth ? parseInt(countStr || '0', 10) : 0;

      return {
        used: count,
        remaining: Math.max(0, FREE_TIER_LIMITS.AI_CHATS_PER_MONTH - count),
        limit: FREE_TIER_LIMITS.AI_CHATS_PER_MONTH,
      };
    } catch {
      return { used: 0, remaining: FREE_TIER_LIMITS.AI_CHATS_PER_MONTH, limit: FREE_TIER_LIMITS.AI_CHATS_PER_MONTH };
    }
  }, [isPremium, getUserKey, getMonthKey]);

  // Get async beer count
  const getBeerUsage = useCallback(async () => {
    if (isPremium) {
      return { used: 0, remaining: Infinity, limit: Infinity };
    }

    try {
      const countStr = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.BEER_ENTRY_COUNT));
      const count = parseInt(countStr || '0', 10);

      return {
        used: count,
        remaining: Math.max(0, FREE_TIER_LIMITS.BEER_ENTRIES - count),
        limit: FREE_TIER_LIMITS.BEER_ENTRIES,
      };
    } catch {
      return { used: 0, remaining: FREE_TIER_LIMITS.BEER_ENTRIES, limit: FREE_TIER_LIMITS.BEER_ENTRIES };
    }
  }, [isPremium, getUserKey]);

  return { getAIChatUsage, getBeerUsage };
}
