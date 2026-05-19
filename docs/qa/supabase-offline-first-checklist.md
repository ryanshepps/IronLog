# Supabase Offline-First QA Checklist

Run before a TestFlight release that changes auth, storage, queueing, or
Supabase schema.

## Setup

- Install a fresh build.
- Sign up or log in with Supabase Auth.
- Confirm built-in exercises load.
- Confirm `public.profiles` has the signed-in user.

## Active Workout Local-First

- Start a workout online.
- Add an exercise and log a set.
- Force quit and relaunch.
- Expected: current workout is still present before any network-dependent work.

## Airplane Mode

- Enable airplane mode.
- Add a set, edit a set, add a favorite, and update exercise history by logging
  a set.
- Force quit and relaunch while still offline.
- Expected: workout, favorite, and history state remain visible from local
  storage.

## Reconnect

- Disable airplane mode.
- Wait for auth/session restore, then trigger any read that calls
  `flushQueue()` or relaunch the app.
- Expected: queued writes sync to Supabase and remain visible after another
  relaunch.

## Supabase Failure

- Point a debug build at an invalid `EXPO_PUBLIC_SUPABASE_URL`, or temporarily
  block network access.
- Add workout data.
- Expected: local logging does not block, no crash occurs, and the queue
  persists.
- Restore the valid URL/network.
- Expected: queue flushes and remote rows appear.

## Duplicate Retry

- Add a favorite and one exercise history row while offline.
- Reconnect and trigger queue flush twice.
- Expected: Supabase has one `favorites` row for the exercise and one
  `exercise_history` row for the exercise.

## Custom Exercise RPCs

- Create a custom exercise.
- Rename it.
- Expected: exercise list, workout embedded exercise names, and exercise
  history use the new name.
- Call rename again with the same name.
- Expected: no duplicate data and same final state.
- Delete the custom exercise.
- Call delete again.
- Expected: no crash; favorites/history for that custom exercise are absent.

## Security Spot Checks

- Anonymous client cannot read user-owned tables.
- Authenticated user can read built-in exercises.
- Authenticated user cannot mutate built-in exercises.
- Authenticated user cannot read or mutate another user's rows.
