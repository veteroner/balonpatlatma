@echo off
echo =====================================
echo     Netlify Deploy Script
echo =====================================
echo.

:: Netlify CLI kurulu mu kontrol et
echo Netlify CLI kontrol ediliyor...
netlify --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Netlify CLI bulunamadi! Kuruluyor...
    npm install -g netlify-cli
    if %errorlevel% neq 0 (
        echo HATA: Netlify CLI kurulamadi!
        pause
        exit /b 1
    )
)

echo Netlify CLI bulundu!
echo.

:: www klasörüne dosyaları kopyala (build işlemi)
echo Build işlemi başlatılıyor...
echo Ana dosyalar www klasörüne kopyalanıyor...

:: www klasörünü oluştur (yoksa)
if not exist "www\" mkdir "www"

:: Ana HTML/CSS/JS dosyalarını kopyala
echo Copying index.html...
copy "index.html" "www\" >nul 2>&1 && echo ✓ index.html kopyalandı || echo ✗ index.html kopyalanamadı
echo Copying style.css...
copy "style.css" "www\" >nul 2>&1 && echo ✓ style.css kopyalandı || echo ✗ style.css kopyalanamadı
echo Copying app.js...
copy "app.js" "www\" >nul 2>&1 && echo ✓ app.js kopyalandı || echo ✗ app.js kopyalanamadı
copy "manifest.json" "www\" >nul 2>&1
copy "service-worker.js" "www\" >nul 2>&1

:: Diğer sayfaları kopyala
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

:: Icon ve SVG dosyalarını kopyala
copy "icon.svg" "www\" >nul 2>&1
copy "android_app_icon.svg" "www\" >nul 2>&1
copy "android_splash_screen.svg" "www\" >nul 2>&1

:: Assets klasörünü kopyala
echo Copying assets folder...
if exist "assets\" (
    if not exist "www\assets\" mkdir "www\assets"
    xcopy "assets\" "www\assets\" /E /Y >nul 2>&1 && echo ✓ assets klasörü kopyalandı || echo ✗ assets klasörü kopyalanamadı
) else (
    echo ! assets klasörü bulunamadı
)

echo Build işlemi tamamlandı!
echo.

:: Netlify'a login olup olmadığını kontrol et
echo Netlify durumu kontrol ediliyor...
netlify status >nul 2>&1
if %errorlevel% neq 0 (
    echo Netlify'a login gerekli. Tarayıcı açılacak...
    netlify login
    if %errorlevel% neq 0 (
        echo HATA: Netlify login işlemi başarısız!
        pause
        exit /b 1
    )
) else (
    echo ✓ Netlify'a bağlantı başarılı!
)
echo.

:: Site durumunu kontrol et
echo Site durumu kontrol ediliyor...
netlify status | findstr "patlat" >nul 2>&1
if %errorlevel% neq 0 (
    echo Site bağlantısı yapılıyor...
    netlify link --id patlat
    if %errorlevel% neq 0 (
        echo HATA: Site bağlantısı başarısız!
        echo Manuel olarak bağlanmayı deneyin: netlify link
        pause
        exit /b 1
    )
    echo ✓ Site bağlantısı başarılı!
) else (
    echo ✓ Site zaten bağlı (patlat)
)

:: Deploy işlemi
echo.
echo Deploy işlemi başlatılıyor...
echo Hedef: https://app.netlify.com/projects/patlat/deploys
echo.

:: Production deploy
netlify deploy --prod --dir www
if %errorlevel% neq 0 (
    echo HATA: Deploy işlemi başarısız!
    pause
    exit /b 1
)

echo.
echo =====================================
echo      Deploy İşlemi Başarılı!
echo =====================================
echo.
echo Site URL: https://patlat.netlify.app
echo Deploy URL: https://app.netlify.com/projects/patlat/deploys
echo.
echo Deploy işlemi tamamlandı!
pause
