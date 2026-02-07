// Beer Flavor Profile System
// Tracks user taste preferences and provides recommendations

// ============================================
// FLAVOR DIMENSIONS
// ============================================

export interface FlavorDimension {
  id: string;
  name: string;
  emoji: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  examples: {
    low: string[];
    high: string[];
  };
}

export const FLAVOR_DIMENSIONS: FlavorDimension[] = [
  {
    id: 'bitterness',
    name: 'Bitterness',
    emoji: '🌿',
    description: 'How much hop bitterness do you enjoy?',
    lowLabel: 'Smooth',
    highLabel: 'Bitter',
    examples: {
      low: ['Hefeweizen', 'Blonde Ale', 'Cream Ale'],
      high: ['IPA', 'Double IPA', 'American Pale Ale'],
    },
  },
  {
    id: 'sweetness',
    name: 'Sweetness',
    emoji: '🍯',
    description: 'Do you prefer malty sweetness?',
    lowLabel: 'Dry',
    highLabel: 'Sweet',
    examples: {
      low: ['Pilsner', 'Saison', 'Berliner Weisse'],
      high: ['Milk Stout', 'Doppelbock', 'Scotch Ale'],
    },
  },
  {
    id: 'roast',
    name: 'Roast',
    emoji: '☕',
    description: 'How much roasted/dark malt flavor?',
    lowLabel: 'Light',
    highLabel: 'Roasty',
    examples: {
      low: ['Pilsner', 'Wheat Beer', 'Kölsch'],
      high: ['Stout', 'Porter', 'Schwarzbier'],
    },
  },
  {
    id: 'fruit',
    name: 'Fruitiness',
    emoji: '🍊',
    description: 'Fruit flavors from hops, yeast, or additions?',
    lowLabel: 'Clean',
    highLabel: 'Fruity',
    examples: {
      low: ['Lager', 'Pilsner', 'Märzen'],
      high: ['Belgian Wit', 'Fruit IPA', 'Lambic'],
    },
  },
  {
    id: 'spice',
    name: 'Spice',
    emoji: '🌶️',
    description: 'Spicy notes from yeast or ingredients?',
    lowLabel: 'Neutral',
    highLabel: 'Spicy',
    examples: {
      low: ['American Lager', 'Cream Ale'],
      high: ['Saison', 'Belgian Tripel', 'Witbier'],
    },
  },
  {
    id: 'body',
    name: 'Body',
    emoji: '💪',
    description: 'Light and refreshing or full and heavy?',
    lowLabel: 'Light',
    highLabel: 'Full',
    examples: {
      low: ['Light Lager', 'Session IPA', 'Berliner'],
      high: ['Imperial Stout', 'Barleywine', 'Doppelbock'],
    },
  },
  {
    id: 'sour',
    name: 'Sourness',
    emoji: '🍋',
    description: 'Do you enjoy sour/tart beers?',
    lowLabel: 'None',
    highLabel: 'Sour',
    examples: {
      low: ['Most traditional styles'],
      high: ['Gose', 'Lambic', 'Flanders Red', 'Berliner Weisse'],
    },
  },
];

// ============================================
// BEER STYLES WITH FLAVOR PROFILES
// ============================================

export interface StyleFlavorProfile {
  styleId: string;
  styleName: string;
  category: string;
  bitterness: number; // 1-5
  sweetness: number;
  roast: number;
  fruit: number;
  spice: number;
  body: number;
  sour: number;
  avgAbv: number;
  description: string;
}

export const STYLE_PROFILES: StyleFlavorProfile[] = [
  // Lagers
  { styleId: 'pilsner', styleName: 'Pilsner', category: 'Lager', bitterness: 2, sweetness: 1, roast: 1, fruit: 1, spice: 1, body: 2, sour: 1, avgAbv: 4.5, description: 'Crisp, clean, refreshing with noble hop character' },
  { styleId: 'helles', styleName: 'Helles', category: 'Lager', bitterness: 1, sweetness: 2, roast: 1, fruit: 1, spice: 1, body: 2, sour: 1, avgAbv: 4.8, description: 'Malty German lager, slightly sweet, very drinkable' },
  { styleId: 'marzen', styleName: 'Märzen/Oktoberfest', category: 'Lager', bitterness: 2, sweetness: 3, roast: 2, fruit: 1, spice: 1, body: 3, sour: 1, avgAbv: 5.5, description: 'Amber lager with toasted malt, medium body' },
  { styleId: 'bock', styleName: 'Bock', category: 'Lager', bitterness: 2, sweetness: 4, roast: 2, fruit: 1, spice: 1, body: 4, sour: 1, avgAbv: 6.5, description: 'Strong, malty lager with caramel notes' },
  { styleId: 'doppelbock', styleName: 'Doppelbock', category: 'Lager', bitterness: 2, sweetness: 5, roast: 3, fruit: 2, spice: 1, body: 5, sour: 1, avgAbv: 8.0, description: 'Rich, very malty, almost like liquid bread' },
  
  // Ales - Pale
  { styleId: 'blonde', styleName: 'Blonde Ale', category: 'Ale', bitterness: 2, sweetness: 2, roast: 1, fruit: 2, spice: 1, body: 2, sour: 1, avgAbv: 4.5, description: 'Easy-drinking, light, slightly fruity' },
  { styleId: 'pale-ale', styleName: 'Pale Ale', category: 'Ale', bitterness: 3, sweetness: 2, roast: 1, fruit: 3, spice: 1, body: 2, sour: 1, avgAbv: 5.2, description: 'Balanced hop flavor with citrus/pine notes' },
  { styleId: 'ipa', styleName: 'IPA', category: 'Ale', bitterness: 4, sweetness: 2, roast: 1, fruit: 4, spice: 1, body: 3, sour: 1, avgAbv: 6.5, description: 'Hop-forward with citrus, tropical, or pine flavors' },
  { styleId: 'dipa', styleName: 'Double IPA', category: 'Ale', bitterness: 5, sweetness: 2, roast: 1, fruit: 5, spice: 1, body: 4, sour: 1, avgAbv: 8.5, description: 'Intense hop character, higher alcohol, bold' },
  { styleId: 'neipa', styleName: 'Hazy/NE IPA', category: 'Ale', bitterness: 3, sweetness: 2, roast: 1, fruit: 5, spice: 1, body: 3, sour: 1, avgAbv: 6.5, description: 'Juicy, tropical, low bitterness, hazy appearance' },
  
  // Ales - Dark
  { styleId: 'brown', styleName: 'Brown Ale', category: 'Ale', bitterness: 2, sweetness: 3, roast: 3, fruit: 2, spice: 1, body: 3, sour: 1, avgAbv: 5.0, description: 'Nutty, caramel, chocolate notes, easy drinking' },
  { styleId: 'porter', styleName: 'Porter', category: 'Ale', bitterness: 3, sweetness: 3, roast: 4, fruit: 2, spice: 1, body: 3, sour: 1, avgAbv: 5.5, description: 'Dark, roasty, chocolate and coffee flavors' },
  { styleId: 'stout', styleName: 'Stout', category: 'Ale', bitterness: 3, sweetness: 2, roast: 5, fruit: 1, spice: 1, body: 4, sour: 1, avgAbv: 5.5, description: 'Very dark, roasted barley, coffee-like' },
  { styleId: 'milk-stout', styleName: 'Milk Stout', category: 'Ale', bitterness: 2, sweetness: 4, roast: 4, fruit: 1, spice: 1, body: 4, sour: 1, avgAbv: 5.0, description: 'Sweet, creamy, chocolate flavors from lactose' },
  { styleId: 'imperial-stout', styleName: 'Imperial Stout', category: 'Ale', bitterness: 4, sweetness: 4, roast: 5, fruit: 2, spice: 2, body: 5, sour: 1, avgAbv: 10.0, description: 'Massive, complex, dark chocolate, espresso, warming' },
  
  // Wheat
  { styleId: 'hefeweizen', styleName: 'Hefeweizen', category: 'Wheat', bitterness: 1, sweetness: 2, roast: 1, fruit: 3, spice: 3, body: 3, sour: 1, avgAbv: 5.0, description: 'Banana, clove, refreshing wheat beer' },
  { styleId: 'witbier', styleName: 'Witbier', category: 'Wheat', bitterness: 1, sweetness: 2, roast: 1, fruit: 4, spice: 4, body: 2, sour: 1, avgAbv: 4.8, description: 'Light, citrus, coriander, refreshing' },
  { styleId: 'dunkelweizen', styleName: 'Dunkelweizen', category: 'Wheat', bitterness: 1, sweetness: 3, roast: 3, fruit: 3, spice: 3, body: 3, sour: 1, avgAbv: 5.2, description: 'Dark wheat beer, banana, clove, caramel' },
  
  // Belgian
  { styleId: 'saison', styleName: 'Saison', category: 'Belgian', bitterness: 3, sweetness: 1, roast: 1, fruit: 3, spice: 5, body: 2, sour: 2, avgAbv: 6.0, description: 'Dry, spicy, earthy, refreshing farmhouse ale' },
  { styleId: 'tripel', styleName: 'Belgian Tripel', category: 'Belgian', bitterness: 3, sweetness: 3, roast: 1, fruit: 4, spice: 4, body: 3, sour: 1, avgAbv: 8.5, description: 'Strong, spicy, fruity, deceptively drinkable' },
  { styleId: 'dubbel', styleName: 'Belgian Dubbel', category: 'Belgian', bitterness: 2, sweetness: 4, roast: 3, fruit: 4, spice: 3, body: 4, sour: 1, avgAbv: 7.0, description: 'Rich, malty, dark fruit, caramel' },
  { styleId: 'quad', styleName: 'Belgian Quad', category: 'Belgian', bitterness: 2, sweetness: 5, roast: 3, fruit: 5, spice: 4, body: 5, sour: 1, avgAbv: 10.0, description: 'Very strong, dark fruit, fig, raisin, complex' },
  
  // Sour
  { styleId: 'gose', styleName: 'Gose', category: 'Sour', bitterness: 1, sweetness: 1, roast: 1, fruit: 3, spice: 2, body: 2, sour: 4, avgAbv: 4.5, description: 'Tart, salty, refreshing, often with fruit' },
  { styleId: 'berliner', styleName: 'Berliner Weisse', category: 'Sour', bitterness: 1, sweetness: 1, roast: 1, fruit: 2, spice: 1, body: 1, sour: 5, avgAbv: 3.5, description: 'Very tart, light, refreshing, often with syrup' },
  { styleId: 'lambic', styleName: 'Lambic/Gueuze', category: 'Sour', bitterness: 1, sweetness: 1, roast: 1, fruit: 3, spice: 2, body: 2, sour: 5, avgAbv: 5.5, description: 'Wild fermented, complex, funky, very sour' },
  { styleId: 'flanders', styleName: 'Flanders Red', category: 'Sour', bitterness: 2, sweetness: 2, roast: 2, fruit: 4, spice: 2, body: 3, sour: 4, avgAbv: 5.5, description: 'Tart, vinous, cherry, complex oak character' },
];

// ============================================
// USER TASTE PROFILE
// ============================================

export interface UserTasteProfile {
  userId: string;
  
  // Learned preferences (1-5 scale)
  preferences: {
    bitterness: number;
    sweetness: number;
    roast: number;
    fruit: number;
    spice: number;
    body: number;
    sour: number;
  };
  
  // Confidence scores (how many data points)
  confidence: {
    bitterness: number;
    sweetness: number;
    roast: number;
    fruit: number;
    spice: number;
    body: number;
    sour: number;
  };
  
  // Favorite styles (based on ratings)
  topStyles: string[];
  
  // Stats
  totalRatings: number;
  avgRating: number;
  
  updatedAt: number;
}

// ============================================
// RECOMMENDATION ENGINE
// ============================================

export function calculateStyleMatch(
  userProfile: UserTasteProfile,
  styleProfile: StyleFlavorProfile
): number {
  const dimensions = ['bitterness', 'sweetness', 'roast', 'fruit', 'spice', 'body', 'sour'] as const;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  dimensions.forEach(dim => {
    const userPref = userProfile.preferences[dim];
    const styleValue = styleProfile[dim];
    const confidence = userProfile.confidence[dim];
    
    // Weight by confidence (more ratings = more trust)
    const weight = Math.min(confidence / 10, 1);
    
    // Score is inverse of distance
    const distance = Math.abs(userPref - styleValue);
    const score = 5 - distance;
    
    totalScore += score * weight;
    totalWeight += weight;
  });
  
  // Return percentage match
  return totalWeight > 0 ? (totalScore / totalWeight / 5) * 100 : 50;
}

export function getRecommendations(
  userProfile: UserTasteProfile,
  limit: number = 5
): { style: StyleFlavorProfile; matchScore: number }[] {
  const matches = STYLE_PROFILES.map(style => ({
    style,
    matchScore: calculateStyleMatch(userProfile, style),
  }));
  
  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);
  
  return matches.slice(0, limit);
}

export function getStylesForMood(mood: string): StyleFlavorProfile[] {
  const moodStyles: Record<string, string[]> = {
    'refreshing': ['pilsner', 'helles', 'gose', 'berliner', 'witbier', 'blonde'],
    'warming': ['imperial-stout', 'quad', 'doppelbock', 'barleywine'],
    'adventurous': ['lambic', 'saison', 'flanders', 'gose'],
    'sessionable': ['pilsner', 'blonde', 'session-ipa', 'hefeweizen', 'berliner'],
    'bold': ['dipa', 'imperial-stout', 'quad', 'barleywine'],
    'mellow': ['brown', 'milk-stout', 'helles', 'dunkelweizen'],
  };
  
  const styleIds = moodStyles[mood] || [];
  return STYLE_PROFILES.filter(s => styleIds.includes(s.styleId));
}

// ============================================
// LEARNING ALGORITHM
// ============================================

export function updateProfileFromRating(
  currentProfile: UserTasteProfile,
  styleId: string,
  rating: number // 1-5
): UserTasteProfile {
  const styleProfile = STYLE_PROFILES.find(s => s.styleId === styleId);
  if (!styleProfile) return currentProfile;
  
  const dimensions = ['bitterness', 'sweetness', 'roast', 'fruit', 'spice', 'body', 'sour'] as const;
  
  const newProfile = { ...currentProfile };
  newProfile.preferences = { ...currentProfile.preferences };
  newProfile.confidence = { ...currentProfile.confidence };
  
  // Higher rating = user likes these flavor characteristics
  // Lower rating = user dislikes these characteristics
  const ratingWeight = (rating - 3) / 2; // -1 to 1
  
  dimensions.forEach(dim => {
    const styleValue = styleProfile[dim];
    const currentPref = currentProfile.preferences[dim];
    const currentConf = currentProfile.confidence[dim];
    
    // Learning rate decreases as confidence increases
    const learningRate = 0.2 / (1 + currentConf * 0.1);
    
    // Adjust preference toward/away from style value based on rating
    const adjustment = (styleValue - currentPref) * ratingWeight * learningRate;
    
    newProfile.preferences[dim] = Math.max(1, Math.min(5, currentPref + adjustment));
    newProfile.confidence[dim] = currentConf + 1;
  });
  
  newProfile.totalRatings += 1;
  newProfile.avgRating = (currentProfile.avgRating * currentProfile.totalRatings + rating) / newProfile.totalRatings;
  newProfile.updatedAt = Date.now();
  
  return newProfile;
}

// ============================================
// DEFAULT PROFILE
// ============================================

export function createDefaultProfile(userId: string): UserTasteProfile {
  return {
    userId,
    preferences: {
      bitterness: 3,
      sweetness: 3,
      roast: 3,
      fruit: 3,
      spice: 3,
      body: 3,
      sour: 2,
    },
    confidence: {
      bitterness: 0,
      sweetness: 0,
      roast: 0,
      fruit: 0,
      spice: 0,
      body: 0,
      sour: 0,
    },
    topStyles: [],
    totalRatings: 0,
    avgRating: 0,
    updatedAt: Date.now(),
  };
}
