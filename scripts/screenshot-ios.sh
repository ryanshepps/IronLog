#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS screenshots require macOS."
  exit 1
fi

repo_root=$(cd "$(dirname "$0")/.." && pwd)
screenshot_dir="$repo_root/.artifacts/ios-screenshots"
screenshot_path="$screenshot_dir/$(date +%Y%m%d-%H%M%S).png"
device_file="$repo_root/.artifacts/ios-observe/device-id"
mkdir -p "$screenshot_dir"

device_id=booted
if [[ -f "$device_file" ]]; then
  device_id=$(<"$device_file")
fi

xcrun simctl io "$device_id" screenshot "$screenshot_path"
echo "$screenshot_path"
