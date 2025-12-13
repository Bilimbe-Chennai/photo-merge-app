#!/bin/bash

echo "========================================="
echo "       Building APK + AAB (Release)"
echo "========================================="

cd android

echo "Cleaning old builds..."
./gradlew clean

echo "-----------------------------------------"
echo "Building APK..."
./gradlew assembleRelease

echo "-----------------------------------------"
echo "Building AAB..."
./gradlew bundleRelease

echo "========================================="
echo "Build Completed Successfully!"
echo "APK: android/app/build/outputs/apk/release/app-release.apk"
echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo "========================================="

cd ..

echo "Opening output folders..."
open android/app/build/outputs/apk/release/ 2>/dev/null || xdg-open android/app/build/outputs/apk/release/
open android/app/build/outputs/bundle/release/ 2>/dev/null || xdg-open android/app/build/outputs/bundle/release/
