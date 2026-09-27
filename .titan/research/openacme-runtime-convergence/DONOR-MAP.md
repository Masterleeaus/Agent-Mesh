# OpenAcme Runtime Donor Map

OpenAcme repository inspected: `sandydasari/openacme` (MIT). Architectural adaptation only in this pass; no OpenAcme source copied.

| OpenAcme capability | Titan equivalent | Decision | Final location |
|---|---|---|---|
| `agent-core` multi-step model/tool turn | Titan intelligence + workforce fragments, no single persistent loop found | AUGMENT | `packages/runtime/agent-runtime/index.mjs` |
| Autonomous wake/inbox turns | Titan signals/orchestration concepts | AUGMENT | runtime wait/resume contract; event sources remain external |
| AI SDK streaming | Titan Interaction/feed surfaces | CONNECT | `RuntimeEventBus`; UI transport owned by Agent 6 |
| LLM provider package | Titan richer local/cloud/model-routing architecture | KEEP | runtime consumes injected `modelRouter` |
| Tool registry/tool calls | Titan capability + Command Bus + authority execution boundary | CONNECT | injected `capabilities` + `authorityGateway` |
| TaskStore/subagents | Titan workforce/task architecture | KEEP | Agent 3 consumes runtime API |
| Memory recall/compression | Titan memory/knowledge architecture | KEEP | injected `contextProvider`; Agent 4 owns implementation |
| Browser/MCP tools | Titan Browser Node/MCP contracts | KEEP | Agent 5 exposes capabilities |
| OpenAcme DB/session stores | Agent 1 SQLite canonical storage contracts | REJECT | runtime uses injected `store`; no donor DB |
| Direct tool execution after model request | Titan Decision/Risk/Authority/Evidence boundary | REPLACE BEHAVIOUR | every tool request must authorize before execute |
| Autonomous timeout/abort | Titan cancellation/recovery requirement | AUGMENT | explicit cancel + persisted wait/terminal states |

## Provenance
OpenAcme is MIT licensed. This implementation reimplements runtime concepts against Titan contracts and deliberately avoids direct donor source copying.
