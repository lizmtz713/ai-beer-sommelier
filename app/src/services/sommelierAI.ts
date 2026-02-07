// AI Sommelier Service
// Powers the chat with beer knowledge + user taste profile

import {
  BEER_DATABASE,
  Beer,
  searchBeers,
  getBeersByStyle,
  getTopRatedBeers,
  getBeersByFoodPairing,
  getBeersForOccasion,
} from '@/data/beerDatabase';
import {
  STYLE_PROFILES,
  UserTasteProfile,
  calculateStyleMatch,
  StyleFlavorProfile,
} from '@/data/flavorProfile';

// ============================================
// TYPES
// ============================================

export interface SommelierResponse {
  message: string;
  recommendations?: BeerRecommendation[];
  followUp?: string[];
}

export interface BeerRecommendation {
  id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  matchScore: number;
  reason: string;
  flavorNotes: string[];
  pairings?: string[];
}

interface Intent {
  type: 'pairing' | 'occasion' | 'style' | 'mood' | 'search' | 'recommendation' | 'education' | 'unknown';
  entities: Record<string, string>;
}

// ============================================
// INTENT DETECTION
// ============================================

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  
  // Food pairing
  const foodMatches = lower.match(/(?:pair|go|match|with|eat|having|eating)\s+(?:with\s+)?(.+?)(?:\?|$)/);
  if (foodMatches || lower.includes('pair') || lower.includes('food')) {
    const food = extractFood(lower);
    if (food) {
      return { type: 'pairing', entities: { food } };
    }
  }
  
  // Occasion/event
  const occasions = ['bbq', 'party', 'date', 'game day', 'thanksgiving', 'christmas', 'birthday', 'celebration', 'special', 'holiday'];
  for (const occ of occasions) {
    if (lower.includes(occ)) {
      return { type: 'occasion', entities: { occasion: occ } };
    }
  }
  
  // Weather/mood
  const moods = [
    { keywords: ['hot', 'summer', 'sunny', 'beach', 'pool'], mood: 'refreshing' },
    { keywords: ['cold', 'winter', 'cozy', 'rain', 'fireplace', 'warm'], mood: 'warming' },
    { keywords: ['adventur', 'try something new', 'different', 'unusual'], mood: 'adventurous' },
    { keywords: ['light', 'session', 'easy', 'casual'], mood: 'sessionable' },
    { keywords: ['bold', 'strong', 'intense', 'powerful'], mood: 'bold' },
    { keywords: ['relax', 'chill', 'mellow', 'smooth'], mood: 'mellow' },
  ];
  for (const { keywords, mood } of moods) {
    if (keywords.some(k => lower.includes(k))) {
      return { type: 'mood', entities: { mood } };
    }
  }
  
  // Specific style request
  const styles = STYLE_PROFILES.map(s => s.styleName.toLowerCase());
  for (const style of styles) {
    if (lower.includes(style)) {
      return { type: 'style', entities: { style } };
    }
  }
  
  // Search for specific beer/brewery
  if (lower.includes('have you') || lower.includes('what about') || lower.includes('tell me about')) {
    const searchTerm = lower.replace(/have you|what about|tell me about|heard of|tried|know/g, '').trim();
    if (searchTerm.length > 2) {
      return { type: 'search', entities: { query: searchTerm } };
    }
  }
  
  // General recommendation
  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('should i') || lower.includes('tonight') || lower.includes('what beer')) {
    return { type: 'recommendation', entities: {} };
  }
  
  // Education
  if (lower.includes('what is') || lower.includes('difference between') || lower.includes('how is') || lower.includes('explain')) {
    return { type: 'education', entities: { topic: lower } };
  }
  
  return { type: 'unknown', entities: {} };
}

function extractFood(text: string): string | null {
  const foods = [
    'pizza', 'burger', 'steak', 'chicken', 'fish', 'seafood', 'sushi',
    'tacos', 'mexican', 'bbq', 'ribs', 'wings', 'nachos', 'cheese',
    'pasta', 'italian', 'indian', 'thai', 'chinese', 'japanese',
    'salad', 'vegetables', 'grilled', 'fried', 'spicy', 'dessert',
    'chocolate', 'breakfast', 'brunch', 'lunch', 'dinner',
  ];
  
  for (const food of foods) {
    if (text.includes(food)) return food;
  }
  
  return null;
}

// ============================================
// RESPONSE GENERATORS
// ============================================

function generatePairingResponse(food: string, profile: UserTasteProfile): SommelierResponse {
  const pairingBeers = getBeersByFoodPairing(food);
  
  // Score by user taste match
  const scored = pairingBeers.map(beer => {
    const styleProfile = STYLE_PROFILES.find(s => s.styleId === beer.styleId);
    const matchScore = styleProfile ? calculateStyleMatch(profile, styleProfile) : 70;
    return { beer, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
  
  const top3 = scored.slice(0, 3);
  
  const messages: Record<string, string> = {
    pizza: "Pizza and beer are a match made in heaven! 🍕🍺\n\nThe key is matching the toppings — lighter for margherita, bolder for meat lovers.",
    burger: "Burgers call for beers that can stand up to all that juicy goodness! 🍔\n\nHoppy beers cut through the fat, while maltier ones complement the meat.",
    steak: "Steak night? Now we're talking. 🥩\n\nYou want something with body and maybe some roasty notes to complement the char.",
    tacos: "Tacos + beer = taco tuesday done right! 🌮\n\nLight lagers are classic, but don't sleep on a crisp Gose with ceviche tacos.",
    sushi: "Sushi is delicate, so we don't want to overpower it. 🍣\n\nClean, crisp beers let the fish shine.",
    bbq: "BBQ demands a beer that can handle smoke and sauce! 🔥\n\nIPAs cut through the richness, ambers complement the sweetness.",
    spicy: "Spicy food? You need refreshment AND something that won't fight the heat. 🌶️\n\nLight lagers and wheat beers are your friends here.",
    cheese: "Cheese and beer is an underrated pairing! 🧀\n\nThe carbonation cleanses your palate between bites.",
    chocolate: "Chocolate + beer is pure decadence! 🍫\n\nStouts and porters with their roasty notes are natural partners.",
    seafood: "Seafood loves crisp, clean beers! 🦐\n\nPilsners and wheat beers won't compete with delicate flavors.",
  };
  
  const intro = messages[food] || `Great choice! Let me find the perfect beers for ${food}. 🍺`;
  
  return {
    message: intro,
    recommendations: top3.map(({ beer, matchScore }) => ({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv,
      matchScore: Math.round(matchScore),
      reason: beer.description,
      flavorNotes: beer.flavorNotes,
      pairings: beer.pairings.filter(p => p.toLowerCase().includes(food)),
    })),
    followUp: [
      `What style of ${food} are you having?`,
      "Want me to suggest some sides to go with it?",
      "Looking for something available everywhere or more craft?",
    ],
  };
}

function generateOccasionResponse(occasion: string, profile: UserTasteProfile): SommelierResponse {
  const beers = getBeersForOccasion(occasion);
  
  const scored = beers.map(beer => {
    const styleProfile = STYLE_PROFILES.find(s => s.styleId === beer.styleId);
    const matchScore = styleProfile ? calculateStyleMatch(profile, styleProfile) : 70;
    return { beer, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
  
  const top3 = scored.slice(0, 3);
  
  const messages: Record<string, string> = {
    bbq: "BBQ time! 🔥 Nothing beats a cold beer with grilled meat. Here's what I'd grab:",
    party: "Party mode activated! 🎉 You want crowd-pleasers that are easy to drink:",
    'date night': "Date night? Let's impress. 💕 These are sophisticated without being pretentious:",
    'game day': "Game day means one thing: sessionable beers you can drink all game! 🏈",
    thanksgiving: "Turkey Day calls for beers that complement all those flavors! 🦃",
    christmas: "Holiday beers! Time for the good stuff — rich, warming, celebratory! 🎄",
    celebration: "Time to celebrate! 🥂 These beers are special enough for the moment:",
    special: "Something special? Say no more. These are the beers worth savoring:",
  };
  
  const intro = messages[occasion] || `Perfect for ${occasion}! Here are my picks:`;
  
  return {
    message: intro,
    recommendations: top3.map(({ beer, matchScore }) => ({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv,
      matchScore: Math.round(matchScore),
      reason: beer.description,
      flavorNotes: beer.flavorNotes,
    })),
  };
}

function generateMoodResponse(mood: string, profile: UserTasteProfile): SommelierResponse {
  const moodStyles: Record<string, string[]> = {
    refreshing: ['pilsner', 'helles', 'gose', 'berliner', 'witbier', 'hefeweizen'],
    warming: ['imperial-stout', 'quad', 'doppelbock', 'dubbel', 'porter'],
    adventurous: ['lambic', 'saison', 'flanders', 'gose', 'quad'],
    sessionable: ['pilsner', 'hefeweizen', 'witbier', 'blonde', 'gose'],
    bold: ['dipa', 'imperial-stout', 'quad', 'tripel'],
    mellow: ['brown', 'milk-stout', 'helles', 'dubbel', 'dunkelweizen'],
  };
  
  const styleIds = moodStyles[mood] || [];
  const beers = BEER_DATABASE.filter(b => styleIds.includes(b.styleId));
  
  const scored = beers.map(beer => {
    const styleProfile = STYLE_PROFILES.find(s => s.styleId === beer.styleId);
    const matchScore = styleProfile ? calculateStyleMatch(profile, styleProfile) : 70;
    // Boost highly rated beers slightly
    const boostedScore = matchScore + (beer.rating - 4) * 5;
    return { beer, matchScore: boostedScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
  
  const top3 = scored.slice(0, 3);
  
  const messages: Record<string, string> = {
    refreshing: "Hot day vibes! ☀️ You want something crisp, cold, and thirst-quenching:",
    warming: "Cozy time! 🔥 Rich, full-bodied, and perfect for sipping slow:",
    adventurous: "Love the adventurous spirit! 🗺️ Let's explore some interesting territory:",
    sessionable: "Keeping it light? Smart. 🍻 These are all-day drinkable:",
    bold: "Go big or go home! 💪 These beers make a statement:",
    mellow: "Smooth and easy vibes. 😌 Nothing too intense, just good beer:",
  };
  
  return {
    message: messages[mood] || "Here's what I'd recommend:",
    recommendations: top3.map(({ beer, matchScore }) => ({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv,
      matchScore: Math.round(Math.min(matchScore, 98)),
      reason: beer.description,
      flavorNotes: beer.flavorNotes,
    })),
  };
}

function generateStyleResponse(styleName: string, profile: UserTasteProfile): SommelierResponse {
  const style = STYLE_PROFILES.find(s => 
    s.styleName.toLowerCase().includes(styleName.toLowerCase())
  );
  
  if (!style) {
    return {
      message: `I'm not sure about that style. Can you be more specific? Try "IPA", "stout", "pilsner", etc.`,
    };
  }
  
  const styleBeers = getBeersByStyle(style.styleId);
  const matchScore = calculateStyleMatch(profile, style);
  
  const top3 = styleBeers
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  
  return {
    message: `${style.styleName}! ${style.description}\n\nBased on your taste profile, this style is a ${Math.round(matchScore)}% match for you. Here are the best examples:`,
    recommendations: top3.map(beer => ({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv,
      matchScore: Math.round(matchScore),
      reason: beer.description,
      flavorNotes: beer.flavorNotes,
      pairings: beer.pairings,
    })),
    followUp: [
      `Want to know what foods pair well with ${style.styleName}?`,
      "Interested in similar styles you might like?",
    ],
  };
}

function generateSearchResponse(query: string, profile: UserTasteProfile): SommelierResponse {
  const results = searchBeers(query);
  
  if (results.length === 0) {
    return {
      message: `I couldn't find anything matching "${query}" in my database. Try searching for a beer name, brewery, or style!`,
      followUp: [
        "What kind of beer are you in the mood for?",
        "Want me to recommend something similar?",
      ],
    };
  }
  
  const scored = results.map(beer => {
    const styleProfile = STYLE_PROFILES.find(s => s.styleId === beer.styleId);
    const matchScore = styleProfile ? calculateStyleMatch(profile, styleProfile) : 70;
    return { beer, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
  
  const top3 = scored.slice(0, 3);
  
  return {
    message: `Found ${results.length} beers matching "${query}"! Here are the best matches for your taste:`,
    recommendations: top3.map(({ beer, matchScore }) => ({
      id: beer.id,
      name: beer.name,
      brewery: beer.brewery,
      style: beer.style,
      abv: beer.abv,
      matchScore: Math.round(matchScore),
      reason: beer.description,
      flavorNotes: beer.flavorNotes,
      pairings: beer.pairings,
    })),
  };
}

function generateRecommendationResponse(profile: UserTasteProfile): SommelierResponse {
  // Get styles that match user's profile
  const styleMatches = STYLE_PROFILES.map(style => ({
    style,
    score: calculateStyleMatch(profile, style),
  })).sort((a, b) => b.score - a.score);
  
  // Get top beers from top matching styles
  const topStyles = styleMatches.slice(0, 3).map(s => s.style.styleId);
  const topBeers = BEER_DATABASE
    .filter(b => topStyles.includes(b.styleId))
    .sort((a, b) => b.rating - a.rating);
  
  const top3 = topBeers.slice(0, 3);
  const topMatch = styleMatches[0];
  
  const prefDescription = describeUserPreferences(profile);
  
  return {
    message: `Based on your taste profile, I know you ${prefDescription}.\n\nHere's what I think you'd love right now:`,
    recommendations: top3.map(beer => {
      const styleProfile = STYLE_PROFILES.find(s => s.styleId === beer.styleId);
      const matchScore = styleProfile ? calculateStyleMatch(profile, styleProfile) : 85;
      return {
        id: beer.id,
        name: beer.name,
        brewery: beer.brewery,
        style: beer.style,
        abv: beer.abv,
        matchScore: Math.round(matchScore),
        reason: beer.description,
        flavorNotes: beer.flavorNotes,
        pairings: beer.pairings,
      };
    }),
    followUp: [
      "What are you in the mood for tonight?",
      "Having it with food?",
      "Want something you've never tried?",
    ],
  };
}

function generateEducationResponse(topic: string): SommelierResponse {
  // Simple education responses
  const education: Record<string, string> = {
    ipa: "IPA stands for India Pale Ale! 🍺\n\nOriginally brewed in England with extra hops to survive the long voyage to India. Today it's the most popular craft beer style in America.\n\n**Key characteristics:**\n• Hoppy bitterness (IBU 40-70+)\n• Citrus, pine, tropical, or dank flavors\n• 5-7.5% ABV (higher for Double IPAs)\n\n**Sub-styles:**\n• West Coast IPA: Bitter, clear, piney\n• Hazy/NE IPA: Juicy, soft, tropical\n• Session IPA: Lower ABV, more drinkable",
    
    lager: "Lagers are beers fermented cold with bottom-fermenting yeast! 🍺\n\n**Key characteristics:**\n• Clean, crisp flavor\n• Fermented at 35-50°F\n• Lagered (aged) for weeks to months\n• Usually lighter in color and body\n\n**Common styles:**\n• Pilsner (Czech, German)\n• Helles (Munich)\n• Märzen/Oktoberfest\n• Bock/Doppelbock",
    
    stout: "Stouts are dark beers made with roasted barley! ☕\n\n**Key characteristics:**\n• Dark color (nearly black)\n• Roasted, coffee, chocolate flavors\n• Originated in Ireland/UK\n\n**Sub-styles:**\n• Dry/Irish Stout: Light body, roasty (Guinness)\n• Milk Stout: Sweet from lactose\n• Oatmeal Stout: Creamy, smooth\n• Imperial Stout: Big, boozy, complex",
    
    sour: "Sour beers are intentionally tart/acidic! 🍋\n\n**How they get sour:**\n• Wild yeast (Brettanomyces)\n• Bacteria (Lactobacillus, Pediococcus)\n• Sometimes aged in barrels for years\n\n**Common styles:**\n• Gose: Tart + salty\n• Berliner Weisse: Very tart wheat beer\n• Lambic/Gueuze: Wild Belgian, funky\n• Flanders Red: Vinous, fruity",
    
    ibu: "IBU = International Bitterness Units! 📊\n\nIt measures hop bitterness in beer.\n\n**Rough scale:**\n• 0-20 IBU: Light lagers, wheat beers\n• 20-45 IBU: Pale ales, ambers\n• 45-70 IBU: IPAs\n• 70+ IBU: Double IPAs, hop bombs\n\n**Note:** Malt sweetness balances bitterness, so IBU alone doesn't tell the whole story!",
    
    abv: "ABV = Alcohol By Volume! 🍺\n\nThe percentage of alcohol in your drink.\n\n**Beer ABV ranges:**\n• Session beers: 3-5%\n• Standard beers: 5-7%\n• Strong beers: 7-10%\n• Imperial/Extreme: 10%+\n\n**Fun fact:** The strongest beers can exceed 50% ABV (basically spirits at that point).",
  };
  
  for (const [key, value] of Object.entries(education)) {
    if (topic.toLowerCase().includes(key)) {
      return { message: value };
    }
  }
  
  return {
    message: "Great question! I'm still learning about that topic. Try asking about IPA, lager, stout, sour beers, IBU, or ABV!",
    followUp: [
      "What's an IPA?",
      "Explain the difference between lager and ale",
      "What does IBU mean?",
    ],
  };
}

function describeUserPreferences(profile: UserTasteProfile): string {
  const prefs: string[] = [];
  
  if (profile.preferences.fruit > 3.5) prefs.push("enjoy fruity, tropical hop flavors");
  if (profile.preferences.bitterness > 3.5) prefs.push("appreciate a good hoppy bite");
  if (profile.preferences.bitterness < 2.5) prefs.push("prefer smooth, less bitter beers");
  if (profile.preferences.roast > 3.5) prefs.push("love roasty, coffee-like notes");
  if (profile.preferences.sweetness > 3.5) prefs.push("lean toward malty sweetness");
  if (profile.preferences.sour > 3) prefs.push("have a taste for sours");
  if (profile.preferences.sour < 2) prefs.push("aren't big on sour beers");
  if (profile.preferences.body > 3.5) prefs.push("like full-bodied beers");
  if (profile.preferences.body < 2.5) prefs.push("prefer lighter, more drinkable beers");
  
  if (prefs.length === 0) return "have a balanced palate";
  if (prefs.length === 1) return prefs[0];
  if (prefs.length === 2) return `${prefs[0]} and ${prefs[1]}`;
  
  return prefs.slice(0, 2).join(', ') + ', and ' + prefs[2];
}

// ============================================
// MAIN FUNCTION
// ============================================

export function generateSommelierResponse(
  message: string,
  userProfile: UserTasteProfile
): SommelierResponse {
  const intent = detectIntent(message);
  
  switch (intent.type) {
    case 'pairing':
      return generatePairingResponse(intent.entities.food, userProfile);
    case 'occasion':
      return generateOccasionResponse(intent.entities.occasion, userProfile);
    case 'mood':
      return generateMoodResponse(intent.entities.mood, userProfile);
    case 'style':
      return generateStyleResponse(intent.entities.style, userProfile);
    case 'search':
      return generateSearchResponse(intent.entities.query, userProfile);
    case 'recommendation':
      return generateRecommendationResponse(userProfile);
    case 'education':
      return generateEducationResponse(intent.entities.topic);
    default:
      return {
        message: "I'm your personal beer sommelier! 🍺\n\nI know your taste profile and can recommend the perfect beer for any situation. Try asking me:\n\n• What should I try tonight?\n• What pairs with [food]?\n• Something for a special occasion\n• Help me try something new\n• What is an IPA?\n\nOr just tell me what you're in the mood for!",
        followUp: [
          "What beer should I try tonight?",
          "What pairs with pizza?",
          "Best beer for a hot day?",
        ],
      };
  }
}
