import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Exercise,
  Workout,
  WorkoutSet,
  ExerciseHistory,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/types/workout";

export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const KEYS = {
  WORKOUTS: "@ironlog/workouts",
  FAVORITES: "@ironlog/favorites",
  EXERCISE_HISTORY: "@ironlog/exerciseHistory",
  PREFERENCES: "@ironlog/preferences",
  CURRENT_WORKOUT: "@ironlog/currentWorkout",
  CUSTOM_EXERCISES: "@ironlog/customExercises",
};

export async function getWorkouts(): Promise<Workout[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting workouts:", error);
    return [];
  }
}

export async function saveWorkout(workout: Workout): Promise<void> {
  try {
    const workouts = await getWorkouts();
    const existingIndex = workouts.findIndex((w) => w.id === workout.id);
    
    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.unshift(workout);
    }
    
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (error) {
    console.error("Error saving workout:", error);
    throw error;
  }
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  try {
    const workouts = await getWorkouts();
    const filtered = workouts.filter((w) => w.id !== workoutId);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting workout:", error);
    throw error;
  }
}

export async function getCurrentWorkout(): Promise<Workout | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CURRENT_WORKOUT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting current workout:", error);
    return null;
  }
}

export async function saveCurrentWorkout(workout: Workout | null): Promise<void> {
  try {
    if (workout) {
      await AsyncStorage.setItem(KEYS.CURRENT_WORKOUT, JSON.stringify(workout));
    } else {
      await AsyncStorage.removeItem(KEYS.CURRENT_WORKOUT);
    }
  } catch (error) {
    console.error("Error saving current workout:", error);
    throw error;
  }
}

export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
}

export async function addFavorite(exerciseId: string): Promise<void> {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(exerciseId)) {
      favorites.unshift(exerciseId);
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    }
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
}

export async function removeFavorite(exerciseId: string): Promise<void> {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter((id) => id !== exerciseId);
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
}

export async function toggleFavorite(exerciseId: string): Promise<boolean> {
  const favorites = await getFavorites();
  const isFavorite = favorites.includes(exerciseId);
  
  if (isFavorite) {
    await removeFavorite(exerciseId);
    return false;
  } else {
    await addFavorite(exerciseId);
    return true;
  }
}

export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistory | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXERCISE_HISTORY);
    const historyMap: Record<string, ExerciseHistory> = data ? JSON.parse(data) : {};
    return historyMap[exerciseId] || null;
  } catch (error) {
    console.error("Error getting exercise history:", error);
    return null;
  }
}

export async function getAllExerciseHistory(): Promise<Record<string, ExerciseHistory>> {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXERCISE_HISTORY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error getting all exercise history:", error);
    return {};
  }
}

export async function updateExerciseHistory(
  exerciseId: string,
  exerciseName: string,
  set: WorkoutSet
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXERCISE_HISTORY);
    const historyMap: Record<string, ExerciseHistory> = data ? JSON.parse(data) : {};
    
    const existing = historyMap[exerciseId];
    const currentPR = existing?.personalRecord || 0;
    
    historyMap[exerciseId] = {
      exerciseId,
      exerciseName,
      lastWeight: set.weight,
      lastReps: set.reps,
      lastFeeling: set.feeling,
      lastPerformed: set.timestamp,
      personalRecord: Math.max(currentPR, set.weight),
    };
    
    await AsyncStorage.setItem(KEYS.EXERCISE_HISTORY, JSON.stringify(historyMap));
  } catch (error) {
    console.error("Error updating exercise history:", error);
    throw error;
  }
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Error getting preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving preferences:", error);
    throw error;
  }
}

export async function getWorkoutsByDateRange(
  startDate: string,
  endDate: string
): Promise<Workout[]> {
  const workouts = await getWorkouts();
  return workouts.filter((w) => w.date >= startDate && w.date <= endDate);
}

export async function getWorkoutDates(): Promise<string[]> {
  const workouts = await getWorkouts();
  return [...new Set(workouts.map((w) => w.date))];
}

export function formatDate(date: Date): string {
  return formatDateLocal(date);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface SetDetail {
  weight: number;
  reps: number;
  feeling: number;
}

export interface ExercisePerformanceEntry {
  date: string;
  timestamp: number;
  totalVolume: number;
  sets: SetDetail[];
  bestWeight: number;
}

export async function getCustomExercises(): Promise<Exercise[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CUSTOM_EXERCISES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting custom exercises:", error);
    return [];
  }
}

export async function saveCustomExercise(name: string, category: string): Promise<Exercise> {
  const exercises = await getCustomExercises();
  const newExercise: Exercise = {
    id: `custom-${Date.now()}`,
    name,
    category,
    muscleGroups: [],
  };
  const updated = [...exercises, newExercise];
  await AsyncStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(updated));
  return newExercise;
}

export async function getExercisePerformanceHistory(
  exerciseId: string
): Promise<ExercisePerformanceEntry[]> {
  try {
    const workouts = await getWorkouts();
    const currentWorkout = await getCurrentWorkout();
    
    const allWorkouts = currentWorkout 
      ? [currentWorkout, ...workouts.filter(w => w.id !== currentWorkout.id)]
      : workouts;
    
    const entries: ExercisePerformanceEntry[] = [];
    
    for (const workout of allWorkouts) {
      const exercise = workout.exercises.find(e => e.exerciseId === exerciseId);
      if (exercise && exercise.sets.length > 0) {
        const sets = exercise.sets;
        const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        const bestWeight = Math.max(...sets.map(s => s.weight));
        
        entries.push({
          date: workout.date,
          timestamp: sets[0].timestamp,
          totalVolume,
          sets: sets.map(s => ({
            weight: s.weight,
            reps: s.reps,
            feeling: s.feeling,
          })),
          bestWeight,
        });
      }
    }
    
    // Sort by date descending (most recent first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return entries;
  } catch (error) {
    console.error("Error getting exercise performance history:", error);
    return [];
  }
}
