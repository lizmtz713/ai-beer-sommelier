import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/common/Header';
import { Card, CardSection, CardDivider } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { RatingDisplay } from '@/components/common/Rating';

import { useInsights, useTopBeers } from '@/hooks/useInsights';
import { CityStats, StyleStats, EntryDoc } from '@/types';

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
}

function StatCard({ icon, value, label, color = '#F59E0B' }: StatCardProps): JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// CITY ROW COMPONENT
// ============================================

interface CityRowProps {
  city: CityStats;
  rank: number;
}

function CityRow({ city, rank }: CityRowProps): JSX.Element {
  return (
    <View style={styles.cityRow}>
      <Text style={styles.cityRank}>{rank}</Text>
      <View style={styles.cityInfo}>
        <Text style={styles.cityName}>{city.city}</Text>
        <Text style={styles.cityCountry}>{city.country}</Text>
      </View>
      <View style={styles.cityStats}>
        <Text style={styles.cityBeers}>{city.count} beers</Text>
        <View style={styles.cityRating}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.cityRatingText}>{city.avgRating}</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// STYLE ROW COMPONENT
// ============================================

interface StyleRowProps {
  styleStats: StyleStats;
  maxCount: number;
}

function StyleRow({ styleStats, maxCount }: StyleRowProps): JSX.Element {
  const barWidth = (styleStats.count / maxCount) * 100;
  
  return (
    <View style={styles.styleRow}>
      <View style={styles.styleInfo}>
        <Text style={styles.styleName}>{styleStats.style}</Text>
        <Text style={styles.styleCount}>{styleStats.count} beers</Text>
      </View>
      <View style={styles.styleBarContainer}>
        <View style={[styles.styleBar, { width: `${barWidth}%` }]} />
      </View>
      <View style={styles.styleRating}>
        <Ionicons name="star" size={12} color="#F59E0B" />
        <Text style={styles.styleRatingText}>{styleStats.avgRating}</Text>
      </View>
    </View>
  );
}

// ============================================
// BEER ROW COMPONENT
// ============================================

interface BeerRowProps {
  entry: EntryDoc;
  showPrice?: boolean;
}

function BeerRow({ entry, showPrice }: BeerRowProps): JSX.Element {
  return (
    <View style={styles.beerRow}>
      <View style={styles.beerInfo}>
        <Text style={styles.beerName} numberOfLines={1}>{entry.name}</Text>
        {entry.brand && (
          <Text style={styles.beerBrand} numberOfLines={1}>{entry.brand}</Text>
        )}
      </View>
      {showPrice && entry.price !== undefined ? (
        <View style={styles.beerPrice}>
          <Text style={styles.beerPriceValue}>
            {entry.currency === 'USD' ? '$' : entry.currency}
            {entry.price.toFixed(2)}
          </Text>
          {entry.volume && (
            <Text style={styles.beerVolume}>{entry.volume}{entry.volumeUnit}</Text>
          )}
        </View>
      ) : (
        <RatingDisplay value={entry.ratingNum} size="small" />
      )}
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function InsightsScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const { data: insights, isLoading, error, refetch, isRefetching } = useInsights();
  const { data: topBeers } = useTopBeers(5);
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoadingSpinner fullScreen message="Analyzing your beer journey..." />
      </View>
    );
  }
  
  if (error || !insights) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="analytics-outline"
          title="Unable to load insights"
          description={error?.message || 'Please try again later'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }
  
  if (insights.totalEntries === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Insights" subtitle="Your beer stats" />
        <EmptyState
          icon="beer-outline"
          title="No beers logged yet"
          description="Start logging beers to see your insights and statistics"
          actionLabel="Add Your First Beer"
          onAction={() => navigation.navigate('AddEntry' as never)}
        />
      </View>
    );
  }
  
  const maxStyleCount = Math.max(...insights.mostTriedStyles.map(s => s.count), 1);
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor="#F59E0B"
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <ScreenHeader title="Insights" subtitle="Your beer journey" />
        
        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="beer-outline"
            value={insights.totalEntries}
            label="Beers Logged"
          />
          <StatCard
            icon="star"
            value={insights.avgRating.toFixed(1)}
            label="Avg Rating"
            color="#10B981"
          />
          <StatCard
            icon="location-outline"
            value={insights.totalCities}
            label="Cities"
            color="#3B82F6"
          />
          <StatCard
            icon="pint-outline"
            value={insights.totalStyles}
            label="Styles"
            color="#8B5CF6"
          />
        </View>
        
        {/* Recent Activity */}
        <Card style={styles.card}>
          <CardSection>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={24} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
          </CardSection>
          <View style={styles.activityStats}>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{insights.recentActivity.lastWeekCount}</Text>
              <Text style={styles.activityLabel}>This Week</Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{insights.recentActivity.lastMonthCount}</Text>
              <Text style={styles.activityLabel}>This Month</Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{insights.repeatBuyRate}%</Text>
              <Text style={styles.activityLabel}>Repeat Buy</Text>
            </View>
          </View>
        </Card>
        
        {/* Top Beers */}
        {topBeers && topBeers.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleSection('topBeers')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderExpandable}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={24} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Top Rated Beers</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'topBeers' ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {(expandedSection === 'topBeers' || !expandedSection) && (
              <>
                <CardDivider />
                {topBeers.slice(0, expandedSection === 'topBeers' ? undefined : 3).map((entry) => (
                  <BeerRow key={entry.id} entry={entry} />
                ))}
              </>
            )}
          </Card>
        )}
        
        {/* Best by City */}
        {insights.bestByCity.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleSection('cities')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderExpandable}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="globe-outline" size={24} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Best by City</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'cities' ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {(expandedSection === 'cities' || !expandedSection) && (
              <>
                <CardDivider />
                {insights.bestByCity
                  .slice(0, expandedSection === 'cities' ? undefined : 5)
                  .map((city, index) => (
                    <CityRow key={city.city} city={city} rank={index + 1} />
                  ))}
              </>
            )}
          </Card>
        )}
        
        {/* Most Tried Styles */}
        {insights.mostTriedStyles.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleSection('styles')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderExpandable}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pint" size={24} color="#8B5CF6" />
                  <Text style={styles.sectionTitle}>Favorite Styles</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'styles' ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {(expandedSection === 'styles' || !expandedSection) && (
              <>
                <CardDivider />
                {insights.mostTriedStyles
                  .slice(0, expandedSection === 'styles' ? undefined : 5)
                  .map((style) => (
                    <StyleRow key={style.style} styleStats={style} maxCount={maxStyleCount} />
                  ))}
              </>
            )}
          </Card>
        )}
        
        {/* Cheapest 4+ Stars */}
        {insights.cheapest4Stars.length > 0 && (
          <Card style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleSection('cheapest')}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderExpandable}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                  <Text style={styles.sectionTitle}>Best Value (4+ Stars)</Text>
                </View>
                <Ionicons
                  name={expandedSection === 'cheapest' ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>
            {(expandedSection === 'cheapest' || !expandedSection) && (
              <>
                <CardDivider />
                {insights.cheapest4Stars
                  .slice(0, expandedSection === 'cheapest' ? undefined : 3)
                  .map((entry) => (
                    <BeerRow key={entry.id} entry={entry} showPrice />
                  ))}
              </>
            )}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderExpandable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  activityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activityDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cityRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  cityCountry: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cityStats: {
    alignItems: 'flex-end',
  },
  cityBeers: {
    fontSize: 12,
    color: '#6B7280',
  },
  cityRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cityRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  styleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  styleInfo: {
    width: 100,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  styleCount: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  styleBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  styleBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  styleRating: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    justifyContent: 'flex-end',
  },
  styleRatingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  beerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  beerInfo: {
    flex: 1,
    marginRight: 12,
  },
  beerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  beerBrand: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  beerPrice: {
    alignItems: 'flex-end',
  },
  beerPriceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  beerVolume: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
