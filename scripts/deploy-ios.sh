#!/usr/bin/env bash
set -euo pipefail

echo "Building iOS IPA locally..."
pnpm eas build --platform ios --profile production --local

IPA_FILE=$(ls -t build-*.ipa 2>/dev/null | head -1)

if [[ -z "$IPA_FILE" ]]; then
  echo "Error: No .ipa file found after build"
  exit 1
fi

echo "Submitting $IPA_FILE to TestFlight..."
pnpm eas submit --platform ios --path "$IPA_FILE"

echo "Done! Check App Store Connect for build status."
