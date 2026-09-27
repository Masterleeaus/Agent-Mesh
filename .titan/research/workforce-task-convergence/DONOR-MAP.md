# OpenAcme Donor / Convergence Map

OpenAcme licence inspected: MIT. Donor implementation inspected in `packages/tasks`, including `types.ts`, `store.ts`, dependency checks, claim semantics, comments/events, recurrence and manager/team task concepts. No OpenAcme source was copied verbatim; Titan implementation is an adaptation around Titan's company/storage/authority contracts.

| Donor capability | Decision | Titan convergence |
|---|---|---|
| Persistent task board | AUGMENT | Canonical `WorkItem` stored through `@titan-zero/storage`; not a field-service job. |
| Explicit task states | AUGMENT | Closed enum + validated transition map. |
| Dependency graph | AUGMENT | Company-scoped edges, readiness gating, circular rejection. |
| Claim / inbox semantics | AUGMENT | Conditional READY→CLAIMED transaction; capability validation. |
| Team/manager task delegation | AUGMENT | Parent work + decomposition + delegation event; no authority inheritance. |
| Agent wake/dispatcher | CONNECT | `dispatchReady()` calls Agent 2 `AgentRuntimeAdapter`; no runtime copied. |
| Recurring responsibilities | CONNECT | Idempotent occurrence activation; schedule firing remains Titan automation/scheduler responsibility. |
| Comments/events | AUGMENT | Structured workforce events; conversational comments remain Interaction/Zero concern. |
| Agent persistence | KEEP | Titan Agent 2 runtime remains canonical. |
| SQLite persistence | KEEP | Titan Agent 1 `@titan-zero/storage` remains canonical. |
| OpenAcme standalone task database | RETIRE / DO NOT PORT | Would duplicate Titan storage and weaken `company_id`. |
| OpenAcme identity/team assumptions | REPLACE | Titan arbitrary workforce structure and explicit human/digital kinds. |
| OpenAcme execution semantics | CONNECT | Titan Decision/Authority/Execution boundaries remain canonical. |

## Donor provenance

Repository: `sandydasari/openacme` (public).  
Licence: MIT.  
Reference only; architecture and code are Titan-native adaptations.
