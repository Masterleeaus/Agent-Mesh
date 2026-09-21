# ResQAI V2 — AI Event Matrix

## Agent Lifecycle Events

All agents emit standardized lifecycle events via `agentEvents` EventBus:

| Event | Emitter Agent(s) | Payload | Consumers | Description |
|---|---|---|---|---|
| `agent:started` | All agents | `{ agentId, agentName, input }` | Observability, Monitoring | Agent execution began |
| `agent:message` | All agents | `{ agentId, content, role }` | Observability | Intermediate message during execution |
| `agent:completed` | All agents | `{ agentId, agentName, result, duration }` | Workflows, Observability | Agent execution completed successfully |
| `agent:failed` | All agents | `{ agentId, agentName, error }` | Workflows, Escalation, Observability | Agent execution failed |
| `agent:requiresAction` | All agents | `{ agentId, actionType, context }` | Workflows, Notifications | Agent requests human intervention |

## Domain Event Matrix

| Event | Emitter Agent | Payload | Subscribers | Business Trigger |
|---|---|---|---|---|
| `ticket.classified` | request-classifier | `{ ticketId, classifiedType, confidence }` | analytics-center_v2 | Classification output produced |
| `ticket.reply.drafted` | support-reply-drafter | `{ ticketId, replyBody }` | analytics-center_v2 | Draft written to ticket |
| `account.health.scan.completed` | account-health-monitor | `{ scanId, accountsScanned, criticalCount }` | analytics-center_v2, admin-center_v2 | Health scan run finished |
| `followup.slippage.detected` | account-health-monitor (via helper) | `{ followupId, accountId, daysOverdue }` | support-center_v2, crm-center_v2 | Helper function detected slippage |

## Consumed Event Matrix

| Agent | Consumed Events | Source | Purpose |
|---|---|---|---|
| request-classifier | `ticket.created` | support-center_v2 (via workflow trigger) | Trigger classification on new ticket |
| support-reply-drafter | `ticket.classified` | request-classifier (via workflow chain) | Trigger drafting after classification |
| operations-coordinator | `ticket.created`, `ticket.escalated`, `appointment.created`, `operation.created` | Various apps (via workflow/data triggers) | Trigger coordination analysis |
| resolution-advisor | `resolution.case.created` | resolution-center_v2 (via workflow trigger) | Trigger dispute analysis |
| account-health-monitor | `account.health.changed`, `followup.slippage.detected` | crm-center_v2 (via data triggers) | Trigger health re-evaluation |
| tech-suggester | `ticket.classified` | request-classifier (via workflow chain) | Trigger tech suggestion |

## Produced Event Matrix

| Agent | Produced Events | Destination | Description |
|---|---|---|---|
| request-classifier | `ticket.classified` | globalEventBus | Classification complete |
| support-reply-drafter | `ticket.reply.drafted` | globalEventBus | Draft produced |
| operations-coordinator | `operation.created` (indirect via tasks) | globalEventBus | Task creation |
| resolution-advisor | `resolution.resolution.created` (indirect via workflow) | globalEventBus | After human approval |
| account-health-monitor | `account.health.scan.completed` | globalEventBus | Scan complete |
| tech-suggester | None directly | — | Output consumed by workflow |

## Event Subscription Map

```
                           ┌─────────────────────────────────────────────┐
                           │            globalEventBus                    │
                           └─────────────────────────────────────────────┘
                                     ▲              ▲
                                     │              │
                          ┌──────────┴──────────────┴──────────┐
                          │         agentEvents (EventBus)      │
                          └────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
   request-classifier      support-reply-drafter      operations-coordinator
   ── agent:started        ── agent:started            ── agent:started
   ── agent:completed      ── agent:completed          ── agent:completed
   ── agent:failed         ── agent:failed             ── agent:failed
   ◀── ticket.created      ◀── ticket.classified       ◀── ticket.created
   ──▶ ticket.classified   ──▶ ticket.reply.drafted    ◀── ticket.escalated
                                                         ◀── appointment.created
                                                         ◀── operation.created

          ▼                          ▼                          ▼
   resolution-advisor       account-health-monitor     tech-suggester
   ── agent:started         ── agent:started           ── agent:started
   ── agent:completed       ── agent:completed         ── agent:completed
   ── agent:failed          ── agent:failed            ── agent:failed
   ◀── resolution.case.     ◀── account.health.        ◀── ticket.classified
        created                   changed
   ──▶ (indirect via        ◀── followup.slippage.
        workflow)                 detected
                            ──▶ account.health.scan.
                                 completed
```

## Connector Events

| Agent | Connector | Direction | Events |
|---|---|---|---|
| request-classifier | Facebook | Inbound | Read customer messages → create ticket |
| request-classifier | Instagram | Inbound | Read business messages → create ticket |
| support-reply-drafter | Gmail | Outbound | Send reply email (human-approved only) |
| support-reply-drafter | Reddit | Research | Search community discussions for context |
| resolution-advisor | Reddit | Research | Search community discussions for resolution patterns |
| operations-coordinator | Discord | Outbound | Post crisis alerts, standup summaries, urgent notifications |
| account-health-monitor | Discord | Outbound | Post critical account alerts |

## Event Validation Rules

| Rule | Description | Enforced By |
|---|---|---|
| Event emission after write | Agent must complete table write before emitting event | Agent runtime |
| No event without validation | Agent must pass output JSON Schema validation before emit | Agent harness |
| Source app filtering | Event handlers must skip own events via sourceApp check | Application layer |
| Event idempotency | Re-running same agent on same data must not duplicate events | Agent logic |
| Event TTL | Events expire after 24 hours | EventBus configuration |
