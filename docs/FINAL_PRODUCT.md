# SportPass CRM — Финальный продуктовый документ

> Агент 10: финальный сборщик. Документ для разработки и защиты на хакатоне.

---

## 1. Финальная концепция продукта

**Название:** SportPass CRM

**Подзаголовок:** Цифровой паспорт спортсмена для детских секций и клубов

**One-liner:**
SportPass CRM — единая система для спортивных секций, где у каждого ребёнка есть цифровой спортивный паспорт: посещаемость, оплаты, справки, соревнования и прогресс.

**Для кого:**
Частные детские спортивные секции и клубы на 50–500 спортсменов: единоборства, футбол, гимнастика, плавание, борьба, бокс, тхэквондо, танцы. MVP ориентирован на клубы единоборств и универсальные детские секции.

**Проблема:**
Большинство секций ведут учеников, оплаты, посещаемость, справки, соревнования и связь с родителями через WhatsApp, Excel, тетради и устные договорённости. Из-за этого теряются платежи, просрачиваются медсправки, тренер не видит прогресс, а родитель не понимает, за что платит.

**Чем отличается от обычной CRM:**
Обычная CRM строится вокруг сделки и покупателя. SportPass CRM строится вокруг спортсмена: его тренировок, посещаемости, прогресса, медсправок, соревнований и связи с родителями. Главный объект системы — не клиент, а цифровой паспорт ребёнка-спортсмена.

**Главная ценность:**

| Роль | Ценность |
|---|---|
| Владелец секции | Видит деньги, должников, загрузку групп и работу тренеров без звонков и таблиц |
| Тренер | Отмечает посещаемость, ведёт прогресс, видит допуски и историю спортсмена |
| Родитель | Видит расписание, оплату, посещаемость и результаты ребёнка в одном кабинете |

---

## 2. Финальный MVP

### Обязательно сделать (P0)

| Функция | Минимальная реализация |
|---|---|
| Авторизация и роли | JWT, 3 роли: Admin, Coach, Parent |
| Карточка спортсмена | ФИО, дата рождения, вид спорта, группа, тренер, родитель, статус |
| Цифровой паспорт | Вкладки: профиль, оплаты, посещаемость, документы, прогресс, соревнования |
| Группы и тренеры | Список групп, назначение тренера, состав |
| Расписание | Дни, время, зал, группа |
| Посещаемость | Отметка был / не был / уважительная причина по тренировке |
| Оплаты и должники | Статус: оплачено / долг / частично, список должников |
| Медсправки и страховки | Дата окончания, статус: действует / истекает / просрочена |
| Родительский кабинет | Расписание, оплата, посещаемость, прогресс ребёнка |
| Публичный API | 7–10 endpoints, API-ключи, Swagger/OpenAPI |
| Дашборд администратора | Виджеты: спортсмены, долги, справки, ближайшие тренировки |
| Docker Compose + seed | Запуск одной командой, тестовые данные |

### Желательно сделать (P1)

| Функция | Описание |
|---|---|
| Соревнования | Создание соревнования, участники, результаты |
| Прогресс спортсмена | Навыки по шкале 1–5, заметки тренера, динамика |
| Уведомления (внутренние) | Лента: долг, справка истекает, тренировка, соревнование |
| Риск ухода | Простая формула по посещаемости, долгу и серии пропусков |
| Готовность к соревнованиям | Балл 0–100 по посещаемости, прогрессу, документам |
| Статус спортсмена | Активен / пробное занятие / заморожен / архив |

### Оставить на после хакатона (P2)

- Онлайн-оплата (эквайринг)
- Telegram / WhatsApp уведомления
- Мобильное приложение
- QR-отметка посещаемости
- AI-прогноз ухода спортсмена
- Экспорт PDF-паспорта спортсмена
- Интеграция с Госуслугами / Мой Спорт
- Турнирная сетка
- Система абонементов с тарифами
- Белая метка для сетей клубов

---

## 3. Финальная структура системы

### Разделы и роли

| Раздел | Admin | Coach | Parent |
|---|---|---|---|
| Дашборд | полный | только свои группы | — |
| Спортсмены | CRUD | чтение + прогресс | только свой ребёнок |
| Родители | CRUD | чтение | — |
| Тренеры | CRUD | чтение | — |
| Группы | CRUD | чтение | — |
| Расписание | CRUD | чтение | чтение |
| Посещаемость | чтение | отметка | чтение ребёнка |
| Оплаты | CRUD | — | чтение ребёнка |
| Документы (медсправки) | CRUD | чтение | чтение + загрузка |
| Соревнования | CRUD | CRUD | чтение |
| Прогресс | чтение | CRUD | чтение |
| Уведомления | все | свои | свои |
| API / Интеграции | управление ключами | — | — |
| Настройки клуба | полные | — | — |

### Описание разделов

**Дашборд администратора**
Виджеты: активные спортсмены, тренировки сегодня, сумма долгов, количество должников, просроченные справки, ближайшие соревнования. Быстрые действия: добавить спортсмена, принять оплату, отправить уведомление.

**Спортсмены**
Список с фильтрами по группе, тренеру, статусу оплаты, документам, посещаемости. Карточка в списке: ФИО, возраст, группа, статус оплаты, медсправка, посещаемость %.

**Цифровой паспорт спортсмена**
Главный экран продукта. Вкладки: Профиль, Оплаты, Посещаемость, Документы, Прогресс, Соревнования, Timeline событий.

**Родители**
Список родителей, привязка к детям, контакты, долги, история уведомлений.

**Тренеры**
Список тренеров, закреплённые группы, расписание.

**Группы**
Карточка группы: состав, тренер, расписание, посещаемость %, должники, просроченные справки.

**Расписание**
Список занятий по группам и дням. Создание, перенос, отмена занятия.

**Посещаемость**
Экран тренера: список группы на тренировке, статусы пришёл / не пришёл / опоздал / болел. Кнопка «Отметить всех присутствующими».

**Оплаты**
Список платежей, фильтр должников, кнопка «Принять оплату», история оплат по спортсмену.

**Документы**
Медсправки и страховки: статусы, сроки, предупреждения. Список «истекает скоро» и «просрочено».

**Соревнования**
Создание соревнования, участники, проверка документов, результаты, места, медали.

**Прогресс**
Навыки по шкале, оценки тренера, динамика, комментарии, индекс прогресса.

**Уведомления**
Внутренняя лента: долг, справка, тренировка, соревнование. Шаблоны сообщений.

**API / Интеграции**
Управление API-ключами, Swagger-документация, webhooks, примеры запросов, список scopes.

---

## 4. Роли пользователей

### Владелец клуба / Администратор (ADMIN)

- Полный доступ ко всем данным клуба
- Управление спортсменами, родителями, тренерами, группами
- Контроль оплат, должников, документов
- Создание соревнований
- Управление API-ключами и интеграциями
- Настройки клуба
- Отправка уведомлений родителям

### Тренер (COACH)

- Видит только свои группы
- Отмечает посещаемость на тренировках
- Добавляет прогресс и комментарии по спортсменам
- Создаёт и редактирует результаты соревнований
- Видит медсправки и допуск спортсменов
- Не видит оплаты

### Родитель (PARENT)

- Видит только своего ребёнка (или нескольких детей)
- Видит расписание группы
- Видит оплату и задолженность
- Видит посещаемость ребёнка
- Видит прогресс и соревнования
- Видит статус медсправок
- Получает уведомления
- Не управляет данными системы

### Внешний API-клиент (API_CLIENT)

- Доступ через API-ключ с ограниченными scopes
- Доступные scopes: `athletes:read`, `groups:read`, `schedule:read`, `payments:read`, `attendance:read`, `competitions:read`, `notifications:write`, `webhooks:write`
- Не имеет доступа к административным функциям
- Ограничен данными только своей организации (tenant isolation)
- Rate limit: до 1000 запросов в день (для MVP)

---

## 5. Основные пользовательские сценарии

### Сценарий 1. Администратор добавляет нового спортсмена

1. Администратор нажимает «+ Спортсмен» в любом разделе.
2. Заполняет форму: ФИО, дата рождения, вид спорта, статус (пробное / активен).
3. Добавляет родителя: ФИО, телефон, email, отношение (мать / отец / опекун).
4. Выбирает группу из списка.
5. Опционально: добавляет медсправку и дату окончания.
6. Сохраняет — спортсмен появляется в списке группы у тренера.

**Результат:** Ребёнок в системе, тренер видит его в группе, родитель получает доступ в кабинет.

---

### Сценарий 2. Спортсмен прикрепляется к группе и тренеру

1. Администратор открывает карточку спортсмена → вкладка «Профиль».
2. Нажимает «Изменить группу».
3. Выбирает группу — система автоматически назначает тренера из группы.
4. Сохраняет — спортсмен появляется в расписании группы.

**Результат:** Тренер видит нового ученика, расписание обновлено, родитель видит тренировки.

---

### Сценарий 3. Тренер отмечает посещаемость

1. Тренер заходит в «Мои группы» → выбирает сегодняшнюю тренировку.
2. Видит список группы.
3. Для каждого спортсмена ставит статус: присутствует / отсутствует / опоздал / болен.
4. Опционально добавляет комментарий.
5. Нажимает «Сохранить посещаемость».
6. Система обновляет процент посещаемости в карточке каждого спортсмена.

**Результат:** Посещаемость сохранена, родитель видит её в кабинете, администратор видит в дашборде.

---

### Сценарий 4. Система показывает задолженность

1. Администратор открывает раздел «Оплаты» → фильтр «Должники».
2. Видит список: ФИО спортсмена, сумма долга, количество дней просрочки.
3. Нажимает на спортсмена — открывается карточка с историей оплат.
4. Нажимает «Принять оплату» → вводит сумму и период → сохраняет.
5. Долг автоматически пересчитывается.

**Дашборд-сигнал:** Виджет «Долги» всегда показывает актуальную сумму и количество должников.

---

### Сценарий 5. Родитель видит посещаемость и оплату

1. Родитель заходит в родительский кабинет (отдельный URL / роль).
2. На главном экране: ФИО ребёнка, следующая тренировка, статус оплаты, медсправка.
3. Открывает вкладку «Посещаемость» — видит календарь: зелёный (был), красный (пропустил).
4. Открывает вкладку «Оплаты» — видит историю платежей и текущий долг.
5. При наличии долга — видит кнопку «Оплатить» (для MVP: перенаправление, для v2: онлайн-оплата).

---

### Сценарий 6. Тренер заполняет прогресс спортсмена

1. Тренер открывает карточку спортсмена → вкладка «Прогресс».
2. Нажимает «Добавить оценку».
3. Выбирает навык из списка (Техника, Выносливость, Дисциплина, Физподготовка и т.д.).
4. Ставит оценку 1–5, добавляет комментарий.
5. Сохраняет — график прогресса обновляется.
6. Родитель видит последние оценки в своём кабинете.

---

### Сценарий 7. Администратор добавляет соревнование

1. Администратор открывает раздел «Соревнования» → «+ Соревнование».
2. Заполняет: название, дата, место, вид спорта.
3. Добавляет участников из списка спортсменов.
4. Система проверяет медсправки участников — предупреждает о просроченных.
5. После соревнования тренер добавляет результаты: место, категория, комментарий.
6. Результаты сохраняются в цифровом паспорте каждого участника.

---

### Сценарий 8. Система напоминает о медсправке

1. Система ежедневно проверяет сроки действия документов.
2. За 14 дней до окончания: статус справки меняется на «Истекает» (жёлтый).
3. На дашборде администратора появляется предупреждение.
4. В карточке спортсмена и у тренера — индикатор.
5. Родитель видит предупреждение в своём кабинете.
6. При заявке на соревнование с просроченной справкой — система блокирует допуск.

---

### Сценарий 9. Внешний сервис получает данные через API

1. Администратор создаёт API-ключ в разделе «API / Интеграции».
2. Выбирает scopes: `athletes:read`, `schedule:read`.
3. Копирует ключ и передаёт во внешний сервис (сайт клуба, Telegram-бот).
4. Внешний сервис делает запрос:
   ```
   GET /api/v1/athletes/{id}/sport-passport
   X-API-Key: sp_live_...
   ```
5. Получает JSON с данными цифрового паспорта спортсмена.
6. Отображает данные на сайте клуба или в боте.

---

## 6. Финальная структура базы данных

### organizations
```sql
id            UUID PRIMARY KEY
name          VARCHAR(255) NOT NULL
sport_types   TEXT[]
city          VARCHAR(100)
created_at    TIMESTAMP DEFAULT NOW()
```

### users
```sql
id            UUID PRIMARY KEY
org_id        UUID REFERENCES organizations(id)
email         VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
full_name     VARCHAR(255) NOT NULL
role          ENUM('admin', 'coach', 'parent') NOT NULL
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `org_id → organizations.id`

### athletes
```sql
id            UUID PRIMARY KEY
org_id        UUID REFERENCES organizations(id)
first_name    VARCHAR(100) NOT NULL
last_name     VARCHAR(100) NOT NULL
birth_date    DATE NOT NULL
sport_type    VARCHAR(100)
level         ENUM('beginner', 'intermediate', 'advanced', 'competitive')
status        ENUM('trial', 'active', 'frozen', 'archived') DEFAULT 'trial'
group_id      UUID REFERENCES training_groups(id)
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `org_id → organizations`, `group_id → training_groups`

### parents
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES users(id)
org_id        UUID REFERENCES organizations(id)
phone         VARCHAR(20)
relation      ENUM('mother', 'father', 'guardian')
```
Связи: `user_id → users`, `org_id → organizations`

### athlete_parents
```sql
id            UUID PRIMARY KEY
athlete_id    UUID REFERENCES athletes(id)
parent_id     UUID REFERENCES parents(id)
is_primary    BOOLEAN DEFAULT TRUE
```
Связи: `athlete_id → athletes`, `parent_id → parents`

### coaches
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES users(id)
org_id        UUID REFERENCES organizations(id)
sport_types   TEXT[]
```
Связи: `user_id → users`, `org_id → organizations`

### training_groups
```sql
id            UUID PRIMARY KEY
org_id        UUID REFERENCES organizations(id)
name          VARCHAR(255) NOT NULL
sport_type    VARCHAR(100)
coach_id      UUID REFERENCES coaches(id)
age_from      INT
age_to        INT
capacity      INT
level         VARCHAR(50)
monthly_fee   DECIMAL(10,2)
```
Связи: `org_id → organizations`, `coach_id → coaches`

### schedules
```sql
id            UUID PRIMARY KEY
group_id      UUID REFERENCES training_groups(id)
weekday       ENUM('mon','tue','wed','thu','fri','sat','sun')
start_time    TIME NOT NULL
end_time      TIME NOT NULL
location      VARCHAR(255)
```
Связи: `group_id → training_groups`

### training_sessions
```sql
id            UUID PRIMARY KEY
group_id      UUID REFERENCES training_groups(id)
coach_id      UUID REFERENCES coaches(id)
session_date  DATE NOT NULL
start_time    TIME NOT NULL
end_time      TIME NOT NULL
location      VARCHAR(255)
status        ENUM('planned','completed','cancelled') DEFAULT 'planned'
topic         VARCHAR(255)
```
Связи: `group_id → training_groups`, `coach_id → coaches`

### attendance
```sql
id            UUID PRIMARY KEY
session_id    UUID REFERENCES training_sessions(id)
athlete_id    UUID REFERENCES athletes(id)
status        ENUM('present','absent','late','sick','competition') NOT NULL
comment       TEXT
created_by    UUID REFERENCES users(id)
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `session_id → training_sessions`, `athlete_id → athletes`

### payments
```sql
id            UUID PRIMARY KEY
athlete_id    UUID REFERENCES athletes(id)
org_id        UUID REFERENCES organizations(id)
period_month  VARCHAR(7) NOT NULL -- '2026-06'
amount        DECIMAL(10,2) NOT NULL
paid_amount   DECIMAL(10,2) DEFAULT 0
due_date      DATE
status        ENUM('paid','partial','debt','pending') DEFAULT 'pending'
payment_date  TIMESTAMP
payment_method VARCHAR(50)
note          TEXT
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `athlete_id → athletes`, `org_id → organizations`

### medical_documents
```sql
id            UUID PRIMARY KEY
athlete_id    UUID REFERENCES athletes(id)
doc_type      ENUM('medical_cert','insurance','parental_consent')
issued_at     DATE
valid_until   DATE NOT NULL
file_url      VARCHAR(500)
status        ENUM('valid','expires_soon','expired') DEFAULT 'valid'
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `athlete_id → athletes`

### competitions
```sql
id            UUID PRIMARY KEY
org_id        UUID REFERENCES organizations(id)
name          VARCHAR(255) NOT NULL
comp_date     DATE NOT NULL
location      VARCHAR(255)
sport_type    VARCHAR(100)
description   TEXT
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `org_id → organizations`

### competition_results
```sql
id             UUID PRIMARY KEY
competition_id UUID REFERENCES competitions(id)
athlete_id     UUID REFERENCES athletes(id)
discipline     VARCHAR(100)
category       VARCHAR(100)
place          INT
result         VARCHAR(100)
medal          ENUM('gold','silver','bronze','none') DEFAULT 'none'
coach_comment  TEXT
created_at     TIMESTAMP DEFAULT NOW()
```
Связи: `competition_id → competitions`, `athlete_id → athletes`

### progress_records
```sql
id            UUID PRIMARY KEY
athlete_id    UUID REFERENCES athletes(id)
coach_id      UUID REFERENCES coaches(id)
skill_name    VARCHAR(100) NOT NULL
score         INT CHECK (score BETWEEN 1 AND 5)
comment       TEXT
measured_at   DATE NOT NULL
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `athlete_id → athletes`, `coach_id → coaches`

### notifications
```sql
id            UUID PRIMARY KEY
org_id        UUID REFERENCES organizations(id)
recipient_id  UUID REFERENCES users(id)
type          ENUM('payment_debt','doc_expiring','training','competition','progress')
title         VARCHAR(255)
message       TEXT
is_read       BOOLEAN DEFAULT FALSE
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `org_id → organizations`, `recipient_id → users`

### api_keys
```sql
id            UUID PRIMARY KEY
org_id        UUID REFERENCES organizations(id)
name          VARCHAR(100) NOT NULL
key_hash      VARCHAR(255) NOT NULL UNIQUE
scopes        TEXT[] NOT NULL
is_active     BOOLEAN DEFAULT TRUE
last_used_at  TIMESTAMP
created_at    TIMESTAMP DEFAULT NOW()
```
Связи: `org_id → organizations`

---

## 7. Финальная структура API

Базовый URL: `http://localhost:4000/api/v1`
Swagger: `http://localhost:4000/docs`

Авторизация для внутреннего API: `Authorization: Bearer <jwt_token>`
Авторизация для публичного API: `X-API-Key: sp_live_...`

---

### Авторизация

| Метод | URL | Назначение |
|---|---|---|
| POST | `/auth/login` | Вход в систему |
| POST | `/auth/refresh` | Обновление токена |
| GET | `/auth/me` | Профиль текущего пользователя |

**POST /auth/login — запрос:**
```json
{ "email": "admin@sportcrm.ru", "password": "demo123" }
```
**Ответ:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": { "id": "uuid", "role": "admin", "full_name": "Дудаев Мовлади" }
}
```

---

### Спортсмены

| Метод | URL | Назначение |
|---|---|---|
| GET | `/athletes` | Список спортсменов (с фильтрами) |
| POST | `/athletes` | Создать спортсмена |
| GET | `/athletes/:id` | Карточка спортсмена |
| PATCH | `/athletes/:id` | Обновить данные |
| DELETE | `/athletes/:id` | Архивировать спортсмена |
| GET | `/athletes/:id/sport-passport` | Цифровой паспорт спортсмена |
| GET | `/athletes/:id/attendance` | Посещаемость спортсмена |
| GET | `/athletes/:id/payments` | Оплаты спортсмена |
| GET | `/athletes/:id/progress` | Прогресс спортсмена |
| GET | `/athletes/:id/competitions` | Соревнования спортсмена |

**POST /athletes — запрос:**
```json
{
  "first_name": "Адам",
  "last_name": "Мусаев",
  "birth_date": "2015-05-12",
  "sport_type": "boxing",
  "group_id": "grp-uuid",
  "status": "trial",
  "parent": {
    "full_name": "Мусаева Амина",
    "phone": "+79990000000",
    "relation": "mother"
  }
}
```
**Ответ:**
```json
{ "id": "ath-uuid", "status": "created" }
```

**GET /athletes/:id/sport-passport — ответ:**
```json
{
  "athlete": {
    "id": "ath-uuid",
    "full_name": "Адам Мусаев",
    "birth_date": "2015-05-12",
    "sport_type": "boxing",
    "group": "Бокс 10–12 лет",
    "coach": "Исмаилов Р.",
    "status": "active"
  },
  "attendance_rate": 88,
  "payment_status": "paid",
  "medical_status": "valid",
  "competition_readiness_score": 82,
  "churn_risk_score": 15,
  "recent_progress": [
    { "skill": "Техника", "score": 4, "measured_at": "2026-06-01" }
  ],
  "competitions": [
    { "name": "Открытый турнир клуба", "place": 2, "date": "2026-05-20" }
  ],
  "timeline": [
    { "date": "2026-01-10", "event": "Зачислен в секцию" },
    { "date": "2026-02-15", "event": "Первые соревнования, 2 место" }
  ]
}
```

---

### Группы

| Метод | URL | Назначение |
|---|---|---|
| GET | `/groups` | Список групп |
| POST | `/groups` | Создать группу |
| GET | `/groups/:id` | Карточка группы |
| PATCH | `/groups/:id` | Обновить группу |
| GET | `/groups/:id/members` | Список спортсменов группы |
| POST | `/groups/:id/members` | Добавить спортсмена в группу |
| DELETE | `/groups/:id/members/:athleteId` | Убрать из группы |
| GET | `/groups/:id/schedule` | Расписание группы |

---

### Расписание

| Метод | URL | Назначение |
|---|---|---|
| GET | `/sessions` | Список тренировок (фильтр по группе, дате) |
| POST | `/sessions` | Создать тренировку |
| GET | `/sessions/:id` | Детали тренировки |
| PATCH | `/sessions/:id` | Обновить / отменить тренировку |

---

### Посещаемость

| Метод | URL | Назначение |
|---|---|---|
| GET | `/sessions/:id/attendance` | Посещаемость на тренировке |
| POST | `/sessions/:id/attendance/bulk` | Отметить посещаемость (массово) |
| PATCH | `/sessions/:sessionId/attendance/:athleteId` | Изменить статус |

**POST /sessions/:id/attendance/bulk — запрос:**
```json
{
  "items": [
    { "athlete_id": "ath-uuid-1", "status": "present" },
    { "athlete_id": "ath-uuid-2", "status": "absent", "comment": "Болел" }
  ]
}
```

---

### Оплаты

| Метод | URL | Назначение |
|---|---|---|
| GET | `/payments` | Список оплат (фильтры: месяц, статус) |
| POST | `/payments` | Создать платёж |
| PATCH | `/payments/:id/confirm` | Подтвердить оплату |
| GET | `/payments/debtors` | Список должников |
| GET | `/athletes/:id/balance` | Баланс спортсмена |

**GET /payments/debtors — ответ:**
```json
{
  "total_debt": 47500,
  "count": 8,
  "debtors": [
    {
      "athlete_id": "ath-uuid",
      "full_name": "Адам Мусаев",
      "debt_amount": 3500,
      "overdue_days": 12,
      "parent_phone": "+79990000000"
    }
  ]
}
```

---

### Документы (медсправки и страховки)

| Метод | URL | Назначение |
|---|---|---|
| GET | `/athletes/:id/medical-documents` | Документы спортсмена |
| POST | `/athletes/:id/medical-documents` | Добавить документ |
| GET | `/medical-documents/expiring` | Список истекающих документов |

---

### Соревнования

| Метод | URL | Назначение |
|---|---|---|
| GET | `/competitions` | Список соревнований |
| POST | `/competitions` | Создать соревнование |
| GET | `/competitions/:id` | Детали соревнования |
| POST | `/competitions/:id/results` | Добавить результат |
| GET | `/competitions/:id/results` | Результаты соревнования |

---

### Прогресс

| Метод | URL | Назначение |
|---|---|---|
| GET | `/athletes/:id/progress` | История прогресса |
| POST | `/athletes/:id/progress` | Добавить запись прогресса |

---

### Аналитика

| Метод | URL | Назначение |
|---|---|---|
| GET | `/analytics/dashboard` | Сводка по организации |
| GET | `/athletes/:id/risk` | Риск ухода спортсмена (0–100) |
| GET | `/athletes/:id/competition-readiness` | Готовность к соревнованиям (0–100) |

---

### Уведомления

| Метод | URL | Назначение |
|---|---|---|
| GET | `/notifications` | Список уведомлений пользователя |
| PATCH | `/notifications/:id/read` | Отметить как прочитанное |
| POST | `/notifications/send` | Отправить уведомление (Admin) |

---

### Публичный API (для внешних сервисов)

Авторизация: `X-API-Key: sp_live_...`

| Метод | URL | Назначение |
|---|---|---|
| GET | `/public/v1/athletes/:id` | Цифровой паспорт спортсмена |
| GET | `/public/v1/athletes/:id/attendance` | Посещаемость спортсмена |
| GET | `/public/v1/athletes/:id/progress` | Прогресс спортсмена |
| GET | `/public/v1/athletes/:id/competitions` | Соревнования спортсмена |
| GET | `/public/v1/athletes/:id/payments` | Статус оплат |
| GET | `/public/v1/groups/:id/schedule` | Расписание группы |
| GET | `/public/v1/competitions` | Список предстоящих соревнований |
| POST | `/public/v1/leads` | Заявка с внешнего сайта |

### API-ключи

| Метод | URL | Назначение |
|---|---|---|
| GET | `/api-keys` | Список ключей организации |
| POST | `/api-keys` | Создать новый ключ |
| DELETE | `/api-keys/:id` | Отозвать ключ |

### Webhooks

| Метод | URL | Назначение |
|---|---|---|
| GET | `/webhooks` | Список подписок |
| POST | `/webhooks` | Создать подписку |
| DELETE | `/webhooks/:id` | Удалить подписку |

**События webhooks:**
```json
{ "event": "payment.paid", "data": { "athlete_id": "...", "amount": 3500 } }
{ "event": "payment.overdue", "data": { "athlete_id": "...", "days": 12 } }
{ "event": "medical_document.expiring", "data": { "athlete_id": "...", "days_left": 7 } }
{ "event": "athlete.created", "data": { "athlete_id": "..." } }
{ "event": "attendance.marked", "data": { "session_id": "...", "athlete_id": "..." } }
{ "event": "competition.result_added", "data": { "competition_id": "...", "athlete_id": "...", "place": 1 } }
```

---

## 8. Финальный backlog разработки

### Database (P0 — делать первым)

| Задача | Приоритет |
|---|---|
| Создать Prisma schema для всех таблиц | P0 |
| Миграции: organizations, users, athletes, parents | P0 |
| Миграции: groups, schedules, sessions, attendance | P0 |
| Миграции: payments, medical_documents | P0 |
| Миграции: competitions, results, progress | P1 |
| Миграции: notifications, api_keys | P1 |
| Seed-скрипт: 1 организация, 2 тренера, 3 группы, 10+ спортсменов | P0 |
| Seed: оплаты (часть долги), медсправки (часть истекают) | P0 |
| Seed: демо-аккаунты admin/coach/parent | P0 |

### Backend (NestJS)

| Задача | Приоритет |
|---|---|
| Auth module: JWT, bcrypt, роли, guards | P0 |
| Athletes module: CRUD + sport-passport endpoint | P0 |
| Groups module: CRUD + members | P0 |
| Schedules + Sessions module | P0 |
| Attendance module: bulk отметка | P0 |
| Payments module: CRUD + debtors list | P0 |
| Medical documents module + статусы истечения | P0 |
| Parents module + связь с athletes | P0 |
| Public API module: ключи + scopes + rate limit | P0 |
| Swagger / OpenAPI документация | P0 |
| Competitions module | P1 |
| Progress module + индекс прогресса | P1 |
| Notifications module (внутренние) | P1 |
| Analytics module: dashboard, risk, readiness | P1 |
| Webhooks | P2 |
| Cron: ежедневная проверка медсправок | P2 |

### Frontend (Next.js)

| Задача | Приоритет |
|---|---|
| Страница входа (3 роли) | P0 |
| Layout: сайдбар, навигация по ролям | P0 |
| Дашборд администратора (5 виджетов) | P0 |
| Список спортсменов + фильтры | P0 |
| Цифровой паспорт спортсмена (вкладки) | P0 |
| Форма создания спортсмена + родителя | P0 |
| Список групп + карточка группы | P0 |
| Экран тренера: посещаемость | P0 |
| Экран оплат + список должников | P0 |
| Экран медсправок + статусы | P0 |
| Родительский кабинет | P0 |
| Страница API / Интеграции + генерация ключей | P0 |
| Список соревнований + результаты | P1 |
| Прогресс спортсмена (график) | P1 |
| Уведомления (лента) | P1 |
| Расписание (список занятий) | P1 |
| Таймлайн событий спортсмена | P2 |

### UX/UI

| Задача | Приоритет |
|---|---|
| Цветовая система: статусы оплат, справок, посещаемости | P0 |
| Компоненты: карточка спортсмена, строка долга, статус документа | P0 |
| Быстрые действия на дашборде | P0 |
| Адаптивность для тренера (телефон/планшет) | P1 |
| Timeline цифрового паспорта | P1 |

### API / Интеграции

| Задача | Приоритет |
|---|---|
| Middleware для API-ключей + scopes | P0 |
| Endpoints публичного API (7–10 штук) | P0 |
| Swagger с описанием всех endpoints | P0 |
| Примеры curl-запросов в Swagger | P0 |
| Webhooks | P2 |

### Docker / Deploy

| Задача | Приоритет |
|---|---|
| docker-compose.yml: postgres, backend, frontend | P0 |
| .env.example | P0 |
| Makefile: up, down, logs, seed, restart | P0 |
| README: команды запуска, демо-аккаунты, URL-адреса | P0 |
| Health check endpoints | P1 |
| Nginx reverse proxy | P2 |

### Тестирование (QA)

| Задача | Приоритет |
|---|---|
| Ручной прогон demo-flow: все 9 сценариев | P0 |
| Проверка seed-данных (долги, справки, посещаемость) | P0 |
| Проверка 3 ролей (admin, coach, parent) | P0 |
| Проверка API-ключа через curl / Swagger | P0 |
| Проверка Docker cold start | P0 |
| Проверка адаптивности (тренер с телефона) | P1 |
| Проверка webhook-сигнала | P2 |

---

## 9. Финальный demo-flow продукта

Длительность: 3–5 минут. Показывать в браузере, без переключения между кодом и интерфейсом.

### Шаг 1. Вход в систему (20 сек)
- Открыть `http://localhost:3000`
- Войти как Admin: `admin@sportcrm.ru / demo123`
- Фраза: *«Три роли: администратор видит весь клуб, тренер — свои группы, родитель — только ребёнка»*

### Шаг 2. Дашборд (30 сек)
- Показать виджеты: 47 спортсменов, 12 должников, 6 справок истекают, 3 тренировки сегодня
- Фраза: *«Владелец секции видит всё состояние клуба за 30 секунд, без звонков и Excel»*

### Шаг 3. Цифровой паспорт спортсмена (60 сек)
- Открыть список спортсменов → выбрать спортсмена
- Показать вкладки: Профиль, Посещаемость (88%), Оплаты (есть долг), Документы (справка истекает), Прогресс, Соревнования
- Фраза: *«Это главная фишка продукта — цифровой паспорт спортсмена от первой тренировки до соревнований»*

### Шаг 4. Посещаемость (30 сек)
- Переключиться на роль тренера: `coach@sportcrm.ru / demo123`
- Открыть «Мои группы» → сегодняшняя тренировка → отметить 3–4 детей
- Одному поставить «отсутствовал»
- Фраза: *«Тренер не тратит время на таблицы — отметка за 10 секунд»*

### Шаг 5. Задолженность (30 сек)
- Вернуться как Admin → Оплаты → Должники
- Показать список: ФИО, сумма долга, дней просрочки, телефон родителя
- Фраза: *«Все долги в одном экране. Раньше это было в WhatsApp и Excel»*

### Шаг 6. Медсправка (20 сек)
- Раздел «Документы» → показать жёлтые и красные статусы
- Фраза: *«Система предупреждает за 14 дней. При заявке на соревнование без справки — блокирует допуск»*

### Шаг 7. Родительский кабинет (30 сек)
- Переключиться на родителя: `parent@sportcrm.ru / demo123`
- Показать: расписание, долг, посещаемость, прогресс, ближайшее соревнование
- Фраза: *«Родитель видит всё о ребёнке в одном кабинете, не спрашивая тренера в чате»*

### Шаг 8. Публичный API (30 сек)
- Открыть `http://localhost:4000/docs`
- Показать список endpoints
- Выполнить прямо в Swagger: `GET /public/v1/athletes/{id}/sport-passport` с API-ключом
- Показать JSON-ответ
- Фраза: *«Публичный API позволяет подключить сайт клуба, Telegram-бота, платёжный сервис или мобильное приложение»*

### Шаг 9. Docker (15 сек)
- Показать `docker compose up -d --build` в терминале (или уже поднятое)
- Фраза: *«Проект разворачивается одной командой»*

---

## 10. Финальный чек-лист готовности продукта

### Продукт работает

- [ ] Frontend запускается на `http://localhost:3000`
- [ ] Backend запускается на `http://localhost:4000`
- [ ] Swagger доступен на `http://localhost:4000/docs`
- [ ] База данных заполнена seed-данными

### Авторизация и роли

- [ ] Вход работает для admin / coach / parent
- [ ] Тренер не видит оплаты и чужие группы
- [ ] Родитель видит только своего ребёнка
- [ ] API-ключ работает для публичных endpoints

### CRUD-сценарии

- [ ] Создать спортсмена с родителем → спортсмен появляется в группе у тренера
- [ ] Тренер отмечает посещаемость → обновляется в карточке спортсмена
- [ ] Принять оплату → долг исчезает
- [ ] Добавить медсправку с датой → статус обновляется
- [ ] Добавить соревнование и результат → появляется в паспорте
- [ ] Добавить прогресс → родитель видит в кабинете

### Публичный API

- [ ] Создан хотя бы один API-ключ в интерфейсе
- [ ] `GET /public/v1/athletes/:id/sport-passport` возвращает данные
- [ ] `GET /public/v1/groups/:id/schedule` работает
- [ ] Swagger показывает все endpoints с описаниями
- [ ] Запрос без ключа возвращает 401

### Docker / Deploy

- [ ] Есть `docker-compose.yml` с postgres, backend, frontend
- [ ] Есть `.env.example`
- [ ] Есть `Makefile` с командами up / down / seed / logs
- [ ] `docker compose up -d --build` поднимает всё с нуля

### README

- [ ] Инструкция: как запустить за 3 шага
- [ ] Демо-аккаунты перечислены
- [ ] URL-адреса: frontend, backend, Swagger

### Тестовые данные (seed)

- [ ] 1 организация
- [ ] 2–3 тренера
- [ ] 3–4 группы с расписанием
- [ ] 10–15 спортсменов с родителями
- [ ] Платежи: часть оплачены, часть долги
- [ ] Медсправки: часть действуют, часть истекают, часть просрочены
- [ ] 1–2 соревнования с результатами
- [ ] Записи прогресса по нескольким спортсменам

### Demo-flow проходит без ошибок

- [ ] Все 9 шагов demo-flow пройдены без сбоев
- [ ] Один человек в команде уверенно проводит демо за 4–5 минут
- [ ] Есть ответы на 6 типовых вопросов жюри (см. блок Агента 9)

---

*SportPass CRM — цифровой паспорт спортсмена для детских секций и клубов*
