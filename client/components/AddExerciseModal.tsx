import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Exercise } from "@/types/workout";
import { useExercises, useCreateExercise } from "@/hooks/useExercises";

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  favorites: string[];
  onToggleFavorite: (exerciseId: string) => void;
  exerciseHistory: Record<string, { lastWeight: number; lastReps: number }>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ExerciseListItem({
  exercise,
  isFavorite,
  lastPerformance,
  onSelect,
  onToggleFavorite,
  index,
}: {
  exercise: Exercise;
  isFavorite: boolean;
  lastPerformance?: { lastWeight: number; lastReps: number };
  onSelect: () => void;
  onToggleFavorite: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 30).duration(200)}>
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.exerciseItem,
          { backgroundColor: theme.backgroundSecondary },
          animatedStyle,
        ]}
      >
        <View style={styles.exerciseInfo}>
          <ThemedText type="body" style={styles.exerciseName}>
            {exercise.name}
          </ThemedText>
          {lastPerformance ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Last: {lastPerformance.lastWeight} x {lastPerformance.lastReps}
            </ThemedText>
          ) : null}
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleFavorite();
          }}
          hitSlop={12}
          style={styles.favoriteButton}
        >
          <Feather
            name={isFavorite ? "star" : "star"}
            size={22}
            color={isFavorite ? theme.warning : theme.textSecondary}
            style={{ opacity: isFavorite ? 1 : 0.4 }}
          />
        </Pressable>
      </AnimatedPressable>
    </Animated.View>
  );
}

export function AddExerciseModal({
  visible,
  onClose,
  onSelectExercise,
  favorites,
  onToggleFavorite,
  exerciseHistory,
}: AddExerciseModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: allExercises = [] } = useExercises();
  const createExercise = useCreateExercise();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setShowFavoritesOnly(false);
      setShowCreateForm(false);
    }
  }, [visible]);

  const results = useMemo(() => {
    const exercises = allExercises as Exercise[];
    if (showFavoritesOnly) {
      const favoriteExercises = exercises.filter((e) =>
        favorites.includes(e.id)
      );
      return searchQuery
        ? favoriteExercises.filter((e) =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : favoriteExercises;
    } else if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      return exercises
        .filter(
          (e) =>
            e.name.toLowerCase().includes(lowerQuery) ||
            e.category.toLowerCase().includes(lowerQuery) ||
            (e.muscleGroups as string[]).some((mg) => mg.toLowerCase().includes(lowerQuery))
        )
        .slice(0, 50);
    } else {
      return exercises.slice(0, 20);
    }
  }, [allExercises, searchQuery, favorites, showFavoritesOnly]);

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) return;
    createExercise.mutate(
      { name: newExerciseName.trim(), category: "Custom", muscleGroups: [] },
      {
        onSuccess: (exercise) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowCreateForm(false);
          setNewExerciseName("");
          onSelectExercise(exercise as Exercise);
        },
      }
    );
  };

  const sortedResults = [...results].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.id);
    const bIsFavorite = favorites.includes(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

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
          <ThemedText type="h4">Add Exercise</ThemedText>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFavoritesOnly(!showFavoritesOnly);
            }}
            hitSlop={12}
          >
            <Feather
              name="star"
              size={22}
              color={showFavoritesOnly ? theme.warning : theme.textSecondary}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Feather name="x-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {showCreateForm ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.createFormContainer}
          >
            <View
              style={[
                styles.createForm,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.createFormHeader}>
                <ThemedText type="h4">Create Exercise</ThemedText>
                <Pressable
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewExerciseName("");
                  }}
                  hitSlop={12}
                >
                  <Feather name="x" size={22} color={theme.textSecondary} />
                </Pressable>
              </View>

              <TextInput
                style={[
                  styles.createInput,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Exercise name"
                placeholderTextColor={theme.textSecondary}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                autoFocus
              />

              <Pressable
                style={[
                  styles.createButton,
                  { backgroundColor: theme.primary },
                  !newExerciseName.trim() && { opacity: 0.5 },
                ]}
                onPress={handleCreateExercise}
                disabled={!newExerciseName.trim()}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Create & Add
                </ThemedText>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <FlatList
            data={sortedResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ExerciseListItem
                exercise={item}
                isFavorite={favorites.includes(item.id)}
                lastPerformance={exerciseHistory[item.id]}
                onSelect={() => onSelectExercise(item)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
                index={index}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setNewExerciseName(searchQuery);
                  setShowCreateForm(true);
                }}
                style={[
                  styles.createExerciseButton,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Feather name="plus" size={20} color={theme.primary} />
                <ThemedText
                  type="body"
                  style={{ color: theme.primary, fontWeight: "600" }}
                >
                  Create New Exercise
                </ThemedText>
              </Pressable>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText
                  type="body"
                  style={{ color: theme.textSecondary, textAlign: "center" }}
                >
                  {showFavoritesOnly
                    ? "No favorite exercises yet"
                    : "No exercises found"}
                </ThemedText>
              </View>
            }
          />
        )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    height: Spacing.inputHeight,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.body.fontSize,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: "600",
    marginBottom: 2,
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    paddingVertical: Spacing["4xl"],
  },
  createExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  createFormContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  createForm: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  createFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  createInput: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  createButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
});
