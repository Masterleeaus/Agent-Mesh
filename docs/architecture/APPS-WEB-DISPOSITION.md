# apps/web disposition — native FSM preservation

Status: authoritative implementation ledger for #809 / #1066.

This ledger classifies reachable `apps/web` families by ownership intent. It is family-level; implementation work must refine individual files/routes before retirement. **Preserve -> classify -> converge -> verify -> retire.**

## Non-negotiable boundaries

- `apps/web` is the full native Titan FSM base web application, separate from the single Zero/Go/Hub PWA and single three-mode native mobile app.
- Mature native FSM remains useful without Frappe.
- Every tenant company has its own physical database for company-owned operational persistence; `company_id` remains explicit in contracts, queues, authority, verification, evidence and provider mappings.
- Optional Frappe facets use a separate site/database per company and never become Titan authority.
- A file is not RETIRE merely because it uses PostgreSQL or overlaps an ERPNext module.

## Family dispositions

| Reachable family | Primary disposition | Preserve / converge |
|---|---|---|
| clients / CRM / contacts | KEEP_NATIVE_FSM | customer/contact lifecycle, validation, relationships, permissions, search and company isolation |
| properties / locations | KEEP_NATIVE_FSM | service locations, access/site semantics, customer relationships, field context |
| requests / intake / booking-requests | KEEP_NATIVE_FSM | intake validation, conversion, scheduling handoff, idempotency |
| jobs | KEEP_NATIVE_FSM | job lifecycle, relationships, operational UX, automation hooks |
| work-orders | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | lifecycle/status/completion rules; extract reusable state-machine contracts where beneficial |
| visits / appointments | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | scheduling, closeout, active-visit/overlap semantics, evidence links |
| tasks / checklists / forms | KEEP_NATIVE_FSM | field completion semantics, required evidence, validation |
| scheduling | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | availability/overlap/schedulability algorithms behind provider-neutral inputs |
| dispatch | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | capacity/routing/assignment behavior; canonical Workforce/authority handles execution eligibility |
| estimates / quotes | KEEP_NATIVE_FSM | pricing, lifecycle, acceptance, conversion, documents |
| invoices / supported payments | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | native invoice/payment workflows; extract reversal/idempotency/verification contracts; deeper ERP accounting may be FRAPPE_EXTENSION |
| expenses | KEEP_NATIVE_FSM | field/service expense behavior; deeper accounting facet may be FRAPPE_EXTENSION |
| materials / inventory | KEEP_NATIVE_FSM | field materials/stock usage; advanced warehousing/procurement may be FRAPPE_EXTENSION |
| vehicles / mileage | KEEP_NATIVE_FSM | field fleet/mileage behavior; optional deeper asset/fleet facet may be extension |
| time / time-clock | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | field time behavior/corrections; payroll/HR processing may be FRAPPE_EXTENSION |
| workforce skills / availability | KEEP_NATIVE_FSM + MOVE_TO_CANONICAL_TITAN_RUNTIME | preserve human scheduling semantics; AI/human capability/authority identity belongs to canonical Workforce |
| pricing / price-book | KEEP_NATIVE_FSM | service pricing and quoting semantics |
| portal | KEEP_NATIVE_FSM | customer portal behavior; converge principal to explicit company/customer scope |
| field | KEEP_NATIVE_FSM | field workflows, offline/retry semantics, assignment-scoped access |
| communications | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | native business messaging UX/semantics; transport mechanics converge with Channels/Communications canonical owners |
| reports / attention | KEEP_NATIVE_FSM + EXTRACT_SHARED_CONTRACT | native operational reports; add Business Reality provenance/freshness instead of treating provider state as verified truth |
| documents | KEEP_NATIVE_FSM | operational documents/templates/evidence links |
| activities | KEEP_NATIVE_FSM | operational activity history; factual claims converge to Evidence Ledger semantics |
| change-orders | KEEP_NATIVE_FSM | field-service change lifecycle, approval and evidence |
| automations / business-workflows / revenue-journey | KEEP_NATIVE_FSM + MOVE_TO_CANONICAL_TITAN_RUNTIME | preserve product workflows; move duplicated Decision/Workforce/Authority/Execution mechanisms to canonical runtime |
| `lib/titan/*` Interaction/Decision/Workforce/authority/execution duplicates | MOVE_TO_CANONICAL_TITAN_RUNTIME | preserve IDs/context/correlation, then converge to canonical hosted runtime |
| reusable lifecycle/validation/idempotency/conflict algorithms | EXTRACT_SHARED_CONTRACT | move only when reuse/clean boundary is proven; native FSM remains owner |
| auth/session/security/HTTP/API/BFF/SSR/health/rate-limit/CSRF/origin/cookies | KEEP_BASE | base-web responsibility; normalize legacy account context to canonical company context |
| builder/settings/day-review/day-close and normal business UI | KEEP_BASE or KEEP_NATIVE_FSM | retain when part of base-web product; do not move merely because DirectAdmin has an operator cockpit |
| legacy account_id adapters / route-authoritative command bridges | COMPATIBILITY_ONLY | fail closed, map explicitly to company_id, retire only after canonical consumer cutover |
| Frappe adapters for explicitly delegated deeper ERP/HR/payroll/procurement/warehouse/manufacturing/custom facets | FRAPPE_EXTENSION | full owner/provider/mapping/sync/conflict/idempotency/authority/verification/evidence contract required |
| dead donors, duplicate generated/build artifacts, superseded app-local platform runtimes after verified replacement | RETIRE | removal requires reachability + parity + migration/rollback + tests |

## Database-per-company migration rule

Current shared/account-scoped PostgreSQL or SQLite business-state layouts are migration inputs, not the final tenancy topology. For native FSM:

1. resolve canonical `company_id` before selecting/opening a business database;
2. route to exactly one company database; missing/ambiguous mapping fails closed;
3. preserve `company_id` inside consequential envelopes/evidence even though the database is physically isolated;
4. never replay an offline/queued intent into the currently selected company database unless its original company context is re-authorized;
5. backup, restore, migrate and rollback company-by-company;
6. test company A credentials/IDs/queues cannot open, query or mutate company B database.

For optional Frappe, apply the same logical rules plus a distinct Frappe site/database per company.

## Retirement gate

Before changing any family to RETIRE:
- prove production reachability/consumers;
- identify behavior/contracts to preserve;
- migrate company-scoped data if storage changes;
- prove parity and negative cross-company tests;
- prove idempotency/retry and authority/evidence behavior;
- retain rollback/compatibility path for the declared window;
- record exact build/runtime verification.

No native FSM family is currently approved for wholesale retirement solely due to Frappe overlap.
