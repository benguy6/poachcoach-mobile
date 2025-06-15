import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CalendarPage = ({ navigation }: { navigation: any }) => {
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  const upcomingClasses = [
    {
      id: 1,
      title: 'Yoga Basics',
      instructor: 'Sarah Johnson',
      date: '2025-06-17',
      time: '10:00 AM - 11:00 AM',
      location: 'Wellness Studio, 123 Main Street',
      attendees: 15,
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Pilates Core',
      instructor: 'Michael Chen',
      date: '2025-06-18',
      time: '2:00 PM - 3:00 PM',
      location: 'Fitness Center',
      attendees: 8,
      status: 'pending'
    }
  ];

  const getDaysInMonth = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      days.push(i);
    }
    return days;
  };

interface UpcomingClass {
    id: number;
    title: string;
    instructor: string;
    date: string;
    time: string;
    location: string;
    attendees: number;
    status: string;
}

const renderCalendarDay = (day: number): React.ReactElement => {
    const isToday = day === 16;
    const hasClass = [17, 18].includes(day);
    
    return (
        <TouchableOpacity
            key={day}
            style={[
                styles.calendarDay,
                isToday && styles.todayStyle,
                hasClass && styles.classDayStyle,
            ]}
        >
            <Text
                style={[
                    styles.calendarDayText,
                    isToday && styles.todayText,
                    hasClass && styles.classDayText,
                ]}
            >
                {day}
            </Text>
        </TouchableOpacity>
    );
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Mini Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>June 2025</Text>
          
          {/* Week Days */}
          <View style={styles.weekDaysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} style={styles.weekDay}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getDaysInMonth().map(renderCalendarDay)}
          </View>
        </View>

        {/* Upcoming Classes */}
        <View style={styles.classesContainer}>
          <Text style={styles.sectionTitle}>Upcoming Classes</Text>
          
          {upcomingClasses.map(classItem => (
            <View key={classItem.id} style={styles.classCard}>
              <TouchableOpacity
                style={styles.classHeader}
                onPress={() => setExpandedClass(
                  expandedClass === classItem.id ? null : classItem.id
                )}
              >
                <View style={styles.classInfo}>
                  <Text style={styles.classTitle}>{classItem.title}</Text>
                  <Text style={styles.classInstructor}>with {classItem.instructor}</Text>
                  <Text style={styles.classTime}>{classItem.time}</Text>
                </View>
                <Ionicons 
                  name={expandedClass === classItem.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {expandedClass === classItem.id && (
                <View style={styles.classDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={16} color="#9ca3af" />
                    <Text style={styles.detailText}>{classItem.location}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="people" size={16} color="#9ca3af" />
                    <Text style={styles.detailText}>{classItem.attendees} people attending</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={16} color="#9ca3af" />
                    <Text style={styles.detailText}>Status: {classItem.status}</Text>
                  </View>
                  
                  <View style={styles.classActions}>
                    <TouchableOpacity style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  headerSpacer: {
    width: 24,
  },
  calendarContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginBottom: 16,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  todayStyle: {
    backgroundColor: '#f97316',
  },
  classDayStyle: {
    backgroundColor: '#fed7aa',
  },
  calendarDayText: {
    fontSize: 14,
    color: 'black',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  classDayText: {
    color: '#ea580c',
    fontWeight: '600',
  },
  classesContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginBottom: 16,
  },
  classCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  classInfo: {
    flex: 1,
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  classInstructor: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  classTime: {
    fontSize: 14,
    color: '#f97316',
    marginTop: 4,
    fontWeight: '500',
  },
  classDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  classActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CalendarPage;