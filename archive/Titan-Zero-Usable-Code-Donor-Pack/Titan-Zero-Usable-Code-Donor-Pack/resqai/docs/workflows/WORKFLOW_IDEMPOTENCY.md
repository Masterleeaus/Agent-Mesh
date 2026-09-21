# WORKFLOW_IDEMPOTENCY.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Current State

| Workflow | Idempotency Configured | Key Source | TTL |
|----------|----------------------|------------|-----|
| appointment-assignment | YES | `start.metadata.record_id` | 86400s (24h) |
| customer-satisfaction-monitor | YES | `start.metadata.time` | 86400s (24h) |
| followup-slippage-detector | YES | `start.metadata.time` | 1800s (30min) |
| support-escalation-manager | YES | `start.metadata.record_id` | 86400s (24h) |
| urgent-dispatch | YES | `trigger.metadata.record_id` | 86400s (24h) |
| account-health-monitoring | NO | — | — |
| account-health (draft) | NO | — | — |
| appointment-reminders (draft) | NO | — | — |
| daily-standup (draft) | NO | — | — |
| dispute-resolution | NO | — | — |
| followup-slippage (draft) | NO | — | — |
| ticket-intake | NO | — | — |

---

## Idempotency Key Analysis

### record_id-based (row-level)
| Workflow | Key | Appropriate? |
|----------|-----|-------------|
| appointment-assignment | `start.metadata.record_id` | YES — each appointment unique |
| support-escalation-manager | `start.metadata.record_id` | YES — each ticket unique |
| urgent-dispatch | `trigger.metadata.record_id` | YES — each ticket unique |

### time-based (run-level)
| Workflow | Key | Appropriate? |
|----------|-----|-------------|
| customer-satisfaction-monitor | `start.metadata.time` | PARTIAL — same-time re-runs would be deduped, but different-time same-day runs would not |
| followup-slippage-detector | `start.metadata.time` | PARTIAL — 30min interval makes collisions unlikely but not guaranteed |

---

## Function Idempotency

All function descriptions that mention idempotency:

| Function | Idempotency Claim | Implementation |
|----------|------------------|----------------|
| `update_account_health_status` | "Idempotent — re-running with the same inputs overwrites relationship_status without duplicating side effects" | Upsert-based |
| `resolve_dispute` | "Idempotent — re-running with the same inputs overwrites state without duplicating side effects" | Upsert-based |
| `finalize_dispatch` | "Idempotent — re-running with the same inputs overwrites state without duplicating side effects" | Upsert-based |

---

## Gaps

| Gap | Severity | Recommendation |
|-----|----------|---------------|
| account-health-monitoring missing idempotency | HIGH | Add `idempotency.key_source: "start.metadata.time"` with 86400s TTL |
| dispute-resolution missing idempotency | HIGH | Add `idempotency.key_source: "start.metadata.record_id"` with 86400s TTL |
| ticket-intake missing idempotency | HIGH | Add `idempotency.key_source: "trigger.ticket_id"` with 86400s TTL |
| Time-based keys may collide | MEDIUM | Use `record_id` where possible; add `workflow_name` + `trigger_time` composite for scheduled workflows |
| V1 drafts have no idempotency support | MEDIUM | Convert to V2 format to enable idempotency |

---

## Recommended Idempotency Key Strategy

```
SCHEDULED workflows:  "start.metadata.time"  (per-run dedup)
DATASTORE_EVENT workflows:  "start.metadata.record_id"  (per-record dedup)
EVENT workflows:  "trigger.<event_id>"  (per-event dedup)
```
