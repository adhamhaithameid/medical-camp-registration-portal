# Medical Camp Registration Portal - Project Knowledge

## Overview
This monorepo implements a full-stack Medical Camp Registration Portal using:
- `client/`: React + Vite + TypeScript
- `server/`: Express + TypeScript + Prisma + SQLite
- `shared/`: shared TypeScript contracts

The implementation includes:
- Hospital core modules with full CRUD:
  - Patients management (`/api/admin/patients`)
  - Doctors management (`/api/admin/doctors`)
  - Admin accounts management (`/api/admin/users`)
- Public camp browsing and registration
- Capacity visibility and automatic waitlisting when camps are full
- Confirmation-code based registration lookup/edit/cancel
- Admin authentication with role-based access control (`SUPER_ADMIN`, `STAFF`)
- Admin registration management with search, filters, pagination, CSV export, and waitlist promotion
- Admin camp CRUD and deactivation
- Notification logging for email/SMS delivery attempts
- Production hardening (rate limiting, request logging, audit logging)
- CI pipeline and enforced coverage thresholds

## Architecture

### Backend (Express API)
- **Routing modules**
  - `routes/auth.ts`: admin login/logout/status + super-admin user management
  - `routes/patients.ts`: patient CRUD
  - `routes/doctors.ts`: doctor CRUD
  - `routes/camps.ts`: public camps + admin camp CRUD/deactivate
  - `routes/registrations.ts`: public registration lifecycle + admin registration tools
- **Middleware**
  - Cookie/JWT auth middleware (`middleware/auth.ts`)
  - Global error handler (`middleware/error-handler.ts`)
  - Rate limiting (`express-rate-limit`) and request logging (`morgan`) in app bootstrap
- **Services**
  - `services/audit.ts`: writes audit events to `AuditLog`
  - `services/notifications.ts`: sends/logs notification events across email/SMS channels
- **Validation**
  - Zod schemas for auth, camp payloads, registration payloads, and admin filters

### Frontend (React SPA)
- Public pages:
  - Home, Camp Details, Registration, Registration Management, Contact
- Admin pages:
  - Admin Login
  - Patients Management (CRUD)
  - Doctors Management (CRUD)
  - Admin Users Management (CRUD, super admin only)
  - Admin Registrations (search/filter/pagination/export/promote)
  - Admin Camps (create/edit/deactivate)
- Auth state is managed through `AuthProvider` with protected route gating by role.

## Data Model (Prisma)

### `AdminUser`
- `id`, `username`, `passwordHash`, `role`, `isActive`, timestamps

### `Camp`
- `id`, `name`, `date`, `location`, `description`, `capacity`, `isActive`, timestamps

### `Patient`
- `id`, `fullName`, `dateOfBirth`, `gender`, `contactNumber`, `email`, `address`, `medicalHistory`, timestamps

### `Doctor`
- `id`, `fullName`, `email`, `contactNumber`, `specialization`, `department`, `isActive`, timestamps

### `Registration`
- `id`, participant fields (`fullName`, `age`, `contactNumber`, `email`)
- `campId`, `status` (`CONFIRMED`, `WAITLISTED`, `CANCELLED`)
- `confirmationCode`, `isActive`, `cancelledAt`, timestamps

### `NotificationLog`
- Per-attempt notification records for registration events:
  - channel (`EMAIL`/`SMS`)
  - event (`REGISTERED`, `UPDATED`, `CANCELLED`, `PROMOTED`, `WAITLISTED`)
  - status (`SENT`, `FAILED`, `SKIPPED`)

### `AuditLog`
- Tracks sensitive admin actions with actor, action, entity, request metadata, and details payload.

## API Map

### Public
- `GET /api/health`
- `GET /api/camps`
- `GET /api/camps/:id`
- `POST /api/registrations`
- `POST /api/registrations/lookup`
- `GET /api/registrations/:confirmationCode`
- `PATCH /api/registrations/:confirmationCode`
- `DELETE /api/registrations/:confirmationCode`

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/status`

### Admin
- `GET /api/admin/camps`
- `POST /api/admin/camps` (`SUPER_ADMIN`)
- `PATCH /api/admin/camps/:id` (`SUPER_ADMIN`)
- `POST /api/admin/camps/:id/deactivate` (`SUPER_ADMIN`)
- `GET /api/admin/registrations` (`STAFF` or `SUPER_ADMIN`)
- `GET /api/admin/registrations/export.csv` (`STAFF` or `SUPER_ADMIN`)
- `PATCH /api/admin/registrations/:id/promote` (`STAFF` or `SUPER_ADMIN`)
- `GET /api/admin/registrations/:id/notifications` (`STAFF` or `SUPER_ADMIN`)
- `GET /api/admin/users` (`SUPER_ADMIN`)
- `GET /api/admin/users/:id` (`SUPER_ADMIN`)
- `POST /api/admin/users` (`SUPER_ADMIN`)
- `PATCH /api/admin/users/:id` (`SUPER_ADMIN`)
- `DELETE /api/admin/users/:id` (`SUPER_ADMIN`)
- `GET /api/admin/patients` (`STAFF` or `SUPER_ADMIN`)
- `GET /api/admin/patients/:id` (`STAFF` or `SUPER_ADMIN`)
- `POST /api/admin/patients` (`STAFF` or `SUPER_ADMIN`)
- `PATCH /api/admin/patients/:id` (`STAFF` or `SUPER_ADMIN`)
- `DELETE /api/admin/patients/:id` (`STAFF` or `SUPER_ADMIN`)
- `GET /api/admin/doctors` (`STAFF` or `SUPER_ADMIN`)
- `GET /api/admin/doctors/:id` (`STAFF` or `SUPER_ADMIN`)
- `POST /api/admin/doctors` (`STAFF` or `SUPER_ADMIN`)
- `PATCH /api/admin/doctors/:id` (`STAFF` or `SUPER_ADMIN`)
- `DELETE /api/admin/doctors/:id` (`STAFF` or `SUPER_ADMIN`)

## Business Rules Implemented

### Capacity + Waitlist
- Remaining seats are shown in public and admin views.
- New registration becomes:
  - `CONFIRMED` if confirmed count < capacity
  - `WAITLISTED` if camp is full

### Duplicate Registration Protection
- Duplicate active registration for the same `contactNumber + campId` is blocked.

### Participant Edit/Cancel
- Participants manage registrations via `confirmationCode`.
- Cancellation marks registration inactive and status `CANCELLED`.

### Admin Promotion
- Waitlisted registration can be promoted only when seats are available.

### Role-Based Admin
- `SUPER_ADMIN`: full management (users + camps + all staff abilities)
- `STAFF`: registrations and reporting access (view/filter/export/promote)

### HMS CRUD Coverage
- Patients: create, list, get-by-id, update, delete
- Doctors: create, list, get-by-id, update, delete
- Admin users: create, list, get-by-id, update, delete (with safeguards against deleting self/last active super admin)

## Notifications
- Registration events trigger email and SMS delivery attempts.
- Actual sending is environment-driven:
  - SMTP vars for email
  - Twilio vars for SMS
- Every attempt is persisted in `NotificationLog`.

## Production Hardening
- Global rate limiting
- HTTP request logging
- Persistent audit logs for admin actions
- CI workflow at `.github/workflows/ci.yml`
- Coverage thresholds enforced in:
  - `server/vitest.config.ts`
  - `client/vite.config.ts`

## Setup and Run

### Local
1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm db:deploy`
4. `pnpm db:seed`
5. `pnpm dev`

App URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

### Tests
- `pnpm test`
- `pnpm test:coverage`
- `pnpm test:e2e`

### Build
- `pnpm build`

### Docker
- `docker compose up --build`

## Seeded Credentials
- Super Admin: `admin / admin12345`
- Staff: `staff / staff12345`

Configured through env keys:
- `DEFAULT_SUPER_ADMIN_USERNAME`
- `DEFAULT_SUPER_ADMIN_PASSWORD`
- `DEFAULT_STAFF_USERNAME`
- `DEFAULT_STAFF_PASSWORD`
