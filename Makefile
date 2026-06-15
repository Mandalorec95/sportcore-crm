.PHONY: setup start stop start-backend start-frontend seed \
        up down restart logs logs-backend logs-frontend \
        build db-shell status migrate

# ── Локальный запуск (без Docker) ───────────────────────────────────────────

setup:
	@bash setup.sh

start: start-backend start-frontend
	@echo "Backend:  http://localhost:4000"
	@echo "Frontend: http://localhost:3000"
	@echo "Swagger:  http://localhost:4000/docs"

start-backend:
	@echo "Запуск backend..."
	@cd backend && node dist/src/main > /tmp/sportpass-backend.log 2>&1 & \
	  echo "Backend PID: $$!"
	@sleep 3
	@curl -s http://localhost:4000/api/v1/health > /dev/null && \
	  echo "Backend запущен" || echo "Backend не отвечает — проверьте /tmp/sportpass-backend.log"

start-frontend:
	@echo "Запуск frontend..."
	@cd frontend && PORT=3000 node .next/standalone/server.js > /tmp/sportpass-frontend.log 2>&1 & \
	  echo "Frontend PID: $$!"
	@sleep 3
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q 200 && \
	  echo "Frontend запущен" || echo "Frontend не отвечает — проверьте /tmp/sportpass-frontend.log"

stop:
	@lsof -ti:4000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "Серверы остановлены"

seed:
	@cd backend && npm run seed

logs-backend:
	@tail -f /tmp/sportpass-backend.log

logs-frontend:
	@tail -f /tmp/sportpass-frontend.log

# ── Docker Compose ───────────────────────────────────────────────────────────

up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose down && docker compose up -d --build

logs:
	docker compose logs -f

logs-docker-backend:
	docker compose logs -f backend

logs-docker-frontend:
	docker compose logs -f frontend

build:
	docker compose build --no-cache

status:
	docker compose ps

# ── База данных ──────────────────────────────────────────────────────────────

migrate:
	@cd backend && npx prisma db push

db-shell:
	@psql "$$DATABASE_URL" 2>/dev/null || \
	  docker compose exec postgres psql -U sportpass -d sportpass_crm 2>/dev/null || \
	  echo "Укажите DATABASE_URL или используйте Docker"
