import React, { useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomNavigation from "./components/BottomNavigation";
import * as Linking from "expo-linking";
import { studentTabs } from "./constants/studentTabs";
import SelectBookeeModal from "./components/SelectBookeeModal";
import { NotificationProvider } from "./context/NotificationContext";


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
  StudentProfilePage,
} from "./screens/studentmain";
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
  CoachProfilePage,
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
  CoachProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const MainStack = createNativeStackNavigator<MainAppStackParamList>();
const Tab = createBottomTabNavigator<StudentTabParamList>();
const CoachTab = createBottomTabNavigator<CoachTabParamList>();
const CoachMainStack = createNativeStackNavigator<CoachMainStackParamList>();

const StudentTabs = () => {
  const [showBookeeModal, setShowBookeeModal] = React.useState(false);
  const modalRef = useRef<any>(null);
  const tabNavRef = useRef<any>(null);

  const handleTabPress = (tabId: keyof StudentTabParamList) => {
    if (tabId === 'StudentBooking') {
      setShowBookeeModal(true);
    } else {
      tabNavRef.current?.navigate(tabId);
    }
  };

  const handleSelect = () => {
    if (modalRef.current?.animateOut) {
      modalRef.current.animateOut(() => {
        setShowBookeeModal(false);
        tabNavRef.current?.navigate('StudentBooking');
      });
    } else {
      setShowBookeeModal(false);
      tabNavRef.current?.navigate('StudentBooking');
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={({ navigation, state }) => {
          tabNavRef.current = navigation;
          return (
            <>
              <SelectBookeeModal
                ref={modalRef}
                visible={showBookeeModal}
                userName="Vansh"
                children={[{ name: "Aanya" }]}
                onClose={() => setShowBookeeModal(false)}
                onSelect={handleSelect}
              />
              <BottomNavigation
                activeTab={state.routeNames[state.index]}
                onTabPress={handleTabPress}
                tabs={studentTabs}
              />
            </>
          );
        }}
      >
        <Tab.Screen name="StudentHome" component={StudentHomePage} />
        <Tab.Screen name="StudentCalendar" component={StudentCalendarPage} />
        <Tab.Screen name="StudentBooking" component={StudentBookingPage} />
        <Tab.Screen name="StudentChat" component={StudentChatPage} />
        <Tab.Screen name="StudentWallet" component={StudentWalletPage} />
        <Tab.Screen
          name="StudentProfile"
          component={StudentProfilePage}
        />
      </Tab.Navigator>
    </>
  );
};

const CoachTabs = () => {
  return (
    <CoachTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ navigation, state }) => (
        <BottomNavigation
          activeTab={state.routeNames[state.index]}
          onTabPress={(tabId) => navigation.navigate(tabId as any)}
          tabs={[
            { id: 'CoachHome', icon: 'home', iconOutline: 'home-outline' },
            { id: 'CoachCalendar', icon: 'calendar', iconOutline: 'calendar-outline' },
            { id: 'CoachCreateSession', icon: 'add', iconOutline: 'add', isCenter: true },
            { id: 'CoachChat', icon: 'chatbubble', iconOutline: 'chatbubble-outline' },
            { id: 'CoachWallet', icon: 'wallet', iconOutline: 'wallet-outline' },
          ]}
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
};

// Create wrapper components for screens that need props
const StudentSettingsWrapper = (props: any) => (
  <StudentSettingPage
    {...props}
    onBack={() => props.navigation.goBack()}
    notifications={{
      classReminders: true,
      messages: true,
      payments: true,
      achievements: true,
      marketing: false,
    }}
    setNotifications={() => {}}
  />
);

const StudentChatDetailWrapper = (props: any) => (
  <StudentChatDetailPage
    {...props}
    contact={{ avatar: '', name: '' }}
    messages={[]}
    onBack={() => props.navigation.goBack()}
  />
);

const CoachSettingsWrapper = (props: any) => (
  <CoachSettingPage
    {...props}
    onBack={() => props.navigation.goBack()}
    notifications={{
      classReminders: true,
      messages: true,
      payments: true,
      achievements: true,
      marketing: false,
    }}
    setNotifications={() => {}}
  />
);

const App = () => {
  return (
    <NotificationProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Entry"
        >
          <Stack.Screen name="Entry" component={EntryPage} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="CoachSignup1" component={CoachSignupScreen1} />
          <Stack.Screen name="CoachSignup2" component={CoachSignupScreen2} />
          <Stack.Screen name="StudentSignup1" component={StudentSignupScreen1} />
          <Stack.Screen name="StudentSignup2" component={StudentSignupScreen2} />
          
          <Stack.Screen name="MainApp" component={MainApp} />
          <Stack.Screen name="CoachMainApp" component={CoachMainApp} />
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationProvider>
  );
};

const MainApp = () => {
  return (
    <MainStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="StudentTabs"
    >
      <MainStack.Screen name="StudentTabs" component={StudentTabs} />
      <MainStack.Screen name="StudentNotifications" component={StudentNotificationsPage} />
      <MainStack.Screen name="StudentSettings" component={StudentSettingsWrapper} />
      <MainStack.Screen name="StudentChatDetail" component={StudentChatDetailWrapper} />
      <MainStack.Screen name="StudentWalletTopUp" component={StudentWalletTopUpPage} />
      <MainStack.Screen name="StudentConfirmPayment" component={StudentConfirmPaymentPage} />
    </MainStack.Navigator>
  );
};

const CoachMainApp = () => {
  return (
    <CoachMainStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="CoachTabs"
    >
      <CoachMainStack.Screen name="CoachTabs" component={CoachTabs} />
      <CoachMainStack.Screen name="CoachNotifications" component={CoachNotificationsPage} />
      <CoachMainStack.Screen name="CoachSettings" component={CoachSettingsWrapper} />
      <CoachMainStack.Screen name="CoachProfile" component={CoachProfilePage} />
    </CoachMainStack.Navigator>
  );
};

export default App;
