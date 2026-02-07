import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

import { Header } from '@/components/common/Header';
import { Rating } from '@/components/common/Rating';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

// ============================================
// CARD THEMES
// ============================================

interface CardTheme {
  id: string;
  name: string;
  gradient: string[];
  textColor: string;
  accentColor: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'amber',
    name: 'Amber',
    gradient: ['#F59E0B', '#D97706'],
    textColor: '#FFF',
    accentColor: 'rgba(255,255,255,0.3)',
  },
  {
    id: 'dark',
    name: 'Stout',
    gradient: ['#1F2937', '#111827'],
    textColor: '#FFF',
    accentColor: '#F59E0B',
  },
  {
    id: 'golden',
    name: 'Golden',
    gradient: ['#FDE68A', '#FCD34D'],
    textColor: '#78350F',
    accentColor: '#92400E',
  },
  {
    id: 'hops',
    name: 'Hops',
    gradient: ['#10B981', '#059669'],
    textColor: '#FFF',
    accentColor: 'rgba(255,255,255,0.3)',
  },
  {
    id: 'night',
    name: 'Night',
    gradient: ['#4C1D95', '#5B21B6'],
    textColor: '#FFF',
    accentColor: '#A78BFA',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: ['#F97316', '#EA580C'],
    textColor: '#FFF',
    accentColor: 'rgba(255,255,255,0.3)',
  },
];

// ============================================
// BEER CARD COMPONENT
// ============================================

interface BeerCardProps {
  beer: {
    name: string;
    brewery?: string;
    style?: string;
    rating: number;
    location?: string;
    date?: string;
    notes?: string;
    photoUri?: string;
  };
  theme: CardTheme;
  showNotes: boolean;
}

function BeerCard({ beer, theme, showNotes }: BeerCardProps): JSX.Element {
  return (
    <LinearGradient
      colors={theme.gradient}
      style={styles.beerCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: theme.accentColor }]} />
      <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: theme.accentColor }]} />
      
      {/* Content */}
      <View style={styles.cardContent}>
        {/* Beer emoji based on style */}
        <Text style={styles.beerEmoji}>
          {beer.style?.toLowerCase().includes('stout') ? '🍺' :
           beer.style?.toLowerCase().includes('ipa') ? '🍻' :
           beer.style?.toLowerCase().includes('lager') ? '🍺' :
           beer.style?.toLowerCase().includes('sour') ? '🍋' :
           beer.style?.toLowerCase().includes('wheat') ? '🌾' : '🍺'}
        </Text>
        
        {/* Beer Name */}
        <Text style={[styles.beerName, { color: theme.textColor }]}>
          {beer.name}
        </Text>
        
        {/* Brewery */}
        {beer.brewery && (
          <Text style={[styles.brewery, { color: theme.textColor, opacity: 0.8 }]}>
            {beer.brewery}
          </Text>
        )}
        
        {/* Style */}
        {beer.style && (
          <View style={[styles.styleTag, { backgroundColor: theme.accentColor }]}>
            <Text style={[styles.styleText, { color: theme.textColor }]}>
              {beer.style}
            </Text>
          </View>
        )}
        
        {/* Rating */}
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= beer.rating ? 'star' : 'star-outline'}
              size={28}
              color={theme.textColor}
              style={{ opacity: star <= beer.rating ? 1 : 0.3 }}
            />
          ))}
        </View>
        
        {/* Notes */}
        {showNotes && beer.notes && (
          <Text style={[styles.notes, { color: theme.textColor, opacity: 0.9 }]}>
            "{beer.notes}"
          </Text>
        )}
        
        {/* Location & Date */}
        <View style={styles.metaRow}>
          {beer.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={theme.textColor} />
              <Text style={[styles.metaText, { color: theme.textColor }]}>
                {beer.location}
              </Text>
            </View>
          )}
          {beer.date && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={theme.textColor} />
              <Text style={[styles.metaText, { color: theme.textColor }]}>
                {beer.date}
              </Text>
            </View>
          )}
        </View>
        
        {/* Watermark */}
        <View style={styles.watermark}>
          <Ionicons name="beer-outline" size={14} color={theme.textColor} />
          <Text style={[styles.watermarkText, { color: theme.textColor }]}>
            Beer Diary
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ShareCardScreen(): JSX.Element {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  
  // Get beer data from route params or use mock
  const beer = (route.params as any)?.beer || {
    name: 'Pliny the Elder',
    brewery: 'Russian River Brewing',
    style: 'Double IPA',
    rating: 5,
    location: 'San Francisco, CA',
    date: 'Feb 7, 2026',
    notes: 'The perfect balance of hops and malt. Worth the hype!',
  };
  
  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [showNotes, setShowNotes] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveToPhotos = async () => {
    if (!viewShotRef.current) return;
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos.');
        setIsSaving(false);
        return;
      }
      
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        await MediaLibrary.saveToLibraryAsync(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved!', 'Card saved to your photos.');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Could not save the image.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleShare = async () => {
    if (!viewShotRef.current) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your beer discovery',
          });
        } else {
          await Share.share({
            message: `Just tried ${beer.name} from ${beer.brewery}! ⭐️ ${beer.rating}/5`,
          });
        }
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Share Card"
        leftIcon="close"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Preview */}
        <View style={styles.previewContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={styles.viewShot}
          >
            <BeerCard beer={beer} theme={selectedTheme} showNotes={showNotes} />
          </ViewShot>
        </View>
        
        {/* Theme Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themesRow}
          >
            {CARD_THEMES.map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeOption,
                  selectedTheme.id === theme.id && styles.themeOptionSelected,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTheme(theme);
                }}
              >
                <LinearGradient
                  colors={theme.gradient}
                  style={styles.themePreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.themeName}>{theme.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              Haptics.selectionAsync();
              setShowNotes(!showNotes);
            }}
          >
            <Text style={styles.optionLabel}>Show tasting notes</Text>
            <Ionicons
              name={showNotes ? 'checkbox' : 'square-outline'}
              size={24}
              color={showNotes ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveToPhotos}
            disabled={isSaving}
          >
            <Ionicons name="download-outline" size={22} color="#F59E0B" />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save to Photos'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.shareButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="share-outline" size={22} color="#FFF" />
              <Text style={styles.shareButtonText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewContainer: {
    alignItems: 'center',
    padding: 24,
  },
  viewShot: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  beerCard: {
    width: CARD_WIDTH,
    minHeight: 400,
    borderRadius: 24,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  decorCircle1: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    bottom: -40,
    left: -40,
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
  },
  beerEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  beerName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  brewery: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  styleTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  styleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  notes: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    opacity: 0.8,
  },
  watermark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  watermarkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  themesRow: {
    gap: 12,
    paddingRight: 16,
  },
  themeOption: {
    alignItems: 'center',
  },
  themeOptionSelected: {
    transform: [{ scale: 1.05 }],
  },
  themePreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginBottom: 6,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  themeName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#374151',
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 14,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  shareButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
