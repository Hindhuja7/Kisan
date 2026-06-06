@echo off
echo ============================================
echo  KisanMitra AI - Mobile + Laptop Access
echo ============================================
echo.
echo Starting BACKEND on all network interfaces (port 8001)...
start "Kisan Backend" cmd /k "cd /d %~dp0..\backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak >nul
echo.
echo Starting FRONTEND on all network interfaces (port 3000)...
echo.
echo After start, open on PHONE (same WiFi):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set IP=%%a
  goto :found
)
:found
echo   http://192.168.1.6:3000/login
echo.
echo (Check login page for exact link + QR code)
echo.
cd /d %~dp0..\frontend
npm run dev
