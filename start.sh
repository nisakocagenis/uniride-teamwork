#!/bin/bash
echo "============================================"
echo "  UniRide - Servisler Baslatiliyor..."
echo "============================================"
echo ""
echo " Port 3001 - User Service"
echo " Port 3002 - Vehicle Service"
echo " Port 3003 - Reservation Service"
echo " Port 3004 - Payment Service"
echo " Port 3000 - Frontend (React)"
echo ""

cd "$(dirname "$0")"

osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/backend/user-service\" && node index.js"' 2>/dev/null || \
  (cd backend/user-service && node index.js &)

sleep 1

osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/backend/vehicle-service\" && node index.js"' 2>/dev/null || \
  (cd backend/vehicle-service && node index.js &)

sleep 1

osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/backend/payment-service\" && node index.js"' 2>/dev/null || \
  (cd backend/payment-service && node index.js &)

sleep 1

osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/backend/reservation-service\" && node index.js"' 2>/dev/null || \
  (cd backend/reservation-service && node index.js &)

sleep 2

osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/frontend\" && npm start"' 2>/dev/null || \
  (cd frontend && npm start &)

echo ""
echo "Tum servisler baslatildi!"
echo "Tarayicinizda http://localhost:3000 adresine gidin."
