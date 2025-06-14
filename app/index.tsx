import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, isProfileComplete } from '../actions';

export default function Index() {
  const { session, loading, user } = useAuth();
  const router = useRouter();

  console.log('Index render - Auth state:', {
    loading,
    hasSession: !!session,
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.id
  });

  useEffect(() => {
    console.log('Index useEffect triggered with:', {
      loading,
      hasSession: !!session,
      hasUser: !!user,
      userEmail: user?.email
    });

    // Auth state is still loading, do nothing.
    if (loading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    // No session, user is not logged in.
    if (!session || !user) {
      console.log('No session or user found, redirecting to login');
      router.replace('/login');
      return;
    }

    console.log('User authenticated, checking profile for:', user.email);

    // Session exists, check for a complete profile.
    let profileCheckCompleted = false;
    const checkProfile = async () => {
      try {
        console.log('Fetching user profile for:', user.id);
        const profile = await getUserProfile(user.id);
        console.log('Profile fetch result:', profile);
        
        if (isProfileComplete(profile)) {
          // Profile is complete, go to the main app.
          console.log('Profile is complete, navigating to main app');
          router.replace('/(tabs)');
        } else {
          // Profile is not complete, go to the setup page.
          console.log('Profile is incomplete, navigating to profile setup');
          router.replace('/profile-setup');
        }
      } catch (error) {
        console.error('Failed to get user profile, redirecting to setup:', error);
        // If there's any error, it's safest to assume the profile needs setup.
        console.log('Profile check failed, defaulting to profile setup');
        router.replace('/profile-setup');
      } finally {
        profileCheckCompleted = true;
      }
    };

    checkProfile();

  }, [session, loading, user, router]);

  // Show a loading screen while we determine the correct route.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={{ marginTop: 20, fontSize: 16, color: '#6B7280' }}>
        Loading...
      </Text>
    </View>
  );
} 