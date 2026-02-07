// OpenAI Integration for AI Beer Sommelier
// Real AI-powered beer recommendations

// ===========================================
// CONFIGURATION
// ===========================================

let OPENAI_API_KEY: string | null = null;

export function setOpenAIKey(key: string) {
  OPENAI_API_KEY = key;
}

export function hasOpenAIKey(): boolean {
  return OPENAI_API_KEY !== null && OPENAI_API_KEY.length > 0;
}

// ===========================================
// SYSTEM PROMPTS
// ===========================================

const SOMMELIER_SYSTEM_PROMPT = `You are an expert AI Beer Sommelier with deep knowledge of:

- Beer styles (lagers, ales, stouts, IPAs, sours, wheat beers, etc.)
- Flavor profiles (hoppy, malty, fruity, roasted, crisp, etc.)
- Food pairings
- Brewing processes and ingredients
- Craft breweries and beer culture
- Seasonal recommendations

GUIDELINES:
1. Be enthusiastic and approachable, not pretentious
2. Give specific beer recommendations with reasoning
3. Consider the user's mood, occasion, and preferences
4. Use sensory language to describe beers
5. Suggest food pairings when relevant
6. For beginners, explain beer terms simply
7. Use emojis sparingly but effectively

KNOWLEDGE:
- IBU (International Bitterness Units): 0-20 low, 20-40 medium, 40+ high
- ABV ranges: Session <5%, Standard 5-7%, Strong 7%+
- Serving temps: Lagers 38-45°F, Ales 45-55°F, Stouts 50-55°F
- Glassware matters: Pilsner glass, pint, snifter, tulip, etc.

Always be helpful and make the user excited about trying new beers!`;

const BEER_ANALYSIS_PROMPT = `Analyze this beer based on the provided information and generate:
1. Flavor profile description
2. Best food pairings
3. Similar beers to try
4. Ideal occasions
5. Serving suggestions

Respond in JSON format:
{
  "flavorProfile": "string description",
  "foodPairings": ["array", "of", "pairings"],
  "similarBeers": ["array", "of", "beers"],
  "occasions": ["array", "of", "occasions"],
  "servingTemp": "temperature range",
  "glassware": "recommended glass type",
  "rating": number 1-5
}`;

// ===========================================
// CHAT API
// ===========================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: {
    favoriteStyles?: string[];
    recentBeers?: string[];
    occasion?: string;
  }
): Promise<ChatResponse> {
  if (!OPENAI_API_KEY) {
    // Fallback to local AI
    return {
      success: true,
      message: getLocalResponse(userMessage),
    };
  }

  try {
    let contextString = '';
    if (context) {
      contextString = `\n\nUSER CONTEXT:
- Favorite styles: ${context.favoriteStyles?.join(', ') || 'Not specified'}
- Recent beers enjoyed: ${context.recentBeers?.join(', ') || 'None logged'}
- Current occasion: ${context.occasion || 'General'}`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SOMMELIER_SYSTEM_PROMPT + contextString },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return {
      success: true,
      message: data.choices[0].message.content,
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return {
      success: true,
      message: getLocalResponse(userMessage),
    };
  }
}

// ===========================================
// BEER RECOMMENDATIONS
// ===========================================

interface BeerRecommendation {
  beers: {
    name: string;
    style: string;
    reason: string;
    confidence: number;
  }[];
}

export async function getRecommendations(
  mood: string,
  occasion: string,
  preferences: {
    likesBitter?: boolean;
    likesSweet?: boolean;
    likesSour?: boolean;
    preferredStrength?: 'light' | 'medium' | 'strong';
  }
): Promise<BeerRecommendation> {
  if (!OPENAI_API_KEY) {
    return getLocalRecommendations(mood, occasion, preferences);
  }

  try {
    const prompt = `Recommend 3 beers for someone who:
- Mood: ${mood}
- Occasion: ${occasion}
- Likes bitter: ${preferences.likesBitter ?? 'unknown'}
- Likes sweet: ${preferences.likesSweet ?? 'unknown'}
- Likes sour: ${preferences.likesSour ?? 'unknown'}
- Preferred strength: ${preferences.preferredStrength || 'any'}

Respond in JSON:
{
  "beers": [
    {"name": "Beer Name", "style": "Style", "reason": "Why this fits", "confidence": 0.9}
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a beer expert. Respond only in valid JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error('API failed');

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response');
  } catch (error) {
    return getLocalRecommendations(mood, occasion, preferences);
  }
}

// ===========================================
// BEER ANALYSIS
// ===========================================

export async function analyzeBeer(
  beerName: string,
  style: string,
  abv?: number,
  ibu?: number
): Promise<any> {
  if (!OPENAI_API_KEY) {
    return getLocalAnalysis(beerName, style);
  }

  try {
    const prompt = `Analyze this beer:
Name: ${beerName}
Style: ${style}
ABV: ${abv || 'Unknown'}%
IBU: ${ibu || 'Unknown'}

${BEER_ANALYSIS_PROMPT}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a beer expert. Respond only in valid JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
      }),
    });

    if (!response.ok) throw new Error('API failed');

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid response');
  } catch (error) {
    return getLocalAnalysis(beerName, style);
  }
}

// ===========================================
// LOCAL FALLBACKS
// ===========================================

function getLocalResponse(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('ipa') || q.includes('hoppy')) {
    return `🍺 **IPA Recommendations**

IPAs are all about hops! Here are my picks:

**For hop lovers:**
- **Sierra Nevada Torpedo** — Classic West Coast IPA, citrus & pine
- **Lagunitas IPA** — Balanced bitterness, floral notes
- **Bell's Two Hearted** — Centennial hops, grapefruit finish

**For IPA beginners:**
- **Founders All Day IPA** — Session strength, easy drinking
- **Dogfish Head 60 Minute** — Balanced, not overwhelming

Pair with: Spicy foods, burgers, sharp cheeses 🧀`;
  }
  
  if (q.includes('stout') || q.includes('dark') || q.includes('chocolate') || q.includes('coffee')) {
    return `🍺 **Stout Recommendations**

Dark, rich, and delicious! Try these:

**Classic Stouts:**
- **Guinness Draught** — Smooth, creamy, iconic
- **Left Hand Milk Stout** — Sweet, velvety, nitro version is amazing
- **Founders Breakfast Stout** — Coffee & chocolate heaven

**Imperial Stouts (stronger):**
- **North Coast Old Rasputin** — Bold, complex, 9% ABV
- **Founders KBS** — Bourbon barrel aged perfection

Pair with: Desserts, oysters, BBQ 🍖`;
  }
  
  if (q.includes('light') || q.includes('easy') || q.includes('session') || q.includes('summer')) {
    return `🍺 **Light & Refreshing Picks**

Perfect for easy drinking:

**Crisp Lagers:**
- **Pilsner Urquell** — The original pilsner, crisp & clean
- **Modelo Especial** — Refreshing with lime
- **Sam Adams Boston Lager** — Flavorful but approachable

**Wheat Beers:**
- **Blue Moon** — Orange & coriander, very smooth
- **Weihenstephaner Hefeweizen** — Banana & clove, classic

Pair with: Salads, seafood, sunny patios ☀️`;
  }
  
  return `🍺 **Beer Sommelier Here!**

I'd love to help you find the perfect beer! Tell me:

- **Your mood** — Relaxing? Celebrating? Adventurous?
- **Occasion** — Dinner party? Game day? Just unwinding?
- **Flavors you like** — Hoppy? Malty? Fruity? Crisp?

Or ask me about specific styles like:
- "What's a good IPA for beginners?"
- "Best stout for chocolate lovers?"
- "Light beer that actually has flavor?"

What sounds good? 🍻`;
}

function getLocalRecommendations(mood: string, occasion: string, preferences: any): BeerRecommendation {
  // Simple local recommendations based on mood/occasion
  const recommendations: BeerRecommendation = { beers: [] };
  
  if (mood.toLowerCase().includes('relax') || occasion.toLowerCase().includes('evening')) {
    recommendations.beers = [
      { name: 'Guinness Draught', style: 'Stout', reason: 'Smooth and relaxing', confidence: 0.85 },
      { name: 'Blue Moon', style: 'Wheat Beer', reason: 'Easy drinking, mellow', confidence: 0.80 },
      { name: 'Sam Adams Boston Lager', style: 'Lager', reason: 'Classic, not too heavy', confidence: 0.75 },
    ];
  } else if (mood.toLowerCase().includes('celebrat') || occasion.toLowerCase().includes('party')) {
    recommendations.beers = [
      { name: 'Stella Artois', style: 'Pilsner', reason: 'Crowd pleaser', confidence: 0.85 },
      { name: 'Lagunitas IPA', style: 'IPA', reason: 'Flavorful conversation starter', confidence: 0.80 },
      { name: 'Modelo Especial', style: 'Lager', reason: 'Refreshing for groups', confidence: 0.75 },
    ];
  } else {
    recommendations.beers = [
      { name: 'Sierra Nevada Pale Ale', style: 'Pale Ale', reason: 'Great all-rounder', confidence: 0.85 },
      { name: 'Pilsner Urquell', style: 'Pilsner', reason: 'Classic and crisp', confidence: 0.80 },
      { name: 'Bell\'s Two Hearted', style: 'IPA', reason: 'Award-winning favorite', confidence: 0.75 },
    ];
  }
  
  return recommendations;
}

function getLocalAnalysis(beerName: string, style: string): any {
  return {
    flavorProfile: `${style} with characteristic flavors typical of the style`,
    foodPairings: ['Burgers', 'Pizza', 'Grilled meats', 'Cheese'],
    similarBeers: ['Other beers in the ' + style + ' category'],
    occasions: ['Casual dining', 'Happy hour', 'Weekend relaxation'],
    servingTemp: '45-50°F',
    glassware: 'Pint glass',
    rating: 4,
  };
}
