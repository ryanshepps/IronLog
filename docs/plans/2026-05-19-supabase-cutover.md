# Supabase Cutover Implementation Plan

> REQUIRED FOLLOW-UP: implement this plan task-by-task with the appropriate plan-execution workflow.

**Goal:** Replace the self-hosted Express/Postgres/session backend with Supabase Auth and Supabase Postgres while preserving IronLog's offline-first workout logging behavior.

**Architecture:** The app remains local-first: active workout writes update `AsyncStorage` immediately and enqueue idempotent remote sync operations. Supabase becomes the remote persistence and auth provider, protected by Row Level Security, with SQL RPC functions for multi-row operations that should retry safely.

**Tech Stack:** Expo React Native, TypeScript, AsyncStorage, React Query, Supabase Auth, Supabase Postgres, Supabase JS client, SQL migrations/RLS/RPC, pnpm.

---

## Non-Negotiable Product Contract

- Workout entry must never wait on Supabase network writes.
- The app must support logging workouts while offline, on slow networks, or while Supabase is unavailable.
- Reconnecting must flush queued writes without duplicate favorites, duplicate history rows, or corrupt workout records.
- No Supabase service role key may be bundled into the Expo app.
- The migration is intentionally non-backward-compatible for public users, but it includes a one-off import for the current owner's existing data.

## External References

- Supabase Expo quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase user/profile guidance: https://supabase.com/docs/guides/auth/managing-user-data
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Postgres migration: https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres

## Current Code Map

- Auth context: `client/contexts/AuthContext.tsx`
- Express HTTP helper: `client/lib/query-client.ts`
- Offline-first storage and remote calls: `client/lib/storage.ts`
- Current write queue: `client/lib/write-queue.ts`
- Existing one-time local upload path: `client/lib/migration.ts`
- Exercise React Query hooks: `client/hooks/useExercises.ts`
- Current database schema and Zod schemas: `shared/schema.ts`
- Express API routes to remove: `server/routes.ts`
- Drizzle storage layer to remove: `server/storage.ts`
- Server database client to remove: `server/db.ts`
- Built-in exercise seed source: `scripts/seed-exercises.ts`

## Target Schema

Create Supabase migrations under `supabase/migrations/`.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Athlete',
  units text not null default 'lbs' check (units in ('kg', 'lbs')),
  created_at timestamptz not null default now()
);

create table public.exercises (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  muscle_groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.workouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  exercises jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create table public.exercise_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  last_weight integer not null default 0,
  last_reps integer not null default 0,
  last_feeling integer not null default 5 check (last_feeling between 1 and 10),
  last_performed timestamptz,
  personal_record integer not null default 0,
  unique (user_id, exercise_id)
);
```

RLS baseline:

```sql
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.favorites enable row level security;
alter table public.exercise_history enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

create policy "exercises_select_builtin_or_own" on public.exercises
  for select to authenticated using (user_id is null or (select auth.uid()) = user_id);
create policy "exercises_insert_own" on public.exercises
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "exercises_update_own" on public.exercises
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "exercises_delete_own" on public.exercises
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "workouts_all_own" on public.workouts
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "favorites_all_own" on public.favorites
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "exercise_history_all_own" on public.exercise_history
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

## Task 1: Add Supabase Project Scaffolding

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/<timestamp>_initial_schema.sql`
- Create: `supabase/migrations/<timestamp>_seed_builtin_exercises.sql`
- Create: `client/lib/supabase.ts`
- Modify: `package.json`
- Modify: `.env.example` if present; otherwise document env vars in `README.md`

**Steps:**

1. Install client dependencies with pnpm:
   - `pnpm add @supabase/supabase-js react-native-url-polyfill expo-sqlite`
2. Add `client/lib/supabase.ts`:
   ```ts
   import "react-native-url-polyfill/auto";
   import "expo-sqlite/localStorage/install";
   import { createClient } from "@supabase/supabase-js";

   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
   const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

   if (!supabaseUrl || !supabasePublishableKey) {
     throw new Error("Supabase environment variables are not set");
   }

   export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
     auth: {
       storage: localStorage,
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: false,
     },
   });
   ```
3. Create the initial schema migration using the SQL in this plan.
4. Seed the built-in exercises from `scripts/seed-exercises.ts` into SQL inserts with `user_id = null`.
5. Verify:
   - `pnpm check:types`
   - Run Supabase migration locally or against the new Supabase project.
   - In Supabase SQL editor, confirm all public tables have RLS enabled.

## Task 2: Add Profiles and Auth Flow

**Files:**
- Modify: `client/contexts/AuthContext.tsx`
- Modify: `client/screens/LoginScreen.tsx`
- Modify: `client/screens/SignupScreen.tsx`
- Modify: `client/screens/ProfileScreen.tsx`
- Create: `client/lib/profile.ts`

**Steps:**

1. Replace `/api/auth/me`, `/api/auth/login`, `/api/auth/signup`, and `/api/auth/logout` calls with Supabase Auth.
2. Keep the existing `AuthUser` shape so screen code changes stay small:
   ```ts
   export interface AuthUser {
     id: string;
     email: string;
     displayName: string;
     units: string;
   }
   ```
3. Add `getOrCreateProfile(user)` in `client/lib/profile.ts`.
4. On sign-up, insert or upsert `profiles` with `id = auth.user.id`, `email`, `display_name`, and default `units`.
5. On app startup, call `supabase.auth.getSession()` and hydrate `AuthContext`.
6. Subscribe with `supabase.auth.onAuthStateChange()` so token refresh/logout updates app state.
7. Update profile writes to update `public.profiles`, not `/api/auth/profile`.
8. Verify:
   - Fresh signup creates an auth user and profile row.
   - Logout clears app auth state.
   - Relaunch restores session.
   - `pnpm check:types`.

## Task 3: Replace HTTP API With a Supabase Remote Adapter

**Files:**
- Create: `client/lib/remote-sync.ts`
- Modify: `client/lib/storage.ts`
- Modify: `client/hooks/useExercises.ts`
- Eventually remove: `client/lib/query-client.ts`

**Steps:**

1. Add remote read functions:
   ```ts
   export async function fetchRemoteWorkouts(): Promise<RawWorkout[]>;
   export async function fetchRemoteFavorites(): Promise<string[]>;
   export async function fetchRemoteExerciseHistory(): Promise<RawHistoryRecord[]>;
   export async function fetchRemoteExercises(): Promise<ExerciseRecord[]>;
   ```
2. Add remote write functions:
   ```ts
   export async function upsertRemoteWorkout(workout: Workout): Promise<void>;
   export async function deleteRemoteWorkout(id: string): Promise<void>;
   export async function addRemoteFavorite(exerciseId: string): Promise<void>;
   export async function removeRemoteFavorite(exerciseId: string): Promise<void>;
   export async function upsertRemoteExerciseHistory(record: ExerciseHistory): Promise<void>;
   ```
3. In `client/lib/storage.ts`, keep all local `AsyncStorage` writes before remote sync.
4. Replace `fetchJSON("/api/...")` with the remote adapter.
5. Make every remote write derive `user_id` from the current Supabase session or use RPC functions that derive it from `auth.uid()`.
6. Verify:
   - Reads hydrate local caches when online.
   - Reads fall back to local caches when Supabase is unavailable.
   - Adding sets remains instant with the network disabled.

## Task 4: Convert the Write Queue to Typed Supabase Operations

**Files:**
- Modify: `client/lib/write-queue.ts`
- Modify: `client/lib/storage.ts`
- Test: add or extend tests if a testable pure queue dispatcher is extracted.

**Steps:**

1. Replace HTTP-shaped operations:
   ```ts
   type QueuedOp = {
     id: string;
     method: "POST" | "PUT" | "DELETE";
     path: string;
     body?: unknown;
     enqueuedAt: number;
   };
   ```
   with typed operations:
   ```ts
   type QueuedOp =
     | { id: string; type: "workout.upsert"; payload: Workout; enqueuedAt: number }
     | { id: string; type: "workout.delete"; workoutId: string; enqueuedAt: number }
     | { id: string; type: "favorite.add"; exerciseId: string; enqueuedAt: number }
     | { id: string; type: "favorite.remove"; exerciseId: string; enqueuedAt: number }
     | { id: string; type: "history.upsert"; payload: ExerciseHistory; enqueuedAt: number };
   ```
2. Add `dispatchQueuedOp(op)` that calls `client/lib/remote-sync.ts`.
3. Keep queue persistence in `AsyncStorage` using a new key, for example `@ironlog/write_queue_v2`.
4. Leave a best-effort reader for the old queue key only if current local devices may have queued writes. Otherwise skip it because this is a non-backward-compatible cutover.
5. Add retry hygiene:
   - never remove an op unless the remote write succeeds
   - preserve op order
   - avoid concurrent flushes
   - do not block local writes on flush
6. Verify:
   - Simulate Supabase failure, add workout data, confirm queue grows.
   - Restore network, call `flushQueue()`, confirm queue clears.
   - Call `flushQueue()` twice, confirm no duplicate favorites/history rows.

## Task 5: Add RPC Functions for Multi-Row Operations

**Files:**
- Create: `supabase/migrations/<timestamp>_rpc_functions.sql`
- Modify: `client/lib/remote-sync.ts`
- Modify: `client/hooks/useExercises.ts`

**Steps:**

1. Add `rename_exercise(exercise_id text, new_name text)`:
   - validate the exercise belongs to `auth.uid()`
   - update `public.exercises.name`
   - update matching `public.exercise_history.exercise_name`
   - update embedded `workouts.exercises` JSON where necessary
2. Add `delete_custom_exercise(exercise_id text)`:
   - delete current user's favorites for that exercise
   - delete current user's exercise history for that exercise
   - delete exercise where `user_id = auth.uid()`
3. Add optional `sync_initial_data(...)` only if the client import/sync path is simpler as one transaction than as repeated typed queue ops.
4. Do not use Edge Functions for these operations unless SQL becomes too awkward. They are database-local and should avoid cold-start-dependent UX.
5. Verify:
   - Retry each RPC twice; result remains correct.
   - RLS prevents another authenticated user from renaming/deleting someone else's custom exercise.

## Task 6: One-Off Owner Data Import

**Files:**
- Create: `scripts/export-owner-data.ts`
- Create: `scripts/import-owner-data-to-supabase.ts`
- Optional create: `owner-data-export.json` in `.gitignore` only; do not commit real export data.
- Modify: `.gitignore`

**Steps:**

1. Before deleting the old backend, export current data from the existing Postgres database:
   ```json
   {
     "user": { "email": "...", "displayName": "Ryan", "units": "lbs" },
     "workouts": [],
     "favorites": [],
     "exerciseHistory": [],
     "customExercises": []
   }
   ```
2. Create your Supabase account through the app or dashboard.
3. Get the new Supabase auth user ID.
4. Import with a local script using server-only environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OWNER_USER_ID`
   - `OWNER_EXPORT_PATH`
5. The import script should:
   - upsert `profiles`
   - upsert custom exercises with `user_id = OWNER_USER_ID`
   - upsert workouts with `user_id = OWNER_USER_ID`
   - upsert favorites on `(user_id, exercise_id)`
   - upsert exercise history on `(user_id, exercise_id)`
6. Verify:
   - Imported counts match exported counts.
   - App login as owner shows previous workouts, favorites, and history.
   - No service role key exists in committed files or Expo env.

## Task 7: Remove Express, Drizzle Runtime, and Self-Hosted DB Paths

**Files:**
- Remove: `server/routes.ts`
- Remove: `server/storage.ts`
- Remove: `server/db.ts`
- Remove: `server/index.ts`
- Remove or archive: `Dockerfile`
- Remove or archive: `docker-compose.yml`
- Modify: `package.json`
- Modify: `drizzle.config.ts` or remove it if no longer used
- Modify: `shared/schema.ts`
- Modify: `README.md`
- Modify: `docs/local-development.md`

**Steps:**

1. Remove Express/server scripts:
   - `server:dev`
   - `server:build`
   - `server:prod`
   - `db:push`
   - `db:seed` if Supabase migrations now seed built-ins
2. Remove backend-only dependencies:
   - `express`
   - `express-session`
   - `connect-pg-simple`
   - `bcryptjs`
   - `pg`
   - `drizzle-orm` and `drizzle-zod` only if no shared schema code still depends on them
3. Replace `shared/schema.ts` with Zod/domain types only, or create `shared/types.ts` and update imports.
4. Ensure Expo scripts use Supabase env vars instead of `EXPO_PUBLIC_DOMAIN`.
5. Verify:
   - `pnpm install`
   - `pnpm check:types`
   - `pnpm lint`
   - `pnpm test`

## Task 8: Offline-First QA Gate

**Files:**
- Create: `docs/qa/supabase-offline-first-checklist.md`
- Optional test helpers under `tests/` if pure sync logic is extracted.

**Manual QA Scenarios:**

1. Airplane mode, logged-in session already present:
   - start workout
   - add exercise
   - add/edit/delete sets
   - finish workout
   - quit and reopen app
   - confirm workout remains visible
2. Reconnect:
   - queue flushes
   - Supabase tables contain the workout
   - no duplicate rows
3. Slow/broken Supabase:
   - simulate failing remote calls
   - log workout data
   - confirm UI remains responsive
   - confirm queue remains intact
4. Auth expiration:
   - remote writes fail without deleting queued ops
   - after login/session refresh, queued ops flush
5. Duplicate retry:
   - call `flushQueue()` multiple times
   - confirm favorites and exercise history are unique per user/exercise

**Automated Checks:**

- `pnpm check:types`
- `pnpm lint`
- `pnpm test`
- Add focused unit tests for queue operation dispatch if `dispatchQueuedOp` is pure enough to test without Supabase.

## Task 9: Security Review Before Social/App Store Launch

**Checklist:**

- RLS enabled on every public table.
- Anonymous role cannot read or write user data.
- Authenticated user can only read/write own rows.
- Built-in exercises are readable to authenticated users and not writable by clients.
- Service role key appears only in local scripts/CI secrets.
- Expo app contains only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase Auth email/password settings are intentional.
- Database backups and project region are configured in Supabase dashboard.
- App does not log secrets, JWTs, or auth headers.

## Suggested Commit Sequence

1. Add Supabase migrations and seed data.
2. Add Supabase client and auth context migration.
3. Add remote sync adapter.
4. Convert write queue to typed Supabase operations.
5. Add RPC functions and exercise mutation wiring.
6. Add one-off owner import/export scripts.
7. Remove Express/Drizzle backend.
8. Add QA checklist and documentation updates.

Each commit should pass `pnpm check:types`; later commits should also pass `pnpm lint` and `pnpm test`.

## Done Criteria

- A fresh install can sign up, log in, update profile, and log out using Supabase Auth.
- Built-in exercises load from Supabase.
- Custom exercises can be created, renamed, and deleted.
- Workouts, favorites, and exercise history remain local-first and sync remotely.
- Airplane-mode workout logging works through app restart.
- Reconnect flushes queued writes without duplicates.
- Owner's existing data can be imported once into the new Supabase account.
- Express server, session auth, bcrypt password storage, and self-hosted Postgres runtime paths are gone.
- Security checklist passes before public social/App Store exposure.
