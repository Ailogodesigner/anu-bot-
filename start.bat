@echo off
title Cavrix Cloud Bot ^& Dashboard Runner
echo ==============================================================================
echo  👑 Cavrix Cloud VPS Bot ^& Web Control Panel - Windows 1-Click Startup
echo ==============================================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

if not exist logs (
    mkdir logs
)

if not exist node_modules (
    echo [*] Installing dependencies...
    call npm install
)

echo [*] Syncing database and generating Prisma client...
call npx prisma db push --accept-data-loss

echo [*] Building production bundle...
call npm run build

echo [*] Starting Cavrix Bot ^& Control Panel on http://localhost:3005 ...
call node node_modules\next\dist\bin\next start -p 3005
pause
