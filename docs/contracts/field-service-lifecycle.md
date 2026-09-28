# Canonical field-service lifecycle

The domain contract defines REQUESTED -> QUOTED -> APPROVED -> SCHEDULED -> IN_PROGRESS -> COMPLETED -> INVOICING_READY -> PAID while preserving company, customer, location, request, and job references. Persistence and provider mappings remain external adapters.

Consequential transitions require a current authority decision reference and idempotency key. Completion requires evidence and explicit verification; provider acknowledgement alone is rejected. Replays are no-ops for the same idempotency key and conflicts fail closed. Immutable events can feed the accepted-evidence ledger and downstream Workforce/Finance consumers.
