# RESQAI V2 — Sprint Plan

> Phase 2.0 — Implementation Planning Only  
> Chief Technical Program Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Sprint Calendar](#1-sprint-calendar)
2. [Sprint 1-2: Foundation](#2-sprint-1-2-foundation)
3. [Sprint 3-4: Core Functions](#3-sprint-3-4-core-functions)
4. [Sprint 5-6: Core Applications](#4-sprint-5-6-core-applications)
5. [Sprint 7-8: Portals & Specialized](#5-sprint-7-8-portals--specialized)
6. [Sprint 9-10: Cross-Cutting Apps](#6-sprint-9-10-cross-cutting-apps)
7. [Sprint 11-12: AI Agents](#7-sprint-11-12-ai-agents)
8. [Sprint 13-14: Workflows](#8-sprint-13-14-workflows)
9. [Sprint 15: Integration & Production](#9-sprint-15-integration--production)

---

## 1. Sprint Calendar

| Sprint | Weeks | Phase | Focus | Teams |
|:------:|:-----:|:-----:|-------|:-----:|
| 1 | 1-2 | 0 | Foundation, scaffold, shared packages, migration tiers 0-2 | Platform (2) |
| 2 | 3-4 | 0-1 | Migration tiers 3-6, event bus, auth, Tier 0 functions | Platform (2), BE Alpha (2) |
| 3 | 5-6 | 1 | Tier 1-2 functions (Ticket, Appointment, Dispatch, Work Order, Dispute) | BE Alpha (2), BE Beta (2) |
| 4 | 7-8 | 1 | Tier 2-3 functions (CRM, CX, Knowledge, Notification, Operations, Reporting, Analytics) | BE Alpha (2), BE Beta (2) |
| 5 | 9-10 | 1-2 | Tier 3 functions (Admin, Inventory, Security, Automation, Quality), Core Apps start | BE Beta (2), FE Alpha (2), FE Beta (2) |
| 6 | 11-12 | 2 | Core Apps (support-center_v2, operations-center_v2, appointment-center_v2, technician-portal_v2) | FE Alpha (2), FE Beta (2) |
| 7 | 13-14 | 3 | Portals & Specialized Apps (customer-portal_v2, resolution-center_v2, crm-center_v2) | FE Alpha (2), FE Beta (2) |
| 8 | 15-16 | 3-4 | Specialized Apps complete; Cross-Cutting Apps start (notification-center_v2) | FE Alpha (1), FE Gamma (2) |
| 9 | 17-18 | 4 | Cross-Cutting Apps (analytics-center_v2, admin-center_v2) | FE Gamma (2) |
| 10 | 19-20 | 4-5 | App polish; Agent infrastructure; Executive + Support + Operations agents | FE Gamma (1), Agent (2) |
| 11 | 21-22 | 5 | Agents: CRM, Dispatch, Scheduling, Appointment, Knowledge, Analytics | Agent (2) |
| 12 | 23-24 | 5 | Agents: Admin, QA, Reporting, Notification, CX, Automation | Agent (2) |
| 13 | 25-26 | 6 | Workflows Tier 0-1 (Autonomous + Entry): 14 workflows | Workflow (2) |
| 14 | 27-28 | 6 | Workflows Tier 2-5 (Secondary + Execution): 16 workflows | Workflow (2) |
| 15 | 29-30 | 6-7 | Workflows Tier 6-7 (Reporting): 3 workflows; Integration & Production | All teams (8) |

---

## 2. Sprint 1-2: Foundation

**Duration:** Weeks 1-4 | **Team:** Platform (2 engineers) | **Risk:** High

### Sprint 1 (Weeks 1-2)

| Area | Deliverables |
|------|-------------|
| **Repository** | `packages/v2/` directory structure; TypeScript + Python monorepo config; Vite project scaffold; Lemma workspace config |
| **Shared Packages** | `types_v2` — all V2 TypeScript types, enums, interfaces; `config_v2` — constants, table names, event names, route paths; `utils_v2` — date formatting, validation helpers, string utilities; `sdk_v2` — Lemma SDK wrapper (emitEvent, subscribeToEvent, callFunction, queryTable) |
| **Shared UI** | `ui_v2` — core components (Shell, DataTable, DataCard, SmartForm, StatusBadge, LoadingState, ErrorBoundary); `hooks_v2` — useEvents, useTable, useFunction, useAuth; `layouts_v2` — Shell, ListLayout, DetailLayout, DashboardLayout, FormLayout; `forms_v2` — form primitives with validation |
| **CI/CD** | GitHub Actions: lint, typecheck, test, build, deploy per service; branch protection rules; PR template |
| **Migration 0** | `reference_data_v2`, `system_settings_v2`, `feature_flags_v2`, `knowledge_categories_v2`, `user_roles_v2`, `connectors_v2` |
| **Migration 1** | `users_v2`, `user_sessions_v2` |

### Sprint 2 (Weeks 3-4)

| Area | Deliverables |
|------|-------------|
| **Migration 2** | `customers_v2`, `customer_addresses_v2`, `technicians_v2`, `technician_skills_v2`, `knowledge_articles_v2` |
| **Migration 3** | `accounts_v2`, `tickets_v2`, `appointments_v2`, `inventory_items_v2` |
| **Migration 4** | `ticket_messages_v2`, `ticket_attachments_v2`, `account_health_scans_v2`, `followups_v2`, `followup_attempts_v2`, `appointment_reminders_v2`, `work_orders_v2`, `work_order_stages_v2`, `disputes_v2`, `dispute_evidence_v2` |
| **Migration 5-6** | `notifications_v2`, `notification_templates_v2`, `notification_channels_v2`, `tasks_v2`, `tasks_assignments_v2`, `feedback_v2`, `feedback_surveys_v2`, `events_v2`, `audit_log_v2`, `analytics_reports_v2`, `analytics_schedules_v2`, `operations_log` |
| **Event Bus** | Lemma event bus configuration; topic creation (14 topics); event envelope structure; schema registry in system_settings_v2 |
| **Auth** | Authentication middleware; JWT handling; role-based access control scaffold |
| **Monitoring** | Basic health endpoints per service; structured logging setup; error tracking integration |
| **DETERMINISTIC Functions** | `validate-ticket-input`, `check-ticket-urgency`, `classify-ticket-sla-tier`, `calculate-dispatch-priority`, `check-reminder-window`, `validate-config-change`, `validate-permissions` |

### Definition of Done — Sprint 2

- All 41 V2 tables exist with correct schemas and foreign keys
- 14 event topics created and subscribable
- Shared packages published and importable
- Auth middleware returns 200/401 correctly
- 7 DETERMINISTIC functions registered and callable
- CI/CD pipeline green on all branches

---

## 3. Sprint 3-4: Core Functions

**Duration:** Weeks 5-8 | **Teams:** BE Alpha (2), BE Beta (2) | **Risk:** Medium

### Sprint 3 (Weeks 5-6)

| Area | Deliverables |
|------|-------------|
| **READER Functions** | `check-sla-deadline`, `collect-resolved-tickets`, `fetch-upcoming-appointments`, `search-knowledge-articles`, `flag-slipping-followups`, `extract-knowledge-gap`, `verify-workflow-health`, `check-inventory-level` |
| **WRITER Functions** | `update-ticket-record`, `assign-appointment-technician`, `schedule-appointment-reminders`, `finalize-dispatch`, `create-work-order`, `update-work-order-stage`, `complete-work-order`, `resolve-dispute` |
| **AGGREGATOR Functions** | `batch-sla-check`, `generate-account-score` |
| **Function Tests** | Unit tests for all Tier 0-1 functions; integration tests for WRITER functions with real DB |

### Sprint 4 (Weeks 7-8)

| Area | Deliverables |
|------|-------------|
| **WRITER Functions** | `update-account-health-status`, `create-followup-tasks`, `finalize-slippage-review`, `process-feedback-survey`, `process-notification-delivery`, `create-operations-tasks`, `deactivate-user`, `apply-config-change`, `log-audit-event`, `reorder-inventory`, `record-inventory-transaction`, `generate-api-token`, `reset-circuit-breaker`, `flag-quality-violation` |
| **AGGREGATOR Functions** | `account-health-scan`, `analyze-feedback-sentiment`, `generate-standup-report`, `generate-report-data`, `sync-events-analytics`, `calculate-metric-trend`, `batch-metric-aggregation`, `evaluate-quality-score` |
| **TRANSFORMER Function** | `render-notification-template` |
| **DETERMINISTIC Functions** | `suggest-knowledge-article` |
| **Function Tests** | Unit + integration tests for all Tier 2 functions; event emission verification tests |

### Definition of Done — Sprint 4

- All 53 functions registered and callable (with `_v2` suffix)
- All WRITER functions emit correct domain events (verified by event test consumer)
- All function unit tests pass (>80% coverage)
- Idempotency store working (replay same input → same output)
- Connector placeholder structure exists (not yet connected to providers)

---

## 4. Sprint 5-6: Core Applications

**Duration:** Weeks 9-12 | **Teams:** FE Alpha (2), FE Beta (2), BE Beta (1) | **Risk:** Medium

### Sprint 5 (Weeks 9-10)

| Area | Deliverables |
|------|-------------|
| **ORCHESTRATOR Functions** | `dispatch-notifications` (with SMTP test connector), `send-report`, `provision-user`, `rotate-credentials`, `recover-workflow-instance` |
| **Connectors** | SMTP connector (config + health check); Twilio SMS connector (config + health check); Connector health check framework |
| **support-center_v2** | Ticket list view; ticket detail view; ticket create form; classification panel (AI integration point); message thread component; SLA timer display |
| **operations-center_v2** | Operations dashboard; task management view; dispatch queue view; technician status overview |
| **App Tests** | Frontend component tests; app integration tests with mock functions |

### Sprint 6 (Weeks 11-12)

| Area | Deliverables |
|------|-------------|
| **Connectors** | Discord Webhook; Slack; Gmail (OAuth); Reddit |
| **appointment-center_v2** | Appointment calendar view; appointment create/confirm; technician assignment panel; reminder schedule view |
| **technician-portal_v2** | Work order list; work order stage progression; appointment check-in; inventory lookup; GPS location capture |
| **Cross-App Infrastructure** | App shell integration (nav, auth, role-based access); real-time event subscriptions (WebSocket); inter-app navigation |
| **App Tests** | E2E integration tests for core apps; real-time subscription tests |

### Definition of Done — Sprint 6

- 4 core apps (support, ops, appointment, technician) render with real data
- All CRUD operations flow through V2 tables via functions
- Dispatching-notifications sends email via SMTP connector (test mode)
- Real-time event subscriptions working (ticket status changes reflected in UI)
- All 6 connectors configured with health checks

---

## 5. Sprint 7-8: Portals & Specialized

**Duration:** Weeks 13-16 | **Teams:** FE Alpha (2), FE Beta (2) | **Risk:** Medium

### Sprint 7 (Weeks 13-14)

| Area | Deliverables |
|------|-------------|
| **customer-portal_v2** | Ticket submission form; ticket status tracker; appointment booking flow; knowledge base search; profile management; feedback/survey forms |
| **resolution-center_v2** | Dispute list view; dispute detail with evidence; AI analysis panel; resolution recommendation; approve/reject workflow |
| **crm-center_v2** | Account health dashboard; account detail with health history; followup management view; retention campaign management |
| **App Tests** | Portal E2E tests (customer journey); specialized app integration tests |

### Sprint 8 (Weeks 15-16)

| Area | Deliverables |
|------|-------------|
| **notification-center_v2** (start) | Notification list view; template management UI; channel configuration UI; delivery analytics dashboard; channel health status |
| **App Polish** | Loading states, error states, empty states for all apps; responsive design pass; accessibility audit |
| **Cross-Cutting** | Shared error handling pattern; consistent empty state components; loading skeleton components |

### Definition of Done — Sprint 8

- Customer portal submits tickets, books appointments, tracks status
- Resolution center completes dispute lifecycle with AI analysis
- CRM center displays account health with working followup management
- Notification center renders (core features functional)
- All apps pass accessibility audit (WCAG 2.1 AA)

---

## 6. Sprint 9-10: Cross-Cutting Apps

**Duration:** Weeks 17-20 | **Teams:** FE Gamma (2), Agent (1) | **Risk:** Low

### Sprint 9 (Weeks 17-18)

| Area | Deliverables |
|------|-------------|
| **analytics-center_v2** | Dashboard views (KPI cards, charts, tables); trend analysis view; anomaly detection view; report schedule management; report catalog |
| **admin-center_v2** | User management (CRUD + roles); system settings editor; feature flag toggles; connector configuration UI; audit log viewer; workflow health dashboard |
| **App Tests** | Analytics data accuracy tests; admin permission boundary tests |

### Sprint 10 (Weeks 19-20)

| Area | Deliverables |
|------|-------------|
| **notification-center_v2** (complete) | Send history view; template rendering preview; delivery failure management; channel fallback testing UI; rate limit monitoring |
| **App Integration** | Cross-app navigation finalized; consistent header/nav across all 10 apps; all apps behind V2 auth gateway |
| **Agent Infrastructure** | Agent registry schema; agent invocation framework (event-driven); agent context builder; agent output parser |

### Definition of Done — Sprint 10

- All 10 V2 applications functional end-to-end
- Analytics center displays real-time metrics from event stream
- Admin center manages users, settings, connectors, feature flags
- Agent infrastructure ready (agent can receive event, read context, produce output)
- All apps behind auth gateway with role-based routing

---

## 7. Sprint 11-12: AI Agents

**Duration:** Weeks 21-24 | **Teams:** Agent (2) | **Risk:** High

### Sprint 11 (Weeks 21-22)

| Area | Deliverables |
|------|-------------|
| **Executive Agents** | `executive-director_v2`, `platform-orchestrator_v2` |
| **Support Agents** | `support-manager_v2`, `support-request-classifier_v2`, `support-reply-drafter_v2`, `support-escalation-manager_v2`, `support-sla-monitor_v2` |
| **Operations Agents** | `operations-manager_v2`, `operations-coordinator_v2`, `operations-work-order-manager_v2` |
| **CRM Agents** | `crm-manager_v2`, `crm-account-health-monitor_v2`, `crm-followup-manager_v2`, `crm-retention-specialist_v2` |
| **Dispatch Agents** | `dispatch-manager_v2`, `dispatch-coordinator_v2`, `dispatch-technician-dispatcher_v2`, `dispatch-emergency-response_v2` |
| **Scheduling Agents** | `scheduling-manager_v2`, `scheduling-appointment-scheduler_v2`, `scheduling-technician-suggester_v2` |
| **Appointment Agents** | `appointment-manager_v2`, `appointment-reminder-coordinator_v2`, `appointment-no-show-handler_v2` |
| **Agent Tests** | Unit tests per agent (prompt + schema validation); mock function integration tests |

### Sprint 12 (Weeks 23-24)

| Area | Deliverables |
|------|-------------|
| **Knowledge Agents** | `knowledge-manager_v2`, `knowledge-curator_v2`, `knowledge-article-suggester_v2` |
| **Analytics Agents** | `analytics-manager_v2`, `analytics-trend-analyzer_v2`, `analytics-predictive-modeler_v2` |
| **Admin Agents** | `admin-manager_v2`, `admin-system-config_v2`, `admin-connector-manager_v2` |
| **QA Agents** | `qa-manager_v2`, `qa-response-quality-monitor_v2`, `qa-compliance-monitor_v2` |
| **Reporting Agents** | `reporting-manager_v2`, `reporting-generator_v2`, `reporting-distributor_v2` |
| **Notification Agents** | `notification-manager_v2`, `notification-channel-optimizer_v2`, `notification-template-manager_v2` |
| **CX Agents** | `cx-manager_v2`, `cx-satisfaction-survey_v2`, `cx-feedback-analyzer_v2`, `cx-winback-specialist_v2` |
| **Automation Agents** | `automation-manager_v2`, `automation-workflow-orchestrator_v2`, `automation-event-router_v2` |
| **Agent Tests** | Cross-agent interaction tests; escalation test scenarios; latency benchmarks |

### Definition of Done — Sprint 12

- All 49 agents deployed with correct instructions, schemas, permissions
- Executive Director + Platform Orchestrator coordinate cross-department flows
- Event Router correctly routes events to subscribed agents
- Agents produce structured output that conforms to output schema
- Agent escalation rules working (low confidence → manager escalation)
- All agent latency within budget (<5s for worker, <3s for manager)

---

## 8. Sprint 13-14: Workflows

**Duration:** Weeks 25-28 | **Teams:** Workflow (2), Agent (1) | **Risk:** Medium

### Sprint 13 (Weeks 25-26)

| Area | Deliverables |
|------|-------------|
| **Tier 0 (Autonomous) — 8 workflows** | `ticket-auto-response_v2`, `sla-enforcement_v2`, `appointment-booking_v2`, `appointment-reminders_v2`, `standard-dispatch_v2`, `notification-delivery_v2`, `knowledge-gap-detection_v2`, `workflow-health-monitor_v2` |
| **Tier 1 (Entry) — 6 workflows** | `ticket-intake_v2`, `appointment-completion_v2`, `urgent-dispatch_v2`, `dispute-resolution_v2`, `account-health-scan_v2`, `followup-slippage-detector_v2` |
| **Workflow Tests** | Event-triggered execution tests; function node execution tests; agent node invocation tests; human approval timeout tests |

### Sprint 14 (Weeks 27-28)

| Area | Deliverables |
|------|-------------|
| **Tier 2-3 (Secondary) — 7 workflows** | `ticket-escalation_v2`, `work-order-fulfillment_v2`, `dispute-escalation_v2`, `followup-management_v2`, `retention-campaign_v2`, `customer-satisfaction-monitor_v2`, `feedback-analysis_v2` |
| **Tier 4-5 (Execution) — 9 workflows** | `work-order-verification_v2`, `knowledge-article-lifecycle_v2`, `daily-standup_v2`, `operations-coordination_v2`, `report-generation_v2`, `report-distribution_v2`, `user-provisioning_v2`, `system-config-management_v2`, `inventory-reorder_v2` |
| **Tier 6-7 (Reporting) — 3 workflows** | `trend-analysis_v2`, `anomaly-detection_v2`, `quality-review_v2` |
| **Workflow Tests** | Full workflow graph execution tests; cross-workflow event trigger tests; parallel workflow execution tests; failure recovery tests |

### Definition of Done — Sprint 14

- All 33 workflows deployed and executing
- Workflow Orchestrator correctly routes through multi-node graphs
- Human approval nodes pause and resume correctly (including timeout → escalation)
- Notification workflows dispatch through correct channels with fallback
- Idempotency prevents duplicate workflow execution from event replay
- Workflow health monitor detects failures and triggers recovery

---

## 9. Sprint 15: Integration & Production

**Duration:** Weeks 29-30 | **Teams:** All (8 engineers) | **Risk:** High

| Area | Deliverables |
|------|-------------|
| **E2E Integration** | Full customer journey test (ticket → dispatch → work order → feedback → CRM); Full dispute lifecycle test; Full account health lifecycle test; Cross-domain event chain verification |
| **Performance Testing** | Load test: 100 concurrent ticket creations; SLA batch scan with 10,000 tickets; Notification throughput at 50/sec; Event bus with 85+ event types at peak load |
| **Security Audit** | Permission boundary verification (no function reads table it shouldn't); Connector credential encryption verification; Auth bypass test; Audit log completeness check |
| **Production Deployment** | Blue/green deployment config; Database migration run (all 6 tiers); V2 DNS switch; V1 read-only mode; Monitoring dashboards (Grafana); Alert rules configured |
| **Documentation** | Operations runbook; On-call playbook; Known issues and workarounds; V1→V2 migration guide for users |
| **Post-Deployment** | 72-hour monitoring window; Rollback readiness; Performance baseline capture; Error budget tracking |

### Definition of Done — Sprint 15

- All 7 quality gates passed
- Full E2E test suite green
- Load test: P95 < 500ms function latency at 100 req/s
- Zero security audit findings (critical/high)
- Production deployment with blue/green strategy
- Monitoring dashboards show all key metrics
- Rollback plan tested and document

---

> **End of SPRINT_PLAN.md**  
> Next document: IMPLEMENTATION_ORDER.md
