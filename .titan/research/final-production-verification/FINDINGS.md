# Findings

## P0 — Zero is not yet a production runtime entrypoint

`apps/web/app/app/ZeroChatFirst.tsx` currently submits a GET form to `/app/zero` with `q=...`. There is no demonstrated production dispatch into the persistent Agent Runtime from this component.

`apps/web/app/app/zero/page.tsx` also still supplies all business pulse values as hard-coded zeroes.

This is the clearest missing link in the user-facing canonical path.

## P0 — Existing tests validate subsystems, not the full business loop

Strong isolated tests exist for:

- workforce lifecycle/company isolation;
- runtime lifecycle and approval/MFA resume;
- authority denial;
- unverified outcome rejection;
- execution idempotency/evidence;
- Browser Node domain/company boundaries;
- MCP discovery without authority;
- memory ingestion/deduplication;
- chat protocol/persistence/resume/storage adapters.

But no single test currently proves:

Zero user message → WorkItem → persistent runtime → approval/authority → ExecutionGateway → verified evidence → Zero result.

## P0 — SQLite verification is not process-restart certification

The SQLite RunStore test uses `better-sqlite3(':memory:')`. It validates store semantics and company isolation but cannot prove recovery after an actual process/database restart.

## P0 — Generic full gate validates the old PostgreSQL integration path

`scripts/gate.sh` uses an ephemeral PostgreSQL container for integration and E2E. This remains useful compatibility coverage but is not certification of canonical SQLite operation.

## P1 — Cleaning programme is mostly a roadmap, not operational proof

A substantial cleaning-business tools programme already exists under `packages/tools/cleaning-programme`, but the roadmap itself shows only Pass 1 complete and Pass 2 onward pending. Agent 4 must not mistake roadmap coverage for implemented business operation.

## Strong invariants already worth preserving

- Runtime refuses unverified consequential outcomes.
- ExecutionGateway requires approved authority and supports waiting states.
- Gateway idempotency is scoped by `company_id + idempotency_key`.
- Browser content is explicitly unable to define authority.
- MCP discovery does not authorize execution.
- Zero authority bridge explicitly marks Zero as request/present only.
- Workforce delegation does not itself grant authority.

## Immediate integration gate

The next meaningful implementation evidence is not another subsystem contract. It is a real Zero/runtime endpoint plus an E2E scenario that crosses the existing boundaries.
