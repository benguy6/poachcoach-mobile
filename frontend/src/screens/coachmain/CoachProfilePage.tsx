import React from 'react';
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
  Edit,
  Camera,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Target,
  Bookmark,
  Award,
  Settings,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture } from '../../services/api';

const dummyCoachProfile = {
  name: 'Coach Alex Smith',
  level: 'Elite',
  location: 'New York, NY',
  totalClasses: 120,
  email: 'alex.smith@coach.com',
  phone: '+1 555-123-4567',
  joinDate: 'Jan 2020',
  goals: 'Help athletes reach their full potential.',
  favoriteActivities: ['Basketball', 'Yoga', 'Running'],
  profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
  bio: 'Passionate about coaching and fitness.',
};

const dummyAchievements = [
  { id: 1, icon: '🏆', title: 'Coach of the Year', date: '2023' },
  { id: 2, icon: '🥇', title: 'Regional Champion', date: '2022' },
  { id: 3, icon: '🎖️', title: '100+ Classes', date: '2021' },
];

type CoachProfilePageProps = {
  onProfilePicChange?: (url: string) => void;
};

const CoachProfilePage: React.FC = () => {
  const [profilePic, setProfilePic] = React.useState(dummyCoachProfile.profilePicture);

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
      } catch (e) {
        console.error('Upload error:', e);
        alert('Failed to upload image');
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Coach Profile</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
            <Settings size={20} color="#fb923c" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profilePic }} style={styles.avatar} />
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <Camera size={16} color="#18181b" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{dummyCoachProfile.name}</Text>
            <Text style={styles.level}>{dummyCoachProfile.level} Level</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#fb923c" />
              <Text style={styles.location}>{dummyCoachProfile.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
            <Edit size={20} color="#fb923c" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Classes Taught" value={dummyCoachProfile.totalClasses} />
          <StatCard label="Achievements" value={dummyAchievements.length} />
          <StatCard label="Avg Rating" value="4.9" />
        </View>
        <InfoCard icon={<User size={16} />} title="About">
          <InfoRow icon={<Mail size={14} />} text={dummyCoachProfile.email} />
          <InfoRow icon={<Phone size={14} />} text={dummyCoachProfile.phone} />
          <InfoRow icon={<Calendar size={14} />} text={`Joined ${dummyCoachProfile.joinDate}`} />
        </InfoCard>
        <InfoCard icon={<Target size={16} />} title="Goals">
          <Text style={styles.paragraph}>{dummyCoachProfile.goals}</Text>
        </InfoCard>
        <InfoCard icon={<Bookmark size={16} />} title="Favorite Activities">
          <View style={styles.tags}>
            {dummyCoachProfile.favoriteActivities.map((act) => (
              <Text key={act} style={styles.tag}>{act}</Text>
            ))}
          </View>
        </InfoCard>
        <InfoCard icon={<Award size={16} />} title="Recent Achievements">
          {dummyAchievements.map((ach) => (
            <View key={ach.id} style={styles.achievementRow}>
              <View style={styles.achievementIcon}>
                <Text style={{ fontSize: 16 }}>{ach.icon}</Text>
              </View>
              <View>
                <Text style={styles.achievementTitle}>{ach.title}</Text>
                <Text style={styles.achievementDate}>{ach.date}</Text>
              </View>
            </View>
          ))}
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
    {icon}
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b', // black background
  },
  header: {
    backgroundColor: '#18181b', // black header
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
    color: '#fb923c', // orange title
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
    borderColor: '#fb923c', // orange border
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fb923c', // orange button
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
  level: {
    fontSize: 14,
    color: '#fed7aa', // light orange
    marginBottom: 4,
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
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(251,146,60,0.15)', // faded orange
    borderRadius: 20,
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
    backgroundColor: '#27272a', // dark card
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fb923c', // orange
  },
  statLabel: {
    fontSize: 12,
    color: '#d1d5db', // gray
  },
  infoCard: {
    backgroundColor: '#27272a', // dark card
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
    color: '#fb923c', // orange
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    color: '#d1d5db', // gray
    fontSize: 14,
  },
  paragraph: {
    color: '#d1d5db', // gray
    fontSize: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fb923c', // orange
    color: '#18181b', // black text
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 12,
    marginRight: 8,
    marginBottom: 8,
    fontWeight: 'bold',
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
    backgroundColor: '#fed7aa', // light orange
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  achievementDate: {
    fontSize: 12,
    color: '#fb923c', // orange
  },
});

export default CoachProfilePage;
