@echo off
cd /d "%~dp0"
echo Сборка фронтенда...
call build-frontend.bat
if errorlevel 1 exit /b 1
echo.
echo Перезапуск сервера...
call stop.bat
cd seishin-backend
start "SEISHIN Backend" cmd /k gradlew.bat bootRun -x buildFrontend
echo.
echo Готово. Откройте http://localhost:8080 и нажмите Ctrl+F5
timeout /t 3 >nul
