# WORKFLOW_EVENT_MAP.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Event Sources

| Event Source | Type | Produced By | Consumed By |
|-------------|------|------------|-------------|
| `ticket.created` | App/API event | support-queue app, ticket creation API | ticket-intake |
| `appointment.created` | App/API event | appointment-board app | appointment-reminders (draft) |
| `appointment.rescheduled` | App/API event | appointment-board app | appointment-reminders (draft) |
| `tickets INSERT` | DATASTORE event | Any ticket creation | urgent-dispatch |
| `tickets UPDATE` | DATASTORE event | Any ticket update | urgent-dispatch, support-escalation-manager |
| `appointments INSERT` | DATASTORE event | Any appointment creation | appointment-assignment |
| `disputes INSERT` | DATASTORE event | Any dispute creation | dispute-resolution |
| `disputes UPDATE` | DATASTORE event | Any dispute update | dispute-resolution |

---

## Event Flow Diagram

```
APPLICATION LAYER
  │
  ├── support-queue app ─────────────────► ticket.created ──────────────► ticket-intake
  │
  ├── appointment-board app ─────────────► appointment.created ─────────► appointment-reminders (draft)
  │                                       appointment.rescheduled ──────► appointment-reminders (draft)
  │
  └── Other app APIs ───────────────────► (direct table writes)

DATASTORE LAYER (Table Event Triggers)
  │
  ├── appointments
  │     └── INSERT ─────────────────────► appointment-assignment
  │
  ├── disputes
  │     └── INSERT/UPDATE ──────────────► dispute-resolution
  │
  └── tickets
        ├── INSERT/UPDATE ──────────────► urgent-dispatch
        └── UPDATE ──────────────────────► support-escalation-manager

SCHEDULER LAYER
  │
  ├── CRON 0 2 * * * ───────────────────► account-health-monitoring
  ├── CRON 0 8 * * * ───────────────────► customer-satisfaction-monitor
  └── CRON */30 * * * * ────────────────► followup-slippage-detector
```

---

## Event Payload Mapping

### ticket.created Event → ticket-intake

```
{
  "ticket_id": "<uuid>",
  "today": "2026-06-30",
  "trigger": {
    "ticket_id": "<uuid>",
    "today": "2026-06-30"
  }
}
```

### DATASTORE_EVENT → Workflow

```
{
  "metadata": {
    "table_name": "<table>",
    "operation": "INSERT|UPDATE",
    "record_id": "<uuid>",
    "time": "ISO timestamp",
    "event_occurred_at": "ISO timestamp",
    "user_id": "<uuid>"
  },
  "payload": {
    // Actual row data
  }
}
```

---

## Event Trigger Conditions (LLM Filters)

None of the workflows implement LLM-based event filtering on their DATASTORE triggers. Every INSERT/UPDATE to the monitored table triggers the workflow unconditionally.

| Workflow | Table | Operations | Filter |
|----------|-------|-----------|--------|
| appointment-assignment | appointments | INSERT | None |
| dispute-resolution | disputes | INSERT, UPDATE | None |
| urgent-dispatch | tickets | INSERT, UPDATE | None |
| support-escalation-manager | tickets | UPDATE | None |

---

## Potential Events (Not Yet Implemented)

| Event | Source | Potential Consumer(s) |
|-------|--------|----------------------|
| `account.health_changed` | account-health-monitoring | crm-tracker app |
| `followup.slippage_detected` | followup-slippage-detector | ops-dashboard app |
| `ticket.escalated` | support-escalation-manager | resolution-center app |
| `dispatch.completed` | urgent-dispatch | ops-dashboard app |
| `appointment.assigned` | appointment-assignment | appointment-board app |
