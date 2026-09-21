@echo off
title Fayzar Converter Standalone Server
cd /d "%~dp0"

echo Starting Fayzar Converter Offline Server on Port 3008...
start "" http://localhost:3008/
node serve.js
pause
