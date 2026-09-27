# Actions

## Required downstream integration
1. Agent 1: provide SQLite RunStore with transactional transition persistence and indexes on company_id/state/wake correlation.
2. Agent 3: bind delegated work IDs and agent-to-agent wait/resume signals.
3. Agent 4: bind contextProvider without persisting memory inside runtime records.
4. Agent 5: bind capability resolution and governed Browser/MCP execution.
5. Agent 6: transport RuntimeEventBus events to Zero; preserve event schema and do not infer authority in UI.
6. Agent 7: adapt AuthorityGateway to existing Decision/Risk/Authority/Command Bus primitives, including fresh authority on resume and consequential idempotency.

## Hardening after integration
- Add durable event outbox/replay via canonical storage.
- Add provider retry classification with bounded retry only for side-effect-free model calls.
- Add wake scheduling/event correlation after Agent 3/Agent 1 contracts land.
- Add explicit approval-resolution payload contract with Agent 7.
