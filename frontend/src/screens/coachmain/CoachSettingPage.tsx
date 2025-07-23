// CoachSettingsPage.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Lock,
  CreditCard,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

interface NotificationOptions {
  [key: string]: boolean;
}

interface CoachSettingsPageProps {
  onBack: () => void;
  onEditProfile: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  notifications: NotificationOptions;
  setNotifications: (
    value: NotificationOptions | ((prev: NotificationOptions) => NotificationOptions)
  ) => void;
}

const CoachSettingsPage: React.FC<CoachSettingsPageProps> = ({
  onBack,
  onEditProfile,
  darkMode,
  setDarkMode,
  notifications,
  setNotifications,
}) => {
  const navigation = useNavigation<any>();

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('userId');
    await SecureStore.deleteItemAsync('userEmail');
    await SecureStore.deleteItemAsync('userRole');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <Section title="Account">
        <Row title="Edit Profile" icon={<User size={18} />} onPress={onEditProfile} />
        <Row title="Change Password" icon={<Lock size={18} />} onPress={() => {}} />
        <Row title="Payment Info" icon={<CreditCard size={18} />} onPress={() => {}} />
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
        <ToggleRow
          title="Dark Mode"
          icon={<Moon size={18} />}
          value={darkMode}
          onValueChange={() => setDarkMode(!darkMode)}
        />
        <Row title="Language" icon={<Globe size={18} />} rightText="English" onPress={() => {}} />
      </Section>

      <Section title="Support">
        <Row title="Help Center" icon={<HelpCircle size={18} />} onPress={() => {}} />
        <Row title="Privacy Policy" icon={<Shield size={18} />} onPress={() => {}} />
        <Row
          title="Sign Out"
          icon={<LogOut size={18} />}
          onPress={handleSignOut}
          isDestructive
        />
      </Section>
    </ScrollView>
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
});

export default CoachSettingsPage;