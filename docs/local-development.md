# Local Development

## Prerequisites

- Node 22 (see `.tool-versions`)
- Docker (for PostgreSQL)
- pnpm
- Both your dev machine and iPhone on the same Tailscale tailnet (for mobile testing)

## Start the database

```bash
docker-compose up -d db
```

## Start the backend

```bash
set -a && source .env && set +a && EXPO_PUBLIC_DOMAIN=<tailscale-hostname>:5001 PORT=5001 pnpm run server:dev
```

## Start the Metro bundler

In a separate terminal:

```bash
EXPO_PUBLIC_DOMAIN=<tailscale-hostname>:5001 pnpm expo start --tunnel
```

Scan the QR code with your iPhone camera to open in Expo Go.

## Notes

- macOS uses port 5000 for AirPlay Receiver, so use port 5001 instead.
- Replace `<tailscale-hostname>` with your machine's Tailscale hostname (e.g. `ryans-mac-mini`).
