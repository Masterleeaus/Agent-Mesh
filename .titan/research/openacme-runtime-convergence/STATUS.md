# Agent 2 — OpenAcme Runtime Convergence Status

## Status
IMPLEMENTED ON `agent/772`; integration/gate execution still required in a checkout/CI runner.

## Titan runtime discovered
Titan already has strong governed execution primitives under `packages/runtime/authority/`, including company-boundary validation, authority decisions/leases, replay/idempotency bindings, risk handling, approval/evidence requirements and a Command Bus execution transport. It also contains Interaction Engine/feed/runtime contracts and extensive intelligence/workforce migration evidence. These are retained.

The missing convergence point was a small, explicit, persistent agent-run coordinator that can span model turns and waits without equating a model tool request with execution authority.

## OpenAcme runtime discovered
OpenAcme `packages/agent-core/src/agent.ts` implements a substantial AI SDK loop with multi-step streaming, autonomous wake turns, persisted session history, inbox delivery, cancellation/timeouts, memory recall/compression and tool use. Its package boundaries also separate LLM providers, tasks, memory, MCP, tools and server integration.

## Implemented
`packages/runtime/agent-runtime/index.mjs` adds:
- explicit states: QUEUED, RUNNING, WAITING_TOOL, WAITING_AGENT, WAITING_USER, WAITING_APPROVAL, WAITING_EXTERNAL, SUSPENDED, COMPLETED, FAILED, CANCELLED;
- validated transitions;
- company-scoped run identity;
- storage-contract-driven persistence (`store` injection; in-memory reference store only);
- injected `modelRouter`, `contextProvider`, capability registry and authority gateway;
- multi-turn tool loop;
- mandatory capability -> authority -> execute path;
- approval wait, external/user wait, resume, cancel, failure and recoverable-run discovery;
- structured operational events without chain-of-thought.

## Dependencies / handoff
- Agent 1: implement the canonical SQLite-backed RunStore adapter; do not change runtime semantics.
- Agent 3: call `start`/`resume` for delegated work and carry `work_id`; task ownership remains outside runtime.
- Agent 4: implement `contextProvider.load` using Titan memory/knowledge/skills contracts.
- Agent 5: expose Browser/MCP/tool capabilities through the capability registry and authority gateway, never direct execution.
- Agent 6: map RuntimeEventBus events to SSE/WebSocket/other Zero transport; runtime is UI-neutral.
- Agent 7: bind `authorityGateway` to Titan Decision/Risk/Authority/Command Bus and verify approval continuation semantics/idempotency.

## Important integration note
The reference runtime intentionally does not import OpenAcme DB, tasks, memory, browser or provider packages. Titan remains architectural authority.
