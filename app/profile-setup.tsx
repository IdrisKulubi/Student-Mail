import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { completeUserProfile } from '../actions';
import { supabase } from '../lib/supabase';

export default function ProfileSetupScreen() {
  const { user, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    university: '',
    major: '',
    graduationYear: '',
    careerGoals: '',
  });

  const handleSave = async () => {
    // Validate required fields
    if (!formData.university?.trim() || !formData.major?.trim()) {
      Alert.alert('Required Fields', 'Please fill in your university and major');
      return;
    }

    // Validate graduation year if provided
    if (formData.graduationYear && (isNaN(parseInt(formData.graduationYear)) || parseInt(formData.graduationYear) < 2020 || parseInt(formData.graduationYear) > 2030)) {
      Alert.alert('Invalid Year', 'Please enter a valid graduation year between 2020 and 2030');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    try {
      setLoading(true);
      console.log('Saving profile data:', formData);
      
      await completeUserProfile(user.id, {
        university: formData.university,
        major: formData.major,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        career_goals: formData.careerGoals,
      });

      console.log('Profile saved successfully');
      
      // Refresh the user profile data in the auth context
      await refreshUserProfile();
      
      // Navigate directly without showing alert to avoid timing issues
      console.log('Navigating to main app after profile completion');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Profile save error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to save profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>University *</Text>
            <TextInput
              style={styles.input}
              value={formData.university}
              onChangeText={(text) => setFormData({ ...formData, university: text })}
              placeholder="e.g., University of California, Berkeley"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Major *</Text>
            <TextInput
              style={styles.input}
              value={formData.major}
              onChangeText={(text) => setFormData({ ...formData, major: text })}
              placeholder="e.g., Computer Science"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Graduation Year</Text>
            <TextInput
              style={styles.input}
              value={formData.graduationYear}
              onChangeText={(text) => setFormData({ ...formData, graduationYear: text })}
              placeholder="e.g., 2025"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Career Goals</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.careerGoals}
              onChangeText={(text) => setFormData({ ...formData, careerGoals: text })}
              placeholder="Tell us about your career aspirations..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearSessionButton}
          onPress={() => {
            Alert.alert(
              'Clear Session',
              'This will completely clear your session and force you to sign in again with fresh Gmail permissions.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear Session',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      console.log('Force clearing session from profile setup...');
                      
                      // Import AsyncStorage
                      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                      
                      // Clear all AsyncStorage
                      await AsyncStorage.clear();
                      console.log('AsyncStorage cleared');
                      
                      // Clear Supabase session
                      await supabase.auth.signOut();
                      console.log('Supabase session cleared');
                      
                      Alert.alert('Success', 'Session cleared! Please restart the app completely and sign in again.');
                    } catch (error: any) {
                      console.error('Error clearing session:', error);
                      Alert.alert('Error', 'Failed to clear session: ' + (error?.message || 'Unknown error'));
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.clearSessionButtonText}>🗑️ Clear Session & Start Fresh</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  header: {
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearSessionButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  clearSessionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 