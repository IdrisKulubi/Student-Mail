import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types (generated from your Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          school_domain?: string | null;
          university?: string | null;
          major?: string | null;
          graduation_year?: number | null;
          career_goals?: string | null;
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_email_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          school_domain?: string | null;
          university?: string | null;
          major?: string | null;
          graduation_year?: number | null;
          career_goals?: string | null;
          total_xp?: number;
          current_streak?: number;
          longest_streak?: number;
          last_email_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      emails: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          gmail_id: string;
          subject: string;
          sender_email: string;
          sender_name?: string | null;
          body_preview?: string | null;
          full_body?: string | null;
          ai_summary?: string | null;
          category?: 'Events' | 'Jobs' | 'Finance' | 'Class' | 'Other' | null;
          is_read?: boolean;
          is_important?: boolean;
          received_at: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gmail_id?: string;
          subject?: string;
          sender_email?: string;
          sender_name?: string | null;
          body_preview?: string | null;
          full_body?: string | null;
          ai_summary?: string | null;
          category?: 'Events' | 'Jobs' | 'Finance' | 'Class' | 'Other' | null;
          is_read?: boolean;
          is_important?: boolean;
          received_at?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      // Add other table types as needed
    };
  };
} 