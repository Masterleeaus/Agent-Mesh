# WORKFLOW_CATALOG.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Summary

| Metric | Count |
|--------|-------|
| Total workflow directories | 11 |
| Total workflow definition files | 12 |
| Unique workflows (deduplicated) | 11 |
| V2 format (graph-based) | 6 |
| V1 format (pipeline-based) | 5 |
| Active workflows | 6 |
| Draft workflows | 5 |

---

## Workflow Catalog

### 1. account-health-monitoring (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/account-health-monitoring/account-health-monitoring.json` |
| **Version** | 1.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based: `nodes[]` + `edges[]`) |
| **Trigger** | `SCHEDULED` — CRON `0 2 * * *` (daily 2AM) |
| **Description** | Nightly account health scan: runs `account_health_monitor` agent, branches by aggregate health score, routes critical through human approval + escalation |
| **Node types** | AGENT → DECISION → FUNCTION / FORM / FORM → DECISION → FORM → FUNCTION → END |
| **Retry policy** | None at workflow level (no `retry_policy`) |
| **Idempotency** | None |
| **Visibility** | POD |
| **Human-in-loop** | FORM nodes for warning acknowledgment, critical approval, and manager escalation |

### 2. account-health (V1 — DRAFT)

| Property | Value |
|----------|-------|
| **File** | `workflows/account-health/account-health.json` |
| **Version** | 1.0.0 |
| **Status** | Draft (enabled: false) |
| **Format** | V1 (pipeline-based: `nodes[].next`) |
| **Trigger** | Schedule CRON `0 2 * * *` |
| **Description** | Predecessor to account-health-monitoring. Flags slipping followups → health scan → analyze → create tasks |
| **Node types** | function → function → agent → function / human_decision |
| **Retry policy** | None |
| **Idempotency** | None |
| **Visibility** | Not specified |
| **Issues** | DRAFT; agent name mismatch (`account-health-monitor` vs actual `account_health_monitor`); no edges array; conditional logic via `conditions` map; `notify-manager` is a terminal node with no outputs |

### 3. appointment-assignment (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/appointment-assignment/appointment-assignment.json` |
| **Version** | 1.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based) |
| **Trigger** | `DATASTORE_EVENT` — table `appointments`, operation `INSERT` |
| **Description** | On appointment creation, suggests best technician via agent, routes through manager approval, updates appointment record |
| **Node types** | AGENT → DECISION → FORM → DECISION → FUNCTION → END |
| **Retry policy** | Workflow-level: max_retries=3, initial_delay=2s, backoff=2x, max_delay=30s. Node-level override on agent + function nodes |
| **Idempotency** | key_source: `start.metadata.record_id`, ttl: 86400s |
| **Visibility** | POD |
| **Human-in-loop** | FORM for manager approval with override capability |

### 4. appointment-reminders (V1 — DRAFT)

| Property | Value |
|----------|-------|
| **File** | `workflows/appointment-reminders/appointment-reminders.json` |
| **Version** | 1.0.0 |
| **Status** | Draft (enabled: false) |
| **Format** | V1 (pipeline-based) |
| **Trigger** | Schedule CRON `0 7 * * *` + events: `appointment.created`, `appointment.rescheduled` |
| **Description** | Fetches upcoming appointments, generates reminders via agent, dispatches via notification channels |
| **Node types** | function → agent → function / human_decision |
| **Retry policy** | None |
| **Idempotency** | None |
| **Visibility** | Not specified |
| **Issues** | DRAFT; references `dispatch_notifications` function (exists); no edges array; human_review has no exit path |

### 5. customer-satisfaction-monitor (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/customer-satisfaction-monitor/customer-satisfaction-monitor.json` |
| **Version** | 1.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based) |
| **Trigger** | `SCHEDULED` — CRON `0 8 * * *` (daily 8AM) |
| **Description** | Collects resolved tickets, coordinates review, routes dissatisfied customers through manager approval and resolution analysis |
| **Node types** | FUNCTION → DECISION → AGENT → DECISION → FORM → DECISION → AGENT → FUNCTION → END |
| **Retry policy** | Workflow-level + node-level on all function/agent nodes: max_retries=3, initial_delay=2s, backoff=2x, max_delay=30s |
| **Idempotency** | key_source: `start.metadata.time`, ttl: 86400s |
| **Visibility** | POD |
| **Human-in-loop** | FORM for manager review |

### 6. daily-standup (V1 — DRAFT)

| Property | Value |
|----------|-------|
| **File** | `workflows/daily-standup/daily-standup.json` |
| **Version** | 1.0.0 |
| **Status** | Draft (enabled: false) |
| **Format** | V1 (pipeline-based) |
| **Trigger** | Schedule CRON `0 8 * * 1-5` (weekdays 8AM) |
| **Description** | Daily ops standup: operations-coordinator assesses scope, generates recommendations and tasks |
| **Node types** | agent → function / human_decision |
| **Retry policy** | None |
| **Idempotency** | None |
| **Visibility** | Not specified |
| **Issues** | DRAFT; no edges array; notify-manager is terminal; conditions via map |

### 7. dispute-resolution (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/dispute-resolution/dispute-resolution.json` |
| **Version** | 2.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based) |
| **Trigger** | `DATASTORE_EVENT` — table `disputes`, operations `INSERT` + `UPDATE` |
| **Description** | Analyzes disputes via resolution-advisor, routes by confidence for auto-resolution or human approval, safety/legal escalations, full audit trail |
| **Node types** | AGENT → DECISION → DECISION → FUNCTION / FORM → DECISION → ... → END |
| **Retry policy** | None at workflow or node level |
| **Idempotency** | None |
| **Visibility** | Not specified |
| **Missing** | `visibility` field; retry_policy; idempotency; timeout |

### 8. followup-slippage-detector (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/followup-slippage-detector/followup-slippage-detector.json` |
| **Version** | 1.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based) |
| **Trigger** | `SCHEDULED` — CRON `*/30 * * * *` (every 30 min) |
| **Description** | Scans for slipping followups, routes through operations-coordinator for human review and approval |
| **Node types** | FUNCTION → DECISION → AGENT → FORM → DECISION → FUNCTION → END |
| **Retry policy** | Workflow-level + node-level on all function/agent nodes |
| **Idempotency** | key_source: `start.metadata.time`, ttl: 1800s |
| **Visibility** | POD |

### 9. followup-slippage (V1 — DRAFT — DUPLICATE)

| Property | Value |
|----------|-------|
| **File** | `workflows/followup-slippage-detector/followup-slippage.json` |
| **Version** | 1.0.0 |
| **Status** | Draft (enabled: false) |
| **Format** | V1 (pipeline-based) |
| **Trigger** | Schedule CRON `0 6 * * 1-5` |
| **Description** | Duplicate of followup-slippage-detector with V1 pipeline format. Scans slippage, analyzes patterns, creates remediation tasks |
| **Issues** | DUPLICATE — co-exists with V2 version in same directory; DRAFT; agent name mismatch (`account-health-monitor` vs `account_health_monitor`); no edges; conditions via map |

### 10. support-escalation-manager (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/support-escalation-manager/support-escalation-manager.json` |
| **Version** | 1.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based) |
| **Trigger** | `DATASTORE_EVENT` — table `tickets`, operation `UPDATE` |
| **Description** | Detects tickets requiring escalation, classifies, coordinates, gets human approval, resolves, and updates record |
| **Node types** | AGENT → DECISION → AGENT → FORM → DECISION → AGENT → FUNCTION → END |
| **Retry policy** | Workflow-level: max_retries=3, initial_delay=2s, backoff=2x, max_delay=30s |
| **Idempotency** | key_source: `start.metadata.record_id`, ttl: 86400s |
| **Visibility** | POD |

### 11. ticket-intake (V1 — Active)

| Property | Value |
|----------|-------|
| **File** | `workflows/ticket-intake/ticket-intake.json` |
| **Version** | 2.0.0 |
| **Status** | Active (enabled: true) |
| **Format** | V1 (pipeline-based) |
| **Trigger** | Events: `ticket.created` |
| **Description** | Classifies incoming tickets, checks urgency, coordinates normal tickets, routes urgent through human approval, generates resolution recommendation, finalizes record |
| **Node types** | agent → function → agent → human_decision → agent → function / human_decision |
| **Retry policy** | None |
| **Idempotency** | None |
| **Visibility** | Not specified |
| **Issues** | Active but V1 format; no retry_policy; no idempotency; no edges array; conditions via map; missing visibility |

### 12. urgent-dispatch (V2)

| Property | Value |
|----------|-------|
| **File** | `workflows/urgent-dispatch/urgent-dispatch.json` |
| **Version** | 2.0.0 |
| **Status** | Active |
| **Format** | V2 (graph-based) |
| **Trigger** | `DATASTORE_EVENT` — table `tickets`, operations `INSERT` + `UPDATE` |
| **Description** | Dispatches high-priority tickets: classifies, checks urgency, suggests technician (or manager assigns), coordinates dispatch, finalizes |
| **Node types** | AGENT → DECISION → FUNCTION → DECISION → AGENT → DECISION → FORM / AGENT → DECISION → FUNCTION → END |
| **Retry policy** | Workflow-level: max_retries=3, initial_delay=2s, backoff=2x, max_delay=30s |
| **Idempotency** | key_source: `trigger.metadata.record_id`, ttl: 86400s |
| **Visibility** | POD |

---

## Node Type Usage Across Workflows

| Node Type | V2 Workflows | V1 Workflows | Total |
|-----------|-------------|-------------|-------|
| AGENT / agent | 6 | 5 | 11 |
| FUNCTION / function | 5 | 5 | 10 |
| FORM / human_decision | 5 | 3 | 8 |
| DECISION | 6 | 0 | 6 |
| END | 6 | 0 | 6 |

---

## Validation Log

| Issue ID | Severity | Workflow | Details |
|----------|----------|----------|---------|
| W-001 | HIGH | account-health | Agent name `account-health-monitor` does not match defined agent `account_health_monitor` |
| W-002 | HIGH | followup-slippage | Agent name `account-health-monitor` does not match defined agent `account_health_monitor` |
| W-003 | HIGH | All V1 workflows | Format incompatible with V2 execution engine — uses `nodes[].next` instead of `edges[]` |
| W-004 | HIGH | appointment-reminders | References `dispatch_notifications` function — verified EXISTS |
| W-005 | MEDIUM | dispute-resolution | Missing `visibility` field |
| W-006 | MEDIUM | ticket-intake | Missing `visibility` field |
| W-007 | MEDIUM | account-health | Missing `visibility` field |
| W-008 | MEDIUM | appointment-reminders | Missing `visibility` field |
| W-009 | MEDIUM | daily-standup | Missing `visibility` field |
| W-010 | MEDIUM | followup-slippage | Missing `visibility` field |
| W-011 | MEDIUM | followup-slippage-detector | Duplicate V1 file `followup-slippage.json` in same directory |
| W-012 | MEDIUM | account-health | `notify-manager` node is terminal — no onward edges or next conditions |
| W-013 | MEDIUM | appointment-reminders | `human-review` node is terminal — no onward edges |
| W-014 | MEDIUM | daily-standup | `notify-manager` node is terminal — no onward edges |
| W-015 | LOW | appointment-assignment | `technician_id` mapped as literal `null` |
| W-016 | LOW | appointment-reminders | References `support-reply-drafter` for reminder generation — possible role mismatch |
| W-017 | LOW | tech-suggester | Missing `agent.json` — only has input-schema.json and runtime.json |
| W-018 | LOW | customer-satisfaction-monitor | `analyze_resolution` mapped to `resolve_escalation` agent (resolution-advisor) with `dispute_id` — uses ticket ID as dispute ID |
