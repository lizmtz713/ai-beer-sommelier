import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { MultiSelect, Select } from '@/components/common/Select';
import { Toggle } from '@/components/common/Toggle';
import { Rating } from '@/components/common/Rating';
import { Filter } from '@/types';
import { BEER_STYLES, GEO_CONFIG } from '@/config/constants';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filter: Filter;
  onApply: (filter: Filter) => void;
  onReset: () => void;
  showNearMe?: boolean;
}

export function FilterSheet({
  visible,
  onClose,
  filter,
  onApply,
  onReset,
  showNearMe = true,
}: FilterSheetProps): JSX.Element {
  const [localFilter, setLocalFilter] = useState<Filter>(filter);
  
  // Reset local filter when sheet opens
  React.useEffect(() => {
    if (visible) {
      setLocalFilter(filter);
    }
  }, [visible, filter]);
  
  const updateFilter = (updates: Partial<Filter>) => {
    setLocalFilter((prev) => ({ ...prev, ...updates }));
  };
  
  const handleApply = () => {
    onApply(localFilter);
    onClose();
  };
  
  const handleReset = () => {
    onReset();
    onClose();
  };
  
  const styleOptions = BEER_STYLES.map((s) => ({ value: s, label: s }));
  const radiusOptions = GEO_CONFIG.RADIUS_OPTIONS.map((r) => ({
    value: r.toString(),
    label: `${r} km`,
  }));
  
  const sortOptions = [
    { value: 'consumedAt', label: 'Date' },
    { value: 'ratingNum', label: 'Rating' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
  ];
  
  const sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View style={styles.section}>
              <Input
                label="Search"
                value={localFilter.searchQuery || ''}
                onChangeText={(text) => updateFilter({ searchQuery: text })}
                placeholder="Search by name, brand, or style"
                leftIcon={<Ionicons name="search" size={20} color="#9CA3AF" />}
              />
            </View>
            
            {/* Rating Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingContainer}>
                <Rating
                  value={localFilter.minRating || 0}
                  onChange={(value) => updateFilter({ minRating: value })}
                  size="medium"
                  showValue
                />
              </View>
            </View>
            
            {/* Style */}
            <View style={styles.section}>
              <MultiSelect
                label="Beer Styles"
                values={localFilter.styles || []}
                options={styleOptions}
                onChange={(styles) => updateFilter({ styles })}
                placeholder="Select styles"
                maxSelected={10}
              />
            </View>
            
            {/* Quick Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Filters</Text>
              <Toggle
                label="Favorites Only"
                value={localFilter.favorite || false}
                onValueChange={(favorite) => updateFilter({ favorite })}
                icon="heart"
              />
              <Toggle
                label="Repeat Buys Only"
                value={localFilter.repeatBuy || false}
                onValueChange={(repeatBuy) => updateFilter({ repeatBuy })}
                icon="refresh"
              />
              <Toggle
                label="Wishlist Only"
                value={localFilter.wishlist || false}
                onValueChange={(wishlist) => updateFilter({ wishlist })}
                icon="bookmark"
              />
            </View>
            
            {/* Near Me */}
            {showNearMe && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Toggle
                  label="Near Me"
                  description="Show entries within radius"
                  value={localFilter.nearMe || false}
                  onValueChange={(nearMe) => updateFilter({ nearMe })}
                  icon="location"
                />
                {localFilter.nearMe && (
                  <Select
                    label="Radius"
                    value={localFilter.radiusKm?.toString() || GEO_CONFIG.DEFAULT_RADIUS_KM.toString()}
                    options={radiusOptions}
                    onChange={(value) => updateFilter({ radiusKm: parseInt(value, 10) })}
                  />
                )}
              </View>
            )}
            
            {/* City */}
            <View style={styles.section}>
              <Input
                label="City"
                value={localFilter.city || ''}
                onChangeText={(city) => updateFilter({ city })}
                placeholder="Filter by city"
              />
            </View>
            
            {/* Sort */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort</Text>
              <View style={styles.sortRow}>
                <View style={styles.sortField}>
                  <Select
                    label="Sort By"
                    value={localFilter.sortBy || 'consumedAt'}
                    options={sortOptions}
                    onChange={(value) => updateFilter({ sortBy: value as Filter['sortBy'] })}
                  />
                </View>
                <View style={styles.sortField}>
                  <Select
                    label="Order"
                    value={localFilter.sortOrder || 'desc'}
                    options={sortOrderOptions}
                    onChange={(value) => updateFilter({ sortOrder: value as Filter['sortOrder'] })}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Apply Button */}
          <View style={styles.footer}>
            <Button
              title="Apply Filters"
              onPress={handleApply}
              size="large"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  resetText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'flex-start',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sortField: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
