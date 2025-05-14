import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { registerStudentStep1 } from "../services/api"; 

export default function StudentSignupScreen1() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");

  const handleNext = async () => {
    if (!email.trim()) {
      Alert.alert("Please enter a valid email.");
      return;
    }

    try {
      await registerStudentStep1(email);
      navigation.navigate("StudentSignup2", { email });
    } catch (err: any) {
      console.error("Signup error:", err);
      Alert.alert("Error", err.message || "Could not proceed.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Logo + Heading */}
      <Image source={require("../../assets/student-icon.png")} style={styles.logo} />
      <Text style={styles.heading}>Become a Student</Text>
      <Text style={styles.subtext}>Enter your email to sign up for this app</Text>

      {/* Email Input */}
      <TextInput
        placeholder="email@domain.com"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#999"
      />

      {/* Next Button */}
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* Google Button */}
      <TouchableOpacity style={styles.googleButton}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Terms Notice */}
      <Text style={styles.terms}>
        By clicking continue, you agree to our{" "}
        <Text style={styles.link}>Terms of Service</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ff6a00",
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    alignSelf: "center",
    marginBottom: 12,
  },
  heading: {
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtext: {
    textAlign: "center",
    color: "#fff",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#fff",
  },
  orText: {
    marginHorizontal: 8,
    color: "#fff",
  },
  googleButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  googleText: {
    color: "#000",
    fontWeight: "500",
  },
  terms: {
    marginTop: 30,
    fontSize: 12,
    textAlign: "center",
    color: "#eee",
  },
  link: {
    color: "#000",
    textDecorationLine: "underline",
  },
});
