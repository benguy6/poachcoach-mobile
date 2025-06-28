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

const { width } = Dimensions.get('window');

const sports = [
  'Yoga', 'Baseball', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Fitness Training', 'Martial Arts', 'Running', 'Cycling'
];

const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00',
  '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00',
  '19:30', '20:00'
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

const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

const getSessionsForMonth = (month: number, year: number) =>
  existingSessions.filter(
    (s) =>
      new Date(s.date).getMonth() === month &&
      new Date(s.date).getFullYear() === year
  );

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
    sessionType: ''
  });

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showInlineCalendar, setShowInlineCalendar] = useState(false);
  const [clashError, setClashError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date(currentYear, currentMonth, 1));
  const [recurringType, setRecurringType] = useState<string>('weekly');
  const [repeatCount, setRepeatCount] = useState<string>('');

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
        repeat_count: sessionData.sessionType === 'recurring' ? repeatCount : undefined,
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

  // Helper to get days in month and first day
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();

  const handleCalendarDayPress = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    toggleDate(dateStr);
  };

  const renderStaticCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarEmptyCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = (sessionData.monthlyDates && sessionData.monthlyDates.includes(dateStr));
      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => handleCalendarDayPress(day)}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
          ]}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected ? { color: '#fff' } : { color: '#9ca3af' }
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    return days;
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
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Schedule</Text>

        {/* Start Time */}
        <Text style={styles.label}>Start Time</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowStartDropdown(true)}
        >
          <Text style={sessionData.startTime ? styles.dropdownText : styles.dropdownPlaceholder}>
            {sessionData.startTime || 'Select start time'}
          </Text>
          <ChevronDown size={20} color="#9ca3af" />
        </TouchableOpacity>
        <Modal visible={showStartDropdown} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStartDropdown(false)}>
            <View style={styles.dropdownModal}>
              <ScrollView>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSessionData({ ...sessionData, startTime: time });
                      setShowStartDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* End Time */}
        <Text style={styles.label}>End Time</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowEndDropdown(true)}
        >
          <Text style={sessionData.endTime ? styles.dropdownText : styles.dropdownPlaceholder}>
            {sessionData.endTime || 'Select end time'}
          </Text>
          <ChevronDown size={20} color="#9ca3af" />
        </TouchableOpacity>
        <Modal visible={showEndDropdown} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowEndDropdown(false)}>
            <View style={styles.dropdownModal}>
              <ScrollView>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSessionData({ ...sessionData, endTime: time });
                      setShowEndDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Single Class: Date Selection */}
        {sessionData.sessionType === 'single' && (
          <>
            <Text style={styles.label}>Pick Date</Text>
            <View style={styles.calendarCard}>
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  style={styles.monthNavBtn}
                >
                  <ChevronLeft size={20} color="#9ca3af" />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                  {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity
                  onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  style={styles.monthNavBtn}
                >
                  <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              <View style={styles.daysOfWeekRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {(() => {
                  const days = [];
                  for (let i = 0; i < firstDayOfMonth; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.calendarEmptyCell} />);
                  }
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = sessionData.monthlyDates[0] === dateStr;
                    days.push(
                      <TouchableOpacity
                        key={day}
                        onPress={() => setSessionData({ ...sessionData, monthlyDates: [dateStr] })}
                        style={[
                          styles.calendarDay,
                          isSelected && styles.calendarDaySelected,
                        ]}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          isSelected ? { color: '#fff' } : { color: '#9ca3af' }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  return days;
                })()}
              </View>
            </View>
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

            {/* Repeat Count */}
            <Text style={styles.label}>Number of sessions</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 8"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={repeatCount}
              onChangeText={setRepeatCount}
            />

            {/* Weekly: Recurring Days */}
            {recurringType === 'weekly' && (
              <>
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
                <Text style={styles.label}>Pick Dates</Text>
                <View style={styles.calendarCard}>
                  <View style={styles.monthNav}>
                    <TouchableOpacity
                      onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      style={styles.monthNavBtn}
                    >
                      <ChevronLeft size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>
                      {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      style={styles.monthNavBtn}
                    >
                      <ChevronRight size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.daysOfWeekRow}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.calendarGrid}>{renderStaticCalendar()}</View>
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
        onChangeText={(val) => setSessionData({ ...sessionData, location: val })}
        keyboardType="numeric"
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

      {/* Max Students */}
      {sessionData.groupType === 'group' && (
        <>
          <Text style={styles.label}>Maximum students</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowStudentDropdown(true)}
          >
            <Text style={sessionData.maxStudents ? styles.dropdownText : styles.dropdownPlaceholder}>
              {sessionData.maxStudents || 'Select max students'}
            </Text>
            <ChevronDown size={20} color="#9ca3af" />
          </TouchableOpacity>
          <Modal visible={showStudentDropdown} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowStudentDropdown(false)}>
              <View style={styles.dropdownModal}>
                <ScrollView>
                  {[2, 4, 6, 8, 10, 12, 15, 20].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setSessionData({ ...sessionData, maxStudents: num.toString() });
                        setShowStudentDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{num} students</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
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
        if (!repeatCount || repeatCount === '') {
          canProceedResult = false;
        } else if (recurringType === 'weekly') {
          canProceedResult = (sessionData.recurringDays && sessionData.recurringDays.length > 0);
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
      repeatCount,
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
    padding: 16,
    marginVertical: 16,
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
  },
  calendarDaySelected: {
    backgroundColor: '#fb923c',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
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
});

export default CoachCreateSessionPage;