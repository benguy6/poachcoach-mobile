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
  Modal,
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Ionicons } from '@expo/vector-icons';
import { getCoachDashboard, getActiveClass, startClass, endClass, submitClassFeedback, cancelCoachSession } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { useRecentMessages } from '../../hooks/useRecentMessages';
import { useNotificationContext } from '../../context/NotificationContext';
import ChatModal from '../../components/ChatModal';
import ActiveClassBanner from '../../components/ActiveClassBanner';
import ClassDetailsModal from '../../components/ClassDetailsModal';
import ClassFeedbackModal from '../../components/ClassFeedbackModal';
import AutomaticClassStartedModal from '../../components/AutomaticClassStartedModal';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CoachTabParamList } from '../../App';

import type { StackNavigationProp } from '@react-navigation/stack';
import CoachProfilePage from './CoachProfilePage';

type CoachHomePageProps = {
  navigation: StackNavigationProp<any>;
};

const CoachHomePage = ({ navigation }: CoachHomePageProps) => {
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
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<any>(null);
  
  // View details modal state
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [sessionToView, setSessionToView] = useState<any>(null);
  
  // Automatic class started modal state
  const [showAutomaticClassModal, setShowAutomaticClassModal] = useState(false);
  const [automaticClassSession, setAutomaticClassSession] = useState<any>(null);
  const [automaticClassStudents, setAutomaticClassStudents] = useState<any[]>([]);
  
  // Countdown state
  const [countdown, setCountdown] = useState<string>('');
  
  // Use the real recent messages hook
  const { messages: recentMessages, loading: messagesLoading } = useRecentMessages(2);
  
  // Use the notifications context
  const { unreadCount: notifications, fetchUnreadCount } = useNotificationContext();

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

      // Check if there's a currently running class
      const currentDate = new Date().toLocaleDateString('en-CA');
      const currentTime = new Date().toTimeString().slice(0, 5);
      
      console.log('🔍 Frontend Active Class Check:');
      console.log('Current date:', currentDate);
      console.log('Current time:', currentTime);
      console.log('Total sessions:', sessions?.length || 0);
      
      if (!sessions || sessions.length === 0) {
        console.log('No sessions available, setting active class to null');
        setActiveClass(null);
        return;
      }
      
      const currentlyRunningClass = sessions.find(session => {
        const sessionDate = session.date || session.session_date;
        const sessionStartTime = session.start_time;
        const sessionEndTime = session.end_time || session.endTime;
        
        console.log('Session data structure:', {
          date: sessionDate,
          startTime: sessionStartTime,
          endTime: sessionEndTime,
          hasEndTime: !!session.endTime,
          hasEnd_time: !!session.end_time
        });
        
        console.log('Checking session:', {
          id: session.unique_id || session.id,
          date: sessionDate,
          startTime: sessionStartTime,
          endTime: sessionEndTime,
          sport: session.sport || session.class_type
        });
        
        // Check if session is today and currently running
        if (sessionDate === currentDate) {
          const isCurrentlyRunning = isTimeGreaterOrEqual(currentTime, sessionStartTime) && 
                                   !isTimeGreaterOrEqual(currentTime, sessionEndTime);
          
          console.log('Same date session, is currently running:', isCurrentlyRunning);
          return isCurrentlyRunning;
        }
        console.log('Different date session, skipping');
        return false;
      });

      console.log('Currently running class found:', !!currentlyRunningClass);
      if (currentlyRunningClass) {
        console.log('Setting active class:', {
          id: currentlyRunningClass.unique_id || currentlyRunningClass.id,
          sport: currentlyRunningClass.sport || currentlyRunningClass.class_type,
          studentsAttending: currentlyRunningClass.students?.length || 0,
          startTime: currentlyRunningClass.start_time,
          endTime: currentlyRunningClass.end_time || currentlyRunningClass.endTime,
          hasStudents: !!currentlyRunningClass.students,
          studentsData: currentlyRunningClass.students || [],
          fullSessionData: currentlyRunningClass
        });
        
        setActiveClass({
          id: currentlyRunningClass.unique_id || currentlyRunningClass.id,
          sport: currentlyRunningClass.sport || currentlyRunningClass.class_type,
          studentsAttending: currentlyRunningClass.students?.length || 0,
          startTime: currentlyRunningClass.start_time,
          endTime: currentlyRunningClass.end_time || currentlyRunningClass.endTime,
          session: currentlyRunningClass
        });
      } else {
        console.log('No active class found, setting to null');
        setActiveClass(null);
      }
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
        console.log('🔍 Dashboard fetched, sessions:', data.confirmedSessions?.length || 0);
        console.log('🔍 Full dashboard response:', data);
        
        // Debug: Check if sessions have students
        if (data.confirmedSessions && data.confirmedSessions.length > 0) {
          data.confirmedSessions.forEach((session: any, index: number) => {
            console.log(`Session ${index + 1}:`, {
              id: session.unique_id || session.id,
              sport: session.sport || session.class_type,
              hasStudents: !!session.students,
              studentsCount: session.students?.length || 0,
              students: session.students || []
            });
          });
        }
      } catch (err) {
        console.error('Failed to fetch coach dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    checkActiveClass();
  }, []);

  // Check for automatic class start and update upcoming class every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkForAutomaticClassStart();
      checkActiveClass(); // Also check for active class
      // Force re-render of upcoming class by updating sessions state
      if (sessions) {
        setSessions(prevSessions => [...prevSessions]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [sessions]); // Re-run when sessions change

  // Check for active class every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessions) {
        checkActiveClass();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [sessions]); // Re-run when sessions change

  // Check for active class whenever sessions change
  useEffect(() => {
    console.log('🔍 Sessions changed, checking for active class. Sessions count:', sessions?.length || 0);
    if (sessions) {
      checkActiveClass();
    }
  }, [sessions]);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', {
      showAutomaticClassModal,
      automaticClassSession: automaticClassSession ? 'Session exists' : 'No session',
      automaticClassStudents: automaticClassStudents?.length || 0
    });
  }, [showAutomaticClassModal, automaticClassSession, automaticClassStudents]);

  // Monitor upcoming class changes
  useEffect(() => {
    const nextClass = getNextUpcomingClass();
    console.log('🔍 Upcoming class updated:', {
      hasNextClass: !!nextClass,
      classId: nextClass?.unique_id || nextClass?.id,
      classDate: nextClass?.date || nextClass?.session_date,
      classTime: nextClass?.start_time,
      totalSessions: sessions?.length || 0
    });
  }, [sessions]);

  // Monitor active class state
  useEffect(() => {
    console.log('🔍 Active class state changed:', {
      hasActiveClass: !!activeClass,
      activeClassId: activeClass?.id,
      activeClassSport: activeClass?.sport,
      activeClassStartTime: activeClass?.startTime,
      activeClassEndTime: activeClass?.endTime
    });
  }, [activeClass]);

  // Countdown timer for next upcoming class
  useEffect(() => {
    const nextClass = getNextUpcomingClass();
    if (!nextClass) return;

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().slice(0, 5);
    const sessionDate = nextClass.date || nextClass.session_date;
    const sessionTime = nextClass.start_time;

    console.log('🔍 Countdown setup for class:', {
      sessionDate,
      sessionTime,
      currentDate,
      currentTime,
      isToday: sessionDate === currentDate,
      timePassed: isTimeGreaterOrEqual(currentTime, sessionTime)
    });

    // Only start countdown if it's today and time hasn't passed
    if (sessionDate === currentDate && !isTimeGreaterOrEqual(currentTime, sessionTime)) {
      const interval = setInterval(async () => {
        const currentNow = new Date();
        const currentDateNow = currentNow.toLocaleDateString('en-CA');
        const currentTimeNow = currentNow.toTimeString().slice(0, 5);
        
        // Calculate remaining time with seconds
        const [currentHour, currentMin] = currentTimeNow.split(':').map(Number);
        const [sessionHour, sessionMin] = sessionTime.split(':').map(Number);
        
        const currentTotalSeconds = (currentHour * 60 + currentMin) * 60 + currentNow.getSeconds();
        const sessionTotalSeconds = (sessionHour * 60 + sessionMin) * 60;
        const remainingSeconds = sessionTotalSeconds - currentTotalSeconds;
        
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
          setCountdown(countdownText);
        } else {
          // Time to start the class - update session status to in_progress
          console.log('🔍 Countdown reached zero - updating session status to in_progress!');
          console.log('Next class:', nextClass);
          
          try {
            // Get current session token
            const { data: { session: authSession } } = await supabase.auth.getSession();
            const token = authSession?.access_token;
            if (!token) throw new Error('No token available');

            // Update session status to in_progress
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/coach/class-management/update-session-status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                sessionId: nextClass.unique_id || nextClass.id,
                status: 'in_progress'
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update session status');
            }

            console.log('Session status updated to in_progress successfully');
            
            // Trigger automatic class modal for coach
            setAutomaticClassSession(nextClass);
            setAutomaticClassStudents(nextClass.students || []);
            setShowAutomaticClassModal(true);
            
          } catch (error) {
            console.error('Error updating session status:', error);
          }
          
          setCountdown('Starting...');
          clearInterval(interval);
        }
      }, 1000); // Check every second

      return () => clearInterval(interval);
    } else {
      setCountdown('');
    }
  }, [sessions]); // Re-run when sessions change

  // Check for active class and update upcoming class display every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkActiveClass();
      // Force re-render to update upcoming class display
      setSessions(prevSessions => [...prevSessions]);
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartClass = async (sessionId: string) => {
    try {
      setIsProcessingAction(true);
      
      // Find the session data to check the scheduled time
      const session = sessions.find(s => (s.unique_id || s.id) === sessionId);
      if (!session) {
        Alert.alert('Error', 'Session not found.');
        return;
      }

      // Check if it's time to start the class
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      const sessionDate = session.date || session.session_date;
      const sessionTime = session.start_time;
      
      console.log('🔍 Checking if class can start...');
      console.log('Current date/time:', currentDate, currentTime);
      console.log('Session date/time:', sessionDate, sessionTime);
      
      // Check if session is today and if current time has reached or passed the start time
      if (sessionDate === currentDate) {
        if (!isTimeGreaterOrEqual(currentTime, sessionTime)) {
          const timeDiff = calculateTimeDifference(currentTime, sessionTime);
          Alert.alert(
            'Class Not Ready',
            `Class starts at ${sessionTime}. Please wait ${timeDiff} before starting the class.`,
            [{ text: 'OK' }]
          );
          return;
        }
      } else if (sessionDate > currentDate) {
        Alert.alert(
          'Class Not Ready',
          `This class is scheduled for ${new Date(sessionDate).toLocaleDateString()}. You cannot start it yet.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error('No token available');

      await startClass(token, sessionId);
      
      // Show success alert and automatically open class details modal
      Alert.alert(
        'Class Started!', 
        'Your class has started successfully. Students will be notified automatically.',
        [
          {
            text: 'View Class Details',
            onPress: () => {
              // Set the active class and show the modal
              setActiveClass({
                id: sessionId,
                sport: session.sport || session.class_type,
                studentsAttending: session.students_attending || 1,
                startTime: session.start_time,
                endTime: session.end_time,
                date: sessionDate,
                location: session.location_name || session.address,
                students: [] // Will be populated by active class API
              });
              setShowClassDetailsModal(true);
            }
          },
          {
            text: 'Continue',
            style: 'cancel'
          }
        ]
      );
      
      checkActiveClass(); // Refresh active class status
    } catch (error) {
      console.error('Failed to start class:', error);
      Alert.alert('Error', 'Failed to start class. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Helper function to calculate time difference
  const calculateTimeDifference = (currentTime: string, sessionTime: string): string => {
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [sessionHour, sessionMin] = sessionTime.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMin;
    const sessionMinutes = sessionHour * 60 + sessionMin;
    const diffMinutes = sessionMinutes - currentMinutes;
    
    if (diffMinutes <= 0) return 'now';
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Helper function to compare times properly
  const isTimeGreaterOrEqual = (time1: string, time2: string): boolean => {
    const [hour1, min1] = time1.split(':').map(Number);
    const [hour2, min2] = time2.split(':').map(Number);
    
    const minutes1 = hour1 * 60 + min1;
    const minutes2 = hour2 * 60 + min2;
    
    console.log('🔍 Time Comparison Debug:');
    console.log('Time1:', time1, '->', hour1, ':', min1, '->', minutes1, 'minutes');
    console.log('Time2:', time2, '->', hour2, ':', min2, '->', minutes2, 'minutes');
    console.log('Result:', minutes1 >= minutes2);
    
    return minutes1 >= minutes2;
  };

  // Helper function to add minutes to a time string
  const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    const [hour, min] = time.split(':').map(Number);
    const totalMinutes = hour * 60 + min + minutesToAdd;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`;
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
    // Show the class started modal when banner is clicked
    if (activeClass) {
      console.log('🔍 Banner pressed - Active class data:', {
        sessionUniqueId: activeClass.session?.unique_id || activeClass.session?.id,
        studentsCount: activeClass.session?.students?.length || 0,
        students: activeClass.session?.students || [],
        sessionData: activeClass.session,
        sessionUniqueIdField: activeClass.session?.unique_id,
        sessionIdField: activeClass.session?.session_id,
        sessionIdField2: activeClass.session?.id
      });
      
      setAutomaticClassSession(activeClass.session);
      setAutomaticClassStudents(activeClass.session.students || []);
      setShowAutomaticClassModal(true);
    }
  };

  const handleViewDetails = (session: any) => {
    setSessionToView(session);
    setShowViewDetailsModal(true);
  };

  const handleCancelSession = (sessionId: string) => {
    const session = sessions.find(s => (s.unique_id || s.id) === sessionId);
    if (session) {
      // Allow cancellation for both Individual and Group classes
      if (session.classType !== 'Individual' && session.classType !== 'single' && session.classType !== 'group') {
        Alert.alert('Invalid Session', 'This session type cannot be cancelled.');
        return;
      }
      
      setSessionToCancel(session);
      setShowCancelModal(true);
    }
  };

  const confirmCancelSession = async () => {
    if (!sessionToCancel) return;

    try {
      setIsProcessingAction(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('Calling cancelCoachSession with:', {
        uniqueId: sessionToCancel.unique_id || sessionToCancel.id
      });

      const response = await cancelCoachSession(token, sessionToCancel.unique_id || sessionToCancel.id);
      console.log('Cancel response:', response);

      // Close the modal
      setShowCancelModal(false);
      setSessionToCancel(null);

      // Show success message with refund details if applicable
      if (response.cancellationDetails?.refundDetails?.length > 0) {
        const paidStudents = response.cancellationDetails.refundDetails.filter((detail: any) => detail.needsRefund);
        if (paidStudents.length > 0) {
          const totalRefund = paidStudents.reduce((sum: number, detail: any) => sum + detail.refundAmount, 0);
          Alert.alert(
            'Session Cancelled Successfully', 
            `The ${sessionToCancel.sport} session has been cancelled. Refunds totaling $${totalRefund} will be processed for ${paidStudents.length} student(s).`,
            [{ text: 'OK', onPress: () => {} }]
          );
        } else {
          Alert.alert('Session Cancelled Successfully', `The ${sessionToCancel.sport} session has been cancelled. No refunds needed as no students had paid yet.`);
        }
      } else {
        Alert.alert('Session Cancelled Successfully', `The ${sessionToCancel.sport} session has been cancelled.`);
      }

      // Refresh sessions
      const { data: { session: newSession } } = await supabase.auth.getSession();
      const accessToken = newSession?.access_token;
      if (accessToken) {
        const data = await getCoachDashboard(accessToken);
        setSessions(data.confirmedSessions);
      }
    } catch (error: any) {
      console.error('Failed to cancel session:', error);
      Alert.alert('Error', error.message || 'Failed to cancel session. Please try again.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filter and get the next upcoming class
  const getNextUpcomingClass = () => {
    if (!sessions || sessions.length === 0) return null;

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format in local timezone

    console.log('🔍 Filtering upcoming classes...');
    console.log('Current date:', currentDate);
    console.log('Current time:', currentTime);
    console.log('Total sessions:', sessions?.length || 0);

    // Filter sessions that are in the future or ended less than 15 minutes ago
    const upcomingSessions = sessions.filter(session => {
      const sessionDate = session.date || session.session_date;
      const sessionStartTime = session.start_time;
      const sessionEndTime = session.end_time;
      
      console.log('Session:', {
        date: sessionDate,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        class_type: session.class_type
      });
      
      // If session is today, check if it's in the future or ended less than 15 minutes ago
      if (sessionDate === currentDate) {
        const isFuture = !isTimeGreaterOrEqual(currentTime, sessionStartTime);
        
        // Check if session ended more than 15 minutes ago
        const isEndedMoreThan15MinAgo = isTimeGreaterOrEqual(currentTime, sessionEndTime) && 
          isTimeGreaterOrEqual(currentTime, addMinutesToTime(sessionEndTime, 15));
        
        console.log('Today session, is future:', isFuture, 'ended more than 15 min ago:', isEndedMoreThan15MinAgo);
        return isFuture && !isEndedMoreThan15MinAgo;
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
    console.log('Next upcoming class:', nextClass);
    return nextClass;
  };

  // Check for automatic class triggering
  const checkForAutomaticClassStart = () => {
    const nextClass = getNextUpcomingClass();
    if (!nextClass) {
      console.log('🔍 No next class found for automatic start check');
      return;
    }

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-CA');
    const currentTime = now.toTimeString().slice(0, 5);
    const sessionDate = nextClass.date || nextClass.session_date;
    const sessionTime = nextClass.start_time;

    console.log('🔍 Automatic class start check:');
    console.log('Current date:', currentDate);
    console.log('Current time:', currentTime);
    console.log('Session date:', sessionDate);
    console.log('Session time:', sessionTime);
    console.log('Date match:', sessionDate === currentDate);
    console.log('Time check:', isTimeGreaterOrEqual(currentTime, sessionTime));

    // Check if it's time to start the class
    if (sessionDate === currentDate && isTimeGreaterOrEqual(currentTime, sessionTime)) {
      console.log('🔍 Automatic class start triggered!');
      console.log('Session:', nextClass);
      
      // Set the session and students for the modal
      setAutomaticClassSession(nextClass);
      setAutomaticClassStudents(nextClass.students || []);
      setShowAutomaticClassModal(true);
    } else {
      console.log('🔍 Not time to start class yet');
    }
  };

  const nextUpcomingClass = getNextUpcomingClass();

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
          <TouchableOpacity style={styles.notificationIcon} onPress={() => {
            navigation.navigate('CoachNotifications');
            // Refresh notifications when user visits the notifications page
            setTimeout(() => fetchUnreadCount(), 1000);
          }}>
            <Ionicons name="notifications-outline" size={24} color="#f97316" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {notifications > 99 ? '99+' : notifications}
                </Text>
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

        {/* Next Upcoming Class */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Next Upcoming Class</Text>
            {sessions && sessions.length > 1 && (
              <TouchableOpacity onPress={() => navigation.navigate('CoachCalendar')}>
                <Text style={styles.orangeText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          {!nextUpcomingClass ? (
            <Text style={{ color: '#fff' }}>No upcoming sessions.</Text>
          ) : (
            <View style={{ marginBottom: 20 }}>
              <View style={styles.classHeaderRow}>
                <Text style={styles.className}>{nextUpcomingClass.class_type || 'Session'}</Text>
                <View style={styles.confirmBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.confirmText}>Class Confirmed</Text>
                </View>
              </View>
              <Text style={styles.classSub}>{Math.max(nextUpcomingClass.students_attending || 0, 1)} students enrolled</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                <Text style={styles.infoText}>
                  {new Date(nextUpcomingClass.date || nextUpcomingClass.session_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#9ca3af" />
                <Text style={styles.infoText}>{nextUpcomingClass.start_time} - {nextUpcomingClass.end_time}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#9ca3af" />
                <Text style={styles.infoText}>{nextUpcomingClass.location_name || nextUpcomingClass.address || 'N/A'}</Text>
              </View>
              <View style={styles.buttonRow}>
                {(() => {
                  const now = new Date();
                  const currentDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format
                  const currentTime = now.toTimeString().slice(0, 5);
                  const sessionDate = nextUpcomingClass.date || nextUpcomingClass.session_date;
                  const sessionTime = nextUpcomingClass.start_time;
                  
                  const isFutureDate = sessionDate > currentDate;
                  const isToday = sessionDate === currentDate;
                  const timeUntilStart = isToday ? calculateTimeDifference(currentTime, sessionTime) : null;
                  
                  return (
                    <>
                      {/* View Details Button */}
                      <TouchableOpacity 
                        style={styles.viewDetailsBtn}
                        onPress={() => handleViewDetails(nextUpcomingClass)}
                      >
                        <Text style={styles.viewDetailsText}>View Details</Text>
                      </TouchableOpacity>
                      
                      {/* Cancel Button */}
                      <TouchableOpacity 
                        style={styles.redBtn}
                        onPress={() => handleCancelSession(nextUpcomingClass.unique_id || nextUpcomingClass.id)}
                      >
                        <Text style={styles.btnText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
              
              {/* Countdown Display - Positioned above cancel button */}
              <View style={styles.countdownWrapper}>
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>
                    {(() => {
                      const now = new Date();
                      const currentDate = now.toLocaleDateString('en-CA');
                      const sessionDate = nextUpcomingClass.date || nextUpcomingClass.session_date;
                      const isFutureDate = sessionDate > currentDate;
                      return isFutureDate ? 'Future Class' : countdown || 'Starting...';
                    })()}
                  </Text>
                </View>
              </View>
            </View>
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
          ) : recentMessages?.length > 0 ? (
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
      {console.log('🔍 ActiveClassBanner render check:', { hasActiveClass: !!activeClass, activeClassId: activeClass?.id })}
      
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

      {/* Cancel Modal */}
      {sessionToCancel && (
        <Modal
          visible={showCancelModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowCancelModal(false)}
        >
          <View style={styles.cancelModalOverlay}>
            <View style={styles.cancelModalContainer}>
              {/* Header */}
              <View style={styles.cancelModalHeader}>
                <View style={styles.cancelModalIconContainer}>
                  <Ionicons name="warning" size={32} color="#ef4444" />
                </View>
                <Text style={styles.cancelModalTitle}>Cancel Session</Text>
                <Text style={styles.cancelModalSubtitle}>
                  Are you sure you want to cancel this {sessionToCancel.sport} session?
                </Text>
              </View>

              {/* Session Details */}
              <View style={styles.cancelModalContent}>
                <View style={styles.cancelSessionInfo}>
                  <View style={styles.cancelInfoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                    <Text style={styles.cancelInfoText}>
                      {new Date(sessionToCancel.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.cancelInfoRow}>
                    <Ionicons name="time-outline" size={16} color="#9ca3af" />
                    <Text style={styles.cancelInfoText}>
                      {sessionToCancel.start_time} - {sessionToCancel.end_time}
                    </Text>
                  </View>
                  <View style={styles.cancelInfoRow}>
                    <Ionicons name="location-outline" size={16} color="#9ca3af" />
                    <Text style={styles.cancelInfoText}>
                      {sessionToCancel.location_name || sessionToCancel.address}
                    </Text>
                  </View>
                </View>

                {/* Warning Message */}
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    ⚠️ This action cannot be undone. Students will be notified and refunds will be processed if applicable.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.cancelModalActions}>
                  <TouchableOpacity
                    style={styles.keepSessionButton}
                    onPress={() => setShowCancelModal(false)}
                    disabled={isProcessingAction}
                  >
                    <Text style={styles.keepSessionButtonText}>Keep Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmCancelButton,
                      isProcessingAction && { opacity: 0.6 }
                    ]}
                    onPress={confirmCancelSession}
                    disabled={isProcessingAction}
                  >
                    <Text style={styles.confirmCancelButtonText}>
                      {isProcessingAction ? 'Cancelling...' : 'Cancel Session'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* View Details Modal */}
      {sessionToView && (
        <Modal
          visible={showViewDetailsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowViewDetailsModal(false)}
        >
          <View style={styles.viewDetailsContainer}>
            {/* Header */}
            <View style={styles.viewDetailsHeader}>
              <TouchableOpacity onPress={() => setShowViewDetailsModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.viewDetailsHeaderTitle}>Session Details</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <ScrollView style={styles.viewDetailsContent}>
              {/* Session Info */}
              <View style={styles.viewDetailsCard}>
                <Text style={styles.viewDetailsCardTitle}>Session Information</Text>
                
                <View style={styles.viewDetailsInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
                  <View style={styles.viewDetailsInfoText}>
                    <Text style={styles.viewDetailsLabel}>Date</Text>
                    <Text style={styles.viewDetailsValue}>
                      {new Date(sessionToView.date || sessionToView.session_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewDetailsInfoRow}>
                  <Ionicons name="time-outline" size={20} color="#9ca3af" />
                  <View style={styles.viewDetailsInfoText}>
                    <Text style={styles.viewDetailsLabel}>Time</Text>
                    <Text style={styles.viewDetailsValue}>
                      {sessionToView.start_time} - {sessionToView.end_time}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewDetailsInfoRow}>
                  <Ionicons name="location-outline" size={20} color="#9ca3af" />
                  <View style={styles.viewDetailsInfoText}>
                    <Text style={styles.viewDetailsLabel}>Location</Text>
                    <Text style={styles.viewDetailsValue}>
                      {sessionToView.location_name || sessionToView.address || 'TBD'}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewDetailsInfoRow}>
                  <Ionicons name="people-outline" size={20} color="#9ca3af" />
                  <View style={styles.viewDetailsInfoText}>
                    <Text style={styles.viewDetailsLabel}>Students</Text>
                    <Text style={styles.viewDetailsValue}>
                      {sessionToView.students_attending || 0} attending
                    </Text>
                  </View>
                </View>

                <View style={styles.viewDetailsInfoRow}>
                  <Ionicons name="card-outline" size={20} color="#9ca3af" />
                  <View style={styles.viewDetailsInfoText}>
                    <Text style={styles.viewDetailsLabel}>Price</Text>
                    <Text style={styles.viewDetailsValue}>
                      ${Math.round(sessionToView.price_per_session || sessionToView.price_per_hour || 0)} per session
                    </Text>
                  </View>
                </View>
              </View>

              {/* Session Status */}
              <View style={styles.viewDetailsCard}>
                <Text style={styles.viewDetailsCardTitle}>Status</Text>
                <View style={[
                  styles.statusBadge,
                  sessionToView.session_status === 'confirmed' ? styles.confirmedStatus : styles.publishedStatus
                ]}>
                  <Text style={styles.statusText}>
                    {sessionToView.session_status === 'confirmed' ? 'Confirmed' : 'Published'}
                  </Text>
                </View>
              </View>

              {/* Class Type */}
              <View style={styles.viewDetailsCard}>
                <Text style={styles.viewDetailsCardTitle}>Class Type</Text>
                <Text style={styles.viewDetailsValue}>
                  {(sessionToView.class_type === 'Individual' || sessionToView.class_type === 'single') 
                    ? 'Individual Session' 
                    : 'Group Session'}
                </Text>
              </View>

              {/* Description if available */}
              {sessionToView.description && (
                <View style={styles.viewDetailsCard}>
                  <Text style={styles.viewDetailsCardTitle}>Description</Text>
                  <Text style={styles.viewDetailsValue}>{sessionToView.description}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Automatic Class Started Modal */}
      {showAutomaticClassModal && (
        <AutomaticClassStartedModal
          visible={showAutomaticClassModal}
          onClose={() => {
            console.log('🔍 Closing automatic class modal');
            setShowAutomaticClassModal(false);
          }}
          onEndClass={handleEndClass}
          session={automaticClassSession}
          students={automaticClassStudents}
        />
      )}
      
      {/* Debug info */}
      {showAutomaticClassModal && (
        <View style={{ position: 'absolute', top: 100, left: 20, backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 5 }}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Modal Props: Session={!!automaticClassSession}, Students={automaticClassStudents?.length || 0}
          </Text>
        </View>
      )}
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
  classHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065f46',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
    gap: 8,
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
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fb923c',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
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
  // Cancel Modal styles
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cancelModalContainer: {
    backgroundColor: '#27272a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cancelModalHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cancelModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  cancelModalSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cancelSessionInfo: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cancelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelInfoText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 10,
    flex: 1,
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  keepSessionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  keepSessionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewDetailsBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fb923c',
  },
  viewDetailsText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // View Details Modal styles
  viewDetailsContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  viewDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  viewDetailsHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  viewDetailsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  viewDetailsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  viewDetailsCardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  viewDetailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  viewDetailsInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  viewDetailsLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  viewDetailsValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  confirmedStatus: {
    backgroundColor: '#10b981',
  },
  publishedStatus: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  countdownWrapper: {
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 1,
  },
  countdownContainer: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default CoachHomePage;