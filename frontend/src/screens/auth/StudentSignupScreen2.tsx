import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import Checkbox from "expo-checkbox";
import DropDownPicker from "react-native-dropdown-picker";
import Slider from "@react-native-community/slider";
import { useNavigation, useRoute } from "@react-navigation/native";
import { registerStudent } from "../../services/api";
import { supabase } from "../../services/supabase";

export default function StudentSignupScreen2() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, password } = route.params || {};

  const [first_Name, setFirstName] = useState("");
  const [last_Name, setLastName] = useState("");
  const [postal_code, setPostalCode] = useState("");
  const [number, setNumber] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("21");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [openGender, setOpenGender] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ]);

  const handleSubmit = async () => {
  if (!acceptedTerms) {
    Alert.alert("Please accept the terms to continue.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    const userId = data?.user?.id;

    // Register metadata only if user exists
    if (userId) {
      await registerStudent({
        id: userId,
        email,
        first_name: first_Name,
        last_name: last_Name,
        age,
        gender,
        number,
        postal_code,
      });
    }

    // ✅ Always show success alert and navigate to Login
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
          ListHeaderComponent={
            <View style={styles.scrollContent}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>

              <View style={styles.card}>
                <Text style={styles.title}>Complete your profile</Text>

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
                  placeholder="Mobile Number"
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

                <View style={styles.checkboxRow}>
                  <Checkbox
                    value={acceptedTerms}
                    onValueChange={setAcceptedTerms}
                    color="#000"
                  />
                  <Text style={styles.checkboxLabel}> I accept the terms</Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isSubmitDisabled && { opacity: 0.4 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                >
                  <Text style={styles.submitText}>Register</Text>
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
  container: { flex: 1, backgroundColor: "#ff6a00" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  close: { color: "#fff", fontSize: 22, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
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
  label: { fontWeight: "600", marginBottom: 4, marginTop: 8 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#ff6a00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
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




