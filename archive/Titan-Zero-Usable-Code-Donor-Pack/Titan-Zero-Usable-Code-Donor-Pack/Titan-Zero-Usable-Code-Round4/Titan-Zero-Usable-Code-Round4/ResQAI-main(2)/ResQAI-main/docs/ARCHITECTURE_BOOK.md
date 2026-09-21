# ResQAI V2 — Enterprise Architecture Book

**Version:** 2.0.0  
**Status:** Active Development  
**Platform:** Lemma Pod (lemma.work)  
**Last Updated:** 2026-06-30

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Application Architecture](#2-application-architecture)
3. [Database Architecture](#3-database-architecture)
4. [Event Architecture](#4-event-architecture)
5. [AI Architecture](#5-ai-architecture)
6. [Workflow Architecture](#6-workflow-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Sequence Diagrams](#9-sequence-diagrams)
10. [Dependency Graphs](#10-dependency-graphs)
11. [Navigation Graphs](#11-navigation-graphs)
12. [System Graphs](#12-system-graphs)

---

## 1. System Overview

ResQAI is a field-service operations platform built on the **Lemma pod platform**. The system consists of 5 React applications, 5 AI agents, 66 Python serverless functions, 41 database tables, and 11 workflow definitions — all operating against a shared data layer with no traditional backend API server.

### 1.1 Architecture Philosophy

- **No traditional backend** — No Express, FastAPI, or GraphQL server. All communication flows through the Lemma SDK directly from browser to platform.
- **AI as composable workflow nodes** — Agents are stateless, idempotent, configuration-driven nodes with strict I/O schemas and workflow status codes for routing.
- **Human-in-the-loop everywhere** — Every AI output is a draft or recommendation. No agent can take final action without human approval.
- **Configuration over code** — Agent behavior is defined entirely in `instruction.md` prompts + JSON Schemas. No agent-specific TypeScript or Python exists.
- **Deterministic functions** — Python serverless functions are pure, stateless, and fully testable.

### 1.2 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATIONS LAYER                              │
│                                                                         │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Support      │  │ CRM      │  │ Ops           │  │ Appointment   │  │
│  │ Queue        │  │ Tracker  │  │ Dashboard     │  │ Board         │  │
│  └──────┬───────┘  └────┬─────┘  └──────┬───────┘  └───────┬────────┘  │
│  ┌──────┴───────┐       │               │                   │          │
│  │ Resolution   │───────┴───────────────┴───────────────────┘          │
│  │ Center       │                                                     │
│  └──────────────┘                                                     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   SHARED FOUNDATION LAYER                        │   │
│  │  @resqai/foundation (shared/)                                    │   │
│  │  ┌──────────┬───────────┬──────────┬───────────┬──────────┐     │   │
│  │  │ SDK      │ Design    │ Events   │ Perms     │ State    │     │   │
│  │  │ Wrapper  │ System    │ EventBus │ Guards    │ Contexts │     │   │
│  │  └──────────┴───────────┴──────────┴───────────┴──────────┘     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ Lemma SDK
┌──────────────────────────────────▼──────────────────────────────────────┐
│                         LEMMA POD PLATFORM                              │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │    AI AGENTS      │  │  PYTHON FUNCTIONS │  │  DATABASE TABLES     │  │
│  │                   │  │                   │  │                      │  │
│  │ request-classifier│  │ account_health_   │  │ customers_v2        │  │
│  │ support-reply-    │  │   scan            │  │ technicians_v2      │  │
│  │   drafter         │  │ flag_slipping_    │  │ tickets_v2          │  │
│  │ operations-       │  │   followups       │  │ appointments_v2     │  │
│  │   coordinator     │  │ check_ticket_     │  │ accounts_v2         │  │
│  │ resolution-       │  │   urgency         │  │ disputes_v2         │  │
│  │   advisor         │  │ create_appointment│  │ tasks_v2            │  │
│  │ account-health-   │  │ dispatch_         │  │ notifications_v2    │  │
│  │   monitor         │  │   notifications   │  │ (41 tables total)   │  │
│  │ tech-suggester    │  │ resolve_dispute   │  │                     │  │
│  │                   │  │ (66 total)        │  │                     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     WORKFLOW ENGINE                              │   │
│  │  ticket-intake │ dispute-resolution │ urgent-dispatch            │   │
│  │  account-health │ daily-standup │ followup-slippage              │   │
│  │  support-escalation │ customer-satisfaction │ reminders           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Application Architecture

### 2.1 Application Inventory

| Application | Purpose | Key Agents/Functions | Route Count | Test Coverage |
|---|---|---|---|---|
| **Support Queue** | Urgency-first ticket triage with AI classification and drafting | `request-classifier`, `support-reply-drafter` | ~5 routes | 9 tests |
| **CRM Tracker** | Account health monitoring and follow-up alerting | `account-health-monitor`, `account_health_scan`, `flag_slipping_followups` | ~4 routes | None |
| **Ops Dashboard** | Morning standup KPI hub and urgent dispatch coordination | `operations-coordinator` | ~4 routes | None |
| **Appointment Board** | Technician scheduling, slot management, AI tech suggestions | `operations-coordinator`, `tech-suggester` | ~5 routes | None |
| **Resolution Center** | Service dispute analysis and resolution recommendation | `resolution-advisor` | ~4 routes | None |

### 2.2 Common Application Structure

Every application follows a uniform directory convention:

```
apps/<app-name>/
├── pages/                  # Page-level components (one per route)
│   ├── Dashboard.tsx
│   ├── TicketDetail.tsx
│   └── ...
├── components/             # Reusable UI components (app-specific)
│   ├── TicketCard.tsx
│   ├── UrgencyBadge.tsx
│   └── ...
├── hooks/                  # React hooks for state + SDK calls
│   ├── useTickets.ts
│   ├── useClassifications.ts
│   └── ...
├── services/               # Data access layer (wraps shared SDK)
│   ├── ticket-service.ts
│   └── ...
├── state/                  # React Context providers
│   ├── AppState.tsx
│   └── ...
├── routes/                 # Route definitions
│   ├── index.tsx
│   └── ...
├── main.tsx                # Vite entry point
├── App.tsx                 # Root component with routing
├── index.html              # Vite HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── .env                    # Environment variables
```

### 2.3 Shared Foundation Layer (`shared/`)

The `@resqai/foundation` package provides cross-cutting capabilities:

| Module | Contents |
|---|---|
| `shared/src/api/` | ApiClient, AuthMiddleware, CacheManager, ErrorHandler, RequestQueue, RetryManager |
| `shared/src/components/` | Input, Loader, Navigation, Notification, Pagination, ProgressIndicator, SearchBar, Sidebar, Skeleton, StatusBadge, Table, Tabs, Topbar |
| `shared/src/design-system/` | Design tokens for animation, borders, breakpoints, colors, elevation, icons, radius, spacing, typography |
| `shared/src/events/` | EventBus (pub-sub), ApplicationEvents, AgentEvents, WorkflowEvents, NotificationEvents |
| `shared/src/layouts/` | DashboardLayout, DetailLayout, SplitLayout, TableLayout, WizardLayout |
| `shared/src/navigation/` | ApplicationSwitcher, Breadcrumbs, RoleAwareNav, Sidebar, TopNavigation |
| `shared/src/permissions/` | RoleGuard, PermissionGuard, FeatureGuard, ApplicationGuard |
| `shared/src/state/` | AuthState, GlobalState, NotificationState, OrganizationState, ThemeState, UserState |
| `shared/src/utils/` | config, date, formatting, logging, search, validation |

### 2.4 Internal Packages

| Package | Name | Purpose |
|---|---|---|
| `packages/sdk/` | (internal) | Lemma SDK wrapper — `initLemmaClient()`, `listRecords()`, `runAgent()`, `runFunction()`, `logOperation()` |
| `packages/config/` | (internal) | `agents.ts`, `constants.ts`, `environment.ts`, `index.ts`, `paths.ts`, `theme.ts` |
| `packages/types/` | (internal) | 16 TypeScript interfaces: Customer, Technician, Appointment, Ticket, Dispute, Task, Account, Followup, etc. |
| `packages/utils/` | (internal) | date, filtering, number, service-helpers, sorting, string |
| `packages/ui/` | (internal) | UI helper functions |

### 2.5 SDK Surface (`packages/sdk/lemma-sdk.ts`)

All application-to-platform communication flows through 11 exported functions:

```
initLemmaClient()        Initialize and authenticate LemmaClient (singleton)
listRecords<T>(table)    List records with optional limit
getRecord<T>(table, id)  Get single record by ID
createRecord(table, dat) Create new record, returns ID
updateRecord(table, id)  Update existing record
bulkUpdateRecords()      Bulk update multiple records
runAgent(name, prompt)   Invoke AI agent, returns conversation ID
waitForAgentResponse()   Poll for agent completion (135s timeout)
runFunction<T>(name, pa) Execute Python serverless function
logOperation()           Append audit entry to operations_log
runConnectorOperation()  Execute third-party connector operation
```

Authentication flow:
1. Set `window.__LEMMA_CONFIG__` from Vite environment variables
2. Load `lemma-client.js` SDK script dynamically
3. Instantiate `LemmaClient` and call `initialize()`
4. Localhost: use CLI token (`lemma token`) to bypass OAuth
5. Production: redirect to Lemma OAuth at `https://lemma.work/auth`

---

## 3. Database Architecture

### 3.1 Overview

41 V2 tables managed on the Lemma pod. All schemas are defined as DDL comments in `database/migrations_v2/` and applied via the `lemma table create` CLI. Tables use `enable_rls: false` and `visibility: POD` — shared across all apps, agents, and functions within the pod.

### 3.2 Schema Domains

| Domain | Tables | Count |
|---|---|---|
| **Reference & System** | `reference_data_v2`, `system_settings_v2`, `feature_flags_v2`, `connectors_v2` | 4 |
| **Access Control** | `user_roles_v2`, `users_v2`, `user_sessions_v2`, `role_permissions_v2` | 4 |
| **Knowledge** | `knowledge_categories_v2`, `knowledge_articles_v2` | 2 |
| **Notifications** | `notification_templates_v2`, `notification_channels_v2`, `notifications_v2` | 3 |
| **Customer Management** | `customers_v2`, `customer_addresses_v2`, `accounts_v2` | 3 |
| **Technician Management** | `technicians_v2`, `technician_skills_v2` | 2 |
| **Support Tickets** | `tickets_v2`, `ticket_messages_v2`, `ticket_attachments_v2` | 3 |
| **Appointments & Work** | `appointments_v2`, `appointment_reminders_v2`, `work_orders_v2`, `work_order_stages_v2`, `dispatches_v2` | 5 |
| **Disputes** | `disputes_v2`, `dispute_evidence_v2` | 2 |
| **Operations** | `tasks_v2`, `task_assignments_v2`, `followups_v2`, `followup_attempts_v2`, `operations_log` | 5 |
| **Inventory** | `inventory_items_v2`, `inventory_transactions_v2` | 2 |
| **Feedback** | `feedback_v2`, `feedback_surveys_v2` | 2 |
| **Analytics** | `analytics_reports_v2`, `analytics_schedules_v2` | 2 |
| **Audit & Events** | `audit_log_v2`, `events_v2` | 2 |
| **Account Health** | `account_health_scans_v2` | 1 |

### 3.3 Entity-Relationship Diagram

```
┌───────────────────┐          ┌───────────────────┐
│   user_roles_v2   │──1:N─────│     users_v2       │
└───────────────────┘          └────────┬───────────┘
                                        │1:N
                                  ┌─────▼───────────┐
                                  │ user_sessions_v2 │
                                  └─────────────────┘

┌───────────────────┐          ┌───────────────────┐
│   customers_v2    │──1:1─────│    accounts_v2     │
└────────┬──────────┘          └────────┬───────────┘
         │1:N                           │1:N
    ┌────▼──────────┐             ┌─────▼───────────┐
    │   customer_   │             │    followups_v2  │
    │   addresses_v2│             └────────┬─────────┘
    └───────────────┘                      │1:N
                                    ┌──────▼─────────┐
                                    │ followup_     │
                                    │ attempts_v2    │
                                    └────────────────┘

         ┌──────────────────┐
         │  technicians_v2  │──1:N─────technician_skills_v2
         └────────┬─────────┘
                  │1:N
    ┌─────────────┼──────────────┐
    │             │              │
┌───▼────┐  ┌────▼─────┐  ┌─────▼──────┐
│tickets │  │appointment│  │ dispatches │
│ _v2    │  │  s_v2    │  │    _v2     │
└───┬────┘  └────┬─────┘  └────────────┘
    │1:N         │1:N
┌───▼────┐  ┌────▼─────┐     ┌──────────────┐
│ticket  │  │appointment│1:N │ work_orders  │
│messages│  │reminders  │     │    _v2       │
├────────┤  └──────────┘     └──────┬───────┘
│ticket  │                         │1:N
│attach- │                   ┌─────▼───────┐
│ments   │                   │ work_order  │
└────────┘                   │ stages_v2  │
                             └────────────┘

┌───────────────────┐
│   disputes_v2     │──1:N─────dispute_evidence_v2
├───────────────────┤
│ FK: appointment_id│───appointments_v2
│ FK: customer_id   │───customers_v2
│ FK: ticket_id     │───tickets_v2
└───────────────────┘

┌───────────────────┐          ┌───────────────────┐
│    tasks_v2       │──1:N─────│ task_assignments_v2│
└───────────────────┘          └───────────────────┘

┌───────────────────┐          ┌───────────────────┐
│ feedback_v2       │──1:N─────│ feedback_surveys_v2│
└───────────────────┘          └───────────────────┘

┌───────────────────┐          ┌───────────────────┐
│ analytics_reports │──1:N─────│ analytics_schedules│
│       _v2         │          │       _v2         │
└───────────────────┘          └───────────────────┘

┌───────────────────┐
│ inventory_items   │──1:N─────inventory_transactions_v2
│       _v2         │
└───────────────────┘

┌───────────────────┐
│ knowledge_        │──self-ref───parent_id
│ categories_v2     │
└───────────────────┘
         │1:N
┌────────▼──────────┐
│ knowledge_articles │
│        _v2        │
└───────────────────┘
```

### 3.4 Core Table Schemas

#### tickets_v2 — Support Ticket Lifecycle

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| customer_id | UUID | FK → customers_v2(id) |
| customer_name | TEXT | Denormalized for display |
| channel | TEXT | email, chat, sms, phone, web, facebook, instagram |
| subject | TEXT | Ticket subject |
| message | TEXT | Customer message body |
| request_type | TEXT | new_booking, reschedule, cancellation, complaint, follow_up, general_inquiry |
| urgency | TEXT | low, normal, high, urgent |
| status | TEXT | new, classified, drafted, approved_to_send, sent, closed |
| assigned_to | TEXT | Human assignee |
| suggested_owner | TEXT | AI-suggested technician |
| draft_reply | TEXT | AI-generated draft |
| approved_to_send | BOOLEAN | Human approval flag |
| escalation_reason | TEXT | Reason if escalated |
| sla_deadline | TIMESTAMPTZ | SLA target time |
| escalated_at | TIMESTAMPTZ | Escalation timestamp |
| closed_at | TIMESTAMPTZ | Closure timestamp |
| version | INTEGER | Optimistic locking |

**Lifecycle State Machine:**
```
new → classified → drafted → approved_to_send → sent → closed
  ↘ (needs_human_review) → human-escalation ↙
```

#### accounts_v2 — Customer Account Health

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| customer_id | UUID | FK → customers_v2(id) CASCADE |
| name | TEXT | Account name |
| relationship_status | TEXT | new, active, watch, at_risk, in_dispute, dormant, won_back, churned |
| health | TEXT | healthy, watch, slipping, critical |
| health_score | DOUBLE | 0.0–1.0 computed score |
| primary_service_type | TEXT | plumbing, electrical, hvac, appliance, general_maintenance |
| lifetime_jobs | INTEGER | Total service count |
| lifetime_revenue_cents | INTEGER | Lifetime revenue |
| open_disputes | INTEGER | Active dispute count |
| open_followups | INTEGER | Pending follow-ups |
| overdue_followups | INTEGER | Past-due follow-ups |
| last_service_date | DATE | Most recent service |
| last_contact_date | DATE | Most recent contact |
| account_owner | TEXT | Responsible human |

#### disputes_v2 — Service Dispute Pipeline

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| appointment_id | UUID | FK → appointments_v2(id) RESTRICT |
| customer_id | UUID | FK → customers_v2(id) RESTRICT |
| ticket_id | UUID | FK → tickets_v2(id) SET NULL |
| customer_claim | TEXT | Customer's version |
| provider_claim | TEXT | Technician's version |
| evidence_summary | TEXT | Evidence assessment |
| status | TEXT | open, under_review, recommendation_ready, approved, rejected, closed |
| recommended_resolution | TEXT | full_refund, partial_refund, redo_service, discount_credit, no_action, escalate_legal |
| confidence | DOUBLE | 0.0–1.0 AI confidence |
| resolution_reason | TEXT | Explanation |
| resolved_by | TEXT | Human resolver |
| closed_at | TIMESTAMPTZ | Closure timestamp |

### 3.5 Indexing Strategy

Every table includes indexes on:
- **Primary key** (UUID) — automatic
- **Foreign key columns** — all FK relationships indexed
- **Status filters** — composite indexes on `(status, created_at DESC)` for list queries
- **Unique constraints** — email (active), auth provider, reference data type+code
- **Full-text search** — GIN index on `customers_v2.name` via `to_tsvector('english', name)`
- **Partial indexes** — `WHERE deleted_at IS NULL` on soft-delete columns

### 3.6 Migration Strategy

41 sequential migrations in `database/migrations_v2/`, each with:
- `-- lemma table create` DDL comment
- `-- lemma table add-index` / `add-foreign-key` / `add-unique` statements
- Seed data as `-- lemma table insert` commands
- Verification queries as comments

Rollback scripts in `database/rollbacks_v2/` mirroring each migration.

---

## 4. Event Architecture

### 4.1 Client-Side Event System

A lightweight pub-sub `EventBus` class in `shared/src/events/EventBus.ts` provides typed event communication across frontend applications.

```
class EventBus {
  on<T>(event, handler) → Unsubscribe
  emit<T>(event, payload)
  once<T>(event, handler) → Unsubscribe
  off(event, handler)
  clear(event?)
  listenerCount(event) → number
}
```

### 4.2 Event Bus Instances

Four typed singleton event buses:

| Bus | Events |
|---|---|
| `applicationEvents` | `app:initialized`, `app:routeChange`, `app:error`, `app:themeChange`, `app:sidebarToggle`, `app:languageChange` |
| `agentEvents` | `agent:started`, `agent:message`, `agent:completed`, `agent:failed`, `agent:requiresAction` |
| `workflowEvents` | `workflow:started`, `workflow:stepCompleted`, `workflow:completed`, `workflow:failed`, `workflow:paused`, `workflow:resumed`, `workflow:cancelled` |
| `notificationEvents` | `notification:added`, `notification:dismissed`, `notification:clearedAll`, `notification:unreadCount` |

### 4.3 Server-Side Event Architecture

The `events_v2` table stores all system events:

```
events_v2
├── id              UUID          PK
├── event_name      TEXT          e.g. "ticket.created", "dispute.updated"
├── producer_app    TEXT          Source application
├── producer_entity_type TEXT    Entity type (ticket, dispute, etc.)
├── producer_entity_id  UUID     Entity ID
├── payload         JSONB         Event payload
├── correlation_id  UUID          Trace identifier
└── status          TEXT          pending, processing, completed, failed
```

### 4.4 Workflow Triggers

Workflows are triggered by two mechanisms:

1. **DATASTORE_EVENT** — Table INSERT/UPDATE/DELETE events
   - `ticket.created` → ticket-intake workflow
   - `disputes INSERT/UPDATE` → dispute-resolution workflow
   - `tickets UPDATE` → support-escalation-manager
   - `tickets INSERT/UPDATE` → urgent-dispatch

2. **SCHEDULED** — CRON expressions
   - `0 2 * * *` (daily 2AM) → account-health
   - `0 8 * * 1-5` (weekdays 8AM) → daily-standup
   - `*/30 * * * *` (every 30 min) → followup-slippage-detector
   - `0 8 * * *` (daily 8AM) → customer-satisfaction-monitor
   - `0 7 * * *` (daily 7AM) → appointment-reminders

### 4.5 Event Flow Diagram

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────┐
│ Application  │────>│   EventBus        │────>│ React State  │
│ (User Action)│     │ (client-side pub  │     │ Re-render    │
└─────────────┘     │  -sub)            │     └──────────────┘
                    └───────────────────┘

┌─────────────┐     ┌───────────────────┐     ┌──────────────┐
│ Lemma Pod   │────>│   events_v2       │────>│ Workflow     │
│ (Table      │     │ (server-side      │     │ Engine       │
│  Mutation)  │     │  event store)     │     │              │
└─────────────┘     └───────────────────┘     └──────┬───────┘
                                                     │
                                             ┌───────▼───────┐
                                             │ Agent / Func  │
                                             │ Execution     │
                                             └───────────────┘
```

---

## 5. AI Architecture

### 5.1 Agent Inventory

| Agent | Role | Tables Read | Tables Written | Functions Used | Connectors |
|---|---|---|---|---|---|
| **request-classifier** | First-line ticket triage | tickets, technicians | tickets | — | Facebook, Instagram |
| **support-reply-drafter** | Draft customer-facing replies | tickets, technicians, customers | tickets | — | Gmail (trigger send), Reddit (research) |
| **operations-coordinator** | Operations chief of staff | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log | — | Discord (alerts) |
| **resolution-advisor** | Dispute mediator | disputes, customers, appointments, tickets, operations_log | disputes, operations_log | — | Reddit (research) |
| **account-health-monitor** | CRM health lead | accounts, followups, customers, appointments, disputes, tasks | tasks, operations_log | account_health_scan, flag_slipping_followups | Discord (critical alerts) |
| **tech-suggester** | Technician scoring | tickets, technicians | — | — | — |

### 5.2 Agent Configuration Pattern

Every agent follows a consistent file structure:

```
agents/<agent-name>/
├── agent.json            Metadata, model config, toolsets
├── instruction.md        System prompt (role, behavior, output contract, idempotency)
├── input-schema.json     JSON Schema for input validation
├── output-schema.json    JSON Schema for structured output
├── permissions.json      Table/function/connector access grants
├── tool-access.md        Human-readable access summary
├── workflow-role.md      Workflow integration role
└── README.md             Human-readable overview
```

### 5.3 Agent Design Principles

**1. Strict Scope Boundaries**
Each agent has a single responsibility with explicit negative constraints. Example from `request-classifier`:
> "You classify incoming customer requests; you do not schedule, dispatch, send messages, or resolve disputes."

**2. Structured Output Contracts**
Every agent returns a `status` field for workflow DECISION routing. Example output statuses from `resolution-advisor`:
- `ready_for_review` — normal path
- `insufficient_evidence` → human escalation
- `safety_escalation` → ops manager notification
- `legal_escalation` → legal counsel notification
- `already_analyzed` → terminal (idempotent re-run)
- `blocked` → human escalation

**3. Idempotency**
All agents are safe to re-run. Re-runs overwrite computed fields to the same deterministic values. Agents never duplicate side effects or log extra entries.

**4. Human-in-the-Loop**
"No outbound messaging" guardrail repeated in 4/5 agents. AI produces drafts; humans approve and execute.

**5. Configurable Heuristics**
Technician selection uses the same skill→availability→rating→urgency chain across `request-classifier` and `support-reply-drafter`.

### 5.4 Agent Interaction Diagram

```
INTAKE PIPELINE (ticket-intake workflow):
  Ticket Created
    → request-classifier (classify: request_type, urgency, suggested_owner)
    → check_ticket_urgency (function: validate urgency)
    → operations-coordinator (coordinate: recommendations)
    → Human Approval (FORM: approve/reject/revision)
    → resolution-advisor (analyze: resolution recommendation)
    → update_ticket_record (function: finalize)

URGENT DISPATCH PIPELINE (urgent-dispatch workflow):
  Ticket INSERT/UPDATE
    → request-classifier (classify)
    → check_ticket_urgency (function: is_urgent?)
    → tech-suggester (suggest: best technician)
    → operations-coordinator (coordinate: dispatch plan)
    → DECISION (auto/manual/escalation routing)
    → finalize_dispatch (function: commit dispatch)

DISPUTE PIPELINE (dispute-resolution workflow):
  Dispute INSERT/UPDATE
    → resolution-advisor (analyze: recommendation + confidence)
    → DECISION (route by analysis_status)
    → DECISION (check confidence ≥ 0.7)
    → apply_resolution (function: auto-approve) OR Human Approval (FORM)

HEALTH MONITORING (account-health workflow):
  CRON 0 2 * * *
    → flag_slipping_followups (function: detect overdue)
    → account_health_scan (function: compute scores)
    → account-health-monitor (analyze: recommendations)
    → DECISION (crisis → notify manager) OR create_tasks (function)

DAILY OPERATIONS (daily-standup workflow):
  CRON 0 8 * * 1-5
    → operations-coordinator (assess: full ops board)
    → DECISION (crisis → notify) OR create_operations_tasks (function)
```

### 5.5 Prompt Architecture

Each `instruction.md` follows a consistent template:

1. **Role Definition** — Who the agent is, what it does (and does not do)
2. **Core Logic** — Step-by-step reasoning instructions
3. **Read Contracts** — Which tables/records to read and how
4. **Write Contracts** — Which fields to write and under what conditions
5. **Decision Heuristics** — Classification rules, scoring formulas
6. **Workflow Contract** — Input shapes, status codes, routing rules
7. **Output Contract** — Status codes table with workflow actions
8. **Connector Use** — Third-party integration instructions
9. **Idempotency** — Re-run safety guarantees

### 5.6 Agent Permissions Model

Each agent's `permissions.json` grants explicit table/function/connector access:

```json
{
  "grants": [
    {
      "resource_name": "tickets",
      "resource_type": "datastore_table",
      "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"]
    },
    {
      "resource_name": "technicians",
      "resource_type": "datastore_table",
      "permission_ids": ["datastore.record.read", "datastore.table.read"]
    }
  ]
}
```

---

## 6. Workflow Architecture

### 6.1 Workflow Inventory

| Workflow | Status | Version | Trigger | Nodes |
|---|---|---|---|---|
| **ticket-intake** | active | 2.0.0 | DATASTORE_EVENT (ticket.created) | 6 |
| **urgent-dispatch** | active | 2.0.0 | DATASTORE_EVENT (tickets INSERT/UPDATE) | 12 |
| **dispute-resolution** | active | 2.0.0 | DATASTORE_EVENT (disputes INSERT/UPDATE) | 10 |
| **followup-slippage-detector** | active | 1.0.0 | SCHEDULED (*/30 * * * *) | 7 |
| **customer-satisfaction-monitor** | active | 1.0.0 | SCHEDULED (0 8 * * *) | 10 |
| **support-escalation-manager** | active | 1.0.0 | DATASTORE_EVENT (tickets UPDATE) | 8 |
| **account-health** | draft | 1.0.0 | SCHEDULED (0 2 * * *) | 4 |
| **daily-standup** | draft | 1.0.0 | SCHEDULED (0 8 * * 1-5) | 3 |
| **appointment-reminders** | draft | 1.0.0 | SCHEDULED (0 7 * * *) + events | 4 |
| **appointment-assignment** | draft | — | — | — |
| **account-health-monitoring** | draft | — | — | — |

### 6.2 Node Types

| Node Type | Purpose | Examples |
|---|---|---|
| `AGENT` | Invoke an AI agent | request-classifier, operations-coordinator, resolution-advisor |
| `FUNCTION` | Execute a Python function | check_ticket_urgency, finalize_dispatch, account_health_scan |
| `DECISION` | Conditional routing based on previous output | route_classification, check_confidence, check_approval |
| `FORM` / `human_decision` | Pause for human input | Human Approval, Manager Assignment, Human Escalation |
| `END` | Terminal node | Complete, No Slippage, Escalation Resolved |

### 6.3 Workflow Graph: ticket-intake

```
                         ┌──────────────────┐
                         │ ticket.created   │
                         │ trigger          │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │  classify-ticket  │
                         │  (request-        │
                         │   classifier)     │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │ classified  │             │
              ┌─────▼────┐    ┌──┴──────────┐  │ needs_human_review
              │ check-   │    │ human-      │  │ / unparseable
              │ urgency  │    │ escalation  │  │
              │ (func)   │    │ (FORM)      │  │
              └─────┬────┘    └─────────────┘  │
                    │                           │
         ┌──────────┼──────────┐               │
         │ urgent/  │ normal   │               │
         │ high     │          │               │
    ┌────▼────┐ ┌──▼──────────┐               │
    │ human-  │ │ coordinate- │               │
    │ approval│ │ ticket      │               │
    │ (FORM)  │ │ (ops-coord) │               │
    └────┬────┘ └──────┬──────┘               │
         │             │                      │
         │    ┌────────▼────────┐             │
         │    │  human-approval │             │
         │    │  (FORM)         │             │
         │    └──┬──────┬───────┘             │
         │       │      │                     │
         │       │ ┌────▼────────┐            │
         │       │ │ coordinate- │            │
         │       │ │ ticket      │            │
         │       │ │ (revision)  │            │
         │       │ └─────────────┘            │
         │       │                            │
         └───────┼────────────────────────────┘
                 │ approved
          ┌──────▼──────┐
          │ resolve-    │
          │ ticket      │
          │ (resolution │
          │  -advisor)  │
          └──────┬──────┘
                 │
          ┌──────▼──────┐
          │ update-     │
          │ ticket-     │
          │ record      │
          │ (function)  │
          └──────┬──────┘
                 │
             ┌───▼───┐
             │  END  │
             └───────┘
```

### 6.4 Workflow Graph: urgent-dispatch

```
                    ticket INSERT/UPDATE trigger
                              │
                    ┌─────────▼─────────┐
                    │  classify_urgent   │
                    │  (request-         │
                    │   classifier)      │
                    └─────────┬─────────┘
                              │
                     ┌────────▼────────┐
                     │ route_classifica│
                     │ tion (DECISION) │
                     └──┬──────────┬───┘
                        │          │
              classified │          │ unparseable/needs_review
                   ┌─────▼────┐    │
                   │ check_   │    │
                   │ urgency  │    │
                   │ (func)   │    │
                   └─────┬────┘    │
                         │         │
                  ┌──────▼──────┐  │
                  │ route_urgency│  │
                  │ (DECISION)  │  │
                  └──┬──────┬───┘  │
                     │      │      │
               is_urgent │  ┌─┴──────────────┐
                   ┌─────▼┐ │ end (not urgent)│
                   │suggest│ └────────────────┘
                   │ tech  │
                   │(tech- │
                   │suggester)
                   └─────┬─┘
                         │
                  ┌──────▼──────┐
                  │ route_tech  │
                  │ (DECISION)  │
                  └──┬──────┬───┘
                     │      │
                found│      │ not_found
            ┌────────▼┐ ┌───▼─────────┐
            │coordina-│ │ manager_    │
            │te       │ │ assignment  │
            │dispatch │ │ (FORM)      │
            │(ops-    │ └───┬─────────┘
            │coord)   │     │
            └────┬────┘     │
                 │          │
          ┌──────▼──────┐   │
          │ route_after │   │
          │ (DECISION)  │   │
          └──┬──────┬───┘   │
             │      │       │
      auto ┌─▼──┐ ┌─▼─────┐ │
           │fina│ │final  │ │
           │lize│ │manual │ │
           │auto│ │(func) │ │
           └─┬──┘ └─┬─────┘ │
             │      │       │
         ┌───▼──┐ ┌─▼───┐ ┌─▼────────────┐
         │ END  │ │ END │ │ human_       │
         └──────┘ └─────┘ │ escalation   │
                          │ (FORM)       │
                          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │ finalize_    │
                          │ escalation   │
                          │ (function)   │
                          └──────┬───────┘
                                 │
                             ┌───▼───┐
                             │  END  │
                             └───────┘
```

### 6.5 Workflow Graph: dispute-resolution

```
                  disputes INSERT/UPDATE trigger
                              │
                    ┌─────────▼─────────┐
                    │   analyze_dispute  │
                    │   (resolution-     │
                    │    advisor)        │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  route_analysis   │
                    │  (DECISION)       │
                    └──┬──┬──┬──┬──┬────┘
                       │  │  │  │  │
         ┌─────────────┘  │  │  │  └──────────┐
         │                │  │  │             │
   ready_for_review       │  │  │    blocked  │
         │           safety  │  │ insufficient│
    ┌────▼────┐      escalate│  │            │
    │check_   │      ┌───────┘  │            │
    │confidenc│      │          │            │
    │(DECISION)      │    ┌────┘            │
    └──┬──────┬┘     │    │                 │
       │      │      │    │                 │
  conf │      │<0.7  │    │                 │
  >=0.7│      │      │    │                 │
   ┌───▼┐ ┌──▼──────┐│┌───▼────┐  ┌───────▼┐
   │appl│ │human    │││notify  │  │human_  │
   │y   │ │approval │││ops_mgr │  │escalat │
   │reso│ │(FORM)   │││(FORM)  │  │ion     │
   │lut │ └──┬──────┘│└────────┘  │(FORM) │
   │ion │    │       │            └───────┘
   └──┬──┘  ┌─▼─────┐│
      │     │route_ │││
      │     │approva│││
      │     │(DECIS) │││
      │     └──┬──┬──┘││
      │        │  │   ││
      │   appr │  │rej││
      │    ┌───▼┐ ┌▼──▼┘
      │    │appl│ │retu│
      │    │y   │ │rn  │
      └►─┐ │reso│ │to  │
         │ │lut │ │advi│
         │ │ion │ │sor │
         │ └──┬─┘ └──┬─┘
         │    │      │
         └────┼──────┘
            ┌─▼──┐
            │ END│
            └────┘
```

### 6.6 Retry & Idempotency Policies

Active workflows define retry policies:

```json
{
  "retry_policy": {
    "max_retries": 3,
    "initial_delay_ms": 2000,
    "backoff_multiplier": 2,
    "max_delay_ms": 30000,
    "retryable_errors": ["timeout", "transient", "workload_error"]
  },
  "idempotency": {
    "key_source": "trigger.metadata.record_id",
    "ttl_seconds": 86400
  }
}
```

---

## 7. Security Architecture

### 7.1 Authentication

ResQAI uses Lemma platform OAuth for authentication with environment-specific behavior:

**Production:**
1. User navigates to app
2. App detects no valid token → redirect to `https://lemma.work/auth`
3. OAuth provider authenticates (Google, Microsoft, or Lemma-native)
4. Callback returns auth token → stored in `LemmaClient`
5. Token attached to all subsequent SDK calls

**Local development:**
1. Developer runs `lemma token` at CLI
2. Pastes token into `.env` as `VITE_LEMMA_TOKEN`
3. Dev script injects token into `window.__LEMMA_CONFIG__`
4. `LemmaClient` initializes with token, bypassing OAuth redirect

### 7.2 Authorization (RBAC)

**Role Hierarchy (8 seeded roles):**

```
super_admin (full system access)
  └── admin (broad management)
       └── manager (team oversight)
            ├── agent (ticket handling)
            ├── technician (work orders)
            └── dispatcher (scheduling/routing)
       └── customer (self-service portal)
       └── viewer (read-only reporting)
```

**Frontend Guards (`shared/src/permissions/`):**

| Guard | Purpose |
|---|---|
| `RoleGuard` | Restrict by role membership (any/all mode) |
| `PermissionGuard` | Restrict by resource+action (create/read/update/delete/manage) |
| `FeatureGuard` | Toggle features by feature flag + app context |
| `ApplicationGuard` | Multi-app gateway (any/all mode) |

**Database-level RBAC:**
`role_permissions_v2` maps role_id → resource → action → scope

### 7.3 Agent Permissions

Each agent has a `permissions.json` granting explicit access to tables (read/write), functions (execute), and connectors (use). Example from `request-classifier`:

```json
{
  "grants": [
    { "resource_name": "technicians", "resource_type": "datastore_table",
      "permission_ids": ["datastore.record.read", "datastore.table.read"] },
    { "resource_name": "tickets", "resource_type": "datastore_table",
      "permission_ids": ["datastore.record.read", "datastore.record.write", "datastore.table.read"] },
    { "resource_name": "facebook", "resource_type": "connector",
      "permission_ids": ["connector.use"] },
    { "resource_name": "instagram", "resource_type": "connector",
      "permission_ids": ["connector.use"] }
  ]
}
```

### 7.4 Audit Trail

All mutations go through `logOperation()` which writes to `operations_log`:

```
operations_log
├── id        UUID       PK
├── action    TEXT       "classify_ticket", "draft_reply", "approve_draft"
├── result    TEXT       "Success", "Failed: reason"
├── timestamp TIMESTAMPTZ
├── actor     TEXT       "human", "request-classifier", "workflow:ticket-intake"
└── created_at TIMESTAMPTZ
```

The `audit_log_v2` table provides full entity-level audit with before/after state snapshots:

```
audit_log_v2
├── id              UUID
├── entity_type     TEXT       "ticket", "dispute", "account"
├── entity_id       UUID
├── action          TEXT       "create", "update", "delete"
├── actor_type      TEXT       "user", "agent", "system"
├── actor_id        UUID
├── previous_state  JSONB      Snapshot before change
├── new_state       JSONB      Snapshot after change
├── changed_fields  TEXT[]     List of modified columns
├── ip_address      TEXT
├── user_agent      TEXT
└── correlation_id  UUID       Trace ID linking related changes
```

### 7.5 Security Boundaries

| Layer | Security Measure |
|---|---|
| Network | Lemma platform manages TLS, network isolation |
| Authentication | Lemma OAuth with token-based session management |
| Authorization | RBAC via role_permissions_v2 + frontend guards |
| Agent Access | Per-agent `permissions.json` grants |
| Function Access | Per-function `function.json` grants |
| Audit | `operations_log` + `audit_log_v2` for all mutations |
| Secrets | `.env` files gitignored; tokens never committed |
| Input Validation | JSON Schema validation on all agent/function I/O |

---

## 8. Deployment Architecture

### 8.1 Current Status

**Infrastructure is not yet configured.** The `infrastructure/` directory is reserved for future Docker and cloud provisioning. Applications build to static bundles ready for hosting.

### 8.2 Build Artifacts

| Application | Build Output | Type |
|---|---|---|
| support-queue | `apps/support-queue/dist/` | Static HTML/CSS/JS |
| crm-tracker | `apps/crm-tracker/dist/` | Static HTML/CSS/JS |
| ops-dashboard | `apps/ops-dashboard/dist/` | Static HTML/CSS/JS |
| appointment-board | `apps/appointment-board/dist/` | Static HTML/CSS/JS |
| resolution-center | `apps/resolution-center/dist/` | Static HTML/CSS/JS |

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
Trigger: push/PR to main
Jobs:
  1. Setup: Node 22, Python 3.13
  2. Install: npm ci, pip install pytest pydantic
  3. Type-check: tsc --noEmit (root + 5 apps)
  4. Test: vitest + pytest
  5. Build: vite build (all 5 apps)
```

### 8.4 Environment Configuration

```env
# Lemma Platform Connection
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.work
VITE_LEMMA_AUTH_URL=https://lemma.work/auth
VITE_LEMMA_APP_ID=
VITE_LEMMA_CLIENT_ID=
VITE_LEMMA_TOKEN=

# Feature Flags
VITE_ENABLE_HEALTH_SCAN=true
VITE_ENABLE_SLIPPING_ALERTS=true
VITE_ENABLE_COORDINATOR=true

# Server
PORT=5173
LOG_LEVEL=info
```

### 8.5 Target Deployment Architecture (Future State)

```
┌──────────────────────────────────────────────────────────────┐
│                       CDN / Static Hosting                   │
│                                                              │
│  support-queue.example.com  │  crm-tracker.example.com       │
│  ops-dashboard.example.com  │  appointment-board.example.com │
│  resolution-center.example.com                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Lemma SDK (browser → platform)
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                      Lemma Pod Cloud                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐   │
│  │ Agent Runtime│  │ Function    │  │ Data Store         │   │
│  │ (LLM)       │  │ Runtime     │  │ (Tables + RLS)     │   │
│  └─────────────┘  │ (Python 3.13)│  └────────────────────┘   │
│                   └─────────────┘                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Workflow Engine (trigger + orchestrate + retry)      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Connectors (Gmail, Facebook, Instagram, Discord,     │    │
│  │ Reddit, SMS, Email)                                  │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Sequence Diagrams

### 9.1 Ticket Classification Flow

```
User                  React App              SDK (lemma-sdk.ts)       Lemma Pod
 │                       │                         │                    │
 │  Click "Classify"    │                         │                    │
 │─────────────────────►│                         │                    │
 │                      │                         │                    │
 │                      │  runAgent('request-     │                    │
 │                      │    classifier',         │                    │
 │                      │    {ticket_id})         │                    │
 │                      │────────────────────────►│                    │
 │                      │                         │  Agent Execute     │
 │                      │                         │──────────────────►│
 │                      │                         │                    │
 │                      │                         │   ┌──────────────┐ │
 │                      │                         │   │ Read ticket,  │ │
 │                      │                         │   │ technicians   │ │
 │                      │                         │   │ LLM analyze   │ │
 │                      │                         │   │ Write fields  │ │
 │                      │                         │   └──────────────┘ │
 │                      │                         │                    │
 │                      │  return convId          │  Agent Complete    │
 │                      │◄────────────────────────│◄──────────────────│
 │                      │                         │                    │
 │                      │  waitForAgentResponse() │                    │
 │                      │  (poll every 1.5s)      │                    │
 │                      │────────────────────────►│                    │
 │                      │                         │  Poll messages     │
 │                      │                         │──────────────────►│
 │                      │                         │◄──────────────────│
 │                      │  return parsed JSON     │                    │
 │                      │◄────────────────────────│                    │
 │                      │                         │                    │
 │                      │  updateRecord(ticket,   │                    │
 │                      │    {request_type,       │                    │
 │                      │     urgency, status})   │                    │
 │                      │────────────────────────►│──────────────────►│
 │                      │                         │                    │
 │                      │  logOperation(          │                    │
 │                      │    'classify_ticket')   │                    │
 │                      │────────────────────────►│──────────────────►│
 │                      │                         │                    │
 │  UI updates with    │                         │                    │
 │  classification     │                         │                    │
 │◄────────────────────│                         │                    │
```

### 9.2 Urgent Dispatch End-to-End

```
Workflow Engine          request-classifier       tech-suggester       operations-coordinator
     │                         │                      │                      │
     │  ticket INSERT/UPDATE   │                      │                      │
     │  triggers workflow      │                      │                      │
     ├────────────────────────►│                      │                      │
     │                         │                      │                      │
     │  classify_urgent        │                      │                      │
     │◄────────────────────────│                      │                      │
     │                         │                      │                      │
     ├──DECISION route_classification──►               │                      │
     │                         │                      │                      │
     ├──FUNCTION check_urgency─►                       │                      │
     │                         │                      │                      │
     ├──DECISION route_urgency─►                       │                      │
     │                         │                      │                      │
     │  suggest_tech           │                      │                      │
     ├───────────────────────────────────────────────►│                      │
     │◄────────────────────────────────────────────────│                      │
     │                         │                      │                      │
     ├──DECISION route_tech───►                        │                      │
     │                         │                      │                      │
     │  coordinate_dispatch    │                      │                      │
     ├─────────────────────────────────────────────────────────────────────►│
     │◄─────────────────────────────────────────────────────────────────────│
     │                         │                      │                      │
     ├──DECISION route_after_coordinate──►              │                      │
     │                         │                      │                      │
     │  finalize_dispatch      │                      │                      │
     │  (FUNCTION)             │                      │                      │
     │◄────────────────────────│──────────────────────│──────────────────────│
     │                         │                      │                      │
     │  END                    │                      │                      │
     │                         │                      │                      │
```

### 9.3 Dispute Resolution with Human-in-the-Loop

```
Workflow Engine         resolution-advisor       Human (FORM)       resolve_dispute (func)
     │                        │                      │                      │
     │  disputes INSERT       │                      │                      │
     │  triggers workflow     │                      │                      │
     ├──────────────────────►│                      │                      │
     │                        │                      │                      │
     │  analyze_dispute       │                      │                      │
     │◄──────────────────────│                      │                      │
     │                        │                      │                      │
     ├──DECISION route_analysis──►                    │                      │
     │                        │                      │                      │
     ├──DECISION check_confidence──►                  │                      │
     │                        │                      │                      │
     │  confidence >= 0.7     │                      │                      │
     │───────────────────────────────────────────────────────────────────►│
     │                        │                      │                      │
     │  apply_resolution      │                      │                      │
     │◄───────────────────────────────────────────────────────────────────│
     │                        │                      │                      │
     ├─── END ────────────────►                      │                      │
     │                        │                      │                      │
     │  --- OR ---            │                      │                      │
     │                        │                      │                      │
     │  confidence < 0.7     │                      │                      │
     ├─────────────────────────────────────────────►│                      │
     │                        │                      │                      │
     │  human_approval (FORM) │                      │                      │
     │◄─────────────────────────────────────────────│                      │
     │                        │                      │                      │
     ├──DECISION route_approval──►                   │                      │
     │                        │                      │                      │
     │  approved = true       │                      │                      │
     │───────────────────────────────────────────────────────────────────►│
     │                        │                      │                      │
     │  apply_resolution      │                      │                      │
     │◄───────────────────────────────────────────────────────────────────│
     │                        │                      │                      │
     │  END                   │                      │                      │
     │                        │                      │                      │
```

### 9.4 Account Health Nightly Scan

```
CRON Trigger (2AM)     flag_slipping_followups   account_health_scan   account-health-monitor   create_tasks
     │                        │                        │                      │                    │
     │  trigger               │                        │                      │                    │
     ├──────────────────────►│                        │                      │                    │
     │                        │                        │                      │                    │
     │  Flag Overdue/         │                        │                      │                    │
     │  Due Followups         │                        │                      │                    │
     │◄──────────────────────│                        │                      │                    │
     │                        │                        │                      │                    │
     ├──────────────────────────────────────────────►│                      │                    │
     │                        │                        │                      │                    │
     │  Compute Health        │                        │                      │                    │
     │  Scores per Account    │                        │                      │                    │
     │◄──────────────────────────────────────────────│                      │                    │
     │                        │                        │                      │                    │
     ├────────────────────────────────────────────────────────────────────►│                    │
     │                        │                        │                      │                    │
     │  Analyze Results +     │                        │                      │                    │
     │  Generate Tasks        │                        │                      │                    │
     │◄────────────────────────────────────────────────────────────────────│                    │
     │                        │                        │                      │                    │
     ├──DECISION route by coordination_status──►        │                      │                    │
     │                        │                        │                      │                    │
     │  If crisis → notify manager (FORM)              │                      │                    │
     │  Else → create_tasks                             │                      │                    │
     ├──────────────────────────────────────────────────────────────────────────────────────────►│
     │                        │                        │                      │                    │
     │◄──────────────────────────────────────────────────────────────────────────────────────────│
     │                        │                        │                      │                    │
     │  END                   │                        │                      │                    │
```

---

## 10. Dependency Graphs

### 10.1 Package Dependency Graph

```
ResQAI (root workspace)
│
├── apps/
│   ├── support-queue ──────┐
│   ├── crm-tracker ────────┤
│   ├── ops-dashboard ──────┤
│   ├── appointment-board ──┤
│   └── resolution-center ──┤
│                            │
├── shared/ (@resqai/foundation)
│   ├── src/api/             │
│   ├── src/components/      │
│   ├── src/design-system/   │
│   ├── src/events/          │
│   ├── src/layouts/         │
│   ├── src/navigation/      │
│   ├── src/permissions/     │
│   ├── src/state/           │
│   └── src/utils/           │
│                            │
├── packages/                │
│   ├── sdk/ ────────────────┤── lemma-sdk (external)
│   ├── config/ ─────────────┤
│   ├── types/ ──────────────┤
│   ├── utils/ ──────────────┤
│   └── ui/ ─────────────────┘
│
├── agents/                  │── (Lemma Pod — no npm deps)
├── functions/               │── pydantic, lemma-sdk (Python)
├── workflows/               │── (JSON config — no code deps)
└── scripts/                 │── tsx, vite, vitest
```

### 10.2 Application-to-Agent Dependency

```
support-queue ───── request-classifier
                └── support-reply-drafter

crm-tracker ─────── account-health-monitor
                └── account_health_scan (function)
                └── flag_slipping_followups (function)

ops-dashboard ───── operations-coordinator
                └── check_ticket_urgency (function)
                └── finalize_dispatch (function)

appointment-board ── operations-coordinator
                 └── tech-suggester

resolution-center ── resolution-advisor
                 └── resolve_dispute (function)
```

### 10.3 Workflow-to-Agent/Function Dependency

```
ticket-intake
  ├── request-classifier          (agent)
  ├── check_ticket_urgency        (function)
  ├── operations-coordinator      (agent)
  ├── resolution-advisor          (agent)
  └── update_ticket_record        (function)

urgent-dispatch
  ├── request-classifier          (agent)
  ├── check_ticket_urgency        (function)
  ├── tech-suggester              (agent)
  ├── operations-coordinator      (agent)
  └── finalize_dispatch           (function)

dispute-resolution
  ├── resolution-advisor          (agent)
  └── resolve_dispute             (function)

account-health
  ├── flag_slipping_followups     (function)
  ├── account_health_scan         (function)
  ├── account-health-monitor      (agent)
  └── create_followup_tasks       (function)

daily-standup
  ├── operations-coordinator      (agent)
  └── create_operations_tasks     (function)

followup-slippage-detector
  ├── flag_slipping_followups     (function)
  ├── operations-coordinator      (agent)
  └── finalize_slippage_review    (function)

customer-satisfaction-monitor
  ├── collect_resolved_tickets    (function)
  ├── operations-coordinator      (agent)
  ├── resolution-advisor          (agent)
  └── update_ticket_record        (function)

support-escalation-manager
  ├── request-classifier          (agent)
  ├── operations-coordinator      (agent)
  ├── resolution-advisor          (agent)
  └── update_ticket_record        (function)

appointment-reminders
  ├── fetch_upcoming_appointments (function)
  ├── support-reply-drafter       (agent)
  └── dispatch_notifications      (function)
```

---

## 11. Navigation Graphs

### 11.1 Application Routing Diagram

```
                    ┌──────────────────────────────────────┐
                    │          Application Switcher         │
                    │  (top navigation bar — all apps)      │
                    └──┬───┬───┬───┬───┬───────────────────┘
                       │   │   │   │   │
          ┌────────────┘   │   │   │   └──────────────┐
          ▼                ▼   ▼   ▼                  ▼
   ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │  Support   │  │   CRM    │  │   Ops    │  │ Appointment  │
   │  Queue     │  │  Tracker │  │ Dashboard│  │ Board        │
   └────────────┘  └──────────┘  └──────────┘  └──────────────┘
   ┌──────────────┐
   │ Resolution   │
   │ Center       │
   └──────────────┘
```

### 11.2 Support Queue Navigation

```
/ (Support Queue)
├── /                        Dashboard — ticket list (urgency-sorted)
│   ├── Table columns:       customer, channel, subject, urgency, status, created
│   ├── Actions:             Classify (AI), Draft Reply (AI), Approve, Send, Close
│   └── Filters:             status, urgency, channel, date range
│
├── /ticket/:id              Ticket Detail
│   ├── Summary panel:       customer, channel, subject, message, classification
│   ├── Action panel:        Classify, Draft Reply, Approve, Send, Close
│   ├── History panel:       status changes, timestamps, audit log
│   └── Draft panel:         AI-generated draft, editable textarea, approve/reject
│
└── Shared components:
    ├── StatusBadge          Color-coded by status (new/classified/drafted/sent/closed)
    ├── UrgencyBadge         Color-coded by urgency (low/normal/high/urgent)
    └── SearchBar            Full-text search across tickets
```

### 11.3 CRM Tracker Navigation

```
/ (CRM Tracker)
├── /                        Dashboard — account list with health indicators
│   ├── Health Score bar:    healthy (green), watch (yellow), slipping (orange), critical (red)
│   ├── Actions:             Run Health Scan, View Slipping Followups
│   └── Filters:             health status, relationship_status, date range
│
├── /account/:id             Account Detail
│   ├── Summary panel:       customer info, revenue, lifetime jobs
│   ├── Health panel:        score breakdown, trend, risk signals
│   ├── Followups panel:     pending/in-progress/completed followups
│   └── Actions:             Schedule Followup, Run Health Scan
│
└── Shared components:
    ├── HealthBadge          Color by health bucket
    ├── FollowupList         Sorted by severity (critical/high/medium/low)
    └── SlippageAlert        Red banner for overdue items
```

### 11.4 Ops Dashboard Navigation

```
/ (Ops Dashboard)
├── /                        Dashboard — KPI overview
│   ├── KPI cards:           open tickets, today's appointments, overdue followups
│   ├── Actions:             Run Coordinator, View Urgent Dispatches
│   └── Coordinator panel:   AI recommendations (max 8), create tasks
│
├── /dispatch/:id            Dispatch Detail
│   └── Dispatch info:       ticket, technician, status, timeline
│
└── Shared components:
    ├── KpiCard              Metric display with trend indicator
    ├── RecommendationList   Prioritized action items from coordinator
    └── DispatchTimeline     Visual timeline of dispatch events
```

### 11.5 Appointment Board Navigation

```
/ (Appointment Board)
├── /                        Board — grouped by status
│   ├── Sections:            scheduled, in_progress, completed, needs_followup, cancelled
│   ├── Appointment cards:   customer, service_type, date, technician
│   ├── Actions:             Suggest Tech (AI), Assign, Complete, Cancel
│   └── Filters:             date range, technician, service type
│
├── /appointment/:id         Appointment Detail
│   ├── Customer info
│   ├── Technician info
│   ├── Service details:     type, date, duration, notes
│   └── Actions:             Assign Tech, Complete, Cancel
│
└── Shared components:
    ├── AppointmentCard      Draggable card with status indicator
    ├── TechnicianSelect     AI-suggested + manual dropdown
    └── GroupHeader          Status group label with count
```

### 11.6 Resolution Center Navigation

```
/ (Resolution Center)
├── /                        Dashboard — dispute list
│   ├── Table columns:       customer, appointment, status, confidence, recommended resolution
│   ├── Actions:             Analyze (AI), Approve, Reject, Escalate
│   └── Filters:             status, date range, confidence range
│
├── /dispute/:id             Dispute Detail
│   ├── Evidence panel:      customer claim, provider claim, evidence summary
│   ├── Recommendation card: AI recommendation, confidence, reason
│   ├── Actions:             Analyze, Approve, Reject, Escalate Legal
│   └── Notes panel:         human notes, audit trail
│
└── Shared components:
    ├── EvidenceCard         Side-by-side claim comparison
    ├── RecommendationBadge  Color by resolution type
    └── ConfidenceBar        Visual confidence indicator
```

---

## 12. System Graphs

### 12.1 Full System Architecture Graph

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                PRESENTATION LAYER                                      │
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                          @resqai/foundation (shared/)                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│   │
│  │  │ Design   │ │Components│ │ Layouts  │ │Navigation│ │  Events  │ │  State   ││   │
│  │  │ System   │ │          │ │          │ │          │ │ EventBus │ │ Contexts ││   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │   │
│  │  │ Perms    │ │   Utils  │ │  Config  │ │   SDK    │ │  Types   │             │   │
│  │  │ Guards   │ │          │ │          │ │ Wrapper  │ │          │             │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │   │
│  └───────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌──────────────────┐ ┌────────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐   │
│  │   Support Queue  │ │  CRM Tracker   │ │ Ops Dash   │ │ Appt Board │ │Res Center│   │
│  │   React + Vite   │ │  React + Vite  │ │ React+Vite │ │React+Vite  │ │React+Vite│   │
│  └────────┬─────────┘ └───────┬────────┘ └──────┬─────┘ └──────┬─────┘ └────┬────┘   │
│           │                   │                 │              │            │        │
│           └───────────────────┴─────────────────┴──────────────┴────────────┘        │
│                                                                                       │
│           Lemma SDK (lemma-sdk.js) — Browser → Platform communication                │
└───────────────────────────────────┬───────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────────────────────┐
│                              LEMMA POD PLATFORM                                        │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          WORKFLOW ENGINE                                        │   │
│  │                                                                                 │   │
│  │  ticket-intake ──── urgent-dispatch ──── dispute-resolution ─────────────────── │   │
│  │  account-health ──── daily-standup ──── followup-slippage-detector ──────────── │   │
│  │  support-escalation ── customer-satisfaction ── appointment-reminders ───────── │   │
│  │                                                                                 │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                                    │
│  ┌──────────────┐    ┌──────────────┴─────────┐    ┌──────────────────┐                │
│  │  AI AGENTS   │    │   PYTHON FUNCTIONS      │    │  DATABASE TABLES │                │
│  │              │    │   (66 serverless)        │    │  (41 tables)     │                │
│  │ request-     │    │                         │    │                  │                │
│  │   classifier │    │ account_health_scan     │    │ customers_v2     │                │
│  │ support-     │    │ flag_slipping_followups │    │ technicians_v2   │                │
│  │   reply-     │    │ check_ticket_urgency    │    │ tickets_v2       │                │
│  │   drafter    │    │ create_appointment      │    │ appointments_v2  │                │
│  │ operations-  │    │ dispatch_notifications  │    │ accounts_v2      │                │
│  │   coordinator│    │ resolve_dispute         │    │ disputes_v2      │                │
│  │ resolution-  │    │ validate_session        │    │ tasks_v2         │                │
│  │   advisor    │    │ create_user             │    │ notifications_v2 │                │
│  │ account-     │    │ authenticate_user       │    │ audit_log_v2     │                │
│  │   health-    │    │ assign_user_role        │    │ events_v2        │                │
│  │   monitor    │    │ list_permissions        │    │ + 30 more        │                │
│  │ tech-        │    │ create_role             │    │                  │                │
│  │   suggester  │    │ manage_permission       │    │                  │                │
│  └──────────────┘    └─────────────────────────┘    └──────────────────┘                │
│                                    │                                                    │
│  ┌─────────────────────────────────┴─────────────────────────────────────────┐          │
│  │                          CONNECTORS                                       │          │
│  │  Gmail │ Facebook │ Instagram │ Discord │ Reddit │ SMS │ Email (SMTP)    │          │
│  └───────────────────────────────────────────────────────────────────────────┘          │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Data Flow Graph

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────>│  React   │────>│ Service  │────>│  Lemma   │────>│ Platform │
│  Action  │     │ Component│     │ Layer    │     │  SDK     │     │  Pod     │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └─────┬────┘
      ▲                                                                     │
      │                           ┌─────────────┐                          │
      │                           │   React     │     ┌──────────┐          │
      │                           │   State /   │◄────│ Platform │◄────────┘
      │                           │   Context   │     │ Response │
      │                           └─────────────┘     └──────────┘
      │
      │                           ┌─────────────┐
      └───────────────────────────│  UI Re-     │
                                  │  render     │
                                  └─────────────┘

  Mutations additionally:
  1. Call logOperation() → writes to operations_log
  2. Write to audit_log_v2 with before/after snapshots
  3. Generate events_v2 entry for workflow triggers
```

### 12.3 Agent Communication Graph

```
                        ┌─────────────────────────┐
                        │     Connectors Layer     │
                        │                         │
                        │  Facebook   Instagram   │◄──request-classifier
                        │  Gmail                  │◄──support-reply-drafter
                        │  Discord                │◄──operations-coordinator
                        │                         │    account-health-monitor
                        │  Reddit                 │◄──support-reply-drafter
                        │                         │    resolution-advisor
                        └──────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
  ┌──────▼──────┐          ┌───────▼───────┐          ┌──────▼──────┐
  │  Functions  │          │    Agent       │          │   Tables    │
  │  Layer      │◄────────┤  Runtime       │◄────────┤  Layer      │
  │             │          │  (LLM)        │          │             │
  │ account_    │          │                │          │ tickets_v2  │
  │ health_scan │          │  Reads tables, │          │ accounts_v2 │
  │ flag_       │          │  writes tables,│          │ customers_v2│
  │ slipping_   │          │  calls funcs,  │          │ technicians │
  │ followups   │          │  uses conns    │          │ disputes_v2 │
  │ check_      │          │                │          │ tasks_v2    │
  │ ticket_     │          │                │          │ followups_v2│
  │ urgency     │          │                │          │ operations  │
  └─────────────┘          └────────────────┘          │ _log       │
                                                       └─────────────┘
```

### 12.4 Workflow-Trigger-Dependency Graph

```
                    WORKFLOW              TRIGGER              DEPENDENCIES
                    ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐
                    │ ticket-  │◄───│ ticket.created   │◄───│ request-classifier│
                    │ intake   │    │ (DATASTORE_EVENT)│    │ check_ticket_urg. │
                    └──────────┘    └──────────────────┘    │ ops-coordinator   │
                                                            │ resolution-advisor│
                    ┌──────────┐    ┌──────────────────┐    │ update_ticket_rec.│
                    │ urgent-  │◄───│ tickets INSERT/  │    └──────────────────┘
                    │ dispatch │    │ UPDATE           │    ┌──────────────────┐
                    └──────────┘    │ (DATASTORE_EVENT)│    │ request-classifier│
                                    └──────────────────┘    │ tech-suggester   │
                    ┌──────────┐    ┌──────────────────┐    │ ops-coordinator  │
                    │ dispute- │◄───│ disputes INSERT/ │    │ finalize_dispatch │
                    │ resolut  │    │ UPDATE           │    └──────────────────┘
                    └──────────┘    │ (DATASTORE_EVENT)│    ┌──────────────────┐
                                    └──────────────────┘    │ resolution-advisor│
                    ┌──────────┐    ┌──────────────────┐    │ resolve_dispute  │
                    │ account- │◄───│ CRON 0 2 * * *  │    └──────────────────┘
                    │ health   │    │ (SCHEDULED)      │    ┌──────────────────┐
                    └──────────┘    └──────────────────┘    │ flag_slipping_   │
                                                            │ account_health_  │
                    ┌──────────┐    ┌──────────────────┐    │ account-health-  │
                    │ daily-   │◄───│ CRON 0 8 * * 1-5│    │ create_followup  │
                    │ standup  │    │ (SCHEDULED)      │    └──────────────────┘
                    └──────────┘    └──────────────────┘    ┌──────────────────┐
                                                            │ ops-coordinator  │
                    ┌──────────┐    ┌──────────────────┐    │ create_ops_tasks │
                    │followup- │◄───│ CRON */30 * * * *│    └──────────────────┘
                    │slippage  │    │ (SCHEDULED)      │    ┌──────────────────┐
                    └──────────┘    └──────────────────┘    │ flag_slipping_   │
                                                            │ ops-coordinator  │
                    ┌──────────┐    ┌──────────────────┐    │ finalize_slippage│
                    │ customer │◄───│ CRON 0 8 * * *  │    └──────────────────┘
                    │ satis-   │    │ (SCHEDULED)      │    ┌──────────────────┐
                    │ faction  │    └──────────────────┘    │ collect_resolved │
                    └──────────┘                            │ ops-coordinator  │
                                                            │ resolution-advisor│
                    ┌──────────┐    ┌──────────────────┐    └──────────────────┘
                    │ support- │◄───│ tickets UPDATE   │    ┌──────────────────┐
                    │ escalat  │    │ (DATASTORE_EVENT)│    │ request-classifier│
                    └──────────┘    └──────────────────┘    │ ops-coordinator  │
                                                            │ resolution-advisor│
                    ┌──────────┐    ┌──────────────────┐    └──────────────────┘
                    │ appt-    │◄───│ CRON 0 7 * * *  │    ┌──────────────────┐
                    │ reminders│    │ + appt events    │    │ fetch_upcoming_  │
                    └──────────┘    └──────────────────┘    │ support-reply-   │
                                                            │ dispatch_notif.  │
                                                            └──────────────────┘
```

---

## Appendix A: Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Backend Architecture** | No traditional API server | Lemma platform provides auth, data, compute, AI, and workflow — eliminate middleware |
| **Frontend Framework** | React 18 + Vite 8 | Fast dev experience, widespread ecosystem, static hosting |
| **Agent Runtime** | Lemma agent runtime (config-driven) | No agent-specific code to maintain; behavior evolves via prompts |
| **Function Runtime** | Python serverless (Lemma) | Deterministic logic with strong typing via Pydantic |
| **Data Layer** | Lemma tables (JSONB + SQL-like) | No database server to manage; schema evolves via CLI |
| **Auth** | Lemma OAuth + CLI tokens | Zero custom auth code; platform handles tokens, sessions, redirects |
| **Permissions** | RBAC with role_permissions_v2 + per-agent grants | Consistent authorization model across apps, agents, and functions |
| **Event System** | Client-side EventBus + server-side events_v2 tables + DATASTORE_EVENT triggers | Simple, sufficient; no need for external message queue |
| **Workflows** | Lemma workflow engine (JSON config) | Visual DAG with typed nodes, retry, idempotency, human-in-the-loop |
| **Monorepo** | npm workspaces | Shared types, config, SDK across 5 apps without duplication |

## Appendix B: Architecture Principles

1. **Configuration over code** — Agent behavior, workflow logic, and permissions are defined in config files, not code
2. **Human-in-the-loop** — AI produces drafts; humans approve and execute
3. **Idempotent by design** — All agents and functions safe to re-run without side effects
4. **Single source of truth** — Types, config, and SDK shared across all apps from `packages/`
5. **Consistent patterns** — Every app, agent, function, and workflow follows the same structure
6. **Audit everything** — Every mutation logged to `operations_log` and `audit_log_v2`
7. **Least privilege** — Per-agent and per-function grants limited to required resources only
8. **Deterministic functions** — Python functions produce same output for same input, fully testable

## Appendix C: Glossary

| Term | Definition |
|---|---|
| **Lemma Pod** | The platform runtime providing data store, agent execution, function execution, workflow engine, auth, and connectors |
| **Agent** | AI-powered workflow node — reads tables, calls functions/connectors, writes tables |
| **Function** | Deterministic Python serverless function — stateless, testable, no AI |
| **Workflow** | Directed acyclic graph (DAG) of agent/function/DECISION/FORM/END nodes with triggers |
| **SDK** | Browser-side `LemmaClient` wrapper — `@resqai/foundation` package |
| **Connector** | Third-party integration (Gmail, Facebook, Discord, SMS, etc.) |
| **FORM** | Human-in-the-loop pause point — displays data and awaits human input |
| **DECISION** | Conditional routing node — evaluates expressions and routes to next node |
| **DATASTORE_EVENT** | Workflow trigger on table INSERT/UPDATE/DELETE |
| **SCHEDULED** | Workflow trigger on CRON schedule |
| **RLS** | Row-Level Security — not currently enabled (visibility: POD) |
