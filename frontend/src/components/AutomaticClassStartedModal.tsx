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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import ClassFeedbackModal from './ClassFeedbackModal';

interface Student {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  gender: string;
  phone?: string;
  paymentStatus: string;
  attendanceStatus: 'present' | 'absent';
}

interface AutomaticClassStartedModalProps {
  visible: boolean;
  onClose: () => void;
  onEndClass: () => void;
  session: any;
  students: Student[];
}

const AutomaticClassStartedModal: React.FC<AutomaticClassStartedModalProps> = ({
  visible,
  onClose,
  onEndClass,
  session,
  students,
}) => {
  console.log('🔍 AutomaticClassStartedModal render:', {
    visible,
    hasSession: !!session,
    studentsCount: students?.length || 0,
    studentsData: students,
    sessionData: session,
    studentsType: typeof students,
    studentsIsArray: Array.isArray(students)
  });
  const [attendance, setAttendance] = useState<{[key: string]: 'present' | 'absent'}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEndingClass, setIsEndingClass] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Initialize attendance when modal opens
  useEffect(() => {
    if (visible && students?.length > 0) {
      const initialAttendance: {[key: string]: 'present' | 'absent'} = {};
      students.forEach(student => {
        initialAttendance[student.id] = 'absent'; // Default to absent until coach marks present
      });
      setAttendance(initialAttendance);
    }
  }, [visible, students]);

  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent') => {
    // Update local state immediately for UI feedback
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));

    // Send to backend
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error('No token available');

      // Create attendance object with just this student
      const attendanceData = {
        [studentId]: status
      };

      // Send to backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/coach/class-management/submit-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.unique_id || session.id,
          attendance: attendanceData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update attendance');
      }

      console.log(`Attendance updated for student ${studentId}: ${status}`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      // Revert the local state if backend update failed
      setAttendance(prev => ({
        ...prev,
        [studentId]: status === 'present' ? 'absent' : 'present'
      }));
    }
  };

  const handleSubmitAttendance = async () => {
    if (!session) return;

    setIsSubmitting(true);
    try {
      // Get current session token
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error('No token available');

      // Submit attendance to backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://172.20.10.3:3000'}/api/coach/class-management/submit-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.unique_id || session.id,
          attendance: attendance,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }

      Alert.alert('Success', 'Attendance submitted successfully!');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      Alert.alert('Error', 'Failed to submit attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndClass = async () => {
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      setIsEndingClass(true);
      
      // Here you would typically send the feedback to the backend
      console.log('Submitting feedback:', feedback);
      
      // End the class after feedback is submitted
      await onEndClass();
      setShowFeedbackModal(false);
      onClose();
    } catch (error) {
      console.error('Error ending class:', error);
      Alert.alert('Error', 'Failed to end class. Please try again.');
    } finally {
      setIsEndingClass(false);
    }
  };

  const getAttendanceColor = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAttendanceIcon = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'late': return 'time';
      case 'absent': return 'close-circle';
      default: return 'help-circle';
    }
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
            <Text style={styles.headerTitle}>Class Started</Text>
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

          {/* Attendance Section */}
          <View style={styles.attendanceSectionContainer}>
            <Text style={styles.sectionTitle}>Take Attendance</Text>
            <Text style={styles.sectionSubtitle}>
              Mark attendance for {students?.length || 0} student{(students?.length || 0) !== 1 ? 's' : ''}
            </Text>

                        <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
              <Text style={{ color: 'red', fontSize: 14, marginBottom: 10 }}>
                Debug: Students count = {students?.length || 0}
              </Text>
              {students?.map((student, index) => {
                console.log('🔍 Rendering student:', student);
                return (
                  <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentCardHeader}>
                    <View style={styles.studentProfileRow}>
                      <Image
                        source={{ 
                          uri: student.profilePicture || 'https://via.placeholder.com/100'
                        }}
                        style={styles.studentAvatar}
                        onError={() => {
                          console.log('Failed to load profile picture for student:', student.name);
                        }}
                      />
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentEmail}>{student.email}</Text>
                        {student.phone && (
                          <Text style={styles.studentPhone}>{student.phone}</Text>
                        )}
                        {student.gender && (
                          <Text style={styles.studentGender}>{student.gender}</Text>
                        )}
                      </View>
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
                  
                  <View style={styles.attendanceSection}>
                    <Text style={styles.attendanceLabel}>Attendance:</Text>
                    <View style={styles.attendanceButtons}>
                      <TouchableOpacity
                        style={[
                          styles.attendanceBtn,
                          attendance[student.id] === 'present' 
                            ? { backgroundColor: '#10b981' } 
                            : { backgroundColor: '#6b7280' }
                        ]}
                        onPress={() => handleAttendanceChange(student.id, 'present')}
                      >
                        <Ionicons name="checkmark-circle" size={12} color="white" />
                        <Text style={styles.attendanceText}>Present</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.attendanceBtn,
                          attendance[student.id] === 'absent' 
                            ? { backgroundColor: '#ef4444' } 
                            : { backgroundColor: '#6b7280' }
                        ]}
                        onPress={() => handleAttendanceChange(student.id, 'absent')}
                      >
                        <Ionicons name="close-circle" size={12} color="white" />
                        <Text style={styles.attendanceText}>Absent</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.endClassBtn, isEndingClass && styles.disabledButton]}
              onPress={handleEndClass}
              disabled={isEndingClass}
            >
              {isEndingClass ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={20} color="white" />
                  <Text style={styles.endClassBtnText}>End Class</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Class Feedback Modal */}
      <ClassFeedbackModal
        visible={showFeedbackModal}
        activeClass={{
          id: session?.unique_id || session?.id,
          sport: session?.sport,
          students: students?.map(student => ({
            ...student,
            profilePicture: student.profilePicture || null,
            gender: student.gender || 'Not specified'
          })) || []
        }}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitFeedback={handleFeedbackSubmit}
      />
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
  attendanceSectionContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  studentsList: {
    maxHeight: 300,
  },
  studentRow: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  studentInfo: {
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  studentActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  attendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  selectedAttendance: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  attendanceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 20,
    gap: 10,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  endClassBtn: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  endClassBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Enhanced student card styles
  studentCard: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  studentProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  studentPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  studentGender: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: '#10b981',
  },
  unpaidBadge: {
    backgroundColor: '#f59e0b',
  },
  paidStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  unpaidStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  attendanceSection: {
    marginTop: 10,
  },
  attendanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },

});

export default AutomaticClassStartedModal; 