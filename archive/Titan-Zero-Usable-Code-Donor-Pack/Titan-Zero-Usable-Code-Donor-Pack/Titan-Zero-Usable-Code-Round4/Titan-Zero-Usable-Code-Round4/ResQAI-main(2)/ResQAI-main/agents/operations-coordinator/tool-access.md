# Tool & Table Access — operations-coordinator

## Tables Read

| Table | Columns Accessed | Purpose |
|---|---|---|
| tickets | all operational fields | Open/classified/awaiting tickets for triage |
| appointments | status, technician_id, date, customer_id | Scheduled/in-progress/needs-followup appointments |
| technicians | name, skill, availability, rating, status | Capacity and skill coverage assessment |
| customers | name, status, service history | Relational status for slipping detection |
| tasks | title, owner, priority, status, due_date | Open/overdue tasks to avoid duplication |
| operations_log | action, result, timestamp, actor | Recent activity to avoid doubling up |

## Tables written

| Table | Columns written | Purpose |
|---|---|---|
| tasks | title, owner, priority, due_date, status | Create tasks for non-trivial recommendations |
| operations_log | action, result, actor | Log one breadcrumb per run |

## Tables Mutated

- `appointments` — has write grant but instruction says DO NOT mutate directly

## Function Dependencies

None.

## Side Effects

- Creates tasks rows for actionable recommendations
- writes one operations_log entry per run
- Does NOT mutate appointments, close tickets, or resolve disputes
- Does NOT send customer messages

## Toolsets

`POD` — full access to pod resources scoped by grants above.
