@echo off
chcp 65001 > nul
title Upload Converter to GitHub New Repository
echo ================================================================
echo   FAYZAR BANGLA CONVERTER - GITHUB UPLOADER (100+ FILES)
echo ================================================================
echo.
set /p REPO_NAME="টার্গেট রিপোজিটরির নাম দিন (ডিফল্ট: Fayzar-Convater): "
if "%REPO_NAME%"=="" set REPO_NAME=Fayzar-Convater

echo.
echo লক্ষ্য রিপোজিটরি: %REPO_NAME%
echo আপলোড শুরু হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন...
echo.

python "C:\Users\Admin\.gemini\antigravity-ide\scratch\scripts\upload_to_github_new_repo.py" "%REPO_NAME%"

echo.
echo ================================================================
pause
