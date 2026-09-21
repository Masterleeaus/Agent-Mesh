# WORKFLOW_FAILURE_HANDLING.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Current State

| Workflow | Retry Policy | Dead Letter Queue | Error Escalation | Rollback Strategy | Compensation |
|----------|-------------|-------------------|-----------------|-------------------|-------------|
| account-health-monitoring | None | None | None | None | None |
| account-health (draft) | None | None | None | None | None |
| appointment-assignment | Workflow-level + node-level | None | None | None | None |
| appointment-reminders (draft) | None | None | HUMAN_REVIEW (blocked) | None | None |
| customer-satisfaction-monitor | Workflow-level + node-level | None | None | None | None |
| daily-standup (draft) | None | None | NOTIFY_MANAGER (crisis) | None | None |
| dispute-resolution | None | None | HUMAN_ESCALATION (3 paths) | None | None |
| followup-slippage-detector | Workflow-level + node-level | None | None | None | None |
| followup-slippage (draft) | None | None | NOTIFY_MANAGER (crisis) | None | None |
| support-escalation-manager | Workflow-level | None | None | None | None |
| ticket-intake | None | None | HUMAN_ESCALATION (3 paths) | None | None |
| urgent-dispatch | Workflow-level | None | HUMAN_ESCALATION (1 path) | None | None |

---

## Failure Mode Analysis

### Node-Level Failures

| Failure Mode | V2 Workflows | V1 Workflows |
|-------------|-------------|-------------|
| AGENT failure | retry_policy if configured, else 500 | No retry — hard failure |
| FUNCTION failure | retry_policy if configured, else 500 | No retry — hard failure |
| DECISION rule not matched | Falls through to default edge | N/A (no edges in V1) |
| FORM timeout | Workflow waits indefinitely | Workflow waits indefinitely |
| Data validation error | Caught by function | Caught by function |

### Workflow-Level Failures

| Failure Mode | Impact | Current Handling |
|-------------|--------|-----------------|
| Agent runtime unavailable | Node fails → workflow may halt | retry_policy on some nodes |
| Datastore unavailable | Function fails → workflow may halt | retry_policy on some nodes |
| Connector unavailable | Function fails → workflow may halt | retry_policy on some nodes |
| Circular re-trigger | Infinite loop | **UNHANDLED** |
| Timeout exceeded | Workflow hangs | **UNHANDLED** — no timeouts configured |

---

## Error Escalation Paths

### dispute-resolution
```
analyze_dispute → route_analysis
  ├── safety_escalation    → notify_ops_manager (FORM) → end
  ├── legal_escalation     → notify_legal (FORM) → end
  └── insufficient_evidence → human_escalation (FORM) → end
     blocked
```

### ticket-intake
```
classify-ticket
  └── needs_human_review → human-escalation → end
  └── unparseable        → human-escalation → end

resolve-ticket
  └── insufficient_evidence → human-escalation → end
  └── safety_escalation    → human-escalation → end
  └── legal_escalation     → human-escalation → end
```

### urgent-dispatch
```
classify_urgent → route_classification
  └── unparseable        → human_escalation → finalize_escalation → end
  └── needs_human_review → human_escalation → finalize_escalation → end
```

### daily-standup
```
coordinate-operations
  └── crisis             → notify-manager (human_decision) → end
  └── unavailable_data   → notify-manager → end
```

---

## Gaps Analysis

| Gap | Severity | Affected Workflows | Recommendation |
|-----|----------|-------------------|---------------|
| No dead letter queue | HIGH | All | Configure DLQ for all V2 workflows after N retries |
| No workflow-level timeouts | HIGH | All | Add timeout_minutes to all workflow definitions |
| No compensation/rollback | HIGH | All | Implement compensation functions for state-altering steps (assign_technician, update_ticket_record, resolve_dispute) |
| No explicit failure notification | MEDIUM | All | Add FORM or connector step on failure paths |
| V1 workflows have no retry at all | HIGH | 5 V1 drafts | Convert to V2 format to get retry support |
| Circular re-trigger guard | CRITICAL | urgent-dispatch, support-escalation-manager | Add status filter to ignore self-triggered updates |

---

## Recommended Failure Handling Pattern

```
Every FUNCTION/AGENT node:
  ┌─────────────────────────────┐
  │ Execute                     │
  │   ├── Success → next node   │
  │   └── Failure               │
  │       ├── Retry (up to N)   │
  │       └── Max retries hit   │
  │           ├── DLQ entry     │
  │           └── Notify admin  │
  └─────────────────────────────┘
```
