# Legal Property Management

## Project Summary
This repository is a Next.js application for legal property management workflows.  
It manages:
- team users and role-based access (`SUPER_ADMIN`, `MANAGER`, `ASSOCIATE`, `VIEWER`)
- clients (property owners)
- properties and units
- tenancies
- payments, expenses, maintenance requests
- audit logs and data export/delete actions

The app includes authentication, approval flows, document generation, and daily briefing automation.

## Problem Solved
The project centralizes legal-property operations that are otherwise split across spreadsheets, manual records, and ad hoc communication:
- tenancy lifecycle tracking (start/expiry/status)
- landlord/client records and property ownership
- payment and expense tracking with auditability
- compliance-oriented activity logging and data export/delete operations
- operational alerts (expiring leases, maintenance)

## Features (Confirmed)
- One-time system initialization flow (`/setup`) that creates:
  - a `SUPER_ADMIN` account
  - firm settings
  - a recovery key
- Credentials-based authentication with force-password-change support
- Account recovery flow using hashed recovery key
- Role-based authorization gates in middleware and server actions
- Maker-checker style record approval for clients, properties, and tenancies
- Property management with optional multi-unit support
- Tenancy management:
  - create
  - renew
  - conclude
  - notice date calculation
- Financial operations:
  - record payments
  - record expenses
  - tenancy-level financial summaries
  - CSV exports (properties, financials, expenses)
- Legal/operational document generation via PDF components:
  - notice to quit
  - notice of intention
  - tenancy agreement
  - receipts
  - remittance report
- Maintenance request creation and status updates
- Global search across clients/properties/tenants
- Daily briefing email process and cron endpoint
- Audit log UI and export actions in settings
- Supabase-based file upload for passports/documents

## Tech Stack
- Framework: Next.js 16 (App Router), React 19, TypeScript
- UI: Tailwind CSS v4, shadcn/ui, Radix UI, Lucide icons
- Auth: NextAuth v5 (credentials provider)
- Database: PostgreSQL + Prisma ORM (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- Validation/forms: Zod + react-hook-form
- Storage: Supabase Storage (`@supabase/supabase-js`)
- Email: Resend (`resend`, `@react-email/components`)
- PDF generation: `@react-pdf/renderer`
- E2E testing: Playwright

## Setup
### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment variables
The repository expects the following variables (present in local `.env` / `.env.local` templates):
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RESEND_API`
- `ENCRYPTION_KEY`
- `CRON_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_DEFAULT_PASSWORD`

### 3) Prepare database
Prisma schema and migration files are included under `prisma/`.  
Run Prisma migrations before first startup.

`[Partially inferred]` Exact migration command is not defined in `package.json`; use your standard Prisma migration workflow for this repository.

### 4) Optional seed
A Prisma seed script is configured:
- `package.json -> prisma.seed`
- implementation: `prisma/seed.ts`

### 5) Start app
```bash
npm run dev
```

### Available scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

## Structure
```text
src/
  app/                 Route handlers, pages, layouts, API endpoints
  components/          UI and feature components (clients, properties, tenancies, docs, settings)
  server/
    actions/           Server actions (mutations/commands)
    data/              Server data fetchers (queries/read models)
  lib/                 Shared utilities (db, auth helper, permissions, mail, storage clients)
  types/               Zod schemas and type declarations
  utils/               Encryption utilities

prisma/
  schema.prisma        Data model
  migrations/          SQL migrations
  seed.ts              Seed script

tests/                 Playwright E2E specs
scripts/               Maintenance scripts
```

## Architecture Overview
- **Server-first business logic**:
  - writes/mutations in `src/server/actions`
  - reads/composition in `src/server/data`
- **Auth + session**:
  - NextAuth config in `src/auth.ts` and `src/auth.config.ts`
  - route protection in `src/middleware.ts`
- **Data layer**:
  - Prisma models define users/clients/properties/units/tenancies/payments/expenses/maintenance/audit logs
- **UI layer**:
  - App Router pages under `src/app`
  - feature tables/forms/components under `src/components`
- **Operational automation**:
  - daily briefing logic in `src/server/actions/automation.ts`
  - cron entrypoint at `src/app/api/cron/daily-briefing/route.ts`

## Deployment Notes (Confirmed)
- The NextAuth API route explicitly uses Node runtime:
  - `src/app/api/auth/[...nextauth]/route.ts`
- Several dashboard pages and cron route are `force-dynamic`.
- Global security headers (including CSP) are defined in `next.config.ts`.
- Cron endpoint checks `Authorization: Bearer <CRON_SECRET>`.

`[Partially inferred]` The cron route comment references Vercel cron behavior, but no deployment manifest (Docker/CI/hosting config) is present in this repo root.

## Limitations / Current Caveats
- Current `README.md` replacement is evidence-based; architecture notes in `ARCHITECTURE.md` are not fully aligned with current code.
- Committed repository includes generated test reports/log artifacts (for example `playwright-report/`, `test-results/`, multiple `*.log` / `test-output*.txt` files).
- There are implementation mismatches in current codebase, including:
  - BVN written raw in client actions while read paths attempt decryption
  - some form fields (for example title/gender fields) are collected but not fully persisted in corresponding actions
- Auth/debug logging currently contains sensitive details and should be reviewed before production use.

