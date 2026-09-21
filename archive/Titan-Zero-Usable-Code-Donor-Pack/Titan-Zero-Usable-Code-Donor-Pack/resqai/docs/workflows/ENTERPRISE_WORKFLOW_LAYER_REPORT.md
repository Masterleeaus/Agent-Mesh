# ENTERPRISE_WORKFLOW_LAYER_REPORT.md — ResQAI V2

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration
> Author: Chief Workflow Architect

---

## Executive Summary

This report presents the complete audit, analysis, and integration of ResQAI V2's enterprise workflow layer. The project contains **12 workflow definition files** across **11 directories**, orchestrating **6 agents** and **14 distinct functions** through **scheduled, event-driven, and datastore-triggered execution paths**.

### Key Metrics

| Category | Count |
|----------|-------|
| Total workflow files | 12 |
| Unique workflows | 11 |
| V2 format (graph-based) | 6 |
| V1 format (pipeline-based) | 5 (all draft/legacy) |
| Active V2 workflows | 6 |
| Active V1 workflows | 1 (ticket-intake) |
| Draft/disabled workflows | 5 |
| Unique agents referenced | 6 |
| Unique functions referenced | 14 |
| Workflow nodes (total) | 87 |
| Human-in-loop (FORM) nodes | 16 |
| AGENT nodes | 18 |
| FUNCTION nodes | 18 |
| DECISION nodes | 13 |
| END nodes | 22 |

---

## Architecture Assessment

### Strengths

1. **Clear separation of concerns**: Workflows orchestrate; agents provide judgment; functions provide deterministic logic
2. **Human-in-the-loop pattern**: All V2 workflows place humans at decision points (FORM nodes for approval/escalation)
3. **Idempotency design**: Functions document idempotency guarantees; 5 V2 workflows have idempotency keys
4. **Retry policies**: 4 V2 workflows have consistent exponential backoff retry (3 attempts, 2s-30s window)
5. **Granular permissions**: Agents and functions follow zero-access-by-default with explicit grants
6. **Event-driven architecture**: 4 workflows triggered by DATASTORE events for real-time processing

### Weaknesses

1. **Format fragmentation**: V1 and V2 formats co-exist — V1 workflows cannot use DECISION nodes, edges, or graph-based routing
2. **Missing timeouts**: No workflow or node has timeout configuration — risk of indefinite hangs
3. **No dead letter queues**: No workflow redirects to DLQ after exhausting retries
4. **No rollback/compensation**: State-altering steps lack compensation logic for failure recovery
5. **Circular re-trigger risk**: urgent-dispatch and support-escalation-manager write back to tickets, which re-fires their own DATASTORE triggers
6. **Incomplete agent definition**: `tech-suggester` has no `agent.json` — will fail at runtime with missing grants
7. **Duplicate logic**: `followup-slippage.json` is a V1 duplicate of `followup-slippage-detector.json` in the same directory
8. **Agent name mismatch**: V1 workflows reference `account-health-monitor` but the defined agent is `account_health_monitor`

---

## Validation Results

### Broken Links: 3 Critical

| Issue | Affected Workflow | Detail |
|-------|-------------------|--------|
| `tech-suggester` missing agent.json | appointment-assignment, urgent-dispatch | Missing permissions — runtime failure |
| Agent name mismatch `account-health-monitor` | account-health, followup-slippage | References undefined agent; should be `account_health_monitor` |
| Circular re-trigger | urgent-dispatch, support-escalation-manager | Writes to tickets trigger own DATASTORE events |

### Missing Functions: 0

All 14 functions referenced by workflows are present and defined.

### Missing Agents: 1

`tech-suggester` agent is referenced by 2 workflows but lacks `agent.json`.

### Duplicate Logic: 1

`followup-slippage.json` duplicates `followup-slippage-detector.json` (same directory, V1 format).

### Circular Dependencies: 2

| Path | Risk |
|------|------|
| urgent-dispatch → tickets → DATASTORE event → urgent-dispatch | High — infinite loop |
| support-escalation-manager → tickets → DATASTORE event → support-escalation-manager | High — infinite loop |

---

## Standardization Required

### Immediate (Critical)

1. **Create `agent.json` for `tech-suggester`** — include grants for `technicians:read` and `tickets:read`
2. **Fix agent name** — change `account-health-monitor` → `account_health_monitor` in V1 workflows
3. **Add status-change filters** to urgent-dispatch and support-escalation-manager to prevent circular re-trigger
4. **Set `visibility: POD`** on all workflows missing it (dispute-resolution, ticket-intake, account-health, appointment-reminders, daily-standup, followup-slippage)

### Short-term (High Priority)

5. **Add retry policies** to active workflows without them: dispute-resolution, ticket-intake, account-health-monitoring
6. **Add idempotency** to active workflows without it: dispute-resolution, ticket-intake, account-health-monitoring
7. **Add workflow-level timeouts** to all active workflows (15-30 min typical)
8. **Remove duplicate** `followup-slippage.json` after confirming V2 version is canonical

### Medium-term

9. **Convert V1 active workflow** (ticket-intake) to V2 graph format
10. **Delete or archive V1 draft workflows** after V2 equivalents are validated
11. **Add dead letter queue configuration** to all V2 workflows
12. **Add compensation logic** for state-altering functions (assign_technician, update_ticket_record, resolve_dispute, finalize_dispatch)

### Long-term

13. **Standardize connector naming** across grants (`gmail` vs `resqai-gmail`)
14. **Define connector resources** in `connectors/` directory (all referenced connectors currently undefined)
15. **Implement LLM event filtering** on DATASTORE triggers to reduce unnecessary workflow invocations

---

## Reconnection Map

### Applications → Workflows

| App | Connected Workflows | Notes |
|-----|-------------------|-------|
| support-queue | ticket-intake | Triggers via `ticket.created` event |
| appointment-board | appointment-assignment, appointment-reminders | Triggers via DATASTORE event + events |
| ops-dashboard | daily-standup, followup-slippage-detector | Manual/scheduled triggers |
| resolution-center | dispute-resolution | Triggers via DATASTORE event |
| crm-tracker | account-health-monitoring | Health scan panel trigger |

### Agents → Workflows (Usage Map)

| Agent | Used By Workflows | As Node Type |
|-------|-------------------|-------------|
| account_health_monitor | account-health-monitoring, account-health, followup-slippage | AGENT |
| operations-coordinator | customer-satisfaction-monitor, daily-standup, followup-slippage-detector, support-escalation-manager, ticket-intake, urgent-dispatch | AGENT |
| request-classifier | support-escalation-manager, ticket-intake, urgent-dispatch | AGENT |
| resolution-advisor | customer-satisfaction-monitor, dispute-resolution, support-escalation-manager, ticket-intake | AGENT |
| support-reply-drafter | appointment-reminders | AGENT |
| tech-suggester | appointment-assignment, urgent-dispatch | AGENT |

### Functions → Workflows (Usage Map)

| Function | Used By Workflows | Node Count |
|----------|------------------|-----------|
| flag_slipping_followups | account-health, followup-slippage-detector, followup-slippage | 3 |
| account_health_scan | account-health | 1 |
| create_followup_tasks | account-health, followup-slippage | 2 |
| update_account_health_status | account-health-monitoring | 2 |
| assign_appointment_technician | appointment-assignment | 1 |
| fetch_upcoming_appointments | appointment-reminders | 1 |
| dispatch_notifications | appointment-reminders | 1 |
| collect_resolved_tickets | customer-satisfaction-monitor | 1 |
| update_ticket_record | customer-satisfaction-monitor, support-escalation-manager, ticket-intake | 3 |
| create_operations_tasks | daily-standup | 1 |
| resolve_dispute | dispute-resolution | 2 |
| finalize_slippage_review | followup-slippage-detector | 1 |
| check_ticket_urgency | ticket-intake, urgent-dispatch | 2 |
| finalize_dispatch | urgent-dispatch | 3 |

---

## Cost of Non-Standardization

| Issue | Operational Impact | Blocker for |
|-------|-------------------|-------------|
| tech-suggester missing agent.json | Runtime failure on appointment-assignment and urgent-dispatch | Production deployment |
| No timeouts | Indefinite hangs block workflow slots | Scale beyond 10 concurrent runs |
| No DLQ | Silent data loss on persistent failures | Audit compliance |
| Circular re-trigger | Infinite execution = runaway costs | Production deployment |
| V1/V2 format split | Cannot use DECISION, edges, graph features in 5 workflows | Feature parity |

---

## Conclusion

The enterprise workflow layer has a solid architectural foundation with clear patterns for human-in-the-loop, event-driven execution, and permission-controlled orchestration. Six V2 workflows are production-ready in structure but require hardening: timeouts, dead letter queues, circular re-trigger guards, and missing permission grants. The five V1 workflows and one incomplete agent definition represent technical debt that must be resolved before the layer can operate reliably at scale.

**Immediate action required**: 3 critical blockers (tech-suggester agent.json, agent name mismatch, circular re-trigger) must be resolved before production deployment. 4 additional high-priority items (missing retry, idempotency, timeouts, duplicate removal) should be addressed within the next sprint.
