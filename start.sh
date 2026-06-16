#!/bin/bash

# SportPass CRM Docker Startup Script
# Этот скрипт упрощает запуск проекта через Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
check_docker() {
  print_header "Checking Docker Installation"
  
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
  fi
  print_success "Docker is installed: $(docker --version)"
  
  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
  fi
  print_success "Docker Compose is installed: $(docker-compose --version)"
}

# Check if .env file exists
check_env() {
  print_header "Checking Environment Configuration"
  
  if [ ! -f "backend/.env" ]; then
    print_info "Creating backend/.env from .env.example"
    cp backend/.env.example backend/.env
    print_success "backend/.env created"
    print_info "Please update backend/.env with your configuration if needed"
  else
    print_success "backend/.env already exists"
  fi
}

# Build Docker images
build_images() {
  print_header "Building Docker Images"
  docker-compose build
  print_success "Docker images built successfully"
}

# Rebuild Docker images without cache
rebuild_images() {
  print_header "Rebuilding Docker Images (no cache)"
  docker-compose build --no-cache
  print_success "Docker images rebuilt successfully"
}

# Start services
start_services() {
  print_header "Starting Services"
  docker-compose up -d
  print_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
  print_header "Waiting for Services to be Healthy"
  
  # Wait for PostgreSQL
  print_info "Waiting for PostgreSQL..."
  for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U sportpass &> /dev/null; then
      print_success "PostgreSQL is ready"
      break
    fi
    if [ $i -eq 30 ]; then
      print_error "PostgreSQL failed to start"
      exit 1
    fi
    sleep 1
  done
  
  # Wait for Backend
  print_info "Waiting for Backend..."
  for i in {1..30}; do
    if curl -s http://localhost:4000/api/v1/health &> /dev/null; then
      print_success "Backend is ready"
      break
    fi
    if [ $i -eq 30 ]; then
      print_error "Backend failed to start"
      exit 1
    fi
    sleep 1
  done
  
  # Wait for Frontend
  print_info "Waiting for Frontend..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 &> /dev/null; then
      print_success "Frontend is ready"
      break
    fi
    if [ $i -eq 30 ]; then
      print_error "Frontend failed to start"
      exit 1
    fi
    sleep 1
  done
}

# Seed database
seed_database() {
  print_header "Seeding Database"
  print_info "Running database migrations and seeding..."
  docker-compose exec -T backend npx ts-node prisma/seed.ts
  print_success "Database seeded successfully"
}

# Display info
display_info() {
  print_header "🎉 SportPass CRM is Ready!"
  
  echo ""
  echo -e "${GREEN}Services Running:${NC}"
  echo "  📊 Frontend: ${BLUE}http://localhost:3000${NC}"
  echo "  🔌 Backend API: ${BLUE}http://localhost:4000/api/v1${NC}"
  echo "  📚 Swagger Docs: ${BLUE}http://localhost:4000/docs${NC}"
  echo "  🗄️  PostgreSQL: ${BLUE}localhost:5432${NC}"
  echo ""
  
  echo -e "${GREEN}Default Credentials:${NC}"
  echo "  📧 Email: admin@sportcrm.ru"
  echo "  🔑 Password: demo123"
  echo ""
  
  echo -e "${GREEN}Useful Commands:${NC}"
  echo "  View logs: docker-compose logs -f [service_name]"
  echo "  Stop services: docker-compose down"
  echo "  Rebuild: docker-compose up -d --build"
  echo "  Shell: docker-compose exec backend sh"
  echo ""
}

# Main script
main() {
  case "${1:-up}" in
    up)
      check_docker
      check_env
      print_info "Building and starting services..."
      build_images
      start_services
      wait_for_services
      seed_database
      display_info
      ;;

    rebuild)
      check_docker
      check_env
      print_info "Rebuilding and starting services..."
      rebuild_images
      start_services
      wait_for_services
      seed_database
      display_info
      ;;
    
    down)
      print_header "Stopping Services"
      docker-compose down
      print_success "Services stopped"
      ;;
    
    restart)
      print_header "Restarting Services"
      docker-compose restart
      print_success "Services restarted"
      wait_for_services
      display_info
      ;;
    
    logs)
      docker-compose logs -f ${2:-}
      ;;
    
    clean)
      print_header "Cleaning Up Docker Resources"
      docker-compose down -v
      print_success "All containers and volumes removed"
      ;;
    
    shell)
      docker-compose exec backend sh
      ;;
    
    db-shell)
      docker-compose exec postgres psql -U sportpass -d sportpass_crm
      ;;
    
    *)
      echo -e "${BLUE}SportPass CRM Docker Manager${NC}"
      echo ""
      echo "Usage: $0 [command]"
      echo ""
      echo "Commands:"
      echo "  up           Start services (default)"
      echo "  rebuild      Rebuild images without cache and restart services"
      echo "  down         Stop services"
      echo "  restart      Restart services"
      echo "  logs         View service logs (ex: $0 logs backend)"
      echo "  clean        Remove all containers and volumes"
      echo "  shell        Open backend shell"
      echo "  db-shell     Open PostgreSQL shell"
      echo ""
      ;;
  esac
}

main "$@"
