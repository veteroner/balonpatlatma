@echo off
:: Balon Patlatma Oyunu – Yerel Sunucu Başlatıcı
:: Bu betik Python http.server kullanarak oyunu localhost:8000 üzerinde sunar.

set PORT=8000

REM Betik klasörüne geç
cd /d "%~dp0"

echo -----------------------------------------------
echo Balon Patlatma Oyunu Server Başlatılıyor...
echo -----------------------------------------------
echo.
echo Port: %PORT%
echo URL: http://localhost:%PORT%
echo.
echo Server'ı durdurmak için Ctrl+C yapın.
echo -----------------------------------------------
echo.

python -m http.server %PORT%

pause
echo Balon Patlatma Oyunu yerel sunucusu başlatılıyor…
echo Dosya yolu  : %cd%
echo Kullanılan port: %PORT%
echo -----------------------------------------------

REM Önce Node.js/serve deneyelim
where node >nul 2>nul
if %ERRORLEVEL%==0 (
    echo Node.js bulundu. "npx serve" ile başlatılıyor...
    npx --yes serve -l %PORT% .
    goto :END
)

REM Python varsa kullan
where python >nul 2>nul
if %ERRORLEVEL%==0 (
    echo Node.js bulunamadı, Python bulundu. "python -m http.server" ile başlatılıyor...
    python -m http.server %PORT%
    goto :END
)

REM Hiçbiri yoksa kullanıcıya bildir
:NOT_FOUND
echo Node.js veya Python bulunamadı. Lütfen bunlardan birini kurun ya da başka bir HTTP sunucusu kullanın.

:END
echo.
pause 