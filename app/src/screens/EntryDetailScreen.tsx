import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { RootStackParamList } from '../../App';
import { EntryDoc } from '@/types';
import { useEntries } from '@/hooks/useEntries';
import { RatingDisplay } from '@/components/common/Rating';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'EntryDetail'>;

export function EntryDetailScreen(): JSX.Element {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { entryId } = route.params;
  
  const { entries, deleteEntry, updateEntry } = useEntries();
  const entry = entries.find((e) => e.id === entryId);
  
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    if (!entry) return;
    navigation.navigate('AddEntry', {
      prefill: {
        name: entry.name,
        brewery: entry.brand,
        style: entry.style,
      },
    });
  }, [navigation, entry]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!entry) return;
            setIsDeleting(true);
            try {
              await deleteEntry(entry.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [entry, deleteEntry, navigation]);

  const handleShare = useCallback(async () => {
    if (!entry) return;
    try {
      await Share.share({
        message: `🍺 ${entry.name}${entry.brand ? ` by ${entry.brand}` : ''}\n⭐ ${entry.ratingNum}/5${entry.notes ? `\n\n"${entry.notes}"` : ''}\n\nLogged with AI Beer Sommelier`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [entry]);

  const handleToggleFavorite = useCallback(async () => {
    if (!entry) return;
    try {
      await updateEntry(entry.id, { favorite: !entry.favorite });
    } catch (error) {
      Alert.alert('Error', 'Failed to update entry.');
    }
  }, [entry, updateEntry]);

  const handleShareCard = useCallback(() => {
    if (!entry) return;
    navigation.navigate('ShareCard', { beer: entry });
  }, [navigation, entry]);

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="beer-outline" size={64} color="#D1D5DB" />
          <Text style={styles.notFoundText}>Entry not found</Text>
          <Button title="Go Back" onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const hasPhotos = entry.photoUrls && entry.photoUrls.length > 0;
  const hasLocation = entry.location?.latitude && entry.location?.longitude;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
            <Ionicons
              name={entry.favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={entry.favorite ? '#EF4444' : '#6B7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        {hasPhotos && (
          <View style={styles.photoSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActivePhotoIndex(index);
              }}
            >
              {entry.photoUrls.map((url, index) => (
                <Image key={index} source={{ uri: url }} style={styles.photo} />
              ))}
            </ScrollView>
            {entry.photoUrls.length > 1 && (
              <View style={styles.photoIndicators}>
                {entry.photoUrls.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoIndicator,
                      index === activePhotoIndex && styles.photoIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.name}>{entry.name}</Text>
          {entry.brand && <Text style={styles.brand}>{entry.brand}</Text>}
          
          <View style={styles.ratingRow}>
            <RatingDisplay value={entry.ratingNum} size="large" />
            <Text style={styles.ratingText}>{entry.ratingNum.toFixed(1)}/5</Text>
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            {entry.style && (
              <Badge variant="primary" size="medium">
                {entry.style}
              </Badge>
            )}
            {entry.abv && (
              <Badge variant="default" size="medium">
                {entry.abv}% ABV
              </Badge>
            )}
            {entry.ibu && (
              <Badge variant="default" size="medium">
                {entry.ibu} IBU
              </Badge>
            )}
            {entry.repeatBuy && (
              <Badge variant="success" size="medium">
                🔄 Would buy again
              </Badge>
            )}
          </View>
        </View>

        {/* Notes */}
        {entry.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{entry.notes}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <DetailRow
              icon="calendar-outline"
              label="Date"
              value={format(new Date(entry.consumedAt), 'MMMM d, yyyy')}
            />
            {entry.price && (
              <DetailRow
                icon="pricetag-outline"
                label="Price"
                value={`${entry.currency || '$'}${entry.price.toFixed(2)}${entry.volume ? ` / ${entry.volume}${entry.volumeUnit || 'ml'}` : ''}`}
              />
            )}
            {entry.purchaseLocation && (
              <DetailRow
                icon="storefront-outline"
                label="Purchase Location"
                value={entry.purchaseLocation}
              />
            )}
            {entry.beerCountry && (
              <DetailRow
                icon="flag-outline"
                label="Origin"
                value={entry.beerCountry}
              />
            )}
          </View>
        </View>

        {/* Location Map */}
        {hasLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where I Had It</Text>
            {entry.location?.placeName && (
              <Text style={styles.placeName}>{entry.location.placeName}</Text>
            )}
            {entry.location?.city && (
              <Text style={styles.cityName}>
                {entry.location.city}{entry.location.country ? `, ${entry.location.country}` : ''}
              </Text>
            )}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: entry.location!.latitude,
                  longitude: entry.location!.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: entry.location!.latitude,
                    longitude: entry.location!.longitude,
                  }}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Description */}
        {entry.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beer Description</Text>
            <Text style={styles.description}>{entry.description}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Create Share Card"
            onPress={handleShareCard}
            variant="outline"
            icon={<Ionicons name="image-outline" size={20} color="#F59E0B" />}
          />
          <Button
            title="Edit Entry"
            onPress={handleEdit}
            variant="primary"
            icon={<Ionicons name="pencil-outline" size={20} color="#FFF" />}
          />
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Added {format(new Date(entry.createdAt), 'MMM d, yyyy')}
            {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
              ` • Updated ${format(new Date(entry.updatedAt), 'MMM d, yyyy')}`
            )}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Detail Row Component
interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps): JSX.Element {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color="#6B7280" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: '#6B7280',
    marginVertical: 16,
  },
  photoSection: {
    backgroundColor: '#F9FAFB',
  },
  photo: {
    width: width,
    height: width * 0.75,
    resizeMode: 'cover',
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  photoIndicatorActive: {
    backgroundColor: '#F59E0B',
  },
  mainInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  brand: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  notes: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  placeName: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  metadata: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default EntryDetailScreen;
