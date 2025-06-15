import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const BookingPage = () => {
  const [expandedCoach, setExpandedCoach] = useState<number | null>(null);

  const nearbyCoaches = [
    {
      id: 1,
      name: 'Sarah Johnson',
      specialty: 'Yoga & Meditation',
      rating: 4.9,
      distance: '0.5 km',
      price: '$45/hour',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      location: { lat: 1.3521, lng: 103.8198 }
    },
    {
      id: 2,
      name: 'Michael Chen',
      specialty: 'Pilates & Core Training',
      rating: 4.8,
      distance: '1.2 km',
      price: '$50/hour',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      location: { lat: 1.3541, lng: 103.8218 }
    },
    {
      id: 3,
      name: 'Coach Shreyas',
      specialty: 'Cricket Training',
      rating: 4.7,
      distance: '2.1 km',
      price: '$40/hour',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      location: { lat: 1.3561, lng: 103.8238 }
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapContainer}>
        <View style={styles.mapOverlay}>
          <MapPin size={48} color="#2563eb" style={styles.mapIcon} />
          <Text style={styles.mapTitle}>Interactive Map</Text>
          <Text style={styles.mapSubtitle}>Coaches near Sengkang</Text>
        </View>
        
        {/* Sample pins */}
        <View style={[styles.mapPin, { top: 80, left: 64 }]}>
          <Text style={styles.mapPinText}>1</Text>
        </View>
        <View style={[styles.mapPin, { top: 128, right: 80 }]}>
          <Text style={styles.mapPinText}>2</Text>
        </View>
        <View style={[styles.mapPin, { bottom: 64, left: '33%' }]}>
          <Text style={styles.mapPinText}>3</Text>
        </View>
      </View>

      {/* Coaches List */}
      <View style={styles.coachesContainer}>
        <Text style={styles.sectionTitle}>Nearby Coaches</Text>
        <View style={styles.coachesList}>
          {nearbyCoaches.map(coach => (
            <View key={coach.id} style={styles.coachCard}>
              <TouchableOpacity 
                style={styles.coachHeader}
                onPress={() => setExpandedCoach(expandedCoach === coach.id ? null : coach.id)}
              >
                <Image source={{ uri: coach.avatar }} style={styles.coachAvatar} />
                <View style={styles.coachInfo}>
                  <Text style={styles.coachName}>{coach.name}</Text>
                  <Text style={styles.coachSpecialty}>{coach.specialty}</Text>
                  <View style={styles.coachRating}>
                    <Star size={16} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.ratingText}>{coach.rating} • {coach.distance}</Text>
                  </View>
                </View>
                <View style={styles.coachPriceContainer}>
                  <Text style={styles.coachPrice}>{coach.price}</Text>
                  {expandedCoach === coach.id ? 
                    <ChevronUp size={20} color="#6b7280" style={styles.chevron} /> : 
                    <ChevronDown size={20} color="#6b7280" style={styles.chevron} />
                  }
                </View>
              </TouchableOpacity>
              
              {expandedCoach === coach.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.aboutSection}>
                    <Text style={styles.sectionHeader}>About</Text>
                    <Text style={styles.aboutText}>
                      Experienced {coach.specialty.toLowerCase()} instructor with 5+ years of experience. 
                      Specialized in helping beginners and intermediate students achieve their fitness goals.
                    </Text>
                  </View>
                  
                  <View style={styles.slotsSection}>
                    <Text style={styles.sectionHeader}>Available Slots</Text>
                    <View style={styles.timeSlots}>
                      {['9:00 AM', '10:30 AM', '2:00 PM', '4:30 PM'].map(time => (
                        <View key={time} style={styles.timeSlot}>
                          <Text style={styles.timeSlotText}>{time}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.bookButton}>
                      <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.chatButton}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  mapContainer: {
    height: 256,
    backgroundColor: '#bfdbfe',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    alignItems: 'center',
  },
  mapIcon: {
    marginBottom: 8,
  },
  mapTitle: {
    color: '#1e40af',
    fontWeight: '500',
    fontSize: 16,
  },
  mapSubtitle: {
    color: '#2563eb',
    fontSize: 14,
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: '#f97316',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPinText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coachesContainer: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  coachesList: {
    gap: 16,
  },
  coachCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
  },
  coachSpecialty: {
    fontSize: 14,
    color: '#6b7280',
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
  coachPriceContainer: {
    alignItems: 'flex-end',
  },
  coachPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ea580c',
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  slotsSection: {
    marginBottom: 16,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#fed7aa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timeSlotText: {
    color: '#c2410c',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  chatButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BookingPage;