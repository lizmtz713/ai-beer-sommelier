import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Filter, FilterSchema } from '@/types';
import { STORAGE_KEYS } from '@/config/constants';

// ============================================
// DEFAULT FILTER
// ============================================

const DEFAULT_FILTER: Filter = {
  sortBy: 'consumedAt',
  sortOrder: 'desc',
};

// ============================================
// SAVED FILTERS
// ============================================

interface SavedFilter {
  id: string;
  name: string;
  filter: Filter;
}

// ============================================
// FILTERS HOOK
// ============================================

export function useFilters(initialFilter?: Partial<Filter>) {
  const [filter, setFilter] = useState<Filter>({
    ...DEFAULT_FILTER,
    ...initialFilter,
  });
  
  const updateFilter = useCallback((updates: Partial<Filter>) => {
    setFilter((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);
  
  const resetFilter = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);
  
  const clearFilter = useCallback((key: keyof Filter) => {
    setFilter((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);
  
  // Quick filter presets
  const setFavoritesFilter = useCallback(() => {
    setFilter({
      ...DEFAULT_FILTER,
      favorite: true,
    });
  }, []);
  
  const setRepeatBuyFilter = useCallback(() => {
    setFilter({
      ...DEFAULT_FILTER,
      repeatBuy: true,
    });
  }, []);
  
  const setWishlistFilter = useCallback(() => {
    setFilter({
      ...DEFAULT_FILTER,
      wishlist: true,
    });
  }, []);
  
  const setHighRatedFilter = useCallback(() => {
    setFilter({
      ...DEFAULT_FILTER,
      minRating: 4,
    });
  }, []);
  
  const setStyleFilter = useCallback((style: string) => {
    setFilter({
      ...DEFAULT_FILTER,
      styles: [style],
    });
  }, []);
  
  // Check if any filters are active
  const hasActiveFilters = 
    filter.searchQuery ||
    filter.styles?.length ||
    filter.minRating !== undefined ||
    filter.maxRating !== undefined ||
    filter.favorite !== undefined ||
    filter.repeatBuy !== undefined ||
    filter.wishlist !== undefined ||
    filter.dateFrom ||
    filter.dateTo ||
    filter.city ||
    filter.nearMe;
  
  return {
    filter,
    setFilter,
    updateFilter,
    resetFilter,
    clearFilter,
    setFavoritesFilter,
    setRepeatBuyFilter,
    setWishlistFilter,
    setHighRatedFilter,
    setStyleFilter,
    hasActiveFilters,
  };
}

// ============================================
// SAVED FILTERS HOOK
// ============================================

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved filters on mount
  useEffect(() => {
    loadSavedFilters();
  }, []);
  
  const loadSavedFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_FILTERS);
      if (data) {
        const parsed = JSON.parse(data);
        setSavedFilters(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const saveFilter = useCallback(async (name: string, filter: Filter) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filter,
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_FILTERS, JSON.stringify(updated));
    
    return newFilter;
  }, [savedFilters]);
  
  const deleteFilter = useCallback(async (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_FILTERS, JSON.stringify(updated));
  }, [savedFilters]);
  
  const updateSavedFilter = useCallback(async (id: string, updates: Partial<SavedFilter>) => {
    const updated = savedFilters.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    setSavedFilters(updated);
    
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_FILTERS, JSON.stringify(updated));
  }, [savedFilters]);
  
  return {
    savedFilters,
    isLoading,
    saveFilter,
    deleteFilter,
    updateSavedFilter,
    refresh: loadSavedFilters,
  };
}

// ============================================
// SEARCH HOOK
// ============================================

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);
  
  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    clearSearch,
    isSearching: searchQuery.length > 0,
  };
}
