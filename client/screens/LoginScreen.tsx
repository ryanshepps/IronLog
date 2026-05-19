import React, { useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { AuthScreen, authStyles } from "@/components/AuthScreen";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const message = err?.message || "Login failed";
      if (message.includes("401")) {
        setError("Invalid email or password");
      } else {
        setError("Failed to login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen
      title="IronLog"
      subtitle="Track your lifts. Build strength."
      error={error}
      footer={
        <>
          <ThemedText
            style={[authStyles.footerText, { color: theme.textSecondary }]}
          >
            Don&apos;t have an account?
          </ThemedText>
          <Pressable
            onPress={() => navigation.navigate("Signup")}
            testID="button-go-signup"
          >
            <ThemedText style={[authStyles.linkText, { color: theme.primary }]}>
              Sign Up
            </ThemedText>
          </Pressable>
        </>
      }
    >
      <View style={authStyles.inputGroup}>
        <ThemedText style={authStyles.label}>Email</ThemedText>
        <TextInput
          style={[
            authStyles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="you@example.com"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          testID="input-email"
        />
      </View>

      <View style={authStyles.inputGroup}>
        <ThemedText style={authStyles.label}>Password</ThemedText>
        <TextInput
          style={[
            authStyles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Enter your password"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          testID="input-password"
        />
      </View>

      <Pressable
        style={[
          authStyles.button,
          { backgroundColor: theme.primary },
          isLoading && authStyles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={isLoading}
        testID="button-login"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText style={authStyles.buttonText}>Log In</ThemedText>
        )}
      </Pressable>
    </AuthScreen>
  );
}
