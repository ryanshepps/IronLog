# Local Development

## Prerequisites

- Node 22 (see `.tool-versions`)
- pnpm
- Expo Go or an Expo development build
- Supabase project values in `.env`

## Environment

Expo needs only public Supabase values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://dxwvfrcqafbawswysbkd.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_t-YKjmm4g_WkjnqzAjCJeQ_DCFCpZJY
```

The local tooling scripts use additional local-only values. Do not expose these
through Expo env and do not commit real values:

```bash
# apply-migrations.ts — Supabase session-pooler connection URI
SUPABASE_DB_URL=<supabase-session-pooler-uri>
# security-check.ts
SUPABASE_URL=https://dxwvfrcqafbawswysbkd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<local-only-service-role-key>
```

## Supabase Schema

Apply the SQL files in `supabase/migrations/` to the Supabase project before
using a fresh environment — they create the app tables, built-in exercises,
table grants, RLS policies, and RPC functions used by the client:

```bash
pnpm exec tsx scripts/apply-migrations.ts
```

The script tracks applied files in `public.schema_migrations`, so re-runs only
apply migrations that have not run yet.

## Start Expo

```bash
set -a && source .env && set +a
pnpm expo:dev
```

Scan the QR code with your iPhone camera to open in Expo Go.

## Data Flow

- Supabase Auth owns signup, login, logout, and session persistence.
- App launch reads a non-token cached auth profile from AsyncStorage first so
  the last app/auth shell can render without waiting on Supabase.
- Supabase auth validation runs in the background after local hydration. If the
  session is missing or invalid, the cached profile is cleared and the app
  routes to login without showing an intermediate loading screen.
- `public.profiles` stores display name and units.
- Active workout writes commit to `AsyncStorage` first.
- Supabase writes are attempted after local persistence and queued when offline
  or when Supabase is unavailable.
- Queue retries use idempotent upserts/RPCs for workouts, favorites, exercise
  history, and custom exercise operations.
