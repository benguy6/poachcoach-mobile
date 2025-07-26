import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Student {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  paymentStatus: string;
}

interface ClassStartedModalProps {
  visible: boolean;
  classInfo: {
    sport: string;
    coachName: string;
    startTime: string;
    endTime: string;
    location: string;
    date: string;
  } | null;
  students?: Student[];
  onClose: () => void;
  onJoinClass: () => void;
  onRecordAttendance?: () => void;
}

const ClassStartedModal: React.FC<ClassStartedModalProps> = ({
  visible,
  classInfo,
  students = [],
  onClose,
  onJoinClass,
  onRecordAttendance,
}) => {
  const [attendance, setAttendance] = useState<{[key: string]: 'present' | 'absent' | 'late'}>({});
  
  if (!classInfo) return null;

  // Initialize attendance when modal opens
  React.useEffect(() => {
    if (visible && students.length > 0) {
      const initialAttendance: {[key: string]: 'present' | 'absent' | 'late'} = {};
      students.forEach(student => {
        initialAttendance[student.id] = 'present'; // Default to present
      });
      setAttendance(initialAttendance);
    }
  }, [visible, students]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const getAttendanceColor = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present': return '#10b981';
      case 'late': return '#f59e0b';
      case 'absent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Class Started!</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
          </View>

          {/* Class Info */}
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{classInfo.sport} Class</Text>
            <Text style={styles.coachName}>with {classInfo.coachName}</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
              <Text style={styles.infoText}>{formatDate(classInfo.date)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#9ca3af" />
              <Text style={styles.infoText}>{classInfo.startTime} - {classInfo.endTime}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#9ca3af" />
              <Text style={styles.infoText}>{classInfo.location}</Text>
            </View>
          </View>

          {/* Students Section */}
          {students && students.length > 0 && (
            <View style={styles.studentsSection}>
              <Text style={styles.studentsTitle}>Students ({students.length})</Text>
              <View style={styles.studentsList}>
                {students.map((student, index) => (
                  <View key={student.id} style={styles.studentRow}>
                    <Image
                      source={{
                        uri: student.profilePicture || 'https://randomuser.me/api/portraits/lego/1.jpg',
                      }}
                      style={styles.studentAvatar}
                    />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                    <View style={styles.studentActions}>
                      <View style={[
                        styles.paymentStatus,
                        { backgroundColor: student.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }
                      ]}>
                        <Text style={styles.paymentStatusText}>
                          {student.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </Text>
                      </View>
                      
                      {/* Attendance Buttons */}
                      <View style={styles.attendanceButtons}>
                        <TouchableOpacity
                          style={[
                            styles.attendanceBtn,
                            { backgroundColor: getAttendanceColor('present') },
                            attendance[student.id] === 'present' && styles.selectedAttendance
                          ]}
                          onPress={() => handleAttendanceChange(student.id, 'present')}
                        >
                          <Ionicons name="checkmark-circle" size={12} color="white" />
                          <Text style={styles.attendanceText}>Present</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.attendanceBtn,
                            { backgroundColor: getAttendanceColor('late') },
                            attendance[student.id] === 'late' && styles.selectedAttendance
                          ]}
                          onPress={() => handleAttendanceChange(student.id, 'late')}
                        >
                          <Ionicons name="time" size={12} color="white" />
                          <Text style={styles.attendanceText}>Late</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.attendanceBtn,
                            { backgroundColor: getAttendanceColor('absent') },
                            attendance[student.id] === 'absent' && styles.selectedAttendance
                          ]}
                          onPress={() => handleAttendanceChange(student.id, 'absent')}
                        >
                          <Ionicons name="close-circle" size={12} color="white" />
                          <Text style={styles.attendanceText}>Absent</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.joinButton} onPress={onJoinClass}>
              <Ionicons name="play-circle" size={24} color="#ffffff" />
              <Text style={styles.joinButtonText}>Join Class</Text>
            </TouchableOpacity>
            
            {onRecordAttendance && (
              <TouchableOpacity 
                style={styles.attendanceButton} 
                onPress={() => {
                  console.log('Submitting attendance:', attendance);
                  onRecordAttendance();
                }}
              >
                <Ionicons name="clipboard" size={24} color="#ffffff" />
                <Text style={styles.attendanceButtonText}>Record Attendance</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  classInfo: {
    width: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  classTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  coachName: {
    color: '#f97316',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#d1d5db',
    fontSize: 16,
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  joinButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
  },
  dismissButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Students section styles
  studentsSection: {
    width: '100%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  studentsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  studentsList: {
    gap: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  studentEmail: {
    color: '#9ca3af',
    fontSize: 14,
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  attendanceButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Student actions and attendance styles
  studentActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 4,
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
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default ClassStartedModal; 