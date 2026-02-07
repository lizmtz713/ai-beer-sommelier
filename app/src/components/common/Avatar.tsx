import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function Avatar({
  uri,
  name,
  size = 'medium',
  style,
}: AvatarProps): JSX.Element {
  const sizeValue = size === 'small' ? 32 : size === 'medium' ? 40 : 56;
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';
  
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          style,
        ]}
      />
    );
  }
  
  return (
    <View
      style={[
        styles.placeholder,
        { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E5E7EB',
  },
  placeholder: {
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#92400E',
    fontWeight: '600',
  },
});
