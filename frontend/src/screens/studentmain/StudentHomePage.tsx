import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import { studentTabs } from '../../constants/studentTabs';
import { supabase } from '../../services/supabase';
import { getStudentDashboard, getNotifications, getUnreadNotificationCount, handleRescheduleResponse, markNotificationAsRead } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface HomePageProps {
  navigation: any;
}

const StudentHomePage: React.FC<HomePageProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState(0);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [firstName, setFirstName] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);

  useFocusEffect(
    React.useCallback(() => {
      const fetchDashboard = async () => {
        try {
          // Get token from SecureStore
          const accessToken = await SecureStore.getItemAsync('accessToken');
          if (!accessToken) throw new Error('No access token found');

          // Fetch dashboard data
          const dashboard = await getStudentDashboard(accessToken);

          console.log('Dashboard Response:', dashboard); 
          console.log('User info:', dashboard.user);
          console.log('Sessions:', dashboard.sessions);

          setFirstName(dashboard.user?.name || 'Student'); 
          setSessions(dashboard.sessions || []);
          setProfilePicture(dashboard.user?.profilePicture || undefined); 

          // Fetch notifications
          const notificationsResponse = await getNotifications(accessToken);
          const unreadCountResponse = await getUnreadNotificationCount(accessToken);
          
          console.log('Notifications Response:', notificationsResponse);
          console.log('Unread Count Response:', unreadCountResponse);
          
          setNotificationsList(notificationsResponse.notifications || []);
          setNotifications(unreadCountResponse.unreadCount || 0);

        } catch (error) {
          console.error('Failed to fetch dashboard info', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboard();
    }, [])
  );

  const chats: Chat[] = [
    {
      id: 1,
      name: 'Coach Vansh',
      lastMessage: 'Great progress in today\'s session!',
      time: '2 min ago',
      unread: 2,
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      lastMessage: 'Don\'t forget to bring your yoga mat tomorrow',
      time: '1 hour ago',
      unread: 0,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    navigation.navigate(tabId);
  };

  const handleSettingsPress = () => {
    navigation.navigate('StudentSettings');
  };

  const handleNotificationPress = () => {
    navigation.navigate('StudentNotifications');
  };

  const handleProfilePress = () => {
    navigation.navigate('StudentProfile', {
      onProfilePicChange: (newUrl: string) => setProfilePicture(newUrl),
    });
  };

  const handleRescheduleAccept = async (notification: Notification) => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (!accessToken) throw new Error('No access token found');

      const notificationData = notification.data;
      
      await handleRescheduleResponse(
        accessToken, 
        notificationData.sessionId, 
        notificationData.studentSessionId, // Use studentSessionId instead of originalDate
        'accept'
      );

      // Mark notification as read
      await markNotificationAsRead(accessToken, notification.id);

      // Refresh notifications list
      const notificationsResponse = await getNotifications(accessToken);
      const unreadCountResponse = await getUnreadNotificationCount(accessToken);
      
      setNotificationsList(notificationsResponse.notifications || []);
      setNotifications(unreadCountResponse.unreadCount || 0);

      // Show success message
      Alert.alert('Success', 'Session reschedule accepted successfully!');

    } catch (error) {
      console.error('Failed to accept reschedule:', error);
      Alert.alert('Error', 'Failed to accept reschedule. Please try again.');
    }
  };

  const handleRescheduleReject = async (notification: Notification) => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      if (!accessToken) throw new Error('No access token found');

      const notificationData = notification.data;
      
      await handleRescheduleResponse(
        accessToken, 
        notificationData.sessionId, 
        notificationData.studentSessionId, // Use studentSessionId instead of originalDate
        'reject'
      );

      // Mark notification as read
      await markNotificationAsRead(accessToken, notification.id);

      // Refresh notifications list
      const notificationsResponse = await getNotifications(accessToken);
      const unreadCountResponse = await getUnreadNotificationCount(accessToken);
      
      setNotificationsList(notificationsResponse.notifications || []);
      setNotifications(unreadCountResponse.unreadCount || 0);

      // Show success message
      Alert.alert('Success', 'Session reschedule rejected. A refund will be processed if applicable.');

    } catch (error) {
      console.error('Failed to reject reschedule:', error);
      Alert.alert('Error', 'Failed to reject reschedule. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.headerButton}>
            <Ionicons name="settings" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={handleNotificationPress}
          >
            <Ionicons name="notifications" size={24} color="white" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {notifications > 99 ? '99+' : notifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
          <View style={styles.profileContainer}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={24} color="#ccc" />
              </View>
            )}
            <View style={styles.profileText}>
              <Text style={styles.greeting}>Hello, {firstName || 'Student'}!</Text>
              <Text style={styles.subGreeting}>Ready for your next session?</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fed7aa" />
          </View>
        </TouchableOpacity>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Upcoming Class Card */}
          <View style={styles.upcomingCard}>
            <Text style={styles.upcomingTitle}>Upcoming Class</Text>
            {loading ? (
              <Text style={{ padding: 16 }}>Loading...</Text>
            ) : sessions.length > 0 ? (
              (() => {
                const session = sessions[0];
                // Parse the full datetime strings from backend
                const startTime = new Date(session.start_time);
                const endTime = new Date(session.end_time);
                const today = new Date();
                
                // Compare just the date part to avoid timezone issues
                const sessionDate = new Date(session.date);
                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
                const isToday = sessionDateOnly.getTime() === todayDate.getTime();
                
                return (
                  <>
                    {/* Confirmation Banner */}
                    <View style={styles.confirmationBanner}>
                      <View style={styles.checkIcon}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                      <View style={styles.confirmationText}>
                        <Text style={styles.confirmationTitle}>Your class is confirmed!</Text>
                        <Text style={styles.confirmationSubtitle}>{session.session_name || 'Session'} with {session.coach_name || 'Coach'}</Text>
                      </View>
                    </View>
                    {/* Class Details */}
                    <View style={styles.classDetails}>
                      <View style={styles.classHeader}>
                        <Text style={styles.className}>{session.session_name || 'Session'}</Text>
                        {isToday && (
                          <View style={styles.todayBadge}>
                            <Text style={styles.todayText}>Today</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.instructorName}>With {session.coach_name || 'Coach'}</Text>
                      <View style={styles.classInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="time-outline" size={16} color="#6b7280" />
                          <Text style={styles.infoText}>
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="location-outline" size={16} color="#6b7280" />
                          <Text style={styles.infoText}>{session.location || 'TBD'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="people-outline" size={16} color="#6b7280" />
                          <Text style={styles.infoText}>{session.students_attending || 1} people attending</Text>
                        </View>
                      </View>
                      <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.viewDetailsButton}>
                          <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton}>
                          <Text style={styles.cancelText}>Cancel Class</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                );
              })()
            ) : (
              <Text style={{ padding: 16, color: '#6b7280' }}>No upcoming classes. Book your next session!</Text>
            )}
          </View>

          {/* Notifications Card - Show reschedule notifications */}
          {notificationsList.filter(n => n.type === 'session_reschedule' && !n.is_read).length > 0 && (
            <View style={styles.notificationsCard}>
              <Text style={styles.notificationsTitle}>Action Required</Text>
              {notificationsList
                .filter(n => n.type === 'session_reschedule' && !n.is_read)
                .slice(0, 2) // Show max 2 notifications
                .map((notification) => {
                  const notificationData = notification.data;
                  const originalDate = new Date(notificationData.originalDate);
                  const newDate = new Date(notificationData.newDate);
                  const responseDeadline = new Date(notification.created_at);
                  responseDeadline.setHours(responseDeadline.getHours() + 24);
                  
                  return (
                    <View key={notification.id} style={styles.notificationItem}>
                      <View style={styles.notificationHeader}>
                        <View style={styles.rescheduleIcon}>
                          <Ionicons name="calendar" size={16} color="#f97316" />
                        </View>
                        <View style={styles.notificationContent}>
                          <Text style={styles.notificationTitle}>Session Rescheduled</Text>
                          <Text style={styles.notificationSubtitle}>
                            {notificationData.sport} class has been rescheduled
                          </Text>
                        </View>
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentText}>URGENT</Text>
                        </View>
                      </View>
                      
                      <View style={styles.notificationDetails}>
                        <View style={styles.dateChangeRow}>
                          <View style={styles.dateChange}>
                            <Text style={styles.dateLabel}>From:</Text>
                            <Text style={styles.dateValue}>
                              {originalDate.toLocaleDateString()} at {notificationData.originalStartTime}
                            </Text>
                          </View>
                          <View style={styles.dateChange}>
                            <Text style={styles.dateLabel}>To:</Text>
                            <Text style={styles.dateValue}>
                              {newDate.toLocaleDateString()} at {notificationData.newStartTime}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={styles.responseDeadline}>
                          Response needed by: {responseDeadline.toLocaleDateString()} at {responseDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        
                        <View style={styles.notificationActions}>
                          <TouchableOpacity 
                            style={styles.acceptButton}
                            onPress={() => handleRescheduleAccept(notification)}
                          >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.rejectButton}
                            onPress={() => handleRescheduleReject(notification)}
                          >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              
              {notificationsList.filter(n => n.type === 'session_reschedule' && !n.is_read).length > 2 && (
                <TouchableOpacity 
                  style={styles.viewAllNotifications}
                  onPress={() => navigation.navigate('StudentNotifications')}
                >
                  <Text style={styles.viewAllNotificationsText}>
                    View {notificationsList.filter(n => n.type === 'session_reschedule' && !n.is_read).length - 2} more notifications
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Recent Messages Card */}
          <View style={styles.messagesCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Recent Messages</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentChat')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {chats.slice(0, 2).map(chat => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => navigation.navigate('StudentChatDetail', { chatId: chat.id })}
              >
                <Image source={{ uri: chat.avatar }} style={styles.chatAvatar} />
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    <Text style={styles.chatTime}>{chat.time}</Text>
                  </View>
                  <Text style={styles.chatMessage} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                </View>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation
        activeTab="StudentHome"
        onTabPress={handleTabPress}
        tabs={studentTabs}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerButton: {
    padding: 4,
  },
  notificationContainer: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subGreeting: {
    fontSize: 16,
    color: '#fed7aa',
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 40, // add top padding for floating effect
  },
  upcomingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'visible',
    marginTop: -40,
    zIndex: 2,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 16,
    paddingBottom: 12,
  },
  confirmationBanner: {
    backgroundColor: '#dcfce7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  checkIcon: {
    backgroundColor: '#22c55e',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  confirmationText: {
    flex: 1,
  },
  confirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  confirmationSubtitle: {
    fontSize: 13,
    color: '#166534',
    marginTop: 2,
  },
  classDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  className: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  todayBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  instructorName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  classInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#fb923c', // darker orange
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ef4444', // red
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 24,
    marginBottom: 16,
    overflow: 'visible',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  chatTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chatMessage: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Notification styles
  notificationsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 16,
    marginBottom: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rescheduleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  urgentBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationDetails: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  dateChangeRow: {
    marginBottom: 12,
  },
  dateChange: {
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  responseDeadline: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
    marginBottom: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAllNotifications: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  viewAllNotificationsText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StudentHomePage;