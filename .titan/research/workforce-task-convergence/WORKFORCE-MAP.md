# Canonical Workforce Map

Titan contains broad agent/runtime/authority architecture plus business-domain human staffing. The convergence keeps those domains separate and adds one internal-work coordination package rather than treating customer jobs as AI tasks.

```text
Company (company_id)
├─ Digital workforce
│  ├─ arbitrary teams
│  ├─ managers / supervisors / specialists / workers
│  ├─ capabilities[]
│  └─ managerWorkerId (escalation relationship)
└─ Human workforce
   ├─ staff / field workers
   └─ business-domain availability, employment and field-job assignment
```

`Worker.kind` is mandatory: `digital | human`. Only digital workers are eligible for Agent 2 runtime dispatch. Human workers may be represented as assignees/participants, but their field-service scheduling and employment state remain business-domain concerns.

Hierarchy is data, not a hard-coded cleaning-company org chart. Teams and roles are arbitrary. Capability routing uses capability identifiers, never display names alone.

## Integration points

- Agent 1: `StorageClient` + explicit `company_id` on every row/query.
- Agent 2: `AgentRuntimeAdapter.run({companyId, workerId, work})`.
- Agent 4: `contextRefs`; memory is not embedded into work rows.
- Agent 5: `requiredCapabilities`; tool/browser implementations stay external.
- Agent 6: `getWork`, `listReady`, `assignWork`, `cancelWork`, events provide structured conversational control primitives.
- Agent 7: `authorityRequirement` is descriptive only; execution permission must be resolved by canonical authority/decision contracts.
