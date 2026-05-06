@echo off
echo ============================================
echo   UniRide - Servisler Baslatiliyor...
echo ============================================
echo.
echo  Port 3001 - User Service
echo  Port 3002 - Vehicle Service
echo  Port 3003 - Reservation Service
echo  Port 3004 - Payment Service
echo  Port 3000 - Frontend (React)
echo.

start "User Service" cmd /k "cd /d "%~dp0backend\user-service" && node index.js"
timeout /t 1 /nobreak >nul

start "Vehicle Service" cmd /k "cd /d "%~dp0backend\vehicle-service" && node index.js"
timeout /t 1 /nobreak >nul

start "Payment Service" cmd /k "cd /d "%~dp0backend\payment-service" && node index.js"
timeout /t 1 /nobreak >nul

start "Reservation Service" cmd /k "cd /d "%~dp0backend\reservation-service" && node index.js"
timeout /t 2 /nobreak >nul

start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo Tum servisler baslatildi!
echo Tarayicinizda http://localhost:3000 adresine gidin.
echo.
pause
