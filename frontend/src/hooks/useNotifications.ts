import { useState, useEffect, useCallback } from 'react';
import { getUnreadNotificationCount, testBackendConnectivity } from '../services/api';
import { getToken } from '../services/auth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchUnreadCount = useCallback(async (retry = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // First test backend connectivity
      const isBackendReachable = await testBackendConnectivity();
      if (!isBackendReachable) {
        setError('Cannot connect to server. Please check your internet connection and try again.');
        setUnreadCount(0);
        return;
      }
      
      const token = await getToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await getUnreadNotificationCount(token);
      setUnreadCount(response.unreadCount || 0);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Error fetching unread notifications count:', err);
      
      // Handle different types of errors
      if (err.message === 'Network request timed out') {
        setError('Connection timed out. Please check your internet connection.');
      } else if (err.message.includes('Network connectivity issue')) {
        setError('Network connectivity issue. Please check your internet connection.');
      } else {
        setError('Failed to fetch notifications');
      }
      
      setUnreadCount(0);
      
      // Auto-retry logic for network errors
      if (!retry && retryCount < 2 && (err.message.includes('timeout') || err.message.includes('connectivity'))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchUnreadCount(true);
        }, 2000); // Retry after 2 seconds
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  const markAsRead = useCallback(() => {
    // Optimistically update the count
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const retry = useCallback(() => {
    setRetryCount(0);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    incrementUnreadCount,
    decrementUnreadCount,
    retry,
  };
};
