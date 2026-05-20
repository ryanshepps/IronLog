import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

/**
 * Apply supabase/migrations/*.sql to the remote Supabase Postgres DB.
 *
 * Tracks applied files in public.schema_migrations so the script is
 * idempotent and re-runnable: already-applied files are skipped, each
 * new file runs in its own transaction. Stops on the first failure.
 *
 * Requires SUPABASE_DB_URL — the direct/session connection string from
 * Supabase dashboard -> Settings -> Database (NOT the transaction
 * pooler on port 6543, which does not support multi-statement DDL).
 */

const { Client } = pg;

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) throw new Error("SUPABASE_DB_URL is required");

const MIGRATIONS_DIR = "supabase/migrations";

async function main(): Promise<void> {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const { rows } = await client.query<{ version: string }>(
      "select version from public.schema_migrations",
    );
    const applied = new Set(rows.map((row) => row.version));

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip   ${file} (already applied)`);
        continue;
      }

      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into public.schema_migrations (version) values ($1)",
          [file],
        );
        await client.query("commit");
        console.log(`apply  ${file}`);
        ran += 1;
      } catch (error) {
        await client.query("rollback");
        throw new Error(
          `migration ${file} failed: ${(error as Error).message}`,
        );
      }
    }

    console.log(`\n${ran} migration(s) applied, ${files.length - ran} skipped`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Apply migrations failed:", error);
  process.exitCode = 1;
});
