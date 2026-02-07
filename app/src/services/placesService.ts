// Places Service - Find breweries, bars, and beer stores
// Uses Google Places API

import { GeoPoint } from '@/types';

// ============================================
// TYPES
// ============================================

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  location: GeoPoint;
  address: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: number; // 1-4 ($-$$$$)
  isOpen?: boolean;
  hours?: string[];
  phone?: string;
  website?: string;
  photos?: string[];
  distance?: number; // meters from search point
  tags: string[];
}

export type PlaceType = 
  | 'brewery' 
  | 'craft_beer_bar' 
  | 'beer_store' 
  | 'pub' 
  | 'restaurant_with_beer'
  | 'taproom';

export interface PlaceSearchOptions {
  center: GeoPoint;
  radiusMeters?: number;
  types?: PlaceType[];
  openNow?: boolean;
  minRating?: number;
  limit?: number;
}

export interface PlaceDetails extends Place {
  reviews?: PlaceReview[];
  beerSelection?: BeerSelection;
}

export interface PlaceReview {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface BeerSelection {
  tapCount?: number;
  bottleCount?: number;
  specialties?: string[];
  hasCraftBeer: boolean;
  hasLocalBeer: boolean;
}

// ============================================
// GOOGLE PLACES API
// ============================================

const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // Configure in app config
const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';

// Type mappings for Google Places
const GOOGLE_TYPE_MAP: Record<PlaceType, string[]> = {
  brewery: ['brewery'],
  craft_beer_bar: ['bar', 'night_club'],
  beer_store: ['liquor_store', 'store'],
  pub: ['bar'],
  restaurant_with_beer: ['restaurant'],
  taproom: ['brewery', 'bar'],
};

// Keywords for better search results
const PLACE_KEYWORDS: Record<PlaceType, string[]> = {
  brewery: ['brewery', 'brewing company', 'brewpub'],
  craft_beer_bar: ['craft beer', 'tap house', 'beer bar', 'ale house'],
  beer_store: ['craft beer store', 'bottle shop', 'beer shop'],
  pub: ['pub', 'tavern', 'irish pub', 'english pub'],
  restaurant_with_beer: ['beer garden', 'gastropub'],
  taproom: ['taproom', 'tasting room'],
};

// ============================================
// SEARCH FUNCTIONS
// ============================================

export async function searchPlaces(options: PlaceSearchOptions): Promise<Place[]> {
  const {
    center,
    radiusMeters = 5000,
    types = ['brewery', 'craft_beer_bar', 'beer_store'],
    openNow = false,
    minRating = 0,
    limit = 20,
  } = options;

  try {
    // Build search queries for each type
    const searches = types.map(async (type) => {
      const googleTypes = GOOGLE_TYPE_MAP[type];
      const keywords = PLACE_KEYWORDS[type];
      
      const params = new URLSearchParams({
        location: `${center.latitude},${center.longitude}`,
        radius: radiusMeters.toString(),
        type: googleTypes[0],
        keyword: keywords.join('|'),
        key: GOOGLE_PLACES_API_KEY,
      });
      
      if (openNow) {
        params.append('opennow', 'true');
      }
      
      const response = await fetch(
        `${PLACES_API_URL}/nearbysearch/json?${params}`
      );
      
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn('Places API error:', data.status);
        return [];
      }
      
      return (data.results || []).map((place: any) => 
        transformGooglePlace(place, type, center)
      );
    });
    
    const results = await Promise.all(searches);
    const allPlaces = results.flat();
    
    // Filter by rating
    const filtered = allPlaces.filter(p => (p.rating || 0) >= minRating);
    
    // Sort by distance
    filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Deduplicate by place ID
    const seen = new Set<string>();
    const unique = filtered.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    
    return unique.slice(0, limit);
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,opening_hours,photos,reviews,geometry',
      key: GOOGLE_PLACES_API_KEY,
    });
    
    const response = await fetch(
      `${PLACES_API_URL}/details/json?${params}`
    );
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.warn('Place details error:', data.status);
      return null;
    }
    
    return transformPlaceDetails(data.result);
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

function transformGooglePlace(place: any, type: PlaceType, searchCenter: GeoPoint): Place {
  const location: GeoPoint = {
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  };
  
  return {
    id: place.place_id,
    name: place.name,
    type,
    location,
    address: place.vicinity || place.formatted_address || '',
    rating: place.rating,
    ratingCount: place.user_ratings_total,
    priceLevel: place.price_level,
    isOpen: place.opening_hours?.open_now,
    photos: place.photos?.map((p: any) => getPhotoUrl(p.photo_reference)),
    distance: calculateDistance(searchCenter, location),
    tags: extractTags(place),
  };
}

function transformPlaceDetails(place: any): PlaceDetails {
  const location: GeoPoint = {
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  };
  
  return {
    id: place.place_id,
    name: place.name,
    type: 'brewery', // Would need context to determine
    location,
    address: place.formatted_address || '',
    rating: place.rating,
    ratingCount: place.user_ratings_total,
    priceLevel: place.price_level,
    isOpen: place.opening_hours?.open_now,
    hours: place.opening_hours?.weekday_text,
    phone: place.formatted_phone_number,
    website: place.website,
    photos: place.photos?.map((p: any) => getPhotoUrl(p.photo_reference)),
    tags: [],
    reviews: place.reviews?.slice(0, 5).map((r: any) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      date: new Date(r.time * 1000).toLocaleDateString(),
    })),
  };
}

function getPhotoUrl(photoReference: string): string {
  return `${PLACES_API_URL}/photo?maxwidth=400&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

function extractTags(place: any): string[] {
  const tags: string[] = [];
  
  if (place.types?.includes('brewery')) tags.push('Brewery');
  if (place.types?.includes('bar')) tags.push('Bar');
  if (place.types?.includes('restaurant')) tags.push('Restaurant');
  if (place.opening_hours?.open_now) tags.push('Open Now');
  if (place.price_level === 1) tags.push('Budget-Friendly');
  if (place.price_level >= 3) tags.push('Upscale');
  if (place.rating >= 4.5) tags.push('Highly Rated');
  
  return tags;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }
  return `${Math.round(km)}km`;
}

export function formatPriceLevel(level?: number): string {
  if (!level) return '';
  return '$'.repeat(level);
}

// ============================================
// MOCK DATA (for development without API key)
// ============================================

export const MOCK_PLACES: Place[] = [
  {
    id: 'mock-1',
    name: 'Lone Pint Brewery',
    type: 'brewery',
    location: { latitude: 29.7604, longitude: -95.3698 },
    address: '507 Commerce St, Houston, TX',
    rating: 4.6,
    ratingCount: 892,
    priceLevel: 2,
    isOpen: true,
    distance: 1200,
    tags: ['Brewery', 'Taproom', 'Open Now', 'Highly Rated'],
  },
  {
    id: 'mock-2',
    name: 'Saint Arnold Brewing Company',
    type: 'brewery',
    location: { latitude: 29.7825, longitude: -95.3530 },
    address: '2000 Lyons Ave, Houston, TX',
    rating: 4.7,
    ratingCount: 3421,
    priceLevel: 2,
    isOpen: true,
    distance: 2500,
    tags: ['Brewery', 'Beer Garden', 'Tours', 'Highly Rated'],
  },
  {
    id: 'mock-3',
    name: 'Flying Saucer Draught Emporium',
    type: 'craft_beer_bar',
    location: { latitude: 29.7595, longitude: -95.3625 },
    address: '705 Main St, Houston, TX',
    rating: 4.4,
    ratingCount: 1567,
    priceLevel: 2,
    isOpen: true,
    distance: 800,
    tags: ['Bar', '200+ Taps', 'Open Now'],
  },
  {
    id: 'mock-4',
    name: 'Hay Merchant',
    type: 'craft_beer_bar',
    location: { latitude: 29.7506, longitude: -95.3898 },
    address: '1100 Westheimer Rd, Houston, TX',
    rating: 4.5,
    ratingCount: 1234,
    priceLevel: 2,
    isOpen: false,
    distance: 3200,
    tags: ['Bar', 'Gastropub', 'Craft Beer', 'Highly Rated'],
  },
  {
    id: 'mock-5',
    name: 'Spec\'s Wines, Spirits & Finer Foods',
    type: 'beer_store',
    location: { latitude: 29.7449, longitude: -95.3838 },
    address: '2410 Smith St, Houston, TX',
    rating: 4.3,
    ratingCount: 567,
    priceLevel: 2,
    isOpen: true,
    distance: 1800,
    tags: ['Store', 'Large Selection', 'Open Now'],
  },
];

// Use mock data if no API key configured
export async function searchPlacesWithFallback(options: PlaceSearchOptions): Promise<Place[]> {
  if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
    // Return mock data adjusted for distance
    return MOCK_PLACES.filter(p => {
      if (options.types && !options.types.includes(p.type)) return false;
      if (options.openNow && !p.isOpen) return false;
      if (options.minRating && (p.rating || 0) < options.minRating) return false;
      return true;
    }).slice(0, options.limit || 20);
  }
  
  return searchPlaces(options);
}
