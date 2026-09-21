# Tool & Table Access — request-classifier

## Tables Read

| Table | Columns Accessed | Purpose |
|---|---|---|
| tickets | subject, message, channel, customer_name, request_type, urgency, status | Read inbound request for classification |
| technicians | name, skill, availability, rating, status | Match suggested_owner by skill + availability |

## Tables written

| Table | Columns written | Purpose |
|---|---|---|
| tickets | request_type, urgency, suggested_owner, status | write classification results back to the ticket |

## Tables Mutated

None.

## Function Dependencies

None.

## Side Effects

- Updates the target ticket with classification metadata
- Does NOT write to operations_log
- Does NOT send messages
- Does NOT create appointments or disputes

## Toolsets

`POD` — full access to pod resources scoped by grants above.
