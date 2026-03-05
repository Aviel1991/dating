# CLAUDE.md — SpeedDating Event Manager

This file provides AI assistants with context about the codebase, conventions, and development workflows.

---

## Project Overview

**SpeedDating Event Manager** is a full-stack Hebrew-language web application for managing speed-dating events end-to-end. It supports event creation, participant registration, on-site check-in, post-event partner selection, mutual match generation, admin review, and participant notifications.

- **Language/locale**: Hebrew (RTL, `lang="he" dir="rtl"`)
- **Monorepo layout**: `backend/` (NestJS API) + `frontend/` (Next.js)

---

## Repository Structure

```
/
├── backend/                    # NestJS REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (source of truth)
│   │   ├── migrations/         # Prisma migration files
│   │   └── seed.ts             # DB seed (admin user + sample event)
│   ├── src/
│   │   ├── main.ts             # Entry point (Swagger, guards, CORS)
│   │   ├── app.module.ts       # Root module
│   │   ├── auth/               # OTP + JWT auth
│   │   ├── events/             # Event CRUD + lifecycle
│   │   ├── registrations/      # Registration review workflow
│   │   ├── participants/       # Approved participant management
│   │   ├── attendances/        # Event check-in
│   │   ├── choices/            # Selection window (partner rating)
│   │   ├── matches/            # Mutual match generation + approval
│   │   ├── notifications/      # SMS + Email dispatch
│   │   ├── storage/            # S3-compatible file upload (presigned URLs)
│   │   ├── audit/              # Admin action audit log
│   │   ├── prisma/             # PrismaService (shared DB client)
│   │   └── common/
│   │       ├── decorators/     # @Public(), @Roles(), @CurrentUser()
│   │       ├── guards/         # JwtAuthGuard, RolesGuard
│   │       └── filters/        # HttpExceptionFilter
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
├── frontend/                   # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout (RTL, Hebrew)
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── auth/login/     # OTP login flow
│   │   │   ├── events/[eventId]/ # Participant event pages
│   │   │   ├── me/             # Personal area (profile photo, my events)
│   │   │   └── admin/          # Admin dashboard (events, registrations, etc.)
│   │   ├── components/
│   │   │   └── admin/EventForm.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # All axios API calls (grouped by domain)
│   │   │   └── auth.ts         # localStorage token helpers
│   │   └── types/index.ts      # Shared TypeScript types (mirrors Prisma schema)
│   ├── .env.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml          # postgres + minio + backend + frontend
├── Makefile                    # Convenience commands
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | NestJS 10 + TypeScript 5 |
| ORM | Prisma 5 + PostgreSQL 15 |
| Auth | JWT (`@nestjs/jwt`) + OTP via SMS |
| File storage | S3-compatible (AWS SDK v2; MinIO in dev) |
| Notifications | SMS (Twilio) + Email (SMTP) |
| API docs | Swagger (`@nestjs/swagger`) at `/api/docs` |
| Frontend framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS 3 |
| Data fetching | Axios + TanStack React Query 5 |
| Forms | React Hook Form 7 + Zod 3 |

---

## Database Schema (Prisma)

Key models and enums in `backend/prisma/schema.prisma`:

### Enums
- `Gender`: `male | female | other`
- `RelationshipStatus`: `single | divorced | widowed | other`
- `EventStatus`: `draft → published → closed → completed | cancelled`
- `RegistrationStatus`: `pending → approved | rejected | waitlisted | cancelled`
- `EligibilityStatus`: `eligible | needs_photo | disabled`
- `AttendanceStatus`: `not_arrived | arrived`
- `MatchType`: `romantic | friend | both`
- `MatchStatus`: `pending_admin_approval → approved | rejected`

### Models
| Model | Purpose |
|---|---|
| `User` | All users (participants + admins). `isAdmin` boolean for role. |
| `Event` | Speed-dating event with capacity, dates, and status. |
| `Registration` | A user's application to an event; reviewed by admin. |
| `EventParticipant` | Approved registrants promoted to participants; has `eligibilityStatus`. |
| `Attendance` | Check-in record for an event participant. |
| `Choice` | A participant's rating of another (romantic/friend/not interested). |
| `Match` | Mutual choice between two arrived participants; requires admin approval. |
| `AdminAuditLog` | Every admin action is recorded here (action, entityType, entityId, meta). |

**Naming convention**: DB columns use `snake_case` (via `@map`); Prisma/TypeScript fields use `camelCase`.

---

## Business Logic & Event Lifecycle

```
Event: draft → published → closed → completed / cancelled

Registration flow:
  User submits → pending
  Admin reviews → approved (+ optionally requires photo upload)
               → rejected
               → waitlisted

Participant lifecycle:
  Approved registrant → EventParticipant created
  eligibilityStatus: needs_photo (if photo required) → eligible (once uploaded)
                     disabled (if admin blocks)

Event day:
  Admin checks in participants → Attendance.status = arrived

Selection window (post-event):
  Admin opens selection window
  Participants submit Choice records (interestedRomantic / interestedFriend / notInterested)
  Admin closes window

Match generation:
  Admin triggers generateMatches → mutual choices among arrived participants create Match records
  Match starts as pending_admin_approval
  Admin approves / rejects each match
  On approval → notifications sent to both participants
```

---

## Backend Architecture

### Module Pattern
Each domain follows the standard NestJS pattern:
```
src/<domain>/
  <domain>.module.ts     # imports, providers, controllers
  <domain>.controller.ts # HTTP endpoints with decorators
  <domain>.service.ts    # business logic, calls PrismaService
  dto/                   # Input validation DTOs (class-validator)
```

### API Route Namespacing
| Prefix | Audience | Auth required |
|---|---|---|
| `/auth/*` | Public | No |
| `/events/:id` | Public | No |
| `/me/*` | Logged-in participants | JWT |
| `/admin/*` | Admins only | JWT + `@Roles('ADMIN')` |

### Key Decorators
- `@Public()` — skips JwtAuthGuard on a route
- `@Roles('ADMIN')` — requires `user.isAdmin === true`
- `@CurrentUser()` — injects the JWT payload (contains `id`, `isAdmin`)

### Global Configuration (set in `main.ts`)
- **CORS**: allowed origin = `FRONTEND_URL` env var
- **Guards**: `JwtAuthGuard` + `RolesGuard` applied globally
- **Validation pipe**: `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`
- **Exception filter**: `HttpExceptionFilter` normalizes error responses

### Authentication Flow
1. User calls `POST /auth/request-otp` with phone number → OTP sent via SMS
2. User calls `POST /auth/verify-otp` with phone + code → receives JWT
3. Frontend stores JWT in `localStorage` under key `auth_token`
4. All subsequent requests include `Authorization: Bearer <token>`
5. 401 responses auto-redirect to `/auth/login`

### Audit Logging
Every admin action must call `AuditService.log()`:
```typescript
await this.auditService.log({
  adminId,
  action: 'ACTION_NAME',    // SCREAMING_SNAKE_CASE
  entityType: 'match',      // lowercase entity type
  entityId: matchId,
  eventId,                  // optional
  meta: { /* extra data */ },
});
```

---

## Frontend Architecture

### App Router Layout
```
app/
  layout.tsx              # Root: lang="he" dir="rtl", global CSS
  page.tsx                # Landing / redirect
  auth/login/page.tsx     # OTP login
  events/[eventId]/
    page.tsx              # Event detail (public)
    register/page.tsx     # Registration form
    selections/page.tsx   # Partner selection UI
    matches/page.tsx      # View approved matches
  me/
    events/[eventId]/page.tsx  # Personal event status
    profile-photo/page.tsx     # Photo upload
  admin/
    layout.tsx            # Admin shell (auth guard, nav)
    events/
      page.tsx            # Event list dashboard
      new/page.tsx        # Create event
      [eventId]/
        edit/page.tsx
        registrations/page.tsx
        participants/page.tsx
        checkin/page.tsx
        selections/page.tsx
        matches/pending/page.tsx
        matches/approved/page.tsx
```

### API Client (`src/lib/api.ts`)
All API calls are centralised in `lib/api.ts`, grouped by domain:
```typescript
authApi       // OTP login
eventsApi     // public event info
registrationsApi
photoApi
selectionsApi
matchesApi
adminApi      // all admin operations
```
Add new endpoints to the appropriate group, or create a new group for new domains.

### Auth Helpers (`src/lib/auth.ts`)
```typescript
getToken() / setToken() / removeToken()
getUser() / setUser()
isLoggedIn()
isAdmin()
```
All operate on `localStorage` (client-side only).

### TypeScript Types (`src/types/index.ts`)
Shared interfaces mirror the Prisma schema. **Keep these in sync** when adding fields to the database. All types are plain interfaces (no classes).

---

## Development Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- npm

### Quick Start

```bash
# 1. Start infrastructure (postgres + minio)
docker-compose up -d postgres minio

# 2. Backend
cd backend
cp .env.example .env          # fill in secrets
npm install
npx prisma migrate dev        # run migrations
npx ts-node prisma/seed.ts    # seed admin user + sample event
npm run start:dev             # starts on :3001

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # starts on :3000
```

Or use Docker for everything:
```bash
docker-compose up -d          # starts all 4 services
```

Or use Makefile shortcuts:
```bash
make docker-up                # start all docker services
make install                  # npm install in both workspaces
make db-migrate               # run prisma migrations
make db-seed                  # seed database
make backend                  # start backend dev server
make frontend                 # start frontend dev server
make lint                     # lint both workspaces
make build                    # production build both
make prisma-studio            # open Prisma Studio GUI
```

### Default Dev Credentials
- **Admin phone**: `+972500000001`
- **OTP**: printed in backend logs during dev (no real SMS sent unless configured)
- **Swagger**: `http://localhost:3001/api/docs`
- **MinIO console**: `http://localhost:9001` (user: `minio_admin`, pass: `minio_password`)

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRY` | Token expiry (default `7d`) |
| `S3_BUCKET` | S3/MinIO bucket name |
| `S3_REGION` | AWS region |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `S3_ENDPOINT` | Override endpoint for MinIO |
| `CDN_BASE_URL` | Public base URL for uploaded files |
| `OTP_TTL_SECONDS` | OTP expiry in seconds (default `300`) |
| `OTP_LENGTH` | OTP digits (default `6`) |
| `PORT` | Backend port (default `3001`) |
| `FRONTEND_URL` | Allowed CORS origin |
| `TWILIO_*` | SMS provider credentials |
| `SMTP_*` | Email provider credentials |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_NAME` | App display name |

---

## Key Commands

### Backend
```bash
npm run start:dev         # development with hot reload
npm run build             # compile to dist/
npm run start:prod        # run compiled production build
npm run lint              # ESLint --fix
npm run test              # Jest unit tests
npm run test:cov          # Jest with coverage

npm run prisma:generate   # regenerate Prisma client after schema changes
npm run prisma:migrate    # create and apply a new migration
npm run prisma:push       # push schema without migration (dev only)
npm run prisma:studio     # open Prisma Studio
npm run prisma:seed       # run seed script
```

### Frontend
```bash
npm run dev               # development server
npm run build             # production build
npm run start             # serve production build
npm run lint              # Next.js ESLint
```

---

## Code Conventions

### Backend
- **NestJS modules**: one module per domain; register providers and controllers in the module file.
- **Services**: contain all business logic; never put logic in controllers.
- **DTOs**: use `class-validator` decorators for all input; place in `dto/` subfolder.
- **Prisma queries**: always go through `PrismaService` injected via the constructor.
- **Roles**: use `@Roles('ADMIN')` for any admin-only endpoint. No endpoint skips auth without `@Public()`.
- **Error handling**: throw NestJS `HttpException` subclasses (`NotFoundException`, `BadRequestException`, etc.).
- **Audit**: call `AuditService.log()` for every admin mutation.
- **Naming**: `SCREAMING_SNAKE_CASE` for audit action strings; `camelCase` for TypeScript; `snake_case` for DB column names in Prisma `@map`.
- **UUIDs**: all primary keys are UUIDs (`@id @default(uuid()) @db.Uuid`).

### Frontend
- **Client components**: add `'use client'` directive when using hooks or browser APIs.
- **API calls**: always use functions from `src/lib/api.ts` — don't call `axios` directly in components.
- **Auth**: use helpers from `src/lib/auth.ts` — don't access `localStorage` directly.
- **Types**: import from `src/types/index.ts` for all domain types.
- **RTL**: all UI is right-to-left Hebrew; `dir="rtl"` is set at the root layout level.
- **Styling**: Tailwind CSS utility classes only; no custom CSS files except `globals.css`.
- **Forms**: React Hook Form + Zod schema validation.

### General
- TypeScript strict mode — avoid `any` where possible.
- All IDs are UUID strings (not numbers).
- Dates are ISO strings on the API boundary; `DateTime` objects in Prisma/backend.
- The app is written primarily in Hebrew — keep UI text in Hebrew unless adding purely technical identifiers.

---

## Adding a New Feature

### Backend — new domain module
1. Create `src/<domain>/` with `.module.ts`, `.service.ts`, `.controller.ts`, and `dto/` subfolder.
2. Register in `src/app.module.ts` imports array.
3. Add Prisma model to `schema.prisma`, then run `npm run prisma:migrate`.
4. Regenerate Prisma client: `npm run prisma:generate`.
5. Add `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` decorators for Swagger.
6. Add audit logging for all admin mutations.

### Frontend — new page
1. Create `src/app/<path>/page.tsx` following Next.js App Router conventions.
2. Add API functions to `src/lib/api.ts` in the relevant group.
3. Add TypeScript types to `src/types/index.ts` if new shapes are returned.
4. Admin pages: place under `src/app/admin/` — the admin layout auto-guards the route.

### Schema changes
1. Edit `backend/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <description>`.
3. Update `src/types/index.ts` in the frontend to match.
4. Update any affected DTOs, services, and API client functions.

---

## Git Workflow

- Default branch: `master`
- Feature branches: `claude/<feature-name>-<id>` (AI-generated) or descriptive names.
- Commit style: `feat:`, `fix:`, `chore:` prefixes are used in this repo.
- PRs merge into `master` via GitHub pull requests.
