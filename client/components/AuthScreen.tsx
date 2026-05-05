import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface AuthScreenProps {
  title: string;
  subtitle: string;
  error?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthScreen({ title, subtitle, error, children, footer }: AuthScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={authStyles.container}>
      <KeyboardAvoidingView
        style={authStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            authStyles.content,
            {
              paddingTop: insets.top + Spacing["4xl"],
              paddingBottom: insets.bottom + Spacing["2xl"],
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={authStyles.header}>
            <ThemedText style={authStyles.title}>{title}</ThemedText>
            <ThemedText style={[authStyles.subtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </ThemedText>
          </View>

          <View style={authStyles.form}>
            {error ? (
              <View style={[authStyles.errorBox, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText style={[authStyles.errorText, { color: theme.primary }]}>
                  {error}
                </ThemedText>
              </View>
            ) : null}

            {children}
          </View>

          {footer ? <View style={authStyles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  title: {
    ...Typography.hero,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  label: {
    ...Typography.small,
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    borderWidth: 1,
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
  errorBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  errorText: {
    ...Typography.small,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing["3xl"],
  },
  footerText: {
    ...Typography.body,
  },
  linkText: {
    ...Typography.body,
    fontWeight: "600",
  },
});
