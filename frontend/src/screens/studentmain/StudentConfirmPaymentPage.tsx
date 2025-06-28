import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

const StudentConfirmPaymentPage: React.FC<any> = ({ route, navigation }) => {
  const {
    coachName,
    sessionType,
    sessionDate: initialSessionDate,
    sessionTime: initialSessionTime,
    pricePerSession,
  } = route.params;

  const walletBalance = 100.0;
  const sessionsCount = sessionType === 'weekly' ? 4 : 1;
  const total = (pricePerSession * sessionsCount).toFixed(2);
  const taxes = (parseFloat(total) * 0.09).toFixed(2);
  const finalPrice = (parseFloat(total) + parseFloat(taxes)).toFixed(2);

  const mockDates = ['19/6/2025', '20/6/2025', '21/6/2025'];
  const mockTimes = ['9:00 AM', '10:30 AM', '2:00 PM', '4:30 PM'];

  const [selectedDate, setSelectedDate] = useState(initialSessionDate || mockDates[0]);
  const [selectedTime, setSelectedTime] = useState(initialSessionTime || mockTimes[0]);

  const handlePayment = () => {
    if (walletBalance < parseFloat(finalPrice)) {
      Alert.alert("Insufficient Balance", "You do not have enough in your PoachWallet to complete this booking.");
      return;
    }

    setTimeout(() => {
      Alert.alert("Payment Successful", `You've booked ${sessionsCount} session(s) with ${coachName}!`);
      const completedBooking = {
        coachName,
        sessionType,
        sessionDate: selectedDate,
        sessionTime: selectedTime,
        pricePerSession,
        sessionsCount,
        totalAmount: finalPrice,
        bookingId: `BK${Date.now()}`,
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
      };
      navigation.navigate("MainApp", {
        screen: "StudentTabs",
        params: {
          screen: "StudentHome",
          params: { newBooking: completedBooking },
        },
      });
    }, 1000);
  };

  return (
    <View style={styles.screenWrapper}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <X size={24} color="#374151" />
      </TouchableOpacity>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Confirm and pay</Text>
          <Text style={styles.subText}>With Coach {coachName}</Text>

          <Text style={styles.subHeader}>Select Date</Text>
          <View style={styles.selectionRow}>
            {mockDates.map(date => (
              <TouchableOpacity
                key={date}
                style={[styles.optionButton, selectedDate === date && styles.selectedOption]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={selectedDate === date ? styles.selectedOptionText : styles.optionText}>{date}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subHeader}>Select Time</Text>
          <View style={styles.selectionRow}>
            {mockTimes.map(time => (
              <TouchableOpacity
                key={time}
                style={[styles.optionButton, selectedTime === time && styles.selectedOption]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={selectedTime === time ? styles.selectedOptionText : styles.optionText}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.detail}>{sessionType === 'weekly' ? '4 sessions package' : '1 session'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subHeader}>Payment method</Text>
          <View style={styles.paymentBox}>
            <Text style={styles.card}>🏦 PoachWallet Balance</Text>
            <Text style={styles.balance}>Available: <Text style={styles.green}>${walletBalance.toFixed(2)} SGD</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.subHeader}>Price details</Text>
          <Text style={styles.priceLine}>
            ${pricePerSession.toFixed(2)} SGD x {sessionsCount} {sessionsCount > 1 ? 'sessions' : 'session'} = ${total} SGD
          </Text>
          <Text style={styles.priceLine}>Taxes = ${taxes} SGD</Text>
          <Text style={styles.totalPrice}>Total: ${finalPrice} SGD</Text>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>Confirm and pay</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By paying, you agree to our Terms of Service and Cancellation Policy.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  container: { flex: 1 },
  section: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  subText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  detail: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  subHeader: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  paymentBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 10,
  },
  card: { fontSize: 14, color: '#374151', marginBottom: 4 },
  balance: { fontSize: 13, color: '#374151' },
  green: { color: '#10b981', fontWeight: '600' },
  priceLine: { fontSize: 14, marginBottom: 4, color: '#374151' },
  totalPrice: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  payButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  terms: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 10,
    padding: 6,
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
  },
  optionButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#f97316',
  },
  optionText: {
    color: '#374151',
    fontSize: 13,
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default StudentConfirmPaymentPage;