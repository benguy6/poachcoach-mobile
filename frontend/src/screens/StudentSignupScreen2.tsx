import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Checkbox from "expo-checkbox";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { registerStudent } from "../services/api"; 

export default function StudentSignupScreen2() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || "";

  const [first_Name, setFirstName] = useState("");
  const [last_Name, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("21");
  const [level_of_expertise, setLevelOfExpertise] = useState("Beginner");
  const [qualifications, setQualifications] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const [openGender, setOpenGender] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ]);

  const [openAge, setOpenAge] = useState(false);
  const [ageItems, setAgeItems] = useState(
    Array.from({ length: 60 }, (_, i) => ({
      label: `${i + 18}`,
      value: `${i + 18}`,
    }))
  );

  const [openExpertise, setOpenExpertise] = useState(false);
  const [expertiseItems, setExpertiseItems] = useState([
    { label: "Beginner", value: "Beginner" },
    { label: "Intermediate", value: "Intermediate" },
    { label: "Expert", value: "Expert" },
  ]);

  const isStrongPassword = (password: string): boolean => {
    const upper = /[A-Z]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;
    return password.length >= 6 && upper.test(password) && special.test(password);
  };

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      Alert.alert("Please accept the terms to continue.");
      return;
    }
    if (!isStrongPassword(password)) {
      Alert.alert("Password must be stronger.");
      return;
    }

    try {
      await registerStudent({
        email,
        password,
        first_name: first_Name,
        last_name: last_Name,
        age,
        gender,
        level_of_expertise,
        qualifications: qualifications || "",
      });

      Alert.alert("Success!", "Student registered successfully.");
      navigation.navigate("Login");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Signup Failed", err.message || "Unknown error");
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
      setSelectedFile(result.assets[0]);
    }
  };

  const isSubmitDisabled =
    !first_Name.trim() ||
    !last_Name.trim() ||
    !isStrongPassword(password) ||
    !acceptedTerms ||
    ((level_of_expertise === "Intermediate" || level_of_expertise === "Expert") && !qualifications.trim());

  const formContent = (
    <>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>👥</Text>
        </View>

        <Text style={styles.title}>Personal information</Text>

        <View style={styles.row}>
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

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {password.length > 0 && !isStrongPassword(password) && (
          <Text style={{ color: "red", fontSize: 12 }}>
            Password must be 6+ characters, with 1 uppercase & 1 special character.
          </Text>
        )}

        <Text style={styles.label}>Gender</Text>
        <View style={{ zIndex: 3000 }}>
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
        </View>

        <Text style={styles.label}>Age</Text>
        <View style={{ zIndex: 2000 }}>
          <DropDownPicker
            open={openAge}
            value={age}
            items={ageItems}
            setOpen={setOpenAge}
            setValue={setAge}
            setItems={setAgeItems}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>

        <Text style={styles.label}>Level of Expertise</Text>
        <View style={{ zIndex: 1000 }}>
          <DropDownPicker
            open={openExpertise}
            value={level_of_expertise}
            items={expertiseItems}
            setOpen={setOpenExpertise}
            setValue={setLevelOfExpertise}
            setItems={setExpertiseItems}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>

        {(level_of_expertise === "Intermediate" || level_of_expertise === "Expert") && (
          <>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Proof to show expertise (for experts and above)</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                <Text style={{ fontSize: 18, color: "#fff" }}>⬆</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="eg. Degree in Sports Science"
              style={[styles.input, { height: 80 }]}
              value={qualifications}
              onChangeText={setQualifications}
              multiline
            />

            {selectedFile && (
              <View style={styles.fileTag}>
                <Text style={styles.fileTagText}>{selectedFile.name}</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.checkboxRow}>
          <Checkbox value={acceptedTerms} onValueChange={setAcceptedTerms} color="#000" />
          <Text style={styles.checkboxLabel}> I accept the terms</Text>
        </View>

        <Pressable>
          <Text style={styles.link}>Read our T&Cs</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={80}
      >
        <FlatList
          data={[]}
          keyExtractor={() => "dummy"}
          renderItem={null}
          contentContainerStyle={{ backgroundColor: "#ff6a00" }}
          ListHeaderComponent={<View style={styles.scrollContent}>{formContent}</View>}
          ListFooterComponent={
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitDisabled && { opacity: 0.4 }]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}
              >
                <Text style={styles.submitText}>Become a Student</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ff6a00" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  close: { color: "#fff", fontSize: 22, marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  logoWrap: { alignItems: "center", marginBottom: 8 },
  logo: { fontSize: 24 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  row: { flexDirection: "row" },
  input: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  label: { fontWeight: "600", marginBottom: 4, marginTop: 8, flex: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  uploadButton: {
    backgroundColor: "#ff6a00",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    marginTop: 8,
    marginLeft: 8,
  },
  fileTag: {
    alignSelf: "flex-start",
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  fileTagText: {
    fontSize: 12,
    color: "#333",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  link: {
    color: "#888",
    textDecorationLine: "underline",
    marginBottom: 16,
    marginTop: -4,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#ff6a00",
  },
  submitButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: {
    color: "#ff6a00",
    fontWeight: "bold",
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
});
