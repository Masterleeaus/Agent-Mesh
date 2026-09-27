# Titan Business Workflows — Pass 06

Pass 06 adds stable, read-only workflow progress models for UI and agent consumers.

## Contract
- Projects workflow execution state into `PENDING`, `ACTIVE`, `BLOCKED`, `COMPLETE`, or `FAILED`.
- Emits actionable blocker classes (`RETRY`, `RECONCILE`, `REVIEW`, `ESCALATE`) derived from repair state.
- Keeps canonical business/domain state authoritative.
- Does not expose `processed_event_ids`, idempotency keys, mutable internal state, or write methods.
- Read access is bounded by `company_id` and `correlation_id`.
- Read models never grant workflow mutation or execution authority.
- Destructive rollback remains forbidden.
