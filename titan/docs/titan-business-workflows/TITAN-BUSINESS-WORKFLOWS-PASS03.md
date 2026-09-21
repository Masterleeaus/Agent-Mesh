# Titan Business Workflows — Pass 03

Adds deterministic, persistence-agnostic workflow execution state for correlation, idempotency, retries, and restart-safe resumption. State stores no business payload; canonical records remain authoritative.

Transitions use optimistic revision checks. Duplicate event IDs are deterministic no-ops. Retries reuse the same workflow idempotency key and are capped by a bounded retry budget. Resume requires exact company, correlation, and idempotency identity. Terminal states cannot be rewritten by later events.
