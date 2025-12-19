@echo off
echo CANLI AdMob reklamlari ile Android build baslatiliyor...

echo.
echo ⚠️  UYARI: CANLI REKLAMLAR KULLANILIYOR!
echo 📱 Reklam ID: ca-app-pub-7610338852404534/1658037266
echo 🎯 Test degil, gercek reklamlar gosterilecek!
echo.
pause

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
echo 3. CANLI reklamli Android build yapiliyor...
cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo Hata: Android build basarisiz!
    pause
    exit /b 1
)

echo.
echo ✅ CANLI AdMob reklamli build basariyla tamamlandi!
echo 📱 APK dosyasi: android\app\build\outputs\apk\release\app-release.apk
echo.
echo 🎯 ONEMLI NOTLAR:
echo - Gercek reklamlar gosteriliyor (test degil)
echo - Her 3 oyunda bir interstitial reklam
echo - Her 5 seviyede bir interstitial reklam
echo - Minimum 2 dakika reklam arasi
echo.
echo Google Play Store'a yuklemek icin hazir!
pause
