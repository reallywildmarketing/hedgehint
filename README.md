# HedgeHint — FX Exposure Autopilot for Importers

**Live Production Address:** [https://hedgehint.vercel.app](https://hedgehint.vercel.app)  
**Hosted Infrastructure:** Vercel (Functions in Dublin `dub1`) + Supabase PostgreSQL (`eu-west-1`) & Storage

HedgeHint helps importers and businesses that pay suppliers in foreign currency manage exchange-rate risk. It ingests purchase orders and supplier invoices to calculate future foreign-currency needs by currency and calendar week. It tracks live and historical rates, models what-if currency swings, enforces a strict purchase approval workflow, and tracks realised savings against spot markets.

---

## 1. Stack & Architecture

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Language:** TypeScript 5.9 (Strict mode)
- **Database & ORM:** PostgreSQL 16+ with `pgcrypto` & Prisma 5.22
- **Styling:** Tailwind CSS v4 (Calm Slate/Amber palette, WCAG AA compliant)
- **Authentication:** Custom session-based auth with `bcryptjs`, database-backed sessions, pending access approval, and session invalidation on password reset
- **Validation:** Zod 4 & pure TypeScript domain engines
- **Testing:** Vitest 5 (Unit and Integration suites running against PostgreSQL)

---

## 2. Directory Structure

```
/Users/mac/Desktop/jobs/hedgehint/
├── docs/
│   ├── HedgeHint_PRD.md          # Comprehensive Product Requirements Document (328 lines)
│   ├── HedgeHint_Architecture.md # System architecture, concurrency & database isolation
│   └── HedgeHint_Design.md       # Design system, signature Exposure Ribbon, palettes
├── prisma/
│   ├── schema.prisma             # PostgreSQL schema with UUIDs & indexes
│   └── migrations/               # Applied migrations
├── src/
│   ├── domain/                   # Pure, testable business logic (0 framework dependencies)
│   │   ├── exposure.ts           # Weekly buckets, total exposure, rate sensitivity
│   │   ├── recommendation.ts     # Buy-now vs wait autopilot logic
│   │   ├── scenario.ts           # What-if currency shock recomputations
│   │   ├── margin.ts             # Gross margin impact & landed cost
│   │   ├── alert.ts              # Rate alert rule evaluations
│   │   └── import.ts             # CSV parsing & row-level validation
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── auth.ts               # Session management & password hashing
│   │   └── dashboard-data.ts     # Dashboard aggregation
│   ├── components/               # React UI components (ExposureRibbon, WhatIfSlider, RequestsQueue)
│   ├── app/                      # App Router pages & server actions
│   └── middleware.ts             # Route protection & session validation
├── scripts/
│   └── admin-create.ts           # Idempotent central administrator CLI
└── tests/                        # Vitest test suite (Unit & PostgreSQL Integration)
```

---

## 3. Quick Start (Local Development)

### 1. Database Setup
Ensure PostgreSQL is running on port 5433 (or update `.env` to your port):
```bash
psql -p 5433 -U hedgehint -d hedgehint -c "SELECT 1;"
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Apply Migrations & Generate Client
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Create Initial Administrator
Run the provisioning command:
```bash
pnpm run admin:create
```
- **Default Email:** `admin@hedgehint.internal`
- **Default Password:** `AdminPass1234!`
- **Default Organisation:** `Acme Global Importers` (Base: `GBP`)

### 5. Run Development Server
```bash
pnpm dev
```
Visit `http://localhost:3000` to see the landing page, or sign in at `/sign-in`.

---

## 4. Verification & Testing

```bash
# Run all Vitest suites (22 tests passing):
pnpm test

# Run Next.js production typecheck & build:
pnpm run build
```

---

## 5. Security & Business Invariants

1. **Separation of Duties:** Requester cannot approve their own purchase request (`requestedBy !== approverId`).
2. **Approval Gate:** Currency purchases can only be recorded against an `approved` purchase request.
3. **Pending User Gating:** Public sign-up creates a `pending` account that cannot log in until an administrator approves.
4. **Session Invalidation:** Any password change immediately revokes all active session tokens.
5. **Tenant Isolation:** All queries filter strictly by `organisationId` from the authenticated session.
6. **Append-Only Audit Trail:** Mutations write immutable records to `audit_events`.
7. **Rate Staleness Guard:** Alerts user if spot rates are older than 60 minutes.

