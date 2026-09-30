# Karate Hub — backend

Spring Boot 4 API для Karate Hub: авторизация по SMS/OTP, кабинет тренера, родительский дневник, бейджи, пояса, соревнования и платежи.

## Запуск

```bash
# Windows
gradlew.bat bootRun

# Linux/macOS
./gradlew bootRun
```

Сервер: `http://localhost:8080`  
H2 Console: `http://localhost:8080/h2-console` (JDBC: `jdbc:h2:mem:seishin`, user: `sa`, password пустой)

CORS разрешён для Vite (`http://localhost:*`) и Capacitor (`https://localhost`, `capacitor://localhost`).

## Демо-учётные записи

| Роль    | Телефон        | Имя              |
|---------|----------------|------------------|
| COACH   | +79001112233   | Алексей Орлов    |
| PARENT  | +79004445566   | Родитель Соколов |

OTP-код выводится в **консоль сервера** при запросе (mock SMS).

### Пример входа

```http
POST /api/auth/otp/request
Content-Type: application/json

{"phone":"+79001112233","role":"COACH"}
```

```http
POST /api/auth/otp/verify
Content-Type: application/json

{"phone":"+79001112233","code":"123456","role":"COACH"}
```

Ответ содержит JWT — передавайте в заголовке: `Authorization: Bearer <token>`.

## Демо-данные

- Клуб **Karate Hub**
- Дети: **Михаил Соколов** (9 лет, белый пояс, 72%), **Аня Соколова** (6 лет)
- Соревнование: **Кубок Karate Hub 2026** (12.10.2026)
- Платежи: сентябрь/август 3500 ₽ — PAID, взнос за соревнование 1800 ₽ — PENDING

## API

Базовый путь: `/api`

### Авторизация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/otp/request` | Запрос OTP |
| POST | `/auth/otp/verify` | Проверка OTP → JWT |
| POST | `/auth/invite/link` | Привязка ребёнка по 6-значному коду (PARENT) |

### Тренер

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/coach/dashboard` | Дашборд |
| GET/POST | `/coach/students` | Список / создание учеников |
| GET/POST | `/coach/groups` | Группы |
| POST | `/coach/sessions/attendance/bulk` | Массовая отметка посещаемости |
| POST | `/coach/badges/issue` | Выдача бейджа |
| POST | `/coach/invite-codes` | Генерация invite-кода |
| GET | `/coach/belts` | Лестница поясов клуба |
| GET | `/coach/competitions` | Соревнования |
| POST | `/coach/competitions/{id}/auto-categorize` | Авто-категоризация |
| PATCH | `/coach/competitions/registrations/{id}/category` | Ручная категория |
| GET | `/coach/competitions/{id}/export.xlsx` | Excel-экспорт |

### Родитель

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/parent/children` | Привязанные дети |
| GET | `/parent/children/{id}/home` | Главная ребёнка |
| GET | `/parent/children/{id}/profile` | Профиль |
| GET | `/parent/children/{id}/achievements` | Бейджи и достижения |
| GET | `/parent/children/{id}/history` | История посещений |
| GET | `/parent/children/{id}/payments` | Платежи ребёнка |
| GET | `/parent/competitions` | Соревнования |
| POST | `/parent/competitions/{id}/respond` | RSVP с весом и дисциплиной |
| GET | `/parent/documents` | Шаблоны документов |
| GET | `/parent/documents/{id}` | Скачивание шаблона |

### Платежи

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/payments` | Список (COACH — клуб, PARENT — свои) |
| PATCH | `/payments/{id}` | Обновление статуса (COACH) |
| POST | `/payments/reminders` | Напоминания (mock, COACH) |

## Сборка

```bash
gradlew.bat build
```
