# WORKFLOW_DEPENDENCY_GRAPH.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Dependency Legend

```
WORKFLOW ──> AGENT     (workflow invokes agent)
WORKFLOW ──> FUNCTION  (workflow invokes function as node)
FUNCTION  ──> TABLE    (function has read/write grant on table)
AGENT     ──> TABLE    (agent has read/write grant on table)
AGENT     ──> FUNCTION (agent has execute grant on function)
```

---

## Global Dependency Graph

```
                                         ┌──────────────────────────┐
                                         │     account-health-      │
                                         │     monitoring (V2)      │
                                         │     CRON 0 2 * * *      │
                                         └──────────┬───────────────┘
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          │                         │                         │
                          ▼                         ▼                         ▼
              ┌────────────────────┐   ┌────────────────────┐   ┌─────────────────────────┐
              │  account_health_   │   │  update_account_   │   │  flag_slipping_followups │
              │  monitor (AGENT)   │   │  health_status     │   │  (FUNCTION)              │
              └─────────┬──────────┘   │  (FUNCTION)        │   └─────────────────────────┘
                        │              └────────────────────┘
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ accounts │  │ followups│  │ customers│
   │ tasks    │  │ disputes │  │ appointments
   └──────────┘  └──────────┘  └──────────┘


┌───────────────────────────┐
│  appointment-assignment   │
│  (V2) DATASTORE: appt     │
│  INSERT                   │
└──────────┬────────────────┘
           │
           ▼
   ┌───────────────┐
   │ tech-suggester│ (AGENT — missing agent.json)
   └───────┬───────┘
           │
           ▼
   ┌──────────────────────────┐
   │ assign_appointment_      │
   │ technician (FUNCTION)    │
   └──────────┬───────────────┘
              │
              ▼
        ┌────────────┐
        │ appointments│
        │ operations_│
        │ log        │
        └────────────┘


┌──────────────────────────────┐
│  appointment-reminders (V1)  │
│  CRON 0 7 * * * + events     │
└──────────┬───────────────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌─────────┐  ┌──────────────────┐
│ fetch_  │  │ support-reply-   │
│ upcoming│  │ drafter (AGENT)  │
│ appts   │  └──────────────────┘
│ (FUNC)  │
└────┬────┘
     │
     ▼
┌──────────┐
│ dispatch_│
│notificat.│
│ (FUNC)   │
└──────────┘


┌──────────────────────────────┐
│  customer-satisfaction-      │
│  monitor (V2) CRON 0 8 * * *│
└──────────┬───────────────────┘
           │
      ┌────┴──────────────────┐
      │         │              │
      ▼         ▼              ▼
┌─────────┐  ┌────────────────────┐  ┌───────────────────┐
│collect_ │  │ operations-        │  │ resolution-advisor│
│resolved │  │ coordinator(AGENT) │  │ (AGENT)           │
│tickets  │  └────────────────────┘  └───────────────────┘
│(FUNC)   │
└────┬────┘
     │
     ▼
┌─────────┐
│ tickets │
└─────────┘


┌──────────────────────────────┐
│  daily-standup (V1 DRAFT)    │
│  CRON 0 8 * * 1-5            │
└──────────┬───────────────────┘
           │
           ▼
   ┌──────────────────┐
   │ operations-       │
   │ coordinator(AGENT)│
   └──────────┬───────┘
              │
              ▼
   ┌───────────────────┐
   │ create_operations_│
   │ tasks (FUNCTION)  │
   └───────────────────┘


┌──────────────────────────────┐
│  dispute-resolution (V2)     │
│  DATASTORE: disputes I/U     │
└──────────┬───────────────────┘
           │
           ▼
   ┌───────────────────┐
   │ resolution-advisor│
   │ (AGENT)           │
   └──────────┬────────┘
              │
              ▼
   ┌────────────────┐
   │ resolve_dispute│
   │ (FUNCTION)     │
   └────────────────┘


┌───────────────────────────────────┐
│  followup-slippage-detector (V2)  │
│  CRON */30 * * * *                │
└──────────┬────────────────────────┘
           │
      ┌────┴────────────────┐
      │                     │
      ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ flag_slipping_   │  │ operations-       │
│ followups (FUNC) │  │ coordinator(AGENT)│
└──────────────────┘  └──────────────────┘
      │
      ▼
   ┌─────────────────────┐
   │ finalize_slippage_  │
   │ review (FUNCTION)   │
   └─────────────────────┘


┌───────────────────────────────────┐
│  support-escalation-manager (V2)  │
│  DATASTORE: tickets UPDATE        │
└──────────┬────────────────────────┘
           │
      ┌────┴────────────────────────────┐
      │         │              │         │
      ▼         ▼              ▼         ▼
┌──────────┐  ┌────────────────────┐  ┌───────────────────┐  ┌─────────────┐
│request-  │  │ operations-        │  │ resolution-advisor│  │update_ticket│
│classifier│  │ coordinator(AGENT) │  │ (AGENT)           │  │record (FUNC)│
│(AGENT)   │  └────────────────────┘  └───────────────────┘  └─────────────┘
└──────────┘


┌───────────────────────────────────┐
│  ticket-intake (V1 Active)        │
│  EVENT: ticket.created            │
└──────────┬────────────────────────┘
           │
      ┌────┴────────────────────────────┐
      │         │              │         │
      ▼         ▼              ▼         ▼
┌──────────┐  ┌────────────────────┐  ┌───────────────────┐  ┌─────────────┐
│request-  │  │check_ticket_       │  │ operations-        │  │ resolution- │
│classifier│  │urgency (FUNCTION)  │  │ coordinator(AGENT) │  │ advisor(AG) │
│(AGENT)   │  └────────────────────┘  └────────────────────┘  └─────────────┘
└──────────┘                                                   │
                                                               ▼
                                                        ┌─────────────┐
                                                        │update_ticket│
                                                        │record (FUNC)│
                                                        └─────────────┘


┌───────────────────────────────────┐
│  urgent-dispatch (V2)             │
│  DATASTORE: tickets I/U           │
└──────────┬────────────────────────┘
           │
      ┌────┴────────────────────────────────────┐
      │         │              │                 │
      ▼         ▼              ▼                 ▼
┌──────────┐  ┌────────────────────┐  ┌──────────────┐  ┌────────────────┐
│request-  │  │check_ticket_       │  │ tech-suggester│  │ operations-    │
│classifier│  │urgency (FUNCTION)  │  │ (AGENT)       │  │ coordinator(AG)│
│(AGENT)   │  └────────────────────┘  └──────────────┘  └────────────────┘
└──────────┘                                              │
                                                          ▼
                                                   ┌──────────────┐
                                                   │ finalize_    │
                                                   │ dispatch(FUNC)│
                                                   └──────────────┘
```

---

## Shared Resource Dependency Table

| Resource | Used By (Workflows) | Used By (Agents) |
|----------|--------------------|-------------------|
| **tickets** | ticket-intake, support-escalation-manager, urgent-dispatch, customer-satisfaction-monitor | request-classifier, resolution-advisor, operations-coordinator, support-reply-drafter |
| **appointments** | appointment-assignment, appointment-reminders | operations-coordinator, resolution-advisor, account-health-monitor |
| **customers** | (via agents) | account-health-monitor, operations-coordinator, resolution-advisor, support-reply-drafter |
| **accounts** | account-health-monitoring | account-health-monitor |
| **followups** | followup-slippage-detector, account-health-monitoring | account-health-monitor |
| **disputes** | dispute-resolution | resolution-advisor, account-health-monitor |
| **tasks** | (via functions) | operations-coordinator, account-health-monitor |
| **technicians** | appointment-assignment | request-classifier, operations-coordinator, support-reply-drafter |
| **operations_log** | (via functions) | account-health-monitor, operations-coordinator, resolution-advisor |

---

## Circular Dependency Check

| Path | Circular? |
|------|-----------|
| ticket-intake → request-classifier → tickets | No |
| dispute-resolution → resolution-advisor → disputes | No |
| urgent-dispatch → request-classifier → tickets → urgent-dispatch (via DATASTORE event) | **YES** — urgent-dispatch triggers on tickets INSERT/UPDATE and finalize_dispatch writes to tickets, which would re-trigger. Requires deactivation guard or status filter. |
| support-escalation-manager → update_ticket_record → tickets → support-escalation-manager | **YES** — triggers on tickets UPDATE and writes back to tickets. Requires deactivation guard. |

> **Circular dependency mitigation**: Both urgent-dispatch and support-escalation-manager must implement status-change filters to prevent re-trigger on their own writes (e.g., ignore tickets with status `dispatched` or `closed`).
