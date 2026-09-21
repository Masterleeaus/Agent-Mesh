# WORKFLOW_TIMEOUTS.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Current State

**No workflow in the project has timeout configuration.**

| Workflow | Workflow Timeout | Node Timeouts |
|----------|-----------------|---------------|
| All 12 workflows | **NONE** | **NONE** |

---

## Risk Analysis

| Risk | Impact | Workflows Affected |
|------|--------|-------------------|
| AGENT hangs (LLM timeout) | Workflow stuck indefinitely | All workflows using AGENT nodes (11 of 12) |
| FORM never submitted by human | Workflow stuck indefinitely | All workflows with FORM nodes (8 of 12) |
| External connector timeout | Function hangs | Functions using connectors (dispatch_notifications, resolve_dispute, update_ticket_record, etc.) |
| Infinite loop on DECISION fallthrough | Infinite execution | All V2 workflows with DECISION nodes (6 of 12) |
| Infinite re-trigger cycle | Infinite execution | urgent-dispatch, support-escalation-manager |

---

## Recommended Timeout Configuration

### Workflow-Level Timeouts

| Workflow | Recommended Timeout | Rationale |
|----------|-------------------|-----------|
| account-health-monitoring | 30 minutes | Nightly batch, has FORM nodes (human waiting) |
| appointment-assignment | 10 minutes | Has FORM (manager approval) |
| appointment-reminders | 10 minutes | Has FORM (human review) |
| customer-satisfaction-monitor | 20 minutes | Has FORM (manager review), multiple AGENT calls |
| daily-standup | 10 minutes | Has FORM (notify manager) |
| dispute-resolution | 15 minutes | Has multiple FORM nodes, AGENT analysis |
| followup-slippage-detector | 10 minutes | Has FORM (human review) |
| support-escalation-manager | 15 minutes | Multiple AGENT calls, FORM |
| ticket-intake | 15 minutes | Multiple AGENT calls, FORM |
| urgent-dispatch | 10 minutes | Multiple AGENT calls, FORM |

### Node-Level Timeouts

| Node Type | Recommended Timeout | Notes |
|-----------|-------------------|-------|
| AGENT | 5 minutes | LLM inference should complete within 5 min |
| FUNCTION | 30 seconds | Deterministic operations should be fast |
| FORM | 24 hours | Allow human reasonable time to respond |
| DECISION | 5 seconds | Evaluation only — should be instantaneous |

---

## Deadline Configuration Pattern (Lemma Format)

```json
{
  "timeout": {
    "workflow_timeout_seconds": 1800,
    "node_timeouts": {
      "suggest_technician": 300,
      "assign_technician": 30,
      "manager_approval": 86400
    }
  }
}
```
