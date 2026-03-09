# Legal Property Management

A server-first legal property operations platform for managing clients, properties, tenancies, finance, maintenance, and compliance workflows in one system.

## Problem Solved
Legal and property operations are often fragmented across spreadsheets, messaging apps, and manual paperwork.
This project centralizes operational records, tenancy lifecycle management, financial tracking, legal document generation, and audit trails into a single application.

## Target Users
- SUPER_ADMIN (firm owner / lead administrator)
- MANAGER (operations and approvals)
- ASSOCIATE (record creation and day-to-day execution)
- VIEWER (read-only access)

## Main Features
- One-time system setup with initial super admin and firm profile
- Credentials-based authentication with role-based access control
- Team management with role-aware user creation, deletion, and password reset
- Client management with profile, banking, and identity-document fields
- Property management with owner linkage, structure types, and multi-unit generation
- Tenancy lifecycle workflows:
  - create tenancy
  - renew tenancy
  - conclude tenancy
  - expiry and notice-date awareness
- Finance workflows:
  - record tenant payments
  - record property/tenancy expenses
  - tenancy financial summaries
  - CSV exports
  - remittance report generation
- Legal document generation (PDF):
  - tenancy agreement
  - notice to quit
  - notice of intention
  - payment receipts
  - remittance report statement
- Maintenance request tracking with status updates
- Approval workflow (maker-checker) for operational records
- Audit logging for sensitive actions
- Daily briefing automation via secured cron endpoint
- Search across clients, properties, and tenancies

## Tech Stack
- Next.js (App Router), React, TypeScript
- NextAuth (credentials provider)
- Prisma ORM + PostgreSQL
- Tailwind CSS + shadcn/ui + Radix UI
- Zod + react-hook-form
- Supabase Storage
- Resend email service
- `@react-pdf/renderer` for PDF generation
- Playwright for end-to-end testing

## Folder Structure
```text
src/
  app/                  routes, layouts, API handlers
  components/           feature and UI components
  server/actions/       server mutations/commands
  server/data/          server read-model queries
  lib/                  shared helpers (db, auth, permissions, mail, storage)
  types/                shared schemas/types
  utils/                utility modules

prisma/
  schema.prisma
  migrations/
  seed.ts

tests/                  Playwright E2E specs
scripts/                operational scripts
```

## How the System Works
1. A super admin initializes the system through the setup flow.
2. Team members sign in with credentials and are routed by role permissions.
3. Records are created across clients, properties, units, and tenancies.
4. Approval roles can approve or reject pending records.
5. Payments, expenses, and maintenance actions update operational state.
6. Legal and financial documents are generated directly from stored records.
7. Audit logs preserve traceability of critical actions.
8. Daily briefing automation summarizes priority items.

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local` (or `.env`):
- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API`
- `CRON_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_DEFAULT_PASSWORD`
- `AUTH_SECRET`

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Optional seed:
```bash
npx prisma db seed
```

5. Start development server:
```bash
npm run dev
```

## Testing
Run end-to-end tests:
```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

## Deployment Basics
- Auth route is configured to run on Node runtime.
- Security headers (including CSP and transport/security headers) are configured in `next.config.ts`.
- Daily briefing cron endpoint is protected with `Authorization: Bearer <CRON_SECRET>`.

## Current Status
Active product build covering setup, authentication, RBAC, clients, properties, tenancies, finance, maintenance, document generation, and audit logging.

## Notes
Built around server-side workflows, explicit permission controls, and operational legal/property processes.

