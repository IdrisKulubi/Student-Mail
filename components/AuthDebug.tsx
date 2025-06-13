import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function AuthDebug() {
  const { session, user, loading } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Info</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Loading:</Text>
        <Text style={styles.value}>{loading ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Session:</Text>
        <Text style={styles.value}>{session ? 'Active' : 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user?.id || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>
          {user?.user_metadata?.full_name || user?.user_metadata?.name || 'None'}
        </Text>
      </View>

      {user?.user_metadata && (
        <View style={styles.section}>
          <Text style={styles.label}>Metadata:</Text>
          <Text style={styles.metadata}>
            {JSON.stringify(user.user_metadata, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  section: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  metadata: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 4,
  },
}); 