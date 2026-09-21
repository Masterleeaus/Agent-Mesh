# RESQAI V2 — Implementation Order

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Implementation Rules](#1-implementation-rules)
2. [Database Migration Order](#2-database-migration-order)
3. [Function Build Order](#3-function-build-order)
4. [Connector Build Order](#4-connector-build-order)
5. [Application Build Order](#5-application-build-order)
6. [Agent Build Order](#6-agent-build-order)
7. [Workflow Build Order](#7-workflow-build-order)
8. [Per-Sprint Detailed Task List](#8-per-sprint-detailed-task-list)

---

## 1. Implementation Rules

| # | Rule | Description |
|---|------|-------------|
| 1 | **Build one component at a time per dependency chain** | No function is built before its tables exist; no workflow before its functions and agents |
| 2 | **Test immediately after build** | Each component has tests written in the same sprint it is built |
| 3 | **No orphan components** | Every function must be called by at least one workflow/agent/app; every table must be read/written by at least one function |
| 4 | **Integration test at the end of each sprint** | Before declaring a sprint done, all new components must pass integration tests with real neighbors |
| 5 | **No V1 modifications** | All V2 work uses `_v2` suffix; V1 remains untouched and running in parallel |

---

## 2. Database Migration Order

### Migration Script 0: Foundation (Sprint 1)

Order within migration (no FK dependencies between these):

```
1. reference_data_v2
2. system_settings_v2
3. feature_flags_v2
4. knowledge_categories_v2
5. user_roles_v2
6. connectors_v2
```

### Migration Script 1: Identity (Sprint 1)

```
7. users_v2            (FK → user_roles_v2)
8. user_sessions_v2    (FK → users_v2)
```

### Migration Script 2: Core Business (Sprint 2)

```
9.  customers_v2
10. customer_addresses_v2 (FK → customers_v2)
11. technicians_v2
12. technician_skills_v2  (FK → technicians_v2)
13. knowledge_articles_v2 (FK → knowledge_categories_v2)
```

### Migration Script 3: Operational (Sprint 2)

```
14. accounts_v2          (FK → customers_v2)
15. tickets_v2           (FK → customers_v2)
16. appointments_v2      (FK → customers_v2, technicians_v2)
17. inventory_items_v2
```

### Migration Script 4: Detailed Operations (Sprint 2)

```
18. ticket_messages_v2       (FK → tickets_v2)
19. ticket_attachments_v2    (FK → tickets_v2)
20. account_health_scans_v2  (FK → accounts_v2)
21. followups_v2             (FK → accounts_v2, customers_v2)
22. followup_attempts_v2     (FK → followups_v2)
23. appointment_reminders_v2 (FK → appointments_v2)
24. work_orders_v2           (FK → appointments_v2, technicians_v2, customers_v2)
25. work_order_stages_v2     (FK → work_orders_v2)
26. disputes_v2              (FK → appointments_v2, customers_v2, tickets_v2)
27. dispute_evidence_v2      (FK → disputes_v2)
```

### Migration Script 5: Notifications (Sprint 2)

```
28. notification_templates_v2
29. notification_channels_v2
30. notifications_v2         (FK → customers_v2, technicians_v2, users_v2)
```

### Migration Script 6: Admin & Analytics (Sprint 2)

```
31. feedback_v2              (FK → customers_v2, surveys_v2)
32. feedback_surveys_v2
33. tasks_v2                 (FK → customers_v2, users_v2)
34. tasks_assignments_v2     (FK → tasks_v2, users_v2)
35. events_v2
36. audit_log_v2
37. analytics_reports_v2
38. analytics_schedules_v2
39. operations_log
40. dispatches_v2            (FK → tickets_v2, technicians_v2)
```


---

## 3. Function Build Order

### Layer 1: Deterministic Functions (Sprint 2-3)

No DB dependencies; can be built as soon as function runtime exists.

| Order | Function | Type | Depends On |
|:-----:|----------|:----:|------------|
| 1 | `validate-ticket-input` | DET | Nothing |
| 2 | `check-ticket-urgency` | DET | Nothing |
| 3 | `classify-ticket-sla-tier` | DET | system_settings_v2 |
| 4 | `check-reminder-window` | DET | Nothing |
| 5 | `calculate-dispatch-priority` | DET | Nothing |
| 6 | `validate-config-change` | DET | system_settings_v2, feature_flags_v2 |
| 7 | `validate-permissions` | DET | role_permissions_v2, user_roles_v2 |

### Layer 2: Reader Functions (Sprint 3)

Read-only, no event emission.

| Order | Function | Type | Depends On |
|:-----:|----------|:----:|------------|
| 8 | `check-inventory-level` | REA | inventory_items_v2, inventory_transactions_v2 |
| 9 | `check-sla-deadline` | REA | tickets_v2, system_settings_v2 |
| 10 | `collect-resolved-tickets` | REA | tickets_v2 |
| 11 | `fetch-upcoming-appointments` | REA | appointments_v2 |
| 12 | `search-knowledge-articles` | REA | knowledge_articles_v2, knowledge_categories_v2 |
| 13 | `flag-slipping-followups` | REA | followups_v2 |
| 14 | `extract-knowledge-gap` | REA | tickets_v2, ticket_messages_v2, knowledge_articles_v2, knowledge_categories_v2 |
| 15 | `verify-workflow-health` | REA | events_v2, audit_log_v2 |

### Layer 3: Writer Functions — Core Domains (Sprint 3)

| Order | Function | Type | Depends On | Event |
|:-----:|----------|:----:|------------|:-----:|
| 16 | `update-ticket-record` | WRI | tickets_v2 | ticket.status.changed |
| 17 | `assign-appointment-technician` | WRI | appointments_v2, technicians_v2, technician_skills_v2 | appointment.assigned |
| 18 | `schedule-appointment-reminders` | WRI | appointments_v2, notification_templates_v2 | none |
| 19 | `finalize-dispatch` | WRI | dispatches_v2, technicians_v2, tickets_v2 | dispatch.created |
| 20 | `create-work-order` | WRI | appointments_v2, technicians_v2, work_orders_v2 | work_order.created |
| 21 | `update-work-order-stage` | WRI | work_orders_v2, work_order_stages_v2 | work_order.stage.changed |
| 22 | `complete-work-order` | WRI | work_orders_v2, work_order_stages_v2 | work_order.completed |
| 23 | `resolve-dispute` | WRI | disputes_v2, appointments_v2, customers_v2 | dispute.resolved |

### Layer 4: Writer Functions — Extended Domains (Sprint 4)

| Order | Function | Type | Depends On | Event |
|:-----:|----------|:----:|------------|:-----:|
| 24 | `process-feedback-survey` | WRI | feedback_surveys_v2, feedback_v2 | feedback.submitted |
| 25 | `create-followup-tasks` | WRI | accounts_v2, customers_v2, followups_v2 | followup.created |
| 26 | `update-account-health-status` | WRI | accounts_v2, account_health_scans_v2 | account.health.changed |
| 27 | `finalize-slippage-review` | WRI | followups_v2, tasks_v2 | followup.slippage.detected |
| 28 | `process-notification-delivery` | WRI | notifications_v2 | notification.delivered/failed |
| 29 | `create-operations-tasks` | WRI | tasks_v2, tasks_assignments_v2, technicians_v2 | task.created |
| 30 | `deactivate-user` | WRI | users_v2, user_roles_v2, user_sessions_v2 | user.disabled |
| 31 | `apply-config-change` | WRI | system_settings_v2, feature_flags_v2 | system.config.changed |
| 32 | `log-audit-event` | WRI | audit_log_v2 | none |
| 33 | `reorder-inventory` | WRI | inventory_items_v2, inventory_transactions_v2 | none |
| 34 | `record-inventory-transaction` | WRI | inventory_items_v2, inventory_transactions_v2 | none |
| 35 | `generate-api-token` | WRI | users_v2 | none |
| 36 | `reset-circuit-breaker` | WRI | system_settings_v2, feature_flags_v2 | system.config.changed |
| 37 | `flag-quality-violation` | WRI | feedback_v2, system_settings_v2 | none |

### Layer 5: Aggregator Functions (Sprint 4-5)

| Order | Function | Type | Depends On | Event |
|:-----:|----------|:----:|------------|:-----:|
| 38 | `batch-sla-check` | AGG | tickets_v2, system_settings_v2 | ticket.sla_breached |
| 39 | `account-health-scan` | AGG | accounts_v2, disputes_v2, followups_v2, feedback_v2, tickets_v2, appointments_v2 | account.health.changed |
| 40 | `generate-account-score` | AGG | none (pure computation) | none |
| 41 | `analyze-feedback-sentiment` | AGG | feedback_v2 | feedback.response_needed |
| 42 | `generate-standup-report` | AGG | 8 tables | none |
| 43 | `generate-report-data` | AGG | 35+ tables | report.generated |
| 44 | `sync-events-analytics` | AGG | events_v2, analytics_reports_v2 | none |
| 45 | `calculate-metric-trend` | AGG | events_v2, analytics_reports_v2 | none |
| 46 | `batch-metric-aggregation` | AGG | events_v2, analytics_reports_v2, ALL domain tables | none |
| 47 | `evaluate-quality-score` | AGG | tickets_v2, ticket_messages_v2, disputes_v2, customers_v2 | none |

### Layer 6: Transformer + Orchestrator Functions (Sprint 5)

| Order | Function | Type | Depends On | Event |
|:-----:|----------|:----:|------------|:-----:|
| 48 | `render-notification-template` | TRA | notification_templates_v2 | none |
| 49 | `dispatch-notifications` | ORC | notification_templates_v2, notification_channels_v2, notifications_v2, ALL connectors | notification.sent/failed |
| 50 | `send-report` | ORC | analytics_reports_v2, analytics_schedules_v2, users_v2 | none |
| 51 | `provision-user` | ORC | users_v2, roles_v2, role_permissions_v2, user_roles_v2 | user.created |
| 52 | `rotate-credentials` | ORC | connectors_v2, system_settings_v2 | system.config.changed |
| 53 | `recover-workflow-instance` | ORC | events_v2, audit_log_v2 | workflow.recovery.initiated |

---

## 4. Connector Build Order

| Order | Connector | Type | Depends On | Built In Sprint |
|:-----:|-----------|:----:|------------|:---------------:|
| 1 | SMTP | Email | connectors_v2 table + SMTP library | Sprint 5 |
| 2 | Twilio SMS | SMS | connectors_v2 table + Twilio SDK | Sprint 5 |
| 3 | Discord Webhook | Webhook | connectors_v2 table + HTTP client | Sprint 6 |
| 4 | Slack | Webhook/API | connectors_v2 table + Slack SDK | Sprint 6 |
| 5 | Gmail | OAuth | connectors_v2 table + Google API SDK | Sprint 6 |
| 6 | Reddit | OAuth | connectors_v2 table + Reddit API client | Sprint 6 |

---                                                                                                                              
## 5. Application Build Order

Each application entry includes: purpose, tables it owns, functions it calls, agents it invokes, and the exact sprint it is built.

### Phase 2 Apps (Sprint 5-6)

| # | Application | Owns Tables | Calls Functions | Invokes Agents | Sprint |
|:-:|-------------|:-----------:|:---------------:|:--------------:|:------:|
| 1 | **support-center_v2** | tickets_v2, ticket_messages_v2, ticket_attachments_v2 | validate-ticket-input, check-ticket-urgency, update-ticket-record, classify-ticket-sla-tier, check-sla-deadline, dispatch-notifications | support-request-classifier, support-reply-drafter, support-escalation-manager, support-sla-monitor | 5-6 |
| 2 | **operations-center_v2** | dispatches_v2, tasks_v2, tasks_assignments_v2, operations_log | finalize-dispatch, calculate-dispatch-priority, create-operations-tasks, generate-standup-report, dispatch-notifications | operations-manager, operations-coordinator, dispatch-manager, dispatch-coordinator | 5-6 |
| 3 | **appointment-center_v2** | appointments_v2, appointment_reminders_v2 | assign-appointment-technician, fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, dispatch-notifications | scheduling-manager, appointment-scheduler, technician-suggester, appointment-manager | 5-6 |
| 4 | **technician-portal_v2** | none (reads) | complete-work-order, update-work-order-stage, record-inventory-transaction | none | 6 |

### Phase 3 Apps (Sprint 7-8)

| # | Application | Owns Tables | Calls Functions | Invokes Agents | Sprint |
|:-:|-------------|:-----------:|:---------------:|:--------------:|:------:|
| 5 | **customer-portal_v2** | none (reads) | validate-ticket-input | knowledge-article-suggester | 7 |
| 6 | **resolution-center_v2** | disputes_v2, dispute_evidence_v2 | resolve-dispute | resolution-advisor | 7 |
| 7 | **crm-center_v2** | accounts_v2, account_health_scans_v2, followups_v2, followup_attempts_v2 | account-health-scan, update-account-health-status, flag-slipping-followups, create-followup-tasks, finalize-slippage-review, generate-account-score, dispatch-notifications | crm-manager, account-health-monitor, crm-followup-manager, crm-retention-specialist | 7 |

### Phase 4 Apps (Sprint 8-10)

| # | Application | Owns Tables | Calls Functions | Invokes Agents | Sprint |
|:-:|-------------|:-----------:|:---------------:|:--------------:|:------:|
| 8 | **notification-center_v2** | notifications_v2, notification_templates_v2, notification_channels_v2 | render-notification-template, dispatch-notifications, process-notification-delivery | notification-manager, channel-optimizer, template-manager | 8-10 |
| 9 | **analytics-center_v2** | analytics_reports_v2, analytics_schedules_v2 | sync-events-analytics, calculate-metric-trend, batch-metric-aggregation, generate-report-data | analytics-manager, trend-analyzer, predictive-modeler | 9 |
| 10 | **admin-center_v2** | users_v2, user_sessions_v2, system_settings_v2, feature_flags_v2, connectors_v2 | provision-user, deactivate-user, validate-config-change, apply-config-change, log-audit-event, rotate-credentials, validate-permissions, generate-api-token, verify-workflow-health, recover-workflow-instance, reset-circuit-breaker | admin-manager, admin-system-config, admin-connector-manager | 9 |

---

## 6. Agent Build Order

### Layer 1: Core Domain Agents (Sprint 11)

| Order | Agent | Calls Functions | Sprint |
|:-----:|-------|:---------------:|:------:|
| 1 | support-request-classifier_v2 | check-ticket-urgency | 11 |
| 2 | support-reply-drafter_v2 | update-ticket-record | 11 |
| 3 | support-escalation-manager_v2 | update-ticket-record | 11 |
| 4 | support-sla-monitor_v2 | check-sla-deadline | 11 |
| 5 | support-manager_v2 | check-ticket-urgency, update-ticket-record | 11 |
| 6 | operations-coordinator_v2 | create-operations-tasks | 11 |
| 7 | operations-manager_v2 | create-operations-tasks | 11 |
| 8 | operations-work-order-manager_v2 | none | 11 |
| 9 | dispatch-coordinator_v2 | finalize-dispatch, calculate-dispatch-priority | 11 |
| 10 | dispatch-technician-dispatcher_v2 | dispatch-notifications, finalize-dispatch | 11 |
| 11 | dispatch-manager_v2 | dispatch-notifications, finalize-dispatch | 11 |
| 12 | dispatch-emergency-response_v2 | dispatch-notifications | 11 |
| 13 | scheduling-appointment-scheduler_v2 | assign-appointment-technician | 11 |
| 14 | scheduling-technician-suggester_v2 | assign-appointment-technician | 11 |
| 15 | scheduling-manager_v2 | assign-appointment-technician | 11 |
| 16 | appointment-manager_v2 | fetch-upcoming-appointments | 11 |
| 17 | appointment-reminder-coordinator_v2 | dispatch-notifications, fetch-upcoming-appointments | 11 |
| 18 | appointment-no-show-handler_v2 | dispatch-notifications | 11 |
| 19 | crm-account-health-monitor_v2 | account-health-scan, flag-slipping-followups, update-account-health-status | 11 |
| 20 | crm-followup-manager_v2 | create-followup-tasks | 11 |
| 21 | crm-manager_v2 | update-account-health-status | 11 |
| 22 | crm-retention-specialist_v2 | none | 11 |
| 23 | executive-director_v2 | none | 11 |
| 24 | platform-orchestrator_v2 | none | 11 |

### Layer 2: Extended Domain Agents (Sprint 12)

| Order | Agent | Calls Functions | Sprint |
|:-----:|-------|:---------------:|:------:|
| 25 | knowledge-manager_v2 | none | 12 |
| 26 | knowledge-curator_v2 | none | 12 |
| 27 | knowledge-article-suggester_v2 | none | 12 |
| 28 | analytics-manager_v2 | none | 12 |
| 29 | analytics-trend-analyzer_v2 | none | 12 |
| 30 | analytics-predictive-modeler_v2 | none | 12 |
| 31 | admin-manager_v2 | none | 12 |
| 32 | admin-system-config_v2 | none | 12 |
| 33 | admin-connector-manager_v2 | none | 12 |
| 34 | qa-manager_v2 | none | 12 |
| 35 | qa-response-quality-monitor_v2 | none | 12 |
| 36 | qa-compliance-monitor_v2 | none | 12 |
| 37 | reporting-manager_v2 | none | 12 |
| 38 | reporting-generator_v2 | none | 12 |
| 39 | reporting-distributor_v2 | dispatch-notifications | 12 |
| 40 | notification-manager_v2 | dispatch-notifications | 12 |
| 41 | notification-channel-optimizer_v2 | dispatch-notifications | 12 |
| 42 | notification-template-manager_v2 | none | 12 |
| 43 | cx-manager_v2 | none | 12 |
| 44 | cx-satisfaction-survey_v2 | none | 12 |
| 45 | cx-feedback-analyzer_v2 | none | 12 |
| 46 | cx-winback-specialist_v2 | none | 12 |
| 47 | automation-manager_v2 | ALL functions (orchestration) | 12 |
| 48 | automation-workflow-orchestrator_v2 | ALL functions | 12 |
| 49 | automation-event-router_v2 | none | 12 |

---

## 7. Workflow Build Order

### Tier 0: Autonomous (Sprint 13)

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 1 | notification-delivery_v2 | notification.send | dispatch-notifications, render-notification-template, process-notification-delivery | notification-manager, channel-optimizer, template-manager |
| 2 | ticket-auto-response_v2 | ticket.created | check-ticket-urgency, dispatch-notifications | knowledge-article-suggester |
| 3 | sla-enforcement_v2 | cron | batch-sla-check, classify-ticket-sla-tier | support-sla-monitor |
| 4 | appointment-booking_v2 | appointment.created | assign-appointment-technician, dispatch-notifications | appointment-scheduler, technician-suggester, appointment-manager |
| 5 | appointment-reminders_v2 | appointment.confirmed | fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, dispatch-notifications | reminder-coordinator, appointment-manager |
| 6 | standard-dispatch_v2 | ticket.classified (service) | finalize-dispatch, calculate-dispatch-priority, dispatch-notifications | dispatch-coordinator, technician-dispatcher |
| 7 | knowledge-gap-detection_v2 | cron | extract-knowledge-gap | knowledge-manager, curator |
| 8 | workflow-health-monitor_v2 | cron | verify-workflow-health, recover-workflow-instance, reset-circuit-breaker | automation-manager, workflow-orchestrator |

### Tier 1: Entry (Sprint 13)

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 9 | ticket-intake_v2 | ticket.created | check-ticket-urgency, update-ticket-record, dispatch-notifications | request-classifier, reply-drafter, article-suggester |
| 10 | appointment-completion_v2 | appointment.completed | create-followup-tasks | work-order-manager |
| 11 | urgent-dispatch_v2 | ticket.created (urgent), ticket.escalated | finalize-dispatch, calculate-dispatch-priority, dispatch-notifications | dispatch-coordinator, technician-dispatcher, emergency-response, dispatch-manager |
| 12 | dispute-resolution_v2 | dispute.created | resolve-dispute, dispatch-notifications | resolution-advisor |
| 13 | account-health-scan_v2 | cron | account-health-scan, flag-slipping-followups, update-account-health-status, dispatch-notifications | account-health-monitor, crm-manager |
| 14 | followup-slippage-detector_v2 | cron | flag-slipping-followups, finalize-slippage-review | followup-manager |

### Tier 2-3: Secondary (Sprint 14)

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 15 | ticket-escalation_v2 | ticket.escalated, ticket.sla_breached | update-ticket-record, dispatch-notifications | escalation-manager |
| 16 | work-order-fulfillment_v2 | appointment.completed | create-work-order, update-work-order-stage, complete-work-order, record-inventory-transaction | work-order-manager |
| 17 | dispute-escalation_v2 | dispute.escalated | resolve-dispute | (none — human executive) |
| 18 | followup-management_v2 | appointment.completed, dispute.resolved | create-followup-tasks, dispatch-notifications | followup-manager |
| 19 | retention-campaign_v2 | account.health.changed | create-followup-tasks | retention-specialist, crm-manager |
| 20 | customer-satisfaction-monitor_v2 | ticket.closed, appointment.completed, dispute.resolved | process-feedback-survey, dispatch-notifications | satisfaction-survey, feedback-analyzer, cx-manager |
| 21 | feedback-analysis_v2 | feedback.submitted | analyze-feedback-sentiment | feedback-analyzer, cx-manager |

### Tier 4-5: Execution (Sprint 14)

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 22 | work-order-verification_v2 | work_order.completed | none | qa-manager, response-quality-monitor |
| 23 | knowledge-article-lifecycle_v2 | cron | none | knowledge-manager, curator |
| 24 | daily-standup_v2 | cron | collect-resolved-tickets, generate-standup-report, create-operations-tasks | operations-coordinator |
| 25 | operations-coordination_v2 | on-demand | create-operations-tasks | operations-coordinator |
| 26 | report-generation_v2 | cron | generate-report-data | reporting-generator, reporting-manager |
| 27 | report-distribution_v2 | report.generated | send-report | reporting-distributor, notification-manager |
| 28 | user-provisioning_v2 | admin action | provision-user, deactivate-user | admin-manager |
| 29 | system-config-management_v2 | admin action | validate-config-change, apply-config-change, log-audit-event | admin-manager, system-config |
| 30 | inventory-reorder_v2 | cron | check-inventory-level, reorder-inventory, record-inventory-transaction, dispatch-notifications | none |

### Tier 6-7: Reporting (Sprint 14)

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 31 | trend-analysis_v2 | cron | sync-events-analytics, calculate-metric-trend, batch-metric-aggregation | trend-analyzer, analytics-manager |
| 32 | anomaly-detection_v2 | cron | batch-metric-aggregation | trend-analyzer, analytics-manager |
| 33 | quality-review_v2 | on-demand | evaluate-quality-score, flag-quality-violation | qa-manager, response-quality-monitor, compliance-monitor |

---

## 8. Per-Sprint Detailed Task List

### Sprint 1 (Weeks 1-2) — Foundation Setup

```
[Platform] Config: monorepo scaffold, TypeScript, Python, Vite, Lemma workspace
[Platform] Packages: types_v2 (all), config_v2 (constants), utils_v2
[Platform] Packages: sdk_v2 (event, table, function, auth wrappers)
[Platform] Packages: ui_v2 (Shell, DataTable, DataCard, SmartForm, StatusBadge)
[Platform] Packages: hooks_v2 (useEvents, useTable, useFunction, useAuth)
[Platform] Packages: forms_v2 (form primitives with validation)
[Platform] CI/CD: lint, typecheck, test, build, deploy pipelines
[Platform] Migrations: Script 0 (6 foundation tables)
[Platform] Migrations: Script 1 (2 identity tables)
```

### Sprint 2 (Weeks 3-4) — Complete Data Layer + DET Functions

```
[Platform] Migrations: Script 2 (5 core business tables)
[Platform] Migrations: Script 3 (4 operational tables)
[Platform] Migrations: Script 4 (10 detailed operations tables)
[Platform] Migrations: Script 5-6 (9 notification + admin tables)
[Platform] Auth: middleware, JWT, RBAC scaffold
[Platform] Event bus: 14 topics, schema registry, event envelope
[Platform] Monitoring: health endpoints, structured logging, error tracking
[BE Alpha] Functions: validate-ticket-input, check-ticket-urgency, classify-ticket-sla-tier
[BE Alpha] Functions: calculate-dispatch-priority, check-reminder-window
[BE Alpha] Functions: validate-config-change, validate-permissions
[BE Alpha] Tests: unit tests for all 7 DET functions
```

### Sprint 3 (Weeks 5-6) — Core Writer + Reader Functions

```
[BE Alpha] Functions: update-ticket-record, assign-appointment-technician
[BE Alpha] Functions: schedule-appointment-reminders, finalize-dispatch
[BE Alpha] Functions: create-work-order, update-work-order-stage, complete-work-order
[BE Alpha] Functions: resolve-dispute
[BE Alpha] Functions: check-sla-deadline, collect-resolved-tickets
[BE Alpha] Functions: fetch-upcoming-appointments
[BE Alpha] Functions: batch-sla-check, generate-account-score
[BE Alpha] Tests: unit + integration tests for all Tier 0-1 functions
[BE Beta] Functions: search-knowledge-articles, flag-slipping-followups
[BE Beta] Functions: extract-knowledge-gap, verify-workflow-health
[BE Beta] Functions: check-inventory-level
[BE Beta] Tests: unit + integration tests for all reader functions
```

### Sprint 4 (Weeks 7-8) — Complete Writer + Aggregator Functions

```
[BE Alpha] Functions: process-feedback-survey, analyze-feedback-sentiment
[BE Alpha] Functions: create-followup-tasks, finalize-slippage-review
[BE Alpha] Functions: update-account-health-status
[BE Alpha] Functions: account-health-scan
[BE Alpha] Functions: generate-standup-report
[BE Alpha] Functions: evaluate-quality-score, flag-quality-violation
[BE Beta]  Functions: process-notification-delivery
[BE Beta]  Functions: create-operations-tasks
[BE Beta]  Functions: deactivate-user, apply-config-change, log-audit-event
[BE Beta]  Functions: reorder-inventory, record-inventory-transaction
[BE Beta]  Functions: generate-api-token, reset-circuit-breaker
[BE Beta]  Functions: generate-report-data, sync-events-analytics
[BE Beta]  Functions: calculate-metric-trend, batch-metric-aggregation
[BE Beta]  Functions: suggest-knowledge-article
[ALL BE]   Tests: event emission verification for all WRITER/AGGREGATOR
```

### Sprint 5 (Weeks 9-10) — Orchestrator + Connectors + Start Core Apps

```
[BE Beta]  Functions: render-notification-template (TRANSFORMER)
[BE Beta]  Functions: dispatch-notifications (ORCHESTRATOR) — SMTP + Twilio
[BE Beta]  Functions: send-report, provision-user, rotate-credentials
[BE Beta]  Functions: recover-workflow-instance
[BE Beta]  Connectors: SMTP config + health check + circuit breaker
[BE Beta]  Connectors: Twilio SMS config + health check + circuit breaker
[BE Beta]  Connectors: connector health framework
[FE Alpha] support-center_v2: list, detail, create, message thread, SLA display
[FE Beta]  operations-center_v2: dashboard, task mgmt, dispatch queue
[FE Beta]  appointment-center_v2: calendar, create, assign, reminders
```

### Sprint 6 (Weeks 11-12) — Complete Core Apps + Remaining Connectors

```
[BE Beta]  Connectors: Discord Webhook, Slack, Gmail, Reddit
[FE Beta]  technician-portal_v2: WO list, stage progression, check-in, inventory lookup
[FE Alpha] support-center_v2: classification panel, AI integration points
[FE Alpha] operations-center_v2: dispatch detail, technician view
[ALL FE]   App shell: nav, auth, role-based access, real-time subscriptions
[ALL FE]   Tests: E2E integration tests, real-time subscription tests
```

### Sprint 7 (Weeks 13-14) — Portals + Specialized Apps

```
[FE Beta]  customer-portal_v2: ticket submit, status tracker, appointment booking,
           knowledge search, profile, feedback forms
[FE Alpha] resolution-center_v2: dispute list, detail, AI analysis, approve/reject
[FE Alpha] crm-center_v2: account health dashboard, followup mgmt, retention campaigns
[ALL FE]   Tests: portal E2E journeys, specialized app integrations
```

### Sprint 8 (Weeks 15-16) — Notification Center + Polish

```
[FE Gamma] notification-center_v2: notification list, template mgmt, channel config,
           delivery analytics, channel health
[ALL FE]   Polish: loading states, error states, empty states, responsive, accessibility
[ALL FE]   Cross-cutting: shared error handling, consistent patterns
```

### Sprint 9 (Weeks 17-18) — Analytics + Admin Apps

```
[FE Gamma] analytics-center_v2: dashboards, KPIs, trend analysis, anomaly detection,
           report management, report catalog
[FE Gamma] admin-center_v2: user CRUD, roles, system settings, feature flags,
           connector config, audit log, workflow health
[ALL FE]   Tests: analytics data accuracy, admin permission boundaries
```

### Sprint 10 (Weeks 19-20) — Complete Apps + Agent Infrastructure

```
[FE Gamma] notification-center_v2 complete: send history, preview, delivery failure,
           channel fallback, rate limits
[ALL FE]   Cross-app navigation finalized, consistent header, auth gateway
[Agent]    Agent registry, invocation framework, context builder, output parser
[Agent]    Event subscription framework for agents
[Agent]    Agent permission enforcement
```

### Sprint 11 (Weeks 21-22) — Core Domain Agents

```
[Agent]    Agent instructions, schemas, permissions for:
           Executive (2), Support (5), Operations (3), CRM (4),
           Dispatch (4), Scheduling (3), Appointment (3)
[Agent]    Integration tests per agent: prompt accuracy, schema compliance
[Agent]    Cross-agent interaction tests: escalation chains
```

### Sprint 12 (Weeks 23-24) — Extended Domain Agents

```
[Agent]    Agent instructions, schemas, permissions for:
           Knowledge (3), Analytics (3), Admin (3), QA (3),
           Reporting (3), Notification (3), CX (4), Automation (3)
[Agent]    Escalation test scenarios for all departments
[Agent]    Latency benchmarks: P50, P95, P99
```

### Sprint 13 (Weeks 25-26) — Workflows Tier 0-1

```
[Workflow] 14 workflows:
           notification-delivery, ticket-auto-response, sla-enforcement,
           appointment-booking, appointment-reminders, standard-dispatch,
           knowledge-gap-detection, workflow-health-monitor,
           ticket-intake, appointment-completion, urgent-dispatch,
           dispute-resolution, account-health-scan, followup-slippage-detector
[Workflow] Tests: event-triggered execution, function nodes, agent nodes,
           human approval timeouts, notification delivery
```

### Sprint 14 (Weeks 27-28) — Workflows Tier 2-7

```
[Workflow] 19 workflows:
           ticket-escalation, work-order-fulfillment, dispute-escalation,
           followup-management, retention-campaign, customer-satisfaction-monitor,
           feedback-analysis, work-order-verification, knowledge-article-lifecycle,
           daily-standup, operations-coordination, report-generation,
           report-distribution, user-provisioning, system-config-management,
           inventory-reorder, trend-analysis, anomaly-detection, quality-review
[Workflow] Tests: full graph execution, cross-workflow triggers, parallel execution,
           failure recovery, idempotency
```

### Sprint 15 (Weeks 29-30) — Integration & Production

```
[ALL]      E2E test: full customer journey (ticket → dispatch → WO → feedback → CRM)
[ALL]      E2E test: full dispute lifecycle
[ALL]      E2E test: full account health lifecycle
[Platform] Load test: 100 concurrent tickets, 10K SLA batch, 50/sec notification
[Platform] Security audit: permissions, credentials, auth, audit completeness
[Platform] Production deployment: blue/green, migration, DNS switch, V1 read-only
[Platform] Monitoring: Grafana dashboards, alert rules, error budgets
[Platform] Documentation: runbook, playbook, migration guide
[ALL]      72-hour production monitoring window
```

---

> **End of IMPLEMENTATION_ORDER.md**  
> Next document: DEPENDENCY_TIMELINE.md
