@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===================================================
echo   CodeDictionary Studio - Release Build
echo   (Single Portable EXE ^& Installer EXE)
echo ===================================================
echo.

:: バックグラウンドに残った旧Electronプロセスの安全な終了
taskkill /f /im electron.exe >nul 2>&1
taskkill /f /im "CodeDictionary Studio*.exe" >nul 2>&1

:: ロック防止のための古い一時ディレクトリクリーンアップ
if exist "release\win-unpacked\" rmdir /s /q "release\win-unpacked" >nul 2>&1
if exist "release\win-unpacked.tmp\" rmdir /s /q "release\win-unpacked.tmp" >nul 2>&1

:: Node.js ヒープメモリ上限を8GBに拡張（大規模パッケージング用）
set NODE_OPTIONS=--max-old-space-size=8192

if not exist "node_modules\" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b !errorlevel!
    )
)

echo [INFO] Building TypeScript, Vite bundle and Electron EXE packages...
echo [INFO] Please wait a moment...
call npm run build:exe

if !errorlevel! equ 0 (
    echo.
    echo ===================================================
    echo   [SUCCESS] Build completed successfully!
    echo.
    echo   Output Directory: %~dp0release
    echo   Artifacts:
    echo     1. CodeDictionary Studio-Portable-2.0.0.exe (Standalone)
    echo     2. CodeDictionary Studio-Setup-2.0.0.exe (Installer)
    echo ===================================================
    echo.
    set /p OPEN_DIR="Open release folder now? (y/n): "
    if /i "!OPEN_DIR!"=="y" (
        explorer "%~dp0release"
    )
) else (
    echo.
    echo [ERROR] Build failed with errors.
)

pause