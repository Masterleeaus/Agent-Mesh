# Actions / Handoff

## Implemented in Agent 3 branch
- canonical company-scoped internal `WorkItem`
- validated lifecycle
- dependency readiness and cycle rejection
- assignment/delegation without authority mutation
- claim + lease metadata
- waiting/resume
- escalation
- runtime wake adapter
- authority check adapter
- structured workforce events
- evidence/context references
- digital/human worker type distinction
- behavioural contract tests

## Required convergence by other agents
1. Agent 1: SQLite `WorkforceStore`; transactional compare-and-set claim and persisted event journal; recurrence due-index.
2. Agent 2: runtime wake adapter and runtime result mapping; reject/ignore human worker IDs at runtime boundary.
3. Agent 4: context reference resolver and knowledge scopes.
4. Agent 5: capability/evidence mapping for browser/MCP execution.
5. Agent 6: conversational list/reassign/cancel controls over these company-scoped APIs.
6. Agent 7: bind canonical authority adapter, audit wake path, and decide final package placement/export surface.

## Deliberately not implemented
- a second scheduler/automation engine;
- a second SQLite/ORM implementation;
- an LLM reasoning loop;
- Browser/MCP tooling;
- Zero UI;
- field-service human scheduling model.
