import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Switch,
} from 'react-native';
import { Bell, Clock, Calendar, MessageCircle, Award, CreditCard, Settings, Check, X, type LucideIcon } from 'lucide-react-native';

const StudentNotificationsPage = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'class_reminder',
      title: 'Class Reminder',
      message: 'Your Yoga Basics class with Sarah Johnson starts in 30 minutes',
      time: '5 min ago',
      read: false,
      icon: Calendar,
      color: '#f97316', // orange-500
      actionable: true,
    },
    {
      id: 2,
      type: 'message',
      title: 'New Message',
      message: 'Coach Vansh: "Great progress in today\'s session! Keep it up!"',
      time: '15 min ago',
      read: false,
      icon: MessageCircle,
      color: '#3b82f6', // blue-500
      actionable: true,
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Due',
      message: 'Your payment of $40.00 for Cricket Training is due tomorrow',
      time: '1 hour ago',
      read: false,
      icon: CreditCard,
      color: '#ef4444', // red-500
      actionable: true,
    },
    {
      id: 4,
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'You\'ve completed 10 yoga sessions this month. Well done!',
      time: '2 hours ago',
      read: true,
      icon: Award,
      color: '#10b981', // green-500
      actionable: false,
    },
    {
      id: 5,
      type: 'class_cancelled',
      title: 'Class Cancelled',
      message: 'Pilates Core class on June 18th has been cancelled due to instructor illness',
      time: '3 hours ago',
      read: true,
      icon: X,
      color: '#ef4444', // red-500
      actionable: true,
    },
    {
      id: 6,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: 'Your session with Michael Chen on June 19th at 2:00 PM is confirmed',
      time: '1 day ago',
      read: true,
      icon: Check,
      color: '#10b981', // green-500
      actionable: false,
    },
    {
      id: 7,
      type: 'class_reminder',
      title: 'Class Starting Soon',
      message: 'Cricket Training with Coach Shreyas starts in 1 hour',
      time: '1 day ago',
      read: true,
      icon: Clock,
      color: '#f97316', // orange-500
      actionable: false,
    },
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    classReminders: true,
    messages: true,
    payments: true,
    achievements: true,
    marketing: false,
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'settings'

const markAsRead = (id: number): void => {
    setNotifications(prev =>
        prev.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        )
    );
};

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

type Notification = {
    id: number;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: LucideIcon;
    color: string;
    actionable: boolean;
    avatar?: string;
};

type NotificationSettings = {
    classReminders: boolean;
    messages: boolean;
    payments: boolean;
    achievements: boolean;
    marketing: boolean;
};

const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
};

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    const IconComponent = notification.icon;
    
    return (
      <TouchableOpacity
        style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
        onPress={() => markAsRead(notification.id)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              {notification.avatar ? (
                <Image source={{ uri: notification.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.iconWrapper, { backgroundColor: notification.color + '20' }]}>
                  <IconComponent size={20} color={notification.color} />
                </View>
              )}
            </View>
            
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.timeText}>{notification.time}</Text>
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>
            
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          
          {notification.actionable && !notification.read && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => markAsRead(notification.id)}
              >
                <Text style={styles.primaryActionText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => deleteNotification(notification.id)}
              >
                <Text style={styles.secondaryActionText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const NotificationsTab = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {unreadCount > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.notificationsList}>
        {notifications.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </View>
      
      {notifications.length === 0 && (
        <View style={styles.emptyState}>
          <Bell size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyMessage}>You're all caught up!</Text>
        </View>
      )}
    </ScrollView>
  );

  const SettingsTab = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Class Reminders</Text>
            <Text style={styles.settingDescription}>Get notified before your classes start</Text>
          </View>
          <Switch
            value={notificationSettings.classReminders}
            onValueChange={(value) => 
              setNotificationSettings(prev => ({ ...prev, classReminders: value }))
            }
            trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
            thumbColor={notificationSettings.classReminders ? '#f97316' : '#f3f4f6'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Messages</Text>
            <Text style={styles.settingDescription}>Receive notifications for new messages</Text>
          </View>
          <Switch
            value={notificationSettings.messages}
            onValueChange={(value) => 
              setNotificationSettings(prev => ({ ...prev, messages: value }))
            }
            trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
            thumbColor={notificationSettings.messages ? '#f97316' : '#f3f4f6'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Payment Reminders</Text>
            <Text style={styles.settingDescription}>Get notified about upcoming payments</Text>
          </View>
          <Switch
            value={notificationSettings.payments}
            onValueChange={(value) => 
              setNotificationSettings(prev => ({ ...prev, payments: value }))
            }
            trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
            thumbColor={notificationSettings.payments ? '#f97316' : '#f3f4f6'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Achievements</Text>
            <Text style={styles.settingDescription}>Celebrate your milestones and progress</Text>
          </View>
          <Switch
            value={notificationSettings.achievements}
            onValueChange={(value) => 
              setNotificationSettings(prev => ({ ...prev, achievements: value }))
            }
            trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
            thumbColor={notificationSettings.achievements ? '#f97316' : '#f3f4f6'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Marketing & Promotions</Text>
            <Text style={styles.settingDescription}>Receive offers and promotional content</Text>
          </View>
          <Switch
            value={notificationSettings.marketing}
            onValueChange={(value) => 
              setNotificationSettings(prev => ({ ...prev, marketing: value }))
            }
            trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
            thumbColor={notificationSettings.marketing ? '#f97316' : '#f3f4f6'}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Do Not Disturb</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Quiet Hours</Text>
            <Text style={styles.settingDescription}>10:00 PM - 8:00 AM</Text>
          </View>
          <Text style={styles.settingAction}>Edit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              All {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Settings size={16} color={activeTab === 'settings' ? '#f97316' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'all' ? <NotificationsTab /> : <SettingsTab />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#fed7aa',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f97316',
  },
  container: {
    flex: 1,
  },
  markAllButton: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  markAllText: {
    color: '#f97316',
    fontWeight: '600',
    fontSize: 14,
  },
  notificationsList: {
    padding: 20,
    paddingTop: 16,
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    marginLeft: 8,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#f97316',
  },
  secondaryAction: {
    backgroundColor: '#f3f4f6',
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryActionText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingAction: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
  },
});

export default StudentNotificationsPage;