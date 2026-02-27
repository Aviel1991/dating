.PHONY: dev setup backend frontend db-migrate db-seed docker-up docker-down

# Start all services with Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Setup project (install deps + migrate + seed)
setup: install db-migrate db-seed

install:
	cd backend && npm install
	cd frontend && npm install

# Run migrations
db-migrate:
	cd backend && npx prisma migrate dev --name init

# Seed the database
db-seed:
	cd backend && npx ts-node prisma/seed.ts

# Run backend development server
backend:
	cd backend && npm run start:dev

# Run frontend development server
frontend:
	cd frontend && npm run dev

# Run both in parallel (requires tmux or similar)
dev:
	@echo "Starting backend on port 3001 and frontend on port 3000"
	@echo "Backend: npm run start:dev (in backend/)"
	@echo "Frontend: npm run dev (in frontend/)"

# Open Prisma Studio
prisma-studio:
	cd backend && npx prisma studio

# Generate Prisma client
prisma-generate:
	cd backend && npx prisma generate

# Format code
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

# Build for production
build:
	cd backend && npm run build
	cd frontend && npm run build
