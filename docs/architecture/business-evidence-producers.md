# Business Evidence producer ownership

## Current production path

`services/workforce/src/hosted-runtime.ts` composes the native field-service
runtime in `services/workforce/src/field-service-runtime.mjs`. That runtime
injects its execution evidence sink into `ExecutionGateway` and persists
`gateway_execution` rows in the company-scoped Workforce database. The rows
contain the canonical `AcceptedEvidenceLedger` record in their payload. The
runtime appends execution lifecycle evidence inside its guarded persistence
transaction, and its projection rebuilds accepted job reality from persisted
ledger records. DirectAdmin Workforce uses this same composition.

The provider acknowledgement remains a factual execution receipt, not proof
that a work order completed. The field-service runtime independently rereads
the company work-order owner before it records `VERIFIED` and before the
accepted job projection changes. Reassignment and other Workforce effects also
use the `AcceptedEvidenceLedger` after their owner-specific verification.

## Typed SQLite evidence adapter

`packages/tools/business-evidence-execution-sink.mjs` adapts generic
`ExecutionGateway` lifecycle records through
`business-evidence-adapter.mjs` and appends them through
`SqliteBusinessEvidenceStore`. Its stable IDs, replay collision checks,
verified-job fact rule, and SQLite reopen behavior have focused tests. The
ownership inventory records that this sink currently has no non-test
production composition. Its test coverage is not evidence that the hosted
field-service runtime uses the typed adapter.

## Remaining integration

The production Workforce path currently persists accepted-ledger records in
the legacy-compatible `gateway_execution` payload shape; it does not populate
the typed Business Evidence columns through `SqliteBusinessEvidenceStore`.
Production placement and safe migration of company databases must be resolved
through the canonical company-storage owner before wiring that adapter. The
production consumer must also retain atomic authority fencing, idempotent
replay, and independent outcome verification; moving writes to an out-of-band
sink would weaken those guarantees.

The current field-service projection covers verified job completion. It does
not certify cross-domain projections, a general correction/supersession
workflow, retention and legal holds, backup expiry, or live-provider recovery.
Those integration and certification requirements remain open in #1308 and
coordinated storage work (#1233).

The evidence schema migration is additive and forward-only. See
`db/sqlite/006_business_evidence_ledger.md` for legacy defaults and migration
recovery guidance. Company deletion is a separate guarded cleanup path; it is
not a substitute for evidence retention, legal-hold, or backup-expiry policy.
