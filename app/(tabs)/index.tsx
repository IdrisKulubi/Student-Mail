import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { getUserProfile, getUserStats, isProfileComplete, UserProfile, UserStats } from '../../actions';
import { useTheme } from '../../contexts/ThemeContext';
import { Animated3DCard } from '../../components/Animated3DCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AnimatedBackground } from '../../components/AnimatedBackground';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const welcomeScale = useSharedValue(0);

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
    
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    welcomeScale.value = withSpring(1, { damping: 20, stiffness: 100 });
  }, [user,fetchUserProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserStats()]);
    setRefreshing(false);
  };

  const needsProfileSetup = !profileLoading && !isProfileComplete(userProfile);

  // Helper function for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  const welcomeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: welcomeScale.value }],
    };
  });



  useFocusEffect(
    React.useCallback(() => {
      console.log('Dashboard focused, refreshing profile data');
      fetchUserProfile();
      fetchUserStats();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
        >
          {/* Animated Header */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <Animated.View style={welcomeAnimatedStyle}>
              <Text style={[styles.greeting, { color: colors.icon }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.user_metadata?.full_name || 'Student'} ✨
              </Text>
            </Animated.View>
            
            <View style={styles.headerActions}>
              <ThemeToggle />
              <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.card }]}>
                <Ionicons name="notifications-outline" size={24} color={colors.icon} />
                {stats.unreadEmails > 0 && (
                  <View style={[styles.notificationBadge, { backgroundColor: colors.error }]} />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Profile Setup Banner */}
          {needsProfileSetup && (
            <Animated.View 
              style={[
                styles.setupBanner, 
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.cardShadow,
                }
              ]}
            >
              <View style={styles.setupBannerContent}>
                <View style={[styles.setupBannerIcon, { backgroundColor: colors.tint }]}>
                  <Ionicons name="person-add" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.setupBannerText}>
                  <Text style={[styles.setupBannerTitle, { color: colors.text }]}>
                    Complete Your Profile
                  </Text>
                  <Text style={[styles.setupBannerSubtitle, { color: colors.icon }]}>
                    Add your university and major to get personalized recommendations
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.setupBannerButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => router.push('/profile-setup')}
                >
                  <Text style={[styles.setupBannerButtonText, { color: colors.tint }]}>
                    Complete
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.tint} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* 3D Animated Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Animated3DCard
                icon="flame"
                title="Current Streak"
                value={`${stats.currentStreak} days`}
                color={colors.warning}
                delay={200}
                onPress={() => router.push('/(tabs)/emails')}
              />
              <Animated3DCard
                icon="trophy"
                title="Total XP"
                value={stats.totalXp}
                color={colors.purple}
                delay={400}
                onPress={() => router.push('/(tabs)/profile')}
              />
            </View>
            <View style={styles.statsRow}>
              <Animated3DCard
                icon="mail"
                title="Unread Emails"
                value={stats.unreadEmails}
                color={colors.error}
                delay={600}
                onPress={() => router.push('/(tabs)/emails')}
              />
              <Animated3DCard
                icon="briefcase"
                title="Applications"
                value={stats.jobApplications}
                color={colors.success}
                delay={800}
                onPress={() => router.push('/(tabs)/jobs')}
              />
            </View>
          </View>

          {/* Quick Actions with Floating Buttons */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              <View style={styles.quickActionItem}>
                <FloatingActionButton
                  icon="mail"
                  onPress={() => router.push('/(tabs)/emails')}
                  color={colors.tint}
                />
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  Check Emails
                </Text>
              </View>
              
              <View style={styles.quickActionItem}>
                <FloatingActionButton
                  icon="search"
                  onPress={() => router.push('/(tabs)/jobs')}
                  color={colors.success}
                />
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  Find Jobs
                </Text>
              </View>
              
              <View style={styles.quickActionItem}>
                <FloatingActionButton
                  icon="heart"
                  onPress={() => router.push('/(tabs)/wellness')}
                  color={colors.error}
                />
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  Log Mood
                </Text>
              </View>
              
              <View style={styles.quickActionItem}>
                <FloatingActionButton
                  icon="ticket"
                  onPress={() => router.push('/(tabs)/tickets')}
                  color={colors.purple}
                />
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  Tickets
                </Text>
              </View>
            </View>
          </View>

          {/* Motivational Quote Card */}
          <Animated.View 
            style={[
              styles.quoteCard, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.cardShadow,
              }
            ]}
          >
            <View style={[styles.quoteIcon, { backgroundColor: colors.warning }]}>
              <Ionicons name="bulb" size={24} color="#FFFFFF" />
            </View>
                         <Text style={[styles.quoteText, { color: colors.text }]}>
               &quot;Success is not final, failure is not fatal: it is the courage to continue that counts.&quot;
             </Text>
            <Text style={[styles.quoteAuthor, { color: colors.icon }]}>
              - Winston Churchill
            </Text>
          </Animated.View>

          {/* Bottom spacing for floating elements */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  quoteCard: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
  },
  quoteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '500',
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  setupBanner: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
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
