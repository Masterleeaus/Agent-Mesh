# Master Integration Map

## Canonical target

ONE → ZERO → Interaction Engine → Context/Memory → Workforce → WorkItem → Persistent Agent Runtime → Decision → Risk → Authority → ExecutionGateway → Native/MCP/Browser Node → Verification → Evidence → Verified Outcome → ZERO

## Current executable evidence

| Seam | Status | Evidence |
|---|---|---|
| Workforce lifecycle | PARTIAL/TESTED | `services/workforce/src/index.test.ts` covers company isolation, dependency readiness and approval waiting, but uses `MemoryWorkforceStore`. |
| Workforce persistence | IMPLEMENTED | `services/workforce/src/sqlite-store.ts` exists and persists work/workers in SQLite. |
| Workforce → runtime | IMPLEMENTED CONTRACT | `services/workforce/src/runtime-adapter.ts` starts a work-bound persistent runtime. |
| Agent runtime lifecycle | TESTED | `packages/runtime/agent-runtime/tests/agent-runtime.test.mjs` covers lifecycle, tool use, authority denial, approval wait/resume, MFA wait/resume, failure and cancellation. |
| Runtime SQLite persistence | PARTIAL/TESTED | `sqlite-run-store.test.mjs` proves company isolation/recoverability, but the test uses an in-memory SQLite database and does not prove process-restart bootstrap wiring. |
| Runtime → authority/execution | TESTED CONTRACT | Runtime tests prove tool requests cross an authority gateway and unverified outcomes fail closed. |
| ExecutionGateway | TESTED CONTRACT | Gateway tests cover approval waiting, denial, idempotency, evidence emission, Browser Node boundaries and MCP discovery/authority separation. |
| Verified outcome requirement | IMPLEMENTED | ExecutionGateway fails `OUTCOME_UNVERIFIED`; runtime test also rejects unverified consequential outcome. |
| Zero runtime event mapping | IMPLEMENTED CONTRACT | `zero-runtime-events.ts` maps acknowledged/progress/waiting/resumed/approval/completed/failed/cancelled events into bounded chat events. |
| Zero authority bridge | IMPLEMENTED CONTRACT | `zero-authority-bridge.ts` forces Decision boundary and governed capability dispatch; Zero cannot grant authority. |
| Zero production UI → runtime | MISSING/P0 | Current `ZeroChatFirst` is a GET form to `/app/zero`; it does not dispatch to the persistent runtime. |
| Live Zero pulse | MISSING/P0 | `/app/zero/page.tsx` still supplies hard-coded zeros because no authoritative projection is wired. |
| Cleaning business acceptance scenario | MISSING/P0 | No executable E2E test for `Emma is sick tomorrow. Sort it out.` located. |
| Canonical SQLite E2E gate | MISSING/P0 | Generic `scripts/gate.sh` remains PostgreSQL-based for integration/E2E. |

## Current critical path

1. Production Zero submit must reach canonical Interaction/Runtime rather than reload `/app/zero` with a query string.
2. Authoritative runtime/workforce/business projections must feed Zero pulse and progress state.
3. Runtime/WorkItem/Decision/Execution correlation must be exposed to one E2E harness.
4. Build a SQLite-native cleaning-company fixture and execute the primary acceptance scenario.
5. Only after the scenario is real should a `verify:titan` wrapper be introduced.

## Do not duplicate

- Agent Runtime
- Workforce service
- Decision/Authority systems
- ExecutionGateway
- Memory/Knowledge model
- Browser Node contract
- MCP capability adapter
- Zero generated-UI/runtime event contracts
