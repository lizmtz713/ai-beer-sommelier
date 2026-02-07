import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
  showValue?: boolean;
  maxStars?: number;
}

export function Rating({
  value,
  onChange,
  size = 'medium',
  readonly = false,
  showValue = false,
  maxStars = 5,
}: RatingProps): JSX.Element {
  const starSize = size === 'small' ? 16 : size === 'medium' ? 24 : 32;
  
  const handlePress = (index: number) => {
    if (readonly || !onChange) return;
    
    // Allow half stars by tapping on the same star
    const newValue = index + 1;
    if (value === newValue) {
      onChange(newValue - 0.5);
    } else if (value === newValue - 0.5) {
      onChange(newValue - 1);
    } else {
      onChange(newValue);
    }
  };
  
  const renderStar = (index: number) => {
    const filled = value >= index + 1;
    const halfFilled = !filled && value >= index + 0.5;
    
    const iconName = filled
      ? 'star'
      : halfFilled
      ? 'star-half'
      : 'star-outline';
    
    const StarComponent = readonly ? View : TouchableOpacity;
    
    return (
      <StarComponent
        key={index}
        onPress={() => handlePress(index)}
        style={styles.star}
      >
        <Ionicons
          name={iconName}
          size={starSize}
          color="#F59E0B"
        />
      </StarComponent>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
      </View>
      {showValue && (
        <Text style={[styles.value, styles[`${size}Value`]]}>
          {value.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

// ============================================
// COMPACT RATING DISPLAY
// ============================================

interface RatingDisplayProps {
  value: number;
  size?: 'small' | 'medium' | 'large';
}

export function RatingDisplay({ value, size = 'medium' }: RatingDisplayProps): JSX.Element {
  const starSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 18;
  
  return (
    <View style={styles.displayContainer}>
      <Ionicons name="star" size={starSize} color="#F59E0B" />
      <Text style={[styles.displayValue, { fontSize }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginHorizontal: 2,
  },
  value: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#374151',
  },
  smallValue: {
    fontSize: 12,
  },
  mediumValue: {
    fontSize: 16,
  },
  largeValue: {
    fontSize: 20,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayValue: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#374151',
  },
});
