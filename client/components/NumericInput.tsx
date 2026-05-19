import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { sanitizeNumericInput, clampNumber } from "@/lib/numeric";

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
}

export function NumericInput({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min = 0,
  max = 9999,
}: NumericInputProps) {
  const { theme } = useTheme();
  const [text, setText] = useState(value.toString());

  useEffect(() => {
    const parsed = parseFloat(text);
    if (isNaN(parsed) || parsed !== value) {
      setText(value.toString());
    }
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    if (newValue !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    if (newValue !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    }
  };

  const handleTextChange = (next: string) => {
    const normalized = sanitizeNumericInput(next);
    setText(normalized);
    if (normalized === "" || normalized === ".") {
      onChange(min);
      return;
    }
    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      onChange(clampNumber(num, min, max));
    }
  };

  const handleBlur = () => {
    const num = parseFloat(text);
    if (isNaN(num)) setText(value.toString());
  };

  return (
    <View style={styles.container}>
      <ThemedText
        type="small"
        style={[styles.label, { color: theme.textSecondary }]}
      >
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Pressable
          onPress={handleDecrement}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="minus" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.valueContainer}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={text}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          {unit ? (
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {unit}
            </ThemedText>
          ) : null}
        </View>

        <Pressable
          onPress={handleIncrement}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="plus" size={24} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    height: Spacing.inputHeight,
  },
  button: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  valueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  input: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 60,
  },
});
