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
import axios from "axios";
import { login, BACKEND_URL, getUserRole } from "../../services/api";
import { supabase } from "../../services/supabase";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  if (!email || !password) {
    setError("Email and password are required.");
    return;
  }

  setIsLoading(true);
  setError("");

  try {
    // Step 1: Authenticate via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new Error(error?.message || "Invalid login credentials.");
    }

    const { session, user } = data;

    if (!user.email_confirmed_at) {
      Alert.alert("Email Not Verified", "Please verify your email before logging in.");
      setIsLoading(false);
      return;
    }

    // Step 2: Store session
    await SecureStore.setItemAsync("accessToken", session.access_token ?? "");
    await SecureStore.setItemAsync("userId", user.id ?? "");
    await SecureStore.setItemAsync("userEmail", user.email ?? "");

    // Step 3: Set Supabase session
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    // Step 4: Get user role from backend
    console.log('Login - Getting user role with token:', session.access_token ? 'present' : 'missing');
    let role: string;
    try {
      const roleData = await getUserRole(session.access_token);
      role = roleData.role;
      console.log('Login - User role received:', role);
      await SecureStore.setItemAsync("userRole", role);
    } catch (roleError: any) {
      console.error('Login - Failed to get user role:', roleError);
      throw new Error(`Failed to get user role: ${roleError.message}`);
    }

    // Step 5: Navigate based on role
    if (role === "student") {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "MainApp",
            params: {
              screen: "StudentTabs",
              params: { screen: "StudentHome" },
            },
          },
        ],
      });
    } else if (role === "coach") {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "CoachMainApp",
            params: {
              screen: "CoachTabs",
              params: { screen: "CoachHome" },
            },
          },
        ],
      });
    } else {
      Alert.alert("Login Error", "Unknown user role.");
    }

  } catch (err: any) {
    console.error("Login error:", err.message);
    setError(err.message || "Login failed. Please check your credentials.");
  } finally {
    setIsLoading(false);
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
        editable={!isLoading}
      />

      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#999"
        editable={!isLoading}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginText}>
          {isLoading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.or}>or</Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => Alert.alert("Google Sign-In coming soon!")}
        disabled={isLoading}
      >
        <Text>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.signupPrompt}>Haven't signed up?</Text>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.becomeCoach}
          onPress={() => navigation.navigate("CoachSignup1")}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Become a Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.becomeStudent}
          onPress={() => navigation.navigate("StudentSignup1")}
          disabled={isLoading}
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
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#ff6a00",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginVertical: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
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
