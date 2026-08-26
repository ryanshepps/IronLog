---
name: ironlog-ios-testing
description: Launch and test IronLog on a local iOS Simulator, including demo login, screenshots, and runtime diagnostics.
---

# IronLog iOS Testing

1. Select an available iPhone UDID with `xcrun simctl`, then boot it.
2. Load `.env`, map `SUPABASE_URL` to `EXPO_PUBLIC_SUPABASE_URL` when needed, and keep `pnpm exec expo run:ios --device <udid>` running for Metro output.
3. Use the `computer-use` skill on Simulator for interaction. For demo login, read `.demo-account.local` without printing it; stop if absent.
4. Create `.artifacts`, capture the exact device with `xcrun simctl io <udid> screenshot "$PWD/.artifacts/<name>.png"`, and inspect it.
5. For native failures, inspect `xcrun simctl spawn <udid> log show --last 5m --predicate 'process == "IronLog"'`.

Never expose credentials or claim a screen/state without observing it.
