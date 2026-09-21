# ResQAI — Agent Architecture

**Extracted from Lemma Pod:** 2026-06-25
**Source of truth:** Extracted agent JSON files in each agent directory.

---

## Agent Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTAKE PIPELINE                          │
│                                                                 │
│  Ticket Created ──► request-classifier ──► support-reply-drafter│
│  (FORM/DATASTORE       (classify +          (draft reply +      │
│   trigger)              suggest owner)       suggest owner)      │
│                                                        │        │
│                                              ┌─────────▼──────┐ │
│                                              │  Human Approval │ │
│                                              │     FORM        │ │
│                                              └────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DISPUTE PIPELINE                            │
│                                                                 │
│  Dispute Status → under_review ──► resolution-advisor          │
│  (DATASTORE trigger)                (analyze + recommend)       │
│                                            │                    │
│                                  ┌─────────▼──────┐             │
│                                  │  Human Review   │             │
│                                  │  & Approval     │             │
│                                  └────────────────┘             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    OPERATIONS LAYER                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  operations-coordinator                                │     │
│  │  Reads: tickets, appointments, technicians, customers, │     │
│  │         tasks, operations_log                          │     │
│  │  Creates: tasks, operations_log                        │     │
│  │  Scheduled: daily at 8am / urgent trigger / on-demand  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       CRM LAYER                                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  account-health-monitor                                │     │
│  │  ├── Calls: flag_slipping_followups (deterministic)     │     │
│  │  ├── Calls: account_health_scan (deterministic)        │     │
│  │  ├── Reads: accounts, followups, customers,            │     │
│  │  │          appointments, disputes, tasks              │     │
│  │  └── Creates: tasks, operations_log                    │     │
│  │  Scheduled: nightly / on-demand "Run health check"     │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsibility Matrix

| Agent | Primary Responsibility | Tables Read | Tables written | Functions Used |
|---|---|---|---|---|
| request-classifier | Classify tickets, set urgency, suggest owner | tickets, technicians | tickets | none |
| support-reply-drafter | Draft customer replies, suggest technician | tickets, technicians, customers | tickets | none |
| operations-coordinator | Read ops board, emit prioritized recommendations | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log | none |
| resolution-advisor | Analyze disputes, recommend resolution | disputes, customers, appointments, tickets, operations_log | disputes, operations_log | none |
| account-health-monitor | CRM health monitoring, emit next-touch tasks | accounts, followups, customers, appointments, disputes, tasks | tasks, operations_log | flag_slipping_followups, account_health_scan |

---

## Data Flow

### Ticket Classification Flow
```
Customer Message
    │
    ▼
tickets (created via FORM or trigger)
    │
    ▼
request-classifier
    │  reads: tickets, technicians
    │  writes: tickets.request_type, tickets.urgency, tickets.suggested_owner
    │
    ▼
support-reply-drafter
    │  reads: tickets, technicians, customers
    │  writes: tickets.draft_reply, tickets.suggested_owner
    │
    ▼
Human Approval → Message sent to customer
```

### Dispute Resolution Flow
```
Customer Complaint
    │
    ▼
disputes (created with status "open")
    │
    ▼  (status flipped to "under_review")
resolution-advisor
    │  reads: disputes, customers, appointments, tickets
    │  writes: disputes.recommended_resolution, disputes.status
    │
    ▼
Human Review → Approved/Rejected → Resolution executed
```

### Operations Coordination Flow
```
Scheduled Trigger (8am daily) / Urgent Ticket / On-demand
    │
    ▼
operations-coordinator
    │  reads: all operational tables
    │  writes: tasks (recommendations), operations_log
    │
    ▼
Ops team reviews recommendations in dashboard → Acts
```

### CRM Health Flow
```
Nightly Schedule / "Run Health Check" Button
    │
    ▼
account_health_scan (deterministic) ──► account.health, account.health_score
flag_slipping_followups (deterministic) ──► ranked followups
    │
    ▼
account-health-monitor
    │  reads: accounts, followups, customers, appointments, disputes, tasks
    │  writes: tasks (next-touch items), operations_log
    │
    ▼
CSR/Ops team reviews tasks → Customer outreach
```

---

## Dependency Graph

```
                          ┌─────────────────────┐
                          │  account_health_scan │◄────────────┐
                          │  (deterministic)     │              │
                          └──────────┬──────────┘              │
                                     │ writes to               │
                                     ▼                         │
                              ┌─────────────┐                  │
                              │   accounts  │                  │
                              └─────────────┘                  │
                                     ▲                         │
                                     │ reads                   │
                          ┌──────────┴──────────┐              │
                          │ account-health-      │              │
                          │ monitor             │──────────────┘
                          └──────────┬──────────┘              │
                                     │ calls                   │
                          ┌──────────▼──────────┐              │
                          │ flag_slipping_      │──────────────┘
                          │ followups           │
                          │ (deterministic)      │
                          └─────────────────────┘

┌───────────────────┐     ┌───────────────────┐
│ request-classifier│────►│support-reply-     │
│ (classify)        │     │drafter (draft)    │
└───────────────────┘     └───────────────────┘

┌───────────────────┐
│ operations-        │
│ coordinator       │  (independent, reads all tables)
└───────────────────┘

┌───────────────────┐
│ resolution-advisor│  (independent, triggered by dispute status)
└───────────────────┘
```

---

## Shared Principles

All 5 agents share these core constraints from the pod's design:

1. **AI drafts, humans approve** — No outbound communication is sent automatically
2. **Every recommendation is a suggestion, never an action** — Human decides
3. **All important actions are logged** — `operations_log` is the audit trail
4. **Never send messages** through connectors — only produce drafts
5. **Safe to re-run** — Idempotent by design (no duplicate side effects)
6. **workflow-first** — Each agent is a first-class node in a workflow graph
