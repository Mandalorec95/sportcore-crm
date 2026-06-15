#!/usr/bin/env bash

set -euo pipefail

APP_NAME="sportpass-crm"
DEFAULT_REPO_URL="https://github.com/Mandalorec95/sportcore-crm.git"
DEFAULT_INSTALL_DIR="/opt/sportcore-crm"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
info() { echo -e "${BLUE}[info]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
fail() { echo -e "${RED}[error]${NC} $1"; exit 1; }

require_root() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    fail "Запустите скрипт от root: sudo bash deploy-vps.sh"
  fi
}

ask() {
  local prompt="$1"
  local default_value="${2:-}"
  local value

  if [ -n "$default_value" ]; then
    read -r -p "$prompt [$default_value]: " value
    echo "${value:-$default_value}"
  else
    read -r -p "$prompt: " value
    echo "$value"
  fi
}

ask_yes_no() {
  local prompt="$1"
  local default_value="${2:-y}"
  local value

  read -r -p "$prompt [$default_value]: " value
  value="${value:-$default_value}"
  case "$value" in
    y|Y|yes|YES|д|Д|да|Да) return 0 ;;
    *) return 1 ;;
  esac
}

validate_domain() {
  local domain="$1"
  if [[ ! "$domain" =~ ^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]]; then
    fail "Некорректный домен: $domain"
  fi
}

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    fail "Docker Compose не найден"
  fi
}

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    date +%s%N | sha256sum | awk '{print $1}'
  fi
}

install_packages() {
  log "Установка системных пакетов"

  apt-get update
  apt-get install -y git curl ca-certificates nginx ufw openssl

  if ! command -v docker >/dev/null 2>&1; then
    log "Установка Docker"
    curl -fsSL https://get.docker.com | sh
  else
    info "Docker уже установлен: $(docker --version)"
  fi

  systemctl enable --now docker
  systemctl enable --now nginx
}

prepare_project() {
  local repo_url="$1"
  local install_dir="$2"

  if [ -f "docker-compose.yml" ] && [ -d "backend" ] && [ -d "frontend" ]; then
    PROJECT_DIR="$(pwd)"
    log "Используется текущая папка проекта: $PROJECT_DIR"
    return
  fi

  if [ -d "$install_dir/.git" ]; then
    PROJECT_DIR="$install_dir"
    log "Проект уже есть в $PROJECT_DIR, обновляю репозиторий"
    git -C "$PROJECT_DIR" pull
    return
  fi

  log "Клонирование проекта в $install_dir"
  git clone "$repo_url" "$install_dir"
  PROJECT_DIR="$install_dir"
}

write_env() {
  local domain="$1"
  local env_file="$PROJECT_DIR/.env"

  if [ -f "$env_file" ]; then
    warn "Файл $env_file уже существует"
    if ! ask_yes_no "Перезаписать домен и JWT_SECRET в .env?" "n"; then
      return
    fi
  fi

  cat > "$env_file" <<EOF
NODE_ENV=production
JWT_SECRET=$(random_secret)
ALLOWED_ORIGINS=https://$domain,http://$domain
NEXT_PUBLIC_API_URL=/api/v1
EOF

  chmod 600 "$env_file"
  log "Создан $env_file"
}

bind_compose_ports_to_localhost() {
  local compose_file="$PROJECT_DIR/docker-compose.yml"

  if [ ! -f "$compose_file" ]; then
    fail "Не найден $compose_file"
  fi

  log "Ограничение Docker-портов localhost для работы через Nginx"
  sed -i \
    -e 's/"5432:5432"/"127.0.0.1:5432:5432"/' \
    -e 's/"4000:4000"/"127.0.0.1:4000:4000"/' \
    -e 's/"3000:3000"/"127.0.0.1:3000:3000"/' \
    "$compose_file"
}

start_app() {
  local compose
  compose="$(compose_cmd)"

  log "Сборка и запуск Docker-контейнеров"
  cd "$PROJECT_DIR"
  $compose up -d --build
  $compose ps

  log "Проверка backend healthcheck"
  for i in $(seq 1 60); do
    if curl -fsS http://127.0.0.1:4000/api/v1/health >/dev/null 2>&1; then
      log "Backend отвечает"
      return
    fi
    sleep 2
  done

  warn "Backend не ответил за 120 секунд. Проверьте логи: cd $PROJECT_DIR && $compose logs -f backend"
}

seed_database() {
  local compose
  compose="$(compose_cmd)"

  if ask_yes_no "Заполнить базу демо-данными?" "y"; then
    cd "$PROJECT_DIR"
    $compose exec -T backend npx ts-node prisma/seed.ts || warn "Seed не выполнен. Возможно, данные уже есть или backend еще стартует."
  fi
}

configure_nginx() {
  local domain="$1"
  local config_file="/etc/nginx/sites-available/$APP_NAME"
  local enabled_file="/etc/nginx/sites-enabled/$APP_NAME"

  log "Настройка Nginx для домена $domain"

  cat > "$config_file" <<EOF
server {
    listen 80;
    server_name $domain;

    client_max_body_size 20m;

    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:4000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs-json {
        proxy_pass http://127.0.0.1:4000/docs-json;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  ln -sfn "$config_file" "$enabled_file"
  nginx -t
  systemctl reload nginx
  log "Nginx настроен"
}

configure_firewall() {
  if ! command -v ufw >/dev/null 2>&1; then
    return
  fi

  log "Настройка UFW"
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
}

configure_https() {
  local domain="$1"

  if ! ask_yes_no "Выпустить HTTPS-сертификат Let's Encrypt для $domain?" "y"; then
    warn "HTTPS пропущен. Сайт будет доступен по http://$domain"
    return
  fi

  local email
  email="$(ask "Email для Let's Encrypt")"
  if [ -z "$email" ]; then
    fail "Email обязателен для выпуска сертификата"
  fi

  log "Установка Certbot и выпуск сертификата"
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$domain" --non-interactive --agree-tos -m "$email" --redirect
  systemctl reload nginx
}

print_result() {
  local domain="$1"
  local compose
  compose="$(compose_cmd)"

  echo ""
  log "Готово"
  echo "Сайт:      https://$domain или http://$domain"
  echo "Swagger:   https://$domain/docs"
  echo "Проект:    $PROJECT_DIR"
  echo ""
  echo "Команды обслуживания:"
  echo "  cd $PROJECT_DIR"
  echo "  $compose ps"
  echo "  $compose logs -f"
  echo "  $compose up -d --build"
  echo ""
  echo "Демо-вход:"
  echo "  admin@sportcrm.ru / demo123"
}

main() {
  require_root

  echo ""
  echo "SportPass CRM VPS deploy"
  echo "Перед запуском направьте A-запись домена или поддомена на IP этого сервера."
  echo ""

  local domain
  local repo_url
  local install_dir

  domain="$(ask "Введите домен или поддомен, например crm.example.com")"
  validate_domain "$domain"

  repo_url="$(ask "URL репозитория" "$DEFAULT_REPO_URL")"
  install_dir="$(ask "Папка установки" "$DEFAULT_INSTALL_DIR")"

  install_packages
  prepare_project "$repo_url" "$install_dir"
  write_env "$domain"
  bind_compose_ports_to_localhost
  configure_firewall
  start_app
  seed_database
  configure_nginx "$domain"
  configure_https "$domain"
  print_result "$domain"
}

main "$@"
