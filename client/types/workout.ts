export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  feeling: number;
  timestamp: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
  completedAt?: number;
}

export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  lastWeight: number;
  lastReps: number;
  lastFeeling: number;
  lastPerformed: number;
  personalRecord: number;
}

export interface UserPreferences {
  displayName: string;
  units: "kg" | "lbs";
  theme: "auto" | "light" | "dark";
  avatarId: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: "Athlete",
  units: "lbs",
  theme: "auto",
  avatarId: 1,
};
