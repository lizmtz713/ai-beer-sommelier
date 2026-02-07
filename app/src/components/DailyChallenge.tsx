import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format, isToday, differenceInHours } from 'date-fns';

// ============================================
// CHALLENGE TYPES
// ============================================

interface Challenge {
  id: string;
  type: 'style' | 'action' | 'social' | 'explore';
  title: string;
  description: string;
  emoji: string;
  reward: number; // points
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: Date;
  progress?: {
    current: number;
    target: number;
  };
  completed?: boolean;
}

// ============================================
// CHALLENGE POOL
// ============================================

const CHALLENGE_POOL: Omit<Challenge, 'id' | 'expiresAt'>[] = [
  // Style challenges
  {
    type: 'style',
    title: 'Lager Day',
    description: 'Log any lager style beer today',
    emoji: '🧊',
    reward: 15,
    difficulty: 'easy',
  },
  {
    type: 'style',
    title: 'Hop Head',
    description: 'Try an IPA or Pale Ale',
    emoji: '🌿',
    reward: 15,
    difficulty: 'easy',
  },
  {
    type: 'style',
    title: 'Dark Side',
    description: 'Log a stout or porter',
    emoji: '🌑',
    reward: 20,
    difficulty: 'medium',
  },
  {
    type: 'style',
    title: 'Wheat Explorer',
    description: 'Try a hefeweizen or witbier',
    emoji: '🌾',
    reward: 20,
    difficulty: 'medium',
  },
  {
    type: 'style',
    title: 'Sour Power',
    description: 'Log any sour or wild ale',
    emoji: '🍋',
    reward: 25,
    difficulty: 'hard',
  },
  {
    type: 'style',
    title: 'Belgian Beauty',
    description: 'Try a Belgian-style beer',
    emoji: '🇧🇪',
    reward: 25,
    difficulty: 'hard',
  },
  
  // Action challenges
  {
    type: 'action',
    title: 'Shutterfly',
    description: 'Add a photo to your entry',
    emoji: '📸',
    reward: 10,
    difficulty: 'easy',
  },
  {
    type: 'action',
    title: 'Wordsmith',
    description: 'Write tasting notes for a beer',
    emoji: '✍️',
    reward: 15,
    difficulty: 'easy',
  },
  {
    type: 'action',
    title: 'Location Scout',
    description: 'Log a beer with location enabled',
    emoji: '📍',
    reward: 15,
    difficulty: 'easy',
  },
  {
    type: 'action',
    title: 'Perfect Score',
    description: 'Rate a beer 5 stars',
    emoji: '⭐',
    reward: 20,
    difficulty: 'medium',
  },
  {
    type: 'action',
    title: 'Double Down',
    description: 'Log 2 different beers today',
    emoji: '✌️',
    reward: 25,
    difficulty: 'medium',
    progress: { current: 0, target: 2 },
  },
  
  // Social challenges
  {
    type: 'social',
    title: 'Share the Love',
    description: 'Share a beer card on social media',
    emoji: '💝',
    reward: 20,
    difficulty: 'medium',
  },
  {
    type: 'social',
    title: 'Wishful Thinking',
    description: 'Add a beer to your wishlist',
    emoji: '🌠',
    reward: 10,
    difficulty: 'easy',
  },
  
  // Explore challenges
  {
    type: 'explore',
    title: 'New Discovery',
    description: 'Try a style you\'ve never logged',
    emoji: '🔍',
    reward: 30,
    difficulty: 'hard',
  },
  {
    type: 'explore',
    title: 'Brewery Hopper',
    description: 'Try a beer from a new brewery',
    emoji: '🏭',
    reward: 25,
    difficulty: 'medium',
  },
  {
    type: 'explore',
    title: 'Ask the Expert',
    description: 'Get a recommendation from AI Sommelier',
    emoji: '🧠',
    reward: 15,
    difficulty: 'easy',
  },
];

// Generate today's challenges
const getDailyChallenges = (): Challenge[] => {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Use seed to deterministically pick challenges
  const shuffled = [...CHALLENGE_POOL].sort((a, b) => {
    return ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
  });
  
  const selected = shuffled.slice(0, 3);
  
  const midnight = new Date(today);
  midnight.setHours(23, 59, 59, 999);
  
  return selected.map((challenge, i) => ({
    ...challenge,
    id: `${format(today, 'yyyy-MM-dd')}-${i}`,
    expiresAt: midnight,
    completed: false,
  }));
};

// ============================================
// TIME REMAINING
// ============================================

function TimeRemaining({ expiresAt }: { expiresAt: Date }): JSX.Element {
  const [hours, setHours] = useState(differenceInHours(expiresAt, new Date()));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHours(differenceInHours(expiresAt, new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return (
    <View style={styles.timeRemaining}>
      <Ionicons name="time-outline" size={12} color="#6B7280" />
      <Text style={styles.timeText}>{hours}h left</Text>
    </View>
  );
}

// ============================================
// CHALLENGE CARD
// ============================================

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: () => void;
}

function ChallengeCard({ challenge, onPress }: ChallengeCardProps): JSX.Element {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (challenge.progress) {
      Animated.spring(progressAnim, {
        toValue: (challenge.progress.current / challenge.progress.target) * 100,
        useNativeDriver: false,
      }).start();
    }
  }, [challenge.progress]);
  
  const getDifficultyColor = (difficulty: Challenge['difficulty']): string => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.challengeCard, challenge.completed && styles.challengeCardCompleted]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
      disabled={challenge.completed}
    >
      {/* Emoji */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{challenge.emoji}</Text>
        {challenge.completed && (
          <View style={styles.checkOverlay}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </View>
      
      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, challenge.completed && styles.textCompleted]}>
            {challenge.title}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(challenge.difficulty) }]}>
              {challenge.difficulty}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.cardDescription, challenge.completed && styles.textCompleted]}>
          {challenge.description}
        </Text>
        
        {/* Progress bar */}
        {challenge.progress && !challenge.completed && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
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
            <Text style={styles.progressText}>
              {challenge.progress.current}/{challenge.progress.target}
            </Text>
          </View>
        )}
      </View>
      
      {/* Reward */}
      <View style={styles.rewardContainer}>
        <Text style={styles.rewardValue}>+{challenge.reward}</Text>
        <Text style={styles.rewardLabel}>pts</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface DailyChallengeProps {
  onChallengePress?: (challenge: Challenge) => void;
}

export function DailyChallenge({ onChallengePress }: DailyChallengeProps): JSX.Element {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [expanded, setExpanded] = useState(true);
  
  useEffect(() => {
    setChallenges(getDailyChallenges());
  }, []);
  
  const completedCount = challenges.filter(c => c.completed).length;
  const totalReward = challenges.reduce((sum, c) => sum + c.reward, 0);
  const earnedReward = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.reward, 0);
  
  if (challenges.length === 0) return <View />;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded(!expanded);
        }}
      >
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.headerIcon}
          >
            <Ionicons name="trophy" size={18} color="#FFF" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Daily Challenges</Text>
            <Text style={styles.headerSubtitle}>
              {completedCount}/{challenges.length} complete • {earnedReward}/{totalReward} pts
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {challenges.length > 0 && (
            <TimeRemaining expiresAt={challenges[0].expiresAt} />
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </View>
      </TouchableOpacity>
      
      {/* Challenges */}
      {expanded && (
        <View style={styles.challengesList}>
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onPress={() => onChallengePress?.(challenge)}
            />
          ))}
          
          {/* Bonus hint */}
          {completedCount === challenges.length ? (
            <View style={styles.allCompleteCard}>
              <Text style={styles.allCompleteEmoji}>🎉</Text>
              <Text style={styles.allCompleteText}>
                All challenges complete! Come back tomorrow for more.
              </Text>
            </View>
          ) : (
            <Text style={styles.hintText}>
              Complete challenges to earn points and level up!
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeRemaining: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  challengesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  challengeCardCompleted: {
    backgroundColor: '#D1FAE5',
  },
  emojiContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  emoji: {
    fontSize: 22,
  },
  checkOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  textCompleted: {
    color: '#065F46',
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  rewardContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  rewardLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  allCompleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  allCompleteEmoji: {
    fontSize: 24,
  },
  allCompleteText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
