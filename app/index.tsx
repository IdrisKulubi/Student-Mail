import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (session) {
      // User is authenticated, go to main app
      router.replace('/(tabs)');
    } else {
      // User is not authenticated, go to login
      router.replace('/login');
    }
  }, [session, loading]);

  // Show loading screen while determining auth state
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
} 