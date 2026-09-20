@echo off
title Fayzar Computer - Homepage Redesign
echo ========================================================
echo   Fayzar Computer & Photostat - Homepage Redesign
echo   Offline Server starting on http://localhost:3005/
echo ========================================================
start "" "http://localhost:3005/"
node serve.js
pause
