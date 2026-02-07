import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format, subYears, isSameDay } from 'date-fns';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface MemoryEntry {
  id: string;
  beerName: string;
  brewery?: string;
  rating: number;
  date: Date;
  location?: string;
  photoUri?: string;
  notes?: string;
  yearsAgo: number;
}

// ============================================
// MOCK DATA
// ============================================

const generateMockMemories = (): MemoryEntry[] => {
  const today = new Date();
  const memories: MemoryEntry[] = [];
  
  // Check each year back
  for (let yearsAgo = 1; yearsAgo <= 5; yearsAgo++) {
    const pastDate = subYears(today, yearsAgo);
    
    // Random chance of having an entry (40%)
    if (Math.random() > 0.6) {
      memories.push({
        id: `memory-${yearsAgo}`,
        beerName: ['Pliny the Elder', 'Heady Topper', 'Two Hearted Ale', 'Guinness Draught', 'Sierra Nevada Pale'][yearsAgo - 1],
        brewery: ['Russian River', 'The Alchemist', "Bell's Brewery", 'Guinness', 'Sierra Nevada'][yearsAgo - 1],
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        date: pastDate,
        location: ['San Francisco', 'Portland', 'Chicago', 'Dublin', 'Denver'][yearsAgo - 1],
        notes: yearsAgo === 1 ? 'First time trying this legendary beer!' : undefined,
        yearsAgo,
      });
    }
  }
  
  return memories;
};

// ============================================
// MEMORY CARD
// ============================================

interface MemoryCardProps {
  memory: MemoryEntry;
  onPress: () => void;
  onShare: () => void;
}

function MemoryCard({ memory, onPress, onShare }: MemoryCardProps): JSX.Element {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View
      style={[
        styles.memoryCard,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.memoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.memoryHeader}>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color="#DDD6FE" />
            <Text style={styles.timeText}>
              {memory.yearsAgo} year{memory.yearsAgo > 1 ? 's' : ''} ago today
            </Text>
          </View>
          <TouchableOpacity onPress={onShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Text style={styles.memoryTitle}>On This Day</Text>
          <Text style={styles.memoryBeer}>{memory.beerName}</Text>
          {memory.brewery && (
            <Text style={styles.memoryBrewery}>{memory.brewery}</Text>
          )}
          
          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= memory.rating ? 'star' : 'star-outline'}
                size={20}
                color="#FDE68A"
              />
            ))}
          </View>
          
          {/* Location */}
          {memory.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#DDD6FE" />
              <Text style={styles.locationText}>{memory.location}</Text>
            </View>
          )}
          
          {/* Notes */}
          {memory.notes && (
            <Text style={styles.memoryNotes}>"{memory.notes}"</Text>
          )}
        </TouchableOpacity>
        
        {/* Date */}
        <Text style={styles.memoryDate}>
          {format(memory.date, 'MMMM d, yyyy')}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface OnThisDayProps {
  onViewEntry?: (entryId: string) => void;
  onShare?: (memory: MemoryEntry) => void;
}

export function OnThisDay({ onViewEntry, onShare }: OnThisDayProps): JSX.Element | null {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    const mockMemories = generateMockMemories();
    setMemories(mockMemories);
  }, []);
  
  if (memories.length === 0 || dismissed) {
    return null;
  }
  
  const currentMemory = memories[currentIndex];
  
  const handleNext = () => {
    Haptics.selectionAsync();
    if (currentIndex < memories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setDismissed(true);
    }
  };
  
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDismissed(true);
  };
  
  return (
    <View style={styles.container}>
      <MemoryCard
        memory={currentMemory}
        onPress={() => onViewEntry?.(currentMemory.id)}
        onShare={() => onShare?.(currentMemory)}
      />
      
      {/* Navigation dots */}
      {memories.length > 1 && (
        <View style={styles.dotsRow}>
          {memories.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
      
      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
        
        {memories.length > 1 && currentIndex < memories.length - 1 && (
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>More memories</Text>
            <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  memoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  memoryGradient: {
    padding: 20,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#DDD6FE',
    fontWeight: '500',
  },
  shareButton: {
    padding: 4,
  },
  memoryTitle: {
    fontSize: 14,
    color: '#DDD6FE',
    fontWeight: '500',
    marginBottom: 4,
  },
  memoryBeer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  memoryBrewery: {
    fontSize: 16,
    color: '#DDD6FE',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#DDD6FE',
  },
  memoryNotes: {
    fontSize: 14,
    color: '#FFF',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  memoryDate: {
    fontSize: 12,
    color: '#C4B5FD',
    marginTop: 16,
    textAlign: 'right',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#8B5CF6',
    width: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dismissText: {
    fontSize: 14,
    color: '#6B7280',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nextText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});
