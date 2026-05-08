@echo off
REM Install dependencies
cd /d c:\Users\bhenn\workspace\zapfacil
echo Installing dependencies...
call node_modules\.bin\npm install --legacy-peer-deps
echo Done!
pause
