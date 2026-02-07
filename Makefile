.PHONY: help dev up down build logs restart clean db-migrate db-backup db-restore

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started!"
	@echo "📊 View logs: make logs"
	@echo "🌐 Backend: http://localhost:3000"
	@echo "📚 Swagger: http://localhost:3000/api/docs"

up: ## Start production environment
	docker-compose up -d --build
	@echo "✅ Production environment started!"

down: ## Stop all services
	docker-compose -f docker-compose.dev.yml down
	docker-compose down
	@echo "✅ All services stopped"

build: ## Build Docker images
	docker-compose build
	@echo "✅ Images built successfully"

logs: ## View backend logs
	docker-compose -f docker-compose.dev.yml logs -f backend

logs-all: ## View all service logs
	docker-compose -f docker-compose.dev.yml logs -f

restart: ## Restart backend service
	docker-compose -f docker-compose.dev.yml restart backend
	@echo "✅ Backend restarted"

install-backend: ## Run npm install inside backend container (no host Node needed)
	docker-compose -f docker-compose.dev.yml run --rm backend npm install
	@echo "✅ Backend dependencies installed"

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose down -v
	@echo "✅ All containers and volumes removed"

db-migrate: ## Run database migrations (TypeORM – slower)
	docker-compose -f docker-compose.dev.yml exec backend npm run migration:run

DB_NAME ?= t_plat

db-drop: ## Drop database (terminates connections then drops)
	@docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(DB_NAME)' AND pid <> pg_backend_pid();" 2>/dev/null || true
	@docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $(DB_NAME);"
	@echo "✅ Database $(DB_NAME) dropped"

db-create: ## Create database
	@docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d postgres -c "CREATE DATABASE $(DB_NAME);"
	@echo "✅ Database $(DB_NAME) created"

db-reset: ## Drop + create in one psql session (fewer round-trips)
	@docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(DB_NAME)' AND pid <> pg_backend_pid();" 2>/dev/null || true
	@docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS $(DB_NAME);" -c "CREATE DATABASE $(DB_NAME);"
	@echo "✅ Database $(DB_NAME) reset"

db-schema: ## Create all tables (run once on empty DB; fast)
	@cat database/database-schema.sql | docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d $(DB_NAME)
	@echo "✅ Base schema applied"

db-migrate-sql: ## Run raw SQL migrations 001+002+003 in one connection
	@cat database/migrations/001-add-events-missing-columns.sql database/migrations/002-add-oauth-user-columns.sql database/migrations/003-event-advertising-columns.sql | docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d $(DB_NAME)
	@echo "✅ SQL migrations (001–003) applied"

db-seed-events: ## Seed dummy events via Docker (run after db-schema + db-migrate-sql)
	docker-compose -f docker-compose.dev.yml run --rm --entrypoint "" backend node scripts/seed-events-sql.js
	@echo "✅ Dummy events seeded"

db-migrate-seed: db-migrate-sql db-seed-events ## Apply SQL migrations and seed events (fast path; requires db-schema first)

db-bootstrap: db-schema db-migrate-sql db-seed-events ## From empty DB: create tables, run migrations, seed events (run once)

db-fresh: db-reset db-schema db-migrate-sql db-seed-events ## Reset DB, schema, migrations, seed (single command; most efficient)

db-backup: ## Backup database
	docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres $(DB_NAME) > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up"

db-restore: ## Restore database (usage: make db-restore FILE=backup.sql)
	docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres $(DB_NAME) < $(FILE)
	@echo "✅ Database restored"

db-verify-organizers: ## Set all pending Plat Pro organizer profiles to verified
	@cat database/scripts/verify-all-organizers.sql | docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres -d $(DB_NAME)
	@echo "✅ All pending organizer profiles set to verified"

db-shell: ## Access PostgreSQL shell
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d $(DB_NAME)

test: ## Run tests in backend
	docker-compose -f docker-compose.dev.yml exec backend npm test

lint: ## Run linter in backend
	docker-compose -f docker-compose.dev.yml exec backend npm run lint

status: ## Show service status
	docker-compose -f docker-compose.dev.yml ps
