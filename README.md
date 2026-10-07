# Karate Hub (Seishin)

Приложение для родителей и тренеров секции каратэ.

## Стек

| Часть | Технологии |
|-------|------------|
| Фронтенд | React 19, TypeScript, Vite, Tailwind CSS v4, React Router |
| Мобильное (APK) | Capacitor 7 — тот же React-код в нативной оболочке |
| Бэкенд | Spring Boot (Java), Gradle |

## Запуск (веб)

```powershell
# Бэкенд
cd seishin-backend
.\gradlew.bat bootRun

# Фронтенд (dev)
cd seishin-app
npm install
npm run dev
```

Откройте http://localhost:5173. Vite проксирует `/api` на порт 8080.

**База знаний проекта:** [docs/PROJECT_KNOWLEDGE.md](docs/PROJECT_KNOWLEDGE.md) (архитектура, модель данных, маршруты, чеклисты).  
Краткие правила для Cursor — `.cursor/rules/`. Список HTTP-методов — [seishin-backend/README.md](seishin-backend/README.md).

## Сборка APK

Подробная инструкция: [seishin-app/MOBILE.md](seishin-app/MOBILE.md)

```powershell
cd seishin-app
npm install
npm run android:apk
```

APK: `seishin-app/android/app/build/outputs/apk/debug/app-debug.apk`

Требуется Android Studio и Android SDK.
