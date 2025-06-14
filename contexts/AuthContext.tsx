import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOrUpdateUserFromAuth, getUserProfile, testDatabaseConnection } from '../actions';

WebBrowser.maybeCompleteAuthSession();

const PROVIDER_TOKEN_KEY = 'gmail_provider_token';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  providerToken: string | null;
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
  const [providerToken, setProviderToken] = useState<string | null>(null);

  // Use custom scheme for better redirect handling
  const redirectTo = AuthSession.makeRedirectUri({
    scheme: 'stickersmash',
  });

  console.log('Configured redirect URL:', redirectTo);

  useEffect(() => {
    const initializeAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session check:', session ? 'Found session' : 'No session');
      
      // Load provider token from AsyncStorage
      const storedProviderToken = await AsyncStorage.getItem(PROVIDER_TOKEN_KEY);
      console.log('Stored provider token found:', !!storedProviderToken);
      
      if (session) {
        console.log('Initial session user:', session.user.email);
        console.log('Initial session has provider_token:', !!session.provider_token);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Use stored provider token if available, otherwise use session provider token
      const finalProviderToken = storedProviderToken || session?.provider_token || null;
      setProviderToken(finalProviderToken);
      console.log('Final provider token set:', !!finalProviderToken);
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      console.log('Auth state change session:', session ? 'Session exists' : 'No session');
      if (session) {
        console.log('Session user:', session.user.email);
        console.log('Session has provider_token:', !!session.provider_token);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Update provider token if available in session
      if (session?.provider_token) {
        setProviderToken(session.provider_token);
        await AsyncStorage.setItem(PROVIDER_TOKEN_KEY, session.provider_token);
        console.log('Provider token saved to AsyncStorage');
      } else if (event === 'SIGNED_OUT') {
        // Clear provider token on sign out
        setProviderToken(null);
        await AsyncStorage.removeItem(PROVIDER_TOKEN_KEY);
        console.log('Provider token cleared from AsyncStorage');
      }

      // Create or update user profile when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in successfully, creating/updating profile');
        // Don't await this - let it run in background to avoid blocking navigation
        createOrUpdateUserProfile(session.user).catch(error => {
          console.error('Background profile creation failed:', error);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      console.log('Creating/updating user profile for:', user.email);
      
      // Add a longer timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile creation timeout')), 15000); // Increased to 15 seconds
      });
      
      const profilePromise = createOrUpdateUserFromAuth(user);
      
      await Promise.race([profilePromise, timeoutPromise]);
      console.log('User profile created/updated successfully');
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      // Don't throw here to prevent auth flow from breaking
      // The app will handle profile completion check in the navigation logic
      console.log('Profile creation failed, but continuing with auth flow');
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
        
        if (result.type === 'success' && result.url) {
          console.log('OAuth redirect successful, processing callback URL');
          
          // Extract the session from the callback URL
          const url = new URL(result.url);
          const fragment = url.hash.substring(1); // Remove the '#'
          const params = new URLSearchParams(fragment);
          
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          const provider_token = params.get('provider_token');
          const provider_refresh_token = params.get('provider_refresh_token');
          
          if (access_token && refresh_token) {
            console.log('Tokens found in callback, setting session manually');
            console.log('Provider token found:', !!provider_token);
            
            // Set the session manually using the tokens from the callback
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              throw sessionError;
            }
            
            // If we have a provider token, we need to update the session to include it
            // This is a workaround since setSession doesn't accept provider tokens directly
            if (provider_token && sessionData.session) {
              console.log('Updating session with provider token');
              // Store provider tokens in session user_metadata as a workaround
              const updatedSession = {
                ...sessionData.session,
                provider_token,
                provider_refresh_token,
              };
              setSession(updatedSession as any);
              setProviderToken(provider_token);
              
              // Save provider token to AsyncStorage for persistence
              await AsyncStorage.setItem(PROVIDER_TOKEN_KEY, provider_token);
              console.log('Provider token saved to AsyncStorage during OAuth');
            }
            
            console.log('Session set successfully:', sessionData.session ? 'Session exists' : 'No session');
            if (sessionData.session) {
              console.log('Session user:', sessionData.session.user.email);
              console.log('Session has provider_token:', !!provider_token);
            }
          } else {
            console.error('No tokens found in OAuth callback URL');
            throw new Error('OAuth callback did not contain required tokens');
          }
        } else if (result.type === 'cancel') {
          console.log('User cancelled OAuth flow');
          // Don't throw an error for cancellation
          return;
        } else {
          console.error('OAuth flow failed:', result);
          throw new Error('OAuth authentication failed');
        }
      }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      // Clear provider token
      setProviderToken(null);
      await AsyncStorage.removeItem(PROVIDER_TOKEN_KEY);
      console.log('Provider token cleared during sign out');
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
    providerToken,
    signInWithGoogle,
    signOut,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 