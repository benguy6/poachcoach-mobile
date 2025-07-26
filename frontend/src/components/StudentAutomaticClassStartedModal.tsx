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
              sessionId: session.session_id || session.unique_id || session.id,
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



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#fef3c7'; // Light orange background
      case 'pending': return '#fef3c7'; // Light orange background
      default: return '#fef3c7'; // Light orange background
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'absent': return 'close-circle';
      case 'late': return 'time';
      case 'pending': return 'time';
      default: return 'time';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return `Late (+${lateMinutes}m)`;
      case 'pending': return 'Late';
      default: return 'Late';
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
            <Text style={styles.headerTitle}>Active Class</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{session.session_name || session.sport}</Text>
            <Text style={styles.sessionDetails}>
              {session.date} • {(() => {
                let startTime = session.start_time;
                let endTime = session.end_time;
                
                // Handle datetime strings (extract time part for display)
                if (startTime && startTime.includes('T')) {
                  startTime = startTime.split('T')[1].split(':').slice(0, 2).join(':');
                }
                if (endTime && endTime.includes('T')) {
                  endTime = endTime.split('T')[1].split(':').slice(0, 2).join(':');
                }
                
                return `${startTime} - ${endTime}`;
              })()}
            </Text>
            <Text style={styles.sessionLocation}>
              📍 {session.address || session.location_name || session.location || 'N/A'}
            </Text>
          </View>

          {/* Attendance Status */}
          <View style={styles.attendanceStatusContainer}>
            <Text style={styles.sectionTitle}>Your Attendance Status</Text>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: getStatusColor(attendanceStatus),
                borderColor: (attendanceStatus === 'pending' || attendanceStatus === 'late') ? '#ea580c' : 'transparent',
                borderWidth: (attendanceStatus === 'pending' || attendanceStatus === 'late') ? 2 : 0
              }
            ]}>
              <Ionicons 
                name={getStatusIcon(attendanceStatus) as any} 
                size={20} 
                color={(attendanceStatus === 'pending' || attendanceStatus === 'late') ? '#ea580c' : 'white'} 
              />
              <Text style={[
                styles.statusText,
                { color: (attendanceStatus === 'pending' || attendanceStatus === 'late') ? '#ea580c' : 'white' }
              ]}>{getStatusText(attendanceStatus)}</Text>
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


        </View>
      </View>


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

  disabledButton: {
    opacity: 0.6,
  },
});

export default StudentAutomaticClassStartedModal; 