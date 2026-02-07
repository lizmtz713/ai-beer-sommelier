import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = 'default',
  size = 'medium',
  style,
}: BadgeProps): JSX.Element {
  return (
    <View style={[styles.badge, styles[variant], styles[`${size}Size`], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
        {children}
      </Text>
    </View>
  );
}

// ============================================
// STATUS BADGE (for entry status)
// ============================================

interface StatusBadgeProps {
  status: 'draft' | 'uploading' | 'complete' | 'error';
}

export function StatusBadge({ status }: StatusBadgeProps): JSX.Element {
  const variantMap: Record<string, BadgeProps['variant']> = {
    draft: 'default',
    uploading: 'info',
    complete: 'success',
    error: 'error',
  };
  
  const labelMap: Record<string, string> = {
    draft: 'Draft',
    uploading: 'Uploading...',
    complete: 'Complete',
    error: 'Error',
  };
  
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  
  // Variants
  default: {
    backgroundColor: '#F3F4F6',
  },
  primary: {
    backgroundColor: '#FEF3C7',
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  info: {
    backgroundColor: '#DBEAFE',
  },
  
  // Sizes
  smallSize: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediumSize: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  
  // Text
  text: {
    fontWeight: '500',
  },
  defaultText: {
    color: '#4B5563',
  },
  primaryText: {
    color: '#92400E',
  },
  successText: {
    color: '#065F46',
  },
  warningText: {
    color: '#92400E',
  },
  errorText: {
    color: '#991B1B',
  },
  infoText: {
    color: '#1E40AF',
  },
  
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
});
