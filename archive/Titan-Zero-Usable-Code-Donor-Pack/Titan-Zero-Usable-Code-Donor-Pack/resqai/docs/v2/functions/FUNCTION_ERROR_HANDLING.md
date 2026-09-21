# Function Error Handling — ResQAI V2

> Complete error handling strategy for the function layer.

---

## 1. Error Taxonomy

### Error Types

| Error Code | HTTP Analog | Description | Retryable? |
|------------|-------------|-------------|------------|
| `VALIDATION_ERROR` | 400 | Input validation failures (missing fields, bad format, invalid enums) | No |
| `NOT_FOUND` | 404 | Entity not found in data store | No |
| `CONFLICT` | 409 | Duplicate unique field or state conflict | No |
| `ALREADY_CLOSED` | 409 | Entity is already in terminal state | No |
| `AUTH_FAILED` | 401 | Authentication failure (bad credentials) | No |
| `FORBIDDEN` | 403 | Authorization failure (role/permission check) | No* |
| `TIMEOUT` | 504 | Operation timed out | Yes |
| `RATE_LIMITED` | 429 | Too many requests | Yes (with backoff) |
| `CONNECTOR_ERROR` | 502 | External provider failure (Gmail, Twilio, Discord) | Yes |
| `INTERNAL_ERROR` | 500 | Unexpected error | Yes |
| `RETRYABLE_ERROR` | N/A | Transient failure (network, DB contention) | Yes |

*\* FORBIDDEN is not yet implemented in the function layer — all functions assume the caller already has authorization.*

### Current Implementation Pattern

Rather than HTTP codes, functions use a `status` string field:
- `"success"` — Operation completed
- `"error"` — Generic failure (validation, conflict, or internal)
- `"not_found"` — Entity not found
- `"already_closed"` — Terminal state conflict (close_ticket)
- `"conflict"` — Duplicate unique field (create_inventory_item)
- `"sent"` / `"failed"` — Notification dispatch status (dispatch_notification_v2)
- `"completed"` — Workflow completion (update_account_health_status)

---

## 2. Error Response Contract

### Standard Error JSON Schema

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "description": "Error classification: error, not_found, conflict, already_closed"
    },
    "error": {
      "type": "string",
      "description": "Human-readable error description"
    },
    "<entity_id_field>": {
      "type": "string",
      "description": "Echoed entity identifier for workflow tracking (varies by function)"
    }
  },
  "required": ["status", "error"]
}
```

### Entity ID Echo Pattern

Functions that operate on a specific entity ALWAYS echo the identifying field(s) in their output, even on error:

| Function | Echoed ID Field(s) |
|----------|-------------------|
| update_user | user_id |
| assign_user_role | user_id, role_id |
| update_ticket_v2 | ticket_id |
| assign_ticket | ticket_id, assigned_to |
| escalate_ticket | ticket_id |
| close_ticket | ticket_id |
| update_work_order | work_order_id |
| update_inventory_item | item_id |
| update_technician | technician_id |
| update_technician_skills | technician_id, skills[] |
| manage_permission | role_id, resource, permission_action |
| complete_followup | followup_id |
| resolve_dispute | dispute_id |
| resolve_dispute_v2 | dispute_id, resolution_type |
| update_account_health | account_id, health_before, health_after |
| cancel_appointment | appointment_id |
| complete_appointment | appointment_id |
| accept_appointment | appointment_id, technician_id |
| assign_appointment_technician | appointment_id, technician_name, audit_logged |
| update_user | user_id |
| update_customer | customer_id |
| finalize_dispatch | ticket_id, audit_logged |
| execute_report | report_id |

---

## 3. Per-Function Error Catalog

### Authentication & Security

#### authenticate_user
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Email not found in users table | Check email or register | No |
| AUTH_FAILED | Auth provider mismatch | Use correct provider | No |
| AUTH_FAILED | Auth provider ID mismatch | Use correct provider ID | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### validate_session
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Session ID not in data store | Re-authenticate | No |
| VALIDATION_ERROR | Session invalidated | Re-authenticate | No |
| VALIDATION_ERROR | Session expired | Re-authenticate | No |
| INTERNAL_ERROR | Parse failure on expiry | Retry | Yes |

#### create_user
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| VALIDATION_ERROR | Invalid email format | Provide valid email | No |
| CONFLICT | Email already exists | Use different email | No |
| NOT_FOUND | Role ID invalid (implicit) | Check role exists | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### update_user
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | User ID not found | Provide valid user_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### assign_user_role
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | User not found | Provide valid user_id | No |
| NOT_FOUND | Role not found | Provide valid role_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

### Administration

#### create_role
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| CONFLICT | Role name already exists | Use unique name | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### list_users, list_permissions
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### manage_permission
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### record_audit
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### query_audit_log
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| INTERNAL_ERROR | Data store failure | Retry | Yes |

### Support / Ticket

#### create_ticket
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| VALIDATION_ERROR | Missing required fields | Provide all required fields | No |
| INTERNAL_ERROR | Data store/event failure | Retry | Yes |

#### update_ticket_v2
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Ticket ID not found | Provide valid ticket_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### assign_ticket
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Ticket not found | Provide valid ticket_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### escalate_ticket
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Ticket not found | Provide valid ticket_id | No |
| CONNECTOR_ERROR | Discord notification fails | Silently ignored | Yes (connector) |

#### close_ticket
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Ticket not found | Provide valid ticket_id | No |
| ALREADY_CLOSED | Ticket already closed | No action needed | No |
| CONNECTOR_ERROR | Gmail notification fails | Silently ignored | Yes (connector) |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### update_ticket_record
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Ticket not found | Provide valid ticket_id | No |
| CONNECTOR_ERROR | Gmail send fails | Logged to operations_log | Yes (connector) |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### collect_resolved_tickets
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| CONNECTOR_ERROR | Discord notification fails | Silently ignored | Yes |
| INTERNAL_ERROR | Data store failure | Returns empty list | Yes |

#### finalize_dispatch
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Ticket not found | Provide valid ticket_id | No |
| CONNECTOR_ERROR | Discord notification fails | Silently ignored | Yes |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

### Appointment

#### create_appointment
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Customer not found | Provide valid customer_id | No |
| INTERNAL_ERROR | Data store failure | Exception caught, returns error | Yes |

#### get_appointment
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Appointment not found | Provide valid appointment_id | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

#### list_appointments
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| INTERNAL_ERROR | Any exception | **Graceful degradation** — returns total=0, appointments=[] | Yes |

#### assign_appointment_technician
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Appointment not found | Provide valid appointment_id | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

#### accept_appointment
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Appointment not found | Provide valid appointment_id | No |
| VALIDATION_ERROR | No technician assigned | Assign technician first | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

#### complete_appointment
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Appointment not found | Provide valid appointment_id | No |
| ALREADY_CLOSED | Already completed | No action needed | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

#### cancel_appointment
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Appointment not found | Provide valid appointment_id | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

### Technician

#### create_technician
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| VALIDATION_ERROR | Name is empty | Provide name | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

#### update_technician, update_technician_skills
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Technician not found | Provide valid technician_id | No |
| INTERNAL_ERROR | Exception in handler | Exception caught, returns error | Yes |

#### list_technicians
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| INTERNAL_ERROR | Any exception | **Graceful degradation** — returns total=0, technicians=[] | Yes |

### CRM

#### create_customer
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| VALIDATION_ERROR | Name is empty | Provide name | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### update_customer, get_customer
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Customer not found | Provide valid customer_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### create_followup
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Account not found | Provide valid account_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### complete_followup
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Followup not found | Provide valid followup_id | No |
| ALREADY_CLOSED | Already completed | No action needed | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### update_account_health
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Account not found | Provide valid account_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### resolve_dispute
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Dispute not found | Provide valid dispute_id | No |
| VALIDATION_ERROR | Unknown action | Use "approve" or "reject" | No |
| CONNECTOR_ERROR | Discord notification | Silently ignored | Yes |

#### resolve_dispute_v2
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Dispute not found | Provide valid dispute_id | No |
| ALREADY_CLOSED | Already closed | No action needed | No |
| CONNECTOR_ERROR | Discord/Gmail notification | Silently ignored | Yes |

### Work Order

#### create_work_order
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Appointment not found | Provide valid appointment_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### update_work_order, get_work_order
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Work order not found | Provide valid work_order_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

### Notification

#### dispatch_notifications
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| VALIDATION_ERROR | Channel not allowed | Skipped (partial failure tracked) | No |
| CONNECTOR_ERROR | Gmail/Twilio failure | Skipped (partial failure tracked) | Yes |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### dispatch_notification_v2
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| CONNECTOR_ERROR | Gmail/Twilio failure | Returns status="failed" with error | Yes |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### send_bulk_notification
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| CONNECTOR_ERROR | Gmail/Twilio failure | Per-recipient failure tracked in results | Yes |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### track_notification
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Notification not found | Provide valid notification_id or correlation_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

### Analytics / Reporting

#### execute_report
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Report not found | Provide valid report_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### schedule_report
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Report not found | Provide valid report_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

### Inventory

#### create_inventory_item
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| CONFLICT | SKU already exists | Use unique SKU | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

#### update_inventory_item
| Error Code | Condition | Recovery Action | Retry |
|------------|-----------|-----------------|-------|
| NOT_FOUND | Item not found | Provide valid item_id | No |
| INTERNAL_ERROR | Data store failure | Retry | Yes |

---

## 4. Error Propagation

### Function → Workflow

Functions return structured output objects. Workflows (Python scripts or workflow engines) check the `status` field:

```python
result = await create_ticket(ctx, input_data)
if result.status == "error":
    # Handle error — log, retry, or escalate
    logger.error(f"Ticket creation failed: {result.error}")
    return
```

### Function → Agent

Agents (LLM-based) receive function output as structured data. They inspect the `status` and `error` fields to determine next actions. The pattern:

1. Agent calls function
2. Function returns `{status: "success"|"error", error?: "...", ...}`
3. Agent reads status:
   - On `"success"`: Continue workflow
   - On `"error"` / `"not_found"`: Log failure, request human intervention if needed
   - On `"conflict"`: Adjust input and retry

### Function → App (Surface)

Apps receive function output via the Lemma SDK. The UI layer should:
1. Check `status` field for success indicators
2. Display `error` message to user on failure
3. Handle `"not_found"` by showing "not found" messages
4. Handle `"conflict"` by showing "already exists" messages
5. Do NOT display raw error messages to end users — translate them

### Error Logging

All functions write errors to `operations_log` table via:
```python
pod.records.create("operations_log", {
    "action": "<function_name>",
    "result": f"error: <description>",
    "actor": "<caller>"
})
```

---

## 5. Graceful Degradation

### Functions with Graceful Degradation

| Function | Degradation Behavior |
|----------|---------------------|
| list_appointments | On exception, returns `{total: 0, appointments: []}` |
| list_technicians | On exception, returns `{total: 0, technicians: []}` |
| dispatch_notifications | Returns partial results: some dispatched, some failures |
| send_bulk_notification | Returns per-recipient results, some may be "failed" |
| collect_resolved_tickets | On Discord connector failure, silently ignores and returns data |
| escalate_ticket | On Discord connector failure, silently ignores |
| close_ticket | On Gmail connector failure, silently ignores |
| update_ticket_record | On Gmail connector failure, logs to operations_log |
| resolve_dispute | On Discord connector failure, silently ignores |
| resolve_dispute_v2 | On Discord/Gmail connector failure, silently ignores |
| finalize_dispatch | On Discord connector failure, silently ignores |
| finalize_slippage_review | On Discord connector failure, silently ignores |
| update_account_health_status | On Discord connector failure, silently ignores |

### Degradation Pattern

Functions that call external connectors (Gmail, Twilio, Discord) wrap calls in try/except blocks:

```python
try:
    pod.connectors.execute("resqai-gmail", "gmail_send_email", {...})
except Exception:
    pass  # Degrade gracefully — log not written for connector failures
```

This ensures connector failures NEVER block the primary business logic.

---

## 6. Dead Letter Queue (DLQ)

### Current State

ResQAI V2 does NOT have an explicit Dead Letter Queue mechanism at the function layer. All errors are:

1. **Returned inline** in function output
2. **Logged** to `operations_log` table
3. **Silently ignored** for connector failures (Gmail, Twilio, Discord)

### Candidate Functions for DLQ

These functions would benefit from a DLQ on persistent failure:

| Function | Failure Pattern | Recommended DLQ Action |
|----------|----------------|----------------------|
| dispatch_notifications | Connector failures | Re-queue failed reminders |
| send_bulk_notification | Connector failures | Re-queue failed notifications |
| dispatch_notification_v2 | Connector failures | Re-queue failed notification |
| close_ticket | Gmail send failure | Re-queue notification |
| escalate_ticket | Discord send failure | Re-queue alert |
| create_ticket | Event creation failure | Re-queue event |
| update_ticket_v2 | Event creation failure | Re-queue event |

### Manual DLQ via operations_log

Currently, persistent failures are tracked manually in `operations_log`:
```python
pod.records.create("operations_log", {
    "action": "email notification FAILED",
    "result": f"ticket_id={id}, error={str(e)}",
    "actor": "workflow:ticket-intake",
})
```

---

## 7. Alerting Thresholds

### Recommended Alerting Thresholds

| Metric | Threshold | Severity | Channel | Action |
|--------|-----------|----------|---------|--------|
| NOT_FOUND errors per function | > 5% of calls in 5 min | WARNING | Operations log | Review |
| CONFLICT errors | > 10% of create calls | WARNING | Alert | Check for duplicate data |
| CONNECTOR_ERROR (Gmail) | > 3 consecutive failures | CRITICAL | Discord alert | Check Gmail API status |
| CONNECTOR_ERROR (Twilio) | > 3 consecutive failures | CRITICAL | Discord alert | Check Twilio API status |
| CONNECTOR_ERROR (Discord) | > 3 consecutive failures | WARNING | Operations log | Check Discord webhook |
| INTERNAL_ERROR | Any occurrence | CRITICAL | Discord alert | Investigate immediately |
| Function timeout | > 30s per call | WARNING | Operations log | Optimize query |
| Auth failure rate | > 10% of authenticate calls | WARNING | Alert | Check for brute force |

### Current Alerting

The platform has limited automated alerting:
- **Discord notifications** are sent for:
  - Ticket escalations (`escalate_ticket` — channel: `support-alerts`)
  - Dispute resolutions (`resolve_dispute` — channel: `support-escalations`)
  - Critical account health (`update_account_health_status` — channel: `support-alerts`)
  - Urgent dispatches (`finalize_dispatch` — channel: `support-alerts`)
  - Follow-up slippage (`finalize_slippage_review` — channel: `support-alerts`)
  - Resolved ticket reviews (`collect_resolved_tickets` — channel: `support-reviews`)
- No PagerDuty integration exists currently
- No automated alerting based on error rates exists currently

### Recommended Alerting Implementation

```yaml
# Suggested alerting configuration
alerts:
  error_rate:
    - function: "*"
      error_code: INTERNAL_ERROR
      threshold: 1
      window: 5m
      channel: discord:support-alerts
  connector_health:
    - connector: resqai-gmail
      failure_threshold: 3
      window: 5m
      channel: discord:support-alerts
  rate_limiting:
    - function: authenticate_user
      threshold: 20_failures_per_minute
      action: temporary_block
```

---

## Appendix: Error Handling Anti-Patterns to Avoid

1. **Connector errors silently swallowed** — Currently all connector failures use `except: pass`. This makes debugging connector issues difficult. Move to at minimum logging the error.

2. **No timeout handling** — Functions do not implement timeout guards. Long-running data store queries could hang indefinitely.

3. **No retry logic** — No exponential backoff or retry decorators are used. Callers (workflows/agents) must implement their own retry.

4. **Inconsistent error status codes** — Some functions use `"error"`, others use `"not_found"`, `"conflict"`, or `"already_closed"`. Standardization would improve caller handling.

5. **No correlation IDs in errors** — Error responses lack correlation IDs for tracing. The `record_audit` function accepts `correlation_id` but most functions don't propagate it.

6. **No request validation at schema level** — Input schemas use `{"type":"object","properties":{},"additionalProperties":true}` in JSON Schema files, meaning no server-side schema enforcement. Pydantic models in Python code provide the actual validation, which only applies when called via Python SDK.
