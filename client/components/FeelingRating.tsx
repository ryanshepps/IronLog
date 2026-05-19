import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FeelingRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "small" | "large";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FeelingButton({
  rating,
  isSelected,
  onPress,
  size,
}: {
  rating: number;
  isSelected: boolean;
  onPress: () => void;
  size: "small" | "large";
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const getColor = () => {
    if (rating <= 3) return theme.feelingEasy;
    if (rating <= 7) return theme.feelingModerate;
    return theme.feelingHard;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const fontSize = size === "large" ? 17 : 13;
  const aspectRatio = 1;

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        {
          aspectRatio,
          borderRadius: 999,
          backgroundColor: isSelected ? getColor() : theme.backgroundSecondary,
          borderWidth: isSelected ? 0 : 1,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <ThemedText
        style={[
          styles.buttonText,
          {
            fontSize,
            color: isSelected ? "#FFFFFF" : theme.textSecondary,
            fontWeight: isSelected ? "700" : "500",
          },
        ]}
      >
        {rating}
      </ThemedText>
    </AnimatedPressable>
  );
}

export function FeelingRating({
  value,
  onChange,
  size = "large",
}: FeelingRatingProps) {
  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {ratings.map((rating) => (
          <FeelingButton
            key={rating}
            rating={rating}
            isSelected={value === rating}
            onPress={() => onChange(rating)}
            size={size}
          />
        ))}
      </View>
      <View style={styles.labels}>
        <ThemedText type="caption" style={styles.label}>
          Too Easy
        </ThemedText>
        <ThemedText type="caption" style={styles.label}>
          Max Effort
        </ThemedText>
      </View>
    </View>
  );
}

export function FeelingDots({
  feeling,
  size = "default",
}: {
  feeling: number;
  size?: "default" | "small";
}) {
  const { theme } = useTheme();
  const dotSize = size === "small" ? 4 : 6;

  const getColor = () => {
    if (feeling <= 3) return theme.feelingEasy;
    if (feeling <= 7) return theme.feelingModerate;
    return theme.feelingHard;
  };

  return (
    <View style={styles.dotsContainer}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor:
                i <= feeling ? getColor() : theme.backgroundSecondary,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    textAlign: "center",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  label: {
    opacity: 0.6,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
