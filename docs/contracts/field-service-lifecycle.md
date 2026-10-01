# Canonical Field-Service Lifecycle

Issue #183 owns the provider-neutral lifecycle contract. Native Titan FSM/domain services remain the system of record; Frappe/ERPNext is an optional delegated provider for explicitly mapped facets. This package is a deterministic projection boundary, not a second CRM or persistence engine.

## Stable contract

The published subpath is `@titan-zero/domain/field-service-lifecycle` and schema `titan.field-service.lifecycle.v2`. It reconciles these references without exposing provider DocType/table names:

`company → customer → contact → location → service request → job/work order → quote → appointment/visit → task/checklist → dispatch → worker/vehicle → invoice → payment`.

The lifecycle state sequence is:

```text
REQUESTED → QUOTED → APPROVED → SCHEDULED → IN_PROGRESS
          → COMPLETED → INVOICING_READY → PAID
```

Every event carries `company_id`, `lifecycle_id`, contiguous `revision`, stable `idempotency_key`, an authority decision reference, provider-neutral references, and evidence references. Cross-company events, legacy tenant boundary keys, invalid skips, and stale revisions fail closed. Replaying an existing idempotency key is a no-op only when it names the same transition; a conflicting reuse is rejected.

## Governed execution and evidence

Adapters must send consequential transitions through #14's `ExecutionGateway`/governed execution path. `executeFieldServiceTransition` requires an approved authority decision, risk approval, an independent `VERIFIED` gateway result, and durable gateway evidence before folding the lifecycle event. A provider acknowledgement or HTTP success is never completion.

`COMPLETED` requires observed evidence and explicit verification. `INVOICING_READY` additionally requires verified completion, positive invoiceable lines, and evidence. `PAID` requires a payment reference and evidence. The accepted-evidence ledger (#913) remains the factual history; this fold only projects it.

## Native/provider parity

`projectNativeFieldServiceLifecycle` maps native provider states into the stable Titan sequence and rejects unknown/lossy mappings. It preserves provider-neutral references for multi-day/return visits, overlap and active-visit outcomes, completion criteria, worker skills/availability, capacity, vehicle assignment, invoice lines, and payment identifiers. Existing `work-order-lifecycle.ts`, `scheduling-guard.ts`, visit-conflict, capacity, quick-book, closeout, and validation rules remain canonical owners; adapters provide their already-validated observations rather than reimplementing them.

Surfaces and Workforce consume this contract through authenticated adapters. They must not write provider storage directly, choose a company from unverified event fields, or treat Frappe state as a replacement for Titan lifecycle semantics. Physical company database/site resolution remains the provider/storage owner’s responsibility and must be bound to the same `company_id`.

## Recovery and compatibility

Events are immutable and replayable through `replayFieldServiceLifecycle`. Corrections, supersession, provider reconciliation, retry, and restart produce new evidence/events; they do not rewrite factual history. Legacy `account_id`/tenant fields may be normalized at compatibility ingress but are not accepted as canonical lifecycle identity.

