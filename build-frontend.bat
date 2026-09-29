@echo off
cd /d "%~dp0seishin-app"
call npm run build
if errorlevel 1 exit /b 1
echo.
echo Frontend собран в seishin-backend\src\main\resources\static
cd /d "%~dp0seishin-backend"
call gradlew.bat processResources
if errorlevel 1 exit /b 1
echo Статика скопирована в build\resources\main\static
