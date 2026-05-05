import React, { useState } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { AuthScreen, authStyles } from "@/components/AuthScreen";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Signup">;

export default function SignupScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await signup(email.trim().toLowerCase(), password, displayName.trim() || undefined);
    } catch (err: any) {
      const message = err?.message || "Signup failed";
      if (message.includes("400") && message.includes("Email")) {
        setError("This email is already registered");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Create Account"
      subtitle="Start tracking your workouts today"
      error={error}
      footer={
        <>
          <ThemedText style={[authStyles.footerText, { color: theme.textSecondary }]}>
            Already have an account?
          </ThemedText>
          <Pressable onPress={() => navigation.navigate("Login")} testID="button-go-login">
            <ThemedText style={[authStyles.linkText, { color: theme.primary }]}>
              Log In
            </ThemedText>
          </Pressable>
        </>
      }
    >
      <View style={authStyles.inputGroup}>
        <ThemedText style={authStyles.label}>Display Name (optional)</ThemedText>
        <TextInput
          style={[
            authStyles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Your name"
          placeholderTextColor={theme.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoCorrect={false}
          testID="input-displayname"
        />
      </View>

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
          placeholder="At least 6 characters"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          testID="input-password"
        />
      </View>

      <Pressable
        style={[
          authStyles.button,
          { backgroundColor: theme.primary },
          isLoading && authStyles.buttonDisabled,
        ]}
        onPress={handleSignup}
        disabled={isLoading}
        testID="button-signup"
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText style={authStyles.buttonText}>Create Account</ThemedText>
        )}
      </Pressable>
    </AuthScreen>
  );
}
