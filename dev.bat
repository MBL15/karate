@echo off
cd /d "%~dp0"
echo.
echo Karate Hub — режим разработки
echo   Фронтенд: http://localhost:5173  (горячая перезагрузка)
echo   Бэкенд:   http://localhost:8080  (должен быть запущен)
echo.
echo Если бэкенд не запущен — откройте второй терминал и выполните start.bat
echo.
cd seishin-app
npm run dev
