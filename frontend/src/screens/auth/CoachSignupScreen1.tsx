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
import { registerCoachStep1 } from "../../services/api";

export default function CoachSignupScreen1() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const isStrongPassword = (pw: string) =>
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/.test(pw);

  const isDisabled =
    !email || !password || !confirmPassword || password !== confirmPassword || !isStrongPassword(password);

  const handleNext = async () => {
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Password must include an uppercase letter, digit, and special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await registerCoachStep1(email, password, confirmPassword);
      navigation.navigate("CoachSignup2", { email, password });
    } catch (err: any) {
      console.error("Signup error", err);
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Image source={require("../../assets/coach-icon.png")} style={styles.logo} />
      <Text style={styles.heading}>Become a Coach</Text>
      <Text style={styles.subtext}>Enter your email and password to sign up</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="email@example.com"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      <View style={styles.labelRow}>
        <Text style={styles.label}>Password</Text>
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        placeholderTextColor="#999"
      />

      <View style={styles.labelRow}>
        <Text style={styles.label}>Confirm Password</Text>
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Text style={styles.toggleText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        placeholderTextColor="#999"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isDisabled && { opacity: 0.5 }]}
        onPress={handleNext}
        disabled={isDisabled}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#000", paddingTop: 60 },
  backText: { color: "#fff", fontSize: 16, marginBottom: 20 },
  logo: { width: 70, height: 70, alignSelf: "center", marginBottom: 12 },
  heading: { textAlign: "center", color: "#ff6a00", fontSize: 20, fontWeight: "bold" },
  subtext: { textAlign: "center", color: "#aaa", marginBottom: 20 },
  label: { color: "#fff", marginBottom: 4, fontSize: 14 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  toggleText: { color: "#ff6a00", fontWeight: "bold" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#ff6a00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  error: { color: "red", fontSize: 12, marginTop: 4 },
});

