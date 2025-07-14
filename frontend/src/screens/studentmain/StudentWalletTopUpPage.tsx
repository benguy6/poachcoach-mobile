import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Update the path below to the actual location of MainAppStackParamList
import { MainAppStackParamList } from '../../App'; // Adjust the path as needed

type WalletTopUpProps = {
  navigation: NativeStackNavigationProp<MainAppStackParamList, 'StudentWalletTopUp'>;
};

const StudentWalletTopUpPage = ({ navigation }: WalletTopUpProps) => {
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleConfirmPayment = () => {
    Alert.alert(
      "Payment Confirmation", 
      "Have you completed the PayNow transfer?", 
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, I've Paid",
          onPress: () => {
            Alert.alert("Payment Successful", "Your wallet has been topped up!", [
              {
                text: "OK",
                onPress: () => navigation.navigate('StudentTabs'),
              },
            ]);
          },
        },
      ]
    );
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

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Top Up with PayNow</Text>
        <Text style={styles.subtitle}>
          Scan the QR code below to top up your wallet instantly
        </Text>

        <View style={styles.qrContainer}>
          <Image
            source={{ 
              uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/PayNow_logo.svg/512px-PayNow_logo.svg.png' 
            }}
            style={styles.qrImage}
            resizeMode="contain"
          />
          <Text style={styles.instructions}>
            1. Open your bank app{'\n'}
            2. Scan the PayNow QR code above{'\n'}
            3. Enter your desired top-up amount{'\n'}
            4. Complete the transfer{'\n'}
            5. Tap "I've Paid" below
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={handleConfirmPayment}
          >
            <Text style={styles.confirmButtonText}>I've Paid</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleBackPress}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentWalletTopUpPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    padding: 20,
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
  qrContainer: {
    backgroundColor: '#f9fafb',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
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
});