import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { login } from "../services/api";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const result = await login(email, password);
      const session = result.session;
      const user = session?.user;

      if (!user?.email_confirmed_at) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in."
        );
        return;
      }

      await SecureStore.setItemAsync("userId", user.id);
      await SecureStore.setItemAsync("userEmail", user.email);
      navigation.navigate("StudentDashboard");
    } catch (err: any) {
      console.error("Login error:", err.message);
      setError(err.message || "Login failed.");
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/poach-icon.png")} style={styles.logo} />

      <View style={{ width: "100%", alignItems: "flex-end" }}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#999"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.or}>or</Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => Alert.alert("Google Sign-In coming soon!")}
      >
        <Text>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.signupPrompt}>Haven’t signed up?</Text>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.becomeCoach}
          onPress={() => navigation.navigate("CoachSignup1")}
        >
          <Text style={styles.buttonText}>Become a Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.becomeStudent}
          onPress={() => navigation.navigate("StudentSignup1")}
        >
          <Text style={styles.buttonText}>Become a Student</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginTop: 30,
  },
  input: {
    width: "100%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  inputLabel: {
    alignSelf: "flex-start",
    marginLeft: 4,
    marginBottom: 2,
    fontWeight: "600",
    color: "#333",
  },
  forgotText: {
    color: "#ff6a00",
    textAlign: "right",
    alignSelf: "flex-end",
    marginBottom: 10,
    marginTop: -4,
    textDecorationLine: "underline",
  },
  error: {
    color: "red",
    marginVertical: 6,
  },
  loginButton: {
    backgroundColor: "#ff6a00",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginVertical: 8,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
  },
  or: {
    marginVertical: 10,
    color: "#999",
  },
  googleButton: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    width: "100%",
    marginVertical: 20,
  },
  signupPrompt: {
    marginTop: 20,
    color: "#666",
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  becomeCoach: {
    backgroundColor: "black",
    flex: 1,
    padding: 14,
    marginRight: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  becomeStudent: {
    backgroundColor: "#ff6a00",
    flex: 1,
    padding: 14,
    marginLeft: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});



