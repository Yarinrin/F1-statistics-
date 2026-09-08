#!/usr/bin/env bash
# Installs the APK on a running emulator and opens each screen through its deep
# link, failing if the process dies or anything lands in the crash buffer.
#
# The reader is the screen worth the emulator: it is native-only, so the web
# build substitutes a link-out panel and no browser test ever executes it.
set -uo pipefail

PKG=com.apex.f1archive
APK=${1:?usage: smoke-android.sh <apk> [screenshot-dir]}
SHOTS=${2:-smoke-shots}
FAILED=0

mkdir -p "$SHOTS"
adb install -r -d "$APK"

screen() {
  local name=$1 uri=$2 settle=${3:-7}

  adb logcat -b crash -c >/dev/null 2>&1
  adb shell am force-stop "$PKG"
  if [ "$uri" = "LAUNCHER" ]; then
    adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  else
    adb shell am start -W -a android.intent.action.VIEW -d "$uri" "$PKG" >/dev/null 2>&1
  fi
  sleep "$settle"
  adb exec-out screencap -p > "$SHOTS/$name.png" 2>/dev/null

  if ! adb shell pidof "$PKG" >/dev/null 2>&1; then
    echo "FAIL  $name — the app is no longer running"
    FAILED=1
  fi

  local crash
  crash=$(adb logcat -b crash -d 2>/dev/null | grep -B2 -A25 "$PKG" || true)
  if [ -n "$crash" ]; then
    echo "FAIL  $name — crash reported:"
    echo "$crash" | head -40
    FAILED=1
  fi

  [ "$FAILED" -eq 0 ] && echo "ok    $name"
}

screen 01-home            LAUNCHER
screen 02-reader-drivers  "apex://archive?year=2026&section=drivers" 12
screen 03-reader-ctors    "apex://archive?year=2024&section=constructors" 12
screen 04-seasons         "apex://seasons"
screen 05-season-1954     "apex://season/1954"
screen 06-no-constructors "apex://archive?year=1954&section=constructors"
screen 07-settings        "apex://settings"

if [ "$FAILED" -ne 0 ]; then
  echo
  echo "Smoke test failed — the APK will not be published."
  exit 1
fi
echo
echo "All screens survived."
