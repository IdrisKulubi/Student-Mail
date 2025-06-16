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
  Dimensions,
  Linking,
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

const { width } = Dimensions.get('window');

const CATEGORIES = ['Events', 'Jobs', 'Finance', 'Class', 'Other'];
const CATEGORY_COLORS = {
  Events: '#10B981',
  Jobs: '#3B82F6', 
  Finance: '#F59E0B',
  Class: '#8B5CF6',
  Other: '#6B7280',
};

// Modular Components
const EmailHeader = ({ email, onToggleImportant, onShare, onDelete }: {
  email: Email;
  onToggleImportant: () => void;
  onShare: () => void;
  onDelete: () => void;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.emailHeaderCard}>
      {/* Sender Avatar and Info */}
      <View style={styles.senderSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {getInitials(email.sender_name || email.sender_email)}
          </Text>
        </View>
        
        <View style={styles.senderInfo}>
          <Text style={styles.senderName}>
            {email.sender_name || email.sender_email.split('@')[0]}
          </Text>
          <Text style={styles.senderEmail}>{email.sender_email}</Text>
          <Text style={styles.timestamp}>{formatDate(email.received_at)}</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onToggleImportant} style={styles.actionButton}>
            <Ionicons
              name={email.is_important ? 'star' : 'star-outline'}
              size={20}
              color={email.is_important ? '#FF9500' : '#8E8E93'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Subject */}
      <Text style={styles.subject}>{email.subject}</Text>
      
      {/* Category Badge */}
      {email.category && (
        <View style={styles.categoryContainer}>
          <View style={[
            styles.categoryBadge, 
            { backgroundColor: CATEGORY_COLORS[email.category as keyof typeof CATEGORY_COLORS] + '20' }
          ]}>
            <View style={[
              styles.categoryDot,
              { backgroundColor: CATEGORY_COLORS[email.category as keyof typeof CATEGORY_COLORS] }
            ]} />
            <Text style={[
              styles.categoryText,
              { color: CATEGORY_COLORS[email.category as keyof typeof CATEGORY_COLORS] }
            ]}>
              {email.category}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const AISummaryCard = ({ summary }: { summary: string }) => (
  <View style={styles.aiSummaryCard}>
    <View style={styles.aiSummaryHeader}>
      <View style={styles.aiIconContainer}>
        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
      </View>
      <Text style={styles.aiSummaryTitle}>AI Summary</Text>
    </View>
    <Text style={styles.aiSummaryText}>{summary}</Text>
  </View>
);

const EmailBodyCard = ({ body }: { body: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Function to extract and preserve links from HTML
  const extractLinks = (htmlContent: string): { text: string; links: { text: string; url: string; placeholder: string }[] } => {
    const links: { text: string; url: string; placeholder: string }[] = [];
    let linkCounter = 0;
    
    // Extract links and replace with placeholders
    const textWithPlaceholders = htmlContent.replace(
      /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
      (match, url, linkText) => {
        const placeholder = `__LINK_${linkCounter}__`;
        links.push({
          text: linkText.replace(/<[^>]*>/g, '').trim() || url,
          url: url,
          placeholder: placeholder
        });
        linkCounter++;
        return placeholder;
      }
    );
    
    return { text: textWithPlaceholders, links };
  };

  // Function to detect plain URLs in text
  const detectPlainUrls = (text: string): { text: string; links: { text: string; url: string; placeholder: string }[] } => {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    const links: { text: string; url: string; placeholder: string }[] = [];
    let linkCounter = 1000; // Start high to avoid conflicts
    
    const textWithPlaceholders = text.replace(urlRegex, (match) => {
      const placeholder = `__PLAIN_LINK_${linkCounter}__`;
      links.push({
        text: match.length > 50 ? match.substring(0, 47) + '...' : match,
        url: match,
        placeholder: placeholder
      });
      linkCounter++;
      return placeholder;
    });
    
    return { text: textWithPlaceholders, links };
  };

  // Function to strip HTML tags and format text properly
  const formatEmailBody = (htmlContent: string): { formattedText: string; allLinks: { text: string; url: string; placeholder: string }[] } => {
    if (!htmlContent) return { formattedText: 'No content available', allLinks: [] };
    
    // First extract HTML links
    const { text: textWithLinkPlaceholders, links: htmlLinks } = extractLinks(htmlContent);
    
    // Remove HTML tags and decode entities
    let text = textWithLinkPlaceholders
      // Remove script and style elements completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Convert common HTML elements to readable text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<h[1-6][^>]*>/gi, '')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
      // Remove all remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();
    
    // Now detect plain URLs in the cleaned text
    const { text: finalText, links: plainLinks } = detectPlainUrls(text);
    
    return { 
      formattedText: finalText || 'No content available',
      allLinks: [...htmlLinks, ...plainLinks]
    };
  };

  const { formattedText, allLinks } = formatEmailBody(body);
  const shouldTruncate = formattedText.length > 500;
  const displayText = shouldTruncate && !isExpanded ? formattedText.slice(0, 500) + '...' : formattedText;

  // Function to handle link press
  const handleLinkPress = async (url: string) => {
    try {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const canOpen = await Linking.canOpenURL(fullUrl);
      
      if (canOpen) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  // Function to render text with clickable links
  const renderTextWithLinks = (text: string) => {
    if (allLinks.length === 0) {
      return <Text style={styles.bodyText}>{text}</Text>;
    }

    const parts = [];
    let currentText = text;
    let keyCounter = 0;

    // Replace placeholders with clickable links
    allLinks.forEach((link) => {
      const parts_temp = currentText.split(link.placeholder);
      if (parts_temp.length > 1) {
        // Add text before link
        if (parts_temp[0]) {
          parts.push(
            <Text key={`text-${keyCounter++}`} style={styles.bodyText}>
              {parts_temp[0]}
            </Text>
          );
        }
        
        // Add clickable link
        parts.push(
          <TouchableOpacity
            key={`link-${keyCounter++}`}
            onPress={() => handleLinkPress(link.url)}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>{link.text}</Text>
          </TouchableOpacity>
        );
        
        // Continue with remaining text
        currentText = parts_temp.slice(1).join(link.placeholder);
      }
    });

    // Add any remaining text
    if (currentText) {
      parts.push(
        <Text key={`text-${keyCounter++}`} style={styles.bodyText}>
          {currentText}
        </Text>
      );
    }

    return <View style={styles.textWithLinksContainer}>{parts}</View>;
  };

  // Split text into paragraphs for better formatting
  const paragraphs = displayText.split('\n\n').filter(p => p.trim().length > 0);

  return (
    <View style={styles.bodyCard}>
      {paragraphs.map((paragraph, index) => {
        // Check if paragraph contains bullet points
        const lines = paragraph.split('\n');
        const hasBullets = lines.some(line => line.trim().startsWith('•'));
        
        if (hasBullets) {
          // Render as a list
          return (
            <View key={index} style={styles.listContainer}>
              {lines.map((line, lineIndex) => {
                if (line.trim().startsWith('•')) {
                  const bulletText = line.replace('•', '').trim();
                  return (
                    <View key={lineIndex} style={styles.bulletItem}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <View style={styles.bulletTextContainer}>
                        {renderTextWithLinks(bulletText)}
                      </View>
                    </View>
                  );
                } else if (line.trim()) {
                  return (
                    <View key={lineIndex} style={styles.paragraphContainer}>
                      {renderTextWithLinks(line.trim())}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          );
        } else {
          // Render as regular paragraph
          return (
            <View key={index} style={[styles.paragraphContainer, index > 0 && styles.paragraphSpacing]}>
              {renderTextWithLinks(paragraph.trim())}
            </View>
          );
        }
      })}
      
      {shouldTruncate && (
        <TouchableOpacity 
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Show Less' : 'Read More'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const CategoryPicker = ({ 
  visible, 
  currentCategory, 
  onSelect, 
  onClose 
}: {
  visible: boolean;
  currentCategory: string;
  onSelect: (category: string) => void;
  onClose: () => void;
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.categoryPickerCard}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>Change Category</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.categoryList}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryOption,
                currentCategory === category && styles.selectedCategoryOption
              ]}
              onPress={() => onSelect(category)}
            >
              <View style={styles.categoryOptionContent}>
                <View style={[
                  styles.categoryOptionDot,
                  { backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }
                ]} />
                <Text style={[
                  styles.categoryOptionText,
                  currentCategory === category && styles.selectedCategoryOptionText
                ]}>
                  {category}
                </Text>
              </View>
              {currentCategory === category && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading email...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!email) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="mail-outline" size={64} color="#C7C7CC" />
          <Text style={styles.errorTitle}>Email not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBackButton}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Email</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Email Header Card */}
        <EmailHeader
          email={email}
          onToggleImportant={handleToggleImportant}
          onShare={handleShare}
          onDelete={handleDelete}
        />

        {/* AI Summary Card */}
        {email.ai_summary && (
          <AISummaryCard summary={email.ai_summary} />
        )}

        {/* Email Body Card */}
        <EmailBodyCard body={email.full_body || email.body_preview || 'No content available'} />

        {/* Category Change Button */}
        <TouchableOpacity 
          style={styles.categoryChangeButton}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Ionicons name="pricetag-outline" size={20} color="#007AFF" />
          <Text style={styles.categoryChangeText}>Change Category</Text>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <CategoryPicker
        visible={showCategoryPicker}
        currentCategory={email.category || ''}
        onSelect={handleCategoryChange}
        onClose={() => setShowCategoryPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 24,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  navBackButton: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  navSpacer: {
    width: 36,
  },
  scrollContainer: {
    flex: 1,
  },
  emailHeaderCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  senderSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  senderEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  subject: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 26,
    marginBottom: 12,
  },
  categoryContainer: {
    alignItems: 'flex-start',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  aiSummaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#5856D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiSummaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5856D6',
  },
  aiSummaryText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3C3C43',
  },
  bodyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
  },
  expandButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  categoryChangeButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryChangeText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 12,
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
  categoryPickerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 32,
    borderRadius: 16,
    maxHeight: '70%',
    width: width - 64,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  selectedCategoryOption: {
    backgroundColor: '#F2F2F7',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  selectedCategoryOptionText: {
    fontWeight: '600',
    color: '#007AFF',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 8,
    marginTop: 2,
  },
  bulletTextContainer: {
    flex: 1,
  },
  paragraphContainer: {
    width: '100%',
  },
  paragraphSpacing: {
    marginTop: 12,
  },
  textWithLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  linkContainer: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  linkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
}); 