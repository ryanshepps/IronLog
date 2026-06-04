# Auth Launch

IronLog starts from local state first. Network auth validation is authoritative,
but it no longer blocks the first usable screen.

The background auth check starts after local hydration, not because the auth
stack rendered.

## Guarantees

- No loading screen is shown between local auth hydration and network validation.
- Cached auth stores only profile display fields, not Supabase tokens.
- A failed background auth check clears the cached user and returns to auth.

## Launch Flow

```mermaid
flowchart TD
  A[App launch] --> B[Hydrate local startup state]
  B --> C{Cached user?}
  C -- Yes --> D[Show saved app state]
  C -- No --> E[Show auth stack]
  B --> F[Start one background Supabase auth check]
  F --> G{Session and user valid?}
  G -- Yes --> H[Refresh profile cache]
  H --> I[Flush queued writes]
  G -- No --> J[Clear cache and sign out]
  J --> K[Stay on or return to auth stack]
```

## Code Map

- `client/App.tsx` restores navigation state after confirming a cached user.
- `client/contexts/AuthContext.tsx` hydrates the cached user, then validates
  Supabase auth in the background.
- `client/navigation/RootStackNavigator.tsx` chooses the app or auth stack from
  the hydrated local decision.
- `client/lib/auth-cache-core.ts` owns cache parsing and startup route decisions.
