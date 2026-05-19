import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type ExportUser = {
  email: string;
  displayName?: string;
  units?: string;
};

type ExportWorkout = {
  id: string;
  date: string;
  exercises?: unknown;
  completed_at?: string | number | null;
  completedAt?: string | number | null;
};

type ExportFavorite = {
  exercise_id?: string;
  exerciseId?: string;
};

type ExportHistory = {
  exercise_id?: string;
  exerciseId?: string;
  exercise_name?: string;
  exerciseName?: string;
  last_weight?: number | null;
  lastWeight?: number | null;
  last_reps?: number | null;
  lastReps?: number | null;
  last_feeling?: number | null;
  lastFeeling?: number | null;
  last_performed?: string | number | null;
  lastPerformed?: string | number | null;
  personal_record?: number | null;
  personalRecord?: number | null;
};

type ExportExercise = {
  id: string;
  name: string;
  category: string;
  muscle_groups?: unknown;
  muscleGroups?: unknown;
};

type OwnerExport = {
  user: ExportUser;
  workouts: ExportWorkout[];
  favorites: ExportFavorite[];
  exerciseHistory: ExportHistory[];
  customExercises: ExportExercise[];
};

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerUserId = process.env.OWNER_USER_ID;
const exportPath = process.env.OWNER_EXPORT_PATH;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
if (!ownerUserId) throw new Error("OWNER_USER_ID is required");
if (!exportPath) throw new Error("OWNER_EXPORT_PATH is required");

const ownerExportPath = exportPath;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function timestamp(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function assertExerciseId(value: string | undefined): string {
  if (!value) {
    throw new Error("Export row missing exercise id");
  }
  return value;
}

async function upsertOrThrow(table: string, rows: unknown[], onConflict: string) {
  if (rows.length === 0) return;

  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) {
    throw error;
  }
}

async function main() {
  const data = JSON.parse(await readFile(ownerExportPath, "utf8")) as OwnerExport;

  await upsertOrThrow(
    "profiles",
    [
      {
        id: ownerUserId,
        email: data.user.email,
        display_name: data.user.displayName ?? "Athlete",
        units: data.user.units ?? "lbs",
      },
    ],
    "id",
  );

  await upsertOrThrow(
    "exercises",
    data.customExercises.map((exercise) => ({
      id: exercise.id,
      user_id: ownerUserId,
      name: exercise.name,
      category: exercise.category,
      muscle_groups: exercise.muscle_groups ?? exercise.muscleGroups ?? [],
    })),
    "id",
  );

  await upsertOrThrow(
    "workouts",
    data.workouts.map((workout) => ({
      id: workout.id,
      user_id: ownerUserId,
      date: workout.date,
      exercises: workout.exercises ?? [],
      completed_at: timestamp(workout.completed_at ?? workout.completedAt),
    })),
    "id",
  );

  await upsertOrThrow(
    "favorites",
    data.favorites.map((favorite) => ({
      user_id: ownerUserId,
      exercise_id: assertExerciseId(favorite.exercise_id ?? favorite.exerciseId),
    })),
    "user_id,exercise_id",
  );

  await upsertOrThrow(
    "exercise_history",
    data.exerciseHistory.map((record) => ({
      user_id: ownerUserId,
      exercise_id: assertExerciseId(record.exercise_id ?? record.exerciseId),
      exercise_name: record.exercise_name ?? record.exerciseName ?? "",
      last_weight: record.last_weight ?? record.lastWeight ?? 0,
      last_reps: record.last_reps ?? record.lastReps ?? 0,
      last_feeling: record.last_feeling ?? record.lastFeeling ?? 5,
      last_performed: timestamp(record.last_performed ?? record.lastPerformed),
      personal_record: record.personal_record ?? record.personalRecord ?? 0,
    })),
    "user_id,exercise_id",
  );

  console.log(
    `Imported owner data: ${data.customExercises.length} exercises, ${data.workouts.length} workouts, ${data.favorites.length} favorites, ${data.exerciseHistory.length} history rows`,
  );
}

main().catch((error) => {
  console.error("Owner import failed:", error);
  process.exitCode = 1;
});
