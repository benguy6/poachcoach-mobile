import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentTabs } from '../../constants/studentTabs';

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

const StudentWalletPage = ({ navigation }: StudentWalletPageProps) => {
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

  const transactions = [
    {
      id: 1,
      title: 'Payment to Sarah Johnson',
      date: 'June 15, 2025',
      amount: '-$45.00',
      type: 'payment'
    },
    {
      id: 2,
      title: 'Wallet Top-up',
      date: 'June 14, 2025',
      amount: '+$100.00',
      type: 'topup'
    },
    {
      id: 3,
      title: 'Payment to Coach Shreyas',
      date: 'June 12, 2025',
      amount: '-$40.00',
      type: 'payment'
    },
    {
      id: 4,
      title: 'Refund - Cancelled Session',
      date: 'June 10, 2025',
      amount: '+$50.00',
      type: 'refund'
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

  const handleTopUp = () => {
    navigation.getParent()?.navigate('StudentWalletTopUp');
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
          <Text style={styles.balanceAmount}>$125.50</Text>
          <TouchableOpacity 
            style={styles.addMoneyButton} 
            onPress={handleTopUp} // FIXED: Use the correct handler
          >
            <Text style={styles.addMoneyButtonText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payments</Text>
          <View style={styles.sectionContent}>
            {pendingPayments.map(payment => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{payment.dueDate}</Text>
                </View>
                <Text style={styles.pendingAmount}>
                  {payment.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add BottomNavigation here */}
      <BottomNavigation
        activeTab="StudentWallet"
        onTabPress={handleTabPress}
        tabs={studentTabs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    paddingTop: 64,
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addMoneyButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addMoneyButtonText: {
    color: '#f97316',
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
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    color: '#6b7280',
    marginTop: 2,
  },
  pendingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StudentWalletPage;
