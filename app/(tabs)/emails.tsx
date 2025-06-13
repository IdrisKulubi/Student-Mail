import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { 
  getUserEmails, 
  markEmailAsRead, 
  toggleEmailImportant, 
  getEmailStats,
  markMultipleEmailsAsRead,
  Email,
  EmailFilters 
} from '../../actions';
import { useGmailSync } from '../../hooks/useGmailSync';
import { supabase } from '../../lib/supabase';

const CATEGORIES = ['All', 'Events', 'Jobs', 'Finance', 'Class', 'Other'];
const CATEGORY_COLORS = {
  Events: '#10B981',
  Jobs: '#3B82F6', 
  Finance: '#F59E0B',
  Class: '#8B5CF6',
  Other: '#6B7280',
};

export default function EmailsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { syncing, syncEmails, markEmailAsReadInGmail, lastSyncResult, lastSyncTime } = useGmailSync();
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    unread: 0,
    important: 0,
    categories: {} as Record<string, number>
  });

  const fetchEmails = useCallback(async (showLoader = true) => {
    if (!user?.id) return;

    if (showLoader) setLoading(true);
    
    try {
      const filters: EmailFilters = {
        limit: 50,
        offset: 0,
      };

      if (selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }

      if (showUnreadOnly) {
        filters.is_read = false;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const emailData = await getUserEmails(user.id, filters);
      setEmails(emailData);
    } catch (error) {
      console.error('Error fetching emails:', error);
      Alert.alert('Error', 'Failed to load emails');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user?.id, selectedCategory, showUnreadOnly, searchQuery]);

  const fetchEmailStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const stats = await getEmailStats(user.id);
      setEmailStats(stats);
    } catch (error) {
      console.error('Error fetching email stats:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEmails();
    fetchEmailStats();
  }, [fetchEmails, fetchEmailStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // First sync emails from Gmail
      await syncEmails();
      // Then fetch updated emails from database
      await Promise.all([fetchEmails(false), fetchEmailStats()]);
    } catch (error) {
      console.error('Error during refresh:', error);
      // Still fetch local emails even if sync fails
      await Promise.all([fetchEmails(false), fetchEmailStats()]);
    }
    setRefreshing(false);
  }, [fetchEmails, fetchEmailStats, syncEmails]);

  const handleEmailPress = async (email: Email) => {
    if (selectionMode) {
      toggleEmailSelection(email.id);
      return;
    }

    try {
      if (!email.is_read) {
        await markEmailAsRead(email.id, user!.id);
        // Also mark as read in Gmail
        if (email.gmail_id) {
          markEmailAsReadInGmail(email.gmail_id);
        }
        // Update local state
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, is_read: true, read_at: new Date().toISOString() } : e
        ));
        // Update stats
        setEmailStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
      
      // Navigate to email detail screen
      router.push(`/email/${email.id}` as any);
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleToggleImportant = async (email: Email) => {
    try {
      await toggleEmailImportant(email.id, user!.id, !email.is_important);
      
      // Update local state
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, is_important: !e.is_important } : e
      ));
      
      // Update stats
      setEmailStats(prev => ({
        ...prev,
        important: email.is_important ? prev.important - 1 : prev.important + 1
      }));
    } catch (error) {
      console.error('Error toggling email importance:', error);
      Alert.alert('Error', 'Failed to update email');
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedEmails.size === 0) return;

    try {
      const emailIds = Array.from(selectedEmails);
      await markMultipleEmailsAsRead(emailIds, user!.id);
      
      // Update local state
      setEmails(prev => prev.map(email => 
        selectedEmails.has(email.id) 
          ? { ...email, is_read: true, read_at: new Date().toISOString() }
          : email
      ));
      
      // Update stats
      const unreadCount = emails.filter(e => selectedEmails.has(e.id) && !e.is_read).length;
      setEmailStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - unreadCount) }));
      
      // Clear selection
      setSelectedEmails(new Set());
      setSelectionMode(false);
      
      Alert.alert('Success', `Marked ${emailIds.length} emails as read`);
    } catch (error) {
      console.error('Error marking emails as read:', error);
      Alert.alert('Error', 'Failed to mark emails as read');
    }
  };

  const renderEmailItem = ({ item: email }: { item: Email }) => {
    const isSelected = selectedEmails.has(email.id);
    const categoryColor = CATEGORY_COLORS[email.category as keyof typeof CATEGORY_COLORS] || '#6B7280';

    return (
      <TouchableOpacity
        style={[
          styles.emailItem,
          !email.is_read && styles.unreadEmail,
          isSelected && styles.selectedEmail
        ]}
        onPress={() => handleEmailPress(email)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleEmailSelection(email.id);
          }
        }}
      >
        <View style={styles.emailHeader}>
          <View style={styles.senderInfo}>
            <Text style={[styles.senderName, !email.is_read && styles.unreadText]}>
              {email.sender_name || email.sender_email}
            </Text>
            <Text style={styles.emailTime}>
              {new Date(email.received_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.emailActions}>
            {email.category && (
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>{email.category}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => handleToggleImportant(email)}
              style={styles.importantButton}
            >
              <Ionicons
                name={email.is_important ? 'star' : 'star-outline'}
                size={20}
                color={email.is_important ? '#F59E0B' : '#9CA3AF'}
              />
            </TouchableOpacity>
            {selectionMode && (
              <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
            )}
          </View>
        </View>
        
        <Text style={[styles.emailSubject, !email.is_read && styles.unreadText]} numberOfLines={1}>
          {email.subject}
        </Text>
        
        {email.body_preview && (
          <Text style={styles.emailPreview} numberOfLines={2}>
            {email.body_preview}
          </Text>
        )}
        
        {email.ai_summary && (
          <View style={styles.aiSummaryContainer}>
            <Ionicons name="sparkles" size={14} color="#8B5CF6" />
            <Text style={styles.aiSummary} numberOfLines={2}>
              {email.ai_summary}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search emails..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => fetchEmails()}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{emailStats.unread}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{emailStats.important}</Text>
          <Text style={styles.statLabel}>Important</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{emailStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryFilter,
                selectedCategory === item && styles.activeCategoryFilter
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === item && styles.activeCategoryFilterText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showUnreadOnly && styles.activeToggle]}
          onPress={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          <Ionicons 
            name={showUnreadOnly ? 'mail-unread' : 'mail-unread-outline'} 
            size={16} 
            color={showUnreadOnly ? 'white' : '#6B7280'} 
          />
          <Text style={[
            styles.toggleText,
            showUnreadOnly && styles.activeToggleText
          ]}>
            Unread Only
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={async () => {
            try {
              const result = await syncEmails();
              if (result) {
                Alert.alert(
                  'Sync Complete', 
                  `Synced ${result.synced} new emails${result.errors > 0 ? ` (${result.errors} errors)` : ''}`
                );
                // Refresh the email list
                await Promise.all([fetchEmails(false), fetchEmailStats()]);
              }
            } catch (error: any) {
              Alert.alert('Sync Error', error.message || 'Failed to sync emails');
            }
          }}
          disabled={syncing}
        >
          <Ionicons 
            name={syncing ? 'sync' : 'refresh'} 
            size={16} 
            color={syncing ? '#9CA3AF' : '#4F46E5'} 
            style={syncing ? styles.spinning : undefined}
          />
          <Text style={[
            styles.syncButtonText,
            syncing && styles.syncButtonTextDisabled
          ]}>
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.syncButton, { backgroundColor: '#EF4444', marginLeft: 8 }]}
          onPress={async () => {
            Alert.alert(
              'Clear Session',
              'This will completely clear your session and force you to sign in again.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      console.log('Force clearing session...');
                      
                      // Import AsyncStorage
                      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                      
                      // Clear all AsyncStorage
                      await AsyncStorage.clear();
                      console.log('AsyncStorage cleared');
                      
                      // Clear Supabase session
                      await supabase.auth.signOut();
                      console.log('Supabase session cleared');
                      
                      Alert.alert('Success', 'Session cleared! Please restart the app completely.');
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
          <Ionicons name="trash" size={16} color="white" />
          <Text style={[styles.syncButtonText, { color: 'white' }]}>
            Clear Session
          </Text>
        </TouchableOpacity>
      </View>

      {lastSyncTime && (
        <View style={styles.syncStatus}>
          <Text style={styles.syncStatusText}>
            Last sync: {lastSyncTime.toLocaleTimeString()}
            {lastSyncResult && ` (${lastSyncResult.synced} emails)`}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading emails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {selectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity
            onPress={() => {
              setSelectionMode(false);
              setSelectedEmails(new Set());
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.selectionCount}>
            {selectedEmails.size} selected
          </Text>
          
          <TouchableOpacity
            onPress={handleBulkMarkAsRead}
            style={[styles.actionButton, selectedEmails.size === 0 && styles.disabledButton]}
            disabled={selectedEmails.size === 0}
          >
            <Text style={styles.actionButtonText}>Mark Read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={emails}
        keyExtractor={(item) => item.id}
        renderItem={renderEmailItem}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No emails found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Your emails will appear here'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  activeCategoryFilter: {
    backgroundColor: '#4F46E5',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeCategoryFilterText: {
    color: 'white',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: '#4F46E5',
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeToggleText: {
    color: 'white',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginLeft: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  syncButtonTextDisabled: {
    color: '#9CA3AF',
  },
  spinning: {
    // Add animation if needed
  },
  syncStatus: {
    alignItems: 'center',
    marginTop: 8,
  },
  syncStatusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  selectionCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flexGrow: 1,
  },
  emailItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadEmail: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  selectedEmail: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  unreadText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  emailTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emailActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  importantButton: {
    padding: 4,
    marginRight: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  emailSubject: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emailPreview: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 8,
  },
  aiSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
  },
  aiSummary: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
}); 