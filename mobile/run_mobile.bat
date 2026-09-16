@echo off
chcp 65001 > nul
echo ========================================================
echo       SMART ORDER BUTTON - FLUTTER MOBILE APP
echo ========================================================
echo.

set "FLUTTER_CMD=flutter"
where flutter >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\flutter\bin\flutter.bat" (
        set "FLUTTER_CMD=C:\flutter\bin\flutter.bat"
    ) else (
        echo [!] Khong tim thay lenh 'flutter' trong PATH.
        echo [i] Vui long them C:\flutter\bin vao bien moi truong PATH hoac cai dat vao C:\flutter.
        echo.
        pause
        exit /b 1
    )
)

echo [*] Dang kiem tra dependencies...
call %FLUTTER_CMD% pub get

echo.
echo Chon nen tang muon chay:
echo   1. Trinh duyet Web (Chrome) - Chay nhanh nhat, khong can gia lap
echo   2. May ao / Thiet bi Android
echo   3. Windows Desktop
echo.
set /p choice="Nhap lua chon (1/2/3, mac dinh la 1): "

if "%choice%"=="2" (
    echo [*] Dang khoi dong tren Android...
    call %FLUTTER_CMD% run -d android
) else if "%choice%"=="3" (
    echo [*] Dang khoi dong tren Windows...
    call %FLUTTER_CMD% run -d windows
) else (
    echo [*] Dang khoi dong tren Web Chrome...
    call %FLUTTER_CMD% run -d chrome
)

pause
