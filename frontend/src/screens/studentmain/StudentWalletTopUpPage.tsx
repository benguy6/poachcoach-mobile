import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getToken } from '../../services/auth';
import { topUpStudentWallet } from '../../services/api';
import CONFIG from '../../constants/config';
import PoachCoinIcon from '../../components/PoachCoinIcon';
// Update the path below to the actual location of MainAppStackParamList
import { MainAppStackParamList } from '../../App'; // Adjust the path as needed

type WalletTopUpProps = {
  navigation: NativeStackNavigationProp<MainAppStackParamList, 'StudentWalletTopUp'>;
};

const StudentWalletTopUpPage = ({ navigation }: WalletTopUpProps) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleTopUp = async () => {
    const topUpAmount = parseFloat(amount);
    
    if (!topUpAmount || topUpAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      // For now, we'll use a mock payment method ID
      // In a real implementation, you'd integrate with Stripe React Native SDK
      const mockPaymentMethodId = 'pm_mock_payment_method';
      
      const response = await topUpStudentWallet(token, topUpAmount, mockPaymentMethodId);
      
      Alert.alert(
        'Top-up Successful', 
        `$${topUpAmount.toFixed(2)} SGD has been converted to ${(topUpAmount * 5).toFixed(2)} PC and added to your wallet!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('StudentTabs'),
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'There was an error processing your top-up. Please try again.';
      Alert.alert('Top-up Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContent}>
            <Text style={styles.title}>Top Up Your Wallet</Text>
            <Text style={styles.subtitle}>
              Enter the amount you want to add to your wallet
            </Text>

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount (SGD)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              
              {/* Conversion Display */}
              {amount && parseFloat(amount) > 0 && (
                <View style={styles.conversionContainer}>
                  <Text style={styles.conversionLabel}>You will receive:</Text>
                  <View style={styles.conversionAmount}>
                    <PoachCoinIcon size={24} />
                    <Text style={styles.conversionText}>
                      {(parseFloat(amount) * 5).toFixed(2)} PC
                    </Text>
                  </View>
                  <Text style={styles.conversionRate}>Rate: 1 SGD = 5 PC</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (!amount || parseFloat(amount) <= 0) && styles.confirmButtonDisabled
            ]} 
            onPress={handleTopUp}
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Top Up Wallet</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleBackPress}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default StudentWalletTopUpPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#f97316',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#f97316',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  amountContainer: {
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    paddingTop: 20,
  },
  confirmButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 16,
  },
  conversionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  conversionLabel: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 8,
    fontWeight: '500',
  },
  conversionAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  conversionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
  },
  conversionRate: {
    fontSize: 12,
    color: '#92400e',
    fontStyle: 'italic',
  },
});