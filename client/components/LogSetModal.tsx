import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { NumericInput } from "@/components/NumericInput";
import { FeelingRating } from "@/components/FeelingRating";
import { ExerciseHistoryModal } from "@/components/ExerciseHistoryModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { WorkoutSet, ExerciseHistory } from "@/types/workout";
import { getExercisePerformanceHistory } from "@/lib/storage";

interface LogSetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, reps: number, feeling: number) => void;
  onDelete?: () => void;
  onDeleteSet?: (setId: string) => void;
  exerciseId: string;
  exerciseName: string;
  lastPerformance?: ExerciseHistory | null;
  editingSet?: WorkoutSet | null;
  units: "kg" | "lbs";
  currentSets?: WorkoutSet[];
}

export function LogSetModal({
  visible,
  onClose,
  onSave,
  onDelete,
  onDeleteSet,
  exerciseId,
  exerciseName,
  lastPerformance,
  editingSet,
  units,
  currentSets = [],
}: LogSetModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [feeling, setFeeling] = useState(5);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSessionAvgFeeling, setLastSessionAvgFeeling] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !exerciseId) {
      setLastSessionAvgFeeling(null);
      return;
    }
    let cancelled = false;
    getExercisePerformanceHistory(exerciseId).then((entries) => {
      if (cancelled) return;
      const prev = entries.find((e) => e.sets.length > 0 && e.timestamp !== editingSet?.timestamp);
      if (prev && prev.sets.length > 0) {
        const avg = prev.sets.reduce((a, s) => a + s.feeling, 0) / prev.sets.length;
        setLastSessionAvgFeeling(avg);
      } else {
        setLastSessionAvgFeeling(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visible, exerciseId, editingSet?.timestamp]);

  useEffect(() => {
    if (visible) {
      if (editingSet) {
        setWeight(editingSet.weight);
        setReps(editingSet.reps);
        setFeeling(editingSet.feeling);
      } else if (currentSets.length > 0) {
        // Use the last logged set's values for the next set
        const lastSet = currentSets[currentSets.length - 1];
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
        setFeeling(lastSet.feeling);
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
  }, [visible, editingSet, lastPerformance, currentSets.length]);

  const handleSaveAndClose = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(weight, reps, feeling);
    onClose();
  };

  const handleDone = () => {
    onClose();
  };

  const handleAddAnother = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(weight, reps, feeling);
    // Values stay the same for next set - user can adjust if needed
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.();
    onClose();
  };

  const showSuggestion =
    lastPerformance &&
    lastSessionAvgFeeling !== null &&
    lastSessionAvgFeeling <= 3 &&
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
              Done
            </ThemedText>
          </Pressable>
          <ThemedText type="h4" numberOfLines={1} style={styles.headerTitle}>
            {exerciseName}
          </ThemedText>
          <Pressable 
            onPress={() => setShowHistory(true)} 
            hitSlop={12}
            style={styles.historyButton}
          >
            <Feather name="bar-chart-2" size={20} color={theme.primary} />
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Show already logged sets */}
          {!editingSet && currentSets.length > 0 ? (
            <View style={styles.loggedSetsSection}>
              <ThemedText
                type="small"
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                Sets logged this session (tap to delete)
              </ThemedText>
              <View style={styles.loggedSetsList}>
                {currentSets.map((set, index) => (
                  <Pressable
                    key={set.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onDeleteSet?.(set.id);
                    }}
                  >
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      layout={Layout.springify()}
                      style={[
                        styles.loggedSetChip,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {index + 1}.
                      </ThemedText>
                      <ThemedText type="body">
                        {set.weight}{units} x {set.reps} @ {set.feeling}/10
                      </ThemedText>
                      <Feather name="x" size={14} color={theme.textSecondary} style={{ marginLeft: Spacing.xs }} />
                    </Animated.View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

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

          <ThemedText
            type="small"
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            {editingSet ? "Edit set" : `Set ${currentSets.length + 1}`}
          </ThemedText>

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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {editingSet ? (
            <Pressable
              onPress={handleSaveAndClose}
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
                Update Set
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.buttonRow}>
              <Pressable
                onPress={handleAddAnother}
                style={({ pressed }) => [
                  styles.addAnotherButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <ThemedText
                  type="body"
                  style={{ color: "#FFFFFF", fontWeight: "600" }}
                >
                  Add Set
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDone}
                style={({ pressed }) => [
                  styles.doneButton,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.textSecondary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{ color: theme.text, fontWeight: "600" }}
                >
                  Done
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </ThemedView>

      <ExerciseHistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        units={units}
      />
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
  historyButton: {
    width: 40,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  loggedSetsSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  loggedSetsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  loggedSetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
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
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  addAnotherButton: {
    flex: 1.5,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  doneButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    borderWidth: 1,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
