## help: Show usage
.PHONY: help
help:
	@echo "Usage:"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

 # Internal: confirm prompts for interactive confirmation.
 # This target is intentionally undocumented so it won't appear in make help.
.PHONY: confirm
confirm:
	@echo -n 'Are you sure? [y/N] ' && read ans && [ $${ans:-N} = y ]

## frontend-build: Build the frontend application
.PHONY: frontend-build
frontend-build:
	@echo "🛠️  Building frontend $(APP_NAME)..."
	cd frontend && pnpm run build

## frontend-dev: Start frontend dev server
.PHONY: frontend-dev
frontend-dev:
	@echo "🚀 Starting frontend dev server..."
	cd frontend && pnpm run dev

## frontend-clean: Cleanup frontend build codes
.PHONY: frontend-clean
frontend-clean: confirm
	@echo "Cleaning up frontend..."
	@rm -rf frontend/dist
	@echo "✅ Frontend cleanup complete."

## frontend-format: Format frontend code
.PHONY: frontend-format
frontend-format:
	@echo "🚀 Formatting frontend code..."
	cd frontend && pnpm run format

## frontend-lint: Lint frontend code
.PHONY: frontend-lint
frontend-lint:
	@echo "🚀 Linting frontend code..."
	cd frontend && pnpm run lint

## frontend-typecheck: Typecheck frontend code
.PHONY: frontend-typecheck
frontend-typecheck:
	@echo "🚀 Typechecking frontend code..."
	cd frontend && pnpm run typecheck

## frontend-preview: Preview frontend application
.PHONY: frontend-preview
frontend-preview:
	@echo "🚀 Previewing frontend application"
	cd frontend && pnpm run preview

## frontend-test: Test frontend application
.PHONY: frontend-test
frontend-test:
	@echo "🚀 Testing frontend application"
	cd frontend && pnpm run test

## frontend-test-watch: Test frontend application in watch mode
.PHONY: frontend-test-watch
frontend-test-watch:
	@echo "🚀 Testing frontend application in watch mode"
	cd frontend && pnpm run test:watch

## frontend-knip: Detect unused files
.PHONY: frontend-knip
frontend-knip:
	@echo "🚀 Detecting unused files..."
	cd frontend && pnpm run knip

## backend-dev: Start backend dev server
.PHONY: backend-dev
backend-dev:
	@echo "🚀 Starting backend dev server..."
	cd backend && pnpm run dev

## backend-build: Build the backend application
.PHONY: backend-build
backend-build:
	@echo "🛠️  Building backend..."
	cd backend && pnpm run build

## backend-start: Start the built backend application
.PHONY: backend-start
backend-start:
	@echo "🚀 Starting backend..."
	cd backend && pnpm run start

## backend-clean: Cleanup backend build codes
.PHONY: backend-clean
backend-clean: confirm
	@echo "Cleaning up backend..."
	@rm -rf backend/dist
	@echo "✅ Backend cleanup complete."

## backend-db-generate: Generate Drizzle migration files
.PHONY: backend-db-generate
backend-db-generate:
	@echo "🛠️  Generating database migrations..."
	cd backend && pnpm run db:generate

## backend-db-migrate: Apply Drizzle migrations to the database
.PHONY: backend-db-migrate
backend-db-migrate:
	@echo "🚀 Applying database migrations..."
	cd backend && pnpm run db:migrate

## backend-db-studio: Open Drizzle Studio for the database
.PHONY: backend-db-studio
backend-db-studio:
	@echo "🚀 Opening Drizzle Studio..."
	cd backend && pnpm run db:studio