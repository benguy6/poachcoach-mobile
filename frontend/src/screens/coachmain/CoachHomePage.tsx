import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCoachDashboard } from '../../services/api';
import { supabase } from '../../services/supabase';

import type { StackNavigationProp } from '@react-navigation/stack';
import CoachProfilePage from './CoachProfilePage';

type CoachHomePageProps = {
  navigation: StackNavigationProp<any>;
};

const CoachHomePage = ({ navigation }: CoachHomePageProps) => {
  const [notifications] = useState(2);
  const [coach, setCoach] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle profile picture change
  const handleProfilePicChange = (newUrl: string) => {
    setCoach((prev: any) => ({ ...prev, profilePicture: newUrl }));
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      try {
        const data = await getCoachDashboard(token);
        setCoach(data.coach);
        setSessions(data.confirmedSessions);
      } catch (err) {
        console.error('Failed to fetch coach dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('CoachSettings')}>
            <Ionicons name="settings-outline" size={28} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationIcon} onPress={() => navigation.navigate('CoachNotifications')}>
            <Ionicons name="notifications-outline" size={24} color="#f97316" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachProfile', { onProfilePicChange: handleProfilePicChange })}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          >
            <Image
              source={{ uri: coach?.profilePicture || 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.profileImage}
            />
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingText}>Hello, {coach?.name || 'Coach'}!</Text>
              <Text style={styles.subGreetingText}>Ready to inspire your students?</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fed7aa" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Upcoming Classes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Classes</Text>
          {loading ? (
            <Text style={{ color: '#fff' }}>Loading...</Text>
          ) : !sessions || sessions.length === 0 ? (
            <Text style={{ color: '#fff' }}>No confirmed sessions.</Text>
          ) : (
            sessions.map((session, idx) => (
              <View key={session.id || idx} style={{ marginBottom: 20 }}>
                <View style={styles.confirmBanner}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text style={styles.confirmText}>Class Confirmed</Text>
                </View>
                <Text style={styles.className}>{session.class_type || 'Session'}</Text>
                <Text style={styles.classSub}>{session.students_attending || 0} students enrolled</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#9ca3af" />
                  <Text style={styles.infoText}>{session.start_time} - {session.end_time}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#9ca3af" />
                  <Text style={styles.infoText}>{session.location_name || 'N/A'}</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.orangeBtn}>
                    <Text style={styles.btnText}>Start Class</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.redBtn}>
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Messages (dummy for now) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Messages</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CoachChat')}>
              <Text style={styles.orangeText}>View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.chatRow}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/women/5.jpg' }}
              style={styles.chatAvatar}
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>Sarah Miller</Text>
                <Text style={styles.chatTime}>1h ago</Text>
              </View>
              <Text style={styles.chatMessage}>Can we reschedule tomorrow's class?</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatRow}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/6.jpg' }}
              style={styles.chatAvatar}
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>David Brown</Text>
                <Text style={styles.chatTime}>2h ago</Text>
              </View>
              <Text style={styles.chatMessage}>Looking forward to our next training session</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  notificationIcon: { position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  greetingTextContainer: {},
  greetingText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subGreetingText: { color: '#fcd34d', fontSize: 14 },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532d',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  confirmText: { color: '#22c55e', marginLeft: 8 },
  className: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  classSub: { color: '#d1d5db', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { color: '#9ca3af', fontSize: 13 },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  orangeBtn: {
    backgroundColor: '#fb923c',
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  redBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orangeText: { color: '#fb923c', fontWeight: '600' },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
  },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  chatName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  chatTime: { color: '#9ca3af', fontSize: 12 },
  chatMessage: { color: '#d1d5db', fontSize: 13, marginTop: 2 },
});

export default CoachHomePage;