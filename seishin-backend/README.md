# Karate Hub — backend

Spring Boot 4 API для Karate Hub: вход по логину и паролю, кабинет тренера, родительский дневник, бейджи, пояса, соревнования и платежи.

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

| Роль    | Логин    | Пароль     | Имя              |
|---------|----------|------------|------------------|
| COACH   | coach    | coach123   | Алексей Орлов    |
| PARENT  | parent   | parent123  | Родитель Соколов |

### Пример входа

```http
POST /api/auth/login
Content-Type: application/json

{"login":"coach","password":"coach123","role":"COACH"}
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
| POST | `/auth/register` | Регистрация по логину и паролю → JWT |
| POST | `/auth/login` | Вход по логину и паролю → JWT |
| POST | `/auth/invite/lookup` | Проверка кода клуба или кода ученика (PARENT) |
| POST | `/auth/invite/link` | Привязка к существующему ученику по одноразовому коду (PARENT) |

### Тренер

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/coach/dashboard` | Дашборд |
| GET/POST | `/coach/students` | Список / создание учеников |
| POST | `/coach/students/{id}/belt` | Назначить пояс |
| GET/POST | `/coach/groups` | Группы |
| GET | `/coach/groups/{id}/students` | Ученики группы |
| GET | `/coach/sessions/attendance` | Журнал занятия |
| POST | `/coach/sessions/attendance/bulk` | Массовая отметка посещаемости |
| GET | `/coach/badges` | Справочник бейджей |
| POST | `/coach/badges/issue` | Выдача бейджа |
| POST | `/coach/invite-codes` | Код клуба (многоразовый) или одноразовый код ученика |
| GET | `/coach/belts` | Лестница поясов клуба |
| GET/PUT | `/coach/belts/settings` | Режим присвоения поясов (MANUAL / ATTENDANCE / READINESS) |
| PATCH | `/coach/belts/{id}` | Норма занятий на пояс (режим ATTENDANCE) |
| GET/POST | `/coach/schedule` | Слоты расписания |
| DELETE | `/coach/schedule/{id}` | Удалить слот |
| GET | `/coach/classes` | Занятия на диапазон дат |
| POST | `/coach/classes/reminders` | Напоминания о занятии (mock) |
| GET | `/coach/chat/threads` | Список чатов |
| POST | `/coach/chat/groups` | Создать групповой чат |
| GET/POST | `/coach/chat/groups/{id}/messages` | Сообщения группы |
| GET/POST | `/coach/students/{id}/messages` | Личка с родителем ученика |
| GET/POST | `/coach/competitions` | Список / создание |
| GET | `/coach/competitions/{id}` | Карточка |
| POST | `/coach/competitions/{id}/auto-categorize` | Авто-категоризация |
| PATCH | `/coach/competitions/registrations/{id}/category` | Ручная категория |
| GET | `/coach/competitions/{id}/export.xlsx` | Excel-экспорт |

### Родитель

| Метод | Путь | Описание |
|-------|------|----------|
| GET/POST | `/parent/children` | Привязанные дети / добавить ребёнка |
| GET | `/parent/children/{id}/home` | Главная ребёнка |
| POST | `/parent/children/{id}/training-intent` | Отметка «будет / не будет» на ближайшую тренировку |
| GET | `/parent/children/{id}/profile` | Профиль |
| GET | `/parent/children/{id}/achievements` | Бейджи и достижения |
| GET | `/parent/children/{id}/history` | История посещений |
| GET | `/parent/children/{id}/payments` | Платежи ребёнка |
| GET/POST | `/parent/children/{id}/messages` | Личка с тренером |
| GET | `/parent/competitions` | Соревнования |
| POST | `/parent/competitions/{id}/respond` | RSVP с весом и дисциплиной |
| GET | `/parent/documents` | Шаблоны документов |
| GET | `/parent/documents/{id}` | Скачивание шаблона |
| GET | `/parent/chat/threads` | Список чатов |
| GET/POST | `/parent/chat/groups/{id}/messages` | Сообщения группы |

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
