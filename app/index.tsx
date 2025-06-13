import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, isProfileComplete } from '../actions';

export default function Index() {
  const { session, loading, user } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const handleNavigation = async () => {
      if (loading) return; // Wait for auth to load

      if (!session) {
        // User is not authenticated, go to login
        router.replace('/login');
        return;
      }

      // User is authenticated, check profile completion
      if (session && user) {
        setProfileLoading(true);
        try {
          console.log('Checking user profile for:', user.id);
          const profile = await getUserProfile(user.id);
          
          if (!isProfileComplete(profile)) {
            // Profile incomplete, go to profile setup
            console.log('Profile incomplete, navigating to profile setup');
            router.replace('/profile-setup');
          } else {
            // Profile complete, go to main app
            console.log('Profile complete, navigating to main app');
            router.replace('/(tabs)');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          // If error, assume profile needs setup
          router.replace('/profile-setup');
        } finally {
          setProfileLoading(false);
        }
      }
    };

    handleNavigation();
  }, [session, loading, user, router]);

  // Show loading screen while determining auth state and profile
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
        {loading ? 'Loading...' : profileLoading ? 'Checking profile...' : 'Starting app...'}
      </Text>
    </View>
  );
} 