import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  units: z.enum(["kg", "lbs"]).optional(),
});

export const workoutSetSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  weight: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  feeling: z.number().int().min(1).max(10),
  timestamp: z.number(),
});

export const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  sets: z.array(workoutSetSchema),
});

export const upsertWorkoutSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  exercises: z.array(workoutExerciseSchema),
  completedAt: z.union([z.number(), z.string(), z.date(), z.null()]).optional(),
});

export const exerciseHistoryRecordSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  lastWeight: z.number().nonnegative().optional(),
  lastReps: z.number().int().nonnegative().optional(),
  lastFeeling: z.number().int().min(1).max(10).optional(),
  lastPerformed: z.union([z.number(), z.string(), z.date(), z.null()]).optional(),
  personalRecord: z.number().nonnegative().optional(),
});
