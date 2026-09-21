# RESQAI V2 — Application Build Order

> Phase 1.1 — Design Only  
> Lead: Software Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Build Strategy](#1-build-strategy)
2. [Development Phases Overview](#2-development-phases-overview)
3. [Phase Details](#3-phase-details)
4. [Application Build Cards](#4-application-build-cards)
5. [Parallelization Opportunities](#5-parallelization-opportunities)
6. [Milestone Definitions](#6-milestone-definitions)
7. [Risk Assessment](#7-risk-assessment)
8. [Resource Allocation](#8-resource-allocation)

---

## 1. Build Strategy

### Guiding Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Foundation first** | Build shared packages, infrastructure, and data layer before any application |
| 2 | **Core operations before portals** | Internal tools (support, ops, appointment) before external-facing portals |
| 3 | **Infrastructure before features** | Notification center before apps that depend on it for outbound comms |
| 4 | **Consumer after producers** | Analytics and admin are last — they depend on data/events from all other apps |
| 5 | **Parallel farming** | Independent apps built concurrently by separate teams |
| 6 | **Incremental validation** | Each phase produces a deployable increment that can be tested independently |

### Build Sequence Summary

```
PHASE 0: Foundation & Shared Infrastructure
  │
PHASE 1: Core Operational Apps (Support + Ops + Appointment)
  │
PHASE 2: External Portals (Customer + Technician)
  │
PHASE 3: Specialized Apps (CRM + Resolution)
  │
PHASE 4: Cross-Cutting Infrastructure (Notification + Analytics)
  │
PHASE 5: System Administration (Admin)
  │
PHASE 6: Integration & Polish (Events, Workflows, Agents, E2E)
```

---

## 2. Development Phases Overview

| Phase | Name | Duration | Apps | Teams | Parallel |
|-------|------|----------|------|-------|----------|
| 0 | Foundation | 3 weeks | (Shared) | 1 platform team | No |
| 1 | Core Operations | 6 weeks | support-center_v2, operations-center_v2, appointment-center_v2 | 3 teams | Yes (3 apps) |
| 2 | External Portals | 4 weeks | customer-portal_v2, technician-portal_v2 | 2 teams | Yes (2 apps) |
| 3 | Specialized Apps | 4 weeks | crm-center_v2, resolution-center_v2 | 2 teams | Yes (2 apps) |
| 4 | Cross-Cutting Infrastructure | 4 weeks | notification-center_v2, analytics-center_v2 | 2 teams | Yes (2 apps) |
| 5 | System Administration | 3 weeks | admin-center_v2 | 1 team | No |
| 6 | Integration & Polish | 4 weeks | All (workflows, agents, functions, E2E) | All teams | Yes |

**Total estimated duration: 28 weeks (~7 months)**

---

## 3. Phase Details

### PHASE 0: Foundation & Shared Infrastructure

**Duration: 3 weeks** | **Team: 1 Platform Team (2-3 engineers)**

#### Deliverables

| Deliverable | Description | Files/Dirs |
|------------|-------------|------------|
| V2 Shared Packages | New package directories for V2 | `packages/ui_v2/`, `packages/types_v2/`, `packages/config_v2/`, `packages/sdk_v2/`, `packages/utils_v2/`, `packages/hooks_v2/`, `packages/widgets_v2/`, `packages/forms_v2/`, `packages/layouts_v2/` |
| V2 Data Model | V2-specific tables and schemas | `database/migrations/v2/` |
| Event Bus Setup | Event emission and subscription patterns | `packages/sdk_v2/events.ts` |
| Design System | Shared UI components and theme | `packages/ui_v2/` |
| App Shell | Common layout with navigation | `packages/layouts_v2/Shell.tsx` |
| Vite/V2 scaffold | App template for creating _v2 apps | `scripts/scaffold-v2-app.ts` |
| Authentication | V2 auth integration | `packages/sdk_v2/auth.ts` |
| Real-Time Subscriptions | WebSocket/subscription setup | `packages/sdk_v2/realtime.ts` |

#### Key Tasks

```
Week 1-2:
  ├── Create packages/*_v2 directory structure
  ├── Port and extend types_v2 from existing V1 types
  ├── Build sdk_v2 with event system (emitEvent, subscribeToEvent)
  ├── Build config_v2 with all V2 constants, table names, event names
  ├── Build utils_v2 with V2-specific utilities
  ├── Create base UI components in ui_v2 (Shell, DataTable, DataCard, SmartForm, StatusBadge, etc.)
  └── Create layouts_v2 (Shell, ListLayout, DetailLayout, DashboardLayout, FormLayout)

Week 2-3:
  ├── Build hooks_v2 (useNotifications, useActivityFeed, useSearch, useFilters, usePagination, useRealTime, usePermissions)
  ├── Build widgets_v2 composable widgets
  ├── Build forms_v2 shared form schemas
  ├── Create V2 database migrations for new tables (notifications_v2, etc.)
  ├── Scaffold app template for v2 apps
  ├── Set up CI/CD for V2 apps
  └── Write integration tests for shared packages
```

#### Dependencies

- V1 packages exist as reference (DO NOT modify them)
- Lemma platform (existing)
- Node.js 22, TypeScript, React 18, Vite 8

---

### PHASE 1: Core Operational Apps

**Duration: 6 weeks** | **Team: 3 Parallel Teams (2-3 engineers each)**

### Phase 1 — App A: support-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Alpha (2-3 engineers) |
| **Duration** | 6 weeks |
| **Parallel with** | operations-center_v2, appointment-center_v2 |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold (vite + routing + navigation)
  ├── Ticket Queue page (list view, filters, search)
  ├── Ticket Detail page (shell with panels)
  └── App shell integration with shared layout

Week 2: Components
  ├── TicketList (DataTable variant)
  ├── TicketDetailPanel
  ├── MessageThread
  ├── ReplyEditor
  ├── ClassificationBadges
  ├── UrgencyIndicator
  └── SLAStopwatch

Week 3: Forms & Actions
  ├── Manual Ticket form
  ├── Reply Draft form
  ├── Approve Reply form
  ├── Ticket Transfer form
  ├── Escalation form
  └── Slack/Template management

Week 4: Data Integration
  ├── Connect tickets table (read/write)
  ├── Connect customers table (read)
  ├── Connect technicians table (read)
  ├── Connect appointments table (read)
  └── Connect operations_log (write for audit)

Week 5: Event Integration
  ├── Emit ticket.created, ticket.classified, ticket.reply.drafted
  ├── Emit ticket.reply.approved, ticket.status.changed, ticket.escalated
  ├── Consume ticket.intake.completed
  └── Real-time subscription for queue updates

Week 6: Polish & Testing
  ├── SLA Dashboard page
  ├── Agent Performance metrics
  ├── Bulk actions (assign, close, tag)
  ├── Error handling and loading states
  ├── Responsive design adjustments
  └── Unit + integration tests
```

### Phase 1 — App B: operations-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Bravo (2-3 engineers) |
| **Duration** | 6 weeks |
| **Parallel with** | support-center_v2, appointment-center_v2 |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold
  ├── Operations Dashboard page (KPI grid, dispatch panel)
  ├── Task Board page (kanban)
  └── Daily Standup page

Week 2: Components
  ├── KpiCardRow
  ├── UrgentDispatchPanel
  ├── TaskKanban (drag-and-drop)
  ├── TaskCard
  ├── DispatchTimeline
  ├── StandupReportCard
  ├── TechnicianLoadBar
  └── OperationalBlockerBanner

Week 3: Forms & Actions
  ├── New Task form
  ├── Edit Task form
  ├── Dispatch Coordination form
  ├── Daily Standup Notes form
  └── Incident Report form

Week 4: Data Integration
  ├── Connect tasks table (CRUD)
  ├── Connect tickets table (read urgent/escalated)
  ├── Connect appointments table (read today)
  ├── Connect technicians table (read availability)
  ├── Connect operations_log (write)
  └── Connect customers table (read context)

Week 5: Event Integration
  ├── Emit task.created, task.status.changed
  ├── Emit dispatch.initiated, dispatch.completed
  ├── Emit daily.standup.generated
  ├── Consume ticket.escalated, ticket.classified
  ├── Consume appointment.status.changed
  ├── Consume followup.slippage.detected
  └── Real-time dispatch panel updates

Week 6: Polish & Testing
  ├── Technician Workload page
  ├── Cross-app summary widgets
  ├── Export standup report
  ├── Error handling
  └── Unit + integration tests
```

### Phase 1 — App C: appointment-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Charlie (2-3 engineers) |
| **Duration** | 6 weeks |
| **Parallel with** | support-center_v2, operations-center_v2 |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold
  ├── Schedule Board page (calendar view)
  ├── Appointment Detail page
  └── New Appointment page

Week 2: Components
  ├── ScheduleCalendar (monthly/weekly/daily)
  ├── AppointmentCard
  ├── TechnicianPicker (with AI suggestion)
  ├── TechSuggestionCard
  ├── ConflictWarning
  ├── BookingWizard
  ├── TimeSlotPicker
  └── ServiceTypeSelector

Week 3: Forms & Actions
  ├── New Appointment form
  ├── Reschedule form
  ├── Assign Technician form
  ├── Service Type Config form
  └── Time Off Block form

Week 4: Data Integration
  ├── Connect appointments table (CRUD)
  ├── Connect technicians table (read)
  ├── Connect customers table (read)
  ├── Connect tickets table (read context)
  └── Connect operations_log (write)

Week 5: Event Integration
  ├── Emit appointment.created, appointment.assigned
  ├── Emit appointment.status.changed, appointment.cancelled
  ├── Emit appointment.completed
  ├── Consume ticket.classified (auto-schedule trigger)
  ├── Consume technician.status.changed
  └── Real-time calendar updates

Week 6: Polish & Testing
  ├── Technician Schedule page
  ├── Schedule Settings page
  ├── Conflict detection algorithm
  ├── Error handling
  └── Unit + integration tests
```

---

### PHASE 2: External Portals

**Duration: 4 weeks** | **Team: 2 Parallel Teams (2 engineers each)**

### Phase 2 — App A: customer-portal_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Delta (2 engineers) |
| **Duration** | 4 weeks |
| **Parallel with** | technician-portal_v2 |
| **Depends on** | Phase 1 apps (events + data) |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold (mobile-responsive first)
  ├── Home Dashboard page
  ├── My Tickets page
  ├── Ticket Detail page
  └── Navigation structure

Week 2: Core Pages
  ├── Appointment pages (list, detail, book)
  ├── Dispute pages (list, detail)
  ├── Account page (profile, preferences)
  └── Account Health page

Week 3: Components & Forms
  ├── AccountSummaryCard, TicketStatusTimeline
  ├── AppointmentCalendar, AppointmentCard
  ├── SelfServiceBooking (multi-step wizard)
  ├── DisputeStatusCard, QuickTicketForm
  ├── NotificationPreferences, ProfileEditor
  └── Data integration (own records only)

Week 4: Event Integration & Polish
  ├── Consume ticket.status.changed (real-time)
  ├── Consume appointment.status.changed (real-time)
  ├── Consume dispute.status.changed (real-time)
  ├── Consume account.health.changed (real-time)
  ├── Emit ticket.created.customer, appointment.requested
  ├── Notification bell integration
  └── Responsive + mobile testing
```

### Phase 2 — App B: technician-portal_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Echo (2 engineers) |
| **Duration** | 4 weeks |
| **Parallel with** | customer-portal_v2 |
| **Depends on** | Phase 1 apps (events + data) |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold (mobile-first, PWA-enabled)
  ├── My Day page (dashboard)
  ├── Appointment List page
  └── Bottom navigation structure

Week 2: Core Pages
  ├── Appointment Detail page
  ├── Task List page
  ├── Task Detail page
  ├── Notifications page
  └── Profile page

Week 3: Components & Forms
  ├── DaySchedule, JobCard, JobStatusStepper
  ├── CustomerInfoPanel, PhotoUploader
  ├── JobNotesEditor, TaskChecklist
  ├── NotificationFeed, AvailabilityToggle
  ├── MapView (Leaflet for job locations)
  └── Data integration (own records)

Week 4: Event Integration & Polish
  ├── Consume appointment.assigned (real-time)
  ├── Consume appointment.rescheduled
  ├── Consume dispatch.initiated
  ├── Consume task.created
  ├── Emit technician.status.changed
  ├── Emit appointment.status.changed (job updates)
  ├── Emit task.completed
  ├── PWA manifest + service worker
  └── Offline capability testing
```

---

### PHASE 3: Specialized Apps

**Duration: 4 weeks** | **Team: 2 Parallel Teams (2 engineers each)**

### Phase 3 — App A: crm-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Foxtrot (2 engineers) |
| **Duration** | 4 weeks |
| **Parallel with** | resolution-center_v2 |
| **Depends on** | Phase 1, Phase 2 apps |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold
  ├── Account Dashboard (health distribution, risk alerts)
  ├── Account List page
  ├── Account Detail page (360 view)
  └── Navigation structure

Week 2: Core Pages & Components
  ├── Followup Center page
  ├── Health Scans page
  ├── Risk Signals page
  ├── HealthGauge, AccountHealthCard
  ├── HealthCategoryBar, FollowupList
  ├── SlippingAlertBanner, RiskSignalCard
  └── AccountTimeline

Week 3: Forms & Data Integration
  ├── New Followup form, Update Followup form
  ├── Manual Health Scan form, Account Note form
  ├── Account Segment form, Bulk Action form
  ├── Connect accounts table (CRUD)
  ├── Connect followups table (CRUD)
  ├── Connect customers, appointments, tickets, disputes (read)
  └── Connect operations_log (write)

Week 4: Event Integration & Polish
  ├── Emit account.health.scan.completed
  ├── Emit account.health.changed
  ├── Emit followup.created, followup.slippage.detected
  ├── Consume ticket.status.changed, dispute.resolved
  ├── Consume appointment.completed
  └── Health scan orchestration
```

### Phase 3 — App B: resolution-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Golf (2 engineers) |
| **Duration** | 4 weeks |
| **Parallel with** | crm-center_v2 |
| **Depends on** | Phase 1, Phase 2 apps |

#### Build Sequence (Within-App)

```
Week 1: Pages & Routing
  ├── App scaffold
  ├── Dispute Queue page
  ├── Dispute Detail page
  └── Navigation structure

Week 2: Core Pages & Components
  ├── Resolution Approval page
  ├── Resolution History page
  ├── Trend Analysis page
  ├── DisputeList, DisputeDetailPanel
  ├── AIAnalysisCard, RecommendationCard
  ├── ConfidenceIndicator, EvidenceViewer
  ├── ApprovalWorkflow, EscalationBanner
  └── DisputeTimeline, TrendChart

Week 3: Forms & Data Integration
  ├── Manual Dispute form, Approve Resolution form
  ├── Reject Resolution form, Escalate Dispute form
  ├── Close Dispute form
  ├── Connect disputes table (CRUD)
  ├── Connect appointments, customers, tickets (read)
  └── Connect operations_log (write)

Week 4: Event Integration & Polish
  ├── Emit dispute.created, dispute.analyzed
  ├── Emit dispute.status.changed, dispute.resolved
  ├── Consume appointment.status.changed
  ├── AI analysis invocation workflow
  └── Trend analysis charts
```

---

### PHASE 4: Cross-Cutting Infrastructure

**Duration: 4 weeks** | **Team: 2 Parallel Teams (2 engineers each)**

### Phase 4 — App A: notification-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Hotel (2 engineers) |
| **Duration** | 4 weeks |
| **Parallel with** | analytics-center_v2 |
| **Depends on** | All Phase 1-3 apps (event consumers) |

#### Build Sequence (Within-App)

```
Week 1: Infrastructure
  ├── Create notifications_v2 table (schema + migration)
  ├── Create notification_templates_v2 table
  ├── Create notification_channels_v2 table
  ├── Email provider integration (SMTP/send service)
  ├── SMS provider integration (Twilio gateway)
  ├── Discord webhook integration
  └── In-app push notification WebSocket setup

Week 2: Pages & Components
  ├── Notification Dashboard page
  ├── Notification Log page (searchable history)
  ├── Template Manager page
  ├── Channel Settings page
  ├── DeliveryMetricCards, NotificationLogTable
  ├── TemplateCard, TemplateEditor (with variable insertion)
  ├── ChannelStatusIndicator, PreferenceEditor
  └── ChannelTestButton

Week 3: Event Integration
  ├── Subscribe to notification.send event from ALL apps
  ├── Route to channel based on type + preferences
  ├── Template rendering with variable substitution
  ├── Delivery tracking (sent → delivered → failed → opened)
  ├── Retry logic for failed deliveries
  └── Rate limiting per user/channel

Week 4: Polish & Testing
  ├── Channel health monitoring
  ├── Notification grouping/digests
  ├── Scheduled notification dispatch
  ├── Error handling for each channel
  └── Integration tests for all channels
```

### Phase 4 — App B: analytics-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team India (2 engineers) |
| **Duration** | 4 weeks |
| **Parallel with** | notification-center_v2 |
| **Depends on** | All Phase 1-3 apps (event consumers) |

#### Build Sequence (Within-App)

```
Week 1: Infrastructure
  ├── Create analytics_reports_v2 table
  ├── Create analytics_schedules_v2 table
  ├── Set up Chart.js integration
  ├── Set up data aggregation queries
  └── Establish event subscriptions to ALL tables

Week 2: Dashboards
  ├── Executive Dashboard (top-level KPIs)
  ├── Support Analytics page
  ├── Operations Analytics page
  ├── Appointment Analytics page
  ├── Account Analytics page
  ├── Dispute Analytics page
  └── KpiDashboardGrid, TimeSeriesChart, BarChart, PieChart

Week 3: Reports & Export
  ├── Custom Reports page
  ├── Report Builder (drag-and-drop configuration)
  ├── Scheduled Reports page
  ├── DataExportButton (CSV, PDF, JSON)
  ├── DrillDownLink (metric → source records)
  └── Report scheduling engine

Week 4: Event Integration & Polish
  ├── Subscribe to ALL events for live metric refresh
  ├── KPI threshold alerting
  ├── Data freshness indicators
  ├── Date range navigation
  └── Integration tests
```

---

### PHASE 5: System Administration

**Duration: 3 weeks** | **Team: 1 Team (2-3 engineers)**

### Phase 5 — App A: admin-center_v2

| Attribute | Value |
|-----------|-------|
| **Team** | Team Juliet (2-3 engineers) |
| **Duration** | 3 weeks |
| **Depends on** | ALL other apps (manages users/roles for them) |

#### Build Sequence (Within-App)

```
Week 1: Infrastructure & Tables
  ├── Create users_v2 table (migration)
  ├── Create user_roles_v2 table
  ├── Create system_settings_v2 table
  ├── Create feature_flags_v2 table
  ├── Create connectors_v2 table
  ├── Authentication integration for admin
  └── Permission system scaffolding

Week 2: Pages & Components
  ├── Admin Dashboard (system health, event volume)
  ├── User Management page (searchable user table)
  ├── User Detail page (profile, roles, sessions)
  ├── Role Manager page (permission tree editor)
  ├── Audit Log page (searchable, exportable)
  ├── SystemSettings page (key-value config editor)
  ├── SystemHealthCard, UserTable, UserForm
  ├── RolePermissionTree, FeatureFlagToggle
  ├── AuditLogTable, EventVolumeChart
  ├── ConnectorCard, ActiveSessionList
  └── ConfigEditor

Week 3: Integration & Polish
  ├── Emit user.created, user.role.changed, user.disabled
  ├── Emit system.config.changed
  ├── User invitation flow (via notification-center_v2)
  ├── Connector health monitoring
  ├── Event bus monitoring dashboard
  ├── Audit log search and export
  └── Integration tests
```

---

### PHASE 6: Integration & Polish

**Duration: 4 weeks** | **Team: All Teams**

#### Work Items

| Work Stream | Description | Owner |
|-------------|-------------|-------|
| **Workflows** | Connect all 8+ V2 workflows to event bus and app UI | All teams |
| **Agents** | Deploy and connect all 5+ V2 agents | Platform team |
| **Functions** | Deploy and connect all 13+ V2 functions | Platform team |
| **Cross-App Testing** | End-to-end tests across app boundaries | QA team |
| **Performance** | Load testing, optimization | Platform team |
| **Security** | Permission audit, penetration testing | Security lead |
| **Documentation** | User guides, API docs, admin guides | All teams |
| **Deployment** | CI/CD pipeline finalization, staging deploy | Platform team |

#### Key Integration Tasks

```
Week 1: Workflow Integration
  ├── Connect ticket-intake_v2 workflow
  ├── Connect appointment-assignment_v2 workflow
  ├── Connect urgent-dispatch_v2 workflow
  ├── Connect dispute-resolution_v2 workflow
  ├── Connect account-health-monitoring_v2 workflow
  ├── Connect followup-slippage-detector_v2 workflow
  └── Connect appointment-reminders_v2 workflow

Week 2: Agent & Function Integration
  ├── Deploy request-classifier_v2 agent
  ├── Deploy support-reply-drafter_v2 agent
  ├── Deploy operations-coordinator_v2 agent
  ├── Deploy resolution-advisor_v2 agent
  ├── Deploy account-health-monitor_v2 agent
  ├── Deploy tech-suggester_v2 agent
  └── Deploy all 15+ V2 functions

Week 3: System Testing
  ├── Full E2E: customer creates ticket → support resolves
  ├── Full E2E: appointment → dispatch → technician completes
  ├── Full E2E: dispute → analysis → resolution
  ├── Full E2E: health scan → critical alert → retention action
  ├── Cross-app notification delivery verification
  └── Permission boundary testing

Week 4: Launch Preparation
  ├── Performance load testing
  ├── Security audit remediation
  ├── Documentation finalization
  ├── Production deployment plan
  ├── Rollback plan
  └── Monitoring + alerting setup
```

---

## 4. Application Build Cards

### App Build Card Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│  APP BUILD CARD SUMMARY                                                                          │
├────────────────────┬──────────┬────────┬──────────┬────────┬────────┬────────┬────────┬─────────┤
│ App                │ Estimate │ Pages  │ Comps    │ Wkflws │ Agents │ Funcs  │ APIs   │ Priority│
├────────────────────┼──────────┼────────┼──────────┼────────┼────────┼────────┼────────┼─────────┤
│ support-center_v2  │ 6 weeks  │  8     │  28      │  4     │  2     │  2     │  0     │  P0     │
│ operations-center_v2│ 6 weeks │  6     │  26      │  4     │  1     │  2     │  2     │  P0     │
│ appointment-center │ 6 weeks  │  7     │  24      │  3     │  1     │  2     │  0     │  P0     │
│ customer-portal_v2 │ 4 weeks  │  6     │  22      │  3     │  0     │  1     │  0     │  P1     │
│ technician-portal  │ 4 weeks  │  5     │  20      │  3     │  0     │  1     │  1     │  P1     │
│ crm-center_v2      │ 4 weeks  │  6     │  24      │  2     │  1     │  2     │  0     │  P1     │
│ resolution-center  │ 4 weeks  │  5     │  22      │  1     │  1     │  1     │  0     │  P1     │
│ notification-center│ 4 weeks  │  3     │  18      │  1     │  0     │  1     │  4     │  P2     │
│ analytics-center_v2│ 4 weeks  │  4     │  20      │  0     │  0     │  0     │  0     │  P2     │
│ admin-center_v2    │ 3 weeks  │  6     │  22      │  0     │  0     │  0     │  0     │  P2     │
├────────────────────┼──────────┼────────┼──────────┼────────┼────────┼────────┼────────┼─────────┤
│ TOTAL              │ 45 wks*  │ 56     │  226     │  21    │  8     │  12    │  7     │  -      │
└────────────────────┴──────────┴────────┴──────────┴────────┴────────┴────────┴────────┴─────────┘

*45 weeks total sequential; ~28 weeks parallelized across teams.
```

### Individual Build Cards

#### support-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║                 BUILD CARD: SUPPORT CENTER                   ║
╠══════════════════════════════════════════════════════════════╣
║ App:        support-center_v2                                ║
║ Priority:   P0 — Core Operational                           ║
║ Team:       Alpha (2-3 engineers)                           ║
║ Duration:   6 weeks (Phase 1)                               ║
║ Parallel:   ops-center_v2, appointment-center_v2            ║
║ Depends On: Phase 0 (all shared packages)                   ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   8/10 (multi-state workflow, SLA tracking)    ║
║   Pages:        8                                            ║
║   Components:   28                                           ║
║   Workflows:    4 (ticket-intake, urgent-dispatch,          ║
║                    escalation-manager, satisfaction-monitor) ║
║   Agents:       2 (request-classifier, reply-drafter)       ║
║   Functions:    2 (check-ticket-urgency, update-ticket)     ║
║   API Integrations: 0 (all internal)                        ║
║   Tables Read:  5 (tickets, customers, technicians,         ║
║                    appointments, operations_log)            ║
║   Tables Write: 1 (tickets)                                  ║
║   Tables Create: 1 (tickets - manual entry)                  ║
║   Events Emitted: 6                                          ║
║   Events Consumed: 4                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Multi-state ticket lifecycle complexity                  ║
║   - Real-time SLA countdown timer performance                ║
║   - Kanban vs list view toggle state management              ║
╚══════════════════════════════════════════════════════════════╝
```

#### operations-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║              BUILD CARD: OPERATIONS CENTER                   ║
╠══════════════════════════════════════════════════════════════╣
║ App:        operations-center_v2                             ║
║ Priority:   P0 — Core Operational                           ║
║ Team:       Bravo (2-3 engineers)                           ║
║ Duration:   6 weeks (Phase 1)                               ║
║ Parallel:   support-center_v2, appointment-center_v2        ║
║ Depends On: Phase 0 (all shared packages)                   ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   7/10 (kanban, real-time dispatch, cross-app) ║
║   Pages:        6                                            ║
║   Components:   26                                           ║
║   Workflows:    4 (urgent-dispatch, daily-standup,          ║
║                    followup-slippage, appointment-assignment)║
║   Agents:       1 (operations-coordinator)                  ║
║   Functions:    2 (create-operations-tasks,                 ║
║                    dispatch-notifications)                   ║
║   API Integrations: 2 (Discord alerts, SMS dispatch)        ║
║   Tables Read:  6 (tickets, tasks, appointments,            ║
║                    technicians, operations_log, customers)  ║
║   Tables Write: 2 (tasks, operations_log)                   ║
║   Tables Create: 1 (tasks)                                   ║
║   Events Emitted: 5                                          ║
║   Events Consumed: 6                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Drag-and-drop kanban performance                         ║
║   - Real-time cross-app data aggregation                     ║
║   - Dispatch coordination race conditions                    ║
╚══════════════════════════════════════════════════════════════╝
```

#### appointment-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║             BUILD CARD: APPOINTMENT CENTER                   ║
╠══════════════════════════════════════════════════════════════╣
║ App:        appointment-center_v2                            ║
║ Priority:   P0 — Core Operational                           ║
║ Team:       Charlie (2-3 engineers)                         ║
║ Duration:   6 weeks (Phase 1)                               ║
║ Parallel:   support-center_v2, operations-center_v2         ║
║ Depends On: Phase 0 (all shared packages)                   ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   7/10 (calendar, conflict detection, AI tech ├║
║                    suggestion)                               ║
║   Pages:        7                                            ║
║   Components:   24                                           ║
║   Workflows:    3 (appointment-assignment,                  ║
║                    appointment-reminders, urgent-dispatch)   ║
║   Agents:       1 (tech-suggester)                           ║
║   Functions:    2 (assign-appointment-technician,           ║
║                    fetch-upcoming-appointments)              ║
║   API Integrations: 0                                        ║
║   Tables Read:  5 (appointments, technicians, customers,    ║
║                    tickets, operations_log)                 ║
║   Tables Write: 1 (appointments)                             ║
║   Tables Create: 1 (appointments)                            ║
║   Events Emitted: 5                                          ║
║   Events Consumed: 4                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Calendar component complexity (monthly/weekly/daily)     ║
║   - Scheduling conflict detection accuracy                   ║
║   - Real-time multi-user calendar updates                    ║
╚══════════════════════════════════════════════════════════════╝
```

#### customer-portal_v2

```
╔══════════════════════════════════════════════════════════════╗
║              BUILD CARD: CUSTOMER PORTAL                     ║
╠══════════════════════════════════════════════════════════════╣
║ App:        customer-portal_v2                               ║
║ Priority:   P1 — External Portal                            ║
║ Team:       Delta (2 engineers)                             ║
║ Duration:   4 weeks (Phase 2)                               ║
║ Parallel:   technician-portal_v2                            ║
║ Depends On: Phase 0, Phase 1 (events + data)                ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   6/10 (self-service flows, auth, responsive)  ║
║   Pages:        6                                            ║
║   Components:   22                                           ║
║   Workflows:    3 (ticket-intake, appointment-assignment,   ║
║                    appointment-reminders)                    ║
║   Agents:       0                                            ║
║   Functions:    1 (check-ticket-urgency)                     ║
║   API Integrations: 0                                        ║
║   Tables Read:  6 (customers, tickets, appointments,        ║
║                    disputes, accounts, followups)            ║
║   Tables Write: 1 (customers — profile only)                 ║
║   Tables Create: 1 (tickets)                                 ║
║   Events Emitted: 3                                          ║
║   Events Consumed: 4                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Self-service booking UX complexity                       ║
║   - Mobile responsiveness (primary use case)                 ║
║   - Customer identity auth integration                       ║
╚══════════════════════════════════════════════════════════════╝
```

#### technician-portal_v2

```
╔══════════════════════════════════════════════════════════════╗
║             BUILD CARD: TECHNICIAN PORTAL                    ║
╠══════════════════════════════════════════════════════════════╣
║ App:        technician-portal_v2                             ║
║ Priority:   P1 — External Portal                            ║
║ Team:       Echo (2 engineers)                              ║
║ Duration:   4 weeks (Phase 2)                               ║
║ Parallel:   customer-portal_v2                              ║
║ Depends On: Phase 0, Phase 1 (events + data)                ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   7/10 (mobile-first, offline, real-time)      ║
║   Pages:        5                                            ║
║   Components:   20                                           ║
║   Workflows:    3 (urgent-dispatch, appointment-assignment, ║
║                    appointment-reminders)                    ║
║   Agents:       0                                            ║
║   Functions:    1 (dispatch-notifications)                   ║
║   API Integrations: 1 (map/navigation external API)          ║
║   Tables Read:  4 (appointments, customers, tasks,          ║
║                    technicians)                              ║
║   Tables Write: 3 (appointments, technicians, tasks)         ║
║   Tables Create: 1 (job_evidence)                            ║
║   Events Emitted: 3                                          ║
║   Events Consumed: 5                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Offline capability complexity                            ║
║   - PWA reliability across mobile devices                    ║
║   - Real-time dispatch alerts delivery                       ║
║   - Photo upload performance on mobile                       ║
╚══════════════════════════════════════════════════════════════╝
```

#### crm-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║                 BUILD CARD: CRM CENTER                        ║
╠══════════════════════════════════════════════════════════════╣
║ App:        crm-center_v2                                    ║
║ Priority:   P1 — Specialized App                            ║
║ Team:       Foxtrot (2 engineers)                           ║
║ Duration:   4 weeks (Phase 3)                               ║
║ Parallel:   resolution-center_v2                            ║
║ Depends On: Phase 0, Phase 1, Phase 2                       ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   6/10 (health scoring, followup tracking)     ║
║   Pages:        6                                            ║
║   Components:   24                                           ║
║   Workflows:    2 (account-health-monitoring,               ║
║                    followup-slippage-detector)               ║
║   Agents:       1 (account-health-monitor)                   ║
║   Functions:    2 (account-health-scan,                     ║
║                    flag-slipping-followups)                  ║
║   API Integrations: 0                                        ║
║   Tables Read:  7 (accounts, customers, followups,          ║
║                    appointments, tickets, disputes,          ║
║                    operations_log)                           ║
║   Tables Write: 2 (accounts, followups)                      ║
║   Tables Create: 1 (followups)                               ║
║   Events Emitted: 4                                          ║
║   Events Consumed: 4                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Health score calculation accuracy                        ║
║   - Cross-app data aggregation performance                   ║
║   - Automated health scan orchestration                      ║
╚══════════════════════════════════════════════════════════════╝
```

#### resolution-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║             BUILD CARD: RESOLUTION CENTER                    ║
╠══════════════════════════════════════════════════════════════╣
║ App:        resolution-center_v2                             ║
║ Priority:   P1 — Specialized App                            ║
║ Team:       Golf (2 engineers)                              ║
║ Duration:   4 weeks (Phase 3)                               ║
║ Parallel:   crm-center_v2                                   ║
║ Depends On: Phase 0, Phase 1, Phase 2                       ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   6/10 (AI analysis, approval workflow)        ║
║   Pages:        5                                            ║
║   Components:   22                                           ║
║   Workflows:    1 (dispute-resolution)                       ║
║   Agents:       1 (resolution-advisor)                       ║
║   Functions:    1 (resolve-dispute)                          ║
║   API Integrations: 0                                        ║
║   Tables Read:  5 (disputes, appointments, customers,       ║
║                    tickets, operations_log)                  ║
║   Tables Write: 1 (disputes)                                 ║
║   Tables Create: 1 (disputes)                                ║
║   Events Emitted: 4                                          ║
║   Events Consumed: 3                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - AI analysis result handling + confidence display         ║
║   - Approval workflow state management                       ║
║   - Evidence viewing UX (multi-format)                       ║
╚══════════════════════════════════════════════════════════════╝
```

#### notification-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║            BUILD CARD: NOTIFICATION CENTER                   ║
╠══════════════════════════════════════════════════════════════╣
║ App:        notification-center_v2                           ║
║ Priority:   P2 — Cross-Cutting Infrastructure               ║
║ Team:       Hotel (2 engineers)                             ║
║ Duration:   4 weeks (Phase 4)                               ║
║ Parallel:   analytics-center_v2                             ║
║ Depends On: All Phase 1-3 apps (event consumers)            ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   5/10 (multi-channel delivery infrastructure) ║
║   Pages:        3                                            ║
║   Components:   18                                           ║
║   Workflows:    1 (appointment-reminders)                    ║
║   Agents:       0                                            ║
║   Functions:    1 (dispatch-notifications)                   ║
║   API Integrations: 4 (SMTP, SMS gateway, Discord, webhook) ║
║   Tables Read:  5 (notifications_v2, templates_v2,          ║
║                    channels_v2, customers, technicians)      ║
║   Tables Write: 3 (notifications_v2, templates_v2,          ║
║                    channels_v2)                              ║
║   Tables Create: 3 (same as write)                           ║
║   Events Emitted: 4                                          ║
║   Events Consumed: 10 (from all apps)                        ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - External provider reliability (SMTP, SMS)                ║
║   - Rate limiting and throttling logic                       ║
║   - Template variable substitution edge cases                ║
║   - Credential security for external channels                ║
╚══════════════════════════════════════════════════════════════╝
```

#### analytics-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║              BUILD CARD: ANALYTICS CENTER                    ║
╠══════════════════════════════════════════════════════════════╣
║ App:        analytics-center_v2                              ║
║ Priority:   P2 — Cross-Cutting Infrastructure               ║
║ Team:       India (2 engineers)                             ║
║ Duration:   4 weeks (Phase 4)                               ║
║ Parallel:   notification-center_v2                          ║
║ Depends On: All Phase 1-3 apps (event consumers)            ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   5/10 (aggregation queries, charting)         ║
║   Pages:        4                                            ║
║   Components:   20                                           ║
║   Workflows:    0 (read-only)                                ║
║   Agents:       0                                            ║
║   Functions:    0 (query directly)                           ║
║   API Integrations: 0                                        ║
║   Tables Read:  9 (tickets, appointments, disputes,         ║
║                    accounts, followups, tasks, customers,    ║
║                    technicians, operations_log)              ║
║   Tables Write: 0 (read-only)                                ║
║   Tables Create: 2 (reports, schedules)                      ║
║   Events Emitted: 1                                          ║
║   Events Consumed: 9 (ALL domain events)                     ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Query performance on large datasets                      ║
║   - Report builder complexity                                ║
║   - Real-time dashboard refresh performance                  ║
╚══════════════════════════════════════════════════════════════╝
```

#### admin-center_v2

```
╔══════════════════════════════════════════════════════════════╗
║               BUILD CARD: ADMIN CENTER                       ║
╠══════════════════════════════════════════════════════════════╣
║ App:        admin-center_v2                                  ║
║ Priority:   P2 — System Administration                      ║
║ Team:       Juliet (2-3 engineers)                          ║
║ Duration:   3 weeks (Phase 5)                               ║
║ Parallel:   None                                             ║
║ Depends On: ALL other apps (user/role config for them)      ║
╠══════════════════════════════════════════════════════════════╣
║ ESTIMATES                                                    ║
║   Complexity:   4/10 (CRUD-heavy, permission tree)           ║
║   Pages:        6                                            ║
║   Components:   22                                           ║
║   Workflows:    0                                            ║
║   Agents:       0                                            ║
║   Functions:    0                                            ║
║   API Integrations: 0                                        ║
║   Tables Read:  9 (users_v2, roles_v2, settings_v2,        ║
║                    flags_v2, connectors_v2, operations_log,  ║
║                    + all operational tables for health)      ║
║   Tables Write: 5 (users_v2, roles_v2, settings_v2,        ║
║                    flags_v2, connectors_v2)                  ║
║   Tables Create: 5 (same as write)                           ║
║   Events Emitted: 4                                          ║
║   Events Consumed: 2                                         ║
╠══════════════════════════════════════════════════════════════╣
║ KEY RISKS                                                    ║
║   - Permission system design complexity                      ║
║   - Audit log performance with many entries                  ║
║   - Secure credential storage for connectors                 ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 5. Parallelization Opportunities

### Team Allocation Map

```
Phase 0 (Wk 1-3):  Platform Team
                    └── Shared packages, infrastructure, design system

Phase 1 (Wk 4-9):  Team Alpha ── support-center_v2
                    Team Bravo ── operations-center_v2
                    Team Charlie ── appointment-center_v2

Phase 2 (Wk 10-13): Team Delta ── customer-portal_v2
                     Team Echo ── technician-portal_v2
                     (Alpha/Bravo/Charlie move to Phase 3/4/5)

Phase 3 (Wk 14-17): Team Foxtrot ── crm-center_v2
                     Team Golf ── resolution-center_v2
                     (Alpha/Bravo/Charlie available for advanced work)

Phase 4 (Wk 18-21): Team Hotel ── notification-center_v2
                     Team India ── analytics-center_v2

Phase 5 (Wk 22-24): Team Juliet ── admin-center_v2

Phase 6 (Wk 25-28): ALL TEAMS ── Integration, workflows, agents, E2E
```

### Parallelism Summary

| Phase | Sequential | Parallel Apps | Max Teams | People Needed |
|-------|-----------|---------------|-----------|--------------|
| 0 | Yes | 0 | 1 | 2-3 |
| 1 | No | 3 | 3 | 6-9 |
| 2 | No | 2 | 2 | 4 |
| 3 | No | 2 | 2 | 4 |
| 4 | No | 2 | 2 | 4 |
| 5 | Yes | 0 | 1 | 2-3 |
| 6 | Partial | 10 (integrate) | 10 | 10-15 |

**Peak team size: 10-15 engineers across 5-6 teams**

---

## 6. Milestone Definitions

### Milestone Gates

| Milestone | Criteria | Phase |
|-----------|----------|-------|
| **M0: Foundation Complete** | Shared packages built, V2 app template works, CI/CD passes | End of Phase 0 |
| **M1: Core Operational** | support, ops, appointment apps functional with data + events | End of Phase 1 |
| **M2: Portals Live** | customer + technician portals functional, mobile-responsive | End of Phase 2 |
| **M3: Specialized Apps** | crm + resolution functional with agent integration | End of Phase 3 |
| **M4: Infrastructure Ready** | notification + analytics functional, cross-app event flow works | End of Phase 4 |
| **M5: Admin Complete** | admin-center functional, user/role management works | End of Phase 5 |
| **M6: V2 Launch Ready** | All workflows, agents, functions connected; E2E tests pass; security audit complete | End of Phase 6 |

### Go/No-Go Decision Points

| Decision Point | When | Question |
|---------------|------|----------|
| D1 | End of Phase 0 | "Are shared packages stable enough for app teams to start?" |
| D2 | End of Phase 1 | "Do core operational apps provide sufficient value to continue investment?" |
| D3 | End of Phase 2 | "Are portals usable and performant for external users?" |
| D4 | End of Phase 3 | "Are specialized apps accurate (AI analysis, health scoring)?" |
| D5 | End of Phase 4 | "Is cross-app notification delivery reliable?" |
| D6 | End of Phase 5 | "Is the admin interface comprehensive enough?" |
| D7 | End of Phase 6 | "Is the system ready for production launch?" |

---

## 7. Risk Assessment

### Risk Matrix

| Risk | Probability | Impact | Mitigation | Phase |
|------|:-----------:|:------:|------------|-------|
| Shared packages delay blocking all apps | Low | Critical | Build minimal viable shared packages first; allow app teams to contribute back | 0 |
| Event bus reliability issues | Medium | High | Buffer writes for offline resilience; retry policies for event emissions | 0 |
| Real-time subscription performance | Medium | Medium | Optimize subscription scope; paginate real-time updates; use debouncing | All |
| Mobile responsiveness gaps | Medium | Medium | Mobile-first development for portal apps; responsive testing from day 1 | 2 |
| Third-party notification channel failures | Medium | Medium | Graceful degradation; retry logic; channel health monitoring | 4 |
| AI agent latency affecting UX | Medium | Medium | Show optimistic UI; async agent operations with loading states | 1, 3 |
| Permission model complexity | Low | High | Start with simple role-based model; extend later with attribute-based | 5 |
| Cross-team coordination overhead | Medium | Medium | Shared event catalog; API contracts defined in Phase 0; regular sync meetings | All |

### Risk Response Strategies

| Strategy | Description |
|----------|-------------|
| **Accept** | Low-probability, low-impact risks (e.g., minor UI inconsistencies) |
| **Mitigate** | Medium-probability risks with concrete actions (e.g., event retry policies) |
| **Transfer** | Third-party dependency risks via SLAs with providers |
| **Avoid** | High-impact risks by simplifying scope (e.g., defer complex features to post-launch) |

---

## 8. Resource Allocation

### Estimated Effort by Role

| Role | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Total |
|------|:-------:|:-------:|:-------:|:-------:|:-------:|:-------:|:-------:|:-----:|
| Frontend Engineers | 2 | 6 | 4 | 4 | 4 | 2 | 5 | 27 FTW |
| Full-Stack Engineers | 1 | 3 | 2 | 2 | 2 | 1 | 3 | 14 FTW |
| QA Engineers | 0.5 | 1.5 | 1 | 1 | 1 | 0.5 | 3 | 8.5 FTW |
| DevOps Engineers | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 | 1 | 4 FTW |
| Product Manager | 0.25 | 0.5 | 0.25 | 0.25 | 0.25 | 0.25 | 0.5 | 2.25 FTW |
| Designer | 0.5 | 1 | 1 | 0.5 | 0.5 | 0.5 | 0.5 | 4.5 FTW |

*FTW = Full-Time Equivalent per Week*

### Total Estimated Effort

| Resource | Person-Weeks |
|----------|:-----------:|
| Engineering | 41 |
| QA | 8.5 |
| DevOps | 4 |
| Product | 2.25 |
| Design | 4.5 |
| **Total** | **60.25** |

### Recommended Team Structure

```
Phase 0:
  Platform Team: 2 FE + 1 FS + 0.5 DevOps

Phase 1 (×3 teams):
  Per Team: 2 FE + 1 FS + 0.5 QA

Phase 2 (×2 teams):
  Per Team: 1.5 FE + 0.5 FS + 0.5 QA

Phase 3 (×2 teams):
  Per Team: 1.5 FE + 0.5 FS + 0.5 QA

Phase 4 (×2 teams):
  Per Team: 1.5 FE + 0.5 FS + 0.5 QA

Phase 5:
  Admin Team: 1.5 FE + 0.5 FS + 0.5 QA

Phase 6:
  All teams + 1 dedicated QA + 1 DevOps
```

---

> **End of APPLICATION_BUILD_ORDER.md**  
> Next document: APPLICATION_DEPENDENCY_GRAPH.md
