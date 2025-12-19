@echo off
cls
echo =====================================
echo       Hizli Deploy Script
echo =====================================
echo.

echo [BUILD] Dosyalar guncelleniyor...
copy "*.html" "www\" >nul 2>&1
copy "*.css" "www\" >nul 2>&1
copy "*.js" "www\" >nul 2>&1
copy "*.json" "www\" >nul 2>&1
copy "*.svg" "www\" >nul 2>&1

if exist "assets\" (
    xcopy "assets\" "www\assets\" /E /Y /Q >nul 2>&1
)

echo ✓ Build tamam
echo.

echo [DEPLOY] Netlify'a deploy ediliyor...
netlify deploy --prod --dir www --message "Auto deploy from script"

echo.
echo Deploy tamamlandi!
echo Site: https://patlat.netlify.app
pause
