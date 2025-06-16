import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStreak } from '../hooks/useStreak';

export const DebugStreakInfo: React.FC = () => {
  const { streakData, loading, error } = useStreak();

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐛 Streak Debug Info</Text>
      <Text style={styles.text}>Loading: {loading ? 'Yes' : 'No'}</Text>
      <Text style={styles.text}>Error: {error || 'None'}</Text>
      <Text style={styles.text}>
        Data: {streakData ? `${streakData.currentStreak} streak, ${streakData.totalXp} XP` : 'None'}
      </Text>
      <Text style={styles.timestamp}>
        Last render: {new Date().toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    color: '#7F1D1D',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 9,
    color: '#991B1B',
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 