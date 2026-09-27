# Manager Control-Plane Consolidation — Install-Ready G3 Candidate

This install-ready candidate consolidates the Manager changes prepared after the Generation 2 canonical baseline.

## Included changes

### 1. Stable canonical artifact identity
Canonical promotion now requires Library identity metadata rather than leaving builders to rediscover a ZIP by filename. The canonical record carries stable Library identity/version metadata and a direct materialization contract. Promotion fails closed with `CANONICAL_ARTIFACT_IDENTITY_REQUIRED` when required identity is absent.

### 2. Automatic idle-agent sweep
An AVAILABLE agent is reconciled immediately: it self-claims the highest-priority compatible work or deterministic maintenance work. Stale generation state is converted to `REBASE_REQUIRED` instead of silently idling.

### 3. Final-pass auto-rollover
Completing a packet moves it to `CONVERGENCE_PENDING` and immediately releases the builder to claim the next eligible packet while Manager/Supervisor review continues in parallel.

### 4. Structured history preservation
Runtime Manager events append only to `history.manager_events`; existing structured historical sections are preserved.

### 5. Lifecycle normalization
Legacy `DONE` is accepted as completed and normalizes to `MERGED`. `MERGED` and `PROMOTED` satisfy hard dependencies. `CONVERGENCE_PENDING`, `ACTIVE`, `CLAIMED`, and `VERIFYING` do not. Canonical `state` takes precedence over conflicting legacy `status` while both remain readable for compatibility.

### 6. Selective promotion rebase
A canonical generation advance no longer hard-stalls every active builder. Non-conflicting active packets may continue with `generation_drift: SOFT_ALLOWED` and rebase at convergence. Hotspot/path collisions, contract-breaking promotions, and explicit global-rebase promotions still require hard `REBASE_REQUIRED` behavior.

## Provenance

The live Library baseline resolved before packaging was `Titan-Code-CANONICAL.zip`, Generation 2, SHA256 `64bf43a24d63387ffaa3e72103bc8d8a258293a8cc88ef1a4ef324ab8f0d6587`.

The live `/Titan Code/Delta Queue` returned no entries before packaging, so there were no live delta ZIPs left to merge or delete.
