import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';
import { getCoachDashboard, getActiveClass, startClass, endClass, submitClassFeedback } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { useRecentMessages } from '../../hooks/useRecentMessages';
import ChatModal from '../../components/ChatModal';
import ActiveClassBanner from '../../components/ActiveClassBanner';
import ClassDetailsModal from '../../components/ClassDetailsModal';
import ClassFeedbackModal from '../../components/ClassFeedbackModal';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CoachTabParamList } from '../../App';

import type { StackNavigationProp } from '@react-navigation/stack';
import CoachProfilePage from './CoachProfilePage';

type CoachHomePageProps = {
  navigation: StackNavigationProp<any>;
};

const CoachHomePage = ({ navigation }: CoachHomePageProps) => {
  const [notifications] = useState(2);
  const [coach, setCoach] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChatChannel, setSelectedChatChannel] = useState<{
    channelId: string;
    name: string;
  } | null>(null);
  
  // Active class state
  const [activeClass, setActiveClass] = useState<any>(null);
  const [showClassDetailsModal, setShowClassDetailsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  // Use the real recent messages hook
  const { messages: recentMessages, loading: messagesLoading } = useRecentMessages(2);

  const tabNavigation = useNavigation<BottomTabNavigationProp<CoachTabParamList>>();

  // Handle profile picture change
  const handleProfilePicChange = (newUrl: string) => {
    setCoach((prev: any) => ({ ...prev, profilePicture: newUrl }));
  };

  // Check for active class
  const checkActiveClass = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const response = await getActiveClass(token);
      setActiveClass(response.activeClass);
    } catch (error) {
      console.log('No active class or error checking:', error);
      setActiveClass(null);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      try {
        const data = await getCoachDashboard(token);
        setCoach(data.coach);
        setSessions(data.confirmedSessions);
      } catch (err) {
        console.error('Failed to fetch coach dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    checkActiveClass();
  }, []);

  // Check for active class every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkActiveClass, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartClass = async (sessionId: string) => {
    try {
      setIsProcessingAction(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No token available');

      await startClass(token, sessionId);
      Alert.alert('Success', 'Class started successfully!');
      checkActiveClass(); // Refresh active class status
    } catch (error) {
      console.error('Failed to start class:', error);
      Alert.alert('Error', 'Failed to start class. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleEndClass = async () => {
    if (!activeClass) return;

    try {
      setIsProcessingAction(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No token available');

      const response = await endClass(token, activeClass.id);
      Alert.alert(
        'Class Ended', 
        `Class ended successfully!\n\nEarnings: $${response.session.totalEarnings}\nStudents attended: ${response.session.studentsAttended}`,
        [
          {
            text: 'Submit Feedback',
            onPress: () => setShowFeedbackModal(true),
          },
          {
            text: 'Close',
            style: 'cancel',
          },
        ]
      );
      setActiveClass(null);
      setShowClassDetailsModal(false);
    } catch (error) {
      console.error('Failed to end class:', error);
      Alert.alert('Error', 'Failed to end class. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSubmitFeedback = async (feedback: {
    generalFeedback: string;
    topicsCovered: string;
    studentProgress: string;
    nextSessionPlan: string;
    studentFeedbacks: Array<{studentId: string, feedback: string, rating?: number}>;
  }) => {
    if (!activeClass) return;

    try {
      setIsProcessingAction(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No token available');

      await submitClassFeedback(
        token,
        activeClass.id,
        feedback.generalFeedback,
        feedback.topicsCovered,
        feedback.studentProgress,
        feedback.nextSessionPlan,
        feedback.studentFeedbacks
      );

      Alert.alert('Success', 'Feedback submitted successfully! Your earnings have been credited to your wallet.');
      setShowFeedbackModal(false);
      setActiveClass(null);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleBannerPress = () => {
    setShowClassDetailsModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />
      
      <LoadingOverlay 
        visible={loading} 
        message="Loading your dashboard..." 
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('CoachSettings')}>
            <Ionicons name="settings-outline" size={28} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationIcon} onPress={() => navigation.navigate('CoachNotifications')}>
            <Ionicons name="notifications-outline" size={24} color="#f97316" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachProfile')}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <Image
              source={{ uri: coach?.profilePicture || 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.profileImage}
            />
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingText}>Hello, {coach?.name || 'Coach'}!</Text>
              <Text style={styles.subGreetingText}>Ready to inspire your students?</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fed7aa" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Upcoming Classes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Classes</Text>
          {!sessions || sessions.length === 0 ? (
            <Text style={{ color: '#fff' }}>No confirmed sessions.</Text>
          ) : (
            sessions.map((session, idx) => (
              <View key={session.id || idx} style={{ marginBottom: 20 }}>
                <View style={styles.confirmBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text style={styles.confirmText}>Class Confirmed</Text>
                </View>
                <Text style={styles.className}>{session.class_type || 'Session'}</Text>
                <Text style={styles.classSub}>{session.students_attending || 0} students enrolled</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                  <Text style={styles.infoText}>{session.start_time} - {session.end_time}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#9ca3af" />
                  <Text style={styles.infoText}>{session.location_name || 'N/A'}</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.orangeBtn, isProcessingAction && styles.disabledButton]}
                    onPress={() => handleStartClass(session.unique_id || session.id)}
                    disabled={isProcessingAction}
                  >
                    <Text style={styles.btnText}>
                      {isProcessingAction ? 'Starting...' : 'Start Class'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.redBtn}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Messages (dummy for now) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Messages</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CoachChat')}>
              <Text style={styles.orangeText}>View All</Text>
            </TouchableOpacity>
          </View>

          {messagesLoading ? (
            <Text style={styles.loadingText}>Loading messages...</Text>
          ) : recentMessages.length > 0 ? (
            recentMessages.map(message => (
              <TouchableOpacity 
                key={message.id}
                style={styles.chatRow}
                onPress={() => setSelectedChatChannel({
                  channelId: message.channelId,
                  name: message.name
                })}
              >
                <Image
                  source={{ uri: message.avatar }}
                  style={styles.chatAvatar}
                />
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{message.name}</Text>
                    <Text style={styles.chatTime}>{message.time}</Text>
                  </View>
                  <Text style={styles.chatMessage}>{message.lastMessage}</Text>
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
      </ScrollView>
      
      {/* Active Class Banner */}
      {activeClass && (
        <ActiveClassBanner
          activeClass={activeClass}
          onPress={handleBannerPress}
          onEndClass={handleEndClass}
        />
      )}
      
      {/* Chat Modal */}
      <ChatModal
        visible={!!selectedChatChannel}
        onClose={() => setSelectedChatChannel(null)}
        channelId={selectedChatChannel?.channelId}
        chatPartnerName={selectedChatChannel?.name}
      />

      {/* Class Details Modal */}
      <ClassDetailsModal
        visible={showClassDetailsModal}
        activeClass={activeClass}
        onClose={() => setShowClassDetailsModal(false)}
        onEndClass={handleEndClass}
      />

      {/* Feedback Modal */}
      <ClassFeedbackModal
        visible={showFeedbackModal}
        activeClass={activeClass}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subGreetingText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065f46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  className: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  classSub: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  orangeBtn: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  redBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  orangeText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
  chatMessage: {
    color: '#9ca3af',
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noMessagesText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default CoachHomePage;