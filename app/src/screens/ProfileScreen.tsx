import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { ScreenHeader } from '@/components/common/Header';
import { Avatar } from '@/components/common/Avatar';
import { Card, CardSection, CardDivider } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

import { useAuth } from '@/providers/AuthProvider';
import { useInsights } from '@/hooks/useInsights';
import { useAllEntries } from '@/hooks/useEntries';
import { exportToCSV } from '@/utils/csv';

// ============================================
// PROFILE STAT ROW
// ============================================

interface StatRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
}

function StatRow({ icon, label, value, color = '#6B7280' }: StatRowProps): JSX.Element {
  return (
    <View style={styles.statRow}>
      <Ionicons name={icon} size={20} color={color} style={styles.statIcon} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ============================================
// MENU ITEM
// ============================================

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

function MenuItem({ icon, label, onPress, color = '#374151', showArrow = true }: MenuItemProps): JSX.Element {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={color} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />}
    </TouchableOpacity>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ProfileScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { data: insights, isLoading: insightsLoading, refetch } = useInsights();
  const { entries } = useAllEntries({});
  
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshProfile(), refetch()]);
    setIsRefreshing(false);
  };
  
  const handleExportData = async () => {
    if (entries.length === 0) {
      Alert.alert('No Data', 'You have no entries to export yet.');
      return;
    }
    
    setIsExporting(true);
    const result = await exportToCSV(entries);
    setIsExporting(false);
    
    if (!result.success) {
      Alert.alert('Export Failed', result.error || 'Unable to export your data.');
    }
  };
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };
  
  const navigateToSettings = () => {
    navigation.navigate('Settings' as never);
  };
  
  const navigateToInsights = () => {
    navigation.navigate('Insights' as never);
  };
  
  const memberSince = profile?.createdAt
    ? format(profile.createdAt, 'MMMM yyyy')
    : user?.metadata?.creationTime
    ? format(new Date(user.metadata.creationTime), 'MMMM yyyy')
    : 'Unknown';
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#F59E0B"
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <ScreenHeader
          title="Profile"
          rightComponent={
            <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#374151" />
            </TouchableOpacity>
          }
        />
        
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              uri={user?.photoURL}
              name={profile?.displayName || user?.displayName || user?.email}
              size="large"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.displayName || user?.displayName || 'Beer Enthusiast'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.memberBadge}>
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text style={styles.memberText}>Member since {memberSince}</Text>
              </View>
            </View>
          </View>
        </Card>
        
        {/* Quick Stats */}
        <Card style={styles.card}>
          <CardSection>
            <Text style={styles.cardTitle}>Your Stats</Text>
          </CardSection>
          <CardDivider />
          {insightsLoading ? (
            <LoadingSpinner size="small" />
          ) : insights ? (
            <>
              <StatRow
                icon="beer-outline"
                label="Beers Logged"
                value={insights.totalEntries}
                color="#F59E0B"
              />
              <StatRow
                icon="star"
                label="Average Rating"
                value={insights.avgRating.toFixed(1)}
                color="#F59E0B"
              />
              <StatRow
                icon="location-outline"
                label="Cities Visited"
                value={insights.totalCities}
                color="#3B82F6"
              />
              <StatRow
                icon="pint-outline"
                label="Styles Tried"
                value={insights.totalStyles}
                color="#8B5CF6"
              />
              <StatRow
                icon="repeat-outline"
                label="Would Buy Again"
                value={`${insights.repeatBuyRate}%`}
                color="#10B981"
              />
            </>
          ) : (
            <Text style={styles.noData}>Start logging beers to see your stats!</Text>
          )}
          <CardDivider />
          <TouchableOpacity onPress={navigateToInsights} style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>View Full Insights</Text>
            <Ionicons name="arrow-forward" size={16} color="#F59E0B" />
          </TouchableOpacity>
        </Card>
        
        {/* Data Management */}
        <Card style={styles.card}>
          <CardSection>
            <Text style={styles.cardTitle}>Data</Text>
          </CardSection>
          <CardDivider />
          <MenuItem
            icon="download-outline"
            label="Export Data (CSV)"
            onPress={handleExportData}
          />
          {isExporting && (
            <View style={styles.exportingIndicator}>
              <LoadingSpinner size="small" />
              <Text style={styles.exportingText}>Preparing export...</Text>
            </View>
          )}
        </Card>
        
        {/* AI Sommelier - Featured */}
        <TouchableOpacity 
          style={styles.sommelierCard}
          onPress={() => navigation.navigate('Sommelier' as never)}
          activeOpacity={0.9}
        >
          <View style={styles.sommelierGradient}>
            <View style={styles.sommelierIcon}>
              <Text style={styles.sommelierEmoji}>🍺</Text>
            </View>
            <View style={styles.sommelierText}>
              <Text style={styles.sommelierTitle}>AI Beer Sommelier</Text>
              <Text style={styles.sommelierDesc}>Get personalized recommendations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
        
        {/* Features */}
        <Card style={styles.card}>
          <CardSection>
            <Text style={styles.cardTitle}>Features</Text>
          </CardSection>
          <CardDivider />
          <MenuItem
            icon="sparkles-outline"
            label="Your Taste Profile"
            onPress={() => navigation.navigate('FlavorProfile' as never)}
            color="#8B5CF6"
          />
          <MenuItem
            icon="bookmark-outline"
            label="Wishlist"
            onPress={() => navigation.navigate('Wishlist' as never)}
            color="#3B82F6"
          />
          <MenuItem
            icon="trophy-outline"
            label="Achievements"
            onPress={() => navigation.navigate('Achievements' as never)}
            color="#F59E0B"
          />
          <MenuItem
            icon="school-outline"
            label="Beer Style Guide"
            onPress={() => navigation.navigate('StyleGuide' as never)}
            color="#10B981"
          />
          <MenuItem
            icon="stats-chart-outline"
            label="Drinking Stats & Health"
            onPress={() => navigation.navigate('DrinkingStats' as never)}
            color="#EF4444"
          />
        </Card>
        
        {/* Quick Actions */}
        <Card style={styles.card}>
          <CardSection>
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </CardSection>
          <CardDivider />
          <MenuItem
            icon="settings-outline"
            label="App Settings"
            onPress={navigateToSettings}
          />
          <MenuItem
            icon="analytics-outline"
            label="View Insights"
            onPress={navigateToInsights}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert('Coming Soon', 'Help documentation is coming soon!')}
          />
        </Card>
        
        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            size="large"
            icon={<Ionicons name="log-out-outline" size={20} color="#F59E0B" />}
          />
        </View>
        
        {/* App Version */}
        <Text style={styles.versionText}>Beer Diary v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  settingsButton: {
    padding: 4,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  memberText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statIcon: {
    marginRight: 12,
    width: 24,
  },
  statLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  noData: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginRight: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  exportingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  exportingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  signOutContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  sommelierCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sommelierGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F59E0B',
  },
  sommelierIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sommelierEmoji: {
    fontSize: 24,
  },
  sommelierText: {
    flex: 1,
  },
  sommelierTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  sommelierDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
