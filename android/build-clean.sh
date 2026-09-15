#!/bin/bash
# Continuous cleanup script for macOS AppleDouble files during Android build

export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home

# Background process to continuously delete ._* files
(
  while true; do
    find /Volumes/LaCie/balon-patlatma-oyunu/android/app/build/intermediates -name '._*' -delete 2>/dev/null
    find /Volumes/LaCie/balon-patlatma-oyunu/android/build/intermediates -name '._*' -delete 2>/dev/null
    find /Volumes/LaCie/balon-patlatma-oyunu/node_modules/@capacitor/*/android/build/intermediates -name '._*' -delete 2>/dev/null
    sleep 0.1
  done
) &
CLEANUP_PID=$!

# Run Gradle build
cd "$(dirname "$0")"
./gradlew assembleDebug "$@"
BUILD_EXIT_CODE=$?

# Stop cleanup
kill $CLEANUP_PID 2>/dev/null

exit $BUILD_EXIT_CODE
