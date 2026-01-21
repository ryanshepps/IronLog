import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { NumericInput } from "@/components/NumericInput";
import { FeelingRating } from "@/components/FeelingRating";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { WorkoutSet, ExerciseHistory } from "@/types/workout";

interface LogSetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, reps: number, feeling: number) => void;
  onDelete?: () => void;
  exerciseName: string;
  lastPerformance?: ExerciseHistory | null;
  editingSet?: WorkoutSet | null;
  units: "kg" | "lbs";
}

export function LogSetModal({
  visible,
  onClose,
  onSave,
  onDelete,
  exerciseName,
  lastPerformance,
  editingSet,
  units,
}: LogSetModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [feeling, setFeeling] = useState(5);

  useEffect(() => {
    if (visible) {
      if (editingSet) {
        setWeight(editingSet.weight);
        setReps(editingSet.reps);
        setFeeling(editingSet.feeling);
      } else if (lastPerformance) {
        setWeight(lastPerformance.lastWeight);
        setReps(lastPerformance.lastReps);
        setFeeling(lastPerformance.lastFeeling);
      } else {
        setWeight(0);
        setReps(0);
        setFeeling(5);
      }
    }
  }, [visible, editingSet, lastPerformance]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(weight, reps, feeling);
    onClose();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.();
    onClose();
  };

  const showSuggestion =
    lastPerformance &&
    lastPerformance.lastFeeling <= 3 &&
    weight === lastPerformance.lastWeight;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText type="body" style={{ color: theme.primary }}>
              Cancel
            </ThemedText>
          </Pressable>
          <ThemedText type="h4" numberOfLines={1} style={styles.headerTitle}>
            {exerciseName}
          </ThemedText>
          <Pressable onPress={handleSave} hitSlop={12}>
            <ThemedText
              type="body"
              style={{ color: theme.primary, fontWeight: "600" }}
            >
              Save
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.content}>
          {showSuggestion ? (
            <View
              style={[
                styles.suggestion,
                { backgroundColor: theme.feelingEasy + "20" },
              ]}
            >
              <Feather name="trending-up" size={18} color={theme.feelingEasy} />
              <ThemedText
                type="small"
                style={{ color: theme.feelingEasy, flex: 1, marginLeft: Spacing.sm }}
              >
                Last set felt easy! Consider increasing weight.
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.inputsRow}>
            <View style={styles.inputWrapper}>
              <NumericInput
                label="Weight"
                value={weight}
                onChange={setWeight}
                unit={units}
                step={5}
                min={0}
                max={2000}
              />
            </View>
            <View style={styles.inputWrapper}>
              <NumericInput
                label="Reps"
                value={reps}
                onChange={setReps}
                step={1}
                min={0}
                max={999}
              />
            </View>
          </View>

          <View style={styles.feelingSection}>
            <ThemedText
              type="small"
              style={[styles.feelingLabel, { color: theme.textSecondary }]}
            >
              How did it feel?
            </ThemedText>
            <FeelingRating value={feeling} onChange={setFeeling} size="large" />
          </View>

          {editingSet && onDelete ? (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  backgroundColor: theme.error + "15",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
              <ThemedText type="body" style={{ color: theme.error }}>
                Delete Set
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <ThemedText
              type="body"
              style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18 }}
            >
              {editingSet ? "Update Set" : "Log Set"}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["2xl"],
  },
  inputsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  inputWrapper: {
    flex: 1,
  },
  feelingSection: {
    marginBottom: Spacing["3xl"],
  },
  feelingLabel: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
