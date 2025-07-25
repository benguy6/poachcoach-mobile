// StudentNotificationsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Switch,
  RefreshControl,
  Alert,
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Bell, Calendar, MessageCircle, CreditCard, X, Check, Settings, Award, CheckCircle, XCircle } from 'lucide-react-native';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotificationAPI } from '../../services/api';
import { getToken } from '../../services/auth';
import { useNotifications } from '../../hooks/useNotifications';

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  actionable: boolean;
  data?: any;
};

const StudentNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fetchUnreadCount, markAsRead: updateNotificationCount, markAllAsRead: updateAllNotificationCount, decrementUnreadCount } = useNotifications();

  const [settings, setSettings] = useState({
    bookingRequests: true,
    messages: true,
    payments: true,
    cancellations: true,
    marketing: false,
  });

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await getNotifications(token);
      if (response.success) {
        const transformedNotifications = transformNotifications(response.notifications);
        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const transformNotifications = (apiNotifications: any[]) => {
    return apiNotifications.map(notif => {
      let icon, color, actionable = false;

      switch (notif.type) {
        case 'reschedule_response':
          const isAccepted = notif.data?.response === 'accept';
          icon = isAccepted ? CheckCircle : XCircle;
          color = isAccepted ? '#10b981' : '#ef4444';
          actionable = false;
          break;
        case 'booking_request':
          icon = Calendar;
          color = '#f97316';
          actionable = true;
          break;
        case 'message':
          icon = MessageCircle;
          color = '#3b82f6';
          actionable = true;
          break;
        case 'payment_received':
          icon = CreditCard;
          color = '#10b981';
          actionable = false;
          break;
        case 'session_cancelled':
          icon = X;
          color = '#ef4444';
          actionable = false;
          break;
        default:
          icon = Bell;
          color = '#6b7280';
          actionable = false;
      }

      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        time: formatTime(notif.created_at),
        read: notif.is_read,
        icon,
        color,
        actionable,
        data: notif.data
      };
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      await markNotificationAsRead(token, id.toString());
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
      );
      // Update the global notification count
      updateNotificationCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await markAllNotificationsAsRead(token);
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      // Update the global notification count
      updateAllNotificationCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotificationPermanently = async (id: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      const notificationToDelete = notifications.find(notif => notif.id === id);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

      // Call backend API to delete from database
      const response = await deleteNotificationAPI(token, id.toString());
      
      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      // Update the global notification count if it was unread
      if (wasUnread && response.wasUnread) {
        decrementUnreadCount();
      }
      
      console.log('Notification deleted successfully:', response);
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    const IconComponent = notification.icon;
    
    // Special rendering for reschedule response notifications
    const isRescheduleResponse = notification.type === 'reschedule_response';
    const responseData = notification.data;
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
        onPress={() => markAsRead(notification.id)}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: notification.color + '20' }]}>
            <IconComponent size={24} color={notification.color} />
          </View>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.notificationHeader}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.time}>{notification.time}</Text>
          </View>
          
          <Text style={styles.message}>{notification.message}</Text>
          
          {/* Special UI for reschedule response notifications */}
          {isRescheduleResponse && responseData && (
            <View style={[styles.responseDetails, { borderLeftColor: notification.color }]}>
              <Text style={styles.responseLabel}>
                {responseData.response === 'accept' ? 'Accepted' : 'Rejected'}
              </Text>
              <Text style={styles.sessionDetails}>
                {responseData.sport} • {responseData.formattedDate} at {responseData.formattedTime}
              </Text>
              {responseData.studentName && (
                <Text style={styles.studentName}>Student: {responseData.studentName}</Text>
              )}
            </View>
          )}
          
          {notification.actionable && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteNotificationPermanently(notification.id)}
        >
          <X size={16} color="#6b7280" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const filteredNotifications = notifications.filter(notif => 
    activeTab === 'all' || !notif.read
  );

  return (
    <SafeAreaView style={styles.container}>
      <LoadingOverlay 
        visible={loading} 
        message="Loading notifications..." 
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Bell size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'unread' 
                ? "You're all caught up!" 
                : "New notifications will appear here"
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f97316',
    borderRadius: 6,
  },
  markAllText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
  },
  unreadNotification: {
    backgroundColor: '#fef3cd',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  responseDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f97316',
    borderRadius: 6,
    marginRight: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default StudentNotificationsPage;