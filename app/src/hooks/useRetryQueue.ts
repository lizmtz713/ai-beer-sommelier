import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  loadRetryQueue,
  processRetryQueue,
  getRetryQueueCount,
  retryEntry,
  clearRetryQueue,
  getFailedItems,
} from '@/services/retryQueue';
import { RetryQueueItem } from '@/types';
import { entryKeys } from './useEntries';

// ============================================
// RETRY QUEUE HOOK
// ============================================

export function useRetryQueue() {
  const [queueCount, setQueueCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [failedItems, setFailedItems] = useState<RetryQueueItem[]>([]);
  const queryClient = useQueryClient();
  
  // Load queue count on mount
  useEffect(() => {
    loadQueueCount();
  }, []);
  
  // Process queue on app resume
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        processQueue();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  const loadQueueCount = useCallback(async () => {
    const count = await getRetryQueueCount();
    setQueueCount(count);
    
    const failed = await getFailedItems();
    setFailedItems(failed);
  }, []);
  
  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const results = await processRetryQueue();
      
      if (results.succeeded > 0) {
        // Invalidate entries to refresh UI
        queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
      }
      
      await loadQueueCount();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, queryClient, loadQueueCount]);
  
  const retrySpecificEntry = useCallback(async (entryId: string) => {
    setIsProcessing(true);
    
    try {
      const result = await retryEntry(entryId);
      
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: entryKeys.lists() });
      }
      
      await loadQueueCount();
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [queryClient, loadQueueCount]);
  
  const clearQueue = useCallback(async () => {
    await clearRetryQueue();
    await loadQueueCount();
  }, [loadQueueCount]);
  
  return {
    queueCount,
    isProcessing,
    failedItems,
    processQueue,
    retryEntry: retrySpecificEntry,
    clearQueue,
    refresh: loadQueueCount,
  };
}

// ============================================
// AUTO RETRY ON MOUNT
// ============================================

export function useAutoRetry() {
  const { processQueue } = useRetryQueue();
  
  useEffect(() => {
    // Process queue on initial mount
    processQueue();
  }, []);
}
