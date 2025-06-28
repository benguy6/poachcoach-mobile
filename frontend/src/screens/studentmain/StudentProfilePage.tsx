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

type Achievement = {
  id: string | number;
  icon: string;
  title: string;
  date: string;
};

type UserProfile = {
  name: string;
  level: string | number;
  location: string;
  totalClasses: number;
  email: string;
  phone: string;
  joinDate: string;
  goals: string;
  favoriteActivities: string[];
  profilePicture?: string;
  bio?: string;
};

type ProfilePageProps = {
  userProfile: UserProfile;
  achievements: Achievement[];
  onEdit: () => void;
  onSettings: () => void;
};

const StudentProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  achievements,
  onEdit,
  onSettings,
}) => {
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
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={16} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{userProfile.name}</Text>
            <Text style={styles.level}>{userProfile.level} Level</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#fff" />
              <Text style={styles.location}>{userProfile.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
            <Edit size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Classes Taken" value={userProfile.totalClasses} />
          <StatCard label="Achievements" value={achievements.length} />
          <StatCard label="Avg Rating" value="4.8" />
        </View>

        <InfoCard icon={<User size={16} />} title="About">
          <InfoRow icon={<Mail size={14} />} text={userProfile.email} />
          <InfoRow icon={<Phone size={14} />} text={userProfile.phone} />
          <InfoRow icon={<Calendar size={14} />} text={`Joined ${userProfile.joinDate}`} />
        </InfoCard>

        <InfoCard icon={<Target size={16} />} title="Goals">
          <Text style={styles.paragraph}>{userProfile.goals}</Text>
        </InfoCard>

        <InfoCard icon={<Bookmark size={16} />} title="Favorite Activities">
          <View style={styles.tags}>
            {userProfile.favoriteActivities.map((act) => (
              <Text key={act} style={styles.tag}>
                {act}
              </Text>
            ))}
          </View>
        </InfoCard>

        <InfoCard icon={<Award size={16} />} title="Recent Achievements">
          {achievements.map((ach) => (
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
    color: '#FFDAB9',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  achievementDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default StudentProfilePage;
