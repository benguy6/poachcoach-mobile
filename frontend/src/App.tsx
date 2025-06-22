import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomNavigation from "./components/BottomNavigation";
import * as Linking from "expo-linking";
import { studentTabs } from "./constants/studentTabs";

// Auth Screens
import EntryPage from "./screens/auth/EntryPage";
import LoginScreen from "./screens/auth/LoginScreen";
import ResetPasswordScreen from "./screens/auth/ResetPasswordScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";
import CoachSignupScreen1 from "./screens/auth/CoachSignupScreen1";
import CoachSignupScreen2 from "./screens/auth/CoachSignupScreen2";
import StudentSignupScreen1 from "./screens/auth/StudentSignupScreen1";
import StudentSignupScreen2 from "./screens/auth/StudentSignupScreen2";

// Student Main Screens
import {
  StudentHomePage,
  StudentCalendarPage,
  StudentBookingPage,
  StudentChatPage,
  StudentWalletPage,
  StudentNotificationsPage,
  StudentSettingPage,
  StudentChatDetailPage,
  StudentWalletTopUpPage,
} from "./screens/studentmain";
import StudentProfilePage from "./screens/studentmain/StudentProfilePage";
import StudentConfirmPaymentPage from "./screens/studentmain/StudentConfirmPaymentPage";

// Coach Main Screens
import {
  CoachHomePage,
  CoachWalletPage,
  CoachCreateSessionPage,
  CoachCalendarPage,
  CoachSettingPage,
  CoachNotificationsPage,
  CoachChatPage,
} from "./screens/coachmain";

// Navigation Types
export type RootStackParamList = {
  Entry: undefined;
  Login: undefined;
  ForgotPasswordScreen: undefined;
  ResetPassword: undefined;
  CoachSignup1: undefined;
  CoachSignup2: undefined;
  StudentSignup1: undefined;
  StudentSignup2: undefined;
  MainApp: undefined;
  CoachMainApp: undefined;
};

export type MainAppStackParamList = {
  StudentTabs: undefined;
  StudentNotifications: undefined;
  StudentSettings: undefined;
  StudentChatDetail: { contact?: any; messages?: any[] };
  StudentWalletTopUp: undefined;
  StudentWalletTopUpPage: undefined;
  StudentConfirmPayment: {
    amount?: number;
    paymentMethod?: string;
    coachName?: string;
    sessionType?: string;
    sessionDate?: string;
    sessionTime?: string;
    pricePerSession?: number;
  };
};

export type StudentTabParamList = {
  StudentHome: undefined;
  StudentCalendar: undefined;
  StudentBooking: undefined;
  StudentChat: undefined;
  StudentWallet: undefined;
  StudentProfile: undefined;
};

// Coach Navigation Types
export type CoachTabParamList = {
  CoachHome: undefined;
  CoachCalendar: undefined;
  CoachCreateSession: undefined;
  CoachChat: undefined;
  CoachWallet: undefined;
};

export type CoachMainStackParamList = {
  CoachTabs: undefined;
  CoachNotifications: undefined;
  CoachSettings: undefined;
  // Add more coach stack screens here if needed
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainAppStackParamList>();
const Tab = createBottomTabNavigator<StudentTabParamList>();
const CoachTab = createBottomTabNavigator<CoachTabParamList>();
const CoachMainStack = createNativeStackNavigator<CoachMainStackParamList>();

// Student Bottom Tab Navigator

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={({ navigation, state }) => (
      <BottomNavigation
        activeTab={state.routeNames[state.index]}
        onTabPress={(tabId) => navigation.navigate(tabId)}
        tabs={studentTabs}
      />
    )}
  >
    <Tab.Screen name="StudentHome" component={StudentHomePage} />
    <Tab.Screen name="StudentCalendar" component={StudentCalendarPage} />
    <Tab.Screen name="StudentBooking" component={StudentBookingPage} />
    <Tab.Screen name="StudentChat" component={StudentChatPage} />
    <Tab.Screen name="StudentWallet" component={StudentWalletPage} />
    <Tab.Screen name="StudentProfile">
      {(props) => (
        <StudentProfilePage
          {...props}
          userProfile={{
            name: 'John Doe',
            level: 'Intermediate',
            location: 'Sengkang, SG',
            totalClasses: 42,
            email: 'john.doe@email.com',
            phone: '+65 9123 4567',
            joinDate: 'Jan 2024',
            goals: 'Stay fit and learn yoga',
            favoriteActivities: ['Cricket', 'Yoga'],
          }}
          achievements={[
            { id: 1, icon: '🎯', title: 'Started', date: 'Jan 2024' },
            { id: 2, icon: '🔥', title: '5-Day Streak', date: 'Feb 2024' },
          ]}
          onEdit={() => console.log("Edit tapped")}
          onSettings={() => props.navigation.navigate("StudentSettings")}
        />
      )}
    </Tab.Screen>
  </Tab.Navigator>
);

// Coach Bottom Tab Navigator
const coachTabs = [
  { id: 'CoachHome', icon: 'home', iconOutline: 'home-outline' },
  { id: 'CoachCalendar', icon: 'calendar', iconOutline: 'calendar-outline' },
  { id: 'CoachCreateSession', icon: 'add', iconOutline: 'add', isCenter: true },
  { id: 'CoachChat', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
  { id: 'CoachWallet', icon: 'wallet', iconOutline: 'wallet-outline' },
];

const CoachTabs = () => (
  <CoachTab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={({ navigation, state }) => (
      <BottomNavigation
        activeTab={state.routeNames[state.index]}
        onTabPress={(tabId) => navigation.navigate(tabId)}
        tabs={coachTabs}
      />
    )}
  >
    <CoachTab.Screen name="CoachHome" component={CoachHomePage} />
    <CoachTab.Screen name="CoachCalendar" component={CoachCalendarPage} />
    <CoachTab.Screen name="CoachCreateSession" component={CoachCreateSessionPage} />
    <CoachTab.Screen name="CoachChat" component={CoachChatPage} />
    <CoachTab.Screen name="CoachWallet" component={CoachWalletPage} />
  </CoachTab.Navigator>
);

// Main App Stack Navigator
const MainAppStack = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    {/* Main Tab Navigation */}
    <MainStack.Screen name="StudentTabs" component={StudentTabs} />
    
    {/* Modal/Detail Screens */}
    <MainStack.Screen name="StudentNotifications" component={StudentNotificationsPage} />
    
    <MainStack.Screen name="StudentSettings">
      {(props) => (
        <StudentSettingPage
          {...props}
          onBack={() => props.navigation.goBack()}
          onEditProfile={() => console.log("Edit profile")}
          darkMode={false}
          setDarkMode={(v) => console.log("Set dark mode:", v)}
          notifications={{
            classReminders: true,
            newMessages: true,
            promotions: false,
            weeklyProgress: true,
          }}
          setNotifications={(val) => console.log("Set notifications:", val)}
        />
      )}
    </MainStack.Screen>

    <MainStack.Screen name="StudentChatDetail">
      {(props) => (
        <StudentChatDetailPage
          {...props}
          contact={props.route.params?.contact}
          messages={props.route.params?.messages ?? []}
          onBack={() => props.navigation.goBack()}
        />
      )}
    </MainStack.Screen>

    {/* Wallet Related Screens */}
    <MainStack.Screen name="StudentWalletTopUp" component={StudentWalletTopUpPage} />
    
    <MainStack.Screen name="StudentConfirmPayment">
      {(props) => (
        <StudentConfirmPaymentPage
          {...props}
          amount={props.route.params?.amount}
          paymentMethod={props.route.params?.paymentMethod}
          coachName={props.route.params?.coachName}
          sessionType={props.route.params?.sessionType}
          sessionDate={props.route.params?.sessionDate}
          sessionTime={props.route.params?.sessionTime}
          pricePerSession={props.route.params?.pricePerSession}
          onBack={() => props.navigation.goBack()}
          onConfirm={() => {
            // Handle payment confirmation
            console.log("Payment confirmed");
            props.navigation.navigate("StudentWallet");
          }}
        />
      )}
    </MainStack.Screen>
  </MainStack.Navigator>
);

// Coach Main Stack Navigator
const CoachMainApp = () => (
  <CoachMainStack.Navigator screenOptions={{ headerShown: false }}>
    <CoachMainStack.Screen name="CoachTabs" component={CoachTabs} />
    <CoachMainStack.Screen name="CoachNotifications" component={CoachNotificationsPage} />
    <CoachMainStack.Screen name="CoachSettings">
      {(props) => (
        <CoachSettingPage
          {...props}
          onBack={() => props.navigation.goBack()}
          onEditProfile={() => console.log("Edit profile")}
          darkMode={false}
          setDarkMode={(v) => console.log("Set dark mode:", v)}
          notifications={{
            classReminders: true,
            newMessages: true,
            promotions: false,
            weeklyProgress: true,
          }}
          setNotifications={(val) => console.log("Set notifications:", val)}
        />
      )}
    </CoachMainStack.Screen>
    {/* Add more stack screens here if needed */}
  </CoachMainStack.Navigator>
);

// Deep Linking Configuration
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
      ForgotPasswordScreen: "forgot-password",
      ResetPassword: "reset-password",
      CoachSignup1: "coach-signup1",
      CoachSignup2: "coach-signup2",
      StudentSignup1: "student-signup1",
      StudentSignup2: "student-signup2",
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
          StudentWalletTopUp: "wallet/topup",
          StudentConfirmPayment: "wallet/confirm-payment",
        },
      },
      CoachMainApp: {
        path: "coach",
        screens: {
          CoachTabs: {
            path: "tabs",
            screens: {
              CoachHome: "home",
              CoachCalendar: "calendar",
              CoachCreateSession: "create-session",
              CoachChat: "chat",
              CoachWallet: "wallet",
            },
          },
          CoachNotifications: "notifications",
          CoachSettings: "settings",
        },
      },
    },
  },
};

// Main App Component
export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator 
        initialRouteName="Entry" 
        screenOptions={{ headerShown: false }}
      >
        {/* Authentication Flow */}
        <Stack.Screen name="Entry" component={EntryPage} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Signup Flow */}
        <Stack.Screen name="CoachSignup1" component={CoachSignupScreen1} />
        <Stack.Screen name="CoachSignup2" component={CoachSignupScreen2} />
        <Stack.Screen name="StudentSignup1" component={StudentSignupScreen1} />
        <Stack.Screen name="StudentSignup2" component={StudentSignupScreen2} />

        {/* Main Application */}
        <Stack.Screen name="MainApp" component={MainAppStack} />
        <Stack.Screen name="CoachMainApp" component={CoachMainApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}