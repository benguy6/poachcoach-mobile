import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudentClassFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  session: any;
  totalClassesAttended: number;
  onSubmitFeedback: (rating: number, feedback: string) => Promise<void>;
}

const StudentClassFeedbackModal: React.FC<StudentClassFeedbackModalProps> = ({
  visible,
  onClose,
  session,
  totalClassesAttended,
  onSubmitFeedback,
}) => {
  const [coachRating, setCoachRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (coachRating === 0) {
      Alert.alert('Rating Required', 'Please rate your coach before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitFeedback(coachRating, feedbackText);
      Alert.alert('Success', 'Thank you for your feedback!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Feedback',
      'Are you sure you want to skip providing feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onClose }
      ]
    );
  };

  const renderStarRating = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingTitle}>Rate Your Coach</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onRatingChange(star)}
              style={styles.starButton}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={32}
                color={star <= rating ? '#fbbf24' : '#d1d5db'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingText}>{rating}/5</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Completion Message */}
          <View style={styles.completionSection}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#10b981" />
            </View>
            <Text style={styles.completionTitle}>Class Completed!</Text>
            <Text style={styles.completionSubtitle}>
              Great job! You've completed another class.
            </Text>
          </View>

          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>{session?.session_name || session?.sport}</Text>
            <Text style={styles.sessionDetails}>
              {session?.date} • {(() => {
                let startTime = session?.start_time;
                let endTime = session?.end_time;
                
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
              📍 {session?.address || session?.location_name || session?.location || 'N/A'}
            </Text>
          </View>

          {/* Total Classes */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsCard}>
              <Ionicons name="calendar" size={24} color="#f97316" />
              <Text style={styles.statsNumber}>{totalClassesAttended}</Text>
              <Text style={styles.statsLabel}>Total Classes Attended</Text>
            </View>
          </View>

          {/* Star Rating */}
          {renderStarRating(coachRating, setCoachRating)}

          {/* Optional Feedback */}
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackTitle}>Additional Feedback (Optional)</Text>
            <Text style={styles.feedbackSubtitle}>
              Share your thoughts about the class experience
            </Text>
            <ScrollView style={styles.feedbackTextInput}>
              <TextInput
                style={styles.textInput}
                placeholder="How was your experience? Any suggestions for improvement?"
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                coachRating === 0 && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={coachRating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  completionSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  completionIcon: {
    marginBottom: 15,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsSection: {
    marginBottom: 25,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ea580c',
    marginVertical: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
  },
  ratingContainer: {
    marginBottom: 25,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starButton: {
    padding: 8,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  feedbackSection: {
    marginBottom: 25,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  feedbackTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    backgroundColor: '#f9fafb',
  },
  textInput: {
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#f97316',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StudentClassFeedbackModal; 