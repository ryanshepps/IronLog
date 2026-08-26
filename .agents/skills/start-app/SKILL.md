---
name: start-app
description: Start IronLog locally in an iOS Simulator and interact with the running app.
---

# Start IronLog

1. Select and boot an available iPhone UDID with `xcrun simctl`.
2. Load `.env`, map `SUPABASE_URL` to `EXPO_PUBLIC_SUPABASE_URL` when needed, and keep `pnpm exec expo run:ios --device <udid>` running for Metro output.
3. Use the `computer-use` skill on Simulator. For demo login, read `.demo-account.local` without printing it; stop if absent.
4. Create `.artifacts`, capture the exact device with `xcrun simctl io <udid> screenshot "$PWD/.artifacts/<name>.png"`, and inspect it.
5. For native failures, inspect `xcrun simctl spawn <udid> log show --last 5m --predicate 'process == "IronLog"'`.

Never expose credentials or claim a screen/state without observing it.
