@echo off
echo =====================================
echo        Build Script
echo =====================================
echo.

echo Dosyalar www klasörüne kopyalanıyor...

:: Ana dosyalar
copy "index.html" "www\" >nul 2>&1
copy "style.css" "www\" >nul 2>&1
copy "app.js" "www\" >nul 2>&1
copy "manifest.json" "www\" >nul 2>&1
copy "service-worker.js" "www\" >nul 2>&1

:: HTML sayfaları
copy "about.html" "www\" >nul 2>&1
copy "contact.html" "www\" >nul 2>&1
copy "login.html" "www\" >nul 2>&1
copy "privacy-policy.html" "www\" >nul 2>&1
copy "security-policy.html" "www\" >nul 2>&1
copy "terms-of-service.html" "www\" >nul 2>&1
copy "test.html" "www\" >nul 2>&1
copy "splash-demo.html" "www\" >nul 2>&1
copy "splash-screen.html" "www\" >nul 2>&1
copy "splash-screen.css" "www\" >nul 2>&1
copy "splash-screen.js" "www\" >nul 2>&1

:: SVG ve icon dosyalar
copy "icon.svg" "www\" >nul 2>&1
copy "android_app_icon.svg" "www\" >nul 2>&1
copy "android_splash_screen.svg" "www\" >nul 2>&1

:: Assets klasörü
if exist "assets\" (
    echo Assets klasörü kopyalanıyor...
    xcopy "assets\" "www\assets\" /E /Y >nul 2>&1
)

echo.
echo Build işlemi tamamlandı!
echo Dosyalar www klasöründe hazır.
pause
