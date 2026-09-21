# ResQAI V2 — AI Context Strategy

## Context Architecture

Context strategy defines how much data each agent can access and how that data is scoped.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AGENT CONTEXT WINDOW                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                   CONTEXT SCOPE                            │      │
│  │                                                            │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │      │
│  │  │ Primary      │  │ Secondary   │  │ Reference   │       │      │
│  │  │ Entity       │  │ Entities    │  │ Tables      │       │      │
│  │  │ (1 record)   │  │ (N records) │  │ (lookups)   │       │      │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │      │
│  │                                                            │      │
│  └──────────────────────────────────────────────────────────┘      │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                  CONTEXT LIMITS                           │      │
│  │  • Max primary records: 1                                 │      │
│  │  • Max secondary records: varies by agent                │      │
│  │  • Max reference lookups: varies                         │      │
│  │  • Token budget: varies by agent                         │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Context Windows by Agent

### request-classifier

| Context Component | Scope | Max Records | Token Estimate |
|---|---|---|---|
| Primary entity | 1 ticket | 1 | ~500 tokens |
| Secondary entities | Technicians matching ticket service_type | All matching | ~2K tokens |
| Reference tables | None | — | — |
| **Total context window** | — | — | **~3K tokens** |

### support-reply-drafter

| Context Component | Scope | Max Records | Token Estimate |
|---|---|---|---|
| Primary entity | 1 ticket (full message, subject, metadata) | 1 | ~1K tokens |
| Secondary entities | Technicians matching skill | All matching | ~2K tokens |
| Reference tables | Customers (customer details for drafting) | 1 | ~500 tokens |
| Connector context | Reddit search results (if applicable) | 2 results | ~1K tokens |
| **Total context window** | — | — | **~4.5K tokens** |

### operations-coordinator

| Context Component | Scope | Max Records | Token Estimate |
|---|---|---|---|
| Primary entities | All open tickets | All | ~3K tokens |
| Secondary entities | Today's appointments | All today | ~2K tokens |
| Secondary entities | Available technicians | All available | ~1.5K tokens |
| Secondary entities | Customers for flagged tickets | Up to 20 | ~1K tokens |
| Secondary entities | Open/overdue tasks | All open | ~1K tokens |
| Reference tables | operations_log (recent) | Last 50 entries | ~1K tokens |
| **Total context window** | — | — | **~10K tokens** |

### resolution-advisor

| Context Component | Scope | Max Records | Token Estimate |
|---|---|---|---|
| Primary entity | 1 dispute (full claim, evidence) | 1 | ~2K tokens |
| Secondary entities | Linked ticket | 1 | ~1K tokens |
| Secondary entities | Linked appointment | 1 | ~500 tokens |
| Secondary entities | Customer history | 1 customer | ~500 tokens |
| Reference tables | operations_log (relevant entries) | Last 10 | ~500 tokens |
| Connector context | Reddit research results (if applicable) | 2 results | ~1K tokens |
| **Total context window** | — | — | **~5.5K tokens** |

### account-health-monitor

| Context Component | Scope | Max Records | Token Estimate |
|---|---|---|---|
| Primary entities | All accounts | All | ~3K tokens |
| Secondary entities | Followups (pending + overdue) | All flagged | ~2K tokens |
| Secondary entities | Customers (linked to accounts) | Up to limit | ~1K tokens |
| Secondary entities | Appointments (recent) | Last 30 days | ~2K tokens |
| Secondary entities | Disputes (open) | All open | ~500 tokens |
| Secondary entities | Tasks (linked) | All open | ~1K tokens |
| Function output | flag_slipping_followups result | Full output | ~500 tokens |
| Function output | account_health_scan result | Full output | ~1K tokens |
| **Total context window** | — | — | **~12K tokens** |

### tech-suggester

| Context Component | Scope | Max Records | Token Estimate |
|---|---|---|---|
| Primary entity | 1 ticket (service_type, urgency, location, time) | 1 | ~500 tokens |
| Secondary entities | All technicians | All | ~2K tokens |
| Secondary entities | Schedules for relevant time window | All relevant | ~2K tokens |
| **Total context window** | — | — | **~4.5K tokens** |

## Context Window Summary

| Agent | Est. Tokens | Primary Scope | Data Freshness |
|---|---|---|---|
| request-classifier | ~3K | 1 ticket + matching techs | Real-time |
| support-reply-drafter | ~4.5K | 1 ticket + techs + customer | Real-time |
| operations-coordinator | ~10K | Full operational board | ≤ 5 min stale |
| resolution-advisor | ~5.5K | 1 dispute + linked entities | Real-time |
| account-health-monitor | ~12K | Full account set + history | ≤ 15 min stale |
| tech-suggester | ~4.5K | 1 ticket + all techs + schedules | Real-time |

## Context Truncation Strategy

| Strategy | Description | Applied When |
|---|---|---|
| Priority-based truncation | Remove lowest-priority secondary data | Context approaching token limit |
| Recency filtering | Only include recent records | operations_log entries |
| Relevance scoring | Only include relevant technicians (skill-matching) | Technician lists |
| Summarization | Compress operations_log entries | Board analysis |
| Scope-based filtering | Respect `scope` parameter (daily vs weekly) | operations-coordinator |
| Focus mode | Limit to one account | account-health-monitor (focus_account_id) |

## Context Token Budget Rules

| Agent | Soft Limit | Hard Limit | Truncation Behavior |
|---|---|---|---|
| request-classifier | 2.5K | 4K | Drop lowest-priority technician data |
| support-reply-drafter | 4K | 6K | Skip Reddit research, truncate technician alternatives |
| operations-coordinator | 8K | 12K | Drop low-priority tasks, summarize operations_log |
| resolution-advisor | 5K | 8K | Skip Reddit research, limit evidence detail |
| account-health-monitor | 10K | 16K | Drop low-priority accounts, limit appointment history |
| tech-suggester | 4K | 6K | Drop lowest-rated technicians, limit schedule detail |
