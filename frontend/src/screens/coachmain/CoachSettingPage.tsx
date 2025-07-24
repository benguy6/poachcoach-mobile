// CoachSettingsPage.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Lock,
  CreditCard,
  Bell,
  Globe,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface NotificationOptions {
  [key: string]: boolean;
}

interface CoachSettingsPageProps {
  onBack: () => void;
  notifications: NotificationOptions;
  setNotifications: (
    value: NotificationOptions | ((prev: NotificationOptions) => NotificationOptions)
  ) => void;
}

const CoachSettingsPage: React.FC<CoachSettingsPageProps> = ({
  onBack,
  notifications,
  setNotifications,
}) => {
  const navigation = useNavigation<any>();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Form states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('userId');
            await SecureStore.deleteItemAsync('userEmail');
            await SecureStore.deleteItemAsync('userRole');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    // Here you would typically make an API call to change the password
    Alert.alert('Success', 'Password changed successfully');
    setShowChangePasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Account">
          <Row title="Change Password" icon={<Lock size={18} />} onPress={() => setShowChangePasswordModal(true)} />
          <Row title="Payment Info" icon={<CreditCard size={18} />} onPress={() => setShowPaymentModal(true)} />
        </Section>

        <Section title="Notifications">
          {Object.entries(notifications).map(([key, value]) => (
            <ToggleRow
              key={key}
              title={key.replace(/([A-Z])/g, ' $1')}
              icon={<Bell size={18} />}
              value={value}
              onValueChange={() =>
                setNotifications((prev) => ({ ...prev, [key]: !value }))
              }
            />
          ))}
        </Section>

        <Section title="Preferences">
          <Row title="Language" icon={<Globe size={18} />} rightText="English" onPress={() => setShowLanguageModal(true)} />
        </Section>

        <Section title="Support">
          <Row title="Help Center" icon={<HelpCircle size={18} />} onPress={() => setShowHelpModal(true)} />
          <Row title="Privacy Policy" icon={<Shield size={18} />} onPress={() => setShowPrivacyModal(true)} />
          <Row
            title="Sign Out"
            icon={<LogOut size={18} />}
            onPress={handleSignOut}
            isDestructive
          />
        </Section>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => setShowChangePasswordModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Enter new password"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              />
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword}>
              <Text style={styles.modalButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Info Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Information</Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.infoCard}>
              <CreditCard size={24} color="#3b82f6" />
              <Text style={styles.infoTitle}>Payment Methods</Text>
              <Text style={styles.infoText}>
                Manage your payment methods and billing information here.
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoSubtitle}>Current Payment Method</Text>
              <Text style={styles.infoText}>No payment method added</Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Language</Text>
            <TouchableOpacity
              onPress={() => setShowLanguageModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.languageOption}>
              <Text style={styles.languageText}>English</Text>
              <Text style={styles.languageCheck}>✓</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.languageOption}>
              <Text style={styles.languageText}>Spanish</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.languageOption}>
              <Text style={styles.languageText}>French</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.languageOption}>
              <Text style={styles.languageText}>German</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Help Center Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Help Center</Text>
            <TouchableOpacity
              onPress={() => setShowHelpModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>Frequently Asked Questions</Text>
              
              <TouchableOpacity style={styles.helpItem}>
                <Text style={styles.helpQuestion}>How do I create a session?</Text>
                <ChevronRight size={16} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.helpItem}>
                <Text style={styles.helpQuestion}>How do I manage my bookings?</Text>
                <ChevronRight size={16} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.helpItem}>
                <Text style={styles.helpQuestion}>How do I get paid?</Text>
                <ChevronRight size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.helpSection}>
              <Text style={styles.helpSectionTitle}>Contact Support</Text>
              
              <TouchableOpacity style={styles.contactItem}>
                <Mail size={16} color="#3b82f6" />
                <Text style={styles.contactText}>support@poachcoach.com</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactItem}>
                <Phone size={16} color="#3b82f6" />
                <Text style={styles.contactText}>+1 (555) 123-4567</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity
              onPress={() => setShowPrivacyModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.privacyText}>
              Last updated: January 2024{'\n\n'}
              
              <Text style={styles.privacySectionTitle}>1. Information We Collect</Text>
              We collect information you provide directly to us, such as when you create an account, book a session, or contact us for support.{'\n\n'}
              
              <Text style={styles.privacySectionTitle}>2. How We Use Your Information</Text>
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.{'\n\n'}
              
              <Text style={styles.privacySectionTitle}>3. Information Sharing</Text>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.{'\n\n'}
              
              <Text style={styles.privacySectionTitle}>4. Data Security</Text>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.{'\n\n'}
              
              <Text style={styles.privacySectionTitle}>5. Your Rights</Text>
              You have the right to access, update, or delete your personal information. You can also opt out of certain communications from us.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const Row = ({
  title,
  icon,
  onPress,
  rightText,
  isDestructive,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  rightText?: string;
  isDestructive?: boolean;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={[styles.rowText, isDestructive && { color: '#ef4444' }]}>{title}</Text>
    </View>
    <View style={styles.rowRight}>
      {rightText && <Text style={styles.rightText}>{rightText}</Text>}
      <ChevronRight size={18} color="#999" />
    </View>
  </TouchableOpacity>
);

const ToggleRow = ({
  title,
  icon,
  value,
  onValueChange,
}: {
  title: string;
  icon: React.ReactNode;
  value: boolean;
  onValueChange: () => void;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowText}>{title}</Text>
    </View>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 14,
    color: '#111',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightText: {
    color: '#999',
    fontSize: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 12,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageText: {
    fontSize: 16,
    color: '#111',
  },
  languageCheck: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  helpSection: {
    marginBottom: 24,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  helpQuestion: {
    fontSize: 16,
    color: '#111',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactText: {
    fontSize: 16,
    color: '#111',
    marginLeft: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  privacySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginTop: 16,
    marginBottom: 8,
  },
});

export default CoachSettingsPage;