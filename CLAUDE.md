# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IronLog is a mobile fitness tracking app built with React Native (Expo) and Supabase. Optimized for gym use: minimal UI, large touch targets, haptic feedback, one-handed operation.

## Package Manager

**This project uses `pnpm` exclusively.** Never use `npm` or `yarn` for installs, scripts, or any other operation. Always run scripts via `pnpm <script>` (e.g., `pnpm expo:dev`, not `npm run expo:dev`). For adding dependencies, use `pnpm add` / `pnpm add -D`. The lockfile of record is `pnpm-lock.yaml`.

## Commands

```bash
# Frontend
pnpm expo:dev                 # Start Expo dev server
pnpm expo:static:build        # Export static web build to static-build/

# Quality
pnpm lint                     # ESLint
pnpm lint:fix                 # ESLint with autofix
pnpm check:types              # TypeScript type check (tsc --noEmit)
pnpm check:format             # Prettier format check
pnpm format                   # Apply prettier formatting

# iOS
eas build --platform ios      # Build iOS app via EAS
```

## Architecture

**Expo + Supabase TypeScript app:**

- `client/` - React Native (Expo v54, React 19) frontend
- `shared/` - Shared Zod validation schemas (`schema.ts`)
- `supabase/` - Supabase config and SQL migrations
- `scripts/` - One-off owner import/export tooling

**Path aliases:** `@/*` maps to `./client/*`, `@shared/*` maps to `./shared/*`

**Frontend patterns:**
- Auth state via React Context (`client/contexts/AuthContext`) backed by Supabase Auth
- Remote data via Supabase client + React Query (`@tanstack/react-query`) + AsyncStorage for local caching
- Navigation: bottom tab bar (Log, History, Favorites, Profile), each tab has its own stack navigator
- Theme system via `useTheme()` hook, constants in `client/constants/theme.ts`

**Supabase patterns:**
- Client uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Service role key is local-script-only and must never be committed or exposed to Expo
- Active workout writes commit to AsyncStorage before remote sync attempts
- Remote writes use typed queued operations in `client/lib/write-queue.ts`
- Schema, seed data, RLS policies, and RPCs live in `supabase/migrations/`

## Environment

Requires Node 22 (see `.tool-versions`). Expo environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Owner import/export scripts additionally use local-only `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_USER_ID`, and `OWNER_EXPORT_PATH`.

## Workflow

Always commit after each individual change rather than batching multiple changes into one commit. Do not ask the user before committing — just commit.

## Design Reference

See `design_guidelines.md` for UI/UX specs including color palette, typography scale, component specs, and screen layouts. Primary accent color is `#FF3B30` (vibrant red).
