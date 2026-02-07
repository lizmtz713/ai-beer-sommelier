import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from '@/providers/AuthProvider';

// Screens
import { LoginScreen } from '@/screens/LoginScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { DiaryScreen } from '@/screens/DiaryScreen';
import { AddEntryScreen } from '@/screens/AddEntryScreen';
import { QuickLogScreen } from '@/screens/QuickLogScreen';
import { MapScreen } from '@/screens/MapScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { WishlistScreen } from '@/screens/WishlistScreen';
import { FlavorProfileScreen } from '@/screens/FlavorProfileScreen';
import { AchievementsScreen } from '@/screens/AchievementsScreen';
import { ShareCardScreen } from '@/screens/ShareCardScreen';
import { StyleGuideScreen } from '@/screens/StyleGuideScreen';
import { DrinkingStatsScreen } from '@/screens/DrinkingStatsScreen';
import { SommelierScreen } from '@/screens/SommelierScreen';

// ============================================
// QUERY CLIENT
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// ============================================
// NAVIGATION TYPES
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Diary: undefined;
  Map: undefined;
  Insights: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  AddEntry: { prefill?: { name?: string; brewery?: string; style?: string } } | undefined;
  QuickLog: undefined;
  EntryDetail: { entryId: string };
  Settings: undefined;
  Wishlist: undefined;
  FlavorProfile: undefined;
  Achievements: undefined;
  ShareCard: { beer?: any };
  StyleGuide: undefined;
  DrinkingStats: undefined;
  Sommelier: undefined;
};

// ============================================
// NAVIGATORS
// ============================================

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================
// AUTH NAVIGATOR
// ============================================

function AuthNavigator(): JSX.Element {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// ============================================
// TAB NAVIGATOR
// ============================================

function TabNavigator(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          switch (route.name) {
            case 'Diary':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Insights':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{ tabBarLabel: 'Diary' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: 'Map' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// MAIN NAVIGATOR
// ============================================

function MainNavigator(): JSX.Element {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="QuickLog"
        component={QuickLogScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <RootStack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <RootStack.Screen
        name="FlavorProfile"
        component={FlavorProfileScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <RootStack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <RootStack.Screen
        name="ShareCard"
        component={ShareCardScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="StyleGuide"
        component={StyleGuideScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <RootStack.Screen
        name="DrinkingStats"
        component={DrinkingStatsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <RootStack.Screen
        name="Sommelier"
        component={SommelierScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      {/* EntryDetail screen to be added when implemented */}
    </RootStack.Navigator>
  );
}

// ============================================
// LOADING SCREEN
// ============================================

function LoadingScreen(): JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <Ionicons name="beer" size={64} color="#F59E0B" />
      <ActivityIndicator size="large" color="#F59E0B" style={styles.spinner} />
    </View>
  );
}

// ============================================
// ROOT NAVIGATOR
// ============================================

function RootNavigator(): JSX.Element {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ============================================
// APP COMPONENT
// ============================================

export default function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});
