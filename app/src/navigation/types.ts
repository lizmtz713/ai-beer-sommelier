import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ============================================
// AUTH STACK
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// ============================================
// MAIN TAB NAVIGATOR
// ============================================

export type MainTabParamList = {
  Diary: undefined;
  Map: undefined;
  Insights: undefined;
  Profile: undefined;
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// ============================================
// ROOT STACK (above tabs)
// ============================================

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AddEntry: undefined;
  QuickLog: undefined;
  EntryDetail: { entryId: string };
  Settings: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ============================================
// COMPOSITE NAVIGATION PROPS
// ============================================

// Use this for screens in the tab navigator that also need to navigate to root stack screens
export type DiaryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Diary'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type MapScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type InsightsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Insights'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

// ============================================
// ROUTE PROPS
// ============================================

export type EntryDetailRouteProp = RouteProp<RootStackParamList, 'EntryDetail'>;

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isRootStackRoute(route: string): route is keyof RootStackParamList {
  return ['MainTabs', 'AddEntry', 'QuickLog', 'EntryDetail', 'Settings'].includes(route);
}

export function isMainTabRoute(route: string): route is keyof MainTabParamList {
  return ['Diary', 'Map', 'Insights', 'Profile'].includes(route);
}
