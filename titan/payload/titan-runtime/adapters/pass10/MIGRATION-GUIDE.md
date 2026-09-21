# Runtime Adapter Migration Guide

## Current state

Titan Zero currently retains the existing Retriever compatibility runtime while adding the typed Runtime Adapter path.

## Migration order

1. Prefer typed adapter feature detection and protocol negotiation.
2. Require an external Titan governance decision before preparing a typed work submission.
3. Submit typed work through `TITAN_WORK_SUBMIT`.
4. Consume accepted/progress/complete/error lifecycle events through the typed lifecycle.
5. Use cancellation only when it was negotiated as a capability.
6. On navigation, reload, restart, or transport disconnect, classify and recover the adapter session. Never reuse stale authority evidence after a boundary-changing recovery.
7. Use the legacy DOM bridge only when typed negotiation is unavailable/incompatible and fallback was explicitly declared available.
8. Continue emitting legacy fallback deprecation telemetry.
9. Do not remove `retriever-background.iife.js`, `content.css`, or the retained compatibility boundary merely because this packet is complete. Retirement is a Manager decision after convergence and a fresh runtime reachability/equivalence scan.

## Manager integration

This delta is additive relative to frozen Merge39. Forward-port onto the current Manager baseline rather than rolling back Merge40–42 work. Strip `Agent Mesh/` coordination files before production merge.

## Post-convergence retirement evidence

A later slimming pass may test retirement of the Retriever donor runtime only when all of the following are true:
- Runtime Adapters has been Manager-converged.
- Manifest/HTML/import/resource reachability is clean.
- Compatibility message semantics remain covered.
- Typed path and fallback regression suites remain green.
- No company/authority boundary regression is introduced.
- Exact reconstruction and whole-tree regression gates pass.
