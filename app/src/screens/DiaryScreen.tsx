import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { QuickFilterBar } from '@/components/common/FilterChip';
import { EntryCard } from '@/components/entry/EntryCard';
import { FilterSheet } from '@/components/entry/FilterSheet';

import { useAllEntries, useRetryEntry } from '@/hooks/useEntries';
import { useFilters, useSearch } from '@/hooks/useFilters';
import { useRetryQueue, useAutoRetry } from '@/hooks/useRetryQueue';
import { EntryDoc } from '@/types';

export function DiaryScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const { filter, setFilter, resetFilter, hasActiveFilters } = useFilters();
  const { searchQuery, setSearchQuery, debouncedQuery, clearSearch } = useSearch();
  const [showFilters, setShowFilters] = useState(false);
  
  // Apply search to filters
  const activeFilter = { ...filter, searchQuery: debouncedQuery || undefined };
  
  const {
    entries,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAllEntries(activeFilter);
  
  const { queueCount } = useRetryQueue();
  const retryMutation = useRetryEntry();
  
  // Initialize auto retry on mount
  useAutoRetry();
  
  const handleRefresh = useCallback(() => {
    // React Query will handle refresh
  }, []);
  
  const handleEntryPress = (entry: EntryDoc) => {
    navigation.navigate('EntryDetail' as never, { entryId: entry.id } as never);
  };
  
  const handleRetry = async (entryId: string) => {
    await retryMutation.mutateAsync(entryId);
  };
  
  const handleAddEntry = () => {
    navigation.navigate('AddEntry' as never);
  };
  
  const handleQuickLog = () => {
    navigation.navigate('QuickLog' as never);
  };
  
  const renderEntry = ({ item }: { item: EntryDoc }) => (
    <EntryCard
      entry={item}
      onPress={() => handleEntryPress(item)}
      onRetry={item.status === 'error' ? () => handleRetry(item.id) : undefined}
      showStatus={item.status !== 'complete'}
    />
  );
  
  const renderHeader = () => (
    <View>
      <ScreenHeader
        title="Beer Diary"
        subtitle={`${entries.length} entries`}
        rightComponent={
          <View style={styles.headerActions}>
            {queueCount > 0 && (
              <TouchableOpacity style={styles.queueBadge}>
                <Ionicons name="cloud-upload-outline" size={20} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search beers..."
          leftIcon={<Ionicons name="search" size={20} color="#9CA3AF" />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={styles.searchInput}
        />
        
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={hasActiveFilters ? '#FFFFFF' : '#374151'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Quick Filters */}
      <QuickFilterBar
        onFavorites={() => setFilter({ ...filter, favorite: !filter.favorite })}
        onRepeatBuy={() => setFilter({ ...filter, repeatBuy: !filter.repeatBuy })}
        onHighRated={() => setFilter({ ...filter, minRating: filter.minRating === 4 ? undefined : 4 })}
        onNearMe={() => setFilter({ ...filter, nearMe: !filter.nearMe })}
        activeFavorites={filter.favorite}
        activeRepeatBuy={filter.repeatBuy}
        activeHighRated={filter.minRating === 4}
        activeNearMe={filter.nearMe}
      />
    </View>
  );
  
  const renderEmpty = () => {
    if (isLoading) return <LoadingSpinner fullScreen />;
    if (error) return <ErrorMessage message={error.message} fullScreen />;
    
    return (
      <EmptyState
        icon="beer-outline"
        title={hasActiveFilters ? 'No matching beers' : 'No beers yet'}
        description={
          hasActiveFilters
            ? 'Try adjusting your filters'
            : 'Start logging your beer adventures!'
        }
        actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Your First Beer'}
        onAction={hasActiveFilters ? resetFilter : handleAddEntry}
      />
    );
  };
  
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return <LoadingSpinner size="small" />;
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor="#F59E0B"
          />
        }
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
      />
      
      {/* FAB */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.fabSecondary} onPress={handleQuickLog}>
          <Ionicons name="flash" size={24} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={handleAddEntry}>
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Filter Sheet */}
      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filter={filter}
        onApply={setFilter}
        onReset={resetFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueBadge: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  emptyList: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
