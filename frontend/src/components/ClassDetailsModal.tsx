import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Student {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  gender: string;
  paymentStatus: string;
}

interface ActiveClass {
  id: string;
  sessionId: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  postalCode: string;
  classType: string;
  pricePerSession: number;
  description: string;
  sessionStatus: string;
  maxStudents: number;
  studentsAttending: number;
  students: Student[];
}

interface ClassDetailsModalProps {
  visible: boolean;
  activeClass: ActiveClass | null;
  onClose: () => void;
  onEndClass: () => void;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({
  visible,
  activeClass,
  onClose,
  onEndClass,
}) => {
  const handleEndClass = () => {
    Alert.alert(
      'End Class',
      'Are you sure you want to end this class? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Class',
          style: 'destructive',
          onPress: onEndClass,
        },
      ]
    );
  };

  if (!activeClass) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#22c55e';
      case 'unpaid':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'unpaid':
        return 'Unpaid';
      default:
        return 'Unknown';
    }
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
          <Text style={styles.headerTitle}>Class Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Class Status Banner */}
          <View style={styles.statusBanner}>
            <Ionicons name="play-circle" size={24} color="#22c55e" />
            <Text style={styles.statusText}>Class in Progress</Text>
          </View>

          {/* Class Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Class Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="fitness" size={20} color="#f97316" />
                <Text style={styles.infoLabel}>Sport:</Text>
                <Text style={styles.infoValue}>{activeClass.sport}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={20} color="#f97316" />
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{formatDate(activeClass.date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={20} color="#f97316" />
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>
                  {activeClass.startTime} - {activeClass.endTime} ({activeClass.duration})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#f97316" />
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{activeClass.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="people" size={20} color="#f97316" />
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>
                  {activeClass.classType} Class ({activeClass.studentsAttending}/{activeClass.maxStudents} students)
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash" size={20} color="#f97316" />
                <Text style={styles.infoLabel}>Price:</Text>
                <Text style={styles.infoValue}>${activeClass.pricePerSession} per session</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {activeClass.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{activeClass.description}</Text>
              </View>
            </View>
          )}

          {/* Students */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Students ({activeClass.students?.length || 0})
            </Text>
            <View style={styles.studentsContainer}>
              {activeClass.students?.map((student, index) => (
                <View key={student.id} style={styles.studentCard}>
                  <Image
                    source={{
                      uri: student.profilePicture || 'https://randomuser.me/api/portraits/lego/1.jpg',
                    }}
                    style={styles.studentAvatar}
                  />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                    <View style={styles.paymentStatusContainer}>
                      <View
                        style={[
                          styles.paymentStatusDot,
                          { backgroundColor: getPaymentStatusColor(student.paymentStatus) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.paymentStatusText,
                          { color: getPaymentStatusColor(student.paymentStatus) },
                        ]}
                      >
                        {getPaymentStatusText(student.paymentStatus)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Spacer for bottom button */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* End Class Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.endClassButton} onPress={handleEndClass}>
            <Ionicons name="stop-circle" size={24} color="#ffffff" />
            <Text style={styles.endClassButtonText}>End Class</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065f46',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 60,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  descriptionCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  descriptionText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
  },
  studentsContainer: {
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginBottom: 4,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  endClassButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  endClassButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ClassDetailsModal; 