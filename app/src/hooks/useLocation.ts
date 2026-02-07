import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLocation,
  requestLocationPermissions,
  checkLocationPermission,
  getLastLocation,
  getLastCity,
  watchLocation,
} from '@/services/location';
import { Location, GeoPoint } from '@/types';
import { GEO_CONFIG } from '@/config/constants';

// ============================================
// CURRENT LOCATION HOOK
// ============================================

export function useCurrentLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [geohash, setGeohash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Check permission on mount
  useEffect(() => {
    checkLocationPermission().then(setHasPermission);
  }, []);
  
  const requestPermission = useCallback(async () => {
    const result = await requestLocationPermissions();
    setHasPermission(result.granted);
    return result;
  }, []);
  
  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getCurrentLocation();
      
      if (result.location) {
        setLocation(result.location);
        setGeohash(result.geohash);
      }
      
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Auto-fetch on permission grant
  useEffect(() => {
    if (hasPermission === true && !location) {
      fetchLocation();
    }
  }, [hasPermission, location, fetchLocation]);
  
  const geoPoint: GeoPoint | null = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;
  
  return {
    location,
    geoPoint,
    geohash,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    refresh: fetchLocation,
  };
}

// ============================================
// LOCATION WATCH HOOK (for map)
// ============================================

export function useLocationWatch(enabled: boolean = true) {
  const [location, setLocation] = useState<Location | null>(null);
  const [geohash, setGeohash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const subscription = watchLocation(
      (loc, hash) => {
        setLocation(loc);
        setGeohash(hash);
        setError(null);
      },
      (err) => {
        setError(err);
      }
    );
    
    return () => {
      subscription.remove();
    };
  }, [enabled]);
  
  const geoPoint: GeoPoint | null = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;
  
  return {
    location,
    geoPoint,
    geohash,
    error,
  };
}

// ============================================
// LAST LOCATION HOOK (for fallback)
// ============================================

export function useLastLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    getLastLocation().then((loc) => {
      setLocation(loc);
      setIsLoading(false);
    });
  }, []);
  
  const geoPoint: GeoPoint | null = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;
  
  return {
    location,
    geoPoint,
    isLoading,
    hasLocation: location !== null,
  };
}

// ============================================
// LAST CITY HOOK (for GPS denied fallback)
// ============================================

export function useLastCity() {
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    getLastCity().then(({ city, country }) => {
      setCity(city);
      setCountry(country);
      setIsLoading(false);
    });
  }, []);
  
  return {
    city,
    country,
    isLoading,
    hasCity: city !== null,
  };
}

// ============================================
// RADIUS SELECTOR HOOK
// ============================================

export function useRadiusSelector(initialRadius?: number) {
  const [radius, setRadius] = useState(initialRadius ?? GEO_CONFIG.DEFAULT_RADIUS_KM);
  
  const radiusOptions = GEO_CONFIG.RADIUS_OPTIONS;
  
  const selectRadius = useCallback((km: number) => {
    const capped = Math.min(km, GEO_CONFIG.MAX_RADIUS_KM);
    setRadius(capped);
  }, []);
  
  const nextRadius = useCallback(() => {
    const currentIndex = radiusOptions.indexOf(radius);
    const nextIndex = (currentIndex + 1) % radiusOptions.length;
    setRadius(radiusOptions[nextIndex]);
  }, [radius, radiusOptions]);
  
  const prevRadius = useCallback(() => {
    const currentIndex = radiusOptions.indexOf(radius);
    const prevIndex = currentIndex <= 0 ? radiusOptions.length - 1 : currentIndex - 1;
    setRadius(radiusOptions[prevIndex]);
  }, [radius, radiusOptions]);
  
  return {
    radius,
    setRadius: selectRadius,
    radiusOptions,
    nextRadius,
    prevRadius,
    isMaxRadius: radius >= GEO_CONFIG.MAX_RADIUS_KM,
    isMinRadius: radius <= radiusOptions[0],
  };
}

// ============================================
// NEAR ME HOOK (combines location + radius)
// ============================================

export function useNearMe() {
  const { geoPoint, hasPermission, error: locationError, isLoading: locationLoading, requestPermission } = useCurrentLocation();
  const { city, country } = useLastCity();
  const { radius, setRadius, radiusOptions } = useRadiusSelector();
  
  // Determine if we can do near-me queries
  const canQuery = geoPoint !== null;
  const hasFallback = city !== null;
  
  return {
    center: geoPoint,
    radius,
    setRadius,
    radiusOptions,
    
    // Status
    hasPermission,
    isLoading: locationLoading,
    error: locationError,
    
    // Fallback
    fallbackCity: city,
    fallbackCountry: country,
    hasFallback,
    
    // Actions
    requestPermission,
    
    // Query readiness
    canQuery,
  };
}
