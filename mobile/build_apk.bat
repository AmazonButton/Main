@echo off
chcp 65001 > nul
echo ========================================================
echo       DONG GOI FILE APK CHO SMART ORDER FLUTTER
echo ========================================================
echo.

set "FLUTTER_CMD=flutter"

where flutter >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\flutter\bin\flutter.bat" (
        set "FLUTTER_CMD=C:\flutter\bin\flutter.bat"
    ) else (
        echo [!] Chua tim thay Flutter SDK tren may cua ban.
        echo [i] Thu muc PATH cua ban da co san "C:\flutter\bin".
        echo.
        set /p install="Ban co muon tu dong tai Flutter vao C:\flutter khong? (Y/N, mac dinh Y): "
        if /i "%install%"=="N" (
            echo Ban co the tai Flutter thu cong tai: https://docs.flutter.dev/get-started/install/windows
            pause
            exit /b 1
        )
        echo [*] Dang tai Flutter SDK ve C:\flutter (khoang 2-3 phut)...
        git clone --depth 1 -b stable https://github.com/flutter/flutter.git C:\flutter
        if %errorlevel% neq 0 (
            echo [X] Tai Flutter that bai. Vui long kiem tra ket noi mang.
            pause
            exit /b 1
        )
        set "FLUTTER_CMD=C:\flutter\bin\flutter.bat"
    )
)

echo.
echo [*] Buoc 1: Kiem tra va tao thu muc Android...
cd /d "%~dp0"
call %FLUTTER_CMD% create . --platforms=android --org=com.smartorder

echo.
echo [*] Buoc 2: Cai dat thu vien dependencies...
call %FLUTTER_CMD% pub get

echo.
echo [*] Buoc 3: Dang build file APK...
call %FLUTTER_CMD% build apk --release --no-tree-shake-icons
if %errorlevel% neq 0 (
    echo [i] Release build gap loi RAM, tu dong chuyen sang Debug APK...
    call %FLUTTER_CMD% build apk --debug
)

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    copy "build\app\outputs\flutter-apk\app-release.apk" "..\SmartOrder.apk" > nul
    copy "build\app\outputs\flutter-apk\app-release.apk" "SmartOrder.apk" > nul
    echo.
    echo ========================================================
    echo  [THANH CONG] File APK da duoc tao tai:
    echo  - %~dp0SmartOrder.apk
    echo  - %~dp0..\SmartOrder.apk
    echo ========================================================
    echo Ban co the chep file SmartOrder.apk vao dien thoai de cai dat ngay!
) else if exist "build\app\outputs\flutter-apk\app-debug.apk" (
    copy "build\app\outputs\flutter-apk\app-debug.apk" "..\SmartOrder.apk" > nul
    copy "build\app\outputs\flutter-apk\app-debug.apk" "SmartOrder.apk" > nul
    echo.
    echo ========================================================
    echo  [THANH CONG] File APK da duoc tao tai:
    echo  - %~dp0SmartOrder.apk
    echo  - %~dp0..\SmartOrder.apk
    echo ========================================================
    echo Ban co the chep file SmartOrder.apk vao dien thoai de cai dat ngay!
) else (
    echo.
    echo [!] Khong tim thay file APK dau ra. Vui long kiem tra log build o tren.
)

pause
