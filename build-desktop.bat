@echo off
title Mehfil-E-Nihari POS — Desktop Build
echo.
echo  🍲 Building Mehfil-E-Nihari POS Desktop App...
echo.

cd /d "%~dp0"

echo  [1/4] Converting logo to ICO...
node scripts/convert-mm-icon.mjs
if %errorlevel% neq 0 (
    echo  ⚠️ Icon conversion failed, using existing logo.ico
)

echo  [2/4] Building Vite app...
call npx vite build
if %errorlevel% neq 0 (
    echo  ❌ Vite build failed!
    pause
    exit /b 1
)

echo  [3/4] Building Electron executable...
call npx electron-builder --win --config electron-builder.json
if %errorlevel% neq 0 (
    echo  ❌ Electron build failed!
    pause
    exit /b 1
)

echo  [4/4] Done!
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  ✅ Build Complete!                                         ║
echo  ║  📦 Installer: release\Mehfil-E-Nihari-POS-*-Setup.exe     ║
echo  ║  🚀 Portable: release\win-unpacked\Mehfil-E-Nihari POS.exe ║
echo  ║  📁 Icon: assets\mm.ico                                     ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

pause
