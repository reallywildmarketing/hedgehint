# HedgeHint: Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | HedgeHint — FX exposure autopilot for importers |
| **Document status** | Draft v1.0. Nothing in this document is built yet; every section is a specification for implementation. |
| **Audience** | Product, engineering, and the stakeholder who will operate the finance system |
| **Companion docs** | `docs/HedgeHint_Architecture.md`, `README.md` (this repo's root), sibling project: Strata RTC (see section 3.6) |

**How to read this document.** Priority: **P0** = required for a credible first paying customer; **P1** = required for the target market; **later** = post-launch. Status codes are assigned during implementation (V = built and verified by automated tests, P = partly verified, N = not built). Every requirement marked N here is unimplemented at time of writing.

---

## 1. Summary

HedgeHint helps importers and businesses that pay suppliers in foreign currency manage exchange-rate risk. It reads purchase orders and supplier invoices (imported from accounting systems or spreadsheets) to work out how much of each currency the business will need and when. It tracks live and historical exchange rates and recommends when to buy currency, how much to buy now versus later, and when hedging makes sense. Finance teams see their total exposure in one place, and the business protects its margins from sudden currency swings.

---

## 2. Problem, why it matters, and how it is handled today

### 2.1 Problem
An importer sells in its home currency but pays suppliers in foreign currencies (for example USD, EUR, CNY, NGN). Between placing a purchase order and paying the supplier — often weeks — the exchange rate can move materially. A 10% move in the naira or the dollar directly changes landed cost and can wipe out product margin.

### 2.2 How it is handled today
Most small and mid-sized importers manage this in spreadsheets: a list of POs, invoice due dates, a manually checked FX rate, and a judgement call on whether to buy currency ahead of time. The failure modes are:
- Exposures are missed because a PO or invoice was never added to the sheet.
- Rates go stale; decisions are made on yesterday's price.
- No visibility of "what if the naira falls 10%?" before the invoice is due.
- No record of what rate was actually achieved on currency bought, so hedging performance is never measured.
- No approval gate; one person can convert funds without a second check.

### 2.3 Why it matters
Margin protection is the core financial control for any business buying abroad. A systematic exposure view plus a disciplined buying/approval workflow turns a reactive, error-prone process into a controllable one.

---

## 3. Users, roles, and each role's main jobs

| Role | Main jobs |
|---|---|
| **Administrator** | Create and configure the organisation; invite and manage users and roles; set base currency; manage rate alerts and provider settings; run the approval workflow for currency purchases; ensure at least one active administrator always exists. |
| **Finance manager** | Review total exposure and rate sensitivity; approve or reject currency purchase requests; run what-if scenarios; review the monthly gains/losses/savings report. |
| **Finance officer** | Import POs, invoices and payment schedules; view the dashboard; create payment reminders; request currency purchases (subject to approval). |
| **Viewer** | Read-only access to exposure, rates, reports and audit log. Cannot import, create, approve, or change anything. |

**Separation of duties:** the person who requests a currency purchase cannot be the same person who approves it. An administrator with the "approve purchases" permission may approve; the requester cannot approve their own request.

---

## 4. Goals, non-goals, and measurable success criteria

### 4.1 Goals
1. Import purchase orders, invoices and payment schedules from spreadsheets (CSV) — real accounting-system sync is out of scope (see 4.2).
2. Calculate future foreign-currency needs by currency and week.
3. Show total exposure and how a rate move would change costs.
4. Track live and historical exchange rates for the currencies in use.
5. Recommend timing and amounts for currency purchases.
6. Run what-if scenarios (e.g. "the naira falls 10%").
7. Show the effect of exchange rates on product margins.
8. Alert when a rate hits a target or crosses a risk level.
9. Track currency bought and compare the rate achieved with the market.
10. Reminders for upcoming supplier payments.
11. Monthly report on currency gains, losses and savings.
12. Approval workflow before any currency purchase is made.

### 4.2 Non-goals (out of scope)
- Executing actual currency trades or initiating bank payments (HedgeHint recommends and records; it does not move money).
- Write-back to accounting systems (import only; export is CSV).
- Multi-entity / group consolidation (P1 later).
- Payment of suppliers directly from HedgeHint.
- Tax or VAT computation beyond what margin display needs.

### 4.3 Measurable success criteria
| Area | Metric | Target |
|---|---|---|
| Exposure | Imported POs/invoices reflected in the weekly currency-needs view | 100% |
| Rates | Live rate used in exposure calculation is no more than 60 minutes old (market hours) | 100% |
| Approval | Currency purchase requests blocked until an authorised approver (not the requester) approves | 100% |
| Alerts | Rate-target alerts fire within 15 minutes of the rate crossing the threshold | target |
| Margin | Margin impact figures recompute automatically when a rate or PO changes | 100% |

---

## 5. Scope split into P0, P1 and later

**P0 (launch):**
- Organisation, user and role management with separation of duties
- CSV import of purchase orders, supplier invoices and payment schedules
- Weekly foreign-currency needs by currency
- Total exposure view with rate-sensitivity ("if rate moves X%, cost changes Y")
- Live and historical exchange rates (one provider; fallback to manual entry)
- Purchase recommendation (buy now vs later) per exposure bucket
- What-if scenario (rate shift %) with cost re-computation
- Margin impact by product/supplier
- Rate target / risk-level alerts
- Currency bought tracking vs market rate achieved
- Payment due-date reminders
- Monthly gains/losses/savings report
- Approval workflow for currency purchases

**P1:**
- Direct accounting-system connections (QuickBooks, Xero, CSV is the P0 path)
- Multi-currency base currency per organisation (P0: one base currency per org)
- Forward-contract and option tracking
- Recurring / standing exposure templates

**Later:**
- Multi-entity consolidation
- Brokerage integration to execute trades
- Mobile app

## 6. User stories with testable acceptance criteria

**US-1 Import POs and invoices.** As a finance officer, I can upload a CSV of purchase orders and invoices so that my exposure is calculated.
- AC1: A valid CSV creates one `purchase_order` or `supplier_invoice` per row, linked to the organisation.
- AC2: Invalid rows (bad date, unknown currency, negative amount) are rejected with a per-row error; valid rows are still imported.
- AC3: The import is recorded as an `import_job` with status and row counts; an audit event is written.
- Failure path: a malformed CSV returns a 400 with row-level errors and creates no records.

**US-2 Weekly currency needs.** As a finance manager, I can see how much of each currency I need and when.
- AC1: The dashboard shows, per currency and per week, the total payable amount derived from POs and invoices due in that week.
- AC2: Figures update when a new PO/invoice is imported or a payment date changes.

**US-3 Total exposure and rate sensitivity.** As a finance manager, I see total exposure by currency and the cost impact of a rate move.
- AC1: Total exposure per currency is the sum of upcoming payables converted at the current rate to base currency.
- AC2: A rate-sensitivity table shows cost change for +/- 5%, +/- 10% rate moves.
- AC3: Every figure links to the underlying POs/invoices.

**US-4 Live and historical rates.** As a finance officer, I see current rates for the currencies I use.
- AC1: Rates are refreshed from the configured provider at least every 60 minutes during market hours.
- AC2: Historical rates are stored and used for past-period reporting; manual rate entry is possible when the provider fails.

**US-5 Purchase recommendation.** As a finance manager, I get a recommendation on when and how much currency to buy.
- AC1: Recommendation considers exposure due in the next 4 weeks, current rate vs historical average, and the organisation's risk appetite setting.
- AC2: Output is "buy now / wait / partial" with a suggested amount and rationale text.

**US-6 What-if scenario.** As a finance manager, I can model "the naira falls 10%".
- AC1: Applying a scenario re-computes exposure and margin impact without saving to live data (unless the user saves it as a named scenario).
- AC2: The scenario result shows the delta vs the base case.

**US-7 Margin impact.** As a finance manager, I see the effect of exchange rates on product margins.
- AC1: Margin % is recomputed using the current rate and shown per product/supplier.
- AC2: A rate move scenario updates margin impact.

**US-8 Rate alerts.** As a finance manager, I am alerted when a rate hits a target or crosses a risk level.
- AC1: An alert rule links a currency pair, a threshold rate, and a direction (above/below).
- AC2: When the live rate crosses the threshold, an alert record is created and the user is notified (in-app; email only when a provider is configured).
- AC3: Alerts can be acknowledged and dismissed.

**US-9 Track currency bought.** As a finance officer, I record currency bought and compare the rate achieved to the market.
- AC1: A purchase record stores amount, currency, rate achieved, date, and links to an approved purchase request.
- AC2: The system computes "rate achieved vs market rate at time of purchase" and the saving/cost in base currency.

**US-10 Payment reminders.** As a finance officer, I see upcoming supplier payments.
- AC1: A list shows invoices due within the next 30 days, ordered by due date.
- AC2: An overdue flag appears after the due date passes without a recorded payment.

**US-11 Monthly report.** As a finance manager, I receive a monthly report on currency gains, losses and savings.
- AC1: The report covers a calendar month and shows realised gains/losses on currency bought, unrealised exposure, and savings vs not hedging.
- AC2: It can be exported as CSV/PDF and is generated on demand (P0) or scheduled (P1).

**US-12 Approval workflow.** As a finance manager, no currency purchase happens without approval.
- AC1: A purchase request is created in `requested` status; it cannot be executed until an authorised user (not the requester) moves it to `approved`.
- AC2: Only `approved` purchases may be recorded as currency bought.
- AC3: Rejection requires a reason; audit trail captures request, approval/rejection, and who acted.


## 7. Domain model: entities, fields, relationships, identifiers

All identifiers are UUIDs (generated server-side). All timestamps are `timestamptz` (UTC). Tenant isolation: every business record belongs to exactly one `organisation`.

- **organisation** — id, name, base_currency (ISO 4217, e.g. GBP), risk_appetite (low/medium/high), created_at, created_by, status (active/suspended).
- **user** — id, email (unique), name, password_hash, role (admin/manager/officer/viewer), must_change_password (boolean), email_verified, created_at, updated_at.
- **organisation_member** — organisation_id, user_id, role (inherits/overrides user-level role for that org), joined_at, invited_by.
- **purchase_order** — id, organisation_id, supplier_name, supplier_ref, currency, amount, order_date, expected_payment_date, status (open/paid/cancelled), base_value_at_import, created_at, updated_at.
- **supplier_invoice** — id, organisation_id, purchase_order_id (nullable), supplier_name, invoice_ref, currency, amount, due_date, status (open/paid/overdue/cancelled), base_value_at_import, created_at, updated_at.
- **payment_schedule** — id, organisation_id, currency, amount, due_date, source (po/invoice/manual), linked_record_id, status.
- **exchange_rate** — id, currency_pair (e.g. GBP/USD), rate (base per 1 unit foreign), source (provider/manual), observed_at, recorded_at. Unique on (currency_pair, observed_at).
- **rate_alert** — id, organisation_id, currency_pair, threshold_rate, direction (above/below), status (active/dismissed/triggered), created_by, triggered_at, acknowledged_by, acknowledged_at.
- **purchase_request** — id, organisation_id, currency, amount, target_rate, rationale, status (requested/approved/rejected/executed), requested_by, requested_at, approved_by, approved_at, rejection_reason.
- **currency_bought** — id, organisation_id, purchase_request_id (nullable), currency, amount, rate_achieved, bought_at, market_rate_at_purchase, saving_base_currency, recorded_by.
- **scenario** — id, organisation_id, name, rate_shift_percent, currency_pair, created_by, created_at, is_saved (boolean).
- **import_job** — id, organisation_id, file_name, status (pending/completed/failed), rows_total, rows_ok, rows_error, created_by, created_at, completed_at.
- **import_error** — import_job_id, row_number, field, message.
- **audit_event** — id, organisation_id, user_id, action, entity_type, entity_id, details (jsonb), created_at, ip_address.
- **session** — id, user_id, token_hash, expires_at, created_at, revoked_at.
- **rate_provider** — id, organisation_id, provider (fixed list), api_key_enc, enabled, last_sync_at.

Relationships: organisation has many members, POs, invoices, rates, alerts, requests, buys, scenarios, import jobs, audit events. user belongs to many organisations via organisation_member. invoice links to optional purchase_order. purchase_request links to currency_bought.

## 8. State machines

### purchase_request
`requested` → `approved` (by authorised approver, not the requester) → `executed` (when currency_bought recorded)  
`requested` → `rejected` (by approver, requires rejection_reason)  
Any terminal (`executed`, `rejected`) cannot transition back.  
Enforcement: server-side; requester may not approve their own request.

### supplier_invoice
`open` → `paid` (when currency_bought or manual payment recorded covering amount)  
`open` → `overdue` (automatically when due_date passes and not paid)  
`overdue` → `paid`  
`open/cancelled` → `cancelled`  
`paid/overdue` cannot return to `open`.

### purchase_order
`open` → `paid` / `cancelled`.

### rate_alert
`active` → `triggered` (when rate crosses threshold) → `dismissed` (by user).  
`triggered` → `active` possible if re-armed (new rule or manual reset).

### import_job
`pending` → `completed` / `failed`.


## 9. Role-by-permission matrix, including separation of duties

| Action | Administrator | Finance manager | Finance officer | Viewer |
|---|---|---|---|---|
| View dashboard/exposure | ✓ | ✓ | ✓ | ✓ |
| Import POs/invoices | ✓ | ✓ | ✓ | ✗ |
| Create rate alert | ✓ | ✓ | ✓ | ✗ |
| Acknowledge/dismiss alert | ✓ | ✓ | ✓ | ✗ |
| Create purchase request | ✓ | ✓ | ✓ | ✗ |
| Approve/reject purchase request | ✓ | ✓ (not own) | ✗ | ✗ |
| Record currency bought | ✓ | ✓ (only on approved request) | ✓ (only on approved request) | ✗ |
| Run what-if scenario | ✓ | ✓ | ✓ | ✗ (read saved only) |
| Generate monthly report | ✓ | ✓ | ✓ | ✓ (read) |
| Manage users/roles/org settings | ✓ | ✗ | ✗ | ✗ |
| View audit log | ✓ | ✓ | ✗ | ✗ |

**Separation of duties rule:** a user who creates a `purchase_request` cannot approve the same request. The system enforces this at write time: `approved_by <> requested_by`. An administrator holding both "request" and "approve" permissions is a governance risk — see Risks (section 15). The audit log records every approval and rejection.

## 10. Business rules and invariants (must never be broken)

| Invariant | Enforcement |
|---|---|
| Tenant isolation: a user may only read/write records of their own organisation(s). | Server-side middleware on every read/write; organisation_id derived from session, never from browser. |
| No currency bought without an approved purchase request. | `currency_bought.purchase_request_id` must reference an `approved` request; checked in transaction. |
| Requester cannot approve their own request. | `approved_by <> requested_by` checked server-side. |
| Exchange rate uniqueness per pair + observed time. | DB unique index on `(currency_pair, observed_at)`. |
| Append-only tables (audit_event, exchange_rate) cannot be updated/deleted by the app role. | DB role revokes UPDATE/DELETE on those tables. |
| At least one active administrator must always exist. | Application guard on the last admin deactivation/password change. |
| A pending (unapproved) user cannot sign in. | Auth checks `approved` flag at sign-in; never reveals whether email exists. |
| Any password change ends existing sessions. | Password change revokes all sessions for that user; sessions table cleaned. |
| Import is atomic per job: valid rows committed, invalid rows recorded as errors, job status set. | Single transaction per import job. |
| Rate-sensitive reads use a rate no older than 60 minutes (stale-rate guard). | Server checks `exchange_rate.recorded_at`; marks exposure as "stale" if older. |

## 11. Screens, with empty/loading/error/permission-denied states

| Screen | Purpose | Empty state | Loading | Error | Permission denied |
|---|---|---|---|---|---|
| Landing page | Explain product via interactive exposure illustration | n/a (marketing) | skeleton | fallback | n/a |
| Sign-in / sign-up | Enter organisation; pending users cannot sign in | n/a | spinner | "invalid credentials" (no email reveal) | n/a |
| Dashboard | "What needs my attention now?" — exposure, alerts, reminders, recommendations | "No exposure yet — import your first PO/invoice" with import CTA | skeleton per widget | per-widget error + retry | 403 page |
| Exposure by currency/week | Table + chart of future FX needs | "No upcoming payments" | skeleton | error + retry | 403 |
| Rate sensitivity / what-if | Scenario slider, cost delta | base case shown with zero shift | spinner | error | 403 |
| Margin impact | Margin % per product/supplier | "No products imported" | skeleton | error | 403 |
| Live & historical rates | Rate table, last refreshed time | "No rates — add provider or enter manually" | spinner | error + manual entry fallback | 403 |
| Purchase requests + approval | Request currency, approve/reject | "No requests" | spinner | error | 403 (officer on approve action) |
| Currency bought vs market | Table of buys with saving/cost | "No currency bought yet" | spinner | error | 403 |
| Rate alerts | Create/edit/dismiss alert rules | "No alerts" | spinner | error | 403 |
| Payment reminders | Upcoming/overdue supplier payments | "No upcoming payments" | spinner | error | 403 |
| Monthly report | Gains/losses/savings, export | "No data for selected month" | spinner | error | 403 |
| Import (CSV) | Upload PO/invoice CSV | empty upload area | progress bar | per-row errors | 403 |
| User & org management | Admin only | "No users" | spinner | error | 403 |
| Audit log | Read-only event list | "No events" | spinner | error | 403 |


## 12. First-run journey: from empty database to first useful result

1. Administrator runs `npm run admin:create` (reads ADMIN_EMAIL/ADMIN_NAME/ADMIN_PASSWORD/ORG_NAME from env or `~/.config/hedgehint/admin.env`). Creates the administrator account and the first organisation. Never reachable from the web.
2. Administrator signs in (must replace temporary password at first sign-in; can reach nothing else until changed).
3. Administrator creates organisation (sets base currency, risk appetite) via Users & Org settings — actually created at admin creation if ORG_NAME given, else via interface.
4. Administrator invites finance officer/manager users (pending; must be approved before signing in).
5. Finance officer imports first PO/invoice CSV via the Import screen.
6. System calculates weekly currency needs, total exposure, rate sensitivity; dashboard populates.
7. Finance manager reviews exposure, runs a what-if scenario, creates a purchase request.
8. Administrator (or another manager) approves the request; officer records currency bought.
9. Monthly report generated for the first month.

Everything the first-run journey needs (reference lists: currencies, rate providers, risk appetite options) is creatable in the interface; no seeded data.

## 13. Notifications, reports, imports and exports

- **Imports:** CSV of POs, invoices, payment schedules. Max 4 MB (serverless request limit). Per-row errors; atomic per job.
- **Exports:** monthly report (CSV; PDF P1), exposure (CSV), rates (CSV).
- **Notifications:** in-app alerts for rate targets and overdue payments. Email only when an SMTP provider is configured (not built at P0); the sign-up/forgot-password flow explains email is not available until configured.
- **Reports:** monthly gains/losses/savings report, generated on demand (P0), schedulable (P1) via a scheduler-secret-protected endpoint.

## 14. Security, privacy, accessibility, performance and retention

- **Authentication:** Auth.js credentials provider. Passwords hashed (bcrypt). Password change resets all sessions.
- **Authorisation:** server-enforced RBAC + tenant scope on every read/write.
- **Audit trail:** every consequential change writes an `audit_event`; append-only at the DB level.
- **Encryption:** provider API keys encrypted at rest (encryption key required in production; cannot be recovered if lost — warned).
- **Accessibility:** WCAG 2.1 AA contrast, keyboard navigable, focus indicators, labels on all inputs.
- **Performance:** dashboard widgets load in < 2s; rate refresh ≤ 60 min; CSV import < 4 MB and completes within one function run.
- **Retention:** audit events retained indefinitely; exchange rates retained 24 months; import jobs 12 months. No personal data beyond email/name.
- **Sensitive data:** financial exposure data (business-sensitive). No health, legal, or personal beyond user credentials.

## 15. Integrations (real vs not built)

- **Real (P0):** CSV file import (local disk in dev, private object storage when hosted); exchange-rate provider via HTTP (provider TBD — configured by administrator; fallback to manual entry); scheduled report endpoint (secret-protected).
- **Not built at P0:** direct accounting sync (QuickBooks/Xero), email/SMTP notifications, brokerage execution, bank payment initiation, SSO/OIDC (credentials auth only at P0).

## 16. Risks, assumptions and open questions

**Assumptions (labelled):**
- An exchange-rate provider with a usable API is available and configured by the administrator (assumption; fallback is manual entry).
- One base currency per organisation at P0 (assumption).
- CSV is an acceptable import channel at P0 (assumption).

**Risks:**
- Administrator with both request and approve permissions can bypass separation of duties (mitigation: audit log + recommend splitting roles; document the risk).
- Rate provider downtime → stale rates (mitigation: manual entry + stale-rate guard on exposure).
- Provider API keys cannot be recovered if encryption key is lost (documented; key backup required).
- Commercial use of free hosting tiers may be restricted (confirm plan before deploying).

**Open questions:**
- Which exchange-rate provider to use (and its pricing/terms).
- GitHub repo and Vercel/Supabase project details (not yet provided).
- Whether email notifications are required at launch.

**Sibling comparison:** Strata RTC is real-time media infrastructure (dark UI, WebRTC/SFU, developer-facing). HedgeHint is a light finance dashboard for finance teams. Directions that read as a recolour or blend of Strata are rejected (see design brief, Phase C).

