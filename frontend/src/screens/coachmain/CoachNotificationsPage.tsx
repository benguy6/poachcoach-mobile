// CoachNotificationsPage.tsx
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
import { Bell, Calendar, MessageCircle, CreditCard, X, Check, Settings, Award } from 'lucide-react-native';

const CoachNotificationsPage = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'booking_request',
      title: 'New Booking Request',
      message: 'John has requested a session on June 21st at 3:00 PM',
      time: '2 min ago',
      read: false,
      icon: Calendar,
      color: '#f97316',
      actionable: true,
    },
    {
      id: 2,
      type: 'message',
      title: 'New Message',
      message: 'Student Jane: "Can we shift tomorrow’s time?"',
      time: '20 min ago',
      read: false,
      icon: MessageCircle,
      color: '#3b82f6',
      actionable: true,
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
    },
    {
      id: 3,
      type: 'payment_received',
      title: 'Payment Received',
      message: 'You received $50.00 from Michael for yesterday’s session',
      time: '3 hours ago',
      read: true,
      icon: CreditCard,
      color: '#10b981',
      actionable: false,
    },
    {
      id: 4,
      type: 'session_cancelled',
      title: 'Session Cancelled',
      message: 'Sarah cancelled the 5:00 PM session today',
      time: '6 hours ago',
      read: true,
      icon: X,
      color: '#ef4444',
      actionable: false,
    },
    {
      id: 5,
      type: 'achievement',
      title: 'You’re Popular!',
      message: '5 new students booked with you this week!',
      time: '1 day ago',
      read: true,
      icon: Award,
      color: '#10b981',
      actionable: false,
    },
  ]);

  const [settings, setSettings] = useState({
    bookingRequests: true,
    messages: true,
    payments: true,
    cancellations: true,
    marketing: false,
  });

  const [activeTab, setActiveTab] = useState('all');

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
    avatar?: string;
  };

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
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
          </View>
          {notification.actionable && !notification.read && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => markAsRead(notification.id)}>
                <Text style={styles.primaryActionText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={() => deleteNotification(notification.id)}>
                <Text style={styles.secondaryActionText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coach Notifications</Text>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab(activeTab === 'all' ? 'settings' : 'all')}
        >
          <Settings size={16} color={activeTab === 'settings' ? '#f97316' : '#6b7280'} />
        </TouchableOpacity>
      </View>

      {activeTab === 'all' ? (
        <ScrollView style={styles.container}>
          {notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.container}>
          {Object.entries(settings).map(([key, value]) => (
            <View key={key} style={styles.settingItem}>
              <Text style={styles.settingText}>{key.replace(/([A-Z])/g, ' $1')}</Text>
              <Switch
                value={value}
                onValueChange={val => setSettings(prev => ({ ...prev, [key]: val }))}
                trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
                thumbColor={value ? '#f97316' : '#f3f4f6'}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { padding: 16 },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  tabButton: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#fed7aa',
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  unreadNotification: {
    borderLeftColor: '#ef4444',
  },
  notificationContent: {},
  notificationHeader: { flexDirection: 'row' },
  iconContainer: { marginRight: 12 },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  textContainer: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationTitle: { fontSize: 16, fontWeight: '600' },
  timeText: { fontSize: 12, color: '#6b7280' },
  notificationMessage: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryAction: { backgroundColor: '#f97316' },
  secondaryAction: { backgroundColor: '#f3f4f6' },
  primaryActionText: { color: '#fff', fontWeight: '600' },
  secondaryActionText: { color: '#6b7280', fontWeight: '600' },
  settingItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingText: { fontSize: 16, color: '#111827', fontWeight: '500' },
});

export default CoachNotificationsPage;