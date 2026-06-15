# SportPass CRM

CRM-система для детских спортивных секций с цифровым паспортом спортсмена.

**Стек:** NestJS · TypeScript · PostgreSQL 16 · Prisma 7 · Next.js 16 · Tailwind CSS · Docker

---

## Быстрый старт

### Вариант 1 — Автоматическая установка (рекомендуется)

```bash
git clone https://github.com/Mandalorec95/sportcore-crm.git
cd sportcore-crm
cp .env.example backend/.env        # при необходимости отредактируйте
bash setup.sh                       # установка + сборка
make start                          # запуск обоих серверов
```

> Требования: Node.js 18+, PostgreSQL 16 (или Docker для автозапуска БД)

### Вариант 2 — Docker Compose

```bash
git clone https://github.com/Mandalorec95/sportcore-crm.git
cd sportcore-crm
cp .env.example backend/.env
docker compose up -d --build
docker compose exec backend npm run seed
```

---

## Деплой на чистый сервер (Ubuntu 22.04 / 24.04)

```bash
# 1. Установить зависимости
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql nginx

# 2. Создать базу данных
sudo -u postgres psql -c "CREATE USER sportpass WITH PASSWORD 'sportpass_pass';"
sudo -u postgres psql -c "CREATE DATABASE sportpass_crm OWNER sportpass;"
sudo service postgresql start

# 3. Клонировать и установить проект
git clone https://github.com/Mandalorec95/sportcore-crm.git
cd sportcore-crm
cp .env.example backend/.env
# Отредактируйте backend/.env если нужно другой пароль/порт
bash setup.sh

# 4. Запустить
make start

# 5. (Опционально) Настроить nginx как reverse proxy
sudo cp docs/nginx.conf /etc/nginx/sites-available/sportpass
sudo ln -s /etc/nginx/sites-available/sportpass /etc/nginx/sites-enabled/
sudo nginx -t && sudo service nginx reload
```

---

## Адреса после запуска

| Сервис | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Swagger / API Docs | http://localhost:4000/docs |
| Health check | http://localhost:4000/api/v1/health |

---

## Демо-аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Администратор | admin@sportcrm.ru | demo123 |
| Тренер | coach@sportcrm.ru | demo123 |
| Родитель | parent@sportcrm.ru | demo123 |

---

## Переменные окружения

Файл `backend/.env` (скопируйте из `.env.example`):

```env
DATABASE_URL=postgresql://sportpass:sportpass_pass@localhost:5432/sportpass_crm
JWT_SECRET=замените_на_случайную_строку
JWT_EXPIRES_IN=7d
PORT=4000
```

> **Важно:** смените `JWT_SECRET` на production сервере!

---

## Команды

```bash
make setup           # Полная установка (npm install + build + seed)
make start           # Запустить backend + frontend
make stop            # Остановить серверы
make seed            # Заполнить тестовыми данными
make logs-backend    # Логи backend
make logs-frontend   # Логи frontend

# Docker
make up              # docker compose up
make down            # docker compose down
make status          # статус контейнеров
```

---

## Публичный API

Авторизация через заголовок: `X-API-Key: <ключ>`

API-ключ создаётся в разделе «API / Интеграции» интерфейса.

```bash
# Пример запроса
curl -H "X-API-Key: sk_live_demo_..." \
  http://localhost:4000/api/v1/public/v1/athletes/ath-001
```

Полная документация: http://localhost:4000/docs

---

## Возможности системы

### Цифровой паспорт спортсмена
`GET /api/v1/athletes/:id/sport-passport`
- Посещаемость, оплаты, медсправки, соревнования, прогресс
- Оценка риска оттока (0–100)
- Готовность к соревнованиям (0–100)

### Роли пользователей
| Роль | Доступ |
|---|---|
| Администратор | Полный: спортсмены, группы, оплаты, документы, API-ключи |
| Тренер | Свои группы, посещаемость, прогресс, соревнования |
| Родитель | Только свой ребёнок: расписание, оплата, прогресс |

### Структура проекта
```
sportcore-crm/
├── backend/          # NestJS API (порт 4000)
│   ├── prisma/       # Схема БД + seed
│   └── src/
│       ├── athletes/        # Спортсмены
│       ├── groups/          # Группы
│       ├── attendance/      # Посещаемость
│       ├── payments/        # Оплаты
│       ├── medical-documents/
│       ├── competitions/    # Соревнования
│       ├── progress/        # Прогресс
│       ├── notifications/   # Уведомления
│       ├── analytics/       # Дашборд
│       ├── public-api/      # Публичный API
│       └── auth/            # JWT авторизация
├── frontend/         # Next.js (порт 3000)
│   └── app/
│       ├── athletes/
│       ├── groups/
│       ├── attendance/
│       ├── payments/
│       ├── documents/
│       ├── competitions/
│       ├── notifications/
│       └── dashboard/
├── docker-compose.yml
├── Makefile
├── setup.sh
└── .env.example
```
