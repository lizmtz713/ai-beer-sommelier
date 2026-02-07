import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/common/Card';
import { RatingDisplay } from '@/components/common/Rating';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

import { useNearbyEntries } from '@/hooks/useEntries';
import { useCurrentLocation, useRadiusSelector } from '@/hooks/useLocation';
import { EntryDoc, GeoPoint } from '@/types';
import {
  Place,
  PlaceType,
  searchPlacesWithFallback,
  formatDistance,
  formatPriceLevel,
} from '@/services/placesService';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// ============================================
// TYPES
// ============================================

type MapMode = 'my-beers' | 'find-places';

type PlaceFilter = 'all' | 'brewery' | 'bar' | 'store';

// ============================================
// PLACE TYPE FILTER CHIPS
// ============================================

const PLACE_FILTERS: { id: PlaceFilter; label: string; icon: string; types: PlaceType[] }[] = [
  { id: 'all', label: 'All', icon: 'apps', types: ['brewery', 'craft_beer_bar', 'beer_store', 'pub', 'taproom'] },
  { id: 'brewery', label: 'Breweries', icon: 'beer', types: ['brewery', 'taproom'] },
  { id: 'bar', label: 'Bars', icon: 'wine', types: ['craft_beer_bar', 'pub'] },
  { id: 'store', label: 'Stores', icon: 'storefront', types: ['beer_store'] },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function MapScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  
  // Location
  const { geoPoint, isLoading: locationLoading, requestPermission, hasPermission } = useCurrentLocation();
  const { radius, setRadius, radiusOptions } = useRadiusSelector();
  
  // Mode toggle: My Beers vs Find Places
  const [mode, setMode] = useState<MapMode>('find-places');
  
  // My Beers mode
  const { data, isLoading: entriesLoading } = useNearbyEntries(geoPoint, radius);
  const entries = data?.entries || [];
  
  // Find Places mode
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>('all');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  
  // Selection
  const [selectedEntry, setSelectedEntry] = useState<EntryDoc | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  
  // Search for places when mode is find-places
  useEffect(() => {
    if (mode === 'find-places' && geoPoint) {
      searchForPlaces();
    }
  }, [mode, geoPoint, placeFilter, showOpenOnly, radius]);
  
  const searchForPlaces = async () => {
    if (!geoPoint) return;
    
    setPlacesLoading(true);
    setSelectedPlace(null);
    
    const filterConfig = PLACE_FILTERS.find(f => f.id === placeFilter);
    
    try {
      const results = await searchPlacesWithFallback({
        center: geoPoint,
        radiusMeters: radius * 1000,
        types: filterConfig?.types,
        openNow: showOpenOnly,
        limit: 30,
      });
      setPlaces(results);
    } catch (error) {
      console.error('Place search error:', error);
    } finally {
      setPlacesLoading(false);
    }
  };
  
  // Center on user location
  const handleCenterOnUser = useCallback(() => {
    if (geoPoint && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion({
        latitude: geoPoint.latitude,
        longitude: geoPoint.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [geoPoint]);
  
  // Handle marker press
  const handleEntryMarkerPress = (entry: EntryDoc) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEntry(entry);
    setSelectedPlace(null);
  };
  
  const handlePlaceMarkerPress = (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlace(place);
    setSelectedEntry(null);
    
    // Center on place
    mapRef.current?.animateToRegion({
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };
  
  // Navigate to entry detail
  const handleEntryPress = () => {
    if (selectedEntry) {
      navigation.navigate('EntryDetail' as never, { entryId: selectedEntry.id } as never);
    }
  };
  
  // Open place in maps/browser
  const handlePlaceDirections = () => {
    if (selectedPlace) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.location.latitude},${selectedPlace.location.longitude}`;
      Linking.openURL(url);
    }
  };
  
  const handlePlaceWebsite = () => {
    if (selectedPlace?.website) {
      Linking.openURL(selectedPlace.website);
    }
  };
  
  const handlePlaceCall = () => {
    if (selectedPlace?.phone) {
      Linking.openURL(`tel:${selectedPlace.phone}`);
    }
  };
  
  // Cycle through radius options
  const handleRadiusChange = () => {
    const currentIndex = radiusOptions.indexOf(radius);
    const nextIndex = (currentIndex + 1) % radiusOptions.length;
    setRadius(radiusOptions[nextIndex]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Toggle mode
  const handleModeToggle = (newMode: MapMode) => {
    if (newMode !== mode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setMode(newMode);
      setSelectedEntry(null);
      setSelectedPlace(null);
    }
  };
  
  // Permission check
  if (!hasPermission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="location-outline"
          title="Location Required"
          description="Enable location to find breweries and craft beer bars near you"
          actionLabel="Enable Location"
          onAction={requestPermission}
        />
      </View>
    );
  }
  
  // Loading check
  if (locationLoading || !geoPoint) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner fullScreen message="Getting your location..." />
      </View>
    );
  }
  
  const hasSelection = selectedEntry || selectedPlace;
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: geoPoint.latitude,
          longitude: geoPoint.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => {
          setSelectedEntry(null);
          setSelectedPlace(null);
        }}
      >
        {/* My Beers markers */}
        {mode === 'my-beers' && entries.map((entry) => {
          if (!entry.location) return null;
          
          return (
            <Marker
              key={entry.id}
              coordinate={{
                latitude: entry.location.latitude,
                longitude: entry.location.longitude,
              }}
              onPress={() => handleEntryMarkerPress(entry)}
            >
              <View
                style={[
                  styles.marker,
                  styles.entryMarker,
                  selectedEntry?.id === entry.id && styles.markerSelected,
                ]}
              >
                <Ionicons
                  name="beer"
                  size={16}
                  color={selectedEntry?.id === entry.id ? '#FFFFFF' : '#F59E0B'}
                />
              </View>
            </Marker>
          );
        })}
        
        {/* Places markers */}
        {mode === 'find-places' && places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.location.latitude,
              longitude: place.location.longitude,
            }}
            onPress={() => handlePlaceMarkerPress(place)}
          >
            <View
              style={[
                styles.marker,
                styles.placeMarker,
                getPlaceMarkerStyle(place.type),
                selectedPlace?.id === place.id && styles.markerSelected,
              ]}
            >
              <Ionicons
                name={getPlaceIcon(place.type)}
                size={16}
                color={selectedPlace?.id === place.id ? '#FFFFFF' : getPlaceColor(place.type)}
              />
            </View>
          </Marker>
        ))}
      </MapView>
      
      {/* Mode toggle */}
      <View style={[styles.modeToggle, { top: insets.top + 16 }]}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'my-beers' && styles.modeButtonActive]}
          onPress={() => handleModeToggle('my-beers')}
        >
          <Ionicons
            name="beer-outline"
            size={18}
            color={mode === 'my-beers' ? '#FFF' : '#374151'}
          />
          <Text style={[styles.modeButtonText, mode === 'my-beers' && styles.modeButtonTextActive]}>
            My Beers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'find-places' && styles.modeButtonActive]}
          onPress={() => handleModeToggle('find-places')}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={mode === 'find-places' ? '#FFF' : '#374151'}
          />
          <Text style={[styles.modeButtonText, mode === 'find-places' && styles.modeButtonTextActive]}>
            Find Places
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Place type filters (only in find-places mode) */}
      {mode === 'find-places' && (
        <View style={[styles.filterRow, { top: insets.top + 72 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {PLACE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, placeFilter === filter.id && styles.filterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlaceFilter(filter.id);
                }}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={14}
                  color={placeFilter === filter.id ? '#FFF' : '#374151'}
                />
                <Text style={[styles.filterChipText, placeFilter === filter.id && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Open Now toggle */}
            <TouchableOpacity
              style={[styles.filterChip, showOpenOnly && styles.filterChipActive, { backgroundColor: showOpenOnly ? '#10B981' : '#FFF' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowOpenOnly(!showOpenOnly);
              }}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={showOpenOnly ? '#FFF' : '#10B981'}
              />
              <Text style={[styles.filterChipText, showOpenOnly && styles.filterChipTextActive]}>
                Open Now
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          {placesLoading && (
            <ActivityIndicator size="small" color="#F59E0B" style={styles.loadingIndicator} />
          )}
        </View>
      )}
      
      {/* Top right: radius + count */}
      <View style={[styles.topRight, { top: insets.top + (mode === 'find-places' ? 120 : 72) }]}>
        <TouchableOpacity style={styles.radiusButton} onPress={handleRadiusChange}>
          <Ionicons name="resize" size={18} color="#374151" />
          <Text style={styles.radiusText}>{radius} km</Text>
        </TouchableOpacity>
        
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {mode === 'my-beers' ? `${entries.length} beers` : `${places.length} places`}
          </Text>
        </View>
      </View>
      
      {/* Center button */}
      <TouchableOpacity
        style={[styles.centerButton, { bottom: hasSelection ? 220 : insets.bottom + 100 }]}
        onPress={handleCenterOnUser}
      >
        <Ionicons name="locate" size={24} color="#374151" />
      </TouchableOpacity>
      
      {/* Selected entry card */}
      {selectedEntry && (
        <View style={[styles.cardContainer, { bottom: insets.bottom + 20 }]}>
          <Card onPress={handleEntryPress} variant="elevated">
            <View style={styles.entryCard}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {selectedEntry.name}
                </Text>
                {selectedEntry.brand && (
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {selectedEntry.brand}
                  </Text>
                )}
                <RatingDisplay value={selectedEntry.ratingNum} size="small" />
              </View>
              <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
            </View>
          </Card>
          
          <TouchableOpacity
            style={styles.closeCard}
            onPress={() => setSelectedEntry(null)}
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Selected place card */}
      {selectedPlace && (
        <View style={[styles.cardContainer, { bottom: insets.bottom + 20 }]}>
          <Card variant="elevated">
            <View style={styles.placeCard}>
              {/* Header */}
              <View style={styles.placeHeader}>
                <View style={[styles.placeIcon, { backgroundColor: getPlaceColor(selectedPlace.type) + '20' }]}>
                  <Ionicons
                    name={getPlaceIcon(selectedPlace.type)}
                    size={24}
                    color={getPlaceColor(selectedPlace.type)}
                  />
                </View>
                <View style={styles.placeInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {selectedPlace.name}
                  </Text>
                  <View style={styles.placeMetaRow}>
                    {selectedPlace.rating && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{selectedPlace.rating.toFixed(1)}</Text>
                        <Text style={styles.ratingCount}>({selectedPlace.ratingCount})</Text>
                      </View>
                    )}
                    {selectedPlace.priceLevel && (
                      <Text style={styles.priceText}>{formatPriceLevel(selectedPlace.priceLevel)}</Text>
                    )}
                    {selectedPlace.distance && (
                      <Text style={styles.distanceText}>{formatDistance(selectedPlace.distance)}</Text>
                    )}
                  </View>
                </View>
              </View>
              
              {/* Address */}
              <Text style={styles.placeAddress} numberOfLines={1}>
                {selectedPlace.address}
              </Text>
              
              {/* Tags */}
              {selectedPlace.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {selectedPlace.tags.slice(0, 4).map((tag, i) => (
                    <View
                      key={i}
                      style={[
                        styles.tag,
                        tag === 'Open Now' && styles.tagOpen,
                        tag === 'Highly Rated' && styles.tagHighlyRated,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          tag === 'Open Now' && styles.tagTextOpen,
                          tag === 'Highly Rated' && styles.tagTextHighlyRated,
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Actions */}
              <View style={styles.placeActions}>
                <TouchableOpacity style={styles.placeActionButton} onPress={handlePlaceDirections}>
                  <Ionicons name="navigate" size={20} color="#3B82F6" />
                  <Text style={styles.placeActionText}>Directions</Text>
                </TouchableOpacity>
                
                {selectedPlace.website && (
                  <TouchableOpacity style={styles.placeActionButton} onPress={handlePlaceWebsite}>
                    <Ionicons name="globe-outline" size={20} color="#3B82F6" />
                    <Text style={styles.placeActionText}>Website</Text>
                  </TouchableOpacity>
                )}
                
                {selectedPlace.phone && (
                  <TouchableOpacity style={styles.placeActionButton} onPress={handlePlaceCall}>
                    <Ionicons name="call-outline" size={20} color="#3B82F6" />
                    <Text style={styles.placeActionText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
          
          <TouchableOpacity
            style={styles.closeCard}
            onPress={() => setSelectedPlace(null)}
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ============================================
// HELPERS
// ============================================

function getPlaceIcon(type: PlaceType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'brewery':
    case 'taproom':
      return 'beer';
    case 'craft_beer_bar':
    case 'pub':
      return 'wine';
    case 'beer_store':
      return 'storefront';
    case 'restaurant_with_beer':
      return 'restaurant';
    default:
      return 'location';
  }
}

function getPlaceColor(type: PlaceType): string {
  switch (type) {
    case 'brewery':
    case 'taproom':
      return '#F59E0B'; // Amber
    case 'craft_beer_bar':
    case 'pub':
      return '#8B5CF6'; // Purple
    case 'beer_store':
      return '#10B981'; // Green
    case 'restaurant_with_beer':
      return '#EF4444'; // Red
    default:
      return '#6B7280';
  }
}

function getPlaceMarkerStyle(type: PlaceType): object {
  const color = getPlaceColor(type);
  return {
    backgroundColor: color + '20',
    borderColor: color,
  };
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    flex: 1,
  },
  
  // Mode toggle
  modeToggle: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#F59E0B',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modeButtonTextActive: {
    color: '#FFF',
  },
  
  // Filters
  filterRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#F59E0B',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  
  // Top right controls
  topRight: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    gap: 4,
  },
  radiusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Center button
  centerButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Markers
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  entryMarker: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  placeMarker: {
    // Dynamic colors based on type
  },
  markerSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
    transform: [{ scale: 1.2 }],
  },
  
  // Card container
  cardContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  closeCard: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Entry card
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 4,
  },
  
  // Place card
  placeCard: {
    paddingVertical: 4,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  ratingCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priceText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  placeAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  
  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  tagOpen: {
    backgroundColor: '#D1FAE5',
  },
  tagTextOpen: {
    color: '#059669',
  },
  tagHighlyRated: {
    backgroundColor: '#FEF3C7',
  },
  tagTextHighlyRated: {
    color: '#D97706',
  },
  
  // Place actions
  placeActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 16,
  },
  placeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeActionText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});
