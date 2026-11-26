# HedgeHint: Architecture

| | |
|---|---|
| **Product** | HedgeHint — FX exposure autopilot for importers |
| **Stack** | Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (local and hosted from the first commit), Auth.js (credentials provider), Zod, Vitest, server actions |
| **Storage adapter** | Local disk in development; private object storage (S3-compatible) when hosted, server-generated keys |
| **Document status** | Draft v1.0. Specification for implementation; nothing is built yet. |
| **Sibling project** | Strata RTC (Go/Rust media platform). HedgeHint is a separate Next.js app in this repo; it shares no code or UI with Strata and must not resemble it. |

---

## 1. Stack and versions (pinned)

| Layer | Choice | Version (to be locked at first commit) |
|---|---|---|
| Framework | Next.js (App Router) | latest stable 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| ORM / DB | Prisma + PostgreSQL | Prisma latest stable; PostgreSQL 16 locally (docker compose), hosted via Supabase |
| Auth | Auth.js | credentials provider (no OAuth at P0) |
| Validation | Zod | latest stable |
| Testing | Vitest + @testing-library / supertest-like | latest stable |
| Forms | React Hook Form + Zod resolver | latest |
| Charts | lightweight charting (recharts or similar) | latest stable |
| Date handling | date-fns | latest |
| Node | pinned | 20.x LTS (see .nvmrc / engines) |

Node version is pinned (`.nvmrc` + `engines` in package.json). Unused native packages are removed. Any library needing workers or native code (PDF parsing) is verified on the hosted platform itself before use.

---

## 2. Module boundaries

The app lives at the repo root of this HedgeHint project (a sibling of Strata RTC, not a module of it).

```
app/                # Next.js App Router routes + server actions
  (auth)/           # sign-in, sign-up, password change
  (app)/            # tenant-scoped pages (dashboard, exposure, rates, ...)
  api/              # webhook + scheduler endpoints (secret-protected)
components/         # UI components (server + client)
lib/                # thin wrappers: prisma client, auth, storage, rate provider
domain/             # PURE, TESTED business logic (no Next/Prisma imports)
  exposure.ts       # weekly needs, total exposure, rate sensitivity
  recommendation.ts # buy now / wait / partial
  scenario.ts       # what-if recomputation
  margin.ts         # margin impact
  alert.ts          # alert rule evaluation
  import.ts         # CSV parsing + validation (pure)
prisma/             # schema.prisma + migrations
tests/              # unit + integration tests (test DB only)
public/, styles/, i18n/ (later)
```

**Rule:** domain rules live in pure, tested modules under `domain/`. Server actions and routes stay thin: validate input (Zod), enforce auth/tenant on the server, call domain logic, write through Prisma, record audit events. Never put business rules inside components or server actions.

## 3. Data model and indexes

(Full entity/field definitions are in PRD section 7. Indexes and constraints below.)

**Core tables (all in the app's own schema, e.g. `hedgehint`):**
- `organisations`, `users`, `organisation_members`
- `purchase_orders`, `supplier_invoices`, `payment_schedules`
- `exchange_rates`
- `rate_alerts`, `purchase_requests`, `currency_bought`
- `scenarios`, `import_jobs`, `import_errors`
- `audit_events`, `sessions`, `rate_providers`

**Indexes:**
- `exchange_rates(currency_pair, observed_at)` UNIQUE — prevents duplicate rate writes; supports "latest rate per pair" queries.
- `supplier_invoices(organisation_id, due_date, status)` — payment reminders and overdue detection.
- `purchase_orders(organisation_id, expected_payment_date, status)` — weekly needs.
- `purchase_requests(organisation_id, status)` — approval queue.
- `currency_bought(organisation_id, bought_at)` — monthly report.
- `audit_events(organisation_id, created_at)` — audit list.
- `sessions(token_hash)`, `sessions(user_id, expires_at)` — session lookup + expiry sweep.
- `organisation_members(organisation_id, user_id)` — tenant membership lookup.
- `users(email)` UNIQUE — sign-in lookup.

**Append-only tables:** `audit_events`, `exchange_rates`. The app database role has UPDATE and DELETE revoked on these (enforced at the database layer, see section 6).

**Identifiers:** UUID primary keys, server-generated (`gen_random_uuid()`). Timestamps `timestamptz` (UTC).

## 4. Authentication, authorisation and tenant isolation

**Authentication (Auth.js, credentials provider):**
- Users sign in with email + password. Passwords hashed with bcrypt.
- Sign-up creates a **pending** user with no role; cannot sign in until approved. The response never reveals whether an email already exists (generic success/failure message).
- Password change (signed-in user) or temporary password (administrator) revokes all existing sessions for that user; a user who must change password reaches nothing else, including APIs.
- "Forgot password" explains email flows are unavailable until a provider is configured.

**Authorisation:**
- Role + organisation membership read from the **database**, never the browser, on every request.
- Middleware (server) enforces: signed-in user, approved status, organisation scope, permission for the action.
- Session token is a hashed opaque value stored in the DB; cookies are HttpOnly, Secure, SameSite=Lax.

**Tenant isolation:**
- Every business record carries `organisation_id`.
- All reads/writes filter by `organisation_id` derived from the session, never from a client-supplied value.
- Cross-tenant access is tested (see Phase G): user A of org 1 cannot read org 2's records via any API or page.
- Row-level security is not relied on as the sole control; application-side filtering + tests enforce it.


## 5. Transactions and concurrency

- Read-then-write operations (exposure recompute status changes, sequence numbers, import job finalisation) run inside a single Prisma transaction.
- **No nested transactions.** Never catch a database error and carry on inside the same Postgres transaction.
- Atomic updates (`increment`, `update` with `where` on current status) used for status transitions and counters to avoid lost updates under concurrent requests.
- Simultaneous-request tests for each invariant that could race (approval workflow, "no currency bought without approved request", unique rate write) run in Phase G.
- If every write shared one advisory lock, that throughput limit would be documented here; the design avoids a single global lock by using row-level atomic updates.

## 6. File storage

- No durable local disk in production. Uploads go to a private object storage bucket with server-generated keys.
- Every download is authorised against its business record (import CSV, export report) before serving.
- Uploads capped near 4 MB (room inside the 4.5 MB serverless request limit for form overhead). Long imports are split so each finishes within one function run.
- Development: local disk storage adapter behind the same interface.

## 7. Background jobs

- Scheduled work runs through an endpoint protected by a scheduler secret, accepting the HTTP method the scheduler sends (POST). Frequency respects the hosting plan's limits.
- Rate sync (refresh live rates every 60 min during market hours), overdue-invoice sweep, monthly report generation are the scheduled jobs at P0/P1.
- Jobs are idempotent where possible (rate sync keyed on currency_pair + observed_at).

## 8. API surface

- Next.js server actions for UI mutations (import CSV, create request, approve, record buy, create alert, etc.).
- `POST /api/scheduler` — secret-protected scheduled jobs.
- `POST /api/webhook` — optional provider webhooks (P1).
- All mutations validated with Zod; all routes require auth + tenant scope.
- Error responses are generic to clients (no stack traces, no "email exists" hints); full details logged server-side.

## 9. Error handling

- Server actions return `{ error, fieldErrors }` shapes; UI renders per-field errors and a retry path.
- Validation errors (Zod) return 400 with row-level detail for imports.
- AuthZ failures return 403; missing auth redirects to sign-in; never reveals whether an account exists.
- Database errors inside a transaction abort the transaction; the error is surfaced, never swallowed and continued.
- Development-only simulators (e.g., rate provider failure) are behind `HEDGEHINT_DEV_SIMULATOR` (off by default).

## 10. Audit trail

- Every consequential change (import, request create/approve/reject, currency bought, rate manual entry, user create/role change, password change, alert acknowledge) writes an `audit_event` (organisation, user, action, entity_type, entity_id, details jsonb, timestamp, ip_address).
- `audit_events` is append-only: the app role cannot UPDATE or DELETE it.
- Audit events are retained indefinitely.


## 11. Testing strategy

- **Unit tests (Vitest):** pure domain modules under `domain/` — exposure calc, recommendation, scenario, margin, alert evaluation, CSV parsing. Run against no database.
- **Integration tests:** against a **real, disposable PostgreSQL database** (test database name must mark it as a test database; tests refuse to run otherwise). Covers RBAC, tenant isolation, invariants, concurrency (simultaneous requests), import atomicity, session revocation on password change, pending-user sign-in block.
- **End-to-end:** drives real forms through the main journey, including forbidden actions and cross-tenant access.
- Typecheck + production build as part of CI.

## 12. Deployment topology

- Hosting: Vercel (serverless functions) + Supabase (PostgreSQL, transaction pooler).
- Runtime uses the **transaction pooler** with the ORM's pooler setting and a small connection limit; migrations use a **session connection** (never during the build; run from a trusted machine).
- Each app gets its **own schema** (not exposed through the database provider's web API) and a **role that can only read and write its tables**. UPDATE/DELETE revoked on append-only tables.
- Private object storage bucket for files; bucket access authorised per request.
- Environment variables set in Vercel; secrets marked sensitive; per-app secrets generated and stored in `~/.config/hedgehint/`.
- Node version pinned; region set to nearest the database (confirmed from live response headers, not just config).

## 13. Environment variables

| Variable | Purpose | Sensitive? |
|---|---|---|
| `DATABASE_URL` | App DB (transaction pooler, app role) | yes |
| `DATABASE_URL_MIGRATION` | Session connection for migrations (owner) | yes |
| `DIRECT_URL` | Prisma migrations direct connection | yes |
| `NEXTAUTH_SECRET` | Auth.js signing key | yes |
| `ENCRYPTION_KEY` | Field encryption for provider API keys | yes (cannot be recovered if lost) |
| `SCHEDULER_SECRET` | Protects scheduled job endpoint | yes |
| `STORAGE_BUCKET`, `STORAGE_KEY`, `STORAGE_SECRET` | Object storage credentials | yes |
| `RATE_PROVIDER_URL`, `RATE_PROVIDER_API_KEY` | Exchange rate provider | yes |
| `HEDGEHINT_DEV_SIMULATOR` | Dev simulators (off by default) | no |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`, `ORG_NAME` | admin:create (read from env or `~/.config/hedgehint/admin.env`) | yes |
| `NEXT_PUBLIC_APP_URL` | Public URL | no |

Credentials live in `~/.config/hedgehint/` with permissions `600`, outside the repository. A template with empty values is committed (`config/hedgehint.env.example`) and the real location is communicated out of band.

## 14. Known limits

- Serverless request limit: uploads capped near 4 MB; imports must complete within one function run.
- One base currency per organisation at P0.
- No direct accounting sync at P0 (CSV only).
- Email notifications unavailable until an SMTP provider is configured.
- If a single global advisory lock were used, throughput would be limited; the design uses row-level atomic updates instead (no global lock).
- Free hosting tiers may forbid commercial use or cap project count/scheduling — confirm plan before deploying (commercial use intended).

