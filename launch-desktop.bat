@echo off
title Mehfil-E-Nihari POS
echo.
echo  🍲 Starting Mehfil-E-Nihari POS...
echo  📁 Data: D:\ResturantBilling
echo.

cd /d "%~dp0"

if exist "release\win-unpacked\Mehfil-E-Nihari POS.exe" (
    echo  Launching desktop app...
    start "" "release\win-unpacked\Mehfil-E-Nihari POS.exe"
) else if exist "server.js" (
    echo  Starting production server...
    start /B node server.js
    timeout /t 3 >nul
    start http://localhost:5181
) else (
    echo  Starting development server...
    start /B npm run dev
    timeout /t 5 >nul
    start http://localhost:5173
)
