import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getEmailById, 
  markEmailAsRead, 
  toggleEmailImportant, 
  updateEmailCategory,
  deleteEmail,
  Email 
} from '../../actions';

const CATEGORIES = ['Events', 'Jobs', 'Finance', 'Class', 'Other'];
const CATEGORY_COLORS = {
  Events: '#10B981',
  Jobs: '#3B82F6', 
  Finance: '#F59E0B',
  Class: '#8B5CF6',
  Other: '#6B7280',
};

export default function EmailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (id && user?.id) {
      fetchEmail();
    }
  }, [id, user?.id]);

  const fetchEmail = async () => {
    if (!id || !user?.id) return;

    try {
      setLoading(true);
      const emailData = await getEmailById(id, user.id);
      
      if (!emailData) {
        Alert.alert('Error', 'Email not found');
        router.back();
        return;
      }

      setEmail(emailData);

      // Mark as read if not already read
      if (!emailData.is_read) {
        await markEmailAsRead(id, user.id);
        setEmail(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null);
      }
    } catch (error) {
      console.error('Error fetching email:', error);
      Alert.alert('Error', 'Failed to load email');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImportant = async () => {
    if (!email || !user?.id) return;

    try {
      await toggleEmailImportant(email.id, user.id, !email.is_important);
      setEmail(prev => prev ? { ...prev, is_important: !prev.is_important } : null);
    } catch (error) {
      console.error('Error toggling importance:', error);
      Alert.alert('Error', 'Failed to update email');
    }
  };

  const handleCategoryChange = async (category: string) => {
    if (!email || !user?.id) return;

    try {
      await updateEmailCategory(email.id, user.id, category as any);
      setEmail(prev => prev ? { ...prev, category: category as any } : null);
      setShowCategoryPicker(false);
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!email || !user?.id) return;

    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmail(email.id, user.id);
              router.back();
            } catch (error) {
              console.error('Error deleting email:', error);
              Alert.alert('Error', 'Failed to delete email');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!email) return;

    try {
      await Share.share({
        message: `${email.subject}\n\nFrom: ${email.sender_name || email.sender_email}\n\n${email.body_preview || email.full_body || ''}`,
        title: email.subject,
      });
    } catch (error) {
      console.error('Error sharing email:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading email...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!email) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="mail-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorTitle}>Email not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = CATEGORY_COLORS[email.category as keyof typeof CATEGORY_COLORS] || '#6B7280';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleImportant} style={styles.headerButton}>
            <Ionicons
              name={email.is_important ? 'star' : 'star-outline'}
              size={24}
              color={email.is_important ? '#F59E0B' : '#6B7280'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Email Header */}
        <View style={styles.emailHeader}>
          <Text style={styles.subject}>{email.subject}</Text>
          
          <View style={styles.senderInfo}>
            <View style={styles.senderDetails}>
              <Text style={styles.senderName}>
                {email.sender_name || email.sender_email}
              </Text>
              <Text style={styles.senderEmail}>{email.sender_email}</Text>
            </View>
            <Text style={styles.timestamp}>
              {formatDate(email.received_at)}
            </Text>
          </View>

          {/* Category and Status */}
          <View style={styles.metaInfo}>
            <TouchableOpacity
              style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={styles.categoryText}>
                {email.category || 'Uncategorized'}
              </Text>
              <Ionicons name="chevron-down" size={12} color="white" />
            </TouchableOpacity>
            
            {email.is_read && (
              <View style={styles.readBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.readText}>Read</Text>
              </View>
            )}
          </View>
        </View>

        {/* AI Summary */}
        {email.ai_summary && (
          <View style={styles.aiSummaryContainer}>
            <View style={styles.aiSummaryHeader}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={styles.aiSummaryTitle}>AI Summary</Text>
            </View>
            <Text style={styles.aiSummaryText}>{email.ai_summary}</Text>
          </View>
        )}

        {/* Email Body */}
        <View style={styles.bodyContainer}>
          <Text style={styles.bodyText}>
            {email.full_body || email.body_preview || 'No content available'}
          </Text>
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.categoryPicker}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  email.category === category && styles.selectedCategoryOption
                ]}
                onPress={() => handleCategoryChange(category)}
              >
                <View
                  style={[
                    styles.categoryColorDot,
                    { backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }
                  ]}
                />
                <Text style={[
                  styles.categoryOptionText,
                  email.category === category && styles.selectedCategoryOptionText
                ]}>
                  {category}
                </Text>
                {email.category === category && (
                  <Ionicons name="checkmark" size={20} color="#4F46E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  emailHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subject: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 28,
  },
  senderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  senderEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  aiSummaryContainer: {
    backgroundColor: '#F8FAFC',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  aiSummaryText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  bodyContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    minHeight: 200,
  },
  bodyText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPicker: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    minWidth: 280,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedCategoryOption: {
    backgroundColor: '#EEF2FF',
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedCategoryOptionText: {
    fontWeight: '500',
    color: '#4F46E5',
  },
}); 