@echo off
cd /d "%~dp0"
ruby bin/rails test > tmp\test_results.txt 2>&1
type tmp\test_results.txt
pause
