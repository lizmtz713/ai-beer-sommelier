import { z } from 'zod';

// ============================================
// ENTRY STATE MACHINE
// ============================================
export const EntryStatus = {
  DRAFT: 'draft',
  UPLOADING: 'uploading',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

export type EntryStatusType = typeof EntryStatus[keyof typeof EntryStatus];

// ============================================
// ZOD SCHEMAS
// ============================================

// Location schema
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().optional(),
  country: z.string().optional(),
  placeName: z.string().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

// Beer metadata schema (from providers)
export const BeerMetadataSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(1),
  brand: z.string().optional(),
  style: z.string().optional(),
  abv: z.number().min(0).max(100).optional(),
  ibu: z.number().min(0).optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type BeerMetadata = z.infer<typeof BeerMetadataSchema>;

// Entry creation schema (user input)
export const EntryInputSchema = z.object({
  // Required
  name: z.string().min(1, 'Beer name is required'),
  ratingNum: z.number().min(0).max(5),
  
  // Optional metadata
  barcode: z.string().optional(),
  brand: z.string().optional(),
  style: z.string().optional(),
  abv: z.number().min(0).max(100).optional(),
  ibu: z.number().min(0).optional(),
  beerCountry: z.string().optional(),
  description: z.string().optional(),
  
  // User additions
  notes: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  volume: z.number().min(0).optional(),
  volumeUnit: z.enum(['ml', 'oz', 'pint']).default('ml'),
  purchaseLocation: z.string().optional(),
  
  // Toggles
  favorite: z.boolean().default(false),
  repeatBuy: z.boolean().default(false),
  wishlist: z.boolean().default(false),
  
  // Sharing (defaults OFF)
  sharePublic: z.boolean().default(false),
  shareMedia: z.boolean().default(false),
  sharePrice: z.boolean().default(false),
  
  // Location (optional, set automatically if available)
  location: LocationSchema.optional(),
  geohash: z.string().optional(),
  
  // Consumption date
  consumedAt: z.date().optional(),
});

export type EntryInput = z.infer<typeof EntryInputSchema>;

// Full entry document schema (in Firestore)
export const EntryDocSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  
  // Status
  status: z.enum(['draft', 'uploading', 'complete', 'error']),
  errorMessage: z.string().optional(),
  retryCount: z.number().default(0),
  
  // Beer info
  name: z.string(),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  style: z.string().optional(),
  abv: z.number().optional(),
  ibu: z.number().optional(),
  beerCountry: z.string().optional(),
  description: z.string().optional(),
  
  // Rating & notes
  ratingNum: z.number().min(0).max(5),
  notes: z.string().optional(),
  
  // Price info
  price: z.number().optional(),
  currency: z.string().optional(),
  volume: z.number().optional(),
  volumeUnit: z.enum(['ml', 'oz', 'pint']).optional(),
  purchaseLocation: z.string().optional(),
  
  // Toggles
  favorite: z.boolean().default(false),
  repeatBuy: z.boolean().default(false),
  wishlist: z.boolean().default(false),
  
  // Sharing
  sharePublic: z.boolean().default(false),
  shareMedia: z.boolean().default(false),
  sharePrice: z.boolean().default(false),
  
  // Location (PRIVATE - never in publicEntries)
  location: LocationSchema.optional(),
  geohash: z.string().optional(),
  
  // Media
  photoUrls: z.array(z.string()).default([]),
  photoUploadPending: z.boolean().default(false),
  
  // Timestamps
  consumedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EntryDoc = z.infer<typeof EntryDocSchema>;

// Public entry (subset, no location)
export const PublicEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  userDisplayName: z.string().optional(),
  
  // Beer info
  name: z.string(),
  brand: z.string().optional(),
  style: z.string().optional(),
  abv: z.number().optional(),
  
  // Rating
  ratingNum: z.number(),
  notes: z.string().optional(),
  
  // Price (only if sharePrice)
  price: z.number().optional(),
  currency: z.string().optional(),
  
  // Media (only if shareMedia)
  photoUrls: z.array(z.string()).default([]),
  
  // City only (no lat/lng/geohash!)
  city: z.string().optional(),
  country: z.string().optional(),
  
  // Timestamps
  consumedAt: z.date(),
  sharedAt: z.date(),
});

export type PublicEntry = z.infer<typeof PublicEntrySchema>;

// ============================================
// RETRY QUEUE
// ============================================

export const RetryQueueItemSchema = z.object({
  entryId: z.string().uuid(),
  action: z.enum(['upload_photo', 'update_entry', 'sync_public']),
  payload: z.record(z.unknown()),
  createdAt: z.number(), // timestamp ms
  attempts: z.number().default(0),
  lastAttempt: z.number().optional(),
  errorMessage: z.string().optional(),
});

export type RetryQueueItem = z.infer<typeof RetryQueueItemSchema>;

// ============================================
// FILTERS
// ============================================

export const FilterSchema = z.object({
  searchQuery: z.string().optional(),
  styles: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxRating: z.number().min(0).max(5).optional(),
  favorite: z.boolean().optional(),
  repeatBuy: z.boolean().optional(),
  wishlist: z.boolean().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  city: z.string().optional(),
  nearMe: z.boolean().optional(),
  radiusKm: z.number().optional(),
  sortBy: z.enum(['consumedAt', 'ratingNum', 'name', 'price']).default('consumedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type Filter = z.infer<typeof FilterSchema>;

// ============================================
// USER
// ============================================

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  createdAt: z.date(),
  lastCity: z.string().optional(),
  lastCountry: z.string().optional(),
  preferences: z.object({
    defaultCurrency: z.string().default('USD'),
    defaultVolumeUnit: z.enum(['ml', 'oz', 'pint']).default('ml'),
    sharePublicDefault: z.boolean().default(false),
  }).optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ============================================
// INSIGHTS
// ============================================

export interface CityStats {
  city: string;
  country: string;
  count: number;
  avgRating: number;
  topBeer: string;
}

export interface StyleStats {
  style: string;
  count: number;
  avgRating: number;
}

export interface Insights {
  totalEntries: number;
  totalCities: number;
  totalStyles: number;
  avgRating: number;
  
  bestByCity: CityStats[];
  cheapest4Stars: EntryDoc[];
  mostTriedStyles: StyleStats[];
  repeatBuyRate: number;
  wishlistConversionRate: number;
  
  recentActivity: {
    lastWeekCount: number;
    lastMonthCount: number;
  };
}

// ============================================
// METADATA PROVIDER
// ============================================

export interface MetadataProviderResult {
  found: boolean;
  source: 'user_catalog' | 'openfoodfacts' | 'stub';
  metadata: BeerMetadata | null;
}

export interface MetadataProvider {
  name: string;
  priority: number;
  lookup(barcode: string, userId?: string): Promise<MetadataProviderResult>;
}

// ============================================
// GEO TYPES
// ============================================

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  geohashPrefix: string;
}

export interface NearbyQuery {
  center: GeoPoint;
  radiusKm: number;
  filters?: Filter;
  limit?: number;
  startAfter?: string;
}
