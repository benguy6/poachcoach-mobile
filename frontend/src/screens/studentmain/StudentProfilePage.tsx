import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Target,
  Bookmark,
  Award,
  Settings,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture, getStudentProfile, deleteProfilePicture } from '../../services/api'; // Adjust path as needed
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase'; 

const DEFAULT_PROFILE_PIC = 'https://via.placeholder.com/72/999999/FFFFFF?text=Profile';

type Achievement = {
  id: string | number;
  achievement: string;
};

type UserProfile = {
  name: string;
  location: string;
  totalClasses: number;
  email: string;
  number: string;
  joinDate: string;
  goals: string;
  favouriteActivities: string[];
  profilePicture?: string;
  address?: string;
};

type ProfilePageProps = {
  onSettings: () => void;
};

type StudentProfilePageRouteParams = {
  onProfilePicChange?: (url: string) => void;
};

const StudentProfilePage: React.FC<ProfilePageProps> = ({ onSettings }) => {
  const [profilePic, setProfilePic] = useState<string>(DEFAULT_PROFILE_PIC);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute<RouteProp<{ params: StudentProfilePageRouteParams }, 'params'>>();
  const navigation = useNavigation();
  const onProfilePicChange = route.params?.onProfilePicChange;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('No access token found');

        const data = await getStudentProfile(accessToken);

        console.log('Frontend Response Object:', data); // Log the response object

        setUserProfile({
          name: data.user.name,
          location: data.user.postalCode || 'Location not provided',
          totalClasses: data.sessions.length,
          email: data.user.email,
          number: data.user.number || 'Phone not provided',
          joinDate: data.user.dateJoined || 'Date not available', // Ensure this matches the backend field
          goals: data.user.goals || 'No goals set',
          favouriteActivities: data.studentProfile.favouriteActivities || [],
          profilePicture: data.user.profilePicture,
          address: data.user.address || 'Address not provided',
        });

        setAchievements(data.achievements || []);
        setProfilePic(data.user.profilePicture || DEFAULT_PROFILE_PIC);
      } catch (error) {
        console.error('Failed to fetch student profile:', error);
        alert('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
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
          console.log('Profile picture updated:', uploadedUrl); // Debugging log
          onProfilePicChange(uploadedUrl); // Invoke the callback to update the dashboard
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
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.iconButton} onPress={onSettings}>
            <Settings size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profilePic }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Camera size={16} color="#333" />
            </TouchableOpacity>
            {profilePic !== DEFAULT_PROFILE_PIC && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteImage}>
                <Trash2 size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{userProfile?.name || 'Name not provided'}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#fff" />
              <Text style={styles.location}>{userProfile?.address || 'Address not provided'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Classes Taken" value={userProfile?.totalClasses || 0} />
          <StatCard label="Achievements" value={achievements.length || 0} />
        </View>

        <InfoCard icon={<User size={16} />} title="About">
          <InfoRow icon={<Mail size={14} />} text={userProfile?.email || 'Email not provided'} />
          <InfoRow icon={<Phone size={14} />} text={userProfile?.number || 'Phone not provided'} />
          <InfoRow icon={<Calendar size={14} />} text={`Joined ${userProfile?.joinDate || 'Date not available'}`} />
        </InfoCard>

        <InfoCard icon={<Target size={16} />} title="Goals">
          <Text style={styles.paragraph}>
            {userProfile?.goals || 'No goals set'}
          </Text>
        </InfoCard>

        <InfoCard icon={<Bookmark size={16} />} title="Favorite Activities">
          {(userProfile?.favouriteActivities ?? []).length > 0 ? (
            <View style={styles.tags}>
              {userProfile?.favouriteActivities?.map((act) => (
                <Text key={act} style={styles.tag}>
                  {act}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.paragraph}>No favorite activities listed</Text>
          )}
        </InfoCard>

        <InfoCard icon={<Award size={16} />} title="Recent Achievements">
          {achievements.length > 0 ? (
            achievements.map((ach) => (
              <View key={ach.id} style={styles.achievementRow}>
                <View style={styles.achievementIcon}>
                  <Text style={{ fontSize: 16 }}>{ach.achievement}</Text>
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
      <View>{icon}</View>
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#F97316',
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
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
    borderColor: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F97316',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: 'white',
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
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  paragraph: {
    color: '#4B5563',
    fontSize: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FFEAD0',
    color: '#F97316',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 12,
    marginRight: 8,
    marginBottom: 8,
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
    backgroundColor: '#FFEAD0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementTitle: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default StudentProfilePage;
