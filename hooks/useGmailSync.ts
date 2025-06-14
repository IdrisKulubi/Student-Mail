import { useState, useCallback } from 'react';
import { createGmailService } from '../lib/gmailService';
import { useAuth } from '../contexts/AuthContext';

export interface SyncResult {
  synced: number;
  errors: number;
}

export function useGmailSync() {
  const { user, providerToken } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncEmails = useCallback(async (): Promise<SyncResult | null> => {
    if (!user?.id || syncing) {
      if(syncing) console.log('Sync already in progress.');
      if(!user?.id) console.log('No user ID found, aborting sync.');
      return null;
    }

    setSyncing(true);
    
    try {
      console.log('Starting Gmail sync for user:', user.id);
      
      // Use provider token from AuthContext
      console.log('Provider token available:', !!providerToken);
      
      const gmailService = await createGmailService(user.id, providerToken || undefined);
      if (!gmailService) {
        throw new Error('Failed to create Gmail service. Please check your Google account permissions.');
      }

      const result = await gmailService.syncEmails(user.id);
      
      setLastSyncResult(result);
      setLastSyncTime(new Date());
      
      console.log('Gmail sync completed:', result);
      return result;
    } catch (error) {
      console.error('Gmail sync error:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [user?.id, providerToken, syncing]);

  const markEmailAsReadInGmail = useCallback(async (gmailId: string): Promise<void> => {
    if (!user?.id) {
      return;
    }

    try {
      // Use provider token from AuthContext
      const gmailService = await createGmailService(user.id, providerToken || undefined);
      if (gmailService) {
        await gmailService.markAsRead(gmailId);
      }
    } catch (error) {
      console.error('Error marking email as read in Gmail:', error);
      // Don't throw here as this is a background operation
    }
  }, [user?.id, providerToken]);

  return {
    syncing,
    syncEmails,
    markEmailAsReadInGmail,
    lastSyncResult,
    lastSyncTime,
  };
} 