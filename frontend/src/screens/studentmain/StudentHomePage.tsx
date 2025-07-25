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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import { studentTabs } from '../../constants/studentTabs';
import { supabase } from '../../services/supabase';
import { getStudentDashboard } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useRecentMessages } from '../../hooks/useRecentMessages';
import { useNotificationContext } from '../../context/NotificationContext';
import ChatModal from '../../components/ChatModal';
import LoadingOverlay from '../../components/LoadingOverlay';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
}

interface HomePageProps {
  navigation: any;
}

const StudentHomePage: React.FC<HomePageProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [firstName, setFirstName] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [selectedChatChannel, setSelectedChatChannel] = useState<{
    channelId: string;
    name: string;
  } | null>(null);
  
  // Use the real recent messages hook
  const { messages: recentMessages, loading: messagesLoading } = useRecentMessages(2);
  
  // Use the notifications context
  const { unreadCount: notifications, fetchUnreadCount } = useNotificationContext();

  useFocusEffect(
    React.useCallback(() => {
      const fetchDashboard = async () => {
        try {
          const { data: sessionData, error } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) throw new Error('No access token found');

          const dashboard = await getStudentDashboard(accessToken);

          console.log('Dashboard Response:', dashboard); 

          setFirstName(dashboard.user?.name || 'Student'); 
          setSessions(dashboard.sessions || []);
          setProfilePicture(dashboard.user?.profilePicture|| undefined); 
        } catch (error) {
          console.error('Failed to fetch dashboard info', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboard();
    }, [])
  );

  // Remove static chats data - now using real data from useRecentMessages hook

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    navigation.navigate(tabId);
  };

  const handleSettingsPress = () => {
    navigation.navigate('StudentSettings');
  };

  const handleNotificationPress = () => {
    navigation.navigate('StudentNotifications');
    // Refresh notifications when user visits the notifications page
    setTimeout(() => fetchUnreadCount(), 1000);
  };

  const handleProfilePress = () => {
    navigation.navigate('StudentProfile', {
      onProfilePicChange: (newUrl: string) => setProfilePicture(newUrl),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />
      
      <LoadingOverlay 
        visible={loading} 
        message="Loading your dashboard..." 
      />

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
            {sessions.length > 0 ? (
              (() => {
                const session = sessions[0];
                const startTime = new Date(session.start_time);
                const endTime = new Date(session.end_time);
                const today = new Date();
                const isToday = startTime.toDateString() === today.toDateString();
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

          {/* Recent Messages Card */}
          <View style={styles.messagesCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Recent Messages</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentChat')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {messagesLoading ? (
              <Text style={styles.loadingText}>Loading messages...</Text>
            ) : recentMessages.length > 0 ? (
              recentMessages.map(message => (
                <TouchableOpacity
                  key={message.id}
                  style={styles.chatItem}
                  onPress={() => setSelectedChatChannel({
                    channelId: message.channelId,
                    name: message.name
                  })}
                >
                  <Image source={{ uri: message.avatar }} style={styles.chatAvatar} />
                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName}>{message.name}</Text>
                      <Text style={styles.chatTime}>{message.time}</Text>
                    </View>
                    <Text style={styles.chatMessage} numberOfLines={1}>
                      {message.lastMessage}
                    </Text>
                  </View>
                  {message.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {message.unread > 99 ? '99+' : message.unread}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noMessagesText}>No recent messages</Text>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Chat Modal */}
      <ChatModal
        visible={!!selectedChatChannel}
        onClose={() => setSelectedChatChannel(null)}
        channelId={selectedChatChannel?.channelId}
        chatPartnerName={selectedChatChannel?.name}
      />
      
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
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noMessagesText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default StudentHomePage;