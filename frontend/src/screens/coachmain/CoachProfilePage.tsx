import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  User,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Target,
  Award,
  Settings,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture, getCoachProfile, deleteProfilePicture } from '../../services/api';
import { supabase } from '../../services/supabase';

const DEFAULT_PROFILE_PIC = 'https://via.placeholder.com/72/999999/FFFFFF?text=Profile';

type CoachProfilePageProps = {
  onProfilePicChange?: (url: string) => void;
};

const CoachProfilePage: React.FC<CoachProfilePageProps> = ({ onProfilePicChange }) => {
  const [profilePic, setProfilePic] = useState<string>(DEFAULT_PROFILE_PIC);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoachProfile = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error('No access token found');
        }

        const data = await getCoachProfile(token);
        setCoachProfile(data);
        setProfilePic(data.user.profilePicture || DEFAULT_PROFILE_PIC);
      } catch (error) {
        console.error('Failed to fetch coach profile:', error);
        alert('Failed to load coach profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCoachProfile();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const uploadedUrl = await uploadProfilePicture(result.assets[0].uri);
        setProfilePic(uploadedUrl);
        if (onProfilePicChange) {
          onProfilePicChange(uploadedUrl);
        }
      } catch (e) {
        console.error('Upload error:', e);
        alert('Failed to upload image');
      }
    }
  };

  const handleDeleteImage = async () => {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No access token found');
      }

      await deleteProfilePicture(token);
      setProfilePic(DEFAULT_PROFILE_PIC);
      if (onProfilePicChange) {
        onProfilePicChange(DEFAULT_PROFILE_PIC);
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Coach Profile</Text>
        </View>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profilePic }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Camera size={16} color="white" />
            </TouchableOpacity>
            {profilePic !== DEFAULT_PROFILE_PIC && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteImage}>
                <Trash2 size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{coachProfile?.user.name || 'Name not provided'}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="white" />
              <Text style={styles.location}>{coachProfile?.user.address || 'Address not provided'}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Classes Taught" value={coachProfile?.sessions.length || 0} />
          <StatCard label="Achievements" value={coachProfile?.achievements.length || 0} />
          <StatCard label="Avg Rating" value={coachProfile?.coach.averageRating || '5.0'} />
        </View>
        {/* About Section */}
        <InfoCard icon={<User size={16} color="white" />} title="About">
          <InfoRow icon={<Mail size={14} color="white" />} text={coachProfile?.user.email || 'Email not provided'} />
          <InfoRow icon={<Phone size={14} color="white" />} text={coachProfile?.user.number || 'Phone not provided'} />
          <InfoRow icon={<Calendar size={14} color="white" />} text={`Joined ${coachProfile?.user.dateJoined || 'Date not available'}`} />
        </InfoCard>
        <InfoCard icon={<Target size={16} color="white" />} title="Sport">
          <Text style={styles.paragraph}>{coachProfile?.coach.sport || 'Sport not provided'}</Text>
        </InfoCard>
        <InfoCard icon={<Award size={16} color="white" />} title="Recent Achievements">
          {coachProfile?.achievements.length > 0 ? (
            coachProfile.achievements.map((ach: any) => (
              <View key={ach.id} style={styles.achievementRow}>
                <View style={styles.achievementIcon}>
                  <Text style={{ fontSize: 16 }}>🏆</Text>
                </View>
                <View>
                  <Text style={styles.achievementTitle}>{ach.achievement}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.paragraph}>No achievements yet</Text>
          )}
        </InfoCard>
      </View>
    </ScrollView>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.infoCard}>
    <View style={styles.cardTitle}>
      {icon}
      <Text style={styles.cardTitleText}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <View style={styles.infoRow}>
    <View>{icon}</View>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
  loadingText: {
    color: '#fb923c',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#18181b',
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fb923c',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fb923c',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fb923c',
    padding: 6,
    borderRadius: 20,
    elevation: 2,
  },
  deleteButton: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 20,
    elevation: 2,
  },
  profileText: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
  },
  body: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center', // Added to centralize content
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fb923c',
    textAlign: 'center', // Ensures text is centered
  },
  statLabel: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center', // Ensures text is centered
  },
  infoCard: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#fb923c',
  },
  paragraph: {
    color: '#d1d5db',
    fontSize: 14,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#d1d5db',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default CoachProfilePage;
