@echo off
echo AdMob entegreli Android build baslatiliyor...

echo.
echo 1. Android projesini temizleniyor...
cd android
call gradlew clean
if errorlevel 1 (
    echo Hata: Android projesi temizlenemedi!
    pause
    exit /b 1
)

echo.
echo 2. Capacitor sync yapiliyor...
cd ..
call npx cap sync android
if errorlevel 1 (
    echo Hata: Capacitor sync basarisiz!
    pause
    exit /b 1
)

echo.
echo 3. Android build yapiliyor...
cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo Hata: Android build basarisiz!
    pause
    exit /b 1
)

echo.
echo ✅ Build basariyla tamamlandi!
echo APK dosyasi: android\app\build\outputs\apk\release\app-release.apk
echo.
echo Android Studio'da acmak icin: npx cap open android
pause
