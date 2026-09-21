# ResQAI V2 — AI Observability

## Observability Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI OBSERVABILITY STACK                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  AGENT LIFECYCLE EVENTS                      │   │
│  │  agent:started → agent:message → agent:completed/failed     │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    OPERATIONS LOG                            │   │
│  │  Actor | Action | Result | Timestamp | Duration              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      AUDIT TRAIL                             │   │
│  │  Who | What | When | Entity | Before | After | Reason       │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      METRICS                                 │   │
│  │  Execution count | Duration | Confidence | Error rate       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Agent Lifecycle Events

Every agent execution emits the following lifecycle events:

| Event | Payload | Timing |
|---|---|---|
| `agent:started` | `{ agentId, agentName, input, timestamp }` | At execution start |
| `agent:message` | `{ agentId, content, role, timestamp }` | During execution (intermediate) |
| `agent:completed` | `{ agentId, agentName, result, duration, timestamp }` | On successful completion |
| `agent:failed` | `{ agentId, agentName, error, duration, timestamp }` | On execution failure |
| `agent:requiresAction` | `{ agentId, actionType, context, timestamp }` | When human intervention needed |

## Operations Log Schema

| Column | Type | Description | Populated By |
|---|---|---|---|
| actor | string | Agent name | Agent runtime |
| action | string | Action performed | Agent logic |
| result | string | Action result summary | Agent logic |
| timestamp | datetime | When action occurred | Runtime |
| duration_ms | integer | Execution duration | Runtime |
| entity_type | string | Entity type acted upon | Agent logic |
| entity_id | string | Entity ID | Agent logic |
| metadata | json | Additional context | Agent logic |

### Operations Log Entries by Agent

| Agent | Action | Result Format |
|---|---|---|
| request-classifier | classification | `"<request_type>/<urgency>/<classification_status>"` |
| support-reply-drafter | draft created | `"<draft_status>/<confidence>"` |
| operations-coordinator | coordinator recommendations run | `"<counts + summary>"` |
| resolution-advisor | dispute analysis | `"<resolution> (conf <score>)"` |
| account-health-monitor | account_health_monitor run | `"critical=<N>, slipping=<N>, overdue=<N>"` |

## Audit Trail Schema

| Column | Type | Description |
|---|---|---|
| audit_id | uuid | Unique audit entry ID |
| timestamp | datetime | When the audited action occurred |
| actor_type | string | "agent" or "user" |
| actor_id | string | Agent ID or user ID |
| actor_name | string | Agent name or user name |
| action | string | Action performed |
| entity_type | string | Entity type |
| entity_id | string | Entity ID |
| before_state | json | State before change (if applicable) |
| after_state | json | State after change (if applicable) |
| reason | string | Why the action was taken |
| ip_address | string | Source IP (for user actions) |

### Audit Trail Events by Agent

| Agent | Audit Events | Captured By |
|---|---|---|
| request-classifier | Classification written to ticket | tickets table versioning |
| support-reply-drafter | Draft written to ticket | tickets table versioning |
| operations-coordinator | Tasks created | tasks table versioning |
| resolution-advisor | Recommendation written to dispute | disputes table versioning |
| account-health-monitor | Tasks created, health scores updated | tasks + accounts table versioning |
| tech-suggester | Suggestion produced (no table write) | Workflow instance data |

## Monitoring Metrics

### Agent Health Metrics

| Metric | Description | Alert Threshold |
|---|---|---|
| agent_execution_count | Number of agent executions per hour | Spike > 2x baseline |
| agent_success_rate | % of successful executions | < 90% over 5 min |
| agent_avg_duration | Average execution time | > 2x baseline |
| agent_p95_duration | 95th percentile execution time | > threshold per agent |
| agent_error_count | Number of failed executions | > 5 per 15 min |
| agent_escalation_rate | % of outputs escalated | > 30% over 1 hour |
| agent_confidence_avg | Average confidence score | Drop > 0.10 |

### Agent-Specific Metrics

| Agent | Key Metric | Warning | Critical |
|---|---|---|---|
| request-classifier | classification_status rate | > 10% unparseable | > 25% unparseable |
| support-reply-drafter | draft_status rate | > 15% needs_rewrite | > 30% blocked |
| operations-coordinator | coordination_status | Any "unavailable_data" | > 3 consecutive |
| resolution-advisor | confidence distribution | > 20% < 0.60 | > 40% < 0.60 |
| account-health-monitor | coordination_status | Any "unavailable_data" | > 2 consecutive |
| tech-suggester | suggestion_status | Any "no_match" | > 5 consecutive |

## Logging Configuration

| Setting | Value |
|---|---|
| Log level | INFO (default), DEBUG (troubleshooting) |
| Log format | Structured JSON |
| Log retention | 90 days |
| Log destination | `operations_log_v2` table + audit_log_v2 table |
| Event retention | 24 hours (EventBus) |
| Metrics retention | 13 months |

## Observability Dashboards

| Dashboard | Audience | Key Panels |
|---|---|---|
| Agent Health | Ops manager, Admin | Execution counts, success rates, durations, error rates |
| Agent Performance | Ops manager | Confidence distribution, escalation rates, avg duration |
| Audit Trail | Admin, Security | All state changes, who changed what, when |
| Escalation Monitor | Ops manager | Active escalations, response times, SLA compliance |
| Agent Usage | Product manager | Invocation counts by agent, by app, by time |

## Alerting Rules

| Alert | Condition | Severity | Channel |
|---|---|---|---|
| Agent failure cascade | > 5 failures in 5 minutes | Critical | Discord + Email |
| High escalation rate | Escalation rate > 30% in 1 hour | Warning | Discord |
| Low confidence trend | Avg confidence drop > 0.10 in 7 days | Info | Email |
| SLA breach for agent | Agent execution > 2x timeout | Warning | Email |
| Unusual invocation pattern | > 3x normal invocation rate | Info | Email |
| Permission violation | Agent receives 403 | Critical | Discord + Email |
