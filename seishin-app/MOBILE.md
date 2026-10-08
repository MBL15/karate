# Karate Hub — Android (APK)

Мобильная сборка использует тот же стек, что и веб-приложение: **React 19 + TypeScript + Vite + Tailwind CSS v4**, упакованный в APK через [Capacitor](https://capacitorjs.com/).

## Требования

1. **Node.js** 20+
2. **Java JDK** 17+ (у вас уже установлен)
3. **Android Studio** с Android SDK (API 34+)
   - При установке отметьте *Android SDK*, *Android SDK Platform*, *Android Virtual Device*
   - Задайте переменную окружения `ANDROID_HOME` (например `C:\Users\<user>\AppData\Local\Android\Sdk`)
   - Или создайте `android/local.properties` из `android/local.properties.example`

> **Путь с кириллицей:** если проект лежит в папке вроде `Новая папка`, в `android/gradle.properties` уже включён `android.overridePathCheck=true`.

## Быстрый старт

```powershell
cd seishin-app
npm install
npm run cap:sync
npm run cap:open
```

В Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

Или из терминала (после установки SDK):

```powershell
npm run android:apk
```

Готовый debug-APK:

```
seishin-app/android/app/build/outputs/apk/debug/app-debug.apk
```

## Подключение к бэкенду

1. Запустите Spring Boot:

```powershell
cd seishin-backend
.\gradlew.bat bootRun
```

2. Скопируйте `env.mobile.example` → `.env.mobile` и настройте URL API:

| Среда | `VITE_API_URL` |
|-------|----------------|
| Эмулятор Android | `http://10.0.2.2:8080` |
| Реальное устройство (Wi‑Fi) | `http://<IP-вашего-ПК>:8080` |
| Продакшен (VPS) | `http://195.209.221.13` |

Текущий VPS и деплой: [deploy/README.md](../deploy/README.md).

3. Пересоберите: `npm run cap:sync`

> HTTP разрешён для разработки (`cleartext: true` в `capacitor.config.ts`). Для релиза используйте HTTPS.

### «Сервер недоступен» на экране входа

1. Убедитесь, что бэкенд запущен (`.\gradlew.bat bootRun` в `seishin-backend`).
2. **Эмулятор:** в `.env.mobile` должен быть `VITE_API_URL=http://10.0.2.2:8080`.
3. **Реальное устройство:** замените на IP вашего ПК в Wi‑Fi, например `http://192.168.1.10:8080`, затем `npm run cap:sync`.
4. Бэкенд уже разрешает CORS для Capacitor (`https://localhost`, `capacitor://localhost`).

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run build:mobile` | Сборка фронтенда в `dist/` |
| `npm run cap:sync` | Сборка + синхронизация с Android-проектом |
| `npm run cap:open` | Открыть проект в Android Studio |
| `npm run android:apk` | Собрать debug APK |
| `npm run android:apk:release` | Собрать release APK (нужна подпись) |

## Структура

- `capacitor.config.ts` — конфиг Capacitor (appId, webDir)
- `vite.config.mobile.ts` — отдельная сборка с `base: './'` для WebView
- `.env.mobile` — переменные для мобильной сборки
- `android/` — нативный Android-проект (генерируется Capacitor)
- `src/hooks/useNativeShell.ts` — status bar, кнопка «Назад»
