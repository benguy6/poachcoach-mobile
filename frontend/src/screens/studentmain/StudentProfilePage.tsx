import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import LoadingOverlay from '../../components/LoadingOverlay';
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
  Pencil,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from "react-native-dropdown-picker";
import Slider from "@react-native-community/slider";
import { uploadProfilePicture, getStudentProfile } from '../../services/api'; // Adjust path as needed
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase'; // Correct import path

type Achievement = {
  id: string | number;
  achievement: string;
};

type UserProfile = {
  id?: string;
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
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const route = useRoute<RouteProp<{ params: StudentProfilePageRouteParams }, 'params'>>();
  const navigation = useNavigation();
  const onProfilePicChange = route.params?.onProfilePicChange;

  // Edit form states
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    age: '21',
    gender: 'Male',
    number: '',
    postal_code: '',
  });

  // Dropdown states
  const [openGender, setOpenGender] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('No access token found');

        const data = await getStudentProfile(accessToken);

        console.log('Frontend Response Object:', data); // Log the response object

        setUserProfile({
          id: data.user.id,
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
        setProfilePic(data.user.profilePicture || 'https://via.placeholder.com/72/cccccc?text=Profile'); // Updated placeholder image
        
        // Initialize edit form with current data
        setEditForm({
          first_name: data.user.name?.split(' ')[0] || '',
          last_name: data.user.name?.split(' ').slice(1).join(' ') || '',
          age: data.user.age?.toString() || '21',
          gender: data.user.gender || 'Male',
          number: data.user.number || '',
          postal_code: data.user.postalCode || '',
        });
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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              navigation.reset({ index: 0, routes: [{ name: 'Entry' as never }] });
            } catch (error) {
              console.error('Sign out error:', error);
              alert('Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.number.trim() || !editForm.postal_code.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('No access token found');
      }

      // Update user data in Supabase
      const { error: userError } = await supabase
        .from('Users')
        .update({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          age: editForm.age,
          gender: editForm.gender,
          number: editForm.number.trim(),
          postal_code: editForm.postal_code.trim(),
        })
        .eq('id', userProfile?.id);

      if (userError) {
        throw new Error(userError.message);
      }

      // Refresh profile data
      const updatedData = await getStudentProfile(token);
      
      setUserProfile({
        name: updatedData.user.name,
        location: updatedData.user.postalCode || 'Location not provided',
        totalClasses: updatedData.sessions.length,
        email: updatedData.user.email,
        number: updatedData.user.number || 'Phone not provided',
        joinDate: updatedData.user.dateJoined || 'Date not available',
        goals: updatedData.user.goals || 'No goals set',
        favouriteActivities: updatedData.studentProfile.favouriteActivities || [],
        profilePicture: updatedData.user.profilePicture,
        address: updatedData.user.address || 'Address not provided',
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditModal(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const renderProfileContent = () => (
    <View style={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleEditProfile}>
            <Pencil size={20} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={{ uri: profilePic || 'https://via.placeholder.com/72/cccccc?text=Profile' }}
              style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: '#fff', backgroundColor: '#eee' }}
            />
            <TouchableOpacity style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#F97316', borderRadius: 20, padding: 8, borderWidth: 2, borderColor: '#fff' }} onPress={handlePickImage}>
              <Camera size={22} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.name, { textAlign: 'center', marginTop: 16 }]}>{userProfile?.name || 'Name not provided'}</Text>
          <Text style={{ color: '#fed7aa', fontSize: 14, textAlign: 'center', marginTop: 2 }}>{userProfile?.email || 'Email not provided'}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsRow}>
          <StatCard label="Classes Taken" value={userProfile?.totalClasses || 0} />
          <StatCard label="Achievements" value={achievements.length || 0} />
        </View>

        <InfoCard icon={<User size={16} />} title="About">
          <InfoRow icon={<MapPin size={14} />} text={userProfile?.address || 'Address not provided'} />
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingOverlay 
          visible={true} 
          message="Loading your profile..." 
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.container}
        data={[{ key: 'profile' }]}
        renderItem={() => renderProfileContent()}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={{ position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' }}>
        <TouchableOpacity style={{ backgroundColor: '#ef4444', paddingVertical: 14, paddingHorizontal: 48, borderRadius: 28 }} onPress={handleSignOut}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#F97316" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            style={styles.modalContent}
            data={[{ key: 'form' }]}
            renderItem={() => (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                <View style={styles.nameRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="First Name"
                    placeholderTextColor="#666"
                    value={editForm.first_name}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, first_name: text }))}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    placeholder="Last Name"
                    placeholderTextColor="#666"
                    value={editForm.last_name}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, last_name: text }))}
                  />
                </View>

                <Text style={styles.label}>Gender</Text>
                <DropDownPicker
                  open={openGender}
                  value={editForm.gender}
                  items={genderItems}
                  setOpen={setOpenGender}
                  setValue={setEditForm}
                  setItems={setGenderItems}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  zIndex={3000}
                  zIndexInverse={1000}
                />

                <Text style={styles.label}>Age: {editForm.age}</Text>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  minimumTrackTintColor="#F97316"
                  maximumTrackTintColor="#666"
                  thumbTintColor="#F97316"
                  value={Number(editForm.age)}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, age: String(value) }))}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#666"
                  value={editForm.number}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, number: text }))}
                  keyboardType="phone-pad"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Postal Code"
                  placeholderTextColor="#666"
                  value={editForm.postal_code}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, postal_code: text }))}
                  keyboardType="numeric"
                />
              </View>
            )}
            keyExtractor={(item) => item.key}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 20,
    backgroundColor: '#F97316',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    padding: 20,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dropdown: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  dropdownContainer: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#F0F2F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 28,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 28,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default StudentProfilePage;
