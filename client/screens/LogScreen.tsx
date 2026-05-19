import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect, useIsFocused } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { FAB } from "@/components/FAB";
import { ExerciseCard } from "@/components/ExerciseCard";
import { AddExerciseModal } from "@/components/AddExerciseModal";
import { LogSetModal } from "@/components/LogSetModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  ExerciseHistory,
  UserPreferences,
} from "@/types/workout";
import { Exercise } from "@/types/workout";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import {
  getCurrentWorkout,
  saveCurrentWorkout,
  saveWorkout,
  getFavorites,
  toggleFavorite as toggleFavoriteStorage,
  getAllExerciseHistory,
  updateExerciseHistory,
  getPreferences,
  generateId,
  formatDateLocal,
} from "@/lib/storage";

const emptyWorkoutImage = require("../../assets/images/empty-states/empty-workout.png");

export default function LogScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<
    Record<string, ExerciseHistory>
  >({});
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showLogSet, setShowLogSet] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(
    null
  );
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);

  const loadData = useCallback(async () => {
    const [currentWorkout, favs, history, prefs] = await Promise.all([
      getCurrentWorkout(),
      getFavorites(),
      getAllExerciseHistory(),
      getPreferences(),
    ]);

    const today = formatDateLocal(new Date());

    if (currentWorkout && currentWorkout.date === today) {
      setWorkout(currentWorkout);
    } else if (currentWorkout && currentWorkout.date !== today) {
      if (currentWorkout.exercises.length > 0) {
        await saveWorkout({ ...currentWorkout, completedAt: Date.now() });
      }
      const newWorkout: Workout = {
        id: generateId(),
        date: today,
        exercises: [],
      };
      setWorkout(newWorkout);
      await saveCurrentWorkout(newWorkout);
    } else {
      const newWorkout: Workout = {
        id: generateId(),
        date: today,
        exercises: [],
      };
      setWorkout(newWorkout);
      await saveCurrentWorkout(newWorkout);
    }

    setFavorites(favs);
    setExerciseHistory(history);
    setPreferences(prefs);
  }, []);

  useEffect(() => {
    const parent = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
    if (!parent) return;
    const unsub = parent.addListener("tabPress", () => {
      if (isFocused) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAddExercise(true);
      }
    });
    return unsub;
  }, [navigation, isFocused]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        workout && workout.exercises.length > 0 ? (
          <HeaderButton onPress={handleFinishWorkout}>
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              Done
            </ThemedText>
          </HeaderButton>
        ) : null,
    });
  }, [workout, navigation, theme]);

  const handleFinishWorkout = async () => {
    if (!workout || workout.exercises.length === 0) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveWorkout({ ...workout, completedAt: Date.now() });
    
    const newWorkout: Workout = {
      id: generateId(),
      date: formatDateLocal(new Date()),
      exercises: [],
    };
    setWorkout(newWorkout);
    await saveCurrentWorkout(newWorkout);
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    if (!workout) return;

    const existingExercise = workout.exercises.find(
      (e) => e.exerciseId === exercise.id
    );

    if (existingExercise) {
      setSelectedExercise(existingExercise);
    } else {
      const newExercise: WorkoutExercise = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: [],
      };
      const updatedWorkout = {
        ...workout,
        exercises: [...workout.exercises, newExercise],
      };
      setWorkout(updatedWorkout);
      await saveCurrentWorkout(updatedWorkout);
      setSelectedExercise(newExercise);
    }

    setShowAddExercise(false);
    setEditingSet(null);
    setShowLogSet(true);
  };

  const handleAddSet = (exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
    setEditingSet(null);
    setShowLogSet(true);
  };

  const handleEditSet = (exercise: WorkoutExercise, set: WorkoutSet) => {
    setSelectedExercise(exercise);
    setEditingSet(set);
    setShowLogSet(true);
  };

  const handleSaveSet = async (weight: number, reps: number, feeling: number) => {
    if (!workout || !selectedExercise) return;

    const timestamp = Date.now();

    if (editingSet) {
      const updatedExercises = workout.exercises.map((ex) => {
        if (ex.exerciseId === selectedExercise.exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((s) =>
              s.id === editingSet.id
                ? { ...s, weight, reps, feeling, timestamp }
                : s
            ),
          };
        }
        return ex;
      });

      const updatedWorkout = { ...workout, exercises: updatedExercises };
      setWorkout(updatedWorkout);
      await saveCurrentWorkout(updatedWorkout);
    } else {
      const newSet: WorkoutSet = {
        id: generateId(),
        exerciseId: selectedExercise.exerciseId,
        weight,
        reps,
        feeling,
        timestamp,
      };

      const updatedExercises = workout.exercises.map((ex) => {
        if (ex.exerciseId === selectedExercise.exerciseId) {
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      });

      const updatedWorkout = { ...workout, exercises: updatedExercises };
      setWorkout(updatedWorkout);
      await saveCurrentWorkout(updatedWorkout);

      await updateExerciseHistory(
        selectedExercise.exerciseId,
        selectedExercise.exerciseName,
        newSet
      );

      setExerciseHistory((prev) => ({
        ...prev,
        [selectedExercise.exerciseId]: {
          exerciseId: selectedExercise.exerciseId,
          exerciseName: selectedExercise.exerciseName,
          lastWeight: weight,
          lastReps: reps,
          lastFeeling: feeling,
          lastPerformed: timestamp,
          personalRecord: Math.max(
            prev[selectedExercise.exerciseId]?.personalRecord || 0,
            weight
          ),
        },
      }));
    }
  };

  const handleDeleteSet = async () => {
    if (!workout || !selectedExercise || !editingSet) return;

    const updatedExercises = workout.exercises.map((ex) => {
      if (ex.exerciseId === selectedExercise.exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== editingSet.id),
        };
      }
      return ex;
    });

    const updatedWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(updatedWorkout);
    await saveCurrentWorkout(updatedWorkout);
  };

  const handleDeleteSetById = async (setId: string) => {
    if (!workout || !selectedExercise) return;

    const updatedExercises = workout.exercises.map((ex) => {
      if (ex.exerciseId === selectedExercise.exerciseId) {
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== setId),
        };
      }
      return ex;
    });

    const updatedWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(updatedWorkout);
    await saveCurrentWorkout(updatedWorkout);
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    if (!workout) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedExercises = workout.exercises.filter(
      (e) => e.exerciseId !== exerciseId
    );
    const updatedWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(updatedWorkout);
    await saveCurrentWorkout(updatedWorkout);
  };

  const handleToggleFavorite = async (exerciseId: string) => {
    const isFavorite = await toggleFavoriteStorage(exerciseId);
    setFavorites((prev) =>
      isFavorite ? [exerciseId, ...prev] : prev.filter((id) => id !== exerciseId)
    );
  };

  const units = preferences?.units || "lbs";

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={workout?.exercises || []}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item, index }) => (
          <ExerciseCard
            exercise={item}
            onAddSet={() => handleAddSet(item)}
            onEditSet={(set) => handleEditSet(item, set)}
            onRemoveExercise={() => handleRemoveExercise(item.exerciseId)}
            units={units}
            index={index}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.fabSize + Spacing["3xl"],
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            image={emptyWorkoutImage}
            title="Start Your Workout"
            subtitle="Tap the button below to add your first exercise"
          />
        }
      />

      <FAB
        onPress={() => setShowAddExercise(true)}
        bottom={tabBarHeight + Spacing.xl}
      />

      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSelectExercise={handleSelectExercise}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        exerciseHistory={exerciseHistory}
      />

      <LogSetModal
        visible={showLogSet}
        onClose={() => {
          setShowLogSet(false);
          setSelectedExercise(null);
          setEditingSet(null);
        }}
        onSave={handleSaveSet}
        onDelete={editingSet ? handleDeleteSet : undefined}
        onDeleteSet={handleDeleteSetById}
        exerciseId={selectedExercise?.exerciseId || ""}
        exerciseName={selectedExercise?.exerciseName || ""}
        lastPerformance={
          selectedExercise
            ? exerciseHistory[selectedExercise.exerciseId]
            : null
        }
        editingSet={editingSet}
        units={units}
        currentSets={
          selectedExercise
            ? workout?.exercises.find(
                (e) => e.exerciseId === selectedExercise.exerciseId
              )?.sets || []
            : []
        }
      />
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
});
