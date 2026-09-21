# RESQAI V2 — Workflow Guidelines

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Workflow Architecture](#1-workflow-architecture)
2. [Naming](#2-naming)
3. [Trigger Rules](#3-trigger-rules)
4. [Workflow Structure](#4-workflow-structure)
5. [Decision Rules](#5-decision-rules)
6. [Retry Policies](#6-retry-policies)
7. [Approval Policies](#7-approval-policies)
8. [Audit Requirements](#8-audit-requirements)
9. [Failure Handling](#9-failure-handling)
10. [Testing Requirements](#10-testing-requirements)
11. [Documentation Requirements](#11-documentation-requirements)
12. [Review Checklist](#12-review-checklist)

---

## 1. Workflow Architecture

### 1.1 Tier System

| Tier | Name | Human Needed | Count | Example |
|:----:|------|:------------:|:-----:|---------|
| 0 | Autonomous | No | 5 | Auto-escalate overdue ticket |
| 1 | Entry | Yes (initiate) | 9 | Create ticket from form |
| 2 | Secondary | Yes (review) | 6 | Assign technician |
| 3 | Execution | Yes (approve) | 5 | Dispatch work order |
| 4 | Notification | No | 5 | Send SLA alert |
| 5 | Reporting | No | 3 | Generate daily report |
| 6 | Maintenance | No | 3 | Purge old records |
| 7 | System | No | 2 | Health check |

### 1.2 Workflow Flow Pattern

```
Event Trigger
    │
    ▼
┌──────────────────┐
│ Entry Condition   │  → If false → discard event
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Pre-processing    │  → Validate input, resolve dependencies
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Business Logic    │  → Decision tree, function calls
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Post-processing   │  → Emit events, trigger chained workflows
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Notification      │  → Notify relevant parties
└──────┬───────────┘
       │
       ▼
    Complete
```

---

## 2. Naming

### 2.1 Workflow Name Pattern
```
v2_{domain}_{action}_{entity}_wf
```

### 2.2 Examples
- `v2_core_create_ticket_wf` — Create a new support ticket
- `v2_core_assign_technician_wf` — Assign technician to ticket
- `v2_core_resolve_ticket_wf` — Mark ticket as resolved
- `v2_billing_generate_invoice_wf` — Generate invoice
- `v2_notification_send_alert_wf` — Send SLA breach alert
- `v2_operations_dispatch_work_order_wf` — Dispatch work order

### 2.3 Name Rules
- Suffix with `_wf`
- Use active verbs: `create`, `assign`, `resolve`, `generate`, `send`, `dispatch`
- Avoid: `process`, `handle`, `manage`, `do`, `run`

---

## 3. Trigger Rules

### 3.1 Trigger Types

| Trigger | Description | Example |
|---------|-------------|---------|
| Event | Domain event emitted by function | `v2.core.ticket.created` |
| Schedule | Cron-based time trigger | Every hour, check overdue tickets |
| Webhook | External HTTP call | Slack command creates ticket |
| Manual | User-initiated via app | Click "Create Ticket" |
| Workflow | Chained from another workflow | After dispatch, send notification |

### 3.2 Event Trigger Configuration

```python
# Workflow trigger definition
WORKFLOW = {
    "name": "v2_core_create_ticket_wf",
    "triggers": [
        {
            "type": "event",
            "event": "v2.core.ticket.created",
            "filter": {
                "source": "v2_core_wri_ticket",
            },
            "condition": "event.data.status == 'open'",
        },
    ],
}
```

### 3.3 Schedule Trigger Configuration

```python
{
    "type": "schedule",
    "cron": "0 */1 * * *",  # Every hour
    "timezone": "UTC",
    "description": "Check for overdue tickets",
}
```

### 3.4 Trigger Rules
- Every workflow has exactly one trigger (event, schedule, webhook, or manual)
- Event triggers include optional filter for event source
- Schedule triggers use cron expressions
- Manual triggers include required input schema
- Chained workflows start immediately after parent completes

---

## 4. Workflow Structure

### 4.1 Standard Workflow Template

```python
"""
v2_{domain}_{action}_{entity}_wf

Description: What this workflow does.

Trigger: {trigger type}: {trigger source}
Tier: {tier}

Steps:
  1. {step 1 description}
  2. {step 2 description}
  3. ...

Events emitted:
  - v2.{domain}.{entity}.{action}.{outcome}

Dependencies:
  - v2_{domain}_det_{entity}
  - v2_{domain}_wri_{entity}
"""

import logging
from datetime import datetime

logger = logging.getLogger(__name__)

WORKFLOW_CONFIG = {
    "name": "v2_core_create_ticket_wf",
    "tier": 1,
    "version": "1.0.0",
    "timeout": 300,  # 5 minutes
    "retry": {
        "max_attempts": 3,
        "backoff": "exponential",
        "initial_delay": 5,
    },
}


def handler(event: dict, context: dict) -> dict:
    """Workflow entry point.

    Args:
        event: The triggering event payload.
        context: Execution context with correlation_id, org_id, user_id.

    Returns:
        Workflow result dict.
    """
    correlation_id = context["correlation_id"]
    org_id = context["org_id"]

    logger.info("Workflow started", extra={
        "correlation_id": correlation_id,
        "workflow": WORKFLOW_CONFIG["name"],
    })

    try:
        # Step 1: Validate event
        validated = step_validate(event, org_id)

        # Step 2: Resolve dependencies
        dependencies = step_resolve_dependencies(validated, org_id)

        # Step 3: Execute business logic
        result = step_execute(validated, dependencies, org_id)

        # Step 4: Post-processing
        step_post_process(result, correlation_id)

        # Step 5: Notification
        step_notify(result, org_id)

        logger.info("Workflow completed", extra={
            "correlation_id": correlation_id,
            "workflow": WORKFLOW_CONFIG["name"],
        })

        return {"success": True, "data": result}

    except Exception as e:
        logger.error("Workflow failed", extra={
            "correlation_id": correlation_id,
            "error": str(e),
        })
        return {"success": False, "error": str(e)}


def step_validate(event: dict, org_id: str) -> dict:
    """Validate event payload meets requirements."""
    pass


def step_resolve_dependencies(validated: dict, org_id: str) -> dict:
    """Resolve entity references, load related data."""
    pass


def step_execute(validated: dict, dependencies: dict, org_id: str) -> dict:
    """Execute core business logic."""
    pass


def step_post_process(result: dict, correlation_id: str) -> None:
    """Emit events, trigger chained workflows."""
    pass


def step_notify(result: dict, org_id: str) -> None:
    """Send notifications to relevant parties."""
    pass
```

### 4.2 Step Structure Rules
- Each step is a named function
- Steps are ordered and sequential
- Each step has a single responsibility
- Step failures are caught and logged individually
- Steps can be skipped conditionally

---

## 5. Decision Rules

### 5.1 Decision Patterns

```python
# Simple condition
if status == "urgent":
    step_escalate()
else:
    step_normal()

# Multi-branch
match priority:
    case "critical":
        step_critical_path()
    case "high":
        step_high_path()
    case _:
        step_normal_path()

# State machine
match current_state:
    case "pending":
        step_validate_and_start()
    case "in_progress":
        step_update_progress()
    case "waiting_on_customer":
        step_check_customer_response()
    case "resolved":
        step_confirm_resolution()
```

### 5.2 Decision Rules
- Decisions are explicit (if/else, match/case), never implicit
- Every branch has a defined outcome
- Default branch handles unexpected values
- Complex decisions use state machine pattern
- Decisions are logged with path taken and rationale

---

## 6. Retry Policies

### 6.1 Retry Configuration

```python
RETRY_POLICY = {
    "max_attempts": 3,
    "backoff": "exponential",       # or "fixed", "linear"
    "initial_delay": 5,             # seconds
    "max_delay": 300,               # 5 minutes
    "jitter": True,                 # Add random jitter
    "retryable_errors": [
        "TIMEOUT",
        "RATE_LIMITED",
        "DEPENDENCY_FAILURE",
        "INTERNAL_ERROR",
    ],
    "non_retryable_errors": [
        "VALIDATION_ERROR",
        "NOT_FOUND",
        "FORBIDDEN",
    ],
}
```

### 6.2 Retry Rules by Tier

| Tier | Max Retries | Backoff | Max Total Time |
|:----:|:-----------:|:-------:|:--------------:|
| 0 | 3 | Exponential | 5 min |
| 1 | 3 | Exponential | 10 min |
| 2 | 2 | Exponential | 5 min |
| 3 | 1 | Immediate | 1 min |
| 4 | 3 | Exponential | 10 min |
| 5 | 2 | Fixed (60s) | 2 min |
| 6 | 2 | Fixed (60s) | 2 min |
| 7 | 5 | Exponential | 30 min |

---

## 7. Approval Policies

### 7.1 Approval Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Single approval | One person approves | Manager approves overtime |
| Multi-level approval | Sequential approvals | Tech → Manager → Director for write-offs |
| Any approval | Any of N approvers | Any dispatcher can approve technician swap |
| Consensus approval | All must approve | Change advisory board |

### 7.2 Approval Configuration

```python
APPROVAL_CONFIG = {
    "required": True,
    "pattern": "single",       # single, multi_level, any, consensus
    "approvers": {
        "role": "v2_dispatch",  # Role that can approve
        "min_approvers": 1,
    },
    "timeout": 3600,           # 1 hour to approve or auto-reject
    "escalation": {
        "after_minutes": 30,
        "notify": "v2_admin",
    },
}
```

### 7.3 Approval Rules
- Approval request includes full context for decision
- Approver sees: who requested, what action, why, impact analysis
- Timeout auto-rejects with notification to requester
- Approval decisions are logged with timestamp and approver identity
- Users cannot approve their own requests

---

## 8. Audit Requirements

### 8.1 What Gets Audited
- Workflow start and end timestamps
- Every step execution with input/output
- Every decision taken and rationale
- Every function call with duration
- Every retry attempt
- Every approval/denial decision
- Every error and failure

### 8.2 Audit Log Schema

```sql
CREATE TABLE v2_settings_workflow_audit_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name VARCHAR(200) NOT NULL,
    correlation_id UUID NOT NULL,
    step_name VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,  -- 'workflow_start', 'step_start', 'step_complete', 'decision', 'error'
    input_data JSONB,
    output_data JSONB,
    duration_ms INTEGER,
    status VARCHAR(20) NOT NULL,  -- 'success', 'failure', 'skipped'
    error_message TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.3 Audit Rules
- Audit logs are immutable (append-only)
- Audit logs retained for 1 year minimum
- Audit logs are accessible to admin role only
- Audit exports available for compliance reporting

---

## 9. Failure Handling

### 9.1 Failure Types

| Type | Description | Default Action |
|------|-------------|---------------|
| Transient | Temporary (timeout, rate limit) | Retry per policy |
| Validation | Invalid input data | Reject workflow |
| Business rule | Logic constraint violation | Reject with reason |
| Authorization | User lacks permission | Reject with escalation |
| Data not found | Missing reference data | Skip dependent steps |
| System error | Unexpected failure | Dead letter queue |

### 9.2 Dead Letter Queue

When a workflow exhausts all retries:
1. Move to dead letter queue (DLQ)
2. Notify admin with full failure context
3. Store failed event for manual inspection
4. Admin can replay from DLQ after fixing root cause

### 9.3 Compensating Actions

For workflows that have side effects before failure:
```python
def compensate(workflow_id: str, context: dict) -> None:
    """Rollback all completed steps in reverse order."""
    steps = get_completed_steps(workflow_id)
    for step in reversed(steps):
        if step.get("compensation"):
            execute_compensation(step["compensation"], context)
```

---

## 10. Testing Requirements

### 10.1 Required Tests Per Workflow
| Test Type | Count | Description |
|-----------|:-----:|-------------|
| Happy path | 1 | Normal successful execution |
| Error path | 1 | Expected error handled gracefully |
| Edge case | 1 | Boundary condition |
| Rollback | 1 | Compensating actions succeed |
| Timeout | 1 | Workflow handles timeout correctly |

### 10.2 Test Example

```python
def test_create_ticket_happy_path():
    """Workflow creates ticket, emits event, notifies customer."""
    event = create_mock_event("v2.core.ticket.created", {
        "ticket_id": str(uuid4()),
        "title": "Test ticket",
        "customer_id": str(uuid4()),
    })
    result = execute_workflow("v2_core_create_ticket_wf", event)
    assert result["success"] is True
    assert result["data"]["status"] == "open"
    assert event_emitted("v2.core.ticket.created")


def test_create_ticket_validation_error():
    """Workflow rejects invalid input."""
    event = create_mock_event("v2.core.ticket.created", {
        "ticket_id": "invalid",
    })
    result = execute_workflow("v2_core_create_ticket_wf", event)
    assert result["success"] is False
    assert "VALIDATION_ERROR" in result["error"]
```

---

## 11. Documentation Requirements

Every workflow must have a `README.md` containing:
1. **Purpose** — One paragraph describing what this workflow does
2. **Trigger** — What event/schedule/manual action starts this workflow
3. **Steps** — Numbered list of steps with descriptions
4. **Decision Tree** — Mermaid diagram of branching logic
5. **Dependencies** — Tables, functions, agents, other workflows
6. **Events Emitted** — Events this workflow produces
7. **Retry Policy** — Max retries, backoff strategy
8. **Error Handling** — What happens on failure, compensating actions
9. **Audit** — What gets logged

---

## 12. Review Checklist

Before merging a workflow PR, verify:
- [ ] Naming follows v2 standards
- [ ] Trigger is correctly configured
- [ ] All steps have single responsibility
- [ ] Error handling covers all failure types
- [ ] Retry policy is appropriate for tier
- [ ] Approval policy is configured (if needed)
- [ ] Audit logging is implemented
- [ ] Compensating actions defined
- [ ] Documentation complete
- [ ] Tests pass (5+ scenarios)
- [ ] No hardcoded values (use config)
- [ ] Dependencies documented

---

> **End of WORKFLOW_GUIDELINES.md**
