

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  Modal,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Eye,
  X,
  Navigation,
  Users,
  MessageCircle,
  Star,
  FileText,
  DollarSign,
  AlertTriangle,
  Edit3,
} from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import BottomNavigation from '../../components/BottomNavigation';
import { coachTabs } from '../../constants/coachTabs';
import { getCoachSessions, cancelCoachSession, rescheduleCoachSession } from '../../services/api';
import { getToken } from '../../services/auth';

const { width } = Dimensions.get('window');

const CoachCalendarPage = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<any>(null);
  
  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [sessionToReschedule, setSessionToReschedule] = useState<any>(null);
  const [rescheduleData, setRescheduleData] = useState({
    newDate: '',
    newStartTime: '07:00',
    newEndTime: '08:00',
    newPricePerSession: '',
    newAddress: '',
    newPostalCode: ''
  });
  const [sessionTime, setSessionTime] = useState<[number, number]>([0, 1]);

  // Time slots for reschedule modal (7:00 AM to 10:00 PM in 15 min blocks)
  const timeSlots: string[] = [];
  for (let hour = 7; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }

  // Load sessions when component mounts or comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

  const loadSessions = async () => {
    try {
      setLoading(true);
      console.log('CoachCalendar - Starting to load sessions...');
      
      const token = await getToken();
      console.log('CoachCalendar - Token retrieved:', token ? 'present' : 'missing');
      
      if (!token) {
        console.error('CoachCalendar - No token found');
        Alert.alert('Authentication Error', 'Please login again to view your sessions.');
        return;
      }

      console.log('CoachCalendar - Calling getCoachSessions API...');
      const sessionsData = await getCoachSessions(token);
      console.log('CoachCalendar - Sessions data received:', sessionsData);
      
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('CoachCalendar - Error loading coach sessions:', error);
      Alert.alert('Error', 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time from 24-hour to 12-hour format
  const formatTime = (time24: string) => {
    try {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return time24; // Return original if formatting fails
    }
  };

  // Get existing sessions for a specific date to help avoid conflicts
  const getExistingSessionsForDate = (date: string) => {
    if (!sessions || !date) return [];
    
    return sessions
      .filter(session => 
        session.date === date && 
        session.id !== sessionToReschedule?.id && // Use unique id for comparison
        session.status !== 'cancelled'
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return sessions.filter(session => session.date === dateString);
  };

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthStr}-${day}`;
      
      const sessionsCount = sessions.filter(s => s.date === dateString).length;
      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        sessionsCount,
      });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleViewDetails = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSessionDetails(session);
      setShowSessionDetails(true);
    }
  };

  const handleCancelSession = async (uniqueId: string) => {
    try {
      // Find the session to get its details
      const session = sessions.find(s => s.id === uniqueId);
      if (!session) {
        Alert.alert('Error', 'Session not found');
        return;
      }

      // Allow cancellation for both Individual and Group classes
      if (session.classType !== 'Individual' && session.classType !== 'single' && session.classType !== 'group') {
        Alert.alert('Invalid Session', 'This session type cannot be cancelled.');
        return;
      }

      // Store session for modal
      setSessionToCancel(session);
      setShowCancelModal(true);
    } catch (error) {
      console.error('Error in cancel session handler:', error);
      Alert.alert('Error', 'Failed to cancel session. Please try again.');
    }
  };

  const confirmRescheduleSession = async () => {
    if (!sessionToReschedule) return;

    try {
      // Validate required fields
      if (!rescheduleData.newDate || !rescheduleData.newPricePerSession) {
        Alert.alert('Validation Error', 'Please fill in the new date and price.');
        return;
      }

      // Validate that new date is in the future
      const today = new Date();
      const newSessionDate = new Date(rescheduleData.newDate);
      if (newSessionDate <= today) {
        Alert.alert('Invalid Date', 'Sessions can only be postponed to future dates.');
        return;
      }

      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Error', 'Please login again.');
        return;
      }

      const reschedulePayload = {
        uniqueId: sessionToReschedule.id, // Use the uniqueId instead of sessionId + originalDate
        newDate: rescheduleData.newDate,
        newStartTime: rescheduleData.newStartTime,
        newEndTime: rescheduleData.newEndTime,
        newPricePerSession: rescheduleData.newPricePerSession,
        ...(rescheduleData.newAddress && { newAddress: rescheduleData.newAddress }),
        ...(rescheduleData.newPostalCode && { newPostalCode: rescheduleData.newPostalCode })
      };

      console.log('Sending reschedule request:', reschedulePayload);

      const result = await rescheduleCoachSession(token, reschedulePayload);
      
      setShowRescheduleModal(false);
      setSessionToReschedule(null);
      
      // Reload sessions to reflect changes
      await loadSessions();

      Alert.alert(
        'Session Rescheduled Successfully!', 
        `Your ${result.rescheduleDetails.sport} session has been moved to ${new Date(rescheduleData.newDate).toDateString()}. Students will be notified and have 12 hours before the new session time to accept or reject.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error rescheduling session:', error);
      
      // Handle specific conflict detection errors with detailed information
      let errorDetails = null;
      try {
        // Try to parse the error message as JSON (from backend)
        errorDetails = JSON.parse(error.message);
      } catch (parseError) {
        // If not JSON, check if it's a string containing JSON
        if (error.message && error.message.includes('{')) {
          try {
            const jsonStart = error.message.indexOf('{');
            const jsonPart = error.message.substring(jsonStart);
            errorDetails = JSON.parse(jsonPart);
          } catch (secondParseError) {
            console.log('Could not parse error details as JSON');
          }
        }
      }

      // Handle time slot conflicts with detailed information
      if (errorDetails?.conflictType === 'schedule_overlap' || 
          error.message?.includes('Time slot conflict detected')) {
        
        if (errorDetails?.details) {
          const conflictDetails = errorDetails.details;
          const conflictingSession = conflictDetails.conflictingSession;
          
          Alert.alert(
            '⚠️ Schedule Conflict Detected',
            `The selected time slot conflicts with another session:\n\n` +
            `🔴 Existing ${conflictingSession.sport} Session:\n` +
            `📅 ${conflictingSession.date}\n` +
            `⏰ ${conflictingSession.startTime} - ${conflictingSession.endTime}\n\n` +
            `🟡 Your Requested Slot:\n` +
            `📅 ${conflictDetails.requestedSlot.date}\n` +
            `⏰ ${conflictDetails.requestedSlot.startTime} - ${conflictDetails.requestedSlot.endTime}\n\n` +
            `💡 Please choose a different time slot that doesn't overlap.`,
            [{ text: 'Got it', style: 'default' }]
          );
        } else {
          // Fallback for basic conflict detection
          Alert.alert(
            '⚠️ Schedule Conflict', 
            'The selected time slot conflicts with another session. Please choose a different time that doesn\'t overlap with your existing sessions.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Handle other types of errors (validation, server errors, etc.)
        let userFriendlyMessage = 'Failed to reschedule session. Please try again.';
        
        if (error.message?.includes('Sessions can only be postponed to future dates')) {
          userFriendlyMessage = 'Sessions can only be rescheduled to future dates. Please select a date and time after now.';
        } else if (error.message?.includes('Only single classes can be rescheduled')) {
          userFriendlyMessage = 'Only individual classes can be rescheduled. Group sessions must be cancelled and recreated.';
        } else if (error.message?.includes('Cannot reschedule a cancelled session')) {
          userFriendlyMessage = 'This session has already been cancelled and cannot be rescheduled.';
        }
        
        Alert.alert('Error', userFriendlyMessage);
      }
    }
  };

  const handleTimeChange = (values: number[]) => {
    setSessionTime([values[0], values[1]]);
    setRescheduleData(prev => ({
      ...prev,
      newStartTime: timeSlots[values[0]],
      newEndTime: timeSlots[values[1]]
    }));
  };

  const confirmCancelSession = async () => {
    if (!sessionToCancel) return;

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      console.log('Calling cancelCoachSession with:', {
        uniqueId: sessionToCancel.id
      });

      const response = await cancelCoachSession(token, sessionToCancel.id);
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

      // Reload sessions to reflect the change
      await loadSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', 'Failed to cancel session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSession = (sessionId: string) => {
    try {
      // Find the session to get its details
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        Alert.alert('Error', 'Session not found');
        return;
      }

      // Only allow rescheduling for single classes
      if (session.classType !== 'Individual' && session.classType !== 'single') {
        Alert.alert('Invalid Session', 'Only single classes can be rescheduled.');
        return;
      }

      // Store session for modal and initialize form data
      setSessionToReschedule(session);
      setRescheduleData({
        newDate: '',
        newStartTime: session.time,
        newEndTime: session.endTime,
        newPricePerSession: session.pricePerSession ? session.pricePerSession.toString() : '',
        newAddress: '',
        newPostalCode: ''
      });

      // Set initial time slider values
      const startIndex = timeSlots.indexOf(session.time);
      const endIndex = timeSlots.indexOf(session.endTime);
      setSessionTime([startIndex >= 0 ? startIndex : 0, endIndex >= 0 ? endIndex : 1]);

      setShowRescheduleModal(true);
    } catch (error) {
      console.error('Error in reschedule session handler:', error);
      Alert.alert('Error', 'Failed to open reschedule modal. Please try again.');
    }
  };

  const handleChatWithStudent = (studentId: string) => {
    // TODO: Implement chat functionality
    console.log('Chat with student:', studentId);
  };

  const renderCalendarDay = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        !item.isCurrentMonth && styles.inactiveDay,
        item.isToday && styles.todayDay,
        item.isSelected && styles.selectedDay,
      ]}
      onPress={() => handleDateSelect(item.date)}
    >
      <Text
        style={[
          styles.dayText,
          !item.isCurrentMonth && styles.inactiveDayText,
          item.isToday && styles.todayText,
          item.isSelected && styles.selectedDayText,
        ]}
      >
        {item.date.getDate()}
      </Text>
      {item.sessionsCount > 0 && (
        <View style={styles.sessionIndicator}>
          <Text style={styles.sessionIndicatorText}>{item.sessionsCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSessionCard = ({ item }: { item: any }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{item.sport}</Text>
      </View>

      <View style={styles.sessionDetails}>
        <Text style={styles.sessionTypeText}>
          {(item.classType === 'Individual' || item.classType === 'single')
            ? 'Individual Session' 
            : `Group Session${item.studentsAttending ? ` • ${item.studentsAttending}/${item.maxStudents} students` : ''}`
          }
        </Text>
        <View style={styles.detailRow}>
          <Clock size={16} color="#9ca3af" />
          <Text style={styles.detailText}>{formatTime(item.time)} - {formatTime(item.endTime)} • {item.duration}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#9ca3af" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Navigation size={16} color="#9ca3af" />
          <Text style={styles.detailText}>{item.postal_code}</Text>
        </View>
      </View>

      <View style={styles.sessionFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            {item.pricePerSession 
              ? `$${Math.round(item.pricePerSession)}/session` 
              : item.pricePerHour 
                ? `$${Math.round(item.pricePerHour)}/hour`
                : 'Free'
            }
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewDetails(item.id)}
          >
            <Eye size={16} color="#fb923c" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {(item.classType === 'Individual' || item.classType === 'single') && (
            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={() => handleRescheduleSession(item.id)}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelSession(item.id)}
          >
            <X size={16} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCancelConfirmationModal = () => {
    if (!sessionToCancel) return null;

    const studentsWithPayments = sessionToCancel.students?.filter((student: any) => student.paymentStatus === 'paid') || [];
    const studentsWithoutPayments = sessionToCancel.students?.filter((student: any) => student.paymentStatus === 'unpaid') || [];
    const totalRefund = studentsWithPayments.length * (sessionToCancel.pricePerSession || 0);

    return (
      <Modal
        visible={showCancelModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowCancelModal(false);
          setSessionToCancel(null);
        }}
      >
        <View style={styles.cancelModalOverlay}>
          <View style={styles.cancelModalContainer}>
            {/* Header */}
            <View style={styles.cancelModalHeader}>
              <View style={styles.cancelModalIconContainer}>
                <AlertTriangle size={32} color="#ef4444" />
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
                  <CalendarIcon size={16} color="#9ca3af" />
                  <Text style={styles.cancelInfoText}>
                    {new Date(sessionToCancel.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.cancelInfoRow}>
                  <Clock size={16} color="#9ca3af" />
                  <Text style={styles.cancelInfoText}>
                    {formatTime(sessionToCancel.time)} • {sessionToCancel.duration}
                  </Text>
                </View>
                <View style={styles.cancelInfoRow}>
                  <MapPin size={16} color="#9ca3af" />
                  <Text style={styles.cancelInfoText}>{sessionToCancel.location}</Text>
                </View>
                <View style={styles.cancelInfoRow}>
                  <Users size={16} color="#9ca3af" />
                  <Text style={styles.cancelInfoText}>
                    {sessionToCancel.studentsAttending} student(s) enrolled
                  </Text>
                </View>
              </View>

              {/* Impact Warning */}
              <View style={styles.cancelImpactWarning}>
                <Text style={styles.cancelWarningTitle}>Impact of Cancellation:</Text>
                
                {studentsWithPayments.length > 0 && (
                  <Text style={styles.cancelWarningText}>
                    • {studentsWithPayments.length} paid student(s) will receive refund of ${totalRefund}
                  </Text>
                )}
                
                {studentsWithoutPayments.length > 0 && (
                  <Text style={styles.cancelWarningText}>
                    • {studentsWithoutPayments.length} unpaid student(s) will be notified
                  </Text>
                )}
                
                <Text style={styles.cancelWarningText}>
                  • This action cannot be undone
                </Text>
                <Text style={styles.cancelWarningText}>
                  • All students will be automatically notified
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={styles.cancelModalKeepButton}
                onPress={() => {
                  setShowCancelModal(false);
                  setSessionToCancel(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalKeepText}>Keep Session</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.cancelModalConfirmButton, loading && styles.cancelModalConfirmButtonDisabled]}
                onPress={confirmCancelSession}
                disabled={loading}
                activeOpacity={loading ? 1 : 0.8}
              >
                {loading ? (
                  <View style={styles.cancelButtonContentLoading}>
                    <View style={styles.loadingSpinner} />
                    <Text style={styles.cancelModalConfirmText}>Cancelling...</Text>
                  </View>
                ) : (
                  <Text style={styles.cancelModalConfirmText}>Yes, Cancel Session</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRescheduleModal = () => {
    if (!sessionToReschedule) return null;

    const formatTime = (time24: string) => {
      try {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      } catch (error) {
        return time24;
      }
    };

    const calculateDuration = (startTime: string, endTime: string) => {
      try {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0 && diffMinutes > 0) {
          return `${diffHours}h ${diffMinutes}m`;
        } else if (diffHours > 0) {
          return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
          return `${diffMinutes} minutes`;
        } else {
          return '30 minutes';
        }
      } catch (error) {
        return '1 hour';
      }
    };

    return (
      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowRescheduleModal(false);
          setSessionToReschedule(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reschedule Session</Text>
            <TouchableOpacity
              onPress={() => {
                setShowRescheduleModal(false);
                setSessionToReschedule(null);
              }}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Current Session Info */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Edit3 size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>Current Session</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>{sessionToReschedule.sport}</Text>
                <Text style={styles.modalDetailSubtext}>
                  {new Date(sessionToReschedule.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  {formatTime(sessionToReschedule.time)} - {formatTime(sessionToReschedule.endTime)}
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  ${sessionToReschedule.pricePerSession} • {sessionToReschedule.location}
                </Text>
              </View>
            </View>

            {/* New Date Selection */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <CalendarIcon size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>New Date (Postpone Only)</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Calendar
                  onDayPress={(day: any) => {
                    setRescheduleData(prev => ({ ...prev, newDate: day.dateString }));
                  }}
                  markedDates={{
                    [rescheduleData.newDate]: { 
                      selected: true, 
                      selectedColor: '#fb923c' 
                    }
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    backgroundColor: '#27272a',
                    calendarBackground: '#27272a',
                    textSectionTitleColor: '#fb923c',
                    selectedDayBackgroundColor: '#fb923c',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#fb923c',
                    dayTextColor: '#d1d5db',
                    textDisabledColor: '#6b7280',
                    dotColor: '#fb923c',
                    selectedDotColor: '#ffffff',
                    arrowColor: '#fb923c',
                    monthTextColor: '#fb923c',
                    indicatorColor: '#fb923c',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 13,
                  }}
                  style={{
                    borderRadius: 8,
                    backgroundColor: '#27272a',
                  }}
                />
                {rescheduleData.newDate && (
                  <>
                    <Text style={styles.selectedDateText}>
                      Selected: {new Date(rescheduleData.newDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                    
                    {/* Show existing sessions for the selected date */}
                    {(() => {
                      const existingSessions = getExistingSessionsForDate(rescheduleData.newDate);
                      if (existingSessions.length > 0) {
                        return (
                          <View style={styles.existingSessionsContainer}>
                            <Text style={styles.existingSessionsTitle}>
                              Existing sessions on this date:
                            </Text>
                            {existingSessions.map((session, index) => (
                              <Text key={index} style={styles.existingSessionItem}>
                                • {formatTime(session.time)} - {formatTime(session.endTime)} ({session.sport})
                              </Text>
                            ))}
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </View>
            </View>

            {/* New Time Selection */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Clock size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>New Time</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.timeDisplayText}>
                  {formatTime(rescheduleData.newStartTime)} - {formatTime(rescheduleData.newEndTime)}
                </Text>
                <Text style={styles.durationText}>
                  Duration: {calculateDuration(rescheduleData.newStartTime, rescheduleData.newEndTime)}
                </Text>
                <View style={styles.sliderContainer}>
                  <MultiSlider
                    values={sessionTime}
                    sliderLength={width - 80}
                    onValuesChange={handleTimeChange}
                    min={0}
                    max={timeSlots.length - 1}
                    step={1}
                    allowOverlap={false}
                    snapped
                    selectedStyle={{
                      backgroundColor: '#fb923c',
                    }}
                    unselectedStyle={{
                      backgroundColor: '#6b7280',
                    }}
                    containerStyle={{
                      alignItems: 'center',
                    }}
                    trackStyle={{
                      height: 4,
                      borderRadius: 2,
                    }}
                    markerStyle={{
                      backgroundColor: '#fb923c',
                      height: 20,
                      width: 20,
                      borderRadius: 10,
                    }}
                    pressedMarkerStyle={{
                      backgroundColor: '#ea580c',
                      height: 24,
                      width: 24,
                      borderRadius: 12,
                    }}
                  />
                </View>
                <View style={styles.timeLabels}>
                  <Text style={styles.timeLabel}>7:00 AM</Text>
                  <Text style={styles.timeLabel}>10:00 PM</Text>
                </View>
              </View>
            </View>

            {/* New Price */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <DollarSign size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>New Price</Text>
              </View>
              <View style={styles.modalCardContent}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Enter new session price"
                  placeholderTextColor="#9ca3af"
                  value={rescheduleData.newPricePerSession}
                  onChangeText={(text) => setRescheduleData(prev => ({ ...prev, newPricePerSession: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Optional Address Changes */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <MapPin size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>New Location (Optional)</Text>
              </View>
              <View style={styles.modalCardContent}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter new address (optional)"
                  placeholderTextColor="#9ca3af"
                  value={rescheduleData.newAddress}
                  onChangeText={(text) => setRescheduleData(prev => ({ ...prev, newAddress: text }))}
                  multiline
                />
                <TextInput
                  style={styles.postalInput}
                  placeholder="New postal code (optional)"
                  placeholderTextColor="#9ca3af"
                  value={rescheduleData.newPostalCode}
                  onChangeText={(text) => setRescheduleData(prev => ({ ...prev, newPostalCode: text }))}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.rescheduleActions}>
              <TouchableOpacity
                style={styles.rescheduleKeepButton}
                onPress={() => {
                  setShowRescheduleModal(false);
                  setSessionToReschedule(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.rescheduleKeepText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.rescheduleConfirmButton,
                  (!rescheduleData.newDate || !rescheduleData.newPricePerSession || loading) && styles.rescheduleConfirmButtonDisabled
                ]}
                onPress={confirmRescheduleSession}
                disabled={!rescheduleData.newDate || !rescheduleData.newPricePerSession || loading}
                activeOpacity={(!rescheduleData.newDate || !rescheduleData.newPricePerSession || loading) ? 1 : 0.8}
              >
                {loading ? (
                  <View style={styles.rescheduleButtonContentLoading}>
                    <View style={styles.loadingSpinner} />
                    <Text style={styles.rescheduleConfirmText}>Rescheduling...</Text>
                  </View>
                ) : (
                  <Text style={styles.rescheduleConfirmText}>Reschedule Session</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderSessionDetailsModal = () => {
    if (!selectedSessionDetails) return null;

    return (
      <Modal
        visible={showSessionDetails}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSessionDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Details</Text>
            <TouchableOpacity
              onPress={() => setShowSessionDetails(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Session Info Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <CalendarIcon size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>Session Information</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>{selectedSessionDetails.sport}</Text>
                <Text style={styles.modalDetailSubtext}>
                  {(selectedSessionDetails.classType === 'Individual' || selectedSessionDetails.classType === 'single')
                    ? 'Individual Session'
                    : 'Group Session'
                  }
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
                  {formatTime(selectedSessionDetails.time)} • {selectedSessionDetails.duration}
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  {selectedSessionDetails.location}
                </Text>
              </View>
            </View>

            {/* Students Cards */}
            {selectedSessionDetails.students?.map((student: any, index: number) => (
              <View key={student.id} style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <User size={20} color="#fb923c" />
                  <Text style={styles.modalCardTitle}>
                    Student {index + 1}
                  </Text>
                  <View style={[
                    styles.paymentStatusBadge,
                    student.paymentStatus === 'paid' ? styles.paidBadge : styles.unpaidBadge
                  ]}>
                    <Text style={[
                      styles.paymentStatusText,
                      student.paymentStatus === 'paid' ? styles.paidStatusText : styles.unpaidStatusText
                    ]}>
                      {student.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalCardContent}>
                  <View style={styles.studentProfileRow}>
                    <Image
                      source={{ 
                        uri: student.profilePicture || 'https://via.placeholder.com/100'
                      }}
                      style={styles.modalStudentAvatar}
                      onError={() => {
                        // Fallback image on error
                        console.log('Failed to load profile picture for student:', student.name);
                      }}
                    />
                    <View style={styles.studentInfoModal}>
                      <Text style={styles.modalStudentName}>{student.name}</Text>
                      <Text style={styles.modalStudentEmail}>{student.email}</Text>
                      {student.phone && (
                        <Text style={styles.modalStudentPhone}>{student.phone}</Text>
                      )}
                      {student.gender && (
                        <Text style={styles.modalStudentPhone}>
                          {student.gender}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.chatButton}
                    onPress={() => handleChatWithStudent(student.id)}
                  >
                    <MessageCircle size={16} color="#fff" />
                    <Text style={styles.chatButtonText}>Chat First</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Session Description */}
            {selectedSessionDetails.description && (
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <FileText size={20} color="#fb923c" />
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
                <DollarSign size={20} color="#fb923c" />
                <Text style={styles.modalCardTitle}>Pricing</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  {selectedSessionDetails.pricePerSession 
                    ? `$${Math.round(selectedSessionDetails.pricePerSession)} per session` 
                    : selectedSessionDetails.pricePerHour 
                      ? `$${Math.round(selectedSessionDetails.pricePerHour)} per hour`
                      : 'Free session'
                  }
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  Max Students: {selectedSessionDetails.maxStudents}
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  Currently Enrolled: {selectedSessionDetails.studentsAttending}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const calendarDays = getCalendarDays();
  const selectedDateSessions = getSessionsForDate(selectedDate);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#18181b" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CalendarIcon size={28} color="#fb923c" />
          <Text style={styles.headerTitle}>My Sessions</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? 's' : ''} on {selectedDate.toDateString()}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthYear}>
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <ChevronRight size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Days of Week */}
        <View style={styles.daysOfWeekContainer}>
          {daysOfWeek.map((day) => (
            <View key={day} style={styles.dayOfWeek}>
              <Text style={styles.dayOfWeekText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          <FlatList
            data={calendarDays}
            renderItem={renderCalendarDay}
            keyExtractor={(item) => item.date.toISOString()}
            numColumns={7}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Sessions for Selected Date */}
        <View style={styles.sessionsContainer}>
          <Text style={styles.sessionsTitle}>
            Sessions for {selectedDate.toDateString()}
          </Text>
          {selectedDateSessions.length === 0 ? (
            <View style={styles.noSessionsContainer}>
              <CalendarIcon size={48} color="#374151" />
              <Text style={styles.noSessionsText}>No sessions scheduled</Text>
              <Text style={styles.noSessionsSubtext}>
                Your coaching sessions will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedDateSessions}
              renderItem={renderSessionCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      <BottomNavigation 
        tabs={coachTabs} 
        activeTab="CoachCalendar" 
        onTabPress={(tabId: any) => {
          if (tabId === 'CoachHome') {
            navigation.navigate('CoachHome' as never);
          } else if (tabId === 'CoachCreateSession') {
            navigation.navigate('CoachCreateSession' as never);
          } else if (tabId === 'CoachChat') {
            navigation.navigate('CoachChat' as never);
          } else if (tabId === 'CoachWallet') {
            navigation.navigate('CoachWallet' as never);
          }
        }} 
      />

      {renderCancelConfirmationModal()}
      {renderRescheduleModal()}
      {renderSessionDetailsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  header: {
    backgroundColor: '#27272a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 40,
  },
  content: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#27272a',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dayOfWeek: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  calendarGrid: {
    backgroundColor: '#27272a',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    position: 'relative',
  },
  inactiveDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: '#fed7aa',
  },
  selectedDay: {
    backgroundColor: '#fb923c',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  inactiveDayText: {
    color: '#6b7280',
  },
  todayText: {
    color: '#fb923c',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sessionIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fb923c',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  sessionsContainer: {
    padding: 20,
    backgroundColor: '#18181b',
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  noSessionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSessionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 12,
  },
  noSessionsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionTypeText: {
    fontSize: 14,
    color: '#fb923c',
    fontWeight: '500',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fb923c',
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fb923c',
    marginLeft: 4,
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fb923c',
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  rescheduleButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#27272a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    flex: 1,
    minWidth: 70,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#27272a',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
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
    elevation: 2,
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
    flex: 1,
  },
  modalCardContent: {
    gap: 8,
  },
  modalDetailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalDetailSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  studentProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalStudentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  studentInfoModal: {
    flex: 1,
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalStudentEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalStudentPhone: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  paidBadge: {
    backgroundColor: '#10b981',
  },
  unpaidBadge: {
    backgroundColor: '#ef4444',
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paidStatusText: {
    color: '#ffffff',
  },
  unpaidStatusText: {
    color: '#ffffff',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fb923c',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: '#10b981',
  },
  pubconBadge: {
    backgroundColor: '#fb923c',
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmedText: {
    color: '#ffffff',
  },
  pubconText: {
    color: '#ffffff',
  },
  // Cancel Modal Styles
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
  cancelImpactWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  cancelWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  cancelWarningText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
    lineHeight: 18,
  },
  cancelModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelModalKeepButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelModalKeepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelModalConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelModalConfirmButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonContentLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderTopColor: 'transparent',
    // Note: In a real app, you'd use a proper loading animation library
  },
  cancelModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // Reschedule Modal Styles
  selectedDateText: {
    fontSize: 14,
    color: '#fb923c',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  existingSessionsContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
  },
  existingSessionsTitle: {
    fontSize: 12,
    color: '#fb923c',
    fontWeight: '600',
    marginBottom: 6,
  },
  existingSessionItem: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
    paddingLeft: 4,
  },
  timeDisplayText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#18181b',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#18181b',
    marginBottom: 12,
    minHeight: 80,
  },
  postalInput: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#18181b',
  },
  rescheduleActions: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  rescheduleKeepButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescheduleKeepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    textAlign: 'center',
  },
  rescheduleConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#fb923c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fb923c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rescheduleConfirmButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  rescheduleButtonContentLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rescheduleConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default CoachCalendarPage;