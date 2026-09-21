# ResQAI V2 — AI Security Model

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI SECURITY ARCHITECTURE                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AGENT EXECUTION SANDBOX                    │   │
│  │                                                               │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │   │
│  │  │  Permission   │    │  Input       │    │  Output      │   │   │
│  │  │  Grants       │───►│  Validation  │───►│  Validation  │   │   │
│  │  │  (RBAC)       │    │  (Schema)    │    │  (Schema)    │   │   │
│  │  └──────────────┘    └──────────────┘    └──────────────┘   │   │
│  │                                                               │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │   │
│  │  │  Connector    │    │  Rate Limit  │    │  Audit       │   │   │
│  │  │  Control      │───►│  & Throttle  │───►│  Trail       │   │   │
│  │  └──────────────┘    └──────────────┘    └──────────────┘   │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Permission Model

### Table Permission Grants

Each agent has explicitly defined table permissions in `permissions.json`. The principle of least privilege applies:

| Agent | Tables Read | Tables Write | Tables Not Accessible |
|---|---|---|---|
| request-classifier | tickets, technicians | tickets | accounts, disputes, appointments, tasks, feedback, users, audit_log, knowledge_articles, inventory |
| support-reply-drafter | tickets, technicians, customers | tickets | accounts, disputes, appointments, tasks, operations_log, feedback |
| operations-coordinator | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log, appointments | disputes, accounts, feedback, users |
| resolution-advisor | disputes, tickets, appointments, customers, operations_log | disputes, operations_log | tasks, technicians, accounts, followups, feedback |
| account-health-monitor | accounts, followups, customers, appointments, disputes, tasks | accounts, followups, tasks, operations_log | tickets, technicians, feedback |
| tech-suggester | tickets, technicians, schedules | None | All write operations |

### Connector Permission Grants

| Agent | Connectors | Permission | Direction |
|---|---|---|---|
| request-classifier | Facebook | connector.use | Read customer messages |
| request-classifier | Instagram | connector.use | Read business messages |
| support-reply-drafter | Gmail | connector.use | Send email (human-approved) |
| support-reply-drafter | Reddit | connector.use | Search community discussions |
| resolution-advisor | Reddit | connector.use | Search resolution patterns |
| operations-coordinator | Discord | connector.use | Post team notifications |
| account-health-monitor | Discord | connector.use | Post critical alerts |

### Function Permission Grants

| Agent | Functions | Permission |
|---|---|---|
| account-health-monitor | flag_slipping_followups | function.execute, function.read |
| account-health-monitor | account_health_scan | function.execute, function.read |

## Input Security

| Protection | Implementation | Enforced By |
|---|---|---|
| Input Schema Validation | JSON Schema validation before prompt injection | Agent harness |
| Type Enforcement | All inputs checked against expected types | JSON Schema |
| Enum Restriction | Enumerated values only for classification fields | JSON Schema |
| Max Length Limits | Input strings length-limited | JSON Schema maxLength |
| No SQL Injection | Agent cannot execute raw SQL | Pod access layer |
| No Command Injection | Agent cannot execute system commands | Agent runtime |

## Output Security

| Protection | Implementation | Enforced By |
|---|---|---|
| Output Schema Validation | JSON Schema validation before table write | Agent harness |
| Type Enforcement | All outputs checked against expected types | JSON Schema |
| Enum Restriction | Enumerated values only for status/resolution fields | JSON Schema |
| No PII Leakage | Output schema excludes PII fields | Schema definition |
| No Escalation Bypass | Output cannot override security status | Workflow enforcement |

## Agent-to-Agent Security

| Principle | Implementation |
|---|---|
| No direct agent-to-agent calls | Agents communicate via tables + events only |
| No shared state | Agents cannot access other agents' runtime |
| No shared memory | Ephemeral context per agent execution |
| Workflow-mediated handoff | Sequential agents coordinated by workflow nodes |
| Event validation | Events validated before emission |

## Connector Security

| Connector | Security Control |
|---|---|
| Facebook | Read-only message access, no posting |
| Instagram | Read-only message access, no posting |
| Gmail | Send-only (after human approval), no read |
| Reddit | Read-only search, no posting |
| Discord | Write-only to specific channels, no read |

## Data Protection

| Data Category | Protection | Agents Affected |
|---|---|---|
| Customer PII (name, email) | Read-only access, no export | support-reply-drafter, operations-coordinator, resolution-advisor |
| Customer addresses | No agent access | None |
| Payment/financial data | No agent access | None |
| Authentication credentials | No agent access | None |
| API keys/secrets | No agent access | None |
| Internal notes | Read-only for resolution-advisor | resolution-advisor |

## Abuse Prevention

| Prevention | Description |
|---|---|
| Rate limiting | Max 10 invocations per agent per minute |
| Concurrency limit | Max 1 concurrent execution per agent |
| Idempotency enforcement | Re-run on same entity is no-op or overwrites |
| Execution timeout | Hard timeout per agent (30–90s) |
| Retry limit | Max 3 retries before hard failure |
| Input size limit | Max input payload: 10KB |
| Output size limit | Max output payload: 50KB |

## Incident Response

| Incident | Detection | Response |
|---|---|---|
| Permission violation | 403 from pod | Log, fail agent, notify admin |
| Schema validation failure | Schema mismatch | Log, fail agent with validation error |
| Connector abuse | Unusual connector activity | Log, disable connector, notify security |
| Data exfiltration attempt | Unexpected table access pattern | Log, block, notify security |
| Prompt injection detected | Input fails validation | Log, reject input, notify admin |
| Agent failure cascade | Multiple agent failures | Circuit breaker, notify ops |
