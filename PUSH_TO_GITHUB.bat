@echo off
chcp 65001 >nul
title Fayzar Computer - GitHub Auto Push
cd /d "%~dp0"

echo ===================================================
echo   ফয়জার কম্পিউটার - গিটহাবে আপডেট পুশ ইঞ্জিন
echo ===================================================
echo.

python scripts\push_to_github.py

echo.
pause
