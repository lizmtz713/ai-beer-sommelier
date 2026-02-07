import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location as LocationType, GeoPoint } from '@/types';
import { STORAGE_KEYS } from '@/config/constants';
import { encodeGeohash } from '@/utils/geo';

interface LastLocationData {
  location: LocationType;
  timestamp: number;
}

// Cache duration: 30 minutes
const LOCATION_CACHE_DURATION = 30 * 60 * 1000;

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Check location permission status
 */
export async function checkLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get current location with city/country reverse geocoding
 */
export async function getCurrentLocation(): Promise<{
  location: LocationType | null;
  geohash: string | null;
  error?: string;
}> {
  try {
    // Check permission
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      // Try to use cached location
      const cached = await getLastLocation();
      if (cached) {
        return {
          location: cached,
          geohash: encodeGeohash({ latitude: cached.latitude, longitude: cached.longitude }),
        };
      }
      return { location: null, geohash: null, error: 'Location permission not granted' };
    }
    
    // Get current position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    const { latitude, longitude } = position.coords;
    
    // Reverse geocode to get city/country
    let city: string | undefined;
    let country: string | undefined;
    let placeName: string | undefined;
    
    try {
      const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded) {
        city = geocoded.city || geocoded.subregion || undefined;
        country = geocoded.country || undefined;
        placeName = geocoded.name || undefined;
      }
    } catch (geocodeError) {
      console.warn('Reverse geocoding failed:', geocodeError);
    }
    
    const location: LocationType = {
      latitude,
      longitude,
      city,
      country,
      placeName,
    };
    
    const geohash = encodeGeohash({ latitude, longitude });
    
    // Cache the location
    await saveLastLocation(location);
    
    return { location, geohash };
  } catch (error) {
    // Try cached location as fallback
    const cached = await getLastLocation();
    if (cached) {
      return {
        location: cached,
        geohash: encodeGeohash({ latitude: cached.latitude, longitude: cached.longitude }),
        error: 'Using cached location',
      };
    }
    
    return {
      location: null,
      geohash: null,
      error: error instanceof Error ? error.message : 'Failed to get location',
    };
  }
}

/**
 * Save last known location to AsyncStorage
 */
export async function saveLastLocation(location: LocationType): Promise<void> {
  try {
    const data: LastLocationData = {
      location,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOCATION, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save location:', error);
  }
}

/**
 * Get last known location from AsyncStorage
 */
export async function getLastLocation(): Promise<LocationType | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOCATION);
    if (!data) return null;
    
    const parsed: LastLocationData = JSON.parse(data);
    
    // Check if cache is still valid (for GPS coordinates)
    // City/country info is always returned even if coordinates are stale
    const isLocationFresh = Date.now() - parsed.timestamp < LOCATION_CACHE_DURATION;
    
    if (isLocationFresh) {
      return parsed.location;
    }
    
    // Return location but it's stale - caller can decide what to do
    return parsed.location;
  } catch (error) {
    console.error('Failed to get last location:', error);
    return null;
  }
}

/**
 * Get last city for fallback when GPS is denied
 */
export async function getLastCity(): Promise<{
  city: string | null;
  country: string | null;
}> {
  const location = await getLastLocation();
  return {
    city: location?.city || null,
    country: location?.country || null,
  };
}

/**
 * Clear cached location
 */
export async function clearLastLocation(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.LAST_LOCATION);
}

/**
 * Watch location updates (for map view)
 */
export function watchLocation(
  callback: (location: LocationType, geohash: string) => void,
  errorCallback?: (error: string) => void
): { remove: () => void } {
  let subscription: Location.LocationSubscription | null = null;
  
  (async () => {
    try {
      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        errorCallback?.('Location permission not granted');
        return;
      }
      
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // Update every 100 meters
          timeInterval: 30000, // Or every 30 seconds
        },
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode
          let city: string | undefined;
          let country: string | undefined;
          
          try {
            const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocoded) {
              city = geocoded.city || geocoded.subregion || undefined;
              country = geocoded.country || undefined;
            }
          } catch {
            // Ignore geocoding errors for watch
          }
          
          const location: LocationType = { latitude, longitude, city, country };
          const geohash = encodeGeohash({ latitude, longitude });
          
          callback(location, geohash);
        }
      );
    } catch (error) {
      errorCallback?.(error instanceof Error ? error.message : 'Watch location failed');
    }
  })();
  
  return {
    remove: () => {
      subscription?.remove();
    },
  };
}

/**
 * Calculate distance between two points (exposed for UI)
 */
export function getDistanceText(from: GeoPoint, to: GeoPoint): string {
  const R = 6371; // Earth's radius in km
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}
