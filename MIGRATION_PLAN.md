# IronLog: Replit Removal Migration Plan

This plan removes all Replit dependencies from the IronLog codebase and prepares it for self-hosted deployment on a Mac Mini with Docker Compose (Postgres) and Cloudflare Tunnel (HTTPS). Each step is designed to be completed independently and verified before moving on.

---

## Step 1: Delete Replit-Only Files

Remove files that exist solely for Replit and serve no purpose outside it.

**Files to delete:**
- `.replit` — Replit runtime/deployment config
- `replit.md` — Replit-specific documentation

**Verification:** App still builds and runs locally with `npm run server:dev`.

> **STOP.** Confirm with the user before proceeding. Next step: rewrite the CORS setup in `server/index.ts` to use your own domain instead of Replit env vars.

---

## Step 2: Replace Replit Domain References in CORS (`server/index.ts`)

The `setupCors` function (lines 16-53) reads `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` to build the allowed-origins list. Replace this with a single `ALLOWED_ORIGINS` env var.

**Changes:**
- Remove references to `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS`
- Read allowed origins from a new `ALLOWED_ORIGINS` env var (comma-separated list of full URLs)
- Keep the existing localhost passthrough for local development

**Verification:** Server starts without errors. CORS headers are set correctly for localhost requests.

> **STOP.** Confirm with the user before proceeding. Next step: rewrite the npm scripts in `package.json` to remove Replit env var usage.

---

## Step 3: Rewrite npm Scripts (`package.json`)

The `expo:dev` script (line 6) injects three Replit-specific env vars:
```
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_DEV_DOMAIN
REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN
EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN:5000
```

**Changes:**
- Replace the `expo:dev` script with a version that reads `EXPO_PUBLIC_DOMAIN` from the environment directly (or defaults to `localhost:5000` for local dev)
- Remove `EXPO_PACKAGER_PROXY_URL` and `REACT_NATIVE_PACKAGER_HOSTNAME` — these are Replit proxy workarounds not needed outside Replit

**Verification:** `npm run expo:dev` starts the Expo dev server and the app loads on a local device/simulator.

> **STOP.** Confirm with the user before proceeding. Next step: simplify or replace the custom build script.

---

## Step 4: Simplify the Build Script (`scripts/build.js`)

This is the most Replit-coupled file (562 lines). The `getDeploymentDomain()` function (lines 41-59) checks `REPLIT_INTERNAL_APP_DOMAIN` and `REPLIT_DEV_DOMAIN` before falling back to `EXPO_PUBLIC_DOMAIN`.

**USER INPUT REQUIRED:** Before proceeding, the implementer must ask the user:

> Would you like to (a) simplify the existing build script to only use `EXPO_PUBLIC_DOMAIN`, or (b) replace the entire custom build script with `npx expo export` (standard Expo static export)?
>
> Option (a) is a smaller change — just remove the Replit env var checks.
> Option (b) is a larger change but eliminates 500+ lines of custom build logic. It would also require updating `server/index.ts` to serve the different output directory structure that `npx expo export` produces.

**Changes (option a — minimal):**
- Remove `REPLIT_INTERNAL_APP_DOMAIN` and `REPLIT_DEV_DOMAIN` from `getDeploymentDomain()`
- Require `EXPO_PUBLIC_DOMAIN` to be set; fail with a clear error if missing

**Changes (option b — replace):**
- Delete `scripts/build.js`
- Replace `expo:static:build` script with `npx expo export --platform all --output-dir static-build`
- Update `server/index.ts` manifest/static serving to match the `npx expo export` output structure

**Verification:** `npm run expo:static:build` completes successfully and the `static-build/` directory contains valid bundles.

> **STOP.** Confirm with the user before proceeding. Next step: add persistent session storage.

---

## Step 5: Add Persistent Session Storage (`server/routes.ts`)

The current session config (lines 22-33) uses the default in-memory store. Sessions are lost on every server restart.

**Changes:**
- Install `connect-pg-simple`
- Configure express-session to use the Postgres-backed store, reusing the existing `DATABASE_URL` connection
- Remove the hardcoded fallback secret `"ironlog-secret-key-change-in-production"` — require `SESSION_SECRET` to be set in production

**Verification:** Log in, restart the server, and confirm the session persists (the `/api/auth/me` endpoint still returns the user).

> **STOP.** Confirm with the user before proceeding. Next step: create Docker Compose and deployment config.

---

## Step 6: Create Docker Compose and Deployment Config

**USER INPUT REQUIRED:** The implementer must ask the user:
> 1. What is your production domain? (e.g., `ironlog.yourdomain.com`) — needed for `EXPO_PUBLIC_DOMAIN` and `ALLOWED_ORIGINS`.
> 2. Do you have existing data in a Replit-hosted database that needs to be migrated? If yes, you'll need to `pg_dump` it from Replit before their database is no longer accessible.

**Changes:**
- Create a `docker-compose.yml` with two services:
  - `db`: PostgreSQL 16 with a named volume for data persistence, healthcheck, and a `DB_PASSWORD` env var
  - `app`: The Node.js server, built from a `Dockerfile`, depends on `db`, reads env from `.env`
- Create a `Dockerfile`:
  - Base: `node:22-slim`
  - Install deps, build frontend, build backend
  - Expose port 5000
  - `CMD ["npm", "run", "server:prod"]`
- Create `.dockerignore` to exclude `node_modules`, `.git`, `static-build`, etc.
- Create `.env.example`:
  ```
  DB_PASSWORD=<strong-random-password>
  DATABASE_URL=postgresql://ironlog:${DB_PASSWORD}@db:5432/ironlog
  SESSION_SECRET=<random-64-char-string>
  NODE_ENV=production
  PORT=5000
  EXPO_PUBLIC_DOMAIN=ironlog.yourdomain.com
  ALLOWED_ORIGINS=https://ironlog.yourdomain.com
  ```
- Add `.env` to `.gitignore`

**Verification:** `docker compose up --build` starts both containers. The app connects to Postgres. `npm run db:push` creates the schema. Auth endpoints work.

> **STOP.** Confirm with the user before proceeding. Next step: set up Cloudflare Tunnel for HTTPS access.

---

## Step 7: Set Up Cloudflare Tunnel

Cloudflare Tunnel exposes the app on the Mac Mini to the internet over HTTPS without opening any ports on your router.

**Prerequisites:** A Cloudflare account and a domain managed by Cloudflare DNS.

**Steps:**
1. Install `cloudflared` on the Mac Mini (`brew install cloudflared`)
2. Authenticate: `cloudflared tunnel login`
3. Create a tunnel: `cloudflared tunnel create ironlog`
4. Configure the tunnel to route traffic to `http://localhost:5000`
5. Add a DNS CNAME record pointing your subdomain to the tunnel
6. (Optional) Add `cloudflared` as a service in `docker-compose.yml` or run it as a macOS launch daemon for auto-start on boot

**Session cookie consideration:** Cloudflare terminates TLS, so the Express server sees HTTP. The existing `x-forwarded-proto` header handling in `server/index.ts` already covers this. Ensure `trust proxy` is set on the Express app so `secure: true` cookies work behind the tunnel.

**Verification:** `https://ironlog.yourdomain.com` loads the landing page. Login/signup works. Session cookies persist across refreshes. App is accessible from your phone over the internet.

> **STOP.** Confirm with the user before proceeding. Next step: final cleanup.

---

## Step 8: Final Cleanup

- Delete `attached_assets/` if it contains only Replit-generated content (confirm with user first)
- Rename `my-app` in `package.json` to `ironlog`
- Update or replace `design_guidelines.md` if it contains Replit-specific references
- Verify no remaining references to Replit exist in the codebase (`grep -r "replit\|REPLIT" --include="*.ts" --include="*.js" --include="*.json"`)
- Run full `docker compose up --build` and verify end-to-end

**Verification:** Clean `grep` for Replit references. Full build succeeds. App works in production via Cloudflare Tunnel.

> **DONE.** The application is fully decoupled from Replit and running on your Mac Mini.

---

## Summary of User Decisions Required

| Step | Decision |
|------|----------|
| 4 | Simplify existing build script vs. replace with `npx expo export` |
| 6 | Production domain name; whether data migration from Replit is needed |

## Environment Variables (Final State)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DB_PASSWORD` | Yes | PostgreSQL password (used by both `db` and `app` services) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session encryption (no fallback in production) |
| `NODE_ENV` | Yes | `production` or `development` |
| `PORT` | No | Server port (default: 5000) |
| `EXPO_PUBLIC_DOMAIN` | Yes | Public domain for the app (used by client and build script) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated allowed CORS origins |
