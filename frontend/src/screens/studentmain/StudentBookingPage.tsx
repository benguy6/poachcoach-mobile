import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import {
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X,
  Clock,
  Users,
  DollarSign,
  Award,
  Calendar,
  FileText,
  MessageCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { studentTabs } from '../../constants/studentTabs';
import BottomNavigation from '../../components/BottomNavigation';
import SelectBookeeModal from '../../components/SelectBookeeModal';
import ChatModal from '../../components/ChatModal';
import PoachCoinIcon from '../../components/PoachCoinIcon';
import { findCoaches, createChatChannel } from '../../services/api';
import { getToken } from '../../services/auth';
import { supabase } from '../../services/supabase';

const { width, height } = Dimensions.get('window');

// Sports list from CoachCreateSessionPage
const sports = [
  'Yoga', 'Baseball', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Fitness Training', 'Martial Arts', 'Running', 'Cycling',
];

// Helper function to determine availability based on start time
const getAvailabilityFromStartTime = (startTime: string): string => {
  const hour = parseInt(startTime.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'all-day';
};

// Density-based visibility function
const getVisibleCoaches = (coaches: any[], mapRegion: any) => {
  const MIN_DISTANCE_THRESHOLD = mapRegion.latitudeDelta * 0.15; // Adjust based on zoom level
  const visibleCoaches: any[] = [];
  const processed = new Set();

  coaches.forEach(coach => {
    if (processed.has(coach.id)) return;

    // Check if any other coaches are too close
    const tooClose = coaches.some(other => {
      if (other.id === coach.id || processed.has(other.id)) return false;
      
      const distance = Math.sqrt(
        Math.pow(coach.location.latitude - other.location.latitude, 2) +
        Math.pow(coach.location.longitude - other.location.longitude, 2)
      );
      
      return distance < MIN_DISTANCE_THRESHOLD;
    });

    if (!tooClose) {
      visibleCoaches.push(coach);
    }
    processed.add(coach.id);
  });

  return visibleCoaches;
};

// Fuzzy search function
const fuzzySearch = (searchTerm: string, targetString: string): number => {
  if (!searchTerm) return 1;
  
  const search = searchTerm.toLowerCase();
  const target = targetString.toLowerCase();
  
  // Exact match gets highest score
  if (target.includes(search)) return 1;
  
  // Calculate fuzzy match score
  let score = 0;
  let searchIndex = 0;
  
  for (let i = 0; i < target.length && searchIndex < search.length; i++) {
    if (target[i] === search[searchIndex]) {
      score++;
      searchIndex++;
    }
  }
  
  return searchIndex === search.length ? score / search.length * 0.8 : 0;
};

// Calculate distance between two coordinates in kilometers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Singapore postal code to coordinates mapping (sample data)
const postalCodeCoordinates = {
  '540101': { latitude: 1.3521, longitude: 103.8198 }, // Toa Payoh
  '560102': { latitude: 1.3541, longitude: 103.8218 }, // Ang Mo Kio
  '730103': { latitude: 1.3561, longitude: 103.8238 }, // Yishun
  '380104': { latitude: 1.3481, longitude: 103.8178 }, // Clementi
  '310105': { latitude: 1.3601, longitude: 103.8258 }, // Sembawang
  '570106': { latitude: 1.3441, longitude: 103.8158 }, // Tampines
};

const getCoordinatesFromPostalCode = (postalCode: string) => {
  return postalCodeCoordinates[postalCode as keyof typeof postalCodeCoordinates] || { latitude: 1.3521, longitude: 103.8198 };
};

interface Props {
  route: {
    params?: {
      bookee?: any;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

const StudentBookingPage = ({ route }: Props) => {
  // const bookee = route?.params?.bookee;

  const [expandedCoach, setExpandedCoach] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 1.3521,
    longitude: 103.8198,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    specialty: string[];
    maxPrice: number;
    minRating: number;
    availability: string[];
    sessionType: string; // 'all', 'individual', 'group'
    maxDistance: string; // 'all', '1', '5', '10'
    gender: string; // 'all', 'Male', 'Female'
  }>({
    specialty: [],
    maxPrice: 200,
    minRating: 0,
    availability: [],
    sessionType: 'all',
    maxDistance: 'all',
    gender: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [sessionDateTime, setSessionDateTime] = useState('2025-06-25T10:00:00'); // Replace with real session time
  const [showBookeeModal, setShowBookeeModal] = useState(false);
  const [bookee, setBookee] = useState<{ name?: string; type: "self" | "child" | "new-child" } | null>(route?.params?.bookee ?? null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [selectedChatChannel, setSelectedChatChannel] = useState<{
    channelId: string;
    coachId: string;
    coachName: string;
  } | null>(null);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [selectedBookingSession, setSelectedBookingSession] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [showWeeklyPaymentChoice, setShowWeeklyPaymentChoice] = useState(false);
  
  // API state
  const [coaches, setCoaches] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query by 300ms
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const applySearchFilters = (customQuery?: string) => {
    const query = customQuery || tempSearchQuery;
    setSearchQuery(query);
    setShowSearch(false);
  };

  // Chat functionality
  const startChatWithCoach = async (coachId: string) => {
    if (!coachId) {
      Alert.alert('Error', 'Coach information not available.');
      return;
    }

    if (isStartingChat) {
      return; // Prevent multiple simultaneous chat starts
    }

    setIsStartingChat(true);
    
    try {
      console.log('🔍 Starting chat with coach:', coachId);
      
      // Get current user session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Not authenticated');
      }

      const studentId = sessionData.session.user.id;
      const token = sessionData.session.access_token;

      console.log('🔍 Student ID:', studentId);
      console.log('🔍 Creating chat channel...');

      // Create or get existing chat channel with proper coach info
      const coachName = selectedSessionDetails?.name || selectedSessionDetails?.coach || 'Coach';
      const channelData = await createChatChannel(token, coachId, studentId, {
        coachName: coachName,
        coachAvatar: selectedSessionDetails?.avatar || selectedSessionDetails?.profilePicture,
        studentName: 'Vansh Puri' // TODO: Get from user context
      });
      
      console.log('🔍 Creating channel with coach info:', {
        coachName,
        coachAvatar: selectedSessionDetails?.avatar || selectedSessionDetails?.profilePicture,
        selectedSessionDetails: selectedSessionDetails
      });
      
      console.log('✅ Chat channel response:', channelData);

      // Close the modal
      setShowSessionDetails(false);
      
      // Navigate to chat page with the channel ID from our function
      const actualChannelId = channelData.channelId || channelData.channel?.id || `s${studentId.substring(0, 8)}c${coachId.substring(0, 8)}`;
      
      console.log('🔍 Navigation Debug - Channel Data:', channelData);
      console.log('🔍 Navigation Debug - Actual Channel ID:', actualChannelId);
      
      // Open chat modal instead of navigating to new page
      setSelectedChatChannel({
        channelId: actualChannelId,
        coachId: coachId,
        coachName: coachName
      });

      const message = channelData.existed 
        ? 'Opening existing chat with this coach!' 
        : 'New chat started! You can now message this coach.';
      
      Alert.alert('Success', message);
      
    } catch (error) {
      console.error('❌ Failed to start chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };

  // Booking functionality
  const handleBookSession = (sessionData: any) => {
    console.log('📅 Opening booking confirmation for session:', sessionData);
    setSelectedBookingSession(sessionData);
    
    if (sessionData.sessionType === 'weekly') {
      // For weekly sessions, show payment choice modal first
      setShowWeeklyPaymentChoice(true);
      setShowSessionDetails(false);
    } else {
      // For single and monthly sessions, go directly to booking confirmation
      setShowBookingConfirmation(true);
      setShowSessionDetails(false);
    }
  };

  const confirmBooking = async (paymentType?: string) => {
    if (!selectedBookingSession || isBooking) return;

    setIsBooking(true);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Not authenticated');
      }

      const token = sessionData.session.access_token;
      const studentId = sessionData.session.user.id;

      let response;
      let requestBody;

      if (selectedBookingSession.sessionType === 'single') {
        // Handle single session booking
        console.log('📅 Booking single session with data:', {
          sessionId: selectedBookingSession.sessionData.unique_id,
          sessionType: selectedBookingSession.sessionType,
          pricePerSession: selectedBookingSession.sessionDetails.pricePerSession
        });

        requestBody = {
          sessionId: selectedBookingSession.sessionData.unique_id,
          sessionType: selectedBookingSession.sessionType,
          pricePerSession: selectedBookingSession.sessionDetails.pricePerSession
        };

        response = await fetch(`http://192.168.88.13:3000/api/student_booking/book-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

      } else if (selectedBookingSession.sessionType === 'monthly') {
        // Handle monthly recurring session booking
        console.log('📅 Booking monthly recurring session with data:', {
          uniqueId: selectedBookingSession.id || selectedBookingSession.sessionData.sessionId,
          sessionId: selectedBookingSession.sessionData.sessionId || selectedBookingSession.id,
          sessionType: selectedBookingSession.sessionType
        });

        requestBody = {
          uniqueId: selectedBookingSession.id || selectedBookingSession.sessionData.sessionId,
          sessionId: selectedBookingSession.sessionData.sessionId || selectedBookingSession.id,
          sessionType: selectedBookingSession.sessionType
        };

        response = await fetch(`http://192.168.88.13:3000/api/student_booking/book-recurring-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

      } else if (selectedBookingSession.sessionType === 'weekly') {
        // Handle weekly recurring session booking
        if (!paymentType) {
          throw new Error('Payment type is required for weekly sessions');
        }

        console.log('📅 Booking weekly recurring session with data:', {
          uniqueId: selectedBookingSession.id || selectedBookingSession.sessionData.sessionId,
          sessionId: selectedBookingSession.sessionData.sessionId || selectedBookingSession.id,
          sessionType: selectedBookingSession.sessionType,
          paymentType: paymentType
        });

        requestBody = {
          uniqueId: selectedBookingSession.id || selectedBookingSession.sessionData.sessionId,
          sessionId: selectedBookingSession.sessionData.sessionId || selectedBookingSession.id,
          sessionType: selectedBookingSession.sessionType,
          paymentType: paymentType
        };

        response = await fetch(`http://192.168.88.13:3000/api/student_booking/book-weekly-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

      } else {
        throw new Error('Unsupported session type');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to book session');
      }

      console.log('✅ Booking successful:', result);
      
      setShowBookingConfirmation(false);
      setShowWeeklyPaymentChoice(false);
      setSelectedBookingSession(null);
      
      Alert.alert(
        'Booking Confirmed!', 
        `Your session has been booked successfully. ${result.message || ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh coaches data to reflect updated session status
              loadCoaches();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Booking failed:', error);
      Alert.alert('Booking Failed', error.message || 'Unable to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  // Handlers for weekly payment choice
  const handleWeeklyPaymentChoice = (paymentType: 'full_package' | 'weekly') => {
    setShowWeeklyPaymentChoice(false);
    confirmBooking(paymentType);
  };
  
  const mapRef = useRef<MapView | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (userLocation) {
      setMapRegion(prev => ({
        ...prev,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }));
      
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    } else if (currentLocation) {
      setMapRegion(prev => ({
        ...prev,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }));
      
      mapRef.current?.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  }, [userLocation, currentLocation]);

  const requestLocationPermission = async () => {
    // For React Native, we'll check if geolocation is available
    if (navigator.geolocation) {
      setHasLocationPermission(true);
      getCurrentLocation();
    } else {
      console.log('Geolocation is not supported by this browser.');
      setHasLocationPermission(false);
    }
  };

  // Updated to use built-in navigator.geolocation
  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
      },
      (error) => {
        console.log('Location error:', error);
        // Fallback to default Singapore location
        setCurrentLocation({ latitude: 1.3521, longitude: 103.8198 });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // Load coaches from API
  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await findCoaches(token);
      const transformedCoaches = transformApiCoachesToUIFormat(response.coaches);
      setCoaches(transformedCoaches);
      
      // Set user location if available
      if (response.currentUser && response.currentUser.location) {
        setUserLocation({
          latitude: response.currentUser.location.latitude,
          longitude: response.currentUser.location.longitude,
          name: response.currentUser.name
        });
      }
    } catch (err: any) {
      console.error('Error loading coaches:', err);
      setError(err.message || 'Failed to load coaches');
    } finally {
      setLoading(false);
    }
  };

  // Transform API coach data to UI format - Create separate cards for each session
  const transformApiCoachesToUIFormat = (apiCoaches: any[]) => {
    const coachCards: any[] = [];
    
    apiCoaches.forEach(coach => {
      // Create cards for single sessions (already filtered by backend for 'published'/'pubcon' status)
      coach.singleSessions.forEach((session: any, index: number) => {
        const availability = getAvailabilityFromStartTime(session.start_time);
        
        coachCards.push({
          id: session.id || `${coach.id}-single-${index}`, // Use actual session id from Sessions table
          coachId: coach.id, // Original coach ID for metadata only
          name: coach.name,
          gender: coach.gender, // Add gender field
          specialty: session.sport || 'General Training',
          rating: coach.rating,
          reviewCount: coach.reviewCount,
          price: Math.round(session.price_per_hour),
          avatar: coach.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
          postalCode: session.postal_code || '540101',
          location: {
            latitude: session.latitude || 1.3521,
            longitude: session.longitude || 103.8198
          },
          certified: coach.qualifications[0]?.name || 'Certified Coach',
          groupSessions: session.max_students > 1,
          availableSlots: session.class_type === 'group' ? session.available_slots : null,
          about: session.description || 'Professional coach with experience.',
          availability: availability,
          sessionType: 'single',
          sessionDetails: {
            location: session.address || 'Location TBD',
            date: session.date,
            startTime: session.start_time,
            endTime: session.end_time,
            classType: session.class_type,
            maxStudents: session.max_students,
            pricePerSession: session.price_per_session,
            pricePerHour: session.price_per_hour,
            duration: session.duration,
            sport: session.sport,
            description: session.description
          },
          address: session.address || 'Singapore',
          postalCodeDetails: session.postal_code || '540101',
          sessionDescription: session.description || 'Professional coaching session.',
          qualifications: coach.qualifications,
          apiData: coach,
          sessionData: session // Store the actual session data
        });
      });

      // Create cards for weekly recurring sessions (backend ensures ALL sessions in group have valid status)
      coach.weeklyRecurringSessions.forEach((weeklyGroup: any, index: number) => {
        // Get the highest price from all sessions in this weekly group
        const maxPricePerHour = Math.round(Math.max(...weeklyGroup.individualSessions.map((s: any) => s.price_per_hour || 0)));
        const firstSession = weeklyGroup.individualSessions[0];
        
        // Check if any session in the group is a group session
        const hasGroupSessions = weeklyGroup.individualSessions.some((session: any) => session.class_type === 'group');
        
        // Determine availability based on the earliest session start time
        const availability = getAvailabilityFromStartTime(firstSession?.start_time || '12:00');
        
        coachCards.push({
          id: weeklyGroup.sessionId || `${coach.id}-weekly-${index}`, // Use sessionId from weekly recurring group
          coachId: coach.id,
          name: coach.name,
          gender: coach.gender, // Add gender field
          specialty: firstSession?.sport || 'General Training',
          rating: coach.rating,
          reviewCount: coach.reviewCount,
          price: maxPricePerHour,
          avatar: coach.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
          postalCode: firstSession?.postal_code || '540101',
          location: {
            latitude: firstSession?.latitude || 1.3521,
            longitude: firstSession?.longitude || 103.8198
          },
          certified: coach.qualifications[0]?.name || 'Certified Coach',
          groupSessions: hasGroupSessions,
          availableSlots: null, // Don't use first session slots for recurring sessions
          about: firstSession?.description || 'Professional coach with experience.',
          availability: availability,
          sessionType: 'weekly',
          sessionDetails: {
            location: firstSession?.address || 'Location TBD',
            schedule: weeklyGroup.individualSessions.map((session: any) => ({
              id: session.id,
              day: session.day,
              date: session.date,
              startTime: session.start_time,
              endTime: session.end_time,
              classType: session.class_type,
              maxStudents: session.max_students,
              availableSlots: session.available_slots,
              pricePerSession: session.price_per_session,
              pricePerHour: session.price_per_hour,
              duration: session.duration,
              sport: session.sport,
              description: session.description
            })),
            recurringMetadata: weeklyGroup.recurringMetadata
          },
          address: firstSession?.address || 'Singapore',
          postalCodeDetails: firstSession?.postal_code || '540101',
          sessionDescription: firstSession?.description || 'Professional coaching session.',
          qualifications: coach.qualifications,
          apiData: coach,
          sessionData: weeklyGroup
        });
      });

      // Create cards for monthly recurring sessions (backend ensures ALL sessions in group have valid status)
      coach.monthlyRecurringSessions.forEach((monthlyGroup: any, index: number) => {
        const maxPricePerHour = Math.round(Math.max(...monthlyGroup.individualSessions.map((s: any) => s.price_per_hour || 0)));
        const firstSession = monthlyGroup.individualSessions[0];
        
        // Check if any session in the group is a group session
        const hasGroupSessions = monthlyGroup.individualSessions.some((session: any) => session.class_type === 'group');
        
        // Determine availability based on the earliest session start time
        const availability = getAvailabilityFromStartTime(firstSession?.start_time || '12:00');
        
        coachCards.push({
          id: monthlyGroup.sessionId || `${coach.id}-monthly-${index}`, // Use sessionId from monthly recurring group
          coachId: coach.id,
          name: coach.name,
          gender: coach.gender, // Add gender field
          specialty: firstSession?.sport || 'General Training',
          rating: coach.rating,
          reviewCount: coach.reviewCount,
          price: maxPricePerHour,
          avatar: coach.avatar || 'https://randomuser.me/api/portraits/men/1.jpg',
          postalCode: firstSession?.postal_code || '540101',
          location: {
            latitude: firstSession?.latitude || 1.3521,
            longitude: firstSession?.longitude || 103.8198
          },
          certified: coach.qualifications[0]?.name || 'Certified Coach',
          groupSessions: hasGroupSessions,
          availableSlots: null, // Don't use first session slots for recurring sessions
          about: firstSession?.description || 'Professional coach with experience.',
          availability: availability,
          sessionType: 'monthly',
          sessionDetails: {
            location: firstSession?.address || 'Location TBD',
            schedule: monthlyGroup.individualSessions.map((session: any) => ({
              id: session.id,
              date: session.date,
              day: session.day,
              startTime: session.start_time,
              endTime: session.end_time,
              classType: session.class_type,
              maxStudents: session.max_students,
              availableSlots: session.available_slots,
              pricePerSession: session.price_per_session,
              pricePerHour: session.price_per_hour,
              duration: session.duration,
              sport: session.sport,
              description: session.description
            })),
            recurringMetadata: monthlyGroup.recurringMetadata
          },
          address: firstSession?.address || 'Singapore',
          postalCodeDetails: firstSession?.postal_code || '540101',
          sessionDescription: firstSession?.description || 'Professional coaching session.',
          qualifications: coach.qualifications,
          apiData: coach,
          sessionData: monthlyGroup
        });
      });
    });

    return coachCards;
  };

  // Load coaches on component mount
  useEffect(() => {
    loadCoaches();
  }, []);

  const nearbyCoaches = coaches; // Use API data instead of dummy data

  // Filter coaches based on applied filters and search
  const getFilteredCoaches = () => {
    return getFilteredCoachesWithFilters(filters);
  };

  // Helper function to get filtered coaches with specific filters
  const getFilteredCoachesWithFilters = (filtersToUse: typeof filters) => {
    let coaches = nearbyCoaches;

    // Apply fuzzy search first
    if (debouncedSearchQuery.trim()) {
      const scoredCoaches = coaches.map(coach => ({
        ...coach,
        score: Math.max(
          fuzzySearch(debouncedSearchQuery, coach.name),
          fuzzySearch(debouncedSearchQuery, coach.specialty) * 0.7
        )
      }));

      coaches = scoredCoaches
        .filter(coach => coach.score > 0)
        .sort((a, b) => b.score - a.score);
    }

    // Apply other filters
    return coaches.filter(coach => {
      const matchesSpecialty =
        filtersToUse.specialty.length === 0 ||
        filtersToUse.specialty.includes(coach.specialty);
      
      const matchesPrice = coach.price <= filtersToUse.maxPrice;
      
      const matchesRating = coach.rating >= filtersToUse.minRating;
      
      const matchesAvailability = filtersToUse.availability.length === 0 || 
        filtersToUse.availability.includes(coach.availability);
      
      const matchesSessionType = filtersToUse.sessionType === 'all' || 
        (filtersToUse.sessionType === 'individual' && !coach.groupSessions) ||
        (filtersToUse.sessionType === 'group' && coach.groupSessions);
      
      const matchesGender = filtersToUse.gender === 'all' || 
        coach.gender === filtersToUse.gender;

      // Distance filter
      const matchesDistance = filtersToUse.maxDistance === 'all' || 
        !userLocation || 
        calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coach.location.latitude,
          coach.location.longitude
        ) <= parseInt(filtersToUse.maxDistance);

      return matchesSpecialty && matchesPrice && 
             matchesRating && matchesAvailability && matchesSessionType && 
             matchesGender && matchesDistance;
    });
  };

  const filteredCoaches = getFilteredCoaches();

  const handleMarkerPress = (coach: any) => {
    setSelectedCoach(coach.id); // Use the unique session card ID
    setExpandedCoach(coach.id); // Use the unique session card ID
    
    mapRef.current?.animateToRegion({
      latitude: coach.location.latitude,
      longitude: coach.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);

    setTimeout(() => {
      const coachIndex = filteredCoaches.findIndex(c => c.id === coach.id);
      scrollViewRef.current?.scrollTo({
        y: 350 + (coachIndex * 200),
        animated: true,
      });
    }, 500);
  };

  const handleCoachCardPress = (coach: any) => {
    setExpandedCoach(expandedCoach === coach.id ? null : coach.id); // Use unique session card ID
    setSelectedCoach(coach.id); // Use unique session card ID
    
    mapRef.current?.animateToRegion({
      latitude: coach.location.latitude,
      longitude: coach.location.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 1000);
  };

  const clearFilters = () => {
    setFilters({
      specialty: [],
      maxPrice: 200,
      minRating: 0,
      availability: [],
      sessionType: 'all',
      maxDistance: 'all',
      gender: 'all',
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    // Note: The actual filtering logic will be handled by the new handleApplyFilters function
    // This function is kept for compatibility with any existing code
  };

  interface BookingDetails {
    coachName: string;
    sessionType: string;
    sessionDate: string;
    sessionTime: string;
    pricePerSession: number;
    // Add more fields if needed
  }

  const handleBookingConfirm = (bookingDetails: BookingDetails) => {
    // Ensure pricePerSession is a valid number
    const validatedBookingDetails = {
      ...bookingDetails,
      pricePerSession: typeof bookingDetails.pricePerSession === 'number' && !isNaN(bookingDetails.pricePerSession) 
        ? bookingDetails.pricePerSession 
        : 0
    };
    
    console.log('Booking details being passed:', validatedBookingDetails);
    
    (navigation as any).navigate("StudentConfirmPayment", validatedBookingDetails);
  };

  const FilterModal = () => {
    // Temporary state to hold filter changes until Apply is pressed
    const [tempFilters, setTempFilters] = useState(filters);
    const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
    
    // Update temp filters when modal opens
    useEffect(() => {
      if (showFilters) {
        setTempFilters(filters);
      }
    }, [showFilters, filters]);

    const handleAvailabilityToggle = (option: string) => {
      const newAvailability = tempFilters.availability.includes(option)
        ? tempFilters.availability.filter(a => a !== option)
        : [...tempFilters.availability, option];
      setTempFilters({...tempFilters, availability: newAvailability});
    };

    const handleSpecialtyToggle = (specialty: string) => {
      const newSpecialty = tempFilters.specialty.includes(specialty)
        ? tempFilters.specialty.filter(s => s !== specialty)
        : [...tempFilters.specialty, specialty];
      setTempFilters({...tempFilters, specialty: newSpecialty});
    };

    const handleApplyFilters = () => {
      setFilters(tempFilters);
      setShowFilters(false);
      
      // Adjust map view to show filtered coaches after a short delay
      // to allow the filtering to take effect
      setTimeout(() => {
        const updatedFilteredCoaches = getFilteredCoachesWithFilters(tempFilters);
        if (updatedFilteredCoaches.length > 0) {
          const coords = updatedFilteredCoaches.map(coach => coach.location);
          // Calculate bounds to fit all filtered coaches
          const minLat = Math.min(...coords.map(c => c.latitude));
          const maxLat = Math.max(...coords.map(c => c.latitude));
          const minLng = Math.min(...coords.map(c => c.longitude));
          const maxLng = Math.max(...coords.map(c => c.longitude));
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const deltaLat = (maxLat - minLat) * 1.5;
          const deltaLng = (maxLng - minLng) * 1.5;
          
          mapRef.current?.animateToRegion({
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(deltaLat, 0.02),
            longitudeDelta: Math.max(deltaLng, 0.02),
          }, 1000);
        }
      }, 100);
    };

    const handleCloseModal = () => {
      setShowFilters(false);
      setShowSpecialtyDropdown(false);
      // Reset temp filters to current filters when closing without applying
      setTempFilters(filters);
    };

    const handleClearFilters = () => {
      const clearedFilters = {
        specialty: [],
        maxPrice: 200,
        minRating: 0,
        availability: [],
        sessionType: 'all',
        maxDistance: 'all',
        gender: 'all',
      };
      setTempFilters(clearedFilters);
    };

    return (
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            {/* Specialty Dropdown */}
            <View style={[styles.filterSection, { zIndex: 1000 }]}>
              <Text style={styles.filterSectionTitle}>Specialty</Text>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {tempFilters.specialty.length > 0 
                      ? `${tempFilters.specialty.length} selected` 
                      : 'Select sports'}
                  </Text>
                  <ChevronDown size={16} color="#6b7280" />
                </TouchableOpacity>
                
                {showSpecialtyDropdown && (
                  <>
                    <TouchableOpacity 
                      style={styles.dropdownBackdrop}
                      onPress={() => setShowSpecialtyDropdown(false)}
                      activeOpacity={1}
                    />
                    <ScrollView style={styles.dropdownContent} nestedScrollEnabled>
                      {sports.map(sport => (
                        <TouchableOpacity
                          key={sport}
                          style={[
                            styles.dropdownItem,
                            tempFilters.specialty.includes(sport) && styles.selectedDropdownItem
                          ]}
                          onPress={() => handleSpecialtyToggle(sport)}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            tempFilters.specialty.includes(sport) && styles.selectedDropdownItemText
                          ]}>
                            {sport}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            </View>

            {/* Max Price Slider */}
            <View style={[styles.filterSection, { zIndex: 999 }]}>
              <Text style={styles.filterSectionTitle}>Max Price: ${tempFilters.maxPrice}/hour</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>$5</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={200}
                  value={tempFilters.maxPrice}
                  onValueChange={(value) => setTempFilters({...tempFilters, maxPrice: Math.round(value)})}
                  minimumTrackTintColor="#fb923c"
                  maximumTrackTintColor="#374151"
                />
                <Text style={styles.sliderLabel}>$200</Text>
              </View>
            </View>

            {/* Minimum Rating Slider */}
            <View style={[styles.filterSection, { zIndex: 998 }]}>
              <Text style={styles.filterSectionTitle}>
                Minimum Rating: {tempFilters.minRating === 0 ? 'Any' : `${tempFilters.minRating.toFixed(1)}+ ⭐`}
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>0</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={5}
                  value={tempFilters.minRating}
                  onValueChange={(value) => setTempFilters({...tempFilters, minRating: Math.round(value * 10) / 10})}
                  minimumTrackTintColor="#fb923c"
                  maximumTrackTintColor="#374151"
                />
                <Text style={styles.sliderLabel}>5</Text>
              </View>
            </View>

            {/* Availability Multi-Select */}
            <View style={[styles.filterSection, { zIndex: 997 }]}>
              <Text style={styles.filterSectionTitle}>Availability (Select multiple)</Text>
              <View style={styles.filterButtonsContainer}>
                {[
                  { key: 'morning', label: 'Morning' },
                  { key: 'afternoon', label: 'Afternoon' },
                  { key: 'evening', label: 'Evening' },
                  { key: 'all-day', label: 'All Day' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalFilterButton,
                      tempFilters.availability.includes(option.key) && styles.selectedFilterButton
                    ]}
                    onPress={() => handleAvailabilityToggle(option.key)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      tempFilters.availability.includes(option.key) && styles.selectedFilterButtonText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Session Type */}
            <View style={[styles.filterSection, { zIndex: 996 }]}>
              <Text style={styles.filterSectionTitle}>Session Type</Text>
              <View style={styles.filterButtonsContainer}>
                {[
                  { key: 'all', label: 'All Sessions' },
                  { key: 'individual', label: 'Individual Only' },
                  { key: 'group', label: 'Group Only' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalFilterButton,
                      styles.wideFilterButton,
                      tempFilters.sessionType === option.key && styles.selectedFilterButton
                    ]}
                    onPress={() => setTempFilters({...tempFilters, sessionType: option.key})}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      tempFilters.sessionType === option.key && styles.selectedFilterButtonText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={[styles.filterSection, { zIndex: 995 }]}>
              <Text style={styles.filterSectionTitle}>Distance</Text>
              <View style={styles.filterButtonsContainer}>
                {[
                  { key: 'all', label: 'Any Distance' },
                  { key: '1', label: 'Within 1km' },
                  { key: '5', label: 'Within 5km' },
                  { key: '10', label: 'Within 10km' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalFilterButton,
                      styles.wideFilterButton,
                      tempFilters.maxDistance === option.key && styles.selectedFilterButton
                    ]}
                    onPress={() => setTempFilters({...tempFilters, maxDistance: option.key})}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      tempFilters.maxDistance === option.key && styles.selectedFilterButtonText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Gender */}
            <View style={[styles.filterSection, { zIndex: 994 }]}>
              <Text style={styles.filterSectionTitle}>Gender</Text>
              <View style={styles.filterButtonsContainer}>
                {[
                  { key: 'all', label: 'All Genders' },
                  { key: 'Male', label: 'Male Only' },
                  { key: 'Female', label: 'Female Only' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalFilterButton,
                      styles.wideFilterButton,
                      tempFilters.gender === option.key && styles.selectedFilterButton
                    ]}
                    onPress={() => setTempFilters({...tempFilters, gender: option.key})}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      tempFilters.gender === option.key && styles.selectedFilterButtonText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // --- Modified SearchModal ---
  const SearchModal = () => (
    <Modal
      visible={showSearch}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.searchModal}>
        <View style={styles.searchHeader}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search coaches, specialties..."
            value={tempSearchQuery}
            onChangeText={setTempSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => applySearchFilters()}
            style={{ marginLeft: 12 }}
          >
            <Text style={{ color: '#f97316', fontWeight: '600', fontSize: 16 }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const specialties = Array.from(new Set(nearbyCoaches.map(c => c.specialty)));

  function handleTabPress(tabId: string): void {
    // Navigate to the selected tab's screen
    switch (tabId) {
      case 'StudentHome':
        (navigation as any).navigate('StudentHomePage');
        break;
      case 'StudentCalendar':
        (navigation as any).navigate('StudentCalendarPage');
        break;
      case 'StudentBooking':
        // Already on booking page
        break;
      case 'StudentChat':
        (navigation as any).navigate('StudentChat');
        break;
      case 'StudentWallet':
        (navigation as any).navigate('StudentWalletPage');
        break;
    }
  }

  const renderSessionDetailsModal = () => {
    if (!selectedSessionDetails) return null;

    const renderScheduleInfo = () => {
      switch (selectedSessionDetails.sessionType) {
        case 'single':
          return (
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Calendar size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Date & Time</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  {new Date(selectedSessionDetails.sessionDetails.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.modalDetailSubtext}>
                  {selectedSessionDetails.sessionDetails.startTime} - {selectedSessionDetails.sessionDetails.endTime}
                </Text>
              </View>
            </View>
          );
        case 'weekly':
          return (
            <>
              <View style={styles.modalCard}>
                <View style={styles.modalCardHeader}>
                  <Calendar size={20} color="#3b82f6" />
                  <Text style={styles.modalCardTitle}>Weekly Schedule</Text>
                </View>
                <View style={styles.modalCardContent}>
                  {selectedSessionDetails.sessionDetails.schedule?.map((item: any, index: number) => (
                    <View key={index} style={styles.scheduleItemModal}>
                      <Text style={styles.modalDetailText}>{item.day}</Text>
                      <Text style={styles.modalDetailSubtext}>
                        {item.startTime} - {item.endTime}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Weekly Session Metadata */}
              {selectedSessionDetails.apiData?.weeklyRecurringSessions?.length > 0 && (
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <Calendar size={20} color="#10b981" />
                    <Text style={styles.modalCardTitle}>Session Details</Text>
                  </View>
                  <View style={styles.modalCardContent}>
                    {selectedSessionDetails.apiData.weeklyRecurringSessions[0].recurringMetadata && (
                      <>
                        <View style={styles.scheduleItemModal}>
                          <Text style={styles.modalDetailText}>Start Date:</Text>
                          <Text style={styles.modalDetailSubtext}>
                            {new Date(selectedSessionDetails.apiData.weeklyRecurringSessions[0].recurringMetadata.start_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                        <View style={styles.scheduleItemModal}>
                          <Text style={styles.modalDetailText}>Duration:</Text>
                          <Text style={styles.modalDetailSubtext}>
                            {selectedSessionDetails.apiData.weeklyRecurringSessions[0].recurringMetadata.number_of_weeks} weeks
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}
            </>
          );
        case 'monthly':
          return (
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Calendar size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Monthly Schedule</Text>
              </View>
              <View style={styles.modalCardContent}>
                {selectedSessionDetails.sessionDetails.schedule?.map((item: any, index: number) => (
                  <View key={index} style={styles.scheduleItemModal}>
                    <Text style={styles.modalDetailText}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.modalDetailSubtext}>
                      {item.startTime} - {item.endTime}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <Modal
        visible={showSessionDetails}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSessionDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Details</Text>
            <TouchableOpacity
              onPress={() => setShowSessionDetails(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Coach Profile Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Users size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Coach Profile</Text>
              </View>
              <View style={styles.modalCardContent}>
                <View style={styles.coachProfileRow}>
                  <Image
                    source={{ uri: selectedSessionDetails.avatar }}
                    style={styles.modalCoachAvatar}
                  />
                  <View style={styles.coachInfoModal}>
                    <Text style={styles.modalCoachName}>{selectedSessionDetails.name}</Text>
                    <Text style={styles.modalCoachSpecialty}>{selectedSessionDetails.specialty}</Text>
                    <View style={styles.ratingRowModal}>
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.modalRatingText}>
                        {selectedSessionDetails.rating} ({selectedSessionDetails.reviewCount} reviews)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Date & Time Card */}
            {renderScheduleInfo()}

            {/* Class Type Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Users size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Class Type</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>
                  {selectedSessionDetails.groupSessions ? 'Group Class' : 'Individual Class'}
                </Text>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <MapPin size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Location</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDetailText}>{selectedSessionDetails.sessionDetails.location}</Text>
                <Text style={styles.modalDetailSubtext}>{selectedSessionDetails.address}</Text>
                <Text style={styles.modalDetailSubtext}>Postal Code: {selectedSessionDetails.postalCodeDetails}</Text>
              </View>
            </View>

            {/* Prices Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <DollarSign size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Prices</Text>
              </View>
              <View style={styles.modalCardContent}>
                {selectedSessionDetails.sessionType === 'single' && (
                  <View style={styles.priceItemModal}>
                    <Text style={styles.modalDetailText}>
                      {new Date(selectedSessionDetails.sessionDetails.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })} - {selectedSessionDetails.sessionDetails.startTime}
                    </Text>
                    <View style={styles.priceRowModal}>
                      <Text style={styles.modalPriceText}>${Math.round(selectedSessionDetails.sessionDetails.pricePerSession)}/session</Text>
                      <Text style={styles.modalPriceSubtext}>${Math.round(selectedSessionDetails.sessionDetails.pricePerHour)}/hour</Text>
                    </View>
                  </View>
                )}
                
                {selectedSessionDetails.sessionType === 'weekly' && (
                  <>
                    {selectedSessionDetails.apiData?.weeklyRecurringSessions?.[0]?.individualSessions?.map((session: any, index: number) => (
                      <View key={index} style={styles.priceItemModal}>
                        <Text style={styles.modalDetailText}>
                          {session.day} - {session.start_time}
                        </Text>
                        <View style={styles.priceRowModal}>
                          <Text style={styles.modalPriceText}>${Math.round(session.price_per_session)}/session</Text>
                          <Text style={styles.modalPriceSubtext}>${Math.round(session.price_per_hour)}/hour</Text>
                        </View>
                        {session.class_type === 'group' && session.available_slots !== null && (
                          <Text style={styles.modalDetailSubtext}>
                            {session.available_slots} slots available
                          </Text>
                        )}
                      </View>
                    ))}
                  </>
                )}
                
                {selectedSessionDetails.sessionType === 'monthly' && (
                  <>
                    {selectedSessionDetails.apiData?.monthlyRecurringSessions?.[0]?.individualSessions?.map((session: any, index: number) => (
                      <View key={index} style={styles.priceItemModal}>
                        <Text style={styles.modalDetailText}>
                          {new Date(session.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })} - {session.start_time}
                        </Text>
                        <View style={styles.priceRowModal}>
                          <Text style={styles.modalPriceText}>${Math.round(session.price_per_session)}/session</Text>
                          <Text style={styles.modalPriceSubtext}>${Math.round(session.price_per_hour)}/hour</Text>
                        </View>
                        {session.class_type === 'group' && session.available_slots !== null && (
                          <Text style={styles.modalDetailSubtext}>
                            {session.available_slots} slots available
                          </Text>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <FileText size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Session Description</Text>
              </View>
              <View style={styles.modalCardContent}>
                <Text style={styles.modalDescriptionText}>{selectedSessionDetails.sessionDescription}</Text>
              </View>
            </View>

            {/* Qualifications Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Award size={20} color="#3b82f6" />
                <Text style={styles.modalCardTitle}>Qualifications</Text>
              </View>
              <View style={styles.modalCardContent}>
                {selectedSessionDetails.qualifications?.map((qualification: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.qualificationItem}
                    onPress={() => Linking.openURL(qualification.url)}
                  >
                    <FileText size={16} color="#3b82f6" />
                    <Text style={styles.qualificationText}>{qualification.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionButtons}>
              <TouchableOpacity 
                style={[styles.chatFirstButtonHalf, isStartingChat && styles.chatFirstButtonDisabled]}
                onPress={() => startChatWithCoach(selectedSessionDetails?.coachId)}
                disabled={isStartingChat}
              >
                <MessageCircle size={20} color="white" />
                <Text style={styles.chatFirstButtonText}>
                  {isStartingChat ? 'Starting...' : 'Chat First'}
                </Text>
              </TouchableOpacity>
              
              {(selectedSessionDetails.sessionType === 'single' || selectedSessionDetails.sessionType === 'monthly' || selectedSessionDetails.sessionType === 'weekly') && (
                <TouchableOpacity 
                  style={[styles.bookNowButtonHalf, isBooking && styles.bookNowButtonDisabled]}
                  onPress={() => handleBookSession(selectedSessionDetails)}
                  disabled={isBooking}
                >
                  <Calendar size={20} color="white" />
                  <Text style={styles.bookNowButtonText}>
                    {isBooking ? 'Booking...' : 'Book Now'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Booking Confirmation Modal
  const renderBookingConfirmationModal = () => {
    if (!selectedBookingSession) return null;

    // Convert SGD to PC (exchange rate: 1 SGD = 5 PC)
    const exchangeRate = 5;
    let priceInSGD;
    let numberOfSessions = 1;
    let packageType = '';

    if (selectedBookingSession.sessionType === 'single') {
      // For single sessions
      priceInSGD = selectedBookingSession.sessionDetails.pricePerSession || selectedBookingSession.price;
    } else if (selectedBookingSession.sessionType === 'monthly') {
      // For monthly packages - sum all sessions in the package
      const monthlySessions = selectedBookingSession.sessionData?.individualSessions || 
                             selectedBookingSession.sessionDetails?.schedule || [];
      
      priceInSGD = monthlySessions.reduce((total: number, session: any) => {
        return total + (parseFloat(session.price_per_session || session.pricePerSession) || 0);
      }, 0);
      
      numberOfSessions = monthlySessions.length;
      packageType = 'monthly';
    } else {
      // Fallback for other session types
      priceInSGD = selectedBookingSession.sessionDetails.pricePerSession || selectedBookingSession.price;
    }

    const priceInPC = Math.round(priceInSGD * exchangeRate);

    return (
      <Modal
        visible={showBookingConfirmation}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingConfirmation(false)}
      >
        <View style={styles.bookingModalOverlay}>
          <View style={styles.bookingModalContainer}>
            <View style={styles.bookingModalHeader}>
              <Text style={styles.bookingModalTitle}>Confirm Booking</Text>
              <TouchableOpacity
                onPress={() => setShowBookingConfirmation(false)}
                style={styles.bookingModalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.bookingModalContent}>
              {/* Warning Message */}
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Please double-check all session details before confirming your booking.
                </Text>
              </View>

              {/* Cost Card - Simplified */}
              <View style={styles.costCard}>
                {packageType === 'monthly' ? (
                  <>
                    <Text style={styles.costTitle}>
                      Monthly Package
                    </Text>
                    <Text style={styles.costSessionCount}>
                      {numberOfSessions} sessions included
                    </Text>
                    <View style={styles.costPriceRow}>
                      <View style={styles.poachCoinRow}>
                        <PoachCoinIcon size={24} />
                        <Text style={styles.costAmount}>{priceInPC} PC</Text>
                      </View>
                    </View>
                    <Text style={styles.costSubtext}>
                      ${priceInSGD.toFixed(2)} SGD total for all sessions
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.costHeader}>
                      <Text style={styles.costTitle}>Total Cost</Text>
                      <View style={styles.poachCoinRow}>
                        <PoachCoinIcon size={20} />
                        <Text style={styles.costAmount}>{priceInPC} PC</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.bookingModalActions}>
              <TouchableOpacity
                style={styles.cancelBookingButton}
                onPress={() => setShowBookingConfirmation(false)}
                disabled={isBooking}
              >
                <Text style={styles.cancelBookingButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmBookingButton, isBooking && styles.confirmBookingButtonDisabled]}
                onPress={() => confirmBooking()}
                disabled={isBooking}
              >
                <Text style={styles.confirmBookingButtonText}>
                  {isBooking ? 'Processing...' : 'Confirm Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Weekly Payment Choice Modal
  const renderWeeklyPaymentChoiceModal = () => {
    if (!selectedBookingSession || selectedBookingSession.sessionType !== 'weekly') return null;

    // Calculate costs for display
    const exchangeRate = 5;
    const weeklySessions = selectedBookingSession.sessionData?.individualSessions || 
                          selectedBookingSession.sessionDetails?.schedule || [];
    
    // Calculate full package cost
    const fullPackageCostSGD = weeklySessions.reduce((total: number, session: any) => {
      return total + (parseFloat(session.price_per_session || session.pricePerSession) || 0);
    }, 0);
    const fullPackageCostPC = Math.round(fullPackageCostSGD * exchangeRate);

    // Calculate first week cost (first 7 days from start)
    const recurringMetadata = selectedBookingSession.sessionData?.recurringMetadata;
    const startDate = recurringMetadata?.start_date ? new Date(recurringMetadata.start_date) : new Date();
    const oneWeekLater = new Date(startDate);
    oneWeekLater.setDate(startDate.getDate() + 7);

    const firstWeekSessions = weeklySessions.filter((session: any) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate < oneWeekLater;
    });
    
    const firstWeekCostSGD = firstWeekSessions.reduce((total: number, session: any) => {
      return total + (parseFloat(session.price_per_session || session.pricePerSession) || 0);
    }, 0);
    const firstWeekCostPC = Math.round(firstWeekCostSGD * exchangeRate);

    return (
      <Modal
        visible={showWeeklyPaymentChoice}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWeeklyPaymentChoice(false)}
      >
        <View style={styles.weeklyPaymentModalOverlay}>
          <View style={styles.weeklyPaymentModalContainer}>
            <View style={styles.weeklyPaymentModalHeader}>
              <Text style={styles.weeklyPaymentModalTitle}>Choose Payment Option</Text>
              <TouchableOpacity
                onPress={() => setShowWeeklyPaymentChoice(false)}
                style={styles.weeklyPaymentModalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.weeklyPaymentModalContent}>
              <Text style={styles.weeklyPaymentDescription}>
                How would you like to pay for this weekly package?
              </Text>

              {/* Full Package Option */}
              <TouchableOpacity
                style={styles.paymentOptionCard}
                onPress={() => handleWeeklyPaymentChoice('full_package')}
                disabled={isBooking}
              >
                <View style={styles.paymentOptionHeader}>
                  <Text style={styles.paymentOptionTitle}>Pay For Full Package</Text>
                  <View style={styles.paymentOptionPrice}>
                    <PoachCoinIcon size={20} />
                    <Text style={styles.paymentOptionPriceText}>{fullPackageCostPC} PC</Text>
                  </View>
                </View>
                <Text style={styles.paymentOptionDescription}>
                  Pay ${fullPackageCostSGD.toFixed(2)} SGD for all {weeklySessions.length} sessions upfront
                </Text>
                <Text style={styles.paymentOptionBenefit}>
                  ✅ All sessions confirmed • No future payments needed
                </Text>
              </TouchableOpacity>

              {/* Weekly Option */}
              <TouchableOpacity
                style={styles.paymentOptionCard}
                onPress={() => handleWeeklyPaymentChoice('weekly')}
                disabled={isBooking}
              >
                <View style={styles.paymentOptionHeader}>
                  <Text style={styles.paymentOptionTitle}>Pay For First Week</Text>
                  <View style={styles.paymentOptionPrice}>
                    <PoachCoinIcon size={20} />
                    <Text style={styles.paymentOptionPriceText}>{firstWeekCostPC} PC</Text>
                  </View>
                </View>
                <Text style={styles.paymentOptionDescription}>
                  Pay ${firstWeekCostSGD.toFixed(2)} SGD for the first week ({firstWeekSessions.length} sessions)
                </Text>
                <Text style={styles.paymentOptionNote}>
                  💡 Remaining sessions will be marked as unpaid
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay 
        visible={loading} 
        message="Finding coaches near you..." 
      />
      
      <View style={styles.headerFlat}>
        <Text style={styles.tagline}>
          <Text style={styles.taglinePoach}>Poach</Text>
          <Text style={styles.taglineA}> a </Text>
          <Text style={styles.taglineCoach}>Coach</Text>
          <Text style={styles.taglineNow}> Now</Text>
        </Text>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBarWrapper}>
            <Search size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBarInput}
              value={searchQuery}
              placeholder="Search coaches by name..."
              onChangeText={setSearchQuery}
              placeholderTextColor="#6b7280"
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={styles.filterButton}
          >
            <Filter size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {debouncedSearchQuery && (
          <View style={styles.searchInfo}>
            <Text style={styles.searchInfoText}>
              {filteredCoaches.length} coaches found for "{debouncedSearchQuery}"
            </Text>
          </View>
        )}
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            showsUserLocation={hasLocationPermission}
            showsMyLocationButton={false}
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            
            {getVisibleCoaches(filteredCoaches, mapRegion).map(coach => (
              <Marker
                key={coach.id}
                coordinate={coach.location}
                onPress={() => handleMarkerPress(coach)}
              >
                <View style={[
                  styles.airbnbMarker,
                  selectedCoach === coach.id && styles.selectedAirbnbMarker
                ]}>
                  <Text style={[
                    styles.airbnbMarkerText,
                    selectedCoach === coach.id && styles.selectedAirbnbMarkerText
                  ]}>
                    ${coach.price}
                  </Text>
                </View>
              </Marker>
            ))}
            
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                }}
                title="Your Location"
                description={userLocation.name}
              >
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                </View>
              </Marker>
            )}
          </MapView>
          
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={styles.mapControlButton}
              onPress={() => {
                const targetRegion = userLocation ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                } : currentLocation ? {
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                } : {
                  latitude: 1.3521,
                  longitude: 103.8198,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                };
                
                mapRef.current?.animateToRegion(targetRegion, 1000);
              }}
            >
              <Text style={styles.mapControlText}>
                {userLocation || currentLocation ? '📍 My Location' : '🔄 Reset'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.coachesContainer}>
          <View style={styles.coachesList}>
            {loading ? (
              <View style={styles.coachCard}>
                <Text style={styles.coachName}>Loading coaches...</Text>
              </View>
            ) : error ? (
              <View style={styles.coachCard}>
                <Text style={styles.coachName}>{error}</Text>
                <TouchableOpacity style={styles.bookButton} onPress={loadCoaches}>
                  <Text style={styles.bookButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredCoaches.length === 0 ? (
              <View style={styles.coachCard}>
                <Text style={styles.coachName}>No coaches found</Text>
                <Text style={styles.coachSpecialty}>Try adjusting your search or filters</Text>
              </View>
            ) : (
              filteredCoaches.map(coach => (
              <View key={coach.id} style={[
                styles.coachCard,
                selectedCoach === coach.id && styles.selectedCoachCard
              ]}>
                <TouchableOpacity 
                  style={styles.coachHeader}
                  onPress={() => handleCoachCardPress(coach)}
                >
                  <Image source={{ uri: coach.avatar }} style={styles.coachAvatar} />
                  <View style={styles.coachInfo}>
                    <Text style={styles.coachName}>{coach.name}</Text>
                    <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
                    <View style={styles.coachRating}>
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingText}>
                        {coach.rating} ({coach.reviewCount})
                      </Text>
                    </View>
                    {coach.groupSessions && coach.availableSlots !== null && (
                      <Text style={styles.availableSlotsText}>
                        {coach.availableSlots} slots available
                      </Text>
                    )}
                  </View>
                  <View style={styles.coachPriceContainer}>
                    <Text style={styles.coachPrice}>${Math.round(coach.price)}/hr</Text>
                    {coach.groupSessions && (
                      <View style={styles.groupBadge}>
                        <Users size={12} color="#10b981" />
                        <Text style={styles.groupBadgeText}>Group</Text>
                      </View>
                    )}
                    {expandedCoach === coach.id ? 
                      <ChevronUp size={20} color="#6b7280" style={styles.chevron} /> : 
                      <ChevronDown size={20} color="#6b7280" style={styles.chevron} />
                    }
                  </View>
                </TouchableOpacity>
                
                {expandedCoach === coach.id && (
                  <View style={styles.expandedContent}>
                    {/* Session Details Based on Coach's Session Type */}
                    <View style={styles.sessionDetailsSection}>
                      {coach.sessionType === 'single' && (
                        <View style={styles.singleSessionCard}>
                          <View style={styles.sessionCardHeader}>
                            <MapPin size={16} color="#f97316" />
                            <Text style={styles.sessionCardTitle}>Single Session</Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Type:</Text>
                            <Text style={styles.sessionDetailValue}>
                              {coach.sessionDetails.classType === 'group' ? 'Group Class' : 'Individual Class'}
                              {coach.sessionDetails.classType === 'group' && coach.availableSlots && (
                                <Text style={styles.availableSlotsText}> - {coach.availableSlots} slots available</Text>
                              )}
                            </Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Location:</Text>
                            <Text style={styles.sessionDetailValue}>{coach.sessionDetails.location}</Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Date:</Text>
                            <Text style={styles.sessionDetailValue}>
                              {new Date(coach.sessionDetails.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Time:</Text>
                            <Text style={styles.sessionDetailValue}>
                              {coach.sessionDetails.startTime} - {coach.sessionDetails.endTime}
                            </Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Price:</Text>
                            <Text style={styles.sessionDetailValue}>
                              ${Math.round(coach.sessionDetails.pricePerSession)}/session (${Math.round(coach.sessionDetails.pricePerHour)}/hour)
                            </Text>
                          </View>
                        </View>
                      )}

                      {coach.sessionType === 'weekly' && (
                        <View style={styles.weeklySessionCard}>
                          <View style={styles.sessionCardHeader}>
                            <Clock size={16} color="#10b981" />
                            <Text style={styles.sessionCardTitle}>Weekly Recurring</Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Location:</Text>
                            <Text style={styles.sessionDetailValue}>
                              {coach.sessionDetails.location}
                            </Text>
                          </View>
                          <View style={styles.weeklyScheduleContainer}>
                            <Text style={styles.sessionDetailLabel}>Schedule:</Text>
                            <View style={styles.scheduleList}>
                              {coach.sessionDetails.schedule && coach.sessionDetails.schedule.map((session: any, index: number) => (
                                <View key={index} style={styles.scheduleItem}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                      <View style={styles.dayChip}>
                                        <Text style={styles.dayChipText}>{session.day}</Text>
                                      </View>
                                      <Text style={[styles.scheduleTime, { marginLeft: 12 }]}>
                                        {session.startTime} - {session.endTime}
                                      </Text>
                                    </View>
                                    {session.classType === 'group' && session.availableSlots !== null && (
                                      <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                        <Text style={{ fontSize: 11, color: '#0277bd', fontWeight: '600' }}>
                                          {session.availableSlots} slots
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}

                      {coach.sessionType === 'monthly' && (
                        <View style={styles.monthlySessionCard}>
                          <View style={styles.sessionCardHeader}>
                            <Award size={16} color="#8b5cf6" />
                            <Text style={styles.sessionCardTitle}>Monthly Package</Text>
                          </View>
                          <View style={styles.sessionDetailRow}>
                            <Text style={styles.sessionDetailLabel}>Location:</Text>
                            <Text style={styles.sessionDetailValue}>
                              {coach.sessionDetails.location}
                            </Text>
                          </View>
                          <View style={styles.monthlyScheduleContainer}>
                            <Text style={styles.sessionDetailLabel}>Schedule:</Text>
                            <View style={styles.scheduleList}>
                              {coach.sessionDetails.schedule && coach.sessionDetails.schedule.map((session: any, index: number) => (
                                <View key={index} style={styles.scheduleItem}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                      <View style={styles.dateChip}>
                                        <Text style={styles.dateChipText}>
                                          {new Date(session.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </Text>
                                      </View>
                                      <Text style={[styles.scheduleTime, { marginLeft: 12 }]}>
                                        {session.startTime} - {session.endTime}
                                      </Text>
                                    </View>
                                    {session.classType === 'group' && session.availableSlots !== null && (
                                      <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                        <Text style={{ fontSize: 11, color: '#7c3aed', fontWeight: '600' }}>
                                          {session.availableSlots} slots
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.fullWidthButton}
                        onPress={() => {
                          setSelectedSessionDetails(coach);
                          setShowSessionDetails(true);
                        }}
                      >
                        <Text style={styles.chatButtonText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
            )}
          </View>
        </View>
      </ScrollView>

      <FilterModal />
      <SearchModal />
      {/* CancelClassModal removed - cancellation functionality disabled */}
      <SelectBookeeModal
        visible={showBookeeModal}
        userName="Vansh"
        children={[{ name: "Aanya" }]} // Replace with dynamic children later
        onClose={() => setShowBookeeModal(false)}
        onSelect={(selected) => {
          setBookee(selected);
          setShowBookeeModal(false);
          // You can navigate or update state as needed
          // navigation.navigate('BookingPage', { bookee: selected });
        }}
      />
      
      {/* Session Details Modal */}
      {renderSessionDetailsModal()}
      
      {/* Booking Confirmation Modal */}
      {renderBookingConfirmationModal()}
      
      {/* Weekly Payment Choice Modal */}
      {renderWeeklyPaymentChoiceModal()}
      
      <BottomNavigation
        activeTab="StudentBooking"
        onTabPress={handleTabPress}
        tabs={studentTabs}
      />
      
      {/* Chat Modal */}
      <ChatModal
        visible={!!selectedChatChannel}
        onClose={() => setSelectedChatChannel(null)}
        channelId={selectedChatChannel?.channelId}
        chatPartnerName={selectedChatChannel?.coachName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316', // your app's orange
  },
  headerFlat: {
    backgroundColor: '#f97316',
    paddingBottom: 16,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  taglinePoach: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  taglineA: {
    color: '#fed7aa',
    fontWeight: '400',
    fontSize: 28,
  },
  taglineCoach: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  taglineNow: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 30,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInfo: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  searchInfoText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    opacity: 0.9,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  activeFilterButton: {
    backgroundColor: '#fed7aa',
  },
  scrollContainer: {
    flex: 1,
  },
  mapContainer: {
    height: 350,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  mapControlButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapControlText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // Airbnb-style marker
  airbnbMarker: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedAirbnbMarker: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  airbnbMarkerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  selectedAirbnbMarkerText: {
    color: '#ffffff',
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  coachesContainer: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  coachCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  coachesList: {
    gap: 16,
  },
  coachCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCoachCard: {
    borderWidth: 2,
    borderColor: '#f97316',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  coachSpecialty: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  coachRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  certificationText: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '500',
  },
  availableSlotsText: {
    fontSize: 12,
    color: '#f97316',
    marginTop: 4,
    fontWeight: '500',
  },
  coachPriceContainer: {
    alignItems: 'flex-end',
  },
  coachPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f97316',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    color: '#10b981',
    marginLeft: 2,
    fontWeight: '500',
  },
  chevron: {
    marginTop: 8,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  aboutSection: {
    marginBottom: 16,
  },
  sectionSubHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
  },
  slotsSection: {
    marginBottom: 16,
  },
  timeSlots: {
    flexDirection: 'row',
    gap: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fdba74',
    marginRight: 8,
  },
  timeSlotText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#f97316',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  fullWidthButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  filterModal: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  selectedRatingButton: {
    backgroundColor: '#f97316',
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedRatingButtonText: {
    color: 'white',
  },
  availabilityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  selectedAvailabilityButton: {
    backgroundColor: '#f97316',
  },
  availabilityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedAvailabilityButtonText: {
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#d5d5db',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchModal: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    fontSize: 16,
  },
  bookingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 10,
  },
  specialtyTabs: {
    marginTop: 12,
  },
  specialtyTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  specialtyTabActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  specialtyTabText: {
    fontSize: 14,
    color: '#374151',
  },
  specialtyTabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Session Type Styles
  sessionTypeSection: {
    marginBottom: 16,
  },
  sessionTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedSessionTypeButton: {
    backgroundColor: '#f97316',
  },
  sessionTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedSessionTypeButtonText: {
    color: 'white',
  },
  // Session Details Styles
  sessionDetailsSection: {
    marginBottom: 16,
  },
  singleSessionCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  weeklySessionCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  monthlySessionCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  sessionDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 80,
  },
  sessionDetailValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  dayChip: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayChipText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  datesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  dateChip: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateChipText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  // Schedule Styles
  weeklyScheduleContainer: {
    marginBottom: 8,
  },
  monthlyScheduleContainer: {
    marginBottom: 8,
  },
  scheduleList: {
    flex: 1,
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  modalCardContent: {
    gap: 8,
  },
  modalDetailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalDetailSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  scheduleItemModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
  },
  coachProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCoachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  coachInfoModal: {
    flex: 1,
  },
  modalCoachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCoachSpecialty: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  ratingRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modalRatingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  modalPriceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316',
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 8,
  },
  qualificationText: {
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 8,
    fontWeight: '500',
  },
  chatFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  chatFirstButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  chatFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  chatFirstButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookNowButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  priceItemModal: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  priceRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  modalPriceSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Distance Filter Styles
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedDistanceButton: {
    backgroundColor: '#f97316',
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDistanceButtonText: {
    color: 'white',
  },
  
  // Gender Filter Styles
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedGenderButton: {
    backgroundColor: '#f97316',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedGenderButtonText: {
    color: 'white',
  },
  
  // New styles for updated filter modal
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dropdownContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
    marginBottom: 16,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedDropdownItem: {
    backgroundColor: '#fef3c7',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDropdownItemText: {
    color: '#f97316',
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#6b7280',
    minWidth: 30,
    textAlign: 'center',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modalFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wideFilterButton: {
    minWidth: 100,
  },
  selectedFilterButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  selectedFilterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Booking Modal Styles
  bookingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bookingModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bookingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  bookingModalCloseButton: {
    padding: 4,
  },
  bookingModalContent: {
    padding: 20,
    maxHeight: 400,
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  bookingSummaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bookingSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  costCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  costSessionCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 8,
  },
  costPriceRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  poachCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poachCoinIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  costAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f97316',
  },
  costSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  bookingModalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  cancelBookingButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmBookingButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f97316',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBookingButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  confirmBookingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bookNowButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  // Weekly Payment Choice Modal Styles
  weeklyPaymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  weeklyPaymentModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  weeklyPaymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  weeklyPaymentModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  weeklyPaymentModalCloseButton: {
    padding: 8,
  },
  weeklyPaymentModalContent: {
    padding: 20,
  },
  weeklyPaymentDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentOptionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  paymentOptionPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentOptionPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f97316',
    marginLeft: 4,
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  paymentOptionBenefit: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  paymentOptionNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

export default StudentBookingPage;