import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ExerciseHistoryModal } from "@/components/ExerciseHistoryModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Exercise, ExerciseHistory, UserPreferences } from "@/types/workout";
import { EXERCISES, getExerciseById } from "@/data/exercises";
import { getAllExerciseHistory, getPreferences } from "@/lib/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CUSTOM_EXERCISES_KEY = "@ironlog/customExercises";

interface ExerciseWithHistory extends Exercise {
  history?: ExerciseHistory;
}

const CATEGORIES = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
  "Custom",
];

function ExerciseItem({
  exercise,
  history,
  units,
  onPress,
  index,
}: {
  exercise: Exercise;
  history?: ExerciseHistory;
  units: "kg" | "lbs";
  onPress: () => void;
  index: number;
}) {
  const { theme } = useTheme();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Animated.View
      entering={FadeIn.delay(Math.min(index, 10) * 30).duration(200)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [
          styles.exerciseItem,
          { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={styles.exerciseInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {exercise.name}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {exercise.category}
            {history
              ? ` • Last: ${history.lastWeight}${units} x ${history.lastReps} • ${formatDate(history.lastPerformed)}`
              : ""}
          </ThemedText>
          {history?.personalRecord ? (
            <View style={styles.prBadge}>
              <Feather name="award" size={12} color={theme.warning} />
              <ThemedText
                type="caption"
                style={{ color: theme.warning, marginLeft: 4 }}
              >
                PR: {history.personalRecord}
                {units}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <Feather name="bar-chart-2" size={20} color={theme.primary} />
      </Pressable>
    </Animated.View>
  );
}

function AddExerciseModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string) => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Custom");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(name.trim(), category);
      setName("");
      setCategory("Custom");
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Add New Exercise</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Exercise Name
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g., Cable Kickbacks"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>
              Category
            </ThemedText>
            <View style={styles.categoryPicker}>
              {["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio", "Custom"].map(
                (cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor:
                          category === cat ? theme.primary : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      style={{
                        color: category === cat ? "#FFFFFF" : theme.text,
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </ThemedText>
                  </Pressable>
                )
              )}
            </View>
          </View>

          <Pressable
            style={[
              styles.addButton,
              { backgroundColor: theme.primary },
              !name.trim() && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!name.trim()}
          >
            <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
              Add Exercise
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ExercisesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [exerciseHistory, setExerciseHistory] = useState<Record<string, ExerciseHistory>>({});
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const loadData = useCallback(async () => {
    const [history, prefs, customData] = await Promise.all([
      getAllExerciseHistory(),
      getPreferences(),
      AsyncStorage.getItem(CUSTOM_EXERCISES_KEY),
    ]);
    setExerciseHistory(history);
    setPreferences(prefs);
    if (customData) {
      setCustomExercises(JSON.parse(customData));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const allExercises = useMemo(() => {
    return [...EXERCISES, ...customExercises];
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    let exercises = allExercises;

    if (selectedCategory !== "All") {
      exercises = exercises.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      exercises = exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query)
      );
    }

    return exercises;
  }, [allExercises, selectedCategory, searchQuery]);

  const handleAddCustomExercise = async (name: string, category: string) => {
    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name,
      category,
      muscleGroups: [],
    };

    const updated = [...customExercises, newExercise];
    setCustomExercises(updated);
    await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updated));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowHistoryModal(true);
  };

  const units = preferences?.units || "lbs";

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ExerciseItem
            exercise={item}
            history={exerciseHistory[item.id]}
            units={units}
            onPress={() => handleExercisePress(item)}
            index={index}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search exercises..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(item);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        selectedCategory === item
                          ? theme.primary
                          : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: selectedCategory === item ? "#FFFFFF" : theme.text,
                      fontWeight: "600",
                    }}
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              )}
            />

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAddModal(true);
              }}
              style={[styles.addNewButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="plus" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
                Add Custom Exercise
              </ThemedText>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
            >
              No exercises found
            </ThemedText>
          </View>
        }
      />

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustomExercise}
      />

      {selectedExercise ? (
        <ExerciseHistoryModal
          visible={showHistoryModal}
          exerciseId={selectedExercise.id}
          exerciseName={selectedExercise.name}
          units={units}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedExercise(null);
          }}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
  },
  categoryList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    borderWidth: 1,
  },
  categoryPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
});
