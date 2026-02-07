// App-wide constants

// Geo query limits
export const GEO_CONFIG = {
  MAX_RADIUS_KM: 50,
  MAX_BOUNDS_QUERIES: 9, // 3x3 geohash grid
  LARGE_RADIUS_THRESHOLD_KM: 25,
  LARGE_RADIUS_TIME_WINDOW_DAYS: 90,
  DEFAULT_RADIUS_KM: 10,
  RADIUS_OPTIONS: [1, 5, 10, 25, 50],
  GEOHASH_PRECISION: 7, // ~150m accuracy
} as const;

// Retry queue configuration
export const RETRY_CONFIG = {
  MAX_QUEUE_SIZE: 100,
  MAX_RETRY_ATTEMPTS: 3,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;

// Image configuration
export const IMAGE_CONFIG = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
  QUALITY: 0.8,
  MAX_PHOTOS_PER_ENTRY: 5,
} as const;

// Beer styles (common styles for autocomplete/filtering)
export const BEER_STYLES = [
  'IPA',
  'Double IPA',
  'New England IPA',
  'West Coast IPA',
  'Pale Ale',
  'American Pale Ale',
  'Lager',
  'Pilsner',
  'Helles',
  'Stout',
  'Imperial Stout',
  'Porter',
  'Wheat Beer',
  'Hefeweizen',
  'Witbier',
  'Belgian Ale',
  'Belgian Tripel',
  'Belgian Dubbel',
  'Saison',
  'Sour',
  'Gose',
  'Berliner Weisse',
  'Lambic',
  'Amber Ale',
  'Red Ale',
  'Brown Ale',
  'Barleywine',
  'Bock',
  'Doppelbock',
  'Märzen',
  'Kölsch',
  'Cream Ale',
  'Blonde Ale',
  'Scottish Ale',
  'Schwarzbier',
  'Dunkel',
  'Rauchbier',
  'Cider',
  'Mead',
  'Other',
] as const;

// Currency options
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
] as const;

// Volume units
export const VOLUME_UNITS = [
  { code: 'ml', name: 'Milliliters', commonSizes: [330, 355, 440, 473, 500, 568, 750, 1000] },
  { code: 'oz', name: 'Fluid Ounces', commonSizes: [12, 16, 22, 32] },
  { code: 'pint', name: 'Pints', commonSizes: [1] },
] as const;

// AsyncStorage keys
export const STORAGE_KEYS = {
  RETRY_QUEUE: '@beer_diary_retry_queue',
  SAVED_FILTERS: '@beer_diary_saved_filters',
  LAST_LOCATION: '@beer_diary_last_location',
  USER_PREFERENCES: '@beer_diary_preferences',
  DRAFT_ENTRY: '@beer_diary_draft_entry',
} as const;
