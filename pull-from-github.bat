@echo off
chcp 65001 >nul
title Fayzar Computer - GitHub Auto Pull Update
echo =====================================================================
echo  [Fayzar Computer] Pulling Latest Website Updates from GitHub...
echo =====================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pull-from-github.ps1"
echo.
pause
