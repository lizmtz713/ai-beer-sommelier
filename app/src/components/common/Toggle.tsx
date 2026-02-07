import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export function Toggle({
  label,
  value,
  onValueChange,
  description,
  icon,
  disabled = false,
}: ToggleProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.left}>
        {icon && (
          <Ionicons
            name={icon}
            size={24}
            color={value ? '#F59E0B' : '#9CA3AF'}
            style={styles.icon}
          />
        )}
        <View>
          <Text style={styles.label}>{label}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>
      
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#FDE68A' }}
        thumbColor={value ? '#F59E0B' : '#9CA3AF'}
        disabled={disabled}
      />
    </TouchableOpacity>
  );
}

// ============================================
// TOGGLE GROUP (for favorite/repeat-buy/wishlist)
// ============================================

interface ToggleOption {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  values: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}

export function ToggleGroup({
  options,
  values,
  onChange,
}: ToggleGroupProps): JSX.Element {
  return (
    <View style={styles.groupContainer}>
      {options.map((option) => {
        const isActive = values[option.key] ?? false;
        const iconName = isActive && option.activeIcon ? option.activeIcon : option.icon;
        
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.groupItem, isActive && styles.groupItemActive]}
            onPress={() => onChange(option.key, !isActive)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isActive ? '#F59E0B' : '#9CA3AF'}
            />
            <Text style={[styles.groupLabel, isActive && styles.groupLabelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  
  // Toggle Group
  groupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  groupItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  groupItemActive: {
    backgroundColor: '#FEF3C7',
  },
  groupLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  groupLabelActive: {
    color: '#92400E',
    fontWeight: '500',
  },
});
