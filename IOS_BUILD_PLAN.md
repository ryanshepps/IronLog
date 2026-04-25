# IronLog: iOS TestFlight Build Plan

Builds IronLog as a native iOS app and distributes it to your iPhone via TestFlight using Expo's EAS CLI. The app connects to the production server at `ironlog.lastingsoftware.ca`. TestFlight builds are valid for 90 days and use a light automated review that typically passes within hours.

---

## Step 1: Prerequisites

Required on your Mac:

- Xcode (latest stable) with Command Line Tools (`xcode-select --install`)
- CocoaPods (`brew install cocoapods`)
- Node.js 22+ and pnpm 9+ (already in `.tool-versions`)
- Apple Developer account signed into Xcode (Xcode > Settings > Accounts)
- EAS CLI (`pnpm add -g eas-cli && eas login`)
- TestFlight app on your iPhone

**Verification:** `xcodebuild -version`, `pod --version`, and `eas whoami` all print without errors.

> **STOP.** Confirm all prerequisites are met. Next step: create the app records.

---

## Step 2: Create App Records

Two app records are needed — one in App Store Connect, one in Expo.

**App Store Connect:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com/) > My Apps > "+" > New App
2. Platform: iOS, Name: IronLog, Bundle ID: `com.ironlog.app`, SKU: `ironlog`

**Expo:**
```
eas init
```

This links the project to your Expo account and writes a project ID into `app.json`.

**Verification:** IronLog appears in App Store Connect. `app.json` contains an `extra.eas.projectId` field.

> **STOP.** Confirm both app records exist. Next step: fix the session cookie.

---

## Step 3: Fix Session Cookie for Native Clients

The session config in `server/routes.ts` does not set `sameSite`. Browsers default to `lax`, which causes cookies to be dropped on requests from a native app. The fix is adding `sameSite: "none"` to the production cookie config (requires `secure: true`, which is already set).

**Changes in `server/routes.ts`:**
- Add `sameSite: "none"` to the session cookie config (production only)

**Verification:** Deploy the change. Login still works at `https://ironlog.lastingsoftware.ca` in a browser.

> **STOP.** Confirm the cookie change is deployed. Next step: configure EAS.

---

## Step 4: Configure EAS

Create `eas.json` at the project root:

```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "image": "latest"
      },
      "env": {
        "EXPO_PUBLIC_DOMAIN": "ironlog.lastingsoftware.ca"
      },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_ASC_APP_ID"
      }
    }
  }
}
```

Replace `YOUR_ASC_APP_ID` with the Apple ID number from App Store Connect (App Information > General Information > Apple ID).

**Verification:** `eas build --platform ios --profile production --local --dry-run` completes without config errors.

> **STOP.** Confirm EAS config is valid. Next step: set up signing credentials.

---

## Step 5: Configure Signing

```
eas credentials --platform ios
```

Select your Apple Developer team and let EAS manage the distribution certificate and provisioning profile. EAS stores these locally and reuses them for future builds.

**Verification:** EAS prints a summary showing a valid distribution certificate and provisioning profile for `com.ironlog.app`.

> **STOP.** Confirm credentials are configured. Next step: build and upload.

---

## Step 6: Build and Upload to TestFlight

```
eas build --platform ios --profile production --local
eas submit --platform ios --latest
```

The first command produces an `.ipa` file locally (prebuild, compile, archive, and export are all handled). The second uploads it to App Store Connect. EAS prompts for an App Store Connect API key on first submit — follow the prompts to create one at [App Store Connect > Users and Access > Integrations](https://appstoreconnect.apple.com/access/integrations/api).

The first build takes several minutes (full native compilation). The upload takes a few minutes, then App Store Connect processing adds ~15 minutes.

**Verification:** The build appears in App Store Connect under IronLog > TestFlight with status "Ready to Test".

> **STOP.** Confirm the build is "Ready to Test". Next step: install on your iPhone.

---

## Step 7: Install and Verify

1. In App Store Connect, go to IronLog > TestFlight > Internal Testing
2. Create a test group (e.g., "Personal"), add yourself as a tester
3. Open TestFlight on your iPhone and install IronLog

Verify the full flow:

1. **Signup/Login** — Create an account or log in
2. **Session persistence** — Kill and reopen the app, confirm still logged in
3. **Log a workout** — Add exercises, sets, complete a workout
4. **History** — Workout appears in History tab
5. **Favorites** — Add/remove a favorite exercise

**If login fails:** The Step 3 cookie fix may not be deployed. Check `https://ironlog.lastingsoftware.ca` in Safari on your phone.

**Verification:** All flows work. Data syncs between web and native.

> **DONE.** IronLog is running on your iPhone via TestFlight.

---

## Pushing Updates

```
eas build --platform ios --profile production --local
eas submit --platform ios --latest
```

Same two commands. `autoIncrement` in `eas.json` handles the build number. TestFlight notifies your phone when the update is available.

If you add a native dependency or upgrade the Expo SDK, run `pnpm expo prebuild --platform ios --clean` before building.

TestFlight builds expire after 90 days — rebuild when notified.

---

## Commands Quick Reference

| Action | Command |
|--------|---------|
| Build IPA locally | `eas build --platform ios --profile production --local` |
| Upload to TestFlight | `eas submit --platform ios --latest` |
| Manage signing | `eas credentials --platform ios` |
| Clean native project | `pnpm expo prebuild --platform ios --clean` |
| Dev server | `EXPO_PUBLIC_DOMAIN=ironlog.lastingsoftware.ca pnpm expo start` |
