# HedgeHint: Design Brief

| | |
|---|---|
| **Product** | HedgeHint — FX exposure autopilot for importers |
| **Status** | Draft v1.0. Specification for UI implementation; nothing is built yet. |
| **Principle** | Design for the question, not decoration. Every figure links to its records. Empty states designed as carefully as full ones. |

---

## 1. Domain concept

**Objects the user lives with:** purchase orders, supplier invoices, payment schedules, exchange rates, exposure buckets, hedge recommendations, rate alerts, currency bought, monthly reports.

**The core ritual:** the weekly finance review — "What do I owe in which currency, when is it due, what rate am I exposed to, and should I buy now or wait?"

**The central tension:** buying currency early locks in a rate (protects margin, ties up cash) versus waiting (keeps cash flexible, risks an adverse move). HedgeHint's job is to surface that tension explicitly with data, not remove it.

**Documents:** CSV import (POs/invoices), what-if scenarios, approval requests, monthly gains/losses/savings report.

## 2. Visual language

### Palette (contrast checked against WCAG 2.1 AA)

| Role | Token | Use | Contrast (vs background) |
|---|---|---|---|
| Background | slate-50 `#F8FAFC` | page canvas | — |
| Surface | white `#FFFFFF` | cards, modals | — |
| Text primary | slate-900 `#0F172A` | headings, body | ~16.6:1 on slate-50 ✓ |
| Text secondary | slate-600 `#475569` | captions, meta | ~5.8:1 on slate-50 ✓ |
| Primary brand | slate-900 `#0F172A` | buttons, active states | white on slate-900 ✓ |
| Accent "act now" | amber-600 `#D97706` | primary CTA, buy-now signal | ~3.7:1 on white (use amber-700 `#B45309` for small text) ✓ |
| Risk / overdue | rose-600 `#DC2626` | overdue, risk alerts | ~4.6:1 on white ✓ |
| Positive / saved | emerald-600 `#059669` | savings, favourable variance | ~4.6:1 on white ✓ |
| Currency colours | consistent per currency | USD=blue-600, EUR=indigo-600, GBP=slate-600, NGN=amber-600, CNY=emerald-600 | each ≥4.5:1 on white for small text |

Note: amber-600 `#D97706` on white is ~3.7:1, below AA for small text; used only for icons/buttons ≥24px or paired with amber-700 `#B45309` for text. Final check at build time with a contrast tool.

### Type pairing
- **Headings:** serif stack (`Georgia`, `Cambria`, `Times New Roman`, serif) — editorial, trustworthy, finance-document feel; no web font dependency.
- **UI / body / data:** system sans (`-apple-system`, BlinkMacSystemFont, `Segoe UI`, Roboto, `Helvetica Neue`, Arial, sans-serif) — neutral, highly readable at small sizes.
- Numbers use tabular figures (`tabular-nums`) so columns align; currency and rates right-aligned.

### Layout system
- 8px grid. Max-width container 1280px centered.
- Desktop: left collapsible navigation (220px), top bar, main content with dashboard grid (4-column base) and full-width tables.
- Phone: single column, navigation in bottom sheet/drawer, tables scroll horizontally, cards stack.
- Cards: subtle slate-200 border, 12px radius, padding 24px; tables with sticky headers.

### Motion
- Subtle fade-in/slide-up for widgets and cards (duration 150–200ms).
- Alerts slide in from top-right, dismissible.
- No autoplay, no looping animation; respects `prefers-reduced-motion` (motion disabled).

### Signature element: the Exposure Ribbon
A horizontal week-by-week ribbon showing foreign-currency need by week (one bar per week, coloured by dominant currency). A vertical "today" line. Underlaid rate bands show current vs historical 90-day range. Hovering a week links to the POs/invoices driving it; clicking opens the exposure detail. This is the one element unique to HedgeHint — it makes "what do I need and when" instantly scannable.


## 3. Directions considered

**Direction A — "Desk" (data-dense, trading-desk inspired).** Gray/amber, tight tables, lots of numbers, minimal illustration. Pros: feels like the spreadsheets users already use; high information density. Cons: can feel intimidating to occasional reviewers; dense numerics on phone are hard.

**Direction B — "Calm" (light, spacious, high-trust).** Slate-50 canvas, slate/blue primary, amber act-now accent, generous whitespace, clear hierarchy, the Exposure Ribbon as the hero visual. Pros: approachable, trustworthy, reads like a finance dashboard not a terminal; works well on phone. Cons: less "urgent" feel — mitigated by amber/rose signals for overdue and alerts.

**Direction C — "Signal" (dark, alert-driven).** Dark background, neon amber/rose signals, high contrast. Pros: grabs attention for volatility. Cons: finance working documents are light-world; dark-only risks fatigue; too close to a trading terminal aesthetic.

**Pick: Direction B ("Calm") with Direction A's density reserved for tables.** Finance teams review exposures and approve hedges; clarity and trust beat urgency theatre. Dark mode may be offered later as an opt-in, not the default.

## 4. Comparison with sibling project (Strata RTC)

Strata RTC is real-time media infrastructure: dark UI, developer-facing, WebRTC/SFU concepts, live-call and recording visualisation. HedgeHint must **not** resemble it:
- Reject dark-only palettes and neon accent styles (Strata's media aesthetic).
- Reject real-time/transport metaphors (frames, sessions, relays).
- HedgeHint is a light finance dashboard for finance teams: documents, schedules, rates, approvals, reports.

No direction here is a recolour or blend of Strata.

## 5. Landing page

Explains the product through **one interactive illustration of the core mechanism**: an "Exposure vs rate move" slider. The user drags a rate-shift slider (e.g., "the naira falls 10%") and an illustrative cost delta updates on a sample import.

- Illustrative figures and names labelled: "Illustrative — Acme Imports, GBP/USD, sample data; not real customer data."
- No fake testimonials, customer logos, usage numbers, certifications, or guarantees.
- Clear CTA to sign up / request access; sign-up creates a pending request (per PRD).

## 6. Application

**Dashboard answers "what needs my attention now?"** using values computed from stored data:
- Total exposure by currency (links to exposure detail).
- Stale-rate warning if the latest rate is older than 60 min (links to rates).
- Overdue invoices (links to payment reminders).
- Pending purchase requests awaiting approval (links to approval queue — manager/admin only).
- Upcoming payments in next 7 days (links to reminders).
- Active rate alerts triggered (links to alerts).

Every figure links to its records (click → the underlying POs/invoices/rates).

**Visualisations chosen for the question:**
- Exposure by currency/week → bar ribbon (Exposure Ribbon).
- Rate sensitivity → small table of +/- 5/10% cost deltas.
- Margin impact → table per product/supplier.
- Currency bought vs market → table with saving/cost column.
- Rate history → sparkline per pair.

**Empty states** (every new customer sees them first): each screen shows an illustrative empty state with a clear next step (e.g., "No exposure yet — import your first PO/invoice" with import CTA), never a blank table.

**Accessibility:** WCAG 2.1 AA contrast, keyboard-navigable (all actions reachable via Tab), visible focus indicators, labels on all inputs, form errors announced. Checked at desktop and phone widths.

## 7. Next step

Build Phase D: create the Next.js app at the repo root of this project and implement P0 features (auth, organisations, CSV import, exposure, rates, recommendations, what-if, alerts, approvals, currency bought, reminders, monthly report), backed by the pure `domain/` modules and Prisma/PostgreSQL.

