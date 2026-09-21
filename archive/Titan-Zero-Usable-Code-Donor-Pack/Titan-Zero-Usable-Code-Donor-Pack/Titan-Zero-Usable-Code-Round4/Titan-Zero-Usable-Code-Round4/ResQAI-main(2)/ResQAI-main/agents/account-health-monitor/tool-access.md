# Tool & Table Access — account-health-monitor

## Tables Read

| Table | Columns Accessed | Purpose |
|---|---|---|
| accounts | relationship_status, health, health_score, lifetime_jobs, owner, last_contact_date | Primary CRM signal |
| followups | status, type, priority, due_date, owner, account_id | Identify slipping follow-ups |
| customers | name, phone | Fallback for display names |
| appointments | date, customer_id, service_type, status | Recent service activity context |
| disputes | status, appointment_id | weight accounts in active dispute |
| tasks | title, account_id, status, due_date | Avoid duplicating open follow-up tasks |

## Tables written

| Table | Columns written | Purpose |
|---|---|---|
| tasks | title, priority, owner, due_date, status, notes | Create tasks for non-trivial recommendations |
| operations_log | action, result, actor | Log one breadcrumb per run |

## Tables Mutated via Function Call

- `accounts` — `account_health_scan` writes health, health_score, open_followups, overdue_followups, open_disputes
- `followups` — read only by agent (write grant exists for future use)

## Function Dependencies

| Function | Purpose |
|---|---|
| `flag_slipping_followups` | Deterministic scan for overdue/at-risk followups |
| `account_health_scan` | Deterministic per-account health scoring |

Both functions must be called before agent reasoning.

## Side Effects

- Creates tasks rows for recommendations
- Calls two deterministic functions that write to accounts and operations_log
- Logs one operations_log entry per run
- Does NOT send customer messages
- Does NOT resolve disputes
- Does NOT mutate appointments

## Toolsets

`POD` — full access to pod resources scoped by grants above.
