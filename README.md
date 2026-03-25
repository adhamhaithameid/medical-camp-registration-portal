# Medical Camp Portal + Hospital Management System

Full-stack TypeScript monorepo for:
- Public medical camp discovery and registration
- Participant self-service registration updates/cancellation via confirmation code
- Admin camp operations (capacity, waitlist, promotion, reporting)
- Hospital management modules (patients, doctors, admin users) with role-based control

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: Prisma + SQLite
- Shared contracts: TypeScript package (`shared/`)
- Testing: Vitest + Playwright
- Delivery: Docker + Docker Compose
- Package manager: pnpm workspaces

## Monorepo Structure
```text
client/   React SPA
server/   Express API + Prisma
shared/   Shared TS types/contracts
docs/     Project documentation
e2e/      Playwright tests
```

## Features
- Public camp listing/details and registration
- Remaining seat visibility and automatic waitlist when camp is full
- Duplicate registration protection (`contactNumber + campId`)
- Registration lookup/update/cancel with confirmation code
- Admin authentication with HttpOnly JWT cookie
- Role-based admin (`SUPER_ADMIN`, `STAFF`)
- Admin registration management:
  - search, filters, pagination
  - CSV export
  - waitlist promotion
- Admin camp CRUD + deactivate/activate controls
- Hospital modules with CRUD:
  - patients
  - doctors
  - admin users
- Structured API errors with request IDs and field-level validation feedback
- Admin diagnostics and system status endpoints/pages
- Notification attempt logging (email/SMS integrations are env-driven)
- Audit logging + request logging + rate limiting

## Prerequisites
- Node.js 20+
- pnpm 10.25.0+

## Quick Start (Local)
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Prepare database:
   ```bash
   pnpm db:generate
   pnpm db:deploy
   pnpm db:seed
   ```
4. Start app:
   ```bash
   pnpm dev
   ```

Local URLs:
- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`

## Docker Run
```bash
docker compose up --build
```

App URL:
- `http://localhost:4000` (server also serves built SPA in production mode)

## Default Seeded Credentials
- Super Admin: `admin / admin12345`
- Staff: `staff / staff12345`

Change these values in `.env` for non-local environments.

## Scripts
- `pnpm dev` - run client + server in development
- `pnpm build` - build shared, server, and client
- `pnpm test` - run server + client tests
- `pnpm test:coverage` - run coverage for server + client
- `pnpm test:e2e` - run Playwright browser flows
- `pnpm db:generate` - Prisma client generation
- `pnpm db:deploy` - sync schema to SQLite
- `pnpm db:seed` - seed initial data/users/camps

## API Entry Points
Core APIs include:
- `GET /api/health`
- `GET /api/camps`
- `GET /api/camps/:id`
- `POST /api/registrations`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/admin/registrations` (protected)

Extended admin/public routes are documented in:
- `docs/PROJECT_KNOWLEDGE.md`

## CI Pipeline
GitHub Actions workflow: `.github/workflows/ci.yml`

Jobs:
- `quality`: install, generate Prisma client, coverage, build, upload coverage artifacts
- `e2e`: Playwright browser tests (Chromium)
- `docker-smoke`: Docker compose build + `/api/health` smoke check

The workflow also uses:
- concurrency cancelation on same branch
- failure artifact upload for Playwright reports

## Troubleshooting
- `Failed to fetch` in UI:
  - ensure server is running on `http://localhost:4000`
  - verify `CORS_ORIGIN` in `.env`
- Login fails:
  - reseed data: `pnpm db:seed`
  - use seeded credentials above
- E2E local port conflicts:
  - stop stale processes on ports `4000`/`5173`

## Additional Documentation
- Deep project knowledge and traceability: `docs/PROJECT_KNOWLEDGE.md`
