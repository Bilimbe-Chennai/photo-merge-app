@echo off
echo =========================================
echo        Building APK + AAB (Release)
echo =========================================

cd android

echo Cleaning old builds...
gradlew clean

echo -----------------------------------------
echo Building APK...
gradlew assembleRelease

echo -----------------------------------------
echo Building AAB...
gradlew bundleRelease

echo =========================================
echo Build Completed Successfully!
echo APK: android\app\build\outputs\apk\release\app-release.apk
echo AAB: android\app\build\outputs\bundle\release\app-release.aab
echo =========================================

cd ..

echo Opening output folders...
start "" "android\app\build\outputs\apk\release\"
start "" "android\app\build\outputs\bundle\release\"
