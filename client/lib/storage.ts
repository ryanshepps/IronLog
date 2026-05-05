import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Workout,
  WorkoutSet,
  ExerciseHistory,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from "@/types/workout";
import { apiRequest } from "@/lib/query-client";
import { pushOrQueue } from "@/lib/write-queue";

export { formatDateLocal } from "@/lib/date";
import { formatDateLocal } from "@/lib/date";

function toMs(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function normalizeWorkout(raw: any): Workout {
  return {
    id: raw.id,
    date: raw.date,
    exercises: raw.exercises ?? [],
    completedAt: raw.completedAt ? toMs(raw.completedAt) : undefined,
  };
}

function normalizeHistoryRecord(raw: any): ExerciseHistory {
  return {
    exerciseId: raw.exerciseId,
    exerciseName: raw.exerciseName,
    lastWeight: raw.lastWeight ?? 0,
    lastReps: raw.lastReps ?? 0,
    lastFeeling: raw.lastFeeling ?? 5,
    lastPerformed: toMs(raw.lastPerformed),
    personalRecord: raw.personalRecord ?? 0,
  };
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await apiRequest("GET", path);
  return (await res.json()) as T;
}

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

async function cachedRead<TRemote, TLocal>(
  key: string,
  path: string,
  transform: (remote: TRemote) => TLocal,
  fallback: TLocal
): Promise<TLocal> {
  try {
    const remote = await fetchJSON<TRemote>(path);
    const value = transform(remote);
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
  return cachedRead<any[], Workout[]>(
    KEYS.WORKOUTS,
    "/api/workouts",
    (remote) => remote.map(normalizeWorkout),
    []
  );
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
    pushOrQueue("POST", "/api/workouts", workout).catch(() => {});
  });
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  return withMutation("deleting workout", async () => {
    const workouts = await getWorkoutsFromCache();
    const filtered = workouts.filter((w) => w.id !== workoutId);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(filtered));
    pushOrQueue("DELETE", `/api/workouts/${workoutId}`).catch(() => {});
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

export async function saveCurrentWorkout(workout: Workout | null): Promise<void> {
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
  return cachedRead<string[], string[]>(
    KEYS.FAVORITES,
    "/api/favorites",
    (remote) => remote,
    []
  );
}

export async function addFavorite(exerciseId: string): Promise<void> {
  return withMutation("adding favorite", async () => {
    const favorites = await getFavoritesFromCache();
    if (!favorites.includes(exerciseId)) {
      favorites.unshift(exerciseId);
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favorites));
    }
    pushOrQueue("POST", `/api/favorites/${exerciseId}`).catch(() => {});
  });
}

export async function removeFavorite(exerciseId: string): Promise<void> {
  return withMutation("removing favorite", async () => {
    const favorites = await getFavoritesFromCache();
    const filtered = favorites.filter((id) => id !== exerciseId);
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(filtered));
    pushOrQueue("DELETE", `/api/favorites/${exerciseId}`).catch(() => {});
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

export async function getAllExerciseHistoryFromCache(): Promise<Record<string, ExerciseHistory>> {
  return readCache<Record<string, ExerciseHistory>>(KEYS.EXERCISE_HISTORY, {});
}

export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistory | null> {
  const map = await getAllExerciseHistory();
  return map[exerciseId] || null;
}

export async function getAllExerciseHistory(): Promise<Record<string, ExerciseHistory>> {
  return cachedRead<any[], Record<string, ExerciseHistory>>(
    KEYS.EXERCISE_HISTORY,
    "/api/exercise-history",
    (remote) => {
      const map: Record<string, ExerciseHistory> = {};
      for (const r of remote) {
        const norm = normalizeHistoryRecord(r);
        map[norm.exerciseId] = norm;
      }
      return map;
    },
    {}
  );
}

export async function updateExerciseHistory(
  exerciseId: string,
  exerciseName: string,
  set: WorkoutSet
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

    await AsyncStorage.setItem(KEYS.EXERCISE_HISTORY, JSON.stringify(historyMap));
    pushOrQueue("POST", "/api/exercise-history", record).catch(() => {});
  });
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
  return withMutation("saving preferences", async () => {
    const current = await getPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
  });
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
