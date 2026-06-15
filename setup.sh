#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

log "SportPass CRM — установка"

# --- 1. Проверка зависимостей ---
command -v node >/dev/null 2>&1 || err "Node.js не найден. Установите Node.js 18+"
command -v npm  >/dev/null 2>&1 || err "npm не найден"

NODE_VER=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
[ "$NODE_VER" -ge 18 ] || err "Нужен Node.js 18+. Текущая версия: $(node -v)"

# --- 2. PostgreSQL ---
if command -v pg_isready >/dev/null 2>&1 && pg_isready -q; then
  log "PostgreSQL уже запущен"
elif command -v docker >/dev/null 2>&1; then
  log "Запуск PostgreSQL через Docker..."
  docker run -d --name sportpass-db \
    -e POSTGRES_USER=sportpass \
    -e POSTGRES_PASSWORD=sportpass_pass \
    -e POSTGRES_DB=sportpass_crm \
    -p 5432:5432 \
    --restart unless-stopped \
    postgres:16-alpine
  log "Ожидание запуска PostgreSQL..."
  sleep 5
else
  warn "PostgreSQL не найден и Docker недоступен."
  warn "Установите PostgreSQL вручную и создайте БД:"
  warn "  createuser -P sportpass"
  warn "  createdb -O sportpass sportpass_crm"
  warn "Затем запустите: ./setup.sh"
  exit 1
fi

# --- 3. .env файл ---
if [ ! -f backend/.env ]; then
  log "Создание backend/.env..."
  cp .env.example backend/.env
  warn "Проверьте backend/.env и при необходимости измените DATABASE_URL, JWT_SECRET"
else
  log "backend/.env уже существует — пропускаем"
fi

# --- 4. Backend ---
log "Установка зависимостей backend..."
cd backend
npm install --legacy-peer-deps

log "Генерация Prisma client..."
npx prisma generate

log "Применение схемы к базе данных..."
npx prisma db push

log "Сборка backend..."
npm run build

# --- 5. Seed ---
log "Заполнение тестовыми данными..."
npm run seed && log "Seed выполнен" || warn "Seed пропущен (данные уже есть)"

cd ..

# --- 6. Frontend ---
log "Установка зависимостей frontend..."
cd frontend
npm install --legacy-peer-deps

log "Сборка frontend..."
npm run build

cd ..

log ""
log "======================================="
log " Установка завершена!"
log "======================================="
log ""
log " Запуск:"
log "   make start          — запустить оба сервера"
log "   make start-backend  — только backend"
log "   make start-frontend — только frontend"
log ""
log " После запуска:"
log "   Backend:  http://localhost:4000"
log "   Frontend: http://localhost:3000"
log "   Swagger:  http://localhost:4000/docs"
log ""
log " Демо-аккаунты:"
log "   admin@sportcrm.ru   / demo123"
log "   coach@sportcrm.ru   / demo123"
log "   parent@sportcrm.ru  / demo123"
log ""
