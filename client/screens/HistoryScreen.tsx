import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, Layout } from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { FeelingDots } from "@/components/FeelingRating";
import { ExerciseHistoryModal } from "@/components/ExerciseHistoryModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Workout, UserPreferences, WorkoutExercise } from "@/types/workout";
import { getWorkouts, getPreferences, getCurrentWorkout } from "@/lib/storage";

const emptyHistoryImage = require("../../assets/images/empty-states/empty-history.png");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasWorkout: boolean;
}

function Calendar({
  selectedMonth,
  selectedYear,
  workoutDates,
  onMonthChange,
}: {
  selectedMonth: number;
  selectedYear: number;
  workoutDates: Set<string>;
  onMonthChange: (month: number, year: number) => void;
}) {
  const { theme } = useTheme();

  const days = useMemo(() => {
    const result: CalendarDay[] = [];
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const today = new Date().toISOString().split("T")[0];

    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(selectedYear, selectedMonth, -i);
      result.push({
        date: date.toISOString().split("T")[0],
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        hasWorkout: workoutDates.has(date.toISOString().split("T")[0]),
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(selectedYear, selectedMonth, i);
      const dateStr = date.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        isToday: dateStr === today,
        hasWorkout: workoutDates.has(dateStr),
      });
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(selectedYear, selectedMonth + 1, i);
      result.push({
        date: date.toISOString().split("T")[0],
        day: i,
        isCurrentMonth: false,
        isToday: false,
        hasWorkout: workoutDates.has(date.toISOString().split("T")[0]),
      });
    }

    return result;
  }, [selectedMonth, selectedYear, workoutDates]);

  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMonth === 0) {
      onMonthChange(11, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedMonth === 11) {
      onMonthChange(0, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  return (
    <View style={[styles.calendar, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={handlePrevMonth} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h4">
          {MONTHS[selectedMonth]} {selectedYear}
        </ThemedText>
        <Pressable onPress={handleNextMonth} hitSlop={12}>
          <Feather name="chevron-right" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.calendarDaysHeader}>
        {DAYS.map((day) => (
          <View key={day} style={styles.calendarDayHeader}>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, fontWeight: "600" }}
            >
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, index) => (
          <View
            key={`${day.date}-${index}`}
            style={[
              styles.calendarDay,
              day.isToday && { backgroundColor: theme.primary + "20" },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: day.isCurrentMonth
                  ? day.isToday
                    ? theme.primary
                    : theme.text
                  : theme.textSecondary,
                fontWeight: day.isToday ? "700" : "400",
                opacity: day.isCurrentMonth ? 1 : 0.4,
              }}
            >
              {day.day}
            </ThemedText>
            {day.hasWorkout ? (
              <View
                style={[styles.workoutDot, { backgroundColor: theme.primary }]}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function WorkoutCard({
  workout,
  units,
  index,
  onExercisePress,
}: {
  workout: Workout;
  units: "kg" | "lbs";
  index: number;
  onExercisePress: (exercise: WorkoutExercise) => void;
}) {
  const { theme } = useTheme();
  const date = new Date(workout.date);

  const totalSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0
  );

  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(200)}
      layout={Layout.springify()}
      style={[styles.workoutCard, { backgroundColor: theme.backgroundSecondary }]}
    >
      <View style={styles.workoutCardHeader}>
        <ThemedText type="h4">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {workout.exercises.length} exercises, {totalSets} sets
        </ThemedText>
      </View>

      {workout.exercises.map((exercise) => (
        <Pressable
          key={exercise.exerciseId}
          style={({ pressed }) => [
            styles.exerciseSummary,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onExercisePress(exercise);
          }}
        >
          <View style={styles.exerciseRow}>
            <ThemedText type="body" style={{ fontWeight: "600", flex: 1 }}>
              {exercise.exerciseName}
            </ThemedText>
            <Feather name="bar-chart-2" size={16} color={theme.primary} />
          </View>
          <View style={styles.setsSummary}>
            {exercise.sets.map((set, idx) => (
              <View
                key={set.id}
                style={[
                  styles.setSummary,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText type="small">
                  {set.weight}
                  {units} x {set.reps}
                </ThemedText>
              </View>
            ))}
          </View>
        </Pressable>
      ))}
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);

  const handleExercisePress = useCallback((exercise: WorkoutExercise) => {
    setSelectedExercise(exercise);
    setShowHistoryModal(true);
  }, []);

  const loadData = useCallback(async () => {
    const [allWorkouts, currentWorkout, prefs] = await Promise.all([
      getWorkouts(),
      getCurrentWorkout(),
      getPreferences(),
    ]);
    
    // Combine saved workouts with current workout if it has exercises
    let combinedWorkouts = [...allWorkouts];
    if (currentWorkout && currentWorkout.exercises.length > 0) {
      // Check if current workout is already in the list
      const existingIndex = combinedWorkouts.findIndex(w => w.id === currentWorkout.id);
      if (existingIndex >= 0) {
        combinedWorkouts[existingIndex] = currentWorkout;
      } else {
        combinedWorkouts.unshift(currentWorkout);
      }
    }
    
    setWorkouts(combinedWorkouts);
    setPreferences(prefs);
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const workoutDates = useMemo(() => {
    return new Set(workouts.map((w) => w.date));
  }, [workouts]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const date = new Date(w.date);
      return (
        date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
      );
    });
  }, [workouts, selectedMonth, selectedYear]);

  const units = preferences?.units || "lbs";

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <WorkoutCard
            workout={item}
            units={units}
            index={index}
            onExercisePress={handleExercisePress}
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
          <Calendar
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            workoutDates={workoutDates}
            onMonthChange={(month, year) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }}
          />
        }
        ListEmptyComponent={
          filteredWorkouts.length === 0 && workouts.length > 0 ? (
            <View style={styles.noWorkoutsThisMonth}>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, textAlign: "center" }}
              >
                No workouts this month
              </ThemedText>
            </View>
          ) : workouts.length === 0 ? (
            <EmptyState
              image={emptyHistoryImage}
              title="No Workouts Yet"
              subtitle="Complete your first workout to see it here"
            />
          ) : null
        }
      />

      {selectedExercise ? (
        <ExerciseHistoryModal
          visible={showHistoryModal}
          exerciseId={selectedExercise.exerciseId}
          exerciseName={selectedExercise.exerciseName}
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
  calendar: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  calendarDaysHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  calendarDayHeader: {
    flex: 1,
    alignItems: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  workoutCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  workoutCardHeader: {
    marginBottom: Spacing.md,
  },
  exerciseSummary: {
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  setsSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  setSummary: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  noWorkoutsThisMonth: {
    paddingVertical: Spacing["4xl"],
  },
});
