import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Header } from '@/components/common/Header';
import { Card, CardSection, CardDivider } from '@/components/common/Card';
import { Toggle } from '@/components/common/Toggle';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

import { useAuth } from '@/providers/AuthProvider';
import { CURRENCIES, VOLUME_UNITS, STORAGE_KEYS } from '@/config/constants';
import { UserProfile } from '@/types';
import { BeerAI, setAPIKey, hasAPIKey } from '@/services/aiService';

// ============================================
// TYPES
// ============================================

interface AppPreferences {
  defaultCurrency: string;
  defaultVolumeUnit: 'ml' | 'oz' | 'pint';
  sharePublicDefault: boolean;
  enableLocationTracking: boolean;
  darkMode: boolean;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  defaultCurrency: 'USD',
  defaultVolumeUnit: 'ml',
  sharePublicDefault: false,
  enableLocationTracking: true,
  darkMode: false,
};

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  title: string;
}

function SectionHeader({ title }: SectionHeaderProps): JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SettingsScreen(): JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, profile, updateProfile, signOut, sendPasswordReset } = useAuth();
  
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // AI API Keys
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(hasAPIKey());
  
  // Load preferences
  useEffect(() => {
    loadPreferences();
  }, []);
  
  // Track changes
  useEffect(() => {
    const nameChanged = displayName !== (profile?.displayName || user?.displayName || '');
    const prefsChanged = JSON.stringify(preferences) !== JSON.stringify(profile?.preferences || DEFAULT_PREFERENCES);
    setHasChanges(nameChanged || prefsChanged);
  }, [displayName, preferences, profile, user]);
  
  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      } else if (profile?.preferences) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          defaultCurrency: profile.preferences.defaultCurrency || 'USD',
          defaultVolumeUnit: profile.preferences.defaultVolumeUnit || 'ml',
          sharePublicDefault: profile.preferences.sharePublicDefault || false,
        });
      }
      
      // Load API keys
      const storedOpenai = await AsyncStorage.getItem('@beer_openai_key');
      const storedAnthropic = await AsyncStorage.getItem('@beer_anthropic_key');
      if (storedOpenai) {
        setOpenaiKey(storedOpenai);
        setAPIKey('openai', storedOpenai);
      }
      if (storedAnthropic) {
        setAnthropicKey(storedAnthropic);
        setAPIKey('anthropic', storedAnthropic);
      }
      setAiConfigured(hasAPIKey());
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveApiKey = async (provider: 'openai' | 'anthropic', key: string) => {
    try {
      const storageKey = provider === 'openai' ? '@beer_openai_key' : '@beer_anthropic_key';
      if (key.trim()) {
        await AsyncStorage.setItem(storageKey, key.trim());
        setAPIKey(provider, key.trim());
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
      setAiConfigured(hasAPIKey());
      Alert.alert('Success', `${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key ${key.trim() ? 'saved' : 'removed'}.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key.');
    }
  };
  
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      
      // Update profile in Firebase
      const profileUpdates: Partial<UserProfile> = {
        displayName: displayName.trim() || undefined,
        preferences: {
          defaultCurrency: preferences.defaultCurrency,
          defaultVolumeUnit: preferences.defaultVolumeUnit,
          sharePublicDefault: preferences.sharePublicDefault,
        },
      };
      
      await updateProfile(profileUpdates);
      
      Alert.alert('Success', 'Your settings have been saved.');
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) {
      Alert.alert('Error', 'No email address associated with this account.');
      return;
    }
    
    Alert.alert(
      'Reset Password',
      `We'll send a password reset link to ${user.email}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            const result = await sendPasswordReset(user.email!);
            if (result.success) {
              Alert.alert('Email Sent', 'Check your inbox for the password reset link.');
            } else {
              Alert.alert('Error', result.error || 'Failed to send reset email.');
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your beer diary entries. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    // In a real app, you would delete the user's data and account here
                    Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };
  
  const handleSignOut = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before signing out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: "Don't Save",
            style: 'destructive',
            onPress: async () => {
              await signOut();
            },
          },
          {
            text: 'Save & Sign Out',
            onPress: async () => {
              await savePreferences();
              await signOut();
            },
          },
        ]
      );
    } else {
      signOut();
    }
  };
  
  const updatePreference = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };
  
  const currencyOptions = CURRENCIES.map(c => ({ value: c.code, label: `${c.symbol} ${c.name}` }));
  const volumeOptions = VOLUME_UNITS.map(v => ({ value: v.code, label: v.name }));
  
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title="Settings"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <LoadingSpinner fullScreen />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Settings"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          hasChanges ? (
            <TouchableOpacity onPress={savePreferences} disabled={isSaving}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Account Settings */}
        <SectionHeader title="Account" />
        <Card style={styles.card}>
          <CardSection>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              containerStyle={styles.input}
            />
          </CardSection>
          <CardDivider />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
          </View>
        </Card>
        
        {/* Defaults */}
        <SectionHeader title="Defaults" />
        <Card style={styles.card}>
          <Select
            label="Default Currency"
            value={preferences.defaultCurrency}
            options={currencyOptions}
            onChange={(value) => updatePreference('defaultCurrency', value)}
          />
          <Select
            label="Default Volume Unit"
            value={preferences.defaultVolumeUnit}
            options={volumeOptions}
            onChange={(value) => updatePreference('defaultVolumeUnit', value as 'ml' | 'oz' | 'pint')}
          />
        </Card>
        
        {/* Privacy */}
        <SectionHeader title="Privacy" />
        <Card style={styles.card}>
          <Toggle
            label="Share Entries Publicly"
            description="New entries will be shared by default"
            value={preferences.sharePublicDefault}
            onValueChange={(value) => updatePreference('sharePublicDefault', value)}
            icon="globe-outline"
          />
          <CardDivider />
          <Toggle
            label="Location Tracking"
            description="Record where you drink your beers"
            value={preferences.enableLocationTracking}
            onValueChange={(value) => updatePreference('enableLocationTracking', value)}
            icon="location-outline"
          />
        </Card>
        
        {/* AI Sommelier */}
        <SectionHeader title="AI Sommelier" />
        <Card style={styles.card}>
          <View style={styles.aiStatusRow}>
            <View style={styles.aiStatusInfo}>
              <View style={[styles.aiStatusDot, { backgroundColor: aiConfigured ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.aiStatusText}>
                {aiConfigured ? 'AI Enabled' : 'No API Key'}
              </Text>
            </View>
            <Text style={styles.aiStatusHint}>
              {aiConfigured ? 'Real AI recommendations active' : 'Using local recommendations'}
            </Text>
          </View>
          <CardDivider />
          <View style={styles.apiKeySection}>
            <View style={styles.apiKeyHeader}>
              <Text style={styles.apiKeyLabel}>OpenAI API Key</Text>
              <TouchableOpacity onPress={() => setShowOpenaiKey(!showOpenaiKey)}>
                <Ionicons name={showOpenaiKey ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.apiKeyInputRow}>
              <Input
                value={openaiKey}
                onChangeText={setOpenaiKey}
                placeholder="sk-..."
                secureTextEntry={!showOpenaiKey}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.apiKeyInput}
              />
              <TouchableOpacity 
                style={styles.apiKeySaveButton} 
                onPress={() => saveApiKey('openai', openaiKey)}
              >
                <Text style={styles.apiKeySaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
          <CardDivider />
          <View style={styles.apiKeySection}>
            <View style={styles.apiKeyHeader}>
              <Text style={styles.apiKeyLabel}>Anthropic API Key</Text>
              <TouchableOpacity onPress={() => setShowAnthropicKey(!showAnthropicKey)}>
                <Ionicons name={showAnthropicKey ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.apiKeyInputRow}>
              <Input
                value={anthropicKey}
                onChangeText={setAnthropicKey}
                placeholder="sk-ant-..."
                secureTextEntry={!showAnthropicKey}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.apiKeyInput}
              />
              <TouchableOpacity 
                style={styles.apiKeySaveButton} 
                onPress={() => saveApiKey('anthropic', anthropicKey)}
              >
                <Text style={styles.apiKeySaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.apiKeyNote}>
            Get keys from openai.com or anthropic.com. Keys are stored securely on your device only.
          </Text>
        </Card>
        
        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <Card style={styles.card}>
          <Toggle
            label="Dark Mode"
            description="Coming soon!"
            value={preferences.darkMode}
            onValueChange={(value) => updatePreference('darkMode', value)}
            icon="moon-outline"
            disabled
          />
        </Card>
        
        {/* Security */}
        <SectionHeader title="Security" />
        <Card style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={handlePasswordReset}>
            <Ionicons name="key-outline" size={22} color="#374151" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Reset Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </Card>
        
        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <Card style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" style={styles.menuIcon} />
            <Text style={[styles.menuLabel, styles.dangerText]}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
          </TouchableOpacity>
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
        
        {isSaving && (
          <View style={styles.savingOverlay}>
            <LoadingSpinner size="small" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 4,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  input: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
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
  dangerText: {
    color: '#EF4444',
  },
  signOutContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  savingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  savingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  // AI Section styles
  aiStatusRow: {
    paddingVertical: 12,
  },
  aiStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  aiStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  aiStatusHint: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 16,
  },
  apiKeySection: {
    paddingVertical: 12,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  apiKeyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  apiKeyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apiKeyInput: {
    flex: 1,
    marginBottom: 0,
  },
  apiKeySaveButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  apiKeySaveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  apiKeyNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
    lineHeight: 18,
  },
});
