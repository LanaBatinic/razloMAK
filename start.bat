@echo off
cd /d "%~dp0"
echo razloMAK — pokretanje na http://localhost:8080
echo Za zaustavljanje pritisni Ctrl+C
python -m http.server 8080
