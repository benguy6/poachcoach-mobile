import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createCoachSession, createRecurringCoachSession, createMonthlyRecurringCoachSession } from '../../services/api';
import { supabase } from '../../services/supabase';

const getToken = async (): Promise<string | null> => {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Failed to retrieve session:', error);
      return null;
    }

    const token = sessionData.session?.access_token;

    if (!token) {
      console.error('No access token found');
      return null;
    }

    return token;
  } catch (err) {
    console.error('Error retrieving token:', err);
    return null;
  }
};

const { width } = Dimensions.get('window');

// Interface for the comprehensive weekly recurring session data
interface WeeklyRecurringSessionData {
  // Basic Session Information
  sessionMetadata: {
    sessionType: 'recurring';
    frequency: 'weekly';
    sport: string;
    ageRange: string; // Format: "12-18 years"
    description: string;
    createdAt: string; // ISO timestamp
  };

  // Location Information
  location: {
    address: string;
    postalCode: string;
  };

  // Class Configuration
  classConfiguration: {
    classType: 'single' | 'group';
    maxStudents: number | null; // null for single class, number for group
  };

  // Schedule Configuration
  scheduleConfiguration: {
    startDate: string; // YYYY-MM-DD format
    numberOfWeeks: number;
    endDate: string; // Calculated: startDate + (numberOfWeeks * 7) days
    selectedDays: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
    dayTimes: {
      [dayName: string]: {
        startTime: string; // e.g., '09:00'
        endTime: string; // e.g., '10:30'
        duration: string; // e.g., '1hr 30mins'
        durationInHours: number; // e.g., 1.5
      };
    };
  };

  // Pricing Information
  pricing: {
    dayPrices: {
      [dayName: string]: {
        pricePerSession: string;
        pricePerHour: string; // Calculated
      };
    };
  };

  // Individual Sessions (Generated)
  individualSessions: Array<{
    date: string; // YYYY-MM-DD
    dayOfWeek: string; // e.g., 'Monday'
    startTime: string; // e.g., '09:00'
    endTime: string; // e.g., '10:30'
    duration: string; // e.g., '1hr 30mins'
    durationInHours: number;
    pricePerSession: string;
    pricePerHour: string;
    weekNumber: number; // Which week this session belongs to (1-based)
    
    // Inherited from parent session
    sport: string;
    ageRange: string; // Format: "12-18 years"
    address: string;
    postalCode: string;
    classType: 'single' | 'group';
    maxStudents: number | null;
    availableSlots: number | null;
    description: string;
  }>;
}

// Define MonthlyRecurringSessionData interface
interface MonthlyRecurringSessionData {
  sessionMetadata: {
    sessionType: string;
    frequency: string;
    sport: string;
    ageRange: string;
    description: string;
    createdAt: string;
  };
  location: {
    address: string;
    postalCode: string;
  };
  classConfiguration: {
    classType: 'single' | 'group';
    maxStudents: number | null;
  };
  individualSessions: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: string;
    durationInHours: number;
    pricePerSession: string;
    pricePerHour: string;
    sport: string;
    ageRange: string;
    address: string;
    postalCode: string;
    classType: 'single' | 'group';
    maxStudents: number | null;
    availableSlots: number | null;
    description: string;
  }>;
}

const sports = [
  'Yoga', 'Baseball', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Fitness Training', 'Martial Arts', 'Running', 'Cycling',
];

const timeSlots = [
  '07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45', '22:00',
];

const CoachCreateSessionPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<string>('single'); // Default to Single Class
  const [ageRange, setAgeRange] = useState<[number, number]>([6, 80]); // Default age range
  const [showDropdown, setShowDropdown] = useState(false); // State for dropdown visibility
  const [sessionTime, setSessionTime] = useState<[number, number]>([0, 1]); // Default session time range
  const [sessionDate, setSessionDate] = useState<string>(''); // Selected session date
  const [postalCode, setPostalCode] = useState<string>(''); // Postal code input
  const [classType, setClassType] = useState<string>('single'); // Default to Single Class
  const [groupSize, setGroupSize] = useState<number>(2); // Default group size
  const [pricePerSession, setPricePerSession] = useState<string>(''); // Price per session
  const [description, setDescription] = useState<string>(''); // Session description
  const [address, setAddress] = useState<string>(''); // Added state for address
  const [frequency, setFrequency] = useState<string>('weekly'); // Frequency: weekly or monthly
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // Selected days for weekly frequency
  const [dayTimes, setDayTimes] = useState<{ [key: string]: [number, number] }>({}); // Time slots for each selected day
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(1); // Number of weeks
  const [startDate, setStartDate] = useState<string>(''); // Start date input
  const [dayPrices, setDayPrices] = useState<{ [key: string]: string }>({}); // Prices for each day
  const [datePrices, setDatePrices] = useState<{ [key: string]: string }>({}); // Prices for each date

  const navigation = useNavigation<any>();

  // Reset state variables when the page gains focus
  useFocusEffect(
    React.useCallback(() => {
      setCurrentStep(1);
      setSelectedSport(null);
      setSessionType('single');
      setAgeRange([6, 80]);
      setShowDropdown(false);
      setSessionTime([0, 1]);
      setSessionDate('');
      setPostalCode('');
      setClassType('single');
      setGroupSize(2);
      setPricePerSession('');
      setDescription('');
      setAddress(''); // Reset address state
      setFrequency('weekly'); // Reset frequency
      setSelectedDays([]); // Reset selected days
      setDayTimes({}); // Reset day times
      setNumberOfWeeks(1); // Reset number of weeks
      setStartDate(''); // Reset start date
      setDayPrices({}); // Reset day prices for weekly sessions
      setDatePrices({}); // Reset date prices for monthly sessions
    }, [])
  );

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport);
    setShowDropdown(false); // Close dropdown after selection
  };

  const generateWeeklyDates = (startDate: string, selectedDays: string[], numberOfWeeks: number): string[] => {
    const start = new Date(startDate);
    const daysOfWeek = {
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
      Sunday: 0,
    };
  
    const generatedDates: string[] = [];
  
    for (let week = 0; week < numberOfWeeks; week++) {
      selectedDays.forEach((day) => {
        const dayOffset = daysOfWeek[day as keyof typeof daysOfWeek] - start.getDay();
        const sessionDate = new Date(start);
        sessionDate.setDate(start.getDate() + dayOffset + week * 7);
  
        if (sessionDate >= start) {
          generatedDates.push(sessionDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        }
      });
    }
  
    return generatedDates;
  };

  const handleSessionTypeChange = (type: string) => {
    setSessionType(type);
  };

  const handleAgeRangeChange = (values: [number, number]) => {
    setAgeRange(values);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePostalCodeChange = (text: string) => {
    if (text.length <= 6) {
      setPostalCode(text);
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); 
  };

  const formatDuration = (durationInHours: number): string => {
    const hours = Math.floor(durationInHours); 
    const minutes = Math.round((durationInHours - hours) * 60); 
  
    let result = '';
    if (hours > 0) {
      result += `${hours}hr${hours > 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
      result += `${minutes}min${minutes > 1 ? 's' : ''}`;
    }
  
    return result.trim(); 
  };

  const calculatePricePerHour = (pricePerSession: string, startTime: string, endTime: string) => {
    const duration = calculateDuration(startTime, endTime);
    return duration > 0 ? (parseFloat(pricePerSession) / duration).toFixed(2) : null;
  };

  const createWeeklyRecurringSessionObject = (): WeeklyRecurringSessionData => {
    // Calculate end date
    const start = new Date(startDate);
    const endDateCalculated = new Date(start);
    endDateCalculated.setDate(start.getDate() + (numberOfWeeks * 7) - 1);

    // Generate all session dates
    const sessionDates = generateWeeklyDates(startDate, selectedDays, numberOfWeeks);

    // Build dayTimes object with calculated durations
    const dayTimesWithDurations: { [dayName: string]: { startTime: string; endTime: string; duration: string; durationInHours: number } } = {};
    selectedDays.forEach(day => {
      const timeRange = dayTimes[day] || [0, 1];
      const startTime = timeSlots[timeRange[0]];
      const endTime = timeSlots[timeRange[1]];
      const durationInHours = calculateDuration(startTime, endTime);
      const duration = formatDuration(durationInHours);
      
      dayTimesWithDurations[day] = {
        startTime,
        endTime,
        duration,
        durationInHours
      };
    });

    // Build pricing object with calculated price per hour
    const pricingData: { [dayName: string]: { pricePerSession: string; pricePerHour: string } } = {};
    selectedDays.forEach(day => {
      const pricePerSession = dayPrices[day] || '0';
      const timeRange = dayTimes[day] || [0, 1];
      const pricePerHour = calculatePricePerHour(pricePerSession, timeSlots[timeRange[0]], timeSlots[timeRange[1]]) || '0';
      
      pricingData[day] = {
        pricePerSession,
        pricePerHour
      };
    });

    // Generate individual sessions
    const individualSessions = sessionDates.map((date, index) => {
      const sessionDate = new Date(date);
      const dayOfWeek = sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
      const weekNumber = Math.floor(index / selectedDays.length) + 1;
      
      const timeRange = dayTimes[dayOfWeek] || [0, 1];
      const startTime = timeSlots[timeRange[0]];
      const endTime = timeSlots[timeRange[1]];
      const durationInHours = calculateDuration(startTime, endTime);
      const duration = formatDuration(durationInHours);
      const pricePerSession = dayPrices[dayOfWeek] || '0';
      const pricePerHour = calculatePricePerHour(pricePerSession, startTime, endTime) || '0';

      return {
        date,
        dayOfWeek,
        startTime,
        endTime,
        duration,
        durationInHours,
        pricePerSession,
        pricePerHour,
        weekNumber,
        sport: selectedSport || '',
        ageRange: `${ageRange[0]}-${ageRange[1]} years`,
        address,
        postalCode,
        classType: classType as 'single' | 'group',
        maxStudents: classType === 'group' ? groupSize : null,
        availableSlots: classType === 'group' ? groupSize : null,
        description
      };
    });

    return {
      sessionMetadata: {
        sessionType: 'recurring',
        frequency: 'weekly',
        sport: selectedSport || '',
        ageRange: `${ageRange[0]}-${ageRange[1]} years`,
        description,
        createdAt: new Date().toISOString()
      },
      location: {
        address,
        postalCode
      },
      classConfiguration: {
        classType: classType as 'single' | 'group',
        maxStudents: classType === 'group' ? groupSize : null
      },
      scheduleConfiguration: {
        startDate,
        numberOfWeeks,
        endDate: endDateCalculated.toISOString().split('T')[0],
        selectedDays,
        dayTimes: dayTimesWithDurations
      },
      pricing: {
        dayPrices: pricingData
      },
      individualSessions
    };
  };

  const createMonthlyRecurringSessionObject = (): MonthlyRecurringSessionData => {
    // Generate individual sessions for each selected date
    const individualSessions = selectedDays.map((date) => {
      const timeRange = dayTimes[date] || [0, 1];
      const startTime = timeSlots[timeRange[0]];
      const endTime = timeSlots[timeRange[1]];
      const durationInHours = calculateDuration(startTime, endTime);
      const duration = formatDuration(durationInHours);
      const pricePerSession = datePrices[date] || '0';
      const pricePerHour = calculatePricePerHour(pricePerSession, startTime, endTime) || '0';

      return {
        date,
        dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        startTime,
        endTime,
        duration,
        durationInHours,
        pricePerSession,
        pricePerHour,
        sport: selectedSport || '',
        ageRange: `${ageRange[0]}-${ageRange[1]} years`,
        address,
        postalCode,
        classType: classType as 'single' | 'group',
        maxStudents: classType === 'group' ? groupSize : null,
        availableSlots: classType === 'group' ? groupSize : null,
        description
      };
    });

    return {
      sessionMetadata: {
        sessionType: 'recurring',
        frequency: 'monthly',
        sport: selectedSport || '',
        ageRange: `${ageRange[0]}-${ageRange[1]} years`,
        description,
        createdAt: new Date().toISOString()
      },
      location: {
        address,
        postalCode
      },
      classConfiguration: {
        classType: classType as 'single' | 'group',
        maxStudents: classType === 'group' ? groupSize : null
      },
      individualSessions
    };
  };

  const handleCreateSession = async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      let sessionData;

      if (sessionType === 'single') {
        // Handle single session
        const duration = calculateDuration(timeSlots[sessionTime[0]], timeSlots[sessionTime[1]]);
        const formatted = formatDuration(duration);
        const pricePerHour = calculatePricePerHour(
          pricePerSession,
          timeSlots[sessionTime[0]],
          timeSlots[sessionTime[1]]
        );

        sessionData = {
          start_time: timeSlots[sessionTime[0]],
          end_time: timeSlots[sessionTime[1]],
          duration: formatted,
          date: sessionDate,
          day_of_week: new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long' }),
          postal_code: postalCode,
          address, 
          session_type: sessionType,
          class_type: classType,
          max_students: classType === 'group' ? groupSize : null,
          available_slots: classType === 'group' ? groupSize : null,
          age_range: `${ageRange[0]}-${ageRange[1]} years`,
          sport: selectedSport,
          description,
          price_per_session: pricePerSession,
          price_per_hour: pricePerHour,
        };

        // Call single session API
        const response = await createCoachSession(token, sessionData);
        
      } else if (sessionType === 'recurring' && frequency === 'weekly') {
        // Handle weekly recurring session - create comprehensive object
        const weeklySessionData = createWeeklyRecurringSessionObject();
        
        console.log('Weekly Recurring Session Data:', JSON.stringify(weeklySessionData, null, 2));
        
        // Call recurring session API with the comprehensive object
        const response = await createRecurringCoachSession(token, weeklySessionData);
        
      } else if (sessionType === 'recurring' && frequency === 'monthly') {
        // Handle monthly recurring session - create comprehensive object
        const monthlySessionData = createMonthlyRecurringSessionObject();
        
        console.log('Monthly Recurring Session Data:', JSON.stringify(monthlySessionData, null, 2));
        
        // Call monthly recurring session API with the comprehensive object
        const response = await createMonthlyRecurringCoachSession(token, monthlySessionData);
        
      } else {
        // Fallback for any other session types
        throw new Error('Invalid session type or frequency');
      }

      // Show success pop-up
      Alert.alert('Success', 'Session created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('CoachHome'),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      Alert.alert('Error', errorMessage);
    }
  };

  function handleDayTimeChange(day: string, timeRange: [number, number]): void {
    setDayTimes((prevDayTimes) => ({
      ...prevDayTimes,
      [day]: timeRange,
    }));
  }
  function handleDaySelection(day: string): void {
    setSelectedDays((prevSelectedDays) => {
      if (prevSelectedDays.includes(day)) {
        return prevSelectedDays.filter((selectedDay) => selectedDay !== day);
      } else {

        return [...prevSelectedDays, day];
      }
    });
  }

  const validateStartDate = (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
    if (!regex.test(date)) {
      return false; // Invalid format
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    return selectedDays.includes(dayOfWeek); 
  };

  // Helper function to validate weekly session fields in step 4
  const validateWeeklySessionFields = (): boolean => {
    if (!description) return false;
    
    // Check if all selected days have prices
    for (const day of selectedDays) {
      if (!dayPrices[day] || dayPrices[day].trim() === '') {
        return false;
      }
    }
    
    return true;
  };

  // Helper function to validate monthly session fields in step 4
  const validateMonthlySessionFields = (): boolean => {
    if (!description) return false;
    
    // Check if all selected dates have prices
    for (const date of selectedDays) {
      if (!datePrices[date] || datePrices[date].trim() === '') {
        return false;
      }
    }
    
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Stage Indicator */}
      <View style={styles.stageIndicator}>
        {[1, 2, 3, 4].map((stage) => (
          <View
            key={stage}
            style={[
              styles.stageCircle,
              stage === currentStep && styles.stageCircleActive, // Highlight current stage
            ]}
          >
            <Text
              style={[
                styles.stageText,
                stage === currentStep && styles.stageTextActive, // Highlight text for current stage
              ]}
            >
              {stage}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Render content for each step */}
        {currentStep === 1 && (
          <>
            {/* Step 1 Content */}
            {/* Select Sport */}
            <Text style={styles.label}>Select a Sport</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedSport || 'Choose a Sport'}
              </Text>
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal visible={showDropdown} transparent animationType="slide">
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  {sports.map((sport) => (
                    <TouchableOpacity
                      key={sport}
                      style={styles.modalItem}
                      onPress={() => handleSportSelect(sport)}
                    >
                      <Text style={styles.modalItemText}>{sport}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowDropdown(false)}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Select Session Type */}
            <Text style={styles.label}>Session Type</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  sessionType === 'single' && styles.sessionButtonSelected,
                ]}
                onPress={() => handleSessionTypeChange('single')}
              >
                <Text
                  style={
                    sessionType === 'single'
                      ? styles.sessionButtonTextSelected
                      : styles.sessionButtonText
                  }
                >
                  Single Class
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  sessionType === 'recurring' && styles.sessionButtonSelected,
                ]}
                onPress={() => handleSessionTypeChange('recurring')}
              >
                <Text
                  style={
                    sessionType === 'recurring'
                      ? styles.sessionButtonTextSelected
                      : styles.sessionButtonText
                  }
                >
                  Recurring Class
                </Text>
              </TouchableOpacity>
            </View>

            {/* Age Range Slider */}
            <Text style={styles.label}>
              Age Range: {ageRange[0]} - {ageRange[1]} years
            </Text>
            <MultiSlider
              values={ageRange}
              min={6}
              max={80}
              step={1}
              sliderLength={width - 40}
              onValuesChange={(values) => handleAgeRangeChange(values as [number, number])}
              selectedStyle={{ backgroundColor: '#fb923c' }}
              unselectedStyle={{ backgroundColor: '#374151' }}
              containerStyle={{ marginVertical: 20 }}
              trackStyle={{ height: 4, borderRadius: 2 }}
              markerStyle={{
                backgroundColor: '#fb923c',
                height: 20,
                width: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          </>
        )}

        {currentStep === 2 && sessionType === 'single' && (
          <>
            {/* Step 2 Content */}
            {/* Session Time Slider */}
            <Text style={styles.label}>
              Session Time: {timeSlots[sessionTime[0]]} - {timeSlots[sessionTime[1]]}
            </Text>
            <MultiSlider
              values={sessionTime}
              min={0}
              max={timeSlots.length - 1}
              step={1}
              sliderLength={width - 40}
              onValuesChange={(values) => setSessionTime(values as [number, number])}
              selectedStyle={{ backgroundColor: '#fb923c' }}
              unselectedStyle={{ backgroundColor: '#374151' }}
              containerStyle={{ marginVertical: 20 }}
              trackStyle={{ height: 4, borderRadius: 2 }}
              markerStyle={{
                backgroundColor: '#fb923c',
                height: 20,
                width: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />

            {/* Calendar for Session Date */}
            <Text style={styles.label}>Session Date</Text>
            <Calendar
              onDayPress={(day) => setSessionDate(day.dateString)} // Set selected date
              markedDates={{
                [sessionDate]: { selected: true, marked: true, selectedColor: '#fb923c' },
              }}
              theme={{
                calendarBackground: '#18181b',
                textSectionTitleColor: '#d1d5db',
                selectedDayBackgroundColor: '#fb923c',
                selectedDayTextColor: '#fff',
                todayTextColor: '#fb923c',
                dayTextColor: '#d1d5db',
                arrowColor: '#fb923c',
                monthTextColor: '#fff',
              }}
              hideExtraDays={true} // Hides dates from previous and next months
              minDate={new Date().toISOString().split('T')[0]} // Restrict dates to today and onward
            />
          </>
        )}

        {currentStep === 2 && sessionType === 'recurring' && (
          <>
            {/* Frequency Selection */}
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  frequency === 'weekly' && styles.sessionButtonSelected,
                ]}
                onPress={() => {
                  setFrequency('weekly');
                  setSelectedDays([]); // Clear monthly dates when switching to weekly
                  setDayTimes({}); // Clear monthly time slots when switching to weekly
                }}
              >
                <Text
                  style={
                    frequency === 'weekly'
                      ? styles.sessionButtonTextSelected
                      : styles.sessionButtonText
                  }
                >
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  frequency === 'monthly' && styles.sessionButtonSelected,
                ]}
                onPress={() => {
                  setFrequency('monthly');
                  setSelectedDays([]); // Clear weekly days when switching to monthly
                  setDayTimes({}); // Clear weekly time slots when switching to monthly
                }}
              >
                <Text
                  style={
                    frequency === 'monthly'
                      ? styles.sessionButtonTextSelected
                      : styles.sessionButtonText
                  }
                >
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>

            {/* Weekly Frequency: Day Selection */}
            {frequency === 'weekly' && (
              <>
                <Text style={styles.label}>Select Days of the Week</Text>
                <View style={styles.dayButtonGroup}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day) && styles.dayButtonSelected,
                        ]}
                        onPress={() => handleDaySelection(day)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            selectedDays.includes(day) && styles.dayButtonTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {/* Time Sliders for Selected Days */}
                {selectedDays.map((day) => (
                  <View key={day} style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>Time for {day}</Text>
                    <Text style={styles.timeDisplay}>
                      {timeSlots[dayTimes[day]?.[0] || 0]} - {timeSlots[dayTimes[day]?.[1] || 1]}
                    </Text>
                    <View style={{ alignItems: 'flex-start' }}>
                      <MultiSlider
                        values={dayTimes[day] || [0, 1]}
                        min={0}
                        max={timeSlots.length - 1}
                        step={1}
                        sliderLength={width - 40}
                        onValuesChange={(values) => handleDayTimeChange(day, values as [number, number])}
                        selectedStyle={{ backgroundColor: '#fb923c' }}
                        unselectedStyle={{ backgroundColor: '#374151' }}
                        containerStyle={{ marginVertical: 20 }}
                        trackStyle={{ height: 4, borderRadius: 2 }}
                        markerStyle={{
                          backgroundColor: '#fb923c',
                          height: 20,
                          width: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: '#fff',
                        }}
                      />
                    </View>
                  </View>
                ))}

                {/* Number of Weeks Slider */}
                <Text style={styles.label}>Number of Weeks</Text>
                <Text style={styles.weekDisplay}>{numberOfWeeks} Week(s)</Text>
                <View style={{ alignItems: 'flex-start' }}>
                  <MultiSlider
                    values={[numberOfWeeks]}
                    min={1}
                    max={20}
                    step={1}
                    sliderLength={width - 40}
                    onValuesChange={(values) => setNumberOfWeeks(values[0])}
                    selectedStyle={{ backgroundColor: '#fb923c' }}
                    unselectedStyle={{ backgroundColor: '#374151' }}
                    containerStyle={{ marginVertical: 20 }}
                    trackStyle={{ height: 4, borderRadius: 2 }}
                    markerStyle={{
                      backgroundColor: '#fb923c',
                      height: 20,
                      width: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  />
                </View>

                {/* Start Date Input */}
                <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Start Date"
                  placeholderTextColor="#9ca3af"
                  value={startDate}
                  onChangeText={(text) => setStartDate(text)}
                />

                {/* Validate Start Date Button */}
                <TouchableOpacity
                  style={styles.validateButton}
                  onPress={() => {
                    const isValid = validateStartDate(startDate);
                    if (!isValid) {
                      Alert.alert(
                        'Invalid Start Date',
                        'Please ensure the date is valid and matches the selected days.'
                      );
                    } else {
                      Alert.alert('Valid Start Date', 'The start date is valid.');
                    }
                  }}
                >
                  <Text style={styles.validateButtonText}>Validate Start Date</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Monthly Frequency: Date Selection */}
            {frequency === 'monthly' && (
              <>
                <Text style={styles.label}>Select Dates for This Month</Text>
                <Calendar
                  onDayPress={(day) => {
                    const today = new Date();
                    const selectedDate = new Date(day.dateString);

                    // Ensure the selected date is in the current month and past the current date
                    if (
                      selectedDate.getMonth() === today.getMonth() &&
                      selectedDate.getFullYear() === today.getFullYear() &&
                      selectedDate > today
                    ) {
                      setSelectedDays((prevSelectedDays) => {
                        if (prevSelectedDays.includes(day.dateString)) {
                          return prevSelectedDays.filter((selectedDay) => selectedDay !== day.dateString);
                        } else {
                          return [...prevSelectedDays, day.dateString];
                        }
                      });
                    } else {
                      Alert.alert(
                        'Invalid Date',
                        'Please select a date from the current month and past today.'
                      );
                    }
                  }}
                  markedDates={selectedDays.reduce((acc, date) => {
                    (acc as Record<string, { selected: boolean; marked: boolean; selectedColor: string }>)[
                      date
                    ] = { selected: true, marked: true, selectedColor: '#fb923c' };
                    return acc;
                  }, {})}
                  theme={{
                    calendarBackground: '#18181b',
                    textSectionTitleColor: '#d1d5db',
                    selectedDayBackgroundColor: '#fb923c',
                    selectedDayTextColor: '#fff',
                    todayTextColor: '#fb923c',
                    dayTextColor: '#d1d5db',
                    arrowColor: '#fb923c',
                    monthTextColor: '#fff',
                  }}
                  hideExtraDays={true} // Hides dates from previous and next months
                  minDate={new Date().toISOString().split('T')[0]} // Restrict dates to today and onward
                />

                {/* Time Sliders for Selected Dates */}
                {selectedDays.map((date) => (
                  <View key={date} style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>Time for {date}</Text>
                    <Text style={styles.timeDisplay}>
                      {timeSlots[dayTimes[date]?.[0] || 0]} - {timeSlots[dayTimes[date]?.[1] || 1]}
                    </Text>
                    <View style={{ alignItems: 'flex-start' }}>
                      <MultiSlider
                        values={dayTimes[date] || [0, 1]}
                        min={0}
                        max={timeSlots.length - 1}
                        step={1}
                        sliderLength={width - 40}
                        onValuesChange={(values) =>
                          setDayTimes((prevDayTimes) => ({
                            ...prevDayTimes,
                            [date]: values as [number, number],
                          }))
                        }
                        selectedStyle={{ backgroundColor: '#fb923c' }}
                        unselectedStyle={{ backgroundColor: '#374151' }}
                        containerStyle={{ marginVertical: 20 }}
                        trackStyle={{ height: 4, borderRadius: 2 }}
                        markerStyle={{
                          backgroundColor: '#fb923c',
                          height: 20,
                          width: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: '#fff',
                        }}
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {currentStep === 3 && (sessionType === 'single' || sessionType === 'recurring') && (
          <>
            {/* Address Field */}
            <Text style={styles.label}>Address (do not enter postal code here)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Address"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={(text) => setAddress(text)}
            />

            {/* Postal Code Input */}
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Postal Code"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={postalCode}
              onChangeText={handlePostalCodeChange}
            />

            {/* Class Type Selection */}
            <Text style={styles.label}>Class Type</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  classType === 'single' && styles.sessionButtonSelected,
                ]}
                onPress={() => setClassType('single')}
              >
                <Text
                  style={
                    classType === 'single'
                      ? styles.sessionButtonTextSelected
                      : styles.sessionButtonText
                  }
                >
                  Single Class
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionButton,
                  classType === 'group' && styles.sessionButtonSelected,
                ]}
                onPress={() => setClassType('group')}
              >
                <Text
                  style={
                    classType === 'group'
                      ? styles.sessionButtonTextSelected
                      : styles.sessionButtonText
                  }
                >
                  Group Class
                </Text>
              </TouchableOpacity>
            </View>

            {/* Group Size Slider */}
            {classType === 'group' && (
              <>
                <Text style={styles.label}>Group Size: {groupSize} students</Text>
                <MultiSlider
                  values={[groupSize]}
                  min={2}
                  max={20}
                  step={1}
                  sliderLength={width - 40}
                  onValuesChange={(values) => setGroupSize(values[0])}
                  selectedStyle={{ backgroundColor: '#fb923c' }}
                  unselectedStyle={{ backgroundColor: '#374151' }}
                  containerStyle={{ marginVertical: 20 }}
                  trackStyle={{ height: 4, borderRadius: 2 }}
                  markerStyle={{
                    backgroundColor: '#fb923c',
                    height: 20,
                    width: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#fff',
                  }}
                />
              </>
            )}
          </>
        )}

        {currentStep === 4 && sessionType === 'single' && (
          <>
            {/* Price Per Session Input */}
            <Text style={styles.label}>Price Per Session ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Price (e.g., 20.00)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={pricePerSession}
              onChangeText={(text) => setPricePerSession(text)}
            />

            {/* Description Input */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100 }]} // Larger text box for description
              placeholder="What can your students expect?"
              placeholderTextColor="#9ca3af"
              multiline
              value={description}
              onChangeText={(text) => setDescription(text)}
            />

            {/* Summary Box */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>Sport: {selectedSport || 'N/A'}</Text>
              <Text style={styles.summaryText}>Session Type: {sessionType}</Text>
              <Text style={styles.summaryText}>
                Age Range: {ageRange[0]} - {ageRange[1]} years
              </Text>
              <Text style={styles.summaryText}>Postal Code: {postalCode || 'N/A'}</Text>
              <Text style={styles.summaryText}>Address: {address || 'N/A'}</Text>
              <Text style={styles.summaryText}>
                Class Type: {classType} {classType === 'group' ? `(Max Students: ${groupSize})` : ''}
              </Text>
              <Text style={styles.summaryText}>Date: {sessionDate || 'N/A'}</Text>
              <Text style={styles.summaryText}>Price Per Session: ${pricePerSession || 'N/A'}</Text>
              <Text style={styles.summaryText}>
                Description: {description || 'No description provided'}
              </Text>
            </View>
          </>
        )}

        {currentStep === 4 && sessionType === 'recurring' && (
          <>
            {frequency === 'weekly' && (
              <>
                <Text style={styles.label}>Price Per Session for Each Day</Text>
                {selectedDays.map((day) => (
                  <View key={day} style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>{day}</Text>
                    <Text style={styles.timeDisplay}>
                      Duration: {formatDuration(calculateDuration(timeSlots[dayTimes[day]?.[0]], timeSlots[dayTimes[day]?.[1]]))}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter Price for ${day}`}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={dayPrices[day] || ''}
                      onChangeText={(text) =>
                        setDayPrices((prevPrices) => ({
                          ...prevPrices,
                          [day]: text,
                        }))
                      }
                    />
                  </View>
                ))}

                {/* Description Box */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 100 }]} // Larger text box for description
                  placeholder="Provide a description for your weekly sessions"
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={description}
                  onChangeText={(text) => setDescription(text)}
                />

                {/* Summary Box */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Weekly Session Summary</Text>
                  <Text style={styles.summaryText}>Sport: {selectedSport || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Session Type: Recurring (Weekly)</Text>
                  <Text style={styles.summaryText}>
                    Age Range: {ageRange[0]} - {ageRange[1]} years
                  </Text>
                  <Text style={styles.summaryText}>Postal Code: {postalCode || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Address: {address || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Class Type: {classType}</Text>
                  {classType === 'group' && (
                    <Text style={styles.summaryText}>Max Students: {groupSize}</Text>
                  )}
                  <Text style={styles.summaryText}>Number of Weeks: {numberOfWeeks}</Text>
                  <Text style={styles.summaryText}>Start Date: {startDate || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Selected Days:</Text>
                  {selectedDays.map((day) => (
                    <Text key={day} style={styles.summaryText}>
                      - {day}: {timeSlots[dayTimes[day]?.[0]]} - {timeSlots[dayTimes[day]?.[1]]}, Price: ${dayPrices[day] || 'N/A'}
                    </Text>
                  ))}
                  <Text style={styles.summaryText}>
                    Description: {description || 'No description provided'}
                  </Text>
                </View>
              </>
            )}

            {frequency === 'monthly' && (
              <>
                <Text style={styles.label}>Price Per Session for Each Date</Text>
                {selectedDays.map((date) => (
                  <View key={date} style={{ marginBottom: 20 }}>
                    <Text style={styles.label}>{date}</Text>
                    <Text style={styles.timeDisplay}>
                      Duration: {formatDuration(calculateDuration(timeSlots[dayTimes[date]?.[0]], timeSlots[dayTimes[date]?.[1]]))}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter Price for ${date}`}
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={datePrices[date] || ''}
                      onChangeText={(text) =>
                        setDatePrices((prevPrices) => ({
                          ...prevPrices,
                          [date]: text,
                        }))
                      }
                    />
                  </View>
                ))}

                {/* Description Box */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 100 }]} // Larger text box for description
                  placeholder="Provide a description for your monthly sessions"
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={description}
                  onChangeText={(text) => setDescription(text)}
                />

                {/* Summary Box */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Monthly Session Summary</Text>
                  <Text style={styles.summaryText}>Sport: {selectedSport || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Session Type: Recurring (Monthly)</Text>
                  <Text style={styles.summaryText}>
                    Age Range: {ageRange[0]} - {ageRange[1]} years
                  </Text>
                  <Text style={styles.summaryText}>Postal Code: {postalCode || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Address: {address || 'N/A'}</Text>
                  <Text style={styles.summaryText}>Class Type: {classType}</Text>
                  {classType === 'group' && (
                    <Text style={styles.summaryText}>Max Students: {groupSize}</Text>
                  )}
                  <Text style={styles.summaryText}>Selected Dates:</Text>
                  {selectedDays.map((date) => (
                    <Text key={date} style={styles.summaryText}>
                      - {date}: {timeSlots[dayTimes[date]?.[0]]} - {timeSlots[dayTimes[date]?.[1]]}, Price: ${datePrices[date] || 'N/A'}
                    </Text>
                  ))}
                  <Text style={styles.summaryText}>
                    Description: {description || 'No description provided'}
                  </Text>
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      

      {/* Navigation Buttons */}
      <View style={styles.bottomButtons}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnGray, styles.navBtnAdjusted]} // Previous button styling
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>
        )}
        {currentStep === 4 ? (
          <TouchableOpacity
            style={[
              styles.navBtn,
              // Validation logic for different session types
              sessionType === 'single' 
                ? (!pricePerSession || !description) ? styles.navBtnDisabled : styles.navBtnOrange
                : sessionType === 'recurring' && frequency === 'weekly'
                ? (!validateWeeklySessionFields()) ? styles.navBtnDisabled : styles.navBtnOrange
                : sessionType === 'recurring' && frequency === 'monthly'
                ? (!validateMonthlySessionFields()) ? styles.navBtnDisabled : styles.navBtnOrange
                : styles.navBtnDisabled, // For other types
            ]}
            onPress={handleCreateSession}
            disabled={
              sessionType === 'single' 
                ? (!pricePerSession || !description)
                : sessionType === 'recurring' && frequency === 'weekly'
                ? (!validateWeeklySessionFields())
                : sessionType === 'recurring' && frequency === 'monthly'
                ? (!validateMonthlySessionFields())
                : true // Disable for other types
            }
          >
            <Text style={[
              styles.navBtnText,
              (sessionType === 'recurring' && (frequency === 'weekly' || frequency === 'monthly')) && styles.navBtnTextLong
            ]}>
              {sessionType === 'single' 
                ? 'Create Session' 
                : sessionType === 'recurring' && frequency === 'weekly'
                ? 'Create Weekly Sessions'
                : sessionType === 'recurring' && frequency === 'monthly'
                ? 'Create Monthly Sessions'
                : 'Create Session'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navBtn,
              currentStep === 1 && (!selectedSport || !sessionType)
                ? styles.navBtnDisabled
                : currentStep === 2 && sessionType === 'single' && (sessionTime[0] === sessionTime[1] || !sessionDate)
                ? styles.navBtnDisabled
                : currentStep === 2 && sessionType === 'recurring' && (
                  (frequency === 'weekly' && (selectedDays.length === 0 || numberOfWeeks <= 0 || !startDate || !validateStartDate(startDate))) ||
                  (frequency === 'monthly' && (selectedDays.length === 0 ))
                )
                ? styles.navBtnDisabled
                : currentStep === 3 && (!address || !postalCode || !classType || (classType === 'group' && groupSize <= 0))
                ? styles.navBtnDisabled
                : styles.navBtnOrange,
              styles.navBtnAdjusted,
            ]}
            onPress={() => {
              if (
                (currentStep === 1 && selectedSport && sessionType && ageRange.length > 0) ||
                (currentStep === 2 && sessionType === 'single' && sessionTime[0] !== sessionTime[1] && sessionDate) ||
                (currentStep === 2 && sessionType === 'recurring' && (
                  (frequency === 'weekly' && selectedDays.length > 0 && numberOfWeeks > 0 && startDate && validateStartDate(startDate)) ||
                  (frequency === 'monthly' && selectedDays.length > 0 )
                )) ||
                (currentStep === 3 && address && postalCode && classType && (classType !== 'group' || groupSize > 0))
              ) {
                setCurrentStep(currentStep + 1); // Navigate to the next step
              }
            }}
            disabled={
              currentStep === 1 && (!selectedSport || !sessionType) ||
              currentStep === 2 && sessionType === 'single' && (sessionTime[0] === sessionTime[1] || !sessionDate) ||
              currentStep === 2 && sessionType === 'recurring' && (
                (frequency === 'weekly' && (selectedDays.length === 0 || numberOfWeeks <= 0 || !startDate || !validateStartDate(startDate))) ||
                (frequency === 'monthly' && (selectedDays.length === 0 ))
              ) ||
              currentStep === 3 && (!address || !postalCode || !classType || (classType === 'group' && groupSize <= 0))
            }
          >
            <Text style={styles.navBtnText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  stageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  stageCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  stageCircleActive: {
    backgroundColor: '#fb923c',
  },
  stageText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stageTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  dropdownButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    marginBottom: 20,
  },
  dropdownButtonText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  sessionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionButtonSelected: {
    backgroundColor: '#fb923c',
  },
  sessionButtonText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  sessionButtonTextSelected: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
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
    marginBottom: 100
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  navBtnTextLong: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  navBtnOrange: {
    backgroundColor: '#fb923c',
  },
  navBtnGray: {
    backgroundColor: '#374151',
  },
  navBtnDisabled: {
    backgroundColor: '#6b7280', // Dimmed color for disabled button
  },
  navBtnAdjusted: {
    position: 'relative',
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: width - 40,
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 20,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalItemText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#fb923c',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  dayButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Increased spacing between buttons
    marginBottom: 20,
    justifyContent: 'flex-start', // Align buttons to the left
  },
  dayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#27272a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Added border for better visibility
    borderColor: '#374151',
    minWidth: 100, // Ensures consistent button size
  },
  dayButtonSelected: {
    backgroundColor: '#fb923c',
    borderColor: '#fb923c', // Matches border color with background
  },
  dayButtonText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500', // Slightly bold text for better readability
  },
  dayButtonTextSelected: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeDisplay: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left', // Align text to the left
  },
  weekDisplay: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left', // Align text to the left
  },
  validateButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#fb923c',
    borderRadius: 8,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CoachCreateSessionPage;



