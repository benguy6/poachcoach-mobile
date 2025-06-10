import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";

import EntryPage from "./screens/EntryPage";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import StudentDashboard from "./screens/StudentDashboard";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import CoachSignupScreen1 from "./screens/CoachSignupScreen1";
import StudentSignupScreen1 from "./screens/StudentSignupScreen1";
import CoachSignupScreen2 from "./screens/CoachSignupScreen2";
import StudentSignupScreen2 from "./screens/StudentSignupScreen2";

const Stack = createNativeStackNavigator();


const linking = {
  prefixes: [
    Linking.createURL("/"),       
    "poachcoach://",              
    "https://yourdomain.com"      
  ],
  config: {
    screens: {
      Entry: "entry",
      Login: "login",
      Signup: "signup",
      Dashboard: "dashboard",
      StudentDashboard: "me",
      CoachSignup1: "coach-signup1",
      StudentSignup1: "student-signup1",
      CoachSignup2: "coach-signup2",
      StudentSignup2: "student-signup2",
      ForgotPasswordScreen: "forgot-password",
      ResetPassword: "reset-password", 
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Entry" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Entry" component={EntryPage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CoachSignup1" component={CoachSignupScreen1} />
        <Stack.Screen name="CoachSignup2" component={CoachSignupScreen2} />
        <Stack.Screen name="StudentSignup1" component={StudentSignupScreen1} />
        <Stack.Screen name="StudentSignup2" component={StudentSignupScreen2} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

