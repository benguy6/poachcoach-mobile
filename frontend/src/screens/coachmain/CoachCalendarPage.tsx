import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, Plus, MessageSquare, Trash2 } from 'lucide-react-native';
import { coachTabs } from '../../constants/coachTabs';
import BottomNavigation from '../../components/BottomNavigation';

const { width } = Dimensions.get('window');

type ClassItem = {
  title: string;
  time: string;
  students: number;
  location?: string;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type CoachCalendarPageProps = {
  navigation: any;
};

const CoachCalendarPage = ({ navigation }: CoachCalendarPageProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [selectedDate, setSelectedDate] = useState(20);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [classToCancel, setClassToCancel] = useState<ClassItem | null>(null);
  const [expandedClassIndex, setExpandedClassIndex] = useState<number | null>(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const classSchedule: { [key: number]: ClassItem[] } = {
    16: [{ title: "Yoga Basics", time: "10:00 AM", students: 15 }],
    18: [{ title: "Baseball Training", time: "2:00 PM", students: 8 }],
    20: [
      { title: "Yoga Basics", time: "10:00 AM", students: 15, location: "Wellness Studio" },
      { title: "Personal Training", time: "3:00 PM", students: 1, location: "Gym A" }
    ],
    22: [{ title: "Group Fitness", time: "6:00 PM", students: 12 }],
    25: [{ title: "Swimming Lessons", time: "9:00 AM", students: 6 }]
  };

  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  const renderCalendar = () => {
    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarEmptyCell} />);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasClasses = classSchedule[day];
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = day === selectedDate;
      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => setSelectedDate(day)}
          style={[
            styles.calendarDay,
            isSelected
              ? styles.calendarDaySelected
              : isToday
              ? styles.calendarDayToday
              : hasClasses
              ? styles.calendarDayHasClass
              : styles.calendarDayDefault,
          ]}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected
                ? { color: '#fff' }
                : isToday
                ? { color: '#fb923c' }
                : hasClasses
                ? { color: '#fff' }
                : { color: '#9ca3af' },
            ]}
          >
            {day}
          </Text>
          {hasClasses && (
            <View
              style={[
                styles.calendarDot,
                isSelected ? { backgroundColor: '#fff' } : { backgroundColor: '#fb923c' },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    }
    // Fill the rest of the grid with empty cells if needed
    while (days.length % 7 !== 0) {
      days.push(<View key={`empty-end-${days.length}`} style={styles.calendarEmptyCell} />);
    }
    // Chunk into rows of 7
    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(
        <View key={`row-${i / 7}`} style={{ flexDirection: 'row' }}>
          {days.slice(i, i + 7)}
        </View>
      );
    }
    return rows;
  };

  const handleCancelClass = (classItem: ClassItem) => {
    setClassToCancel(classItem);
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    // Handle cancellation logic here
    setShowCancelModal(false);
    setClassToCancel(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>

      {/* Calendar */}
      <ScrollView style={styles.scroll}>
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              style={styles.monthNavBtn}
            >
              <ChevronLeft size={20} color="#9ca3af" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              style={styles.monthNavBtn}
            >
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.daysOfWeekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.dayOfWeekText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>{renderCalendar()}</View>
        </View>

        {/* Classes for Selected Date */}
        <View style={styles.classesCard}>
          <Text style={styles.classesTitle}>
            Classes on {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
          </Text>
          {classSchedule[selectedDate] ? (
            <View>
              {classSchedule[selectedDate].map((classItem, index) => {
                const isExpanded = expandedClassIndex === index;
                // Placeholder students array
                const studentsList = Array.from({ length: classItem.students }, (_, i) => `Student ${i + 1}`);
                return (
                  <View key={index} style={styles.classItemCard}>
                    {/* Always show title */}
                    <Text style={styles.classItemTitle}>{classItem.title}</Text>
                    {/* Minimal info row */}
                    <View style={styles.classItemInfoRow}>
                      <Clock size={16} color="#9ca3af" />
                      <Text style={styles.classItemInfoText}>{classItem.time}</Text>
                    </View>
                    {classItem.location && (
                      <View style={styles.classItemInfoRow}>
                        <MapPin size={16} color="#fb923c" />
                        <Text style={styles.classItemInfoText}>{classItem.location}</Text>
                      </View>
                    )}
                    <View style={styles.classItemInfoRow}>
                      <Users size={16} color="#9ca3af" />
                      <Text style={styles.classItemInfoText}>Coach John Doe</Text>
                    </View>
                    {/* View Details Button */}
                    <View style={styles.classItemBtnRow}>
                      <TouchableOpacity
                        style={[styles.classActionBtn, styles.classActionBtnOrange]}
                        onPress={() => setExpandedClassIndex(isExpanded ? null : index)}
                      >
                        <Text style={styles.classActionBtnText}>{isExpanded ? 'Hide Details' : 'View Details'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.classActionBtn, styles.classActionBtnRed]}
                        onPress={() => handleCancelClass(classItem)}
                      >
                        <Text style={styles.classActionBtnText}>Cancel Class</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Expanded details */}
                    {isExpanded && (
                      <View style={{ marginTop: 10 }}>
                        <View style={styles.classItemInfoRow}>
                          <Text style={styles.classItemInfoText}>
                            Session Type: {classItem.students > 1 ? 'Group Session' : 'Individual Session'}
                          </Text>
                        </View>
                        <View style={styles.classItemInfoRow}>
                          <Text style={styles.classItemInfoText}>
                            Number of Students: {classItem.students}
                          </Text>
                        </View>
                        <View style={{ marginTop: 8 }}>
                          <Text style={[styles.classItemInfoText, { fontWeight: 'bold', marginBottom: 4 }]}>Students Attending:</Text>
                          {studentsList.map((student, idx) => (
                            <Text key={idx} style={styles.classItemInfoText}>{student}</Text>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noClassView}>
              <Calendar size={48} color="#9ca3af" style={{ marginBottom: 8 }} />
              <Text style={styles.noClassText}>No classes scheduled for this date</Text>
              <TouchableOpacity style={styles.addClassBtn}>
                <Text style={styles.addClassBtnText}>Add Class</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Class?</Text>
            <Text style={styles.modalDesc}>
              Are you sure you want to cancel "{classToCancel?.title}"? All enrolled students will be notified.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                style={[styles.modalBtn, styles.modalBtnGray]}
              >
                <Text style={styles.modalBtnText}>Keep Class</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancel}
                style={[styles.modalBtn, styles.modalBtnRed]}
              >
                <Text style={styles.modalBtnText}>Cancel Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="CoachCalendar"
        onTabPress={(tabId) => navigation.navigate(tabId)}
        tabs={coachTabs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#27272a',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  calendarCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
  },
  monthLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dayOfWeekText: {
    color: '#9ca3af',
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
    position: 'relative',
  },
  calendarDaySelected: {
    backgroundColor: '#fb923c',
  },
  calendarDayToday: {
    backgroundColor: '#fed7aa',
  },
  calendarDayHasClass: {
    backgroundColor: '#374151',
  },
  calendarDayDefault: {},
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
    left: '50%',
    marginLeft: -3,
  },
  classesCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  classesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  classItemCard: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#18181b',
  },
  classItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  classItemTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelIconBtn: {
    padding: 4,
    borderRadius: 6,
  },
  classItemInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  classItemInfoText: {
    color: '#9ca3af',
    fontSize: 13,
    marginLeft: 6,
  },
  classItemBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  classActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classActionBtnOrange: {
    backgroundColor: '#fb923c',
  },
  classActionBtnGray: {
    backgroundColor: '#374151',
  },
  classActionBtnRed: {
    backgroundColor: '#ef4444',
  },
  classActionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noClassView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noClassText: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 8,
  },
  addClassBtn: {
    backgroundColor: '#fb923c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  addClassBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDesc: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnGray: {
    backgroundColor: '#374151',
  },
  modalBtnRed: {
    backgroundColor: '#ef4444',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#27272a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  navBtn: {
    padding: 10,
    borderRadius: 24,
  },
  navBtnActive: {
    backgroundColor: '#fb923c',
  },
  navBtnMain: {
    backgroundColor: '#fb923c',
    padding: 14,
    borderRadius: 32,
    marginHorizontal: 8,
    marginTop: -24,
    zIndex: 2,
  },
  navIconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: '#9ca3af',
    borderRadius: 12,
  },
});

export default CoachCalendarPage;