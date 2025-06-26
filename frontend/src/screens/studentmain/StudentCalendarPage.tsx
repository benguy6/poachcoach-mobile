import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
// @ts-ignore
import Ionicons from 'react-native-vector-icons/Ionicons';
import { studentTabs } from '../../constants/studentTabs';
import BottomNavigation from '../../components/BottomNavigation';

const { width } = Dimensions.get('window');

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Dummy class schedule for demonstration
const classSchedule: Record<number, Array<{
  title: string;
  time: string;
  instructor: string;
  location: string;
  attendees: number;
}>> = {
  16: [
    {
      title: 'Yoga Basics',
      time: '10:00 AM',
      instructor: 'Coach Smith',
      location: 'Room 101',
      attendees: 8,
    },
    {
      title: 'Basketball Drills',
      time: '2:00 PM',
      instructor: 'Coach Lee',
      location: 'Court 2',
      attendees: 12,
    },
  ],
  18: [
    {
      title: 'Swimming',
      time: '9:00 AM',
      instructor: 'Coach Kim',
      location: 'Pool',
      attendees: 5,
    },
  ],
};

// Fake all upcoming classes for demo
const fakeAllUpcomingClasses = [
  {
    title: 'Yoga Basics',
    time: '10:00 AM, June 16, 2025',
    instructor: 'Coach Smith',
    location: 'Room 101',
    attendees: 8,
  },
  {
    title: 'Basketball Drills',
    time: '2:00 PM, June 16, 2025',
    instructor: 'Coach Lee',
    location: 'Court 2',
    attendees: 12,
  },
  {
    title: 'Swimming',
    time: '9:00 AM, June 18, 2025',
    instructor: 'Coach Kim',
    location: 'Pool',
    attendees: 5,
  },
];

const StudentCalendarPage = ({ navigation }: { navigation: any }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1));
  const [selectedDate, setSelectedDate] = useState(16);
  const [showAllClassesModal, setShowAllClassesModal] = useState(false);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarEmptyCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const hasClasses = classSchedule[day];
      const isToday = currentDate.getMonth() === new Date().getMonth() && day === new Date().getDate();
      const isSelected = day === selectedDate;

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => setSelectedDate(day)}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
            isToday && styles.calendarDayToday,
            hasClasses && styles.calendarDayHasClass
          ]}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected ? { color: '#fff' } : hasClasses ? { color: '#ea580c' } : {}
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const handleCancel = (title: string) => {
    Alert.alert(
      'Cancel Class',
      `Are you sure you want to cancel "${title}"?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => {/* Add cancel logic here */} },
      ]
    );
  };

  const handleAddClass = () => {
    // Navigate to booking or class creation page
    navigation.navigate('StudentBooking');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Calendar UI */}
        <View style={styles.calendarCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            >
              <Ionicons name="chevron-back" size={20} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            >
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.daysOfWeekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* Class Cards */}
        <View style={styles.classesSection}>
          <View style={styles.classesTitleRow}>
            <Text style={styles.classesTitle}>
              Classes on June {selectedDate}, 2025
            </Text>
            <TouchableOpacity
              style={styles.viewAllSmallButton}
              onPress={() => setShowAllClassesModal(true)}
            >
              <Text style={styles.viewAllSmallButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
          {classSchedule[selectedDate] ? (
            <>
              {classSchedule[selectedDate].map((item, index) => (
                <View key={index} style={styles.classCard}>
                  <Text style={styles.classTitle}>{item.title}</Text>
                  <Text style={styles.classTime}>{item.time} with {item.instructor}</Text>
                  <Text style={styles.classDetails}>Location: {item.location}</Text>
                  <Text style={styles.classDetails}>{item.attendees} people attending</Text>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(item.title)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noClassView}>
              <Text style={styles.noClassText}>No classes scheduled.</Text>
              <TouchableOpacity style={styles.addClassButton} onPress={handleAddClass}>
                <Text style={styles.addClassButtonText}>Add Class</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for all upcoming classes */}
      <Modal
        visible={showAllClassesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllClassesModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            width: '85%',
            maxHeight: '70%',
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>
              All Upcoming Classes
            </Text>
            <ScrollView>
              {fakeAllUpcomingClasses.length === 0 ? (
                <Text>No upcoming classes found.</Text>
              ) : (
                fakeAllUpcomingClasses.map((item, idx) => (
                  <View key={idx} style={{
                    marginBottom: 16,
                    borderBottomWidth: idx !== fakeAllUpcomingClasses.length - 1 ? 1 : 0,
                    borderBottomColor: '#eee',
                    paddingBottom: 8,
                  }}>
                    <Text style={{ fontWeight: '600', color: '#f97316' }}>{item.title}</Text>
                    <Text style={{ color: '#6b7280' }}>{item.time} with {item.instructor}</Text>
                    <Text style={{ color: '#6b7280' }}>Location: {item.location}</Text>
                    <Text style={{ color: '#6b7280' }}>{item.attendees} people attending</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: '#f97316',
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setShowAllClassesModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavigation
        activeTab="StudentCalendar"
        onTabPress={(tabId) => navigation.navigate(tabId)}
        tabs={studentTabs}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  calendarCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayOfWeekText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    width: (width - 64) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarEmptyCell: {
    width: (width - 64) / 7,
    height: 40,
  },
  calendarDay: {
    width: (width - 64) / 7,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDaySelected: {
    backgroundColor: '#f97316',
  },
  calendarDayToday: {
    backgroundColor: '#fed7aa',
  },
  calendarDayHasClass: {
    backgroundColor: '#fef3c7',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  classesSection: {
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  classesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  classesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginVertical: 16,
  },
  classCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f97316',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  classDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  noClassText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f97316',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noClassView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  addClassButton: {
    marginTop: 10,
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addClassButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  viewAllSmallButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#f97316',
    borderRadius: 16,
  },
  viewAllSmallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default StudentCalendarPage;
