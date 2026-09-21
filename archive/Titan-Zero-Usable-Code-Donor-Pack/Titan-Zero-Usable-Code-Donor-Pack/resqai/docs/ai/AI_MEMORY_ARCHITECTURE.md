# ResQAI V2 — AI Memory Architecture

## Memory Model

ResQAI agents use an **ephemeral, stateless memory model**. No agent maintains persistent state across invocations. All context is derived from pod tables at execution time.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AGENT MEMORY MODEL                            │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Invocation   │    │  Execution   │    │  Complete    │          │
│  │  Start        │───►│  Context     │───►│  & Forget   │          │
│  │  (stateless)  │    │  (ephemeral) │    │  (purged)    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                             │                                       │
│                             ▼                                       │
│                    ┌────────────────┐                               │
│                    │  Table Reads   │──► Temporary working memory   │
│                    │  (fresh data)  │    (discarded after output)   │
│                    └────────────────┘                               │
│                                                                     │
│  PERSISTENT STATE: NONE                                            │
│  Cross-session memory: NOT SUPPORTED                               │
│  Conversation history: NOT STORED                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Memory Types

| Memory Type | Duration | Scope | Used By | Example |
|---|---|---|---|---|
| **Ephemeral Context** | Single invocation | Current execution | All agents | Ticket data loaded for classification |
| **Working Memory** | Within execution | Intermediate reasoning | All agents | Technician ranking during scoring |
| **Output State** | Until next invocation on same entity | Agent output | All agents | Classification written to ticket |
| **Event Memory** | 24 hours (EventBus TTL) | Cross-agent notification | AgentEvents | `ticket.classified` event |
| **Workflow Context** | Workflow instance lifetime | Workflow execution | Workflow nodes | Classification passed to drafter |
| **Table State** | Persistent (database) | All agents | All agents | Current ticket status |

## No Persistent Memory Explicitly

| Memory Type | Status | Rationale |
|---|---|---|
| **Cross-session memory** | NOT SUPPORTED | All agents are stateless by design |
| **Conversation history** | NOT STORED | Agents are single-turn |
| **User preference memory** | NOT SUPPORTED | Preferences stored in tables, not agent memory |
| **Learning from past outputs** | NOT SUPPORTED | No feedback loop into agent behavior |
| **Cached context** | NOT SUPPORTED (except idempotent skip) | Fresh reads every invocation |

## Idempotency as Memory Substitute

Agents use **idempotency rules** to avoid redundant work — this is the closest to "memory" in the system:

| Agent | Idempotency Rule | Mechanism |
|---|---|---|
| request-classifier | Re-run on same ticket overwrites fields | Direct table write (no-op aware) |
| support-reply-drafter | Re-run overwrites draft | Only re-write when input changed |
| operations-coordinator | Only create task if no open task with same title + target_id | Table check before write |
| resolution-advisor | Skip if already `recommendation_ready` (unless force_reanalysis) | Status check before analysis |
| account-health-monitor | Only create task if title not already present for account_id + today | Table check before write |
| tech-suggester | Skip if already_assigned (unless force_resuggest) | Status check before suggestion |

## Future Memory Enhancements (Phase D+)

| Enhancement | Description | Planned For |
|---|---|---|
| Feedback loop memory | Track which recommendations were approved/rejected | crm-assistant, analytics-assistant |
| Learning preferences | Learn user preferences for draft tone, resolution style | customer-support-assistant |
| Pattern memory | Remember similar past cases for better recommendations | resolution-advisor (future) |
| Context window optimization | Cache frequent table reads | All agents |
| User memory | Remember user-specific preferences for AI interactions | admin-assistant |

## Memory Safety Rules

| Rule | Description |
|---|---|
| No PII in memory | Agents must not retain customer PII beyond execution scope |
| Memory purged after output | Ephemeral context is discarded after agent completes |
| No agent-to-agent memory sharing | Agents cannot access other agents' execution context |
| No external memory storage | Agent context is not written to external systems |
| Memory event TTL | Agent lifecycle events expire after 24 hours |
