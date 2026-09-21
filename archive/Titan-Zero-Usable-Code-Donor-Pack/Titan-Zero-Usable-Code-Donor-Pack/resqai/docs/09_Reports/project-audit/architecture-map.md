# Architecture Map — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   USERS                                      │
│                     (Dispatchers, CSR, Ops Managers)                         │
└────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Appt Board│ │CRM      │ │ Ops     │ │Resolution│ │Support  │
│:5173     │ │Tracker  │ │Dashboard│ │Center    │ │Queue    │
│         │ │:5175    │ │:5176    │ │:5177     │ │:5174    │
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │           │           │           │
     └───────────┴──────┬────┴───────────┴───────────┘
                        │
               ┌────────▼────────┐
               │   Shared SDK    │
               │ (lemma-sdk.ts)  │
               └────────┬────────┘
                        │
               ┌────────▼────────┐
               │   Lemma Pod     │
               │ (Cloud API)     │
               └────────┬────────┘
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
     ▼                  ▼                  ▼
┌─────────┐      ┌──────────┐      ┌──────────┐
│ Tables  │      │ Agents   │      │Functions │
│ (9)     │      │ (5)      │      │ (11)     │
└─────────┘      └────┬─────┘      └────┬─────┘
                      │                 │
                      └────────┬────────┘
                               │
                      ┌────────▼────────┐
                      │   Workflows     │
                      │   (12 defs)     │
                      └─────────────────┘
```

---

## Dependency Graph (Resource → Dependencies)

### Applications → Shared Resources

| Application | SDK | Config | Types | UI | Utils | Tables Read | Tables Write | Agents Used | Functions Used |
|-------------|-----|--------|-------|----|-------|------------|-------------|-------------|----------------|
| appointment-board | ✅ | ✅ | ✅ | ✅ | ✅ | appointments, customers, technicians, operations_log | appointments, operations_log | operations-coordinator | — |
| crm-tracker | ✅ | ✅ | ✅ | — | ✅ | accounts, followups, customers, appointments, disputes, tasks, operations_log | tasks, operations_log | account-health-monitor | account_health_scan, flag_slipping_followups |
| ops-dashboard | ✅ | ✅ | ✅ | — | ✅ | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log | operations-coordinator | — |
| resolution-center | ✅ | ✅ | ✅ | — | ✅ | disputes, customers, appointments, tickets, operations_log | disputes, operations_log | resolution-advisor | resolve_dispute |
| support-queue | ✅ | ✅ | ✅ | — | ✅ | tickets, customers, operations_log | tickets, operations_log | request-classifier, support-reply-drafter | — |

### Agents → Resources

| Agent | Tables Read | Tables Write | Functions Used | Connectors Used | Workflow Role |
|-------|------------|-------------|---------------|----------------|---------------|
| account-health-monitor | accounts, followups, customers, appointments, disputes, tasks | tasks, operations_log | flag_slipping_followups, account_health_scan | Discord | account-health-monitoring, account-health, followup-slippage |
| operations-coordinator | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log | — | Discord | daily-standup, ticket-intake |
| request-classifier | tickets, technicians | tickets | — | Facebook, Instagram | ticket-intake |
| resolution-advisor | disputes, customers, appointments, tickets, operations_log | disputes, operations_log | resolve_dispute | — | dispute-resolution, ticket-intake |
| support-reply-drafter | tickets, customers, appointments | tickets, operations_log | — | Gmail, Discord, Reddit | appointment-reminders |

### Functions → Resources

| Function | Tables Read | Tables Write | Connectors Used | Called By |
|----------|------------|-------------|----------------|-----------|
| account_health_scan | accounts, customers, appointments, disputes, followups | accounts, operations_log | — | account-health-monitor agent, workflows |
| assign_appointment_technician | appointments | appointments, operations_log | — | appointment-assignment workflow |
| check_ticket_urgency | — | — | — | ticket-intake workflow |
| collect_resolved_tickets | tickets | — | Discord | customer-satisfaction-monitor workflow |
| finalize_slippage_review | — | operations_log | Discord | followup-slippage-detector workflow |
| finalize_dispatch | tickets | tickets, operations_log | Discord | urgent-dispatch workflow |
| flag_slipping_followups | followups, accounts, customers | — | — | account-health-monitor agent, workflows |
| resolve_dispute | disputes | disputes, operations_log | — | resolution-advisor agent, workflows |
| update_account_health_status | — | accounts, operations_log | — | account-health-monitoring workflow |
| update_ticket_record | tickets | tickets, operations_log | — | ticket-intake workflow |

### Workflows → Resources

| Workflow | Status | Trigger | Agents Used | Functions Used | Connectors |
|----------|--------|---------|------------|---------------|-----------|
| account-health-monitoring | ACTIVE | schedule(0 2 * * *) | account-health-monitor | update_account_health_status | — |
| account-health | DRAFT | schedule(0 2 * * *) | account-health-monitor | flag_slipping_followups, account_health_scan, create_followup_tasks | — |
| appointment-reminders | DRAFT | schedule(0 7 * * *) | support-reply-drafter | fetch_upcoming_appointments, dispatch_notifications | — |
| daily-standup | DRAFT | schedule(0 8 * * 1-5) | operations-coordinator | create_operations_tasks | — |
| dispute-resolution | ACTIVE | datastore_event(disputes) | resolution-advisor | resolve_dispute | — |
| followup-slippage | DRAFT | schedule(0 6 * * 1-5) | account-health-monitor | flag_slipping_followups, create_followup_tasks | — |
| ticket-intake | ACTIVE | datastore_event(tickets) | request-classifier, operations-coordinator, resolution-advisor | check_ticket_urgency, update_ticket_record | — |
| urgent-dispatch | UNKNOWN | — | — | — | — |
| appointment-assignment | UNKNOWN | — | — | assign_appointment_technician | — |
| customer-satisfaction-monitor | UNKNOWN | — | — | collect_resolved_tickets | Discord |
| followup-slippage-detector | UNKNOWN | — | — | finalize_slippage_review | Discord |
| support-escalation-manager | UNKNOWN | — | — | — | — |

---

## Tables Reference (9 tables)

| Table | Primary Key | Read By | Write By |
|-------|------------|---------|---------|
| accounts | id | crm-tracker, account-health-monitor | account_health_scan |
| appointments | id | appointment-board, crm-tracker, ops-dashboard, account-health-monitor | assign_appointment_technician |
| customers | id | all apps, account-health-monitor | — |
| disputes | id | resolution-center, account-health-monitor | resolution-advisor, resolve_dispute |
| followups | id | crm-tracker, account-health-monitor | — |
| operations_log | id | all agents | multiple functions |
| tasks | id | crm-tracker, account-health-monitor | account-health-monitor, operations-coordinator |
| technicians | id | appointment-board, ops-dashboard | — |
| tickets | id | ops-dashboard, support-queue, request-classifier | request-classifier, finalize_dispatch, update_ticket_record |

---

## Broken References

| Source | Reference | Target | Status |
|--------|----------|--------|--------|
| ticket-intake workflow | resolve-ticket node → resolution-advisor agent | dispute_id mapped from ticket_id | OK (agent handles blocked status) |
| ticket-intake workflow | coordinate-ticket node → operations-coordinator agent | — | OK |
| account-health workflow | create-tasks node | function: create_followup_tasks | **BROKEN** — No function named `create_followup_tasks` exists |
| account-health workflow | create-followup-tasks node | function: create_followup_tasks | **BROKEN** — Same as above |
| followup-slippage workflow | create-remediation-tasks node | function: create_followup_tasks | **BROKEN** — Same as above |
| daily-standup workflow | create-tasks node | function: create_operations_tasks | **BROKEN** — No function named `create_operations_tasks` exists |
| appointment-reminders workflow | fetch-upcoming-appointments node | function: fetch_upcoming_appointments | **BROKEN** — No function named `fetch_upcoming_appointments` exists |
| appointment-reminders workflow | dispatch-reminders node | function: dispatch_notifications | **BROKEN** — No function named `dispatch_notifications` exists |
| appointment-board | suggestTechnician() → agent `tech-suggester` | AGENT: tech-suggester | **BROKEN** — No agent named `tech-suggester` exists in agents/ |

## Orphan Resources

| Resource | Type | Notes |
|----------|------|-------|
| assign_appointment_technician | Function | Not referenced by any active workflow directly (appointment-assignment workflow status unknown) |
| collect_resolved_tickets | Function | Only referenced by customer-satisfaction-monitor workflow (status unknown) |
| finalize_slippage_review | Function | Only referenced by followup-slippage-detector workflow (status unknown) |
| finalize_dispatch | Function | Only referenced by urgent-dispatch workflow |
| support-escalation-manager | Workflow | Status unknown, no references found in docs |
| support-reply-drafter | Agent | Referenced by appointment-reminders (DRAFT), but not by any ACTIVE workflow |
| collect_resolved_tickets | Function | Only customer-satisfaction-monitor references it |

## Cyclic Dependencies

- **account-health workflow** → account-health-monitor agent → flag_slipping_followups + account_health_scan functions → this is a linear chain, no cycle.
- **followup-slippage workflow** → account-health-monitor agent → circular reference to same slippage detection. However, this is intentional design.
- No true cyclic dependencies detected.
