# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

IronLog is a mobile fitness tracking app built with React Native (Expo) frontend and Express backend, sharing TypeScript across both. Optimized for gym use: minimal UI, large touch targets, haptic feedback, one-handed operation.

## Package Manager

**This project uses `pnpm` exclusively.** Never use `npm` or `yarn` for installs, scripts, or any other operation. Always run scripts via `pnpm <script>` (e.g., `pnpm expo:dev`, not `npm run expo:dev`). For adding dependencies, use `pnpm add` / `pnpm add -D`. The lockfile of record is `pnpm-lock.yaml`.

## Commands

```bash
# Frontend
pnpm expo:dev                 # Start Expo dev server
pnpm expo:static:build        # Export static web build to static-build/

# Backend
pnpm server:dev               # Start Express server (dev mode, port 5000)
pnpm server:build             # Bundle server with esbuild to server_dist/
pnpm server:prod              # Run production server

# Database
pnpm db:push                  # Push Drizzle schema to PostgreSQL

# Quality
pnpm lint                     # ESLint
pnpm lint:fix                 # ESLint with autofix
pnpm check:types              # TypeScript type check (tsc --noEmit)
pnpm check:format             # Prettier format check
pnpm format                   # Apply prettier formatting

# Docker
docker-compose up -d db       # Start PostgreSQL only
docker-compose up -d          # Start full stack (PostgreSQL + Express)

# iOS
eas build --platform ios      # Build iOS app via EAS
```

## Architecture

**Three-layer TypeScript monorepo:**

- `client/` - React Native (Expo v54, React 19) frontend
- `server/` - Express v5 backend with Drizzle ORM + PostgreSQL
- `shared/` - Shared Drizzle table definitions and Zod validation schemas (`schema.ts`)

**Path aliases:** `@/*` maps to `./client/*`, `@shared/*` maps to `./shared/*`

**Frontend patterns:**
- Auth state via React Context (`client/contexts/AuthContext`)
- Server data via React Query (`@tanstack/react-query`) + AsyncStorage for local caching
- Navigation: bottom tab bar (Log, History, Favorites, Profile), each tab has its own stack navigator
- Theme system via `useTheme()` hook, constants in `client/constants/theme.ts`

**Backend patterns:**
- Session-based auth with `express-session` + `connect-pg-simple` (PostgreSQL session store)
- All protected routes use `requireAuth` middleware
- Client sends `credentials: 'include'` for cookie-based auth
- API routes defined in `server/routes.ts`, storage layer in `server/storage.ts`

**Database:** PostgreSQL with Drizzle ORM. Schema in `shared/schema.ts`. Tables: `users`, `workouts`, `favorites`, `exercise_history`. Types are inferred from Drizzle tables (e.g., `typeof workouts.$inferSelect`).

## Environment

Requires Node 22 (see `.tool-versions`). Environment variables: `DATABASE_URL`, `SESSION_SECRET`, `EXPO_PUBLIC_DOMAIN` (defaults to `localhost:5000`), `PORT` (default 5000), `ALLOWED_ORIGINS`.

## Workflow

Always commit after each individual change rather than batching multiple changes into one commit. Do not ask the user before committing — just commit.

## Design Reference

See `design_guidelines.md` for UI/UX specs including color palette, typography scale, component specs, and screen layouts. Primary accent color is `#FF3B30` (vibrant red).
