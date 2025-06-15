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
import { registerStudentStep1 } from "../../services/api";

export default function StudentSignupScreen1() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pw: string) =>
    /^(?=.*[0-9])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{6,}$/.test(pw);

  const allFieldsFilled = email && password && confirmPassword;
  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const passwordsMatch = password === confirmPassword;

  const disableReason = !allFieldsFilled
    ? "Please fill in all fields."
    : !emailValid
    ? "Invalid email format."
    : !passwordValid
    ? "Password must be ≥6 characters, with a digit and a symbol."
    : !passwordsMatch
    ? "Passwords do not match."
    : "";

  const handleNext = async () => {
    if (disableReason) {
      setError(disableReason);
      return;
    }

    try {
      await registerStudentStep1(email, password, confirmPassword);
      navigation.navigate("StudentSignup2", {
        email,
        password,
        isGoogleSignup: false,
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Could not proceed.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Image source={require("../../assets/student-icon.png")} style={styles.logo} />
      <Text style={styles.heading}>Become a Student</Text>
      <Text style={styles.subtext}>Enter your email and password to get started</Text>

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="email@domain.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError("");
        }}
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

      {/* Error or Helper Message */}
      {error ? <Text style={styles.error}>{error}</Text> : disableReason ? (
        <Text style={styles.helperText}>{disableReason}</Text>
      ) : null}

      {/* Next Button */}
      <TouchableOpacity
        style={[styles.nextButton, disableReason ? styles.disabledButton : null]}
        onPress={handleNext}
        disabled={!!disableReason}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* Google-style Button */}
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => Alert.alert("Google Sign-in coming soon!")}
      >
        <Image
          source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
          style={{ width: 20, height: 20, marginRight: 10 }}
        />
        <Text style={styles.googleText}>Continue with Google</Text>
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
    backgroundColor: "#222",
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
  error: {
    color: "#fdd",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 2,
  },
  helperText: {
    color: "#fff1f1",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 2,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  googleText: {
    color: "#000",
    fontWeight: "bold",
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
  toggleText: {
    color: "#000",
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
});

