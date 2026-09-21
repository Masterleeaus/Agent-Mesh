# Titan Zero Runtime Adapter Protocol — Final v1

## Purpose

The Runtime Adapter layer introduces a typed, authority-neutral execution path for Titan Zero while preserving the existing Retriever compatibility transport and DOM fallback during migration.

## Boundary rules

- `company_id` is the sole tenant boundary.
- `tenant_id` and `tenant_company_id` are rejected at adapter boundaries.
- Adapter identity, runtime identity, feature discovery, capability negotiation, and reconnection never grant execution authority.
- Work execution requires an explicit external governance decision.
- Navigation/reload/restart invalidates stale authority snapshots and requires fresh evaluation where the session boundary changed.

## Protocol

Typed adapter envelopes use `titan-zero-execution-adapter-envelope/v1`.

Lifecycle messages:
- `TITAN_ADAPTER_HELLO`
- `TITAN_ADAPTER_HELLO_ACK`
- `TITAN_WORK_SUBMIT`
- `TITAN_WORK_ACCEPTED`
- `TITAN_WORK_PROGRESS`
- `TITAN_WORK_COMPLETE`
- `TITAN_WORK_ERROR`
- `TITAN_WORK_CANCEL`
- `TITAN_WORK_CANCELLED`

Core capabilities:
- `work_submission`
- `progress_observation`
- `result_delivery`
- `cancellation`

## Negotiation

Versions are major/minor. Matching major versions negotiate the lower supported minor. Incompatible major versions fail typed negotiation. Capability selection is the set intersection; discovery never implies permission or authority.

## Typed work lifecycle

The typed lifecycle supports submission, acceptance, monotonic progress, completion, explicit errors, timeout, cancellation request, and cancellation acknowledgement. Terminal replay is blocked deterministically.

## Session recovery

Adapter sessions carry immutable `company_id`, runtime identity, adapter version, navigation key, correlation identifiers, and an epoch. Navigation/staleness may recover only when the session is resumable; recovered sessions clear stale authority snapshots and require fresh negotiation/authority evaluation. Cross-company sessions never resume in place.

## Legacy fallback

The existing Retriever DOM bridge is retained as a fallback only. Fallback is prohibited while typed negotiation is healthy. Fallback emits explicit deprecation telemetry and reuses the existing `TITAN_EXECUTE_OUTCOME` compatibility transport without gaining authority.

## Compatibility

Existing Retriever event semantics remain recognized:
- `TITAN_EXECUTE_OUTCOME`
- `TITAN_OUTCOME_PROGRESS`
- `TITAN_OUTCOME_RESULT`
- `TITAN_OUTCOME_ERROR`
- readiness/ping behavior

The protected Retriever background runtime remains outside this Builder's retirement authority. Manager may evaluate retirement only after convergence plus a fresh reachability/equivalence scan.
