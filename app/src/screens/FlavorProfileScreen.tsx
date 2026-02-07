import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import {
  FLAVOR_DIMENSIONS,
  STYLE_PROFILES,
  UserTasteProfile,
  createDefaultProfile,
  getRecommendations,
  FlavorDimension,
  StyleFlavorProfile,
} from '@/data/flavorProfile';

const { width } = Dimensions.get('window');

// ============================================
// FLAVOR BAR
// ============================================

interface FlavorBarProps {
  dimension: FlavorDimension;
  value: number;
  confidence: number;
  animatedValue?: Animated.Value;
}

function FlavorBar({ dimension, value, confidence }: FlavorBarProps): JSX.Element {
  const animWidth = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.spring(animWidth, {
      toValue: (value / 5) * 100,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [value]);
  
  const getBarColor = (val: number): string => {
    if (val <= 2) return '#10B981';
    if (val <= 3.5) return '#F59E0B';
    return '#EF4444';
  };
  
  return (
    <View style={styles.flavorRow}>
      <View style={styles.flavorHeader}>
        <Text style={styles.flavorEmoji}>{dimension.emoji}</Text>
        <Text style={styles.flavorName}>{dimension.name}</Text>
        {confidence < 5 && (
          <View style={styles.lowConfidenceBadge}>
            <Text style={styles.lowConfidenceText}>Learning</Text>
          </View>
        )}
      </View>
      
      <View style={styles.flavorBarContainer}>
        <Text style={styles.flavorLabel}>{dimension.lowLabel}</Text>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: animWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getBarColor(value),
              },
            ]}
          />
          <View style={[styles.barMarker, { left: `${(value / 5) * 100 - 2}%` }]} />
        </View>
        <Text style={styles.flavorLabel}>{dimension.highLabel}</Text>
      </View>
      
      <Text style={styles.flavorDescription}>{dimension.description}</Text>
    </View>
  );
}

// ============================================
// RECOMMENDATION CARD
// ============================================

interface RecommendationCardProps {
  style: StyleFlavorProfile;
  matchScore: number;
  onPress: () => void;
}

function RecommendationCard({ style, matchScore, onPress }: RecommendationCardProps): JSX.Element {
  const getMatchColor = (score: number): string[] => {
    if (score >= 80) return ['#10B981', '#059669'];
    if (score >= 60) return ['#F59E0B', '#D97706'];
    return ['#6B7280', '#4B5563'];
  };
  
  return (
    <TouchableOpacity
      style={styles.recCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getMatchColor(matchScore)}
        style={styles.matchBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.matchScore}>{Math.round(matchScore)}%</Text>
        <Text style={styles.matchLabel}>match</Text>
      </LinearGradient>
      
      <View style={styles.recInfo}>
        <Text style={styles.recStyleName}>{style.styleName}</Text>
        <Text style={styles.recCategory}>{style.category}</Text>
        <Text style={styles.recDescription} numberOfLines={2}>
          {style.description}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

// ============================================
// STYLE DETAIL MODAL
// ============================================

interface StyleDetailProps {
  style: StyleFlavorProfile;
  onClose: () => void;
}

function StyleDetail({ style, onClose }: StyleDetailProps): JSX.Element {
  return (
    <View style={styles.detailOverlay}>
      <TouchableOpacity style={styles.detailBackdrop} onPress={onClose} />
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.detailTitle}>{style.styleName}</Text>
            <Text style={styles.detailCategory}>{style.category} • ~{style.avgAbv}% ABV</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.detailDescription}>{style.description}</Text>
        
        <View style={styles.flavorGrid}>
          {FLAVOR_DIMENSIONS.map(dim => (
            <View key={dim.id} style={styles.flavorGridItem}>
              <Text style={styles.gridEmoji}>{dim.emoji}</Text>
              <Text style={styles.gridName}>{dim.name}</Text>
              <View style={styles.gridBarTrack}>
                <View
                  style={[
                    styles.gridBarFill,
                    { width: `${(style[dim.id as keyof StyleFlavorProfile] as number / 5) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.gridValue}>{style[dim.id as keyof StyleFlavorProfile]}/5</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.addToWishlistBtn}>
          <Ionicons name="bookmark-outline" size={20} color="#F59E0B" />
          <Text style={styles.addToWishlistText}>Add to Wishlist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FlavorProfileScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Mock user profile - would come from Firebase
  const [profile, setProfile] = useState<UserTasteProfile>({
    ...createDefaultProfile('user123'),
    preferences: {
      bitterness: 3.8,
      sweetness: 2.5,
      roast: 2.0,
      fruit: 4.2,
      spice: 2.8,
      body: 3.0,
      sour: 1.5,
    },
    confidence: {
      bitterness: 12,
      sweetness: 10,
      roast: 8,
      fruit: 15,
      spice: 6,
      body: 11,
      sour: 4,
    },
    totalRatings: 45,
  });
  
  const [selectedStyle, setSelectedStyle] = useState<StyleFlavorProfile | null>(null);
  
  const recommendations = getRecommendations(profile, 8);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Your Taste Profile"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Summary */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>🍺 Your Palate</Text>
            <Text style={styles.summaryText}>
              Based on {profile.totalRatings} ratings, you tend to enjoy{' '}
              <Text style={styles.summaryHighlight}>
                {profile.preferences.fruit > 3.5 ? 'fruity, ' : ''}
                {profile.preferences.bitterness > 3 ? 'hoppy ' : 'balanced '}
                beers
              </Text>
              {profile.preferences.sour < 2 && ' and avoid sours'}.
            </Text>
          </View>
        </LinearGradient>
        
        {/* Flavor Dimensions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Your Flavor Preferences</Text>
          <Text style={styles.sectionSubtitle}>
            We learn from every beer you rate
          </Text>
          
          {FLAVOR_DIMENSIONS.map(dim => (
            <FlavorBar
              key={dim.id}
              dimension={dim}
              value={profile.preferences[dim.id as keyof typeof profile.preferences]}
              confidence={profile.confidence[dim.id as keyof typeof profile.confidence]}
            />
          ))}
        </Card>
        
        {/* Recommendations */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Styles You'll Love</Text>
          <Text style={styles.sectionSubtitle}>
            Based on your taste profile
          </Text>
          
          {recommendations.map(({ style, matchScore }) => (
            <RecommendationCard
              key={style.styleId}
              style={style}
              matchScore={matchScore}
              onPress={() => setSelectedStyle(style)}
            />
          ))}
        </Card>
        
        {/* Adventurous Picks */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>🎲 Try Something New</Text>
          <Text style={styles.sectionSubtitle}>
            Step outside your comfort zone
          </Text>
          
          {recommendations.slice(-3).reverse().map(({ style, matchScore }) => (
            <RecommendationCard
              key={style.styleId}
              style={style}
              matchScore={100 - matchScore} // Show as "adventure score"
              onPress={() => setSelectedStyle(style)}
            />
          ))}
        </Card>
      </ScrollView>
      
      {/* Style Detail Modal */}
      {selectedStyle && (
        <StyleDetail style={selectedStyle} onClose={() => setSelectedStyle(null)} />
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
  },
  summaryContent: {},
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
  },
  summaryHighlight: {
    fontWeight: '700',
    color: '#FFF',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  
  // Flavor Bar
  flavorRow: {
    marginBottom: 24,
  },
  flavorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flavorEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  flavorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  lowConfidenceBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lowConfidenceText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  flavorBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  flavorLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    width: 50,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barMarker: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#374151',
  },
  flavorDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 28,
  },
  
  // Recommendation Card
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  matchBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  matchLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  recInfo: {
    flex: 1,
  },
  recStyleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  recDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  
  // Style Detail
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  detailDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  flavorGrid: {
    gap: 12,
  },
  flavorGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridEmoji: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  gridName: {
    fontSize: 14,
    color: '#374151',
    width: 80,
  },
  gridBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  gridBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  gridValue: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 30,
    textAlign: 'right',
  },
  addToWishlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    gap: 8,
  },
  addToWishlistText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
