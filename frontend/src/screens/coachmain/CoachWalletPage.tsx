import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const CoachWalletPage = () => {
  const [activeTab, setActiveTab] = useState('wallet');

  // Example wallet data
  const balance = 1200.50;
  const transactions = [
    { id: 1, type: 'Session', amount: 80, date: '2025-06-18', description: 'Yoga Class' },
    { id: 2, type: 'Withdrawal', amount: -200, date: '2025-06-15', description: 'Bank Transfer' },
    { id: 3, type: 'Session', amount: 100, date: '2025-06-12', description: 'HIIT Class' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <ScrollView style={styles.transactionsList}>
        {transactions.map(tx => (
          <View key={tx.id} style={styles.transactionItem}>
            <View>
              <Text style={styles.transactionType}>{tx.type}</Text>
              <Text style={styles.transactionDesc}>{tx.description}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                { color: tx.amount > 0 ? '#22c55e' : '#ef4444' }
              ]}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount)}
              </Text>
              <Text style={styles.transactionDate}>{tx.date}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#fb923c', marginBottom: 16 },
  balanceCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { color: '#b45309', fontSize: 16, marginBottom: 4 },
  balanceValue: { color: '#b45309', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  transactionsList: { flex: 1 },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  transactionType: { fontWeight: '600', color: '#111827', fontSize: 15 },
  transactionDesc: { color: '#6b7280', fontSize: 13 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontWeight: 'bold', fontSize: 16 },
  transactionDate: { color: '#9ca3af', fontSize: 12 },
});

export default CoachWalletPage;