import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  school_domain: string | null;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  career_goals: string | null;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_email_check: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  unreadEmails: number;
  jobApplications: number;
  moodEntries: number;
}

export interface CreateUserProfileData {
  university: string;
  major: string;
  graduation_year?: number | null;
  career_goals?: string | null;
}

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Fetching user profile for:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't exist yet
        console.log('User profile not found (PGRST116)');
        return null;
      }
      
      console.error('Error fetching user profile:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('User profile fetched successfully:', data ? 'Found' : 'Not found');
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    console.error('Function context:', {
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Create or update user profile from auth user
 */
export const createOrUpdateUserFromAuth = async (user: User): Promise<UserProfile> => {
  try {
    console.log('Creating/updating user profile for:', user.email);
    console.log('User ID:', user.id);
    
    // Check if user already exists
    console.log('Checking if user profile already exists...');
    let existingUser: UserProfile | null = null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking existing user:', error);
        throw error;
      }
      
      existingUser = data;
      console.log('Existing user found:', existingUser ? 'Yes' : 'No');
    } catch (error: any) {
      if (error.code !== 'PGRST116') {
        throw error;
      }
      console.log('User does not exist yet');
    }
    
    const userData = {
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      school_domain: user.email?.split('@')[1] || null,
      updated_at: new Date().toISOString(),
    };

    console.log('User data to save:', userData);

    if (!existingUser) {
      // Create new user profile
      console.log('Creating new user profile...');
      const insertData = {
        id: user.id,
        ...userData,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('User profile created successfully');
      return data;
    } else {
      // Update existing user profile
      console.log('Updating existing user profile...');
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('User profile updated successfully');
      return data;
    }
  } catch (error) {
    console.error('Error in createOrUpdateUserFromAuth:', error);
    console.error('Function context:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Complete user profile setup
 */
export const completeUserProfile = async (
  userId: string,
  profileData: CreateUserProfileData
): Promise<UserProfile> => {
  try {
    console.log('Completing user profile for:', userId, profileData);
    
    const existingUser = await getUserProfile(userId);
    
    const updateData = {
      university: profileData.university.trim(),
      major: profileData.major.trim(),
      graduation_year: profileData.graduation_year || null,
      career_goals: profileData.career_goals?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (!existingUser) {
      throw new Error('User profile not found. Please sign in again.');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error completing user profile:', error);
      throw error;
    }

    console.log('User profile completed successfully');
    return data;
  } catch (error) {
    console.error('Error in completeUserProfile:', error);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    console.log('Fetching user stats for:', userId);
    
    // Get user profile data
    const userProfile = await getUserProfile(userId);
    
    // Get unread emails count
    const { count: unreadCount } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // Get job applications count
    const { count: jobsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get mood entries count (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const { count: moodCount } = await supabase
      .from('mood_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('entry_date', startOfMonth.toISOString().split('T')[0]);

    return {
      totalXp: userProfile?.total_xp || 0,
      currentStreak: userProfile?.current_streak || 0,
      longestStreak: userProfile?.longest_streak || 0,
      unreadEmails: unreadCount || 0,
      jobApplications: jobsCount || 0,
      moodEntries: moodCount || 0,
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw error;
  }
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (profile: UserProfile | null): boolean => {
  return !!(profile && profile.university && profile.major);
};

/**
 * Update user XP and streaks
 */
export const updateUserXP = async (
  userId: string,
  xpToAdd: number,
  updateStreak: boolean = false
): Promise<UserProfile> => {
  try {
    console.log('Updating user XP:', { userId, xpToAdd, updateStreak });
    
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const updateData: any = {
      total_xp: profile.total_xp + xpToAdd,
      updated_at: new Date().toISOString(),
    };

    if (updateStreak) {
      updateData.current_streak = profile.current_streak + 1;
      updateData.longest_streak = Math.max(profile.longest_streak, updateData.current_streak);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }

    console.log('User XP updated successfully');
    return data;
  } catch (error) {
    console.error('Error in updateUserXP:', error);
    throw error;
  }
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing database connection...');
    
    // Simple query with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 5000);
    });
    
    const queryPromise = supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const { error } = await Promise.race([queryPromise, timeoutPromise]);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
}; 