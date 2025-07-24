import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  Award,
  Settings,
  Pencil,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from "react-native-dropdown-picker";
import Slider from "@react-native-community/slider";
import { uploadProfilePicture, getCoachProfile } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';

type CoachProfilePageProps = {
  onProfilePicChange?: (url: string) => void;
};

const CoachProfilePage: React.FC<CoachProfilePageProps> = ({ onProfilePicChange }) => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigation = useNavigation();

  // Edit form states
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    age: '21',
    gender: 'Male',
    sport: 'Cricket',
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

  const [openSport, setOpenSport] = useState(false);
  const [sportItems, setSportItems] = useState([
    { label: "Cricket", value: "Cricket" },
    { label: "Football", value: "Football" },
    { label: "Tennis", value: "Tennis" },
  ]);

  useEffect(() => {
    const fetchCoachProfile = async () => {
      try {
        // Retrieve token dynamically using Supabase
        const { data: sessionData, error } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error('No access token found');
        }

        const data = await getCoachProfile(token);
        setCoachProfile(data);
        setProfilePic(data.user.profilePicture || 'https://via.placeholder.com/72/cccccc?text=Profile'); // Generic placeholder image
        
        // Initialize edit form with current data
        setEditForm({
          first_name: data.user.name?.split(' ')[0] || '',
          last_name: data.user.name?.split(' ').slice(1).join(' ') || '',
          age: data.user.age?.toString() || '21',
          gender: data.user.gender || 'Male',
          sport: data.coach.sport || 'Cricket',
          number: data.user.number || '',
          postal_code: data.user.postal_code || '',
        });
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
        .eq('id', coachProfile.user.id);

      if (userError) {
        throw new Error(userError.message);
      }

      // Update coach data in Supabase
      const { error: coachError } = await supabase
        .from('Coaches')
        .update({
          sport: editForm.sport,
        })
        .eq('id', coachProfile.user.id);

      if (coachError) {
        throw new Error(coachError.message);
      }

      // Refresh profile data
      const updatedData = await getCoachProfile(token);
      setCoachProfile(updatedData);
      
      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditModal(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Coach Profile</Text>
            <TouchableOpacity style={styles.iconButton} onPress={handleEditProfile}>
              <Pencil size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={{ uri: profilePic ?? 'https://via.placeholder.com/72/cccccc?text=Profile' }}
                style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: '#fff', backgroundColor: '#eee' }}
              />
              <TouchableOpacity style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#fb923c', borderRadius: 20, padding: 8, borderWidth: 2, borderColor: '#fff' }} onPress={handlePickImage}>
                <Camera size={22} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.name, { textAlign: 'center', marginTop: 16 }]}>{coachProfile?.user.name || 'Name not provided'}</Text>
            <Text style={{ color: '#fed7aa', fontSize: 14, textAlign: 'center', marginTop: 2 }}>{coachProfile?.user.email || 'Email not provided'}</Text>
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
        <View style={{ height: 60 }} />
      </ScrollView>
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
              <X size={24} color="#fb923c" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
                 minimumTrackTintColor="#fb923c"
                 maximumTrackTintColor="#666"
                 thumbTintColor="#fb923c"
                 value={Number(editForm.age)}
                 onValueChange={(value) => setEditForm(prev => ({ ...prev, age: String(value) }))}
               />

               <Text style={styles.label}>Sport</Text>
               <DropDownPicker
                 open={openSport}
                 value={editForm.sport}
                 items={sportItems}
                 setOpen={setOpenSport}
                 setValue={setEditForm}
                 setItems={setSportItems}
                 style={styles.dropdown}
                 dropDownContainerStyle={styles.dropdownContainer}
                 zIndex={2000}
                 zIndexInverse={2000}
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
          </ScrollView>

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
  iconButton: {
    backgroundColor: '#fb923c',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fb923c',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  label: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginBottom: 12,
  },
  dropdownContainer: {
    backgroundColor: '#27272a',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelButton: {
    backgroundColor: '#666',
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
    backgroundColor: '#fb923c',
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

export default CoachProfilePage;
