import { MetadataProvider, MetadataProviderResult, BeerMetadata } from '@/types';
import { getUserCatalogEntry } from './firebase';
import { OPEN_FOOD_FACTS_API } from '@/config/firebase.config';

// ============================================
// USER CATALOG PROVIDER (Priority 1)
// Checks user's own previous entries for the barcode
// ============================================

const UserCatalogProvider: MetadataProvider = {
  name: 'user_catalog',
  priority: 1,
  
  async lookup(barcode: string, userId?: string): Promise<MetadataProviderResult> {
    if (!userId) {
      return { found: false, source: 'user_catalog', metadata: null };
    }
    
    try {
      const existingEntry = await getUserCatalogEntry(userId, barcode);
      
      if (existingEntry) {
        const metadata: BeerMetadata = {
          barcode,
          name: existingEntry.name,
          brand: existingEntry.brand,
          style: existingEntry.style,
          abv: existingEntry.abv,
          ibu: existingEntry.ibu,
          country: existingEntry.beerCountry,
          description: existingEntry.description,
          imageUrl: existingEntry.photoUrls?.[0],
        };
        
        return { found: true, source: 'user_catalog', metadata };
      }
      
      return { found: false, source: 'user_catalog', metadata: null };
    } catch (error) {
      console.error('UserCatalogProvider error:', error);
      return { found: false, source: 'user_catalog', metadata: null };
    }
  },
};

// ============================================
// OPEN FOOD FACTS PROVIDER (Priority 2)
// Free, open-source food/beverage database
// ============================================

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  categories?: string;
  alcohol_100g?: number;
  image_url?: string;
  countries?: string;
  generic_name?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

function extractBeerStyle(categories: string): string | undefined {
  const categoryLower = categories.toLowerCase();
  
  // Map common category patterns to beer styles
  const styleMap: Record<string, string> = {
    'ipa': 'IPA',
    'pale ale': 'Pale Ale',
    'lager': 'Lager',
    'pilsner': 'Pilsner',
    'stout': 'Stout',
    'porter': 'Porter',
    'wheat': 'Wheat Beer',
    'hefeweizen': 'Hefeweizen',
    'witbier': 'Witbier',
    'belgian': 'Belgian Ale',
    'saison': 'Saison',
    'sour': 'Sour',
    'amber': 'Amber Ale',
    'brown ale': 'Brown Ale',
    'bock': 'Bock',
  };
  
  for (const [pattern, style] of Object.entries(styleMap)) {
    if (categoryLower.includes(pattern)) {
      return style;
    }
  }
  
  // Check if it's beer at all
  if (categoryLower.includes('beer') || categoryLower.includes('bière') || 
      categoryLower.includes('bier') || categoryLower.includes('cerveza')) {
    return undefined; // It's beer but style unknown
  }
  
  return undefined;
}

const OpenFoodFactsProvider: MetadataProvider = {
  name: 'openfoodfacts',
  priority: 2,
  
  async lookup(barcode: string): Promise<MetadataProviderResult> {
    try {
      const response = await fetch(
        `${OPEN_FOOD_FACTS_API}/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'BeerDiary/1.0 (contact@beerdiary.app)',
          },
        }
      );
      
      if (!response.ok) {
        return { found: false, source: 'openfoodfacts', metadata: null };
      }
      
      const data: OpenFoodFactsResponse = await response.json();
      
      if (data.status !== 1 || !data.product) {
        return { found: false, source: 'openfoodfacts', metadata: null };
      }
      
      const product = data.product;
      
      // Check if this is actually a beer/alcoholic beverage
      const categories = product.categories || '';
      const isBeer = 
        categories.toLowerCase().includes('beer') ||
        categories.toLowerCase().includes('bière') ||
        categories.toLowerCase().includes('bier') ||
        categories.toLowerCase().includes('cerveza') ||
        (product.alcohol_100g && product.alcohol_100g > 0);
      
      if (!isBeer && !product.alcohol_100g) {
        // Not a beer, skip
        return { found: false, source: 'openfoodfacts', metadata: null };
      }
      
      const metadata: BeerMetadata = {
        barcode,
        name: product.product_name || 'Unknown Beer',
        brand: product.brands?.split(',')[0]?.trim(),
        style: extractBeerStyle(categories),
        abv: product.alcohol_100g ? product.alcohol_100g : undefined,
        country: product.countries?.split(',')[0]?.trim(),
        description: product.generic_name,
        imageUrl: product.image_url,
      };
      
      return { found: true, source: 'openfoodfacts', metadata };
    } catch (error) {
      console.error('OpenFoodFactsProvider error:', error);
      return { found: false, source: 'openfoodfacts', metadata: null };
    }
  },
};

// ============================================
// STUB PROVIDER (Priority 3 - Fallback)
// Returns a minimal stub when no data found
// ============================================

const StubProvider: MetadataProvider = {
  name: 'stub',
  priority: 3,
  
  async lookup(barcode: string): Promise<MetadataProviderResult> {
    // Return a stub with just the barcode
    const metadata: BeerMetadata = {
      barcode,
      name: '', // User must fill in
    };
    
    return { found: true, source: 'stub', metadata };
  },
};

// ============================================
// METADATA PROVIDER CHAIN
// ============================================

const providers: MetadataProvider[] = [
  UserCatalogProvider,
  OpenFoodFactsProvider,
  StubProvider,
].sort((a, b) => a.priority - b.priority);

/**
 * Look up beer metadata by barcode
 * Tries providers in priority order until one returns data
 */
export async function lookupBeerByBarcode(
  barcode: string,
  userId?: string
): Promise<MetadataProviderResult> {
  for (const provider of providers) {
    const result = await provider.lookup(barcode, userId);
    
    if (result.found && result.metadata?.name) {
      // Provider found actual data (not just a stub with empty name)
      return result;
    }
    
    // For stub provider, always return (it's the fallback)
    if (provider.name === 'stub') {
      return result;
    }
  }
  
  // Should never reach here due to stub provider
  return { found: false, source: 'stub', metadata: null };
}

/**
 * Get all available providers (for debugging/UI)
 */
export function getProviders(): MetadataProvider[] {
  return [...providers];
}
