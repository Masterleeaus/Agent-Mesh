# Business Evidence producer ownership

The canonical native field-service execution producer is
`packages/tools/execution-gateway.mjs`, composed with
`createBusinessEvidenceExecutionGateway` from
`packages/tools/business-evidence-execution-sink.mjs`. Its sink adapts gateway
lifecycle receipts through `business-evidence-adapter.mjs` and appends them to
the company-scoped `SqliteBusinessEvidenceStore`. Provider integrations must
supply an independent verifier for consequential completion; a provider ACK is
only an execution receipt.

The sink persists `execution.uncertain` as execution history when verification
is unavailable or fails. It does not produce a job-status fact for uncertain
outcomes. Only an independently verified `job.*` result yields
`job.status.verified`. If a process stops between the execution receipt and
the derived job fact, replaying the same stable gateway evidence ID repairs the
append; replay compares canonical fields and rejects identity collisions.
Corrections append a new `job.status.corrected` row linked with
`supersedes_evidence_id`; accepted history is never edited.

The evidence schema migration is additive and forward-only. See
`db/sqlite/006_business_evidence_ledger.md` for legacy defaults, migration
recovery and rollback guidance. Restore only from a verified backup under the
controlled recovery procedure; do not drop accepted evidence or rewrite the
ledger to roll back an application release.

This documents the native `job.complete` producer path and its local
verification tests. It does not certify live-provider behavior, hosted
production recovery, or release acceptance; those remain separate gates.
