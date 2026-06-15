# 08. Development Log

## 2026-06-15 — Хакатон, итерация 2

### Бекенд

**Prisma схема:**
- Добавлены: `CompetitionApproval`, `Task`, `ApprovalStatus` enum, `competition_approval` в `NotificationType`
- Расширены: `Attendance.grade`, `User.phone`, `User.demoPassword`

**Новые модули:**
- `TasksModule` — CRUD задач с привязкой к orgId
- `UsersModule` — управление пользователями, смена пароля, генерация demo-пароля

**Расширения существующих модулей:**
- `CompetitionsService/Controller` — approval flow (допуск тренером → уведомление родителя → ответ)
- `AttendanceService` — `getAllAthletesReadiness(orgId)` с цветовой классификацией
- `ParentsService.getMyChildren` — теперь включает `recentAttendance` с оценками, `avgGrade`
- `NotificationsService` — добавлен тип `competition_approval` в белый список

### Фронтенд

**Новые страницы:**
- `/users` — страница участников (все пользователи, роли, lock-иконка, CRUD)
- `/admin-profile` — личный кабинет администратора/тренера

**Обновлённые страницы:**
- `/attendance` — оценки 1–5 в журнале, исправлен DTO-мисматч (`records` → `items`)
- `/competitions` — вкладка «Готовность» с индикаторами + кнопки допуска; диалог добавления результата
- `/notifications` — две вкладки: уведомления и задачи (CRUD)
- `/groups` — полный CRUD, назначение тренера
- `/athletes` — исправлены поля формы (firstName/lastName, birthDate, sportType)
- `/athletes/[id]` — исправлена перестановка firstName/lastName
- `/parent` — оценки в занятиях, средняя оценка, баннер запросов на допуск
- `/payments` — overflow-x-auto для мобильных

**Мобильная адаптивность:**
- Sidebar: бургер-меню + overlay для мобильных
- MainLayout: `pt-14 md:pt-0` для компенсации бургера
- Все таблицы: `overflow-x-auto` + `min-w-[600px]`
- Отступы: `p-4 md:p-6` на всех страницах

**API функции (lib/api.ts):**
- `getAthletesReadiness`, `getCompetitionApprovals`, `upsertCompetitionApproval`, `respondToApproval`, `getParentApprovals`
- `createGroup`, `updateGroup`, `deleteGroup`, `addGroupMember`, `removeGroupMember`
- `getTasks`, `createTask`, `updateTask`, `deleteTask`
- `getUsers`, `createUser`, `updateUser`, `deleteUser`, `generateUserPassword`
- `updateMyProfile`, `changeMyPassword`
