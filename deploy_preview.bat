@echo off
echo =====================================
echo   Netlify Preview Deploy Script
echo =====================================
echo.

:: Build işlemi
echo Build işlemi başlatılıyor...
copy "index.html" "www\" >nul 2>&1
copy "style.css" "www\" >nul 2>&1
copy "app.js" "www\" >nul 2>&1
copy "manifest.json" "www\" >nul 2>&1
copy "service-worker.js" "www\" >nul 2>&1
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
copy "icon.svg" "www\" >nul 2>&1
copy "android_app_icon.svg" "www\" >nul 2>&1
copy "android_splash_screen.svg" "www\" >nul 2>&1

if exist "assets\" (
    xcopy "assets\" "www\assets\" /E /Y >nul 2>&1
)

echo Build tamamlandı!
echo.

:: Preview deploy (production'a gitmez, test için)
echo Preview deploy başlatılıyor...
netlify deploy --dir www

if %errorlevel% neq 0 (
    echo HATA: Preview deploy başarısız!
    pause
    exit /b 1
)

echo.
echo Preview deploy tamamlandı!
echo Yukarıdaki "Website Draft URL" linkini test edebilirsiniz.
echo.
echo Eğer her şey tamam ise, deploy_netlify.bat ile production'a deploy edin.
pause
