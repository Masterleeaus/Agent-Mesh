# RESQAI V2 — Dependency Matrix

> Phase 3.3 — Integration Contracts  
> Principal Enterprise Solution Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [support-center_v2](#1-support-center_v2)
2. [operations-center_v2](#2-operations-center_v2)
3. [appointment-center_v2](#3-appointment-center_v2)
4. [technician-portal_v2](#4-technician-portal_v2)
5. [resolution-center_v2](#5-resolution-center_v2)
6. [crm-center_v2](#6-crm-center_v2)
7. [analytics-center_v2](#7-analytics-center_v2)
8. [customer-portal_v2](#8-customer-portal_v2)
9. [admin-center_v2](#9-admin-center_v2)

---

## 1. support-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| tickets_v2 | Read/Write | Primary entity — ticket CRUD |
| ticket_messages_v2 | Read/Write | Message thread per ticket |
| ticket_attachments_v2 | Read | File attachments per ticket |
| customers_v2 | Read | Customer context for tickets |
| technicians_v2 | Read | Suggested owner resolution |
| technicians_skills_v2 | Read | Skill matching for assignment |
| appointments_v2 | Read | Ticket context |
| disputes_v2 | Read | Ticket context |
| operations_log_v2 | Read | Activity feed per ticket |
| notification_templates_v2 | Read/Write | Reply template management |
| system_settings_v2 | Read | Queue config, SLA definitions |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| validate-ticket-input | Synchronous — pre-validation before ticket creation | Validate ticket fields |
| check-ticket-urgency | Synchronous — during ticket creation/classification | Determine urgency level |
| classify-ticket-sla-tier | Synchronous — after classification | Determine SLA tier and deadlines |
| update-ticket-record | Synchronous — on every status/owner change | Execute state transitions |
| check-sla-deadline | Synchronous or scheduled | Check SLA status |
| batch-sla-check | Scheduled (cron) | Batch SLA compliance check |
| extract-knowledge-gap | Scheduled (weekly) | Identify missing knowledge articles |
| search-knowledge-articles | On-demand | Knowledge base search |
| suggest-knowledge-article | On-demand (via agent) | Suggest articles for ticket |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| request-classifier_v2 | On ticket.created | Classify type, urgency, suggest owner |
| support-reply-drafter_v2 | On manual trigger or auto | Draft customer reply |
| support-manager_v2 | Workflow orchestration | Manage ticket lifecycle |
| support-sla-monitor_v2 | Scheduled + event | Monitor SLA compliance |
| support-escalation-manager_v2 | On escalate | Manage escalation path |
| knowledge-manager_v2 | Scheduled | Manage knowledge base |
| knowledge-curator_v2 | Scheduled | Curate knowledge articles |
| knowledge-article-suggester_v2 | On-demand | Suggest matching articles |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ticket-intake_v2 | ticket.created | Intake, classify, route, SLA assign |
| ticket-auto-response_v2 | ticket.created | Auto-respond to known issues |
| ticket-escalation_v2 | ticket.escalated | Manage escalation path |
| sla-enforcement_v2 | ticket.created, scheduled | Monitor and enforce SLAs |
| support-escalation-manager_v2 | ticket.escalated, ticket.sla_breached | Escalation management |
| knowledge-gap-detection_v2 | Scheduled (weekly) | Detect knowledge gaps |
| customer-satisfaction-monitor_v2 | ticket.closed | Post-resolution survey |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| ticket.created | Produced | Trigger intake workflow |
| ticket.classified | Produced | Update UI with classification |
| ticket.reply.drafted | Produced | Start approval workflow |
| ticket.reply.approved | Produced | Trigger notification send |
| ticket.reply.rejected | Produced | Return to agent for revision |
| ticket.status.changed | Produced | Update UI, notify customer |
| ticket.escalated | Produced | Notify ops center |
| ticket.assigned | Produced | Notify new owner |
| ticket.sla_breached | Consumed | Display SLA alert |
| ticket.closed | Produced | Trigger satisfaction monitor |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| SMTP (via notification-center_v2) | Customer email replies |
| Email inbound (future) | Ingestion of email-originated tickets |

### Reports Required

| Report | Purpose |
|--------|---------|
| Ticket volume by channel/type/urgency | Capacity planning |
| SLA compliance rate | Performance tracking |
| Agent performance (resolved, handle time, satisfaction) | Agent evaluation |
| Escalation frequency and causes | Process improvement |
| Reply template usage | Template optimization |

---

## 2. operations-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| tickets_v2 | Read | Urgent, escalated, dispatch-related tickets |
| tasks_v2 | Read/Write | Task CRUD for operations |
| task_assignments_v2 | Read/Write | Task assignment tracking |
| appointments_v2 | Read | Today's appointments for dashboard |
| appointments_reminders_v2 | Read | Reminder status |
| technicians_v2 | Read | Technician workload and availability |
| technicians_skills_v2 | Read | Skill-based assignment |
| operations_log_v2 | Read/Write | Operations audit trail |
| customers_v2 | Read | Dispatch context |
| dispatches_v2 | Read/Write | Dispatch lifecycle |
| followups_v2 | Read | Overdue followup alerts |
| work_orders_v2 | Read | Work order status |
| accounts_v2 | Read | Account health for dashboard |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| finalize-dispatch | Synchronous | Finalize dispatch record |
| calculate-dispatch-priority | Synchronous | Calculate dispatch priority score |
| create-operations-tasks | Synchronous or agent-call | Create tasks from workflow |
| generate-standup-report | Scheduled (daily) | Generate daily standup |
| dispatch-notifications | Synchronous | Send dispatch alerts |
| create-work-order | Synchronous | Create work order from completed dispatch |
| check-inventory-level | On-demand | Check stock for dispatch |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| operations-coordinator_v2 | On-demand or daily | Generate recommendations, create tasks |
| operations-manager_v2 | Workflow orchestration | Oversee operations workflows |
| dispatch-manager_v2 | Event-driven | Manage dispatch lifecycle |
| dispatch-coordinator_v2 | Event-driven | Coordinate dispatch actions |
| dispatch-technician-dispatcher_v2 | Event-driven | Send dispatch to technician |
| dispatch-emergency-response_v2 | On urgent | Handle emergency dispatches |
| operations-work-order-manager_v2 | On work order events | Manage work orders |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| urgent-dispatch_v2 | ticket.escalated, ticket.created (urgent) | Urgent dispatch lifecycle |
| standard-dispatch_v2 | dispatch.created | Normal dispatch lifecycle |
| daily-standup_v2 | Scheduled (daily) | Generate standup report |
| operations-coordination_v2 | Scheduled or event | Cross-domain coordination |
| work-order-fulfillment_v2 | appointment.completed | Work order lifecycle |
| followup-slippage-detector_v2 | Consumes slippage alert | Manage overdue followups |
| inventory-reorder_v2 | Low stock detection | Auto-reorder inventory |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| ticket.escalated | Consumed | Trigger dispatch |
| ticket.classified (urgent) | Consumed | Urgent dispatch alert |
| ticket.sla_breached | Consumed | SLA alert display |
| task.created | Produced | Notify assignee |
| task.status.changed | Produced | Update task board |
| task.assigned | Consumed | Update task owner |
| dispatch.initiated | Produced | Start dispatch workflow |
| dispatch.completed | Produced | Close dispatch lifecycle |
| daily.standup.generated | Produced | Notify stakeholders |
| appointment.status.changed | Consumed | Dashboard KPI update |
| followup.slippage.detected | Consumed | Blocker alert |
| account.health.changed (critical) | Consumed | Critical account alert |
| technician.availability.changed | Consumed | Workload update |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| Twilio SMS (via notification-center_v2) | Technician dispatch alerts |
| Slack (via notification-center_v2) | Operations channel notifications |
| Discord (via notification-center_v2) | Urgent dispatch escalation |

### Reports Required

| Report | Purpose |
|--------|---------|
| Dispatch volume and response times | Dispatch performance |
| Task completion rate by assignee | Team productivity |
| Technician utilization | Resource planning |
| Daily standup summary | Operational overview |
| Operations blocker frequency | Process improvement |

---

## 3. appointment-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| appointments_v2 | Read/Write | Primary entity — appointment CRUD |
| appointment_reminders_v2 | Read/Write | Reminder scheduling |
| customers_v2 | Read | Customer details for appointments |
| technicians_v2 | Read | Assignment, availability |
| technicians_skills_v2 | Read | Skill matching |
| tickets_v2 | Read | Service-related tickets |
| operations_log_v2 | Read/Write | Audit trail |
| system_settings_v2 | Read | Scheduling rules, buffers |
| service_types_v2 | Read/Write | Service type catalog |
| disputes_v2 | Read | Disputed appointment flags |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| assign-appointment-technician | Synchronous | Assign tech with validation |
| fetch-upcoming-appointments | Scheduled | Fetch for reminder scheduling |
| schedule-appointment-reminders | On appointment.confirmed | Schedule reminder records |
| check-reminder-window | Scheduled | Check if reminder should send |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| tech-suggester_v2 | On appointment.created | AI-recommended technician |
| scheduling-manager_v2 | Workflow orchestration | Manage scheduling workflows |
| scheduling-appointment-scheduler_v2 | Event-driven | Coordinate booking lifecycle |
| scheduling-technician-suggester_v2 | Event-driven | Suggest best-fit technicians |
| appointment-reminder-coordinator_v2 | Scheduled | Coordinate reminder dispatch |
| appointment-no-show-handler_v2 | On no_show event | Handle no-show procedures |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| appointment-booking_v2 | appointment.requested | Full booking lifecycle |
| appointment-assignment_v2 | appointment.created | AI suggestion → approval → assignment |
| appointment-reminders_v2 | appointment.confirmed | Schedule and send reminders |
| appointment-completion_v2 | appointment.completed | Post-completion tasks |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| appointment.created | Produced | Trigger assignment workflow |
| appointment.confirmed | Produced | Start reminder scheduling |
| appointment.assigned | Produced | Notify technician |
| appointment.rescheduled | Produced | Update schedules |
| appointment.cancelled | Produced | Free technician slot |
| appointment.completed | Produced | Trigger post-completion |
| appointment.started | Consumed | Update calendar |
| appointment.status.changed | Produced | General status sync |
| ticket.classified (service-required) | Consumed | Auto-schedule from ticket |
| technician.availability.changed | Consumed | Update availability cache |
| dispute.created | Consumed | Flag appointment as disputed |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| Twilio SMS (via notification-center_v2) | Appointment reminders to customer |
| SMTP (via notification-center_v2) | Email confirmations |
| Google Calendar (future) | Calendar sync |

### Reports Required

| Report | Purpose |
|--------|---------|
| Appointment volume by service type | Service demand planning |
| Technician utilization rate | Scheduling efficiency |
| No-show rate and causes | Process improvement |
| Average time-to-assign | Scheduling velocity |
| Reschedule/cancellation rate | Customer satisfaction indicator |

---

## 4. technician-portal_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| appointments_v2 | Read/Write | Job status, notes, photos (own scope) |
| tasks_v2 | Read/Write | Assigned tasks (own scope) |
| task_assignments_v2 | Read | Task assignment info |
| customers_v2 | Read | Customer contact and address |
| technicians_v2 | Read/Write | Own profile, availability |
| technician_skills_v2 | Read | Own skills |
| notifications_v2 | Read | Notification feed |
| work_orders_v2 | Read/Write | Work order lifecycle |
| work_order_stages_v2 | Read/Write | Stage progression |
| dispatches_v2 | Read | Dispatch info (own scope) |
| inventory_items_v2 | Read | Parts lookup |
| inventory_transactions_v2 | Write | Parts usage recording |
| feedback_v2 | Write | Post-job feedback submission |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| fetch-upcoming-appointments | On page load | Load day schedule |
| create-work-order | On job completion | Generate work order |
| update-work-order-stage | On every stage change | Track work order progress |
| complete-work-order | On job completion | Finalize work order |
| record-inventory-transaction | On parts usage | Track inventory |
| dispatch-notifications | Consumed | Receive dispatch alerts |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| None (technician-portal is read-heavy, action-light) | — | — |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| work-order-fulfillment_v2 | work_order.created | Work order status management |
| appointment-completion_v2 | appointment.completed | Post-completion processing |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| appointment.started | Produced | Notify ops center |
| appointment.completed | Produced | Trigger completion workflow |
| appointment.no_show | Produced | Flag no-show for resolution |
| work_order.created | Consumed | New work order available |
| work_order.stage.changed | Produced | Track progress |
| work_order.completed | Produced | Finalize work order |
| dispatch.acknowledged | Produced | Confirm dispatch receipt |
| dispatch.declined | Produced | Decline dispatch |
| dispatch.completed | Produced | Close dispatch |
| technician.availability.changed | Produced | Update availability |
| task.completed | Produced | Close assigned task |
| appointment.assigned | Consumed | New job assigned |
| appointment.rescheduled | Consumed | Schedule changed |
| appointment.cancelled | Consumed | Job cancelled |
| dispatch.initiated | Consumed | New dispatch |
| task.created | Consumed | New task |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| Twilio SMS (via notification-center_v2) | Receive dispatch alerts |
| Push notifications (via notification-center_v2) | In-app alerts |

### Reports Required

| Report | Purpose |
|--------|---------|
| My completed jobs (technician self-view) | Personal performance |
| Job duration breakdown | Time management |

---

## 5. resolution-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| disputes_v2 | Read/Write | Primary entity — dispute CRUD |
| dispute_evidence_v2 | Read/Write | Evidence items |
| appointments_v2 | Read | Dispute context |
| customers_v2 | Read | Customer details |
| tickets_v2 | Read | Related tickets |
| operations_log_v2 | Read/Write | Audit trail |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| resolve-dispute | Synchronous | Finalize dispute with outcome |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| resolution-advisor_v2 | On dispute.created or manual | Analyze dispute, recommend resolution |
| None (explicit agent is the primary AI interaction) | — | — |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| dispute-resolution_v2 | dispute.created | Analysis → recommendation → approval |
| dispute-escalation_v2 | dispute.escalated | Escalation path |
| customer-satisfaction-monitor_v2 | dispute.resolved | Post-resolution survey |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| dispute.created | Produced | Start resolution workflow |
| dispute.analyzing | Produced | Show analysis in progress |
| dispute.analyzed | Produced | Display recommendation |
| dispute.escalated | Produced | Escalation notification |
| dispute.approved | Produced | Proceed with resolution |
| dispute.rejected | Produced | Return for revision |
| dispute.resolved | Produced | Close dispute, notify stakeholders |
| dispute.status.changed | Produced | General status sync |
| appointment.status.changed (needs_followup) | Consumed | Dispute from appointment |
| customer.dispute.filed | Consumed | Customer portal dispute |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| SMTP (via notification-center_v2) | Customer resolution notifications |

### Reports Required

| Report | Purpose |
|--------|---------|
| Dispute volume by type/severity | Trend tracking |
| Average resolution time | Efficiency metric |
| Resolution outcome distribution | Quality monitoring |
| AI confidence distribution | Agent effectiveness |
| Dispute frequency by service type | Process improvement |

---

## 6. crm-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| accounts_v2 | Read/Write | Account health, status |
| account_health_scans_v2 | Read/Write | Health scan history |
| customers_v2 | Read | Customer context |
| followups_v2 | Read/Write | Followup lifecycle |
| followup_attempts_v2 | Read | Followup attempt history |
| tickets_v2 | Read | Ticket context for health |
| appointments_v2 | Read | Appointment context for health |
| disputes_v2 | Read | Dispute context for health |
| feedback_v2 | Read | Feedback sentiment for health |
| tasks_v2 | Write | Escalation task creation |
| operations_log_v2 | Read/Write | Audit trail |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| account-health-scan | Scheduled + on-demand | Full health scan |
| update-account-health-status | Post-scan | Update health category |
| flag-slipping-followups | Scheduled + on-demand | Detect overdue followups |
| create-followup-tasks | Event-driven | Create followup from triggers |
| finalize-slippage-review | On human review | Finalize slippage action |
| generate-account-score | Within scan | Calculate numeric health score |
| process-feedback-survey | On submission | Process feedback responses |
| analyze-feedback-sentiment | On feedback.submitted | Analyze feedback text |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| account-health-monitor_v2 | Scheduled + on-demand | Orchestrate health scans |
| crm-manager_v2 | Workflow orchestration | Manage CRM workflows |
| crm-account-health-monitor_v2 | Scheduled | Monitor account health |
| crm-followup-manager_v2 | Event-driven | Manage followup lifecycle |
| cx-satisfaction-survey_v2 | On ticket closed | Send satisfaction surveys |
| cx-feedback-analyzer_v2 | On feedback.submitted | Analyze feedback sentiment |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| account-health-scan_v2 | Scheduled (nightly) + on-demand | Full health scan cycle |
| followup-management_v2 | followup.created | Followup lifecycle |
| followup-slippage-detector_v2 | Scheduled | Detect slipping followups |
| retention-campaign_v2 | account.health.changed (at_risk) | Automated retention |
| customer-satisfaction-monitor_v2 | ticket.closed, appointment.completed | Satisfaction tracking |
| feedback-analysis_v2 | feedback.submitted | Feedback processing |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| account.health.scan.completed | Produced | Trigger health category update |
| account.health.changed | Produced | Notify stakeholders |
| account.risk.signal.detected | Produced | Alert on new risks |
| account.relationship.changed | Produced | Track relationship changes |
| followup.created | Produced | Notify assignee |
| followup.completed | Produced | Close followup loop |
| followup.slippage.detected | Produced | Alert ops center |
| followup.missed | Consumed | Slippage trigger |
| feedback.submitted | Consumed | Process feedback |
| feedback.response_needed | Produced | Request followup response |
| ticket.status.changed | Consumed | Health signal input |
| appointment.completed | Consumed | Health signal input |
| dispute.resolved | Consumed | Health signal input |
| appointment.created | Consumed | Health signal input |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| SMTP (via notification-center_v2) | Account health alerts, followup notifications |

### Reports Required

| Report | Purpose |
|--------|---------|
| Account health distribution | Portfolio health overview |
| Followup completion rate | Team effectiveness |
| Health score trend by account | Individual account tracking |
| Risk signal frequency by type | Early warning effectiveness |
| Retention campaign effectiveness | Churn reduction metrics |
| Customer satisfaction by account | Account-level NPS |

---

## 7. analytics-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| events_v2 | Read | Event stream for metric computation |
| analytics_reports_v2 | Read/Write | Report definitions and cached data |
| analytics_schedules_v2 | Read | Scheduled report configs |
| tickets_v2 | Read | Ticket metrics |
| appointments_v2 | Read | Appointment metrics |
| dispatches_v2 | Read | Dispatch metrics |
| tasks_v2 | Read | Task metrics |
| work_orders_v2 | Read | Work order metrics |
| disputes_v2 | Read | Dispute metrics |
| accounts_v2 | Read | Account metrics |
| followups_v2 | Read | Followup metrics |
| feedback_v2 | Read | Customer satisfaction metrics |
| notifications_v2 | Read | Notification delivery metrics |
| customers_v2 | Read | Customer metrics |
| technicians_v2 | Read | Technician metrics |
| audit_log_v2 | Read | Audit-based metrics |
| users_v2 | Read | User activity metrics |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| sync-events-analytics | Scheduled | Sync events to analytics |
| calculate-metric-trend | On-demand + scheduled | Calculate metric trends |
| batch-metric-aggregation | Scheduled | Pre-compute metric aggregations |
| generate-report-data | On-demand | Generate report from definition |
| collect-resolved-tickets | On-demand | Collect resolution data for reports |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| analytics-trend-analyzer_v2 | Scheduled | Analyze metric trends |
| analytics-predictive-modeler_v2 | Scheduled | Predictive analytics |
| analytics-manager_v2 | Workflow orchestration | Manage analytics workflows |
| reporting-generator_v2 | On-demand | Generate reports |
| reporting-distributor_v2 | On report ready | Distribute reports |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| trend-analysis_v2 | Scheduled | Compute cross-domain trends |
| anomaly-detection_v2 | Scheduled | Detect metric anomalies |
| report-generation_v2 | Scheduled + on-demand | Generate and send reports |
| report-distribution_v2 | report.generated | Distribute to subscribers |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| ALL domain events (85+) | Consumed | Metric computation and trend analysis |
| report.generated | Produced | Notify subscribers |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| SMTP (via notification-center_v2) | Report distribution |

### Reports Required

| Report | Purpose |
|--------|---------|
| Executive summary | C-level operational overview |
| Support analytics | Ticket volume, SLA compliance, resolution time |
| Operations analytics | Dispatch volume, task completion, technician utilization |
| Appointment analytics | Booking volume, completion rate, no-show rate |
| Account analytics | Health distribution, retention rate, churn prediction |
| Dispute analytics | Volume, resolution time, outcome distribution |
| Custom reports | Ad-hoc user-defined reports |

---

## 8. customer-portal_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| customers_v2 | Read/Write | Own profile, preferences |
| tickets_v2 | Read/Write | Own tickets (RLS-scoped) |
| appointments_v2 | Read | Own appointments |
| disputes_v2 | Read | Own disputes |
| accounts_v2 | Read | Own account health |
| followups_v2 | Read | Own followups |
| notifications_v2 | Read | Own notifications |
| feedback_v2 | Write | Submit feedback |
| service_types_v2 | Read | Service catalog for booking |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| validate-ticket-input | Synchronous | Validate ticket creation |
| check-ticket-urgency | Synchronous | Determine ticket urgency |
| search-knowledge-articles | On-demand | Self-service knowledge search |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| None (customer-portal triggers agents indirectly via workflows) | — | — |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| ticket-intake_v2 | ticket.created.customer | Intake and classify portal tickets |
| appointment-booking_v2 | appointment.requested | Book appointment |
| appointment-assignment_v2 | appointment.requested | Assign technician |
| appointment-reminders_v2 | appointment.confirmed | Send reminders |
| customer-satisfaction-monitor_v2 | ticket.closed | Send satisfaction survey |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| ticket.created.customer | Produced | Trigger intake workflow |
| appointment.requested | Produced | Trigger booking workflow |
| appointment.cancelled.customer | Produced | Cancel appointment |
| ticket.status.changed | Consumed | Update ticket UI |
| appointment.status.changed | Consumed | Update appointment UI |
| dispute.status.changed | Consumed | Update dispute UI |
| notification.new | Consumed | Show notification badge |
| account.health.changed | Consumed | Update health gauge |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| SMTP (via notification-center_v2) | Customer emails |
| Twilio SMS (via notification-center_v2) | Customer SMS |

### Reports Required

| Report | Purpose |
|--------|---------|
| My service history | Customer self-view of all past services |

---

## 9. admin-center_v2

### Tables Required

| Table | Access | Purpose |
|-------|--------|---------|
| users_v2 | Read/Write | User CRUD |
| user_roles_v2 | Read/Write | Role assignment |
| roles_v2 | Read/Write | Role definitions |
| role_permissions_v2 | Read/Write | Permission definitions |
| user_sessions_v2 | Read | Session management |
| system_settings_v2 | Read/Write | System configuration |
| feature_flags_v2 | Read/Write | Feature flag management |
| connectors_v2 | Read/Write | Connector configuration |
| audit_log_v2 | Read | Audit trail |
| events_v2 | Read | Event bus monitoring |
| ALL operational tables | Read | System health checks |

### Functions Required

| Function | Call Pattern | Purpose |
|----------|-------------|---------|
| provision-user | Synchronous | Create user with role |
| deactivate-user | Synchronous | Disable user account |
| validate-config-change | Synchronous | Validate config before apply |
| apply-config-change | Synchronous | Apply validated change |
| log-audit-event | Synchronous (called by all) | Write audit entry |
| validate-permissions | Synchronous (middleware) | Check user permissions |
| generate-api-token | On-demand | Generate API tokens |
| rotate-credentials | Scheduled + on-demand | Security credential rotation |
| verify-workflow-health | On-demand | Check workflow instance health |
| recover-workflow-instance | On-demand | Recover stalled workflows |
| reset-circuit-breaker | On-demand | Reset tripped circuit breakers |
| evaluate-quality-score | On-demand | Quality evaluation |
| flag-quality-violation | On quality threshold | Flag compliance violations |

### Agents Required

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| admin-manager_v2 | Workflow orchestration | Manage admin workflows |
| admin-system-config_v2 | On config change request | Validate and apply config |
| admin-connector-manager_v2 | On connector change | Manage connectors |
| automation-manager_v2 | Scheduled | Manage automation health |
| automation-workflow-orchestrator_v2 | On workflow events | Workflow health management |
| qa-response-quality-monitor_v2 | Scheduled | Monitor response quality |
| qa-compliance-monitor_v2 | Scheduled | Monitor compliance |
| qa-manager_v2 | Workflow orchestration | Manage quality workflows |

### Workflows Required

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| user-provisioning_v2 | user.created request | Full user provisioning lifecycle |
| system-config-management_v2 | config change request | Validate, apply, notify |
| workflow-health-monitor_v2 | Scheduled | Monitor all workflow instances |
| quality-review_v2 | On quality event | Review flagged quality issues |

### Events Required

| Event | Direction | Purpose |
|-------|-----------|---------|
| user.created | Produced | Trigger welcome notification |
| user.role.changed | Produced | Trigger permission refresh |
| user.disabled | Produced | Invalidate sessions |
| user.login | Consumed | Activity tracking |
| system.config.changed | Produced | Trigger config refresh in all apps |
| system.health.alert | Consumed | Display health alert |
| notification.failed | Consumed | Display delivery failure alert |
| notification.delivered | Consumed | Delivery statistics |
| workflow.started | Consumed | Workflow monitoring |
| workflow.completed | Consumed | Workflow monitoring |
| workflow.failed | Consumed | Error alert |
| workflow.paused | Consumed | Human action required alert |
| agent.started | Consumed | Agent monitoring |
| agent.completed | Consumed | Agent monitoring |
| agent.failed | Consumed | Error alert |
| agent.low_confidence | Consumed | Quality alert |

### Connectors Required

| Connector | Purpose |
|-----------|---------|
| SMTP (via notification-center_v2) | Welcome emails, alerts |
| Discord (via notification-center_v2) | System health alerts |
| All connectors (config management) | Connector configuration |

### Reports Required

| Report | Purpose |
|--------|---------|
| User activity audit | Security audit |
| Permission changes log | Compliance tracking |
| System health report | Platform stability |
| Configuration change history | Audit trail |
| Connector health status | Integration monitoring |
| Event bus traffic analysis | System diagnostics |
