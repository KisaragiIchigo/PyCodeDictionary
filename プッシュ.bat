@echo off
chcp 932 >nul
title CodeDictionary Studio - Git Push
echo ========================================================
echo   CodeDictionary Studio - GitHub Push Script
echo ========================================================
echo.
echo Git push を実行しています...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] プッシュ中にエラーが発生しました。
    pause
    exit /b %errorlevel%
)
echo.
echo [SUCCESS] GitHubへのプッシュが完了しました！
pause