import React from "react";
import { Linking, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NavigationContainer,
  type InitialState,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  AUTH_USER_CACHE_KEY,
  parseCachedAuthUser,
} from "@/lib/auth-cache-core";

const NAVIGATION_STATE_KEY = "@ironlog/navigation_state_v1";

type RootNavigationState = {
  index?: number;
  routes?: { name?: string }[];
};

function getActiveRootRouteName(state: RootNavigationState | undefined) {
  if (!state?.routes?.length) return undefined;
  const index = state.index ?? 0;
  return state.routes[index]?.name;
}

export default function App() {
  const [navigationReady, setNavigationReady] = React.useState(
    Platform.OS === "web",
  );
  const [initialNavigationState, setInitialNavigationState] =
    React.useState<InitialState>();

  React.useEffect(() => {
    if (navigationReady) return;

    async function restoreNavigationState() {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) return;

        const cachedAuthUser = parseCachedAuthUser(
          await AsyncStorage.getItem(AUTH_USER_CACHE_KEY),
        );
        if (!cachedAuthUser) {
          await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
          return;
        }

        const storedState = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        if (!storedState) return;

        try {
          setInitialNavigationState(JSON.parse(storedState) as InitialState);
        } catch {
          await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
        }
      } finally {
        setNavigationReady(true);
      }
    }

    restoreNavigationState();
  }, [navigationReady]);

  if (!navigationReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <NavigationContainer
                  initialState={initialNavigationState}
                  onStateChange={(state) => {
                    if (Platform.OS === "web") return;

                    if (getActiveRootRouteName(state) !== "Main") {
                      AsyncStorage.removeItem(NAVIGATION_STATE_KEY).catch(
                        (error) =>
                          console.error(
                            "Error clearing navigation state:",
                            error,
                          ),
                      );
                      return;
                    }

                    AsyncStorage.setItem(
                      NAVIGATION_STATE_KEY,
                      JSON.stringify(state),
                    ).catch((error) =>
                      console.error("Error saving navigation state:", error),
                    );
                  }}
                >
                  <RootStackNavigator />
                </NavigationContainer>
                <StatusBar style="auto" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
