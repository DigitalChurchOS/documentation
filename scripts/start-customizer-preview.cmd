@echo off
title ChurchOS Customizer Preview
cd /d "%~dp0.."

echo [1/2] Building Theme Customizer React App...
cd apps\theme-customizer
call npm run build
if %errorlevel% neq 0 (
  echo Error building theme customizer app.
  pause
  exit /b %errorlevel%
)
cd ..\..

echo [2/2] Launching Local Preview Server...
echo Customizer will be available at http://localhost:3000/customizer/
"C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\local-preview.js
pause
