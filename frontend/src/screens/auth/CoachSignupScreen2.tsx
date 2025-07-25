import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Checkbox from "expo-checkbox";
import DropDownPicker from "react-native-dropdown-picker";
import Slider from "@react-native-community/slider";
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../../services/supabase";
import { registerCoach, uploadQualificationsPDF, saveQualifications } from "../../services/api";

export default function CoachSignupScreen2() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, password } = route.params;

  const [first_Name, setFirstName] = useState("");
  const [last_Name, setLastName] = useState("");
  const [postal_code, setPostalCode] = useState("");
  const [number, setNumber] = useState("");
  const [uploadedQualifications, setUploadedQualifications] = useState<{url: string, fileName: string}[]>([]);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [gender, setGender] = useState("Male");
  const [openGender, setOpenGender] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ]);

  const [age, setAge] = useState("21");

  const [openSport, setOpenSport] = useState(false);
  const [sport, setSport] = useState("Cricket");
  const [sportItems, setSportItems] = useState([
    { label: "Cricket", value: "Cricket" },
    { label: "Football", value: "Football" },
    { label: "Tennis", value: "Tennis" },
  ]);

const handlePDFUpload = async () => {
  try {
    setIsUploadingPDF(true);
    
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Validate file size (5MB limit)
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a PDF file smaller than 5MB.');
        return;
      }

      // We don't need coach ID for upload anymore, just upload the file
      // Upload the PDF
      const pdfUrl = await uploadQualificationsPDF(asset.uri, asset.name);
      
      // Add to uploaded qualifications array
      setUploadedQualifications(prev => [...prev, {
        url: pdfUrl,
        fileName: asset.name
      }]);
      
      Alert.alert('Success', 'PDF uploaded successfully!');
    }
  } catch (error: any) {
    console.error('PDF upload error:', error);
    Alert.alert('Upload Failed', error.message || 'Failed to upload PDF');
  } finally {
    setIsUploadingPDF(false);
  }
};

const handleSubmit = async () => {
  if (!acceptedTerms) {
    Alert.alert("Please accept the terms to continue.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      throw new Error(error.message);
    }

    const userId = data?.user?.id;

    // Register coach metadata if userId exists
    if (userId) {
      await registerCoach({
        id: userId,
        email,
        first_name: first_Name,
        last_name: last_Name,
        age,
        gender,
        sport,
        number,
        postal_code,
      });

      // Save qualifications to database if any were uploaded
      if (uploadedQualifications.length > 0) {
        const qualificationUrls = uploadedQualifications.map(q => q.url);
        await saveQualifications(userId, qualificationUrls);
      }
    }

    // ✅ Always show success alert and navigate to login
    Alert.alert("Success!", "Verify your email now!", [
      {
        text: "OK",
        onPress: () =>
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          }),
      },
    ]);
  } catch (err: any) {
    console.error("Signup error:", err);
    Alert.alert("Signup Failed", err.message || "Unknown error");
  }
};

  const isSubmitDisabled =
    !first_Name.trim() ||
    !last_Name.trim() ||
    !postal_code.trim() ||
    !number.trim() ||
    !acceptedTerms;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <FlatList
          style={{ backgroundColor: "#000" }}
          contentContainerStyle={{ backgroundColor: "#000" }}
          data={[]}
          keyExtractor={() => "dummy"}
          renderItem={null}
          ListHeaderComponent={
            <View style={{ padding: 20 }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={{ color: "#fff", fontSize: 22, marginBottom: 12 }}>✕</Text>
              </TouchableOpacity>

              <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontSize: 24, color: "#ff6a00" }}>🏹</Text>
                </View>

                <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
                  Coaching Information
                </Text>

                <View style={{ flexDirection: "row" }}>
                  <TextInput
                    placeholder="First Name"
                    style={[styles.input, { marginRight: 6 }]}
                    value={first_Name}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    placeholder="Last Name"
                    style={[styles.input, { marginLeft: 6 }]}
                    value={last_Name}
                    onChangeText={setLastName}
                  />
                </View>

                <Text style={styles.label}>Gender</Text>
                <DropDownPicker
                  open={openGender}
                  value={gender}
                  items={genderItems}
                  setOpen={setOpenGender}
                  setValue={setGender}
                  setItems={setGenderItems}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />

                <Text style={styles.label}>Age: {age}</Text>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  minimumTrackTintColor="#ff6a00"
                  maximumTrackTintColor="#ccc"
                  thumbTintColor="#ff6a00"
                  value={Number(age)}
                  onValueChange={(value) => setAge(String(value))}
                />

                <Text style={styles.label}>Sport</Text>
                <DropDownPicker
                  open={openSport}
                  value={sport}
                  items={sportItems}
                  setOpen={setOpenSport}
                  setValue={setSport}
                  setItems={setSportItems}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />

                <TextInput
                  placeholder="Phone Number"
                  style={styles.input}
                  value={number}
                  onChangeText={setNumber}
                  keyboardType="phone-pad"
                />

                <TextInput
                  placeholder="Postal Code"
                  style={styles.input}
                  value={postal_code}
                  onChangeText={setPostalCode}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Achievements & Qualifications (PDF)</Text>
                
                <TouchableOpacity
                  style={[
                    styles.pdfUploadButton,
                    uploadedQualifications.length > 0 ? styles.pdfUploadButtonSuccess : {},
                    isUploadingPDF ? styles.pdfUploadButtonDisabled : {}
                  ]}
                  onPress={handlePDFUpload}
                  disabled={isUploadingPDF}
                >
                  {isUploadingPDF ? (
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.pdfUploadButtonText}>Uploading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.pdfUploadButtonText}>
                      {uploadedQualifications.length > 0 ? `Add Another PDF (${uploadedQualifications.length} uploaded)` : 'Select PDF File'}
                    </Text>
                  )}
                </TouchableOpacity>

                {uploadedQualifications.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    {uploadedQualifications.map((qualification, index) => (
                      <View key={index} style={styles.fileNameContainer}>
                        <Text style={styles.fileName}>📎 {qualification.fileName}</Text>
                        <TouchableOpacity 
                          onPress={() => {
                            setUploadedQualifications(prev => prev.filter((_, i) => i !== index));
                          }}
                          style={styles.removeFileButton}
                        >
                          <Text style={styles.removeFileText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.checkboxContainer}>
                  <View style={styles.checkboxRow}>
                    <Checkbox value={acceptedTerms} onValueChange={setAcceptedTerms} color="#ff6a00" />
                    <Text style={styles.checkboxLabel}> I accept the terms</Text>
                  </View>

                  <Pressable>
                    <Text style={styles.link}>Read our T&Cs</Text>
                  </Pressable>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isSubmitDisabled && { opacity: 0.4 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                >
                  <Text style={styles.submitText}>Become a Coach</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
    flex: 1,
  },
  dropdown: {
    backgroundColor: "#f4f4f4",
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  checkboxContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  link: {
    color: "#ff6a00",
    textDecorationLine: "underline",
    marginBottom: 8,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
    marginTop: 16,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
  uploadedFileName: {
    marginTop: 8,
    fontSize: 14,
    color: "#007bff",
    fontStyle: "italic",
  },
  pdfUploadButton: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pdfUploadButtonSuccess: {
    backgroundColor: "#333",
  },
  pdfUploadButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  pdfUploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fileNameContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
  },
  removeFileButton: {
    backgroundColor: "#dc3545",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  removeFileText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
