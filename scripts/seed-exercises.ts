import "dotenv/config";
import { db } from "../server/db";
import { exercises } from "../shared/schema";

const BUILT_IN_EXERCISES = [
  { id: "bench-press", name: "Bench Press", category: "Chest", muscleGroups: ["Chest", "Triceps", "Shoulders"] },
  { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", category: "Chest", muscleGroups: ["Upper Chest", "Shoulders", "Triceps"] },
  { id: "barbell-squat", name: "Barbell Squat", category: "Legs", muscleGroups: ["Quadriceps", "Glutes", "Hamstrings"] },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Legs", muscleGroups: ["Hamstrings", "Glutes", "Lower Back"] },
  { id: "leg-press", name: "Leg Press", category: "Legs", muscleGroups: ["Quadriceps", "Glutes"] },
  { id: "hip-thrust", name: "Hip Thrust", category: "Legs", muscleGroups: ["Glutes", "Hamstrings"] },
  { id: "deadlift", name: "Deadlift", category: "Back", muscleGroups: ["Back", "Glutes", "Hamstrings"] },
  { id: "barbell-row", name: "Barbell Row", category: "Back", muscleGroups: ["Back", "Biceps"] },
  { id: "pull-ups", name: "Pull-Ups", category: "Back", muscleGroups: ["Lats", "Biceps", "Upper Back"] },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", muscleGroups: ["Lats", "Biceps"] },
  { id: "overhead-press", name: "Overhead Press", category: "Shoulders", muscleGroups: ["Shoulders", "Triceps"] },
  { id: "lateral-raise", name: "Lateral Raise", category: "Shoulders", muscleGroups: ["Side Delts"] },
  { id: "barbell-curl", name: "Barbell Curl", category: "Arms", muscleGroups: ["Biceps"] },
  { id: "tricep-pushdown", name: "Tricep Pushdown", category: "Arms", muscleGroups: ["Triceps"] },
  { id: "hammer-curl", name: "Hammer Curl", category: "Arms", muscleGroups: ["Biceps", "Forearms"] },
  { id: "plank", name: "Plank", category: "Core", muscleGroups: ["Core", "Shoulders"] },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", category: "Core", muscleGroups: ["Core", "Hip Flexors"] },
  { id: "kettlebell-swing", name: "Kettlebell Swing", category: "Full Body", muscleGroups: ["Glutes", "Hamstrings", "Core", "Shoulders"] },
  { id: "running", name: "Running", category: "Cardio", muscleGroups: ["Legs", "Cardiovascular"] },
];

async function seed() {
  console.log("Seeding built-in exercises...");

  await db
    .insert(exercises)
    .values(
      BUILT_IN_EXERCISES.map((e) => ({
        id: e.id,
        userId: null,
        name: e.name,
        category: e.category,
        muscleGroups: e.muscleGroups,
      }))
    )
    .onConflictDoNothing();

  console.log(`Seeded ${BUILT_IN_EXERCISES.length} exercises.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
