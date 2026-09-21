# RESQAI V2 — Enterprise Business Flows

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [Flow Definition Template](#1-flow-definition-template)
2. [Ticket Lifecycle Flow](#2-ticket-lifecycle-flow)
3. [Appointment Lifecycle Flow](#3-appointment-lifecycle-flow)
4. [Technician Lifecycle Flow](#4-technician-lifecycle-flow)
5. [Customer Lifecycle Flow](#5-customer-lifecycle-flow)
6. [CRM Lifecycle Flow](#6-crm-lifecycle-flow)
7. [Resolution Lifecycle Flow](#7-resolution-lifecycle-flow)
8. [Escalation Lifecycle Flow](#8-escalation-lifecycle-flow)
9. [Notification Lifecycle Flow](#9-notification-lifecycle-flow)
10. [Reporting Lifecycle Flow](#10-reporting-lifecycle-flow)
11. [Administration Lifecycle Flow](#11-administration-lifecycle-flow)

---

## 1. Flow Definition Template

Each flow step conforms to this contract:

| Field | Description |
|-------|-------------|
| **Step** | Sequential step number within the flow |
| **Application** | Responsible application |
| **Actor** | Person, system, or agent performing the action |
| **Input** | Data or event that triggers this step |
| **Output** | Data or event produced by this step |
| **DB Interaction** | Table(s) read/written |
| **Function** | Backend function invoked |
| **Agent** | AI agent invoked (if any) |
| **Workflow** | Workflow triggered (if any) |
| **Event** | Domain event emitted |
| **Notification** | Notification sent |
| **Permission** | Required permission |

---

## 2. Ticket Lifecycle Flow

### Overview
A customer support ticket enters the system, gets classified, drafted, approved, sent, and closed — with escalation paths for complex or urgent issues.

### Flow Diagram

```
customer-portal_v2    support-center_v2       operations-center_v2     notification-center_v2
     |                     |                        |                         |
     |--1. Create Ticket-->|                        |                         |
     |                     |--2. Classify Ticket    |                         |
     |                     |--3. Check Urgency------>|                        |
     |                     |                        |                         |
     |                     |--4. Draft Reply        |                         |
     |                     |--5. Approve Reply      |                         |
     |                     |                        |                         |
     |<--6. Reply Sent-----|------------------------|--7. Send Notification-->|
     |                     |                        |                         |
     |<--8. Close Ticket---|                        |                         |
     |                     |                        |                         |
     |                     |--9. Trigger Survey---->|                         |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | customer-portal_v2 | Customer | Subject, message, request type, channel | New ticket record | INSERT tickets_v2 | validate-ticket-input | — | ticket-intake_v2 | ticket.created | Confirmation to customer | create_ticket |
| 2 | support-center_v2 | Support Agent / Classifier AI | ticket.created event | Classification (type, urgency, sla_tier) | UPDATE tickets_v2 (classification) | check-ticket-urgency | request-classifier_v2 | — | ticket.classified | — | view_tickets |
| 3 | operations-center_v2 | System | Urgent/critical classification | Dispatch trigger | READ tickets_v2 | check-ticket-urgency | — | urgent-dispatch_v2 | ticket.urgent_dispatched | Urgent alert to Ops | manage_dispatch |
| 4 | support-center_v2 | Support Reply Drafter AI | Classified ticket | Draft reply content | UPDATE tickets_v2 (draft), INSERT ticket_messages_v2 | update-ticket-record | support-reply-drafter_v2 | — | ticket.reply.drafted | — | draft_reply |
| 5 | support-center_v2 | Support Manager | Draft reply | Approval or rejection | UPDATE tickets_v2 (status) | update-ticket-record | — | — | ticket.reply.approved / ticket.reply.rejected | — | approve_reply |
| 6 | support-center_v2 | System | Approval | Sent reply | UPDATE tickets_v2 (status = sent) | update-ticket-record | — | — | ticket.sent | Reply delivered to customer | send_reply |
| 7 | notification-center_v2 | System | ticket.sent event | Email/in-app notification to customer | INSERT notifications_v2 | dispatch-notifications | — | notification-delivery_v2 | notification.delivered | Confirmation to customer | — |
| 8 | customer-portal_v2 | Customer | Close request or auto-close | Closed ticket | UPDATE tickets_v2 (status = closed) | update-ticket-record | — | — | ticket.closed | Closure notification | close_ticket |
| 9 | crm-center_v2 | System | ticket.closed event | Survey trigger | INSERT feedback_surveys_v2 | dispatch-notifications | cx-satisfaction-survey_v2 | customer-satisfaction-monitor_v2 | feedback.survey.sent | CSAT survey to customer | — |

### Decision Points
- **DP-T1:** Urgency determination (normal / urgent / critical) — Step 3
- **DP-T2:** Confidence threshold for AI draft (>= 0.75 auto-route) — Step 4
- **DP-T3:** Approval status (approved / rejected / needs-revision) — Step 5
- **DP-T4:** Close directly vs. escalate — Step 8

### Approval Points
- **AP-T1:** Human Support Manager must approve AI-drafted reply before sending

### Escalation Rules
- SLA breach at any stage → auto-escalate to Support Manager AI
- AI confidence < 0.70 → human escalation at Step 4
- No approval within 4 hours → escalate to Operations Manager

---

## 3. Appointment Lifecycle Flow

### Overview
A service appointment is booked, confirmed, executed by a technician, and closed with follow-up actions.

### Flow Diagram

```
customer-portal_v2    appointment-center_v2    technician-portal_v2    operations-center_v2    notification-center_v2
     |                       |                       |                       |                       |
     |--1. Book Appointment->|                       |                       |                       |
     |                       |--2. Suggest Technician|                       |                       |
     |                       |--3. Assign Technician-|--4. Notify Tech------>|                       |
     |<--5. Confirm Appt-----|                       |                       |                       |
     |                       |                       |--6. Start Travel----->|--7. Send Reminder---->|
     |                       |                       |                       |                       |
     |                       |                       |--8. Arrive On Site    |                       |
     |                       |                       |--9. Complete Work     |                       |
     |                       |                       |--10. Submit Report    |                       |
     |                       |--11. Generate WO------|                       |                       |
     |<--12. Survey Sent-----|                       |                       |                       |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | customer-portal_v2 | Customer | Service type, date/time, address | Appointment record | INSERT appointments_v2 | assign-appointment-technician | — | appointment-booking_v2 | appointment.created | Booking confirmation | book_appointment |
| 2 | appointment-center_v2 | Scheduling Agent AI | Appointment created | Technician suggestion | READ technicians_v2, technician_skills_v2 | — | tech-suggester_v2 | — | — | — | view |
| 3 | appointment-center_v2 | System | Suggestion accepted | Assigned technician | UPDATE appointments_v2 (technician_id) | assign-appointment-technician | — | appointment-assignment_v2 | appointment.assigned | Assignment to tech | edit |
| 4 | technician-portal_v2 | System | appointment.assigned | Schedule update | — | dispatch-notifications | — | — | — | New job notification (push) | view_schedule |
| 5 | customer-portal_v2 | Customer | Confirmation request | Confirmed appointment | UPDATE appointments_v2 (status = confirmed) | — | — | — | appointment.confirmed | Confirmation receipt | book_appointment |
| 6 | technician-portal_v2 | Technician | Start travel action | Travel status | INSERT work_order_stages_v2 | — | — | work-order-fulfillment_v2 | work_order.travelling | — | update_status |
| 7 | notification-center_v2 | System | 2h reminder trigger | Reminder delivery | INSERT notifications_v2 | dispatch-notifications | notification-channel-optimizer_v2 | appointment-reminders_v2 | appointment.reminder.sent | Reminder to customer + tech | — |
| 8 | technician-portal_v2 | Technician | Arrive action | On-site status | UPDATE work_order_stages_v2 | — | — | — | work_order.on_site | — | update_status |
| 9 | technician-portal_v2 | Technician | Complete action | Completed work order | UPDATE work_orders_v2 (status = completed) | — | — | — | work_order.completed | — | update_status |
| 10 | technician-portal_v2 | Technician | Completion notes + photos | Work report | INSERT into work_order_notes_v2 | — | — | appointment-completion_v2 | appointment.completed | — | update_status |
| 11 | operations-center_v2 | System | appointment.completed | Work order record | INSERT work_orders_v2 | create-operations-tasks | operations-work-order-manager_v2 | work-order-fulfillment_v2 | work_order.created | WO notification to Ops | manage_tasks |
| 12 | notification-center_v2 | System | Service complete | Survey to customer | INSERT feedback_surveys_v2 | dispatch-notifications | cx-satisfaction-survey_v2 | customer-satisfaction-monitor_v2 | feedback.survey.sent | CSAT survey | — |

### Decision Points
- **DP-A1:** Technician availability (available / backup / none) — Step 2
- **DP-A2:** Customer confirmation (confirmed / reschedule / cancel) — Step 5
- **DP-A3:** Completion type (complete / needs_followup) — Step 9
- **DP-A4:** Reminder timing (24h / 2h / 30min) — Step 7

### Approval Points
- **AP-A1:** None (appointment is deterministic; technician suggestion is recommendation)

### Escalation Rules
- No technician available within 48h → Scheduling Manager AI
- Customer declines all options 3 times → Appointment Manager AI
- Job stalled > 4h at any work order stage → Work Order Manager AI

---

## 4. Technician Lifecycle Flow

### Overview
A technician progresses through their workday: availability management, job assignment, field execution, and completion reporting.

### Flow Diagram

```
technician-portal_v2    appointment-center_v2    operations-center_v2    admin-center_v2    notification-center_v2
     |                       |                       |                    |                    |
     |--1. Clock In -------->|                       |                    |                    |
     |                       |                       |--2. View Workload  |                    |
     |                       |                       |                    |                    |
     |<--3. Job Assigned-----|                       |                    |                    |
     |                       |                       |                    |                    |
     |--4. Accept Dispatch-->|                       |                    |                    |
     |                       |                       |                    |                    |
     |--5. En Route--------->|                       |                    |                    |
     |                       |                       |                    |                    |
     |--6. On Site---------->|                       |                    |                    |
     |                       |                       |                    |                    |
     |--7. Start Work------->|                       |                    |                    |
     |                       |                       |                    |                    |
     |--8. Complete Job----->|                       |                    |                    |
     |                       |                       |                    |                    |
     |--9. Submit Report---->|                       |                    |                    |
     |                       |                       |--10. Update Metrics|                    |
     |                       |                       |                    |--11. Log Activity->|
     |--12. Clock Out------->|                       |                    |                    |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | technician-portal_v2 | Technician | Clock-in action | Available status | UPDATE technicians_v2 (availability = available) | — | — | — | technician.availability.changed | — | manage_schedule |
| 2 | operations-center_v2 | Operations Manager | View request | Technician workload data | READ technicians_v2, appointments_v2, tasks_v2 | — | operations-coordinator_v2 | — | — | — | view_technicians |
| 3 | technician-portal_v2 | System | Appointment assignment | Job assigned notification | — | dispatch-notifications | — | appointment-assignment_v2 | appointment.assigned | New job alert (push/SMS) | view_schedule |
| 4 | technician-portal_v2 | Technician | Accept dispatch | Acknowledged dispatch | UPDATE dispatches_v2 (status = acknowledged) | — | — | — | dispatch.acknowledged | — | update_status |
| 5 | technician-portal_v2 | Technician | En route action | Travelling status | INSERT work_order_stages_v2 (stage = travelling) | — | — | work-order-fulfillment_v2 | work_order.travelling | — | update_status |
| 6 | technician-portal_v2 | Technician | On-site action (GPS) | On-site status | INSERT work_order_stages_v2 (stage = on_site) | — | — | — | work_order.on_site | Arrival to customer | update_status |
| 7 | technician-portal_v2 | Technician | Start work action | Working status | INSERT work_order_stages_v2 (stage = working) | — | — | — | work_order.working | — | update_status |
| 8 | technician-portal_v2 | Technician | Complete job action | Completed status | UPDATE work_orders_v2 (status = completed), INSERT work_order_stages_v2 | — | — | work-order-fulfillment_v2 | work_order.completed | — | update_status |
| 9 | technician-portal_v2 | Technician | Report submission | Work report record | INSERT work_order_notes_v2, inventory_transactions_v2 | — | — | appointment-completion_v2 | appointment.completed | — | update_status |
| 10 | operations-center_v2 | System | work_order.completed | KPI update | UPDATE analytics aggregates | calculate-dispatch-priority | — | daily-standup_v2 | — | — | view_dashboard |
| 11 | admin-center_v2 | System | Technician activity | Audit log entry | INSERT audit_log_v2 | log-audit-event | — | — | audit.entry.created | — | view_audit |
| 12 | technician-portal_v2 | Technician | Clock-out action | Off-shift status | UPDATE technicians_v2 (availability = off_shift) | — | — | — | technician.availability.changed | — | manage_schedule |

### Decision Points
- **DP-TC1:** Job acceptance (accept / decline / timeout) — Step 4
- **DP-TC2:** Completion type (complete / needs_followup / parts_needed) — Step 8

### Approval Points
- **AP-TC1:** None (technician actions are self-directed)

### Escalation Rules
- Dispatch not acknowledged within 10min (urgent) / 30min (standard) → Dispatch Manager AI
- 2+ declines on same dispatch → Dispatch Manager AI reassignment
- No stage progress > 4h → Work Order Manager AI escalation
- Technician idle > 30min between jobs → Operations Coordinator AI notify manager

---

## 5. Customer Lifecycle Flow

### Overview
A customer enters the system, receives service, provides feedback, and is retained or churned based on ongoing health monitoring.

### Flow Diagram

```
customer-portal_v2    support-center_v2    appointment-center_v2    crm-center_v2    notification-center_v2
     |                     |                      |                    |                    |
     |--1. Register------->|                      |                    |                    |
     |                     |                      |                    |--2. Create Profile |
     |--3. Create Ticket-->|                      |                    |                    |
     |                     |--4. Service Delivered|                    |                    |
     |                     |                      |--5. Appointment    |                    |
     |                     |                      |    Completed       |                    |
     |                     |                      |                    |--6. Health Scan--->|
     |<--7. Survey---------|                      |                    |                    |
     |--8. Submit Feedback>|                      |                    |                    |
     |                     |                      |                    |--9. Update Health->|
     |                     |                      |                    |                    |
     |                     |                      |                    |--10. Risk Assess-->|
     |<--11. Retention-----|                      |                    |                    |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | customer-portal_v2 | Prospect | Registration form (name, email, phone, address) | Customer record | INSERT customers_v2, INSERT accounts_v2 | validate-ticket-input | — | — | customer.created | Welcome email | public |
| 2 | crm-center_v2 | System | customer.created | Account profile | INSERT accounts_v2 (health = healthy) | account-health-scan | — | account-health-scan_v2 | account.health.scan.completed | — | view_accounts |
| 3 | customer-portal_v2 | Customer | Subject, description, request type | Ticket record | INSERT tickets_v2 | validate-ticket-input | — | ticket-intake_v2 | ticket.created | Ticket confirmation | create_ticket |
| 4 | support-center_v2 | Support System | Ticket lifecycle | Resolution | UPDATE tickets_v2 (status = closed) | update-ticket-record | support-reply-drafter_v2 | ticket-intake_v2 | ticket.closed | Resolution notification | view_tickets |
| 5 | appointment-center_v2 | Technician | Appointment execution | Completion | UPDATE appointments_v2 (status = completed) | — | — | appointment-completion_v2 | appointment.completed | — | update_status |
| 6 | crm-center_v2 | System | Service event completed | Health scan trigger | INSERT account_health_scans_v2 | account-health-scan | account-health-monitor_v2 | account-health-scan_v2 | account.health.changed | — | run_scans |
| 7 | notification-center_v2 | System | Appointment/ticket closed | Survey delivery | INSERT feedback_surveys_v2 | dispatch-notifications | cx-satisfaction-survey_v2 | customer-satisfaction-monitor_v2 | feedback.survey.sent | CSAT/NPS survey | — |
| 8 | customer-portal_v2 | Customer | Survey response | Feedback record | INSERT feedback_v2 | — | — | feedback-analysis_v2 | feedback.submitted | — | — |
| 9 | crm-center_v2 | System | feedback.submitted | Health score update | UPDATE accounts_v2 (health_score) | account-health-scan | crm-account-health-monitor_v2 | — | account.health.changed | Health alert to CRM | run_scans |
| 10 | crm-center_v2 | System | Health scan results | Risk assessment | UPDATE accounts_v2 (risk_signals) | flag-slipping-followups | — | — | account.risk.signal.detected | Risk alert | run_scans |
| 11 | notification-center_v2 | System | At-risk health status | Retention campaign | INSERT notifications_v2, followups_v2 | create-followup-tasks | crm-retention-specialist_v2 | retention-campaign_v2 | campaign.created | Win-back offer | — |

### Decision Points
- **DP-C1:** Customer registration validation (unique email, required fields) — Step 1
- **DP-C2:** Feedback sentiment (positive / neutral / negative) — Step 8
- **DP-C3:** Account health category (healthy / watch / slipping / critical) — Step 9
- **DP-C4:** Retention campaign needed? (yes / no based on health) — Step 11

### Approval Points
- **AP-C1:** None (customer lifecycle is mostly automated)

### Escalation Rules
- Health drops to critical → Immediate CRM Manager alert
- Extremely negative feedback (< 3/5) → CX Manager immediate notification
- Customer feedback survey not responded within 7 days → survey auto-closes
- Account dormant > 90 days → auto-churn flag with CRM review

---

## 6. CRM Lifecycle Flow

### Overview
Account health is continuously monitored, followups are managed, and retention campaigns are executed for at-risk accounts.

### Flow Diagram

```
crm-center_v2    notification-center_v2    support-center_v2    operations-center_v2    analytics-center_v2
     |                    |                    |                    |                    |
     |--1. Schedule       |                    |                    |                    |
     |    Health Scan     |                    |                    |                    |
     |                    |                    |                    |                    |
     |--2. Scan All       |                    |                    |                    |
     |    Accounts------->|                    |                    |                    |
     |                    |                    |                    |                    |
     |--3. Identify       |                    |                    |                    |
     |    Risk Signals    |                    |                    |                    |
     |                    |                    |                    |                    |
     |--4. Process        |                    |                    |                    |
     |    Risk Signals    |                    |                    |                    |
     |                    |                    |                    |                    |
     |--5. Create         |                    |                    |                    |
     |    Followups       |                    |                    |                    |
     |                    |--6. Notify         |                    |                    |
     |                    |    Followup Owner  |                    |                    |
     |                    |                    |                    |                    |
     |--7. Track          |                    |                    |                    |
     |    Followup Status |                    |                    |                    |
     |                    |                    |                    |                    |
     |--8. Detect         |                    |                    |                    |
     |    Slippage        |                    |                    |                    |
     |                    |--9. Slippage       |                    |                    |
     |                    |    Alert          |                    |                    |
     |                    |                    |                    |                    |
     |--10. Execute       |                    |                    |                    |
     |     Retention      |--11. Win-back Msg  |                    |                    |
     |                    |                    |                    |--12. Update KPIs   |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | crm-center_v2 | System | Cron (daily 2AM) | Health scan start | — | account-health-scan | — | account-health-scan_v2 | account.health.scan.completed | — | run_scans |
| 2 | crm-center_v2 | System | Active accounts list | Scored accounts | READ accounts_v2, READ appointments_v2, READ disputes_v2, READ feedback_v2 | account-health-scan | account-health-monitor_v2 | — | — | — | run_scans |
| 3 | crm-center_v2 | Account Health Monitor AI | Scan results | Risk signal detection | UPDATE accounts_v2 (risk_signals, health_score) | account-health-scan | crm-account-health-monitor_v2 | — | account.risk.signal.detected | Risk alert | run_scans |
| 4 | crm-center_v2 | CRM Manager | Risk signals | Action plan | INSERT operations_log_v2 | flag-slipping-followups | crm-followup-manager_v2 | — | — | — | manage_accounts |
| 5 | crm-center_v2 | System | Risk assessment | Followup items | INSERT followups_v2 | create-followup-tasks | — | followup-management_v2 | followup.created | — | manage_accounts |
| 6 | notification-center_v2 | System | followup.created | Followup assignment | INSERT notifications_v2 | dispatch-notifications | — | notification-delivery_v2 | notification.sent | Followup assignment | — |
| 7 | crm-center_v2 | CRM Agent | Followup execution | Status update | UPDATE followups_v2 (status) | — | — | followup-management_v2 | followup.completed | — | manage_accounts |
| 8 | crm-center_v2 | System | Cron (weekdays 6AM) | Slippage detection | READ followups_v2 | flag-slipping-followups | — | followup-slippage-detector_v2 | followup.slippage.detected | — | view_dashboard |
| 9 | notification-center_v2 | System | followup.slippage.detected | Overdue alert | INSERT notifications_v2 | dispatch-notifications | — | notification-delivery_v2 | notification.sent | Slippage alert | — |
| 10 | crm-center_v2 | Retention Specialist AI | At-risk account | Campaign execution | INSERT followups_v2, INSERT notifications_v2 | create-followup-tasks | crm-retention-specialist_v2 | retention-campaign_v2 | campaign.started | — | manage_accounts |
| 11 | notification-center_v2 | System | campaign.started | Win-back offer delivery | INSERT notifications_v2 | dispatch-notifications | — | notification-delivery_v2 | notification.sent | Win-back offer | — |
| 12 | analytics-center_v2 | System | Campaign results | KPI update | UPDATE analytics aggregates | batch-metric-aggregation | trend-analyzer_v2 | trend-analysis_v2 | analytics.trend.identified | — | view_executive |

### Decision Points
- **DP-CRM1:** Health scan schedule (daily / on-demand) — Step 1
- **DP-CRM2:** Risk signal identification (true positive / false positive) — Step 3
- **DP-CRM3:** Followup completion (completed / missed / cancelled) — Step 7
- **DP-CRM4:** Slippage severity (mild / moderate / critical) — Step 8
- **DP-CRM5:** Campaign type (retention / win-back / standard) — Step 10

### Approval Points
- **AP-CRM1:** Financial offers > $500 require human approval before sending

### Escalation Rules
- Missed followup > 7 days → CRM Manager AI
- VIP account health drops to critical → Executive Director AI
- Repeated slippage on same account → CRM Manager AI intervention
- Campaign no-response after 3 attempts → CRM Manager AI review

---

## 7. Resolution Lifecycle Flow

### Overview
A service dispute is filed, analyzed by AI, reviewed by a human, and resolved or escalated.

### Flow Diagram

```
customer-portal_v2    resolution-center_v2    crm-center_v2    notification-center_v2    admin-center_v2
     |                     |                    |                    |                    |
     |--1. File Dispute--->|                    |                    |                    |
     |                     |--2. Collect        |                    |                    |
     |                     |    Evidence        |                    |                    |
     |                     |                    |                    |                    |
     |                     |--3. AI Analysis--->|                    |                    |
     |                     |                    |                    |                    |
     |                     |--4. Compliance     |                    |                    |
     |                     |    Check          |                    |                    |
     |                     |                    |                    |                    |
     |                     |--5. Recommend      |                    |                    |
     |                     |    Resolution      |                    |                    |
     |                     |                    |                    |                    |
     |                     |--6. Human          |                    |                    |
     |                     |    Review          |                    |                    |
     |                     |                    |                    |                    |
     |                     |--7. Approve /      |                    |                    |
     |                     |    Reject          |                    |                    |
     |                     |                    |                    |                    |
     |                     |--8. Apply          |                    |                    |
     |                     |    Resolution      |                    |                    |
     |                     |                    |--9. Update Health  |                    |
     |                     |                    |                    |--10. Notify        |
     |<--11. Status Update-|                    |                    |    Customer        |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | customer-portal_v2 | Customer | Dispute filing (appointment_id, reason, evidence) | Dispute record | INSERT disputes_v2, INSERT dispute_evidence_v2 | — | — | dispute-resolution_v2 | dispute.created | Filing confirmation | view_disputes |
| 2 | resolution-center_v2 | Resolution Agent | Dispute ID | Collected evidence | READ appointments_v2, READ tickets_v2, READ customers_v2 | — | — | — | — | — | view_disputes |
| 3 | resolution-center_v2 | Resolution Advisor AI | Evidence + context | Analysis with confidence score | INSERT disputes_v2 (analysis) | — | resolution-advisor_v2 | dispute-resolution_v2 | dispute.analyzed | — | analyze |
| 4 | resolution-center_v2 | Compliance Monitor AI | Analysis results | Compliance check result | READ system_settings_v2 | — | qa-compliance-monitor_v2 | — | — | — | analyze |
| 5 | resolution-center_v2 | Resolution Advisor AI | Analysis + compliance | Resolution recommendation | UPDATE disputes_v2 (recommendation) | — | resolution-advisor_v2 | — | dispute.recommendation.ready | — | analyze |
| 6 | resolution-center_v2 | Resolution Manager | Recommendation | Review decision | — | — | — | — | — | Pending review notification | approve |
| 7 | resolution-center_v2 | Resolution Manager | Approve / Reject action | Decision record | UPDATE disputes_v2 (status = approved / rejected) | — | — | — | dispute.approved / dispute.rejected | Decision notification | approve |
| 8 | resolution-center_v2 | System | Approval | Resolution applied | UPDATE disputes_v2 (status = closed) | resolve-dispute | — | — | dispute.resolved | Resolution applied | approve |
| 9 | crm-center_v2 | System | dispute.resolved | Account health update | UPDATE accounts_v2 (health_score) | account-health-scan | crm-account-health-monitor_v2 | account-health-scan_v2 | account.health.changed | — | run_scans |
| 10 | notification-center_v2 | System | dispute.resolved | Resolution notification | INSERT notifications_v2 | dispatch-notifications | — | notification-delivery_v2 | notification.sent | Dispute outcome | — |
| 11 | customer-portal_v2 | System | dispute.resolved | Status display | — | — | — | — | — | In-app status update | — |

### Decision Points
- **DP-R1:** AI confidence threshold (>= 0.80 fast-track / 0.50-0.79 standard / < 0.50 urgent escalate) — Step 3
- **DP-R2:** Compliance pass/fail — Step 4
- **DP-R3:** Human approval (approved / rejected / needs-revision) — Step 7
- **DP-R4:** Resolution type (refund / re-service / credit / waiver) — Step 5

### Approval Points
- **AP-R1:** ALL dispute resolutions require human approval before execution
- **AP-R2:** Disputes with compensation > $1000 require Senior Manager approval
- **AP-R3:** Escalation to legal requires Human Executive approval

### Escalation Rules
- AI confidence < 0.50 → Immediate human Resolution Manager review
- Human does not review within 24h → auto-reminder at 12h, escalate at 24h
- Dispute re-opened twice → escalate to Platform Orchestrator AI
- Legal/compliance flag → automatic hold + Admin notification

---

## 8. Escalation Lifecycle Flow

### Overview
Any entity (ticket, dispute, task, SLA) can trigger escalation through defined tiers with increasing authority and response urgency.

### Flow Diagram

```
support-center_v2    operations-center_v2    resolution-center_v2    admin-center_v2    notification-center_v2
     |                     |                    |                    |                    |
     |--1. Escalation      |                    |                    |                    |
     |    Triggered         |                    |                    |                    |
     |                     |                    |                    |                    |
     |--2. Determine        |                    |                    |                    |
     |    Escalation Level  |                    |                    |                    |
     |                     |                    |                    |                    |
     |--3. L1: Support     |                    |                    |                    |
     |    Manager AI------->|                    |                    |                    |
     |                     |                    |                    |                    |
     |--4. L2: Operations  |                    |                    |                    |
     |    Manager AI------->|                    |                    |                    |
     |                     |--5. L3: Platform   |                    |                    |
     |                     |    Orchestrator AI>|                    |                    |
     |                     |                    |--6. L4: Human Exec |                    |
     |                     |                    |    Director------->|                    |
     |                     |                    |                    |                    |
     |                     |                    |                    |--7. Audit          |
     |                     |                    |                    |    Escalation Chain|
     |                     |                    |                    |                    |
     |<--8. Resolution------|                    |                    |                    |
     |     Delegated Back  |                    |                    |                    |
     |                     |                    |                    |                    |
     |                     |                    |                    |--9. Log to Events  |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | support-center_v2 | System | Escalation trigger (SLA breach, low confidence, customer complaint) | Escalation start | — | check-ticket-urgency | — | ticket-escalation_v2 | ticket.escalated | Escalation notification | escalate |
| 2 | support-center_v2 | Escalation Manager AI | Trigger + context | Escalation level determination | READ tickets_v2, READ system_settings_v2 | update-ticket-record | support-escalation-manager_v2 | — | — | — | escalate |
| 3 | operations-center_v2 | Support Manager AI | L1 escalation | L1 resolution attempt | UPDATE tickets_v2 (escalation_level = 1) | — | support-manager_v2 | — | ticket.escalated.level2 | L1 notification | manage_queues |
| 4 | operations-center_v2 | Operations Manager AI | L2 escalation (timeout or failure) | L2 resolution attempt | UPDATE tickets_v2 (escalation_level = 2) | create-operations-tasks | operations-manager_v2 | — | ticket.escalated.level3 | L2 notification | view_dashboard |
| 5 | resolution-center_v2 / admin-center_v2 | Platform Orchestrator AI | L3 escalation | L3 resolution attempt | UPDATE tickets_v2 (escalation_level = 3) | — | platform-orchestrator_v2 | dispute-escalation_v2 | ticket.escalated.executive | L3 notification | manage_settings |
| 6 | admin-center_v2 | Human Executive Director | L4 escalation (executive) | Executive decision | UPDATE tickets_v2 (escalation_level = 4) | — | executive-director_v2 | — | escalation.resolved | Executive notification | manage_users |
| 7 | admin-center_v2 | System | Escalation resolution | Audit record | INSERT audit_log_v2 | log-audit-event | — | — | audit.entry.created | — | view_audit |
| 8 | support-center_v2 | System | Resolution decision | Delegated back to origin | UPDATE tickets_v2 (status, escalation_level = 0) | update-ticket-record | — | — | ticket.escalation.resolved | Resolution notification | view_tickets |
| 9 | admin-center_v2 | System | Full escalation chain | Event log | INSERT events_v2 | — | — | — | system.escalation.chain.completed | — | view_audit |

### Decision Points
- **DP-E1:** Escalation level determination (L1/L2/L3/L4/Legal) — Step 2
- **DP-E2:** Escalation type (SLA / technical / financial / compliance) — Step 2
- **DP-E3:** Response received vs. timeout — Step 3-6
- **DP-E4:** Resolution vs. further escalation — Step 8

### Approval Points
- **AP-E1:** L3 escalation requires department head acknowledgment
- **AP-E2:** L4 (Legal) escalation requires Human Executive approval

### Escalation Tiers

| Tier | Responsible | Response Time | Authority | Example |
|------|-------------|:-------------:|-----------|---------|
| L0 | Support Manager AI | Auto-immediate | AI-driven reassignment | Low confidence classification |
| L1 | Support Manager AI | 10min | Queue reassignment, SLA override | SLA breach warning |
| L2 | Operations Manager AI | 30min | Tech reassignment, priority override | No tech available |
| L3 | Platform Orchestrator AI | 2h | Cross-domain coordination, config change | System-wide issue |
| L4 | Human Executive Director | 24h | Financial approval, legal escalation | Lawsuit, $10K+ compensation |
| Legal | Legal Counsel | 48h | Legal action | Regulatory complaint |

### Escalation Rules
- Each tier has a hard timeout; no response = auto-escalate to next tier
- Emergency severity triggers parallel escalation to ALL tiers simultaneously
- Once resolved, entity is delegated back to origin with resolution notes
- Escalation chain is immutable and fully audited

---

## 9. Notification Lifecycle Flow

### Overview
All outbound communications from any workflow or application are routed through the notification center for channel optimization, delivery tracking, and fallback handling.

### Flow Diagram

```
ALL Applications    notification-center_v2    External Services
     |                     |                    |
     |--1. Send            |                    |
     |    Notification---->|                    |
     |                     |--2. Channel        |
     |                     |    Optimization    |
     |                     |                    |
     |                     |--3. Template       |
     |                     |    Rendering       |
     |                     |                    |
     |                     |--4. Deliver via    |
     |                     |    Primary Channel>|
     |                     |                    |
     |                     |<--5. Delivery      |
     |                     |    Receipt         |
     |                     |                    |
     |                     |--6. Log Delivery   |
     |                     |    Status          |
     |                     |                    |
     |                     |--7. Track Read     |
     |<--8. Status Back----|                    |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | Any source app | Any actor | notification.send action | Notification request | INSERT notifications_v2 (pending) | dispatch-notifications | — | notification-delivery_v2 | notification.send | — | — |
| 2 | notification-center_v2 | Channel Optimizer AI | Notification request | Channel order (primary/fallback/fallback2) | READ notification_channels_v2, READ notification_templates_v2 | — | notification-channel-optimizer_v2 | — | — | — | — |
| 3 | notification-center_v2 | Template Manager AI | Channel + template ID | Rendered message | READ notification_templates_v2 | — | notification-template-manager_v2 | — | — | — | — |
| 4 | notification-center_v2 | System | Rendered message + channel | API call to external provider | — | dispatch-notifications | — | — | notification.sent | OUTBOUND via email/SMS/push | — |
| 5 | notification-center_v2 | External Provider | Delivery receipt | Delivery confirmation | — | — | — | — | — | — | — |
| 6 | notification-center_v2 | System | Provider callback | Delivery status update | UPDATE notifications_v2 (status = delivered / failed) | — | — | — | notification.delivered / notification.failed | — | — |
| 7 | notification-center_v2 | System | Delivery confirmed | Read receipt tracking | UPDATE notifications_v2 (read_at) | — | — | — | notification.read | — | — |
| 8 | Source application | System | notification.delivered/failed | Callback to origin app | — | — | — | — | — | In-app notification status | — |

### Decision Points
- **DP-N1:** Channel selection (in-app / email / SMS / push / discord) — Step 2
- **DP-N2:** Template selection based on notification type — Step 3
- **DP-N3:** Delivery status (sent / delivered / failed) — Step 6
- **DP-N4:** Retry decision (retry / channel fallback / permanent failure) — Step 4-6

### Approval Points
- **AP-N1:** None (notifications are fully automated)

### Escalation Rules
- Delivery failure after 3 retries → fallback to next channel
- All channels exhausted → Notification Manager AI alert
- Critical notification failure (SLA breach, security alert) → escalate to Platform Orchestrator

### Notification Types

| Type | Priority | Primary Channel | Fallback | SLA |
|------|----------|-----------------|----------|:---:|
| SLA Breach Warning | Critical | In-app + Email | SMS + Discord | 30s |
| Dispatch Assignment | Urgent | Push + SMS | Email | 10s |
| Appointment Reminder | Standard | Email | SMS | 60s |
| Survey Invitation | Low | Email | In-app | 5min |
| Report Delivery | Low | Email | In-app | 15min |
| System Alert | Critical | Discord + Email | SMS | 30s |

---

## 10. Reporting Lifecycle Flow

### Overview
Business data is aggregated from all domains, analyzed for trends, compiled into reports, and distributed to stakeholders.

### Flow Diagram

```
ALL Applications    analytics-center_v2    notification-center_v2    External Services
     |                    |                    |                    |
     |--1. Emit Events--->|                    |                    |
     |                    |--2. Aggregate      |                    |
     |                    |    Metrics         |                    |
     |                    |                    |                    |
     |                    |--3. Trend          |                    |
     |                    |    Analysis        |                    |
     |                    |                    |                    |
     |                    |--4. Anomaly        |                    |
     |                    |    Detection       |                    |
     |                    |                    |                    |
     |                    |--5. Generate       |                    |
     |                    |    Report          |                    |
     |                    |                    |                    |
     |                    |--6. Schedule       |                    |
     |                    |    Distribution    |                    |
     |                    |                    |                    |
     |                    |                    |--7. Deliver------->|
     |                    |                    |    Report          |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | All source apps | System | Domain mutations | Domain events | INSERT events_v2 | — | — | — | ALL domain events | — | — |
| 2 | analytics-center_v2 | System | Event stream + cron | Aggregated metrics | READ events_v2, READ ALL domain tables | batch-metric-aggregation | — | — | analytics.aggregation.completed | — | view_executive |
| 3 | analytics-center_v2 | Trend Analyzer AI | Aggregated metrics | Trend insights | READ analytics_reports_v2 | calculate-metric-trend | trend-analyzer_v2 | trend-analysis_v2 | analytics.trend.identified | Trend alert | view_executive |
| 4 | analytics-center_v2 | Predictive Modeler AI | Domain events | Anomaly flags | READ events_v2 | — | predictive-modeler_v2 | anomaly-detection_v2 | analytics.anomaly.detected | Anomaly alert | view_executive |
| 5 | analytics-center_v2 | Reporting Generator AI | Report definition + metrics | Generated report | INSERT analytics_reports_v2 | generate-report-data | reporting-generator_v2 | report-generation_v2 | report.generated | Report ready | manage_reports |
| 6 | analytics-center_v2 | System | Schedule definition | Distribution trigger | READ analytics_schedules_v2 | — | — | — | report.scheduled.trigger | — | manage_reports |
| 7 | notification-center_v2 | System | report.generated | Report delivery to subscribers | INSERT notifications_v2 | dispatch-notifications | reporting-distributor_v2 | report-distribution_v2 | report.distributed | Report delivered | — |

### Decision Points
- **DP-RP1:** Report type (standard / complex / ad-hoc) — Step 5
- **DP-RP2:** Trend significance (significant / notable / noise) — Step 3
- **DP-RP3:** Anomaly severity (critical / major / minor) — Step 4
- **DP-RP4:** Distribution channel (email / in-app / export) — Step 7
- **DP-RP5:** Schedule frequency (daily / weekly / monthly / on-demand) — Step 6

### Approval Points
- **AP-RP1:** None (reporting is read-only and automated)

### Escalation Rules
- Critical anomaly detected → immediate alert to Analytics Manager + relevant Department Manager
- Report generation failure after 2 retries → Reporting Manager AI
- Data source unavailable for > 30min → Analytics Manager AI escalation

### Report Inventory

| Report | Owner | Frequency | Data Sources | Stakeholders |
|--------|-------|:---------:|--------------|--------------|
| Executive Dashboard | Analytics Dept | Real-time | ALL domains | C-level, Directors |
| SLA Compliance Report | Support Dept | Daily | tickets_v2 | Support Manager |
| Technician Utilization | Ops Dept | Weekly | technicians_v2, appointments_v2 | Ops Manager |
| Account Health Summary | CRM Dept | Weekly | accounts_v2, followups_v2 | CRM Manager |
| Dispute Trends | Resolution Dept | Monthly | disputes_v2 | Resolution Manager |
| Customer Satisfaction | CX Dept | Monthly | feedback_v2 | CX Director |
| Financial Impact | Finance | Monthly | disputes_v2, appointments_v2 | Finance Director |

---

## 11. Administration Lifecycle Flow

### Overview
System administration covers user provisioning, role/permission management, system configuration, audit logging, and connector management.

### Flow Diagram

```
admin-center_v2    ALL Applications    notification-center_v2    External IdP
     |                    |                    |                    |
     |--1. Create User---->|                    |                    |
     |                    |                    |--2. Send Welcome-->|
     |                    |                    |    Email           |
     |                    |                    |                    |
     |--3. Assign Role---->|                    |                    |
     |                    |                    |                    |
     |--4. Configure      |                    |                    |
     |    Settings        |                    |                    |
     |                    |                    |                    |
     |--5. Toggle Feature |                    |                    |
     |    Flag           |                    |                    |
     |                    |                    |                    |
     |--6. Configure      |                    |                    |
     |    Connector------->|                    |                    |
     |                    |                    |                    |
     |--7. Audit Log      |                    |                    |
     |    Monitor        |                    |                    |
     |                    |                    |                    |
     |--8. System Health  |                    |                    |
     |    Check          |                    |                    |
```

### Step-by-Step Flow

| Step | Application | Actor | Input | Output | DB Interaction | Function | Agent | Workflow | Event | Notification | Permission |
|------|-------------|-------|-------|--------|----------------|----------|-------|----------|-------|--------------|------------|
| 1 | admin-center_v2 | Admin User | User form (email, name, role) | User record | INSERT users_v2, INSERT user_roles_v2 | provision-user | admin-manager_v2 | user-provisioning_v2 | user.created | Welcome email | manage_users |
| 2 | notification-center_v2 | System | user.created | Welcome notification | INSERT notifications_v2 | dispatch-notifications | — | notification-delivery_v2 | notification.sent | Welcome email to user | — |
| 3 | admin-center_v2 | Admin User | Role assignment | Role mapping | UPDATE user_roles_v2 | — | — | — | user.role.changed | Role change notification | manage_users |
| 4 | admin-center_v2 | Admin User | Config change form | Updated setting | UPDATE system_settings_v2 | validate-config-change, apply-config-change | admin-system-config_v2 | system-config-management_v2 | system.config.changed | Config change alert | manage_settings |
| 5 | admin-center_v2 | Admin User | Feature flag toggle | Updated flag | UPDATE feature_flags_v2 | validate-config-change | — | system-config-management_v2 | system.config.changed | Flag change notification | manage_settings |
| 6 | admin-center_v2 | Admin User | Connector config | Updated connector | UPDATE connectors_v2 | — | — | — | connector.configured | — | manage_settings |
| 7 | admin-center_v2 | Admin User | Audit log query | Audit entries | READ audit_log_v2 | log-audit-event | — | — | — | — | view_audit |
| 8 | admin-center_v2 | System | Health check cron | Health status | READ events_v2, READ system_settings_v2 | — | — | workflow-health-monitor_v2 | system.health.report | Health alert | view_audit |

### Decision Points
- **DP-AD1:** User type (admin / agent / technician / customer) — Step 1
- **DP-AD2:** Role assignment validation — Step 3
- **DP-AD3:** Configuration change type (system_setting / feature_flag / connector) — Step 4-6
- **DP-AD4:** Health check severity (healthy / warning / critical) — Step 8

### Approval Points
- **AP-AD1:** User deactivation requires human approval
- **AP-AD2:** ALL configuration changes require human approval
- **AP-AD3:** Role elevation (e.g., agent → admin) requires second admin approval

### Escalation Rules
- Configuration change causes system error → automatic rollback + Admin Manager AI alert
- Failed user provisioning after 3 retries → Admin Manager AI
- System health check detects critical issue → Platform Orchestrator AI + Admin notification

---

## Cross-Flow Dependency Map

| Source Flow | Downstream Flow(s) | Trigger Event |
|-------------|-------------------|---------------|
| Ticket Lifecycle (Step 2) | Appointment Lifecycle | ticket.classified (service-needed) |
| Ticket Lifecycle (Step 3) | Escalation Lifecycle | ticket.escalated |
| Ticket Lifecycle (Step 9) | CRM Lifecycle | ticket.closed |
| Appointment Lifecycle (Step 11) | Technician Lifecycle | appointment.completed |
| Appointment Lifecycle (Step 12) | Customer Lifecycle | appointment.completed |
| CRM Lifecycle (Step 5) | Notification Lifecycle | followup.created |
| CRM Lifecycle (Step 10) | Notification Lifecycle | campaign.started |
| Resolution Lifecycle (Step 8) | CRM Lifecycle | dispute.resolved |
| Resolution Lifecycle (Step 8) | Notification Lifecycle | dispute.resolved |
| Escalation Lifecycle (Step 8) | Ticket Lifecycle | ticket.escalation.resolved |
| Reporting Lifecycle (Step 1) | ALL flows (events consumed) | ALL domain events |
| Administration Lifecycle (Step 1) | Notification Lifecycle | user.created |

---

## Flow Governance Rules

| Rule | Description |
|------|-------------|
| FG-1 | Every flow must start with a clear trigger event |
| FG-2 | Every flow must end with a terminal state or handoff |
| FG-3 | No flow may operate outside its defined application boundaries |
| FG-4 | Cross-flow handoffs must use domain events, not direct DB access |
| FG-5 | Every step must have at least one defined actor |
| FG-6 | Human-facing steps must have clear UI in the responsible application |
| FG-7 | Failed steps must produce events for monitoring and recovery |
| FG-8 | Escalation paths must exist for every timeout/failure condition |
| FG-9 | All state mutations must be audit-logged |
| FG-10 | Notifications must be routed through notification-center_v2 |

---

> **End of BUSINESS_FLOWS.md**
> Next document: BUSINESS_RULES.md
