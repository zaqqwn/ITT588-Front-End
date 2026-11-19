@echo off
cd /d "%~dp0"
echo Starting SafeSpace Malaysia on http://localhost:3000 ...
ruby bin/rails server -p 3000
pause
