@echo off
chcp 65001 >nul
title Fayzar Computer - Download and Update from GitHub

echo =======================================================
echo     FAYZAR COMPUTER - GITHUB DOWNLOAD & UPDATE
echo =======================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH!
    echo Please ensure Python is installed and added to PATH.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"
python scripts\pull_from_github.py %*

echo.
pause
