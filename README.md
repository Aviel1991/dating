# SpeedDating Event Manager

מערכת לניהול אירועי ספיד-דייטינג מקצה לקצה.

## Stack

- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Storage**: S3-compatible (presigned URLs)
- **Auth**: JWT + OTP (SMS)
- **Notifications**: SMS + Email

## Project Structure

```
/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── registrations/
│   │   ├── participants/
│   │   ├── attendances/
│   │   ├── choices/
│   │   ├── matches/
│   │   ├── notifications/
│   │   ├── storage/
│   │   └── audit/
│   └── prisma/
│       └── schema.prisma
└── frontend/         # Next.js app
    └── app/
        ├── (participant)/   # Participant-facing pages
        └── admin/           # Admin pages
```

## Quick Start

```bash
# Start all services
docker-compose up -d

# Backend
cd backend && npm install && npm run prisma:migrate && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

## Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories.
