import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initializeFirebase,
  subscribeToAuthState,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} from '@/services/firebase';
import { UserProfile } from '@/types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@/config/firebase.config';

// ============================================
// TYPES
// ============================================

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signInGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });
  
  // Initialize Firebase and Google Sign-In
  useEffect(() => {
    initializeFirebase();
    
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);
  
  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (user) {
        // Fetch user profile
        const profile = await getUserProfile(user.uid);
        setState({
          user,
          profile,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    const result = await signInWithEmail(email, password);
    
    if (result.error) {
      setState((prev) => ({ ...prev, loading: false, error: result.error }));
      return { success: false, error: result.error };
    }
    
    return { success: true };
  }, []);
  
  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    const result = await signUpWithEmail(email, password, displayName);
    
    if (result.error) {
      setState((prev) => ({ ...prev, loading: false, error: result.error }));
      return { success: false, error: result.error };
    }
    
    return { success: true };
  }, []);
  
  // Sign in with Google
  const signInGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in with Google
      const { data } = await GoogleSignin.signIn();
      
      if (!data?.idToken) {
        throw new Error('No ID token returned from Google Sign-In');
      }
      
      // Sign in to Firebase with the Google credential
      const result = await signInWithGoogle(data.idToken);
      
      if (result.error) {
        setState((prev) => ({ ...prev, loading: false, error: result.error }));
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);
  
  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    
    try {
      // Sign out from Google if signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch {
      // Ignore Google sign out errors
    }
    
    await firebaseSignOut();
  }, []);
  
  // Send password reset email
  const sendPasswordReset = useCallback(async (email: string) => {
    const result = await resetPassword(email);
    
    if (result.error) {
      return { success: false, error: result.error };
    }
    
    return { success: true };
  }, []);
  
  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return;
    
    await updateUserProfile(state.user.uid, updates);
    
    // Refresh profile
    const profile = await getUserProfile(state.user.uid);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user]);
  
  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    
    const profile = await getUserProfile(state.user.uid);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user]);
  
  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signInGoogle,
    signOut,
    sendPasswordReset,
    updateProfile,
    refreshProfile,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================
// HELPER HOOKS
// ============================================

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function useUserId(): string | null {
  const user = useUser();
  return user?.uid ?? null;
}

export function useIsAuthenticated(): boolean {
  const user = useUser();
  return user !== null;
}
