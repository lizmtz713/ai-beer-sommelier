import ngeohash from 'ngeohash';
import { GeoPoint, GeoBounds } from '@/types';
import { GEO_CONFIG } from '@/config/constants';

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the haversine distance between two points in kilometers
 */
export function haversineDistance(point1: GeoPoint, point2: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLng = toRad(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * Encode a point to a geohash with configurable precision
 */
export function encodeGeohash(
  point: GeoPoint,
  precision: number = GEO_CONFIG.GEOHASH_PRECISION
): string {
  return ngeohash.encode(point.latitude, point.longitude, precision);
}

/**
 * Decode a geohash to a point
 */
export function decodeGeohash(hash: string): GeoPoint {
  const { latitude, longitude } = ngeohash.decode(hash);
  return { latitude, longitude };
}

/**
 * Get the bounding box for a geohash
 */
export function getGeohashBounds(hash: string): GeoBounds {
  const bbox = ngeohash.decode_bbox(hash);
  return {
    minLat: bbox[0],
    minLng: bbox[1],
    maxLat: bbox[2],
    maxLng: bbox[3],
    geohashPrefix: hash,
  };
}

/**
 * Calculate the precision needed for a given radius
 * Geohash precision to approximate cell size:
 * 1: 5000km, 2: 1250km, 3: 156km, 4: 39km, 5: 5km, 6: 1.2km, 7: 150m, 8: 38m
 */
export function getPrecisionForRadius(radiusKm: number): number {
  if (radiusKm > 1250) return 1;
  if (radiusKm > 156) return 2;
  if (radiusKm > 39) return 3;
  if (radiusKm > 5) return 4;
  if (radiusKm > 1.2) return 5;
  if (radiusKm > 0.15) return 6;
  if (radiusKm > 0.038) return 7;
  return 8;
}

/**
 * Get neighboring geohashes including center
 * Returns a 3x3 grid of geohashes centered on the given point
 */
export function getNeighborGeohashes(hash: string): string[] {
  const neighbors = ngeohash.neighbors(hash);
  return [
    neighbors.nw, neighbors.n, neighbors.ne,
    neighbors.w, hash, neighbors.e,
    neighbors.sw, neighbors.s, neighbors.se,
  ].filter(Boolean);
}

/**
 * Calculate geohash bounds for a radius query
 * Returns geohash prefixes that cover the search area
 */
export function geohashBounds(center: GeoPoint, radiusKm: number): string[] {
  // Cap radius to maximum allowed
  const cappedRadius = Math.min(radiusKm, GEO_CONFIG.MAX_RADIUS_KM);
  
  // Calculate precision based on radius
  const precision = getPrecisionForRadius(cappedRadius);
  
  // Get center geohash
  const centerHash = encodeGeohash(center, precision);
  
  // Get neighboring geohashes
  const hashes = getNeighborGeohashes(centerHash);
  
  // For very small radii, we might only need the center hash
  if (cappedRadius <= 0.15) {
    return [centerHash];
  }
  
  // Limit to max bounds queries
  return hashes.slice(0, GEO_CONFIG.MAX_BOUNDS_QUERIES);
}

/**
 * Check if a point is within radius of center
 */
export function isWithinRadius(
  point: GeoPoint,
  center: GeoPoint,
  radiusKm: number
): boolean {
  return haversineDistance(point, center) <= radiusKm;
}

/**
 * Sort entries by distance from a point
 */
export function sortByDistance<T extends { location?: GeoPoint }>(
  entries: T[],
  center: GeoPoint
): T[] {
  return [...entries].sort((a, b) => {
    if (!a.location) return 1;
    if (!b.location) return -1;
    return haversineDistance(a.location, center) - haversineDistance(b.location, center);
  });
}

/**
 * Filter entries within radius and return with distance
 */
export function filterByRadius<T extends { location?: GeoPoint }>(
  entries: T[],
  center: GeoPoint,
  radiusKm: number
): Array<T & { distance: number }> {
  return entries
    .filter((entry) => {
      if (!entry.location) return false;
      return isWithinRadius(entry.location, center, radiusKm);
    })
    .map((entry) => ({
      ...entry,
      distance: entry.location ? haversineDistance(entry.location, center) : Infinity,
    }));
}

/**
 * Deduplicate entries by ID
 */
export function dedupeEntries<T extends { id: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Calculate bearing between two points (for future map features)
 */
export function calculateBearing(from: GeoPoint, to: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
