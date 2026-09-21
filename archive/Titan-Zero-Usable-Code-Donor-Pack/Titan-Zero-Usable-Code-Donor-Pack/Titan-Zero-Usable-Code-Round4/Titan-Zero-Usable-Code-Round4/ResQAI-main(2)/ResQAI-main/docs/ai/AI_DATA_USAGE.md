# ResQAI V2 — AI Data Usage

## Table Access Matrix

| Table | request-classifier | reply-drafter | ops-coordinator | resolution-advisor | health-monitor | tech-suggester |
|---|---|---|---|---|---|---|
| **tickets_v2** | R, W | R, W | R | R | — | R |
| **technicians_v2** | R | R | R | — | — | R |
| **schedules_v2** | — | — | — | — | — | R |
| **customers_v2** | — | R | R | R | R | — |
| **accounts_v2** | — | — | — | — | R, W | — |
| **followups_v2** | — | — | — | — | R, W | — |
| **appointments_v2** | — | — | R, W | R | R | — |
| **disputes_v2** | — | — | — | R, W | R | — |
| **tasks_v2** | — | — | R, W | — | R, W | — |
| **operations_log_v2** | — | — | R, W | R, W | R, W | — |
| **customer_addresses_v2** | — | — | — | — | — | — |
| **knowledge_articles_v2** | — | — | — | — | — | — |
| **feedback_v2** | — | — | — | — | — | — |
| **notification_templates_v2** | — | — | — | — | — | — |
| **users_v2** | — | — | — | — | — | — |
| **audit_log_v2** | — | — | — | — | — | — |
| **inventory_items_v2** | — | — | — | — | — | — |

**R = Read, W = Write**

## Column-Level Access

### tickets_v2

| Column | req-classifier | reply-drafter | ops-coordinator | resolution-advisor | tech-suggester |
|---|---|---|---|---|---|
| id | R | R | R | R | R |
| subject | R | R | R | R | R |
| message | R | R | R | R | R |
| channel | R | R | R | — | — |
| customer_name | R | R | R | R | R |
| request_type | R, W | R | R | R | R |
| urgency | R, W | R | R | R | R |
| suggested_owner | R, W | R, W | R | — | R |
| status | R, W | R, W | R | R | R |
| draft_reply | — | R, W | R | — | — |
| service_type | — | — | — | — | R |
| location | — | — | — | — | R |
| preferred_time | — | — | — | — | R |

### accounts_v2

| Column | health-monitor |
|---|---|
| id | R |
| name | R |
| health | R, W |
| health_score | R, W |
| relationship_state | R |
| lifetime_jobs | R |
| owner | R |
| last_contact | R |

### disputes_v2

| Column | resolution-advisor | health-monitor |
|---|---|---|
| id | R, W | R |
| status | R, W | R |
| customer_claim | R | — |
| provider_claim | R | — |
| evidence_summary | R | — |
| recommended_resolution | R, W | — |
| confidence | R, W | — |
| resolution_reason | R, W | — |

## Data Flow Diagrams

### Ticket Classification Flow

```
Inbound message/ticket
       │
       ▼
request-classifier reads: tickets.subject, tickets.message, tickets.channel,
                          tickets.customer_name, technicians.skill/availability/rating
       │
       ▼
request-classifier writes: tickets.request_type, tickets.urgency,
                          tickets.suggested_owner, tickets.status
       │
       ▼
Output: classification_status, recommended_next_action
```

### Reply Drafting Flow

```
Classified ticket
       │
       ▼
support-reply-drafter reads: tickets.subject/message/channel/request_type/urgency,
                             technicians.skill/availability/rating,
                             customers (customer email)
       │
       ▼
support-reply-drafter writes: tickets.draft_reply, tickets.suggested_owner,
                              tickets.status="drafted"
       │
       ▼
Output: draft_reply, draft_status, confidence
```

### Operations Coordination Flow

```
Scheduled/triggered run
       │
       ▼
operations-coordinator reads: tickets (all open), appointments (scheduled/in-progress),
                              technicians (available/busy), customers,
                              tasks (open/overdue), operations_log
       │
       ▼
operations-coordinator writes: tasks (new rows), operations_log (one row per run)
       │
       ▼
Output: recommendations[], summary_counts, coordination_status
```

### Dispute Resolution Flow

```
Dispute → under_review
       │
       ▼
resolution-advisor reads: disputes (customer_claim, provider_claim, evidence),
                          tickets (linked ticket), appointments,
                          customers, operations_log
       │
       ▼
resolution-advisor writes: disputes.recommended_resolution, disputes.confidence,
                          disputes.resolution_reason, disputes.status="recommendation_ready",
                          operations_log
       │
       ▼
Output: analysis_status, recommended_resolution, requires_human_call
```

### Account Health Monitoring Flow

```
Scheduled/manual run
       │
       ▼
account-health-monitor reads: accounts (all), followups (pending),
                              customers, appointments, disputes, tasks
       │
       ├── calls: flag_slipping_followups (reads/writes followups)
       ├── calls: account_health_scan (reads/writes accounts)
       │
       ▼
account-health-monitor writes: tasks (new rows), operations_log
       │
       ▼
Output: scan results, recommendations[], coordination_status
```

### Tech Suggestion Flow

```
Classified ticket
       │
       ▼
tech-suggester reads: tickets (service_type, urgency, location, preferred_time),
                      technicians (skill, availability, current_load, rating),
                      schedules (upcoming appointments)
       │
       ▼
tech-suggester: no table writes — output returned to workflow context
       │
       ▼
Output: suggested_technician, alternatives[], confidence, suggestion_status
```

## Data Privacy Rules

| Rule | Scope | Enforcement |
|---|---|---|
| No agent reads PII beyond customer_name/email | All agents | Column-level access grants |
| No agent exports data outside pod | All agents | Connector grants restrict outbound |
| No agent stores customer data in memory | All agents | Stateless execution |
| Draft replies include customer name only | support-reply-drafter | Prompt-level restriction |
| No agent accesses financial/payment data | All agents | No table grant for payment tables |

## Data Freshness Requirements

| Agent | Data Freshness | Rationale |
|---|---|---|
| request-classifier | Real-time (reads at invocation) | Classification requires current ticket state |
| support-reply-drafter | Real-time | Draft must reflect latest ticket state |
| operations-coordinator | Near-real-time (≤ 5 min stale OK) | Operational board updates within minutes |
| resolution-advisor | Real-time | Must read latest evidence |
| account-health-monitor | Near-real-time (≤ 15 min stale OK) | Daily scan tolerates latency |
| tech-suggester | Real-time | Must read current technician availability |
