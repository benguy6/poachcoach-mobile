import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Linking from "expo-linking";

// Auth Screens
import EntryPage from "./screens/auth/EntryPage";
import LoginScreen from "./screens/auth/LoginScreen";
import ResetPasswordScreen from "./screens/auth/ResetPasswordScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import CoachSignupScreen1 from "./screens/auth/CoachSignupScreen1";
import CoachSignupScreen2 from "./screens/auth/CoachSignupScreen2";
import StudentSignupScreen1 from "./screens/auth/StudentSignupScreen1";
import StudentSignupScreen2 from "./screens/auth/StudentSignupScreen2";

// Dashboard Screens
import DashboardScreen from "./screens/DashboardScreen";

// Student Main Screens (from barrel)
import {
  StudentHomePage,
  StudentCalendarPage,
  StudentBookingPage,
  StudentChatPage,
  StudentWalletPage,
  StudentProfilePage,
  StudentNotificationsScreen,
  StudentSettingsScreen,
  StudentChatDetailScreen,
} from "./screens/studentmain";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Student Bottom Tab Navigator
const StudentTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="StudentHome" component={StudentHomePage} />
    <Tab.Screen name="StudentCalendar" component={StudentCalendarPage} />
    <Tab.Screen name="StudentBooking" component={StudentBookingPage} />
    <Tab.Screen name="StudentChat" component={StudentChatPage} />
    <Tab.Screen name="StudentWallet" component={StudentWalletPage} />
    <Tab.Screen name="StudentProfile" component={StudentProfilePage} />
  </Tab.Navigator>
);

// Main App Stack with custom bottom navigation
const MainAppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudentTabs" component={StudentTabs} />
    <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
    <Stack.Screen name="StudentSettings" component={StudentSettingsScreen} />
    <Stack.Screen
      name="StudentChatDetail"
      component={StudentChatDetailScreen}
      options={{
        headerShown: true,
        headerTitle: "Chat",
      }}
    />
  </Stack.Navigator>
);

const linking = {
  prefixes: [
    Linking.createURL("/"),
    "poachcoach://",
    "https://yourdomain.com",
  ],
  config: {
    screens: {
      Entry: "entry",
      Login: "login",
      Signup: "signup",
      Dashboard: "dashboard",
      CoachSignup1: "coach-signup1",
      CoachSignup2: "coach-signup2",
      StudentSignup1: "student-signup1",
      StudentSignup2: "student-signup2",
      ForgotPasswordScreen: "forgot-password",
      ResetPassword: "reset-password",
      MainApp: {
        path: "main",
        screens: {
          StudentTabs: {
            path: "tabs",
            screens: {
              StudentHome: "home",
              StudentCalendar: "calendar",
              StudentBooking: "booking",
              StudentChat: "chat",
              StudentWallet: "wallet",
              StudentProfile: "profile",
            },
          },
          StudentNotifications: "notifications",
          StudentSettings: "settings",
          StudentChatDetail: "chat/:chatId",
        },
      },
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Entry" screenOptions={{ headerShown: false }}>
        {/* Authentication Screens */}
        <Stack.Screen name="Entry" component={EntryPage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Signup Screens */}
        <Stack.Screen name="CoachSignup1" component={CoachSignupScreen1} />
        <Stack.Screen name="CoachSignup2" component={CoachSignupScreen2} />
        <Stack.Screen name="StudentSignup1" component={StudentSignupScreen1} />
        <Stack.Screen name="StudentSignup2" component={StudentSignupScreen2} />

        {/* Dashboard */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />

        {/* Main App with Custom Bottom Navigation */}
        <Stack.Screen name="MainApp" component={MainAppStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}