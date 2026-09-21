# Platform Validation Report

**Pod:** ResQAI Customer Support Pod
**Date:** 2026-06-28
**Auditor:** Platform Validation Phase

---

## 1. workflow Audit

### 1.1 ticket_intake_workflow

| Property | Value |
|----------|-------|
| ID | `019f07a6-d208-7661-9195-23792573f182` |
| Status | `active` |
| Node Count | 12 |
| Start Type | DATASTORE_EVENT (tickets INSERT via schedule `ticket-intake-trigger`) |
| Legacy Format | Flat JSON — no retry_policy, no idempotency, no explicit edges |

**Node Inventory:**

| Node ID | Type | Target | Exists? |
|---------|------|--------|---------|
| classify-ticket | AGENT (request-classifier) | → check-urgency / human-escalation | ✅ |
| check-urgency | FUNCTION (check_ticket_urgency) | → coordinate-ticket / human-approval | ✅ |
| coordinate-ticket | AGENT (operations-coordinator) | → human-approval | ✅ |
| human-approval | human_decision (FORM) | → resolve-ticket / human-approval / coordinate-ticket | ✅ |
| resolve-ticket | AGENT (resolution-advisor) | → update-ticket-record / human-escalation | ✅ |
| update-ticket-record | FUNCTION (update_ticket_record) | → END | ✅ |
| human-escalation | human_decision (FORM) | → END | ✅ |

**Issues:**
- No retry_policy configured
- No idempotency configured
- Uses old `{{trigger.*}}` template syntax — not JMESPath
- `human-approval` rejected route loops back to itself (not a break condition — may cause infinite loop)
- Graph integrity: entry node reachable ✅, terminal paths exist ✅, no orphan nodes ✅

---

### 1.2 dispute-resolution

| Property | Value |
|----------|-------|
| ID | `019f07f2-bba0-7039-80a7-1338001c5bf2` |
| Status | `active` |
| Node Count | 11 |
| Start Type | DATASTORE_EVENT (disputes INSERT/UPDATE) |
| Retry Policy | ❌ Not configured |
| Idempotency | ❌ Not configured |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| analyze_dispute | AGENT (resolution-advisor) | agent `resolution-advisor` | ✅ |
| route_analysis | DECISION | — | ✅ |
| auto_resolve | FUNCTION (resolve_dispute) | function `resolve_dispute` | ✅ |
| human_approval | FORM | — | ✅ |
| route_human | DECISION | — | ✅ |
| finalize_resolution | FUNCTION (resolve_dispute) | function `resolve_dispute` | ✅ |
| legal_escalation | FORM | — | ✅ |
| insufficient_form | FORM | — | ✅ |
| blocked_form | FORM | — | ✅ |
| human_escalation | FORM | — | ✅ |
| end | END | — | ✅ |

**Issues:**
- No retry_policy
- No idempotency
- `route_analysis` default edge targets `auto_resolve` — condition also targets `auto_resolve` for `ready_for_review`, but insufficient/blocked/safety/legal routes to other forms. Default shares a target with a rule.
- Graph integrity: entry node reachable ✅, no orphan nodes ✅, terminal paths OK ✅

---

### 1.3 account-health-monitoring

| Property | Value |
|----------|-------|
| ID | `019f0867-2b62-76b5-aeaf-1ba2be8d68d4` |
| Status | `active` |
| Node Count | 11 |
| Start Type | SCHEDULED (CRON — nightly) |
| Retry Policy | ❌ Not configured |
| Idempotency | ❌ Not configured |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| run_health_monitor | AGENT (account_health_monitor) | agent `account_health_monitor` | ✅ |
| route_by_health | DECISION | — | ✅ |
| healthy_path | FUNCTION (update_account_health_status) | function `update_account_health_status` | ✅ |
| end_healthy | END | — | ✅ |
| warning_path | FORM | — | ✅ |
| end_warning | END | — | ✅ |
| human_approval | FORM | — | ✅ |
| route_approval | DECISION | — | ✅ |
| escalate_critical | FORM | — | ✅ |
| finalize_critical | FUNCTION (update_account_health_status) | function `update_account_health_status` | ✅ |
| end_critical | END | — | ✅ |

**Issues:**
- No retry_policy
- No idempotency
- `route_approval` default edge targets `human_approval` (rejected → re-enter approval — potential loop)
- Graph integrity: ✅

---

### 1.4 urgent-dispatch

| Property | Value |
|----------|-------|
| ID | `019f08b7-4a72-7282-9198-77dd816e8ada` |
| Status | `active` |
| Node Count | 14 |
| Start Type | DATASTORE_EVENT (tickets INSERT/UPDATE) |
| Retry Policy | ✅ `max_retries: 3, backoff: 2x, initial_delay: 2000ms` |
| Idempotency | ✅ `key: start.metadata.record_id, ttl: 86400s` |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| classify_urgent | AGENT (request-classifier) | agent `request-classifier` | ✅ |
| route_classification | DECISION | — | ✅ |
| check_urgency | FUNCTION (check_ticket_urgency) | function `check_ticket_urgency` | ✅ |
| route_urgency | DECISION | — | ✅ |
| suggest_tech | AGENT (tech-suggester) | agent `tech-suggester` | ✅ |
| route_tech | DECISION | — | ✅ |
| manager_assignment | FORM | — | ✅ |
| coordinate_dispatch | AGENT (operations-coordinator) | agent `operations-coordinator` | ✅ |
| route_after_coordinate | DECISION | — | ✅ |
| finalize_dispatch_auto | FUNCTION (finalize_dispatch) | function `finalize_dispatch` | ✅ |
| finalize_dispatch_manual | FUNCTION (finalize_dispatch) | function `finalize_dispatch` | ✅ |
| finalize_escalation | FUNCTION (finalize_dispatch) | function `finalize_dispatch` | ✅ |
| human_escalation | FORM | — | ✅ |
| end | END | — | ✅ |

**Issues:**
- `route_after_coordinate` re-evaluates `suggest_tech.pick_tech_name` but the tech-suggester already ran before coordinate_dispatch — this may produce stale/incorrect routing
- Graph integrity: ✅, all terminal paths exist ✅

---

### 1.5 followup-slippage-detector

| Property | Value |
|----------|-------|
| ID | `019f0c9e-d504-777f-8671-0bc790bcfa43` |
| Status | `active` |
| Node Count | 9 |
| Start Type | SCHEDULED (CRON — every 30 min) |
| Retry Policy | ✅ `max_retries: 3, backoff: 2x, initial_delay: 2000ms` |
| Idempotency | ✅ `key: start.metadata.time, ttl: 86400s` |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| flag_followups | FUNCTION (flag_slipping_followups) | function `flag_slipping_followups` | ✅ |
| check_slippage | DECISION | — | ✅ |
| coordinate_review | AGENT (operations-coordinator) | agent `operations-coordinator` | ✅ |
| human_review | FORM | — | ✅ |
| check_approval | DECISION | — | ✅ |
| finalize | FUNCTION (finalize_slippage_review) | function `finalize_slippage_review` | ✅ |
| end_no_slippage | END | — | ✅ |
| end_approved | END | — | ✅ |
| end_rejected | END | — | ✅ |

**Issues:**
- Graph integrity: ✅, all terminal paths reachable ✅
- No missing references ✅

---

### 1.6 customer-satisfaction-monitor

| Property | Value |
|----------|-------|
| ID | `019f0cb4-327f-778d-80e1-2f1359be9262` |
| Status | `active` |
| Node Count | 12 |
| Start Type | SCHEDULED (CRON — daily) |
| Retry Policy | ✅ `max_retries: 3, backoff: 2x, initial_delay: 2000ms` |
| Idempotency | ✅ `key: start.metadata.time, ttl: 86400s` |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| collect_tickets | FUNCTION (collect_resolved_tickets) | function `collect_resolved_tickets` | ✅ |
| any_tickets | DECISION | — | ✅ |
| coordinate_review | AGENT (operations-coordinator) | agent `operations-coordinator` | ✅ |
| satisfaction_check | DECISION | — | ✅ |
| manager_review | FORM | — | ✅ |
| approval_check | DECISION | — | ✅ |
| analyze_resolution | AGENT (resolution-advisor) | agent `resolution-advisor` | ✅ |
| finalize | FUNCTION (update_ticket_record) | function `update_ticket_record` | ✅ |
| end_no_tickets | END | — | ✅ |
| end_satisfied | END | — | ✅ |
| end_rejected | END | — | ✅ |
| end_complete | END | — | ✅ |

**Issues:**
- `analyze_resolution` maps `collect_tickets.tickets[0].ticket_id` — processes only one ticket; remaining resolved tickets are ignored
- Graph integrity: ✅, all terminal paths reachable ✅

---

### 1.7 appointment-assignment

| Property | Value |
|----------|-------|
| ID | `019f0cc0-0ece-7293-bf8f-9ab4ac7c104a` |
| Status | `active` |
| Node Count | 8 |
| Start Type | DATASTORE_EVENT (appointments INSERT) |
| Retry Policy | ✅ `max_retries: 3, backoff: 2x, initial_delay: 2000ms` |
| Idempotency | ✅ `key: start.payload, ttl: 86400s` |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| suggest_technician | AGENT (tech-suggester) | agent `tech-suggester` | ✅ |
| check_suggestion | DECISION | — | ✅ |
| manager_approval | FORM | — | ✅ |
| approval_check | DECISION | — | ✅ |
| assign_technician | FUNCTION (assign_appointment_technician) | function `assign_appointment_technician` | ✅ |
| end_no_suggestion | END | — | ✅ |
| end_rejected | END | — | ✅ |
| end_assigned | END | — | ✅ |

**Issues:**
- Idempotency key `start.payload` is too broad — should be `start.metadata.record_id`
- `assign_technician` maps `technician_name` as `manager_approval.override_technician || suggest_technician.pick_tech_name` — this JMESPath expression may not evaluate as expected (JMESPath does not support `||`)
- Graph integrity: ✅

---

### 1.8 support-escalation-manager

| Property | Value |
|----------|-------|
| ID | `019f0cde-ea2a-7126-8424-2bfce90025ef` |
| Status | `active` |
| Node Count | 10 |
| Start Type | DATASTORE_EVENT (tickets UPDATE via schedule `support-escalation-manager-trigger`) |
| Retry Policy | ✅ `max_retries: 3, backoff: 2x, initial_delay: 2000ms, max_delay: 30000ms` |
| Idempotency | ✅ `key: start.metadata.record_id, ttl: 86400s` |

**Node Inventory:**

| Node ID | Type | Referenced Resource | Exists? |
|---------|------|---------------------|---------|
| classify_ticket | AGENT (request-classifier) | agent `request-classifier` | ✅ |
| check_escalation | DECISION | — | ✅ |
| coordinate_escalation | AGENT (operations-coordinator) | agent `operations-coordinator` | ✅ |
| human_approval | FORM | — | ✅ |
| route_approval | DECISION | — | ✅ |
| resolve_escalation | AGENT (resolution-advisor) | agent `resolution-advisor` | ✅ |
| update_ticket | FUNCTION (update_ticket_record) | function `update_ticket_record` | ✅ |
| end_approved | END | — | ✅ |
| end_rejected | END | — | ✅ |
| end_no_escalation | END | — | ✅ |

**Issues:**
- No missing references ✅
- Graph integrity: ✅, entry node reachable, terminal paths for all branches ✅
- Retryable errors configured ✅
- Trigger confirmed: schedule `support-escalation-manager-trigger` fired on UPDATE ✅

---

## 2. Function Audit

### 2.1 All Functions Status

| Function | Status | Type | Grants | Code Quality |
|----------|--------|------|--------|-------------|
| assign_appointment_technician | READY | API | appointments (Rw), operations_log (Rw) | ✅ error handling |
| collect_resolved_tickets | READY | API | tickets (R) | ✅ deterministic |
| finalize_slippage_review | READY | API | operations_log (Rw) | ✅ try/except |
| finalize_dispatch | READY | API | tickets (Rw), operations_log (Rw) | ✅ idempotent |
| update_account_health_status | READY | API | accounts (Rw), tasks (Rw), operations_log (Rw) | ✅ deterministic |
| resolve_dispute | READY | API | disputes (Rw), tickets (Rw), operations_log (Rw) | ✅ idempotent |
| update_ticket_record | READY | API | tickets (Rw), operations_log (Rw) | ✅ |
| check_ticket_urgency | READY | API | (none) | ✅ pure function |
| account_health_scan | READY | API | accounts (Rw), customers (R), followups (R), disputes (R), appointments (R), operations_log (w) | ✅ deterministic |
| flag_slipping_followups | READY | API | followups (R), accounts (R), customers (R) | ✅ deterministic, no side effects |

### 2.2 Issues Found

| Function | Issue |
|----------|-------|
| assign_appointment_technician | `technician_id` input always passed as `null` from workflow — not used |
| update_ticket_record | Hardcoded `actor: "workflow:ticket_intake_workflow"` in operations_log — emits wrong source when called from other workflows |
| collect_resolved_tickets | Uses `list(limit=50)` without filtering — may miss tickets on larger datasets |
| check_ticket_urgency | No grants but doesn't read/write any table — acceptable |
| account_health_scan | Very long function — high complexity, single-file |
| flag_slipping_followups | Client-side filtering with `list(limit=500)` — may miss data at scale |

---

## 3. Agent Audit

### 3.1 All Agents

| Agent | Toolsets | Input Schema | Output Schema | Grants |
|-------|----------|-------------|--------------|--------|
| request-classifier | POD | ✅ ticket_id, force_reclassify, message, customer_name, channel | ✅ urgency, request_type, classification_status, escalation_reason, suggested_owner | tickets (R+w), technicians (R) |
| operations-coordinator | POD | ✅ scope, today, max_actions, create_tasks | ✅ coordination_status, recommendations, summary, summary_counts, tasks_created | tickets (R), appointments (R), technicians (R), customers (R), tasks (R), operations_log (R) |
| resolution-advisor | POD | ✅ dispute_id | ✅ analysis_status, recommended_resolution, confidence, reasoning | disputes (R+w), tickets (R+w), operations_log (R+w) |
| tech-suggester | POD | ✅ ticket_id, urgency, service_request, appointment_date, service_type | ✅ pick_tech_name, score, rationale | technicians (R), appointments (R) |
| account_health_monitor | POD | ✅ today, days_ahead, lookback_days, max_recommendations, create_followup_tasks | ✅ coordination_status, recommendations, summary, summary_counts, tasks_created | accounts (R+w), customers (R), followups (R), appointments (R), disputes (R), flag_slipping_followups (execute), account_health_scan (execute) |
| support-reply-drafter | POD | ✅ ticket_id | ✅ draft_reply, suggested_owner, reasoning | tickets (R+w), technicians (R) |

### 3.2 Issues

| Issue | Details |
|-------|---------|
| No agent runtime harnesses | `lemma runtime harnesses` returns empty — all agents lack execution infrastructure |
| Agent `support-reply-drafter` not used | Deployed but not referenced by any workflow or schedule |
| Agent `account_health_monitor` has function execute grants | Executes `flag_slipping_followups` and `account_health_scan` as tools — no code_path available to verify these agent→function tool bindings |

---

## 4. Schedule / Trigger Audit

| Schedule | Type | Target | Active | Last Fire | Status |
|----------|------|--------|--------|-----------|--------|
| ticket-intake-trigger | DATASTORE (tickets INSERT) | ticket_intake_workflow | ✅ | 2026-06-27 | TRIGGERED |
| appointment-assignment-trigger | DATASTORE (appointments INSERT) | appointment-assignment | ✅ | 2026-06-28 | TRIGGERED |
| support-escalation-manager-trigger | DATASTORE (tickets UPDATE) | support-escalation-manager | ✅ | 2026-06-28 | TRIGGERED |

**Missing schedules:**
- No schedule for CRON-based workflows: `account-health-monitoring`, `followup-slippage-detector`, `customer-satisfaction-monitor` — these are defined as SCHEDULED start type but no separate schedule resource exists

---

## 5. Table Audit

| Table | Columns | RLS | Primary Key | Used By |
|-------|---------|-----|-------------|---------|
| tickets | 15 columns (id, customer_name, channel, subject, message, request_type, urgency, suggested_owner, owner, draft_reply, human_notes, approved_to_send, status, created_at, updated_at) | OFF | id | workflows + functions + agents |
| appointments | 9 columns | OFF | id | workflows + functions + agents |
| disputes | 12 columns | OFF | id | workflows + functions + agents |
| operations_log | 7 columns | OFF | id | functions (audit trail) |
| customers | 9 columns | OFF | id | agents + functions |
| technicians | 8 columns | OFF | id | agents + functions |
| tasks | 8 columns | OFF | id | functions + agents |
| accounts | 21 columns | OFF | id | agents + functions |
| followups | 16 columns | OFF | id | agents + functions |

All tables have RLS disabled (shared team data) — appropriate for this operational pod.

---

## 6. Application Audit

| App | Status | URL | Connected To |
|-----|--------|-----|-------------|
| appointment-board | READY | https://appointment-board.apps.lemma.work | appointments table |
| crm-tracker | READY | https://crm-tracker.apps.lemma.work | accounts, customers, followups, disputes |
| ops-dashboard | READY | https://ops-dashboard.apps.lemma.work | tickets, appointments, disputes, tasks |
| resolution-center | READY | https://resolution-center.apps.lemma.work | disputes, tickets |
| support-queue | READY | https://support-queue.apps.lemma.work | tickets |

No apps directly reference workflows, functions, or agents — they operate on table data via lemma-sdk.

---

## 7. Cross-Cutting Issues

| # | Severity | Issue | Affected Resources |
|---|----------|-------|-------------------|
| 1 | CRITICAL | No agent runtime harnesses available — all agent nodes fail at runtime | All workflows using AGENT nodes |
| 2 | HIGH | Legacy workflow `ticket_intake_workflow` uses `{{trigger.*}}` template syntax | ticket_intake_workflow |
| 3 | HIGH | `update_ticket_record` hardcodes actor as `workflow:ticket_intake_workflow` | update_ticket_record function |
| 4 | MEDIUM | 3 CRON workflows have no schedule resources | account-health-monitoring, followup-slippage-detector, customer-satisfaction-monitor |
| 5 | MEDIUM | `appointment-assignment` idempotency key is `start.payload` | appointment-assignment workflow |
| 6 | MEDIUM | 3 legacy workflows lack retry_policy and idempotency | ticket_intake_workflow, dispute-resolution, account-health-monitoring |
| 7 | LOw | `assign_appointment_technician` receives `technician_id` as null | appointment-assignment workflow |
| 8 | LOw | `customer-satisfaction-monitor` only processes first resolved ticket | customer-satisfaction-monitor workflow |
| 9 | INFO | `support-reply-drafter` agent is deployed but unreferenced | None |
| 10 | INFO | No connectors deployed | None |
| 11 | INFO | No surfaces deployed | None |

---

## 8. Final Summary

| Resource Type | Total | Active | Issues Found |
|---------------|-------|--------|-------------|
| workflows | 8 | 8 | 8 issues (1 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOw, 1 INFO) |
| Functions | 10 | 10 (READY) | 5 minor issues |
| Agents | 6 | 6 | 1 CRITICAL (runtime) |
| Schedules | 3 | 3 | 3 CRON workflows missing schedule resources |
| Tables | 9 | 9 | No issues |
| Apps | 5 | 5 (READY) | No issues |
