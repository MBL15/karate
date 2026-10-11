@echo off
cd /d "%~dp0"
echo.
echo === Karate Hub: сборка и запуск ===
echo.

call stop.bat
echo.
call build-frontend.bat
if errorlevel 1 exit /b 1
echo.
echo Запуск сервера...
cd seishin-backend
start "Karate Hub" cmd /k gradlew.bat bootRun -x buildFrontend
echo.
echo   http://localhost:8080       — главная
echo   http://localhost:8080/app   — дневник родителя
echo   http://localhost:8080/login — вход
echo.
echo   UI с hot-reload: dev.bat ^(порт 5173^)
echo   После открытия нажмите Ctrl+F5 в браузере
echo.
timeout /t 6 >nul
start http://localhost:8080/login
