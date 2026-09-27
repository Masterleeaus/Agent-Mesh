# TZ-ROADMAP-47-SG-08 — Offline deterministic runtime checkpoint

## Static certification passed
- Replay scope is bounded by `company_id + actor_id + device_id`.
- Canonical agent/capability provenance, evidence refs, Signal origins, revisions and idempotency are retained.
- Offline authority contracts to `offline_contracted`.
- Offline approval cannot survive reconnect; server revalidation is mandatory.
- Replay is deterministic and rejects duplicate idempotency, unresolved conflicts, invalid contracts and revision regressions before transport.
- Background refresh cannot perform consequential execution.
- Mutation replay and Signal reconciliation require authenticated reachability.
- Cross-company, cross-actor and cross-device replay fail closed.
- Stale/elevated offline authority fails closed.
- Accepted mutation remains the prerequisite for resulting Signal publication.

## Runtime evidence boundary
Flutter/device/backend runtime certification is not claimed by this checkpoint because those runtimes are unavailable here. Static contracts, focused tests and package integrity are complete.
