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
  Linking,
  Alert,
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
  DollarSign,
  Award,
  FileText,
  MessageCircle,
  Star,
  CreditCard,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import BottomNavigation from '../../components/BottomNavigation';
import { studentTabs } from '../../constants/studentTabs';
import { supabase } from '../../services/supabase';
import { getStudentSessions, cancelSession } from '../../services/api';

const { width } = Dimensions.get('window');

const StudentCalendarPage = () => {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Payment modal states (UI only - no functionality yet)
  const [showPayModal, setShowPayModal] = useState(false);
  const [sessionToPay, setSessionToPay] = useState<any>(null);

  // Fetch student sessions from API
  const fetchStudentSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: sessionData, error } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('No access token found');

      const response = await getStudentSessions(accessToken);
      
      if (response.success && response.sessions) {
        // Transform API data to match the component's expected structure
        const transformedSessions = response.sessions.map((session: any) => ({
          id: session.id.toString(),
          title: `${session.sport || 'Training'} with ${session.coach.name}`,
          coach: session.coach.name,
          date: session.date,
          time: formatTime(session.startTime),
          duration: session.duration,
          location: session.address || 'Location TBD',
          postal_code: session.postalCode || '',
          student_status: session.studentStatus,
          session_type: session.sessionType,
          price: session.price,
          coach_profile: session.coach.profilePicture,
          description: session.description || '',
          // Additional fields from API
          bookingId: session.bookingId,
          startTime: session.startTime,
          endTime: session.endTime,
          classType: session.classType,
          sessionStatus: session.sessionStatus,
          maxStudents: session.maxStudents,
          studentsAttending: session.studentsAttending,
          sport: session.sport,
          latitude: session.latitude,
          longitude: session.longitude,
          // Coach data with ratings and qualifications
          coachData: {
            id: session.coach.id,
            name: session.coach.name,
            firstName: session.coach.firstName,
            lastName: session.coach.lastName,
            profilePicture: session.coach.profilePicture,
            email: session.coach.email,
            gender: session.coach.gender,
            rating: session.coach.rating,
            reviewCount: session.coach.reviewCount,
            qualifications: session.coach.qualifications
          }
        }));
        
        setSessions(transformedSessions);
      } else {
        setSessions([]); // No sessions found
      }
    } catch (err: any) {
      console.error('Error fetching student sessions:', err);
      setError(err.message || 'Failed to fetch sessions');
      // Set empty array on error
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time from 24-hour to 12-hour format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${period}`;
  };

  // Fetch data when component mounts or comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchStudentSessions();
    }, [])
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to convert time string to ISO format
  const convertTimeToISO = (timeString: string) => {
    // Convert "09:00 AM" to "09:00:00"
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (period === 'PM' && hours !== '12') {
      hours = (parseInt(hours) + 12).toString();
    } else if (period === 'AM' && hours === '12') {
      hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  // Filter sessions: remove sessions past their end time and auto-delete unpaid sessions within 12 hours
  const filterAndCleanSessions = () => {
    const now = new Date();
    
    return sessions.filter(session => {
      // Create end time for the session by converting endTime to ISO format
      let sessionEndTime;
      if (session.endTime) {
        // Use the actual endTime from the session data
        sessionEndTime = new Date(`${session.date}T${convertTimeToISO(session.endTime)}`);
      } else {
        // Fallback: if no endTime, use startTime (this shouldn't happen but prevents errors)
        sessionEndTime = new Date(`${session.date}T${convertTimeToISO(session.time)}`);
      }
      
      // Check if session has passed its end time
      const hasPassed = now > sessionEndTime;
      console.log(`Session ${session.id} on ${session.date}:`);
      console.log(`  End time: ${sessionEndTime.toISOString()}`);
      console.log(`  Current time: ${now.toISOString()}`);
      console.log(`  Has passed: ${hasPassed}`);
      
      // Remove sessions that have passed their end time
      if (hasPassed) {
        return false;
      }
      
      // Calculate hours until session starts for unpaid session logic
      const sessionStartTime = new Date(`${session.date}T${convertTimeToISO(session.time)}`);
      const hoursUntilSession = (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Auto-delete unpaid sessions within 12 hours of start time
      if (session.student_status === 'unpaid' && hoursUntilSession <= 12 && hoursUntilSession > 0) {
        // Remove from sessions array
        setSessions(prevSessions => prevSessions.filter(s => s.id !== session.id));
        return false;
      }
      
      return true;
    });
  };

  // Use filtered sessions
  const filteredSessions = filterAndCleanSessions();

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return filteredSessions.filter(session => session.date === dateString);
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
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthStr}-${day}`;
      
      const sessionsCount = filteredSessions.filter(s => s.date === dateString).length;
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
    const session = filteredSessions.find(s => s.id === sessionId);
    if (session) {
      // Transform the session data to match the expected format
      const sessionData = session as any; // Type assertion for extended session data
      
      // Debug logging
      console.log('Session data for modal:', {
        classType: sessionData.classType,
        studentsAttending: sessionData.studentsAttending,
        maxStudents: sessionData.maxStudents
      });
      
      const transformedSession = {
        id: sessionData.id,
        name: sessionData.coach,
        specialty: `${sessionData.sport} Coach`, // Use sport instead of full title
        sport: sessionData.sport,
        rating: sessionData.coachData?.rating || 0,
        reviewCount: sessionData.coachData?.reviewCount || 0,
        price: sessionData.price,
        avatar: sessionData.coachData?.profilePicture || null,
        classType: sessionData.classType,
        studentsAttending: sessionData.studentsAttending,
        maxStudents: sessionData.maxStudents,
        sessionDetails: {
          date: sessionData.date,
          startTime: sessionData.time,
          endTime: sessionData.endTime ? formatTime(sessionData.endTime) : null,
          location: sessionData.location,
          pricePerSession: sessionData.price,
          pricePerHour: sessionData.price, // Assuming same for simplicity
        },
        address: sessionData.location,
        postalCodeDetails: sessionData.postal_code,
        sessionDescription: sessionData.description || '',
        qualifications: sessionData.coachData?.qualifications || [],
        sessionType: sessionData.session_type,
      };
      
      setSelectedSessionDetails(transformedSession);
      setShowSessionDetails(true);
    }
  };

  const handleCancelSession = (sessionId: string) => {
    const session = filteredSessions.find(s => s.id === sessionId);
    if (session) {
      // Allow cancellation for both single and group classes
      setSessionToCancel(session);
      setShowCancelModal(true);
    }
  };

  const calculateRefundInfo = (session: any) => {
    // Parse session date and time
    const sessionDateTime = new Date(`${session.date}T${convertTimeToISO(session.time)}`);
    const now = new Date();
    const hoursUntilSession = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const isRefundable = hoursUntilSession >= 12;
    const refundAmount = isRefundable ? session.price : 0;
    
    return { isRefundable, refundAmount, hoursUntilSession };
  };

  const confirmCancellation = async () => {
    if (!sessionToCancel) return;

    try {
      setCancelling(true);
      
      // Get access token
      const { data: sessionData, error } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        Alert.alert('Error', 'No authentication token found');
        return;
      }

      // Call backend to cancel the session
      const response = await cancelSession(
        accessToken, 
        sessionToCancel.id, 
        sessionToCancel.date
      );

      if (response.success) {
        const details = response.cancellationDetails;
        
        // Remove session from the sessions array
        setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionToCancel.id));
        
        // Close modal and reset state
        setShowCancelModal(false);
        setSessionToCancel(null);

        // Show different alerts based on refund eligibility and payment status
        const classTypeLabel = details.classType === 'single' ? 'single class' : 'group class';
        
        if (details.hasPaid) {
          if (details.refundEligible) {
            Alert.alert(
              'Session Cancelled',
              `Your ${classTypeLabel} session has been cancelled successfully.\n\n` +
              `✅ Refund Eligible: $${details.refundAmount}\n` +
              `The session was cancelled more than 12 hours in advance.\n\n` +
              `Note: Wallet integration coming soon - refund processing will be implemented.`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Session Cancelled',
              `Your ${classTypeLabel} session has been cancelled.\n\n` +
              `❌ No Refund: You cancelled less than 12 hours before the session (${details.hoursBeforeSession} hours).\n` +
              `Payment of $${details.refundAmount || sessionToCancel.price} will not be refunded.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Session Cancelled',
            `Your ${classTypeLabel} session has been cancelled successfully.\n\n` +
            `Since you hadn't paid for this session yet, no refund processing is needed.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to cancel session');
      }
    } catch (error: any) {
      console.error('Error cancelling session:', error);
      Alert.alert('Error', error.message || 'Failed to cancel session. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayForSession = (sessionId: string) => {
    // TODO: Implement payment functionality
    const session = filteredSessions.find(s => s.id === sessionId);
    if (session) {
      setSessionToPay(session);
      setShowPayModal(true);
    }
    console.log('Pay for session:', sessionId);
  };

  const confirmPayment = () => {
    // TODO: Implement actual payment logic here
    setShowPayModal(false);
    setSessionToPay(null);
    console.log('Payment confirmed - functionality coming soon');
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
    <View
      style={[
        styles.sessionCard,
        item.student_status === 'paid' ? styles.paidSession : styles.unpaidSession,
      ]}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <View
          style={[
            styles.statusBadge,
            item.student_status === 'paid' ? styles.paidBadge : styles.unpaidBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.student_status === 'paid' ? styles.paidStatusText : styles.unpaidStatusText,
            ]}
          >
            {item.student_status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <User size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.coach}</Text>
          {item.coachData && (
            <View style={styles.ratingContainer}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>
                {item.coachData.rating} ({item.coachData.reviewCount})
              </Text>
            </View>
          )}
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.time} • {item.duration}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Navigation size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.postal_code}</Text>
        </View>
      </View>

      <View style={styles.sessionFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>${Math.round(item.price)}</Text>
          <Text style={styles.sessionTypeText}>{item.session_type}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewDetails(item.id)}
          >
            <Eye size={16} color="#f97316" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {item.student_status === 'unpaid' ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePayForSession(item.id)}
            >
              <CreditCard size={16} color="#10b981" />
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          ) : null}
          
          {/* Cancel button - for both single and group classes */}
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

  const calendarDays = getCalendarDays();
  const selectedDateSessions = getSessionsForDate(selectedDate);

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
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Coach Profile Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Users size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Coach Profile</Text>
              </View>
              <View style={styles.modalCardContent}>
                <View style={styles.coachProfileRow}>
                  <Image
                    source={{ uri: selectedSessionDetails.avatar }}
                    style={styles.modalCoachAvatar}
                  />
                  <View style={styles.coachInfoModal}>
                    <Text style={styles.modalCoachName}>{selectedSessionDetails.name}</Text>
                    <Text style={styles.modalCoachSport}>{selectedSessionDetails.sport}</Text>
                    <View style={styles.ratingRowModal}>
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.modalRatingText}>
                        {selectedSessionDetails.rating} ({selectedSessionDetails.reviewCount} reviews)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Session Type Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Users size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Type</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  {selectedSessionDetails.classType?.toLowerCase() === 'individual' ? 'Individual Session' : 'Group Session'}
                </Text>
                {selectedSessionDetails.classType?.toLowerCase() === 'group' && (
                  <Text style={styles.modalDetailSubtext}>
                    {selectedSessionDetails.studentsAttending} students attending
                  </Text>
                )}
              </View>
            </View>

            {/* Date & Time Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <CalendarIcon size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Date & Time</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  {new Date(selectedSessionDetails.sessionDetails.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  {selectedSessionDetails.sessionDetails.startTime} - {selectedSessionDetails.sessionDetails.endTime}
                </Text>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <MapPin size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Location</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>{selectedSessionDetails.sessionDetails.location}</Text>
                <Text style={styles.modalDetailSubtext}>{selectedSessionDetails.address}</Text>
                <Text style={styles.modalDetailSubtext}>Postal Code: {selectedSessionDetails.postalCodeDetails}</Text>
              </View>
            </View>

            {/* Session Price Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <DollarSign size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Price</Text>
              </View>
              <View style={styles.modalCardContent}>
                <View style={styles.priceItemModal}>
                  <Text style={styles.modalDetailText}>
                    {new Date(selectedSessionDetails.sessionDetails.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })} - {selectedSessionDetails.sessionDetails.startTime}
                  </Text>
                  <View style={styles.priceRowModal}>
                    <Text style={styles.modalPriceText}>${Math.round(selectedSessionDetails.sessionDetails.pricePerSession)}/session</Text>
                    <Text style={styles.modalPriceSubtext}>${Math.round(selectedSessionDetails.sessionDetails.pricePerHour)}/hour</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <FileText size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Description</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDescriptionText}>{selectedSessionDetails.sessionDescription}</Text>
              </View>
            </View>

            {/* Qualifications Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Award size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Qualifications</Text>
              </View>
              <View style={styles.modalCardContent}>
                {selectedSessionDetails.qualifications?.map((qualification: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.qualificationItem}
                    onPress={() => Linking.openURL(qualification.url)}
                  >
                    <FileText size={16} color="#3b82f6" />
                    <Text style={styles.qualificationText}>{qualification.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Chat First Button */}
            <TouchableOpacity style={styles.chatFirstButton}>
              <MessageCircle size={20} color="white" />
              <Text style={styles.chatFirstButtonText}>Chat First</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderCancelConfirmationModal = () => {
    if (!sessionToCancel) return null;

    const refundInfo = calculateRefundInfo(sessionToCancel);
    const sessionDate = new Date(sessionToCancel.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
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
              <View style={styles.cancelIconContainer}>
                <X size={24} color="#ef4444" />
              </View>
              <Text style={styles.cancelModalTitle}>Cancel Session</Text>
              <Text style={styles.cancelModalSubtitle}>
                {sessionToCancel.title} with {sessionToCancel.coach}
              </Text>
            </View>

            {/* Session Info */}
            <View style={styles.cancelSessionInfo}>
              <View style={styles.cancelSessionRow}>
                <CalendarIcon size={16} color="#6b7280" />
                <Text style={styles.cancelSessionText}>{sessionDate}</Text>
              </View>
              <View style={styles.cancelSessionRow}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.cancelSessionText}>{sessionToCancel.time}</Text>
              </View>
              <View style={styles.cancelSessionRow}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.cancelSessionText}>{sessionToCancel.location}</Text>
              </View>
            </View>

            {/* Refund Information */}
            <View style={[
              styles.refundInfoContainer,
              refundInfo.isRefundable ? styles.refundableContainer : styles.nonRefundableContainer
            ]}>
              <View style={styles.refundHeader}>
                <DollarSign size={20} color={refundInfo.isRefundable ? "#10b981" : "#ef4444"} />
                <Text style={[
                  styles.refundTitle,
                  refundInfo.isRefundable ? styles.refundableTitle : styles.nonRefundableTitle
                ]}>
                  {refundInfo.isRefundable ? "Full Refund Available" : "No Refund Available"}
                </Text>
              </View>
              
              <Text style={styles.refundDescription}>
                {refundInfo.isRefundable 
                  ? `You'll receive a full refund of $${Math.round(refundInfo.refundAmount)} since you're cancelling more than 12 hours before the session.`
                  : `No refund will be issued as you're cancelling less than 12 hours before the session (${Math.abs(Math.round(refundInfo.hoursUntilSession))} hours remaining).`
                }
              </Text>

              {refundInfo.isRefundable && (
                <View style={styles.refundAmountContainer}>
                  <Text style={styles.refundAmountLabel}>Refund Amount:</Text>
                  <Text style={styles.refundAmountValue}>${Math.round(refundInfo.refundAmount)}</Text>
                </View>
              )}
            </View>

            {/* Warning Message */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ This action cannot be undone. Are you sure you want to cancel this {sessionToCancel?.classType === 'single' ? 'single class' : 'group class'} session?
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={styles.keepSessionButton}
                onPress={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                <Text style={styles.keepSessionButtonText}>Keep Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmCancelButton,
                  cancelling && { opacity: 0.6, backgroundColor: '#9ca3af' }
                ]}
                onPress={confirmCancellation}
                disabled={cancelling}
              >
                <Text style={styles.confirmCancelButtonText}>
                  {cancelling ? 'Cancelling...' : 'Cancel Session'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderPaymentModal = () => {
    // Payment modal UI (no functionality yet)
    if (!sessionToPay) return null;

    return (
      <Modal
        visible={showPayModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment</Text>
            <TouchableOpacity
              onPress={() => setShowPayModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Payment Details Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <DollarSign size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Payment Details</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  Payment functionality coming soon!
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  Session with {sessionToPay.coach} - ${Math.round(sessionToPay.price)}
                </Text>
              </View>
            </View>

            {/* Placeholder for future payment method selection */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <CreditCard size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Payment Method</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  Payment methods will be available here
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.confirmPaymentButton}
                onPress={confirmPayment}
              >
                <Text style={styles.confirmPaymentButtonText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CalendarIcon size={28} color="#ffffff" />
          <Text style={styles.headerTitle}>My Sessions</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {selectedDateSessions.length} session{selectedDateSessions.length !== 1 ? 's' : ''} on {selectedDate.toDateString()}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your sessions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStudentSessions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.monthYear}>
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <ChevronRight size={24} color="#374151" />
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
              <CalendarIcon size={48} color="#d1d5db" />
              <Text style={styles.noSessionsText}>No sessions scheduled</Text>
              <Text style={styles.noSessionsSubtext}>
                Your booked sessions will appear here
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
      )}

      <BottomNavigation 
        tabs={studentTabs} 
        activeTab="StudentCalendar" 
        onTabPress={(tabId) => {
          if (tabId !== 'StudentCalendar') {
            navigation.navigate(tabId as never);
          }
        }} 
      />

      {renderSessionDetailsModal()}
      {renderCancelConfirmationModal()}
      {renderPaymentModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#f97316',
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
    color: '#fed7aa',
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayOfWeek: {
    flex: 1,
    alignItems: 'center',
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#fef3c7',
  },
  selectedDay: {
    backgroundColor: '#f97316',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inactiveDayText: {
    color: '#9ca3af',
  },
  todayText: {
    color: '#f97316',
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
    backgroundColor: '#f97316',
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
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  noSessionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSessionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
  },
  noSessionsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paidSession: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  unpaidSession: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  paidBadge: {
    backgroundColor: '#d1fae5',
  },
  unpaidBadge: {
    backgroundColor: '#fed7aa',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  paidStatusText: {
    color: '#10b981',
  },
  unpaidStatusText: {
    color: '#f97316',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#374151',
  },
  sessionTypeText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
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
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f97316',
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fef2f2',
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
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    flex: 1,
    minWidth: 70,
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    color: '#111827',
    marginLeft: 8,
  },
  modalCardContent: {
    gap: 8,
  },
  modalDetailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalDetailSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  coachProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCoachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  coachInfoModal: {
    flex: 1,
  },
  modalCoachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCoachSport: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginTop: 2,
  },
  modalCoachSpecialty: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  ratingRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modalRatingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  priceItemModal: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  priceRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  modalPriceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  modalPriceSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
  },
  qualificationText: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 8,
    fontWeight: '500',
  },
  chatFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  chatFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Cancel Modal styles
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cancelModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cancelModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelModalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  cancelSessionInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cancelSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelSessionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  refundInfoContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
  },
  refundableContainer: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  nonRefundableContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  refundableTitle: {
    color: '#10b981',
  },
  nonRefundableTitle: {
    color: '#ef4444',
  },
  refundDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  refundAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  refundAmountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  refundAmountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  warningContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
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
    color: 'white',
  },
  // Payment Modal styles
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  paymentModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  paymentModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentModalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  confirmPaymentButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmPaymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 2,
    fontWeight: '500',
  },
});

export default StudentCalendarPage;
