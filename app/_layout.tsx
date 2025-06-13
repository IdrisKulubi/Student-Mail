import React, { useEffect, useState, useRef } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { supabase } from '../lib/supabase';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [profileLoading, setProfileLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigationInProgress = useRef(false);
  const profileJustCompleted = useRef(false);

  // Check user profile completeness
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!session?.user?.id) {
        setUserProfile(null);
        return;
      }

      setProfileLoading(true);
      try {
        console.log('Checking user profile for:', session.user.email);
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        } else {
          console.log('User profile data:', profile);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    checkUserProfile();
  }, [session?.user?.id]);

  // Additional effect to refresh profile when in tabs
  useEffect(() => {
    const currentPath = segments.join('/');
    if (currentPath.includes('(tabs)') && session?.user?.id && (!userProfile || !userProfile.university || !userProfile.major)) {
      console.log('In tabs but profile appears incomplete, refreshing...');
      // Refresh profile data after a short delay
      setTimeout(() => {
        const refreshProfile = async () => {
          try {
            const { data: profile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!error && profile && profile.university && profile.major) {
              console.log('Profile refresh found complete data:', profile);
              setUserProfile(profile);
            }
          } catch (error) {
            console.error('Error refreshing profile:', error);
          }
        };
        refreshProfile();
      }, 1000);
    }
  }, [segments, session?.user?.id, userProfile]);

  // Handle navigation logic
  useEffect(() => {
    // Don't do anything while loading or if navigation is in progress
    if (loading || profileLoading || navigationInProgress.current) {
      return;
    }

    // Wait for initial auth check to complete
    if (!initialCheckDone) {
      setInitialCheckDone(true);
      return;
    }

    const currentPath = segments.join('/');
    console.log('Navigation check:', { 
      currentPath, 
      segments, 
      hasSession: !!session, 
      hasUser: !!user,
      userProfile: userProfile ? {
        id: userProfile.id,
        university: userProfile.university,
        major: userProfile.major,
        hasRequiredFields: !!(userProfile.university && userProfile.major)
      } : null
    });

    // Prevent multiple rapid navigations
    navigationInProgress.current = true;

    // Increase delay to allow for database updates to propagate
    setTimeout(() => {
      try {
        if (!session) {
          // No session - go to login
          if (currentPath !== 'login') {
            console.log('No session, navigating to login');
            router.replace('/login');
          }
        } else if (session && user) {
          // Has session - check profile completeness
          const needsProfileSetup = !userProfile || !userProfile.university || !userProfile.major;
          
          console.log('Profile setup check:', {
            needsProfileSetup,
            hasProfile: !!userProfile,
            hasUniversity: !!userProfile?.university,
            hasMajor: !!userProfile?.major
          });
          
          if (needsProfileSetup) {
            // Needs profile setup - go directly to profile setup
            if (currentPath !== 'profile-setup') {
              console.log('Profile setup needed, going to profile setup');
              router.replace('/profile-setup');
            }
          } else {
            // Profile complete - go to main app
            if (!currentPath.includes('(tabs)')) {
              console.log('Profile complete, going to main app');
              router.replace('/(tabs)');
            } else {
              // Already in tabs and profile is complete - stop checking
              console.log('Already in main app with complete profile');
            }
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
      } finally {
        // Reset navigation flag after a delay
        setTimeout(() => {
          navigationInProgress.current = false;
        }, 1500); // Increased delay
      }
    }, 300); // Increased initial delay

  }, [session, user, userProfile, loading, profileLoading, segments, initialCheckDone]);

  if (loading || profileLoading || !initialCheckDone) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
          {loading ? 'Loading...' : profileLoading ? 'Checking profile...' : 'Initializing...'}
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
