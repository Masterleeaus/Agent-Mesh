# ResQAI V2 — AI Interaction Graph

## Agent Dependency Graph

```
request-classifier ──────────► support-reply-drafter
       │                              │
       │                              │
       ▼                              ▼
tech-suggester ◄──────────── operations-coordinator
       │                              │
       │              ┌───────────────┘
       │              ▼
       └──────► resolution-advisor
                      │
                      ▼
         account-health-monitor
```

**Dependency Legend:**
- Solid arrow: Agent A output is consumed by Agent B (via workflow or table)
- Dashed arrow: Agent A reference data flows to Agent B

### Dependency Details

| Source Agent | Target Agent | Dependency Type | Medium | Description |
|---|---|---|---|---|
| request-classifier | support-reply-drafter | Hard — sequential | Workflow node | Classification must complete before drafting |
| request-classifier | tech-suggester | Soft — sequential | Workflow node | Classification provides request_type for tech matching |
| request-classifier | operations-coordinator | Event — soft | Ticket updated event | Classification updates ticket state read by coordinator |
| support-reply-drafter | operations-coordinator | Event — soft | Ticket drafted event | Draft status affects coordinator priority |
| tech-suggester | operations-coordinator | Event — soft | Tech suggestion event | Tech assignment affects capacity analysis |
| operations-coordinator | resolution-advisor | Event — soft | Escalation event | Coordinator can identify disputes needing resolution |
| resolution-advisor | account-health-monitor | Event — soft | Dispute resolution event | Resolution outcomes affect account health |

---

## Agent Communication Graph

```
                    ┌─────────────────────────────┐
                    │       globalEventBus          │
                    └─────────────────────────────┘
                            ▲            ▲
                            │            │
                    ┌───────┴────────────┴────────┐
                    │     agentEvents (EventBus)   │
                    └─────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   request-classifier  support-reply-drafter  operations-coordinator
          │                 │                 │
          │  ticket.        │  ticket.reply.  │  operations_log
          │  classified     │  drafted        │  tasks table
          │                 │                 │
          ▼                 ▼                 ▼
   resolution-advisor  account-health-monitor  tech-suggester
          │                 │                 │
          │  disputes       │  account.health.│  suggestion
          │  table          │  scan.completed │  output
          ▼                 ▼                 ▼
   operations_log      tasks table       workflow context
```

### Communication Channels

| Channel | Direction | Used By |
|---|---|---|
| Workflow Node Chaining | Sequential | request-classifier → support-reply-drafter |
| Workflow Node Chaining | Sequential | request-classifier → tech-suggester |
| Table Read (shared state) | Asynchronous | All agents read tickets, technicians, etc. |
| Table Write (state change) | Asynchronous | Operations coordinator writes tasks |
| EventBus (events) | Pub/sub | All agents emit agent lifecycle events |
| Discord Connector | Outbound | operations-coordinator, account-health-monitor |
| Gmail Connector | Outbound | support-reply-drafter (human-approved only) |
| Reddit Connector | Outbound | support-reply-drafter, resolution-advisor |
| Facebook/Instagram Connector | Inbound | request-classifier |

---

## Agent-to-Agent Collaboration Matrix

| | req-classifier | reply-drafter | ops-coordinator | resolution-advisor | health-monitor | tech-suggester |
|---|---|---|---|---|---|---|
| **req-classifier** | — | Chain: provides classification | Provides: classified ticket data | — | — | Chain: provides request_type |
| **reply-drafter** | Reads: classification result | — | Provides: draft status | — | — | Reads: suggested_owner |
| **ops-coordinator** | Reads: ticket state | Reads: draft status | — | Trigger: escalation | Reads: health data | Reads: assignment data |
| **resolution-advisor** | Reads: complaint tickets | — | Receives: escalation events | — | Provides: dispute impact | — |
| **health-monitor** | — | — | Reads: task completions | Reads: dispute outcomes | — | — |
| **tech-suggester** | Reads: classified ticket | — | Provides: capacity data | — | — | — |

**Legend:**
- `Chain:` — Direct workflow sequential chaining
- `Provides:` — Agent produces data consumed by other
- `Reads:` — Agent consumes data produced by other
- `Trigger:` — Indirect triggering via events

---

## Application-to-Agent Matrix

| Application | Agents Invoked | Entry Point | Exit Point | Override |
|---|---|---|---|---|
| **support-center_v2** | request-classifier, support-reply-drafter, tech-suggester | Ticket create, Re-classify button, Draft button | Classification output, Draft text, Tech suggestion | Manual ticket edit, Manual draft edit, Manual tech assign |
| **appointment-center_v2** | tech-suggester, appointment-assistant (future) | Schedule view, Assign action | Tech ranking, Slot suggestions | Manual technician select |
| **operations-center_v2** | operations-coordinator | Daily standup, What's next button, Urgent trigger | Recommendations list, Tasks created | Task delete/reassign |
| **technician-portal_v2** | tech-suggester, operations-coordinator | Job queue load | Priority-sorted jobs | Manual job reorder |
| **resolution-center_v2** | resolution-advisor, knowledge-assistant (future) | Dispute under_review, Re-analyze button | Resolution recommendation, Analysis status | Manual resolution select |
| **crm-center_v2** | account-health-monitor, crm-assistant (future) | Daily health scan, Run health check | Health scan results, Task list | Task close without action |
| **analytics-center_v2** | analytics-assistant, forecast-assistant (future) | Dashboard load, Report gen, Schedule | Insights, Anomaly alerts, Forecast | Manual report creation |
| **customer-portal_v2** | request-classifier, customer-support-assistant (future) | New ticket form, Chat widget | Classification, Suggested articles | Manual category select |
| **admin-center_v2** | admin-assistant, audit-assistant, security-assistant (future) | Dashboard load, Audit query, Scan | Activity summary, Findings, Alerts | Manual admin action |

### Agent Entry Point Details

```
support-center_v2
├── Ticket created (FORM/DATASTORE trigger)
│   └── request-classifier invoked with ticket_id
├── Re-classify button
│   └── request-classifier invoked with force_reclassify: true
└── Draft reply button
    └── support-reply-drafter invoked with ticket_id

operations-center_v2
├── Daily standup (8am weekday schedule)
│   └── operations-coordinator invoked with scope: "daily"
├── "What's next?" button
│   └── operations-coordinator invoked with current scope
└── Urgent page trigger
    └── operations-coordinator invoked with scope: "urgent_only"

resolution-center_v2
├── Dispute status → "under_review" (DATASTORE trigger)
│   └── resolution-advisor invoked with dispute_id
└── "Re-analyze" button
    └── resolution-advisor invoked with force_reanalysis: true

crm-center_v2
├── Nightly health scan (schedule)
│   └── account-health-monitor invoked with default params
└── "Run health check" button
    └── account-health-monitor invoked with focus_account_id
```

### Agent Exit Point Details

```
request-classifier
├── classification_status: "classified"
│   └── Workflow proceeds to support-reply-drafter
├── classification_status: "needs_human_review"
│   └── Workflow pauses for human reviewer
└── classification_status: "unparseable"
    └── Workflow escalates to intake FORM

support-reply-drafter
├── draft_status: "ready_to_send"
│   └── Workflow sends to human approval FORM
├── draft_status: "needs_human_call"
│   └── Notify ops manager, pause
├── draft_status: "needs_rewrite"
│   └── Re-trigger request-classifier
└── draft_status: "blocked"
    └── Escalate to human reviewer

operations-coordinator
├── coordination_status: "ok"
│   └── Display recommendations, no alert
├── coordination_status: "attention_needed"
│   └── Display with warning banner
├── coordination_status: "crisis"
│   └── Discord alert + red banner
└── coordination_status: "unavailable_data"
    └── Error state, retry

resolution-advisor
├── analysis_status: "ready_for_review"
│   └── Notify assigned reviewer
├── analysis_status: "insufficient_evidence"
│   └── Ask human investigator for context
├── analysis_status: "safety_escalation"
│   └── Notify ops manager immediately
├── analysis_status: "legal_escalation"
│   └── Notify legal counsel
└── analysis_status: "blocked"
    └── Escalate to human
```

---

## Circular Dependency Analysis

| Cycle | Agents | Status | Mitigation |
|---|---|---|---|
| C1 | req-classifier ↔ support-reply-drafter | No cycle — sequential workflow chain | Workflow enforces order |
| C2 | ops-coordinator → tasks table → account-health-monitor → ops-coordinator | **Validated — NOT circular** | ops-coordinator reads tasks for coordination; health-monitor writes tasks for follow-ups. Both read/write shared state but no cyclic invocation. |
| C3 | resolution-advisor → disputes table → account-health-monitor → ops-coordinator | **Validated — NOT circular** | Read-only chain. No agent invokes another. |
| C4 | req-classifier → support-reply-drafter → ops-coordinator → req-classifier | **Validated — NOT circular** | req-classifier does not consume ops-coordinator output. Event chain is one-directional. |

**Result: Zero circular dependencies identified.**

---

## Agent Isolation Boundaries

```
AGENT EXECUTION CONTEXT
┌───────────────────────────────────────────────┐
│  Agent: request-classifier                     │
│  ├── Tables: tickets (R/W), technicians (R)    │
│  ├── Connectors: Facebook, Instagram           │
│  └── Functions: none                           │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Agent: support-reply-drafter                  │
│  ├── Tables: tickets (R/W), technicians (R),   │
│  │            customers (R)                    │
│  ├── Connectors: Gmail, Reddit                 │
│  └── Functions: none                           │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Agent: operations-coordinator                 │
│  ├── Tables: tickets (R), appointments (R/W),  │
│  │   technicians (R), customers (R),           │
│  │   tasks (R/W), operations_log (R/W)         │
│  ├── Connectors: Discord                       │
│  └── Functions: none                           │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Agent: resolution-advisor                     │
│  ├── Tables: disputes (R/W), tickets (R),      │
│  │   appointments (R), customers (R),          │
│  │   operations_log (R/W)                      │
│  ├── Connectors: Reddit                        │
│  └── Functions: none                           │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Agent: account-health-monitor                 │
│  ├── Tables: accounts (R/W), followups (R/W),  │
│  │            customers (R), appointments (R),  │
│  │            disputes (R), tasks (R/W),        │
│  │            operations_log (R/W)              │
│  ├── Connectors: Discord                       │
│  └── Functions: flag_slipping_followups,        │
│                  account_health_scan            │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Agent: tech-suggester                         │
│  ├── Tables: tickets (R), technicians (R),     │
│  │            schedules (R)                    │
│  ├── Connectors: none                          │
│  └── Functions: none                           │
└───────────────────────────────────────────────┘
```
