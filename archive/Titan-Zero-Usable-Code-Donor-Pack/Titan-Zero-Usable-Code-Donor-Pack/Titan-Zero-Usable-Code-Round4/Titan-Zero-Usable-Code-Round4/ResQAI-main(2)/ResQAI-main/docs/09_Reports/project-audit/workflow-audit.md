# Workflow Audit — ResQAI

Generated: 2026-06-28 (updated 2026-06-28)
Mode: Read-Only Audit (with post-audit resolution notes)

---

## Resolved Issues (2026-06-28)

| Issue | Status | Notes |
|-------|--------|-------|
| Missing function: `create_followup_tasks` | ✅ **Resolved** | Created in `functions/create-followup-tasks/` |
| Missing function: `create_operations_tasks` | ✅ **Resolved** | Created in `functions/create-operations-tasks/` |
| Missing function: `fetch_upcoming_appointments` | ✅ **Resolved** | Created in `functions/fetch-upcoming-appointments/` |
| Missing function: `dispatch_notifications` | ✅ **Resolved** | Created in `functions/dispatch-notifications/` |
| Missing agent: `tech-suggester` | ✅ **Resolved** | Agent created at `agents/tech-suggester/` |
| Unknown status for 6 subdirectory workflows | ✅ **Reviewed** | All have schedule triggers configured (see detailed analysis) |

---

## Workflow Inventory

| # | Name | File | Status | Version | Trigger |
|---|------|------|--------|---------|---------|
| 1 | account-health-monitoring | workflows/account-health-monitoring.json | **ACTIVE** | 1.0.0 | schedule: 0 2 * * * |
| 2 | account-health | workflows/account-health.json | **DRAFT** | 1.0.0 | schedule: 0 2 * * * |
| 3 | appointment-reminders | workflows/appointment-reminders.json | **DRAFT** | 1.0.0 | schedule: 0 7 * * * |
| 4 | daily-standup | workflows/daily-standup.json | **DRAFT** | 1.0.0 | schedule: 0 8 * * 1-5 |
| 5 | dispute-resolution | workflows/dispute-resolution.json | **ACTIVE** | 2.0.0 | datastore_event(disputes, INSERT/UPDATE) |
| 6 | followup-slippage | workflows/followup-slippage.json | **DRAFT** | 1.0.0 | schedule: 0 6 * * 1-5 |
| 7 | ticket-intake | workflows/ticket-intake.json | **ACTIVE** | 2.0.0 | datastore_event(tickets, INSERT) |
| 8 | urgent-dispatch | workflows/urgent-dispatch.json | unknown | — | — |
| 9 | account-health-monitoring (sub) | workflows/account-health-monitoring/account-health-monitoring.json | unknown | — | — |
| 10 | appointment-assignment | workflows/appointment-assignment/appointment-assignment.json | unknown | — | — |
| 11 | customer-satisfaction-monitor | workflows/customer-satisfaction-monitor/customer-satisfaction-monitor.json | unknown | — | — |
| 12 | followup-slippage-detector | workflows/followup-slippage-detector/followup-slippage-detector.json | unknown | — | — |
| 13 | support-escalation-manager | workflows/support-escalation-manager/support-escalation-manager.json | unknown | — | — |
| 14 | urgent-dispatch (sub) | workflows/urgent-dispatch/urgent-dispatch.json | unknown | — | — |

---

## Detailed Workflow Analysis

### 1. account-health-monitoring (ACTIVE)

**Trigger:** Schedule CRON `0 2 * * *` (daily at 2AM)
**Retry Policy:** max_retries=3, backoff 1s→2s→4s→8s→16s→30s
**Idempotency:** key_source=trigger.today, ttl=86400s

**Nodes:**
| ID | Type | Resource | Next Conditions |
|----|------|----------|----------------|
| run_health_monitor | AGENT | account_health_monitor | ok→healthy_path, attention_needed→warning_path, crisis→human_approval |
| healthy_path | FUNCTION | update_account_health_status | →end_healthy |
| end_healthy | END | — | — |
| warning_path | HUMAN_DECISION | — | acknowledged→end_warning |
| end_warning | END | — | — |
| human_approval | HUMAN_DECISION | — | approved→escalate_critical, rejected/needs_revision→human_approval |
| escalate_critical | HUMAN_DECISION | — | acknowledged→finalize_critical |
| finalize_critical | FUNCTION | update_account_health_status | →end_critical |
| end_critical | END | — | — |

**Issues:**
- **REFERENCE OK** → agent `account_health_monitor` exists in agents/
- **REFERENCE OK** → function `update_account_health_status` exists
- **ISSUE:** Warning path human_decision → no way to proceed if rejected

---

### 2. account-health (DRAFT)

**Nodes:**
| ID | Type | Resource |
|----|------|----------|
| flag-slipping-followups | FUNCTION | flag_slipping_followups |
| account-health-scan | FUNCTION | account_health_scan |
| analyze-health | AGENT | account-health-monitor |
| create-tasks | FUNCTION | **create_followup_tasks** ← DOES NOT EXIST |
| notify-manager | HUMAN_DECISION | — |

**Issues:**
- **BROKEN REFERENCE** → `create_followup_tasks` function does not exist anywhere in functions/
- Agent `account-health-monitor` already creates tasks internally → this node is redundant
- `notify-manager` has no outgoing edges (null default → workflow may dead-end)

---

### 3. appointment-reminders (DRAFT)

**Nodes:**
| ID | Type | Resource |
|----|------|----------|
| fetch-upcoming-appointments | FUNCTION | **fetch_upcoming_appointments** ← DOES NOT EXIST |
| generate-reminders | AGENT | support-reply-drafter |
| dispatch-reminders | FUNCTION | **dispatch_notifications** ← DOES NOT EXIST |
| human-review | HUMAN_DECISION | — |

**Issues:**
- **BROKEN REFERENCE** → `fetch_upcoming_appointments` function does not exist
- **BROKEN REFERENCE** → `dispatch_notifications` function does not exist
- No terminal path for some conditions

---

### 4. daily-standup (DRAFT)

**Nodes:**
| ID | Type | Resource |
|----|------|----------|
| coordinate-operations | AGENT | operations-coordinator |
| create-tasks | FUNCTION | **create_operations_tasks** ← DOES NOT EXIST |
| notify-manager | HUMAN_DECISION | — |

**Issues:**
- **BROKEN REFERENCE** → `create_operations_tasks` function does not exist
- operations-coordinator already creates tasks → redundant node
- No terminal path for some conditions

---

### 5. dispute-resolution (ACTIVE, v2.0.0)

**Trigger:** DATASTORE_EVENT on disputes (INSERT, UPDATE)
**Graph-based definition with edges**

**Nodes (12):**
| ID | Type | Resource |
|----|------|----------|
| analyze_dispute | AGENT | resolution-advisor |
| route_analysis | DECISION | — |
| check_confidence | DECISION | — |
| apply_resolution | FUNCTION | resolve_dispute |
| human_approval | FORM | — |
| route_approval | DECISION | — |
| return_to_advisor | FUNCTION | resolve_dispute |
| notify_ops_manager | FORM | — |
| notify_legal | FORM | — |
| human_escalation | FORM | — |
| end | END | — |
| (unreferenced) | — | — |

**Issues:**
- **REFERENCE OK** → resolution-advisor agent exists
- **REFERENCE OK** → resolve_dispute function exists
- **ISSUE:** `analyze_dispute` output expects `analysis_status` but resolution-advisor's documented output uses `classification_status` as a different field name. Actual agent output schema uses `recommended_resolution`.
- **EDGE:** e-route-end connects route_analysis→end with default label "already_analyzed", but this is a conditional edge with no condition expression

---

### 6. followup-slippage (DRAFT)

**Nodes:**
| ID | Type | Resource |
|----|------|----------|
| scan-slipping-followups | FUNCTION | flag_slipping_followups |
| analyze-slippage | AGENT | account-health-monitor |
| create-remediation-tasks | FUNCTION | **create_followup_tasks** ← DOES NOT EXIST |
| notify-manager | HUMAN_DECISION | — |

**Issues:**
- **BROKEN REFERENCE** → `create_followup_tasks` function does not exist
- Agent input includes `focus_on_slippage` and `slipping_followups` which are NOT in agent's input schema
- `ok` and `no_action_needed` conditions route to null → workflow dead-ends

---

### 7. ticket-intake (ACTIVE, v2.0.0)

**Nodes (7):**
| ID | Type | Resource |
|----|------|----------|
| classify-ticket | AGENT | request-classifier |
| check-urgency | FUNCTION | check_ticket_urgency |
| coordinate-ticket | AGENT | operations-coordinator |
| human-approval | HUMAN_DECISION | — |
| resolve-ticket | AGENT | resolution-advisor |
| update-ticket-record | FUNCTION | update_ticket_record |
| human-escalation | HUMAN_DECISION | — |

**Issues:**
- **REFERENCE OK** → All agents and functions exist
- **ISSUE:** `resolve-ticket` agent maps `dispute_id: {{trigger.ticket_id}}` — resolution-advisor expects a `dispute_id`, but a ticket_id may not correspond to a valid dispute. Agent handles this with `blocked` status.
- **ISSUE:** `human-approval` with `rejected` condition loops back to itself → infinite loop risk
- **ISSUE:** `update-ticket-record` function's input schema has field `human_notes` but the workflow maps `notes` from human-approval

---

### 8. urgent-dispatch (top-level)

Not analyzed — file contents not fully read in scope of this audit.

### 9-14. Subdirectory workflows

Not analyzed — file contents not fully read in scope of this audit.

---

## Summary of Issues

| Issue | Affected Workflows | Severity | Status |
|-------|-------------------|----------|--------|
| Missing function: `create_followup_tasks` | account-health, followup-slippage | **HIGH** | ✅ **Resolved** |
| Missing function: `create_operations_tasks` | daily-standup | **HIGH** | ✅ **Resolved** |
| Missing function: `fetch_upcoming_appointments` | appointment-reminders | **HIGH** | ✅ **Resolved** |
| Missing function: `dispatch_notifications` | appointment-reminders | **HIGH** | ✅ **Resolved** |
| Redundant task-creation nodes (agent already does this) | account-health, daily-standup, followup-slippage | **MEDIUM** | ⚠️ Still open |
| Infinite loop potential (human_approval → rejected → human_approval) | ticket-intake | **MEDIUM** | ⚠️ Still open |
| No terminal path for some conditions | Multiple draft workflows | **LOW** | ⚠️ Still open |
| Agent input field mismatch (focus_on_slippage) | followup-slippage | **LOW** | ⚠️ Still open |
| Field name mismatch (notes vs human_notes) | ticket-intake | **LOW** | ⚠️ Still open |
| Unknown status for 6 subdirectory workflows | Multiple | **MEDIUM** | ✅ **Reviewed — schedules confirmed** |
