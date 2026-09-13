@echo off
chcp 65001 >nul
title Fayzar Computer - GitHub Auto Sync Push
echo =====================================================================
echo  [Fayzar Computer] Syncing / Uploading Website Updates to GitHub...
echo =====================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-to-github.ps1"
echo.
pause
