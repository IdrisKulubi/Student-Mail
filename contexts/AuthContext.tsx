import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createOrUpdateUserFromAuth, getUserProfile, testDatabaseConnection } from '../actions';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Use custom scheme for better redirect handling
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'stickersmash',
  });

  console.log('Configured redirect URL:', redirectTo);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Don't create profile automatically - let the navigation logic handle it
      // This prevents the app from getting stuck during auth
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, profile creation will be handled by navigation logic');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      console.log('Creating/updating user profile for:', user.email);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile creation timeout')), 8000); // 8 second timeout
      });
      
      const profilePromise = createOrUpdateUserFromAuth(user);
      
      await Promise.race([profilePromise, timeoutPromise]);
      console.log('User profile created/updated successfully');
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      // Don't throw here to prevent auth flow from breaking
      // The app will handle profile completion check in the navigation logic
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Error starting Google sign in:', error);
        throw error;
      }

      if (data.url) {
        console.log('Opening OAuth URL:', data.url);
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        console.log('Browser auth session result:', result);
        if (result.type !== 'success') {
          // This could be 'cancel', 'dismiss', or 'error'.
          // The user might have cancelled the login.
          console.warn('Google sign in was not completed:', result.type);
        }
        // No need to manually handle the session here.
        // The onAuthStateChange listener will detect the SIGNED_IN event
        // once the redirect is completed and Supabase processes the session.
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      // It's useful to show an alert to the user here.
      // Alert.alert('Sign In Error', 'An unexpected error occurred during sign-in.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      console.log('Refreshing user profile data...');
      const profile = await getUserProfile(session.user.id);
      console.log('User profile refreshed:', profile);
      // Force a re-render by updating the session state
      setSession({ ...session });
    } catch (error) {
      console.error('Error in refreshUserProfile:', error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 