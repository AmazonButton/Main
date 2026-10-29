@echo off
chcp 65001 > nul
echo ========================================================
echo    🚀 DEPLOY SMART ORDER BUTTON IOT PLATFORM (DOCKER)
echo ========================================================
echo.

:: Check Docker CLI
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] May tinh cua ban chua cai dat Docker!
    echo Vui long cai dat Docker Desktop tai: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: Check Docker daemon
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [CANH BAO] Docker Desktop chua duoc bat hoac dang khoi dong!
    echo Vui long mo Docker Desktop truoc khi chay script nay.
    echo.
    echo Dang thu khoi dong Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" 2>nul
    echo Dang cho Docker khoi dong (khoang 15s)...
    timeout /t 15 /nobreak > nul
    docker info >nul 2>nul
    if %errorlevel% neq 0 (
        echo [THONG BAO] Vui long doi Docker Desktop hien icon mau xanh la cay roi chay lai deploy.bat!
        pause
        exit /b 1
    )
)

echo [1/3] Dang dung va don cac container cu neu co...
docker compose down

echo.
echo [2/3] Dang build va khoi dong PostgreSQL, Backend, Frontend...
docker compose up --build -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build hoac khoi dong Docker Compose that bai!
    pause
    exit /b 1
)

echo.
echo [3/3] Kiem tra trang thai cac container:
docker compose ps

echo.
echo ========================================================
echo  ✅ DEPLOY THANH CONG! HE THONG DANG HOAT DONG:
echo ========================================================
echo  🌐 Frontend Portal (Web App):  http://localhost
echo  📡 Backend Cloud API:          http://localhost:5000/api
echo  🐘 PostgreSQL Database:        localhost:5432 (smart_order_db)
echo.
echo  🔑 TAI KHOAN TRUY CAP MAC DINH:
echo  - Super Admin: admin@smartorder.local  / Password123!
echo  - Store Owner: store@smartorder.local  / Password123!
echo  - Customer:    customer@smartorder.local / Password123!
echo.
echo  🛠 LENH QUAN LY:
echo  - Xem log backend:   docker compose logs -f backend
echo  - Xem log tat ca:    docker compose logs -f
echo  - Dung he thong:     docker compose down
echo ========================================================
echo.
pause
