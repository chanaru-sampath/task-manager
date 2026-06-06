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