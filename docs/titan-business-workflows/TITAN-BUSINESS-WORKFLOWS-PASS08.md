# Titan Business Workflows — Pass 08

Implemented operational repair diagnostics for orphan jobs, orphan invoices, broken booking links and payment reconciliation gaps.

## Contract
- Diagnostics consume read-only canonical evidence.
- Canonical business records remain source of truth.
- Diagnostics never mutate business state directly.
- Repair commands are explicit, company/correlation scoped and bound to a canonical domain surface.
- Every repair command requires canonical-domain authorization and idempotency.
- Destructive rollback is forbidden.
