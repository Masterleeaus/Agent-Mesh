# OpenAcme → Titan Zero Donor Map

| Capability | Decision | Titan convergence |
|---|---|---|
| Typed task/work status | AUGMENT | Canonical `WorkState` and validated transitions |
| Task persistence | CONNECT | `WorkforceStore`; Agent 1 supplies SQLite adapter |
| Parent/child work | AUGMENT | `parent_work_id`, no workflow-language dependency |
| Dependencies | AUGMENT | company-scoped prerequisites + cycle rejection + readiness |
| Assignment / claiming | AUGMENT | direct assignment, atomic READY→CLAIMED service boundary, lease metadata |
| Teams/managers | KEEP/CONNECT | preserve Titan organisational model; work references team/worker IDs |
| Agent runtime | KEEP/CONNECT | `AgentRuntimeAdapter`; Agent 2 owns execution loop |
| Agent inbox/task board | CONNECT | `list(company_id)` is structured query boundary for Agent 6 surfaces |
| Dispatcher/wake | AUGMENT | readiness invokes runtime adapter; no polling loop |
| Recurring work | CONNECT | recurrence metadata only; existing scheduler/Agent 1 persistence supplies activation |
| Comments | CONNECT | use Interaction/Signal/evidence integration rather than duplicate comment engine |
| Events | AUGMENT | structured workforce event vocabulary |
| Cross-agent task creation | AUGMENT | canonical `create` + parent/delegation contracts |
| Authority | KEEP | Titan authority/Decision architecture remains authoritative |
| OpenAcme DB/runtime | RETIRE / DO NOT IMPORT | no second DB, ORM or LLM loop |
