@echo off
echo AdMob entegrasyonu test ediliyor...

echo.
echo 1. Capacitor sync yapiliyor...
call npx cap sync android
if errorlevel 1 (
    echo Hata: Capacitor sync basarisiz!
    pause
    exit /b 1
)

echo.
echo 2. Android Studio aciliyor...
call npx cap open android

echo.
echo ✅ Android Studio acildi!
echo.
echo Test adimlari:
echo 1. Android Studio'da projeyi run edin
echo 2. Oyunu oynayip 3 kere game over olun veya 5 seviye gecin
echo 3. AdMob test reklamlarinin goruntulendigini kontrol edin
echo 4. Logcat'te "AdMob interstitial ad shown" mesajini kontrol edin
echo.
echo Test reklam ID'si: ca-app-pub-3940256099942544/1033173712
echo Produksiyon ID'si: ca-app-pub-7610338852404534/1658037266
pause
