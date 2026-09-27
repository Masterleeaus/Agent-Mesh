# Library Master Integration — Operations

Issue: #634
Backlog: TASK-152

## Canonical integration rule
1. Existing implemented operations and canonical domain docs remain authoritative.
2. Library/archive systems are donors only; do not create parallel CRM, Field, Booking/Quote, Commerce, Finance/Ledger, Payroll/People, Omnichannel or Reach engines.
3. Canonical operational vocabulary is Client → Property → Estimate → Job → Work Order → Visit → Invoice.
4. A supporting capability references canonical records instead of copying their truth.
5. Titan integration/authority scope is `company_id` only. Existing account-scoped persistence in the Dovetails host is not a second Titan authority boundary.
6. Planning, routing, recommendation, intelligence and registration do not confer execution authority.
7. Mutating operations must continue through the existing governed Business Ops/API/Command Bus path rather than direct donor execution.

## Deep-scan baseline

### Existing canonical operations seam
`packages/titan-platform/src/business-ops.ts` already exposes a bounded command catalog for:
- estimates / quotes
- projects / jobs
- work orders / dispatch
- visits / field execution
- invoices

The seam distinguishes read vs mutating commands, role eligibility, path materialization and risk classification. It should be extended only when a #634 donor capability maps cleanly to canonical operations.

### Existing domain truth
`docs/canonical/DOMAIN_MODEL.md` establishes:
- Client owns relationship/contact details.
- Property is durable service-location/history center.
- Estimate owns priced proposal/revision state, not execution/payment.
- Job owns project commitment, profitability rollup and invoice links/payment status.
- Work Order owns bounded executable scope/completion criteria, not billing.
- Visit owns scheduled/actual field execution, time/GPS/media/materials/activity evidence.
- Invoice owns collection/payment records.
- Booking request is supporting intake evidence, not a replacement job/work-order object.

### Existing backlog/code evidence
The active backlog records already-shipped or active implementations for operations/day state, payroll policies, activity/assignment, field/location capture, invoice generation/payment, profitability, materials/spend, receipt handling, billing seams and customer-care convergence. These must be inspected before any Library donor import.

## Domain convergence status
- **CRM / People — convergence complete:** Client/Property APIs remain canonical customer identity. Human workforce identity remains the existing scoped Users system, while Titan AI Workforce remains its separate authority-neutral organizational/control plane. Business Ops exposes read-only People context only; it does not create a second employee/user store or allow AI workforce activation to become human execution authority.
- **Field — convergence complete:** existing Job → Work Order → Visit lifecycle, scheduling guards, visit matching/location evidence, completion criteria and field APIs are already the canonical field system. Business Ops already exposes the field mutation/read seam; no donor field engine was introduced. Regression coverage now verifies canonical routes, company-scoped risk assessment and safe entity-path materialization.
- **Bookings / Quotes — first convergence complete:** existing booking-request intake creates/reuses Client/Property and links a draft Job; Estimate remains pricing/proposal truth and advances the request funnel. Business Ops now exposes the existing booking-request route alongside the already-canonical Estimate commands; no second booking/quote engine was created.
- **Commerce — convergence complete:** existing Invoice/Payment/material price-book/expense flows remain canonical. Business Ops now exposes existing Invoice and read-only Expense/Material context; no parallel commerce or payment engine was introduced.
- **Financial / Ledger — convergence complete for current scope:** existing Job Ledger/profitability projection, expense records, invoice paid/balance state and payroll clock remain separate canonical facts. Library Ledger semantics were not promoted into a second general ledger. Business Ops exposes financial context read-only except the existing governed invoice mutation path.
- **Payroll — baseline complete:** existing payroll clock and pay-type taxonomy were retained; no duplicate payroll engine was introduced. Payroll remains downstream of the canonical time clock/activity facts.
- **Omnichannel / Reach — authority convergence complete:** repository search did not establish a canonical generic outbound message/campaign API suitable for promotion into Business Ops. No donor send/execute command was invented. Existing explicit delivery commands such as invoice send remain mutating/governed. Future omnichannel/reach integration must bind to a verified canonical communications host and consent/delivery controls before exposure.

## First-pass findings
- A broad search did not surface a single monolithic Titan Operations runtime, which is positive: current operations are distributed across canonical domain/API/business-ops seams rather than a duplicate umbrella engine.
- `business-ops.ts` currently covers the central Estimate → Job → Work Order → Visit → Invoice mutation/read seam but does not yet advertise CRM/client/property, booking-request, payment/payroll, or communications commands. Those are gaps to audit against actual host implementation before adding anything.
- Canonical docs still describe persistence as account-scoped in the Dovetails host. For #634, this must not be interpreted as permission to introduce `account_id` as a Titan tenant/authority boundary; adapters must resolve host persistence scope before Titan governed execution.
- The backlog explicitly calls a unified Business Ledger strategic/not committed. Library Ledger code must therefore be treated as donor evidence and cannot silently create a new canonical ledger without a separately justified product/backlog decision.

## CRM / booking evidence
- Client API: `apps/web/app/api/v1/clients/route.ts` — scoped persistence, normalized names, audit logging.
- Property API: `apps/web/app/api/v1/properties/route.ts` — validates client ownership before property creation and maintains canonical Client → Property linkage.
- Intake pipeline: `apps/web/lib/intake/records.ts` — reuses client identity by email/normalized phone, reuses property by client/address, creates linked draft Job + booking request, records duplicate candidates and attention evidence.
- Booking funnel: `apps/web/lib/booking-requests/advance-stage.ts` — monotonic funnel progression with terminal states and status history.
- Estimate API: `apps/web/app/api/v1/estimates/route.ts` — validates canonical client ownership, retains Estimate pricing truth, links booking request and advances it to estimated.
- Convergence commit `1c218030` extends only the existing `business-ops.ts` command seam with Client/Property/Booking Request routes.
- Regression commit `0374cd3f` verifies route convergence, mutation classification/role gating, and company-scoped Titan risk assessment.
- No donor CRM, customer identity, property, booking or quote runtime was introduced.

## Field evidence
- `packages/domain/src/work-order-lifecycle.ts`: derives Work Order status from child visits and completion criteria; return/hold semantics prevent premature completion.
- `packages/domain/src/scheduling-guard.ts`: blocks active-visit conflicts and overlaps while allowing legitimate multi-day future scheduling.
- `packages/domain/src/visit-matching.ts`: deterministic customer/property matching with hard distance ceiling, dwell threshold, GPS-quality handling, coordinate relearning and field-day classification.
- `packages/domain/src/visits.ts`: canonical visit/checklist schemas and account-scoped visit records.
- `apps/web/app/api/v1/jobs/route.ts`: canonical Job creation automatically seeds a default Work Order and scopes records to the authenticated account.
- `apps/web/app/api/v1/work-orders/route.ts`: validates Client/Job/Property/source Visit/source Assessment relationships and keeps assessment-created work orders draft until the governed progression.
- `apps/web/lib/work-orders/validate.ts`: explicit foreign-key/account checks and completion guards.
- Business Ops already contains `projects.*`, `work_orders.*` and `visits.*` commands; no parallel dispatch framework was needed.
- `541c339f`: regression coverage for Field command convergence, company-scoped risk assessment and safe entity path materialization.

## Commerce / Financial evidence
- `packages/domain/src/job-ledger.ts`: existing pure Job Ledger projects estimate vs actual labor/material/equipment/other, paid balance and change-order variance without creating a separate general ledger.
- `apps/web/app/api/v1/invoices/route.ts`: existing account-scoped invoice lifecycle and paid/balance state.
- `apps/web/app/api/v1/expenses/route.ts`: existing account-scoped expenses with duplicate detection, job/client linkage and audit logging.
- `apps/web/app/api/v1/materials/route.ts`: existing account-scoped material price book; AI estimates are explicitly prevented from polluting purchase averages.
- `packages/domain/src/payroll.ts`: existing payroll clock taxonomy and deterministic clock validation/duration helpers.
- `b4c72886`: Business Ops exposes only existing expense/material read context; invoice mutations remain the existing governed path.
- `5e91983d`: regression coverage for commerce/financial route convergence, mutation boundaries and company-scoped risk context.

## People / Omnichannel / Reach evidence
- `apps/web/app/api/v1/users/route.ts`: existing scoped human workforce identities with owner/admin access, owner-only privileged role creation, duplicate-email protection and audit logging.
- `packages/titan-platform/src/workforce.ts`: Titan AI Workforce is already a company-bound organizational/control plane with explicit activation-not-authority semantics and governed delegation/escalation contracts. It must not replace the human Users identity store.
- `packages/domain/src/activities.ts`: existing activity taxonomy already includes customer communications, follow-up and marketing as operational evidence categories.
- Repository search did not establish a canonical generic outbound campaign/message endpoint safe to expose as a new Business Ops command. No donor Reach/Omnichannel executor was invented.
- `f6065926`: added read-only People context through the existing Users route.
- `ba2b5a4d`: regression coverage ensures People is read-only/company-scoped and generic Reach/Omnichannel send commands remain absent until a governed canonical host exists.

## Final convergence audit
- Public package surface already exports `business-ops.ts` from `src/index.ts` and the package `./business-ops` export; no parallel Operations package was required.
- Final registry inspection found one concrete consistency defect from the People pass: `people.list` was declared in the command-id union but missing from the command registry. Commit `033efb53` fixes the registry by binding it to the verified existing `/api/v1/users` read route.
- `d79d3249` adds whole-catalog regressions: unique/resolvable command IDs, company-scoped Titan risk assessment for every exposed operation, and explicit absence of unverified donor executors such as `ledger.post`, `payroll.run`, generic message/campaign sends, Reach execution and People creation.
- Canonical domain remains Client → Property → Estimate → Job → Work Order → Visit → Invoice, with booking/intake, expenses/materials, payroll/activity and People as supporting referenced capabilities.
- No second CRM, scheduling/dispatch, field, quote, commerce/payment, financial/general-ledger, payroll, People, Omnichannel or Reach runtime was introduced.
- No archive/Library donor became a runtime dependency.
- Titan integration scope remains `company_id`; host `account_id` remains persistence compatibility rather than a second Titan authority boundary.
- Mutating commands remain classified as mutations and flow through existing host endpoints; routing/intelligence does not itself confer execution authority.
- Tests were added throughout convergence but were not claimed as executed in this connector session.

## Status
#634 convergence implementation is complete on `agent/634` and is ready for canonical PR review/CI.
