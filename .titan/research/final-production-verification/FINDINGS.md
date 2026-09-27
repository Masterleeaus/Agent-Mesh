# Findings

## P0 — Zero is not yet a production runtime entrypoint

`apps/web/app/app/ZeroChatFirst.tsx` is not yet demonstrated to dispatch production messages into the persistent Agent Runtime. Agent 3 PR #798 correctly removes the dead GET form rather than pretending it is connected.

The Zero governance bridges themselves are now independently verified: runtime-event projection preserves company/conversation/correlation and cannot grant authority; approval-required requests do not execute early; execution requires the Decision boundary and governed capability gateway.

## P0 — Zero origin correlation has no typed WorkItem path yet

Agent 4 Pass 8 inspected the current canonical `services/workforce/src/index.ts` contract on the runtime-correlation branch. `WorkItem` carries `creator` and `context_refs`, but no typed originating `actor_id`, `conversation_id`, or correlation/source-surface metadata. `AgentRuntimeAdapter.wake()` receives only `company_id`, `worker_id`, and `work_id`.

PR #802 correctly resumes an existing non-terminal run by `company_id + work_id`, but a new run still uses the digital worker as `actor_id` and synthesizes `conversation_id = work:<work_id>`. Chat-originated work therefore cannot currently preserve the authenticated One/Zero actor and original conversation through a typed canonical path.

Required bounded fix: carry optional origin/correlation metadata on WorkItem (or an existing canonical equivalent), persist it through the existing store, propagate it through workforce lifecycle/delegation, and pass it to runtime wake/start. This metadata is correlation-only and must never imply authority. Synthetic work conversations remain a valid fallback for genuinely system-originated work.

Acceptance invariants:
- chat-originated work preserves actor/conversation/correlation into a newly-created run;
- delegation/reassignment does not silently rewrite origin;
- system-originated work has an explicit safe fallback;
- origin metadata never changes authority outcome;
- cross-company origin injection is rejected;
- resumed existing runs keep their persisted identity rather than caller-supplied replacements.

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
- chat protocol/persistence/resume/storage adapters;
- Zero runtime-event and authority-bridge governance.

Agent 4 has a backend cleaning-business acceptance harness, but no single test yet proves the complete user-facing loop:

Zero user message → WorkItem → persistent runtime → approval/authority → ExecutionGateway → verified evidence → Zero result.

## P0 — SQLite verification is not full application startup certification

Agent 1's draft now includes file-backed runtime/workforce recovery tests, which is stronger than the earlier in-memory-only proof. Full SQLite-only application startup and web/worker bootstrap remain release gates.

## P0 — Generic full gate validates the old PostgreSQL integration path

`scripts/gate.sh` uses an ephemeral PostgreSQL container for integration and E2E. This remains useful compatibility coverage but is not certification of canonical SQLite operation.

## P1 — Cleaning programme is mostly a roadmap, not operational proof

A substantial cleaning-business tools programme already exists under `packages/tools/cleaning-programme`, but roadmap coverage must not be mistaken for implemented business operation.

## Strong invariants already worth preserving

- Runtime refuses unverified consequential outcomes.
- ExecutionGateway requires approved authority and supports waiting states.
- Gateway idempotency is scoped by `company_id + idempotency_key`.
- Browser content is explicitly unable to define authority.
- MCP discovery does not authorize execution.
- Zero authority bridge explicitly marks Zero as request/present only.
- Workforce delegation does not itself grant authority.
- Workforce recovery should resume an existing company/work-bound run before creating another.

## Immediate integration gate

The next meaningful implementation evidence is a real authenticated Zero/runtime endpoint that creates a WorkItem carrying bounded origin correlation, then proves that the same actor/conversation survives through workforce wake into the persistent run and back through verified outcome projection.