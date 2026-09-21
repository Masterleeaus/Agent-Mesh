# RESQAI V2 — Implementation Batches

> Phase 3.5 — Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [Batch Overview](#1-batch-overview)
2. [Batch 1: Shared Foundation](#2-batch-1-shared-foundation)
3. [Batch 2: Database Core](#3-batch-2-database-core)
4. [Batch 3: Functions Layer 0-1](#4-batch-3-functions-layer-0-1)
5. [Batch 4: Functions Layer 2-3](#5-batch-4-functions-layer-2-3)
6. [Batch 5: Functions Layer 4-5 + Connectors](#6-batch-5-functions-layer-4-5--connectors)
7. [Batch 6: Core Applications](#7-batch-6-core-applications)
8. [Batch 7: Specialized Applications](#8-batch-7-specialized-applications)
9. [Batch 8: Cross-Cutting Applications](#9-batch-8-cross-cutting-applications)
10. [Batch 9: Agent Infrastructure + Core Agents](#10-batch-9-agent-infrastructure--core-agents)
11. [Batch 10: Extended Agents](#11-batch-10-extended-agents)
12. [Batch 11: Autonomous Workflows](#12-batch-11-autonomous-workflows)
13. [Batch 12: Entry + Secondary Workflows](#13-batch-12-entry--secondary-workflows)
14. [Batch 13: Execution + Reporting Workflows](#14-batch-13-execution--reporting-workflows)
15. [Batch 14: End-to-End Integration](#15-batch-14-end-to-end-integration)
16. [Batch 15: System Testing](#16-batch-15-system-testing)
17. [Batch 16: Performance Optimization](#17-batch-16-performance-optimization)
18. [Batch 17: Security Hardening](#18-batch-17-security-hardening)
19. [Batch 18: Production Release](#19-batch-18-production-release)

---

## 1. Batch Overview

| Batch | Name | Weeks | Sprint(s) | Parallel Teams | Go-Gate |
|:-----:|------|:-----:|:---------:|:--------------:|:-------:|
| 1 | Shared Foundation | 1-2 | 1 | 1 | — |
| 2 | Database Core | 2-4 | 1-2 | 1 | G0 |
| 3 | Functions L0-1 | 4-6 | 2-3 | 2 | — |
| 4 | Functions L2-3 | 5-8 | 3-4 | 2 | — |
| 5 | Functions L4-5 + Connectors | 9-12 | 5-6 | 3 | G1 |
| 6 | Core Applications | 9-14 | 5-7 | 4 | — |
| 7 | Specialized Applications | 13-16 | 7-8 | 3 | — |
| 8 | Cross-Cutting Applications | 15-18 | 8-9 | 4 | G2 |
| 9 | Agent Infrastructure + Core Agents | 18-22 | 10-11 | 2 | G3 |
| 10 | Extended Agents | 22-24 | 12 | 2 | — |
| 11 | Autonomous Workflows | 24-26 | 13 | 3 | — |
| 12 | Entry + Secondary Workflows | 25-27 | 13-14 | 3 | — |
| 13 | Execution + Reporting Workflows | 26-28 | 14 | 3 | G4 |
| 14 | End-to-End Integration | 28-30 | 15 | 8 | G5 |
| 15 | System Testing | 28-30 | 15 | 8 | — |
| 16 | Performance Optimization | 28-30 | 15 | 4 | — |
| 17 | Security Hardening | 28-30 | 15 | 4 | — |
| 18 | Production Release | 30-32 | Post-15 | 3 | G6 |

---

## 2. Batch 1: Shared Foundation

### Purpose
Establish the foundational monorepo scaffold, shared packages, design system, build tooling, and CI/CD pipeline that ALL subsequent batches depend on.

### Objectives
- Create monorepo workspace with TypeScript, React 18, Vite 8, Python
- Publish shared packages (types_v2, config_v2, utils_v2, sdk_v2, ui_v2, hooks_v2, forms_v2, layouts_v2, widgets_v2)
- Establish design system tokens, theme, and component library
- Configure CI/CD (lint, typecheck, test, build, deploy)
- Scaffold app template for creating _v2 applications

### Dependencies
- **Build-time:** None (this is the root)
- **Runtime:** Lemma Platform SDK, Node.js 22, Python 3.12

### Deliverables

| Artifact | Description | Owner |
|----------|-------------|-------|
| `packages/types_v2` | TypeScript interfaces for all V2 entities (tables, events, functions, agents, workflows) | Platform |
| `packages/config_v2` | Constants, table names, event names, route paths, theme tokens | Platform |
| `packages/utils_v2` | Date formatting, string utils, validation helpers, SLA calculation, state machine helpers | Platform |
| `packages/sdk_v2` | Lemma client wrapper (table read/write, function invocation, event pub/sub, auth, real-time) | Platform |
| `packages/ui_v2` | Design system components (Shell, DataTable, DataCard, SmartForm, StatusBadge, Button, Modal, Toast, KpiCard) | Platform |
| `packages/hooks_v2` | React hooks (useEvents, useTable, useFunction, useAuth, useNotifications, useSearch, useFilters, usePagination, useRealTime, usePermissions) | Platform |
| `packages/forms_v2` | Form schemas, validation rules, shared form components | Platform |
| `packages/layouts_v2` | App shell, navigation layout, list/detail/dashboard/form layouts, error boundaries | Platform |
| `.github/workflows/` | CI/CD pipeline config (build, lint, test, deploy) | Platform |
| `scripts/scaffold-v2-app.ts` | CLI tool to scaffold a new V2 app | Platform |

### Success Criteria
- [ ] `npm install` from root resolves all workspace packages without error
- [ ] All packages pass `tsc --noEmit` (zero type errors)
- [ ] All packages pass `eslint` (zero errors, zero warnings)
- [ ] `vitest run` passes for all packages (90%+ coverage)
- [ ] CI pipeline green on push to dev branch
- [ ] `scaffold-v2-app.ts` produces a runnable V2 app skeleton

### Risks
| Risk | Mitigation |
|------|------------|
| TypeScript version conflicts across workspaces | Pin exact versions in root package.json |
| Vite configuration complexity for multi-app monorepo | Use Vite multi-entry config pattern from day one |
| Lemma SDK version incompatibility | Lock SDK version in sdk_v2; test on every PR |

### Estimated Effort: 2 weeks, 8 engineers (Platform team)

---

## 3. Batch 2: Database Core

### Purpose
Create all 41 V2 database tables across 6 migration scripts with full FK relationships, indexes, views, RLS policies, and the event bus infrastructure.

### Objectives
- Execute Migration 0: Foundation tables (6)
- Execute Migration 1: Identity tables (2)
- Execute Migration 2: Core business tables (5)
- Execute Migration 3: Operational tables (6)
- Execute Migration 4: Detailed operations tables (10)
- Execute Migration 5-6: Notification + Admin + Analytics tables (12)
- Create all foreign key relationships and indexes
- Deploy event bus infrastructure (pub/sub channels, event envelope, schema registry)
- Deploy auth system (RLS policies per table, RBAC matrix)
- Establish monitoring pipeline (structured logging, health endpoints, error tracking)

### Dependencies
- **Build-time:** Shared packages from Batch 1
- **Runtime:** Lemma Platform (Datastore, Event Bus, Auth)

### Deliverables

| Artifact | Tables | Owner |
|----------|--------|-------|
| Migration 0 | reference_data_v2, system_settings_v2, feature_flags_v2, knowledge_categories_v2, user_roles_v2, connectors_v2 | Platform |
| Migration 1 | users_v2 (FK → user_roles_v2), user_sessions_v2 (FK → users_v2) | Platform |
| Migration 2 | customers_v2, customer_addresses_v2, technicians_v2, technician_skills_v2, knowledge_articles_v2 | Platform |
| Migration 3 | accounts_v2, tickets_v2, appointments_v2, inventory_items_v2 | Platform |
| Migration 4 | ticket_messages_v2, ticket_attachments_v2, account_health_scans_v2, followups_v2, followup_attempts_v2, appointment_reminders_v2, work_orders_v2, work_order_stages_v2, disputes_v2, dispute_evidence_v2 | Platform |
| Migration 5 | notification_templates_v2, notification_channels_v2, notifications_v2 | Platform |
| Migration 6 | feedback_v2, feedback_surveys_v2, tasks_v2, tasks_assignments_v2, events_v2, audit_log_v2, analytics_reports_v2, analytics_schedules_v2, operations_log, dispatches_v2 | Platform |

### Indexes Required

| Table | Indexes |
|-------|---------|
| tickets_v2 | (status), (customer_id), (assigned_technician_id), (created_at), (urgency + sla_deadline) |
| appointments_v2 | (technician_id + date), (customer_id), (status), (date) |
| work_orders_v2 | (technician_id), (appointment_id), (status) |
| notifications_v2 | (recipient_id), (channel), (status), (created_at) |
| events_v2 | (event_type), (source_id), (created_at) |
| audit_log_v2 | (table_name + record_id), (action), (actor_id) |
| followups_v2 | (account_id), (status), (assigned_to) |
| tasks_v2 | (assignee_id), (status), (due_date) |

### Views Required

| View | Definition | Purpose |
|------|------------|---------|
| v_ticket_sla_status | tickets_v2 + urgency + sla_deadline + status | Real-time SLA dashboard |
| v_technician_workload | technicians + active work_orders + today's appointments | Dispatch optimization |
| v_account_health_summary | accounts + health_scans + disputes + followups + tickets | CRM health dashboard |
| v_daily_operations_summary | tickets + appointments + dispatches + work_orders + tasks | Operations standup report |
| v_notification_delivery_stats | notifications grouped by channel + status + hour | Notification analytics |

### Success Criteria
- [ ] All 41 tables created with correct columns, types, defaults, and constraints
- [ ] All FK relationships verified (no orphan references, no circular dependencies)
- [ ] All indexes created (verified via `EXPLAIN ANALYZE` for query patterns)
- [ ] All views return correct data with real test data inserted
- [ ] RLS policies enforced per table per role (admin, manager, agent, technician, customer, read-only)
- [ ] Event bus: publish + consume + replay verified for 5 test events
- [ ] All migrations rollback cleanly (tested in isolation)
- [ ] Monitoring: health endpoint returns table row counts, event bus status, connection pool status

### Risks
| Risk | Mitigation |
|------|------------|
| FK constraint violation during bulk migration | Use DEFERRABLE constraints; validate data before migration |
| Migration ordering conflict | Sequential migration scripts with explicit dependency chain |
| RLS policy performance impact | Benchmark RLS queries with EXPLAIN ANALYZE; add composite indexes |

### Estimated Effort: 3 weeks, 8 engineers (Platform team)

---

## 4. Batch 3: Functions Layer 0-1

### Purpose
Build all 7 Deterministic (DET) and 8 Reader (REA) functions — the foundational function layer that all writer functions depend on.

### Objectives
- Build 7 DET functions (pure logic, no DB writes)
- Build 8 REA functions (read-only queries)
- Write unit + integration tests for each function
- Establish function versioning, OpenAPI specs, and deployment pipeline

### Dependencies
- **Build-time:** Batch 1 (shared packages), Batch 2 (tables + event bus)
- **Runtime:** system_settings_v2, feature_flags_v2, tickets_v2, appointments_v2, followups_v2, knowledge_articles_v2, inventory_items_v2

### Deliverables

| Order | Function | Type | Input | Output | Event |
|:-----:|----------|:----:|-------|--------|:-----:|
| 1 | validate-ticket-input | DET | ticket fields (raw) | validated ticket object | none |
| 2 | check-ticket-urgency | DET | ticket (validated) | urgency + next_action | none |
| 3 | classify-ticket-sla-tier | DET | urgency + customer_tier | sla_tier + sla_deadline | none |
| 4 | check-reminder-window | DET | appointment time + reminder config | send_reminder (bool) + window_start | none |
| 5 | calculate-dispatch-priority | DET | ticket urgency + technician availability | priority_score | none |
| 6 | validate-config-change | DET | config key + new value | valid (bool) + error_msg | none |
| 7 | validate-permissions | DET | user_id + action + resource | allowed (bool) | none |
| 8 | check-inventory-level | REA | inventory_item_id | current_stock, reorder_point | none |
| 9 | check-sla-deadline | REA | ticket_id | remaining_seconds, breached (bool) | ticket.sla_breached |
| 10 | collect-resolved-tickets | REA | date_range | ticket_id[] + count | none |
| 11 | fetch-upcoming-appointments | REA | technician_id + date | appointment[] | none |
| 12 | search-knowledge-articles | REA | query + category_id | article[] + relevance_scores | none |
| 13 | flag-slipping-followups | REA | none | followup_id[] + days_overdue | followup.slippage.detected |
| 14 | extract-knowledge-gap | REA | date_range | topics[] + gap_score | none |
| 15 | verify-workflow-health | REA | workflow_name | health_status + last_execution | workflow.recovery.initiated |

### Success Criteria
- [ ] All 15 functions deployed to staging (`lemma function list`)
- [ ] Each DET function returns correct output for 5+ input variations (unit tests)
- [ ] Each REA function returns correct data from real tables (integration tests)
- [ ] 90%+ code coverage on all functions
- [ ] OpenAPI spec generated per function
- [ ] Event emission verified for functions that emit events (check-sla-deadline, flag-slipping-followups)

### Risks
| Risk | Mitigation |
|------|------------|
| SLA deadline calculation off by timezone | All functions use UTC internally; timezone conversion at presentation layer only |
| Knowledge search relevance low | Use TF-IDF initially; enhance to embeddings in V2.1 |

### Estimated Effort: 2 weeks, 12 engineers (BE Alpha team)

---

## 5. Batch 4: Functions Layer 2-3

### Purpose
Build all 22 Writer (WRI) functions and 10 Aggregator (AGG) functions — the core business logic layer that powers all applications.

### Objectives
- Build 8 Core WRI functions (ticket, appointment, dispatch, work order, dispute)
- Build 14 Extended WRI functions (CRM, CX, notification, operations, admin, inventory, quality)
- Build 10 AGG functions (batch SLA, account health, sentiment, reports, metrics, quality scoring)
- Write unit + integration + event emission tests for each function

### Dependencies
- **Build-time:** Batch 3 (DET + REA functions), Batch 2 (all tables)
- **Runtime:** All 41 tables, DET + REA functions (for verification)

### Deliverables

| Order | Function | Type | Writes To | Event |
|:-----:|----------|:----:|-----------|:-----:|
| 16 | update-ticket-record | WRI | tickets_v2 | ticket.status.changed |
| 17 | assign-appointment-technician | WRI | appointments_v2 | appointment.assigned |
| 18 | schedule-appointment-reminders | WRI | appointment_reminders_v2 | none |
| 19 | finalize-dispatch | WRI | dispatches_v2 | dispatch.created |
| 20 | create-work-order | WRI | work_orders_v2 | work_order.created |
| 21 | update-work-order-stage | WRI | work_order_stages_v2 | work_order.stage.changed |
| 22 | complete-work-order | WRI | work_orders_v2 | work_order.completed |
| 23 | resolve-dispute | WRI | disputes_v2 | dispute.resolved |
| 24 | process-feedback-survey | WRI | feedback_v2 | feedback.submitted |
| 25 | create-followup-tasks | WRI | followups_v2 | followup.created |
| 26 | update-account-health-status | WRI | accounts_v2 | account.health.changed |
| 27 | finalize-slippage-review | WRI | followups_v2 | followup.slippage.detected |
| 28 | process-notification-delivery | WRI | notifications_v2 | notification.delivered/failed |
| 29 | create-operations-tasks | WRI | tasks_v2 | task.created |
| 30 | deactivate-user | WRI | users_v2 | user.disabled |
| 31 | apply-config-change | WRI | system_settings_v2 | system.config.changed |
| 32 | log-audit-event | WRI | audit_log_v2 | none |
| 33 | reorder-inventory | WRI | inventory_items_v2 | none |
| 34 | record-inventory-transaction | WRI | inventory_items_v2 | none |
| 35 | generate-api-token | WRI | users_v2 | none |
| 36 | reset-circuit-breaker | WRI | system_settings_v2 | system.config.changed |
| 37 | flag-quality-violation | WRI | quality_flag_v2 | none |

**Aggregator Functions (10):**

| Order | Function | Type | Reads From |
|:-----:|----------|:----:|------------|
| 38 | batch-sla-check | AGG | tickets_v2, system_settings_v2 |
| 39 | account-health-scan | AGG | accounts_v2, disputes_v2, followups_v2, feedback_v2, tickets_v2, appointments_v2 |
| 40 | generate-account-score | AGG | pure computation |
| 41 | analyze-feedback-sentiment | AGG | feedback_v2 |
| 42 | generate-standup-report | AGG | 8 tables |
| 43 | generate-report-data | AGG | 35+ tables |
| 44 | sync-events-analytics | AGG | events_v2 |
| 45 | calculate-metric-trend | AGG | events_v2 |
| 46 | batch-metric-aggregation | AGG | ALL domain tables |
| 47 | evaluate-quality-score | AGG | tickets_v2, ticket_messages_v2, disputes_v2 |

### Success Criteria
- [ ] All 32 functions deployed to staging
- [ ] Every WRI function: insert → verify by DET/REA reads same data back (verification test)
- [ ] Every WRI function emits correct event with valid schema
- [ ] Every AGG function produces correct aggregate for test data
- [ ] 90%+ code coverage (unit + integration)
- [ ] No circular function call dependencies (verified via static analysis)
- [ ] Event catalog alignment: emitted events match EVENT_CATALOG.md definitions

### Risks
| Risk | Mitigation |
|------|------------|
| AGG function performance with large datasets | Test with 10K+ rows; add query timeouts (5s max); add composite indexes |
| WRI function idempotency | All WRI functions use idempotency key pattern; transaction-safe writes |
| Account health computation complexity | Score formula frozen in Phase 1.x; no changes during implementation |

### Estimated Effort: 3 weeks, 24 engineers (BE Alpha + BE Beta)

---

## 6. Batch 5: Functions Layer 4-5 + Connectors

### Purpose
Build the final function layer (Transformer + Orchestrator) and all 6 external connectors. These complete the backend function and integration surface.

### Objectives
- Build 1 TRA function (render-notification-template)
- Build 5 ORC functions (dispatch-notifications, send-report, provision-user, rotate-credentials, recover-workflow-instance)
- Build all 6 connectors (SMTP, Twilio SMS, Discord, Slack, Gmail, Reddit)
- Build connector health framework (circuit breaker, rate limiting, credential rotation)
- Write integration tests for connector fallback chains

### Dependencies
- **Build-time:** Batch 4 (WRI + AGG functions), Batch 2 (connectors_v2, notification tables)
- **Runtime:** notification_templates_v2, notification_channels_v2, connectors_v2, ALL WRI + AGG functions

### Deliverables

| Order | Function | Type | Description | Depends On |
|:-----:|----------|:----:|-------------|------------|
| 48 | render-notification-template | TRA | Renders template with variable substitution | notification_templates_v2 |
| 49 | dispatch-notifications | ORC | Routes notifications to correct channel via connectors | ALL connectors, notification channels |
| 50 | send-report | ORC | Generates and delivers reports to subscribers | analytics_reports_v2, users_v2 |
| 51 | provision-user | ORC | Creates user with roles, permissions, initial config | users_v2, user_roles_v2 |
| 52 | rotate-credentials | ORC | Rotates API keys and connector credentials | connectors_v2, system_settings_v2 |
| 53 | recover-workflow-instance | ORC | Recover failed/stuck workflow instances | events_v2, audit_log_v2 |

| Connector | Type | Channels | Protocol | Fallback |
|-----------|------|----------|----------|----------|
| SMTP | Outbound | Email | SMTP/API | Secondary SMTP provider |
| Twilio SMS | Outbound | SMS | REST API | In-app notification |
| Discord Webhook | Outbound | Webhook | HTTP POST | Slack webhook |
| Slack | Bidirectional | Webhook/API | HTTP + WebSocket | Email |
| Gmail | Outbound | Email | OAuth 2.0 + SMTP | SMTP connector |
| Reddit | Outbound | API | OAuth 2.0 + REST | (none — informational) |

### Success Criteria
- [ ] All 6 functions deployed and passing integration tests
- [ ] `dispatch-notifications` correctly routes to each channel and handles fallback
- [ ] All 6 connectors pass smoke tests (send test message)
- [ ] Circuit breaker opens on rate limit hit and resets correctly
- [ ] Connector credential rotation works end-to-end
- [ ] 90%+ code coverage on all functions and connectors
- [ ] 100 events/s sustained throughput on event bus
- [ ] Function p95 latency < 500ms (simple), < 2s (complex AGG/ORC)

### Risks
| Risk | Mitigation |
|------|------------|
| External provider API rate limits | Circuit breaker tested with chaos engineering; rate limit config per connector |
| SMTP deliverability | SPF/DKIM/DMARC configured; delivery tracking with bounce handling |
| OAuth token expiration | Automatic refresh with 5-min pre-expiry refresh window |

### Estimated Effort: 3 weeks, 24 engineers (BE Alpha + BE Beta + BE Connector)

---

## 7. Batch 6: Core Applications

### Purpose
Build the 4 core internal applications that form the operational backbone of ResQAI V2.

### Objectives
- Build support-center_v2 (ticket management, SLA tracking, classification, messaging)
- Build operations-center_v2 (dashboard, task kanban, dispatch queue, standup)
- Build appointment-center_v2 (calendar, scheduling, technician assignment, reminders)
- Build technician-portal_v2 (mobile-first, work orders, job stages, photo upload)
- Connect each app to its dependent functions, events, and tables

### Dependencies
- **Backend:** Batch 1-5 (all shared packages, all functions, event bus, connectors)
- **Database:** Batch 2 (all tables)
- **Build-time:** Batch 1 shared packages (ui_v2, layouts_v2, hooks_v2, sdk_v2)

### Deliverables

#### support-center_v2
| Feature | Pages | Functions Called | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| Ticket Queue | Ticket List, Ticket Detail, Create Ticket | validate-ticket-input, check-ticket-urgency, update-ticket-record, check-sla-deadline, classify-ticket-sla-tier | request-classifier, reply-drafter |
| Message Thread | Thread Panel, Reply Editor | update-ticket-record | — |
| SLA Dashboard | SLA Metrics, SLA Breach List | batch-sla-check | sla-monitor |
| Classification | Classification Panel | classify-ticket-sla-tier | request-classifier |

#### operations-center_v2
| Feature | Pages | Functions Called | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| Dashboard | KPI Grid, Dispatch Panel, Blocker Banner | fetch-upcoming-appointments, check-inventory-level | operations-manager, coordinator |
| Task Kanban | Task Board, Task Cards | create-operations-tasks | operations-coordinator |
| Dispatch Queue | Dispatch List, Dispatch Detail | finalize-dispatch, calculate-dispatch-priority, dispatch-notifications | dispatch-manager, coordinator |
| Standup Report | Standup Page | collect-resolved-tickets, generate-standup-report | operations-coordinator |

#### appointment-center_v2
| Feature | Pages | Functions Called | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| Schedule Board | Calendar View, Appointment Detail | fetch-upcoming-appointments, assign-appointment-technician | scheduling-manager, appointment-scheduler, technician-suggester |
| Booking Wizard | New Appointment, Reschedule | assign-appointment-technician, check-reminder-window | appointment-scheduler |
| Reminders | Reminder Configuration | check-reminder-window, schedule-appointment-reminders, dispatch-notifications | reminder-coordinator |

#### technician-portal_v2
| Feature | Pages | Functions Called | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| My Day | Dashboard, Job Cards | fetch-upcoming-appointments | — |
| Work Orders | WO List, WO Detail, Stage Progression | complete-work-order, update-work-order-stage | — |
| Inventory | Stock Lookup, Transaction | check-inventory-level, record-inventory-transaction | — |
| Check-In | Geo Check-in, Photo Upload | update-work-order-stage | — |

### Events Emitted Per App

| App | Events |
|-----|--------|
| support-center_v2 | ticket.created, ticket.classified, ticket.reply.drafted, ticket.reply.approved, ticket.status.changed, ticket.escalated |
| operations-center_v2 | task.created, task.status.changed, dispatch.initiated, dispatch.completed, daily.standup.generated |
| appointment-center_v2 | appointment.created, appointment.assigned, appointment.status.changed, appointment.cancelled, appointment.completed |
| technician-portal_v2 | technician.status.changed, appointment.status.changed, task.completed |

### Success Criteria
- [ ] All 4 apps deployed, all major views render
- [ ] Each app connects to dependent functions (data flows correctly)
- [ ] Each app emits correct events on state changes
- [ ] Cross-app navigation (support → ops → appointment) works
- [ ] Responsive design verified (desktop + tablet)
- [ ] Load time < 3s per route (p95)
- [ ] Error states, loading states, empty states render for all data-dependent views

### Risks
| Risk | Mitigation |
|------|------------|
| Real-time SLA countdown performance | Use server time, update on interval, not real-time second-by-second |
| Calendar component complexity (monthly/weekly/daily) | Use battle-tested calendar library; custom rendering only on top |
| Kanban drag-and-drop state management | useReducer + optimistic updates; server sync on drop |

### Estimated Effort: 5 weeks, 32 engineers (FE Alpha + FE Beta + FE Delta)

---

## 8. Batch 7: Specialized Applications

### Purpose
Build the 2 specialized internal applications (CRM center, Resolution center) and the customer-facing portal.

### Objectives
- Build crm-center_v2 (account health dashboard, followup management, retention campaigns)
- Build resolution-center_v2 (dispute queue, AI analysis, approval workflow, trend analysis)
- Build customer-portal_v2 (self-service ticket submission, appointment booking, knowledge search, dispute filing, profile management)

### Dependencies
- **Backend:** Batch 1-5 (all shared packages, all functions, connectors)
- **Event:** Batch 6 (core apps emitting events)
- **Database:** Batch 2 (all tables including accounts, disputes, followups)

### Deliverables

#### crm-center_v2
| Feature | Pages | Functions Called | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| Account Dashboard | Account List, Account Detail (360° view) | account-health-scan, generate-account-score | crm-manager |
| Health Management | Health Scans, Risk Signals | update-account-health-status, flag-slipping-followups | account-health-monitor |
| Followup Center | Followup List, Followup Detail | create-followup-tasks, finalize-slippage-review | crm-followup-manager |
| Retention Campaigns | Campaign List, Campaign Builder | account-health-scan, dispatch-notifications | crm-retention-specialist |

#### resolution-center_v2
| Feature | Pages | Functions Called | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| Dispute Queue | Dispute List, Dispute Detail | — | resolution-advisor |
| AI Analysis | Analysis Panel, Recommendation Card | resolve-dispute | resolution-advisor |
| Approval Workflow | Approve/Reject/Resolve | resolve-dispute | — |
| Trend Analysis | Trend Charts, Category Breakdown | — | — |

#### customer-portal_v2
| Feature | Pages | Events Consumed | Agents Invoked |
|---------|-------|:----------------:|:--------------:|
| Home Dashboard | My Tickets, My Appointments, My Disputes | ticket.status.changed, appointment.status.changed, dispute.status.changed | — |
| Ticket Management | Create Ticket, Ticket Detail | ticket.created.customer | knowledge-article-suggester |
| Appointment Booking | Book Appointment, My Appointments | appointment.requested | — |
| Knowledge Base | Search Articles, Article Detail | — | knowledge-article-suggester |
| Profile & Settings | Profile, Notification Preferences, Account Health | account.health.changed | — |

### Success Criteria
- [ ] All 3 apps deployed to staging
- [ ] CRM center: health scores display correctly for test accounts
- [ ] Resolution center: AI analysis panel renders recommendations with confidence scores
- [ ] Customer portal: full self-service flow (ticket create → track → resolve) works
- [ ] All events published by Batch 6 consumed correctly
- [ ] Customer portal: mobile-first responsiveness verified on 3 device sizes
- [ ] Auth: customer sees only own data; technician sees only assigned data

### Risks
| Risk | Mitigation |
|------|------------|
| Health score calculation accuracy | Cross-validate with manual scoring; visual indication of confidence |
| AI analysis result handling (hallucination) | Confidence threshold display; human approval required for all actions |
| Customer identity/auth UX | Social login + magic link for low-friction auth; SSO for enterprise |

### Estimated Effort: 4 weeks, 34 engineers (FE Alpha + FE Beta + FE Gamma)

---

## 9. Batch 8: Cross-Cutting Applications

### Purpose
Build the 3 cross-cutting infrastructure applications that serve as platform-wide services.

### Objectives
- Build notification-center_v2 (notification log, template management, channel config, delivery analytics)
- Build analytics-center_v2 (dashboards, KPIs, trend analysis, report management, report catalog)
- Build admin-center_v2 (user CRUD, roles, system settings, feature flags, connector config, audit log)

### Dependencies
- **Backend:** Batch 1-5 (all functions, connectors, event bus)
- **Events:** Batch 6-7 (all apps emitting notification.send events)
- **Database:** Batch 2 (all tables)

### Deliverables

#### notification-center_v2
| Feature | Pages | Functions Called | Connectors Used |
|---------|-------|:----------------:|:---------------:|
| Dashboard | Delivery Metrics, Channel Health | process-notification-delivery | ALL |
| Notification Log | Searchable History, Delivery Status | process-notification-delivery | ALL |
| Template Manager | Template CRUD, Variable Insertion, Preview | render-notification-template | — |
| Channel Settings | Channel Config, Rate Limits, Fallback Order | dispatch-notifications | ALL |
| Delivery Analytics | Delivery Rates, Channel Performance | sync-events-analytics | — |

#### analytics-center_v2
| Feature | Pages | Functions Called |
|---------|-------|:----------------:|
| Executive Dashboard | Top-Level KPIs, Time-Series Charts, Drill-Down | sync-events-analytics, calculate-metric-trend |
| Department Analytics | Support/Operations/Appointment/CRM/Dispute Analytics | batch-metric-aggregation |
| Report Builder | Custom Reports, Drag-and-Drop Config, Preview | generate-report-data |
| Scheduled Reports | Schedule CRUD, Distribution Config, History | send-report, generate-report-data |
| Trend Analysis | Metric Trend, Seasonality, Anomaly Detection | calculate-metric-trend, batch-metric-aggregation |

#### admin-center_v2
| Feature | Pages | Functions Called |
|---------|-------|:----------------:|
| User Management | User CRUD, Role Assignment, Session Management | provision-user, deactivate-user, generate-api-token |
| Role Manager | Permission Tree Editor | validate-permissions |
| System Settings | Key-Value Config Editor, Environment Config | validate-config-change, apply-config-change |
| Feature Flags | Flag Toggle, Gradual Rollout, A/B Test Config | validate-config-change, apply-config-change |
| Connector Config | Connector CRUD, Health Check, Credential Rotation | rotate-credentials |
| Audit Log | Searchable, Exportable, Filterable | log-audit-event |
| Workflow Health | Workflow Instance List, Recovery, Circuit Breaker | verify-workflow-health, recover-workflow-instance, reset-circuit-breaker |
| Event Bus Monitor | Event Volume, Error Rate, Dead Letter Queue | — |

### Success Criteria
- [ ] All 3 apps deployed to staging
- [ ] Notification center sends test messages through ALL channels (SMTP, SMS, Discord, Slack, Gmail, Reddit)
- [ ] Notification delivery tracking: sent → delivered → opened (where applicable)
- [ ] Analytics center: metrics match manual calculation for same data
- [ ] Admin center: role changes propagate to all apps within 60s
- [ ] All apps functional without admin-center_v2 (degraded: use cached roles)
- [ ] Admin center: audit log captures all state-changing operations

### Risks
| Risk | Mitigation |
|------|------------|
| Notification template variable substitution edge cases | Template preview shows real rendering; validation on save |
| Analytics query performance with large datasets | Pre-aggregated materialized views; query timeouts (10s max) |
| Admin is a single point of configuration failure | Configuration cached in all apps; admin outage = stale config, not broken config |

### Estimated Effort: 4 weeks, 30 engineers (FE Gamma + FE Delta + BE Beta)

---

## 10. Batch 9: Agent Infrastructure + Core Agents

### Purpose
Build the agent runtime infrastructure and deploy all 26 core domain agents (Executive + Support + Operations + Dispatch + Scheduling + Appointment + CRM).

### Objectives
- Build agent registry, invocation framework, context builder, output parser, memory manager
- Build LLM gateway (rate limiting, caching, fallback to rule-based)
- Build agent permission enforcement (RLS integration)
- Build event subscription framework for agents
- Deploy and test 26 core domain agents

### Dependencies
- **Backend:** Batch 1-5 (all functions, event bus, connectors)
- **Applications:** Batch 6-8 (all apps providing triggers and data)
- **Infrastructure:** Agent runtime platform, LLM API access

### Deliverables

| Artifact | Description |
|----------|-------------|
| Agent Registry | CRUD for agent definitions, versioning, enable/disable |
| Invocation Framework | Standardized agent invocation with context, timeout, retry |
| Context Builder | Builds agent context from tables, events, conversation history |
| Output Parser | Validates agent output against schema; retries on schema violation |
| Memory Manager | Tiered memory (short/medium/long-term); RAG for long-term |
| LLM Gateway | Caching, rate limiting, fallback to rule-based, token budgeting |
| Permission Enforcer | Agent verifies user role before data access; no privilege escalation |

**Core Agents (26):**

| Department | Agents |
|------------|--------|
| Executive (2) | executive-director, platform-orchestrator |
| Support (5) | support-manager, support-request-classifier, support-reply-drafter, support-escalation-manager, support-sla-monitor |
| Operations (3) | operations-manager, operations-coordinator, operations-work-order-manager |
| Dispatch (4) | dispatch-manager, dispatch-coordinator, dispatch-technician-dispatcher, dispatch-emergency-response |
| Scheduling (3) | scheduling-manager, scheduling-appointment-scheduler, scheduling-technician-suggester |
| Appointment (3) | appointment-manager, appointment-reminder-coordinator, appointment-no-show-handler |
| CRM (4) | crm-manager, crm-account-health-monitor, crm-followup-manager, crm-retention-specialist |
| Automation (2) | automation-manager, automation-event-router |

### Success Criteria
- [ ] Agent registry: 26 agents deployed, all respond to health check
- [ ] Each agent passes 10 Q/A test cases (functional, boundary, error)
- [ ] Agent cascade: executive → manager → worker works end-to-end
- [ ] Agent latency: p95 < 5s from request to response
- [ ] Agent permissions: no data accessible beyond user role
- [ ] Agent safety: agents refuse harmful/out-of-scope requests
- [ ] Hallucination rate < 5% measured by manual audit (100 responses)
- [ ] Each agent emits correct events for domain actions

### Risks
| Risk | Mitigation |
|------|------------|
| Agent hallucination > 5% | Add confidence threshold filters; reduce agent autonomy; increase human review |
| LLM API latency > 5s | Add caching layer for common queries; fallback to rule-based in degraded mode |
| Agent permission escalation | Every table access validated against user role at runtime; no agent can bypass RLS |

### Estimated Effort: 4 weeks, 16 engineers (Agent Core team)

---

## 11. Batch 10: Extended Agents

### Purpose
Deploy the remaining 23 extended domain agents across Knowledge, Analytics, Admin, QA, Reporting, Notification, CX, and Automation departments.

### Objectives
- Deploy 23 extended domain agents
- Write integration tests for all agent-to-agent interactions and escalation chains
- Performance benchmark all agents (P50, P95, P99 latency)
- Verify cross-agent escalation chains

### Dependencies
- **Build-time:** Batch 9 (agent infrastructure + core agents)
- **Runtime:** All functions, all tables, all core agents

### Deliverables

| Department | Agents |
|------------|--------|
| Knowledge (3) | knowledge-manager, knowledge-curator, knowledge-article-suggester |
| Analytics (3) | analytics-manager, analytics-trend-analyzer, analytics-predictive-modeler |
| Admin (3) | admin-manager, admin-system-config, admin-connector-manager |
| QA (3) | qa-manager, qa-response-quality-monitor, qa-compliance-monitor |
| Reporting (3) | reporting-manager, reporting-generator, reporting-distributor |
| Notification (3) | notification-manager, notification-channel-optimizer, notification-template-manager |
| CX (4) | cx-manager, cx-satisfaction-survey, cx-feedback-analyzer, cx-winback-specialist |
| Automation (1) | automation-workflow-orchestrator |

### Success Criteria
- [ ] All 49 agents deployed and healthy
- [ ] Agent cascade chains verified (e.g., support → knowledge → analytics)
- [ ] Escalation chains correct: worker → manager → human (where defined)
- [ ] Cross-department agent handoff works (e.g., support hands off to dispatch)
- [ ] P50 < 2s, P95 < 5s, P99 < 10s latency
- [ ] Agent memory: short/medium/long-term context correctly tiered
- [ ] Token budgets enforced per agent per session

### Risks
| Risk | Mitigation |
|------|------------|
| Extended agents depend on core agents being correct | Core agents tested rigorously in Batch 9 before extended agents start |
| Agent memory requirements exceed context window | Implement RAG summarization; trim conversation history to last N turns |
| Cross-department handoff complexity | Strict agent handoff protocol; handoff passes context document, not conversation |

### Estimated Effort: 2 weeks, 8 engineers (Agent Extended team)

---

## 12. Batch 11: Autonomous Workflows

### Purpose
Build and deploy the 8 Tier 0 (Autonomous) workflows — fully automated workflows that require no human approval.

### Objectives
- Build 8 autonomous workflows with event triggers
- Test each workflow for correct execution, error handling, and rollback
- Verify notification delivery from notification-producing workflows

### Dependencies
- **Functions:** All 53 functions (Batch 3-5)
- **Connectors:** All 6 connectors (Batch 5)
- **Agents:** All 49 agents (Batch 9-10)
- **Event Bus:** Batch 2

### Deliverables

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 1 | notification-delivery_v2 | notification.send | dispatch-notifications, render-notification-template, process-notification-delivery | notification-manager, channel-optimizer, template-manager |
| 2 | ticket-auto-response_v2 | ticket.created | check-ticket-urgency, dispatch-notifications | knowledge-article-suggester |
| 3 | sla-enforcement_v2 | cron (every 5 min) | batch-sla-check, classify-ticket-sla-tier | support-sla-monitor |
| 4 | appointment-booking_v2 | appointment.created | assign-appointment-technician, dispatch-notifications | scheduling-appointment-scheduler, scheduling-technician-suggester |
| 5 | appointment-reminders_v2 | appointment.confirmed | fetch-upcoming-appointments, schedule-appointment-reminders, check-reminder-window, dispatch-notifications | appointment-reminder-coordinator |
| 6 | standard-dispatch_v2 | ticket.classified (service) | finalize-dispatch, calculate-dispatch-priority, dispatch-notifications | dispatch-coordinator, dispatch-technician-dispatcher |
| 7 | knowledge-gap-detection_v2 | cron (daily) | extract-knowledge-gap | knowledge-manager, knowledge-curator |
| 8 | workflow-health-monitor_v2 | cron (every min) | verify-workflow-health, recover-workflow-instance, reset-circuit-breaker | automation-manager, automation-workflow-orchestrator |

### Success Criteria
- [ ] All 8 workflows deployed and triggering on correct events
- [ ] Each workflow passes 5 scenarios (happy path, error path, edge case, rollback, timeout)
- [ ] Autonomous execution (no human approval steps) completes within SLA
- [ ] Notification-producing workflows deliver actual messages through correct channels
- [ ] Workflow state persists across process restarts
- [ ] Failed workflows auto-retry 3× with exponential backoff; then dead letter

### Risks
| Risk | Mitigation |
|------|------------|
| Workflow execution timeout for complex cross-domain flows | Hard timeout per function node (5s); workflow state checkpointing |
| Idempotency store becomes bottleneck | TTL-based expiry; in-memory cache with DB persistence |

### Estimated Effort: 2 weeks, 10 engineers (Workflow team)

---

## 13. Batch 12: Entry + Secondary Workflows

### Purpose
Build and deploy 6 Entry (Tier 1) and 7 Secondary (Tier 2-3) workflows — including the most complex business flows with human approval gates.

### Objectives
- Build 13 workflows with event triggers and human approval nodes
- Test human approval timeouts, escalation paths, and parallel execution
- Verify cross-workflow triggers (workflow A completes → triggers workflow B)

### Dependencies
- **Build-time:** Batch 11 (autonomous workflows)
- **Runtime:** All functions, connectors, agents, events

### Deliverables

**Tier 1 — Entry Workflows (6):**

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 9 | ticket-intake_v2 | ticket.created | check-ticket-urgency, update-ticket-record, dispatch-notifications | request-classifier, reply-drafter, article-suggester |
| 10 | appointment-completion_v2 | appointment.completed | create-followup-tasks | operations-work-order-manager |
| 11 | urgent-dispatch_v2 | ticket.created (urgent), ticket.escalated | finalize-dispatch, calculate-dispatch-priority, dispatch-notifications | dispatch-coordinator, dispatcher, emergency-response, dispatch-manager |
| 12 | dispute-resolution_v2 | dispute.created | resolve-dispute, dispatch-notifications | resolution-advisor |
| 13 | account-health-scan_v2 | cron (daily) | account-health-scan, flag-slipping-followups, update-account-health-status, dispatch-notifications | account-health-monitor, crm-manager |
| 14 | followup-slippage-detector_v2 | cron (daily) | flag-slipping-followups, finalize-slippage-review | crm-followup-manager |

**Tier 2-3 — Secondary Workflows (7):**

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 15 | ticket-escalation_v2 | ticket.escalated, ticket.sla_breached | update-ticket-record, dispatch-notifications | support-escalation-manager |
| 16 | work-order-fulfillment_v2 | appointment.completed | create-work-order, update-work-order-stage, complete-work-order, record-inventory-transaction | operations-work-order-manager |
| 17 | dispute-escalation_v2 | dispute.escalated | resolve-dispute | (human executive) |
| 18 | followup-management_v2 | appointment.completed, dispute.resolved | create-followup-tasks, dispatch-notifications | crm-followup-manager |
| 19 | retention-campaign_v2 | account.health.changed | create-followup-tasks | crm-retention-specialist, crm-manager |
| 20 | customer-satisfaction-monitor_v2 | ticket.closed, appointment.completed, dispute.resolved | process-feedback-survey, dispatch-notifications | cx-satisfaction-survey, cx-feedback-analyzer |
| 21 | feedback-analysis_v2 | feedback.submitted | analyze-feedback-sentiment | cx-feedback-analyzer, cx-manager |

### Success Criteria
- [ ] All 13 workflows deployed
- [ ] Human approval nodes work (submit → notify approver → approve/reject/timeout)
- [ ] Approval timeout correctly escalates to next approver
- [ ] Cross-workflow triggers: appointment-completion triggers work-order-fulfillment
- [ ] Rollback procedures verified for each workflow
- [ ] Error notification: failed workflows alert admin with full context

### Risks
| Risk | Mitigation |
|------|------------|
| Human approval workflow delays (approver not responding) | Configurable timeout; auto-escalation after timeout; email/SMS reminders |
| Cross-workflow trigger loops | Event filter prevents infinite loops; max execution depth enforced |
| Dispute resolution agent hallucination | All agent recommendations require human approval; confidence score displayed |

### Estimated Effort: 2 weeks, 10 engineers (Workflow team)

---

## 14. Batch 13: Execution + Reporting Workflows

### Purpose
Build and deploy the remaining 9 Execution (Tier 4-5) and 3 Reporting (Tier 6-7) workflows — completing the full workflow ecosystem.

### Objectives
- Build 12 workflows including scheduled reports, quality reviews, and admin operations
- Test full graph execution across all workflow tiers
- Verify parallel workflow execution and failure recovery
- Validate all 33 workflows together in staging

### Dependencies
- **Build-time:** Batch 11-12 (Tier 0-3 workflows)
- **Runtime:** All functions, connectors, agents, events, applications

### Deliverables

**Tier 4-5 — Execution Workflows (9):**

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 22 | work-order-verification_v2 | work_order.completed | none | qa-manager, qa-response-quality-monitor |
| 23 | knowledge-article-lifecycle_v2 | cron (daily) | none | knowledge-manager, knowledge-curator |
| 24 | daily-standup_v2 | cron (daily 8 AM) | collect-resolved-tickets, generate-standup-report, create-operations-tasks | operations-coordinator |
| 25 | operations-coordination_v2 | on-demand | create-operations-tasks | operations-coordinator |
| 26 | report-generation_v2 | cron (scheduled/set) | generate-report-data | reporting-manager, reporting-generator |
| 27 | report-distribution_v2 | report.generated | send-report | reporting-distributor, notification-manager |
| 28 | user-provisioning_v2 | admin action | provision-user, deactivate-user | admin-manager |
| 29 | system-config-management_v2 | admin action | validate-config-change, apply-config-change, log-audit-event | admin-manager, admin-system-config |
| 30 | inventory-reorder_v2 | cron (daily) | check-inventory-level, reorder-inventory, record-inventory-transaction, dispatch-notifications | — |

**Tier 6-7 — Reporting Workflows (3):**

| Order | Workflow | Trigger | Functions Called | Agents Used |
|:-----:|----------|---------|:----------------:|:-----------:|
| 31 | trend-analysis_v2 | cron (hourly) | sync-events-analytics, calculate-metric-trend, batch-metric-aggregation | analytics-trend-analyzer, analytics-manager |
| 32 | anomaly-detection_v2 | cron (hourly) | batch-metric-aggregation | analytics-trend-analyzer, analytics-manager |
| 33 | quality-review_v2 | on-demand | evaluate-quality-score, flag-quality-violation | qa-manager, qa-response-quality-monitor, qa-compliance-monitor |

### Success Criteria
- [ ] All 12 workflows deployed
- [ ] Full multi-tier workflow chain: Tier 0 → Tier 1 → Tier 4 → Tier 6 works end-to-end
- [ ] Scheduled workflows (cron) trigger at correct times
- [ ] Parallel workflow execution (e.g., daily-standup + account-health-scan both run at 8 AM)
- [ ] Idempotency: replaying same event does not duplicate side effects
- [ ] All workflow steps logged with timestamp, actor, data delta
- [ ] All 33 workflows pass integration with all other components

### Risks
| Risk | Mitigation |
|------|------------|
| Cron job collision (multiple daily workflows at same time) | Stagger cron schedules; workflow queue with priority |
| Idempotency key conflict across long periods | Include date+source+type in idempotency key; TTL > 30 days |
| Quality review workflow stalls on large dataset | Stream results; paginated processing; timeout at 30s total |

### Estimated Effort: 2 weeks, 10 engineers (Workflow team)

---

## 15. Batch 14: End-to-End Integration

### Purpose
Connect all components into fully integrated end-to-end business journeys. This is the final validation before production.

### Objectives
- Execute 3 full business journeys end-to-end
- Verify event flow integrity across all event chains
- Validate notification pipeline (SMS, email, push all deliver at < 30s from trigger)
- Verify V1/V2 data sync (if dual-write mode active)
- Full regression suite execution

### Dependencies
- **Build-time:** ALL previous batches (1-13)
- **Runtime:** ALL components in staging environment

### Deliverables

**Full Business Journeys:**

| Journey | Steps | Verifications |
|---------|-------|---------------|
| Customer Support Journey | Customer creates ticket → Agent classifies → Technician dispatched → WO completed → Customer notified → Feedback collected | 15+ event emissions, 5+ function calls, 3+ agent invocations, 3+ notification deliveries |
| Appointment + Fulfillment Journey | Customer books appointment → Technician assigned → Work completed → Work order created → Inventory updated → Followup scheduled | 12+ event emissions, 4+ function calls, 2+ agent invocations |
| Account Health + Retention Journey | Health scan runs → Slipping followup detected → Retention campaign triggered → VIP intervention scheduled | 8+ event emissions, 3+ function calls, 3+ agent invocations |

### Success Criteria
- [ ] Full Customer Support Journey completes in < 5 min (excluding human approval)
- [ ] Full Appointment Journey completes in < 3 min
- [ ] Full Account Health Journey completes in < 5 min
- [ ] All events in each journey produce expected downstream actions
- [ ] Notification pipeline: < 30s from trigger to delivery (each channel)
- [ ] V1/V2 data consistent (dual-write reconciliation verified)
- [ ] All 150+ components operational

### Risks
| Risk | Mitigation |
|------|------------|
| Event loss in long chains | Every event logged at producer; dead letter queue with alerting |
| Notification delivery delay > 30s | Connector health checks; fallback channel activation |
| Integration test flakiness | Retry flaky tests (3× max); quarantine consistently flaky tests for investigation |

### Estimated Effort: 2 weeks, 62 engineers (ALL teams)

---

## 16. Batch 15: System Testing

### Purpose
Comprehensive system-level testing across all quality dimensions.

### Objectives
- Execute full regression suite (all 7 gate criteria)
- Load test at production scale (200 concurrent users)
- Disaster recovery drill (simulate full failure, measure recovery time)
- Security scan (DAST + SAST + dependency scan)
- Performance profiling and optimization
- Accessibility audit (WCAG 2.1 AA)
- Cross-browser/cross-device compatibility testing

### Dependencies
- **Build-time:** Batch 14 (integrated staging environment)
- **Runtime:** Staging environment with all components deployed

### Deliverables

| Test Type | Scope | Tool/Method | Target |
|-----------|-------|-------------|--------|
| Unit Tests | ALL functions, ALL components | vitest, pytest | 90%+ coverage |
| Integration Tests | EVERY function with its tables | lemma function test | 159+ tests |
| E2E Tests | 10 apps (5 critical journeys each) | Playwright/Cypress | 50+ journeys |
| Cross-App Tests | 3 critical cross-app journeys | Playwright E2E | 3 journeys |
| Workflow Tests | 33 workflows (5 scenarios each) | lemma workflow test | 165+ tests |
| Agent Tests | 49 agents (10 Q/A each) | Custom agent test harness | 490+ tests |
| Load Tests | 200 concurrent users, 30 min | k6/artillery | No SLA violation |
| Performance | App load time, function latency, agent latency | Lighthouse, custom | <3s FE, <500ms BE, <5s agents |
| Security | DAST + SAST + dependency scan | OWASP ZAP, SonarQube, Snyk | Zero critical/high |
| DR Drill | Full failure simulation | Manual procedure | < 1h RTO |
| Accessibility | All app pages | axe + manual | WCAG 2.1 AA |
| Cross-Browser | Chrome, Firefox, Safari, Edge | Playwright | No layout/functional issues |

### Success Criteria
- [ ] Regression suite: 0 failures
- [ ] Load test: 200 concurrent users, no SLA violation for 30 min
- [ ] DR drill: full recovery in < 45 min
- [ ] Security: 0 critical, 0 high findings
- [ ] Performance: all metrics within threshold
- [ ] Accessibility: WCAG 2.1 AA pass
- [ ] Cross-browser: no blocking issues on any target browser

### Risks
| Risk | Mitigation |
|------|------------|
| Load test reveals bottleneck | Profile during test; optimize hot path; add read replicas if needed |
| Security scan produces critical findings | Fix before proceeding; patch within 24h of discovery |
| Flaky E2E tests | Quarantine flaky tests; 3-reliable-run rule before gate pass |

### Estimated Effort: 2 weeks, 8 engineers (QA team + all leads)

---

## 17. Batch 16: Performance Optimization

### Purpose
Optimize performance based on load test and profiling results.

### Objectives
- Profile and optimize slow API endpoints (< 500ms target)
- Optimize slow frontend components (Lighthouse score > 85)
- Reduce bundle sizes (< 500KB gzipped per app)
- Optimize database queries (index all query patterns)
- Configure CDN caching for static assets
- Implement lazy loading for all non-critical routes

### Dependencies
- **Build-time:** Batch 15 (load test results, performance profiling data)
- **Runtime:** Production-configured staging environment

### Deliverables
- [ ] Performance optimization report with before/after metrics
- [ ] All slow queries optimized (verified with EXPLAIN ANALYZE)
- [ ] All apps: Lighthouse Performance ≥ 85
- [ ] All apps: bundle size < 500KB gzipped
- [ ] CDN caching configured for static assets (Cache-Control headers)
- [ ] Lazy loading implemented for all routes not in critical path
- [ ] Image optimization pipeline configured

### Success Criteria
- [ ] API p95 < 200ms (was 500ms)
- [ ] Lighthouse Performance ≥ 85 on all apps
- [ ] Bundle size < 450KB gzipped per app
- [ ] Time to Interactive < 2s on desktop, < 3s on mobile
- [ ] No regressions introduced (full regression suite still passes)

### Risks
| Risk | Mitigation |
|------|------------|
| Optimization introduces bugs | Run full regression after each optimization batch |
| CDN cache invalidation complexity | Versioned file names; cache-bust query parameters |

### Estimated Effort: 2 weeks, 4 engineers (Platform + FE leads)

---

## 18. Batch 17: Security Hardening

### Purpose
Final security hardening and compliance validation before production.

### Objectives
- Resolve all security findings from Batch 15
- Penetration test (all 10 apps, all 53 functions, all 49 agents)
- Validate RLS policies against all role types
- Test rate limiting on all public endpoints
- Verify secret management (no hardcoded secrets)
- Validate audit logging completeness
- GDPR/data retention compliance review

### Dependencies
- **Build-time:** Batch 15 security scan results
- **Runtime:** Staging environment with production-like data

### Deliverables
- [ ] Security remediation report (all findings resolved)
- [ ] Penetration test report (zero critical, zero high)
- [ ] RLS policy validation matrix (all roles × all tables)
- [ ] Rate limiting test results
- [ ] Secret scan report (zero secrets in source)
- [ ] Audit log completeness verification
- [ ] GDPR compliance checklist completed

### Success Criteria
- [ ] Zero critical, zero high security findings
- [ ] No secrets in source code or environment config (verified by trufflehog)
- [ ] All 41 tables have RLS enforced and tested for each role
- [ ] Rate limiting configured and tested on all public endpoints
- [ ] Audit log captures every state-changing operation with actor, timestamp, before/after
- [ ] GDPR right-to-delete workflow tested
- [ ] Data retention policies documented and enforced

### Risks
| Risk | Mitigation |
|------|------------|
| Penetration test reveals critical vulnerability | Fix within 24h; re-test before proceeding to production gate |
| RLS misconfiguration allows data leak | Automated RLS test matrix runs on every deploy |

### Estimated Effort: 2 weeks, 4 engineers (Security team + Platform lead)

---

## 19. Batch 18: Production Release

### Purpose
Execute production deployment with phased canary rollout, monitoring, and final cutover.

### Objectives
- Production environment provisioning and configuration
- Canary deployment (10% → 50% → 100%)
- 72-hour production monitoring window
- V1 read-only cutover
- V1 decommission planning

### Dependencies
- **Build-time:** ALL batches 1-17 (all components production-ready)
- **Runtime:** Production environment provisioned, V1 running

### Deliverables

| Stage | Actions | Duration | Go Criteria |
|-------|---------|:--------:|-------------|
| Pre-Production | DNS config, SSL certs, DB connection pools, CDN setup | 2 days | All health checks pass |
| Stage 1: Canary (10%) | Route 10% traffic to V2; monitor SLAs, error rates, latency | 72h | No P0/P1, SLA metrics green |
| Stage 2: Ramp (50%) | Route 50% traffic; monitor data consistency | 1 week | No incident, data consistent, load OK |
| Stage 3: Full (100%) | Route 100% traffic; V1 read-only fallback | 30 days | SLA sustained 72h+, 0 P0/P1 |
| V1 Decommission | V1 tables dropped after 30-day verification | 4 weeks post-prod | Zero data loss verified |

### Success Criteria
- [ ] Canary: 10% traffic handled without error for 72h
- [ ] Ramp: 50% traffic handled without incident for 1 week
- [ ] Full production: SLA 99.9% uptime, API <2s p95, Agent <5s p95
- [ ] Zero P0/P1 production bugs
- [ ] V1 rollback ready at any point in first 30 days
- [ ] Monitoring dashboards show all components healthy
- [ ] On-call rotation established and active

### Risks
| Risk | Mitigation |
|------|------------|
| Production migration data inconsistency | Dual-write during cutover; reconciliation job runs hourly; rollback ready |
| Canary reveals performance issue | Rollback to V1; performance optimize; re-canary |
| V1 decommission data loss | 30-day preservation before drop; verification script checks row counts to zero |

### Estimated Effort: 2 weeks, 8 engineers (Platform + BE + QA + Security)

---

> **End of IMPLEMENTATION_BATCHES.md**
