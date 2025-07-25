import { useState, useEffect, useCallback } from 'react';
import { getUnreadNotificationCount } from '../services/api';
import { getToken } from '../services/auth';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await getUnreadNotificationCount(token);
      setUnreadCount(response.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
      setError('Failed to fetch notifications');
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return {
    unreadCount,
    loading,
    error,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    incrementUnreadCount,
    decrementUnreadCount,
  };
};
