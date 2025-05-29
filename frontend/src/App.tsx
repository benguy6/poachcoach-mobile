import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";

import EntryPage from "./screens/EntryPage";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import StudentDashboard from "./screens/StudentDashboard";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";

import CoachSignupScreen1 from "./screens/CoachSignupScreen1";
import StudentSignupScreen1 from "./screens/StudentSignupScreen1";
import CoachSignupScreen2 from "./screens/CoachSignupScreen2";
import StudentSignupScreen2 from "./screens/StudentSignupScreen2";

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL('/');
// 🔗 Deep linking configuration
const linking = {
  prefixes: [
    "https://yourdomain.com",
    "exp://172.20.10.3:19000",
    "poachcoach://"
  ],
  config: {
    screens: {
      Entry: "entry",
      Login: "login",
      Signup: "signup",
      CoachSignup1: "coach-signup1",
      StudentSignup1: "student-signup1",
      CoachSignup2: "coach-signup2",
      StudentSignup2: "student-signup2",
      StudentDashboard: "me",
      Dashboard: "dashboard",
      ForgotPasswordScreen: "forgot-password",
      ResetPassword: "reset-password",
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Entry">
        <Stack.Screen name="Entry" component={EntryPage} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="CoachSignup1" component={CoachSignupScreen1} />
        <Stack.Screen name="StudentSignup1" component={StudentSignupScreen1} />
        <Stack.Screen name="CoachSignup2" component={CoachSignupScreen2} />
        <Stack.Screen name="StudentSignup2" component={StudentSignupScreen2} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
