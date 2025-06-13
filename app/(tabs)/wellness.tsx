import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WellnessScreen() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const moods = [
    { emoji: '😢', label: 'Sad', value: 1, color: '#EF4444' },
    { emoji: '😕', label: 'Down', value: 2, color: '#F59E0B' },
    { emoji: '😐', label: 'Okay', value: 3, color: '#6B7280' },
    { emoji: '😊', label: 'Good', value: 4, color: '#10B981' },
    { emoji: '😄', label: 'Great', value: 5, color: '#059669' },
  ];

  const wellnessFeatures = [
    {
      icon: 'journal',
      title: 'Daily Journal',
      description: 'AI-powered journaling assistant',
      color: '#8B5CF6',
    },
    {
      icon: 'people',
      title: 'Anonymous Confessions',
      description: 'Share thoughts safely with peers',
      color: '#EC4899',
    },
    {
      icon: 'fitness',
      title: 'Daily Challenges',
      description: 'Mindfulness and wellness tasks',
      color: '#10B981',
    },
    {
      icon: 'library',
      title: 'Resource Center',
      description: 'Mental health resources & contacts',
      color: '#F59E0B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wellness Hub</Text>
          <TouchableOpacity style={styles.statsButton}>
            <Ionicons name="analytics" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Mood Tracker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          <View style={styles.moodContainer}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodButton,
                  selectedMood === mood.value && {
                    backgroundColor: mood.color,
                    transform: [{ scale: 1.1 }],
                  },
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood === mood.value && { color: '#FFFFFF' },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {selectedMood && (
            <TouchableOpacity style={styles.saveMoodButton}>
              <Text style={styles.saveMoodButtonText}>Save Mood Entry</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={24} color="#F59E0B" />
            <Text style={styles.streakTitle}>Wellness Streak</Text>
          </View>
          <Text style={styles.streakCount}>7 days</Text>
          <Text style={styles.streakSubtext}>Keep it up! You&apos;re doing great.</Text>
        </View>

        {/* Wellness Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wellness Tools</Text>
          <View style={styles.featuresGrid}>
            {wellnessFeatures.map((feature, index) => (
              <TouchableOpacity key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Start Anonymous Chat</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={20} color="#EF4444" />
            <Text style={styles.actionButtonText}>Crisis Helpline</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="leaf" size={20} color="#10B981" />
            <Text style={styles.actionButtonText}>Guided Meditation</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  saveMoodButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveMoodButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  streakCard: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  streakSubtext: {
    fontSize: 14,
    color: '#B45309',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
}); 