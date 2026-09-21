# Tool & Table Access — resolution-advisor

## Tables Read

| Table | Columns Accessed | Purpose |
|---|---|---|
| disputes | appointment_id, customer_claim, provider_claim, evidence_summary, status, recommended_resolution | Read dispute details for analysis |
| customers | name, status, phone | Cross-reference customer context |
| appointments | customer_id, service_type, date, technician_id, notes | Read appointment context for the disputed service |
| tickets | subject, message, status | Read related ticket if dispute tied to a ticket |
| operations_log | action, result | Check prior analysis attempts |

## Tables written

| Table | Columns written | Purpose |
|---|---|---|
| disputes | recommended_resolution, resolution_reason, confidence, status, human_notes | write analysis results; set status to recommendation_ready |
| operations_log | action, result, actor | Log dispute analysis breadcrumb |

## Tables Mutated

None beyond writes above.

## Function Dependencies

None.

## Side Effects

- writes resolution recommendation to the dispute record
- Sets dispute status to `recommendation_ready`
- Logs one operations_log entry per analysis
- Does NOT finalize disputes (human must approve/reject)
- Does NOT send messages

## Toolsets

`POD` — full access to pod resources scoped by grants above.
