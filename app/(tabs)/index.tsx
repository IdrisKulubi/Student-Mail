import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { getUserProfile, getUserStats, isProfileComplete, UserProfile, UserStats } from '../../actions';
import AuthDebug from '../../components/AuthDebug';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    unreadEmails: 0,
    jobApplications: 0,
    moodEntries: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error checking user profile:', error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      const userStats = await getUserStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserStats()]);
    setRefreshing(false);
  };

  const needsProfileSetup = !profileLoading && !isProfileComplete(userProfile);

  const StatCard = ({ icon, title, value, color }: {
    icon: string;
    title: string;
    value: number | string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const QuickAction = ({ icon, title, onPress, color }: {
    icon: string;
    title: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  useFocusEffect(
    React.useCallback(() => {
      console.log('Dashboard focused, refreshing profile data');
      fetchUserProfile();
      fetchUserStats();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>{user?.user_metadata?.full_name || 'Student'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
            {stats.unreadEmails > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>

        {/* Profile Setup Banner */}
        {needsProfileSetup && (
          <View style={styles.setupBanner}>
            <View style={styles.setupBannerContent}>
              <View style={styles.setupBannerIcon}>
                <Ionicons name="person-add" size={24} color="#4F46E5" />
              </View>
              <View style={styles.setupBannerText}>
                <Text style={styles.setupBannerTitle}>Complete Your Profile</Text>
                <Text style={styles.setupBannerSubtitle}>
                  Add your university and major to get personalized recommendations
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.setupBannerButton}
                onPress={() => {
                  router.push('/profile-setup');
                }}
              >
                <Text style={styles.setupBannerButtonText}>Complete</Text>
                <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="flame"
              title="Current Streak"
              value={`${stats.currentStreak} days`}
              color="#F59E0B"
            />
            <StatCard
              icon="trophy"
              title="Total XP"
              value={stats.totalXp}
              color="#8B5CF6"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="mail"
              title="Unread Emails"
              value={stats.unreadEmails}
              color="#EF4444"
            />
            <StatCard
              icon="briefcase"
              title="Applications"
              value={stats.jobApplications}
              color="#10B981"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="mail"
              title="Check Emails"
              onPress={() => router.push('/(tabs)/emails')}
              color="#4F46E5"
            />
            <QuickAction
              icon="search"
              title="Find Jobs"
              onPress={() => router.push('/(tabs)/jobs')}
              color="#059669"
            />
            <QuickAction
              icon="heart"
              title="Log Mood"
              onPress={() => router.push('/(tabs)/wellness')}
              color="#DC2626"
            />
            <QuickAction
              icon="document-text"
              title="Build Resume"
              onPress={() => {/* Navigate to resume builder */}}
              color="#7C3AED"
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.activityText}>
              No recent activity. Start by checking your emails!
            </Text>
          </View>
        </View>

        {/* Motivational Quote */}
        <View style={styles.quoteCard}>
          <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
          <Text style={styles.quoteText}>
            &quot;Success is not final, failure is not fatal: it is the courage to continue that counts.&quot;
          </Text>
          <Text style={styles.quoteAuthor}>- Winston Churchill</Text>
        </View>

        {/* Debug Info - Remove this after testing */}
        <AuthDebug />
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
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  quoteCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  quoteText: {
    fontSize: 16,
    color: '#92400E',
    fontStyle: 'italic',
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#B45309',
    fontWeight: '500',
  },
  setupBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  setupBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setupBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  setupBannerText: {
    flex: 1,
  },
  setupBannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  setupBannerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  setupBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  setupBannerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginRight: 4,
  },
});
