# Titan Business Workflows — Pass 05

Pass 05 adds compensation and repair planning for partial business-workflow failures without destructive rollback.

Key invariants:
- externally completed canonical effects are preserved;
- failed effects retry forward through the canonical domain surface using the original idempotency key;
- unknown or in-flight effects reconcile against canonical business state before any retry;
- repair commands remain company/correlation scoped and require canonical-domain authorization;
- the workflow layer never becomes a second business database and never gains authority from identity.
