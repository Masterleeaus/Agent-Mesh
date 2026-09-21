# RESQAI V2 — Event Payload Definitions

> Phase B.3 — Enterprise Event Architecture  
> Chief Enterprise Event Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Application Event Payloads](#1-application-event-payloads)
2. [Database Event Payloads](#2-database-event-payloads)
3. [System Event Payloads](#3-system-event-payloads)
4. [Business Event Payloads](#4-business-event-payloads)
5. [Audit Event Payloads](#5-audit-event-payloads)
6. [Notification Event Payloads](#6-notification-event-payloads)
7. [Integration Event Payloads](#7-integration-event-payloads)
8. [Security Event Payloads](#8-security-event-payloads)
9. [Payload Size Budgets](#9-payload-size-budgets)

---

## 1. Application Event Payloads

### 1.1 support-center_v2 Payloads

#### TicketEvent Payloads

| Event | Fields | Type | Required | Max Size |
|-------|--------|------|----------|----------|
| `ticket.created` | ticket_id, customer_id, customer_name, subject, description, request_type, urgency, status, channel, created_at, created_by, source | JSON Object | All fields | 16KB |
| `ticket.classified` | ticket_id, request_type, urgency, confidence, suggested_technician_id, classification_reason | JSON Object | ticket_id, classification | 4KB |
| `ticket.reply.drafted` | ticket_id, draft_text, confidence, suggested_owner_id, ai_model_version | JSON Object | ticket_id, draft_text | 64KB |
| `ticket.reply.approved` | ticket_id, approved_by, approved_at, approval_notes | JSON Object | ticket_id, approved_by | 2KB |
| `ticket.reply.rejected` | ticket_id, rejected_by, rejection_reason, rejection_timestamp | JSON Object | ticket_id | 2KB |
| `ticket.status.changed` | ticket_id, previous_status, new_status, changed_by, changed_at, reason | JSON Object | All fields | 2KB |
| `ticket.escalated` | ticket_id, escalation_level, reason, escalated_to, escalated_by, escalated_at | JSON Object | All fields | 2KB |

#### Sample Payload: ticket.created

```json
{
  "ticket_id": "a1b2c3d4-1234-5678-9abc-def012345678",
  "customer_id": "c001d002-e003-f004-a005-b006c007d008",
  "customer_name": "Jane Smith",
  "subject": "AC unit not cooling after maintenance visit",
  "description": "We had a maintenance visit yesterday for our AC unit model XL-2000. Today it's blowing warm air.",
  "request_type": "service",
  "urgency": "high",
  "status": "new",
  "channel": "portal",
  "created_at": "2026-06-30T10:30:00Z",
  "created_by": "jane.smith@example.com",
  "source": "customer-portal_v2"
}
```

### 1.2 appointment-center_v2 Payloads

#### AppointmentEvent Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `appointment.created` | appointment_id, customer_id, customer_name, service_type, date, time_slot, technician_id, status, created_at | 8KB |
| `appointment.assigned` | appointment_id, technician_id, technician_name, assigned_by, assigned_at | 2KB |
| `appointment.status.changed` | appointment_id, old_status, new_status, changed_by, changed_at | 2KB |
| `appointment.cancelled` | appointment_id, reason, cancelled_by, cancelled_at | 2KB |
| `appointment.completed` | appointment_id, technician_id, notes, completed_at, work_order_required, followup_required | 8KB |
| `appointment.rescheduled` | appointment_id, old_date, new_date, old_time_slot, new_time_slot, reason | 4KB |
| `appointment.no_show` | appointment_id, customer_id, technician_id, wait_duration_minutes | 2KB |
| `appointment.conflict_detected` | appointment_id, conflict_type, conflicting_appointment_id, message | 2KB |

### 1.3 operations-center_v2 Payloads

#### OperationEvent Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `operation.created` | operation_id, type, source, priority, status, created_at, metadata | 8KB |
| `operation.dispatched` | operation_id, technician_id, method, dispatched_at, dispatch_notes | 2KB |
| `operation.assigned` | operation_id, technician_id, technician_name, assigned_by | 2KB |
| `operation.reassigned` | operation_id, previous_technician_id, new_technician_id, reason | 2KB |
| `operation.status.changed` | operation_id, previous_status, new_status, reason | 2KB |
| `operation.escalated` | operation_id, reason, escalated_to, escalation_level | 2KB |
| `technician.status.changed` | technician_id, previous_status, new_status, location | 2KB |
| `operation.conflict.detected` | operation_id, technician_id, conflicting_operation_id, warning | 2KB |

### 1.4 technician-portal_v2 Payloads

#### JobEvent Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `job.accepted` | job_id, technician_id, accepted_at | 1KB |
| `job.rejected` | job_id, technician_id, reason | 2KB |
| `job.status.changed` | job_id, previous_status, new_status, changed_at | 1KB |
| `job.completed` | job_id, completion_notes, completed_at, parts_used, photos_count | 4KB |
| `job.escalated` | job_id, reason, escalated_to | 2KB |
| `job.paused` | job_id, reason, paused_at | 1KB |
| `job.resumed` | job_id, resumed_at | 1KB |
| `notes.added` | job_id, note_id, category, content_preview | 2KB |
| `evidence.uploaded` | job_id, evidence_id, type, file_size | 1KB |
| `signature.captured` | job_id, signature_id, captured_at | 1KB |
| `parts.used` | job_id, part_ids, quantities, total_cost | 4KB |
| `inventory.requested` | job_id, request_id, parts_requested | 4KB |

### 1.5 resolution-center_v2 Payloads

#### ResolutionEvent Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `resolution.case.created` | case_id, customer_id, reason, status, created_at, metadata | 8KB |
| `resolution.case.closed` | case_id, resolution_summary, closed_by, closed_at | 4KB |
| `resolution.dispute.created` | case_id, dispute_id, reason, amount_in_dispute | 4KB |
| `resolution.dispute.resolved` | case_id, dispute_id, resolution, resolution_notes | 4KB |
| `resolution.resolution.created` | resolution_id, case_id, proposed_resolution, created_by | 4KB |
| `resolution.resolution.approved` | resolution_id, case_id, approved_by, approved_at | 1KB |
| `resolution.resolution.rejected` | resolution_id, case_id, reason, rejected_by | 2KB |
| `resolution.escalation.created` | escalation_id, case_id, reason, escalation_level | 2KB |
| `resolution.approval.granted` | approval_id, case_id, approved_by | 1KB |
| `resolution.evidence.uploaded` | case_id, evidence_id, type, uploaded_by | 1KB |

### 1.6 crm-center_v2 Payloads

#### CRMEvent Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `account.health.scan.completed` | scan_id, accounts_scanned, critical_count, at_risk_count, healthy_count, scanning_errors | 4KB |
| `account.health.changed` | account_id, customer_id, old_health, new_health, health_score, risk_factors | 4KB |
| `followup.created` | followup_id, account_id, type, priority, due_date, owner, description | 4KB |
| `followup.completed` | followup_id, completed_by, outcome, completed_at | 2KB |
| `followup.slippage.detected` | followup_id, account_id, days_overdue, severity, owner | 2KB |
| `task.created` | task_id, account_id, title, priority, assignee, due_date | 4KB |
| `feedback.recorded` | feedback_id, account_id, category, sentiment, rating | 2KB |
| `opportunity.stage.changed` | opportunity_id, account_id, old_stage, new_stage, value | 2KB |
| `customer.merged` | primary_customer_id, secondary_customer_id, merged_fields | 4KB |
| `retention.alert` | account_id, risk_level, reason, recommended_action | 4KB |

### 1.7 analytics-center_v2 Payloads

#### AnalyticsEvent Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `analytics:dashboard.refreshed` | domain, refresh_type, records_processed, duration_ms | 2KB |
| `analytics:report.generated` | report_id, report_name, generated_by, generated_at, format, row_count | 4KB |
| `analytics:export.completed` | export_id, format, row_count, file_size_bytes, url, expires_at | 4KB |
| `analytics:export.failed` | export_id, format, error_message, error_code | 2KB |
| `analytics:schedule.created` | schedule_id, report_id, frequency, recipients, cron_expression | 2KB |
| `analytics:forecast.generated` | metric, forecast_periods, confidence_interval, predictions_summary | 8KB |
| `analytics:sla.breach` | domain, metric, threshold, actual_value, breached_at | 2KB |
| `analytics:anomaly.detected` | metric_name, current_value, expected_value, deviation_percent, severity | 4KB |
| `analytics:insight.ready` | insight_id, domain, headline, recommendation, confidence | 4KB |

### 1.8 customer-portal_v2 Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `ticket.created.customer` | ticket_id, subject, request_type, description, created_at | 8KB |
| `ticket.message.sent.customer` | ticket_id, message_id, body_preview, sent_at | 4KB |
| `appointment.requested` | appointment_id, service_type, preferred_date, preferred_time | 4KB |
| `appointment.rescheduled.customer` | appointment_id, new_date, new_time, reason | 2KB |
| `payment.made.customer` | invoice_id, amount, currency, payment_method, paid_at | 4KB |
| `feedback.submitted.customer` | feedback_id, rating, category, comment | 4KB |
| `profile.updated.customer` | changed_fields, updated_at | 2KB |

### 1.9 admin-center_v2 Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `user.created` | user_id, email, name, role, organization_id | 2KB |
| `user.role.changed` | user_id, previous_role, new_role, changed_by | 1KB |
| `user.disabled` | user_id, disabled_by, reason | 1KB |
| `system.config.changed` | key, previous_value, new_value, changed_by | 4KB |
| `application.deployed` | app_id, app_name, version, deployed_by, deployed_at | 2KB |
| `application.status.changed` | app_id, app_name, previous_status, new_status | 1KB |
| `integration.connected` | integration_id, name, type, connected_at | 2KB |
| `integration.error` | integration_id, name, error_message, error_code | 2KB |
| `api_key.created` | key_id, name, permissions, created_by | 2KB |
| `api_key.revoked` | key_id, name, revoked_by, reason | 1KB |
| `organization.created` | org_id, name, plan, created_at | 2KB |
| `team.created` | team_id, name, organization_id, member_count | 2KB |

---

## 2. Database Event Payloads

Every database entity event follows the common payload schemas defined in EVENT_SCHEMA.md section 2.

| Payload Type | Fields | Max Size |
|-------------|--------|----------|
| Entity Created | entity_id, entity_type, created_by, created_at, initial_state (entity-specific) | 16KB |
| Entity Updated | entity_id, entity_type, updated_by, updated_at, changed_fields, previous_values, new_values | 16KB |
| Entity Deleted | entity_id, entity_type, deleted_by, deleted_at, final_state | 16KB |
| Status Changed | entity_id, entity_type, previous_status, new_status, changed_by, changed_at, reason | 4KB |
| Assigned | entity_id, entity_type, assignee_id, assignee_type, assigned_by, assigned_at, reason | 4KB |

---

## 3. System Event Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `system.workflow.started` | workflow_name, workflow_version, instance_id, correlation_id, trigger_event, trigger_payload, started_at | 16KB |
| `system.workflow.completed` | workflow_name, instance_id, version, duration_ms, result_summary, output_events, completed_at | 8KB |
| `system.workflow.failed` | workflow_name, instance_id, error_node, node_type, error, error_code, retry_count, failed_at | 8KB |
| `system.workflow.recovered` | workflow_name, instance_id, recovery_action, recovered_at | 4KB |
| `system.workflow.dead_letter` | workflow_name, instance_id, error, error_node, escalated_to, escalated_at | 4KB |
| `system.workflow.node.started` | instance_id, node_id, node_type, started_at | 2KB |
| `system.workflow.node.completed` | instance_id, node_id, node_type, duration_ms, output_summary | 4KB |
| `system.workflow.node.failed` | instance_id, node_id, error, retry_count | 2KB |
| `system.workflow.timed_out` | instance_id, workflow_name, timeout_seconds, duration_ms | 2KB |
| `system.workflow.cancelled` | instance_id, workflow_name, cancelled_by, reason | 2KB |
| `system.health.alert` | alert_id, dimension, severity, message, metric_value, threshold, detected_at | 4KB |
| `system.health.restored` | dimension, restored_value, restored_at | 2KB |
| `system.config.changed` | key, previous_value, new_value, changed_by, changed_at | 4KB |
| `system.config.rollback` | key, reason, rolled_back_by, rolled_back_at | 2KB |
| `offline.sync.started` | device_id, pending_uploads, pending_downloads, started_at | 2KB |
| `offline.sync.completed` | device_id, uploaded_count, downloaded_count, duration_ms | 2KB |
| `offline.sync.failed` | device_id, error, failed_operation | 2KB |

---

## 4. Business Event Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `sla.warning` | ticket_id, sla_tier, deadline, time_remaining_minutes, current_status | 2KB |
| `sla.breached` | ticket_id, sla_tier, deadline, breach_duration_minutes, breached_at | 2KB |
| `dispatch.created` | dispatch_id, ticket_id, appointment_id, dispatch_type, technician_id, created_at | 4KB |
| `dispatch.sent` | dispatch_id, technician_id, channel, sent_at | 1KB |
| `dispatch.acknowledged` | dispatch_id, technician_id, acknowledged_at | 1KB |
| `dispatch.declined` | dispatch_id, technician_id, reason, declined_at | 2KB |
| `dispatch.reassigned` | dispatch_id, old_technician_id, new_technician_id, reason | 2KB |
| `dispatch.en_route` | dispatch_id, technician_id, eta_minutes, location | 2KB |
| `dispatch.on_site` | dispatch_id, technician_id, arrived_at | 1KB |
| `dispatch.escalated` | dispatch_id, reason, escalation_level | 2KB |
| `work_order.created` | work_order_id, appointment_id, technician_id, work_order_type, created_at | 4KB |
| `work_order.completed` | work_order_id, completed_at, parts_used, labor_hours, notes | 8KB |
| `work_order.verified` | work_order_id, verified_by, score, findings | 4KB |
| `dispute.created` | dispute_id, case_id, customer_id, reason, amount, created_at | 4KB |
| `dispute.analyzed` | dispute_id, confidence, recommendation, analysis_notes | 8KB |
| `dispute.escalated` | dispute_id, reason, escalation_level | 2KB |
| `dispute.resolved` | dispute_id, resolution, resolved_by, resolved_at | 4KB |
| `dispute.approved` | dispute_id, resolution, approved_by, approved_at | 2KB |
| `campaign.created` | campaign_id, account_id, campaign_type, channels, offer | 4KB |
| `campaign.started` | campaign_id, channels, target_count, started_at | 2KB |
| `campaign.completed` | campaign_id, response_count, conversion_count, outcome | 4KB |
| `feedback.submitted` | feedback_id, customer_id, service_event_id, rating, category, comment, submitted_at | 4KB |
| `feedback.analyzed` | feedback_id, sentiment, sentiment_score, topics, risk_level | 4KB |
| `cx.risk.identified` | feedback_id, risk_type, severity, customer_id, recommended_action | 4KB |
| `knowledge.article.published` | article_id, title, category, version, published_by | 2KB |
| `knowledge.article.archived` | article_id, reason, archived_by | 1KB |
| `knowledge.gap.detected` | gap_id, query_text, frequency, suggested_topic | 4KB |
| `knowledge.article.requested` | request_id, topic, priority, requested_by | 2KB |
| `inventory.item.low_stock` | item_id, item_name, current_quantity, threshold, reorder_quantity | 2KB |
| `standup.generated` | standup_id, generated_at, metrics_summary, items_count | 8KB |
| `standup.escalated` | standup_id, priority_items, action_required | 4KB |
| `blocker.identified` | blocker_id, entity_type, entity_id, description, severity | 4KB |
| `analytics.trend.identified` | trend_id, metric, direction, magnitude, significance, domain | 4KB |
| `analytics.insight.generated` | insight_id, domain, headline, recommendation, confidence | 4KB |
| `analytics.anomaly.detected` | anomaly_id, metric, severity, deviation_percent, expected, actual | 4KB |
| `qa.violation.found` | violation_id, policy, severity, entity_id, entity_type, description | 4KB |

---

## 5. Notification Event Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `notification.send` | notification_id, recipient_id, recipient_type, type, template_id, template_data, channel, priority, correlation_id | 16KB |
| `notification.sent` | notification_id, channel, provider_id, provider_message_id, sent_at | 2KB |
| `notification.delivered` | notification_id, channel, delivered_at, delivery_confirmation | 2KB |
| `notification.failed` | notification_id, channel, error_message, error_code, attempt_count, last_attempt_at | 2KB |
| `notification.read` | notification_id, read_at, read_duration_seconds | 1KB |
| `notification.bulk.send` | batch_id, recipient_ids, template_id, channel, scheduled_at | 32KB |

---

## 6. Integration Event Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `integration.connected` | integration_id, name, provider_type, connected_at, account_email | 2KB |
| `integration.disconnected` | integration_id, name, disconnected_by, reason | 1KB |
| `integration.error` | integration_id, operation, error_message, error_code, retry_count | 2KB |
| `integration.webhook.received` | integration_id, event_type, raw_payload_preview, received_at | 64KB |
| `integration.data.synced` | integration_id, entity_type, records_synced, duration_ms | 2KB |
| `integration.oauth.token.refreshed` | integration_id, provider, refreshed_at, expires_at | 1KB |
| `integration.rate_limit.reached` | integration_id, provider, limit, reset_at | 1KB |

---

## 7. Security Event Payloads

| Event | Fields | Max Size |
|-------|--------|----------|
| `security.login.succeeded` | user_id, method, ip_address, user_agent, logged_in_at | 2KB |
| `security.login.failed` | user_id, method, ip_address, failure_reason, attempt_count | 2KB |
| `security.password.changed` | user_id, changed_at, method | 1KB |
| `security.password.reset.requested` | user_id, method, requested_at | 1KB |
| `security.two_factor.enabled` | user_id, method, enabled_at | 1KB |
| `security.api_key.created` | key_id, name, permissions, created_by, created_at | 2KB |
| `security.api_key.revoked` | key_id, name, revoked_by, reason | 1KB |
| `security.permission.denied` | user_id, resource, action, denied_at | 1KB |
| `security.rate_limit.exceeded` | user_id, endpoint, limit, window, exceeded_at | 1KB |
| `security.suspicious.activity` | user_id, activity_type, severity, details, detected_at | 4KB |

---

## 8. Event Payload Compression

| Payload Size | Handling |
|-------------|----------|
| < 1KB | No compression needed |
| 1KB - 64KB | Transparent compression (gzip) recommended |
| 64KB - 256KB | Compression required (gzip) |
| > 256KB | Rejected at bus entry; producer must split payload |

---

> **End of EVENT_PAYLOADS.md**
