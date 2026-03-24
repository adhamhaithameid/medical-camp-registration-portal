# Medical Camp Registration Portal - Project Knowledge

## 1. Project Overview
The **Medical Camp Registration Portal** is a full-stack TypeScript monorepo that lets users:
- Browse active medical camps.
- View detailed camp information.
- Register for a selected camp through a validated form.

It also provides an admin flow where authenticated admins can:
- Log in through a secure session cookie.
- Monitor submitted participant registrations.

This implementation fulfills the 5-level internship roadmap from the task PDF: setup/navigation, camp listing, registration flow, data management, and final polish/testing/deployability.

## 2. Technology Stack
- **Monorepo**: pnpm workspaces (`client`, `server`, `shared`)
- **Frontend**: React + Vite + TypeScript + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database/ORM**: SQLite + Prisma
- **Validation**: Zod (server) + client-side checks
- **Authentication**: Admin-only JWT in HttpOnly cookie (`mcamp_admin_token`)
- **Testing**:
  - Server: Vitest + Supertest (unit + integration)
  - Client: Vitest + Testing Library
  - E2E specs: Playwright test files included
- **Containerization**: Multi-stage Dockerfile + docker-compose

## 3. Repository Structure
- `client/`: React SPA, pages, components, API client, UI tests
- `server/`: Express API, Prisma schema, auth middleware, seed script, backend tests
- `shared/`: Shared TypeScript contracts used by frontend/backend
- `docs/`: Project documentation and knowledge files
- `e2e/`: Playwright end-to-end test specs

## 4. API Map
### Health
- `GET /api/health`

### Camps
- `GET /api/camps`
- `GET /api/camps/:id`

### Registration
- `POST /api/registrations`
  - Validates `fullName`, `age`, `contactNumber`, `campId`
  - Rejects invalid payloads
  - Enforces camp existence and capacity

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/status`

### Admin
- `GET /api/admin/registrations` (protected)

## 5. Shared Contracts
Defined in `shared/src/contracts.ts`:
- `Camp`
- `RegistrationInput`
- `RegistrationRecord`
- `AuthResult`
- `AdminRegistrationRecord`
- response envelopes such as `CampsResponse`, `CampResponse`, `RegistrationResponse`, `AuthStatusResponse`, `AdminRegistrationsResponse`

## 6. Data Model (Prisma)
### `Camp`
- `id`, `name`, `date`, `location`, `description`, `capacity`, `isActive`, timestamps

### `Registration`
- `id`, `fullName`, `age`, `contactNumber`, `campId`, `createdAt`
- relation to `Camp`

### `AdminUser`
- `id`, `username` (unique), `passwordHash`, timestamps

## 7. Auth and Security Model
- Admin-only login (registrants do not create accounts).
- Successful login issues JWT in HttpOnly cookie.
- Protected admin endpoint checks and verifies this cookie.
- Logout clears cookie.
- Sensitive fields are validated server-side before DB operations.

## 8. Frontend Feature Coverage
- **Home**: project purpose and call-to-action.
- **Camp Details list**: all active camps in responsive cards.
- **Camp details page**: focused info by camp id.
- **Registration**: user form with inline validation and success/error feedback.
- **Contact**: Sysslan contact info section.
- **Admin login**: username/password auth.
- **Admin registrations view**: participant table + logout.

## 9. Database Setup and Seed
Commands:
- `npm run db:deploy`
- `npm run db:seed`

Seed creates:
- default admin user from env (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- 3 sample camps

## 10. Run Instructions
### Local development
1. `pnpm install`
2. `pnpm db:deploy`
3. `pnpm db:seed`
4. `pnpm dev`

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:4000`.

### Production build
1. `pnpm build`
2. `pnpm --filter server start`

### Docker
- `docker compose up --build`

## 11. Testing Status
Validated successfully in this implementation:
- `pnpm build`
- `pnpm test`

Passing suites include:
- Server unit tests
- Server integration API tests
- Client route and registration tests

Playwright e2e specs are present in `e2e/` for full browser-based flows.

## 12. PDF Level-to-Implementation Traceability
- **Level 1 (setup/pages/navigation)**: done
- **Level 2 (camp information display + responsive layout)**: done
- **Level 3 (registration form + validation + submission + confirmation)**: done
- **Level 4 (storage + retrieval + admin monitoring + basic error handling)**: done
- **Level 5 (UI refinement + flow verification + deployable artifacts)**: done

## 13. Notes and Defaults
- Default DB URL fallback is `file:./dev.db`.
- App defaults are designed for local dev and internship delivery.
- Future React Router warnings in tests are non-blocking and do not affect functionality.
