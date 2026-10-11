# Деплой Karate Hub на VPS

## Текущий сервер

| Параметр | Значение |
|----------|----------|
| Имя (панель) | KARATE |
| Публичный IP | **195.209.221.13** |
| ОС | Ubuntu 24.04 LTS |
| SSH-пользователь | `ubuntu` |
| Сайт | http://195.209.221.13 |
| Health | http://195.209.221.13/health → `{"status":"UP"}` |

### SSH

Ключ не хранится в репозитории. На Windows обычно лежит в `Downloads`:

```powershell
ssh -i $env:USERPROFILE\Downloads\privatekey-1147315.pem ubuntu@195.209.221.13
```

При ошибке прав на ключ:

```powershell
icacls "$env:USERPROFILE\Downloads\privatekey-1147315.pem" /inheritance:r /grant:r "$env:USERNAME`:R"
```

## Что установлено на сервере

| Компонент | Путь / сервис |
|-----------|----------------|
| JAR | `/opt/seishin/karate-hub.jar` |
| Конфиг Spring | `/opt/seishin/application-prod.properties` |
| База H2 (файл) | `/var/lib/seishin/data` |
| systemd | `seishin.service` (`systemctl status seishin`) |
| nginx | `/etc/nginx/sites-available/seishin` → прокси `:80` → `127.0.0.1:8080` |

Файлы конфигурации в репозитории: `deploy/application-prod.properties`, `deploy/nginx-seishin.conf`, `deploy/seishin.service`.

CORS для веба: `seishin.cors.allowed-origins=http://195.209.221.13,https://195.209.221.13`. Для Capacitor дополнительно действуют паттерны по умолчанию (`capacitor://localhost`, `https://localhost`).

## Деплой с Windows

Из корня репозитория:

```powershell
cd seishin-app
$env:VITE_API_URL = "http://195.209.221.13"
npm run build

cd ..\seishin-backend
.\gradlew.bat bootJar -x test

cd ..\deploy
.\deploy.ps1
```

Скрипт `deploy.ps1` собирает JAR (если его нет), заливает артефакты по SCP и перезапускает `seishin` + nginx.

> **JAR ~80 МБ:** если `scp` обрывается, на сервере может оказаться битый файл (`Invalid or corrupt jarfile`). Проверка: `ls -lh /opt/seishin/karate-hub.jar` (ожидается ~80M). Повторите загрузку:

```powershell
scp -i $env:USERPROFILE\Downloads\privatekey-1147315.pem -o ServerAliveInterval=30 `
  ..\seishin-backend\build\libs\karate-hub-0.0.1-SNAPSHOT.jar `
  ubuntu@195.209.221.13:/tmp/karate-hub.jar
```

На сервере: `sudo mv /tmp/karate-hub.jar /opt/seishin/karate-hub.jar && sudo systemctl restart seishin`.

## Android (APK)

В `seishin-app/.env.mobile`:

```env
VITE_API_URL=http://195.209.221.13
```

Сборка: `npm run android:apk` → `android/app/build/outputs/apk/debug/app-debug.apk`. Подробнее: `seishin-app/MOBILE.md`.

## Демо-аккаунты

Те же, что локально: `coach` / `coach123`, `parent` / `parent123` (данные на сервере в файловой H2, не сбрасываются при деплое JAR).
