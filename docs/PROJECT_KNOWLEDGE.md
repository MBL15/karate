# База знаний Karate Hub (Seishin)

Документ для разработчиков и агентов: что это за продукт, как устроен репозиторий, где искать код и как не сломать безопасность.

**Краткие правила для Cursor:** `.cursor/rules/project.mdc`, `backend.mdc`, `frontend.mdc`.  
**Список HTTP-методов:** [seishin-backend/README.md](../seishin-backend/README.md).  
**APK:** [seishin-app/MOBILE.md](../seishin-app/MOBILE.md).

---

## 1. Продукт

**Karate Hub** — веб-приложение (и APK через Capacitor) для секции каратэ:

| Роль | Интерфейс | Задачи |
|------|-----------|--------|
| **COACH** | `/coach/*` | Группы, расписание, посещаемость, ученики, бейджи/пояса, соревнования, чаты, платежи |
| **PARENT** | `/app/*` | Дневник ребёнка: дом, профиль, достижения, история, соревнования, документы, чат |

Язык UI — **русский**. Маркетинговые страницы: `/`, `/for-parents`, `/for-coaches`.

---

## 2. Репозиторий

```
karate/
├── seishin-app/          # React 19 + TS + Vite + Tailwind v4 + React Router 7
├── seishin-backend/      # Spring Boot + Gradle, пакет com.seishin
├── docs/                 # документация (этот файл)
└── .cursor/rules/        # правила для ассистента
```

### Сборка и деплой SPA

- `seishin-app`: `npm run build` → статика в `seishin-backend/src/main/resources/static` (`emptyOutDir: true`).
- Spring отдаёт статику; **клиентские маршруты** — через `SpaForwardController` → `index.html`.
- Docker-сборка фронта отдельная; закоммиченный `static/` в образе может игнорироваться.

### Продакшен-сервер (VPS)

| | |
|--|--|
| **URL** | http://195.209.221.13 |
| **IP** | 195.209.221.13 |
| **SSH** | `ubuntu@195.209.221.13` (ключ `privatekey-1147315.pem`, не в git) |
| **Стек** | nginx (:80) → Spring Boot (:8080), unit `seishin` |
| **Данные** | H2 на диске: `/var/lib/seishin/data` |
| **Health** | `GET /health` |

Полная инструкция деплоя, сборки с `VITE_API_URL` и APK: **[deploy/README.md](../deploy/README.md)**.

```powershell
# веб + JAR на сервер
cd seishin-app; $env:VITE_API_URL="http://195.209.221.13"; npm run build
cd ..\seishin-backend; .\gradlew.bat bootJar -x test
cd ..\deploy; .\deploy.ps1
```

Мобильная сборка: `seishin-app/.env.mobile` с тем же `VITE_API_URL`, затем `npm run android:apk`.

### Локальный запуск

| Команда | URL |
|---------|-----|
| `seishin-backend/gradlew.bat bootRun` | http://localhost:8080 |
| `seishin-app/npm run dev` | http://localhost:5173 (прокси `/api` → 8080) |

H2: `/h2-console`, JDBC `jdbc:h2:mem:seishin`, user `sa`, пароль пустой.  
`ddl-auto=update`, данные в памяти — после рестарта только **seed** (`DataSeeder`).

### Демо-аккаунты

| Логин | Пароль | Роль | Имя |
|-------|--------|------|-----|
| coach | coach123 | COACH | Алексей Орлов |
| parent | parent123 | PARENT | Родитель Соколов |

JWT в `localStorage` → ключ **`seishin-auth`**. Заголовок: `Authorization: Bearer <token>`.

---

## 3. Безопасность и доступ

### Spring Security (`SecurityConfig`)

- Stateless JWT, `JwtAuthenticationFilter`.
- Явные матчеры:
  - `/api/auth/**`, `/health`, `/api/info` — публично.
  - `/api/coach/**` — роль **COACH**.
  - `/api/parent/**` — роль **PARENT**.
  - `/api/payments/**` — authenticated; PATCH и reminders — только COACH.
- **`anyRequest().permitAll()`** — всё остальное под `/api` без матчера **публично**. Новые эндпоинты сразу добавлять в матчеры.

### Проверки в сервисах

- **Тренер:** `CoachAccessService` — группа доступна, если пользователь владелец или `GroupAssistant` того же клуба.
- **Родитель:** `ParentAccessService` — ребёнок только через `ParentStudentLink`. Код клуба многоразовый: родитель вводит его и создаёт профиль ребёнка в этом клубе.

### Контроллеры

Дополнительно: `SecurityUtils.requireCoach()` / `requireParent()`.

---

## 4. Модель данных (ядро)

Центр — **`Club`**: тренеры (`User.club`), ученики, группы, пояса, бейджи, соревнования, платежи, шаблоны документов.

### Сущности (`domain/entity`)

| Сущность | Назначение |
|----------|------------|
| `User` | Тренер или родитель (роль) |
| `Student` | Ученик клуба |
| `ParentStudentLink` | Связь родитель ↔ ребёнок |
| `TrainingGroup`, `GroupStudent`, `GroupAssistant` | Группы и состав |
| `ClassSchedule` | Слот расписания (день недели, время) |
| `TrainingSession` | Конкретное занятие |
| `AttendanceRecord` | Отметка: `PRESENT`, `ABSENT`, `MAKEUP`, `GUEST` |
| `BeltLevel`, `StudentBadge`, `BadgeDefinition` | Пояса и награды |
| `Competition`, `CompetitionRegistration` | Турниры, RSVP, дисциплины `KATA` / `KUMITE` / `TEAM` |
| `Payment` | Абонементы и взносы |
| `InviteCode` | Одноразовый код на ученика. Код клуба хранится в `Club.joinCode` и не сгорает |
| `ChatMessage`, `ChatGroup`, `ChatGroupMember`, `ChatGroupMessage` | Личные и групповые чаты |
| `DocumentTemplate` | Шаблоны для родителей |

### Сервисы (`service`)

`AuthService`, `CoachService`, `ParentService`, `ScheduleService`, `ProgressService`, `BeltService`, `CompetitionService`, `PaymentService`, `ChatService`, `DocumentService`, `CoachAccessService`, `ParentAccessService`, `StudentMapper`, `AgeCalculator`.

### Ошибки API

`GlobalExceptionHandler`: `NotFoundException`, `ForbiddenException`, `BadRequestException`, `UnauthorizedException`.

---

## 5. HTTP API (обзор)

Базовый префикс: **`/api`**.

| Контроллер | Путь | Кто |
|------------|------|-----|
| `AuthController` | `/auth/*` | регистрация, login, profile, invite/link |
| `CoachController` | `/coach/*` | дашборд, ученики, группы, attendance, schedule, badges, belts, invite-codes, chat |
| `CompetitionController` | `/coach/competitions/*` | CRUD, auto-categorize, export.xlsx |
| `ParentController` | `/parent/*` | дети, home, profile, achievements, history, payments, competitions, documents, chat |
| `PaymentController` | `/payments/*` | список, PATCH, reminders |

Полная таблица методов — [seishin-backend/README.md](../seishin-backend/README.md).

### Демо-данные (seed)

- Клуб **Karate Hub**
- Дети: **Михаил Соколов**, **Аня Соколова**
- Соревнование **Кубок Karate Hub 2026**
- Платежи: PAID / PENDING примеры

---

## 6. Фронтенд

### Точки входа

- `src/main.tsx` — React root, провайдеры.
- **`src/App.tsx`** — единственное место объявления маршрутов.

### Маршруты

**Публичные** (`SiteLayout`): `/`, `/for-parents`, `/for-coaches`, `/login`, `/register`.

**Тренер** (`ProtectedRoute` role=COACH, `CoachLayout`):

| Путь | Страница |
|------|----------|
| `/coach` | `CoachDashboard` — главная (Группы / Сегодня / Неделя, внимание) |
| `/coach/students` | База учеников |
| `/coach/tools` | Инструменты (заглушки/ссылки) |
| `/coach/attendance` | Посещаемость (query: groupId, date, time) |
| `/coach/schedule` | Расписание (`?add=slot` из меню «Создать») |
| `/coach/awards` | Награды |
| `/coach/competitions` | Соревнования |
| `/coach/chat` | Чаты |
| `/coach/secret` | Секретная страница |

**Родитель** (`ProtectedRoute` role=PARENT, `ParentAppLayout`): `/app`, `/app/profile`, `/app/achievements`, `/app/competition`, `/app/history`, `/app/chat`, `/app/secret`.

Редиректы: `/parent` → `/app`; legacy `/profile`, `/achievements`, … → под `/app`.

> Новый клиентский маршрут: добавить в **`App.tsx`** и в **`SpaForwardController`** (или под `/coach/**`, `/app/**`).

### API-клиент

- `src/api/client.ts` — **`apiFetch`** (единственный HTTP-слой).
- `src/api/types.ts` — DTO.
- `src/api/auth.ts`, `coach.ts`, `parent.ts` — вызовы по ролям.

### Состояние

- `AuthContext` — сессия, `seishin-auth`.
- `ParentChildContext` — выбранный ребёнок.

### UI: тренер (мобильный кабинет)

- **Светлая** тема, без тёмного hero на главных экранах.
- **`CoachMobileNav`** — 5 слотов: Главная, База, Создать (+), Инструменты, «?»; активный пункт — SVG-рамка с анимацией `coach-tab-frame-stroke` (`index.css`).
- **`CoachCreateSheet`** — модал «Создать» (соревнование, уведомление, тренировка, KataVR).
- **`CoachSidebar`** — десктоп; пункты + «Создать».
- **`CoachPageShell`**, **`CoachLayout`**.

### UI: родитель

- `ParentMobileNav`, `ParentSidebar`, зелёная палитра.

### Стили

- Токены и утилиты: `src/index.css` (`.card`, `.btn-primary`, …).
- Тренер / маркетинг — синий + gold; родитель — зелёный; navy — тёмные блоки.
- Иконки: `src/components/ui/Icons.tsx`; ассеты — `public/assets/{coach,parent,...}/` (без UUID из Figma).

---

## 7. Чеклист изменений

### Новый API

1. DTO в `web/dto`, логика в `service`, эндпоинт в `controller`.
2. Матчер в **`SecurityConfig`**.
3. Тип и метод в `seishin-app/src/api/types.ts` + `coach.ts` / `parent.ts`.
4. Строка в `seishin-backend/README.md` (по желанию).

### Новая страница

1. Компонент в `src/pages/…`
2. Route в **`App.tsx`**
3. Навигация в `CoachSidebar` / `CoachMobileNav` / parent nav
4. **`SpaForwardController`**, если путь вне `/**`

### Проверки

```powershell
cd seishin-app
npx tsc -p tsconfig.app.json --noEmit

cd seishin-backend
.\gradlew.bat test
```

---

## 8. Связанные файлы (шпаргалка)

| Тема | Файл |
|------|------|
| JWT | `security/JwtAuthenticationFilter.java`, `JwtProperties.java` |
| Seed | `seed/DataSeeder.java` |
| SPA fallback | `config/SpaForwardController.java` |
| CORS | `config/CorsConfig.java`, `application.properties`, `deploy/application-prod.properties` |
| Vite proxy | `seishin-app/vite.config.ts` |
| Capacitor | `seishin-app/capacitor.config.ts`, `MOBILE.md` |
| VPS / деплой | `deploy/README.md`, `deploy/deploy.ps1` |

---

*Обновляйте этот документ при добавлении модулей, маршрутов или существенных UX-паттернов.*
