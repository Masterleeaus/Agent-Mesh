# TZ-ROADMAP-47-SG-08 — Offline deterministic runtime convergence
Parent: Titan-Mobile-MVP-SG07-CHECKPOINT-Pass04.zip

## Pass 1 — provenance + reconnect authority gate — COMPLETE
Converged required offline provenance around existing queue/replay infrastructure: company_id, actor_id, device_id, canonical agent_id, capability_id, contracted authority, approval state, Signal origins, evidence refs, revisions and idempotency. Reconnect is explicitly Command Bus/server-authority revalidated; Signal publication follows accepted mutation only.

## Pass 2 — deterministic conflict/revision convergence — COMPLETE
Added a deterministic replay planner in front of transport execution, ordered by queue sequence/creation/id; duplicate idempotency keys, open conflicts, invalid replay contracts, non-monotonic target revisions and invalid revision dependencies fail closed before transport. Added queue-integrity auditing for duplicate sequences and target revision regressions and focused tests.

## Pass 3 — lifecycle/background reconnect convergence — COMPLETE
Added company/actor/device-scoped lifecycle reconnect policy for app resume, connectivity restoration and background refresh. Mutation replay and Signal reconciliation require authenticated reachability; every replay path retains server authority revalidation. Background refresh is explicitly projection/sync preparation only and cannot autonomously execute consequential work.

## Pass 4 — adversarial checkpoint — COMPLETE
Certified cross-company/actor/device isolation, duplicate idempotency rejection, stale/elevated authority rejection, mandatory reconnect revalidation, evidence/provenance continuity, deterministic conflict handling, authenticated reconnect gating and background authority contraction. Produced cumulative SG08 checkpoint.
