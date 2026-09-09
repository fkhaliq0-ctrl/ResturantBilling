@echo off
title Mehfil-E-Nihari POS — Persistent Server
color 0A

echo ══════════════════════════════════════════════════════════
echo    Mehfil-E-Nihari POS — Persistent Dev Server
echo ══════════════════════════════════════════════════════════
echo.
echo  [1] PM2 Mode (Recommended — runs in background)
echo  [2] Watcher Mode (keeps terminal open, shows logs)
echo  [3] Quick Start (single run, no auto-restart)
echo  [4] Stop All Servers
echo  [5] View Server Status
echo.
echo ══════════════════════════════════════════════════════════

set /p choice="Choose mode (1-5): "

if "%choice%"=="1" goto pm2
if "%choice%"=="2" goto watcher
if "%choice%"=="3" goto quick
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto status
goto menu

:pm2
echo.
echo Starting with PM2...
pm2 start ecosystem.config.cjs
pm2 save
echo.
echo Server running at http://localhost:5180
echo Commands: pm2 status | pm2 logs | pm2 stop | pm2 restart
pause
goto end

:watcher
echo.
echo Starting watcher (press Ctrl+C to stop)...
pwsh -ExecutionPolicy Bypass -File scripts\watch-server.ps1
goto end

:quick
echo.
echo Starting Vite dev server...
call npm run dev
goto end

:stop
echo.
echo Stopping all servers...
pm2 stop mehfil-pos 2>nul
pm2 delete mehfil-pos 2>nul
echo Done.
pause
goto end

:status
echo.
pm2 status
echo.
pause
goto end

:menu
echo Invalid choice.
pause

:end
