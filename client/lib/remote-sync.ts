import { supabase } from "@/lib/supabase";
import type { Exercise, ExerciseHistory, Workout } from "@/types/workout";

type WorkoutRow = {
  id: string;
  date: string;
  exercises: Workout["exercises"] | null;
  completed_at: string | null;
};

type HistoryRow = {
  exercise_id: string;
  exercise_name: string;
  last_weight: number | null;
  last_reps: number | null;
  last_feeling: number | null;
  last_performed: string | null;
  personal_record: number | null;
};

type ExerciseRow = {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  muscle_groups: string[] | null;
  created_at: string | null;
};

function toMs(value: string | null): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    date: row.date,
    exercises: row.exercises ?? [],
    completedAt: row.completed_at ? toMs(row.completed_at) : undefined,
  };
}

function toHistory(row: HistoryRow): ExerciseHistory {
  return {
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    lastWeight: row.last_weight ?? 0,
    lastReps: row.last_reps ?? 0,
    lastFeeling: row.last_feeling ?? 5,
    lastPerformed: toMs(row.last_performed),
    personalRecord: row.personal_record ?? 0,
  };
}

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    muscleGroups: row.muscle_groups ?? [],
    createdAt: row.created_at,
  };
}

function maybeTimestamp(value: number | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

export async function getRemoteWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id,date,exercises,completed_at")
    .order("date", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as WorkoutRow[]).map(toWorkout);
}

export async function upsertRemoteWorkout(workout: Workout): Promise<void> {
  const { error } = await supabase.from("workouts").upsert({
    id: workout.id,
    date: workout.date,
    exercises: workout.exercises,
    completed_at: maybeTimestamp(workout.completedAt),
  });

  if (error) throw error;
}

export async function deleteRemoteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
  if (error) throw error;
}

export async function getRemoteFavorites(): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("exercise_id")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => row.exercise_id as string);
}

export async function addRemoteFavorite(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .upsert({ exercise_id: exerciseId }, { onConflict: "user_id,exercise_id" });

  if (error) throw error;
}

export async function removeRemoteFavorite(exerciseId: string): Promise<void> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("exercise_id", exerciseId);

  if (error) throw error;
}

export async function getRemoteExerciseHistory(): Promise<
  Record<string, ExerciseHistory>
> {
  const { data, error } = await supabase
    .from("exercise_history")
    .select(
      "exercise_id,exercise_name,last_weight,last_reps,last_feeling,last_performed,personal_record",
    );

  if (error) throw error;

  const history: Record<string, ExerciseHistory> = {};
  for (const row of (data ?? []) as HistoryRow[]) {
    const record = toHistory(row);
    history[record.exerciseId] = record;
  }
  return history;
}

export async function upsertRemoteExerciseHistory(
  record: ExerciseHistory,
): Promise<void> {
  const { error } = await supabase.from("exercise_history").upsert(
    {
      exercise_id: record.exerciseId,
      exercise_name: record.exerciseName,
      last_weight: record.lastWeight,
      last_reps: record.lastReps,
      last_feeling: record.lastFeeling,
      last_performed: maybeTimestamp(record.lastPerformed),
      personal_record: record.personalRecord,
    },
    { onConflict: "user_id,exercise_id" },
  );

  if (error) throw error;
}

export async function getRemoteExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id,user_id,name,category,muscle_groups,created_at")
    .order("name");

  if (error) throw error;
  return ((data ?? []) as ExerciseRow[]).map(toExercise);
}

export async function createRemoteExercise(data: {
  name: string;
  category: string;
  muscleGroups?: string[];
}): Promise<Exercise> {
  const { data: row, error } = await supabase
    .from("exercises")
    .insert({
      name: data.name,
      category: data.category,
      muscle_groups: data.muscleGroups ?? [],
    })
    .select("id,user_id,name,category,muscle_groups,created_at")
    .single();

  if (error) throw error;
  return toExercise(row as ExerciseRow);
}

export async function deleteRemoteExercise(exerciseId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_custom_exercise", {
    exercise_id: exerciseId,
  });

  if (error) throw error;
}

export async function renameRemoteExercise(
  exerciseId: string,
  name: string,
): Promise<Exercise> {
  const { data, error } = await supabase.rpc("rename_exercise", {
    exercise_id: exerciseId,
    new_name: name,
  });

  if (error) throw error;
  return toExercise(data as ExerciseRow);
}
