# RESQAI V2 — Business Process Map

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Workflow Definition Template](#1-workflow-definition-template)
2. [Ticket Lifecycle Workflows](#2-ticket-lifecycle-workflows)
3. [Appointment Lifecycle Workflows](#3-appointment-lifecycle-workflows)
4. [Dispatch Lifecycle Workflows](#4-dispatch-lifecycle-workflows)
5. [Work Order Lifecycle Workflows](#5-work-order-lifecycle-workflows)
6. [Resolution Lifecycle Workflows](#6-resolution-lifecycle-workflows)
7. [CRM Lifecycle Workflows](#7-crm-lifecycle-workflows)
8. [Customer Experience Workflows](#8-customer-experience-workflows)
9. [Knowledge Lifecycle Workflows](#9-knowledge-lifecycle-workflows)
10. [Notification Lifecycle Workflows](#10-notification-lifecycle-workflows)
11. [Operations Monitoring Workflows](#11-operations-monitoring-workflows)
12. [SLA Lifecycle Workflows](#12-sla-lifecycle-workflows)
13. [Reporting Lifecycle Workflows](#13-reporting-lifecycle-workflows)
14. [Analytics Lifecycle Workflows](#14-analytics-lifecycle-workflows)
15. [Administration Workflows](#15-administration-workflows)
16. [Inventory Lifecycle Workflows](#16-inventory-lifecycle-workflows)
17. [Quality Lifecycle Workflows](#17-quality-lifecycle-workflows)
18. [Automation Lifecycle Workflows](#18-automation-lifecycle-workflows)

---

## 1. Workflow Definition Template

Each workflow uses this template:

| Field | Description |
|-------|-------------|
| **Workflow Name** | Unique identifier |
| **Purpose** | Single sentence defining the business process |
| **Business Owner** | Department or role that owns this process |
| **Trigger** | What starts this workflow |
| **Input Events** | Events consumed by this workflow |
| **Output Events** | Events produced by this workflow |
| **Entry Conditions** | Preconditions for workflow to start |
| **Exit Conditions** | Postconditions for workflow to complete |
| **Success Criteria** | How success is measured |
| **Failure Criteria** | How failure is determined |
| **Retry Strategy** | Retry rules for node failures |
| **Timeout Strategy** | Maximum execution time before escalation |
| **Escalation Strategy** | Escalation path on failure |
| **Audit Requirements** | What must be audited |
| **Permissions** | Who can trigger and view |
| **Applications Involved** | Apps that interact |
| **Tables Read** | Tables accessed for read |
| **Tables Written** | Tables modified |
| **Agents Called** | AI agents invoked |
| **Functions Executed** | Functions executed |
| **Notifications Generated** | Notifications sent |
| **Human Approvals Required** | Points requiring human sign-off |
| **Next Workflows Triggered** | Downstream workflows |
| **Decision Nodes** | Branching decision points |
| **Parallel Tasks** | Concurrent execution paths |

---

## 2. Ticket Lifecycle Workflows

### 2.1 ticket-intake_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `ticket-intake_v2` |
| **Purpose** | Classify incoming support tickets, draft AI responses, route for human approval, and send replies |
| **Business Owner** | Support Department |
| **Trigger** | `ticket.created` event (INSERT on `tickets_v2`) |
| **Input Events** | `ticket.created` |
| **Output Events** | `ticket.classified`, `ticket.reply.drafted`, `ticket.reply.approved`, `ticket.reply.rejected`, `ticket.status.changed`, `ticket.sent` |
| **Entry Conditions** | Ticket exists in `tickets_v2` with status = `new`; all required fields present (customer_id, subject, message, channel) |
| **Exit Conditions** | Ticket status = `sent` or `closed`; or escalated to human |
| **Success Criteria** | Reply drafted, approved by human, sent to customer within SLA |
| **Failure Criteria** | Agent confidence < 0.70 on classification; human reject reply; SLA breached during workflow |
| **Retry Strategy** | Agent nodes: 3 retries exponential backoff (5s, 15s, 30s). Function nodes: 3 retries (1s, 5s, 15s) |
| **Timeout Strategy** | Hard timeout: 30min. Human approval timeout: 4h. If human does not respond in 4h, auto-escalate |
| **Escalation Strategy** | L0 (auto): confidence 0.70-0.84 → Support Manager AI. L1: confidence < 0.70 → Human agent. L2: human no-response → Platform Orchestrator |
| **Audit Requirements** | Every classification, draft, approval, rejection, and status change logged |
| **Permissions** | Trigger: `ticket.created` emitter. View: support-center_v2 users |
| **Applications Involved** | `support-center_v2`, `customer-portal_v2`, `notification-center_v2`, `analytics-center_v2` |
| **Tables Read** | `tickets_v2`, `customers_v2`, `knowledge_articles_v2`, `ticket_messages_v2` |
| **Tables Written** | `tickets_v2` (status, classification, draft), `ticket_messages_v2` (reply), `events_v2` |
| **Agents Called** | `support-request-classifier_v2`, `support-reply-drafter_v2`, `knowledge-article-suggester_v2` (parallel) |
| **Functions Executed** | `check-ticket-urgency`, `update-ticket-record`, `dispatch-notifications` |
| **Notifications Generated** | Ticket confirmation to customer, reply sent notification, escalation alert to Support Manager |
| **Human Approvals Required** | Human must approve or reject the draft reply before sending |
| **Next Workflows Triggered** | `urgent-dispatch_v2` (if urgency = critical), `appointment-booking_v2` (if service needed), `sla-enforcement_v2` (SLA timer start) |
| **Decision Nodes** | urgency check (normal/urgent/critical), confidence threshold, approval status (approved/rejected/needs-revision), escalation check |
| **Parallel Tasks** | Article suggestion (parallel with classification); SLA timer start (parallel with drafting) |

**Flow Diagram:**
```
START: ticket.created
  → AGENT: Request Classifier AI
    → FUNCTION: check-ticket-urgency
      → DECISION: urgency == critical?
        ├── YES → EVENT: ticket.escalated (urgent) → SUBWORKFLOW: urgent-dispatch_v2
        └── NO → AGENT: Support Reply Drafter AI
                  → DECISION: confidence >= 0.75?
                    ├── YES → HUMAN: Approve Draft
                    │         → DECISION: approved?
                    │           ├── YES → FUNCTION: update-ticket-record
                    │           │       → FUNCTION: dispatch-notifications
                    │           │       → EVENT: ticket.sent
                    │           │       → END: ticket-intake complete
                    │           └── NO → HUMAN: Revise or Reject
                    │                   → DECISION: reject?
                    │                     ├── YES → EVENT: ticket.status.changed (closed)
                    │                     │       → END
                    │                     └── NO → AGENT: Support Reply Drafter AI (re-draft)
                    │                             → DECISION: (loop back)
                    └── NO → ESCALATE to Support Manager AI
```

### 2.2 ticket-escalation_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `ticket-escalation_v2` |
| **Purpose** | Manage escalated tickets by routing to higher support tiers and coordinating cross-department response |
| **Business Owner** | Support Department |
| **Trigger** | `ticket.escalated` event |
| **Input Events** | `ticket.escalated`, `ticket.sla_breached` |
| **Output Events** | `ticket.escalated.level2`, `ticket.escalated.level3`, `ticket.status.changed`, `ticket.escalation.resolved` |
| **Entry Conditions** | Ticket status = `escalated`; escalation reason recorded |
| **Exit Conditions** | Escalation resolved, ticket returned to normal flow or closed |
| **Success Criteria** | Escalation handled within 4h (L2) or 24h (L3); customer notified of escalation status |
| **Failure Criteria** | Escalation timeout; no resolution possible; legal/compliance flag |
| **Retry Strategy** | Agent nodes: 3 retries. No retry on human timeout (escalate further) |
| **Timeout Strategy** | L2: 4h. L3: 24h. Human: 2h response expected |
| **Escalation Strategy** | L2 → L3 → Platform Orchestrator → Human Executive |
| **Audit Requirements** | Full escalation chain with timestamps, decisions, and resolutions |
| **Permissions** | Trigger: Support Manager AI. View: support-center_v2, operations-center_v2 |
| **Applications Involved** | `support-center_v2`, `operations-center_v2`, `notification-center_v2` |
| **Tables Read** | `tickets_v2`, `customers_v2`, `accounts_v2` |
| **Tables Written** | `tickets_v2` (status, escalation_level), `events_v2` |
| **Agents Called** | `support-escalation-manager_v2`, `support-manager_v2`, `platform-orchestrator_v2` |
| **Functions Executed** | `update-ticket-record`, `dispatch-notifications` |
| **Notifications Generated** | Escalation notification to next level, status update to customer |
| **Human Approvals Required** | L3 escalation requires human confirmation |
| **Next Workflows Triggered** | `sla-enforcement_v2` (SLA reset), `notification-delivery_v2` |
| **Decision Nodes** | Escalation level (L2/L3/Executive), resolution status (resolved/needs-more/escalate-further) |
| **Parallel Tasks** | Customer notification + manager notification (parallel) |

### 2.3 ticket-auto-response_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `ticket-auto-response_v2` |
| **Purpose** | Auto-respond to known FAQ-type tickets with pre-approved templates without human review |
| **Business Owner** | Support Department |
| **Trigger** | `ticket.created` event with channel = email/chat/portal |
| **Input Events** | `ticket.created` |
| **Output Events** | `ticket.auto_responded`, `ticket.status.changed` |
| **Entry Conditions** | Ticket content matches FAQ article with confidence > 0.90; no human escalation flag; channel supports auto-response |
| **Exit Conditions** | Auto-response sent, ticket marked as auto_responded |
| **Success Criteria** | FAQ match confidence > 0.90; response sent within 30s |
| **Failure Criteria** | Match confidence < 0.90 → fall through to ticket-intake_v2 |
| **Retry Strategy** | 1 retry on notification failure |
| **Timeout Strategy** | 60s total |
| **Escalation Strategy** | No match → fall through to `ticket-intake_v2` |
| **Audit Requirements** | Auto-response sent logged with article ID |
| **Permissions** | Trigger: system. View: support-center_v2 |
| **Applications Involved** | `support-center_v2`, `notification-center_v2` |
| **Tables Read** | `tickets_v2`, `knowledge_articles_v2` |
| **Tables Written** | `tickets_v2` (status, auto_reply), `ticket_messages_v2` |
| **Agents Called** | `knowledge-article-suggester_v2` |
| **Functions Executed** | `dispatch-notifications` |
| **Notifications Generated** | Auto-response sent to customer |
| **Human Approvals Required** | None (fully automated for known FAQs) |
| **Next Workflows Triggered** | `ticket-intake_v2` (if no match; if match, workflow ends) |
| **Decision Nodes** | FAQ match confidence (>= 0.90 auto-respond, < 0.90 fallback) |
| **Parallel Tasks** | None |

---

## 3. Appointment Lifecycle Workflows

### 3.1 appointment-booking_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `appointment-booking_v2` |
| **Purpose** | Book new appointments, suggest optimal time slots, assign technicians, and confirm with customer |
| **Business Owner** | Scheduling Department |
| **Trigger** | `appointment.created` event (INSERT on `appointments_v2`) |
| **Input Events** | `appointment.created`, `ticket.classified` (service-needed) |
| **Output Events** | `appointment.assigned`, `appointment.confirmed`, `appointment.rescheduled` |
| **Entry Conditions** | Appointment exists with status = `scheduled`; customer and service type defined |
| **Exit Conditions** | Appointment confirmed by customer, technician assigned |
| **Success Criteria** | Technician assigned within 5min; customer confirms within 24h; first-assignment accuracy > 90% |
| **Failure Criteria** | No technician available within 48h; customer declines all options; reschedule loop > 3 |
| **Retry Strategy** | Agent: 3 retries. Function: 3 retries |
| **Timeout Strategy** | Human confirmation: 24h. If no response, auto-reminder at 24h, cancel at 48h |
| **Escalation Strategy** | No tech → Scheduling Manager AI. Repeated decline → Appointment Manager AI |
| **Audit Requirements** | Every assignment, confirmation, reschedule logged |
| **Permissions** | Trigger: appointment-center_v2, customer-portal_v2. View: appointment-center_v2 |
| **Applications Involved** | `appointment-center_v2`, `customer-portal_v2`, `technician-portal_v2`, `notification-center_v2` |
| **Tables Read** | `appointments_v2`, `technicians_v2`, `technician_skills_v2`, `customers_v2` |
| **Tables Written** | `appointments_v2` (technician_id, status, confirmed_at), `appointment_reminders_v2`, `events_v2` |
| **Agents Called** | `scheduling-technician-suggester_v2`, `scheduling-appointment-scheduler_v2`, `appointment-manager_v2` |
| **Functions Executed** | `assign-appointment-technician`, `dispatch-notifications` |
| **Notifications Generated** | Appointment confirmation to customer, assignment notification to technician |
| **Human Approvals Required** | None (automated; technician assignment is recommendation) |
| **Next Workflows Triggered** | `appointment-reminders_v2` (on confirmation), `work-order-fulfillment_v2` (on assignment), `standard-dispatch_v2` (if dispatch needed) |
| **Decision Nodes** | Customer confirmation (confirmed/declined/no-response), technician availability (available/backup/none) |
| **Parallel Tasks** | Technician suggestion + time slot optimization (parallel); customer notification + technician notification (parallel) |

### 3.2 appointment-reminders_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `appointment-reminders_v2` |
| **Purpose** | Send timely reminders to customers and technicians before scheduled appointments |
| **Business Owner** | Appointment Department |
| **Trigger** | `appointment.confirmed` event; scheduled cron (every 30min to check for upcoming reminders) |
| **Input Events** | `appointment.confirmed`, `appointment.rescheduled`, `appointment.reminder.sent` (retry) |
| **Output Events** | `appointment.reminder.sent`, `appointment.reminder.failed` |
| **Entry Conditions** | Appointment confirmed; reminder schedule generated; at least 2h before appointment |
| **Exit Conditions** | All reminders sent (24h, 2h, 30min) OR appointment cancelled |
| **Success Criteria** | All reminders delivered before appointment; delivery rate > 95% |
| **Failure Criteria** | No reminder delivered; reminder sent after appointment start |
| **Retry Strategy** | Reminder delivery: 3 retries across channels (primary → fallback → fallback2) |
| **Timeout Strategy** | Reminder window: 24h reminder ± 2h; 2h reminder ± 15min; 30min reminder ± 5min |
| **Escalation Strategy** | Delivery failure → Notification Manager AI. All channels failed → Appointment Manager AI |
| **Audit Requirements** | Every reminder delivery attempt logged with channel, status, timestamp |
| **Permissions** | Trigger: system. View: appointment-center_v2 |
| **Applications Involved** | `appointment-center_v2`, `notification-center_v2` |
| **Tables Read** | `appointments_v2`, `appointment_reminders_v2`, `notification_templates_v2`, `notification_channels_v2` |
| **Tables Written** | `appointment_reminders_v2` (sent_at, status), `notifications_v2`, `events_v2` |
| **Agents Called** | `appointment-reminder-coordinator_v2`, `notification-channel-optimizer_v2` |
| **Functions Executed** | `fetch-upcoming-appointments`, `dispatch-notifications` |
| **Notifications Generated** | 24h reminder (customer), 2h reminder (customer + technician), 30min reminder (technician) |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `notification-delivery_v2` (sub-workflow for each reminder) |
| **Decision Nodes** | Reminder type (24h/2h/30min), channel selection (primary/fallback), delivery status (sent/failed) |
| **Parallel Tasks** | Customer reminder + technician reminder (parallel for 2h reminder) |

### 3.3 appointment-completion_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `appointment-completion_v2` |
| **Purpose** | Process appointment completion, generate work orders, trigger followup workflows |
| **Business Owner** | Appointment Department |
| **Trigger** | `appointment.completed` event |
| **Input Events** | `appointment.completed`, `work_order.created`, `work_order.completed` |
| **Output Events** | `work_order.created`, `appointment.status.changed` (closed), `appointment.feedback.triggered` |
| **Entry Conditions** | Appointment status = `completed`; technician has submitted completion notes |
| **Exit Conditions** | Work order created; feedback survey triggered; account health updated |
| **Success Criteria** | Work order generated within 1min; feedback survey sent within 5min |
| **Failure Criteria** | Work order generation fails; missing required completion data |
| **Retry Strategy** | Function: 3 retries. Notification: 3 retries |
| **Timeout Strategy** | 10min total |
| **Escalation Strategy** | Work order failure → Work Order Manager AI |
| **Audit Requirements** | Completion recorded, work order ID linked |
| **Permissions** | Trigger: technician-portal_v2. View: technician-portal_v2, operations-center_v2 |
| **Applications Involved** | `technician-portal_v2`, `operations-center_v2`, `crm-center_v2` |
| **Tables Read** | `appointments_v2`, `technicians_v2`, `work_orders_v2` |
| **Tables Written** | `work_orders_v2`, `work_order_stages_v2`, `appointments_v2` (status), `events_v2` |
| **Agents Called** | `operations-work-order-manager_v2` |
| **Functions Executed** | `create-operations-tasks` |
| **Notifications Generated** | Completion confirmation to customer (via `customer-satisfaction-monitor_v2`) |
| **Human Approvals Required** | None (completion is deterministic) |
| **Next Workflows Triggered** | `work-order-fulfillment_v2`, `customer-satisfaction-monitor_v2`, `account-health-scan_v2` |
| **Decision Nodes** | Followup needed? (yes/no based on service type) |
| **Parallel Tasks** | Work order creation + feedback trigger + account health update (all parallel) |

---

## 4. Dispatch Lifecycle Workflows

### 4.1 urgent-dispatch_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `urgent-dispatch_v2` |
| **Purpose** | Rapidly dispatch technicians for urgent (high/critical) tickets with real-time tracking |
| **Business Owner** | Dispatch Department |
| **Trigger** | `ticket.classified` (urgency = urgent/critical); `dispatch.escalated` (emergency) |
| **Input Events** | `ticket.classified`, `dispatch.created`, `dispatch.escalated` |
| **Output Events** | `dispatch.created`, `dispatch.sent`, `dispatch.acknowledged`, `dispatch.declined`, `dispatch.completed`, `dispatch.escalated` |
| **Entry Conditions** | Ticket urgency = urgent or critical; technician capacity available; within service area |
| **Exit Conditions** | Dispatch completed (technician on site) OR dispatch cancelled |
| **Success Criteria** | Dispatch acknowledgment within 10min; technician on site within 60min |
| **Failure Criteria** | No technician available; all technicians decline; acknowledgment timeout |
| **Retry Strategy** | Dispatch send: 3 retries. Decline reassignment: 3 attempts before escalation |
| **Timeout Strategy** | Acknowledgment: 10min. En-route: 15min after acknowledgment. On-site: 60min from dispatch |
| **Escalation Strategy** | No acknowledgment → Dispatch Manager AI (10min). 2+ declines → Dispatch Manager AI. Emergency → Simultaneous ALL levels |
| **Audit Requirements** | Full dispatch lifecycle: created → sent → acknowledged → en_route → on_site → completed |
| **Permissions** | Trigger: system. View: operations-center_v2, technician-portal_v2 |
| **Applications Involved** | `operations-center_v2`, `technician-portal_v2`, `notification-center_v2` |
| **Tables Read** | `tickets_v2`, `technicians_v2`, `technician_skills_v2`, `dispatches_v2` |
| **Tables Written** | `dispatches_v2` (status, technician_id, timestamps), `events_v2` |
| **Agents Called** | `dispatch-coordinator_v2`, `dispatch-technician-dispatcher_v2`, `dispatch-emergency-response_v2` (if emergency) |
| **Functions Executed** | `dispatch-notifications`, `finalize-dispatch` |
| **Notifications Generated** | Dispatch alert to technician, escalation notification to manager, completion notification |
| **Human Approvals Required** | Emergency dispatch override requires human approval within 5min |
| **Next Workflows Triggered** | `appointment-completion_v2` (on dispatch.completed), `followup-management_v2` (post-dispatch), `notification-delivery_v2` |
| **Decision Nodes** | Urgency (urgent/critical/emergency), technician response (acknowledged/declined/timeout), reassignment needed? |
| **Parallel Tasks** | Dispatch to primary tech + notify backup tech (standby); customer notification + manager notification (parallel on escalation) |

**Flow Diagram:**
```
START: ticket.classified (urgent/critical)
  → DECISION: urgency == emergency?
    ├── YES → AGENT: Emergency Response AI
    │         → ACTIVATE: Emergency Protocol
    │         → PARALLEL: Dispatch Manager + Ops Manager + Platform Orch (notified)
    │         → FUNCTION: dispatch-notifications
    │         → HUMAN: Emergency override (5min timeout)
    │         → AGENT: Technician Dispatcher AI → send dispatch
    │
    └── NO → AGENT: Dispatch Coordinator AI
             → DECISION: technician available?
               ├── YES → AGENT: Technician Dispatcher AI
               │         → FUNCTION: dispatch-notifications
               │         → DECISION: acknowledged?
               │           ├── YES → FUNCTION: finalize-dispatch
               │           │       → EVENT: dispatch.acknowledged
               │           │       → WAIT: work_order.travelling
               │           │       → WAIT: work_order.on_site
               │           │       → EVENT: dispatch.completed
               │           │       → END
               │           └── NO (10min timeout) → RETRY
               │               → MAX 2 DECLINES → ESCALATE to Dispatch Manager AI
               │
               └── NO → ESCALATE to Dispatch Manager AI
```

### 4.2 standard-dispatch_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `standard-dispatch_v2` |
| **Purpose** | Manage scheduled/standard dispatches for pre-booked appointments |
| **Business Owner** | Dispatch Department |
| **Trigger** | `appointment.assigned` event (when technician assigned) |
| **Input Events** | `appointment.assigned`, `appointment.rescheduled` |
| **Output Events** | `dispatch.created`, `dispatch.sent`, `dispatch.acknowledged`, `dispatch.completed` |
| **Entry Conditions** | Appointment has technician assigned; appointment is within 48h |
| **Exit Conditions** | Dispatch acknowledged by technician |
| **Success Criteria** | Dispatch acknowledged within 30min; no reassignment needed |
| **Failure Criteria** | Technician declines or doesn't acknowledge |
| **Retry Strategy** | Same as urgent-dispatch_v2 but with longer timeouts |
| **Timeout Strategy** | Acknowledgment: 30min. |
| **Escalation Strategy** | Decline → Dispatch Coordinator AI (reassign). No acknowledgment → Dispatch Manager AI |
| **Audit Requirements** | Dispatch lifecycle (same as urgent) |
| **Permissions** | Trigger: system. View: operations-center_v2 |
| **Applications Involved** | `operations-center_v2`, `technician-portal_v2`, `notification-center_v2` |
| **Tables Read** | `appointments_v2`, `technicians_v2`, `dispatches_v2` |
| **Tables Written** | `dispatches_v2` |
| **Agents Called** | `dispatch-technician-dispatcher_v2` |
| **Functions Executed** | `dispatch-notifications`, `finalize-dispatch` |
| **Notifications Generated** | Standard dispatch notification to technician |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `appointment-reminders_v2`, `notification-delivery_v2` |
| **Decision Nodes** | Technician response (acknowledged/declined/timeout) |
| **Parallel Tasks** | None |

---

## 5. Work Order Lifecycle Workflows

### 5.1 work-order-fulfillment_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `work-order-fulfillment_v2` |
| **Purpose** | Track work order progress through all stages from creation to completion |
| **Business Owner** | Operations Department |
| **Trigger** | `work_order.created` event |
| **Input Events** | `work_order.created`, `work_order.stage.changed`, `appointment.started` |
| **Output Events** | `work_order.stage.changed`, `work_order.followup_needed`, `work_order.completed` |
| **Entry Conditions** | Work order exists; initial stage set (travelling/on_site/working) |
| **Exit Conditions** | All stages completed; work order status = completed |
| **Success Criteria** | All stages completed; technician notes submitted; parts logged |
| **Failure Criteria** | Stage stalled > 4h; technician unable to complete; parts unavailable |
| **Retry Strategy** | None (stage transitions are technician-driven) |
| **Timeout Strategy** | No stage progress > 4h → escalate. Total work order timeout: 8h |
| **Escalation Strategy** | Stalled stage → Work Order Manager AI. Parts shortage → Operations Manager AI |
| **Audit Requirements** | Every stage transition with timestamp, technician notes |
| **Permissions** | Trigger: technician-portal_v2. View: technician-portal_v2, operations-center_v2 |
| **Applications Involved** | `technician-portal_v2`, `operations-center_v2`, `crm-center_v2` |
| **Tables Read** | `work_orders_v2`, `work_order_stages_v2`, `technicians_v2`, `inventory_items_v2` |
| **Tables Written** | `work_order_stages_v2`, `work_orders_v2` (status), `inventory_transactions_v2` |
| **Agents Called** | `operations-work-order-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Stage completion to customer (optional); parts usage notification to inventory |
| **Human Approvals Required** | None (technician-driven) |
| **Next Workflows Triggered** | `work-order-verification_v2` (on completion), `inventory-reorder_v2` (if parts used below threshold) |
| **Decision Nodes** | Followup needed? (yes/no); parts used? (yes/no); quality check needed? (yes/no) |
| **Parallel Tasks** | Parts logging + stage tracking (parallel); customer notification optional |

### 5.2 work-order-verification_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `work-order-verification_v2` |
| **Purpose** | Verify work order completion quality, process customer feedback, and close the work order lifecycle |
| **Business Owner** | QA Department |
| **Trigger** | `work_order.completed` event |
| **Input Events** | `work_order.completed`, `feedback.submitted` (post-service) |
| **Output Events** | `work_order.verified`, `work_order.reopened`, `work_order.closed` |
| **Entry Conditions** | Work order status = completed; technician notes submitted |
| **Exit Conditions** | Work order verified and closed; or reopened for followup |
| **Success Criteria** | Verification within 24h; customer satisfied with work |
| **Failure Criteria** | Customer reports issue; QA flags quality concern |
| **Retry Strategy** | None (human review process) |
| **Timeout Strategy** | Human QA review: 48h. If no review, auto-verify with provisional status |
| **Escalation Strategy** | Quality concern → QA Manager AI. Customer complaint → CX Manager AI |
| **Audit Requirements** | Verification decision, QA notes, reopened reasons |
| **Permissions** | Trigger: system. View: operations-center_v2, qa-center_v2 |
| **Applications Involved** | `operations-center_v2`, `technician-portal_v2`, `crm-center_v2` |
| **Tables Read** | `work_orders_v2`, `work_order_stages_v2`, `feedback_v2` |
| **Tables Written** | `work_orders_v2` (verified_at, verified_by), `events_v2` |
| **Agents Called** | `qa-response-quality-monitor_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Verification complete to customer; quality concern to technician manager |
| **Human Approvals Required** | Only if QA issue detected |
| **Next Workflows Triggered** | `account-health-scan_v2` (health update), `customer-satisfaction-monitor_v2` (survey) |
| **Decision Nodes** | Quality pass/fail; customer satisfied/not-satisfied; reopen? |
| **Parallel Tasks** | QA review + customer feedback collection (parallel) |

---

## 6. Resolution Lifecycle Workflows

### 6.1 dispute-resolution_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `dispute-resolution_v2` |
| **Purpose** | Analyze service disputes using AI, recommend resolution, route for human approval, and execute resolution |
| **Business Owner** | Resolution Department |
| **Trigger** | `dispute.created` event (INSERT on `disputes_v2`) |
| **Input Events** | `dispute.created`, `dispute.analyzed`, `dispute.approved`, `dispute.rejected` |
| **Output Events** | `dispute.analyzing`, `dispute.analyzed`, `dispute.escalated`, `dispute.approved`, `dispute.rejected`, `dispute.resolved` |
| **Entry Conditions** | Dispute exists with status = `open`; evidence collected |
| **Exit Conditions** | Dispute resolved (resolution applied) OR dispute rejected (no action taken) |
| **Success Criteria** | Resolution recommended with > 0.80 confidence; approved by human; applied within 48h |
| **Failure Criteria** | AI confidence < 0.50; human rejects all recommendations; dispute re-opened |
| **Retry Strategy** | Agent: 3 retries |
| **Timeout Strategy** | Human approval: 24h. If no response, reminder at 12h, escalate at 24h |
| **Escalation Strategy** | Confidence < 0.80 → QA Manager AI. Confidence < 0.50 → Human Resolution Manager |
| **Audit Requirements** | Full analysis, confidence score, human decision, resolution applied |
| **Permissions** | Trigger: resolution-center_v2, customer-portal_v2. View: resolution-center_v2 |
| **Applications Involved** | `resolution-center_v2`, `customer-portal_v2`, `notification-center_v2` |
| **Tables Read** | `disputes_v2`, `dispute_evidence_v2`, `appointments_v2`, `customers_v2`, `tickets_v2` |
| **Tables Written** | `disputes_v2` (status, recommendation, resolution), `events_v2` |
| **Agents Called** | `resolution-advisor_v2` (V2 evolved), `qa-compliance-monitor_v2`, `qa-manager_v2` |
| **Functions Executed** | `resolve-dispute` |
| **Notifications Generated** | Dispute filed confirmation to customer, resolution proposed to manager, resolution applied to customer |
| **Human Approvals Required** | ALL dispute resolutions require human approval before execution |
| **Next Workflows Triggered** | `followup-management_v2` (create post-dispute followup), `account-health-scan_v2` (update health), `customer-satisfaction-monitor_v2` |
| **Decision Nodes** | Confidence threshold (>= 0.80 auto-route to QA, 0.50-0.79 escalate, < 0.50 urgent escalate), approval status (approved/rejected), resolution type |
| **Parallel Tasks** | Compliance check + AI analysis (parallel initial phase) |

**Flow Diagram:**
```
START: dispute.created
  → PARALLEL:
    ├── AGENT: Resolution Advisor AI → analyze dispute
    └── AGENT: Compliance Monitor AI → policy check
  → JOIN (wait for both)
  → DECISION: confidence?
    ├── >= 0.80 → HUMAN: QA Manager AI review (fast track)
    │             → DECISION: approved?
    │               ├── YES → FUNCTION: resolve-dispute
    │               │       → EVENT: dispute.resolved
    │               │       → END
    │               └── NO → HUMAN: Resolution Manager (detailed review)
    │
    ├── 0.50-0.79 → HUMAN: Resolution Manager (standard review)
    │               → DECISION: approved?
    │                 ├── YES → FUNCTION: resolve-dispute
    │                 └── NO → AGENT: Resolution Advisor AI (re-analyze with human hints)
    │
    └── < 0.50 → ESCALATE: Human Resolution Manager (urgent review)
                 → HUMAN: Full manual review
```

### 6.2 dispute-escalation_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `dispute-escalation_v2` |
| **Purpose** | Handle escalated disputes that cannot be resolved through standard resolution workflow |
| **Business Owner** | CX Department |
| **Trigger** | `dispute.escalated` event (from dispute-resolution_v2) |
| **Input Events** | `dispute.escalated`, `account.health.changed` (if related) |
| **Output Events** | `dispute.status.changed`, `dispute.resolved` (escalated resolution) |
| **Entry Conditions** | Escalation reason recorded; standard resolution exhausted |
| **Exit Conditions** | Escalated resolution applied or dispute escalated to legal |
| **Success Criteria** | Escalated dispute resolved within 72h |
| **Failure Criteria** | Escalated dispute reaches legal; customer takes external action |
| **Retry Strategy** | None |
| **Timeout Strategy** | Executive human review: 48h |
| **Escalation Strategy** | Platform Orchestrator AI → Executive Director AI → Human Executive |
| **Audit Requirements** | Full escalation chain |
| **Permissions** | Trigger: resolution-center_v2. View: resolution-center_v2, admin-center_v2 |
| **Applications Involved** | `resolution-center_v2`, `admin-center_v2`, `notification-center_v2` |
| **Tables Read** | `disputes_v2`, `dispute_evidence_v2`, `accounts_v2`, `customers_v2` |
| **Tables Written** | `disputes_v2` (status, escalation_level) |
| **Agents Called** | `platform-orchestrator_v2`, `executive-director_v2`, `cx-manager_v2` |
| **Functions Executed** | `resolve-dispute` |
| **Notifications Generated** | Escalation notification to executive, customer notified of escalated status |
| **Human Approvals Required** | Legal escalation requires human executive approval |
| **Next Workflows Triggered** | `account-health-scan_v2`, `retention-campaign_v2` |
| **Decision Nodes** | Escalation level (L2/L3/L4/legal) |
| **Parallel Tasks** | Executive notification + customer notification (parallel) |

---

## 7. CRM Lifecycle Workflows

### 7.1 account-health-scan_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `account-health-scan_v2` |
| **Purpose** | Periodically scan customer account health, detect risk signals, and update health scores |
| **Business Owner** | CRM Department |
| **Trigger** | Cron: daily at 2:00 AM; on-demand via CRM center UI |
| **Input Events** | (Scheduled) — reads account state directly |
| **Output Events** | `account.health.scan.completed`, `account.health.changed`, `account.risk.signal.detected` |
| **Entry Conditions** | Account exists; not deleted; sufficient data for scoring |
| **Exit Conditions** | All active accounts scanned |
| **Success Criteria** | All accounts scored; risk signals detected with > 85% accuracy |
| **Failure Criteria** | Scan fails for > 5% of accounts; scoring function error |
| **Retry Strategy** | Per-account: 3 retries with 5s backoff. Full scan: retry failed accounts individually |
| **Timeout Strategy** | Per account: 30s. Full scan: 30min. If timeout, skip and retry in next scan |
| **Escalation Strategy** | Repeated scan failures → CRM Manager AI |
| **Audit Requirements** | Scan timestamp, accounts scanned, errors, health changes |
| **Permissions** | Trigger: system (cron) + crm-center_v2 (manual). View: crm-center_v2 |
| **Applications Involved** | `crm-center_v2`, `notification-center_v2` |
| **Tables Read** | `accounts_v2`, `account_health_scans_v2`, `followups_v2`, `customers_v2`, `appointments_v2`, `disputes_v2`, `feedback_v2` |
| **Tables Written** | `accounts_v2` (health_score, health, risk_signals), `account_health_scans_v2` |
| **Agents Called** | `crm-account-health-monitor_v2` |
| **Functions Executed** | `account-health-scan`, `flag-slipping-followups`, `update-account-health-status` |
| **Notifications Generated** | Health change alert to account manager; risk signal alert |
| **Human Approvals Required** | None (automated scoring) |
| **Next Workflows Triggered** | `followup-management_v2` (create followups from risk signals), `followup-slippage-detector_v2` (check for slippage), `retention-campaign_v2` (if health critical), `notification-delivery_v2` |
| **Decision Nodes** | Health change (improved/stable/declined), risk detected? (yes/no), customer tier (standard/VIP) |
| **Parallel Tasks** | Per-account scanning in batches; cross-account aggregation in parallel |

**Flow Diagram:**
```
START: cron (daily 2AM)
  → PARALLEL (batch):
    └── For each active account:
        ├── FUNCTION: account-health-scan → health score + bucket
        ├── DECISION: health changed?
        │   ├── YES → EVENT: account.health.changed
        │   │         → DECISION: health dropped?
        │   │           ├── YES → AGENT: Account Health Monitor AI
        │   │           │         → DECISION: risk signals?
        │   │           │           ├── YES → EVENT: account.risk.signal.detected
        │   │           │           └── NO → continue
        │   │           └── NO → continue
        │   └── NO → continue
        └── FUNCTION: flag-slipping-followups
            → DECISION: slippage detected?
              ├── YES → EVENT: followup.slippage.detected
              └── NO → continue
  → FUNCTION: update-account-health-status (global aggregation)
  → EVENT: account.health.scan.completed
  → END
```

### 7.2 followup-management_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `followup-management_v2` |
| **Purpose** | Create, track, and complete followup actions for customers, accounts, and service events |
| **Business Owner** | CRM Department |
| **Trigger** | `followup.created` event; specific trigger events (appointment.completed, dispute.resolved, account.health.changed) |
| **Input Events** | `followup.created`, `appointment.completed`, `dispute.resolved`, `account.health.changed`, `account.risk.signal.detected` |
| **Output Events** | `followup.completed`, `followup.missed`, `followup.cancelled` |
| **Entry Conditions** | Followup record exists or trigger event received |
| **Exit Conditions** | Followup completed or cancelled |
| **Success Criteria** | Followup completed before due date; customer responds positively |
| **Failure Criteria** | Followup missed (past due); customer unreachable |
| **Retry Strategy** | Followup attempt: 3 retries with 24h interval |
| **Timeout Strategy** | Followup due date: absolute deadline. Missed followup auto-escalated after 7 days |
| **Escalation Strategy** | Missed followup > 7 days → CRM Manager AI. Customer unreachable → Retention Specialist AI |
| **Audit Requirements** | Followup created, attempts, completion, escalation |
| **Permissions** | Trigger: system, crm-center_v2. View: crm-center_v2 |
| **Applications Involved** | `crm-center_v2`, `notification-center_v2` |
| **Tables Read** | `followups_v2`, `followup_attempts_v2`, `customers_v2`, `accounts_v2` |
| **Tables Written** | `followups_v2` (status, completed_at), `followup_attempts_v2` |
| **Agents Called** | `crm-followup-manager_v2` |
| **Functions Executed** | `create-followup-tasks` |
| **Notifications Generated** | Followup reminder to assigned user, followup overdue alert |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `followup-slippage-detector_v2` (on followup creation), `retention-campaign_v2` (if repeated missed) |
| **Decision Nodes** | Followup type (post-service/health-driven/dispute-related/direct), completion status (completed/missed/cancelled) |
| **Parallel Tasks** | Multiple followups for same account (independent) |

### 7.3 followup-slippage-detector_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `followup-slippage-detector_v2` |
| **Purpose** | Detect overdue and at-risk followups and trigger remediation |
| **Business Owner** | CRM Department |
| **Trigger** | Cron: weekdays at 6:00 AM; `followup.created` (schedule check) |
| **Input Events** | (Scheduled checks followups_v2 directly) |
| **Output Events** | `followup.slippage.detected`, `followup.overdue` |
| **Entry Conditions** | Followups exist with due_date in past or within 24h |
| **Exit Conditions** | All slipping followups detected and alerted |
| **Success Criteria** | Slippage detected within 1h of due date |
| **Failure Criteria** | Slippage not detected; false positive rate > 5% |
| **Retry Strategy** | None |
| **Timeout Strategy** | Scan: 5min. If timeout, remaining accounts skipped to next run |
| **Escalation Strategy** | Repeated slippage on same account → CRM Manager AI |
| **Audit Requirements** | Slippage detection log |
| **Permissions** | Trigger: system. View: crm-center_v2 |
| **Applications Involved** | `crm-center_v2`, `notification-center_v2` |
| **Tables Read** | `followups_v2`, `followup_attempts_v2`, `accounts_v2` |
| **Tables Written** | `followups_v2` (flagged), `events_v2` |
| **Agents Called** | `crm-followup-manager_v2` |
| **Functions Executed** | `flag-slipping-followups`, `finalize-slippage-review` |
| **Notifications Generated** | Slippage alert to CRM Manager, overdue notification to assigned user |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `followup-management_v2` (remediation), `retention-campaign_v2` (if repeated), `notification-delivery_v2` |
| **Decision Nodes** | Overdue severity (mild/moderate/critical), slippage pattern (first-time/repeat/chronic) |
| **Parallel Tasks** | Batch scanning of multiple accounts |

### 7.4 retention-campaign_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `retention-campaign_v2` |
| **Purpose** | Design and execute automated retention campaigns for at-risk and churning accounts |
| **Business Owner** | CRM Department |
| **Trigger** | `account.health.changed` (health = critical/churned); `followup.slippage.detected` (chronic); `feedback.submitted` (extremely negative) |
| **Input Events** | `account.health.changed`, `followup.slippage.detected`, `feedback.submitted` |
| **Output Events** | `campaign.created`, `campaign.started`, `campaign.completed`, `campaign.escalated` |
| **Entry Conditions** | Account health critical/churned or chronic slippage or extremely negative feedback |
| **Exit Conditions** | Campaign outreach completed or account recovered |
| **Success Criteria** | Account health improves within 30 days; customer responds positively |
| **Failure Criteria** | No response to campaign; customer unsubscribes; health continues to decline |
| **Retry Strategy** | Campaign outreach: 3 attempts with 48h interval |
| **Timeout Strategy** | Campaign duration: 14 days. If no response, auto-escalate |
| **Escalation Strategy** | No response → CRM Manager AI. VIP account → Executive Director AI |
| **Audit Requirements** | Campaign design, outreach attempts, responses |
| **Permissions** | Trigger: system. View: crm-center_v2 |
| **Applications Involved** | `crm-center_v2`, `notification-center_v2` |
| **Tables Read** | `accounts_v2`, `customers_v2`, `feedback_v2`, `followups_v2`, `events_v2` |
| **Tables Written** | `followups_v2`, `notifications_v2`, `events_v2` |
| **Agents Called** | `crm-retention-specialist_v2`, `cx-winback-specialist_v2` |
| **Functions Executed** | `create-followup-tasks` |
| **Notifications Generated** | Win-back offer to customer, campaign alert to CRM manager |
| **Human Approvals Required** | Financial offers > $500 require human approval |
| **Next Workflows Triggered** | `followup-management_v2` (outreach followups), `customer-satisfaction-monitor_v2` |
| **Decision Nodes** | Campaign type (retention/win-back), customer segment (standard/VIP), response (positive/negative/no-response) |
| **Parallel Tasks** | Multi-channel outreach (email + SMS + call) |

---

## 8. Customer Experience Workflows

### 8.1 customer-satisfaction-monitor_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `customer-satisfaction-monitor_v2` |
| **Purpose** | Deploy satisfaction surveys after service events and track CSAT/NPS scores |
| **Business Owner** | CX Department |
| **Trigger** | `appointment.completed` event; `ticket.closed` event; `dispute.resolved` event |
| **Input Events** | `appointment.completed`, `ticket.closed`, `dispute.resolved` |
| **Output Events** | `feedback.survey.sent`, `feedback.submitted`, `cx.risk.identified` |
| **Entry Conditions** | Service event completed; customer has valid contact info; not opted out of surveys |
| **Exit Conditions** | Survey delivered; or survey opted out |
| **Success Criteria** | Survey sent within 5min of completion; response rate > 30% |
| **Failure Criteria** | Survey delivery fails; response rate < 20% |
| **Retry Strategy** | Survey delivery: 2 retries. Follow-up survey: 1 reminder after 48h |
| **Timeout Strategy** | Survey open: 7 days. After 7 days, survey closes |
| **Escalation Strategy** | Low response rate → CX Manager AI. Negative score → Immediate alert |
| **Audit Requirements** | Survey sent, response received, score recorded |
| **Permissions** | Trigger: system. View: crm-center_v2, analytics-center_v2 |
| **Applications Involved** | `customer-portal_v2`, `crm-center_v2`, `notification-center_v2` |
| **Tables Read** | `customers_v2`, `feedback_surveys_v2` |
| **Tables Written** | `feedback_surveys_v2`, `feedback_v2` (on response), `notifications_v2` |
| **Agents Called** | `cx-satisfaction-survey_v2` |
| **Functions Executed** | `dispatch-notifications` |
| **Notifications Generated** | Survey invitation to customer, low-score alert to CX Manager |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `feedback-analysis_v2` (on response), `retention-campaign_v2` (if score < 3), `notification-delivery_v2` |
| **Decision Nodes** | Survey type (CSAT/NPS/CES based on event type), score threshold (positive/neutral/negative) |
| **Parallel Tasks** | Survey deployment + notification + follow-up scheduling |

### 8.2 feedback-analysis_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `feedback-analysis_v2` |
| **Purpose** | Analyze customer feedback to extract sentiment, identify themes, and generate actionable insights |
| **Business Owner** | CX Department |
| **Trigger** | `feedback.submitted` event |
| **Input Events** | `feedback.submitted` |
| **Output Events** | `feedback.analyzed`, `cx.insight.generated`, `cx.risk.identified` |
| **Entry Conditions** | Feedback record exists; contains analyzable content |
| **Exit Conditions** | Feedback analyzed; insights generated; risk flags set |
| **Success Criteria** | Sentiment accurately classified; themes identified; actionable insights produced |
| **Failure Criteria** | Analysis confidence < 0.70 for sentiment |
| **Retry Strategy** | 2 retries |
| **Timeout Strategy** | 30s |
| **Escalation Strategy** | Extremely negative feedback → CX Manager AI immediate alert |
| **Audit Requirements** | Analysis results, sentiment, identified themes |
| **Permissions** | Trigger: system. View: crm-center_v2, analytics-center_v2 |
| **Applications Involved** | `crm-center_v2`, `analytics-center_v2` |
| **Tables Read** | `feedback_v2`, `feedback_surveys_v2`, `customers_v2` |
| **Tables Written** | `feedback_v2` (sentiment, topics), `events_v2` |
| **Agents Called** | `cx-feedback-analyzer_v2`, `trend-analyzer_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Insight report to CX Manager; risk alert to CRM Manager |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `trend-analysis_v2` (aggregation), `retention-campaign_v2` (if negative), `knowledge-gap-detection_v2` (if suggests knowledge gap) |
| **Decision Nodes** | Sentiment (positive/neutral/negative), risk level (none/low/high) |
| **Parallel Tasks** | Sentiment analysis + theme extraction (parallel) |

---

## 9. Knowledge Lifecycle Workflows

### 9.1 knowledge-article-lifecycle_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `knowledge-article-lifecycle_v2` |
| **Purpose** | Manage the full lifecycle of knowledge articles from creation through archival |
| **Business Owner** | Knowledge Department |
| **Trigger** | Article created/updated; scheduled review cycle (90 days) |
| **Input Events** | `knowledge.article.created`, `knowledge.article.updated`, `knowledge.review.due` |
| **Output Events** | `knowledge.article.published`, `knowledge.article.archived`, `knowledge.article.deprecated` |
| **Entry Conditions** | Article exists in draft or review-needed state |
| **Exit Conditions** | Article published, archived, or deprecated |
| **Success Criteria** | Article reviewed within 48h; published with accurate metadata |
| **Failure Criteria** | Article stale > 90 days; quality score < 0.7 |
| **Retry Strategy** | None |
| **Timeout Strategy** | Human review: 7 days. If no review, auto-reminder at 3 days, escalate at 7 |
| **Escalation Strategy** | Stale article → Knowledge Manager AI. Quality concern → QA Manager AI |
| **Audit Requirements** | All article state changes, review decisions |
| **Permissions** | Trigger: knowledge-center_v2. View: support-center_v2 |
| **Applications Involved** | `support-center_v2`, `admin-center_v2` |
| **Tables Read** | `knowledge_articles_v2`, `knowledge_categories_v2` |
| **Tables Written** | `knowledge_articles_v2` (status, version), `events_v2` |
| **Agents Called** | `knowledge-manager_v2`, `knowledge-curator_v2`, `qa-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Review reminder, publish notification, archival notice |
| **Human Approvals Required** | New article category requires human approval |
| **Next Workflows Triggered** | None (knowledge base is a content store, not a workflow chain) |
| **Decision Nodes** | Quality check (pass/fail), target audience (customer/technician/internal) |
| **Parallel Tasks** | Quality check + categorization + tagging (parallel) |

### 9.2 knowledge-gap-detection_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `knowledge-gap-detection_v2` |
| **Purpose** | Identify knowledge gaps from unresolved tickets and agent queries, and trigger content creation |
| **Business Owner** | Knowledge Department |
| **Trigger** | `knowledge.gap.detected` event (from Article Suggester AI or manual flag) |
| **Input Events** | `knowledge.gap.detected`, `ticket.classified` (no article match) |
| **Output Events** | `knowledge.gap.filled`, `knowledge.article.requested` |
| **Entry Conditions** | Gap detected: no article match with confidence > 0.5; or gap frequency threshold exceeded (3+ queries on same topic) |
| **Exit Conditions** | Gap filled (article created) or gap acknowledged (deferred) |
| **Success Criteria** | Gap filled with article within 48h; article helpfulness > 80% |
| **Failure Criteria** | Gap not fillable (no source material); gap re-detected (article not effective) |
| **Retry Strategy** | None |
| **Timeout Strategy** | Gap resolution: 48h. If not resolved, escalate to Knowledge Manager |
| **Escalation Strategy** | Recurring gap → Knowledge Manager AI. Critical gap (support escalation) → Platform Orchestrator |
| **Audit Requirements** | Gap detected, resolution created |
| **Permissions** | Trigger: system. View: support-center_v2 |
| **Applications Involved** | `support-center_v2`, `knowledge-center_v2` |
| **Tables Read** | `knowledge_articles_v2`, `tickets_v2`, `ticket_messages_v2` |
| **Tables Written** | `knowledge_articles_v2` (draft), `events_v2` |
| **Agents Called** | `knowledge-curator_v2`, `knowledge-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | New article request to Knowledge Curator |
| **Human Approvals Required** | Article content requires Knowledge Manager approval |
| **Next Workflows Triggered** | `knowledge-article-lifecycle_v2` (article created from gap) |
| **Decision Nodes** | Gap severity (minor/major/critical), source (agent/human/system), fillable? (yes/defer/no) |
| **Parallel Tasks** | Source material extraction + category assignment (parallel) |

---

## 10. Notification Lifecycle Workflows

### 10.1 notification-delivery_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `notification-delivery_v2` |
| **Purpose** | Deliver notifications through optimal channels with delivery tracking and fallback |
| **Business Owner** | Notification Department |
| **Trigger** | `notification.send` event (FROM ALL workflows and apps) |
| **Input Events** | `notification.send` |
| **Output Events** | `notification.sent`, `notification.delivered`, `notification.failed`, `notification.read` |
| **Entry Conditions** | Notification request valid; recipient contact info available |
| **Exit Conditions** | Notification delivered successfully OR permanently failed |
| **Success Criteria** | Delivery within 30s of trigger; delivery rate > 99% |
| **Failure Criteria** | Delivery permanently failed; all channels exhausted |
| **Retry Strategy** | Per channel: 3 retries with exponential backoff (1s, 5s, 15s). Channel fallback: up to 3 channels |
| **Timeout Strategy** | Per attempt: 10s. Total delivery: 60s |
| **Escalation Strategy** | All channels failed → Notification Manager AI |
| **Audit Requirements** | Delivery attempt per channel, result, latency |
| **Permissions** | Trigger: ALL apps. View: notification-center_v2 |
| **Applications Involved** | `notification-center_v2`, ALL source apps |
| **Tables Read** | `notification_templates_v2`, `notification_channels_v2`, `customers_v2` (contact info) |
| **Tables Written** | `notifications_v2`, `events_v2` |
| **Agents Called** | `notification-channel-optimizer_v2`, `notification-template-manager_v2` |
| **Functions Executed** | `dispatch-notifications` |
| **Notifications Generated** | (This IS the notification delivery workflow — it delivers to external channels) |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | None (terminal for notification) |
| **Decision Nodes** | Channel selection (primary/fallback1/fallback2), delivery status (sent/delivered/failed), retry? (yes/no) |
| **Parallel Tasks** | Channel delivery + delivery tracking (parallel monitor) |

**Flow Diagram:**
```
START: notification.send
  → AGENT: Channel Optimizer AI → select optimal channel order
  → PARALLEL (attempt channels sequentially until success):
    ├── Channel 1 (primary):
    │   ├── FUNCTION: dispatch-notifications
    │   ├── DECISION: delivered?
    │   │   ├── YES → EVENT: notification.delivered
    │   │   │         → END (success)
    │   │   └── NO → RETRY (3x)
    │   │             → FAIL → try channel 2
    │   └── FAIL → Channel 2 (fallback):
    │       ├── FUNCTION: dispatch-notifications
    │       ├── DECISION: delivered?
    │       │   ├── YES → END (success, degraded channel)
    │       │   └── NO → RETRY → FAIL → try channel 3
    │       └── FAIL → Channel 3 (last resort):
    │           └── ALL FAILED → EVENT: notification.failed
    │                           → ESCALATE: Notification Manager AI
    └── WAIT: delivery receipt (async)
        → EVENT: notification.read (on open/click)
```

---

## 11. Operations Monitoring Workflows

### 11.1 daily-standup_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `daily-standup_v2` |
| **Purpose** | Generate daily operations briefing with KPIs, priorities, and action items |
| **Business Owner** | Operations Department |
| **Trigger** | Cron: weekdays at 8:00 AM; on-demand via operations-center_v2 |
| **Input Events** | (Scheduled) |
| **Output Events** | `standup.generated`, `standup.escalated` |
| **Entry Conditions** | System operational; data available for KPI calculation |
| **Exit Conditions** | Standup report generated and available in operations-center_v2 |
| **Success Criteria** | Report generated within 30s; all KPIs accurate |
| **Failure Criteria** | KPI calculation fails; data source unavailable |
| **Retry Strategy** | KPI calculation: 3 retries per data source |
| **Timeout Strategy** | Total: 2min. Per data source: 30s |
| **Escalation Strategy** | Data unavailable → Operations Manager AI |
| **Audit Requirements** | Standup generation logged |
| **Permissions** | Trigger: system. View: operations-center_v2 |
| **Applications Involved** | `operations-center_v2`, `analytics-center_v2` |
| **Tables Read** | ALL domain tables (aggregated KPIs) |
| **Tables Written** | `events_v2` |
| **Agents Called** | `operations-coordinator_v2`, `operations-manager_v2` |
| **Functions Executed** | `create-operations-tasks`, `collect-resolved-tickets` |
| **Notifications Generated** | Standup summary pushed to operations-center_v2 dashboard |
| **Human Approvals Required** | None (informational) |
| **Next Workflows Triggered** | None directly (standup is informational) |
| **Decision Nodes** | Priority items? (yes/no — if blocked items detected) |
| **Parallel Tasks** | Multi-source KPI collection (parallel) |

### 11.2 operations-coordination_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `operations-coordination_v2` |
| **Purpose** | Coordinate cross-department operations, detect blockers, and assign tasks |
| **Business Owner** | Operations Department |
| **Trigger** | On-demand via operations-center_v2 "Run Coordinator" button; triggered by block detection |
| **Input Events** | (Manual or event-based) |
| **Output Events** | `task.created`, `task.assigned`, `blocker.identified` |
| **Entry Conditions** | Operations data available; not already running |
| **Exit Conditions** | Action list created; tasks assigned |
| **Success Criteria** | All active issues identified; priority-ordered action list |
| **Failure Criteria** | Action list exceeds 10 items with no overflow strategy |
| **Retry Strategy** | 2 retries |
| **Timeout Strategy** | 30s |
| **Escalation Strategy** | Critical blocker → Operations Manager AI |
| **Audit Requirements** | Action list generated, tasks created |
| **Permissions** | Trigger: operations-center_v2 users. View: operations-center_v2 |
| **Applications Involved** | `operations-center_v2`, `crm-center_v2` |
| **Tables Read** | `tasks_v2`, `tickets_v2`, `appointments_v2`, `dispatches_v2`, `technicians_v2`, `operations_log` |
| **Tables Written** | `tasks_v2`, `operations_log`, `events_v2` |
| **Agents Called** | `operations-coordinator_v2`, `operations-manager_v2` |
| **Functions Executed** | `create-operations-tasks` |
| **Notifications Generated** | Task assignment notifications to assignees |
| **Human Approvals Required** | Task assignments require human confirmation |
| **Next Workflows Triggered** | `notification-delivery_v2` (task assignment) |
| **Decision Nodes** | Priority (critical/high/medium/low), ownership assignment |
| **Parallel Tasks** | Cross-domain data collection (parallel) |

---

## 12. SLA Lifecycle Workflows

### 12.1 sla-enforcement_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `sla-enforcement_v2` |
| **Purpose** | Calculate SLA deadlines, track compliance in real-time, and enforce breach consequences |
| **Business Owner** | Support Department |
| **Trigger** | `ticket.created` (start SLA timer); system tick (1min) for active SLA monitoring |
| **Input Events** | `ticket.created`, `ticket.status.changed`, `ticket.escalated`, `ticket.sla_breached` |
| **Output Events** | `ticket.sla_warning`, `ticket.sla_breached`, `ticket.sla.updated` |
| **Entry Conditions** | Ticket has SLA tier; SLA rules defined for that tier |
| **Exit Conditions** | Ticket closed (SLA stops) or SLA breached and handled |
| **Success Criteria** | SLA compliance > 95%; warnings issued at 75% of deadline |
| **Failure Criteria** | SLA breach without warning; false warning > 10% |
| **Retry Strategy** | None (continuous monitoring) |
| **Timeout Strategy** | N/A |
| **Escalation Strategy** | SLA warning → assignee + Support Manager. SLA breach → Escalation Manager AI |
| **Audit Requirements** | SLA timer start, warning, breach, resolution |
| **Permissions** | Trigger: system. View: support-center_v2 |
| **Applications Involved** | `support-center_v2`, `notification-center_v2`, `analytics-center_v2` |
| **Tables Read** | `tickets_v2`, `customers_v2`, `system_settings_v2` |
| **Tables Written** | `tickets_v2` (sla_deadline), `events_v2` |
| **Agents Called** | `support-sla-monitor_v2`, `support-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | SLA warning to assignee, SLA breach to Support Manager + customer |
| **Human Approvals Required** | None (monitoring + alerting) |
| **Next Workflows Triggered** | `ticket-escalation_v2` (on breach), `notification-delivery_v2` |
| **Decision Nodes** | SLA status (on-track/warning/breached), customer tier (standard/premium/enterprise) |
| **Parallel Tasks** | Per-ticket SLA monitoring (in parallel for all active tickets) |

---

## 13. Reporting Lifecycle Workflows

### 13.1 report-generation_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `report-generation_v2` |
| **Purpose** | Generate scheduled and ad-hoc business reports by aggregating cross-domain data |
| **Business Owner** | Reporting Department |
| **Trigger** | Cron: per schedule in `analytics_schedules_v2`; on-demand via analytics-center_v2 |
| **Input Events** | `analytics.report.requested`, `report.scheduled.trigger` |
| **Output Events** | `report.generated`, `report.failed` |
| **Entry Conditions** | Report definition exists; data sources available |
| **Exit Conditions** | Report generated and stored |
| **Success Criteria** | Report generated within 5min (standard) or 30min (complex) |
| **Failure Criteria** | Query timeout; data source unavailable; report definition error |
| **Retry Strategy** | 2 retries with 5min interval |
| **Timeout Strategy** | Standard: 5min. Complex: 30min. |
| **Escalation Strategy** | Query timeout → Reporting Manager AI. Data unavailable → Analytics Manager AI |
| **Audit Requirements** | Report generation timestamp, data sources, row count |
| **Permissions** | Trigger: system (scheduled) + analytics-center_v2 (manual). View: analytics-center_v2 |
| **Applications Involved** | `analytics-center_v2`, `notification-center_v2` |
| **Tables Read** | `analytics_reports_v2`, `analytics_schedules_v2`, ALL domain tables |
| **Tables Written** | `events_v2` |
| **Agents Called** | `reporting-generator_v2`, `trend-analyzer_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Report ready notification to subscribers |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `report-distribution_v2`, `notification-delivery_v2` |
| **Decision Nodes** | Report type (standard/complex/ad-hoc), schedule (one-time/recurring) |
| **Parallel Tasks** | Multi-source data aggregation (parallel queries) |

### 13.2 report-distribution_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `report-distribution_v2` |
| **Purpose** | Distribute generated reports to stakeholders through appropriate channels |
| **Business Owner** | Reporting Department |
| **Trigger** | `report.generated` event |
| **Input Events** | `report.generated` |
| **Output Events** | `report.distributed`, `report.distribution.failed` |
| **Entry Conditions** | Report generated; subscriber list defined |
| **Exit Conditions** | Report delivered to all subscribers |
| **Success Criteria** | All subscribers receive report; delivery confirmed |
| **Failure Criteria** | Delivery to key stakeholder fails |
| **Retry Strategy** | Per subscriber: 3 retries |
| **Timeout Strategy** | Total: 1h |
| **Escalation Strategy** | Key stakeholder delivery failure → Reporting Manager AI |
| **Audit Requirements** | Distribution list, delivery confirmation |
| **Permissions** | Trigger: system. View: analytics-center_v2 |
| **Applications Involved** | `analytics-center_v2`, `notification-center_v2` |
| **Tables Read** | `analytics_reports_v2`, `analytics_schedules_v2`, `notification_channels_v2` |
| **Tables Written** | `notifications_v2`, `events_v2` |
| **Agents Called** | `reporting-distributor_v2`, `notification-channel-optimizer_v2` |
| **Functions Executed** | `dispatch-notifications` |
| **Notifications Generated** | Report delivery to each subscriber |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `notification-delivery_v2` |
| **Decision Nodes** | Channel selection, subscriber priority |
| **Parallel Tasks** | Multi-subscriber distribution (parallel) |

---

## 14. Analytics Lifecycle Workflows

### 14.1 trend-analysis_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `trend-analysis_v2` |
| **Purpose** | Continuously monitor business metrics, detect statistically significant trends, and generate insights |
| **Business Owner** | Analytics Department |
| **Trigger** | Cron: daily at 4:00 AM; event-driven on significant metric changes |
| **Input Events** | ALL domain events (consumed for analysis) |
| **Output Events** | `analytics.trend.identified`, `analytics.insight.generated` |
| **Entry Conditions** | Sufficient data window (min 7 days) for trend calculation |
| **Exit Conditions** | Trend analysis complete; insights generated |
| **Success Criteria** | Trends detected with > 90% statistical significance |
| **Failure Criteria** | Insufficient data for analysis |
| **Retry Strategy** | 2 retries |
| **Timeout Strategy** | 10min |
| **Escalation Strategy** | Data quality issue → Analytics Manager AI |
| **Audit Requirements** | Trend analysis results |
| **Permissions** | Trigger: system. View: analytics-center_v2 |
| **Applications Involved** | `analytics-center_v2` |
| **Tables Read** | `events_v2`, ALL domain tables |
| **Tables Written** | `events_v2` |
| **Agents Called** | `trend-analyzer_v2`, `analytics-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Trend alert to department managers |
| **Human Approvals Required** | None |
| **Next Workflows Triggered** | `report-generation_v2` (if trend significant), `notification-delivery_v2` |
| **Decision Nodes** | Trend significance (significant/notable/noise), trend direction (positive/negative) |
| **Parallel Tasks** | Cross-metric analysis (parallel per domain) |

### 14.2 anomaly-detection_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `anomaly-detection_v2` |
| **Purpose** | Detect anomalies in business metrics and operational patterns in real-time |
| **Business Owner** | Analytics Department |
| **Trigger** | Event-driven: consumed ALL domain events; cron: hourly batch check |
| **Input Events** | ALL domain events |
| **Output Events** | `analytics.anomaly.detected`, `analytics.anomaly.investigated` |
| **Entry Conditions** | Baseline established (min 30 days data) |
| **Exit Conditions** | Anomaly confirmed or dismissed |
| **Success Criteria** | Anomaly detected within 1h of occurrence; false positive rate < 5% |
| **Failure Criteria** | Missed anomaly; false positive > 10% |
| **Retry Strategy** | None |
| **Timeout Strategy** | Per check: 5min |
| **Escalation Strategy** | Critical anomaly → Analytics Manager AI + relevant Department Manager |
| **Audit Requirements** | Anomaly detection, investigation, resolution |
| **Permissions** | Trigger: system. View: analytics-center_v2 |
| **Applications Involved** | `analytics-center_v2`, `notification-center_v2` |
| **Tables Read** | `events_v2`, ALL domain tables |
| **Tables Written** | `events_v2` |
| **Agents Called** | `trend-analyzer_v2`, `predictive-modeler_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Anomaly alert to department managers |
| **Human Approvals Required** | Critical anomaly requires human investigation |
| **Next Workflows Triggered** | `trend-analysis_v2` (deep dive), `report-generation_v2`, `notification-delivery_v2`, `operations-coordination_v2` |
| **Decision Nodes** | Severity (critical/major/minor), root cause candidate |
| **Parallel Tasks** | Multi-metric anomaly checking (parallel) |

---

## 15. Administration Workflows

### 15.1 user-provisioning_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `user-provisioning_v2` |
| **Purpose** | Manage user account lifecycle from creation through deactivation |
| **Business Owner** | Administration Department |
| **Trigger** | `user.created` event; manual via admin-center_v2 |
| **Input Events** | `user.created`, `user.role.changed`, `user.disabled` |
| **Output Events** | `user.provisioned`, `user.suspended`, `user.deleted` |
| **Entry Conditions** | User request validated; role assigned |
| **Exit Conditions** | User provisioned with correct permissions |
| **Success Criteria** | User provisioned within 15min of request |
| **Failure Criteria** | Role assignment conflict; permission error |
| **Retry Strategy** | 3 retries |
| **Timeout Strategy** | Human approval: 4h |
| **Escalation Strategy** | Permission conflict → Admin Manager AI |
| **Audit Requirements** | User creation, role assignment, permission grants |
| **Permissions** | Trigger: admin-center_v2. View: admin-center_v2 |
| **Applications Involved** | `admin-center_v2` |
| **Tables Read** | `users_v2`, `user_roles_v2`, `role_permissions_v2` |
| **Tables Written** | `users_v2`, `user_sessions_v2`, `events_v2` |
| **Agents Called** | `admin-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Welcome email to new user; notification to manager |
| **Human Approvals Required** | User deactivation requires human approval |
| **Next Workflows Triggered** | `notification-delivery_v2` |
| **Decision Nodes** | User type (admin/agent/technician/customer) |
| **Parallel Tasks** | Permission grants + welcome notification (parallel) |

### 15.2 system-config-management_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `system-config-management_v2` |
| **Purpose** | Manage system configuration changes with validation and rollback capability |
| **Business Owner** | Administration Department |
| **Trigger** | `system.config.change.requested` event; manual via admin-center_v2 |
| **Input Events** | `system.config.change.requested`, `system.config.changed` (rollback) |
| **Output Events** | `system.config.changed`, `system.config.rollback` |
| **Entry Conditions** | Change request validated; impact assessed |
| **Exit Conditions** | Configuration applied and verified; or rolled back |
| **Success Criteria** | Configuration applied without service disruption |
| **Failure Criteria** | Configuration causes system error; validation fails |
| **Retry Strategy** | Automatic rollback on failure (immediate) |
| **Timeout Strategy** | Human approval: 4h. Change window: scheduled maintenance |
| **Escalation Strategy** | Change causes system impact → Admin Manager AI + Platform Orchestrator |
| **Audit Requirements** | Change request, approval, before/after values |
| **Permissions** | Trigger: admin-center_v2. View: admin-center_v2 |
| **Applications Involved** | `admin-center_v2` |
| **Tables Read** | `system_settings_v2`, `feature_flags_v2` |
| **Tables Written** | `system_settings_v2`, `feature_flags_v2`, `events_v2` |
| **Agents Called** | `admin-system-config_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Config change notification to stakeholders |
| **Human Approvals Required** | ALL configuration changes require human approval |
| **Next Workflows Triggered** | `notification-delivery_v2` |
| **Decision Nodes** | Change type (system_setting/feature_flag/connector) |
| **Parallel Tasks** | Impact assessment + validation (parallel) |

---

## 16. Inventory Lifecycle Workflows

### 16.1 inventory-reorder_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `inventory-reorder_v2` |
| **Purpose** | Monitor inventory levels and trigger reorder when stock falls below threshold |
| **Business Owner** | Operations Department |
| **Trigger** | Cron: daily at 6:00 AM; `inventory_transactions_v2` INSERT (stock change event) |
| **Input Events** | `inventory.transaction.recorded`, `inventory.item.low_stock` |
| **Output Events** | `inventory.reorder.started`, `inventory.reorder.completed` |
| **Entry Conditions** | Inventory item exists; reorder threshold configured |
| **Exit Conditions** | Reorder initiated or stock sufficient |
| **Success Criteria** | Reorder placed before stockout; lead time sufficient |
| **Failure Criteria** | Stockout occurs before reorder arrives |
| **Retry Strategy** | 3 retries for reorder placement |
| **Timeout Strategy** | Reorder approval: 24h |
| **Escalation Strategy** | Stockout risk → Operations Manager AI. Reorder approval delay → Admin Manager AI |
| **Audit Requirements** | Inventory level check, reorder trigger |
| **Permissions** | Trigger: system. View: operations-center_v2 |
| **Applications Involved** | `operations-center_v2`, `admin-center_v2` |
| **Tables Read** | `inventory_items_v2`, `inventory_transactions_v2` |
| **Tables Written** | `inventory_items_v2` (reorder_status), `notifications_v2`, `events_v2` |
| **Agents Called** | None (deterministic threshold check) |
| **Functions Executed** | None |
| **Notifications Generated** | Reorder alert to warehouse manager |
| **Human Approvals Required** | Purchase order requires human approval |
| **Next Workflows Triggered** | `notification-delivery_v2` |
| **Decision Nodes** | Stock level (adequate/low/critical), reorder needed? (yes/no) |
| **Parallel Tasks** | Multi-item reorder check (parallel) |

---

## 17. Quality Lifecycle Workflows

### 17.1 quality-review_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `quality-review_v2` |
| **Purpose** | Perform quality assurance reviews on AI-generated content, dispute resolutions, and customer interactions |
| **Business Owner** | QA Department |
| **Trigger** | `qa.audit.triggered` event (from Response Quality Monitor AI or Compliance Monitor AI) |
| **Input Events** | `qa.audit.triggered`, `ticket.reply.drafted`, `dispute.analyzed`, `feedback.submitted` |
| **Output Events** | `qa.review.completed`, `qa.violation.found`, `qa.approved` |
| **Entry Conditions** | Audit trigger valid; content available for review |
| **Exit Conditions** | Review completed; issue resolved or escalated |
| **Success Criteria** | Review completed within 24h; all issues identified |
| **Failure Criteria** | Review misses violation; false positive |
| **Retry Strategy** | None |
| **Timeout Strategy** | Standard review: 24h. Critical: 4h |
| **Escalation Strategy** | Policy violation → QA Manager AI + Admin Manager AI. Repeated violation → Platform Orchestrator |
| **Audit Requirements** | Review decisions, violations found, corrective actions |
| **Permissions** | Trigger: system. View: admin-center_v2 |
| **Applications Involved** | `admin-center_v2`, `support-center_v2` |
| **Tables Read** | `tickets_v2`, `ticket_messages_v2`, `disputes_v2`, `feedback_v2` |
| **Tables Written** | `events_v2` |
| **Agents Called** | `qa-response-quality-monitor_v2`, `qa-compliance-monitor_v2`, `qa-manager_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Review result to content author, violation alert to manager |
| **Human Approvals Required** | ALL compliance violations require human review |
| **Next Workflows Triggered** | `ticket-escalation_v2` (if ticket-related), `notification-delivery_v2` |
| **Decision Nodes** | Review result (pass/fail/marginal), violation severity (minor/major/critical) |
| **Parallel Tasks** | Content review + compliance check (parallel) |

---

## 18. Automation Lifecycle Workflows

### 18.1 workflow-health-monitor_v2

| Field | Value |
|-------|-------|
| **Workflow Name** | `workflow-health-monitor_v2` |
| **Purpose** | Monitor the health of all workflow executions, detect failures, and trigger recovery |
| **Business Owner** | Automation Department |
| **Trigger** | `system.workflow.failed` event; `system.health.alert` event; cron (hourly health check) |
| **Input Events** | `system.workflow.failed`, `system.workflow.started`, `system.workflow.completed`, `system.health.alert` |
| **Output Events** | `system.workflow.recovered`, `system.workflow.dead_letter`, `system.health.restored` |
| **Entry Conditions** | Workflow execution record exists |
| **Exit Conditions** | Issue resolved or escalated |
| **Success Criteria** | 99.9% workflow execution success rate |
| **Failure Criteria** | Workflow failure rate > 5% |
| **Retry Strategy** | Failed workflow: 2 retries with 5min interval |
| **Timeout Strategy** | Recovery: 15min. If not recovered, escalate |
| **Escalation Strategy** | Repeated failure → Automation Manager AI. System-wide failure → Platform Orchestrator AI |
| **Audit Requirements** | All workflow health events, recovery actions |
| **Permissions** | Trigger: system. View: admin-center_v2 |
| **Applications Involved** | `admin-center_v2` |
| **Tables Read** | `events_v2`, `audit_log_v2` |
| **Tables Written** | `events_v2` |
| **Agents Called** | `automation-manager_v2`, `workflow-orchestrator_v2` |
| **Functions Executed** | None |
| **Notifications Generated** | Health alert to Automation Manager, critical alert to Platform Orchestrator |
| **Human Approvals Required** | System-wide workflow pause requires human approval |
| **Next Workflows Triggered** | `notification-delivery_v2` |
| **Decision Nodes** | Failure severity (transient/persistent/critical), recovery possible? (yes/no) |
| **Parallel Tasks** | Multi-workflow health check (parallel) |

---

> **End of BUSINESS_PROCESS_MAP.md**  
> Next document: WORKFLOW_BUILD_ORDER.md
