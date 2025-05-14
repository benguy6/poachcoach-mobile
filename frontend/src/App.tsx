import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";

import CoachSignupScreen1 from "./screens/CoachSignupScreen1";
import StudentSignupScreen1 from "./screens/StudentSignupScreen1";
import CoachSignupScreen2 from "./screens/CoachSignupScreen2";
import StudentSignupScreen2 from "./screens/StudentSignupScreen2";


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="CoachSignup1" component={CoachSignupScreen1} />
        <Stack.Screen name="StudentSignup1" component={StudentSignupScreen1} />
        <Stack.Screen name="CoachSignup2" component={CoachSignupScreen2} />
        <Stack.Screen name="StudentSignup2" component={StudentSignupScreen2} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import EntryPage from "./screens/EntryPage";

<Stack.Navigator initialRouteName="Entry">
  <Stack.Screen name="Entry" component={EntryPage} options={{ headerShown: false }} />
  <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
  <Stack.Screen name="Signup" component={SignupScreen} />
  <Stack.Screen name="Dashboard" component={DashboardScreen} />
</Stack.Navigator>

