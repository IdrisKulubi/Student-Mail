import { supabase } from '../lib/supabase';

export interface Email {
  id: string;
  user_id: string;
  gmail_id: string;
  subject: string;
  sender_email: string;
  sender_name: string | null;
  body_preview: string | null;
  full_body: string | null;
  ai_summary: string | null;
  category: 'Events' | 'Jobs' | 'Finance' | 'Class' | 'Other' | null;
  is_read: boolean;
  is_important: boolean;
  received_at: string;
  read_at: string | null;
  created_at: string;
}

export interface CreateEmailData {
  gmail_id: string;
  subject: string;
  sender_email: string;
  sender_name?: string | null;
  body_preview?: string | null;
  full_body?: string | null;
  ai_summary?: string | null;
  category?: 'Events' | 'Jobs' | 'Finance' | 'Class' | 'Other' | null;
  is_important?: boolean;
  received_at: string;
}

export interface EmailFilters {
  category?: string;
  is_read?: boolean;
  is_important?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get user emails with optional filters
 */
export const getUserEmails = async (
  userId: string,
  filters: EmailFilters = {}
): Promise<Email[]> => {
  try {
    console.log('Fetching emails for user:', userId, 'with filters:', filters);
    
    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .order('received_at', { ascending: false });

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    
    if (filters.is_important !== undefined) {
      query = query.eq('is_important', filters.is_important);
    }
    
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,sender_email.ilike.%${filters.search}%,body_preview.ilike.%${filters.search}%`);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserEmails:', error);
    throw error;
  }
};

/**
 * Get single email by ID
 */
export const getEmailById = async (emailId: string, userId: string): Promise<Email | null> => {
  try {
    console.log('Fetching email:', emailId, 'for user:', userId);
    
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getEmailById:', error);
    throw error;
  }
};

/**
 * Create new email
 */
export const createEmail = async (
  userId: string,
  emailData: CreateEmailData
): Promise<Email> => {
  try {
    console.log('Creating email for user:', userId);
    
    const { data, error } = await supabase
      .from('emails')
      .insert({
        user_id: userId,
        ...emailData,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating email:', error);
      throw error;
    }

    console.log('Email created successfully');
    return data;
  } catch (error) {
    console.error('Error in createEmail:', error);
    throw error;
  }
};

/**
 * Mark email as read
 */
export const markEmailAsRead = async (emailId: string, userId: string): Promise<Email> => {
  try {
    console.log('Marking email as read:', emailId);
    
    const { data, error } = await supabase
      .from('emails')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', emailId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking email as read:', error);
      throw error;
    }

    console.log('Email marked as read successfully');
    return data;
  } catch (error) {
    console.error('Error in markEmailAsRead:', error);
    throw error;
  }
};

/**
 * Mark email as important
 */
export const toggleEmailImportant = async (
  emailId: string,
  userId: string,
  isImportant: boolean
): Promise<Email> => {
  try {
    console.log('Toggling email importance:', emailId, isImportant);
    
    const { data, error } = await supabase
      .from('emails')
      .update({
        is_important: isImportant,
      })
      .eq('id', emailId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling email importance:', error);
      throw error;
    }

    console.log('Email importance toggled successfully');
    return data;
  } catch (error) {
    console.error('Error in toggleEmailImportant:', error);
    throw error;
  }
};

/**
 * Update email AI summary
 */
export const updateEmailSummary = async (
  emailId: string,
  userId: string,
  aiSummary: string
): Promise<Email> => {
  try {
    console.log('Updating email AI summary:', emailId);
    
    const { data, error } = await supabase
      .from('emails')
      .update({
        ai_summary: aiSummary,
      })
      .eq('id', emailId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email summary:', error);
      throw error;
    }

    console.log('Email summary updated successfully');
    return data;
  } catch (error) {
    console.error('Error in updateEmailSummary:', error);
    throw error;
  }
};

/**
 * Update email category
 */
export const updateEmailCategory = async (
  emailId: string,
  userId: string,
  category: 'Events' | 'Jobs' | 'Finance' | 'Class' | 'Other'
): Promise<Email> => {
  try {
    console.log('Updating email category:', emailId, category);
    
    const { data, error } = await supabase
      .from('emails')
      .update({
        category: category,
      })
      .eq('id', emailId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email category:', error);
      throw error;
    }

    console.log('Email category updated successfully');
    return data;
  } catch (error) {
    console.error('Error in updateEmailCategory:', error);
    throw error;
  }
};

/**
 * Get email statistics
 */
export const getEmailStats = async (userId: string) => {
  try {
    console.log('Fetching email stats for user:', userId);
    
    // Get total emails
    const { count: totalEmails } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get unread emails
    const { count: unreadEmails } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // Get important emails
    const { count: importantEmails } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_important', true);

    // Get emails by category
    const { data: categoryStats } = await supabase
      .from('emails')
      .select('category')
      .eq('user_id', userId);

    const categoryCounts = categoryStats?.reduce((acc: any, email) => {
      const category = email.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      total: totalEmails || 0,
      unread: unreadEmails || 0,
      important: importantEmails || 0,
      categories: categoryCounts,
    };
  } catch (error) {
    console.error('Error in getEmailStats:', error);
    throw error;
  }
};

/**
 * Bulk mark emails as read
 */
export const markMultipleEmailsAsRead = async (
  emailIds: string[],
  userId: string
): Promise<void> => {
  try {
    console.log('Marking multiple emails as read:', emailIds.length);
    
    const { error } = await supabase
      .from('emails')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in('id', emailIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking multiple emails as read:', error);
      throw error;
    }

    console.log('Multiple emails marked as read successfully');
  } catch (error) {
    console.error('Error in markMultipleEmailsAsRead:', error);
    throw error;
  }
};

/**
 * Delete email
 */
export const deleteEmail = async (emailId: string, userId: string): Promise<void> => {
  try {
    console.log('Deleting email:', emailId);
    
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', emailId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting email:', error);
      throw error;
    }

    console.log('Email deleted successfully');
  } catch (error) {
    console.error('Error in deleteEmail:', error);
    throw error;
  }
}; 