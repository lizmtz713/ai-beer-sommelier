// Beer Diary Achievements & Gamification
// Keeps users engaged with badges, streaks, and challenges

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: AchievementType;
    value: number;
    subType?: string;
  };
  points: number;
  secret?: boolean;
}

export type AchievementCategory = 
  | 'explorer'      // Trying new things
  | 'connoisseur'   // Quality/ratings
  | 'collector'     // Volume/quantity
  | 'adventurer'    // Locations/travel
  | 'social'        // Sharing/community
  | 'specialist'    // Style mastery
  | 'special';      // Hidden/rare

export type AchievementType =
  | 'total_beers'
  | 'unique_styles'
  | 'unique_breweries'
  | 'unique_countries'
  | 'unique_cities'
  | 'five_star_ratings'
  | 'avg_rating_above'
  | 'streak_days'
  | 'style_count'
  | 'entries_shared'
  | 'photos_taken'
  | 'wishlisted'
  | 'wishlist_completed'
  | 'first_of_type';

export const ACHIEVEMENTS: Achievement[] = [
  // ============================================
  // EXPLORER - Trying new things
  // ============================================
  {
    id: 'first-sip',
    name: 'First Sip',
    description: 'Log your first beer',
    emoji: '🍺',
    category: 'explorer',
    tier: 'bronze',
    requirement: { type: 'total_beers', value: 1 },
    points: 10,
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Log 10 beers',
    emoji: '📝',
    category: 'explorer',
    tier: 'bronze',
    requirement: { type: 'total_beers', value: 10 },
    points: 25,
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Log 50 beers',
    emoji: '🎯',
    category: 'explorer',
    tier: 'silver',
    requirement: { type: 'total_beers', value: 50 },
    points: 50,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Log 100 beers',
    emoji: '💯',
    category: 'explorer',
    tier: 'gold',
    requirement: { type: 'total_beers', value: 100 },
    points: 100,
  },
  {
    id: 'beer-master',
    name: 'Beer Master',
    description: 'Log 500 beers',
    emoji: '👑',
    category: 'explorer',
    tier: 'platinum',
    requirement: { type: 'total_beers', value: 500 },
    points: 250,
  },
  
  // ============================================
  // CONNOISSEUR - Quality focused
  // ============================================
  {
    id: 'first-five',
    name: 'Perfection',
    description: 'Give your first 5-star rating',
    emoji: '⭐',
    category: 'connoisseur',
    tier: 'bronze',
    requirement: { type: 'five_star_ratings', value: 1 },
    points: 15,
  },
  {
    id: 'high-standards',
    name: 'High Standards',
    description: 'Give 10 five-star ratings',
    emoji: '🌟',
    category: 'connoisseur',
    tier: 'silver',
    requirement: { type: 'five_star_ratings', value: 10 },
    points: 50,
  },
  {
    id: 'elite-palate',
    name: 'Elite Palate',
    description: 'Maintain a 4+ average rating across 50 beers',
    emoji: '🏆',
    category: 'connoisseur',
    tier: 'gold',
    requirement: { type: 'avg_rating_above', value: 4 },
    points: 100,
  },
  {
    id: 'critic',
    name: 'The Critic',
    description: 'Give 50 five-star ratings',
    emoji: '📰',
    category: 'connoisseur',
    tier: 'platinum',
    requirement: { type: 'five_star_ratings', value: 50 },
    points: 150,
  },
  
  // ============================================
  // COLLECTOR - Style diversity
  // ============================================
  {
    id: 'style-curious',
    name: 'Style Curious',
    description: 'Try 5 different beer styles',
    emoji: '🔍',
    category: 'collector',
    tier: 'bronze',
    requirement: { type: 'unique_styles', value: 5 },
    points: 20,
  },
  {
    id: 'style-explorer',
    name: 'Style Explorer',
    description: 'Try 15 different beer styles',
    emoji: '🗺️',
    category: 'collector',
    tier: 'silver',
    requirement: { type: 'unique_styles', value: 15 },
    points: 50,
  },
  {
    id: 'style-collector',
    name: 'Style Collector',
    description: 'Try 30 different beer styles',
    emoji: '📚',
    category: 'collector',
    tier: 'gold',
    requirement: { type: 'unique_styles', value: 30 },
    points: 100,
  },
  {
    id: 'style-completionist',
    name: 'Completionist',
    description: 'Try 50 different beer styles',
    emoji: '🎖️',
    category: 'collector',
    tier: 'platinum',
    requirement: { type: 'unique_styles', value: 50 },
    points: 200,
  },
  
  // ============================================
  // ADVENTURER - Travel/locations
  // ============================================
  {
    id: 'local',
    name: 'Local',
    description: 'Log beers in 3 different cities',
    emoji: '🏘️',
    category: 'adventurer',
    tier: 'bronze',
    requirement: { type: 'unique_cities', value: 3 },
    points: 20,
  },
  {
    id: 'road-tripper',
    name: 'Road Tripper',
    description: 'Log beers in 10 different cities',
    emoji: '🚗',
    category: 'adventurer',
    tier: 'silver',
    requirement: { type: 'unique_cities', value: 10 },
    points: 50,
  },
  {
    id: 'globetrotter',
    name: 'Globetrotter',
    description: 'Log beers in 5 different countries',
    emoji: '✈️',
    category: 'adventurer',
    tier: 'gold',
    requirement: { type: 'unique_countries', value: 5 },
    points: 100,
  },
  {
    id: 'world-traveler',
    name: 'World Traveler',
    description: 'Log beers in 15 different countries',
    emoji: '🌍',
    category: 'adventurer',
    tier: 'platinum',
    requirement: { type: 'unique_countries', value: 15 },
    points: 250,
  },
  
  // ============================================
  // SPECIALIST - Style mastery
  // ============================================
  {
    id: 'ipa-lover',
    name: 'Hop Head',
    description: 'Log 10 IPAs',
    emoji: '🌿',
    category: 'specialist',
    tier: 'silver',
    requirement: { type: 'style_count', value: 10, subType: 'IPA' },
    points: 40,
  },
  {
    id: 'stout-fan',
    name: 'Dark Side',
    description: 'Log 10 stouts or porters',
    emoji: '🌑',
    category: 'specialist',
    tier: 'silver',
    requirement: { type: 'style_count', value: 10, subType: 'Stout' },
    points: 40,
  },
  {
    id: 'sour-seeker',
    name: 'Pucker Up',
    description: 'Log 10 sour beers',
    emoji: '🍋',
    category: 'specialist',
    tier: 'silver',
    requirement: { type: 'style_count', value: 10, subType: 'Sour' },
    points: 40,
  },
  {
    id: 'lager-loyalist',
    name: 'Crisp & Clean',
    description: 'Log 20 lagers',
    emoji: '🧊',
    category: 'specialist',
    tier: 'silver',
    requirement: { type: 'style_count', value: 20, subType: 'Lager' },
    points: 40,
  },
  {
    id: 'belgian-buff',
    name: 'Belgian Buff',
    description: 'Log 10 Belgian-style beers',
    emoji: '🇧🇪',
    category: 'specialist',
    tier: 'silver',
    requirement: { type: 'style_count', value: 10, subType: 'Belgian' },
    points: 40,
  },
  
  // ============================================
  // STREAKS
  // ============================================
  {
    id: 'streak-3',
    name: 'Three-Peat',
    description: 'Log beers 3 days in a row',
    emoji: '🔥',
    category: 'explorer',
    tier: 'bronze',
    requirement: { type: 'streak_days', value: 3 },
    points: 15,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Log beers 7 days in a row',
    emoji: '📅',
    category: 'explorer',
    tier: 'silver',
    requirement: { type: 'streak_days', value: 7 },
    points: 35,
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Log beers 30 days in a row',
    emoji: '🗓️',
    category: 'explorer',
    tier: 'gold',
    requirement: { type: 'streak_days', value: 30 },
    points: 100,
  },
  
  // ============================================
  // WISHLIST
  // ============================================
  {
    id: 'wishful',
    name: 'Wishful Thinking',
    description: 'Add 5 beers to your wishlist',
    emoji: '🌠',
    category: 'explorer',
    tier: 'bronze',
    requirement: { type: 'wishlisted', value: 5 },
    points: 10,
  },
  {
    id: 'dream-achieved',
    name: 'Dream Achieved',
    description: 'Try a beer from your wishlist',
    emoji: '✅',
    category: 'explorer',
    tier: 'bronze',
    requirement: { type: 'wishlist_completed', value: 1 },
    points: 20,
  },
  {
    id: 'bucket-list',
    name: 'Bucket List Pro',
    description: 'Complete 10 beers from your wishlist',
    emoji: '🪣',
    category: 'explorer',
    tier: 'silver',
    requirement: { type: 'wishlist_completed', value: 10 },
    points: 75,
  },
  
  // ============================================
  // SPECIAL / SECRET
  // ============================================
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Log a beer after midnight',
    emoji: '🦉',
    category: 'special',
    tier: 'bronze',
    requirement: { type: 'first_of_type', value: 1, subType: 'night_log' },
    points: 15,
    secret: true,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Log a beer before 9 AM',
    emoji: '🐦',
    category: 'special',
    tier: 'bronze',
    requirement: { type: 'first_of_type', value: 1, subType: 'early_log' },
    points: 15,
    secret: true,
  },
  {
    id: 'photographer',
    name: 'Beer Photographer',
    description: 'Add photos to 25 entries',
    emoji: '📸',
    category: 'special',
    tier: 'silver',
    requirement: { type: 'photos_taken', value: 25 },
    points: 40,
  },
  {
    id: 'brewery-hopper',
    name: 'Brewery Hopper',
    description: 'Try beers from 25 different breweries',
    emoji: '🏭',
    category: 'collector',
    tier: 'gold',
    requirement: { type: 'unique_breweries', value: 25 },
    points: 75,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category && !a.secret);
}

export function getSecretAchievements(): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.secret);
}

export function getTierColor(tier: Achievement['tier']): string {
  switch (tier) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    default: return '#9CA3AF';
  }
}

export function getTierGradient(tier: Achievement['tier']): string[] {
  switch (tier) {
    case 'bronze': return ['#CD7F32', '#8B4513'];
    case 'silver': return ['#C0C0C0', '#A8A8A8'];
    case 'gold': return ['#FFD700', '#DAA520'];
    case 'platinum': return ['#E5E4E2', '#BCC6CC'];
    default: return ['#9CA3AF', '#6B7280'];
  }
}

export interface UserAchievementState {
  unlockedAchievements: {
    achievementId: string;
    unlockedAt: number;
  }[];
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string;
}

export function checkAchievementProgress(
  achievement: Achievement,
  stats: any // UserStats
): { unlocked: boolean; progress: number; total: number } {
  const { type, value, subType } = achievement.requirement;
  let currentValue = 0;
  
  switch (type) {
    case 'total_beers':
      currentValue = stats.totalBeers || 0;
      break;
    case 'unique_styles':
      currentValue = stats.uniqueStyles || 0;
      break;
    case 'unique_breweries':
      currentValue = stats.uniqueBreweries || 0;
      break;
    case 'unique_cities':
      currentValue = stats.uniqueCities || 0;
      break;
    case 'unique_countries':
      currentValue = stats.uniqueCountries || 0;
      break;
    case 'five_star_ratings':
      currentValue = stats.fiveStarCount || 0;
      break;
    case 'streak_days':
      currentValue = stats.currentStreak || 0;
      break;
    case 'style_count':
      currentValue = stats.styleCounts?.[subType!] || 0;
      break;
    case 'photos_taken':
      currentValue = stats.photosCount || 0;
      break;
    case 'wishlisted':
      currentValue = stats.wishlistCount || 0;
      break;
    case 'wishlist_completed':
      currentValue = stats.wishlistCompletedCount || 0;
      break;
    default:
      currentValue = 0;
  }
  
  return {
    unlocked: currentValue >= value,
    progress: Math.min(currentValue, value),
    total: value,
  };
}

// ============================================
// LEVEL SYSTEM
// ============================================

export interface UserLevel {
  level: number;
  title: string;
  minPoints: number;
  maxPoints: number;
  emoji: string;
}

export const LEVELS: UserLevel[] = [
  { level: 1, title: 'Newbie', minPoints: 0, maxPoints: 50, emoji: '🌱' },
  { level: 2, title: 'Casual Drinker', minPoints: 50, maxPoints: 150, emoji: '🍺' },
  { level: 3, title: 'Beer Curious', minPoints: 150, maxPoints: 300, emoji: '🔍' },
  { level: 4, title: 'Enthusiast', minPoints: 300, maxPoints: 500, emoji: '😊' },
  { level: 5, title: 'Aficionado', minPoints: 500, maxPoints: 750, emoji: '🎩' },
  { level: 6, title: 'Connoisseur', minPoints: 750, maxPoints: 1000, emoji: '🍷' },
  { level: 7, title: 'Expert', minPoints: 1000, maxPoints: 1500, emoji: '📚' },
  { level: 8, title: 'Master', minPoints: 1500, maxPoints: 2000, emoji: '🏅' },
  { level: 9, title: 'Grand Master', minPoints: 2000, maxPoints: 3000, emoji: '👑' },
  { level: 10, title: 'Legend', minPoints: 3000, maxPoints: Infinity, emoji: '🌟' },
];

export function getUserLevel(points: number): UserLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getProgressToNextLevel(points: number): { current: number; needed: number; percentage: number } {
  const currentLevel = getUserLevel(points);
  const nextLevel = LEVELS[currentLevel.level] || currentLevel;
  
  const current = points - currentLevel.minPoints;
  const needed = nextLevel.minPoints - currentLevel.minPoints;
  const percentage = needed > 0 ? (current / needed) * 100 : 100;
  
  return { current, needed, percentage };
}
