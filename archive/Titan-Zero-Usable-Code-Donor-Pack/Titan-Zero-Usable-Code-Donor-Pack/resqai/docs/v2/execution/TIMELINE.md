# RESQAI V2 — Project Timeline

> Phase 3.5 — Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [Timeline Overview](#1-timeline-overview)
2. [Week-by-Week Implementation Plan](#2-week-by-week-implementation-plan)
3. [Dependency Timeline](#3-dependency-timeline)
4. [Resource Loading Timeline](#4-resource-loading-timeline)
5. [Gantt Chart](#5-gantt-chart)

---

## 1. Timeline Overview

```
Project Start:    Week 1 (2026-06-29)
Project End:      Week 30 (2027-01-18)
Total Duration:   30 weeks (7.5 months)
Sprints:          15 x 2-week sprints
Milestones:       7 major milestones
Gates:            7 quality gates
Peak Team:        70+ engineers
```

### Key Dates

| Milestone | Week | Date | Gate | Deliverable |
|-----------|:----:|:----:|:----:|-------------|
| Foundation Complete | 4 | 2026-07-27 | G0 | 41 tables, event bus, auth, CI/CD |
| Functions Complete | 12 | 2026-09-21 | G1 | 53 functions, 6 connectors |
| Apps Complete | 18 | 2026-11-02 | G2 | 10 V2 apps |
| Agents Complete | 24 | 2026-12-14 | G3 | 49 agents |
| Workflows Complete | 28 | 2027-01-11 | G4 | 33 workflows |
| Integration Complete | 30 | 2027-01-25 | G5 | E2E integration |
| Production Go-Live | 32 | 2027-02-08 | G6 | 100% production traffic |
| V1 Decommission | 36 | 2027-03-08 | — | V1 shutdown |

---

## 2. Week-by-Week Implementation Plan

### Phase 0: Foundation (Weeks 1-4)

```
Week 1 (Jun 29 - Jul 3) — Sprint 1 Start
═══════════════════════════════════════════
Platform Team (8 engineers):
  [P1] Initialize monorepo scaffold (TypeScript + Python + Vite + Lemma)
  [P1] Create packages/types_v2 with ALL TypeScript interfaces
  [P1] Create packages/config_v2 with ALL constants, table names, event names
  [P1] Create packages/utils_v2 (date, validation, SLA calc, state machine helpers)
  [P1] Create packages/sdk_v2 (Lemma client wrapper skeleton)
  [P1] Create packages/ui_v2 (Shell, Button, Badge, StatusBadge, Modal, Toast)
  [P1] Set up ESLint, Prettier, TypeScript config
  [P1] Set up GitHub Actions CI/CD (build, lint, test)

QA Team (2 engineers):
  [P1] Set up test framework (vitest, pytest, Playwright)
  [P1] Write initial test templates

Week 2 (Jul 6-10)
═══════════════════
Platform Team (8 engineers):
  [P1] Complete packages/ui_v2 (DataTable, DataCard, SmartForm, KpiCard)
  [P1] Create packages/hooks_v2 (useEvents, useTable, useFunction, useAuth, useSearch)
  [P1] Create packages/forms_v2 (form schemas, validation)
  [P1] Create packages/layouts_v2 (Shell, ListLayout, DetailLayout, DashboardLayout)
  [P1] Migration 0: Foundation tables (reference_data_v2, system_settings_v2, etc.)
  [P1] Migration 1: Identity tables (users_v2, user_sessions_v2)

Week 3 (Jul 13-17)
═══════════════════
Platform Team (8 engineers):
  [P1] Migration 2: Core business tables (customers_v2, technicians_v2, etc.)
  [P1] Migration 3: Operational tables (tickets_v2, appointments_v2, etc.)
  [P1] Migration 4: Detailed operations tables (ticket_messages_v2, work_orders_v2, etc.)
  [P1] Event bus infrastructure (pub/sub channels, schema registry, event envelope)
  [P1] Auth system (RLS policies per table, RBAC matrix, JWT validation)
  [P1] Monitoring pipeline (structured logging, health endpoints, error tracking)
  [P1] Write tests for all migrations (up + down)

Week 4 (Jul 20-24) — Sprint 2 End / Milestone 1 / Gate G0
═══════════════════════════════════════════════════════════
Platform Team (8 engineers):
  [P1] Migration 5-6: Notification + Admin tables
  [P1] Index creation (all query patterns)
  [P1] View creation (SLA status, workload, health, ops summary, delivery stats)
  [P1] Finalize event bus + auth integration tests
  [P1] Write scaffold-v2-app.ts CLI tool
  [P1] Full CI/CD pipeline validation
  [P1] Test coverage reports
  ═══ GATE G0 REVIEW ═══
  [P1] Demonstrate: 41 tables, event bus, auth, CI/CD all operational
```

### Phase 1: Core Functions (Weeks 5-12)

```
Week 5 (Jul 27-31) — Sprint 3 Start
════════════════════════════════════
Platform (6 engineers):
  [P1] Support for platform operations, event bus scaling

BE Alpha (12 engineers):
  [P1] DET functions (7): validate-ticket-input, check-ticket-urgency, 
       classify-ticket-sla-tier, check-reminder-window, calculate-dispatch-priority,
       validate-config-change, validate-permissions
  [P1] Unit tests for all DET functions
  [P1] Integration tests for DET functions

BE Beta (12 engineers):
  [P1] Begin REA function planning and design

Week 6 (Aug 3-7)
═══════════════════
BE Alpha (12 engineers):
  [P1] Core WRI functions (8): update-ticket-record, assign-appointment-technician,
       schedule-appointment-reminders, finalize-dispatch, create-work-order,
       update-work-order-stage, complete-work-order, resolve-dispute
  [P1] Unit + integration tests for core WRI functions

BE Beta (12 engineers):
  [P1] REA functions (8): check-inventory-level, check-sla-deadline,
       collect-resolved-tickets, fetch-upcoming-appointments, 
       search-knowledge-articles, flag-slipping-followups,
       extract-knowledge-gap, verify-workflow-health
  [P1] Unit + integration tests for REA functions

Week 7 (Aug 10-14)
═══════════════════
BE Alpha (12 engineers):
  [P1] Extended WRI functions (14): process-feedback-survey, create-followup-tasks,
       update-account-health-status, finalize-slippage-review,
       process-notification-delivery, create-operations-tasks, deactivate-user,
       apply-config-change, log-audit-event, reorder-inventory,
       record-inventory-transaction, generate-api-token, reset-circuit-breaker,
       flag-quality-violation
  [P1] Event emission verification for WRI functions

BE Beta (12 engineers):
  [P1] AGG functions (10): batch-sla-check, account-health-scan, 
       generate-account-score, analyze-feedback-sentiment, generate-standup-report,
       generate-report-data, sync-events-analytics, calculate-metric-trend,
       batch-metric-aggregation, evaluate-quality-score
  [P1] Unit + integration tests for AGG functions

Week 8 (Aug 17-21)
═══════════════════
BE Alpha (12 engineers):
  [P1] Complete extended WRI function tests
  [P1] WRI verification tests (insert → verify by DET readback)

BE Beta (12 engineers):
  [P1] Complete AGG function tests
  [P1] Performance benchmarks for AGG functions
  [P1] OpenAPI specs for all functions

Week 9 (Aug 24-28) — Sprint 4 Start
═════════════════════════════════════
BE Beta (12 engineers) + BE Connectors (6 engineers):
  [P1] TRA function: render-notification-template
  [P1] ORC functions (5): dispatch-notifications, send-report,
       provision-user, rotate-credentials, recover-workflow-instance
  [P1] Connectors: SMTP, Twilio SMS (setup + health check + circuit breaker)
  [P1] Connector health framework

Week 10 (Aug 31 - Sep 4)
══════════════════════════
BE Connectors (6 engineers):
  [P1] Connectors: Discord Webhook, Slack, Gmail, Reddit
  [P1] Rate limiting + credential rotation for all connectors

BE Beta (12 engineers):
  [P1] Complete ORC function tests
  [P1] Event emission verification for ORC functions

QA Team (4 engineers):
  [P1] Integrate function test results
  [P1] Begin function performance baselining

Week 11 (Sep 7-11)
═══════════════════
BE Beta (12 engineers) + BE Connectors (6 engineers):
  [P1] Connector fallback chain testing
  [P1] Circuit breaker + rate limit behavior verification (chaos tests)
  [P1] All 53 functions: final coverage audit
  [P1] V1 ↔ V2 function gap analysis

Week 12 (Sep 14-18) — Sprint 6 End / Milestone 2 / Gate G1
═════════════════════════════════════════════════════════════
ALL BE Teams:
  [P1] Finalize function tests (159 total integration tests)
  [P1] Finalize connector smoke tests (6/6)
  [P1] Coverage reports: 90%+ on all functions
  [P1] V1/V2 gap comparison matrix
  ═══ GATE G1 REVIEW ═══
  [P1] Demonstrate: all 53 functions + 6 connectors operational
```

### Phase 2 + 3: Core + Specialized Apps (Weeks 9-16)

```
Week 9 (Aug 24-28) — Sprint 5 Start
═════════════════════════════════════
FE Alpha (12 engineers):
  [P1] support-center_v2 scaffold (Vite + routing + navigation)
  [P1] Ticket Queue page (list view, filters, search)
  [P1] Ticket Detail page (shell with panels)
  [P1] TicketList, TicketDetailPanel, MessageThread, ReplyEditor components

FE Beta (12 engineers):
  [P1] operations-center_v2 scaffold
  [P1] Operations Dashboard page (KPI grid, dispatch panel)
  [P1] Task Board page (kanban)
  [P1] appointment-center_v2 scaffold
  [P1] Schedule Board page (calendar view)

Week 10 (Aug 31 - Sep 4)
══════════════════════════
FE Alpha (12 engineers):
  [P1] Manual Ticket form, Reply Draft form
  [P1] ClassificationBadges, UrgencyIndicator, SLAStopwatch
  [P1] Connect tickets table (read/write)

FE Beta (12 engineers):
  [P1] KpiCardRow, UrgentDispatchPanel, TaskKanban, TaskCard
  [P1] ScheduleCalendar, AppointmentCard, TechnicianPicker
  [P1] Connect tasks table, appointments table

Week 11 (Sep 7-11)
═══════════════════
FE Alpha (12 engineers):
  [P1] Approve Reply form, Ticket Transfer form, Escalation form
  [P1] Connect customers, technicians, appointments tables (read)
  [P1] Emit ticket.created, ticket.classified, ticket.status.changed events

FE Beta (12 engineers):
  [P1] New Task form, Edit Task form, Dispatch Coordination form
  [P1] New Appointment form, Assign Technician form
  [P1] Connect technicians, customers tables (read)
  [P1] Emit task.created, appointment.created events

Week 12 (Sep 14-18)
═══════════════════
FE Alpha (12 engineers):
  [P1] SLA Dashboard page, Agent Performance metrics
  [P1] Consume ticket.intake.completed event
  [P1] Real-time subscription for queue updates

FE Beta (12 engineers):
  [P1] Daily Standup page, Incident Report form
  [P1] Emit dispatch.initiated, daily.standup.generated events
  [P1] Consume ticket.escalated, appointment.status.changed events

FE Delta (8 engineers):
  [P1] technician-portal_v2 scaffold
  [P1] My Day page, Appointment List page

Week 13 (Sep 21-25) — Sprint 7 Start
═════════════════════════════════════
FE Alpha (12 engineers):
  [P1] resolution-center_v2 scaffold
  [P1] Dispute Queue page, Dispute Detail page
  [P1] crm-center_v2 scaffold
  [P1] Account Dashboard page, Account List page

FE Beta (12 engineers):
  [P1] customer-portal_v2 scaffold (mobile-responsive)
  [P1] Home Dashboard page, My Tickets page, Ticket Detail page

FE Delta (8 engineers):
  [P1] technician-portal_v2: Appointment Detail, Task List
  [P1] DaySchedule, JobCard, JobStatusStepper components

Week 14 (Sep 28 - Oct 2)
══════════════════════════
FE Alpha (12 engineers):
  [P1] AIAnalysisCard, RecommendationCard for resolution-center
  [P1] HealthGauge, AccountHealthCard for crm-center
  [P1] Connect disputes table, accounts table

FE Beta (12 engineers):
  [P1] SelfServiceBooking wizard, QuickTicketForm for customer portal
  [P1] AccountSummaryCard, TicketStatusTimeline components
  [P1] Connect customers table (own records only)

FE Delta (8 engineers):
  [P1] CustomerInfoPanel, PhotoUploader, JobNotesEditor
  [P1] MapView (Leaflet) for technician locations

Week 15 (Oct 5-9)
═══════════════════
FE Alpha (12 engineers):
  [P1] Followup Center page, Health Scans page (crm)
  [P1] Resolution Approval page, Trend Analysis page (resolution)
  [P1] Emit account.health.changed, dispute.resolved events

FE Beta (12 engineers):
  [P1] Appointment pages, Dispute pages (customer portal)
  [P1] Consume ticket.status.changed, appointment.status.changed events
  [P1] Notification bell integration

FE Delta (8 engineers):
  [P1] Emit technician.status.changed, appointment.status.changed (tech)
  [P1] PWA manifest + service worker
  [P1] Offline capability

Week 16 (Oct 12-16) — Sprint 8 End
═══════════════════════════════════
FE Alpha + FE Beta + FE Delta:
  [P1] Cross-app polish (loading, error, empty states)
  [P1] Responsive testing (desktop + tablet + mobile)
  [P1] Cross-app navigation verification
  [P1] Unit + integration test finalization
```

### Phase 4: Cross-Cutting Apps (Weeks 15-18)

```
Week 15 (Oct 5-9) — Sprint 8 Start
═══════════════════════════════════
FE Gamma (10 engineers):
  [P1] notification-center_v2 scaffold
  [P1] Notification Dashboard page, Notification Log page
  [P1] Email provider integration (SMTP)
  [P1] SMS provider integration (Twilio)

Week 16 (Oct 12-16)
═════════════════════
FE Gamma (10 engineers):
  [P1] Template Manager page, Channel Settings page
  [P1] Discord + Slack webhook integration
  [P1] Subscribe to notification.send events
  [P1] Template rendering with variable substitution

FE Delta (8 engineers):
  [P1] admin-center_v2 scaffold
  [P1] User Management page, Role Manager page

Week 17 (Oct 19-23) — Sprint 9 Start
═════════════════════════════════════
FE Gamma (10 engineers):
  [P1] Delivery tracking: sent → delivered → failed → opened
  [P1] Retry logic + rate limiting
  [P1] analytics-center_v2 scaffold
  [P1] Executive Dashboard page (KPI grid, charts)

FE Delta (8 engineers):
  [P1] System Settings page, Feature Flags page
  [P1] Audit Log page, Connector Config page

Week 18 (Oct 26-30) — Sprint 9 End / Milestone 3 / Gate G2
═════════════════════════════════════════════════════════════
FE Gamma (10 engineers):
  [P1] Report Builder page, Scheduled Reports page (analytics)
  [P1] Subscribe to ALL events for live metric refresh
  [P1] KPI threshold alerting

FE Delta (8 engineers):
  [P1] Workflow Health page, Event Bus Monitor page
  [P1] Emit user.created, system.config.changed events
  ═══ GATE G2 REVIEW ═══
  [P1] Demonstrate: all 10 V2 apps deployed and operational
```

### Phase 5: AI Agents (Weeks 18-24)

```
Week 18 (Oct 26-30) — Sprint 10 Start
═══════════════════════════════════════
Agent Core (8 engineers):
  [P1] Agent registry framework
  [P1] Invocation framework (context builder, output parser)
  [P1] Memory manager (tiered: short/medium/long-term)
  [P1] LLM gateway (caching, rate limiting, fallback to rule-based)

Week 19 (Nov 2-6)
══════════════════
Agent Core (8 engineers):
  [P1] Permission enforcement (RLS integration for agents)
  [P1] Event subscription framework for agents
  [P1] Agent scaffolding templates

Week 20 (Nov 9-13) — Sprint 11 Start
═══════════════════════════════════════
Agent Core (8 engineers):
  [P1] Executive agents (2): executive-director, platform-orchestrator
  [P1] Support agents (5): manager, classifier, drafter, escalation-manager, sla-monitor
  [P1] Operations agents (3): manager, coordinator, work-order-manager

Agent Extended (8 engineers):
  [P1] Dispatch agents (4): manager, coordinator, technician-dispatcher, emergency-response
  [P1] Scheduling agents (3): manager, appointment-scheduler, technician-suggester

Week 21 (Nov 16-20)
════════════════════
Agent Core (8 engineers):
  [P1] Appointment agents (3): manager, reminder-coordinator, no-show-handler
  [P1] CRM agents (4): manager, account-health-monitor, followup-manager, retention-specialist

Agent Extended (8 engineers):
  [P1] Automation agents (2): manager, event-router
  [P1] Agent cascade testing: executive → manager → worker

Week 22 (Nov 23-27) — Sprint 11 End / Milestone 4a / Gate G3
═════════════════════════════════════════════════════════════════
ALL Agent Teams:
  [P1] 26 core agents: Q/A testing (10 test cases each)
  [P1] Core agent cascade E2E tests
  [P1] Hallucination rate baseline audit
  ═══ GATE G3 REVIEW (Core Agents) ═══
  [P1] Demonstrate: 26 core agents deployed and operational

Week 23 (Nov 30 - Dec 4) — Sprint 12 Start
═══════════════════════════════════════════════
Agent Extended (8 engineers):
  [P1] Knowledge agents (3): manager, curator, article-suggester
  [P1] Analytics agents (3): manager, trend-analyzer, predictive-modeler
  [P1] Admin agents (3): manager, system-config, connector-manager

Week 24 (Dec 7-11) — Sprint 12 End / Milestone 4b
═══════════════════════════════════════════════════
Agent Extended (8 engineers):
  [P1] QA agents (3): manager, response-quality-monitor, compliance-monitor
  [P1] Reporting agents (3): manager, generator, distributor
  [P1] Notification agents (3): manager, channel-optimizer, template-manager
  [P1] CX agents (4): manager, satisfaction-survey, feedback-analyzer, winback-specialist
  [P1] Automation agent (1): workflow-orchestrator
  [P1] ALL 49 agents: final Q/A testing + hallucination audit
  [P1] Escalation chain tests across departments
  [P1] Performance benchmark (P50, P95, P99)
```

### Phase 6: Workflows (Weeks 24-28)

```
Week 24 (Dec 7-11) — Sprint 13 Start
═══════════════════════════════════════
Workflow Team (10 engineers):
  [P1] Tier 0 autonomous workflows (8):
       notification-delivery_v2, ticket-auto-response_v2, sla-enforcement_v2,
       appointment-booking_v2, appointment-reminders_v2, standard-dispatch_v2,
       knowledge-gap-detection_v2, workflow-health-monitor_v2
  [P1] Smoke tests (5 scenarios each = 40 tests)

Week 25 (Dec 14-18)
════════════════════
Workflow Team (10 engineers):
  [P1] Tier 1 entry workflows (6):
       ticket-intake_v2, appointment-completion_v2, urgent-dispatch_v2,
       dispute-resolution_v2, account-health-scan_v2, followup-slippage-detector_v2
  [P1] Smoke tests (5 scenarios each = 30 tests)
  [P1] Human approval node testing

Week 26 (Dec 21-25) — Sprint 14 Start
═══════════════════════════════════════
Workflow Team (10 engineers):
  [P1] Tier 2-3 secondary workflows (7):
       ticket-escalation_v2, work-order-fulfillment_v2, dispute-escalation_v2,
       followup-management_v2, retention-campaign_v2, 
       customer-satisfaction-monitor_v2, feedback-analysis_v2
  [P1] Cross-workflow trigger verification

Week 27 (Dec 28 - Jan 1)
═════════════════════════
Workflow Team (10 engineers):
  [P1] Tier 4-5 execution workflows (9):
       work-order-verification_v2, knowledge-article-lifecycle_v2,
       daily-standup_v2, operations-coordination_v2, report-generation_v2,
       report-distribution_v2, user-provisioning_v2, system-config-management_v2,
       inventory-reorder_v2
  [P1] Tier 6-7 reporting workflows (3):
       trend-analysis_v2, anomaly-detection_v2, quality-review_v2
  [P1] Smoke tests (5 scenarios each = 60 tests)

Week 28 (Jan 4-8) — Sprint 14 End / Milestone 5 / Gate G4
════════════════════════════════════════════════════════════
Workflow Team (10 engineers):
  [P1] ALL 33 workflows: final smoke tests (165 total)
  [P1] Full journey E2E tests (3 journeys)
  [P1] Rollback procedure tests (33/33)
  [P1] Idempotency tests
  ═══ GATE G4 REVIEW ═══
  [P1] Demonstrate: all 33 workflows operational, full journeys pass
```

### Phase 7: Integration + Production (Weeks 28-32)

```
Week 28 (Jan 4-8) — Sprint 15 Start / Milestone 5
═══════════════════════════════════════════════════
ALL TEAMS:
  [P1] B14: E2E Integration — Full business journey testing
  [P1] 3 full journeys: Customer Support, Appointment + WO, Account Health
  [P1] V1/V2 data consistency verification (if dual-write)
  [P1] Notification pipeline validation (all channels)
  [P1] Event flow integrity audit

QA Team (6 engineers):
  [P1] Full regression suite execution
  [P1] Performance baseline measurement

Security Team (4 engineers):
  [P1] Penetration test (all 10 apps, all 53 functions)
  [P1] DAST + SAST + dependency scan

Week 29 (Jan 11-15)
════════════════════
ALL TEAMS:
  [P1] B15: System Testing — Complete regression suite
  [P1] Load test: 200 concurrent users, 30 min
  [P1] DR drill: full failure simulation, measure recovery time
  [P1] B16: Performance Optimization
  [P1] Profile + optimize slow endpoints
  [P1] Bundle size reduction
  [P1] CDN caching configuration

QA Team (6 engineers):
  [P1] Accessibility audit (WCAG 2.1 AA)
  [P1] Cross-browser testing (Chrome, Firefox, Safari, Edge)
  [P1] Flaky test remediation

Security Team (4 engineers):
  [P1] B17: Security Hardening
  [P1] Resolve all security findings
  [P1] RLS policy re-validation
  [P1] Secret scan (trufflehog)

Week 30 (Jan 18-22) — Sprint 15 End / Milestone 6 / Gate G5
═════════════════════════════════════════════════════════════
ALL TEAMS:
  [P1] Finalize all integration + performance + security work
  [P1] Production deployment runbook finalization
  [P1] Monitoring dashboard configuration
  [P1] On-call rotation schedule
  [P1] Rollback procedures final test in staging
  ═══ GATE G5 REVIEW ═══
  [P1] Demonstrate: all 150+ components integrated and passing

Week 31-32 (Jan 25 - Feb 8) — Post S15
═════════════════════════════════════════
Platform (8 engineers) + All leads:
  [P1] B18: Production Release Stage 1 — Canary (10%, 72h)
  [P1] B18: Stage 2 — Ramp (50%, 1 week)
  [P1] B18: Stage 3 — Full production (100%)
  [P1] V1 set to read-only fallback
  ═══ GATE G6 REVIEW (after Stage 1 passes) ═══

Week 33-36 (Feb 9 - Mar 8) — Post Production
═══════════════════════════════════════════════
Platform + BE (8 engineers):
  [P1] Production monitoring (30-day window)
  [P1] V1 decommission planning
  [P1] V2.1 roadmap planning
  [P1] V1 data archival (Week 36)
  [P1] V1 shutdown (Week 36)
```

---

## 3. Dependency Timeline

### 3.1 Earliest Start Times

| Component | Earliest Start | Depends On |
|-----------|:--------------:|------------|
| Shared packages | Week 1 | Nothing |
| Migration 0-1 | Week 1 | Nothing |
| Migration 2-6 | Week 3 | Migration 0-1 |
| Event bus | Week 3 | Migration 0-1 |
| Auth system | Week 3 | Migration 0-1 |
| DET functions | Week 4 | Migration 0-1 |
| REA functions | Week 5 | Migration 2-4 |
| WRI functions | Week 5 | Migration 2-4, DET functions |
| AGG functions | Week 7 | WRI functions |
| TRA function | Week 9 | Nothing (pure) |
| ORC functions | Week 9 | AGG functions |
| Connectors | Week 10 | ORC functions |
| support-center_v2 | Week 9 | Shared packages + WRI functions |
| operations-center_v2 | Week 9 | Shared packages + WRI functions |
| appointment-center_v2 | Week 9 | Shared packages + WRI functions |
| technician-portal_v2 | Week 12 | Ops + Appointment apps |
| customer-portal_v2 | Week 13 | Shared packages + events |
| resolution-center_v2 | Week 13 | Shared packages + WRI (dispute) |
| crm-center_v2 | Week 13 | Shared packages + AGG (health) |
| notification-center_v2 | Week 15 | ORC functions (dispatch-notifications) |
| analytics-center_v2 | Week 17 | Events from all apps |
| admin-center_v2 | Week 16 | Events from all apps |
| Agent infrastructure | Week 18 | ORC functions |
| Core agents | Week 20 | Agent infrastructure |
| Extended agents | Week 22 | Core agents |
| Tier 0-1 workflows | Week 24 | All agents + all functions |
| Tier 2-7 workflows | Week 26 | Tier 0-1 workflows |
| E2E Integration | Week 28 | All components |
| Production deploy | Week 30 | E2E Integration |

---

## 4. Resource Loading Timeline

```
Team:            W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12 W13 W14 W15 W16 W17 W18 W19 W20 W21 W22 W23 W24 W25 W26 W27 W28 W29 W30
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Platform         8   8   8   8   6   6   6   6   4   4   4   4   4   4   4   4   4   4   6   6   6   6   6   6   6   6   6   8   8   8
BE Alpha         0   0   0   0  12  12  12  12  12  12   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   4   4
BE Beta          0   0   0   0   0  12  12  12  12  12  12  12   4   4   4   4   4   4   4   4   0   0   0   0   0   0   0   0   4   4
BE Connector     0   0   0   0   0   0   0   0   6   6   6   6   6   6   0   0   0   0   0   0   0   0   0   0   0   0   0   0   2   2
FE Alpha         0   0   0   0   0   0   0   0  12  12  12  12  12  12  12  12   0   0   0   0   0   0   0   0   0   0   0   0   4   4
FE Beta          0   0   0   0   0   0   0   0  12  12  12  12  12  12  12  12   0   0   0   0   0   0   0   0   0   0   0   0   4   4
FE Gamma         0   0   0   0   0   0   0   0   0   0   0   0   0   0  10  10  10  10   0   0   0   0   0   0   0   0   0   0   4   4
FE Delta         0   0   0   0   0   0   0   0   0   0   0   8   8   8   8   8   8   8   0   0   0   0   0   0   0   0   0   0   4   4
Agent Core       0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   8   8   8   8   8   8   0   0   0   0   4   4
Agent Extended   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   8   8   8   8   0   0   0   0   4   4
Workflow         0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0   0  10  10  10  10  10  10  10
QA               2   2   2   2   2   2   2   2   2   2   4   4   4   4   4   4   4   4   4   4   4   4   4   4   4   4   4   6   6   6
Security         0   0   0   0   0   0   0   0   0   0   0   0   0   0   4   4   4   4   4   4   4   4   4   4   4   4   4   4   4   4
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
TOTAL:          10  10  10  10  22  34  34  34  48  48  42  50  46  46  62  66  38  38  34  34  34  34  34  40  34  34  34  56  62  62
```

---

## 5. Gantt Chart

```
Legend:
  ████ = Active development
  ░░░░ = Buffer / Idle
  [G#] = Quality Gate
  [M#] = Milestone

Phase 0: Foundation (W1-W4)
  Shared Packages     ████████████████████
  Migration 0-6       ████████████████████████████████████
  Event Bus + Auth    ████████████████████
  CI/CD Setup         ████████
                      [M1 G0]
                       W4

Phase 1: Functions (W4-W12)
  DET Functions       ██████████████████
  REA Functions       ██████████████████████████
  WRI Core            ████████████████████████████████████
  WRI Extended        ████████████████████████████████████████████████
  AGG Functions       ████████████████████████████████████████████████
  TRA Function                              ████
  ORC Functions                             ████████████████
  Connectors                                        ████████████████
                                                    [M2 G1]
                                                     W12

Phase 2: Core Apps (W9-W14)
  support-center      ████████████████████████████████████
  operations-center   ████████████████████████████████████
  appointment-center  ████████████████████████████████████
  technician-portal                ██████████████████████████

Phase 3: Specialized Apps (W13-W16)
  customer-portal                   ████████████████████████████████████
  resolution-center                 ████████████████████████████████████
  crm-center                        ████████████████████████████████████

Phase 4: Cross-Cutting (W15-W18)
  notification-center                ████████████████████████████████████
  analytics-center                                    ████████████████████
  admin-center                                        ████████████████████
                                                      [M3 G2]
                                                       W18

Phase 5: Agents (W18-W24)
  Agent Infrastructure                ████████████████████
  Core Agents                                       ████████████████████
  Extended Agents                                      ████████████████████
                                                         [M4a G3]
                                                          W22
                                                           [M4b]
                                                            W24

Phase 6: Workflows (W24-W28)
  Auto Workflows                                                ████████████████████████████████
  Entry + Secondary                                                             ████████████████████
  Execution + Reporting                                                                 ████████████████████
                                                                                        [M5 G4]
                                                                                         W28

Phase 7: Integration + Production (W28-W36)
  E2E Integration                                   ████████████████████
  System Testing                                    ████████████████████
  Performance Opt                                    ████████████████████
  Security                                           ████████████████████
                                                    [M6 G5]   [G6]
                                                     W30       W32
  Production Canary                                        ████████████████████
  V1 Decommission                                                              ████████████████████
```

---

> **End of TIMELINE.md**
