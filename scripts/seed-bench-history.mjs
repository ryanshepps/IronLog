import pg from "pg";
import fs from "node:fs";
for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
import { randomUUID } from "node:crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const USER_ID = "761648b2-d59a-4e93-8ed7-aa35df6568e3";
const EX_ID = "69ee92b1-3d94-45f7-a506-56c7cffec7c0";
const EX_NAME = "Bench Press";

// weight monotonic up, reps & sets vary so volume diverges from weight curve
const sessions = [
  { date: "2026-03-10", weight: 135, reps: 5, sets: 3 },
  { date: "2026-03-17", weight: 140, reps: 8, sets: 4 },
  { date: "2026-03-24", weight: 145, reps: 5, sets: 3 },
  { date: "2026-03-31", weight: 150, reps: 10, sets: 3 },
  { date: "2026-04-07", weight: 155, reps: 6, sets: 4 },
  { date: "2026-04-14", weight: 160, reps: 12, sets: 3 },
  { date: "2026-04-21", weight: 165, reps: 5, sets: 4 },
  { date: "2026-04-28", weight: 170, reps: 8, sets: 3 },
];

for (const s of sessions) {
  const ts = new Date(`${s.date}T18:00:00Z`).getTime();
  const setRows = Array.from({ length: s.sets }, (_, i) => ({
    id: randomUUID(),
    exerciseId: EX_ID,
    weight: s.weight,
    reps: s.reps,
    feeling: 5,
    timestamp: ts + i * 60_000,
  }));
  const exercises = [{ exerciseId: EX_ID, exerciseName: EX_NAME, sets: setRows }];
  await pool.query(
    `INSERT INTO workouts (user_id, date, exercises, completed_at) VALUES ($1, $2, $3::jsonb, to_timestamp($4 / 1000.0))`,
    [USER_ID, s.date, JSON.stringify(exercises), ts]
  );
  const vol = s.weight * s.reps * s.sets;
  console.log(`seeded ${s.date}  weight=${s.weight}  vol=${vol}`);
}

await pool.query(
  `INSERT INTO exercise_history (user_id, exercise_id, exercise_name, last_weight, last_reps, last_feeling, last_performed, personal_record)
   VALUES ($1, $2, $3, $4, $5, 5, to_timestamp($6 / 1000.0), $7)
   ON CONFLICT DO NOTHING`,
  [USER_ID, EX_ID, EX_NAME, 170, 8, new Date("2026-04-28T18:00:00Z").getTime(), 170]
);

await pool.end();
console.log("done");
