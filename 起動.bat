@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===================================================
echo   CodeDictionary Studio - Starting Dev Server...
echo ===================================================
echo.

if not exist "node_modules\" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b !errorlevel!
    )
)

echo [INFO] Starting Vite development server...
echo [INFO] Opening browser at http://localhost:5173 ...
echo.

start "" http://localhost:5173
call npm run dev

pause