import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../providers/SubscriptionProvider';
import { useFeatureUsage } from '../hooks/useFeatureGate';

const { width } = Dimensions.get('window');

// ===========================================
// TYPES
// ===========================================

interface PlanFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  freeValue?: string;
  premiumValue: string;
}

// ===========================================
// FEATURE CONFIGURATIONS
// ===========================================

const FEATURES: PlanFeature[] = [
  {
    icon: 'chatbubbles',
    text: 'AI Sommelier Chats',
    freeValue: '5/month',
    premiumValue: 'Unlimited',
  },
  {
    icon: 'beer',
    text: 'Beer Diary Entries',
    freeValue: '50 total',
    premiumValue: 'Unlimited',
  },
  {
    icon: 'analytics',
    text: 'Tasting Analytics',
    freeValue: 'Basic',
    premiumValue: 'Advanced',
  },
  {
    icon: 'download',
    text: 'Export Data',
    freeValue: '—',
    premiumValue: '✓ CSV & PDF',
  },
  {
    icon: 'ban',
    text: 'Ad-Free Experience',
    freeValue: '—',
    premiumValue: '✓',
  },
  {
    icon: 'star',
    text: 'Premium Badge',
    freeValue: '—',
    premiumValue: '✓',
  },
];

// ===========================================
// COMPONENT
// ===========================================

export function PaywallScreen() {
  const navigation = useNavigation();
  const {
    tier: currentTier,
    isLoading,
    isPremium,
    monthlyPackage,
    yearlyPackage,
    purchasePremium,
    restore,
  } = useSubscription();
  
  const { getAIChatUsage, getBeerUsage } = useFeatureUsage();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [usageInfo, setUsageInfo] = useState({ aiChats: { used: 0, limit: 5 }, beers: { used: 0, limit: 50 } });

  // Load usage info
  useEffect(() => {
    const loadUsage = async () => {
      const [aiChats, beers] = await Promise.all([
        getAIChatUsage(),
        getBeerUsage(),
      ]);
      setUsageInfo({
        aiChats: { used: aiChats.used, limit: aiChats.limit === Infinity ? 0 : aiChats.limit },
        beers: { used: beers.used, limit: beers.limit === Infinity ? 0 : beers.limit },
      });
    };
    loadUsage();
  }, []);

  // Handle purchase
  const handlePurchase = async () => {
    if (isPremium) {
      navigation.goBack();
      return;
    }

    setProcessingPurchase(true);
    try {
      const success = await purchasePremium(selectedPlan === 'yearly');
      if (success) {
        navigation.goBack();
      }
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Handle restore
  const handleRestore = async () => {
    setProcessingPurchase(true);
    try {
      await restore();
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Get price strings
  const monthlyPrice = monthlyPackage?.product.priceString || '$4.99';
  const yearlyPrice = yearlyPackage?.product.priceString || '$29.99';
  const yearlySavings = '50%';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.iconContainer}
          >
            <Ionicons name="beer" size={48} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.title}>Beer Sommelier Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full craft beer experience
          </Text>
        </View>

        {/* Usage Stats (for free users) */}
        {!isPremium && (
          <View style={styles.usageContainer}>
            <View style={styles.usageItem}>
              <Ionicons name="chatbubbles-outline" size={20} color="#F59E0B" />
              <Text style={styles.usageLabel}>AI Chats</Text>
              <Text style={styles.usageValue}>
                {usageInfo.aiChats.used}/{usageInfo.aiChats.limit}
              </Text>
            </View>
            <View style={styles.usageDivider} />
            <View style={styles.usageItem}>
              <Ionicons name="beer-outline" size={20} color="#F59E0B" />
              <Text style={styles.usageLabel}>Beers Logged</Text>
              <Text style={styles.usageValue}>
                {usageInfo.beers.used}/{usageInfo.beers.limit}
              </Text>
            </View>
          </View>
        )}

        {/* Plan Selection */}
        {!isPremium && (
          <View style={styles.plansContainer}>
            {/* Yearly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>SAVE {yearlySavings}</Text>
              </View>
              <View style={styles.planRadio}>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === 'yearly' && styles.radioOuterSelected,
                ]}>
                  {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Yearly</Text>
                <Text style={styles.planPrice}>{yearlyPrice}/year</Text>
                <Text style={styles.planSubtext}>Just $2.50/month</Text>
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={styles.planRadio}>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === 'monthly' && styles.radioOuterSelected,
                ]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>{monthlyPrice}/month</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Features Comparison */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you get</Text>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={22} color="#F59E0B" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
              <View style={styles.featureValues}>
                {feature.freeValue && (
                  <Text style={styles.freeValue}>{feature.freeValue}</Text>
                )}
                <Text style={styles.premiumValue}>{feature.premiumValue}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        {!isPremium && (
          <TouchableOpacity
            style={[
              styles.ctaButton,
              processingPurchase && styles.ctaButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={processingPurchase}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {processingPurchase ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="star" size={20} color="#FFFFFF" style={styles.ctaIcon} />
                  <Text style={styles.ctaButtonText}>
                    Start Premium {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Already Premium */}
        {isPremium && (
          <View style={styles.alreadyPremium}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.alreadyPremiumText}>You're a Premium Member!</Text>
            <Text style={styles.alreadyPremiumSubtext}>
              Thank you for supporting Beer Sommelier 🍺
            </Text>
          </View>
        )}

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={processingPurchase}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          Payment will be charged to your App Store or Google Play account.
          Subscriptions automatically renew unless cancelled at least 24 hours
          before the end of the current period. Manage subscriptions in your
          account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================
// STYLES
// ===========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#92400E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  usageContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  usageDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planRadio: {
    marginRight: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#F59E0B',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 2,
  },
  planSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureText: {
    fontSize: 15,
    color: '#1F2937',
  },
  featureValues: {
    alignItems: 'flex-end',
  },
  freeValue: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  premiumValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alreadyPremium: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  alreadyPremiumText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 12,
  },
  alreadyPremiumSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});
