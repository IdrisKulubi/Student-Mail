import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createOrUpdateUserFromAuth, getUserProfile } from '../actions';

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

      // If user just signed in, create/update their profile
      if (event === 'SIGNED_IN' && session?.user) {
        await createOrUpdateUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateUserProfile = async (user: User) => {
    try {
      await createOrUpdateUserFromAuth(user);
    } catch (error) {
      console.error('Error in createOrUpdateUserProfile:', error);
      // Don't throw here to prevent auth flow from breaking
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in...');
      console.log('Redirect URL:', redirectTo);
      
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

      console.log('OAuth response:', { data, error });

      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }

      if (data?.url) {
        console.log('OAuth URL generated:', data.url);
        console.log('Opening browser for authentication...');
        
        // Open the OAuth URL in the browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );
        
        console.log('Browser result:', result);
        
        if (result.type === 'success') {
          console.log('OAuth completed successfully');
          console.log('OAuth result URL:', result.url);
          
          // Parse the URL to extract tokens
          if (result.url) {
            const url = new URL(result.url);
            const fragment = url.hash.substring(1);
            const params = new URLSearchParams(fragment);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
              console.log('Setting session with tokens...');
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error('Error setting session:', error);
                throw error;
              }
              
              console.log('Session set successfully:', data);
            }
          }
        } else if (result.type === 'cancel') {
          throw new Error('Authentication was cancelled');
        } else {
          throw new Error('Authentication failed');
        }
      } else {
        throw new Error('No OAuth URL generated');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
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