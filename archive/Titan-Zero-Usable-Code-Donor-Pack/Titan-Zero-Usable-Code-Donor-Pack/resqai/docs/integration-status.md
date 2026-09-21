# Integration Status

**Pod:** ResQAI Customer Support Pod
**Date:** 2026-06-28

---

## 1. Trigger → workflow Integrations

| Integration | Type | Status | Verified |
|------------|------|--------|----------|
| tickets INSERT → ticket_intake_workflow | DATASTORE EVENT (schedule) | ✅ TRIGGERED | 2026-06-27 |
| appointments INSERT → appointment-assignment | DATASTORE EVENT (schedule) | ✅ TRIGGERED | 2026-06-28 |
| tickets UPDATE → support-escalation-manager | DATASTORE EVENT (schedule) | ✅ TRIGGERED | 2026-06-28 |
| CRON → account-health-monitoring | SCHEDULED (no schedule resource) | ❌ NOT CONNECTED | — |
| CRON → followup-slippage-detector | SCHEDULED (no schedule resource) | ❌ NOT CONNECTED | — |
| CRON → customer-satisfaction-monitor | SCHEDULED (no schedule resource) | ❌ NOT CONNECTED | — |

---

## 2. Agent → Runtime Integration

| Agent | Runtime Harness | Status | Impact |
|-------|----------------|--------|--------|
| request-classifier | ❌ None | FAIL | All 8 workflows blocked at agent node |
| operations-coordinator | ❌ None | FAIL | All 8 workflows blocked at agent node |
| resolution-advisor | ❌ None | FAIL | Blocked in 4 workflows |
| tech-suggester | ❌ None | FAIL | Blocked in 2 workflows |
| account_health_monitor | ❌ None | FAIL | Blocked in account-health-monitoring |
| support-reply-drafter | ❌ None | — | Not used — no impact |

**Resolution needed:** `lemma runtime create-harness` for each agent.

---

## 3. Function → Table Integrations

| Function | Tables | Status | Verified |
|----------|--------|--------|----------|
| assign_appointment_technician | appointments (Rw), operations_log (Rw) | ✅ READY | Schema compatible |
| collect_resolved_tickets | tickets (R) | ✅ READY | Schema compatible |
| finalize_slippage_review | operations_log (Rw) | ✅ READY | Schema compatible |
| finalize_dispatch | tickets (Rw), operations_log (Rw) | ✅ READY | Schema compatible |
| update_account_health_status | accounts (Rw), tasks (Rw), operations_log (Rw) | ✅ READY | Schema compatible |
| resolve_dispute | disputes (Rw), tickets (Rw), operations_log (Rw) | ✅ READY | Schema compatible |
| update_ticket_record | tickets (Rw), operations_log (Rw) | ⚠️ COMPATIBLE | Hardcoded actor — other workflows write wrong source |
| check_ticket_urgency | (none) | ✅ READY | Pure function — no table dependency |
| account_health_scan | accounts (Rw), customers (R), followups (R), disputes (R), appointments (R), operations_log (w) | ✅ READY | Schema compatible |
| flag_slipping_followups | followups (R), accounts (R), customers (R) | ✅ READY | Schema compatible |

---

## 4. workflow → Function Integrations

| workflow | Functions Called | Status |
|----------|-----------------|--------|
| ticket_intake_workflow | check_ticket_urgency, update_ticket_record | ✅ Connected |
| dispute-resolution | resolve_dispute | ✅ Connected |
| account-health-monitoring | update_account_health_status | ✅ Connected |
| urgent-dispatch | check_ticket_urgency, finalize_dispatch | ✅ Connected |
| followup-slippage-detector | flag_slipping_followups, finalize_slippage_review | ✅ Connected |
| customer-satisfaction-monitor | collect_resolved_tickets, update_ticket_record | ✅ Connected |
| appointment-assignment | assign_appointment_technician | ✅ Connected |
| support-escalation-manager | update_ticket_record | ✅ Connected |

---

## 5. workflow → Agent Integrations

| workflow | Agents | Status |
|----------|--------|--------|
| ticket_intake_workflow | request-classifier, operations-coordinator, resolution-advisor | ⌛ Blocked (no runtime) |
| dispute-resolution | resolution-advisor | ⌛ Blocked |
| account-health-monitoring | account_health_monitor | ⌛ Blocked |
| urgent-dispatch | request-classifier, tech-suggester, operations-coordinator | ⌛ Blocked |
| followup-slippage-detector | operations-coordinator | ⌛ Blocked |
| customer-satisfaction-monitor | operations-coordinator, resolution-advisor | ⌛ Blocked |
| appointment-assignment | tech-suggester | ⌛ Blocked |
| support-escalation-manager | request-classifier, operations-coordinator, resolution-advisor | ⌛ Blocked |

**All 8 workflows have agent integrations that are blocked.**

---

## 6. Application → Data Integrations

| App | Tables | Integration Type | Status |
|-----|--------|-----------------|--------|
| appointment-board | appointments | lemma-sdk (browser) | ✅ Published |
| crm-tracker | accounts, customers, followups, disputes | lemma-sdk (browser) | ✅ Published |
| ops-dashboard | tickets, appointments, disputes, tasks | lemma-sdk (browser) | ✅ Published |
| resolution-center | disputes, tickets | lemma-sdk (browser) | ✅ Published |
| support-queue | tickets | lemma-sdk (browser) | ✅ Published |

---

## 7. External Integration Readiness

| Integration Type | Status | Notes |
|-----------------|--------|-------|
| Connectors (email, Slack, etc.) | ❌ None deployed | No connector resources exist |
| Surfaces (customer portals) | ❌ None deployed | No surface resources exist |
| API external access | ✅ Available | Documentation on apps available for external use |
| webhook triggers | ❌ Not configured | — |

---

## 8. Integration Health Summary

| Layer | Total Links | working | Blocked | Broken |
|-------|-------------|---------|---------|--------|
| Trigger → workflow | 6 | 3 | 3 (missing schedules) | 0 |
| Agent → Runtime | 6 | 0 | 6 (no harnesses) | 0 |
| Function → Table | 10 | 9 | 0 | 1 (minor) |
| workflow → Function | 10 | 10 | 0 | 0 |
| workflow → Agent | 12 | 0 | 12 | 0 |
| App → Table | 11 | 11 | 0 | 0 |
| **Total** | **55** | **33** | **21** | **1** |
