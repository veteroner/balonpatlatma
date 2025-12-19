@echo off
echo =====================================
echo     Netlify Deploy Script v2
echo =====================================
echo.

:: Build işlemi - dosyaları güncelle
echo [1/3] Build islemi baslatiliyor...
if not exist "www\" mkdir "www"

echo - Ana dosyalar kopyalaniyor...
copy "index.html" "www\" >nul 2>&1
copy "style.css" "www\" >nul 2>&1
copy "app.js" "www\" >nul 2>&1
copy "manifest.json" "www\" >nul 2>&1
copy "service-worker.js" "www\" >nul 2>&1

echo - HTML sayfalari kopyalaniyor...
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

echo - Icon ve SVG dosyalari kopyalaniyor...
copy "icon.svg" "www\" >nul 2>&1
copy "android_app_icon.svg" "www\" >nul 2>&1
copy "android_splash_screen.svg" "www\" >nul 2>&1

echo - Assets klasoru kopyalaniyor...
if exist "assets\" (
    if not exist "www\assets\" mkdir "www\assets"
    xcopy "assets\" "www\assets\" /E /Y /Q >nul 2>&1
)

echo ✓ Build islemi tamamlandi!
echo.

:: Netlify durumu kontrol et
echo [2/3] Netlify durumu kontrol ediliyor...
netlify status >nul 2>&1
if %errorlevel% neq 0 (
    echo ! Netlify login gerekli...
    netlify login
) else (
    echo ✓ Netlify baglantisi OK
)
echo.

:: Deploy işlemi
echo [3/3] Deploy islemi baslatiliyor...
echo Hedef: https://patlat.netlify.app
echo.
netlify deploy --prod --dir www

if %errorlevel% equ 0 (
    echo.
    echo =====================================
    echo       Deploy Basarili!
    echo =====================================
    echo.
    echo Site URL: https://patlat.netlify.app
    echo Deploy Panel: https://app.netlify.com/projects/patlat/deploys
) else (
    echo.
    echo =====================================
    echo       Deploy Hatasi!
    echo =====================================
    echo Lutfen hatayi kontrol edin.
)

echo.
pause
