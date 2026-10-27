@echo off

cd /d "C:\laragon\www\hospital-ecg-system\backend"

start "Hospital ECG Server" cmd /k "node server.js"

timeout /t 4 /nobreak >nul

start "" "http://localhost:5000"