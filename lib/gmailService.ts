import { supabase } from './supabase';
import { createEmail } from '../actions/emailActions';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export class GmailService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make authenticated request to Gmail API
   */
  private async makeGmailRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gmail API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Gmail API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Fetch recent emails from Gmail
   */
  async fetchRecentEmails(maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      console.log('Fetching recent emails from Gmail...');
      
      // Get list of message IDs
      const listResponse: GmailListResponse = await this.makeGmailRequest(
        `messages?maxResults=${maxResults}&q=${encodeURIComponent('is:unread OR newer_than:7d')}`
      );

      if (!listResponse.messages || listResponse.messages.length === 0) {
        console.log('No messages found');
        return [];
      }

      console.log(`Found ${listResponse.messages.length} messages, fetching details...`);

      // Fetch full message details (limit to avoid rate limits)
      const messages: GmailMessage[] = [];
      const batchSize = 10; // Process in smaller batches
      
      for (let i = 0; i < listResponse.messages.length; i += batchSize) {
        const batch = listResponse.messages.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (message) => {
          try {
            const messageResponse: GmailMessage = await this.makeGmailRequest(
              `messages/${message.id}?format=full`
            );
            return messageResponse;
          } catch (error) {
            console.error(`Error fetching message ${message.id}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter((msg): msg is GmailMessage => msg !== null);
        messages.push(...validResults);

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < listResponse.messages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Successfully fetched ${messages.length} message details`);
      return messages;
    } catch (error) {
      console.error('Error fetching emails from Gmail:', error);
      throw error;
    }
  }

  /**
   * Base64 decode helper for React Native
   */
  private base64Decode(str: string): string {
    try {
      // For React Native, we can use the built-in atob or a polyfill
      if (typeof atob !== 'undefined') {
        return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      } else {
        // Fallback for environments without atob
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        
        while (i < str.length) {
          const encoded1 = chars.indexOf(str.charAt(i++));
          const encoded2 = chars.indexOf(str.charAt(i++));
          const encoded3 = chars.indexOf(str.charAt(i++));
          const encoded4 = chars.indexOf(str.charAt(i++));

          const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

          result += String.fromCharCode((bitmap >> 16) & 255);
          if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
          if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Error decoding base64:', error);
      return '';
    }
  }

  /**
   * Extract email data from Gmail message
   */
  private extractEmailData(message: GmailMessage) {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || message.internalDate;

    // Parse sender email and name
    const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/) || from.match(/^(.+)$/);
    const senderName = fromMatch && fromMatch.length > 2 ? fromMatch[1].trim() : null;
    const senderEmail = fromMatch && fromMatch.length > 1 ? 
      (fromMatch.length > 2 ? fromMatch[2] : fromMatch[1]).trim() : from;

    // Extract body content
    let bodyPreview = message.snippet || '';
    let fullBody = '';

    if (message.payload.body?.data) {
      try {
        fullBody = this.base64Decode(message.payload.body.data);
      } catch (error) {
        console.error('Error decoding email body:', error);
      }
    } else if (message.payload.parts) {
      // Handle multipart messages
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          try {
            fullBody = this.base64Decode(part.body.data);
            break;
          } catch (error) {
            console.error('Error decoding email part:', error);
          }
        }
      }
    }

    // Clean up body preview
    if (fullBody && fullBody.length > bodyPreview.length) {
      bodyPreview = fullBody.substring(0, 200) + (fullBody.length > 200 ? '...' : '');
    }

    // Determine category based on sender and content
    const category = this.categorizeEmail(subject, senderEmail, bodyPreview);

    return {
      gmail_id: message.id,
      subject,
      sender_email: senderEmail,
      sender_name: senderName,
      body_preview: bodyPreview,
      full_body: fullBody,
      category,
      received_at: new Date(parseInt(message.internalDate)).toISOString(),
    };
  }

  /**
   * Categorize email based on content and sender
   */
  private categorizeEmail(subject: string, senderEmail: string, body: string): 'Events' | 'Jobs' | 'Finance' | 'Class' | 'Other' {
    const text = `${subject} ${senderEmail} ${body}`.toLowerCase();

    // Job-related keywords
    if (text.includes('job') || text.includes('career') || text.includes('internship') || 
        text.includes('application') || text.includes('interview') || text.includes('hiring') ||
        text.includes('position') || text.includes('opportunity') || text.includes('linkedin')) {
      return 'Jobs';
    }

    // Event-related keywords
    if (text.includes('event') || text.includes('meeting') || text.includes('conference') || 
        text.includes('workshop') || text.includes('seminar') || text.includes('invitation') ||
        text.includes('rsvp') || text.includes('calendar')) {
      return 'Events';
    }

    // Finance-related keywords
    if (text.includes('payment') || text.includes('bill') || text.includes('invoice') || 
        text.includes('financial') || text.includes('tuition') || text.includes('scholarship') ||
        text.includes('loan') || text.includes('bank') || text.includes('fee')) {
      return 'Finance';
    }

    // Class-related keywords
    if (text.includes('class') || text.includes('course') || text.includes('assignment') || 
        text.includes('grade') || text.includes('professor') || text.includes('lecture') ||
        text.includes('exam') || text.includes('homework') || text.includes('canvas') ||
        text.includes('blackboard') || senderEmail.includes('.edu')) {
      return 'Class';
    }

    return 'Other';
  }

  /**
   * Check if email is school-relevant
   */
  private isSchoolRelevant(senderEmail: string, subject: string, body: string): boolean {
    const text = `${subject} ${body}`.toLowerCase();
    
    // Check if sender is from educational domain
    if (senderEmail.includes('.edu') || senderEmail.includes('university') || 
        senderEmail.includes('college') || senderEmail.includes('school')) {
      return true;
    }

    // Check for school-related keywords
    const schoolKeywords = [
      'university', 'college', 'school', 'academic', 'student', 'campus',
      'class', 'course', 'professor', 'instructor', 'assignment', 'exam',
      'grade', 'tuition', 'scholarship', 'financial aid', 'career services',
      'internship', 'job fair', 'graduation', 'transcript', 'enrollment'
    ];

    return schoolKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Sync emails from Gmail to local database
   */
  async syncEmails(userId: string): Promise<{ synced: number; errors: number }> {
    try {
      console.log('Starting Gmail sync for user:', userId);
      
      const messages = await this.fetchRecentEmails(50); // Reduced to avoid rate limits
      let synced = 0;
      let errors = 0;

      for (const message of messages) {
        try {
          const emailData = this.extractEmailData(message);
          
          // Only sync school-relevant emails
          if (!this.isSchoolRelevant(emailData.sender_email, emailData.subject, emailData.body_preview || '')) {
            continue;
          }

          // Check if email already exists
          const { data: existingEmail } = await supabase
            .from('emails')
            .select('id')
            .eq('gmail_id', emailData.gmail_id)
            .eq('user_id', userId)
            .single();

          if (!existingEmail) {
            await createEmail(userId, emailData);
            synced++;
            console.log(`Synced email: ${emailData.subject}`);
          }
        } catch (error) {
          console.error('Error syncing individual email:', error);
          errors++;
        }
      }

      console.log(`Gmail sync completed. Synced: ${synced}, Errors: ${errors}`);
      return { synced, errors };
    } catch (error) {
      console.error('Error in Gmail sync:', error);
      throw error;
    }
  }

  /**
   * Mark email as read in Gmail
   */
  async markAsRead(gmailId: string): Promise<void> {
    try {
      await this.makeGmailRequest(`messages/${gmailId}/modify`, {
        method: 'POST',
        body: JSON.stringify({
          removeLabelIds: ['UNREAD']
        }),
      });
      console.log(`Marked email ${gmailId} as read in Gmail`);
    } catch (error) {
      console.error('Error marking email as read in Gmail:', error);
      throw error;
    }
  }
}

/**
 * Create Gmail service instance from provider token
 */
export async function createGmailService(userId: string, providerToken?: string): Promise<GmailService | null> {
  try {
    let accessToken = providerToken;
    
    // If no provider token passed, try to get it from Supabase session
    if (!accessToken) {
      const { data: session } = await supabase.auth.getSession();
      accessToken = session.session?.provider_token;
    }
    
    if (!accessToken) {
      console.error('No Gmail OAuth token found for user');
      return null;
    }

    console.log('Creating Gmail service with provider token');
    return new GmailService(accessToken);
  } catch (error) {
    console.error('Error creating Gmail service:', error);
    return null;
  }
} 