# Runtime Map

## Invocation
`TitanAgentRuntime.start({ company_id, actor_id, agent_id, role, conversation_id, work_id?, messages, authority_context?, capability_context? })`

Legacy `tenant_id` / `tenant_company_id` may be accepted only at ingress normalization; stored runtime identity is canonical `company_id`.

## State flow
`QUEUED -> RUNNING -> {WAITING_TOOL | WAITING_AGENT | WAITING_USER | WAITING_APPROVAL | WAITING_EXTERNAL | SUSPENDED | COMPLETED | FAILED | CANCELLED}`.
Wait states resume to RUNNING. Terminal states never resume.

## Contracts
- RunStore: `create`, `get(company_id, run_id)`, `save`, `recoverable`.
- ModelRouter: `next({identity,messages,context,capability_context})` returning `final`, `tool_calls`, `wait`, and/or operational `delta`.
- ContextProvider: `load(identity)`; memory/knowledge/skills remain Agent 4 owned.
- CapabilityRegistry: `resolve({company_id,name,agent_id})`; availability is not authority.
- AuthorityGateway: `authorize(request)` then `execute({decision,capability,input,idempotency_key})`.

## Events
`run.started`, `reasoning.status`, `message.delta`, `tool.requested`, `tool.started`, `tool.completed`, `approval.required`, `agent.waiting`, `agent.resumed`, `run.completed`, `run.failed`, `run.cancelled`.

No private chain-of-thought event exists.

## Persistence/recovery
Every transition is saved before its corresponding state event. The production RunStore must be Agent 1's canonical SQLite-backed storage contract. `recover()` enumerates non-terminal runs so a process supervisor/event dispatcher can decide which work to resume; the runtime does not keep HTTP requests open.
