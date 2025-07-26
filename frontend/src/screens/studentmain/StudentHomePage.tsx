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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import { studentTabs } from '../../constants/studentTabs';
import { supabase } from '../../services/supabase';
import { getStudentDashboard, cancelSession } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useRecentMessages } from '../../hooks/useRecentMessages';
import { useNotificationContext } from '../../context/NotificationContext';
import ChatModal from '../../components/ChatModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import ClassStartedModal from '../../components/ClassStartedModal';
import StudentAutomaticClassStartedModal from '../../components/StudentAutomaticClassStartedModal';
import StudentActiveClassBanner from '../../components/StudentActiveClassBanner';
import StudentClassFeedbackModal from '../../components/StudentClassFeedbackModal';

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
  
  // Countdown state
  const [countdown, setCountdown] = useState<string>('');
  const [activeClass, setActiveClass] = useState<any>(null);
  
  // Automatic class started modal state
  const [showAutomaticClassModal, setShowAutomaticClassModal] = useState(false);
  const [automaticClassSession, setAutomaticClassSession] = useState<any>(null);
  const [automaticClassStudents, setAutomaticClassStudents] = useState<any[]>([]);
  
  // Class started modal state
  const [showClassStartedModal, setShowClassStartedModal] = useState(false);
  const [classStartedInfo, setClassStartedInfo] = useState<any>(null);
  const [showStudentAutomaticModal, setShowStudentAutomaticModal] = useState(false);
  const [studentAutomaticClassStudents, setStudentAutomaticClassStudents] = useState<any[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState<string>('');
  
  // Session details modal state
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null);
  
  // Student attendance status state
  const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<'present' | 'absent' | 'late' | 'pending'>('pending');
  
  // Class feedback modal state
  const [showClassFeedbackModal, setShowClassFeedbackModal] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState<any>(null);
  const [totalClassesAttended, setTotalClassesAttended] = useState(0);
  
  // State to trigger message refresh
  const [messageRefreshKey, setMessageRefreshKey] = useState(0);
  
  // Use the real recent messages hook
  const { messages: recentMessages, loading: messagesLoading } = useRecentMessages(2, messageRefreshKey);
  
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

          console.log('🔍 Student - Dashboard response:', dashboard);
          setFirstName(dashboard.user?.name || 'Student'); 
          setSessions(dashboard.sessions || []);
          setProfilePicture(dashboard.user?.profilePicture|| undefined);
          setCurrentStudentId(dashboard.user?.id || '');
          console.log('🔍 Student - Sessions set:', dashboard.sessions?.length || 0); 
        } catch (error) {
          console.error('Failed to fetch dashboard info', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboard();
      
      // Refresh messages when page is focused
      setMessageRefreshKey(prev => prev + 1);
    }, [])
  );

  // Calculate countdown for next class
  const calculateCountdown = async () => {
    const nextClass = getNextUpcomingClass();
    if (!nextClass) {
      console.log('🔍 Student - No next class for countdown');
      setCountdown('');
      return;
    }

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().slice(0, 5);
    const sessionDate = nextClass.date || nextClass.session_date;
    let sessionTime = nextClass.start_time;
    
    // Handle datetime strings (extract time part)
    if (sessionTime && sessionTime.includes('T')) {
      sessionTime = sessionTime.split('T')[1].split(':').slice(0, 2).join(':');
    }
    
    console.log('🔍 Student - Countdown calculation:');
    console.log('Next class:', nextClass);
    console.log('Session date:', sessionDate);
    console.log('Session time:', sessionTime);
    console.log('Current date:', currentDate);
    console.log('Current time:', currentTime);
    
    // Validate date and time
    if (!sessionDate || !sessionTime) {
      console.log('🔍 Student - Missing date or time, clearing countdown');
      setCountdown('');
      return;
    }
    
    // Check if session is today
    if (sessionDate !== currentDate) {
      console.log('🔍 Student - Session is not today, clearing countdown');
      setCountdown('');
      return;
    }
    
    // Calculate time difference in seconds (like coach homepage)
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [sessionHour, sessionMin] = sessionTime.split(':').map(Number);
    
    const currentTotalSeconds = (currentHour * 60 + currentMin) * 60 + now.getSeconds();
    const sessionTotalSeconds = (sessionHour * 60 + sessionMin) * 60;
    const remainingSeconds = sessionTotalSeconds - currentTotalSeconds;
    
    console.log('Current total seconds:', currentTotalSeconds);
    console.log('Session total seconds:', sessionTotalSeconds);
    console.log('Remaining seconds:', remainingSeconds);
    
    if (remainingSeconds > 0) {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      
      let countdownText = '';
      if (hours > 0) {
        countdownText = `+${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else if (minutes > 0) {
        countdownText = `+${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        countdownText = `+${seconds}s`;
      }
      
      console.log('🔍 Student - Countdown text:', countdownText);
      setCountdown(countdownText);
    } else {
      // Time to start the class - just set active class and check attendance
      console.log('🔍 Student - Countdown reached zero - class has started!');
      console.log('Next class:', nextClass);
      
      // Set active class but don't show modal automatically
      setActiveClass(nextClass);
      
      // Check attendance status for the new active class
      await checkStudentAttendanceStatus(nextClass.session_id || nextClass.id);
      
      setCountdown('Starting...');
    }
  };

  // Check for automatic class triggering
  const checkForAutomaticClassStart = async () => {
    const nextClass = getNextUpcomingClass();
    if (!nextClass) {
      console.log('🔍 Student - No next class found for automatic start check');
      return;
    }

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().slice(0, 5);
    const sessionDate = nextClass.date || nextClass.session_date;
    let sessionTime = nextClass.start_time;

    // Handle datetime strings (extract time part)
    if (sessionTime && sessionTime.includes('T')) {
      sessionTime = sessionTime.split('T')[1].split(':').slice(0, 2).join(':');
    }

    // Validate date and time
    if (!sessionDate || !sessionTime) {
      console.log('🔍 Student - Missing date or time for automatic start check');
      return;
    }

    console.log('🔍 Student - Automatic class start check:');
    console.log('Current date:', currentDate);
    console.log('Current time:', currentTime);
    console.log('Session date:', sessionDate);
    console.log('Session time:', sessionTime);
    console.log('Date match:', sessionDate === currentDate);
    console.log('Time check:', isTimeGreaterOrEqual(currentTime, sessionTime));

    // Check if it's time to start the class
    if (sessionDate === currentDate && isTimeGreaterOrEqual(currentTime, sessionTime)) {
      console.log('🔍 Student - Automatic class start triggered!');
      console.log('Session:', nextClass);
      console.log('Setting active class...');
      
      // Set the session but don't show modal automatically
      setActiveClass(nextClass);
      
      // Check attendance status for the new active class
      await checkStudentAttendanceStatus(nextClass.session_id || nextClass.id);
    } else {
      console.log('🔍 Student - Not time to start class yet');
      console.log('Date match:', sessionDate === currentDate);
      console.log('Time check:', isTimeGreaterOrEqual(currentTime, sessionTime));
    }
  };

  // Check for active class
  const checkActiveClass = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      // Check if there's a currently running class
      const currentDate = new Date().toLocaleDateString('en-CA');
      const currentTime = new Date().toTimeString().slice(0, 5);
      
      console.log('🔍 Student - Frontend Active Class Check:');
      console.log('Current date:', currentDate);
      console.log('Current time:', currentTime);
      console.log('Total sessions:', sessions?.length || 0);
      
      if (!sessions || sessions.length === 0) {
        console.log('No sessions available, setting active class to null');
        setActiveClass(null);
        return;
      }

      // Find currently running class from sessions
      const currentlyRunningClass = sessions.find(session => {
        const sessionDate = session.date || session.session_date;
        let sessionStartTime = session.start_time;
        let sessionEndTime = session.end_time;
        
        // Handle datetime strings (extract time part)
        if (sessionStartTime && sessionStartTime.includes('T')) {
          sessionStartTime = sessionStartTime.split('T')[1].split(':').slice(0, 2).join(':');
        }
        if (sessionEndTime && sessionEndTime.includes('T')) {
          sessionEndTime = sessionEndTime.split('T')[1].split(':').slice(0, 2).join(':');
        }
        
        // Check if session is today and currently running
        if (sessionDate === currentDate) {
          const isStarted = isTimeGreaterOrEqual(currentTime, sessionStartTime);
          const isEnded = isTimeGreaterOrEqual(currentTime, sessionEndTime);
          return isStarted && !isEnded;
        }
        return false;
      });

      console.log('Currently running class found:', currentlyRunningClass);
      setActiveClass(currentlyRunningClass || null);
      
      // If there's an active class, check attendance status
      if (currentlyRunningClass) {
        await checkStudentAttendanceStatus(currentlyRunningClass.session_id || currentlyRunningClass.id);
      }
    } catch (error) {
      console.error('Error checking active class:', error);
    }
  };

  const checkStudentAttendanceStatus = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/student/attendance-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          studentId: currentStudentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Student attendance status:', data);
        setStudentAttendanceStatus(data.status || 'pending');
      } else {
        console.log('Failed to get attendance status, defaulting to pending');
        setStudentAttendanceStatus('pending');
      }
    } catch (error) {
      console.error('Error checking attendance status:', error);
      setStudentAttendanceStatus('pending');
    }
  };

  // Helper functions
  const getNextUpcomingClass = () => {
    if (!sessions || sessions.length === 0) return null;

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().slice(0, 5);

    console.log('🔍 Student - Filtering upcoming classes...');
    console.log('Current date:', currentDate);
    console.log('Current time:', currentTime);
    console.log('Total sessions:', sessions?.length || 0);
    console.log('All sessions data:', sessions);

    // Filter sessions that are in the future or ended less than 15 minutes ago
    const upcomingSessions = sessions.filter(session => {
      const sessionDate = session.date || session.session_date;
      let sessionStartTime = session.start_time;
      let sessionEndTime = session.end_time;
      
      // Handle datetime strings (extract time part)
      if (sessionStartTime && sessionStartTime.includes('T')) {
        sessionStartTime = sessionStartTime.split('T')[1].split(':').slice(0, 2).join(':');
      }
      if (sessionEndTime && sessionEndTime.includes('T')) {
        sessionEndTime = sessionEndTime.split('T')[1].split(':').slice(0, 2).join(':');
      }
      
      console.log('Session:', {
        date: sessionDate,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        session_name: session.session_name,
        raw_session: session
      });
      
      // If session is today, check if it's in the future or ended less than 15 minutes ago
      if (sessionDate === currentDate) {
        const isFuture = !isTimeGreaterOrEqual(currentTime, sessionStartTime);
        const isCurrentlyRunning = isTimeGreaterOrEqual(currentTime, sessionStartTime) && 
          !isTimeGreaterOrEqual(currentTime, sessionEndTime);
        
        // Check if session ended more than 15 minutes ago
        const isEndedMoreThan15MinAgo = isTimeGreaterOrEqual(currentTime, sessionEndTime) && 
          isTimeGreaterOrEqual(currentTime, addMinutesToTime(sessionEndTime, 15));
        
        console.log('Today session, is future:', isFuture, 'is currently running:', isCurrentlyRunning, 'ended more than 15 min ago:', isEndedMoreThan15MinAgo);
        return isFuture && !isCurrentlyRunning && !isEndedMoreThan15MinAgo;
      }
      
      // If session is in the future, include it
      const isFutureDate = sessionDate > currentDate;
      console.log('Future date session:', isFutureDate);
      console.log('Session date:', sessionDate, 'Current date:', currentDate, 'Comparison:', sessionDate > currentDate);
      return isFutureDate;
    });

    console.log('Upcoming sessions found:', upcomingSessions.length);

    // Sort by date first, then by time
    upcomingSessions.sort((a, b) => {
      const dateA = a.date || a.session_date;
      const dateB = b.date || b.session_date;
      
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      
      // If same date, sort by start time
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    // Return the closest upcoming session
    const nextClass = upcomingSessions.length > 0 ? upcomingSessions[0] : null;
    console.log('Next upcoming class for student:', nextClass);
    return nextClass;
  };

  const isTimeGreaterOrEqual = (time1: string, time2: string): boolean => {
    const [hour1, min1] = time1.split(':').map(Number);
    const [hour2, min2] = time2.split(':').map(Number);
    
    const minutes1 = hour1 * 60 + min1;
    const minutes2 = hour2 * 60 + min2;
    
    console.log('🔍 Student - Time Comparison Debug:');
    console.log('Time1:', time1, '->', hour1, ':', min1, '->', minutes1, 'minutes');
    console.log('Time2:', time2, '->', hour2, ':', min2, '->', minutes2, 'minutes');
    console.log('Result:', minutes1 >= minutes2);
    
    return minutes1 >= minutes2;
  };

  const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    const [hour, min] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + min + minutesToAdd;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`;
  };

  // Continuous checking for automatic class start and active class
  useEffect(() => {
    if (!sessions || sessions.length === 0) return;

    const interval = setInterval(async () => {
      await checkForAutomaticClassStart();
      await checkActiveClass();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [sessions]);

  // Countdown timer effect
  useEffect(() => {
    calculateCountdown();
    
    const countdownInterval = setInterval(async () => {
      await calculateCountdown();
    }, 1000); // Update every second
    
    return () => clearInterval(countdownInterval);
  }, [sessions]);

  // Check for class completion effect
  useEffect(() => {
    if (activeClass) {
      checkActiveClass();
      
      const completionInterval = setInterval(async () => {
        await checkActiveClass();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(completionInterval);
    }
  }, [activeClass]);

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

  const handleBannerPress = async () => {
    if (activeClass) {
      try {
        // Fetch students data for the active class
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/student/active-class-students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: activeClass.session_id || activeClass.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setStudentAutomaticClassStudents(data.students || []);
        } else {
          setStudentAutomaticClassStudents(activeClass.students || []);
        }
        
        // Show the student automatic modal
        setShowStudentAutomaticModal(true);
      } catch (error) {
        console.error('Error fetching active class students:', error);
        setStudentAutomaticClassStudents(activeClass.students || []);
        setShowStudentAutomaticModal(true);
      }
    }
  };

  const handleViewDetails = (session: any) => {
    // For students, show session details modal
    setSelectedSessionDetails({
      id: session.id,
      title: session.session_name || 'Training Session',
      coach: session.coach_name || 'Coach',
      date: session.date || session.session_date,
      time: session.start_time,
      endTime: session.end_time,
      location: session.location || session.address,
      price: session.price,
      sessionType: session.session_type,
      studentsAttending: session.students_attending || 1,
      description: session.description || ''
    });
    setShowSessionDetailsModal(true);
  };

  const handleCancelSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      Alert.alert(
        'Cancel Session',
        'Are you sure you want to cancel this session?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: async () => {
              try {
                const { data: sessionData, error } = await supabase.auth.getSession();
                const accessToken = sessionData.session?.access_token;
                if (!accessToken) {
                  Alert.alert('Error', 'Authentication required');
                  return;
                }

                const response = await cancelSession(accessToken, sessionId, session.date || session.session_date);
                
                if (response.success) {
                  Alert.alert('Success', 'Session cancelled successfully');
                  // Refresh sessions
                  const dashboard = await getStudentDashboard(accessToken);
                  setSessions(dashboard.sessions || []);
                } else {
                  Alert.alert('Error', response.message || 'Failed to cancel session');
                }
              } catch (error: any) {
                console.error('Failed to cancel session:', error);
                Alert.alert('Error', error.message || 'Failed to cancel session');
              }
            }
          }
        ]
      );
    }
  };

  // Handle class completion and show feedback modal
  const handleClassCompletion = async (session: any) => {
    try {
      // Calculate total classes attended
      const completedSessions = sessions.filter(s => 
        s.session_status === 'completed' || s.status === 'completed'
      );
      const totalClasses = completedSessions.length + 1; // +1 for current session
      
      setFeedbackSession(session);
      setTotalClassesAttended(totalClasses);
      setShowClassFeedbackModal(true);
      
      // Clear active class
      setActiveClass(null);
    } catch (error) {
      console.error('Error handling class completion:', error);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (rating: number, feedback: string) => {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found');

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/student/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sessionId: feedbackSession?.session_id || feedbackSession?.id,
          rating,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Refresh sessions to update status
      const dashboard = await getStudentDashboard(accessToken);
      setSessions(dashboard.sessions || []);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
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
                const session = getNextUpcomingClass();
                
                // Check if session exists
                if (!session) {
                  return (
                    <Text style={{ padding: 16, color: '#6b7280' }}>No upcoming classes. Book your next session!</Text>
                  );
                }
                
                const sessionDate = session.date || session.session_date;
                let startTimeStr = session.start_time;
                let endTimeStr = session.end_time;
                
                // Handle datetime strings (extract time part for display)
                if (startTimeStr && startTimeStr.includes('T')) {
                  startTimeStr = startTimeStr.split('T')[1].split(':').slice(0, 2).join(':');
                }
                if (endTimeStr && endTimeStr.includes('T')) {
                  endTimeStr = endTimeStr.split('T')[1].split(':').slice(0, 2).join(':');
                }
                
                // Check if session is today (simple string comparison like coach)
                const today = new Date();
                const isToday = sessionDate === today.toLocaleDateString('en-CA');
                
                // Use time strings directly for display (like coach)
                const startTimeDisplay = startTimeStr || 'TBD';
                const endTimeDisplay = endTimeStr || 'TBD';
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
                        <View style={styles.classHeaderRow}>
                          {isToday && (
                            <View style={styles.todayBadge}>
                              <Text style={styles.todayText}>Today</Text>
                            </View>
                          )}
                          {countdown && (
                            <View style={styles.countdownBadge}>
                              <Text style={styles.countdownText}>{countdown}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.instructorName}>With {session.coach_name || 'Coach'}</Text>
                      <View style={styles.classInfo}>
                        <View style={styles.infoRow}>
                          <Ionicons name="time-outline" size={16} color="#6b7280" />
                          <Text style={styles.infoText}>
                            {startTimeDisplay} - {endTimeDisplay}
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
                        <TouchableOpacity 
                          style={styles.viewDetailsButton}
                          onPress={() => handleViewDetails(session)}
                        >
                          <Ionicons name="eye" size={16} color="#fb923c" />
                          <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.cancelButton}
                          onPress={() => handleCancelSession(session.id)}
                        >
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

      {/* Class Started Modal */}
      <ClassStartedModal
        visible={showClassStartedModal}
        classInfo={classStartedInfo}
        students={automaticClassStudents}
        onClose={() => setShowClassStartedModal(false)}
        onJoinClass={() => {
          console.log('Student joined class');
          setShowClassStartedModal(false);
        }}
        onRecordAttendance={() => {
          console.log('Record attendance for students');
          // For students, this could open a different modal or navigate to attendance page
          // The attendance data is handled within the modal component
          setShowClassStartedModal(false);
        }}
      />

      {/* Student Active Class Banner */}
      <StudentActiveClassBanner
        visible={!!activeClass}
        session={activeClass}
        attendanceStatus={studentAttendanceStatus}
        onPress={handleBannerPress}
      />

      {/* Student Automatic Class Started Modal */}
      <StudentAutomaticClassStartedModal
        visible={showStudentAutomaticModal}
        session={activeClass}
        students={studentAutomaticClassStudents}
        currentStudentId={currentStudentId}
        onClose={() => setShowStudentAutomaticModal(false)}
      />

      {/* Session Details Modal */}
      <Modal
        visible={showSessionDetailsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSessionDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Details</Text>
            <TouchableOpacity
              onPress={() => setShowSessionDetailsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {selectedSessionDetails && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Session Info Card */}
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Ionicons name="calendar" size={20} color="#fb923c" />
                  <Text style={styles.modalCardTitle}>Session Information</Text>
                </View>
                <View style={styles.modalCardContent}>
                  <Text style={styles.modalDetailText}>{selectedSessionDetails.session_name || selectedSessionDetails.sport}</Text>
                  <Text style={styles.modalDetailSubtext}>
                    {selectedSessionDetails.class_type === 'single' ? 'Individual Session' : 'Group Session'}
                  </Text>
                  <Text style={styles.modalDetailSubtext}>
                    {new Date(selectedSessionDetails.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.modalDetailSubtext}>
                    {(() => {
                      let startTime = selectedSessionDetails.start_time;
                      let endTime = selectedSessionDetails.end_time;
                      if (startTime && startTime.includes('T')) {
                        startTime = startTime.split('T')[1].split(':').slice(0, 2).join(':');
                      }
                      if (endTime && endTime.includes('T')) {
                        endTime = endTime.split('T')[1].split(':').slice(0, 2).join(':');
                      }
                      return `${startTime} - ${endTime}`;
                    })()}
                  </Text>
                  <Text style={styles.modalDetailSubtext}>
                    {selectedSessionDetails.location || selectedSessionDetails.address || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Coach Information */}
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Ionicons name="person" size={20} color="#fb923c" />
                  <Text style={styles.modalCardTitle}>Coach Information</Text>
                </View>
                <View style={styles.modalCardContent}>
                  <View style={styles.coachProfileRow}>
                    <Image
                      source={{ 
                        uri: selectedSessionDetails.coach_profile || 'https://via.placeholder.com/100'
                      }}
                      style={styles.modalCoachAvatar}
                      onError={() => {
                        console.log('Failed to load coach profile picture');
                      }}
                    />
                    <View style={styles.coachInfoModal}>
                      <Text style={styles.modalCoachName}>{selectedSessionDetails.coach_name || 'Coach'}</Text>
                      <Text style={styles.modalCoachEmail}>{selectedSessionDetails.coach_email || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Session Description */}
              {selectedSessionDetails.description && (
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <Ionicons name="document-text" size={20} color="#fb923c" />
                    <Text style={styles.modalCardTitle}>Description</Text>
                  </View>
                  <View style={styles.modalCardContent}>
                    <Text style={styles.modalDetailText}>
                      {selectedSessionDetails.description}
                    </Text>
                  </View>
                </View>
              )}

              {/* Pricing Information */}
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Ionicons name="card" size={20} color="#fb923c" />
                  <Text style={styles.modalCardTitle}>Pricing</Text>
                </View>
                <View style={styles.modalCardContent}>
                  <Text style={styles.modalDetailText}>
                    {selectedSessionDetails.price 
                      ? `$${Math.round(selectedSessionDetails.price)} per session` 
                      : 'Free session'
                    }
                  </Text>
                  <Text style={styles.modalDetailSubtext}>
                    Max Students: {selectedSessionDetails.max_students || 'N/A'}
                  </Text>
                  <Text style={styles.modalDetailSubtext}>
                    Currently Enrolled: {selectedSessionDetails.students_attending || 0}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Student Class Feedback Modal */}
      <StudentClassFeedbackModal
        visible={showClassFeedbackModal}
        session={feedbackSession}
        totalClassesAttended={totalClassesAttended}
        onSubmitFeedback={handleFeedbackSubmit}
        onClose={() => setShowClassFeedbackModal(false)}
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
  classHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdownBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fb923c',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fb923c',
    marginLeft: 4,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentOld: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    padding: 16,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionCoach: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  descriptionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // New modal styles matching calendar format
  modalContainer: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  modalCardContent: {
    gap: 8,
  },
  modalDetailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalDetailSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  coachProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCoachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  coachInfoModal: {
    flex: 1,
  },
  modalCoachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  modalCoachEmail: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default StudentHomePage;