import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import {
  ACHIEVEMENTS,
  Achievement,
  AchievementCategory,
  getAchievementsByCategory,
  getTierColor,
  getTierGradient,
  checkAchievementProgress,
  LEVELS,
  getUserLevel,
  getProgressToNextLevel,
} from '@/data/achievements';

const { width } = Dimensions.get('window');

// ============================================
// MOCK USER STATS (would come from Firebase)
// ============================================

const MOCK_USER_STATS = {
  totalBeers: 47,
  uniqueStyles: 18,
  uniqueBreweries: 32,
  uniqueCities: 8,
  uniqueCountries: 3,
  fiveStarCount: 12,
  avgRating: 3.8,
  currentStreak: 5,
  longestStreak: 12,
  photosCount: 28,
  wishlistCount: 15,
  wishlistCompletedCount: 4,
  styleCounts: {
    'IPA': 15,
    'Stout': 8,
    'Lager': 12,
    'Sour': 3,
    'Belgian': 5,
  },
};

const MOCK_UNLOCKED = [
  'first-sip',
  'getting-started',
  'first-five',
  'style-curious',
  'style-explorer',
  'local',
  'streak-3',
  'wishful',
  'dream-achieved',
  'ipa-lover',
];

// ============================================
// LEVEL PROGRESS CARD
// ============================================

interface LevelProgressProps {
  points: number;
}

function LevelProgress({ points }: LevelProgressProps): JSX.Element {
  const level = getUserLevel(points);
  const progress = getProgressToNextLevel(points);
  const nextLevel = LEVELS[level.level] || level;
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress.percentage,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [progress.percentage]);
  
  return (
    <LinearGradient
      colors={['#F59E0B', '#D97706']}
      style={styles.levelCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.levelTop}>
        <View>
          <Text style={styles.levelLabel}>Your Level</Text>
          <View style={styles.levelTitleRow}>
            <Text style={styles.levelEmoji}>{level.emoji}</Text>
            <Text style={styles.levelTitle}>{level.title}</Text>
          </View>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>Level {level.level}</Text>
          <Text style={styles.progressText}>
            {progress.current} / {progress.needed} to Level {level.level + 1}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ============================================
// ACHIEVEMENT CARD
// ============================================

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  progress: { progress: number; total: number };
  onPress: () => void;
}

function AchievementCard({ achievement, unlocked, progress, onPress }: AchievementCardProps): JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    
    onPress();
  };
  
  const progressPercent = (progress.progress / progress.total) * 100;
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.achievementCard,
          !unlocked && styles.achievementCardLocked,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Badge */}
        <View style={styles.badgeContainer}>
          {unlocked ? (
            <LinearGradient
              colors={getTierGradient(achievement.tier)}
              style={styles.badge}
            >
              <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.badge, styles.badgeLocked]}>
              <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
            </View>
          )}
          
          {/* Tier indicator */}
          <View style={[styles.tierDot, { backgroundColor: getTierColor(achievement.tier) }]} />
        </View>
        
        {/* Info */}
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, !unlocked && styles.textLocked]}>
            {achievement.name}
          </Text>
          <Text style={[styles.achievementDesc, !unlocked && styles.textLocked]}>
            {achievement.description}
          </Text>
          
          {/* Progress bar (if not unlocked) */}
          {!unlocked && (
            <View style={styles.miniProgress}>
              <View style={styles.miniProgressTrack}>
                <View
                  style={[styles.miniProgressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.miniProgressText}>
                {progress.progress}/{progress.total}
              </Text>
            </View>
          )}
        </View>
        
        {/* Points */}
        <View style={styles.pointsContainer}>
          <Text style={[styles.achievementPoints, !unlocked && styles.textLocked]}>
            +{achievement.points}
          </Text>
          {unlocked && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// CATEGORY SECTION
// ============================================

interface CategorySectionProps {
  category: AchievementCategory;
  achievements: Achievement[];
  unlockedIds: string[];
  stats: any;
  onAchievementPress: (a: Achievement) => void;
}

const CATEGORY_INFO: Record<AchievementCategory, { name: string; emoji: string }> = {
  explorer: { name: 'Explorer', emoji: '🗺️' },
  connoisseur: { name: 'Connoisseur', emoji: '🍷' },
  collector: { name: 'Collector', emoji: '📚' },
  adventurer: { name: 'Adventurer', emoji: '✈️' },
  social: { name: 'Social', emoji: '👥' },
  specialist: { name: 'Specialist', emoji: '🎯' },
  special: { name: 'Special', emoji: '✨' },
};

function CategorySection({ category, achievements, unlockedIds, stats, onAchievementPress }: CategorySectionProps): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const info = CATEGORY_INFO[category];
  const unlockedCount = achievements.filter(a => unlockedIds.includes(a.id)).length;
  
  return (
    <View style={styles.categorySection}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded(!expanded);
        }}
      >
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryEmoji}>{info.emoji}</Text>
          <Text style={styles.categoryName}>{info.name}</Text>
          <View style={styles.categoryCount}>
            <Text style={styles.categoryCountText}>
              {unlockedCount}/{achievements.length}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.achievementsList}>
          {achievements.map(achievement => {
            const unlocked = unlockedIds.includes(achievement.id);
            const progress = checkAchievementProgress(achievement, stats);
            
            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={unlocked}
                progress={progress}
                onPress={() => onAchievementPress(achievement)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AchievementsScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  // Calculate total points from unlocked achievements
  const totalPoints = ACHIEVEMENTS
    .filter(a => MOCK_UNLOCKED.includes(a.id))
    .reduce((sum, a) => sum + a.points, 0);
  
  const unlockedCount = MOCK_UNLOCKED.length;
  const totalCount = ACHIEVEMENTS.filter(a => !a.secret).length;
  
  // Get filtered achievements by category
  const categories: AchievementCategory[] = ['explorer', 'connoisseur', 'collector', 'adventurer', 'specialist', 'special'];
  
  const handleAchievementPress = (achievement: Achievement) => {
    const unlocked = MOCK_UNLOCKED.includes(achievement.id);
    const progress = checkAchievementProgress(achievement, MOCK_USER_STATS);
    
    // Could show a modal with more details
    console.log('Achievement pressed:', achievement.name, unlocked, progress);
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Achievements"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Progress */}
        <View style={styles.levelSection}>
          <LevelProgress points={totalPoints} />
        </View>
        
        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalCount - unlockedCount}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round((unlockedCount / totalCount) * 100)}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(f);
              }}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'All' : f === 'unlocked' ? '✅ Unlocked' : '🔒 Locked'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Achievement Categories */}
        {categories.map(category => {
          let achievements = getAchievementsByCategory(category);
          
          // Apply filter
          if (filter === 'unlocked') {
            achievements = achievements.filter(a => MOCK_UNLOCKED.includes(a.id));
          } else if (filter === 'locked') {
            achievements = achievements.filter(a => !MOCK_UNLOCKED.includes(a.id));
          }
          
          if (achievements.length === 0) return null;
          
          return (
            <CategorySection
              key={category}
              category={category}
              achievements={achievements}
              unlockedIds={MOCK_UNLOCKED}
              stats={MOCK_USER_STATS}
              onAchievementPress={handleAchievementPress}
            />
          );
        })}
      </ScrollView>
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
  levelSection: {
    padding: 16,
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
  },
  levelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  levelLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  levelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  pointsLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  progressSection: {},
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  
  // Filter
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  filterTabActive: {
    backgroundColor: '#FEF3C7',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  
  // Category
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryCount: {
    marginLeft: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  achievementsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  
  // Achievement Card
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  badgeContainer: {
    position: 'relative',
    marginRight: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: {
    backgroundColor: '#E5E7EB',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  tierDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  achievementDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  textLocked: {
    color: '#9CA3AF',
  },
  miniProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  miniProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 8,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  miniProgressText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  pointsContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
