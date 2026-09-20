@echo off
chcp 65001 > nul
echo ========================================================
echo    🚀 SMART ORDER BUTTON - KHOI CHAY BACKEND & FRONTEND
echo ========================================================
echo.

echo [1/2] Dang khoi dong Backend (NestJS Server tren cong 5000)...
start "Smart Order - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Dang khoi dong Frontend (React Vite tren cong 5173)...
start "Smart Order - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo ✅ Backend API:  http://localhost:5000/api
echo ✅ Frontend Web: http://localhost:5173
echo ========================================================
echo.
pause
