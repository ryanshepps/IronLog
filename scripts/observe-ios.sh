#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS observation requires macOS."
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun is missing. Install Xcode, then run this command again."
  exit 1
fi

repo_root=$(cd "$(dirname "$0")/.." && pwd)
if [[ -f "$repo_root/.env" ]]; then
  set -a
  source "$repo_root/.env"
  set +a
fi
if [[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" && -n "${SUPABASE_URL:-}" ]]; then
  export EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
fi
if [[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" || -z "${EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env."
  exit 1
fi

run_name=$(date +%Y%m%d-%H%M%S)
artifact_root="$repo_root/.artifacts/ios-observe"
run_dir="$artifact_root/$run_name"
mkdir -p "$run_dir"
ln -sfn "$run_name" "$artifact_root/latest"

device_id=${IOS_SIMULATOR_UDID:-}
if [[ -z "$device_id" ]]; then
  device_id=$(xcrun simctl list devices booted | awk -F '[()]' '/iPhone/{print $2; exit}')
fi
if [[ -z "$device_id" ]]; then
  device_id=$(xcrun simctl list devices available | awk -F '[()]' '/iPhone/{print $2; exit}')
fi
if [[ -z "$device_id" ]]; then
  echo "No available iPhone simulator was found. Install an iOS Simulator runtime in Xcode."
  exit 1
fi

printf '%s\n' "$device_id" >"$artifact_root/device-id"

open -a Simulator
xcrun simctl boot "$device_id" 2>/dev/null || true

xcrun simctl spawn "$device_id" log stream \
  --style compact \
  --level debug \
  --predicate 'process == "Exponent" OR process == "IronLog"' \
  >"$run_dir/simulator.log" 2>&1 &
simulator_log_pid=$!

cleanup() {
  kill "$simulator_log_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Simulator: $device_id"
echo "Metro log: $run_dir/metro.log"
echo "Native log: $run_dir/simulator.log"
echo "Screenshot: pnpm ios:screenshot"

cd "$repo_root"
pnpm exec expo run:ios --device "$device_id" 2>&1 | tee "$run_dir/metro.log"
