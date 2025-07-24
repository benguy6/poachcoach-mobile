import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

interface NotificationOptions {
  [key: string]: boolean;
}

interface SettingsPageProps {
  onBack: () => void;
  notifications: NotificationOptions;
  setNotifications: (
    value: NotificationOptions | ((prev: NotificationOptions) => NotificationOptions)
  ) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
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
            // Clear stored credentials
            await SecureStore.deleteItemAsync("accessToken");
            await SecureStore.deleteItemAsync("userId");
            await SecureStore.deleteItemAsync("userEmail");
            await SecureStore.deleteItemAsync("userRole");
            // Navigate to Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
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
    
    // Here you would implement the actual password change logic
    Alert.alert('Success', 'Password changed successfully!');
    setShowChangePasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const renderSettingsContent = () => (
    <View style={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <Section title="Account">
        <Row title="Change Password" icon={<Lock size={18} />} onPress={() => setShowChangePasswordModal(true)} />
        <Row title="Payment Methods" icon={<CreditCard size={18} />} onPress={() => setShowPaymentModal(true)} />
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
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.container}
        data={[{ key: 'settings' }]}
        renderItem={() => renderSettingsContent()}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
      />

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
              <X size={24} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formSection}>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowChangePasswordModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleChangePassword}
            >
              <Text style={styles.saveButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <X size={24} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Manage Payment</Text>
              <Text style={styles.paragraph}>Payment methods management coming soon...</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.saveButtonText}>Close</Text>
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
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <X size={24} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Select Language</Text>
              <Text style={styles.paragraph}>Language selection coming soon...</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.saveButtonText}>Close</Text>
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
            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
              <X size={24} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Need Help?</Text>
              <Text style={styles.paragraph}>Help center content coming soon...</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.saveButtonText}>Close</Text>
            </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <X size={24} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Privacy Policy</Text>
              <Text style={styles.paragraph}>Privacy policy content coming soon...</Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.saveButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
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
      <Text style={[styles.rowText, isDestructive && { color: 'red' }]}>{title}</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#111' },
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
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { fontSize: 14, color: '#111' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rightText: { color: '#999', fontSize: 12 },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 20,
    backgroundColor: '#F97316',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    padding: 20,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  paragraph: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F0F2F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 28,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 28,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SettingsPage;
