# RESQAI V2 — System Integration Matrix

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Domain-to-Component Mapping](#1-domain-to-component-mapping)
2. [Application-to-All Matrix](#2-application-to-all-matrix)
3. [Workflow-to-All Matrix](#3-workflow-to-all-matrix)
4. [Agent-to-All Matrix](#4-agent-to-all-matrix)
5. [Function-to-All Matrix](#5-function-to-all-matrix)
6. [Event-to-All Matrix](#6-event-to-all-matrix)

---

## 1. Domain-to-Component Mapping

| Domain | Apps | Agents | Workflows | Functions | Tables | Connectors | Events |
|--------|:----:|:------:|:---------:|:---------:|:-----:|:----------:|:------:|
| Ticket | support-center_v2, customer-portal_v2 | 5 | 4 | 7 | 4 | SMTP, Gmail | 11 |
| Appointment | appointment-center_v2, customer-portal_v2 | 5 | 3 | 4 | 2 | SMTP, Twilio SMS | 10 |
| Dispatch | operations-center_v2, technician-portal_v2 | 4 | 2 | 2 | 2 | Twilio SMS, Slack, Discord | 10 |
| Work Order | technician-portal_v2, operations-center_v2 | 1 | 2 | 3 | 2 | None | 7 |
| Dispute | resolution-center_v2, customer-portal_v2 | 1 | 2 | 1 | 1 | SMTP | 8 |
| CRM | crm-center_v2 | 4 | 4 | 6 | 4 | SMTP | 6 |
| Customer Exp. | customer-portal_v2, crm-center_v2 | 4 | 2 | 2 | 2 | SMTP | 2 |
| Knowledge | support-center_v2, customer-portal_v2 | 3 | 2 | 3 | 2 | None | 0 |
| Notification | notification-center_v2 | 3 | 1 | 3 | 3 | ALL | 5 |
| Operations | operations-center_v2 | 2 | 2 | 2 | 3 | Slack | 9 |
| Reporting | analytics-center_v2 | 3 | 2 | 2 | 2 | SMTP | 1 |
| Analytics | analytics-center_v2 | 3 | 2 | 3 | 2 | None | 0 |
| Administration | admin-center_v2 | 3 | 2 | 5 | 4 | All (config) | 6 |
| Inventory | operations-center_v2 | 0 | 1 | 3 | 2 | None | 0 |
| Security | admin-center_v2 | 0 | 0 | 3 | 2 | All (via rotate) | 0 |
| Automation | ALL | 3 | 1 | 3 | 2 | Discord, Slack | 1 |
| Quality | admin-center_v2, support-center_v2 | 3 | 1 | 2 | 2 | None | 0 |

---

## 2. Application-to-All Matrix

| Application | Workflows Operated | Agents Invoked | Functions Called | Tables Owned | Tables Read | Connectors Used |
|-------------|:------------------:|:--------------:|:----------------:|:-----------:|:-----------:|:---------------:|
| **customer-portal_v2** | 0 (triggers ticket, appointment, dispute) | 0 | 1 (validate-ticket-input) | 0 | 4 | SMTP |
| **support-center_v2** | 4 | 4 (classifier, drafter, escalation, SLA) | 5 | 2 | 7 | SMTP, Gmail |
| **appointment-center_v2** | 3 | 4 (scheduler, suggester, manager, reminder) | 4 | 2 | 4 | SMTP, Twilio SMS |
| **operations-center_v2** | 6 | 4 (coordinator, WO mgr, dispatch coord, dispatch mgr) | 5 | 3 | 8 | Twilio SMS, Slack |
| **technician-portal_v2** | 2 (WO fulfillment, WO verification) | 0 | 3 | 0 | 3 | None |
| **resolution-center_v2** | 2 (dispute resolution, dispute escalation) | 1 (resolution-advisor) | 1 | 1 | 3 | SMTP |
| **crm-center_v2** | 4 | 4 (health monitor, followup mgr, retention, mgr) | 6 | 4 | 8 | SMTP |
| **notification-center_v2** | 14+ | 3 (mgr, channel optimizer, template mgr) | 3 | 3 | 4 | ALL |
| **analytics-center_v2** | 3 | 3 (trend analyzer, predictive modeler, mgr) | 3 | 2 | 40+ | None |
| **admin-center_v2** | 2 (provisioning, config) | 3 (mgr, sys config, connector mgr) | 6 | 7 | 4 | All (config) |

---

## 3. Workflow-to-All Matrix

| Workflow | Agents Used | Functions Used | Tables Read | Tables Written | Notifications Sent | Human Approval |
|----------|:-----------:|:--------------:|:-----------:|:--------------:|:------------------:|:--------------:|
| ticket-auto-response_v2 | 1 (suggester) | 2 | 3 | 0 | Customer | None |
| ticket-intake_v2 | 3 (classifier, drafter, suggester) | 3 | 4 | 2 | Customer, Manager | Draft approval (4h) |
| ticket-escalation_v2 | 2 (escalation mgr, SLA mon) | 2 | 3 | 1 | Customer, Manager | Escalation level (2h) |
| sla-enforcement_v2 | 1 (SLA mon) | 2 | 2 | 0 | Customer, Manager | None |
| appointment-booking_v2 | 3 (scheduler, suggester, appt mgr) | 1 | 4 | 2 | Customer, Technician | None |
| appointment-reminders_v2 | 2 (reminder coord, appt mgr) | 2 | 2 | 1 | Customer, Technician | None |
| appointment-completion_v2 | 1 (WO mgr) | 1 | 2 | 2 | None | None |
| standard-dispatch_v2 | 2 (disp coord, disp tech disp) | 2 | 2 | 1 | Technician | None |
| urgent-dispatch_v2 | 4 (disp mgr, disp coord, tech disp, emerg resp) | 2 | 3 | 1 | Technician, Manager | Emergency override (5min) |
| work-order-fulfillment_v2 | 1 (WO mgr) | 2 | 3 | 2 | None | None |
| work-order-verification_v2 | 2 (QA mgr, response quality mon) | 0 | 2 | 0 | Customer, Manager | Quality pass/fail (48h) |
| dispute-resolution_v2 | 1 (resolution advisor) | 1 | 3 | 1 | Customer, Manager | Approve/reject (24h) |
| dispute-escalation_v2 | 1 (escalation mgr) | 1 | 2 | 0 | Customer, Executive | Legal escalation (48h) |
| account-health-scan_v2 | 2 (health mon, CRM mgr) | 3 | 5 | 3 | Manager, Department | None |
| followup-management_v2 | 1 (followup mgr) | 1 | 2 | 1 | Manager | None |
| followup-slippage-detector_v2 | 1 (followup mgr) | 2 | 1 | 0 | Manager | None |
| retention-campaign_v2 | 2 (retention spec, CRM mgr) | 1 | 3 | 0 | Customer, Manager | Financial offer > $500 (24h) |
| customer-satisfaction-monitor_v2 | 3 (survey, feedback analyzer, CX mgr) | 1 | 3 | 2 | Customer, Manager | None |
| feedback-analysis_v2 | 2 (feedback analyzer, CX mgr) | 0 | 3 | 0 | Manager, Department | None |
| knowledge-article-lifecycle_v2 | 2 (knowledge mgr, curator) | 0 | 2 | 2 | Manager | Category approval (7d) |
| knowledge-gap-detection_v2 | 2 (knowledge mgr, curator) | 0 | 4 | 0 | Manager | Content approval (48h) |
| notification-delivery_v2 | 3 (notif mgr, channel opt, template mgr) | 3 | 4 | 1 | Customer, Technician | None |
| daily-standup_v2 | 1 (ops coordinator) | 2 | 5 | 1 | Department | None |
| operations-coordination_v2 | 1 (ops coordinator) | 1 | 5 | 1 | Manager, Department | Task assignment (1h) |
| report-generation_v2 | 2 (report gen, report mgr) | 0 | 35+ | 0 | None | None |
| report-distribution_v2 | 2 (report dist, notif mgr) | 1 | 2 | 0 | Stakeholder | None |
| trend-analysis_v2 | 2 (trend analyzer, analytics mgr) | 0 | 35+ | 0 | Manager, Department | None |
| anomaly-detection_v2 | 2 (trend analyzer, analytics mgr) | 0 | 5 | 0 | Manager, Department, System | Critical anomaly (4h) |
| quality-review_v2 | 3 (QA mgr, response quality, compliance) | 0 | 4 | 0 | Manager | Compliance violation (24h) |
| user-provisioning_v2 | 1 (admin mgr) | 1 | 1 | 1 | None | User deactivation (4h) |
| system-config-management_v2 | 2 (admin mgr, sys config) | 2 | 2 | 1 | Manager | All config changes (4h) |
| inventory-reorder_v2 | 0 | 1 | 2 | 2 | Manager | Purchase order (24h) |
| workflow-health-monitor_v2 | 2 (automation mgr, workflow orch) | 3 | 2 | 0 | Manager, System | System-wide pause (15min) |

---

## 4. Agent-to-All Matrix

| Agent | Functions Called | Workflows Participates In | Tables Read | Tables Written | Event Streams Consumed | Department |
|-------|:----------------:|:-------------------------:|:-----------:|:--------------:|:---------------------:|:----------:|
| executive-director_v2 | 0 | ALL (summary) | 4 | 0 | ALL (summary) | Executive |
| platform-orchestrator_v2 | 0 | ALL | 3 | 0 | ALL (summary) | Executive |
| support-manager_v2 | 2 | 2 | 5 | 0 | 2 | Support |
| support-request-classifier_v2 | 1 | 1 | 4 | 1 | 1 | Support |
| support-reply-drafter_v2 | 1 | 1 | 4 | 1 | 1 | Support |
| support-escalation-manager_v2 | 1 | 2 | 4 | 1 | 2 | Support |
| support-sla-monitor_v2 | 0 | 1 | 3 | 0 | 2 | Support |
| operations-manager_v2 | 1 | 2 | 4 | 1 | 2 | Operations |
| operations-coordinator_v2 | 1 | 1 | 6 | 1 | ALL (daily) | Operations |
| operations-work-order-manager_v2 | 0 | 1 | 4 | 2 | 2 | Operations |
| crm-manager_v2 | 1 | 2 | 4 | 0 | 2 | CRM |
| crm-account-health-monitor_v2 | 3 | 1 | 7 | 3 | 2 | CRM |
| crm-followup-manager_v2 | 1 | 1 | 4 | 2 | 3 | CRM |
| crm-retention-specialist_v2 | 0 | 1 | 5 | 0 | 1 | CRM |
| dispatch-manager_v2 | 2 | 1 | 3 | 0 | 2 | Dispatch |
| dispatch-coordinator_v2 | 2 | 1 | 5 | 1 | 2 | Dispatch |
| dispatch-technician-dispatcher_v2 | 2 | 1 | 3 | 0 | 1 | Dispatch |
| dispatch-emergency-response_v2 | 1 | 1 | 3 | 0 | 1 | Dispatch |
| scheduling-manager_v2 | 1 | 1 | 3 | 0 | 1 | Scheduling |
| scheduling-appointment-scheduler_v2 | 1 | 1 | 4 | 1 | 1 | Scheduling |
| scheduling-technician-suggester_v2 | 1 | 2 | 5 | 0 | 1 | Scheduling |
| appointment-manager_v2 | 1 | 1 | 4 | 0 | 2 | Appointment |
| appointment-reminder-coordinator_v2 | 2 | 1 | 3 | 1 | 1 | Appointment |
| appointment-no-show-handler_v2 | 1 | 1 | 3 | 2 | 1 | Appointment |
| knowledge-manager_v2 | 0 | 1 | 2 | 2 | 0 | Knowledge |
| knowledge-curator_v2 | 0 | 0 | 2 | 2 | 0 | Knowledge |
| knowledge-article-suggester_v2 | 0 | 1 | 3 | 0 | 1 | Knowledge |
| analytics-manager_v2 | 0 | 1 | 2 | 0 | ALL (summary) | Analytics |
| analytics-trend-analyzer_v2 | 0 | 1 | 2 | 0 | ALL (stream) | Analytics |
| analytics-predictive-modeler_v2 | 0 | 1 | 6 | 0 | ALL (batch) | Analytics |
| admin-manager_v2 | 0 | 0 | 7 | 0 | 2 | Admin |
| admin-system-config_v2 | 0 | 0 | 2 | 2 | 1 | Admin |
| admin-connector-manager_v2 | 0 | 0 | 3 | 0 | 2 | Admin |
| qa-manager_v2 | 0 | 1 | 5 | 0 | 0 | QA |
| qa-response-quality-monitor_v2 | 0 | 1 | 3 | 0 | 0 | QA |
| qa-compliance-monitor_v2 | 0 | 0 | 5 | 0 | 0 | QA |
| reporting-manager_v2 | 0 | 1 | 2 | 0 | 0 | Reporting |
| reporting-generator_v2 | 0 | 1 | 35+ | 0 | 0 | Reporting |
| reporting-distributor_v2 | 1 | 0 | 3 | 0 | 1 | Reporting |
| notification-manager_v2 | 1 | ALL | 3 | 0 | 2 | Notification |
| notification-channel-optimizer_v2 | 1 | ALL | 3 | 0 | 0 | Notification |
| notification-template-manager_v2 | 0 | ALL | 2 | 2 | 0 | Notification |
| cx-manager_v2 | 0 | 1 | 5 | 0 | 1 | CX |
| cx-satisfaction-survey_v2 | 0 | 1 | 4 | 1 | 3 | CX |
| cx-feedback-analyzer_v2 | 0 | 1 | 5 | 0 | 1 | CX |
| cx-winback-specialist_v2 | 0 | 1 | 5 | 0 | 1 | CX |
| automation-manager_v2 | ALL | ALL | 3 | 0 | ALL | Automation |
| automation-workflow-orchestrator_v2 | ALL | ALL | 2 | 1 | ALL | Automation |
| automation-event-router_v2 | 0 | ALL | 1 | 1 | ALL | Automation |

---

## 5. Function-to-All Matrix

| Function | Type | Agents Calling | Workflows Calling | Tables Read | Tables Written | Events Produced | Connectors Used |
|----------|:----:|:--------------:|:-----------------:|:-----------:|:--------------:|:---------------:|:---------------:|
| validate-ticket-input | DET | 1 | 2 | 0 | 0 | 0 | None |
| check-ticket-urgency | DET | 2 | 2 | 0 | 0 | 0 | None |
| update-ticket-record | WRI | 3 | 3 | 1 | 1 | 1 | None |
| classify-ticket-sla-tier | DET | 1 | 2 | 1 | 0 | 0 | None |
| check-sla-deadline | REA | 1 | 1 | 2 | 0 | 0 | None |
| batch-sla-check | AGG | 0 | 1 | 2 | 0 | N (per breach) | None |
| collect-resolved-tickets | REA | 0 | 2 | 1 | 0 | 0 | None |
| assign-appointment-technician | WRI | 3 | 1 | 3 | 1 | 1 | None |
| fetch-upcoming-appointments | REA | 2 | 1 | 1 | 0 | 0 | None |
| schedule-appointment-reminders | WRI | 1 | 1 | 2 | 1 | 0 | None |
| check-reminder-window | DET | 1 | 1 | 0 | 0 | 0 | None |
| finalize-dispatch | WRI | 3 | 2 | 3 | 1 | 1 | None |
| calculate-dispatch-priority | DET | 1 | 2 | 0 | 0 | 0 | None |
| create-work-order | WRI | 1 | 1 | 2 | 1 | 1 | None |
| update-work-order-stage | WRI | 1 | 1 | 2 | 2 | 1 | None |
| complete-work-order | WRI | 1 | 1 | 2 | 2 | 1-2 | None |
| resolve-dispute | WRI | 0 | 2 | 3 | 1 | 1 | None |
| account-health-scan | AGG | 1 | 1 | 6 | 1 | 1 (conditional) | None |
| update-account-health-status | WRI | 2 | 1 | 2 | 1 | 1 | None |
| flag-slipping-followups | REA | 1 | 2 | 1 | 0 | 0 | None |
| create-followup-tasks | WRI | 1 | 3 | 2 | 1 | 1 | None |
| finalize-slippage-review | WRI | 0 | 1 | 1 | 2 | 1 (conditional) | None |
| generate-account-score | AGG | 1 | 1 | 0 | 0 | 0 | None |
| process-feedback-survey | WRI | 1 | 1 | 1 | 1 | 1 | None |
| analyze-feedback-sentiment | AGG | 1 | 1 | 1 | 1 | 1 (conditional) | None |
| extract-knowledge-gap | REA | 2 | 1 | 4 | 0 | 0 | None |
| search-knowledge-articles | REA | 1 | 1 | 2 | 0 | 0 | None |
| suggest-knowledge-article | DET | 2 | 1 | 0 | 0 | 0 | None |
| render-notification-template | TRA | 1 | 1 | 1 | 0 | 0 | None |
| dispatch-notifications | ORC | 9 | 19 | 3 | 1 | 2 | SMTP, Twilio, Discord, Slack, Gmail |
| process-notification-delivery | WRI | 1 | 1 | 1 | 1 | 2 | None |
| create-operations-tasks | WRI | 2 | 2 | 2 | 2 | 1 | None |
| generate-standup-report | AGG | 1 | 1 | 8 | 1 | 0 | None |
| generate-report-data | AGG | 1 | 1 | 35+ | 0 | 1 | None |
| send-report | ORC | 1 | 1 | 3 | 0 | 0 | SMTP (via dispatch-notifications) |
| sync-events-analytics | AGG | 0 | 1 | 1 | 1 | 0 | None |
| calculate-metric-trend | AGG | 1 | 1 | 2 | 0 | 0 | None |
| batch-metric-aggregation | AGG | 0 | 2 | 35+ | 1 | 0 | None |
| provision-user | ORC | 1 | 1 | 3 | 2 | 1 | SMTP (welcome email) |
| deactivate-user | WRI | 1 | 1 | 3 | 2 | 1 | None |
| validate-config-change | DET | 1 | 1 | 2 | 0 | 0 | None |
| apply-config-change | WRI | 1 | 1 | 2 | 1 | 1 | None |
| log-audit-event | WRI | ALL | ALL | 0 | 1 | 0 | None |
| check-inventory-level | REA | 0 | 1 | 2 | 0 | 0 | None |
| reorder-inventory | WRI | 0 | 1 | 1 | 2 | 0 | None |
| record-inventory-transaction | WRI | 1 | 2 | 1 | 2 | 0 | None |
| validate-permissions | DET | ALL | ALL | 2 | 0 | 0 | None |
| generate-api-token | WRI | 0 | 0 | 1 | 1 | 0 | None |
| rotate-credentials | ORC | 1 | 0 | 2 | 2 | 1 | ALL |
| verify-workflow-health | REA | 2 | 1 | 2 | 0 | 0 | None |
| recover-workflow-instance | ORC | 1 | 1 | 2 | 2 | 1 | None |
| reset-circuit-breaker | WRI | 1 | 1 | 2 | 1 | 1 | None |
| evaluate-quality-score | AGG | 1 | 1 | 4 | 1 | 0 | None |
| flag-quality-violation | WRI | 2 | 1 | 2 | 1 | 0 | None |

---

## 6. Event-to-All Matrix

| Event | Producer App | Producer Function | Consumers (Workflow) | Consumers (Agent) | Consumers (Notification) | Analytics |
|-------|:------------:|:-----------------:|:--------------------:|:-----------------:|:------------------------:|:---------:|
| `ticket.created` | support_v2, customer_v2 | — | ticket-intake_v2, ticket-auto-response_v2 | classifer | Customer: confirmation | ✓ |
| `ticket.classified` | support_v2 | — | urgent-dispatch_v2 | drafter, suggester | — | ✓ |
| `ticket.reply.drafted` | support_v2 | — | (internal) | — | — | — |
| `ticket.reply.approved` | support_v2 | — | — | — | Customer: reply sent | ✓ |
| `ticket.reply.rejected` | support_v2 | — | (internal) | — | — | — |
| `ticket.status.changed` | support_v2 | update-ticket-record | — | SLA mon | Customer: status update | ✓ |
| `ticket.escalated` | support_v2 | — | ticket-escalation_v2 | escal mgr | Manager: escalation alert | ✓ |
| `ticket.sent` | notification_v2 | dispatch-notifications | — | — | — | ✓ |
| `ticket.closed` | support_v2 | — | customer-satisfaction-monitor_v2 | survey | — | ✓ |
| `ticket.sla_breached` | system | batch-sla-check | sla-enforcement_v2, ticket-escalation_v2 | SLA mon, escal | Manager: SLA breach | ✓ |
| `ticket.assigned` | support_v2 | update-ticket-record | — | — | Technician: assignment | ✓ |
| `appointment.created` | appt_v2 | — | appointment-booking_v2 | scheduler, suggester | Customer: confirmation | ✓ |
| `appointment.confirmed` | appt_v2 | — | appointment-reminders_v2 | reminder coord | — | ✓ |
| `appointment.assigned` | appt_v2 | assign-appt-technician | — | — | Technician: assignment | ✓ |
| `appointment.rescheduled` | appt_v2 | — | — | appt mgr | Customer, Tech: reschedule | ✓ |
| `appointment.started` | tech_v2 | — | — | — | — | ✓ |
| `appointment.completed` | tech_v2 | — | appointment-completion_v2, work-order-fulfillment_v2 | WO mgr, followup mgr, survey | — | ✓ |
| `appointment.cancelled` | appt_v2 | — | — | appt mgr | Customer, Tech: cancellation | ✓ |
| `appointment.on_hold` | appt_v2 | — | — | — | — | ✓ |
| `appointment.reminder.sent` | notification_v2 | — | — | — | — | ✓ |
| `appointment.no_show` | tech_v2 | — | — | no-show handler | Customer: no-show | ✓ |
| `work_order.created` | appt_v2 | create-work-order | work-order-fulfillment_v2 | WO mgr | — | ✓ |
| `work_order.assigned` | ops_v2 | — | — | — | Technician | ✓ |
| `work_order.stage.changed` | tech_v2 | update-wo-stage | — | WO mgr | — | ✓ |
| `work_order.completed` | tech_v2 | complete-wo | work-order-verification_v2 | survey | Customer: complete | ✓ |
| `work_order.followup_needed` | tech_v2 | complete-wo | — | followup mgr | Customer: followup | ✓ |
| `dispatch.created` | ops_v2 | finalize-dispatch | standard-dispatch_v2, urgent-dispatch_v2 | tech dispatcher | Technician: dispatch | ✓ |
| `dispatch.sent` | notification_v2 | dispatch-notifications | — | — | — | ✓ |
| `dispatch.acknowledged` | tech_v2 | — | — | — | — | ✓ |
| `dispatch.declined` | tech_v2 | — | — | dispatch coord | — | ✓ |
| `dispatch.reassigned` | ops_v2 | — | — | — | Technician | ✓ |
| `dispatch.en_route` | tech_v2 | — | — | — | — | ✓ |
| `dispatch.on_site` | tech_v2 | — | — | — | — | ✓ |
| `dispatch.completed` | tech_v2 | — | — | — | Customer, Manager | ✓ |
| `dispatch.cancelled` | ops_v2 | — | — | — | Customer, Technician | ✓ |
| `dispatch.escalated` | system | — | dispute-escalation_v2 | emerg response, disp mgr | Manager: urgent | ✓ |
| `dispute.created` | res_v2 | — | dispute-resolution_v2 | resolution advisor | Manager: new dispute | ✓ |
| `dispute.analyzed` | res_v2 | — | — | — | — | ✓ |
| `dispute.escalated` | res_v2 | — | dispute-escalation_v2 | — | Executive | ✓ |
| `dispute.approved` | res_v2 | — | — | — | — | ✓ |
| `dispute.rejected` | res_v2 | — | — | — | — | ✓ |
| `dispute.resolved` | res_v2 | resolve-dispute | — | followup mgr, survey | Customer: resolution | ✓ |
| `dispute.status.changed` | res_v2 | — | — | — | Customer, Manager | ✓ |
| `account.health.changed` | crm_v2 | update-acct-health, account-health-scan | account-health-scan_v2 | health mon, retention | Account Manager | ✓ |
| `account.risk.signal.detected` | crm_v2 | — | — | health mon, followup | CRM Manager: risk | ✓ |
| `followup.created` | crm_v2 | create-followup-tasks | followup-management_v2 | followup mgr | Assignee: new followup | ✓ |
| `followup.slippage.detected` | crm_v2 | finalize-slippage-review | followup-slippage-detector_v2 | followup mgr | Assigned user: overdue | ✓ |
| `followup.missed` | system | — | — | — | Manager: missed | ✓ |
| `feedback.submitted` | customer_v2, notif_v2 | process-feedback-survey | feedback-analysis_v2 | feedback analyzer | CRM Manager | ✓ |
| `feedback.response_needed` | crm_v2 | analyze-feedback-sentiment | — | — | CRM Manager | ✓ |
| `task.created` | ops_v2 | create-ops-tasks | — | — | Assignee: new task | ✓ |
| `task.completed` | ops_v2 | — | — | — | — | ✓ |
| `task.overdue` | system | — | — | — | Assignee, Manager | ✓ |
| `notification.send` | ALL apps | — | notification-delivery_v2 | — | — | — |
| `notification.sent` | notification_v2 | dispatch-notifications | — | — | — | ✓ |
| `notification.delivered` | notification_v2 | process-notif-delivery | — | — | — | ✓ |
| `notification.failed` | notification_v2 | process-notif-delivery | — | notif mgr | Admin | ✓ |
| `user.created` | admin_v2 | provision-user | user-provisioning_v2 | admin mgr | New user: welcome | — |
| `user.disabled` | admin_v2 | deactivate-user | — | admin mgr | — | — |
| `system.config.changed` | admin_v2 | apply-config-change | system-config-management_v2 | sys config, conn mgr | Manager: config change | — |
| `system.health.alert` | system | — | — | admin mgr, exec dir | Admin: health issue | — |
| `report.generated` | analytics_v2 | generate-report-data | report-distribution_v2 | reporting dist | Subscribers: report | — |

---

> **End of SYSTEM_INTEGRATION_MATRIX.md**  
> Next document: EXECUTION_PIPELINE.md
