# Tool & Table Access — support-reply-drafter

## Tables Read

| Table | Columns Accessed | Purpose |
|---|---|---|
| tickets | subject, message, channel, customer_name, request_type, urgency | Read ticket context for drafting |
| technicians | name, skill, availability, rating, status | Match suggested_owner |
| customers | name, phone, email, status | Cross-reference customer context |

## Tables written

| Table | Columns written | Purpose |
|---|---|---|
| tickets | draft_reply, suggested_owner, status | write draft reply back to ticket |

## Tables Mutated

None.

## Function Dependencies

None.

## Side Effects

- Updates the target ticket with draft reply and suggested owner
- Does NOT send messages through any connector
- Does NOT modify appointments, disputes, or technician availability

## Toolsets

`POD` — full access to pod resources scoped by grants above.
