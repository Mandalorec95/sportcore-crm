# SportPass CRM

SportPass CRM - CRM-система для детской спортивной секции или клуба. Проект помогает вести базу спортсменов, тренеров, родителей и групп, контролировать тренировки, посещаемость, платежи, медицинские документы, соревнования и прогресс спортсменов.

Проект состоит из frontend-приложения на Next.js и backend API на NestJS. Данные хранятся в PostgreSQL, работа с базой идет через Prisma. Для запуска подготовлен Docker Compose, поэтому проект можно быстро поднять локально или на VPS.

## Основные возможности

- авторизация и роли: администратор, тренер, родитель;
- карточки спортсменов и цифровой спортивный паспорт;
- управление группами, расписанием и тренировками;
- учет посещаемости;
- платежи, статусы оплат и список должников;
- медицинские документы и контроль срока действия справок;
- соревнования, результаты и согласования;
- прогресс спортсменов, задачи, уведомления и API-ключи;
- Swagger-документация backend API.

## Стек

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS;
- Backend: NestJS 11, TypeScript, JWT, Swagger;
- Database: PostgreSQL 16;
- ORM: Prisma 7;
- Инфраструктура: Docker, Docker Compose.

## Структура

```text
sportcore-crm/
├── backend/             # NestJS API, Prisma, seed-данные
├── frontend/            # Next.js интерфейс
├── docker-compose.yml   # PostgreSQL, backend, frontend
├── start.sh             # скрипт управления Docker-запуском
├── Makefile             # вспомогательные команды
└── README.md
```

## Быстрый запуск локально

Требования:

- Docker 20.10+;
- Docker Compose;
- 4 GB RAM или больше.

```bash
git clone https://github.com/Mandalorec95/sportcore-crm.git
cd sportcore-crm
chmod +x start.sh
./start.sh up
```

После запуска:

| Сервис | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/docs |
| Health check | http://localhost:4000/api/v1/health |

Демо-аккаунты:

| Роль | Email | Пароль |
| --- | --- | --- |
| Администратор | admin@sportcrm.ru | demo123 |
| Тренер | coach@sportcrm.ru | demo123 |
| Родитель | parent@sportcrm.ru | demo123 |

Полезные команды:

```bash
./start.sh up              # запустить проект
./start.sh rebuild         # пересобрать образы и запустить
./start.sh down            # остановить контейнеры
./start.sh restart         # перезапустить сервисы
./start.sh logs            # логи всех сервисов
./start.sh logs backend    # логи backend
./start.sh shell           # shell backend-контейнера
./start.sh db-shell        # psql внутри PostgreSQL
./start.sh clean           # удалить контейнеры и volumes
```

Если на сервере доступна только новая команда Compose, можно использовать `docker compose ...` напрямую вместо `./start.sh`.

## Локальная разработка без Docker

Backend:

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run seed
npm run start:dev
```

Frontend в отдельном терминале:

```bash
cd frontend
npm install
npm run dev
```

Пример `backend/.env`:

```env
DATABASE_URL=postgresql://sportpass:sportpass_pass@localhost:5432/sportpass_crm
JWT_SECRET=change-me-to-a-long-random-secret
JWT_EXPIRES_IN=7d
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
```

## Деплой на VPS

Пример ниже рассчитан на Ubuntu 22.04/24.04. Для небольшого проекта достаточно VPS от 2 CPU, 4 GB RAM и 20 GB SSD.

### Автоматический деплой

На чистом сервере можно скачать и запустить deploy-скрипт:

```bash
curl -fsSL https://raw.githubusercontent.com/Mandalorec95/sportcore-crm/main/deploy-vps.sh -o deploy-vps.sh
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

Скрипт спросит домен или поддомен, установит Docker/Nginx, скачает проект, создаст `.env`, запустит контейнеры, настроит Nginx и предложит выпустить HTTPS-сертификат Let's Encrypt.

### 1. Подготовить сервер

```bash
ssh root@SERVER_IP

apt update && apt upgrade -y
apt install -y git curl ca-certificates ufw nginx
curl -fsSL https://get.docker.com | sh

docker --version
docker compose version
```

Откройте SSH, HTTP и HTTPS:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Загрузить проект

```bash
cd /opt
git clone https://github.com/Mandalorec95/sportcore-crm.git
cd sportcore-crm
```

Для приватного репозитория заранее настройте SSH-ключ или deploy key.

### 3. Настроить окружение

Создайте `.env` в корне проекта:

```bash
nano .env
```

Пример для production:

```env
NODE_ENV=production
JWT_SECRET=replace-with-long-random-secret-min-32-chars
ALLOWED_ORIGINS=https://crm.example.com
NEXT_PUBLIC_API_URL=/api/v1
```

Важно: в `docker-compose.yml` сейчас указаны демо-значения PostgreSQL:

```text
POSTGRES_USER=sportpass
POSTGRES_PASSWORD=sportpass_pass
POSTGRES_DB=sportpass_crm
```

На боевом сервере замените пароль БД в сервисе `postgres` и в `DATABASE_URL` сервиса `backend`. Также лучше убрать публикацию порта `5432`, если внешний доступ к базе не нужен.

### 4. Запустить контейнеры

```bash
docker compose up -d --build
docker compose ps
```

Backend при старте применяет схему Prisma. Чтобы добавить демо-данные:

```bash
docker compose exec backend npx ts-node prisma/seed.ts
```

Проверка backend:

```bash
curl http://127.0.0.1:4000/api/v1/health
```

### 5. Настроить Nginx

Создайте файл:

```bash
nano /etc/nginx/sites-available/sportpass-crm
```

Конфиг для домена `crm.example.com`:

```nginx
server {
    listen 80;
    server_name crm.example.com;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:4000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте сайт:

```bash
ln -s /etc/nginx/sites-available/sportpass-crm /etc/nginx/sites-enabled/sportpass-crm
nginx -t
systemctl reload nginx
```

### 6. Подключить HTTPS

Когда домен уже направлен на IP сервера:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d crm.example.com
```

После этого приложение будет доступно по адресу:

```text
https://crm.example.com
```

## Обновление на VPS

```bash
cd /opt/sportcore-crm
git pull
docker compose up -d --build
docker compose ps
```

## Обслуживание

```bash
docker compose ps                  # статус контейнеров
docker compose logs -f             # все логи
docker compose logs -f backend     # логи backend
docker compose restart             # перезапуск
docker compose down                # остановка
```

Backup базы:

```bash
docker compose exec postgres pg_dump -U sportpass sportpass_crm > backup.sql
```

Восстановление:

```bash
docker compose exec -T postgres psql -U sportpass sportpass_crm < backup.sql
```

## Production-чеклист

- заменить `JWT_SECRET` на длинную случайную строку;
- указать реальный домен в `ALLOWED_ORIGINS`;
- сменить стандартный пароль PostgreSQL;
- убрать внешний доступ к PostgreSQL, если он не нужен;
- не коммитить `.env`;
- настроить регулярные backup базы;
- после первого входа заменить демо-пароли пользователей.
