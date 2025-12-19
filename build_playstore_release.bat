@echo off
echo ========================================
echo 🚀 PLAY STORE RELEASE BUILD v1.2.6
echo ========================================
echo.
echo ✅ KONTROL LISTESI:
echo [✓] AdMob App ID: ca-app-pub-7610338885240453~4318740068
echo [✓] Interstitial ID: ca-app-pub-7610338885240453/1658037266
echo [✓] App Open ID: ca-app-pub-7610338885240453/5429761317
echo [✓] Version Code: 14
echo [✓] Version Name: 1.2.6
echo [✓] CANLI reklamlar aktif
echo [✓] Google Play Services SDK: 23.5.0
echo.
echo 🎯 YENI OZELLIKLER v1.2.6:
echo • AdMob App ID düzeltildi (canlı reklamlar aktif)
echo • App Open Ads (uygulama açılış reklamları) eklendi
echo • Interstitial Ads (seviye arası reklamlar) optimize edildi
echo • Her 3 oyunda bir reklam
echo • Her 5 seviyede bir reklam  
echo • 2 dakika minimum reklam arali
echo • Akilli reklam yonetimi
echo.
pause

echo.
echo 1️⃣ Android projesini temizleniyor...
cd android
call gradlew clean
if errorlevel 1 (
    echo ❌ HATA: Android projesi temizlenemedi!
    pause
    exit /b 1
)

echo.
echo 2️⃣ Capacitor sync yapiliyor...
cd ..
call npx cap sync android
if errorlevel 1 (
    echo ❌ HATA: Capacitor sync basarisiz!
    pause
    exit /b 1
)

echo.
echo 3️⃣ PLAY STORE RELEASE BUILD yapiliyor...
cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo ❌ HATA: Release build basarisiz!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 PLAY STORE RELEASE HAZIR!
echo ========================================
echo.
echo 📱 APK Konumu: android\app\build\outputs\apk\release\app-release.apk
echo 📦 AAB Konumu: android\app\build\outputs\bundle\release\app-release.aab
echo.
echo 🚀 PLAY STORE YUKLEME ADIMLARI:
echo 1. Google Play Console'a gidin
echo 2. Uygulama -> Uretim secin
echo 3. Yeni surum olustur butonuna tiklayin
echo 4. app-release.aab dosyasini yukleyin
echo 5. Surum notlarini ekleyin:
echo    "Reklam optimizasyonu: yeniden yükleme ve resume App-Open Ads"
echo 6. Incelemeye gonderin
echo.
echo 💰 GELIR TAKIBI:
echo • AdMob Dashboard: https://apps.admob.com
echo • Play Console: Gelir raporlari
echo.
echo ✅ Build basariyla tamamlandi - Play Store'a yuklemeye hazir!
pause
