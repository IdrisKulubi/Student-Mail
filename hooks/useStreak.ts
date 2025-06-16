import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  updateEmailReadingStreak,
  getStreakData,
  resetStreak,
  checkStreakMaintenance,
  type StreakData,
  type StreakUpdateResult,
} from '../actions/streakActions';

export interface UseStreakReturn {
  streakData: StreakData | null;
  loading: boolean;
  error: string | null;
  updateStreak: () => Promise<StreakUpdateResult | null>;
  refreshStreakData: () => Promise<void>;
  resetUserStreak: () => Promise<void>;
  checkMaintenance: () => Promise<boolean>;
}

export const useStreak = (): UseStreakReturn => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  /**
   * Fetch current streak data
   */
  const refreshStreakData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getStreakData(user.id);
      setStreakData(data);
    } catch (err: any) {
      console.error('Error fetching streak data:', err);
      setError(err.message || 'Failed to fetch streak data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Update streak when user reads an email
   */
  const updateStreak = useCallback(async (): Promise<StreakUpdateResult | null> => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await updateEmailReadingStreak(user.id);
      
      // Update local state with new data
      setStreakData(prev => prev ? {
        ...prev,
        currentStreak: result.newStreak,
        longestStreak: Math.max(prev.longestStreak, result.newStreak),
        totalXp: prev.totalXp + result.xpEarned,
        lastEmailCheck: new Date().toISOString(),
      } : null);

      // Show success message
      Alert.alert(
        result.streakIncreased ? '🔥 Streak Updated!' : '📧 Email Read!',
        result.message,
        [{ text: 'Nice!', style: 'default' }]
      );

      return result;
    } catch (err: any) {
      console.error('Error updating streak:', err);
      setError(err.message || 'Failed to update streak');
      
      Alert.alert(
        'Error',
        'Failed to update your streak. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Reset user streak (for testing)
   */
  const resetUserStreak = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      await resetStreak(user.id);
      // Manually refresh data instead of calling refreshStreakData to avoid dependency issues
      const data = await getStreakData(user.id);
      setStreakData(data);
      
      Alert.alert(
        'Streak Reset',
        'Your streak has been reset to 0.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (err: any) {
      console.error('Error resetting streak:', err);
      setError(err.message || 'Failed to reset streak');
      
      Alert.alert(
        'Error',
        'Failed to reset your streak. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Check if streak needs maintenance
   */
  const checkMaintenance = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      return await checkStreakMaintenance(user.id);
    } catch (err: any) {
      console.error('Error checking streak maintenance:', err);
      return false;
    }
  }, [user?.id]);

  // Load streak data on mount and when user changes - FIXED: removed refreshStreakData from deps
  useEffect(() => {
    if (user?.id && !hasInitialized.current) {
      hasInitialized.current = true;
      refreshStreakData();
    } else if (!user?.id) {
      hasInitialized.current = false;
      setStreakData(null);
      setError(null);
    }
  }, [user?.id]); // Only depend on user?.id

  // REMOVED: The problematic second useEffect that was causing loops
  // We'll handle streak maintenance manually when needed instead of automatically

  return {
    streakData,
    loading,
    error,
    updateStreak,
    refreshStreakData,
    resetUserStreak,
    checkMaintenance,
  };
}; 