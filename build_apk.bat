@echo off
chcp 65001 > nul
cd /d "%~dp0mobile"
call build_apk.bat
