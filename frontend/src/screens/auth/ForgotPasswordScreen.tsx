import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { checkEmailExists } from '../../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const navigation = useNavigation<any>(); 

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address.');
      return;
    }

    setIsLoading(true);

    try {
      await checkEmailExists(email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://ushreyas.github.io/reset-password/',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setShowCustomAlert(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'User not found.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password?</Text>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={handleResetPassword}
        style={[styles.button, isLoading && { opacity: 0.7 }]}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Processing...' : 'Send Reset Email'}
        </Text>
      </TouchableOpacity>

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Email Sent</Text>
            <Text style={styles.modalMessage}>
              We've sent a password reset link to your email. For the{' '}
              <Text style={styles.orangeText}>access token</Text> field in the next page, just copy the{' '}
              <Text style={styles.orangeText}>access token</Text> presented upon opening the{' '}
              <Text style={styles.orangeText}>password reset link</Text>
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowCustomAlert(false);
                navigation.navigate('ResetPassword');
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 20,
  },
  orangeText: {
    color: 'orange',
  },
  modalButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
