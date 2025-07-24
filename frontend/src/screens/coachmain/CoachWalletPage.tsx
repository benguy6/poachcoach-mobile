import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Modal,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../../services/auth';
import { getCoachProfile, getCoachWallet, withdrawToPayNow, getCoachTransactions } from '../../services/api';
import PoachCoinIcon from '../../components/PoachCoinIcon';

interface Transaction {
  id: string;
  type: 'Session' | 'Withdrawal' | 'TopUp';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  paynowReference?: string;
}

const CoachWalletPage = () => {
  const [activeTab, setActiveTab] = useState('wallet');
  const [balance, setBalance] = useState(1200.50);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'Session', amount: 80, date: '2025-06-18', description: 'Yoga Class', status: 'completed' },
    { id: '2', type: 'Withdrawal', amount: -200, date: '2025-06-15', description: 'PayNow Transfer', status: 'completed', paynowReference: 'PN123456789' },
    { id: '3', type: 'Session', amount: 100, date: '2025-06-12', description: 'HIIT Class', status: 'completed' },
  ]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [coachPhone, setCoachPhone] = useState('');

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Load coach profile for phone number
        const profile = await getCoachProfile(token);
        setCoachPhone(profile.user?.number || '');
        
        // Load wallet data
        const walletData = await getCoachWallet(token);
        setBalance(walletData.balance || 0);
        
        // Load transactions
        const transactionsData = await getCoachTransactions(token);
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load coach data:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to load coach data';
      
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

    if (!coachPhone) {
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
      const withdrawalResponse = await withdrawToPayNow(token, amount);
      
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <View style={styles.balanceContainer}>
          <PoachCoinIcon size={32} />
          <Text style={styles.balanceValue}>{balance.toFixed(2)} PC</Text>
        </View>
        <TouchableOpacity 
          style={styles.withdrawButton}
          onPress={() => setShowWithdrawalModal(true)}
        >
          <Ionicons name="cash-outline" size={20} color="#fff" />
          <Text style={styles.withdrawButtonText}>Withdraw via PayNow</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {transactions.map(tx => (
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
        ))}
      </ScrollView>

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
              <Text style={styles.phoneNumber}>{coachPhone || 'Phone number not available'}</Text>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#111827', 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#f97316', 
    marginBottom: 16 
  },
  balanceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  balanceLabel: { 
    color: '#f97316', 
    fontSize: 16, 
    marginBottom: 4 
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  balanceValue: { 
    color: '#f97316', 
    fontSize: 32, 
    fontWeight: 'bold',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  withdrawButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#f97316', 
    marginBottom: 12 
  },
  transactionsList: { 
    flex: 1 
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  transactionType: { 
    fontWeight: '600', 
    color: '#f97316', 
    fontSize: 15 
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  transactionDesc: { 
    color: '#9ca3af', 
    fontSize: 13,
    marginBottom: 4
  },
  paynowReference: {
    color: '#f97316',
    fontSize: 12,
    fontStyle: 'italic'
  },
  transactionRight: { 
    alignItems: 'flex-end' 
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  transactionAmount: { 
    fontWeight: 'bold', 
    fontSize: 16,
  },
  transactionDate: { 
    color: '#6b7280', 
    fontSize: 12 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f97316'
  },
  closeButton: {
    padding: 4
  },
  modalBody: {
    padding: 20
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
    marginBottom: 8
  },
  modalBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  modalBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#374151',
    color: '#ffffff'
  },
  phoneNumber: {
    fontSize: 16,
    color: '#f97316',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f97316',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#f97316',
    lineHeight: 20
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f97316',
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  cancelButtonText: {
    color: '#f97316',
    fontWeight: '500'
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af'
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  modalConversionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  modalConversionLabel: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 4,
    fontWeight: '500',
  },
  modalConversionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  modalConversionRate: {
    fontSize: 10,
    color: '#92400e',
    fontStyle: 'italic',
  },
});

export default CoachWalletPage;