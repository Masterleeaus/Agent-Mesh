# Resource Map

**Pod:** ResQAI Customer Support Pod
**Date:** 2026-06-28

---

## 1. workflow → Resource Dependencies

### ticket_intake_workflow
```
[tickets INSERT] ──→ [ticket-intake-trigger (schedule)] ──→ [ticket_intake_workflow]
                                                              ├── AGENT: request-classifier
                                                              ├── FUNCTION: check_ticket_urgency
                                                              ├── AGENT: operations-coordinator
                                                              ├── FORM: (inline human_decision)
                                                              ├── AGENT: resolution-advisor
                                                              └── FUNCTION: update_ticket_record
                                                                        └── TABLE: tickets (Rw)
                                                                        └── TABLE: operations_log (w)
```

### dispute-resolution
```
[disputes INSERT/UPDATE] ──→ [dispute-resolution]
                                 ├── AGENT: resolution-advisor
                                 ├── FUNCTION: resolve_dispute
                                 │         └── TABLE: disputes (Rw)
                                 │         └── TABLE: tickets (Rw)
                                 │         └── TABLE: operations_log (Rw)
                                 ├── FORM: (inline human_decision)
                                 └── FORM: legal_escalation
```

### account-health-monitoring
```
[SCHEDULED — CRON] ──→ [account-health-monitoring]
                          ├── AGENT: account_health_monitor
                          │         └── EXECUTE: flag_slipping_followups
                          │         └── EXECUTE: account_health_scan
                          ├── FUNCTION: update_account_health_status
                          │         └── TABLE: accounts (Rw)
                          │         └── TABLE: tasks (Rw)
                          │         └── TABLE: operations_log (Rw)
                          └── FORM: escalate_critical
```

### urgent-dispatch
```
[tickets INSERT/UPDATE] ──→ [urgent-dispatch]
                               ├── AGENT: request-classifier
                               ├── FUNCTION: check_ticket_urgency
                               ├── AGENT: tech-suggester
                               ├── AGENT: operations-coordinator
                               ├── FUNCTION: finalize_dispatch
                               │         └── TABLE: tickets (Rw)
                               │         └── TABLE: operations_log (Rw)
                               └── FORM: manager_assignment
```

### followup-slippage-detector
```
[SCHEDULED — CRON] ──→ [followup-slippage-detector]
                          ├── FUNCTION: flag_slipping_followups
                          │         └── TABLE: followups (R)
                          │         └── TABLE: accounts (R)
                          │         └── TABLE: customers (R)
                          ├── AGENT: operations-coordinator
                          ├── FUNCTION: finalize_slippage_review
                          │         └── TABLE: operations_log (Rw)
                          └── FORM: human_review
```

### customer-satisfaction-monitor
```
[SCHEDULED — CRON] ──→ [customer-satisfaction-monitor]
                          ├── FUNCTION: collect_resolved_tickets
                          │         └── TABLE: tickets (R)
                          ├── AGENT: operations-coordinator
                          ├── AGENT: resolution-advisor
                          ├── FUNCTION: update_ticket_record
                          │         └── TABLE: tickets (Rw)
                          │         └── TABLE: operations_log (w)
                          └── FORM: manager_review
```

### appointment-assignment
```
[appointments INSERT] ──→ [appointment-assignment-trigger (schedule)] ──→ [appointment-assignment]
                                                                              ├── AGENT: tech-suggester
                                                                              ├── FUNCTION: assign_appointment_technician
                                                                              │         └── TABLE: appointments (Rw)
                                                                              │         └── TABLE: operations_log (Rw)
                                                                              └── FORM: manager_approval
```

### support-escalation-manager
```
[tickets UPDATE] ──→ [support-escalation-manager-trigger (schedule)] ──→ [support-escalation-manager]
                                                                              ├── AGENT: request-classifier
                                                                              ├── AGENT: operations-coordinator
                                                                              ├── AGENT: resolution-advisor
                                                                              ├── FUNCTION: update_ticket_record
                                                                              │         └── TABLE: tickets (Rw)
                                                                              │         └── TABLE: operations_log (w)
                                                                              └── FORM: human_approval
```

---

## 2. Function → Table Bindings

| Function | Reads | writes | Executes |
|----------|-------|--------|----------|
| assign_appointment_technician | appointments | appointments, operations_log | — |
| collect_resolved_tickets | tickets | — | — |
| finalize_slippage_review | — | operations_log | — |
| finalize_dispatch | tickets | tickets, operations_log | — |
| update_account_health_status | accounts, tasks | accounts, tasks, operations_log | — |
| resolve_dispute | disputes, tickets | disputes, tickets, operations_log | — |
| update_ticket_record | tickets | tickets, operations_log | — |
| check_ticket_urgency | — | — | — |
| account_health_scan | accounts, customers, followups, disputes, appointments | accounts, operations_log | — |
| flag_slipping_followups | followups, accounts, customers | — | — |

---

## 3. Agent → Resource Dependencies

| Agent | Read Tables | write Tables | Execute Functions | Forms |
|-------|------------|-------------|-------------------|-------|
| request-classifier | tickets, technicians | tickets | — | — |
| operations-coordinator | tickets, appointments, technicians, customers, tasks, operations_log | — | — | — |
| resolution-advisor | disputes, tickets | disputes, tickets, operations_log | — | — |
| tech-suggester | technicians, appointments | — | — | — |
| account_health_monitor | accounts, customers, followups, appointments, disputes | — | flag_slipping_followups, account_health_scan | — |
| support-reply-drafter | tickets, technicians | tickets | — | — |

---

## 4. Application → Table Dependencies

| App | Tables Connected |
|-----|-----------------|
| appointment-board | appointments |
| crm-tracker | accounts, customers, followups, disputes |
| ops-dashboard | tickets, appointments, disputes, tasks |
| resolution-center | disputes, tickets |
| support-queue | tickets |

---

## 5. Unreferenced Resources

| Resource | Reason |
|----------|--------|
| agent: support-reply-drafter | Deployed but not referenced by any workflow |
| function: check_ticket_urgency | Used by ticket_intake_workflow and urgent-dispatch — correctly referenced (not orphaned) |

---

## 6. Orphan / Dead Resources

None identified. Every deployed resource is either referenced or serves as a standalone app component.

---

## 7. Connectivity Summary

```
                    ┌──────────────────┐
                    │    Schedules     │ (3 DATASTORE triggers)
                    │  (missing: 3 CRON)│
                    └────────┬─────────┘
                             │ triggers
                             ▼
                    ┌──────────────────┐
        ┌──────────│   workflows (8)  │──────────┐
        │          └───┬───┬───┬───┬──┘          │
        │              │   │   │   │              │
        ▼              ▼   ▼   ▼   ▼              ▼
  ┌─────────┐   ┌──────────┐   ┌────────┐   ┌────────┐
  │ Agents  │   │Functions │   │ Forms  │   │ END    │
  │  (6)    │   │  (10)    │   │(inline)│   │ NODES  │
  └────┬────┘   └────┬─────┘   └────────┘   └────────┘
       │              │
       │              ▼
       │        ┌──────────┐
       │        │  Tables  │
       └────────│  (9)     │──────┐
                └──────────┘      │
                                  ▼
                          ┌──────────────┐
                          │   Apps (5)   │
                          └──────────────┘
```
