import React, { useState, useEffect } from "react";
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

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      fetchUserInfo(authentication?.accessToken || "");
    }
  }, [response]);

  const fetchUserInfo = async (token: string) => {
    const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userInfo = await res.json();

    const emailExists = await checkEmailExists(userInfo.email);
    if (emailExists) {
      Alert.alert("Email already in use", "Redirecting to login screen.");
      navigation.navigate("CoachSignup1", {
        error: "Email already in use",
      });
    } else {
      navigation.navigate("CoachSignupScreen2", {
        email: userInfo.email,
        isGoogleUser: true,
      });
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
        const res = await fetch("http://172.20.10.3:3000/api/user/checkEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data.exists;
    } catch (err) {
      console.error("Email check failed:", err);
      return false;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const result = await login(email, password);
      await SecureStore.setItemAsync("userId", result.user.id);
      await SecureStore.setItemAsync("userRole", result.user.role);
      await SecureStore.setItemAsync("userEmail", result.user.email);
      navigation.navigate("Dashboard"); // i.e. /me
    } catch (err: any) {
      console.error("Login error:", err.message);
      setError(err.message || "Login failed");
    }
  };

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

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/poach-icon.png")} style={styles.logo} />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#999"
      />
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
        onPress={() => promptAsync()}
        disabled={!request}
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
