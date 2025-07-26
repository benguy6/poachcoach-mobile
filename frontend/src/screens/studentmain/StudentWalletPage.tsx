import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentTabs } from '../../constants/studentTabs';
import { getToken } from '../../services/auth';
import { getStudentWallet, getStudentTransactions, topUpStudentWallet, withdrawStudentToPayNow, getStudentProfile } from '../../services/api';
import PoachCoinIcon from '../../components/PoachCoinIcon';
import { Ionicons } from '@expo/vector-icons';

// Update this import path to match your actual App.tsx location
type MainAppStackParamList = {
  StudentTabs: undefined;
  StudentNotifications: undefined;
  StudentSettings: undefined;
  StudentChatDetail: { contact?: any; messages?: any[] };
  StudentWalletTopUp: undefined; // Make sure this matches your App.tsx
  StudentConfirmPayment: { amount?: number; paymentMethod?: string };
};

type StudentWalletPageProps = {
  navigation: NativeStackNavigationProp<MainAppStackParamList>;
};

interface Transaction {
  id: string;
  type: 'Session' | 'Withdrawal' | 'TopUp';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  paynowReference?: string;
}

const StudentWalletPage = ({ navigation }: StudentWalletPageProps) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentPhone, setStudentPhone] = useState('');
  
  // Modal states
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStudentData();
    }, [])
  );

  const loadStudentData = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Load student profile for phone number
        const profile = await getStudentProfile(token);
        setStudentPhone(profile.user?.number || '');
        
        // Load wallet balance
        const walletData = await getStudentWallet(token);
        setBalance(walletData.balance || 0);
        
        // Load transactions
        const transactionsData = await getStudentTransactions(token);
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to load student data';
      
      // Check if it's a network error or server error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Failed to fetch wallet information')) {
        Alert.alert(
          'Wallet Error',
          'Unable to load wallet information. Please try again later.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Something went wrong while loading your wallet. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const pcAmount = parseFloat(topUpAmount);
    
    if (!pcAmount || pcAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      // Convert PC to SGD for the API call (API expects SGD amount)
      const sgdAmount = pcAmount / 5;
      
      // For now, using a mock payment method ID - in a real app, this would come from Stripe
      const paymentMethodId = 'pm_mock_' + Date.now();
      
      // Call the top-up API with SGD amount
      const topUpResponse = await topUpStudentWallet(token, sgdAmount, paymentMethodId);
      
      // Update balance and transactions
      setBalance(prev => prev + pcAmount);
      
      // Add new transaction to the list
      const newTransaction: Transaction = {
        id: topUpResponse.transaction.id,
        type: 'TopUp',
        amount: pcAmount,
        date: new Date().toISOString().split('T')[0],
        description: 'Wallet Top-up',
        status: 'completed'
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      setShowTopUpModal(false);
      setTopUpAmount('');
      
      Alert.alert(
        'Top-up Successful', 
        `${pcAmount.toFixed(2)} PC has been added to your wallet.\n\nNew balance: ${(balance + pcAmount).toFixed(2)} PC`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'There was an error processing your top-up. Please try again.';
      Alert.alert('Top-up Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (amount > balance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance for this withdrawal.');
      return;
    }

    if (!studentPhone) {
      Alert.alert('Phone Number Required', 'Please ensure your phone number is registered for PayNow transfers.');
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      // Call the withdrawal API
      const withdrawalResponse = await withdrawStudentToPayNow(token, amount);
      
      // Update balance and transactions
      setBalance(prev => prev - amount);
      
      // Add new transaction to the list
      const newTransaction: Transaction = {
        id: withdrawalResponse.transaction.id,
        type: 'Withdrawal',
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        description: 'PayNow Transfer',
        status: 'pending',
        paynowReference: withdrawalResponse.paynowReference
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      
      Alert.alert(
        'Withdrawal Request Submitted', 
        `$${amount.toFixed(2)} withdrawal request has been submitted.\n\nPayNow Reference: ${withdrawalResponse.paynowReference}\n\nEstimated completion: 1-2 business days`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'There was an error processing your withdrawal. Please try again.';
      Alert.alert('Withdrawal Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount > 0 ? '+' : ''}${Math.abs(amount).toFixed(2)} PC`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const pendingPayments = [
    {
      id: 1,
      title: 'Cricket Session',
      dueDate: 'June 20, 2025',
      amount: '$40.00'
    },
    {
      id: 2,
      title: 'Yoga Class',
      dueDate: 'June 22, 2025',
      amount: '$45.00'
    }
  ];

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'payment':
        return '#16a34a';
      case 'topup':
      case 'refund':
        return '#2563eb';
      default:
        return '#16a34a';
    }
  };

  // Handler for tab press
  const handleTabPress = (tabId: string) => {
    navigation.navigate(tabId as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {loading ? (
            <ActivityIndicator size="large" color="white" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.balanceContainer}>
              <PoachCoinIcon size={32} color="white" backgroundColor="rgba(255,255,255,0.2)" />
              <Text style={styles.balanceAmount}>{balance.toFixed(2)} PC</Text>
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.addMoneyButton} 
              onPress={() => setShowTopUpModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addMoneyButtonText}>Add Money</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.withdrawButton} 
              onPress={() => setShowWithdrawalModal(true)}
            >
              <Ionicons name="arrow-down-circle" size={20} color="#fff" />
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.sectionContent}>
            {transactions.length === 0 ? (
              <Text style={styles.noTransactions}>No transactions yet</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionType}>{tx.type}</Text>
                      <View style={styles.statusContainer}>
                        <Ionicons 
                          name={getStatusIcon(tx.status) as any} 
                          size={16} 
                          color={getStatusColor(tx.status)} 
                        />
                        <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                          {tx.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.transactionDesc}>{tx.description}</Text>
                    {tx.paynowReference && (
                      <Text style={styles.paynowReference}>Ref: {tx.paynowReference}</Text>
                    )}
                  </View>
                  <View style={styles.transactionRight}>
                    <View style={styles.amountContainer}>
                      <PoachCoinIcon size={16} />
                      <Text style={[
                        styles.transactionAmount,
                        { color: tx.amount > 0 ? '#22c55e' : '#ef4444' }
                      ]}>
                        {formatAmount(tx.amount)}
                      </Text>
                    </View>
                    <Text style={styles.transactionDate}>{tx.date}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Top-up Modal */}
      <Modal 
        visible={showTopUpModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowTopUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <TouchableOpacity 
                onPress={() => setShowTopUpModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Current Balance</Text>
              <View style={styles.modalBalanceContainer}>
                <PoachCoinIcon size={24} />
                <Text style={styles.modalBalance}>{balance.toFixed(2)} PC</Text>
              </View>

              <Text style={styles.modalLabel}>Top-up Amount (PC)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount in PC"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
              />
              
              {/* Conversion Display */}
              {topUpAmount && parseFloat(topUpAmount) > 0 && (
                <View style={styles.modalConversionContainer}>
                  <Text style={styles.modalConversionLabel}>You will pay:</Text>
                  <Text style={styles.modalConversionText}>
                    ${(parseFloat(topUpAmount) / 5).toFixed(2)} SGD
                  </Text>
                  <Text style={styles.modalConversionRate}>Rate: 5 PC = 1 SGD</Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                  Funds will be added to your wallet immediately after payment confirmation.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowTopUpModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmButton,
                  (!topUpAmount || parseFloat(topUpAmount) <= 0) && 
                  styles.confirmButtonDisabled
                ]}
                onPress={handleTopUp}
                disabled={!topUpAmount || parseFloat(topUpAmount) <= 0 || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Top-up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal 
        visible={showWithdrawalModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => setShowWithdrawalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw via PayNow</Text>
              <TouchableOpacity 
                onPress={() => setShowWithdrawalModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Available Balance</Text>
              <View style={styles.modalBalanceContainer}>
                <PoachCoinIcon size={24} />
                <Text style={styles.modalBalance}>{balance.toFixed(2)} PC</Text>
              </View>

              <Text style={styles.modalLabel}>Withdrawal Amount (PC)</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount in PC"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={withdrawalAmount}
                onChangeText={setWithdrawalAmount}
              />
              
              {/* Conversion Display */}
              {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                <View style={styles.modalConversionContainer}>
                  <Text style={styles.modalConversionLabel}>You will receive:</Text>
                  <Text style={styles.modalConversionText}>
                    ${(parseFloat(withdrawalAmount) / 5).toFixed(2)} SGD
                  </Text>
                  <Text style={styles.modalConversionRate}>Rate: 5 PC = 1 SGD</Text>
                </View>
              )}

              <Text style={styles.modalLabel}>PayNow to Phone Number</Text>
              <Text style={styles.phoneNumber}>{studentPhone || 'Phone number not available'}</Text>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={styles.infoText}>
                  Funds will be transferred to your PayNow account within 1-2 business days.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowWithdrawalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmButton,
                  (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > balance) && 
                  styles.confirmButtonDisabled
                ]}
                onPress={handleWithdrawal}
                disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > balance || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add BottomNavigation here */}
      <BottomNavigation 
        tabs={studentTabs} 
        activeTab="StudentWallet" 
        onTabPress={handleTabPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingTop: 64,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#fed7aa',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addMoneyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#f97316',
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 14,
    color: '#f97316',
    marginTop: 2,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
  },
  transactionDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  paynowReference: {
    fontSize: 12,
    color: '#f97316',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  noTransactions: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  modalConversionContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  modalConversionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  modalConversionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  modalConversionRate: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#3b82f6',
    marginLeft: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f97316',
    marginTop: 12,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.7,
  },
});

export default StudentWalletPage;
