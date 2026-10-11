@echo off
echo Останавливаю процесс на порту 8080...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)
echo Готово.
