import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStreak } from '../hooks/useStreak';

interface StreakDisplayProps {
  showResetButton?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  showResetButton = false,
  compact = false,
  onPress,
}) => {
  const { streakData, loading, resetUserStreak } = useStreak();

  if (loading && !streakData) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <ActivityIndicator size="small" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!streakData) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Text style={styles.errorText}>No streak data available</Text>
      </View>
    );
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.container, compact && styles.compactContainer]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* XP Display */}
      <View style={styles.xpContainer}>
        <Ionicons name="star" size={compact ? 16 : 20} color="#F59E0B" />
        <Text style={[styles.xpText, compact && styles.compactText]}>
          {streakData.totalXp.toLocaleString()} XP
        </Text>
      </View>

      {/* Streak Display */}
      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <Ionicons 
            name="flame" 
            size={compact ? 18 : 24} 
            color={streakData.currentStreak > 0 ? "#EF4444" : "#9CA3AF"} 
          />
          <View style={styles.streakTextContainer}>
            <Text style={[styles.streakNumber, compact && styles.compactText]}>
              {streakData.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, compact && styles.compactLabel]}>
              Current
            </Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.streakItem}>
            <Ionicons name="trophy" size={24} color="#10B981" />
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakNumber}>
                {streakData.longestStreak}
              </Text>
              <Text style={styles.streakLabel}>
                Best
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Last Check Info */}
      {!compact && streakData.lastEmailCheck && (
        <View style={styles.lastCheckContainer}>
          <Text style={styles.lastCheckText}>
            Last check: {new Date(streakData.lastEmailCheck).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Reset Button (for testing) */}
      {showResetButton && !compact && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetUserStreak}
        >
          <Ionicons name="refresh" size={16} color="#EF4444" />
          <Text style={styles.resetButtonText}>Reset Streak</Text>
        </TouchableOpacity>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  streakTextContainer: {
    marginLeft: 8,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  streakLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  compactText: {
    fontSize: 16,
  },
  compactLabel: {
    fontSize: 10,
  },
  lastCheckContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lastCheckText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    fontWeight: '500',
  },
}); 