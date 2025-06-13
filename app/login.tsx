import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
          console.error('Supabase connection error:', error);
          setConnectionStatus('error');
        } else {
          console.log('Supabase connected successfully');
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('error');
      }
    };

    testConnection();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Success will be handled by the auth context
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Sign In Error', 
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>StudentHub</Text>
          <Text style={styles.subtitle}>
            Your all-in-one platform for emails, jobs, wellness, and more
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="mail" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Smart Email Management</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="briefcase" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Job Opportunities</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="heart" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Mental Health Tracking</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="ticket" size={24} color="#4F46E5" />
            <Text style={styles.featureText}>Ticket Marketplace</Text>
          </View>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text style={styles.signInButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={styles.connectionIndicator}>
            {connectionStatus === 'checking' && (
              <>
                <ActivityIndicator size="small" color="#6B7280" />
                <Text style={styles.connectionText}>Connecting to server...</Text>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.connectionText, { color: '#10B981' }]}>Connected</Text>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={[styles.connectionText, { color: '#EF4444' }]}>Connection Error</Text>
              </>
            )}
          </View>
        </View>

        {/* Debug: Test OAuth URL Generation */}
        {connectionStatus === 'connected' && (
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={async () => {
              try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: 'https://your-project.supabase.co/auth/v1/callback',
                  },
                });
                console.log('Debug OAuth test:', { data, error });
                Alert.alert('Debug', `OAuth URL: ${data?.url || 'No URL generated'}\nError: ${error?.message || 'None'}`);
              } catch (err: any) {
                console.error('Debug OAuth error:', err);
                Alert.alert('Debug Error', err.message);
              }
            }}
          >
            <Text style={styles.debugButtonText}>🔧 Test OAuth (Debug)</Text>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    color: '#6B7280',
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  connectionStatus: {
    marginBottom: 16,
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  debugButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 