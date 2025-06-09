import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const userName = 'Vansh';
const today = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
});

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type StudentHomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

function StudentHomeScreen({ navigation }: StudentHomeScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}></View>
        <TouchableOpacity>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.profilePic}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>Hello, {userName}!</Text>
        <Text style={styles.date}>{today}</Text>

        <View style={styles.confirmCard}>
          <View style={styles.confirmRow}>
            <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
            <Text style={styles.confirmText}>Your class is confirmed!</Text>
          </View>
          <Text style={styles.className}>Yoga Basics</Text>
          <Text style={styles.coach}>With Sarah Johnson</Text>
          <Text style={styles.detail}>10:00 AM - 11:00 AM</Text>
          <Text style={styles.detail}>Wellness Studio, 123 Main St</Text>
          <Text style={styles.detail}>15 people attending</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

type DummyScreenProps = { label: string };

function DummyScreen({ label }: DummyScreenProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{label} Page</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function StudentDashboardWithTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#000',
          height: 90,
          paddingBottom: 10,
          paddingTop: 10,
          position: 'absolute',
        },
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        children={() => <DummyScreen label="Schedule" />}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Booking"
        children={() => <DummyScreen label="Booking" />}
        options={{
          tabBarButton: (props) => {
            // Remove props with value null to satisfy TouchableOpacityProps
            const filteredProps = Object.fromEntries(
              Object.entries(props).filter(([_, v]) => v !== null)
            );
            return (
              <TouchableOpacity style={styles.centerFab} {...filteredProps}>
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tab.Screen
        name="Chat"
        children={() => <DummyScreen label="Chat" />}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubble" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        children={() => <DummyScreen label="Payments" />}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="credit-card" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FF6A00' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 30,
    backgroundColor: '#fff4',
    borderRadius: 8,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  date: { color: '#fff', marginBottom: 16 },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  confirmText: { color: '#2ecc71', fontWeight: 'bold' },
  className: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  coach: { fontStyle: 'italic', marginBottom: 4 },
  detail: { fontSize: 14, color: '#333', marginBottom: 4 },
  viewAll: { color: '#3B82F6', marginTop: 10, fontWeight: '500' },
  centerFab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF6A00',
    justifyContent: 'center',
    alignItems: 'center',
    top: -35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    alignSelf: 'center',
  },
});
