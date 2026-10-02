# Canonical field-service lifecycle contract

Issue #183 owns the provider-neutral lifecycle contract. Native Titan FSM/domain services remain the system of record; provider adapters and surfaces do not define a second state machine.

## Stable contract

The published package schema is `titan.field-service-lifecycle.v2`. The lifecycle carries only canonical references:

`company → customer → service request/job/work order → appointment/visit → invoice/payment`.

It deliberately does not expose provider DocTypes, tables, database handles, credentials, or authority grants. `authority_granted` is always false. Provider adapters must resolve current authority and execute through the governed command path before applying a consequential mutation.

## Lifecycle and event rules

The valid progression is:

```
REQUESTED → QUOTED → APPROVED → SCHEDULED → IN_PROGRESS
          → COMPLETED → INVOICING_READY → PAID
```

Any non-terminal stage may transition to `CANCELLED`; terminal stages cannot be reopened by this contract. Every event contains the company scope, contiguous revisions, idempotency key, authority decision reference, governed execution receipt reference, evidence references and observed verification reference.

- Cross-company mutations, invalid skips and stale expected revisions fail closed.
- Replaying the same idempotency key and payload returns the existing lifecycle unchanged.
- Reusing an idempotency key with a different payload fails closed.
- Every consequential transition (`COMPLETED`, `INVOICING_READY`, `PAID`) requires transition-specific evidence and observed verification.
- A provider acknowledgement is never observed verification or completion.
- Verified outcomes require company scope, evidence and independent observed verification.

## Compatibility boundary

Existing native lifecycle, scheduling, dispatch, capacity, closeout and validation rules remain semantic owners. Legacy persistence and route implementations may remain compatibility donors while consumers migrate behind this contract. Provider materialization is an adapter concern and must preserve Titan stages and company identity; lossy or unknown provider states must be rejected rather than silently changing Titan semantics. Accepted evidence remains factual history; lifecycle events are immutable projections and do not rewrite it.
