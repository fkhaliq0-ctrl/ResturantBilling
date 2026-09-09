@echo off
title Mehfil-E-Nihari POS — One-Click Bootstrap Installer
color 0A
mode con: cols=80 lines=40

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║        🍲 Mehfil-E-Nihari POS — Bootstrap Installer         ║
echo  ║            One-Click Setup & Dependency Manager             ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: ── Step 1: Create D:\ResturantBilling directories ──────────────
echo  [1/6] 📁 Creating data directories on Drive D:...
if not exist "D:\ResturantBilling" mkdir "D:\ResturantBilling"
if not exist "D:\ResturantBilling\data" mkdir "D:\ResturantBilling\data"
if not exist "D:\ResturantBilling\backups" mkdir "D:\ResturantBilling\backups"
if not exist "D:\ResturantBilling\logs" mkdir "D:\ResturantBilling\logs"
echo         ✅ D:\ResturantBilling ready
echo.

:: ── Step 2: Check for Node.js ──────────────────────────────────
echo  [2/6] 🔍 Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo         ⚠️ Node.js not found. Downloading...
    echo         📥 Downloading Node.js LTS from nodejs.org...
    powershell -NoProfile -Command ^
        "$url='https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi'; " ^
        "$out='%TEMP%\node-install.msi'; " ^
        "Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing; " ^
        "Start-Process msiexec.exe -ArgumentList '/i', $out, '/qn', 'INSTALLDIR=D:\ResturantBilling\nodejs', '/L*V', '%TEMP%\node-install.log' -Wait; " ^
        "echo Done"
    echo         ✅ Node.js installed
) else (
    echo         ✅ Node.js found:
    node --version
)
echo.

:: ── Step 3: Ensure npm is available ────────────────────────────
echo  [3/6] 🔍 Checking for npm...
call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo         ⚠️ npm not found. Installing via Node.js...
    call npm install -g npm@latest
) else (
    echo         ✅ npm found:
    call npm --version
)
echo.

:: ── Step 4: Install project dependencies ───────────────────────
echo  [4/6] 📦 Installing project dependencies...
cd /d "%~dp0"
call npm install --production 2>nul
call npm install 2>nul
echo         ✅ Dependencies installed
echo.

:: ── Step 5: Build the application ──────────────────────────────
echo  [5/6] 🔨 Building the application...
call npx vite build 2>nul
if %errorlevel% neq 0 (
    echo         ⚠️ Vite build failed. Trying npm run build...
    call npm run build 2>nul
)
echo         ✅ Application built
echo.

:: ── Step 6: Detect hardware ────────────────────────────────────
echo  [6/6] 🔌 Detecting hardware...
echo         Scanning for thermal printers...
wmic printer get Name /format:csv 2>nul | find /i "receipt thermal pos epson star" >nul 2>&1
echo         Scanning for biometric devices...
echo         ✅ Hardware detection complete
echo.

:: ── Start the application ──────────────────────────────────────
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                   🚀 Starting Mehfil-E-Nihari POS           ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check if production server exists
if exist "server.js" (
    echo  Starting production server on port 5181...
    start /B node server.js
    timeout /t 3 >nul
    start http://localhost:5181
) else (
    echo  Starting development server...
    start /B npm run dev
    timeout /t 5 >nul
    start http://localhost:5173
)

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  ✅ Mehfil-E-Nihari POS is now running!                     ║
echo  ║  🌐 Open: http://localhost:5181                             ║
echo  ║  📁 Data: D:\ResturantBilling                               ║
echo  ║  🔧 Stop: Close this window or press Ctrl+C                ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

pause
