import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { getUserProfile, isProfileComplete, UserProfile } from '../actions';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);

  // Check user profile when session changes
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!session?.user?.id) {
        setUserProfile(null);
        setNavigationReady(true);
        return;
      }

      setProfileLoading(true);
      try {
        console.log('Fetching user profile for:', session.user.id);
        const profile = await getUserProfile(session.user.id);
        console.log('User profile data:', profile);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error checking user profile:', error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
        setNavigationReady(true);
      }
    };

    if (!loading) {
      checkUserProfile();
    }
  }, [session?.user?.id, loading]);

  // Simple navigation logic
  useEffect(() => {
    if (!navigationReady || loading || profileLoading) {
      return;
    }

    const currentPath = segments.join('/');
    console.log('Navigation check:', { 
      currentPath, 
      hasSession: !!session, 
      hasUser: !!user,
      profileComplete: isProfileComplete(userProfile)
    });

    // Simple navigation logic without complex delays
    if (!session) {
      // No session - go to login
      if (currentPath !== 'login') {
        console.log('No session, navigating to login');
        router.replace('/login');
      }
    } else if (session && user) {
      // Has session - check profile completeness
      if (!isProfileComplete(userProfile)) {
        // Needs profile setup
        if (currentPath !== 'profile-setup') {
          console.log('Profile setup needed, going to profile setup');
          router.replace('/profile-setup');
        }
      } else {
        // Profile complete - go to main app
        if (!currentPath.includes('(tabs)')) {
          console.log('Profile complete, going to main app');
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, user, userProfile, loading, profileLoading, navigationReady, segments]);

  if (loading || profileLoading || !navigationReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
          {loading ? 'Signing in...' : profileLoading ? 'Setting up profile...' : 'Loading...'}
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
