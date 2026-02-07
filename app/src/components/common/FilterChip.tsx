import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function FilterChip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
}: FilterChipProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#92400E' : '#6B7280'}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {onRemove && selected && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="close" size={14} color="#92400E" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ============================================
// FILTER CHIP GROUP
// ============================================

interface FilterChipOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface FilterChipGroupProps {
  options: FilterChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
}

export function FilterChipGroup({
  options,
  selected,
  onChange,
  multiSelect = true,
}: FilterChipGroupProps): JSX.Element {
  const handlePress = (value: string) => {
    if (multiSelect) {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      if (selected.includes(value)) {
        onChange([]);
      } else {
        onChange([value]);
      }
    }
  };
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.groupContainer}
    >
      {options.map((option) => (
        <FilterChip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={selected.includes(option.value)}
          onPress={() => handlePress(option.value)}
        />
      ))}
    </ScrollView>
  );
}

// ============================================
// QUICK FILTER BAR
// ============================================

interface QuickFilterBarProps {
  onFavorites: () => void;
  onRepeatBuy: () => void;
  onHighRated: () => void;
  onNearMe: () => void;
  activeFavorites?: boolean;
  activeRepeatBuy?: boolean;
  activeHighRated?: boolean;
  activeNearMe?: boolean;
}

export function QuickFilterBar({
  onFavorites,
  onRepeatBuy,
  onHighRated,
  onNearMe,
  activeFavorites,
  activeRepeatBuy,
  activeHighRated,
  activeNearMe,
}: QuickFilterBarProps): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickFilterContainer}
    >
      <FilterChip
        label="Favorites"
        icon="heart"
        selected={activeFavorites}
        onPress={onFavorites}
      />
      <FilterChip
        label="Repeat Buy"
        icon="refresh"
        selected={activeRepeatBuy}
        onPress={onRepeatBuy}
      />
      <FilterChip
        label="4+ Stars"
        icon="star"
        selected={activeHighRated}
        onPress={onHighRated}
      />
      <FilterChip
        label="Near Me"
        icon="location"
        selected={activeNearMe}
        onPress={onNearMe}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#FEF3C7',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  labelSelected: {
    color: '#92400E',
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 4,
    padding: 2,
  },
  groupContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
