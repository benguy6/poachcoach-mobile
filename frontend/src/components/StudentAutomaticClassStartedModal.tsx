import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

interface Student {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  gender: string;
  phone?: string;
  paymentStatus: string;
}

interface StudentAutomaticClassStartedModalProps {
  visible: boolean;
  onClose: () => void;
  session: any;
  students: Student[];
  currentStudentId: string;
}

const StudentAutomaticClassStartedModal: React.FC<StudentAutomaticClassStartedModalProps> = ({
  visible,
  onClose,
  session,
  students,
  currentStudentId,
}) => {
  console.log('🔍 StudentAutomaticClassStartedModal render:', {
    visible,
    hasSession: !!session,
    studentsCount: students?.length || 0,
    currentStudentId
  });
  
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late' | 'pending'>('pending');
  const [lateMinutes, setLateMinutes] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [coachRating, setCoachRating] = useState(0);
  const [classRating, setClassRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Check attendance status periodically
  useEffect(() => {
    if (visible && session) {
      const checkAttendanceStatus = async () => {
        try {
          const { data: { session: authSession } } = await supabase.auth.getSession();
          const token = authSession?.access_token;
          if (!token) return;

          const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/student/attendance-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId: session.unique_id || session.id,
              studentId: currentStudentId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setAttendanceStatus(data.status);
            if (data.status === 'late') {
              setLateMinutes(data.lateMinutes || 0);
            }
          }
        } catch (error) {
          console.error('Error checking attendance status:', error);
        }
      };

      // Check immediately
      checkAttendanceStatus();

      // Check every 30 seconds
      const interval = setInterval(checkAttendanceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [visible, session, currentStudentId]);

  const handleGiveFeedback = () => {
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async () => {
    if (coachRating === 0 || classRating === 0) {
      Alert.alert('Required', 'Please provide ratings for both coach and class.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error('No token available');

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/student/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.unique_id || session.id,
          coachRating,
          classRating,
          feedback: feedbackText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      Alert.alert('Success', 'Feedback submitted successfully!');
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'pending': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'absent': return 'close-circle';
      case 'late': return 'time';
      case 'pending': return 'help-circle';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return `Late (+${lateMinutes}m)`;
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const renderStarRating = (rating: number, onRatingChange: (rating: number) => void, title: string) => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingTitle}>{title}</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onRatingChange(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={24}
                color={star <= rating ? '#fbbf24' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>{rating}/5</Text>
      </View>
    );
  };

  if (!session) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Active Class</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{session.sport}</Text>
            <Text style={styles.sessionDetails}>
              {session.date} • {session.start_time} - {session.end_time}
            </Text>
            <Text style={styles.sessionLocation}>
              📍 {session.address || session.location_name || 'N/A'}
            </Text>
          </View>

          {/* Attendance Status */}
          <View style={styles.attendanceStatusContainer}>
            <Text style={styles.sectionTitle}>Your Attendance Status</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(attendanceStatus) }
            ]}>
              <Ionicons 
                name={getStatusIcon(attendanceStatus) as any} 
                size={20} 
                color="white" 
              />
              <Text style={styles.statusText}>{getStatusText(attendanceStatus)}</Text>
            </View>
            {attendanceStatus === 'pending' && (
              <Text style={styles.statusNote}>
                Waiting for coach to mark attendance...
              </Text>
            )}
            {attendanceStatus === 'late' && (
              <Text style={styles.statusNote}>
                You arrived {lateMinutes} minutes late
              </Text>
            )}
          </View>

          {/* Class Participants */}
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Class Participants</Text>
            <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
              {students?.map((student) => (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentProfileRow}>
                    <Image
                      source={{ 
                        uri: student.profilePicture || 'https://via.placeholder.com/100'
                      }}
                      style={styles.studentAvatar}
                    />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                    <View style={[
                      styles.paymentStatusBadge,
                      student.paymentStatus === 'paid' ? styles.paidBadge : styles.unpaidBadge
                    ]}>
                      <Text style={[
                        student.paymentStatus === 'paid' ? styles.paidStatusText : styles.unpaidStatusText
                      ]}>
                        {student.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.feedbackBtn}
              onPress={handleGiveFeedback}
            >
              <Ionicons name="star" size={20} color="white" />
              <Text style={styles.feedbackBtnText}>Give Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>Class Feedback</Text>
              <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.feedbackContent}>
              {renderStarRating(coachRating, setCoachRating, 'Rate Your Coach')}
              {renderStarRating(classRating, setClassRating, 'Rate This Class')}
              
              <View style={styles.feedbackInputContainer}>
                <Text style={styles.feedbackLabel}>Additional Comments (Optional)</Text>
                <ScrollView style={styles.feedbackTextInput}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Share your thoughts about the class..."
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    numberOfLines={4}
                  />
                </ScrollView>
              </View>
            </ScrollView>

            <View style={styles.feedbackActions}>
              <TouchableOpacity
                style={[styles.submitFeedbackBtn, isSubmittingFeedback && styles.disabledButton]}
                onPress={handleFeedbackSubmit}
                disabled={isSubmittingFeedback}
              >
                {isSubmittingFeedback ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" />
                    <Text style={styles.submitFeedbackText}>Submit Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  sessionInfo: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  sessionDetails: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 5,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendanceStatusContainer: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusNote: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  participantsSection: {
    flex: 1,
  },
  studentsList: {
    maxHeight: 200,
  },
  studentCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  studentProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  paymentStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadge: {
    backgroundColor: '#10b981',
  },
  unpaidBadge: {
    backgroundColor: '#f59e0b',
  },
  paidStatusText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  unpaidStatusText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 20,
  },
  feedbackBtn: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  feedbackBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Feedback Modal Styles
  feedbackContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  feedbackContent: {
    flex: 1,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  feedbackInputContainer: {
    marginTop: 20,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  feedbackTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  textInput: {
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  feedbackActions: {
    marginTop: 20,
  },
  submitFeedbackBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  submitFeedbackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default StudentAutomaticClassStartedModal; 