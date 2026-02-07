import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { EntryDoc } from '@/types';
import { RatingDisplay } from '@/components/common/Rating';
import { Badge, StatusBadge } from '@/components/common/Badge';

interface EntryCardProps {
  entry: EntryDoc;
  onPress: () => void;
  onRetry?: () => void;
  showStatus?: boolean;
  compact?: boolean;
}

export function EntryCard({
  entry,
  onPress,
  onRetry,
  showStatus = false,
  compact = false,
}: EntryCardProps): JSX.Element {
  const hasPhoto = entry.photoUrls && entry.photoUrls.length > 0;
  const hasError = entry.status === 'error';
  
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        {hasPhoto && (
          <Image source={{ uri: entry.photoUrls[0] }} style={styles.compactPhoto} />
        )}
        <View style={styles.compactContent}>
          <Text style={styles.compactName} numberOfLines={1}>
            {entry.name}
          </Text>
          <RatingDisplay value={entry.ratingNum} size="small" />
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={[styles.card, hasError && styles.cardError]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {hasPhoto && (
          <Image source={{ uri: entry.photoUrls[0] }} style={styles.photo} />
        )}
        
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {entry.name}
            </Text>
            {entry.favorite && (
              <Ionicons name="heart" size={16} color="#EF4444" />
            )}
          </View>
          
          {entry.brand && (
            <Text style={styles.brand} numberOfLines={1}>
              {entry.brand}
            </Text>
          )}
          
          <View style={styles.meta}>
            <RatingDisplay value={entry.ratingNum} />
            
            {entry.style && (
              <Badge variant="default" size="small" style={styles.styleBadge}>
                {entry.style}
              </Badge>
            )}
          </View>
          
          <View style={styles.footer}>
            <View style={styles.location}>
              {entry.location?.city && (
                <>
                  <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                  <Text style={styles.locationText}>{entry.location.city}</Text>
                </>
              )}
            </View>
            
            <Text style={styles.date}>
              {format(entry.consumedAt, 'MMM d, yyyy')}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Status indicators */}
      {showStatus && entry.status !== 'complete' && (
        <View style={styles.statusBar}>
          <StatusBadge status={entry.status} />
          {hasError && onRetry && (
            <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
              <Ionicons name="refresh" size={16} color="#F59E0B" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Quick icons */}
      <View style={styles.quickIcons}>
        {entry.repeatBuy && (
          <Ionicons name="refresh" size={14} color="#10B981" style={styles.quickIcon} />
        )}
        {entry.wishlist && (
          <Ionicons name="bookmark" size={14} color="#6366F1" style={styles.quickIcon} />
        )}
        {entry.sharePublic && (
          <Ionicons name="globe-outline" size={14} color="#9CA3AF" style={styles.quickIcon} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// ENTRY LIST ITEM (simplified for lists)
// ============================================

interface EntryListItemProps {
  entry: EntryDoc;
  onPress: () => void;
  showDistance?: boolean;
  distance?: number;
}

export function EntryListItem({
  entry,
  onPress,
  showDistance = false,
  distance,
}: EntryListItemProps): JSX.Element {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listLeft}>
        <Text style={styles.listName} numberOfLines={1}>
          {entry.name}
        </Text>
        <View style={styles.listMeta}>
          <RatingDisplay value={entry.ratingNum} size="small" />
          {entry.style && <Text style={styles.listStyle}> · {entry.style}</Text>}
        </View>
      </View>
      
      <View style={styles.listRight}>
        {showDistance && distance !== undefined && (
          <Text style={styles.listDistance}>
            {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardError: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  brand: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  styleBadge: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
  quickIcons: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
  },
  quickIcon: {
    marginLeft: 4,
  },
  
  // Compact styles
  compactCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  compactPhoto: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  compactContent: {
    padding: 8,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  
  // List item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  listLeft: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  listStyle: {
    fontSize: 12,
    color: '#6B7280',
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
});
