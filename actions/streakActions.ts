import { supabase } from '../lib/supabase';
import { getUserProfile, type UserProfile } from './userActions';

export interface StreakActivity {
  id: string;
  activity_type: 'email_read' | 'daily_streak' | 'weekly_bonus' | 'monthly_bonus' | 'milestone_bonus';
  xp_earned: number;
  streak_day: number | null;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastEmailCheck: string | null;
  totalXp: number;
}

export interface StreakUpdateResult {
  streakMaintained: boolean;
  streakIncreased: boolean;
  xpEarned: number;
  newStreak: number;
  message: string;
}

// XP rewards configuration
export const XP_REWARDS = {
  EMAIL_READ: 5,
  DAILY_STREAK: 10,
  WEEKLY_STREAK_BONUS: 25,
  MONTHLY_STREAK_BONUS: 100,
  STREAK_MILESTONE_5: 50,
  STREAK_MILESTONE_10: 100,
  STREAK_MILESTONE_30: 300,
  STREAK_MILESTONE_100: 1000,
} as const;

/**
 * Check if it's a new day since last email check
 */
export const isNewDay = (lastCheck: string | null): boolean => {
  if (!lastCheck) return true;
  
  const lastCheckDate = new Date(lastCheck);
  const today = new Date();
  
  // Reset time to start of day for comparison
  lastCheckDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  return today.getTime() > lastCheckDate.getTime();
};

/**
 * Check if streak should be broken (more than 1 day gap)
 */
export const shouldBreakStreak = (lastCheck: string | null): boolean => {
  if (!lastCheck) return false;
  
  const lastCheckDate = new Date(lastCheck);
  const today = new Date();
  
  // Calculate days difference
  const diffTime = today.getTime() - lastCheckDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Break streak if more than 1 day has passed
  return diffDays > 1;
};

/**
 * Calculate XP bonus based on streak milestones
 */
export const calculateStreakBonus = (newStreak: number): number => {
  let bonus = 0;
  
  // Milestone bonuses (only awarded when reaching the milestone)
  if (newStreak === 5) bonus += XP_REWARDS.STREAK_MILESTONE_5;
  else if (newStreak === 10) bonus += XP_REWARDS.STREAK_MILESTONE_10;
  else if (newStreak === 30) bonus += XP_REWARDS.STREAK_MILESTONE_30;
  else if (newStreak === 100) bonus += XP_REWARDS.STREAK_MILESTONE_100;
  
  // Weekly bonus (every 7 days)
  if (newStreak > 0 && newStreak % 7 === 0) {
    bonus += XP_REWARDS.WEEKLY_STREAK_BONUS;
  }
  
  // Monthly bonus (every 30 days)
  if (newStreak > 0 && newStreak % 30 === 0) {
    bonus += XP_REWARDS.MONTHLY_STREAK_BONUS;
  }
  
  return bonus;
};

/**
 * Log streak activity to database
 */
const logStreakActivity = async (
  userId: string,
  activityType: StreakActivity['activity_type'],
  xpEarned: number,
  streakDay: number | null,
  description: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    // Check if streak_activities table exists by trying to query it first
    const { error: checkError } = await supabase
      .from('streak_activities')
      .select('id')
      .limit(1);

    // If table doesn't exist, skip logging (table not migrated yet)
    if (checkError && checkError.code === '42P01') {
      console.log('streak_activities table not found - skipping activity logging');
      return;
    }

    const { error } = await supabase
      .from('streak_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        xp_earned: xpEarned,
        streak_day: streakDay,
        description,
        metadata: metadata || null,
      });

    if (error) {
      console.error('Error logging streak activity:', error);
      // Don't throw error - logging is not critical
    }
  } catch (error) {
    console.error('Error in logStreakActivity:', error);
    // Don't throw error - logging is not critical
  }
};

/**
 * Update user streak when reading emails
 */
export const updateEmailReadingStreak = async (userId: string): Promise<StreakUpdateResult> => {
  try {
    console.log('Updating email reading streak for user:', userId);
    
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    const now = new Date().toISOString();
    const isNewDayCheck = isNewDay(profile.last_email_check);
    const shouldBreak = shouldBreakStreak(profile.last_email_check);
    
    let newStreak = profile.current_streak;
    let xpEarned = XP_REWARDS.EMAIL_READ; // Base XP for reading email
    let streakIncreased = false;
    let streakMaintained = true;
    let message = 'Email read! +5 XP';
    
    if (shouldBreak) {
      // Break the streak
      newStreak = 1; // Start new streak
      streakMaintained = false;
      streakIncreased = true;
      message = 'Streak broken! Starting fresh. +5 XP';
    } else if (isNewDayCheck) {
      // Increase streak for new day
      newStreak = profile.current_streak + 1;
      streakIncreased = true;
      xpEarned += XP_REWARDS.DAILY_STREAK; // Bonus for maintaining streak
      
      // Calculate milestone bonuses
      const streakBonus = calculateStreakBonus(newStreak);
      xpEarned += streakBonus;
      
      if (streakBonus > 0) {
        message = `${newStreak} day streak! +${xpEarned} XP (includes bonus!)`;
      } else {
        message = `${newStreak} day streak! +${xpEarned} XP`;
      }
    } else {
      // Same day, just reading more emails
      message = 'Email read! +5 XP';
    }
    
    // Update database
    const updateData = {
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
      total_xp: profile.total_xp + xpEarned,
      last_email_check: now,
      updated_at: now,
    };
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
    
    // Log the activity
    await logStreakActivity(
      userId,
      'email_read',
      XP_REWARDS.EMAIL_READ,
      newStreak,
      message,
      { 
        was_new_day: isNewDayCheck,
        streak_broken: shouldBreak,
        bonus_xp: xpEarned - XP_REWARDS.EMAIL_READ
      }
    );
    
    // Log additional activities for bonuses
    if (isNewDayCheck && !shouldBreak) {
      await logStreakActivity(
        userId,
        'daily_streak',
        XP_REWARDS.DAILY_STREAK,
        newStreak,
        `Daily streak bonus for day ${newStreak}`,
        { streak_day: newStreak }
      );
      
      // Log milestone bonuses
      const streakBonus = calculateStreakBonus(newStreak);
      if (streakBonus > 0) {
        let bonusType: StreakActivity['activity_type'] = 'milestone_bonus';
        let bonusDescription = `Milestone bonus for ${newStreak} day streak`;
        
        if (newStreak % 7 === 0) {
          bonusType = 'weekly_bonus';
          bonusDescription = `Weekly streak bonus (${newStreak} days)`;
        }
        if (newStreak % 30 === 0) {
          bonusType = 'monthly_bonus';
          bonusDescription = `Monthly streak bonus (${newStreak} days)`;
        }
        
        await logStreakActivity(
          userId,
          bonusType,
          streakBonus,
          newStreak,
          bonusDescription,
          { milestone: newStreak }
        );
      }
    }
    
    console.log('Streak updated successfully:', {
      newStreak,
      xpEarned,
      streakIncreased,
      streakMaintained
    });
    
    return {
      streakMaintained,
      streakIncreased,
      xpEarned,
      newStreak,
      message,
    };
  } catch (error) {
    console.error('Error in updateEmailReadingStreak:', error);
    throw error;
  }
};

/**
 * Get current streak data for a user
 */
export const getStreakData = async (userId: string): Promise<StreakData> => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    return {
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      lastEmailCheck: profile.last_email_check,
      totalXp: profile.total_xp,
    };
  } catch (error) {
    console.error('Error in getStreakData:', error);
    throw error;
  }
};

/**
 * Reset user streak (for testing or admin purposes)
 */
export const resetStreak = async (userId: string): Promise<UserProfile> => {
  try {
    console.log('Resetting streak for user:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        current_streak: 0,
        last_email_check: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error resetting streak:', error);
      throw error;
    }
    
    console.log('Streak reset successfully');
    return data;
  } catch (error) {
    console.error('Error in resetStreak:', error);
    throw error;
  }
};

/**
 * Check if user needs streak maintenance (daily check)
 */
export const checkStreakMaintenance = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile || !profile.last_email_check) {
      return false; // No streak to maintain
    }
    
    return shouldBreakStreak(profile.last_email_check);
  } catch (error) {
    console.error('Error in checkStreakMaintenance:', error);
    return false;
  }
};

/**
 * Get user's recent streak activities
 */
export const getUserStreakActivities = async (
  userId: string,
  limit: number = 10
): Promise<StreakActivity[]> => {
  try {
    const { data, error } = await supabase
      .from('streak_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        console.log('streak_activities table not found - returning empty activities');
        return [];
      }
      console.error('Error fetching streak activities:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserStreakActivities:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

/**
 * Get user's XP summary by activity type
 */
export const getUserXPSummary = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_xp_summary', { p_user_id: userId });

    if (error) {
      // If function doesn't exist, return empty array
      if (error.code === '42883' || error.code === '42P01') {
        console.log('get_user_xp_summary function not found - returning empty summary');
        return [];
      }
      console.error('Error fetching XP summary:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserXPSummary:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}; 