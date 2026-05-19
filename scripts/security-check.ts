import "dotenv/config";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

/**
 * Launch security check (SPEC §T21, invariants V5/V6/V7/V11).
 *
 * Live checks against the configured Supabase project:
 *  - anon (unauthenticated) is denied all user-owned tables (V5/V6)
 *  - a fresh authenticated user sees none of another user's rows (V5)
 *  - builtin exercises are readable but immutable by a normal user (V6)
 * Static checks against the repo:
 *  - service role key absent from git-tracked files (V7)
 *  - Express/session/bcrypt/Drizzle runtime removed (V11)
 *
 * The temporary test user is created via the service role and deleted
 * before exit. Exits non-zero if any check fails.
 */

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL is required");
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
if (!anonKey)
  throw new Error("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required");

const url = supabaseUrl;
const service = serviceRoleKey;
const anon = anonKey;

// A user id that is never the temp test user — used to prove a normal
// user cannot insert rows attributed to someone else.
const FOREIGN_USER_ID = "00000000-0000-0000-0000-000000000000";

const USER_TABLES = ["profiles", "workouts", "favorites", "exercise_history"];

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];

function record(name: string, pass: boolean, detail: string): void {
  checks.push({ name, pass, detail });
}

const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * V5/V6 — anon must read zero rows from every table. A deny can arrive
 * two ways: a hard "permission denied" (no table grant) or an empty
 * result (RLS filtered every row). Both mean anon saw nothing; only
 * actual rows coming back is a failure.
 */
async function checkAnonDenied(): Promise<void> {
  const anonClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const table of [...USER_TABLES, "exercises"]) {
    const { data, error } = await anonClient.from(table).select("*").limit(50);
    const rows = data?.length ?? 0;
    record(
      `anon denied: ${table}`,
      rows === 0,
      error ? `denied (${error.message})` : `${rows} rows visible to anon`,
    );
  }
}

/** V5/V6 — a fresh authenticated user must not see another user's data. */
async function checkCrossUserIsolation(): Promise<void> {
  const email = `seccheck-${Date.now()}@ironlog.invalid`;
  const password = `Sc!${Math.random().toString(36).slice(2)}A9`;

  const { data: created, error: createError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    record(
      "temp user created",
      false,
      `could not create test user: ${createError?.message ?? "unknown"}`,
    );
    return;
  }

  const tempUserId = created.user.id;
  record("temp user created", true, `id ${tempUserId}`);

  try {
    const tempClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await tempClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      record("temp user sign-in", false, signInError.message);
      return;
    }
    record("temp user sign-in", true, "authenticated");

    for (const table of USER_TABLES) {
      const { data, error } = await tempClient
        .from(table)
        .select("*")
        .limit(50);
      const rows = data?.length ?? 0;
      record(
        `cross-user isolation: ${table}`,
        error === null && rows === 0,
        error ? `error ${error.message}` : `${rows} other-user rows visible`,
      );
    }

    // V6 — builtin exercises readable; no other user's custom exercises.
    const { data: exData, error: exError } = await tempClient
      .from("exercises")
      .select("id,user_id");
    const builtin = (exData ?? []).filter((r) => r.user_id === null).length;
    const foreignCustom = (exData ?? []).filter(
      (r) => r.user_id !== null,
    ).length;
    record(
      "builtin exercises readable (V6)",
      exError === null && builtin > 0,
      exError ? `error ${exError.message}` : `${builtin} builtin rows visible`,
    );
    record(
      "other users' custom exercises hidden (V5)",
      exError === null && foreignCustom === 0,
      `${foreignCustom} foreign custom exercises visible`,
    );

    // V6 — a normal user cannot mutate builtin exercises.
    const { data: builtinRow } = await serviceClient
      .from("exercises")
      .select("id")
      .is("user_id", null)
      .limit(1)
      .maybeSingle();

    if (builtinRow) {
      const { data: updated } = await tempClient
        .from("exercises")
        .update({ name: "tampered-by-security-check" })
        .eq("id", builtinRow.id)
        .select("id");
      record(
        "builtin exercise immutable (V6)",
        (updated?.length ?? 0) === 0,
        `${updated?.length ?? 0} builtin rows updated by normal user`,
      );
    }

    // V5 — a normal user cannot insert rows owned by someone else.
    const { error: spoofError } = await tempClient.from("workouts").insert({
      id: `sec-${Date.now()}`,
      user_id: FOREIGN_USER_ID,
      date: "2026-01-01",
    });
    record(
      "cannot spoof user_id on insert (V5)",
      spoofError !== null,
      spoofError ? `rejected: ${spoofError.message}` : "insert SUCCEEDED",
    );
  } finally {
    const { error: deleteError } =
      await serviceClient.auth.admin.deleteUser(tempUserId);
    record(
      "temp user deleted",
      deleteError === null,
      deleteError ? deleteError.message : "cleaned up",
    );
  }
}

/** V7 — the service role key must not appear in any git-tracked file. */
function checkServiceKeyAbsent(): void {
  const tracked = execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

  const leaks: string[] = [];
  for (const file of tracked) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue; // binary or unreadable
    }
    if (content.includes(service)) {
      leaks.push(file);
    }
  }
  record(
    "service role key absent from tracked files (V7)",
    leaks.length === 0,
    leaks.length === 0 ? "no leak" : `leaked in: ${leaks.join(", ")}`,
  );
}

/** V11 — Express/session/bcrypt/Drizzle runtime removed. */
function checkBackendRemoved(): void {
  const pkg = readFileSync("package.json", "utf8");
  const banned = ["express", "express-session", "bcrypt", "drizzle-orm"];
  const present = banned.filter((dep) => new RegExp(`"${dep}"\\s*:`).test(pkg));
  record(
    "backend runtime removed (V11)",
    present.length === 0,
    present.length === 0
      ? "no banned deps"
      : `still present: ${present.join(", ")}`,
  );
}

async function main(): Promise<void> {
  await checkAnonDenied();
  await checkCrossUserIsolation();
  checkServiceKeyAbsent();
  checkBackendRemoved();

  let failed = 0;
  console.log("\nLaunch security check\n");
  for (const check of checks) {
    const mark = check.pass ? "PASS" : "FAIL";
    if (!check.pass) failed += 1;
    console.log(`  [${mark}] ${check.name} — ${check.detail}`);
  }
  console.log(
    `\n${checks.length - failed}/${checks.length} passed${failed ? `, ${failed} FAILED` : ""}\n`,
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Security check crashed:", error);
  process.exitCode = 1;
});
