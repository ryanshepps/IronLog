import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";
import {
  getWorkouts,
  getFavorites,
  getAllExerciseHistory,
} from "@/lib/storage";

const FLAG_KEY = "@ironlog/migration_v1_uploaded";
const BACKUP_KEY = "@ironlog/migration_v1_backup";

export async function runMigrationV1IfNeeded(userId: string): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(`${FLAG_KEY}:${userId}`);
    if (flag) return;

    const workouts = await getWorkouts();
    const favorites = await getFavorites();
    const historyMap = await getAllExerciseHistory();
    const exerciseHistory = Object.values(historyMap);

    if (workouts.length === 0 && favorites.length === 0 && exerciseHistory.length === 0) {
      await AsyncStorage.setItem(`${FLAG_KEY}:${userId}`, new Date().toISOString());
      return;
    }

    await AsyncStorage.setItem(
      `${BACKUP_KEY}:${userId}`,
      JSON.stringify({ workouts, favorites, exerciseHistory, savedAt: Date.now() })
    );

    await apiRequest("POST", "/api/sync", {
      workouts,
      favorites,
      exerciseHistory,
    });

    await AsyncStorage.setItem(`${FLAG_KEY}:${userId}`, new Date().toISOString());
    console.log(
      `[migration] uploaded ${workouts.length} workouts, ${favorites.length} favorites, ${exerciseHistory.length} history`
    );
  } catch (error) {
    console.error("[migration] failed, will retry next launch:", error);
  }
}
