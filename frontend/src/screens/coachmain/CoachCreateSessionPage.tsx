import React, { useState } from 'react';
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
} from 'react-native';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  MessageSquare,
  ChevronDown,
  Map,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const sports = [
  'Yoga', 'Baseball', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Fitness Training', 'Martial Arts', 'Running', 'Cycling'
];

const ageGroups = [
  'Kids (6-12)', 'Teens (13-17)', 'Adults (18-64)', 'Seniors (65+)', 'All Ages'
];

const locations = [
  'Wellness Studio, 123 Main Street',
  'Sports Complex, 456 Oak Avenue',
  'Community Center, 789 Pine Road',
  'Outdoor Park, 321 Elm Street'
];

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const CoachCreateSessionPage = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    sport: '',
    ageGroup: '',
    sessionType: '', // 'single' or 'recurring'
    groupType: '', // 'group' or 'individual'
    date: '',
    time: '',
    recurringDay: '',
    recurringFrequency: '', // 'weekly' or 'monthly'
    location: '',
    maxStudents: '',
    price: '',
    description: ''
  });

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showAgeDropdown, setShowAgeDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // Handle session creation
    console.log('Creating session:', sessionData);
    setCurrentStep(1);
    setSessionData({
      sport: '', ageGroup: '', sessionType: '', groupType: '',
      date: '', time: '', recurringDay: '', recurringFrequency: '',
      location: '', maxStudents: '', price: '', description: ''
    });
  };

  // Step 1: Session Details
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

      {/* Age Group */}
      <Text style={styles.label}>Age group you're teaching</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowAgeDropdown(true)}
      >
        <Text style={sessionData.ageGroup ? styles.dropdownText : styles.dropdownPlaceholder}>
          {sessionData.ageGroup || 'Select age group'}
        </Text>
        <ChevronDown size={20} color="#9ca3af" />
      </TouchableOpacity>
      <Modal visible={showAgeDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowAgeDropdown(false)}>
          <View style={styles.dropdownModal}>
            <ScrollView>
              {ageGroups.map((age) => (
                <TouchableOpacity
                  key={age}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSessionData({ ...sessionData, ageGroup: age });
                    setShowAgeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{age}</Text>
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
    </View>
  );

  // Step 2: Schedule
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Schedule</Text>
      {sessionData.sessionType === 'single' ? (
        <>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
            value={sessionData.date}
            onChangeText={date => setSessionData({ ...sessionData, date })}
          />
          <Text style={styles.label}>Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#9ca3af"
            value={sessionData.time}
            onChangeText={time => setSessionData({ ...sessionData, time })}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Frequency</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                sessionData.recurringFrequency === 'weekly' && styles.typeButtonActive
              ]}
              onPress={() => setSessionData({ ...sessionData, recurringFrequency: 'weekly' })}
            >
              <Text style={sessionData.recurringFrequency === 'weekly' ? styles.typeButtonTextActive : styles.typeButtonText}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                sessionData.recurringFrequency === 'monthly' && styles.typeButtonActive
              ]}
              onPress={() => setSessionData({ ...sessionData, recurringFrequency: 'monthly' })}
            >
              <Text style={sessionData.recurringFrequency === 'monthly' ? styles.typeButtonTextActive : styles.typeButtonText}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>
            {sessionData.recurringFrequency === 'weekly' ? 'Day of week' : 'Day of month'}
          </Text>
          {sessionData.recurringFrequency === 'weekly' ? (
            <View style={styles.dropdownButton}>
              <ScrollView horizontal>
                {daysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      sessionData.recurringDay === day && styles.dayButtonActive
                    ]}
                    onPress={() => setSessionData({ ...sessionData, recurringDay: day })}
                  >
                    <Text style={sessionData.recurringDay === day ? styles.dayButtonTextActive : styles.dayButtonText}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Day of month (1-31)"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={sessionData.recurringDay}
              onChangeText={val => setSessionData({ ...sessionData, recurringDay: val })}
            />
          )}
          <Text style={styles.label}>Time</Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM"
            placeholderTextColor="#9ca3af"
            value={sessionData.time}
            onChangeText={time => setSessionData({ ...sessionData, time })}
          />
        </>
      )}
    </View>
  );

  // Step 3: Location & Capacity
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Location & Capacity</Text>
      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowLocationModal(true)}
      >
        <Text style={sessionData.location ? styles.dropdownText : styles.dropdownPlaceholder}>
          {sessionData.location || 'Select location'}
        </Text>
        <Map size={20} color="#9ca3af" />
      </TouchableOpacity>
      <Modal visible={showLocationModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowLocationModal(false)}>
          <View style={styles.dropdownModal}>
            <ScrollView>
              {locations.map(location => (
                <TouchableOpacity
                  key={location}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSessionData({ ...sessionData, location });
                    setShowLocationModal(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{location}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.dropdownOption, { backgroundColor: '#374151', marginTop: 8 }]}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.dropdownText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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

      {/* Max Students (only for group sessions) */}
      {sessionData.groupType === 'group' && (
        <>
          <Text style={styles.label}>Maximum students</Text>
          <TextInput
            style={styles.input}
            placeholder="How many students can join?"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={sessionData.maxStudents}
            onChangeText={val => setSessionData({ ...sessionData, maxStudents: val })}
          />
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
          <Text style={styles.summaryValue}>{sessionData.sport}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Age Group:</Text>
          <Text style={styles.summaryValue}>{sessionData.ageGroup}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{sessionData.sessionType} - {sessionData.groupType}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{sessionData.time}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Location:</Text>
          <Text style={styles.summaryValue}>{sessionData.location}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price:</Text>
          <Text style={styles.summaryValue}>${sessionData.price}</Text>
        </View>
      </View>
    </View>
  );

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
            style={[styles.navBtn, styles.navBtnOrange]}
            onPress={currentStep === 4 ? handleSubmit : handleNext}
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
  dayButton: {
    backgroundColor: '#27272a',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: '#fb923c',
    borderColor: '#fb923c',
  },
  dayButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
  },
  dayButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    fontWeight: 'bold',
    fontSize: 15,
  },
  progressCircleTextInactive: {
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 15,
  },
  progressBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  progressBarActive: {
    backgroundColor: '#fb923c',
  },
  progressBarInactive: {
    backgroundColor: '#374151',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16, // Added vertical padding for better spacing
    backgroundColor: '#18181b',
  },
  navBtn: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 0,
  },
  navBtnGray: {
    backgroundColor: '#374151',
    marginRight: 8,
  },
  navBtnOrange: {
    backgroundColor: '#fb923c',
  },
  navBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#27272a',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: 12, // Increased padding
    paddingBottom: Platform.OS === 'ios' ? 20 : 12, // Extra padding for iOS home indicator
  },
  navTabBtn: {
    padding: 10,
    borderRadius: 24,
  },
  navTabBtnActive: {
    backgroundColor: '#fb923c',
  },
  navTabBtnMain: {
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

export default CoachCreateSessionPage;