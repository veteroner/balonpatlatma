@echo off
title App Open Ad Test - Balon Patlatma Oyunu
color 0A

echo.
echo ========================================
echo    APP OPEN AD TEST SCRIPT
echo ========================================
echo.

echo [1/4] Capacitor Sync...
cd /d "c:\Users\wet_o\Desktop\balon-patlatma-oyunu"
call npx cap sync android

if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Android Debug Build...
cd android
call gradlew assembleDebug

if %errorlevel% neq 0 (
    echo [ERROR] Android build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Installing APK to Device...
cd app\build\outputs\apk\debug
adb install -r app-debug.apk

if %errorlevel% neq 0 (
    echo [WARNING] ADB install failed - please install manually
) else (
    echo [SUCCESS] APK installed successfully!
)

echo.
echo [4/4] Starting Logcat for Testing...
echo.
echo ========================================
echo    TEST SCENARIOS:
echo ========================================
echo.
echo 1. App Launch Test:
echo    - Close app completely
echo    - Reopen app
echo    - Expected: App Open Ad after splash
echo.  
echo 2. Background/Foreground Test:
echo    - Wait 6 minutes after launch
echo    - Press home button
echo    - Reopen app
echo    - Expected: App Open Ad shown
echo.
echo 3. Interstitial + App Open Test:
echo    - Play game and get 3 game overs
echo    - Expected: Interstitial Ad
echo    - Background/foreground app
echo    - Expected: App Open Ad (if 5min passed)
echo.
echo ========================================
echo    LOGCAT OUTPUT:
echo ========================================
echo.

adb logcat -s "AdMob" "MainActivity" "AdManager" "chromium"

pause
