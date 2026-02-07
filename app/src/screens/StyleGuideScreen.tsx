import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Header } from '@/components/common/Header';
import { STYLE_PROFILES, FLAVOR_DIMENSIONS, StyleFlavorProfile } from '@/data/flavorProfile';

const { width } = Dimensions.get('window');

// ============================================
// STYLE CATEGORIES
// ============================================

const STYLE_CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🍺' },
  { id: 'Lager', name: 'Lagers', emoji: '🧊' },
  { id: 'Ale', name: 'Ales', emoji: '🍻' },
  { id: 'Wheat', name: 'Wheat', emoji: '🌾' },
  { id: 'Belgian', name: 'Belgian', emoji: '🇧🇪' },
  { id: 'Sour', name: 'Sours', emoji: '🍋' },
];

// ============================================
// FOOD PAIRINGS DATABASE
// ============================================

const FOOD_PAIRINGS: Record<string, string[]> = {
  'pilsner': ['Light salads', 'Sushi', 'Grilled chicken', 'Mild cheeses'],
  'helles': ['Pretzels', 'Weisswurst', 'Grilled fish', 'Light pasta'],
  'marzen': ['Roast pork', 'Sausages', 'Pretzels', 'Aged cheddar'],
  'bock': ['Roasted meats', 'Smoked sausage', 'Rich stews', 'Gruyère'],
  'doppelbock': ['Duck', 'Game meats', 'Dark chocolate', 'Blue cheese'],
  'blonde': ['Salads', 'Light seafood', 'Bruschetta', 'Goat cheese'],
  'pale-ale': ['Burgers', 'Fish & chips', 'Buffalo wings', 'Cheddar'],
  'ipa': ['Spicy curry', 'Mexican food', 'Blue cheese', 'Carrot cake'],
  'dipa': ['Extra spicy food', 'Strong cheeses', 'Citrus desserts'],
  'neipa': ['Tropical fruit', 'Ceviche', 'Creamy cheeses', 'Key lime pie'],
  'brown': ['Roast beef', 'Grilled mushrooms', 'Nut-based desserts', 'Cheddar'],
  'porter': ['BBQ ribs', 'Chocolate cake', 'Oysters', 'Sharp cheddar'],
  'stout': ['Oysters', 'Chocolate desserts', 'Roast beef', 'Aged Gouda'],
  'milk-stout': ['Chocolate truffles', 'Cheesecake', 'Ice cream', 'Coffee cake'],
  'imperial-stout': ['Rich chocolate', 'Foie gras', 'Strong blue cheese', 'Tiramisu'],
  'hefeweizen': ['Egg dishes', 'Fruit salads', 'Light seafood', 'Banana bread'],
  'witbier': ['Mussels', 'Salads with citrus', 'Light cheeses', 'Fruit tarts'],
  'dunkelweizen': ['Sausages', 'Banana desserts', 'Smoked meats', 'Caramel'],
  'saison': ['Grilled vegetables', 'Mussels', 'Goat cheese', 'Herb dishes'],
  'tripel': ['Crab', 'Lobster', 'Creamy pasta', 'Fruit-based desserts'],
  'dubbel': ['Roast duck', 'Lamb', 'Apple pie', 'Aged Gouda'],
  'quad': ['Rich stews', 'Dark chocolate', 'Aged cheeses', 'Crème brûlée'],
  'gose': ['Ceviche', 'Tacos', 'Fresh oysters', 'Goat cheese salad'],
  'berliner': ['Light seafood', 'Fruit desserts', 'Brunch dishes'],
  'lambic': ['Funky cheeses', 'Fruit desserts', 'Duck', 'Charcuterie'],
  'flanders': ['Duck', 'Pork', 'Carbonnade', 'Dark chocolate'],
};

// ============================================
// STYLE CARD
// ============================================

interface StyleCardProps {
  style: StyleFlavorProfile;
  onPress: () => void;
}

function StyleCard({ style, onPress }: StyleCardProps): JSX.Element {
  return (
    <TouchableOpacity
      style={styles.styleCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.styleCardHeader}>
        <View>
          <Text style={styles.styleName}>{style.styleName}</Text>
          <Text style={styles.styleCategory}>{style.category} • ~{style.avgAbv}% ABV</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
      <Text style={styles.styleDescription} numberOfLines={2}>
        {style.description}
      </Text>
      
      {/* Mini flavor bars */}
      <View style={styles.miniFlavorRow}>
        {['bitterness', 'sweetness', 'roast'].map(dim => (
          <View key={dim} style={styles.miniFlavor}>
            <Text style={styles.miniFlavorLabel}>
              {dim === 'bitterness' ? '🌿' : dim === 'sweetness' ? '🍯' : '☕'}
            </Text>
            <View style={styles.miniBar}>
              <View 
                style={[
                  styles.miniBarFill, 
                  { width: `${(style[dim as keyof StyleFlavorProfile] as number / 5) * 100}%` }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// STYLE DETAIL
// ============================================

interface StyleDetailProps {
  style: StyleFlavorProfile;
  onClose: () => void;
}

function StyleDetail({ style, onClose }: StyleDetailProps): JSX.Element {
  const pairings = FOOD_PAIRINGS[style.styleId] || [];
  
  return (
    <View style={styles.detailOverlay}>
      <TouchableOpacity style={styles.detailBackdrop} onPress={onClose} />
      <View style={styles.detailSheet}>
        <View style={styles.detailHandle} />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>{style.styleName}</Text>
              <Text style={styles.detailSubtitle}>
                {style.category} • ~{style.avgAbv}% ABV
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.detailDescription}>{style.description}</Text>
          
          {/* Flavor Profile */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Flavor Profile</Text>
            {FLAVOR_DIMENSIONS.map(dim => (
              <View key={dim.id} style={styles.flavorRow}>
                <Text style={styles.flavorEmoji}>{dim.emoji}</Text>
                <Text style={styles.flavorName}>{dim.name}</Text>
                <View style={styles.flavorBar}>
                  <View 
                    style={[
                      styles.flavorBarFill,
                      { width: `${(style[dim.id as keyof StyleFlavorProfile] as number / 5) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.flavorValue}>
                  {style[dim.id as keyof StyleFlavorProfile]}/5
                </Text>
              </View>
            ))}
          </View>
          
          {/* Food Pairings */}
          {pairings.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>🍽️ Pairs Well With</Text>
              <View style={styles.pairingsGrid}>
                {pairings.map((food, i) => (
                  <View key={i} style={styles.pairingTag}>
                    <Text style={styles.pairingText}>{food}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Quick Tips */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>💡 Tasting Tips</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                {style.avgAbv >= 7 
                  ? '🌡️ Serve slightly warmer (50-55°F) to bring out complex flavors'
                  : '🧊 Serve cold (38-45°F) for maximum refreshment'}
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                {style.category === 'Belgian'
                  ? '🍷 Use a tulip or goblet glass to capture aromatics'
                  : style.category === 'Wheat'
                  ? '🥛 Use a tall weizen glass to showcase the fluffy head'
                  : '🍺 A standard pint glass works well'}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.wishlistButton}>
              <Ionicons name="bookmark-outline" size={20} color="#F59E0B" />
              <Text style={styles.wishlistButtonText}>Add to Wishlist</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StyleGuideScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState<StyleFlavorProfile | null>(null);
  
  // Filter styles
  const filteredStyles = STYLE_PROFILES.filter(style => {
    const matchesSearch = style.styleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         style.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || style.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Beer Style Guide"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search styles..."
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
      >
        {STYLE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryTab,
              selectedCategory === cat.id && styles.categoryTabActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCategory(cat.id);
            }}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={[
              styles.categoryName,
              selectedCategory === cat.id && styles.categoryNameActive,
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Styles List */}
      <ScrollView
        contentContainerStyle={styles.stylesList}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="school-outline" size={32} color="#FFF" />
          <View style={styles.headerCardText}>
            <Text style={styles.headerCardTitle}>Learn Your Styles</Text>
            <Text style={styles.headerCardSubtitle}>
              {filteredStyles.length} styles to explore with flavor profiles & food pairings
            </Text>
          </View>
        </LinearGradient>
        
        {/* Style Cards */}
        {filteredStyles.map((style) => (
          <StyleCard
            key={style.styleId}
            style={style}
            onPress={() => setSelectedStyle(style)}
          />
        ))}
        
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
      
      {/* Style Detail Modal */}
      {selectedStyle && (
        <StyleDetail style={selectedStyle} onClose={() => setSelectedStyle(null)} />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#111827',
  },
  categoriesRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: '#FEF3C7',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryNameActive: {
    color: '#D97706',
    fontWeight: '600',
  },
  stylesList: {
    padding: 16,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
  },
  headerCardText: {
    flex: 1,
  },
  headerCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  styleCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  styleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  styleName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  styleCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  styleDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  miniFlavorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniFlavor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniFlavorLabel: {
    fontSize: 12,
  },
  miniBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  
  // Detail Sheet
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  detailSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 12,
  },
  detailHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  detailDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  flavorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flavorEmoji: {
    fontSize: 18,
    marginRight: 10,
    width: 28,
  },
  flavorName: {
    fontSize: 14,
    color: '#374151',
    width: 80,
  },
  flavorBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  flavorBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  flavorValue: {
    fontSize: 12,
    color: '#9CA3AF',
    width: 30,
    textAlign: 'right',
  },
  pairingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pairingTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pairingText: {
    fontSize: 14,
    color: '#92400E',
  },
  tipCard: {
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  detailActions: {
    paddingHorizontal: 20,
  },
  wishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    gap: 8,
  },
  wishlistButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
