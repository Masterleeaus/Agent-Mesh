# workflow Role — account-health-monitor

## workflow Placement

CRM health monitoring agent. Called on a schedule or on-demand.

## workflow Triggers

1. **Scheduled:** Nightly DATASTORE schedule — once per day
2. **On-demand:** "Run health check" button in the CRM tracker app

## workflow Input Contract

```json
{
  "today": "YYYY-MM-DD",
  "days_ahead": 7,
  "lookback_days": 45,
  "focus_account_id": "<uuid> (optional)",
  "max_recommendations": 8,
  "create_followup_tasks": true
}
```

## workflow Output Contract

`coordination_status` drives workflow DECISION routing:

| Status | Downstream Action |
|---|---|
| `crisis` | `critical_count > 0` — notify ops manager first |
| `attention_needed` | `slipping_count > 0` or `overdue_count > 0` |
| `ok` | Everything normal |
| `no_action_needed` | No real work identified |

## Upstream Dependencies (Functions)

Both functions must be called before the agent reasons:

1. `account_health_scan` — writes health scores back to accounts
2. `flag_slipping_followups` — returns ranked slipping followups

## Downstream

- Tasks table for team execution
- CRM Tracker app for UI display

## Idempotency

Re-running on same `today` is safe. Only creates new `tasks` rows for
recommendations whose titles are not already present for the same `account_id`
and `today`. Logs one `operations_log` row per run regardless.
