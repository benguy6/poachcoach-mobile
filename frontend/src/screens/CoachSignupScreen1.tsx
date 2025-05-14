import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { registerCoachStep1 } from "../services/api";

export default function CoachSignupScreen1() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");

  const handleNext = async () => {
    try {
      const result = await registerCoachStep1(email);
      navigation.navigate("CoachSignup2", { email });
    } catch (err: any) {
      console.error("Signup error", err);
      alert(err.message || "Network or server error.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Logo + Text */}
      <Image source={require("../../assets/coach-icon.png")} style={styles.logo} />
      <Text style={styles.heading}>Become a Coach</Text>
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
        disabled={!email.trim()}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* Google Login */}
      <TouchableOpacity style={styles.googleButton}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      {/* Terms and Privacy */}
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
    backgroundColor: "#000",
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
    color: "#ff6a00",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtext: {
    textAlign: "center",
    color: "#ccc",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: "#ff6a00",
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
    backgroundColor: "#555",
  },
  orText: {
    marginHorizontal: 8,
    color: "#aaa",
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
    color: "#aaa",
  },
  link: {
    color: "#ff6a00",
    textDecorationLine: "underline",
  },
});
