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

The owner import/export scripts also use local-only values. Do not expose these
through Expo env and do not commit real values:

```bash
DATABASE_URL=<old-postgres-url-for-one-time-export>
SUPABASE_URL=https://dxwvfrcqafbawswysbkd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<local-only-service-role-key>
OWNER_USER_ID=<supabase-auth-user-id>
OWNER_EXPORT_PATH=<path-to-local-owner-export-json>
```

## Supabase Schema

Apply SQL files in `supabase/migrations/` to the Supabase project before using a
fresh environment. They create the app tables, built-in exercises, RLS policies,
and RPC functions used by the client.

## Start Expo

```bash
set -a && source .env && set +a
pnpm expo:dev
```

Scan the QR code with your iPhone camera to open in Expo Go.

## Data Flow

- Supabase Auth owns signup, login, logout, and session persistence.
- `public.profiles` stores display name and units.
- Active workout writes commit to `AsyncStorage` first.
- Supabase writes are attempted after local persistence and queued when offline
  or when Supabase is unavailable.
- Queue retries use idempotent upserts/RPCs for workouts, favorites, exercise
  history, and custom exercise operations.
