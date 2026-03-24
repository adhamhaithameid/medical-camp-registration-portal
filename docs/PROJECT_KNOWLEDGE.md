# Hospital Management System - Project Knowledge

## 1. Project Overview
This project is now a full **Hospital Management System (HMS)** implemented as a TypeScript monorepo.

Core software design goals applied:
- **Architecture**: clear frontend/backend/shared separation.
- **Modularity**: each business module has its own routes, validation, and UI page.
- **Low Coupling / High Cohesion**: route modules depend on shared contracts and auth middleware, while keeping business logic scoped to the relevant feature.

## 2. System Modules and Responsibilities

### Authentication Module
- User Registration
- Login
- Logout
- Session Status

### Patient Management Module
- Add Patient
- Update Patient Info
- View Patient History
- Soft Delete Patient

### Doctor Management Module
- Add Doctor
- View Doctor Profile
- Assign/Update Specialization
- View/Update Schedule

### Appointment Module
- Book Appointment
- Cancel Appointment
- Reschedule Appointment
- View Appointments

### Billing Module
- Calculate Total Cost
- Generate Invoice
- Process Payment
- View Billing History

## 3. Technology Stack
- **Monorepo**: pnpm workspace (`client`, `server`, `shared`)
- **Frontend**: React + Vite + TypeScript + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database/ORM**: SQLite + Prisma
- **Validation**: Zod
- **Authentication**: JWT in HttpOnly cookie (`hms_auth_token`)
- **Tests**:
  - Server: Vitest + Supertest
  - Client: Vitest + Testing Library
  - E2E: Playwright
- **Containerization**: Dockerfile + docker-compose

## 4. Repository Structure
- `client/`: HMS UI pages and route protection
- `server/`: Express API, Prisma schema, module routes, seed, tests
- `shared/`: Shared TypeScript data contracts
- `docs/`: Project documentation
- `e2e/`: Browser-level flow tests

## 5. API Map

### Health
- `GET /api/health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/status`

### Patients
- `GET /api/patients`
- `POST /api/patients`
- `PUT /api/patients/:id`
- `GET /api/patients/:id/history`
- `DELETE /api/patients/:id` (soft delete)

### Doctors
- `GET /api/doctors`
- `POST /api/doctors`
- `GET /api/doctors/:id`
- `PATCH /api/doctors/:id/specialization`
- `PATCH /api/doctors/:id/schedule`
- `GET /api/doctors/:id/schedule`

### Appointments
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/cancel`
- `PATCH /api/appointments/:id/reschedule`

### Billing
- `POST /api/billing/calculate`
- `POST /api/billing/invoices`
- `POST /api/billing/invoices/:id/pay`
- `GET /api/billing/history`

## 6. Data Model (Prisma)
- `User`: platform users and roles
- `Patient`: demographic + medical history + soft delete flags
- `Doctor`: profile, specialization, schedule
- `Appointment`: booking lifecycle status
- `Invoice`: billing summary and payment state
- `InvoiceItem`: line items for cost calculation

## 7. Shared Contracts
Shared request/response contracts live in `shared/src/contracts.ts` and are imported by both client and server.

## 8. Setup and Run

### Local
1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm db:deploy`
4. `pnpm db:seed`
5. `pnpm dev`

Frontend: `http://localhost:5173`
Backend: `http://localhost:4000`

### Tests
- `pnpm test`
- `pnpm test:e2e`

### Build
- `pnpm build`

### Docker
- `docker compose up --build`

## 9. Default Seed User
- Email: `admin@hms.local`
- Password: `admin12345`
- Role: `ADMIN`

Configured through:
- `DEFAULT_USER_FULL_NAME`
- `DEFAULT_USER_EMAIL`
- `DEFAULT_USER_PASSWORD`

## 10. Testing Checklist
- Auth register/login/logout/status
- Protected endpoint access control
- Patient CRUD-style flow with soft delete + history
- Doctor create/profile/specialization/schedule
- Appointment book/cancel/reschedule/list
- Billing calculate/invoice/payment/history
- Frontend route guarding and core form behavior
- E2E login + module workflows
