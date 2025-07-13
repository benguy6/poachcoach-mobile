import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { CalendarList } from 'react-native-calendars';
import * as Location from 'expo-location';
import { createCoachSession } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Map,
} from 'lucide-react-native';
import { useMemo } from 'react';

const { width } = Dimensions.get('window');
const gridWidth = width - 64;

const sports = [
  'Yoga', 'Baseball', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Fitness Training', 'Martial Arts', 'Running', 'Cycling'
];

const timeSlots = [
  '07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45', '22:00'
];

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const locations = [
  'Wellness Studio, 123 Main Street',
  'Sports Complex, 456 Oak Avenue',
  'Community Center, 789 Pine Road',
  'Outdoor Park, 321 Elm Street'
];

const existingSessions = [
  { date: '2025-06-16', time: '10:00', title: 'Yoga Basics' },
  { date: '2025-06-16', time: '14:00', title: 'Basketball Drills' },
  { date: '2025-06-18', time: '09:00', title: 'Swimming' },
  { date: '2025-06-20', time: '10:00', title: 'Yoga Basics' },
  { date: '2025-06-20', time: '15:00', title: 'Personal Training' },
  { date: '2025-06-22', time: '18:00', title: 'Group Fitness' },
  { date: '2025-06-25', time: '09:00', title: 'Swimming Lessons' },
];

// Helper to check if a session exists on a given date
const hasSession = (dateStr: string) => {
  return existingSessions.some(s => s.date === dateStr);
};

// Get sessions for a specific date
const getSessionsForDate = (dateStr: string) => {
  return existingSessions.filter(s => s.date === dateStr);
};

// Render the calendar for the current month
const renderCurrentMonthCalendar = (selectedDay: string | null, setSelectedDay: (day: string | null) => void) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Helper to get days in month and first day
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ type: 'empty', key: `empty-${i}` });
  }
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ type: 'day', day, key: `day-${day}` });
  }
  // Add empty cells to complete the grid (always 6 rows)
  while (days.length < 42) {
    days.push({ type: 'empty', key: `empty-end-${days.length}` });
  }
  // Split into 6 rows of 7 cells
  const rows = [];
  for (let i = 0; i < 6; i++) {
    rows.push(days.slice(i * 7, (i + 1) * 7));
  }
  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={{ flexDirection: 'row' }}>
          {row.map(cell => {
            if (cell.type === 'empty') {
              return <View key={cell.key} style={styles.calendarEmptyCell} />;
            } else {
              const day = cell.day;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDay === dateStr;
              return (
                <TouchableOpacity
                  key={cell.key}
                  onPress={() => setSelectedDay(dateStr)}
                  style={[
                    styles.calendarDay,
                    isSelected && styles.calendarDaySelected,
                  ]}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[
                      styles.calendarDayText,
                      isSelected ? { color: '#fff' } : { color: '#9ca3af' }
                    ]}>
                      {day}
                    </Text>
                    {hasSession(dateStr) && (
                      <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#fb923c',
                        marginTop: 2,
                      }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }
          })}
        </View>
      ))}
    </View>
  );
};

const CoachCreateSessionPage = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(1);
  
  interface SessionData {
    sport: string;
    minAge: number;
    maxAge: number;
    startTime: string;
    endTime: string;
    recurringDays: string[];
    monthlyDates: string[];
    location: string;
    groupType: string;
    maxStudents: string;
    price: string;
    description: string;
    sessionType: string;
    numberOfWeeks?: string;
    startDate?: string;
  }

  const [sessionData, setSessionData] = useState<SessionData>({
    sport: '',
    minAge: 6,
    maxAge: 18,
    startTime: '',
    endTime: '',
    recurringDays: [],
    monthlyDates: [],
    location: '',
    groupType: '',
    maxStudents: '',
    price: '',
    description: '',
    sessionType: '',
    numberOfWeeks: '',
    startDate: ''
  });

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInlineCalendar, setShowInlineCalendar] = useState(false);
  const [clashError, setClashError] = useState<string | null>(null);
  // Remove calendarMonth state, renderStaticCalendar, and all calendar-related UI and logic
  const [recurringType, setRecurringType] = useState<string>('weekly');

  // Time slider states
  const [timeRange, setTimeRange] = useState([0, 1]);
  const [maxStudentsValue, setMaxStudentsValue] = useState(2);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      const data = await res.json();
      const postal = data?.address?.postcode;

      setSessionData(prev => ({ ...prev, location: postal || 'Unavailable' }));
    })();
  }, []);

  const toggleDay = (day: string) => {
    setSessionData((prev: SessionData) => {
      const days = [...(prev.recurringDays || [])];
      const index = days.indexOf(day);
      if (index > -1) days.splice(index, 1);
      else days.push(day);
      return { ...prev, recurringDays: days };
    });
  };

  interface ToggleDateDay {
    dateString: string;
    [key: string]: any;
  }

  const toggleDate = (day: string | ToggleDateDay) => {
    const dateStr = typeof day === 'string' ? day : day.dateString;
    setSessionData((prev: SessionData) => {
      const dates = [...(prev.monthlyDates || [])];
      const index = dates.indexOf(dateStr);
      if (index > -1) dates.splice(index, 1);
      else dates.push(dateStr);
      return { ...prev, monthlyDates: dates };
    });
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No access token');
      const coach_id = await SecureStore.getItemAsync('userId');
      const payload = {
        sport: sessionData.sport,
        session_type: sessionData.sessionType,
        start_time: sessionData.startTime,
        end_time: sessionData.endTime,
        recurring_type: sessionData.sessionType === 'recurring' ? recurringType : undefined,
        recurring_days: sessionData.sessionType === 'recurring' && recurringType === 'weekly' ? sessionData.recurringDays : undefined,
        recurring_dates: sessionData.sessionType === 'recurring' && recurringType === 'monthly' ? sessionData.monthlyDates : undefined,
        repeat_count: sessionData.sessionType === 'recurring' && recurringType === 'weekly' ? sessionData.numberOfWeeks : undefined,
        price_per_session: sessionData.price,
        description: sessionData.description,
        age_range_start: sessionData.minAge,
        age_range_end: sessionData.maxAge,
        max_students: sessionData.groupType === 'group' ? sessionData.maxStudents : '1',
        postal_code: sessionData.location,
        location_name: sessionData.location,
        class_type: sessionData.groupType,
        coach_id,
      };
      await createCoachSession(token, payload);
      Alert.alert('Success', 'Session Successfully booked', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'CoachMainApp' }] } as any) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create session');
    }
  };

  // Helper function to convert time index to time string
  const getTimeFromIndex = (index: number) => {
    return timeSlots[index] || '07:00';
  };

  // Helper function to convert time string to index
  const getIndexFromTime = (time: string) => {
    return timeSlots.indexOf(time);
  };

  // Update session data when time range changes
  useEffect(() => {
    setSessionData(prev => ({
      ...prev,
      startTime: getTimeFromIndex(timeRange[0]),
      endTime: getTimeFromIndex(timeRange[1])
    }));
  }, [timeRange]);

  // Update session data when max students changes
  useEffect(() => {
    setSessionData(prev => ({
      ...prev,
      maxStudents: maxStudentsValue.toString()
    }));
  }, [maxStudentsValue]);

  // Helper to get days in month and first day
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay();
  
  // Calculate total cells needed to ensure full weeks are shown (always 6 rows)
  const totalCells = 42; // 6 rows × 7 days = 42 cells

  const handleCalendarDayPress = (day: number) => {
    const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    toggleDate(dateStr);
  };

  const renderStaticCalendar = () => {
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ type: 'empty', key: `empty-${i}` });
    }
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ type: 'day', day, key: `day-${day}` });
    }
    // Add empty cells to complete the grid (always 42 cells)
    while (days.length < 42) {
      days.push({ type: 'empty', key: `empty-end-${days.length}` });
    }

    // Split into 6 rows of 7 cells
    const rows = [];
    for (let i = 0; i < 6; i++) {
      rows.push(days.slice(i * 7, (i + 1) * 7));
    }

    return rows.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={{ flexDirection: 'row' }}>
        {row.map(cell => {
          if (cell.type === 'empty') {
            return <View key={cell.key} style={styles.calendarEmptyCell} />;
          } else {
            const day = cell.day;
            const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = (sessionData.monthlyDates && sessionData.monthlyDates.includes(dateStr));
            // Debug output
            console.log('Rendering day:', day, typeof day);
            return (
              <TouchableOpacity
                key={cell.key}
                onPress={() => typeof day === 'number' && handleCalendarDayPress(day)}
                style={[
                  styles.calendarDay,
                  isSelected && styles.calendarDaySelected,
                ]}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: 'red', fontSize: 16 }}>
                    {typeof day === 'number' ? String(day) : '?'}
                  </Text>
                  {hasSession(dateStr) && (
                    <View style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#fb923c',
                      marginTop: 2,
                    }} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }
        })}
      </View>
    ));
  };

  // Step 1: Sport & Session Type
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Session Details</Text>

      {/* Sport Selection */}
      <Text style={styles.label}>What sport/activity?</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowSportDropdown(true)}
      >
        <Text style={sessionData.sport ? styles.dropdownText : styles.dropdownPlaceholder}>
          {sessionData.sport || 'Select sport'}
        </Text>
        <ChevronDown size={20} color="#9ca3af" />
      </TouchableOpacity>
      <Modal visible={showSportDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSportDropdown(false)}>
          <View style={styles.dropdownModal}>
            <ScrollView>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSessionData({ ...sessionData, sport });
                    setShowSportDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{sport}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Session Type */}
      <Text style={styles.label}>Session type</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            sessionData.sessionType === 'single' && styles.typeButtonActive
          ]}
          onPress={() => setSessionData({ ...sessionData, sessionType: 'single' })}
        >
          <Text style={sessionData.sessionType === 'single' ? styles.typeButtonTextActive : styles.typeButtonText}>
            Single Class
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            sessionData.sessionType === 'recurring' && styles.typeButtonActive
          ]}
          onPress={() => setSessionData({ ...sessionData, sessionType: 'recurring' })}
        >
          <Text style={sessionData.sessionType === 'recurring' ? styles.typeButtonTextActive : styles.typeButtonText}>
            Recurring Class
          </Text>
        </TouchableOpacity>
      </View>

      {/* Age Range Slider */}
      <Text style={styles.label}>Age Range: {sessionData.minAge} - {sessionData.maxAge} years</Text>
      <View style={styles.sliderContainer}>
        <MultiSlider
          values={[sessionData.minAge, sessionData.maxAge]}
          min={4}
          max={80}
          step={1}
          sliderLength={width - 80}
          onValuesChange={([minAge, maxAge]) => setSessionData({ ...sessionData, minAge, maxAge })}
          selectedStyle={{ backgroundColor: '#fb923c' }}
          unselectedStyle={{ backgroundColor: '#374151' }}
          containerStyle={{ height: 40 }}
          trackStyle={{ height: 4, borderRadius: 2 }}
          markerStyle={{
            backgroundColor: '#fb923c',
            height: 20,
            width: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: '#fff'
          }}
        />
      </View>
    </View>
  );

  // Step 2: Schedule
  const renderStep2 = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Schedule</Text>

        {/* Time Range */}
        <Text style={styles.label}>Time: {getTimeFromIndex(timeRange[0])} - {getTimeFromIndex(timeRange[1])}</Text>
        <View style={styles.timeSliderContainer}>
          <MultiSlider
            values={timeRange}
            min={0}
            max={timeSlots.length - 1}
            step={1}
            sliderLength={width - 80}
            onValuesChange={setTimeRange}
            selectedStyle={{ backgroundColor: '#fb923c' }}
            unselectedStyle={{ backgroundColor: '#374151' }}
            containerStyle={{ height: 40 }}
            trackStyle={{ height: 4, borderRadius: 2 }}
            markerStyle={{
              backgroundColor: '#fb923c',
              height: 20,
              width: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#fff'
            }}
          />
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>{timeSlots[0]}</Text>
            <Text style={styles.timeLabel}>{timeSlots[Math.floor((timeSlots.length - 1) / 2)]}</Text>
            <Text style={styles.timeLabel}>{timeSlots[timeSlots.length - 1]}</Text>
          </View>
        </View>

        {/* Single Class: Date Selection */}
        {sessionData.sessionType === 'single' && (
          <>
            <Text style={styles.label}>Pick Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9ca3af"
              value={sessionData.monthlyDates && sessionData.monthlyDates[0] ? sessionData.monthlyDates[0] : ''}
              onChangeText={val => {
                // Only allow one date for single session
                setSessionData(prev => ({ ...prev, monthlyDates: [val] }));
              }}
            />
            {/* Show sessions for entered date if any */}
            {sessionData.monthlyDates && sessionData.monthlyDates[0] && (
              existingSessions.some(s => s.date === sessionData.monthlyDates[0]) ? (
                <View style={{ marginTop: 16, backgroundColor: '#27272a', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Sessions on {sessionData.monthlyDates[0]}:</Text>
                  {existingSessions.filter(s => s.date === sessionData.monthlyDates[0]).map((session, idx) => (
                    <View key={idx} style={{ marginBottom: 6 }}>
                      <Text style={{ color: '#fb923c', fontWeight: 'bold' }}>{session.title}</Text>
                      <Text style={{ color: '#fff' }}>{session.time}</Text>
                    </View>
                  ))}
                  <Text style={{ color: 'red', marginTop: 8 }}>Warning: There are already sessions booked on this date.</Text>
                </View>
              ) : null
            )}
          </>
        )}

        {/* Recurring Class: Weekly/Monthly */}
        {sessionData.sessionType === 'recurring' && (
          <>
            <Text style={styles.label}>Recurring Type</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  recurringType === 'weekly' && styles.typeButtonActive
                ]}
                onPress={() => setRecurringType('weekly')}
              >
                <Text style={recurringType === 'weekly' ? styles.typeButtonTextActive : styles.typeButtonText}>
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  recurringType === 'monthly' && styles.typeButtonActive
                ]}
                onPress={() => setRecurringType('monthly')}
              >
                <Text style={recurringType === 'monthly' ? styles.typeButtonTextActive : styles.typeButtonText}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weekly: Number of Weeks and Start Date */}
            {recurringType === 'weekly' && (
              <>
                <Text style={styles.label}>Number of weeks</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 8"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={sessionData.numberOfWeeks}
                  onChangeText={(val) => setSessionData({ ...sessionData, numberOfWeeks: val })}
                />

                <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={sessionData.startDate}
                  onChangeText={(val) => setSessionData({ ...sessionData, startDate: val })}
                />

                <Text style={styles.label}>Recurring Days</Text>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        sessionData.recurringDays.includes(day) && styles.dayButtonActive
                      ]}
                      onPress={() => toggleDay(day)}
                    >
                      <Text style={sessionData.recurringDays.includes(day) ? styles.dayButtonTextActive : styles.dayButtonText}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Monthly: Calendar Multi-Select */}
            {recurringType === 'monthly' && (
              <>
                <Text style={styles.label}>Pick Dates (One Month Only)</Text>
                <View style={{height: 100, justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={{color: '#9ca3af'}}>Monthly calendar selection will be available in a future update.</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>
    );
  };

  // Step 3: Location & Group Type
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Location & Group Type</Text>

      {/* Postal Code */}
      <Text style={styles.label}>Postal Code</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter postal code"
        placeholderTextColor="#9ca3af"
        value={sessionData.location}
        onChangeText={(val) => {
          // Limit to 6 characters
          const limitedVal = val.slice(0, 6);
          setSessionData({ ...sessionData, location: limitedVal });
        }}
        keyboardType="numeric"
        maxLength={6}
      />

      {/* Group Type */}
      <Text style={styles.label}>Session format</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            sessionData.groupType === 'individual' && styles.typeButtonActive
          ]}
          onPress={() => setSessionData({ ...sessionData, groupType: 'individual' })}
        >
          <Text style={sessionData.groupType === 'individual' ? styles.typeButtonTextActive : styles.typeButtonText}>
            Individual
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            sessionData.groupType === 'group' && styles.typeButtonActive
          ]}
          onPress={() => setSessionData({ ...sessionData, groupType: 'group' })}
        >
          <Text style={sessionData.groupType === 'group' ? styles.typeButtonTextActive : styles.typeButtonText}>
            Group Session
          </Text>
        </TouchableOpacity>
      </View>

      {/* Max Students Slider */}
      {sessionData.groupType === 'group' && (
        <>
          <Text style={styles.label}>Maximum students: {maxStudentsValue}</Text>
          <View style={styles.sliderContainer}>
            <MultiSlider
              values={[maxStudentsValue]}
              min={2}
              max={20}
              step={1}
              sliderLength={width - 80}
              onValuesChange={([value]) => setMaxStudentsValue(value)}
              selectedStyle={{ backgroundColor: '#fb923c' }}
              unselectedStyle={{ backgroundColor: '#374151' }}
              containerStyle={{ height: 40 }}
              trackStyle={{ height: 4, borderRadius: 2 }}
              markerStyle={{
                backgroundColor: '#fb923c',
                height: 20,
                width: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff'
              }}
            />
          </View>
        </>
      )}
    </View>
  );

  // Step 4: Pricing & Details
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pricing & Details</Text>

      {/* Price */}
      <Text style={styles.label}>Price per session ($)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="#9ca3af"
        keyboardType="numeric"
        value={sessionData.price}
        onChangeText={val => setSessionData({ ...sessionData, price: val })}
      />

      {/* Description */}
      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Tell students what they can expect from this session..."
        placeholderTextColor="#9ca3af"
        multiline
        value={sessionData.description}
        onChangeText={val => setSessionData({ ...sessionData, description: val })}
      />

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Session Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sport:</Text>
          <Text style={styles.summaryValue}>{sessionData.sport || 'Not selected'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Age Range:</Text>
          <Text style={styles.summaryValue}>{sessionData.minAge} - {sessionData.maxAge} years</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{sessionData.startTime} - {sessionData.endTime}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{sessionData.sessionType} - {sessionData.groupType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price:</Text>
          <Text style={styles.summaryValue}>${sessionData.price || '0.00'}</Text>
        </View>
      </View>
    </View>
  );

  const canProceed = () => {
    let canProceedResult = false;
    
    if (currentStep === 1) {
      canProceedResult = !!(sessionData.sport && sessionData.sessionType);
    } else if (currentStep === 2) {
      if (!sessionData.startTime || !sessionData.endTime) {
        canProceedResult = false;
      } else if (sessionData.sessionType === 'single') {
        canProceedResult = (sessionData.monthlyDates && sessionData.monthlyDates.length === 1);
      } else if (sessionData.sessionType === 'recurring') {
        if (recurringType === 'weekly') {
          canProceedResult = !!(sessionData.numberOfWeeks && sessionData.startDate && sessionData.recurringDays && sessionData.recurringDays.length > 0);
        } else if (recurringType === 'monthly') {
          canProceedResult = (sessionData.monthlyDates && sessionData.monthlyDates.length > 0);
        }
      }
    } else if (currentStep === 3) {
      canProceedResult = !!(sessionData.location && sessionData.location.trim() !== '' && sessionData.groupType);
    } else {
      canProceedResult = true;
    }
    
    console.log(`Step ${currentStep} canProceed:`, canProceedResult, {
      sport: sessionData.sport,
      sessionType: sessionData.sessionType,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      monthlyDates: sessionData.monthlyDates,
      numberOfWeeks: sessionData.numberOfWeeks,
      startDate: sessionData.startDate,
      recurringDays: sessionData.recurringDays,
      location: sessionData.location,
      groupType: sessionData.groupType
    });
    
    return canProceedResult;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePrevious} style={{ marginRight: 12 }}>
            <ChevronLeft size={24} color="#9ca3af" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Session</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.progressCircle,
                  currentStep >= step ? styles.progressCircleActive : styles.progressCircleInactive,
                ]}
              >
                <Text style={currentStep >= step ? styles.progressCircleTextActive : styles.progressCircleTextInactive}>
                  {step}
                </Text>
              </View>
              {step < 4 && (
                <View
                  style={[
                    styles.progressBar,
                    currentStep > step ? styles.progressBarActive : styles.progressBarInactive,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Step Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.bottomButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnGray]}
              onPress={handlePrevious}
            >
              <Text style={styles.navBtnText}>Previous</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.navBtn,
              styles.navBtnOrange,
              !canProceed() && { opacity: 0.5 }
            ]}
            onPress={currentStep === 4 ? handleSubmit : handleNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnText}>{currentStep === 4 ? 'Create Session' : 'Next'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navTabBtn}>
            <View style={styles.navIconPlaceholder} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTabBtn}>
            <View style={styles.navIconPlaceholder} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTabBtn}>
            <View style={styles.navIconPlaceholder} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTabBtn}>
            <View style={styles.navIconPlaceholder} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  navTabBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  navIconPlaceholder: {
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    height: 24,
    width: 24,
  },
  sessionPill: {
    minWidth: 80,
    alignItems: 'center',
    marginRight: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fed7aa',
  },
  sessionPillDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fb923c',
    marginBottom: 2,
  },
  sessionPillTime: {
    fontSize: 13,
    color: '#18181b',
    marginBottom: 2,
  },
  sessionPillTitle: {
    fontSize: 12,
    color: '#18181b',
  },
  header: {
    backgroundColor: '#27272a',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    marginTop: 24,
    marginBottom: 12,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  dropdownButton: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dropdownText: {
    color: '#fff',
    fontSize: 15,
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 16,
    width: width * 0.8,
    maxHeight: 320,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#27272a',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#fb923c',
    borderColor: '#fb923c',
  },
  typeButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 15,
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  sliderContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dayButton: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#fb923c',
    borderColor: '#fb923c',
  },
  dayButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 12,
  },
  dayButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  calendarCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 24, // increase vertical padding
    paddingHorizontal: 32, // increase horizontal padding
    marginVertical: 16,
    width: gridWidth + 40, // increase width for a larger backing
    // alignSelf: 'center',
    // marginHorizontal: 'auto',
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
    width: '100%', // fill the card
    minHeight: 240,
  },
  calendarEmptyCell: {
    flex: 1, // take up 1/7th of the row
    height: 40,
    padding: 6,
    paddingHorizontal: 10,
    maxWidth: 48,
},
  calendarDay: {
    flex: 1, // take up 1/7th of the row
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    padding: 6,
    paddingHorizontal: 10,
    maxWidth: 48, // prevent cells from getting too wide
},
  calendarDaySelected: {
    backgroundColor: '#fb923c',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  summaryCard: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 16,
    marginTop: 18,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    gap: 0,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#fb923c',
  },
  progressCircleInactive: {
    backgroundColor: '#374151',
  },
  progressCircleTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressCircleTextInactive: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 2,
    width: 24,
    marginHorizontal: 4,
  },
  progressBarActive: {
    backgroundColor: '#fb923c',
  },
  progressBarInactive: {
    backgroundColor: '#374151',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#18181b',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 12,
    minHeight: 80,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  navBtnOrange: {
    backgroundColor: '#fb923c',
  },
  navBtnGray: {
    backgroundColor: '#374151',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#27272a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  timeSliderContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  timeLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
});

export default CoachCreateSessionPage;