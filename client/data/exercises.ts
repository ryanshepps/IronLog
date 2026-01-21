import { Exercise } from "@/types/workout";

export const EXERCISES: Exercise[] = [
  { id: "1", name: "Bench Press", category: "Chest", muscleGroups: ["chest", "triceps", "shoulders"] },
  { id: "2", name: "Incline Bench Press", category: "Chest", muscleGroups: ["chest", "triceps", "shoulders"] },
  { id: "3", name: "Decline Bench Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "4", name: "Dumbbell Bench Press", category: "Chest", muscleGroups: ["chest", "triceps", "shoulders"] },
  { id: "5", name: "Incline Dumbbell Press", category: "Chest", muscleGroups: ["chest", "triceps", "shoulders"] },
  { id: "6", name: "Dumbbell Flyes", category: "Chest", muscleGroups: ["chest"] },
  { id: "7", name: "Cable Crossover", category: "Chest", muscleGroups: ["chest"] },
  { id: "8", name: "Push-Ups", category: "Chest", muscleGroups: ["chest", "triceps", "shoulders"] },
  { id: "9", name: "Chest Dips", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "10", name: "Pec Deck", category: "Chest", muscleGroups: ["chest"] },
  { id: "11", name: "Machine Chest Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "12", name: "Landmine Press", category: "Chest", muscleGroups: ["chest", "shoulders"] },
  
  { id: "13", name: "Barbell Squat", category: "Legs", muscleGroups: ["quads", "glutes", "hamstrings"] },
  { id: "14", name: "Front Squat", category: "Legs", muscleGroups: ["quads", "core"] },
  { id: "15", name: "Leg Press", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "16", name: "Hack Squat", category: "Legs", muscleGroups: ["quads"] },
  { id: "17", name: "Lunges", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "18", name: "Walking Lunges", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "19", name: "Bulgarian Split Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "20", name: "Leg Extension", category: "Legs", muscleGroups: ["quads"] },
  { id: "21", name: "Leg Curl", category: "Legs", muscleGroups: ["hamstrings"] },
  { id: "22", name: "Romanian Deadlift", category: "Legs", muscleGroups: ["hamstrings", "glutes"] },
  { id: "23", name: "Stiff Leg Deadlift", category: "Legs", muscleGroups: ["hamstrings", "glutes"] },
  { id: "24", name: "Good Mornings", category: "Legs", muscleGroups: ["hamstrings", "lower back"] },
  { id: "25", name: "Calf Raises", category: "Legs", muscleGroups: ["calves"] },
  { id: "26", name: "Seated Calf Raise", category: "Legs", muscleGroups: ["calves"] },
  { id: "27", name: "Goblet Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "28", name: "Step Ups", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "29", name: "Hip Thrust", category: "Legs", muscleGroups: ["glutes", "hamstrings"] },
  { id: "30", name: "Glute Bridge", category: "Legs", muscleGroups: ["glutes"] },
  { id: "31", name: "Sumo Squat", category: "Legs", muscleGroups: ["quads", "glutes", "adductors"] },
  { id: "32", name: "Box Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  
  { id: "33", name: "Deadlift", category: "Back", muscleGroups: ["back", "hamstrings", "glutes"] },
  { id: "34", name: "Sumo Deadlift", category: "Back", muscleGroups: ["back", "glutes", "adductors"] },
  { id: "35", name: "Barbell Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "36", name: "Pendlay Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "37", name: "Dumbbell Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "38", name: "T-Bar Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "39", name: "Seated Cable Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "40", name: "Lat Pulldown", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "41", name: "Wide Grip Lat Pulldown", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "42", name: "Close Grip Lat Pulldown", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "43", name: "Pull-Ups", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "44", name: "Chin-Ups", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "45", name: "Neutral Grip Pull-Ups", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "46", name: "Face Pulls", category: "Back", muscleGroups: ["rear delts", "traps"] },
  { id: "47", name: "Straight Arm Pulldown", category: "Back", muscleGroups: ["lats"] },
  { id: "48", name: "Rack Pull", category: "Back", muscleGroups: ["back", "traps"] },
  { id: "49", name: "Hyperextension", category: "Back", muscleGroups: ["lower back", "glutes"] },
  { id: "50", name: "Reverse Fly", category: "Back", muscleGroups: ["rear delts"] },
  
  { id: "51", name: "Overhead Press", category: "Shoulders", muscleGroups: ["shoulders", "triceps"] },
  { id: "52", name: "Military Press", category: "Shoulders", muscleGroups: ["shoulders", "triceps"] },
  { id: "53", name: "Dumbbell Shoulder Press", category: "Shoulders", muscleGroups: ["shoulders", "triceps"] },
  { id: "54", name: "Arnold Press", category: "Shoulders", muscleGroups: ["shoulders", "triceps"] },
  { id: "55", name: "Lateral Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "56", name: "Front Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "57", name: "Rear Delt Fly", category: "Shoulders", muscleGroups: ["rear delts"] },
  { id: "58", name: "Upright Row", category: "Shoulders", muscleGroups: ["shoulders", "traps"] },
  { id: "59", name: "Shrugs", category: "Shoulders", muscleGroups: ["traps"] },
  { id: "60", name: "Dumbbell Shrugs", category: "Shoulders", muscleGroups: ["traps"] },
  { id: "61", name: "Cable Lateral Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "62", name: "Machine Shoulder Press", category: "Shoulders", muscleGroups: ["shoulders", "triceps"] },
  { id: "63", name: "Push Press", category: "Shoulders", muscleGroups: ["shoulders", "triceps", "legs"] },
  { id: "64", name: "Behind Neck Press", category: "Shoulders", muscleGroups: ["shoulders"] },
  
  { id: "65", name: "Barbell Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "66", name: "EZ Bar Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "67", name: "Dumbbell Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "68", name: "Hammer Curl", category: "Arms", muscleGroups: ["biceps", "forearms"] },
  { id: "69", name: "Preacher Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "70", name: "Concentration Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "71", name: "Cable Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "72", name: "Incline Dumbbell Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "73", name: "Spider Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "74", name: "Reverse Curl", category: "Arms", muscleGroups: ["forearms", "biceps"] },
  { id: "75", name: "Tricep Pushdown", category: "Arms", muscleGroups: ["triceps"] },
  { id: "76", name: "Rope Pushdown", category: "Arms", muscleGroups: ["triceps"] },
  { id: "77", name: "Skull Crushers", category: "Arms", muscleGroups: ["triceps"] },
  { id: "78", name: "Close Grip Bench Press", category: "Arms", muscleGroups: ["triceps", "chest"] },
  { id: "79", name: "Overhead Tricep Extension", category: "Arms", muscleGroups: ["triceps"] },
  { id: "80", name: "Dumbbell Tricep Extension", category: "Arms", muscleGroups: ["triceps"] },
  { id: "81", name: "Tricep Dips", category: "Arms", muscleGroups: ["triceps"] },
  { id: "82", name: "Diamond Push-Ups", category: "Arms", muscleGroups: ["triceps", "chest"] },
  { id: "83", name: "Tricep Kickback", category: "Arms", muscleGroups: ["triceps"] },
  { id: "84", name: "Wrist Curl", category: "Arms", muscleGroups: ["forearms"] },
  { id: "85", name: "Reverse Wrist Curl", category: "Arms", muscleGroups: ["forearms"] },
  
  { id: "86", name: "Crunches", category: "Core", muscleGroups: ["abs"] },
  { id: "87", name: "Sit-Ups", category: "Core", muscleGroups: ["abs"] },
  { id: "88", name: "Plank", category: "Core", muscleGroups: ["abs", "core"] },
  { id: "89", name: "Side Plank", category: "Core", muscleGroups: ["obliques"] },
  { id: "90", name: "Russian Twist", category: "Core", muscleGroups: ["obliques"] },
  { id: "91", name: "Leg Raise", category: "Core", muscleGroups: ["abs"] },
  { id: "92", name: "Hanging Leg Raise", category: "Core", muscleGroups: ["abs"] },
  { id: "93", name: "Bicycle Crunch", category: "Core", muscleGroups: ["abs", "obliques"] },
  { id: "94", name: "Mountain Climbers", category: "Core", muscleGroups: ["abs", "core"] },
  { id: "95", name: "Ab Wheel Rollout", category: "Core", muscleGroups: ["abs", "core"] },
  { id: "96", name: "Cable Crunch", category: "Core", muscleGroups: ["abs"] },
  { id: "97", name: "Decline Sit-Up", category: "Core", muscleGroups: ["abs"] },
  { id: "98", name: "V-Up", category: "Core", muscleGroups: ["abs"] },
  { id: "99", name: "Dead Bug", category: "Core", muscleGroups: ["abs", "core"] },
  { id: "100", name: "Pallof Press", category: "Core", muscleGroups: ["core", "obliques"] },
  
  { id: "101", name: "Kettlebell Swing", category: "Full Body", muscleGroups: ["glutes", "hamstrings", "core"] },
  { id: "102", name: "Clean and Jerk", category: "Full Body", muscleGroups: ["full body"] },
  { id: "103", name: "Snatch", category: "Full Body", muscleGroups: ["full body"] },
  { id: "104", name: "Power Clean", category: "Full Body", muscleGroups: ["full body"] },
  { id: "105", name: "Hang Clean", category: "Full Body", muscleGroups: ["full body"] },
  { id: "106", name: "Thruster", category: "Full Body", muscleGroups: ["full body"] },
  { id: "107", name: "Burpees", category: "Full Body", muscleGroups: ["full body"] },
  { id: "108", name: "Man Makers", category: "Full Body", muscleGroups: ["full body"] },
  { id: "109", name: "Turkish Get Up", category: "Full Body", muscleGroups: ["full body"] },
  { id: "110", name: "Farmers Walk", category: "Full Body", muscleGroups: ["grip", "core", "traps"] },
  
  { id: "111", name: "Dumbbell Pullover", category: "Chest", muscleGroups: ["chest", "lats"] },
  { id: "112", name: "Svend Press", category: "Chest", muscleGroups: ["chest"] },
  { id: "113", name: "Floor Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "114", name: "Pause Bench Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "115", name: "Spoto Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  
  { id: "116", name: "Sissy Squat", category: "Legs", muscleGroups: ["quads"] },
  { id: "117", name: "Jefferson Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "118", name: "Zercher Squat", category: "Legs", muscleGroups: ["quads", "core"] },
  { id: "119", name: "Pistol Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "120", name: "Nordic Curl", category: "Legs", muscleGroups: ["hamstrings"] },
  
  { id: "121", name: "Meadows Row", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "122", name: "Kroc Row", category: "Back", muscleGroups: ["lats", "biceps"] },
  { id: "123", name: "Chest Supported Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "124", name: "Inverted Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "125", name: "Seal Row", category: "Back", muscleGroups: ["back", "biceps"] },
  
  { id: "126", name: "Lu Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "127", name: "Bradford Press", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "128", name: "Landmine Lateral Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "129", name: "Plate Front Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "130", name: "Cable Face Pull", category: "Shoulders", muscleGroups: ["rear delts", "traps"] },
  
  { id: "131", name: "Zottman Curl", category: "Arms", muscleGroups: ["biceps", "forearms"] },
  { id: "132", name: "Cross Body Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "133", name: "Bayesian Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "134", name: "JM Press", category: "Arms", muscleGroups: ["triceps"] },
  { id: "135", name: "Tate Press", category: "Arms", muscleGroups: ["triceps"] },
  
  { id: "136", name: "Dragon Flag", category: "Core", muscleGroups: ["abs", "core"] },
  { id: "137", name: "Hollow Body Hold", category: "Core", muscleGroups: ["abs", "core"] },
  { id: "138", name: "L-Sit", category: "Core", muscleGroups: ["abs", "hip flexors"] },
  { id: "139", name: "Toes to Bar", category: "Core", muscleGroups: ["abs"] },
  { id: "140", name: "Windshield Wipers", category: "Core", muscleGroups: ["obliques", "abs"] },
  
  { id: "141", name: "Box Jump", category: "Plyometrics", muscleGroups: ["legs"] },
  { id: "142", name: "Jump Squat", category: "Plyometrics", muscleGroups: ["quads", "glutes"] },
  { id: "143", name: "Broad Jump", category: "Plyometrics", muscleGroups: ["legs"] },
  { id: "144", name: "Depth Jump", category: "Plyometrics", muscleGroups: ["legs"] },
  { id: "145", name: "Plyo Push-Up", category: "Plyometrics", muscleGroups: ["chest", "triceps"] },
  
  { id: "146", name: "Battle Ropes", category: "Conditioning", muscleGroups: ["shoulders", "core"] },
  { id: "147", name: "Sled Push", category: "Conditioning", muscleGroups: ["legs", "core"] },
  { id: "148", name: "Sled Pull", category: "Conditioning", muscleGroups: ["back", "legs"] },
  { id: "149", name: "Prowler Push", category: "Conditioning", muscleGroups: ["legs", "core"] },
  { id: "150", name: "Tire Flip", category: "Conditioning", muscleGroups: ["full body"] },
  
  { id: "151", name: "Smith Machine Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "152", name: "Smith Machine Bench Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "153", name: "Smith Machine Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "154", name: "Smith Machine Shoulder Press", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "155", name: "Smith Machine Lunge", category: "Legs", muscleGroups: ["quads", "glutes"] },
  
  { id: "156", name: "Cable Fly", category: "Chest", muscleGroups: ["chest"] },
  { id: "157", name: "Low Cable Fly", category: "Chest", muscleGroups: ["chest"] },
  { id: "158", name: "High Cable Fly", category: "Chest", muscleGroups: ["chest"] },
  { id: "159", name: "Single Arm Cable Fly", category: "Chest", muscleGroups: ["chest"] },
  { id: "160", name: "Cable Chest Press", category: "Chest", muscleGroups: ["chest", "triceps"] },
  
  { id: "161", name: "Leg Press Calf Raise", category: "Legs", muscleGroups: ["calves"] },
  { id: "162", name: "Donkey Calf Raise", category: "Legs", muscleGroups: ["calves"] },
  { id: "163", name: "Single Leg Calf Raise", category: "Legs", muscleGroups: ["calves"] },
  { id: "164", name: "Tibialis Raise", category: "Legs", muscleGroups: ["tibialis"] },
  { id: "165", name: "Reverse Leg Curl", category: "Legs", muscleGroups: ["hamstrings"] },
  
  { id: "166", name: "Pullover Machine", category: "Back", muscleGroups: ["lats"] },
  { id: "167", name: "Machine Row", category: "Back", muscleGroups: ["back", "biceps"] },
  { id: "168", name: "Low Row Machine", category: "Back", muscleGroups: ["back"] },
  { id: "169", name: "High Row Machine", category: "Back", muscleGroups: ["back"] },
  { id: "170", name: "Assisted Pull-Up", category: "Back", muscleGroups: ["lats", "biceps"] },
  
  { id: "171", name: "Machine Lateral Raise", category: "Shoulders", muscleGroups: ["shoulders"] },
  { id: "172", name: "Reverse Pec Deck", category: "Shoulders", muscleGroups: ["rear delts"] },
  { id: "173", name: "Cable Upright Row", category: "Shoulders", muscleGroups: ["shoulders", "traps"] },
  { id: "174", name: "Landmine Press", category: "Shoulders", muscleGroups: ["shoulders", "chest"] },
  { id: "175", name: "Z Press", category: "Shoulders", muscleGroups: ["shoulders", "core"] },
  
  { id: "176", name: "Machine Bicep Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "177", name: "Machine Tricep Extension", category: "Arms", muscleGroups: ["triceps"] },
  { id: "178", name: "Overhead Cable Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "179", name: "Single Arm Cable Curl", category: "Arms", muscleGroups: ["biceps"] },
  { id: "180", name: "Single Arm Tricep Pushdown", category: "Arms", muscleGroups: ["triceps"] },
  
  { id: "181", name: "Ab Machine Crunch", category: "Core", muscleGroups: ["abs"] },
  { id: "182", name: "Rotary Torso", category: "Core", muscleGroups: ["obliques"] },
  { id: "183", name: "Back Extension Machine", category: "Core", muscleGroups: ["lower back"] },
  { id: "184", name: "Roman Chair Leg Raise", category: "Core", muscleGroups: ["abs"] },
  { id: "185", name: "Decline Crunch", category: "Core", muscleGroups: ["abs"] },
  
  { id: "186", name: "Deficit Deadlift", category: "Back", muscleGroups: ["back", "hamstrings"] },
  { id: "187", name: "Block Pull", category: "Back", muscleGroups: ["back", "traps"] },
  { id: "188", name: "Pause Deadlift", category: "Back", muscleGroups: ["back", "hamstrings"] },
  { id: "189", name: "Snatch Grip Deadlift", category: "Back", muscleGroups: ["back", "traps"] },
  { id: "190", name: "Trap Bar Deadlift", category: "Back", muscleGroups: ["back", "quads"] },
  
  { id: "191", name: "Pause Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "192", name: "Anderson Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "193", name: "Safety Bar Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "194", name: "Belt Squat", category: "Legs", muscleGroups: ["quads", "glutes"] },
  { id: "195", name: "Pendulum Squat", category: "Legs", muscleGroups: ["quads"] },
  
  { id: "196", name: "Incline Cable Fly", category: "Chest", muscleGroups: ["chest"] },
  { id: "197", name: "Decline Cable Fly", category: "Chest", muscleGroups: ["chest"] },
  { id: "198", name: "Deficit Push-Up", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "199", name: "Archer Push-Up", category: "Chest", muscleGroups: ["chest", "triceps"] },
  { id: "200", name: "Weighted Push-Up", category: "Chest", muscleGroups: ["chest", "triceps"] },
];

export function searchExercises(query: string): Exercise[] {
  if (!query.trim()) {
    return EXERCISES.slice(0, 20);
  }
  
  const lowerQuery = query.toLowerCase();
  return EXERCISES.filter(
    (exercise) =>
      exercise.name.toLowerCase().includes(lowerQuery) ||
      exercise.category.toLowerCase().includes(lowerQuery) ||
      exercise.muscleGroups.some((mg) => mg.toLowerCase().includes(lowerQuery))
  ).slice(0, 50);
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export function getExerciseByName(name: string): Exercise | undefined {
  return EXERCISES.find((e) => e.name.toLowerCase() === name.toLowerCase());
}
