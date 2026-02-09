// AI Service for Beer Sommelier
// Dual provider support (OpenAI + Anthropic) with automatic failover
// Smart model selection based on task complexity

import Constants from 'expo-constants';

// ============================================
// CONFIGURATION
// ============================================

type Provider = 'openai' | 'anthropic';
type ModelTier = 'fast' | 'standard' | 'powerful';

interface ProviderConfig {
  apiKey: string;
  models: Record<ModelTier, string>;
}

interface AIConfig {
  primaryProvider: Provider;
  providers: Record<Provider, ProviderConfig>;
}

// Runtime API key storage (can be set from settings)
let runtimeKeys: { openai?: string; anthropic?: string } = {};

export const setAPIKey = (provider: Provider, key: string) => {
  runtimeKeys[provider] = key;
};

export const hasAPIKey = (provider?: Provider): boolean => {
  const config = getConfig();
  if (provider) {
    return !!config.providers[provider].apiKey;
  }
  return !!config.providers.openai.apiKey || !!config.providers.anthropic.apiKey;
};

const getConfig = (): AIConfig => {
  const openaiKey = runtimeKeys.openai || 
    Constants.expoConfig?.extra?.openaiApiKey || 
    process.env.OPENAI_API_KEY || '';
  const anthropicKey = runtimeKeys.anthropic || 
    Constants.expoConfig?.extra?.anthropicApiKey || 
    process.env.ANTHROPIC_API_KEY || '';
  
  // Prefer Anthropic if available (better at creative tasks)
  const primaryProvider: Provider = anthropicKey ? 'anthropic' : 'openai';

  return {
    primaryProvider,
    providers: {
      openai: {
        apiKey: openaiKey,
        models: {
          fast: 'gpt-4o-mini',
          standard: 'gpt-4o',
          powerful: 'gpt-4o',
        },
      },
      anthropic: {
        apiKey: anthropicKey,
        models: {
          fast: 'claude-3-5-haiku-20241022',
          standard: 'claude-sonnet-4-20250514',
          powerful: 'claude-sonnet-4-20250514',
        },
      },
    },
  };
};

const getAvailableProviders = (): Provider[] => {
  const config = getConfig();
  const available: Provider[] = [];
  if (config.providers.anthropic.apiKey) available.push('anthropic');
  if (config.providers.openai.apiKey) available.push('openai');
  
  // Put primary first
  if (available.length > 1 && available[0] !== config.primaryProvider) {
    return [config.primaryProvider, ...available.filter(p => p !== config.primaryProvider)];
  }
  return available;
};

// ============================================
// SYSTEM PROMPTS
// ============================================

const SOMMELIER_SYSTEM_PROMPT = `You are an expert AI Beer Sommelier — knowledgeable, enthusiastic, and approachable. Never pretentious.

## Your Expertise
- All beer styles: lagers, ales, IPAs, stouts, sours, wheat beers, saisons, pilsners, etc.
- Flavor science: hops (citrus, pine, tropical, floral), malts (caramel, chocolate, coffee, bread), yeast (fruity esters, spicy phenols)
- Food pairings based on flavor principles (complement, contrast, cut)
- Brewing processes, ingredients, and craft beer culture
- Major breweries worldwide + craft scene knowledge

## Personality
- Enthusiastic but not over the top
- Explain simply without dumbing down
- Use sensory language that makes people thirsty
- Sprinkle in beer facts naturally
- Use emojis sparingly (🍺 🍻 occasionally)

## Key Knowledge
- IBU: 0-20 mild, 20-45 moderate, 45+ bitter
- ABV: <4% session, 4-6% standard, 6-8% strong, 8%+ imperial
- Serving temps: Lagers 38-45°F, Ales 45-55°F, Stouts/Belgians 50-60°F
- Glassware matters: tulip for aromatics, pint for ales, pilsner glass for lagers, snifter for strong beers

## Rules
1. Give specific recommendations with reasoning
2. Consider user's taste profile and history when provided
3. Suggest food pairings when relevant
4. Be honest about beers you'd skip
5. Make the user excited to try something new`;

const ANALYSIS_SYSTEM_PROMPT = `You are a beer analysis expert. Provide detailed, accurate information about beers based on their style, origin, and characteristics. Always respond in valid JSON format.`;

const PAIRING_SYSTEM_PROMPT = `You are a beer and food pairing expert. Your recommendations are based on flavor science: complement (similar flavors enhance), contrast (opposites balance), and cut (carbonation/bitterness cleanse palate). Be specific and explain why pairings work.`;

// ============================================
// API CALLS
// ============================================

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  provider: Provider;
  model: string;
  error?: string;
}

const callOpenAI = async (
  config: ProviderConfig,
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model,
  };
};

const callAnthropic = async (
  config: ProviderConfig,
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIResponse> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model,
  };
};

// Call with automatic failover
const callWithFailover = async (
  systemPrompt: string,
  messages: Message[],
  tier: ModelTier = 'standard',
  maxTokens: number = 600,
  temperature: number = 0.7
): Promise<AIResponse> => {
  const config = getConfig();
  const providers = getAvailableProviders();
  
  if (providers.length === 0) {
    return {
      content: '',
      provider: 'openai',
      model: '',
      error: 'No API keys configured',
    };
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    const providerConfig = config.providers[provider];
    const model = providerConfig.models[tier];

    try {
      if (provider === 'openai') {
        return await callOpenAI(providerConfig, systemPrompt, messages, model, maxTokens, temperature);
      } else {
        return await callAnthropic(providerConfig, systemPrompt, messages, model, maxTokens, temperature);
      }
    } catch (error) {
      console.warn(`${provider} failed, trying next...`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return {
    content: '',
    provider: providers[0],
    model: '',
    error: lastError?.message || 'All providers failed',
  };
};

// ============================================
// PUBLIC API: CHAT
// ============================================

export interface ChatContext {
  favoriteStyles?: string[];
  dislikedStyles?: string[];
  recentBeers?: string[];
  tasteProfile?: {
    likesBitter?: boolean;
    likesMalty?: boolean;
    likesSour?: boolean;
    likesStrong?: boolean;
  };
  occasion?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  provider?: Provider;
  error?: string;
}

export const chat = async (
  userMessage: string,
  conversationHistory: Message[] = [],
  context?: ChatContext
): Promise<ChatResponse> => {
  // Build context string for personalization
  let contextStr = '';
  if (context) {
    const parts: string[] = [];
    if (context.favoriteStyles?.length) {
      parts.push(`Favorite styles: ${context.favoriteStyles.join(', ')}`);
    }
    if (context.dislikedStyles?.length) {
      parts.push(`Dislikes: ${context.dislikedStyles.join(', ')}`);
    }
    if (context.recentBeers?.length) {
      parts.push(`Recently enjoyed: ${context.recentBeers.slice(0, 5).join(', ')}`);
    }
    if (context.tasteProfile) {
      const prefs: string[] = [];
      if (context.tasteProfile.likesBitter) prefs.push('enjoys bitter');
      if (context.tasteProfile.likesMalty) prefs.push('enjoys malty');
      if (context.tasteProfile.likesSour) prefs.push('enjoys sour');
      if (context.tasteProfile.likesStrong) prefs.push('prefers stronger beers');
      if (prefs.length) parts.push(`Taste: ${prefs.join(', ')}`);
    }
    if (context.occasion) {
      parts.push(`Current occasion: ${context.occasion}`);
    }
    if (parts.length) {
      contextStr = `\n\n## User Profile\n${parts.join('\n')}`;
    }
  }

  const systemPrompt = SOMMELIER_SYSTEM_PROMPT + contextStr;

  // Prepare messages
  const messages: Message[] = [
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const response = await callWithFailover(systemPrompt, messages, 'standard', 800, 0.8);

  if (response.error) {
    // Return fallback response
    return {
      success: true,
      message: getLocalChatResponse(userMessage),
    };
  }

  return {
    success: true,
    message: response.content,
    provider: response.provider,
  };
};

// ============================================
// PUBLIC API: RECOMMENDATIONS
// ============================================

export interface RecommendationParams {
  mood?: string;
  occasion?: string;
  foodPairing?: string;
  weather?: string;
  preferences?: {
    bitter?: boolean;
    malty?: boolean;
    sour?: boolean;
    strong?: boolean;
    light?: boolean;
  };
  excludeStyles?: string[];
}

export interface BeerRecommendation {
  name: string;
  style: string;
  brewery?: string;
  abv?: string;
  reason: string;
  flavorNotes: string[];
  foodPairings?: string[];
  matchScore: number;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: BeerRecommendation[];
  intro?: string;
  error?: string;
}

export const getRecommendations = async (
  params: RecommendationParams
): Promise<RecommendationResponse> => {
  const prompt = buildRecommendationPrompt(params);

  const response = await callWithFailover(
    SOMMELIER_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    'standard',
    800,
    0.7
  );

  if (response.error) {
    return {
      success: true,
      recommendations: getLocalRecommendations(params),
    };
  }

  // Parse response
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        recommendations: parsed.recommendations || parsed.beers || [],
        intro: parsed.intro,
      };
    }
  } catch (e) {
    // Response wasn't JSON, use as intro and return local recommendations
    return {
      success: true,
      recommendations: getLocalRecommendations(params),
      intro: response.content.slice(0, 200),
    };
  }

  return {
    success: true,
    recommendations: getLocalRecommendations(params),
  };
};

const buildRecommendationPrompt = (params: RecommendationParams): string => {
  const conditions: string[] = [];
  
  if (params.mood) conditions.push(`Mood: ${params.mood}`);
  if (params.occasion) conditions.push(`Occasion: ${params.occasion}`);
  if (params.foodPairing) conditions.push(`Pairing with: ${params.foodPairing}`);
  if (params.weather) conditions.push(`Weather: ${params.weather}`);
  if (params.excludeStyles?.length) conditions.push(`Avoid styles: ${params.excludeStyles.join(', ')}`);
  
  if (params.preferences) {
    const prefs: string[] = [];
    if (params.preferences.bitter) prefs.push('likes bitter/hoppy');
    if (params.preferences.malty) prefs.push('likes malty/sweet');
    if (params.preferences.sour) prefs.push('likes sour/tart');
    if (params.preferences.strong) prefs.push('prefers higher ABV');
    if (params.preferences.light) prefs.push('prefers lighter/sessionable');
    if (prefs.length) conditions.push(`Preferences: ${prefs.join(', ')}`);
  }

  return `Recommend 3 specific beers based on:
${conditions.join('\n')}

Respond in JSON:
{
  "intro": "Brief friendly intro (1-2 sentences)",
  "recommendations": [
    {
      "name": "Specific Beer Name",
      "brewery": "Brewery Name",
      "style": "Beer Style",
      "abv": "5.5%",
      "reason": "Why this fits (2 sentences)",
      "flavorNotes": ["note1", "note2", "note3"],
      "foodPairings": ["food1", "food2"],
      "matchScore": 95
    }
  ]
}`;
};

// ============================================
// PUBLIC API: BEER ANALYSIS
// ============================================

export interface BeerAnalysis {
  flavorProfile: string;
  flavorNotes: string[];
  foodPairings: string[];
  similarBeers: string[];
  bestOccasions: string[];
  servingTemp: string;
  glassware: string;
  funFact?: string;
}

export const analyzeBeer = async (
  beerName: string,
  style: string,
  abv?: number,
  ibu?: number,
  brewery?: string
): Promise<BeerAnalysis> => {
  const prompt = `Analyze this beer:
- Name: ${beerName}
- Style: ${style}
- Brewery: ${brewery || 'Unknown'}
- ABV: ${abv ? abv + '%' : 'Unknown'}
- IBU: ${ibu || 'Unknown'}

Respond in JSON:
{
  "flavorProfile": "2-3 sentence description of taste experience",
  "flavorNotes": ["primary", "secondary", "tertiary"],
  "foodPairings": ["best pairing", "good pairing", "another option"],
  "similarBeers": ["Similar Beer 1", "Similar Beer 2"],
  "bestOccasions": ["occasion 1", "occasion 2"],
  "servingTemp": "temp range",
  "glassware": "recommended glass",
  "funFact": "interesting fact about this beer or style"
}`;

  const response = await callWithFailover(
    ANALYSIS_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    'fast',
    500,
    0.5
  );

  if (response.error) {
    return getLocalAnalysis(style);
  }

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse beer analysis:', e);
  }

  return getLocalAnalysis(style);
};

// ============================================
// PUBLIC API: FOOD PAIRING
// ============================================

export interface PairingResponse {
  intro: string;
  pairings: {
    beer: string;
    style: string;
    why: string;
    confidence: 'perfect' | 'great' | 'good';
  }[];
  tips?: string;
}

export const getFoodPairing = async (food: string): Promise<PairingResponse> => {
  const prompt = `What beers pair best with: ${food}

Consider:
- Flavor complementing (similar flavors enhance each other)
- Flavor contrasting (opposites balance)
- Palate cleansing (carbonation/bitterness cuts richness)

Respond in JSON:
{
  "intro": "Brief explanation of pairing approach",
  "pairings": [
    {"beer": "Specific Beer or Style", "style": "Style Category", "why": "Why it works", "confidence": "perfect|great|good"}
  ],
  "tips": "One pro tip for this pairing"
}`;

  const response = await callWithFailover(
    PAIRING_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    'fast',
    500,
    0.6
  );

  if (response.error) {
    return getLocalPairing(food);
  }

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse pairing:', e);
  }

  return getLocalPairing(food);
};

// ============================================
// LOCAL FALLBACKS
// ============================================

const getLocalChatResponse = (message: string): string => {
  const q = message.toLowerCase();

  if (q.includes('ipa') || q.includes('hoppy')) {
    return `🍺 **IPA Recommendations**

IPAs are all about those glorious hops! Here's my lineup:

**For hop heads:**
• **Sierra Nevada Torpedo** — West Coast classic, citrus & pine bomb
• **Bell's Two Hearted** — Perfectly balanced, grapefruit finish
• **Lagunitas IPA** — Dank, resinous, dangerously drinkable

**Easing into IPAs:**
• **Founders All Day IPA** — Session strength (4.7%), all the flavor
• **Firestone Walker Mind Haze** — Hazy & juicy, less bitter

Pair with: Spicy tacos, sharp cheddar, or a big juicy burger 🍔`;
  }

  if (q.includes('stout') || q.includes('dark') || q.includes('porter')) {
    return `🍺 **Dark Beer Recommendations**

Rich, roasty, and satisfying:

**Everyday Stouts:**
• **Guinness Draught** — Smooth, creamy, lighter than it looks
• **Left Hand Milk Stout** (Nitro!) — Velvety chocolate goodness
• **Founders Porter** — Coffee notes, sessionable

**Go Big:**
• **North Coast Old Rasputin** — Imperial stout, 9%, incredible
• **Founders Breakfast Stout** — Coffee + chocolate + oats = perfection

Pair with: Chocolate desserts, oysters (trust me), or BBQ ribs 🍖`;
  }

  if (q.includes('light') || q.includes('summer') || q.includes('refreshing') || q.includes('hot')) {
    return `🍺 **Refreshing & Crushable**

Perfect for easy drinking:

**Crisp Lagers:**
• **Pilsner Urquell** — The OG pilsner, perfectly crisp
• **Firestone Walker Pivo Pils** — Dry-hopped, elevated
• **Modelo Especial** — Beach day classic

**Wheat & Light Ales:**
• **Allagash White** — Belgian wit, orange & coriander
• **Weihenstephaner Hefe** — World's oldest brewery, banana & clove

Pro tip: Serve these COLD (38-45°F) for maximum refreshment ☀️`;
  }

  if (q.includes('sour') || q.includes('tart') || q.includes('fruit')) {
    return `🍺 **Sour & Fruited Beers**

For the adventurous palate:

**Gateway Sours:**
• **Dogfish Head SeaQuench** — Lime, sea salt, super refreshing
• **Anderson Valley Blood Orange Gose** — Tart + citrus

**Deep Cuts:**
• **Rodenbach Grand Cru** — Flemish red, complex, wine-like
• **Lindemans Kriek** — Cherry lambic, dessert beer

These pair amazingly with: Salads, goat cheese, seafood, or Asian cuisine 🍣`;
  }

  return `🍺 **Your AI Beer Sommelier**

I'm here to find your perfect beer! Tell me about:

• **Your mood** — Celebrating? Relaxing? Exploring?
• **What you're eating** — Great food deserves great beer
• **The weather** — Hot day? Cozy night?
• **Flavors you love** — Hoppy? Malty? Crisp? Funky?

Or just ask me anything:
• "What's a good IPA for beginners?"
• "Beer for spicy tacos?"
• "Something interesting I've never tried?"

What sounds good tonight? 🍻`;
};

const getLocalRecommendations = (params: RecommendationParams): BeerRecommendation[] => {
  if (params.foodPairing) {
    const food = params.foodPairing.toLowerCase();
    if (food.includes('pizza') || food.includes('burger')) {
      return [
        { name: 'Sierra Nevada Pale Ale', style: 'Pale Ale', reason: 'Hops cut through the fat, citrus brightens every bite', flavorNotes: ['citrus', 'pine', 'biscuit'], matchScore: 92 },
        { name: 'Lagunitas IPA', style: 'IPA', reason: 'Bold enough to stand up to bold flavors', flavorNotes: ['grapefruit', 'caramel', 'pine'], matchScore: 88 },
        { name: 'Pilsner Urquell', style: 'Pilsner', reason: 'Crisp and clean, refreshing palate cleanser', flavorNotes: ['bready', 'floral', 'crisp'], matchScore: 85 },
      ];
    }
    if (food.includes('steak') || food.includes('bbq')) {
      return [
        { name: 'Founders Porter', style: 'Porter', reason: 'Roasted notes complement charred meat perfectly', flavorNotes: ['chocolate', 'coffee', 'caramel'], matchScore: 94 },
        { name: 'Guinness Draught', style: 'Stout', reason: 'Classic pairing, creamy contrast to rich meat', flavorNotes: ['roast', 'coffee', 'cream'], matchScore: 90 },
        { name: 'Stone IPA', style: 'IPA', reason: 'Bitterness and hops cut through the richness', flavorNotes: ['citrus', 'pine', 'bitter'], matchScore: 86 },
      ];
    }
  }

  // Default recommendations
  return [
    { name: 'Sierra Nevada Pale Ale', style: 'Pale Ale', reason: 'Perfectly balanced, crowd-pleasing classic', flavorNotes: ['citrus', 'pine', 'malt'], matchScore: 90 },
    { name: 'Bell\'s Two Hearted', style: 'IPA', reason: 'Award-winning, beautifully crafted', flavorNotes: ['grapefruit', 'floral', 'smooth'], matchScore: 88 },
    { name: 'Allagash White', style: 'Witbier', reason: 'Refreshing and approachable', flavorNotes: ['orange', 'coriander', 'wheat'], matchScore: 85 },
  ];
};

const getLocalAnalysis = (style: string): BeerAnalysis => {
  const styleDefaults: Record<string, BeerAnalysis> = {
    'IPA': {
      flavorProfile: 'Bold hop-forward character with citrus, pine, and tropical fruit notes balanced by a malt backbone.',
      flavorNotes: ['citrus', 'pine', 'tropical fruit'],
      foodPairings: ['Spicy foods', 'Burgers', 'Sharp cheeses'],
      similarBeers: ['Sierra Nevada Torpedo', 'Lagunitas IPA', 'Bell\'s Two Hearted'],
      bestOccasions: ['Happy hour', 'Game day', 'Grilling out'],
      servingTemp: '45-50°F',
      glassware: 'Pint glass or IPA glass',
      funFact: 'IPAs were originally brewed with extra hops to survive the long ship journey from England to India.',
    },
    'Stout': {
      flavorProfile: 'Rich, roasty character with notes of coffee, chocolate, and cream. Full-bodied with a smooth finish.',
      flavorNotes: ['coffee', 'chocolate', 'roasted barley'],
      foodPairings: ['Chocolate desserts', 'Oysters', 'BBQ'],
      similarBeers: ['Guinness', 'Left Hand Milk Stout', 'Founders Breakfast Stout'],
      bestOccasions: ['Dessert pairing', 'Cold nights', 'Sunday brunch'],
      servingTemp: '50-55°F',
      glassware: 'Pint glass or tulip',
      funFact: 'Despite their dark color, stouts are often lighter in alcohol and calories than many IPAs.',
    },
  };

  return styleDefaults[style] || {
    flavorProfile: `A classic ${style} with characteristic flavors of the style.`,
    flavorNotes: ['malt', 'hops', 'yeast character'],
    foodPairings: ['Burgers', 'Pizza', 'Grilled meats'],
    similarBeers: ['Other quality examples of the style'],
    bestOccasions: ['Casual dining', 'Happy hour', 'Weekend relaxation'],
    servingTemp: '45-50°F',
    glassware: 'Pint glass',
    funFact: 'Beer is one of the oldest beverages humans have produced, dating back to at least 5,000 BCE.',
  };
};

const getLocalPairing = (food: string): PairingResponse => {
  const lower = food.toLowerCase();

  if (lower.includes('pizza')) {
    return {
      intro: 'Pizza and beer are a legendary combo. The key is matching intensity — lighter toppings, lighter beer.',
      pairings: [
        { beer: 'Peroni', style: 'Lager', why: 'Crisp and clean, classic Italian pairing', confidence: 'perfect' },
        { beer: 'Sierra Nevada Pale Ale', style: 'Pale Ale', why: 'Hops cut through cheese, citrus brightens tomato', confidence: 'great' },
        { beer: 'Lagunitas IPA', style: 'IPA', why: 'For meat lovers pizza — bold flavors need bold beer', confidence: 'good' },
      ],
      tips: 'For white pizza or lighter toppings, go with a pilsner or wheat beer instead.',
    };
  }

  return {
    intro: `Great choice! Let me suggest some beers that would complement ${food} beautifully.`,
    pairings: [
      { beer: 'Sierra Nevada Pale Ale', style: 'Pale Ale', why: 'Versatile pairing that works with most foods', confidence: 'great' },
      { beer: 'Pilsner Urquell', style: 'Pilsner', why: 'Clean and refreshing, palate cleansing', confidence: 'good' },
      { beer: 'Blue Moon', style: 'Wheat Beer', why: 'Light and approachable, food-friendly', confidence: 'good' },
    ],
    tips: 'When in doubt, match intensity — bold food with bold beer, delicate food with lighter styles.',
  };
};

// ============================================
// EXPORTS
// ============================================

export const BeerAI = {
  chat,
  getRecommendations,
  analyzeBeer,
  getFoodPairing,
  setAPIKey,
  hasAPIKey,
};

export default BeerAI;
