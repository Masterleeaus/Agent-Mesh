# workflow Role — operations-coordinator

## workflow Placement

Standalone operational orchestration agent. Called on a schedule or on-demand.

## workflow Triggers

1. **Scheduled:** Morning DATASTORE schedule — 8am every weekday
2. **Event-driven:** Urgent-page connector trigger for `urgent` tickets
3. **On-demand:** "what's next?" button in the ops dashboard app

## workflow Input Contract

```json
{
  "scope": "daily|weekly|urgent_only",
  "today": "YYYY-MM-DD",
  "max_actions": 8,
  "create_tasks": true
}
```

- `scope=urgent_only` → only urgent recommendations
- `scope=weekly` → ~14-day lookahead
- `create_tasks=false` → recommendations only, no tasks rows written
- Empty input → run daily scope with defaults

## workflow Output Contract

`coordination_status` drives workflow DECISION routing:

| Status | Downstream Action |
|---|---|
| `crisis` | `urgent_count > 0` — notify ops manager immediately |
| `attention_needed` | `overdue_task_count > 0` or `stuck_customer_count > 0` |
| `unavailable_data` | Required table returned no rows — escalate |
| `ok` | Everything normal |

## Upstream Agents

None (reads state, does not depend on prior agents).

## Downstream

- Human review via ops dashboard
- Tasks table for team execution

## Idempotency

Re-running on same `today` is safe. Only creates `tasks` rows when no open task
with same title and target_id exists. Always logs one `operations_log` row per run.
