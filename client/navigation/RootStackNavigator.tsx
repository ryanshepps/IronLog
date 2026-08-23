import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { getStartupAuthRoute } from "@/lib/auth-cache-core";

export type RootStackParamList = {
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <AuthStack.Navigator
      screenOptions={{ ...screenOptions, headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootStackNavigator() {
  const { authHydrated, user } = useAuth();
  const screenOptions = useScreenOptions();
  const startupRoute = getStartupAuthRoute(authHydrated, user);

  if (startupRoute === "pending") {
    return null;
  }

  if (startupRoute === "auth") {
    return <AuthNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
