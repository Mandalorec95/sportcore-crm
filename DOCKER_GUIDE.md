# 🐳 Docker запуск SportPass CRM

## Быстрый старт (30 секунд)

```bash
# 1. Клонировать проект
git clone https://github.com/Mandalorec95/sportcore-crm.git
cd sportcore-crm

# 2. Запустить скрипт (все будет автоматически)
chmod +x start.sh
./start.sh up

# 3. Открыть в браузере
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/docs
```

**Готово! 🎉**

---

## 📊 Архитектура Docker

```
┌─────────────────────────────────────────┐
│          Docker Network                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │   │
│  │ Next.js 3000 │  │  NestJS 4000 │   │
│  │              │  │              │   │
│  └──────────────┘  └──────────────┘   │
│                         │              │
│                    ┌────▼─────┐        │
│                    │ PostgreSQL│        │
│                    │   5432    │        │
│                    └───────────┘        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🛠️ Команды управления

### Основные команды

| Команда | Описание |
|---------|---------|
| `./start.sh up` | Запустить все сервисы |
| `./start.sh down` | Остановить сервисы |
| `./start.sh restart` | Перезагрузить сервисы |
| `./start.sh clean` | Удалить контейнеры и данные |

### Просмотр логов

```bash
./start.sh logs              # Все логи в реальном времени
./start.sh logs backend      # Только backend
./start.sh logs frontend     # Только frontend
./start.sh logs postgres     # Только БД

# Или используйте docker-compose напрямую
docker-compose logs -f
```

### Работа с контейнерами

```bash
# Shell в контейнере backend
./start.sh shell
# docker-compose exec backend sh

# PostgreSQL консоль
./start.sh db-shell
# docker-compose exec postgres psql -U sportpass -d sportpass_crm

# Запустить команду в контейнере
docker-compose exec backend npm run seed
docker-compose exec backend npm run build
```

### Просмотр файлов логов

```bash
# Файлы логов сохраняются на хосте
ls -la backend/logs/
tail -f backend/logs/info.log
tail -f backend/logs/error.log
```

---

## 📦 Что запускается

### Контейнеры

1. **PostgreSQL** (5432)
   - База данных для всего приложения
   - Данные сохраняются в томе `postgres_data`
   - Логи в томе `postgres_logs`

2. **Backend** (4000)
   - NestJS API сервер
   - Логи в `./backend/logs`
   - Автоматические миграции при старте
   - Health check на `/api/v1/health`

3. **Frontend** (3000)
   - Next.js приложение
   - Подключается к Backend API
   - Hot reload в development режиме

---

## 🌍 Переменные окружения

Все переменные берутся из `backend/.env` (автоматически создается из `.env.example`):

```env
# Database
DATABASE_URL=postgresql://sportpass:sportpass_pass@postgres:5432/sportpass_crm

# JWT
JWT_SECRET=sportpass_jwt_secret_hackathon_2026_min_32_chars_required!

# Server
PORT=4000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000

# Logging
LOG_DIR=/app/logs
```

### Изменение переменных

1. Отредактируйте `backend/.env`
2. Перезагрузите: `./start.sh restart`

---

## 📍 Доступные URL'ы

| Сервис | URL | Описание |
|--------|-----|---------|
| Frontend | http://localhost:3000 | Веб-приложение |
| Backend API | http://localhost:4000/api/v1 | REST API |
| Swagger | http://localhost:4000/docs | API документация |
| Health | http://localhost:4000/api/v1/health | Проверка здоровья |
| PostgreSQL | localhost:5432 | База данных |

---

## 👥 Демо аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@sportcrm.ru | demo123 |
| Coach | coach@sportcrm.ru | demo123 |
| Parent | parent@sportcrm.ru | demo123 |

---

## 🐛 Решение проблем

### Проблема: Порты уже заняты

```bash
# Проверить какие процессы используют порты
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Убить процесс
kill -9 <PID>

# Или просто переднать порты в docker-compose.yml
# ports:
#   - "3001:3000"  # Вместо 3000
```

### Проблема: Docker не запускается

```bash
# Проверить статус Docker
docker ps

# Перезагрузить Docker daemon
sudo systemctl restart docker

# Проверить logs
docker logs sportpass_backend
docker logs sportpass_frontend
docker logs sportpass_db
```

### Проблема: БД не подключается

```bash
# Проверить что PostrgeSQL готов
docker-compose ps postgres

# Посмотреть логи БД
./start.sh logs postgres

# Переподключиться
docker-compose restart postgres
```

### Проблема: Frontend не видит Backend

```bash
# Проверить что backend работает
curl http://localhost:4000/api/v1/health

# Посмотреть CORS логи
./start.sh logs backend

# Проверить ALLOWED_ORIGINS в backend/.env
```

---

## 🔄 Жизненный цикл

### Первый запуск
```bash
./start.sh up
# 1. Проверит Docker установку
# 2. Создаст backend/.env
# 3. Соберет образы
# 4. Запустит контейнеры
# 5. Подготовит БД
# 6. Покажет информацию
```

### Рабочий цикл
```bash
# Разработка
./start.sh logs backend    # Смотреть логи

# Тестирование API
open http://localhost:4000/docs

# Проверка frontend
open http://localhost:3000
```

### Остановка
```bash
./start.sh down        # Остановить контейнеры
                       # Данные сохраняются в томах

./start.sh clean       # Удалить все (потеря данных!)
```

---

## 📊 Логирование

### Структура логов

```
backend/logs/
├── info.log        # Информационные события
├── error.log       # Ошибки и исключения
├── warn.log        # Предупреждения
└── debug.log       # Debug информация (dev only)
```

### Примеры логирования

```typescript
// В NestJS сервисах
this.logger.log('User created', userId);
this.logger.warn('Deprecated API call', endpoint);
this.logger.error('Database connection failed', error);

// Автоматическое логирование HTTP
[2024-06-15T10:30:45.123Z] [INFO] [HttpLogger] GET /api/v1/athletes - 200 - 45ms
[2024-06-15T10:30:50.456Z] [WARN] [HttpLogger] POST /api/v1/payments - 400 - 12ms
[2024-06-15T10:31:00.789Z] [ERROR] [HttpLogger] GET /api/v1/notfound - 404 - 2ms
```

### Просмотр в реальном времени

```bash
# Все логи
docker-compose logs -f

# Только backend
./start.sh logs backend

# Только последние 100 строк
docker-compose logs --tail=100

# Отследить ошибки
tail -f backend/logs/error.log
```

---

## 💾 Управление данными

### Резервная копия БД

```bash
# Экспортировать данные
docker-compose exec postgres pg_dump -U sportpass sportpass_crm > backup.sql

# Восстановить из резервной копии
docker-compose exec -T postgres psql -U sportpass sportpass_crm < backup.sql
```

### Полная переустановка БД

```bash
# Удалить данные
./start.sh clean

# Заново запустить (пересоздаст БД)
./start.sh up
```

### Доступ к БД напрямую

```bash
./start.sh db-shell

# Примеры команд SQL
\dt                          # Список таблиц
SELECT * FROM users;         # Посмотреть пользователей
SELECT COUNT(*) FROM athletes; # Количество спортсменов
```

---

## 🚀 Production подготовка

### Пред-деплой

```bash
# 1. Обновить переменные
cp backend/.env.example backend/.env
# Отредактировать:
# - JWT_SECRET на сильное значение (32+ символа)
# - ALLOWED_ORIGINS на ваши домены
# - NODE_ENV=production
# - Сильный пароль БД

# 2. Запустить
./start.sh up

# 3. Проверить
curl https://your-domain.com/api/v1/health
```

### Мониторинг

```bash
# Проверить ресурсы
docker stats

# Просмотреть логи ошибок
tail -f backend/logs/error.log

# Health checks
docker-compose ps  # Должны быть healthy
```

---

## 📚 Дополнительно

- [Docker документация](https://docs.docker.com/)
- [Docker Compose справка](https://docs.docker.com/compose/compose-file/)
- [NestJS логирование](https://docs.nestjs.com/techniques/logger)
- [Prisma миграции](https://www.prisma.io/docs/concepts/components/prisma-migrate)
