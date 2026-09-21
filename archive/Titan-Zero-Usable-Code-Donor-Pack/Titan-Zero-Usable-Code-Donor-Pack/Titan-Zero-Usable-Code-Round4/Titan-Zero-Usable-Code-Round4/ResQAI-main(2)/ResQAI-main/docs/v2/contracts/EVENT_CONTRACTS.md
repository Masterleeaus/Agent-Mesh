# RESQAI V2 — Event Contracts

> Phase 3.3 — Integration Contracts  
> Principal Enterprise Solution Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Event Contract Format](#1-event-contract-format)
2. [Ticket Events](#2-ticket-events)
3. [Appointment Events](#3-appointment-events)
4. [Work Order Events](#4-work-order-events)
5. [Dispatch Events](#5-dispatch-events)
6. [Dispute Events](#6-dispute-events)
7. [Account Health Events](#7-account-health-events)
8. [Followup Events](#8-followup-events)
9. [Task Events](#9-task-events)
10. [Customer Events](#10-customer-events)
11. [Technician Events](#11-technician-events)
12. [Feedback Events](#12-feedback-events)
13. [Notification Events](#13-notification-events)
14. [User & System Events](#14-user--system-events)
15. [Workflow Events](#15-workflow-events)
16. [Agent Events](#16-agent-events)

---

## 1. Event Contract Format

Each event contract defines:

```
### Event Name

**Schema Version:** {integer}
**Producer:** {app(s)}
**Emitted When:** {condition}
**Correlation Source:** {source event or trigger}

**Payload:**
```json
{
  "eventName": "string",
  "version": "integer",
  "emittedAt": "ISO8601",
  "correlationId": "uuid",
  "producer": {
    "app": "string",
    "actorType": "enum",
    "actorId": "uuid"
  },
  "entity": {
    "type": "string",
    "id": "uuid"
  },
  "data": {}
}
```

**Consumed By:** {list of apps}
**Persistence:** events_v2 (recorded permanently)
**Delivery Guarantee:** At-least-once
**Ordering:** Per entity ID (causal order preserved)
**TTL:** 90 days (events_v2), after which archived

---

## 2. Ticket Events

### ticket.created

**Schema Version:** 1
**Producer:** support-center_v2, customer-portal_v2
**Emitted When:** New ticket record INSERTed
**Correlation Source:** CreateTicket action

**Data:**
```json
{
  "customerId": "uuid",
  "customerName": "string",
  "channel": "enum",
  "subject": "string",
  "requestType": "enum",
  "urgency": "enum",
  "status": "new"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2, crm-center_v2, operations-center_v2
**Workflows Triggered:** ticket-intake_v2, ticket-auto-response_v2
**Notifications Triggered:** New ticket created (in-app to support manager), Ticket created confirmation (email/SMS to customer)

### ticket.classified

**Schema Version:** 1
**Producer:** support-center_v2 (via agent)
**Emitted When:** AI classification completes with confidence >= 0.7

**Data:**
```json
{
  "classifiedType": "enum",
  "urgency": "enum",
  "urgencyScore": "float",
  "suggestedOwner": "uuid|null",
  "slaTier": "enum|null",
  "slaDeadline": "ISO8601|null",
  "confidence": "float",
  "classificationReasons": ["string"]
}
```

**Consumed By:** support-center_v2, notification-center_v2, analytics-center_v2, operations-center_v2, appointment-center_v2 (if service-required)
**Workflows Triggered:** sla-enforcement_v2, urgent-dispatch_v2 (if urgent)

### ticket.reply.drafted

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Agent or AI drafts a reply

**Data:**
```json
{
  "draftId": "uuid",
  "agentId": "uuid",
  "agentName": "string",
  "draftContentPreview": "string (first 100 chars)",
  "isAiGenerated": "boolean",
  "aiConfidence": "float|null"
}
```

**Consumed By:** (internal — consumed by support-center_v2 for approval workflow)

### ticket.reply.approved

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Manager approves a draft reply

**Data:**
```json
{
  "draftId": "uuid",
  "approvedBy": "uuid",
  "approvedByName": "string",
  "ticketId": "uuid"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2
**Notifications Triggered:** Reply sent (email to customer)

### ticket.reply.rejected

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Manager rejects a draft reply

**Data:**
```json
{
  "draftId": "uuid",
  "rejectedBy": "uuid",
  "rejectionReason": "string"
}
```

**Consumed By:** (internal)

### ticket.status.changed

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Any ticket status transition

**Data:**
```json
{
  "previousStatus": "enum",
  "newStatus": "enum",
  "changedBy": "uuid",
  "changedByName": "string",
  "reason": "string|null"
}
```

**Consumed By:** customer-portal_v2, crm-center_v2, notification-center_v2, analytics-center_v2, operations-center_v2
**Notifications Triggered:** Ticket status changed (in-app, email to customer)

### ticket.escalated

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Ticket escalation action performed

**Data:**
```json
{
  "previousEscalationLevel": "integer",
  "newEscalationLevel": "integer",
  "escalationReason": "string",
  "escalatedBy": "uuid",
  "escalatedTo": "uuid|null"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2
**Workflows Triggered:** support-escalation-manager_v2, urgent-dispatch_v2

### ticket.assigned

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Ticket owner changed

**Data:**
```json
{
  "previousOwner": "uuid|null",
  "newOwner": "uuid",
  "assignedBy": "uuid"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### ticket.sla_breached

**Schema Version:** 1
**Producer:** system (batch-sla-check function)
**Emitted When:** SLA deadline passes without resolution

**Data:**
```json
{
  "slaDeadline": "ISO8601",
  "slaTier": "enum",
  "breachedAt": "ISO8601",
  "breachSeverity": "enum",
  "responseDeadline": "ISO8601|null",
  "resolutionDeadline": "ISO8601|null"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2
**Notifications Triggered:** SLA breach warning (in-app, email, discord to support manager)

### ticket.closed

**Schema Version:** 1
**Producer:** support-center_v2
**Emitted When:** Ticket status changed to closed

**Data:**
```json
{
  "resolvedAt": "ISO8601",
  "resolutionSummary": "string",
  "closedBy": "uuid",
  "resolutionTimeHours": "float"
}
```

**Consumed By:** crm-center_v2, analytics-center_v2, notification-center_v2
**Workflows Triggered:** customer-satisfaction-monitor_v2
**Notifications Triggered:** Ticket closed (in-app, email to customer with satisfaction survey link)

---

## 3. Appointment Events

### appointment.created

**Schema Version:** 1
**Producer:** appointment-center_v2, customer-portal_v2
**Emitted When:** New appointment record INSERTed

**Data:**
```json
{
  "customerId": "uuid",
  "customerName": "string",
  "serviceType": "string",
  "scheduledAt": "ISO8601",
  "durationMinutes": "integer",
  "technicianId": "uuid|null",
  "status": "scheduled"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, crm-center_v2, analytics-center_v2
**Workflows Triggered:** appointment-assignment_v2, appointment-reminders_v2

### appointment.confirmed

**Schema Version:** 1
**Producer:** appointment-center_v2
**Emitted When:** Customer confirms appointment (or auto-confirmed after scheduling)

**Data:**
```json
{
  "customerId": "uuid",
  "technicianId": "uuid|null",
  "confirmedAt": "ISO8601",
  "channel": "enum"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2
**Notifications Triggered:** Appointment confirmed (email to customer)

### appointment.assigned

**Schema Version:** 1
**Producer:** appointment-center_v2
**Emitted When:** Technician assigned to appointment

**Data:**
```json
{
  "technicianId": "uuid",
  "technicianName": "string",
  "assignedBy": "uuid",
  "assignedByName": "string",
  "previousTechnicianId": "uuid|null",
  "skillMatchScore": "float"
}
```

**Consumed By:** technician-portal_v2, notification-center_v2, analytics-center_v2

### appointment.rescheduled

**Schema Version:** 1
**Producer:** appointment-center_v2, customer-portal_v2
**Emitted When:** Appointment date/time changed

**Data:**
```json
{
  "previousScheduledAt": "ISO8601",
  "newScheduledAt": "ISO8601",
  "reason": "string",
  "changedBy": "uuid",
  "changedByName": "string"
}
```

**Consumed By:** technician-portal_v2, notification-center_v2, operations-center_v2, analytics-center_v2

### appointment.started

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Technician starts appointment (on_site → working)

**Data:**
```json
{
  "technicianId": "uuid",
  "startedAt": "ISO8601",
  "gpsCoordinates": { "lat": "float", "lng": "float" }
}
```

**Consumed By:** operations-center_v2, analytics-center_v2

### appointment.completed

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Technician completes appointment

**Data:**
```json
{
  "technicianId": "uuid",
  "completedAt": "ISO8601",
  "durationMinutes": "integer",
  "technicianNotes": "string|null",
  "workOrderCreated": "boolean",
  "workOrderId": "uuid|null"
}
```

**Consumed By:** crm-center_v2, analytics-center_v2, notification-center_v2
**Workflows Triggered:** appointment-completion_v2, customer-satisfaction-monitor_v2

### appointment.cancelled

**Schema Version:** 1
**Producer:** appointment-center_v2, customer-portal_v2
**Emitted When:** Appointment cancelled

**Data:**
```json
{
  "reason": "string",
  "cancelledBy": "uuid",
  "cancelledByName": "string",
  "source": "enum"
}
```

**Consumed By:** technician-portal_v2, notification-center_v2, operations-center_v2, analytics-center_v2

### appointment.no_show

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Technician waited 15 minutes with no customer present

**Data:**
```json
{
  "technicianId": "uuid",
  "arrivedAt": "ISO8601",
  "noShowDeclaredAt": "ISO8601",
  "waitDurationMinutes": "integer"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, crm-center_v2, analytics-center_v2

### appointment.reminder.sent

**Schema Version:** 1
**Producer:** notification-center_v2
**Emitted When:** Appointment reminder delivered

**Data:**
```json
{
  "recipientType": "enum",
  "recipientId": "uuid",
  "channel": "enum",
  "reminderInterval": "enum"
}
```

**Consumed By:** analytics-center_v2

---

## 4. Work Order Events

### work_order.created

**Schema Version:** 1
**Producer:** appointment-center_v2
**Emitted When:** Work order generated from completed appointment

**Data:**
```json
{
  "appointmentId": "uuid",
  "technicianId": "uuid",
  "customerId": "uuid",
  "serviceType": "string",
  "status": "created"
}
```

**Consumed By:** technician-portal_v2, operations-center_v2, analytics-center_v2

### work_order.stage.changed

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Any work order stage transition

**Data:**
```json
{
  "previousStage": "enum",
  "newStage": "enum",
  "technicianId": "uuid",
  "timestamp": "ISO8601"
}
```

**Consumed By:** operations-center_v2, analytics-center_v2

### work_order.completed

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Work order completed successfully

**Data:**
```json
{
  "technicianId": "uuid",
  "completedAt": "ISO8601",
  "resolutionSummary": "string",
  "partsUsed": [{ "itemId": "uuid", "quantity": "integer" }] | null,
  "followupNeeded": "boolean",
  "customerSignatureUrl": "string|null"
}
```

**Consumed By:** crm-center_v2, analytics-center_v2

---

## 5. Dispatch Events

### dispatch.created

**Schema Version:** 1
**Producer:** operations-center_v2
**Emitted When:** Dispatch record created

**Data:**
```json
{
  "ticketId": "uuid",
  "technicianId": "uuid",
  "dispatchType": "enum",
  "priority": "enum",
  "scheduledAt": "ISO8601",
  "status": "pending"
}
```

**Consumed By:** analytics-center_v2

### dispatch.sent

**Schema Version:** 1
**Producer:** notification-center_v2
**Emitted When:** Dispatch notification sent to technician

**Data:**
```json
{
  "dispatchId": "uuid",
  "technicianId": "uuid",
  "channel": "enum",
  "sentAt": "ISO8601"
}
```

**Consumed By:** technician-portal_v2, analytics-center_v2

### dispatch.acknowledged

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Technician accepts dispatch

**Data:**
```json
{
  "technicianId": "uuid",
  "acknowledgedAt": "ISO8601",
  "estimatedArrivalMinutes": "integer|null"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2

### dispatch.declined

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Technician declines dispatch

**Data:**
```json
{
  "technicianId": "uuid",
  "declinedAt": "ISO8601",
  "reason": "string|null"
}
```

**Consumed By:** operations-center_v2, analytics-center_v2

### dispatch.reassigned

**Schema Version:** 1
**Producer:** operations-center_v2
**Emitted When:** Different technician assigned to dispatch

**Data:**
```json
{
  "previousTechnicianId": "uuid",
  "newTechnicianId": "uuid",
  "reassignReason": "string",
  "reassignedBy": "uuid"
}
```

**Consumed By:** technician-portal_v2, notification-center_v2, analytics-center_v2

### dispatch.completed

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Dispatch resolved

**Data:**
```json
{
  "technicianId": "uuid",
  "completedAt": "ISO8601",
  "durationMinutes": "integer",
  "result": "enum",
  "notes": "string|null"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2

### dispatch.escalated

**Schema Version:** 1
**Producer:** system (timeout monitor)
**Emitted When:** No acknowledgment within configured timeout

**Data:**
```json
{
  "timeoutMinutes": "integer",
  "escalatedAt": "ISO8601",
  "escalationReason": "no_acknowledgment"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2

---

## 6. Dispute Events

### dispute.created

**Schema Version:** 1
**Producer:** resolution-center_v2, customer-portal_v2
**Emitted When:** New dispute filed

**Data:**
```json
{
  "appointmentId": "uuid",
  "customerId": "uuid",
  "type": "enum",
  "description": "string",
  "severity": "enum"
}
```

**Consumed By:** customer-portal_v2 (via status update), notification-center_v2, crm-center_v2, analytics-center_v2, appointment-center_v2
**Workflows Triggered:** dispute-resolution_v2

### dispute.analyzing

**Schema Version:** 1
**Producer:** resolution-center_v2
**Emitted When:** AI analysis started

**Data:**
```json
{
  "analysisStartedAt": "ISO8601",
  "status": "analyzing"
}
```

### dispute.analyzed

**Schema Version:** 1
**Producer:** resolution-center_v2 (via agent)
**Emitted When:** AI analysis complete with confidence >= 0.8

**Data:**
```json
{
  "confidence": "float",
  "recommendedResolution": "enum",
  "resolutionReason": "string",
  "analysisSummary": "string"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### dispute.escalated

**Schema Version:** 1
**Producer:** resolution-center_v2
**Emitted When:** AI confidence < 0.8 or human escalation action

**Data:**
```json
{
  "escalationReason": "string",
  "confidence": "float",
  "escalatedTo": "string"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### dispute.approved

**Schema Version:** 1
**Producer:** resolution-center_v2
**Emitted When:** Manager approves recommendation

**Data:**
```json
{
  "approvedBy": "uuid",
  "resolution": "enum",
  "approvedAt": "ISO8601"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### dispute.rejected

**Schema Version:** 1
**Producer:** resolution-center_v2
**Emitted When:** Manager rejects recommendation

**Data:**
```json
{
  "rejectedBy": "uuid",
  "rejectionReason": "string"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### dispute.resolved

**Schema Version:** 1
**Producer:** resolution-center_v2
**Emitted When:** Dispute closed with outcome

**Data:**
```json
{
  "resolution": "enum",
  "resolvedBy": "uuid",
  "resolvedByName": "string",
  "resolutionNotes": "string",
  "customerCompensation": "number|null",
  "resolvedAt": "ISO8601"
}
```

**Consumed By:** crm-center_v2, customer-portal_v2, notification-center_v2, analytics-center_v2
**Workflows Triggered:** account-health-scan_v2 (re-trigger)

### dispute.status.changed

**Schema Version:** 1
**Producer:** resolution-center_v2
**Emitted When:** Any dispute status transition

**Data:**
```json
{
  "previousStatus": "enum",
  "newStatus": "enum",
  "changedBy": "uuid"
}
```

**Consumed By:** customer-portal_v2, notification-center_v2, analytics-center_v2

---

## 7. Account Health Events

### account.health.scan.completed

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** Health scan function completes

**Data:**
```json
{
  "accountId": "uuid",
  "customerId": "uuid",
  "healthScore": "float",
  "healthCategory": "enum",
  "signals": [{ "type": "string", "severity": "enum", "count": "integer" }],
  "scanType": "enum",
  "scanDurationMs": "integer"
}
```

**Consumed By:** analytics-center_v2

### account.health.changed

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** Account health category changes

**Data:**
```json
{
  "accountId": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "previousHealth": "enum",
  "newHealth": "enum",
  "previousScore": "float",
  "newScore": "float",
  "riskFactors": [{ "factor": "string", "severity": "enum" }]
}
```

**Consumed By:** customer-portal_v2, operations-center_v2 (if critical), notification-center_v2, analytics-center_v2
**Notifications Triggered:** Health downgrade/upgrade (in-app, email to account manager)

### account.risk.signal.detected

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** New risk signal identified during health scan

**Data:**
```json
{
  "accountId": "uuid",
  "signalType": "enum",
  "severity": "enum",
  "description": "string",
  "sourceEntity": {"type": "string", "id": "uuid"}
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2

### account.relationship.changed

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** Account relationship status changes

**Data:**
```json
{
  "previousStatus": "enum",
  "newStatus": "enum"
}
```

**Consumed By:** analytics-center_v2

---

## 8. Followup Events

### followup.created

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** New followup created

**Data:**
```json
{
  "accountId": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "followupType": "enum",
  "subject": "string",
  "assignedTo": "uuid",
  "dueDate": "ISO8601"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2, operations-center_v2

### followup.completed

**Schema Version:** 1
**Producer:** crm-center_v2, technician-portal_v2
**Emitted When:** Followup action completed

**Data:**
```json
{
  "completedAt": "ISO8601",
  "completionNotes": "string|null",
  "completedBy": "uuid"
}
```

**Consumed By:** analytics-center_v2

### followup.missed

**Schema Version:** 1
**Producer:** system (scheduler)
**Emitted When:** Followup due date passed without completion

**Data:**
```json
{
  "dueDate": "ISO8601",
  "daysOverdue": "integer"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### followup.slippage.detected

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** Followup exceeds configured slippage threshold

**Data:**
```json
{
  "accountId": "uuid",
  "customerName": "string",
  "followupType": "enum",
  "subject": "string",
  "dueDate": "ISO8601",
  "daysOverdue": "integer",
  "assignedTo": "uuid"
}
```

**Consumed By:** operations-center_v2, notification-center_v2, analytics-center_v2

### followup.cancelled

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** Followup cancelled

**Data:**
```json
{
  "cancelledBy": "uuid",
  "cancellationReason": "string"
}
```

**Consumed By:** analytics-center_v2

---

## 9. Task Events

### task.created

**Schema Version:** 1
**Producer:** operations-center_v2
**Emitted When:** New task created

**Data:**
```json
{
  "title": "string",
  "assignedTo": "uuid",
  "assignedToName": "string",
  "priority": "enum",
  "dueDate": "ISO8601|null",
  "category": "string|null",
  "source": "enum"
}
```

**Consumed By:** technician-portal_v2, notification-center_v2, analytics-center_v2

### task.assigned

**Schema Version:** 1
**Producer:** operations-center_v2
**Emitted When:** Task assigned to user

**Data:**
```json
{
  "previousOwner": "uuid|null",
  "newOwner": "uuid",
  "assignedBy": "uuid"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### task.completed

**Schema Version:** 1
**Producer:** operations-center_v2, technician-portal_v2
**Emitted When:** Task finished

**Data:**
```json
{
  "completedAt": "ISO8601",
  "completedBy": "uuid",
  "completionNotes": "string|null"
}
```

**Consumed By:** analytics-center_v2

### task.overdue

**Schema Version:** 1
**Producer:** system (scheduler)
**Emitted When:** Task due date passes without completion

**Data:**
```json
{
  "dueDate": "ISO8601",
  "daysOverdue": "integer"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

### task.status.changed

**Schema Version:** 1
**Producer:** operations-center_v2
**Emitted When:** Any task status transition

**Data:**
```json
{
  "previousStatus": "enum",
  "newStatus": "enum",
  "changedBy": "uuid"
}
```

**Consumed By:** analytics-center_v2, notification-center_v2 (if assigned)

---

## 10. Customer Events

### customer.created

**Schema Version:** 1
**Producer:** crm-center_v2, customer-portal_v2
**Emitted When:** New customer record created

**Data:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string"
}
```

**Consumed By:** analytics-center_v2

### customer.updated

**Schema Version:** 1
**Producer:** customer-portal_v2
**Emitted When:** Customer info changed

**Data:**
```json
{
  "changedFields": ["string"]
}
```

**Consumed By:** analytics-center_v2

### customer.status.changed

**Schema Version:** 1
**Producer:** crm-center_v2
**Emitted When:** Customer account status changes

**Data:**
```json
{
  "previousStatus": "enum",
  "newStatus": "enum"
}
```

**Consumed By:** accounts_v2 (health trigger), analytics-center_v2

---

## 11. Technician Events

### technician.availability.changed

**Schema Version:** 1
**Producer:** technician-portal_v2
**Emitted When:** Technician toggles availability

**Data:**
```json
{
  "technicianId": "uuid",
  "previousAvailability": "enum",
  "newAvailability": "enum",
  "reason": "string|null"
}
```

**Consumed By:** appointment-center_v2, operations-center_v2, analytics-center_v2

### technician.status.changed

**Schema Version:** 1
**Producer:** admin-center_v2
**Emitted When:** Technician active/inactive status changed

**Data:**
```json
{
  "previousStatus": "enum",
  "newStatus": "enum",
  "changedBy": "uuid"
}
```

**Consumed By:** analytics-center_v2

### technician.assigned

**Schema Version:** 1
**Producer:** appointment-center_v2
**Emitted When:** Technician assigned to appointment

**Data:** (same as appointment.assigned)
**Consumed By:** technician-portal_v2, notification-center_v2, analytics-center_v2

---

## 12. Feedback Events

### feedback.submitted

**Schema Version:** 1
**Producer:** customer-portal_v2, notification-center_v2
**Emitted When:** Customer submits feedback survey

**Data:**
```json
{
  "surveyId": "uuid",
  "customerId": "uuid",
  "overallScore": "float",
  "responseCount": "integer",
  "sentiment": "enum|null",
  "responseRequested": "boolean"
}
```

**Consumed By:** crm-center_v2, analytics-center_v2
**Workflows Triggered:** feedback-analysis_v2

### feedback.response_needed

**Schema Version:** 1
**Producer:** crm-center_v2 (via analyze-feedback-sentiment)
**Emitted When:** Feedback with negative sentiment and response_requested flag

**Data:**
```json
{
  "feedbackId": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "sentiment": "negative",
  "sentimentScore": "float",
  "themes": ["string"],
  "urgency": "enum"
}
```

**Consumed By:** notification-center_v2, analytics-center_v2

---

## 13. Notification Events

### notification.send

**Schema Version:** 1
**Producer:** ALL V2 applications
**Emitted When:** Any app requests a notification

**Data:**
```json
{
  "notificationType": "string",
  "recipientType": "enum",
  "recipientId": "uuid",
  "channel": "enum",
  "templateId": "uuid",
  "variables": {},
  "correlationSourceEvent": "string",
  "correlationSourceId": "uuid|null"
}
```

**Consumed By:** notification-center_v2

### notification.sent

**Schema Version:** 1
**Producer:** notification-center_v2
**Emitted When:** Notification dispatched to provider

**Data:**
```json
{
  "notificationId": "uuid",
  "channel": "enum",
  "providerResponse": "string",
  "sentAt": "ISO8601"
}
```

**Consumed By:** analytics-center_v2

### notification.delivered

**Schema Version:** 1
**Producer:** notification-center_v2
**Emitted When:** Delivery confirmation received from provider

**Data:**
```json
{
  "notificationId": "uuid",
  "deliveredAt": "ISO8601",
  "deliveryConfirmation": "string"
}
```

**Consumed By:** analytics-center_v2

### notification.failed

**Schema Version:** 1
**Producer:** notification-center_v2
**Emitted When:** Permanent delivery failure after max retries

**Data:**
```json
{
  "notificationId": "uuid",
  "channel": "enum",
  "attempts": "integer",
  "errorDetails": "string",
  "failedAt": "ISO8601"
}
```

**Consumed By:** admin-center_v2, analytics-center_v2

### notification.read

**Schema Version:** 1
**Producer:** notification-center_v2, customer-portal_v2
**Emitted When:** Recipient opens/reads notification

**Data:**
```json
{
  "notificationId": "uuid",
  "readAt": "ISO8601"
}
```

**Consumed By:** analytics-center_v2

---

## 14. User & System Events

### user.created

**Schema Version:** 1
**Producer:** admin-center_v2
**Emitted When:** New user account created

**Data:**
```json
{
  "email": "string",
  "fullName": "string",
  "roleId": "uuid",
  "roleName": "string",
  "department": "string|null",
  "createdBy": "uuid"
}
```

**Consumed By:** notification-center_v2

### user.role.changed

**Schema Version:** 1
**Producer:** admin-center_v2
**Emitted When:** User role modified

**Data:**
```json
{
  "userId": "uuid",
  "previousRoleId": "uuid",
  "newRoleId": "uuid",
  "changedBy": "uuid"
}
```

**Consumed By:** (triggers config refresh in all apps)

### user.disabled

**Schema Version:** 1
**Producer:** admin-center_v2
**Emitted When:** User account disabled

**Data:**
```json
{
  "userId": "uuid",
  "disabledBy": "uuid",
  "reason": "string",
  "reassignTicketsTo": "uuid|null"
}
```

**Consumed By:** (triggers auth refresh)

### user.login

**Schema Version:** 1
**Producer:** admin-center_v2 (auth)
**Emitted When:** Successful user login

**Data:**
```json
{
  "userId": "uuid",
  "loginAt": "ISO8601",
  "ipAddress": "string",
  "userAgent": "string"
}
```

**Consumed By:** analytics-center_v2

### system.config.changed

**Schema Version:** 1
**Producer:** admin-center_v2
**Emitted When:** System setting or feature flag modified

**Data:**
```json
{
  "settingKey": "string",
  "previousValue": "any",
  "newValue": "any",
  "category": "enum",
  "changedBy": "uuid",
  "configVersion": "integer"
}
```

**Consumed By:** ALL V2 applications (triggers config refresh)

### system.health.alert

**Schema Version:** 1
**Producer:** system (health monitor)
**Emitted When:** Platform health check failure

**Data:**
```json
{
  "component": "string",
  "severity": "enum",
  "status": "enum",
  "message": "string",
  "detectedAt": "ISO8601"
}
```

**Consumed By:** admin-center_v2, notification-center_v2

### report.generated

**Schema Version:** 1
**Producer:** analytics-center_v2
**Emitted When:** Analytics report generated

**Data:**
```json
{
  "reportId": "uuid",
  "reportName": "string",
  "format": "enum",
  "rowCount": "integer",
  "generatedAt": "ISO8601"
}
```

**Consumed By:** notification-center_v2 (distribute to subscribers)

---

## 15. Workflow Events

### workflow.started

**Schema Version:** 1
**Producer:** workflow engine
**Emitted When:** Workflow instance execution begins

**Data:**
```json
{
  "workflowName": "string",
  "instanceId": "uuid",
  "triggerEvent": "string",
  "triggerEntityType": "string",
  "triggerEntityId": "uuid",
  "startedAt": "ISO8601",
  "inputSummary": "object"
}
```

**Consumed By:** analytics-center_v2, admin-center_v2 (monitoring)

### workflow.completed

**Schema Version:** 1
**Producer:** workflow engine
**Emitted When:** Workflow instance completes successfully

**Data:**
```json
{
  "workflowName": "string",
  "instanceId": "uuid",
  "durationMs": "integer",
  "nodeCount": "integer",
  "completedAt": "ISO8601",
  "finalState": "object"
}
```

**Consumed By:** analytics-center_v2, admin-center_v2 (monitoring)

### workflow.failed

**Schema Version:** 1
**Producer:** workflow engine
**Emitted When:** Workflow instance fails unrecoverably

**Data:**
```json
{
  "workflowName": "string",
  "instanceId": "uuid",
  "failedNode": "string",
  "errorMessage": "string",
  "failedAt": "ISO8601"
}
```

**Consumed By:** admin-center_v2, notification-center_v2 (alert admin)

### workflow.paused

**Schema Version:** 1
**Producer:** workflow engine
**Emitted When:** Workflow instance waiting for human input

**Data:**
```json
{
  "workflowName": "string",
  "instanceId": "uuid",
  "awaitingAction": "string",
  "assignedTo": "uuid",
  "pausedAt": "ISO8601",
  "timeoutAt": "ISO8601"
}
```

**Consumed By:** notification-center_v2 (notify assigned user), analytics-center_v2

---

## 16. Agent Events

### agent.started

**Schema Version:** 1
**Producer:** agent runtime
**Emitted When:** Agent invocation begins

**Data:**
```json
{
  "agentName": "string",
  "invocationId": "uuid",
  "triggerSource": "enum",
  "triggerEntityType": "string",
  "triggerEntityId": "uuid",
  "inputSummary": "object",
  "startedAt": "ISO8601"
}
```

**Consumed By:** analytics-center_v2

### agent.completed

**Schema Version:** 1
**Producer:** agent runtime
**Emitted When:** Agent finishes successfully

**Data:**
```json
{
  "agentName": "string",
  "invocationId": "uuid",
  "durationMs": "integer",
  "outputSummary": "object",
  "confidence": "float|null",
  "completedAt": "ISO8601"
}
```

**Consumed By:** analytics-center_v2, admin-center_v2 (monitoring)

### agent.failed

**Schema Version:** 1
**Producer:** agent runtime
**Emitted When:** Agent invocation fails

**Data:**
```json
{
  "agentName": "string",
  "invocationId": "uuid",
  "errorMessage": "string",
  "errorType": "enum",
  "failedAt": "ISO8601"
}
```

**Consumed By:** admin-center_v2, notification-center_v2 (alert admin)

### agent.low_confidence

**Schema Version:** 1
**Producer:** agent runtime
**Emitted When:** Agent returns result below confidence threshold

**Data:**
```json
{
  "agentName": "string",
  "invocationId": "uuid",
  "confidence": "float",
  "threshold": "float",
  "fallbackAction": "string"
}
```

**Consumed By:** analytics-center_v2
