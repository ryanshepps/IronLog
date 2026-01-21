import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { FeelingDots } from "@/components/FeelingRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { WorkoutExercise, WorkoutSet } from "@/types/workout";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onAddSet: () => void;
  onEditSet: (set: WorkoutSet) => void;
  onRemoveExercise: () => void;
  units: "kg" | "lbs";
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SetRow({
  set,
  index,
  units,
  onPress,
}: {
  set: WorkoutSet;
  index: number;
  units: "kg" | "lbs";
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[
        styles.setRow,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
    >
      <View style={styles.setNumber}>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {index + 1}
        </ThemedText>
      </View>
      <View style={styles.setData}>
        <ThemedText type="bodyLarge" style={styles.setWeight}>
          {set.weight} {units}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {set.reps} reps
        </ThemedText>
      </View>
      <FeelingDots feeling={set.feeling} />
    </AnimatedPressable>
  );
}

export function ExerciseCard({
  exercise,
  onAddSet,
  onEditSet,
  onRemoveExercise,
  units,
  index,
}: ExerciseCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      layout={Layout.springify()}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundSecondary },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="h3" style={styles.exerciseName}>
          {exercise.exerciseName}
        </ThemedText>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRemoveExercise();
          }}
          hitSlop={12}
        >
          <Feather name="x" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      {exercise.sets.length > 0 ? (
        <View style={styles.setsContainer}>
          {exercise.sets.map((set, idx) => (
            <SetRow
              key={set.id}
              set={set}
              index={idx}
              units={units}
              onPress={() => onEditSet(set)}
            />
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onAddSet();
        }}
        style={({ pressed }) => [
          styles.addSetButton,
          {
            backgroundColor: theme.backgroundDefault,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="plus" size={20} color={theme.primary} />
        <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
          Add Set
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  exerciseName: {
    flex: 1,
    marginRight: Spacing.md,
  },
  setsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  setNumber: {
    width: 32,
    alignItems: "center",
  },
  setData: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  setWeight: {
    minWidth: 80,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
