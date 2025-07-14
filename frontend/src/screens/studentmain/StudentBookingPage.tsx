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
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import CancelClassModal from '../../components/CancelClassModal';
import { studentTabs } from '../../constants/studentTabs';
import BottomNavigation from '../../components/BottomNavigation';
import SelectBookeeModal from '../../components/SelectBookeeModal';

const { width, height } = Dimensions.get('window');

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
    maxPrice: string;
    minRating: string;
    availability: string;
    groupSessions: boolean;
    certification: string;
  }>({
    specialty: [],
    maxPrice: '',
    minRating: '',
    availability: '',
    groupSessions: false,
    certification: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [sessionDateTime, setSessionDateTime] = useState('2025-06-25T10:00:00'); // Replace with real session time
  const [showBookeeModal, setShowBookeeModal] = useState(false);
  const [bookee, setBookee] = useState<{ name?: string; type: "self" | "child" | "new-child" } | null>(route?.params?.bookee ?? null);

  const applySearchFilters = (customQuery?: string) => {
    const query = customQuery || tempSearchQuery;
    setSearchQuery(query);
    setShowSearch(false);
  };
  
  const mapRef = useRef<MapView | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentLocation) {
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
  }, [currentLocation]);

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

  const nearbyCoaches = [
    {
      id: 1,
      name: 'Sarah Johnson',
      specialty: 'Yoga & Meditation',
      rating: 4.9,
      reviewCount: 245,
      price: 45,
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      postalCode: '540101',
      location: getCoordinatesFromPostalCode('540101'),
      certified: 'RYT-500 Certified',
      groupSessions: true,
      availableSlots: ['9:00 AM', '10:30 AM', '2:00 PM', '4:30 PM'],
      about: 'Experienced yoga and meditation instructor with 8+ years of experience.',
      availability: 'morning'
    },
    {
      id: 2,
      name: 'Michael Chen',
      specialty: 'Pilates & Core Training',
      rating: 4.8,
      reviewCount: 189,
      price: 50,
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      postalCode: '560102',
      location: getCoordinatesFromPostalCode('560102'),
      certified: 'NASM Certified',
      groupSessions: true,
      availableSlots: ['8:00 AM', '11:00 AM', '3:00 PM', '6:00 PM'],
      about: 'Certified Pilates instructor focusing on core strength and rehabilitation.',
      availability: 'all-day'
    },
    {
      id: 3,
      name: 'Coach Shreyas',
      specialty: 'Cricket Training',
      rating: 4.7,
      reviewCount: 156,
      price: 40,
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      postalCode: '730103',
      location: getCoordinatesFromPostalCode('730103'),
      certified: 'Level 2 Cricket Coach',
      groupSessions: true,
      availableSlots: ['7:00 AM', '9:00 AM', '4:00 PM', '6:30 PM'],
      about: 'Professional cricket coach with 10+ years experience.',
      availability: 'evening'
    },
    {
      id: 4,
      name: 'Emma Wong',
      specialty: 'Personal Training',
      rating: 4.9,
      reviewCount: 203,
      price: 60,
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      postalCode: '380104',
      location: getCoordinatesFromPostalCode('380104'),
      certified: 'ACSM Certified',
      groupSessions: false,
      availableSlots: ['6:00 AM', '10:00 AM', '2:00 PM', '7:00 PM'],
      about: 'Specialized in weight training and body transformation.',
      availability: 'morning'
    },
    {
      id: 5,
      name: 'David Lim',
      specialty: 'Swimming',
      rating: 4.6,
      reviewCount: 134,
      price: 55,
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
      postalCode: '310105',
      location: getCoordinatesFromPostalCode('310105'),
      certified: 'Water Safety Instructor',
      groupSessions: true,
      availableSlots: ['7:30 AM', '12:00 PM', '4:00 PM', '6:00 PM'],
      about: 'Former competitive swimmer, now teaching all levels.',
      availability: 'afternoon'
    }
  ];

  // Filter coaches based on applied filters
  const getFilteredCoaches = () => {
    return nearbyCoaches.filter(coach => {
      const matchesSearch = searchQuery === '' || 
        coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty =
        filters.specialty.length === 0 ||
        filters.specialty.includes(coach.specialty);
      
      const matchesPrice = filters.maxPrice === '' || 
        coach.price <= parseInt(filters.maxPrice);
      
      const matchesRating = filters.minRating === '' || 
        coach.rating >= parseFloat(filters.minRating);
      
      const matchesAvailability = filters.availability === '' || 
        coach.availability === filters.availability;
      
      const matchesGroupSessions = !filters.groupSessions || 
        coach.groupSessions === filters.groupSessions;
      
      const matchesCertification = filters.certification === '' || 
        coach.certified.toLowerCase().includes(filters.certification.toLowerCase());

      return matchesSearch && matchesSpecialty && matchesPrice && 
             matchesRating && matchesAvailability && matchesGroupSessions && 
             matchesCertification;
    });
  };

  const filteredCoaches = getFilteredCoaches();

  const handleMarkerPress = (coach) => {
    setSelectedCoach(coach.id);
    setExpandedCoach(coach.id);
    
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

  const handleCoachCardPress = (coach) => {
    setExpandedCoach(expandedCoach === coach.id ? null : coach.id);
    setSelectedCoach(coach.id);
    
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
      maxPrice: '',
      minRating: '',
      availability: '',
      groupSessions: false,
      certification: '',
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    // Optionally adjust map view to show filtered coaches
    if (filteredCoaches.length > 0) {
      const coords = filteredCoaches.map(coach => coach.location);
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
    (navigation as any).navigate("StudentConfirmPayment", {
      ...bookingDetails,
      // Make sure to include all required params:
      // coachName, sessionType, sessionDate, sessionTime, pricePerSession, etc.
    });
  };

  const FilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.filterContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Specialty</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="e.g., Yoga, Pilates, Cricket"
              value={filters.specialty.join(', ')}
              onChangeText={(text) => setFilters({...filters, specialty: text.split(',').map(t => t.trim())})}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Max Price ($/hour)</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="e.g., 50"
              value={filters.maxPrice}
              onChangeText={(text) => setFilters({...filters, maxPrice: text})}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingButtons}>
              {[4.0, 4.5, 4.8].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    filters.minRating === rating.toString() && styles.selectedRatingButton
                  ]}
                  onPress={() => setFilters({...filters, minRating: rating.toString()})}
                >
                  <Text style={[
                    styles.ratingButtonText,
                    filters.minRating === rating.toString() && styles.selectedRatingButtonText
                  ]}>
                    {rating}+ ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Availability</Text>
            <View style={styles.availabilityButtons}>
              {[
                { key: 'morning', label: 'Morning' },
                { key: 'afternoon', label: 'Afternoon' },
                { key: 'evening', label: 'Evening' },
                { key: 'all-day', label: 'All Day' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.availabilityButton,
                    filters.availability === option.key && styles.selectedAvailabilityButton
                  ]}
                  onPress={() => setFilters({...filters, availability: 
                    filters.availability === option.key ? '' : option.key})}
                >
                  <Text style={[
                    styles.availabilityButtonText,
                    filters.availability === option.key && styles.selectedAvailabilityButtonText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setFilters({...filters, groupSessions: !filters.groupSessions})}
            >
              <View style={[styles.checkbox, filters.groupSessions && styles.checkedCheckbox]}>
                {filters.groupSessions && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Group Sessions Available</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Certification</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="e.g., NASM, RYT, Level 2"
              value={filters.certification}
              onChangeText={(text) => setFilters({...filters, certification: text})}
            />
          </View>
        </ScrollView>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
    const tab = studentTabs.find(t => t.id === tabId);
    if (tab && tab.screen) {
      (navigation as any).navigate(tab.screen);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerFlat}>
        <Text style={styles.pageTitle}>Book session now</Text>

        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBarInput}
            value={tempSearchQuery}
            placeholder="Search coaches, filters apply here..."
            onChangeText={setTempSearchQuery}
          />
          <TouchableOpacity onPress={() => applySearchFilters()} style={styles.searchBarButton}>
            <Search size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              const filterSummary = Object.entries(filters)
                .filter(([k, v]) =>
                  (typeof v === 'string' && v.length !== 0) ||
                  (Array.isArray(v) && v.length !== 0) ||
                  (typeof v === 'boolean' && v === true)
                )
                .map(([k, v]) => Array.isArray(v) ? `${k}:${v.join(',')}` : `${k}:${v}`)
                .join(' ');
              setTempSearchQuery(filterSummary);
              setShowFilters(true);
            }}
            style={styles.filterIcon}
          >
            <Filter size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.specialtyTabs}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {specialties.map((spec) => {
              const isSelected = filters.specialty.includes(spec);
              return (
                <TouchableOpacity
                  key={spec}
                  style={[styles.specialtyTab, isSelected && styles.specialtyTabActive]}
                  onPress={() => {
                    const updatedList = isSelected
                      ? filters.specialty.filter(s => s !== spec)
                      : [...filters.specialty, spec];
                    const updatedFilters = { ...filters, specialty: updatedList };
                    setFilters(updatedFilters);
                    const encoded = Object.entries(updatedFilters)
                      .filter(([k, v]) => v && v.length !== 0 && v !== false)
                      .map(([k, v]) => Array.isArray(v) ? `${k}:${v.join(',')}` : `${k}:${v}`)
                      .join(' ');
                    setTempSearchQuery(encoded);
                    applySearchFilters(encoded);
                  }}
                >
                  <Text style={[styles.specialtyTabText, isSelected && styles.specialtyTabTextActive]}>
                    {spec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
            
            {filteredCoaches.map(coach => (
              <Marker
                key={coach.id}
                coordinate={coach.location}
                onPress={() => handleMarkerPress(coach)}
              >
                <View style={[
                  styles.airbnbMarker,
                  selectedCoach === coach.id && styles.selectedAirbnbMarker
                ]}>
                  <Text style={styles.airbnbMarkerText}>${coach.price}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={styles.mapControlButton}
              onPress={() => {
                const targetRegion = currentLocation ? {
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
                {currentLocation ? '📍 My Location' : '🔄 Reset'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.coachesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filteredCoaches.length === nearbyCoaches.length ? 'Nearby Coaches' : 'Filtered Results'}
            </Text>
            <Text style={styles.coachCount}>{filteredCoaches.length} found</Text>
          </View>
          
          <View style={styles.coachesList}>
            {filteredCoaches.map(coach => (
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
                    <Text style={styles.certificationText}>{coach.certified}</Text>
                  </View>
                  <View style={styles.coachPriceContainer}>
                    <Text style={styles.coachPrice}>${coach.price}/hr</Text>
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
                    <View style={styles.aboutSection}>
                      <Text style={styles.sectionSubHeader}>About</Text>
                      <Text style={styles.aboutText}>{coach.about}</Text>
                    </View>
                    
                    <View style={styles.slotsSection}>
                      <Text style={styles.sectionSubHeader}>Available Today</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.timeSlots}>
                          {coach.availableSlots.map(time => (
                            <TouchableOpacity key={time} style={styles.timeSlot}>
                              <Clock size={14} color="#f97316" />
                              <Text style={styles.timeSlotText}>{time}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={() => handleBookingConfirm({
                          coachName: coach.name,
                          sessionType: coach.specialty,
                          sessionDate: new Date().toLocaleDateString(),
                          sessionTime: coach.availableSlots[0],
                          pricePerSession: coach.price,
                        })}
                      >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.chatButton}
                        onPress={() => Alert.alert('Start Chat', `Chat with ${coach.name}?`)}
                      >
                        <Text style={styles.chatButtonText}>Chat First</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <FilterModal />
      <SearchModal />
      <CancelClassModal
        visible={showCancelModal}
        reason={cancelReason}
        onChangeReason={setCancelReason}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          console.log('Reason:', cancelReason);
          setShowCancelModal(false);
          // Add your cancellation logic here (API call, etc.)
        }}
        sessionDateTime={sessionDateTime}
      />
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
      <BottomNavigation
        activeTab="StudentBooking"
        onTabPress={handleTabPress}
        tabs={studentTabs}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f97316', // your app's orange
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
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  airbnbMarkerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
  headerFlat: {
    backgroundColor: '#f97316',
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 14,
  },
  searchBarButton: {
    backgroundColor: '#f97316',
    padding: 10,
    borderRadius: 12,
  },
  filterIcon: {
    padding: 8,
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
});

export default StudentBookingPage;
