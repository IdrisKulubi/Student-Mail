import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, isProfileComplete, createOrUpdateUserFromAuth } from '../actions';

export default function Index() {
  const { session, loading, user } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);

  // Debug logging
  console.log('Index component state:', {
    hasSession: !!session,
    hasUser: !!user,
    loading,
    profileLoading,
    userId: user?.id,
    userEmail: user?.email
  });

  useEffect(() => {
    const handleNavigation = async () => {
      console.log('handleNavigation called with:', { loading, hasSession: !!session, hasUser: !!user });
      
      if (loading) {
        console.log('Still loading auth, waiting...');
        return; // Wait for auth to load
      }

      if (!session) {
        // User is not authenticated, go to login
        console.log('No session found, redirecting to login');
        router.replace('/login');
        return;
      }

      // User is authenticated, check profile completion
      if (session && user) {
        console.log('User authenticated, starting profile flow for:', user.email);
        setProfileLoading(true);
        try {
          console.log('Checking user profile for:', user.id);
          
          // First, try to create/update the user profile if it doesn't exist
          console.log('Ensuring user profile exists...');
          try {
            // Add timeout to profile creation
            const createProfilePromise = createOrUpdateUserFromAuth(user);
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Profile creation timeout')), 10000);
            });
            
            await Promise.race([createProfilePromise, timeoutPromise]);
            console.log('User profile creation/update completed');
          } catch (profileError) {
            console.error('Profile creation failed, but continuing with check:', profileError);
            // Continue anyway - maybe the profile already exists
          }
          
          // Now check if profile is complete
          console.log('Checking profile completion...');
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Profile check timeout')), 8000);
          });
          
          const profilePromise = getUserProfile(user.id);
          const profile = await Promise.race([profilePromise, timeoutPromise]);
          
          console.log('Profile check result:', profile);
          
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
          console.error('Error in navigation flow:', error);
          
          // If everything fails, assume profile needs setup
          // This ensures the app doesn't get stuck
          console.log('Navigation flow failed, assuming profile needs setup');
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