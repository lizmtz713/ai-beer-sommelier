import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ============================================
// ONBOARDING SLIDES
// ============================================

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  gradient: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: 'beer',
    title: 'Welcome to\nBeer Diary',
    subtitle: 'Your personal beer journey starts here',
    description: 'Track every beer you try, discover your taste profile, and never forget a great brew.',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: 'log',
    icon: 'camera',
    title: 'Log Your\nDiscoveries',
    subtitle: 'Quick logs or detailed entries',
    description: 'Scan barcodes, snap photos, rate beers, and add tasting notes. Takes seconds.',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'],
  },
  {
    id: 'taste',
    icon: 'sparkles',
    title: 'Discover Your\nTaste Profile',
    subtitle: 'We learn what you love',
    description: 'Track flavor preferences across styles. Get personalized recommendations based on your palate.',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'insights',
    icon: 'analytics',
    title: 'Unlock\nInsights',
    subtitle: 'Your drinking data, visualized',
    description: 'See spending trends, favorite styles, top-rated discoveries, and how your taste evolves.',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'map',
    icon: 'map',
    title: 'Map Your\nJourney',
    subtitle: 'Every beer has a story',
    description: 'See where you\'ve been, discover local breweries, and remember the places behind the pints.',
    color: '#EC4899',
    gradient: ['#EC4899', '#DB2777'],
  },
];

// ============================================
// SLIDE COMPONENT
// ============================================

interface SlideProps {
  slide: OnboardingSlide;
  index: number;
  scrollX: Animated.Value;
}

function Slide({ slide, index, scrollX }: SlideProps): JSX.Element {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  });
  
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });
  
  return (
    <View style={styles.slide}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Ionicons name={slide.icon} size={80} color="#FFF" />
        </Animated.View>
      </LinearGradient>
      
      <Animated.View style={[styles.textContainer, { opacity }]}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: slide.color }]}>{slide.subtitle}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>
    </View>
  );
}

// ============================================
// PAGINATION
// ============================================

interface PaginationProps {
  slides: OnboardingSlide[];
  scrollX: Animated.Value;
}

function Pagination({ slides, scrollX }: PaginationProps): JSX.Element {
  return (
    <View style={styles.pagination}>
      {slides.map((slide, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        
        return (
          <Animated.View
            key={slide.id}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: slide.color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleComplete();
  };
  
  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    onComplete();
  };
  
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  
  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
      
      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item, index }) => (
          <Slide slide={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
      />
      
      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        <Pagination slides={SLIDES} scrollX={scrollX} />
        
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Let's Go!" : 'Next'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'checkmark' : 'arrow-forward'}
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEB',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});
