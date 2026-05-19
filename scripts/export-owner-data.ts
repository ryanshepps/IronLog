import "dotenv/config";
import { writeFile } from "node:fs/promises";
import pg from "pg";

const { Pool } = pg;

type OwnerExport = {
  user: {
    email: string;
    displayName: string;
    units: string;
  };
  workouts: unknown[];
  favorites: unknown[];
  exerciseHistory: unknown[];
  customExercises: unknown[];
};

const databaseUrl = process.env.DATABASE_URL;
const exportPath = process.env.OWNER_EXPORT_PATH;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!exportPath) {
  throw new Error("OWNER_EXPORT_PATH is required");
}

const ownerExportPath = exportPath;
const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const userResult = await pool.query<{
    id: string;
    email: string;
    display_name: string | null;
    units: string | null;
  }>(
    `
      select id, email, display_name, units
      from users
      order by created_at asc
      limit 1
    `,
  );

  const owner = userResult.rows[0];
  if (!owner) {
    throw new Error("No owner user found in old Postgres database");
  }

  const [workouts, favorites, exerciseHistory, customExercises] = await Promise.all([
    pool.query("select * from workouts where user_id = $1 order by date desc", [owner.id]),
    pool.query("select * from favorites where user_id = $1", [owner.id]),
    pool.query("select * from exercise_history where user_id = $1", [owner.id]),
    pool.query("select * from exercises where user_id = $1 order by name", [owner.id]),
  ]);

  const data: OwnerExport = {
    user: {
      email: owner.email,
      displayName: owner.display_name ?? "Athlete",
      units: owner.units ?? "lbs",
    },
    workouts: workouts.rows,
    favorites: favorites.rows,
    exerciseHistory: exerciseHistory.rows,
    customExercises: customExercises.rows,
  };

  await writeFile(ownerExportPath, JSON.stringify(data, null, 2));
  console.log(`Exported owner data to ${ownerExportPath}`);
}

main()
  .catch((error) => {
    console.error("Owner export failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
