import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
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

interface StudentFeedback {
  studentId: string;
  feedback: string;
  rating?: number;
}

interface ClassFeedbackModalProps {
  visible: boolean;
  activeClass: {
    id: string;
    sport: string;
    students: Student[];
  } | null;
  onClose: () => void;
  onSubmitFeedback: (feedback: {
    generalFeedback: string;
    topicsCovered: string;
    studentProgress: string;
    nextSessionPlan: string;
    studentFeedbacks: StudentFeedback[];
  }) => void;
}

const ClassFeedbackModal: React.FC<ClassFeedbackModalProps> = ({
  visible,
  activeClass,
  onClose,
  onSubmitFeedback,
}) => {
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [studentProgress, setStudentProgress] = useState('');
  const [nextSessionPlan, setNextSessionPlan] = useState('');
  const [studentFeedbacks, setStudentFeedbacks] = useState<StudentFeedback[]>([]);
  const [showIndividualFeedback, setShowIndividualFeedback] = useState(false);

  const handleSubmit = () => {
    if (!generalFeedback.trim()) {
      Alert.alert('Required Field', 'Please provide general feedback about the class.');
      return;
    }

    const feedbackData = {
      generalFeedback: generalFeedback.trim(),
      topicsCovered: topicsCovered.trim(),
      studentProgress: studentProgress.trim(),
      nextSessionPlan: nextSessionPlan.trim(),
      studentFeedbacks: studentFeedbacks.filter(sf => sf.feedback.trim() !== ''),
    };

    onSubmitFeedback(feedbackData);
  };

  const handleStudentFeedbackChange = (studentId: string, feedback: string, rating?: number) => {
    setStudentFeedbacks(prev => {
      const existing = prev.find(sf => sf.studentId === studentId);
      if (existing) {
        return prev.map(sf =>
          sf.studentId === studentId ? { ...sf, feedback, rating } : sf
        );
      } else {
        return [...prev, { studentId, feedback, rating }];
      }
    });
  };

  const getStudentFeedback = (studentId: string) => {
    return studentFeedbacks.find(sf => sf.studentId === studentId) || { studentId, feedback: '', rating: undefined };
  };

  const renderStarRating = (studentId: string, currentRating?: number) => {
    const handleRating = (rating: number) => {
      handleStudentFeedbackChange(studentId, getStudentFeedback(studentId).feedback, rating);
    };

    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= (currentRating || 0) ? 'star' : 'star-outline'}
              size={20}
              color={star <= (currentRating || 0) ? '#fbbf24' : '#6b7280'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!activeClass) return null;

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
          <Text style={styles.headerTitle}>Class Feedback</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* General Feedback Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Class Feedback *</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>How did the class go overall?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the overall class experience, what went well, and any areas for improvement..."
                placeholderTextColor="#9ca3af"
                value={generalFeedback}
                onChangeText={setGeneralFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Topics Covered */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topics Covered</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>What topics or skills were covered today?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="List the main topics, drills, or skills that were taught in this session..."
                placeholderTextColor="#9ca3af"
                value={topicsCovered}
                onChangeText={setTopicsCovered}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Student Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Student Progress</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>How did the students perform overall?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the overall progress, engagement, and performance of the students..."
                placeholderTextColor="#9ca3af"
                value={studentProgress}
                onChangeText={setStudentProgress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Next Session Plan */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Session Plan</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>What's planned for the next session?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Outline what you plan to cover in the next class, any homework, or areas to focus on..."
                placeholderTextColor="#9ca3af"
                value={nextSessionPlan}
                onChangeText={setNextSessionPlan}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Individual Student Feedback Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setShowIndividualFeedback(!showIndividualFeedback)}
            >
              <Text style={styles.sectionTitle}>Individual Student Feedback</Text>
              <Ionicons
                name={showIndividualFeedback ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#f97316"
              />
            </TouchableOpacity>
            <Text style={styles.toggleDescription}>
              Provide personalized feedback for each student (optional)
            </Text>
          </View>

          {/* Individual Student Feedback */}
          {showIndividualFeedback && (
            <View style={styles.section}>
              {activeClass.students.map((student) => {
                const studentFeedback = getStudentFeedback(student.id);
                return (
                  <View key={student.id} style={styles.studentFeedbackCard}>
                    <View style={styles.studentHeader}>
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
                    </View>
                    
                    <View style={styles.ratingSection}>
                      <Text style={styles.ratingLabel}>Performance Rating:</Text>
                      {renderStarRating(student.id, studentFeedback.rating)}
                    </View>

                    <TextInput
                      style={styles.studentTextArea}
                      placeholder={`Provide personalized feedback for ${student.name}...`}
                      placeholderTextColor="#9ca3af"
                      value={studentFeedback.feedback}
                      onChangeText={(text) => handleStudentFeedbackChange(student.id, text, studentFeedback.rating)}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Spacer for bottom button */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleDescription: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
  },
  studentFeedbackCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  ratingSection: {
    marginBottom: 12,
  },
  ratingLabel: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    marginRight: 8,
  },
  studentTextArea: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 60,
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
  submitButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ClassFeedbackModal; 