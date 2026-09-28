# Accepted Evidence and Business Reality Contract

Status: active for the certified job-completion slice (`titan.business.accepted-evidence/v1`).

## Ownership matrix

| Concern | Canonical owner | Boundary |
| --- | --- | --- |
| Authority and consequential execution | `packages/tools/execution-gateway.mjs` | Decides whether a provider may run and requires independent verification. |
| Accepted factual history | `packages/tools/accepted-evidence-ledger.mjs` | Append-only, company-scoped records. Corrections are new records with `supersedes_evidence_id`. |
| Job current-state projection | `rebuildJobProjection()` in the accepted-evidence ledger | Deterministically rebuilds a read projection; it is not a second domain store. |
| Restart/recovery evidence | `packages/offline/restart-evidence-ledger.mjs` | Operational recovery evidence only; it is not business fact. |
| Workforce/value analytics | `packages/titan-platform/src/workforce-evidence/*` | Derived performance/value evidence; it cannot manufacture authority or business fact. |
| Provider receipts | `ExecutionGateway` evidence sink input | Intermediate execution history; provider acknowledgement is never a verified outcome. |

## Certified flow

`ExecutionGateway` emits `REQUESTED → AUTHORIZED → EXECUTING → PROVIDER_ACKNOWLEDGED → VERIFYING → VERIFIED/FAILED`.
The accepted ledger records every factual transition. A job projection is `VERIFIED` only when an active evidence record has `final_outcome: "verified"`; a provider acknowledgement or failed verification produces `UNKNOWN`.

## Invariants

- Every accepted record has a `company_id` and is returned only from that company scope.
- Accepted records are immutable. Duplicate evidence IDs are rejected.
- Simulated/counterfactual records cannot enter the factual ledger.
- Corrections and supersession append a new record and never rewrite history.
- Projection provenance includes the active evidence IDs and terminal evidence ID.
- The projection revision is a SHA-256 hash of canonical projection content, so the same evidence produces the same revision.
- Provider acknowledgement is not completion; independent verification is required before factual projection.

## Migration boundary

This is an additive owner for the certified job-completion slice. Existing restart, provider-receipt, workforce-value, revenue, and donor ledgers remain in place under their stated roles. Future migrations should route consequential factual business transitions through this sink rather than adding another factual ledger.

