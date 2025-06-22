// CancelClassModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface CancelClassModalProps {
  visible: boolean;
  reason: string;
  onChangeReason: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  sessionDateTime: string; // ISO string of the session start time
}

const CancelClassModal: React.FC<CancelClassModalProps> = ({
  visible,
  reason,
  onChangeReason,
  onCancel,
  onConfirm,
  sessionDateTime,
}) => {
  const now = new Date();
  const sessionTime = new Date(sessionDateTime);
  const timeDiffHours = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isEligibleForRefund = timeDiffHours >= 24;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Cancel Class</Text>
          <Text style={styles.modalSubtitle}>
            {isEligibleForRefund
              ? 'You are eligible for a full refund.'
              : 'Less than 24 hours remaining — refund is up to coach discretion.'}
          </Text>

          <Text style={styles.modalLabel}>Reason for cancellation</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="E.g. Feeling unwell"
            value={reason}
            onChangeText={onChangeReason}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={onConfirm}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CancelClassModal;
