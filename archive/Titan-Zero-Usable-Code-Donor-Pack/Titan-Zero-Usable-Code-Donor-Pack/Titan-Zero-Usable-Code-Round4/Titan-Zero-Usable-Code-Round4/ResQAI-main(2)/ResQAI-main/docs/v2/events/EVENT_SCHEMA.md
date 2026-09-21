# RESQAI V2 — Event Schema Definitions

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Event Envelope Schema](#1-event-envelope-schema)
2. [Common Payload Fields](#2-common-payload-fields)
3. [Entity Event Schemas](#3-entity-event-schemas)
4. [System Event Schemas](#4-system-event-schemas)
5. [Business Event Schemas](#5-business-event-schemas)
6. [Audit Event Schemas](#6-audit-event-schemas)
7. [Validation Rules](#7-validation-rules)

---

## 1. Event Envelope Schema

Every event follows this standard envelope when published to the event bus:

```json
{
  "event_id": "uuid",
  "event_name": "string",
  "event_version": "string",
  "producer": {
    "app": "string",
    "entity_type": "string",
    "entity_id": "uuid",
    "instance_id": "uuid"
  },
  "correlation_id": "string",
  "causation_id": "uuid",
  "idempotency_key": "string",
  "payload": {},
  "metadata": {
    "produced_at": "datetime",
    "producer_timestamp": "datetime",
    "schema_version": "string",
    "content_type": "string",
    "trace_id": "string"
  },
  "security": {
    "producer_identity": "string",
    "auth_context": "string"
  }
}
```

### Envelope Field Validation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_id` | UUID | Yes | Globally unique event identifier |
| `event_name` | String | Yes | Fully qualified event name (dot-notation) |
| `event_version` | String | Yes | Semver version of event schema |
| `producer.app` | String | Yes | Producing application name |
| `producer.entity_type` | String | No | Type of producing entity |
| `producer.entity_id` | UUID | No | ID of producing entity instance |
| `producer.instance_id` | UUID | No | Runtime instance ID |
| `correlation_id` | String | Yes | Chains related events across workflows |
| `causation_id` | UUID | No | ID of event that caused this event |
| `idempotency_key` | String | Yes | Key for deduplication |
| `payload` | Object | Yes | Domain-specific event data |
| `metadata.produced_at` | DateTime | Yes | When event was produced |
| `metadata.producer_timestamp` | DateTime | No | Original entity timestamp |
| `metadata.schema_version` | String | Yes | Schema version identifier |
| `metadata.content_type` | String | No | MIME type of payload |
| `metadata.trace_id` | String | No | Distributed tracing ID |
| `security.producer_identity` | String | Yes | Identity of event producer |
| `security.auth_context` | String | No | Authorization context |

---

## 2. Common Payload Fields

### 2.1 Entity Created Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "created_at": "datetime",
  "created_by": "string",
  "initial_state": {}
}
```

### 2.2 Entity Updated Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "updated_at": "datetime",
  "updated_by": "string",
  "changed_fields": ["string"],
  "previous_values": {},
  "new_values": {}
}
```

### 2.3 Entity Deleted Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "deleted_at": "datetime",
  "deleted_by": "string",
  "final_state": {}
}
```

### 2.4 Entity Status Changed Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "previous_status": "string",
  "new_status": "string",
  "changed_at": "datetime",
  "changed_by": "string",
  "reason": "string"
}
```

### 2.5 Entity Assigned Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "assignee_id": "uuid",
  "assignee_type": "string",
  "assigned_by": "string",
  "assigned_at": "datetime",
  "reason": "string"
}
```

### 2.6 Entity Completed Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "completed_at": "datetime",
  "completed_by": "uuid",
  "outcome": "string",
  "notes": "string"
}
```

### 2.7 Entity Escalated Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "escalation_level": "integer",
  "reason": "string",
  "previous_assignee": "uuid",
  "new_assignee": "uuid",
  "escalated_at": "datetime",
  "escalated_by": "uuid"
}
```

### 2.8 Entity Resolved Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "resolution": "string",
  "resolved_at": "datetime",
  "resolved_by": "uuid",
  "satisfaction_score": "integer"
}
```

### 2.9 Entity Cancelled Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "cancelled_at": "datetime",
  "cancelled_by": "uuid",
  "reason": "string"
}
```

### 2.10 Entity Archived Payload

```json
{
  "entity_id": "uuid",
  "entity_type": "string",
  "archived_at": "datetime",
  "archived_by": "uuid",
  "reason": "string",
  "retention_period": "string"
}
```

---

## 3. Entity Event Schemas

### 3.1 tickets_v2 Event Schemas

#### ticket.created

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TicketCreatedEvent",
  "type": "object",
  "required": ["ticket_id", "customer_id", "subject", "request_type", "urgency", "status", "channel", "created_at", "created_by"],
  "properties": {
    "ticket_id": {"type": "string", "format": "uuid"},
    "customer_id": {"type": "string", "format": "uuid"},
    "customer_name": {"type": "string"},
    "subject": {"type": "string", "maxLength": 500},
    "description": {"type": "string"},
    "request_type": {"type": "string", "enum": ["service", "inquiry", "complaint", "billing", "other"]},
    "urgency": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
    "status": {"type": "string", "enum": ["new", "open", "in_progress", "waiting", "resolved", "closed"]},
    "channel": {"type": "string", "enum": ["email", "phone", "chat", "portal", "social"]},
    "created_at": {"type": "string", "format": "date-time"},
    "created_by": {"type": "string"},
    "source": {"type": "string"}
  }
}
```

#### ticket.status.changed

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TicketStatusChangedEvent",
  "type": "object",
  "required": ["ticket_id", "previous_status", "new_status", "changed_at", "changed_by"],
  "properties": {
    "ticket_id": {"type": "string", "format": "uuid"},
    "previous_status": {"type": "string"},
    "new_status": {"type": "string"},
    "reason": {"type": "string"},
    "changed_at": {"type": "string", "format": "date-time"},
    "changed_by": {"type": "string"}
  }
}
```

### 3.2 appointments_v2 Event Schemas

#### appointment.created

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AppointmentCreatedEvent",
  "type": "object",
  "required": ["appointment_id", "customer_id", "service_type", "date", "time_slot", "status"],
  "properties": {
    "appointment_id": {"type": "string", "format": "uuid"},
    "customer_id": {"type": "string", "format": "uuid"},
    "customer_name": {"type": "string"},
    "service_type": {"type": "string"},
    "date": {"type": "string", "format": "date"},
    "time_slot": {"type": "string"},
    "technician_id": {"type": "string", "format": "uuid"},
    "status": {"type": "string", "enum": ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]},
    "created_at": {"type": "string", "format": "date-time"}
  }
}
```

#### appointment.completed

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AppointmentCompletedEvent",
  "type": "object",
  "required": ["appointment_id", "technician_id", "completed_at"],
  "properties": {
    "appointment_id": {"type": "string", "format": "uuid"},
    "technician_id": {"type": "string", "format": "uuid"},
    "notes": {"type": "string"},
    "completed_at": {"type": "string", "format": "date-time"},
    "work_order_required": {"type": "boolean"},
    "followup_required": {"type": "boolean"}
  }
}
```

### 3.3 users_v2 Event Schemas

#### user.created

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserCreatedEvent",
  "type": "object",
  "required": ["user_id", "email", "name", "role", "status"],
  "properties": {
    "user_id": {"type": "string", "format": "uuid"},
    "email": {"type": "string", "format": "email"},
    "name": {"type": "string"},
    "role": {"type": "string"},
    "status": {"type": "string", "enum": ["pending", "active", "disabled"]},
    "organization_id": {"type": "string", "format": "uuid"},
    "created_at": {"type": "string", "format": "date-time"}
  }
}
```

### 3.4 feedback_v2 Event Schemas

#### feedback.submitted

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FeedbackSubmittedEvent",
  "type": "object",
  "required": ["feedback_id", "customer_id", "rating", "category"],
  "properties": {
    "feedback_id": {"type": "string", "format": "uuid"},
    "customer_id": {"type": "string", "format": "uuid"},
    "service_event_id": {"type": "string", "format": "uuid"},
    "rating": {"type": "integer", "minimum": 1, "maximum": 5},
    "category": {"type": "string"},
    "comment": {"type": "string"},
    "submitted_at": {"type": "string", "format": "date-time"}
  }
}
```

### 3.5 notifications_v2 Event Schemas

#### notification.send

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NotificationSendEvent",
  "type": "object",
  "required": ["notification_id", "recipient_id", "type", "template_id", "channel"],
  "properties": {
    "notification_id": {"type": "string", "format": "uuid"},
    "recipient_id": {"type": "string", "format": "uuid"},
    "recipient_type": {"type": "string", "enum": ["customer", "technician", "admin", "manager"]},
    "type": {"type": "string"},
    "template_id": {"type": "string"},
    "channel": {"type": "string", "enum": ["email", "sms", "push", "in_app", "discord"]},
    "priority": {"type": "string", "enum": ["low", "normal", "high", "critical"]},
    "correlation_id": {"type": "string"},
    "created_at": {"type": "string", "format": "date-time"}
  }
}
```

---

## 4. System Event Schemas

### 4.1 Workflow Lifecycle Events

#### system.workflow.started

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WorkflowStartedEvent",
  "type": "object",
  "required": ["workflow_name", "instance_id", "correlation_id", "trigger_event", "started_at"],
  "properties": {
    "workflow_name": {"type": "string"},
    "workflow_version": {"type": "string"},
    "instance_id": {"type": "string", "format": "uuid"},
    "correlation_id": {"type": "string"},
    "trigger_event": {"type": "string"},
    "trigger_payload": {"type": "object"},
    "started_at": {"type": "string", "format": "date-time"}
  }
}
```

#### system.workflow.completed

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WorkflowCompletedEvent",
  "type": "object",
  "required": ["workflow_name", "instance_id", "duration", "result"],
  "properties": {
    "workflow_name": {"type": "string"},
    "instance_id": {"type": "string", "format": "uuid"},
    "duration_ms": {"type": "integer"},
    "result_summary": {"type": "string"},
    "output_events": {"type": "array", "items": {"type": "string"}},
    "completed_at": {"type": "string", "format": "date-time"}
  }
}
```

#### system.workflow.failed

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WorkflowFailedEvent",
  "type": "object",
  "required": ["workflow_name", "instance_id", "error_node", "error"],
  "properties": {
    "workflow_name": {"type": "string"},
    "instance_id": {"type": "string", "format": "uuid"},
    "error_node": {"type": "string"},
    "node_type": {"type": "string"},
    "error": {"type": "string"},
    "error_code": {"type": "string"},
    "retry_count": {"type": "integer"},
    "failed_at": {"type": "string", "format": "date-time"},
    "escalated": {"type": "boolean"}
  }
}
```

### 4.2 System Health Events

#### system.health.alert

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SystemHealthAlertEvent",
  "type": "object",
  "required": ["alert_id", "dimension", "severity", "message"],
  "properties": {
    "alert_id": {"type": "string", "format": "uuid"},
    "dimension": {"type": "string", "enum": ["workflow", "function", "agent", "event_bus", "database", "integration"]},
    "severity": {"type": "string", "enum": ["info", "warning", "critical"]},
    "message": {"type": "string"},
    "metric_value": {"type": "number"},
    "threshold": {"type": "number"},
    "detected_at": {"type": "string", "format": "date-time"}
  }
}
```

### 4.3 Config Change Events

#### system.config.changed

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SystemConfigChangedEvent",
  "type": "object",
  "required": ["key", "new_value", "changed_by"],
  "properties": {
    "key": {"type": "string"},
    "previous_value": {"type": "string"},
    "new_value": {"type": "string"},
    "changed_by": {"type": "string"},
    "changed_at": {"type": "string", "format": "date-time"},
    "requires_restart": {"type": "boolean"}
  }
}
```

---

## 5. Business Event Schemas

### 5.1 SLA Events

#### sla.breached

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SLABreachEvent",
  "type": "object",
  "required": ["ticket_id", "sla_tier", "deadline", "breach_duration"],
  "properties": {
    "ticket_id": {"type": "string", "format": "uuid"},
    "sla_tier": {"type": "string"},
    "deadline": {"type": "string", "format": "date-time"},
    "breach_duration_minutes": {"type": "integer"},
    "current_urgency": {"type": "string"},
    "assigned_technician": {"type": "string", "format": "uuid"},
    "breached_at": {"type": "string", "format": "date-time"}
  }
}
```

### 5.2 Dispatch Events

#### dispatch.created

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DispatchCreatedEvent",
  "type": "object",
  "required": ["dispatch_id", "ticket_id", "dispatch_type"],
  "properties": {
    "dispatch_id": {"type": "string", "format": "uuid"},
    "ticket_id": {"type": "string", "format": "uuid"},
    "appointment_id": {"type": "string", "format": "uuid"},
    "dispatch_type": {"type": "string", "enum": ["standard", "urgent", "emergency"]},
    "technician_id": {"type": "string", "format": "uuid"},
    "created_at": {"type": "string", "format": "date-time"}
  }
}
```

### 5.3 Account Health Events

#### account.health.changed

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AccountHealthChangedEvent",
  "type": "object",
  "required": ["account_id", "customer_id", "old_health", "new_health", "health_score"],
  "properties": {
    "account_id": {"type": "string", "format": "uuid"},
    "customer_id": {"type": "string", "format": "uuid"},
    "old_health": {"type": "string", "enum": ["healthy", "at_risk", "critical", "churned"]},
    "new_health": {"type": "string", "enum": ["healthy", "at_risk", "critical", "churned"]},
    "health_score": {"type": "number", "minimum": 0, "maximum": 100},
    "risk_factors": {"type": "array", "items": {"type": "string"}},
    "changed_at": {"type": "string", "format": "date-time"}
  }
}
```

---

## 6. Audit Event Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AuditEvent",
  "type": "object",
  "required": ["audit_id", "event_type", "entity_type", "entity_id", "action", "actor_id", "timestamp"],
  "properties": {
    "audit_id": {"type": "string", "format": "uuid"},
    "event_type": {"type": "string"},
    "entity_type": {"type": "string"},
    "entity_id": {"type": "string", "format": "uuid"},
    "action": {"type": "string"},
    "actor_id": {"type": "string", "format": "uuid"},
    "actor_type": {"type": "string", "enum": ["user", "system", "agent", "function"]},
    "previous_state": {"type": "object"},
    "new_state": {"type": "object"},
    "changed_fields": {"type": "array", "items": {"type": "string"}},
    "correlation_id": {"type": "string"},
    "ip_address": {"type": "string"},
    "user_agent": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"}
  }
}
```

---

## 7. Validation Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Event Name Format** | Must match `{domain}.{entity}.{action}[.{modifier}]` | Reject at bus entry |
| **Required Fields** | Every event must have `event_id`, `event_name`, `correlation_id`, `idempotency_key` | Reject at bus entry |
| **Schema Validation** | Payload must match registered JSON Schema for the event `name + version` | Reject at bus entry |
| **Max Payload Size** | 256KB per event payload | Truncate + alert |
| **Max Envelope Size** | 512KB per event (including metadata) | Reject at bus entry |
| **Field Types** | All fields must match schema type definitions | Reject at bus entry |
| **Enum Validation** | String enum fields must match registered values | Reject at bus entry |
| **Date/Time Format** | All timestamps must be ISO 8601 UTC | Coerce or reject |
| **String Length Limits** | Strings capped at schema-defined maxLength | Truncate or reject |
| **Nested Object Limits** | Max 5 levels of nesting | Reject at bus entry |
| **Array Element Limits** | Max 1000 elements per array | Truncate + warn |

---

> **End of EVENT_SCHEMA.md**
