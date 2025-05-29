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
import * as Google from "expo-auth-session/providers/google";

export default function CoachSignupScreen1() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const passwordValid = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/.test(password);
  const allFieldsFilled = email && password && confirmPassword;

  let disableReason = "";
  if (!email || !password || !confirmPassword) {
    disableReason = "Please fill in all fields.";
  } else if (!passwordValid) {
    disableReason = "Password must be at least 6 characters with a digit and a symbol.";
  } else if (password !== confirmPassword) {
    disableReason = "Passwords do not match.";
  }

  const handleNext = async () => {
    setPasswordError("");

    if (!allFieldsFilled) {
      setPasswordError("Please fill in all fields.");
      return;
    }

    if (!passwordValid) {
      setPasswordError("Password must be at least 6 characters and include a digit and a symbol.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      const result = await registerCoachStep1(email, password, confirmPassword);
      navigation.navigate("CoachSignup2", { email });
    } catch (err: any) {
      console.error("Signup error", err);
      setPasswordError(err.message || "Network or server error.");
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

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="email@domain.com"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Password</Text>
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry={!showPassword}
      />

      {/* Confirm Password */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Confirm Password</Text>
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Text style={styles.toggleText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        secureTextEntry={!showConfirmPassword}
      />

      {/* Password error message */}
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          !allFieldsFilled || !passwordValid || password !== confirmPassword
            ? styles.disabledButton
            : null,
        ]}
        onPress={handleNext}
        disabled={!allFieldsFilled || !passwordValid || password !== confirmPassword}
      >
        <Text style={styles.nextText}>Sign up</Text>
      </TouchableOpacity>

      {/* Disable reason below button */}
      {disableReason ? (
        <Text style={styles.helperText}>{disableReason}</Text>
      ) : null}

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* Google Login */}
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 20,
        }}
        // onPress={() => promptAsync()}
      >
        <Image
          source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
          style={{ width: 20, height: 20, marginRight: 10 }}
        />
        <Text style={{ color: "black", fontWeight: "bold" }}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Terms */}
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
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 2,
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
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#999",
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
  toggleText: {
    color: "#ff6a00",
    fontWeight: "bold",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 2,
    marginRight: 2,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 2,
  },
  helperText: {
    color: "#f66",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 2,
  },
});
