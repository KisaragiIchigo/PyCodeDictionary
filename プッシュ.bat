@echo off
cd /d "%~dp0"

echo ===================================================
echo   CodeDictionary Studio - Push to GitHub
echo ===================================================
echo.
echo Pushing to origin main...
echo.

git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo  SUCCESS: Push completed successfully!
    echo ===================================================
) else (
    echo.
    echo ERROR: Push failed. Please check authentication.
)

echo.
pause
