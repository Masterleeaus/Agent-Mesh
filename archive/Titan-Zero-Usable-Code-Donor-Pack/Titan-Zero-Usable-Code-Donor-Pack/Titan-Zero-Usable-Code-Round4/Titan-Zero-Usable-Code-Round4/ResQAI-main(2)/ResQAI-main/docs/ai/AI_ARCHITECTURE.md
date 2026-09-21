# ResQAI V2 — Enterprise AI Intelligence Layer Architecture

## Overview

The Enterprise AI Intelligence Layer defines how Artificial Intelligence operates across the ResQAI V2 platform. It is a **stateless, event-driven, human-supervised** AI architecture where agents produce recommendations, never autonomous actions.

## Architecture Principles

1. **Human-in-the-loop** — Every agent output is a recommendation. No agent writes final-state records, sends customer messages, or mutates authoritative domain state without explicit human approval.
2. **Event-driven coordination** — Agents communicate via typed events through the `globalEventBus`. No direct agent-to-agent coupling.
3. **Stateless execution** — Agents hold no persistent state between invocations. All context is derived from pod tables at runtime.
4. **Confidence-gated autonomy** — Agent outputs below defined confidence thresholds automatically route to human review.
5. **Domain isolation** — Each agent owns exactly one business domain. No overlapping responsibilities.

## AI Layer Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER (9 V2 Apps)                       │
│  support | appointment | ops | technician | resolution | crm | analytics    │
│  customer-portal | admin                                                   │
└──────────────────────────┬──────────────────────────────────────────────────┘
                           │ AI Capabilities, Agent Entry/Exit Points
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ENTERPRISE AI INTELLIGENCE LAYER                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     EXISTING ENTERPRISE AGENTS                       │   │
│  │  request-classifier | support-reply-drafter | operations-coordinator │   │
│  │  resolution-advisor | account-health-monitor | tech-suggester        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FUTURE ENTERPRISE AGENTS                          │   │
│  │  notification-assistant | crm-assistant | appointment-assistant     │   │
│  │  analytics-assistant | customer-support-assistant                   │   │
│  │  knowledge-assistant | admin-assistant | audit-assistant            │   │
│  │  security-assistant | forecast-assistant                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CROSS-CUTTING AI SERVICES                        │   │
│  │  Prompt Registry | Confidence Engine | Escalation Router            │   │
│  │  Memory Store | Context Window Manager | Audit Logger               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ Agent Execution Context
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW LAYER (11 Workflows)                       │
│  ticket-intake | urgent-dispatch | account-health | dispute-resolution      │
│  appointment-assignment | daily-standup | support-escalation | ...         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ Contracted Tables & Events
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (41 Tables)                              │
│  tickets_v2 | appointments_v2 | accounts_v2 | disputes_v2 | tasks_v2       │
│  customers_v2 | technicians_v2 | followups_v2 | audit_log_v2 | ...        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Agent Execution Model

Every agent follows the same execution contract:

```
1. RECEIVE — Structured input payload (JSON Schema validated)
2. READ — Permitted pod tables for context
3. REASON — Apply prompt strategy within context window limits
4. CONFIDENCE — Self-assess output confidence (0.0–1.0)
5. WRITE — Draft recommendations to designated tables
6. EMIT — Produce typed output + optional events
7. ESCALATE — Route to human if confidence < threshold or safety rules triggered
8. LOG — Append operations_log entry + audit trail
```

## AI Capabilities by Application

| Application | AI Capabilities | Available Agents | Agent Entry Points | Agent Exit Points |
|---|---|---|---|---|
| **support-center_v2** | Ticket classification, reply drafting, tech suggestion, urgency detection | request-classifier, support-reply-drafter, tech-suggester | Ticket creation, Re-classify button, Draft reply button | Classification result, Draft text, Suggested technician |
| **appointment-center_v2** | Tech assignment suggestion, schedule optimization | tech-suggester, appointment-assistant (future) | Schedule view, Assign tech action | Tech suggestion, Schedule recommendation |
| **operations-center_v2** | Operational coordination, priority ranking, task creation | operations-coordinator | Daily standup, What's next button, Urgent page trigger | Recommendations list, Created tasks |
| **technician-portal_v2** | Job prioritization, tech routing | tech-suggester, operations-coordinator | Job queue, Tech availability check | Job priority suggestion |
| **resolution-center_v2** | Dispute analysis, resolution recommendation, evidence weighting | resolution-advisor, knowledge-assistant (future) | Dispute under_review, Re-analyze button | Resolution recommendation, Analysis status |
| **crm-center_v2** | Account health monitoring, follow-up slip detection, win-back identification | account-health-monitor, crm-assistant (future) | Daily health scan, Run health check button | Health scan results, Task creation, Critical alerts |
| **analytics-center_v2** | Data insight generation, anomaly detection, trend forecasting | analytics-assistant, forecast-assistant (future) | Dashboard load, Report generation, Scheduled insight | Insight payload, Anomaly alerts, Forecast data |
| **customer-portal_v2** | Ticket intake classification, self-service routing | request-classifier, customer-support-assistant (future) | New ticket form, Chat widget | Classification, Suggested articles |
| **admin-center_v2** | User activity monitoring, audit analysis, system health | admin-assistant, audit-assistant, security-assistant (future) | Dashboard load, Audit query, Security scan | Activity summary, Audit findings, Security alerts |

## AI Event Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        agentEvents (EventBus)                       │
│                                                                     │
│  agent:started      — Agent execution began                         │
│  agent:message      — Intermediate agent message                    │
│  agent:completed    — Agent execution completed with result         │
│  agent:failed       — Agent execution failed with error             │
│  agent:requiresAction — Agent requests human intervention           │
└─────────────────────────────────────────────────────────────────────┘
```

## Agent Communication Model

All agent-to-agent communication is **indirect** via:
1. **Pod tables** — Agent A writes to a table; Agent B reads the table
2. **Workflow orchestration** — Workflow nodes call agents in sequence
3. **Events** — Agents emit events that trigger workflows containing other agents

No agent directly calls another agent.

## Confidence Thresholds

| Threshold | Behavior | Applications |
|---|---|---|
| ≥ 0.90 | Auto-route to suggested action | Classification, Tech suggestion |
| 0.70–0.89 | Route to human for quick review | Reply draft, Resolution recommendation |
| 0.50–0.69 | Route to human with escalation note | Disputes, Complex coordination |
| < 0.50 | Block and escalate to senior reviewer | Safety-critical, Legal escalations |

## Human Override Points

| Point | Agent | Override Mechanism |
|---|---|---|
| Classification override | request-classifier | Manual edit on ticket form |
| Draft edit before send | support-reply-drafter | Approval FORM in workflow |
| Resolution approval | resolution-advisor | HUMAN_APPROVAL workflow node |
| Task creation veto | operations-coordinator | Human deletes/reassigns tasks |
| Health action rejection | account-health-monitor | Human closes task without action |
| Tech suggestion override | tech-suggester | Manual technician selection |

## Agent Isolation Model

Each agent runs in an isolated execution context with:
- **Scoped table grants** — Read/write permissions limited to specific tables
- **No shared memory** — Agents cannot access other agents' runtime state
- **No direct function calls** — Function calls are mediated through workflow nodes
- **Connector isolation** — Each connector is granted to specific agents only
- **Output validation** — All outputs validated against JSON Schema before write
