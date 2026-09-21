# WORKFLOW_EXECUTION_MAP.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Execution Topology

| Workflow | Trigger Type | Trigger Detail | Execution Frequency | Concurrent Execution | Execution Time (est.) |
|----------|-------------|----------------|---------------------|---------------------|----------------------|
| account-health-monitoring | SCHEDULED | CRON `0 2 * * *` | Daily 2AM | Single (daily window) | 5-15 min |
| account-health (draft) | SCHEDULED | CRON `0 2 * * *` | Daily 2AM | Single | 5-15 min |
| appointment-assignment | DATASTORE_EVENT | appointments INSERT | Per row | Parallel per row | 30-60s |
| appointment-reminders (draft) | SCHEDULED + EVENTS | `0 7 * * *` + appt events | Daily 7AM + on event | Batch | 2-5 min |
| customer-satisfaction-monitor | SCHEDULED | CRON `0 8 * * *` | Daily 8AM | Single | 3-10 min |
| daily-standup (draft) | SCHEDULED | CRON `0 8 * * 1-5` | Weekdays 8AM | Single | 2-5 min |
| dispute-resolution | DATASTORE_EVENT | disputes INSERT/UPDATE | Per row | Parallel per row | 1-5 min |
| followup-slippage-detector | SCHEDULED | CRON `*/30 * * * *` | Every 30 min | Single | 1-3 min |
| followup-slippage (draft) | SCHEDULED | CRON `0 6 * * 1-5` | Weekdays 6AM | Single | 1-3 min |
| support-escalation-manager | DATASTORE_EVENT | tickets UPDATE | Per row | Parallel per row | 1-3 min |
| ticket-intake | EVENT | ticket.created | Per created ticket | Parallel per ticket | 2-5 min |
| urgent-dispatch | DATASTORE_EVENT | tickets INSERT/UPDATE | Per row | Parallel per row | 30-90s |

---

## Scheduled Execution Timeline

```
Midnight
   │
   ├── 2:00 AM  ─── account-health-monitoring (V2)
   │                  account-health (V1 DRAFT — disabled)
   │
   ├── 6:00 AM  ─── followup-slippage (V1 DRAFT — disabled)
   │
   ├── 7:00 AM  ─── appointment-reminders (V1 DRAFT — disabled)
   │
   ├── 8:00 AM  ─── customer-satisfaction-monitor (V2)
   │                  daily-standup (V1 DRAFT — disabled)
   │
   └── :30 min  ─── followup-slippage-detector (V2) — every 30 min
```

---

## Event-Driven Execution Paths

```
DATASTORE_EVENT: appointments INSERT
  └── appointment-assignment (V2)

DATASTORE_EVENT: disputes INSERT/UPDATE
  └── dispute-resolution (V2)

DATASTORE_EVENT: tickets INSERT/UPDATE
  ├── urgent-dispatch (V2) — INSERT or UPDATE
  └── support-escalation-manager (V2) — UPDATE only

EVENT: ticket.created
  └── ticket-intake (V1 Active)
```

---

## Hot Paths (High Frequency)

| Path | Frequency | Node Count | Est Duration |
|------|-----------|------------|-------------|
| urgent-dispatch → no escalation | Per urgent ticket | 4-8 | 30-90s |
| appointment-assignment | Per appointment | 4-7 | 30-60s |
| dispute-resolution → auto | Per dispute | 4 | 1-3 min |
| followup-slippage-detector → no slippage | Every 30 min | 3 | <30s |

---

## Cold Paths (Low Frequency)

| Path | Frequency | Node Count | Est Duration |
|------|-----------|------------|-------------|
| account-health-monitoring → critical | Daily max | 6 | 5-15 min |
| dispute-resolution → legal escalation | Rare | 4 | 2-5 min |
| customer-satisfaction-monitor → escalation | Daily max | 8 | 5-10 min |

---

## Workflow Sizing

| Workflow | Nodes | Edges | Paths | Human Steps | Agent Steps | Function Steps |
|----------|-------|-------|-------|-------------|-------------|---------------|
| account-health-monitoring | 10 | 10 | 3 | 2 | 1 | 1 |
| account-health (draft) | 5 | 0 | 5 | 1 | 1 | 3 |
| appointment-assignment | 8 | 8 | 3 | 1 | 1 | 1 |
| appointment-reminders (draft) | 4 | 0 | 3 | 1 | 1 | 2 |
| customer-satisfaction-monitor | 10 | 12 | 5 | 1 | 2 | 2 |
| daily-standup (draft) | 3 | 0 | 2 | 1 | 1 | 1 |
| dispute-resolution | 10 | 12 | 7 | 3 | 1 | 2 |
| followup-slippage-detector | 8 | 8 | 3 | 1 | 1 | 2 |
| followup-slippage (draft) | 4 | 0 | 3 | 1 | 1 | 2 |
| support-escalation-manager | 8 | 7 | 4 | 1 | 3 | 1 |
| ticket-intake (V1) | 6 | 0 | 4 | 2 | 3 | 2 |
| urgent-dispatch | 11 | 14 | 5 | 2 | 3 | 4 |
