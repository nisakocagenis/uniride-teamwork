@echo off
echo ============================================
echo   UniRide - Bagimliliklar Yukleniyor...
echo ============================================
echo.

echo [1/5] User Service...
cd backend\user-service
npm install
cd ..\..

echo.
echo [2/5] Vehicle Service...
cd backend\vehicle-service
npm install
cd ..\..

echo.
echo [3/5] Payment Service...
cd backend\payment-service
npm install
cd ..\..

echo.
echo [4/5] Reservation Service...
cd backend\reservation-service
npm install
cd ..\..

echo.
echo [5/5] Frontend (React)...
cd frontend
npm install
cd ..

echo.
echo ============================================
echo   Kurulum tamamlandi! start.bat calistirin.
echo ============================================
pause
