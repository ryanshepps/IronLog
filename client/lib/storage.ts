import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Workout,
  WorkoutSet,
  ExerciseHistory,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/types/workout";
import { pushOrQueue } from "@/lib/write-queue";
import {
  getRemoteExerciseHistory,
  getRemoteFavorites,
  getRemoteWorkouts,
} from "@/lib/remote-sync";

export { formatDateLocal } from "@/lib/date";
import { formatDateLocal } from "@/lib/date";

const KEYS = {
  WORKOUTS: "@ironlog/workouts",
  FAVORITES: "@ironlog/favorites",
  EXERCISE_HISTORY: "@ironlog/exerciseHistory",
  PREFERENCES: "@ironlog/preferences",
  CURRENT_WORKOUT: "@ironlog/currentWorkout",
};

async function withMutation<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error ${name}:`, error);
    throw error;
  }
}

async function readCache<T>(key: string, fallback: T): Promise<T> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch (error) {
    console.error(`Error reading cache ${key}:`, error);
    return fallback;
  }
}

async function cachedRead<TLocal>(
  key: string,
  readRemote: () => Promise<TLocal>,
  fallback: TLocal,
): Promise<TLocal> {
  try {
    const value = await readRemote();
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return value;
  } catch {
    return readCache<TLocal>(key, fallback);
  }
}

export async function getWorkoutsFromCache(): Promise<Workout[]> {
  return readCache<Workout[]>(KEYS.WORKOUTS, []);
}

export async function getWorkouts(): Promise<Workout[]> {
  return cachedRead<Workout[]>(KEYS.WORKOUTS, getRemoteWorkouts, []);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  return withMutation("saving workout", async () => {
    const workouts = await getWorkoutsFromCache();
    const existingIndex = workouts.findIndex((w) => w.id === workout.id);

    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.unshift(workout);
    }

    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
    pushOrQueue({ type: "upsertWorkout", workout }).catch(() => {});
  });
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  return withMutation("deleting workout", async () => {
    const workouts = await getWorkoutsFromCache();
    const filtered = workouts.filter((w) => w.id !== workoutId);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(filtered));
    pushOrQueue({ type: "deleteWorkout", workoutId }).catch(() => {});
  });
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

export async function saveCurrentWorkout(
  workout: Workout | null,
): Promise<void> {
  return withMutation("saving current workout", async () => {
    if (workout) {
      await AsyncStorage.setItem(KEYS.CURRENT_WORKOUT, JSON.stringify(workout));
    } else {
      await AsyncStorage.removeItem(KEYS.CURRENT_WORKOUT);
    }
  });
}

export async function getFavoritesFromCache(): Promise<string[]> {
  return readCache<string[]>(KEYS.FAVORITES, []);
}

export async function getFavorites(): Promise<string[]> {
  return cachedRead<string[]>(KEYS.FAVORITES, getRemoteFavorites, []);
}

export async function addFavorite(exerciseId: string): Promise<void> {
  return withMutation("adding favorite", async () => {
    const favorites = await getFavoritesFromCache();
    if (!favorites.includes(exerciseId)) {
      favorites.unshift(exerciseId);
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    }
    pushOrQueue({ type: "addFavorite", exerciseId }).catch(() => {});
  });
}

export async function removeFavorite(exerciseId: string): Promise<void> {
  return withMutation("removing favorite", async () => {
    const favorites = await getFavoritesFromCache();
    const filtered = favorites.filter((id) => id !== exerciseId);
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(filtered));
    pushOrQueue({ type: "removeFavorite", exerciseId }).catch(() => {});
  });
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

export async function getAllExerciseHistoryFromCache(): Promise<
  Record<string, ExerciseHistory>
> {
  return readCache<Record<string, ExerciseHistory>>(KEYS.EXERCISE_HISTORY, {});
}

export async function getExerciseHistory(
  exerciseId: string,
): Promise<ExerciseHistory | null> {
  const map = await getAllExerciseHistory();
  return map[exerciseId] || null;
}

export async function getAllExerciseHistory(): Promise<
  Record<string, ExerciseHistory>
> {
  return cachedRead<Record<string, ExerciseHistory>>(
    KEYS.EXERCISE_HISTORY,
    getRemoteExerciseHistory,
    {},
  );
}

export async function updateExerciseHistory(
  exerciseId: string,
  exerciseName: string,
  set: WorkoutSet,
): Promise<void> {
  return withMutation("updating exercise history", async () => {
    const historyMap = await getAllExerciseHistoryFromCache();

    const existing = historyMap[exerciseId];
    const currentPR = existing?.personalRecord || 0;

    const record = {
      exerciseId,
      exerciseName,
      lastWeight: set.weight,
      lastReps: set.reps,
      lastFeeling: set.feeling,
      lastPerformed: set.timestamp,
      personalRecord: Math.max(currentPR, set.weight),
    };
    historyMap[exerciseId] = record;

    await AsyncStorage.setItem(
      KEYS.EXERCISE_HISTORY,
      JSON.stringify(historyMap),
    );
    pushOrQueue({ type: "upsertExerciseHistory", record }).catch(() => {});
  });
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return data
      ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) }
      : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error("Error getting preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(
  preferences: Partial<UserPreferences>,
): Promise<void> {
  return withMutation("saving preferences", async () => {
    const current = await getPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
  });
}

export async function getWorkoutsByDateRange(
  startDate: string,
  endDate: string,
): Promise<Workout[]> {
  const workouts = await getWorkouts();
  return workouts.filter((w) => w.date >= startDate && w.date <= endDate);
}

export async function getWorkoutDates(): Promise<string[]> {
  const workouts = await getWorkouts();
  return [...new Set(workouts.map((w) => w.date))];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

export async function getExercisePerformanceHistory(
  exerciseId: string,
): Promise<ExercisePerformanceEntry[]> {
  try {
    const workouts = await getWorkouts();
    const currentWorkout = await getCurrentWorkout();

    const allWorkouts = currentWorkout
      ? [currentWorkout, ...workouts.filter((w) => w.id !== currentWorkout.id)]
      : workouts;

    const entries: ExercisePerformanceEntry[] = [];

    for (const workout of allWorkouts) {
      const exercise = workout.exercises.find(
        (e) => e.exerciseId === exerciseId,
      );
      if (exercise && exercise.sets.length > 0) {
        const sets = exercise.sets;
        const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        const bestWeight = Math.max(...sets.map((s) => s.weight));

        entries.push({
          date: workout.date,
          timestamp: sets[0].timestamp,
          totalVolume,
          sets: sets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            feeling: s.feeling,
          })),
          bestWeight,
        });
      }
    }

    // Sort by date descending (most recent first)
    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return entries;
  } catch (error) {
    console.error("Error getting exercise performance history:", error);
    return [];
  }
}
