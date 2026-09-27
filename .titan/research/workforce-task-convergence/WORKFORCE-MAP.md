# Workforce Map

Titan's organisation is data-driven, not a hard-coded cleaning org chart.

```text
Workforce
├─ Digital workforce
│  ├─ teams
│  ├─ managers
│  ├─ specialists
│  └─ workers
└─ Human workforce (business domain)
   ├─ employees/contractors
   ├─ supervisors
   └─ field assignments
```

`WorkforceWorker.kind` explicitly distinguishes `digital` and `human`. Digital workers may receive internal work through Agent 2. Human workers may be referenced by business-domain scheduling but must not be passed into the digital agent runtime.

## Manager triage

Manager decomposition uses the same canonical `WorkItem`: a broad parent objective can create child work with `parent_work_id`, capability requirements and dependencies. This service does not reason about decomposition; Agent 2 performs manager reasoning and calls this service to persist/delegate resulting work.

## Capability routing

`required_capabilities` is machine-readable. Routing must intersect these requirements with Titan's capability registry; agent display names are never sufficient routing criteria.

## Escalation

`escalate()` preserves a structured reason/target and emits `work.escalated`. Agent 7/authority integration decides whether escalation requires ONE, a manager, a decision packet or another policy path.

## Integrations

- Agent 1: implement `WorkforceStore` in canonical SQLite transaction/storage layer; claim must become compare-and-set/transactional there.
- Agent 2: implement `AgentRuntimeAdapter.wake` and feed runtime outcomes back through lifecycle methods.
- Agent 4: resolve `context_refs`; do not duplicate memory into work rows.
- Agent 5: map tool/MCP capabilities to `required_capabilities` and attach execution evidence refs.
- Agent 6: query company-scoped work for conversational workforce status/control.
- Agent 7: bind `AuthorityAdapter` to canonical Decision/Trust authority and audit all wake/execution paths.
