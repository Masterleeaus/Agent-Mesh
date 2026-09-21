# RESQAI V2 — Master Project Bible

> **Official Source of Truth**
> Chief Enterprise Architect
> Date: 2026-06-30
> Version: 2.0.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision](#2-vision)
3. [Goals](#3-goals)
4. [Business Scope](#4-business-scope)
5. [Architecture Overview](#5-architecture-overview)
6. [System Architecture](#6-system-architecture)
7. [Folder Structure](#7-folder-structure)
8. [Technology Stack](#8-technology-stack)
9. [Applications](#9-applications)
10. [Database](#10-database)
11. [Tables](#11-tables)
12. [Relationships](#12-relationships)
13. [Functions](#13-functions)
14. [Agents](#14-agents)
15. [Workflows](#15-workflows)
16. [Events](#16-events)
17. [Security](#17-security)
18. [Authentication](#18-authentication)
19. [Permissions](#19-permissions)
20. [Integrations](#20-integrations)
21. [Connectors](#21-connectors)
22. [Coding Standards](#22-coding-standards)
23. [Naming Standards](#23-naming-standards)
24. [Documentation Standards](#24-documentation-standards)
25. [UI Standards](#25-ui-standards)
26. [Backend Standards](#26-backend-standards)
27. [Testing Standards](#27-testing-standards)
28. [Deployment Standards](#28-deployment-standards)
29. [Risk Register](#29-risk-register)
30. [Technical Debt](#30-technical-debt)
31. [Future Roadmap](#31-future-roadmap)
32. [Implementation Roadmap](#32-implementation-roadmap)

---

## 1. Executive Summary

ResQAI is an open-source, AI-powered field-service management platform built on the [Lemma](https://lemma.work) pod architecture. It orchestrates support tickets, account health monitoring, technician scheduling, service disputes, and operations KPIs through a unified event-driven system with human-in-the-loop AI agents.

**Current Status:**
- **Health Score:** 81/100
- **Production Readiness:** 52/100
- **Risk Score:** 10/100
- **TypeScript Errors:** 0 (all 191 resolved)
- **npm Vulnerabilities:** 0
- **Test Cases:** 288+ across 66 functions, 79/79 Python tests passing

**Key Metrics:**
| Metric | Value |
|--------|-------|
| V1 Production Apps | 5 (React + Vite + TypeScript) |
| V2 Next-Gen Apps | 9 (scaffolded) |
| V2 Python Functions | 66 across 11 domains |
| V1 Agents | 6 |
| V1 Workflows | 11 (7 active, 4 draft) |
| V1 Database Tables | 9 (109 seed records) |
| V2 Database Tables | 41 (migrations defined) |
| V2 Migrations | 41 (+ 41 rollbacks) |
| Documentation Files | 100+ |
| CI/CD Pipelines | 1 (CI only) |
| Docker/Containerization | None (planned) |

---

## 2. Vision

ResQAI aims to be the definitive open-source platform for field-service operations where AI augments every decision without replacing human judgment. Technicians get dispatched intelligently, support tickets are triaged before they pile up, account health is monitored proactively, and disputes are resolved fairly with AI-assisted analysis. All data stays under your control on your own Lemma pod.

---

## 3. Goals

### Strategic Goals
1. **AI-Augmented Operations** — Every operational decision is AI-assisted but human-approved
2. **Event-Driven Automation** — All business processes are event-triggered with typed pub-sub semantics
3. **Multi-Channel Support** — Unified inbox across email, social media, chat, and phone
4. **Real-Time Visibility** — Live dashboards and notifications across all operations
5. **Self-Service Enablement** — Customer and technician portals for autonomous task management

### Quality Goals
| Goal | Target | Current |
|------|--------|---------|
| Test Coverage (Python) | 90%+ | ~85% |
| Test Coverage (TS) | 80%+ | ~70% |
| Production Readiness | 75/100 | 52/100 |
| Performance (Simple Read) | <100ms p95 | TBD |
| Performance (Write) | <200ms p95 | TBD |
| Accessibility | WCAG 2.1 AA | TBD |
| Bundle Size (App) | <500KB gzipped | TBD |

---

## 4. Business Scope

### In Scope
- **Support Ticket Management** — Multi-channel ticket intake, classification, prioritization, assignment, escalation, resolution
- **Technician Management** — Skills, availability, scheduling, dispatch
- **Appointment Management** — Booking, reminders, rescheduling, completion
- **Customer Relationship Management** — Account health scoring, follow-up tracking, satisfaction monitoring
- **Dispute Resolution** — Evidence collection, AI analysis, resolution recommendation
- **Operations Management** — Work orders, inventory, KPIs, daily standups
- **Notification Management** — Multi-channel (email, SMS, in-app, Discord) notifications
- **Analytics & Reporting** — KPI dashboards, custom reports, scheduled exports
- **User Administration** — Roles, permissions, authentication, audit logging

### Out of Scope
- **Billing/Invoicing** — No payment processing or invoice generation (planned for future phases)
- **HR/Payroll** — No employee management beyond technician profiles
- **CRM Marketing** — No marketing automation or campaign management
- **Custom Plugin System** — No plugin/extension SDK (planned for Phase 5)
- **Multi-Tenant Isolation** — Single-tenant Lemma pod per deployment (planned for Phase 5)

---

## 5. Architecture Overview

```
APPLICATIONS (React 18 + Vite)
  V1: Support Queue | CRM Tracker | Ops Dashboard
      Appointment Board | Resolution Center
  V2: Customer Portal (V2) | Technician Portal (V2)
      Support Center | CRM Center | Operations Center
      Appointment Center | Resolution Center V2
      Admin Center | Analytics Center
            |
SHARED LAYER (@resqai/foundation)
  SDK | Design System | Events | Navigation | Auth/RBAC
  State | Layouts | Utils | Permissions
            |
LEMMA POD PLATFORM
            |
  WORKFLOW LAYER (11 DAGs)
    ticket-intake → daily-standup → urgent-dispatch → ...
    (AGENT / FUNCTION / DECISION / HUMAN nodes)
            |
  AI AGENT LAYER (6 agents)
    request-classifier | support-reply-drafter
    operations-coordinator | resolution-advisor
    account-health-monitor | tech-suggester
            |
  FUNCTION LAYER (66 Python serverless)
    Support (9) | CRM (10) | Operations (12) | Appointments (8)
    Notifications (4) | Analytics (5) | Admin (9) | Auth (2)
    Disputes (3) | Technicians (4)
            |
  DATABASE LAYER (41 V2 migrations)
    Tickets | Accounts | Customers | Technicians | Appointments
    Disputes | Tasks | Followups | Ops Log | Work Orders
    Users | Roles | Inventory | Notifications | Audit Log
```

### Architecture Principles
1. **Layered Isolation** — Each layer communicates via typed contracts, never through direct coupling
2. **Event-First Execution** — All business processes start from events (table events, CRON, webhooks)
3. **AI-Drafts-Human-Approves** — Agents produce recommendations; humans make final decisions
4. **Idempotent by Design** — Re-running any operation is safe
5. **Correlation ID Propagation** — Every operation carries a trace ID through all layers
6. **Observable by Default** — Every node execution is logged with input, output, and duration
7. **Fail Closed** — Errors halt execution with logged context; no silent failures

---

## 6. System Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ V1 Apps (5) │ │ V2 Apps (9) │ │  Customer   │ │  Technician   │  │
│  │  React/Vite │ │  React/Vite │ │  Portal     │ │  Portal       │  │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └───────┬───────┘  │
│         │               │               │                │           │
│         └───────────────┴───────────────┴────────────────┘           │
│                              │  HTTPS/WebSocket                      │
├──────────────────────────────┼──────────────────────────────────────┤
│                  SHARED LAYER                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │    SDK   │ │   Types  │ │   Utils  │ │   UI     │ │   Config │  │
│  │ lemma-sdk│ │  16 I/F  │ │ date,str │ │13 comps  │ │ env,theme│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              @resqai/foundation v2.0.0                        │  │
│  │  ApiClient │ AuthMiddleware │ CacheManager │ EventBus         │  │
│  │  Design System │ Layouts │ Navigation │ Permissions │ State   │  │
│  └──────────────────────────────────────────────────────────────┘  │
├──────────────────────────────┼──────────────────────────────────────┤
│                     LEMMA POD PLATFORM                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │
│  │  Workflows   │ │    Agents    │ │  Functions   │                │
│  │    11 DAGs   │ │     6 V1     │ │   66 Python  │                │
│  │  49 planned  │ │  49 planned  │ │  serverless  │                │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘                │
│         │               │               │                           │
│         └───────────────┴───────────────┘                           │
│                              │  Event Bus                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     DATABASE LAYER                            │  │
│  │  V1: 9 tables (109 records)                                   │  │
│  │  V2: 41 tables across 6 domains                               │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │  │
│  │  │identity│ │core │ │ops  │ │billing│ │settings│metrics│     │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                     EXTERNAL INTEGRATIONS                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Gmail  │ │ Discord│ │ Twilio │ │ Reddit │ │Facebook│           │
│  │  Email │ │  Chat  │ │  SMS   │ │Research│ │Inbound │           │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘           │
│                                   ┌────────┐                       │
│                                   │Instagram│                       │
│                                   │ Inbound │                       │
│                                   └────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

1. **User Action → UI → SDK → Function → Table → Event → Workflow → Agent → Notification**
2. **External Event → Connector → Function → Table → Event → Workflow → Agent → Response**
3. **CRON Schedule → Workflow → Function Chain → Table Updates → Events → Notifications**
4. **Agent Decision → Function Call → Table Write → Event → Chained Workflow**

---

## 7. Folder Structure

```
ResQAI/
├── .github/workflows/ci.yml         # CI pipeline (Node 22 + Python 3.13)
├── .editorconfig                     # Editor settings
├── .eslintrc.json                    # ESLint config (TS + React)
├── .gitignore                        # Ignore patterns
├── .npmrc                            # legacy-peer-deps=true
├── .nvmrc                            # Node 22
├── .prettierrc                       # Prettier config
├── CHANGELOG.md                      # Release history
├── CODE_OF_CONDUCT.md                # Community standards
├── CONTRIBUTING.md                   # Contribution guide
├── FINAL_REPOSITORY_HEALTH_REPORT.md # Health audit (81/100)
├── FUNCTION_IMPLEMENTATION_REPORT.md # V2 function report
├── LICENSE                           # MIT
├── README.md                         # Project overview
├── package.json                      # Root workspace config
├── tsconfig.json                     # Root TS config
│
├── agents/                           # V1 AI agents (6)
│   ├── account-health-monitor/
│   ├── harness/                      # Agent runtime harness
│   ├── operations-coordinator/
│   ├── request-classifier/
│   ├── resolution-advisor/
│   ├── support-reply-drafter/
│   └── tech-suggester/
│
├── apps/                             # V1 frontend apps (5)
│   ├── appointment-board/            # React + Vite
│   ├── crm-tracker/
│   ├── ops-dashboard/
│   ├── resolution-center/
│   └── support-queue/
│
├── apps_v2/                          # V2 frontend apps (9 scaffolded)
│   ├── admin-center_v2/
│   ├── analytics-center_v2/
│   ├── appointment-center_v2/
│   ├── crm-center_v2/
│   ├── customer-portal_v2/
│   ├── operations-center_v2/
│   ├── resolution-center_v2/
│   ├── support-center_v2/
│   └── technician-portal_v2/
│
├── database/                         # Database definitions
│   ├── functions_v2/                 # (reserved)
│   ├── lookup_data/                  # 5 JSON config files
│   ├── migrations/                   # V1 migrations
│   ├── migrations_v2/                # 41 V2 migrations
│   ├── rollbacks_v2/                 # 41 V2 rollbacks
│   ├── seeds/                        # V1 seed data (11 JSON)
│   └── seeds_v2/                     # V2 seed data (4 JSON)
│
├── docs/                             # Documentation suite
│   ├── connectors/
│   ├── devops/
│   ├── security/
│   ├── testing/
│   ├── v2/realtime/                  # 7 realtime docs
│   ├── v2/standards/                 # 10 engineering standards
│   ├── v2/workflows/                 # 6 workflow architecture docs
│   └── ...
│
├── functions/                        # 66 Python serverless functions
│   ├── requirements.txt              # pydantic>=2.0, lemma-sdk>=0.5.2
│   ├── shared/                       # Shared Python utilities
│   └── [66 function directories]/
│
├── integration/                      # Cross-app integration docs (10)
│
├── my-team/                          # Lemma pod bundle
│
├── packages/                         # V1 shared packages
│   ├── config/                       # agents, constants, environment, paths, theme
│   ├── sdk/                          # lemma-sdk.ts, ProtectedApp.tsx
│   ├── types/                        # 16 TypeScript interfaces
│   ├── ui/                           # 13 shared React components
│   └── utils/                        # date, filtering, number, sorting, string
│
├── scripts/                          # Build/dev scripts
│   ├── build.ts, clean.ts
│   ├── dev.cmd, dev.ts
│   ├── seed.ts, test.ts, validate.ts
│
├── shared/                           # @resqai/foundation v2.0.0
│   ├── src/                          # 21 components, design system, events, etc.
│   └── docs/
│
├── tests/fixtures/                   # Orphaned test fixtures (11)
│
└── workflows/                        # V1 workflow definitions (11)
```

---

## 8. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI component library |
| TypeScript | ^5.5.5 | Type-safe JavaScript |
| Vite | 8.1.0 | Build tool and dev server |
| Vitest | 4.1.9 | Unit and integration testing |
| jsdom | ^25.0.0 | DOM environment for tests |
| Zustand | (planned) | State management (V2) |
| React Query | (planned) | Server state management (V2) |
| ESLint | latest | Static analysis |
| Prettier | latest | Code formatting |

### Backend / Serverless
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.13 | Serverless function runtime |
| Pydantic | >=2.0 | Input/output validation |
| pytest | >=8.0 | Function testing framework |
| pytest-cov | >=5.0 | Code coverage |
| pytest-asyncio | >=0.24 | Async test support |
| lemma-sdk | ^0.5.2 | Python SDK for pod interaction |

### Platform
| Technology | Purpose |
|------------|---------|
| Lemma Pod | Backend platform — tables, agents, functions, workflows, auth |
| Lemma CLI | CLI tool for pod management (import, deploy, sync) |

### Infrastructure (Planned)
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| docker-compose | Local development orchestration |
| GitHub Actions | CI/CD pipeline |
| Pusher/Socket.IO | Real-time pub/sub |
| Nginx | Static file serving for apps |

---

## 9. Applications

### 9.1 V1 Production Applications (Build-Ready)

| Application | Description | Routes | Tech | Status |
|-------------|-------------|--------|------|--------|
| **Support Queue** | Urgency-first ticket triage with AI classification, reply drafting, and escalation management | `/`, `/tickets/:id`, `/new` | React 18 + Vite | Build-ready, 0 TS errors |
| **CRM Tracker** | Account health monitoring with automated health scans, risk signals, and relationship tracking | `/`, `/accounts/:id`, `/health` | React 18 + Vite | Build-ready, 0 TS errors |
| **Ops Dashboard** | Morning standup KPI dashboard with AI coordinator, SLA metrics, and operations log | `/`, `/standup`, `/metrics` | React 18 + Vite | Build-ready, 0 TS errors |
| **Appointment Board** | Technician scheduling with AI skill-based suggestions, calendar view, and dispatch controls | `/`, `/appointments/:id`, `/schedule` | React 18 + Vite | Build-ready, 0 TS errors |
| **Resolution Center** | Service dispute resolution with AI analysis of claims, evidence management, and resolution tracking | `/`, `/disputes/:id`, `/resolved` | React 18 + Vite | Build-ready, 0 TS errors |

### 9.2 V2 Next-Gen Applications (Scaffolded)

| Application | Purpose | Status |
|-------------|---------|--------|
| **Support Center** | Unified multi-channel support with real-time ticket feed and SLA dashboards | Scaffolded |
| **CRM Center** | Advanced CRM with relationship graphs, health trends, and automated outreach | Scaffolded (with implementation report) |
| **Operations Center** | Command center with real-time ops metrics, resource allocation, and incident management | Scaffolded |
| **Appointment Center** | Full appointment lifecycle management with calendar sync and scheduling optimization | Scaffolded |
| **Resolution Center V2** | Enhanced dispute resolution with evidence uploads, mediation workflows, and audit trails | Scaffolded |
| **Customer Portal** | Self-service portal for ticket submission, appointment booking, and dispute filing | Scaffolded |
| **Technician Portal** | Mobile-first workspace for job assignments, navigation, parts lookup, and check-in/out | Scaffolded |
| **Admin Center** | System configuration, user management, role administration, and audit log browsing | Scaffolded (with implementation report) |
| **Analytics Center** | Custom report builder, KPI dashboards, scheduled exports, and trend analysis | Scaffolded |

### 9.3 V2 App Structure (Standard Template)
```
apps/{app-name}_v2/
├── public/favicon.ico
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component with routing
│   ├── routes.tsx                  # Route definitions
│   ├── pages/                      # Page components
│   ├── components/                 # App-specific components
│   ├── layouts/                    # Layout components
│   ├── widgets/                    # Dashboard widgets
│   ├── hooks/                      # Custom React hooks
│   ├── stores/                     # Zustand state stores
│   ├── services/                   # API call layer
│   ├── utils/                      # App-specific utilities
│   ├── types/                      # App-specific types
│   └── styles/                     # App-specific styles
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── .env.example
```

---

## 10. Database

### 10.1 Platform
The database is managed by the Lemma Pod platform (PostgreSQL-compatible). All tables, migrations, and seed data are defined SQL-first.

### 10.2 Migration Strategy
- **V1:** 9 tables with 109 seed records, 1 migration file
- **V2:** 41 migrations with corresponding 41 rollbacks (numbered `001_create_reference_data_v2.sql` through `041_create_events_v2.sql`)
- Each migration has a matching rollback in `rollbacks_v2/`
- V2 migrations extend the V1 schema — they are additive, not replacements

### 10.3 V2 Migration Domains
| Domain | Migrations | Tables |
|--------|:----------:|--------|
| Foundation | 001-004 | reference_data, system_settings, feature_flags, connectors |
| Identity | 005-009 | knowledge_categories, user_roles, users, user_sessions, role_permissions |
| Core | 010-020 | notification_templates, channels, customers, addresses, technicians, skills, accounts, tickets, messages, attachments |
| Appointments | 021-026 | appointments, reminders, work_orders, work_order_stages, dispatches, disputes |
| Operations | 027-034 | dispute_evidence, tasks, task_assignments, followups, followup_attempts, health_scans |
| Extended | 035-041 | knowledge_articles, inventory_items, inventory_transactions, feedback, surveys, notifications, analytics_reports, analytics_schedules, audit_log, events |

### 10.4 Lookup/Config Data (JSON)
- `feature_flags_v2.json` — Feature flag configurations
- `reference_data_v2.json` — Reference data (statuses, types, categories)
- `role_permissions_v2.json` — Permission definitions
- `system_settings_v2.json` — System configuration
- `user_roles_v2.json` — User role definitions

---

## 11. Tables

### 11.1 V1 Tables (9 tables, 109 seed records)

| Table | Records | Description | Key Columns |
|-------|---------|-------------|-------------|
| `customers` | 14 | Customer profiles | id, name, phone, email, address, status, notes |
| `technicians` | 8 | Technician profiles | id, name, skill (enum), availability (enum), rating, status |
| `tickets` | 14 | Support tickets | id, customer_name, channel, subject, message, request_type, urgency, status (6-value enum) |
| `appointments` | 15 | Service appointments | id, customer_id (FK), service_type, date, status, technician_id (FK) |
| `disputes` | 4 | Service disputes | id, appointment_id (FK), customer_claim, provider_claim, evidence_summary, status |
| `tasks` | 12 | Operations tasks | id, title, owner, priority, status, due_date |
| `operations_log` | 13 | Audit log | id, action, result, timestamp, actor |
| `accounts` | 14 | Customer accounts | id, customer_id (FK), name, health_score, relationship_status, health (4-value enum) |
| `followups` | 15 | Follow-up records | id, account_id (FK), customer_id (FK), type, status, priority, due_date |

### 11.2 V2 Tables (41 defined in migrations)

**Foundation Domain:**
| Table | Purpose |
|-------|---------|
| `v2_reference_data` | Reference lookup values |
| `v2_system_settings` | System configuration settings |
| `v2_feature_flags` | Feature flag toggles |
| `v2_connectors` | Connector configuration |

**Identity Domain:**
| Table | Purpose |
|-------|---------|
| `v2_knowledge_categories` | Knowledge base categories |
| `v2_user_roles` | User role definitions |
| `v2_users` | System user accounts |
| `v2_user_sessions` | Active user sessions |
| `v2_role_permissions` | Role-to-permission mappings |

**Core Domain:**
| Table | Purpose |
|-------|---------|
| `v2_notification_templates` | Notification message templates |
| `v2_notification_channels` | Notification channel configs |
| `v2_customers` | Customer profiles (V2) |
| `v2_customer_addresses` | Customer addresses |
| `v2_technicians` | Technician profiles (V2) |
| `v2_technician_skills` | Technician skill records |
| `v2_accounts` | Customer accounts (V2) |
| `v2_tickets` | Support tickets (V2) |
| `v2_ticket_messages` | Ticket conversation messages |
| `v2_ticket_attachments` | Ticket file attachments |

**Appointments Domain:**
| Table | Purpose |
|-------|---------|
| `v2_appointments` | Service appointments (V2) |
| `v2_appointment_reminders` | Appointment reminder records |
| `v2_work_orders` | Work order records |
| `v2_work_order_stages` | Work order stage progression |
| `v2_dispatches` | Technician dispatch records |
| `v2_disputes` | Service disputes (V2) |

**Operations Domain:**
| Table | Purpose |
|-------|---------|
| `v2_dispute_evidence` | Dispute evidence items |
| `v2_tasks` | Operations tasks (V2) |
| `v2_task_assignments` | Task assignment records |
| `v2_followups` | Follow-up records (V2) |
| `v2_followup_attempts` | Follow-up contact attempts |
| `v2_account_health_scans` | Health scan results |

**Extended Domain:**
| Table | Purpose |
|-------|---------|
| `v2_knowledge_articles` | Knowledge base articles |
| `v2_inventory_items` | Inventory item records |
| `v2_inventory_transactions` | Inventory movement log |
| `v2_feedback` | Customer feedback records |
| `v2_feedback_surveys` | Feedback survey definitions |
| `v2_notifications` | Notification records |
| `v2_analytics_reports` | Analytics report definitions |
| `v2_analytics_schedules` | Report schedule configs |
| `v2_audit_log` | System audit log |
| `v2_events` | Event bus records |

### 11.3 Table Naming Conventions
- All V2 tables use prefix: `v2_{domain}_{entity}`
- Column naming: `snake_case`
- Primary key: `{singular_entity}_id` (e.g., `ticket_id`)
- Foreign key: `{referenced_singular_entity}_id` (e.g., `customer_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft delete)
- Status: `{entity}_status` (e.g., `ticket_status`)
- Boolean prefixes: `is_`, `has_`, `can_` (e.g., `is_active`)
- Max 50 columns per table
- Always include `org_id` for multi-tenant RLS

---

## 12. Relationships

### 12.1 V1 Entity Relationship Diagram

```
customers ─────┬──< appointments ────> technicians
      │        │
      │        └──< disputes
      │
      ├──< accounts ───< followups
      │
      └──< tickets

appointments ──< disputes
accounts ──────< followups
```

### 12.2 V2 Key Foreign Key Relationships

| Parent Table | Child Table | FK Column |
|-------------|-------------|-----------|
| v2_users | v2_user_sessions | user_id |
| v2_user_roles | v2_role_permissions | role_id |
| v2_users | v2_role_permissions | user_id |
| v2_customers | v2_customer_addresses | customer_id |
| v2_customers | v2_accounts | customer_id |
| v2_customers | v2_tickets | customer_id |
| v2_customers | v2_followups | customer_id |
| v2_customers | v2_feedback | customer_id |
| v2_technicians | v2_technician_skills | technician_id |
| v2_technicians | v2_appointments | technician_id |
| v2_technicians | v2_dispatches | technician_id |
| v2_technicians | v2_task_assignments | technician_id |
| v2_accounts | v2_account_health_scans | account_id |
| v2_accounts | v2_followups | account_id |
| v2_tickets | v2_ticket_messages | ticket_id |
| v2_tickets | v2_ticket_attachments | ticket_id |
| v2_tickets | v2_dispatches | ticket_id |
| v2_tickets | v2_notifications | ticket_id |
| v2_appointments | v2_appointment_reminders | appointment_id |
| v2_appointments | v2_work_orders | appointment_id |
| v2_appointments | v2_disputes | appointment_id |
| v2_work_orders | v2_work_order_stages | work_order_id |
| v2_disputes | v2_dispute_evidence | dispute_id |
| v2_tasks | v2_task_assignments | task_id |
| v2_tasks | v2_followups | task_id |
| v2_knowledge_categories | v2_knowledge_articles | category_id |
| v2_inventory_items | v2_inventory_transactions | item_id |

### 12.3 Relationship Rules
- All foreign keys are UUIDs with `gen_random_uuid()` default
- All tables include `org_id` for RLS isolation
- Soft delete via `deleted_at` (nullable timestamp)
- Cascade deletes are restricted; application-level handling required

---

## 13. Functions

### 13.1 Overview
- **66 Python serverless functions** implemented across **11 domains**
- **288+ total test cases** across 66 test files
- Each function follows a consistent pattern with Pydantic-validated I/O, audit logging, event publishing, and error handling

### 13.2 Function Domains

| Domain | Count | Functions |
|--------|:-----:|-----------|
| **Support** | 9 | create_ticket, update_ticket_v2, update_ticket_record, assign_ticket, close_ticket, escalate_ticket, search_tickets, check_ticket_urgency, collect_resolved_tickets |
| **Appointments** | 8 | create_appointment, assign_appointment_technician, accept_appointment, complete_appointment, cancel_appointment, list_appointments, get_appointment, fetch_upcoming_appointments |
| **Technicians** | 4 | create_technician, update_technician, list_technicians, update_technician_skills |
| **CRM** | 10 | create_customer, update_customer, get_customer, search_customers, create_followup, complete_followup, list_followups, account_health_scan, update_account_health, update_account_health_status |
| **Resolution** | 3 | resolve_dispute, resolve_dispute_v2, list_disputes |
| **Operations** | 12 | finalize_dispatch, create_work_order, update_work_order, get_work_order, list_work_orders, create_inventory_item, update_inventory_item, list_inventory, create_followup_tasks, create_operations_tasks, finalize_slippage_review, flag_slipping_followups |
| **Notifications** | 4 | dispatch_notifications, dispatch_notification_v2, send_bulk_notification, track_notification |
| **Analytics** | 5 | analytics_aggregation, dashboard_metrics, create_report, schedule_report, get_report |
| **Administration** | 9 | create_user, create_role, assign_role, manage_permission, record_audit, read_audit, bulk_delete, get_dashboard_summary, resolve_escalation |
| **Authentication** | 2 | authenticate_user, validate_session |

### 13.3 Function Type Prefixes (V2 Standard)

| Prefix | Meaning | Example |
|--------|---------|---------|
| `det_` | Read (single) | `v2_core_det_ticket` |
| `det_` (plural) | Read (list) | `v2_core_det_tickets` |
| `wri_` | Write (create/update) | `v2_core_wri_ticket` |
| `agg_` | Aggregate | `v2_core_agg_ticket_metrics` |
| `orc_` | Orchestrate | `v2_core_orc_dispatch_technician` |
| `tra_` | Transform | `v2_notification_tra_format_sms` |

### 13.4 Function Structure (Standard Template)

Each function directory:
```
functions/{function-name}/
├── src/
│   ├── handler.py         # Async handler with business logic
│   ├── models.py          # Pydantic input/output models
│   └── __init__.py
├── tests/
│   ├── test_*.py          # Pytest test suite
│   └── __init__.py
├── schemas/
│   ├── input.json         # Input JSON Schema
│   └── output.json        # Output JSON Schema
└── function.json          # Lemma platform metadata + permissions
```

### 13.5 Function Implementation Rules
1. Every function validates all inputs
2. Auth check uses `org_id` from context (never from input)
3. Error handling covers all paths (validation, auth, not found, system)
4. Events emitted for create/update/delete actions
5. WRI functions support idempotency via `idempotency_key`
6. All queries use parameterized SQL (no string interpolation)
7. Structured logging with correlation_id

### 13.6 Response Format
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": {...} } }
```

---

## 14. Agents

### 14.1 V1 Agents (6)

| Agent | Role | Tables Read | Tables Written | Connectors |
|-------|------|-------------|----------------|------------|
| **request-classifier** | Classifies tickets by type, urgency, and suggested technician owner | tickets, technicians | tickets | Facebook, Instagram (read) |
| **support-reply-drafter** | Drafts customer-facing replies based on ticket context and history | tickets, technicians, customers | tickets | Gmail (send), Reddit (research) |
| **operations-coordinator** | Produces prioritized ops recommendations from standup data | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log | Discord (post alerts) |
| **resolution-advisor** | Analyzes disputes, evaluates evidence, recommends resolutions | disputes, customers, appointments, tickets, operations_log | disputes, operations_log | Reddit (research) |
| **account-health-monitor** | CRM health lead — calls health scan functions, flags at-risk accounts | accounts, followups, customers, appointments, disputes, tasks | tasks, operations_log | Discord (post alerts) |
| **tech-suggester** | Suggests best-fit technicians for urgent dispatches | technicians, tickets | tickets | None |

### 14.2 Agent Structure (V1)
Each agent directory contains:
| File | Purpose |
|------|---------|
| `agent.json` | Agent metadata, model config, name |
| `instruction.md` | System prompt defining role, behavior, output format |
| `input-schema.json` | JSON Schema for expected input |
| `output-schema.json` | JSON Schema for expected output |
| `permissions.json` | Table read/write permissions |
| `tool-access.md` | Description of tools the agent can use |
| `workflow-role.md` | How the agent integrates into workflows |
| `README.md` | Human-readable overview |

### 14.3 Agent Design Principles
1. **Safe to re-run** — All agents are stateless and non-destructive
2. **Idempotent** — Multiple invocations produce the same result
3. **Workflow-first** — Agents are nodes in workflow DAGs, not standalone services
4. **Schema-enforced** — Every agent validates I/O against JSON Schema
5. **Observable** — Every decision is logged to `operations_log`
6. **AI-drafts-humans-approve** — All agents produce recommendations, not final actions

### 14.4 Agent Interaction Diagram
```
INTAKE PIPELINE:
  Ticket Created → request-classifier → support-reply-drafter → Human Approval

DISPUTE PIPELINE:
  Dispute (under_review) → resolution-advisor → Human Review & Approval

OPERATIONS LAYER:
  operations-coordinator (on-demand/daily) → Human Review → Actions
  account-health-monitor (nightly/on-demand) → Functions → Tasks
```

### 14.5 V2 Agent Architecture (Planned — 49 agents)
| Type | Count | Role |
|------|:-----:|------|
| Executive | 2 | System orchestrator, knowledge gateway |
| Core Domain | 12 | Primary domain ownership (ticket, customer, technician, etc.) |
| Extended Domain | 35 | Sub-domain specialization (priority, routing, SLA, etc.) |

**Agent Hierarchy (Planned):**
```
v2_system_orchestrator_agent
  ├── v2_ticket_agent (priority, routing, sla, resolution)
  ├── v2_customer_agent (health, history, segment)
  ├── v2_technician_agent (schedule, skills, load)
  ├── v2_appointment_agent
  ├── v2_dispatch_agent
  ├── v2_billing_agent
  ├── v2_notification_agent
  ├── v2_escalation_agent
  ├── v2_report_agent
  ├── v2_compliance_agent
  ├── v2_feedback_agent
  └── v2_inventory_agent
```

---

## 15. Workflows

### 15.1 V1 Workflows (11)

| Workflow | Trigger | Node Chain | Status |
|----------|---------|------------|--------|
| **ticket-intake** | event: `ticket.created` | AGENT(classifier) → FUNCTION(check-urgency) → DECISION → HUMAN → AGENT(drafter) → FUNCTION(update-ticket) | Active v2.0.0 |
| **urgent-dispatch** | Datastore INSERT/UPDATE on tickets | FUNCTION(check-urgency) → AGENT(tech-suggester) → HUMAN(dispatch-approval) | Active v2.0.0 |
| **dispute-resolution** | Datastore INSERT/UPDATE on disputes | AGENT(resolution-advisor) → FUNCTION(resolve-dispute) → HUMAN(final-approval) | Active v2.0.0 |
| **support-escalation-manager** | Datastore UPDATE on tickets | DECISION → AGENT(classifier) → HUMAN → FUNCTION(escalate-ticket) | Active v1.0.0 |
| **appointment-assignment** | Datastore INSERT on appointments | FUNCTION(assign-technician) → HUMAN(confirm) → FUNCTION(notify) | Active v1.0.0 |
| **customer-satisfaction-monitor** | CRON `0 8 * * *` | FUNCTION(collect-feedback) → AGENT → FUNCTION(update-metrics) | Active v1.0.0 |
| **account-health-monitoring** | CRON `0 2 * * *` | FUNCTION(health-scan) → AGENT(health-monitor) → DECISION → FUNCTION(create-tasks) | Active v1.0.0 |
| **followup-slippage-detector** | CRON `*/30 * * * *` | FUNCTION(flag-slipping) → DECISION → FUNCTION(create-tasks) → FUNCTION(notify) | Active v1.0.0 |
| **daily-standup** | CRON `0 8 * * 1-5` | FUNCTION(aggregate-metrics) → AGENT(coordinator) → HUMAN(review) | Draft v1.0.0 |
| **account-health** | CRON `0 2 * * *` | DECISION → FUNCTION(update-status) → FUNCTION(notify) | Draft v1.0.0 |
| **appointment-reminders** | CRON `0 7 * * *` + events | FUNCTION(list-upcoming) → FUNCTION(dispatch-reminders) | Draft v1.0.0 |

### 15.2 V2 Workflow Tier System (Planned — 33 workflows)

| Tier | Name | Human Needed | Count | Example |
|:----:|------|:------------:|:-----:|---------|
| 0 | Autonomous | No | 5 | Auto-escalate overdue ticket |
| 1 | Entry | Yes (initiate) | 9 | Create ticket from form |
| 2 | Secondary | Yes (review) | 6 | Assign technician |
| 3 | Execution | Yes (approve) | 5 | Dispatch work order |
| 4 | Notification | No | 5 | Send SLA alert |
| 5 | Reporting | No | 3 | Generate daily report |
| 6 | Maintenance | No | 3 | Purge old records |
| 7 | System | No | 2 | Health check |

### 15.3 Workflow Design Principles
1. **Event-First Execution** — Workflows start from table events or CRON; no polling
2. **Single Business Process** — Each workflow owns exactly one end-to-end process
3. **Deterministic Routing** — AI makes content decisions; routing is logic-based
4. **Fail Closed** — Errors halt execution with logged context
5. **Correlation ID Flow** — Every workflow instance carries a correlation ID through all nodes
6. **Human Gate at Boundaries** — Humans approve cross-boundary actions
7. **Idempotent by Design** — Re-running a completed workflow is a no-op
8. **Observable by Default** — Every node execution is logged with input, output, and duration

### 15.4 Workflow Flow Pattern
```
Event Trigger → Entry Condition → Pre-processing → Business Logic
→ Post-processing → Notification → Complete
```

---

## 16. Events

### 16.1 Event Architecture
A typed publish-subscribe event system built around `EventBus` connects all platform layers. Each domain publishes and subscribes to typed events.

### 16.2 Event Modules
| Module | Events | Description |
|--------|--------|-------------|
| `EventBus.ts` | on(), emit(), off() | Core publish-subscribe event bus |
| `WorkflowEvents.ts` | workflow:* | Workflow lifecycle events |
| `ApplicationEvents.ts` | app:* | App lifecycle, routing, theme changes |
| `AgentEvents.ts` | agent:* | Agent conversation and execution events |
| `NotificationEvents.ts` | notification:* | Notification add, dismiss, clear |

### 16.3 V1 Event Naming
All events follow the `domain:action` pattern:
- `app:routeChanged`, `app:themeToggled`
- `workflow:started`, `workflow:stepCompleted`, `workflow:failed`
- `agent:executionStarted`, `agent:responseReceived`
- `notification:added`, `notification:dismissed`

### 16.4 V2 Event Naming Convention
`v2.{domain}.{entity}.{action}.{outcome}`
- Dot-separated, lowercase, max 5 segments
- First segment: `v2`
- Second: domain (e.g., `core`, `billing`, `identity`)
- Third: entity (e.g., `ticket`, `invoice`)
- Fourth: action in past tense (e.g., `created`, `assigned`)
- Fifth: outcome (optional, e.g., `success`, `failed`)

### 16.5 V2 Event Catalog (Key Events)
**Ticket Lifecycle (12 events):**
- `v2.core.ticket.created`, `v2.core.ticket.assigned`, `v2.core.ticket.resolved`
- `v2.core.ticket.escalated`, `v2.core.ticket.sla_warning`, `v2.core.ticket.sla_breached`

**Appointment Lifecycle (9 events):**
- `v2.appointment.assigned`, `v2.appointment.confirmed`, `v2.appointment.rescheduled`
- `v2.appointment.reminder.sent`, `v2.appointment.completed`, `v2.appointment.no_show`

**Dispatch Events (10 events):**
- `v2.dispatch.created`, `v2.dispatch.sent`, `v2.dispatch.acknowledged`
- `v2.dispatch.en_route`, `v2.dispatch.on_site`, `v2.dispatch.completed`

**Additional Domains:** Work order lifecycle, resolution lifecycle, CRM lifecycle, customer experience, knowledge lifecycle, notification lifecycle, SLA lifecycle, reporting, analytics, administration, inventory, quality, automation

### 16.6 Event Categories
| Category | Pattern | Description |
|----------|---------|-------------|
| Domain events | `v2.{domain}.{entity}.{action}` | Business state change |
| System events | `v2.system.{component}.{action}` | Infrastructure events |
| Audit events | `v2.audit.{entity}.{action}` | Compliance tracking |
| Error events | `v2.error.{component}.{error_type}` | Failure notifications |

### 16.7 Event Payload Rules
- Include `entity_id` for the affected resource
- Include `org_id` for multi-tenant routing
- Include previous state for state transitions
- Max payload size: 64KB
- Never include sensitive data (passwords, PII)

### 16.8 Event-Driven Triggers
| Trigger Type | Description | Example |
|-------------|-------------|---------|
| Table Events | INSERT/UPDATE/DELETE on tables | `ticket.created` |
| Scheduled Events | CRON-based time triggers | Nightly at 2AM |
| Manual Events | Human-initiated via UI | "Run health check" |
| Workflow Events | Completion/failure of other workflows | Chained workflows |
| External Webhooks | Inbound from connectors | Social media messages |

---

## 17. Security

### 17.1 Security Standards
- All function calls require valid JWT token in authorization header
- JWT contains: `user_id`, `org_id`, `role`, `exp`
- Token validation at function entry (Lemma auth middleware)
- No public (unauthenticated) functions (except login, health check, webhooks)
- All queries filtered by `org_id` from auth context (RLS)
- Parameterized queries only (no SQL injection vectors)
- Rate limiting: per-user 1000 req/min, per-IP 100 req/min, per-org 5000 req/min

### 17.2 Data Protection
- PII is never logged in plain text
- PII is masked/minimized in agent responses
- Data in transit: TLS 1.3 minimum
- Data at rest: encrypted (RDS/Aurora default encryption)
- No secrets in source code
- No `.env` files committed
- Secrets stored in Lemma Secrets Manager
- API keys rotated every 90 days minimum

### 17.3 Security Tooling
| Tool | Purpose | Frequency |
|------|---------|:---------:|
| trufflehog | Secret detection | Every PR |
| npm audit | Dependency vulnerability scan | Weekly |
| pip-audit | Python dependency scan | Weekly |
| SAST (Semgrep/CodeQL) | Static analysis | Every PR |
| DAST (OWASP ZAP) | Dynamic analysis | Every staging deploy |

### 17.4 Security Acceptance Criteria
- Zero critical or high severity findings in dependency scan
- No secrets detected in source code
- All authenticated endpoints verify JWT
- RLS isolation verified between organizations
- Input validation rejects injection attempts
- Rate limiting functional

---

## 18. Authentication

### 18.1 Auth Flow
1. User authenticates via Lemma OAuth
2. JWT token issued with `user_id`, `org_id`, `role`, `exp`
3. Token passed in `Authorization: Bearer <token>` header
4. Lemma auth middleware validates token at function entry
5. `org_id` extracted from JWT (never from user input)
6. All queries filtered by `org_id` for RLS enforcement

### 18.2 Development Auth
- Lemma CLI token used for localhost development
- `scripts/dev.ts` injects CLI token to bypass OAuth
- No production credentials used in development

### 18.3 Auth Functions
| Function | Purpose |
|----------|---------|
| `authenticate_user` | User authentication (login) |
| `validate_session` | Session token validation |

### 18.4 Roles (Standard)
| Role | Description |
|------|-------------|
| `v2_admin` | Full system access |
| `v2_dispatch` | Dispatch operations |
| `v2_technician` | Field technician |
| `v2_customer` | Customer self-service |
| `v2_readonly` | Read-only reporting |

---

## 19. Permissions

### 19.1 Permission Naming Convention
`v2:{domain}:{action}:{resource}`

### 19.2 Actions
`create`, `read`, `update`, `delete`, `approve`, `assign`, `export`, `manage`

### 19.3 Permission Examples
| Permission | Description |
|------------|-------------|
| `v2:ticket:read:ticket` | Read tickets |
| `v2:ticket:create:ticket` | Create tickets |
| `v2:ticket:assign:ticket` | Assign tickets |
| `v2:billing:read:invoice` | Read invoices |
| `v2:billing:manage:invoice` | Full invoice control |
| `v2:admin:manage:users` | User management |
| `v2:admin:manage:system` | System configuration |

### 19.4 RLS Implementation
- Every function receives `org_id` from auth context
- All database queries include `WHERE org_id = :org_id`
- RLS policies defined in `policies/` directory (planned V2)
- Cross-org access is impossible at database level

### 19.5 Connector Permissions
Connector access granted via `connector.use` resource:
```json
{ "resource": "connector.use", "connector": "resqai-gmail" }
```

---

## 20. Integrations

### 20.1 Cross-App Integration Documents
The `integration/` directory contains 10 comprehensive documents:

| Document | Description |
|----------|-------------|
| APPLICATION_COMMUNICATION_MATRIX.md | How apps communicate with each other |
| APPLICATION_DEPENDENCY_GRAPH.md | App dependency relationships |
| APPLICATION_NAVIGATION_MAP.md | Cross-app navigation flows |
| APPLICATION_ROUTE_MAP.md | Route definitions across all apps |
| CROSS_APPLICATION_INTEGRATION_REPORT.md | Full integration analysis |
| SHARED_COMPONENTS.md | Shared component usage across apps |
| SHARED_CONTRACTS.md | Shared interface contracts |
| SHARED_MODELS.md | Shared data models |
| SHARED_PERMISSIONS.md | Shared permission definitions |
| SHARED_STATE.md | Shared state management patterns |

### 20.2 Integration Verification Rules
- Every component connects to all declared dependencies
- Data flows correctly through all connected paths
- Error propagation works (failure in dependency handled by consumer)
- Events reach all subscribed consumers

---

## 21. Connectors

### 21.1 Active Connectors (5)

| Connector | Provider | Operations | Status |
|-----------|----------|------------|--------|
| **resqai-gmail** | Gmail | gmail_send_email | Active |
| **resqai-discord** | Discord | chat_post_message | Active |
| **resqai-twilio** | Twilio | send_sms | Active |
| **resqai-reddit** | Reddit | (research/read) | Active |
| **resqai-facebook** | Facebook | read messages | Active |
| **resqai-instagram** | Instagram | read messages | Active |

### 21.2 Connector → Workflow Mapping

| Workflow | Connectors Used | Integration Point |
|----------|----------------|-------------------|
| ticket-intake | Gmail | Sends email notification on `approved_to_send == true` |
| urgent-dispatch | Discord | Posts dispatch alert to `#support-alerts` |
| support-escalation-manager | Discord | Posts escalation alerts |
| dispute-resolution | Discord, Gmail | Posts resolution notifications |
| customer-satisfaction-monitor | Discord | Posts daily monitor summary |
| followup-slippage-detector | Discord | Posts slippage alerts |
| account-health-monitoring | Discord | Posts critical account alerts |
| daily-standup | Discord | Posts standup summaries |

### 21.3 Connector → Agent Mapping

| Agent | Connectors | Usage |
|-------|-----------|-------|
| support-reply-drafter | Gmail, Reddit | Send approved drafts; research similar issues |
| request-classifier | Facebook, Instagram | Read customer messages and create tickets |
| resolution-advisor | Reddit | Search for similar dispute resolution patterns |
| operations-coordinator | Discord | Post escalation alerts and standup summaries |
| account-health-monitor | Discord | Post critical account alerts |

### 21.4 Connector → Function Mapping

| Function | Connectors | Call Pattern |
|----------|-----------|-------------|
| update_ticket_record | Gmail | `pod.connectors.execute("resqai-gmail", "gmail_send_email", {...})` |
| finalize_dispatch | Discord | Post dispatch notifications |
| resolve_dispute | Discord, Gmail | Post resolution/rejection notifications |
| update_account_health_status | Discord | Post critical account alerts |
| finalize_slippage_review | Discord | Post slippage alerts |
| collect_resolved_tickets | Discord | Post resolved ticket summaries |

### 21.5 Connector Standards
- Every connector has circuit breaker (5 failures → open, 30s recovery)
- Every connector has rate limiter (token bucket algorithm)
- Every connector has timeout (configurable per call type)
- Every connector call is logged with duration, success/failure
- Connector configuration from environment variables (never hardcoded)
- Connectors emit events on success/failure for monitoring

### 21.6 Pending Connector Integrations
| Connector | Status | Notes |
|-----------|--------|-------|
| WhatsApp Business | Unavailable | Not available on platform |
| Facebook (inbound) | Partial | No webhook triggers for automatic inbound |
| Instagram (inbound) | Partial | No webhook triggers for automatic inbound |
| Gmail (inbound) | Not integrated | Only outbound implemented |

---

## 22. Coding Standards

### 22.1 General Rules
- **Formatting:** 2-space indentation, 100-char max line length, LF line endings, UTF-8
- **Enforcement:** ESLint + Prettier (TS/JS), ruff (Python), CI fails on violations
- **Prohibited:** `any` type (use `unknown`), `eval()`, `// @ts-ignore`, global mutable state, `console.log` in production, magic numbers, deeply nested ternaries, `TODO` without ticket reference

### 22.2 TypeScript Standards
- Types over interfaces (prefer `type` over `interface`)
- `strict: true` in tsconfig, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- Null safety: use optional chaining `?.` and nullish coalescing `??`
- Named parameters for functions with 2+ params
- Prefer `as const` objects over `enum`

### 22.3 Python Standards
- PEP 8 (enforced by ruff)
- Type hints required on all function signatures
- Docstrings: Google style
- One function per file, one `handler` entry point per function

### 22.4 React Standards
- One component per file
- Named exports (default only for lazy-loaded routes)
- Custom hooks start with `use`, return named objects
- Server state: React Query; Client state: Zustand; URL state: React Router; Form state: React Hook Form
- `React.memo` only for components that render often with same props

### 22.5 Import Order (TypeScript)
1. Node built-ins
2. External packages
3. Internal packages (`@resqai` scope)
4. Relative imports (app-internal)
5. Style imports

### 22.6 Error Handling
- **Error hierarchy:** AppError → NotFoundError, ValidationError, AuthenticationError, AuthorizationError, ConflictError, RateLimitError, TimeoutError, InternalError
- **Error response format:** `{ error: { code, message, details, correlationId } }`
- Every async operation has `.catch()` or `try/catch`
- Never `catch` without logging
- Never expose stack traces or database internals

### 22.7 Logging
- Structured logging with `correlation_id`, `component`, `timestamp`, `level`
- Log levels: error (system degraded), warn (unexpected but handled), info (business events), debug (development only)
- Required fields per entry: `correlationId`, `component`, `timestamp`, `level`

### 22.8 Versioning
- Semantic versioning: `MAJOR.MINOR.PATCH`
- Breaking changes → MAJOR, new features → MINOR, bug fixes → PATCH
- Git tags: `v2.0.0-alpha`, `v2.0.0-beta`, `v2.0.0`, `v2.0.1`

### 22.9 Branch Strategy
```
main                    # Production — protected
└── develop             # Integration — protected
    ├── feat/*          # Feature branches
    ├── fix/*           # Bug fix branches
    ├── refactor/*      # Refactoring
    ├── docs/*          # Documentation
    ├── test/*          # Testing
    ├── chore/*         # Build/config
    └── perf/*          # Performance
```

### 22.10 Commit Messages
```
{type}({scope}): {short description (max 72 chars)}

{optional body — why, not what}

{optional footer — breaking changes, ticket references}
```
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`
- Scopes: `platform`, `be`, `fe-alpha`, `fe-beta`, `fe-gamma`, `agent`, `wf`, `docs`

---

## 23. Naming Standards

| Category | Pattern | Example |
|----------|---------|---------|
| Applications | `{domain}-{purpose}_v2` | `support-center_v2` |
| Pages | `{Resource}{Action}` | `TicketList`, `TicketDetail` |
| Components | `{Domain}{ComponentName}` | `TicketStatusBadge` |
| Widgets | `{Domain}{Purpose}Widget` | `TicketSummaryWidget` |
| Layouts | `{LayoutType}Layout` | `AppLayout`, `AuthLayout` |
| Tables | `v2_{domain}_{entity}` | `v2_core_tickets` |
| Functions | `v2_{domain}_{action}_{entity}` | `v2_core_det_ticket` |
| Agents | `v2_{domain}_{role}_agent` | `v2_ticket_agent` |
| Workflows | `v2_{domain}_{action}_{entity}_wf` | `v2_core_create_ticket_wf` |
| Events | `v2.{domain}.{entity}.{action}` | `v2.core.ticket.created` |
| Connectors | `v2_{provider}_connector` | `v2_twilio_connector` |
| Notifications | `v2_{channel}_{template}_notification` | `v2_email_ticket_assigned_notification` |
| Permissions | `v2:{domain}:{action}:{resource}` | `v2:ticket:read:ticket` |
| Reports | `v2_{domain}_{entity}_{metric}_report` | `v2_core_ticket_volume_report` |
| Packages | `resqai-{purpose}` | `resqai-types` |
| Env Variables | `RESQAI_{COMPONENT}_{PROPERTY}` | `RESQAI_DB_HOST` |
| Git Branches | `{type}/{track}/{description}` | `feat/be/v2_core_wri_ticket` |

**General Rules:**
- `camelCase` for JS/TS variables/functions
- `PascalCase` for classes, components, types
- `UPPER_SNAKE_CASE` for constants and env vars
- `snake_case` for Python, tables, columns, events
- American English, max 50 chars for identifiers
- V2 prefix (`v2_`) or suffix (`_v2`) to distinguish from V1
- Reserved words: never use `data`, `info`, `temp`, `tmp`, `stuff`, `misc`, `util`

---

## 24. Documentation Standards

### 24.1 Documentation Hierarchy
```
docs/
├── v1/                          # V1 documentation (read-only, frozen)
├── v2/
│   ├── README.md                # V2 docs index
│   ├── architecture/            # Phase 1.x architecture docs
│   ├── apps/                    # Phase 1.5 app docs
│   ├── database/                # Phase 1.5 DB docs
│   ├── workflows/               # Phase 1.5 workflow docs
│   ├── implementation/          # Phase 2.0 implementation plans
│   └── standards/               # Phase 2.1 engineering standards
├── V2 Standards Documents (10):
│   ├── CODING_STANDARDS.md
│   ├── BACKEND_GUIDELINES.md
│   ├── AI_GUIDELINES.md
│   ├── WORKFLOW_GUIDELINES.md
│   ├── TESTING_GUIDELINES.md
│   ├── UI_GUIDELINES.md
│   ├── NAMING_CONVENTIONS.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DEFINITION_OF_DONE.md
│   └── ENGINEERING_GUIDE.md
```

### 24.2 Required Documentation Per Component
| Component | Required Docs | Location |
|-----------|---------------|----------|
| Table | Migration SQL (up/down), RLS policy, seed data | `database/migrations_v2/` |
| Function | Docstring, OpenAPI spec | `functions/{name}/` |
| App | README.md | `apps/{name}/README.md` |
| Agent | README.md, system_prompt.txt, context_rules.json | `agents/{name}/` |
| Workflow | README.md | `workflows/{name}/README.md` |
| Connector | README.md, config | Platform-managed |

### 24.3 README Template (Per Component)
1. **Purpose** — What this component does (one paragraph)
2. **Usage** — How to use (input/output)
3. **Dependencies** — Tables, functions, other components
4. **Events** — Events consumed and emitted
5. **Configuration** — Environment variables, feature flags
6. **Testing** — How to run tests, test data requirements
7. **Troubleshooting** — Common issues and solutions

### 24.4 Documentation Rules
- Documentation is versioned with code (same PR)
- Architecture docs updated if interfaces change
- All public APIs have inline documentation
- No stale or misleading documentation
- README files use markdown, max 500 lines

---

## 25. UI Standards

### 25.1 Design System
- **Design tokens** defined in `packages/resqai-ui/src/styles/tokens.ts`
- Consumed via Tailwind CSS custom properties
- **Typography:** Inter (sans-serif), JetBrains Mono (monospace/code)
- **Icons:** Heroicons (outline, 24x24), Lucide (specialized)
- **Grid:** 12-column, max content width 1280px, sidebar 280px

### 25.2 Color Palette
- **Primary:** Blue (#2563EB) — CTAs, active states
- **Semantic:** Success (green #16A34A), Warning (amber #F59E0B), Error (red #DC2626), Info (sky #0EA5E9)
- **Neutral:** 50-900 scale for backgrounds, text, borders
- **Domain status colors:** ticket_open (blue), ticket_in_progress (amber), ticket_resolved (green), ticket_closed (gray)

### 25.3 Responsive Breakpoints
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1023px | Two column, collapsible sidebar |
| Desktop | 1024-1279px | Full layout, sidebar visible |
| Wide | >= 1280px | Max content width 1280px, centered |

### 25.4 Accessibility (WCAG 2.1 AA)
- Color contrast: 4.5:1 normal text, 3:1 large text
- Keyboard navigation for all functions
- Screen reader support with ARIA labels
- Visible focus indicators (`focus:ring-2`)
- Heading hierarchy: one h1 per page, sequential h2-h6
- Touch targets >= 44x44px
- Skip-to-content link on focus

### 25.5 Loading States
| Pattern | Usage |
|---------|-------|
| Skeleton | Content areas (table rows, card content, charts) |
| Spinner | Button loading, full-page loading |
| Progress bar | Multi-step operations, file upload |
| Shimmer | Image placeholders |
| Overlay spinner | Form submission |

### 25.6 Component Rules
- Every component renders loading, empty, error, and success states
- Labels always visible (no placeholder-as-label)
- Required fields marked with `*`
- Submit button disabled until form valid
- Dialogs close on Escape and backdrop click (except critical confirmations)
- Focus trap inside dialogs

---

## 26. Backend Standards

### 26.1 Function Architecture
Each V2 function follows a strict pattern:
1. Docstring with description, events emitted, dependencies
2. `INPUT_SCHEMA` for JSON Schema validation
3. `handler(input_data, context)` entry point
4. Validate input → Authorize → Execute business logic → Emit event → Return response
5. Consistent error handling (catch specific exceptions)
6. Structured logging with `correlation_id`

### 26.2 Performance Targets
| Operation | Target (p95) | Threshold |
|-----------|:------------:|:---------:|
| Simple DET | < 100ms | > 200ms = optimize |
| Complex DET (joins) | < 300ms | > 500ms = optimize |
| WRI (single table) | < 200ms | > 400ms = optimize |
| AGG (complex) | < 2s | > 5s = optimize |
| ORC | < 5s | > 10s = optimize |
| Connector call | < 1s | > 3s = timeout |

### 26.3 Optimization Rules
- Always paginate list functions (default 25, max 100)
- Use database indexes for all query patterns
- Never N+1 query — batch load related entities
- Use projections (select only needed columns)
- Prefer database aggregations over in-code aggregations

### 26.4 Caching Rules
- Cache DET responses for read-heavy, slow-changing data
- Never cache WRI/ORC responses
- Cache TTL: 5 minutes default (configurable per function)
- Cache invalidation on WRI of same entity
- Reference data cacheable for 1 hour

### 26.5 Retry Strategy
| Failure Type | Retry | Max | Backoff |
|-------------|:-----:|:---:|---------|
| Network timeout | Yes | 3 | Exponential (1s, 2s, 4s) |
| Rate limited | Yes | 3 | Exponential + jitter |
| Internal error | Yes | 2 | Exponential (1s, 2s) |
| Validation error | No | 0 | — |
| Not found | No | 0 | — |
| Conflict | Yes | 1 | Immediate |

### 26.6 Idempotency
- All WRI functions support idempotency via `idempotency_key`
- Same key within 24h returns previous result (no duplicate write)
- Store idempotency keys in settings table

---

## 27. Testing Standards

### 27.1 Test Pyramid
```
        ╱╲
       ╱E2E╲           ← 3-5 critical business journeys
      ╱──────╲
     ╱Integration╲       ← Cross-component, database, connector tests
    ╱────────────╲
   ╱   Unit Tests  ╲     ← Functions, components, utils, validation
  ╱────────────────╲
 ╱  Static Analysis  ╲    ← Lint, type check, formatting
╱────────────────────╲
```

### 27.2 Coverage Targets
| Layer | Target |
|-------|:------:|
| Functions (Python) | 90%+ |
| Frontend (TypeScript) | 80%+ |
| Agents | 85%+ |
| Workflows | 85%+ |
| Connectors | 90%+ |
| Shared packages | 90%+ |

### 27.3 Testing Philosophy
- Test behavior, not implementation
- One assertion per test
- Tests follow same coding standards as production code
- Deterministic — same input always produces same result
- Independent — tests can run in any order, in parallel

### 27.4 Required Tests Per Component
| Component | Required Tests |
|-----------|---------------|
| **Function** | Unit tests (90%+), integration test (create → read) |
| **Workflow** | Happy path, validation error, function failure, rollback, timeout |
| **Agent** | Intent classification (10 queries), tool selection, escalation, fallback, guardrails |
| **Component** | Loading, empty, error, success states; form validation; navigation; accessibility |
| **Connector** | Circuit breaker, rate limiting, retry, timeout |

### 27.5 Critical E2E Journeys
| ID | Journey | Priority |
|:--:|---------|:--------:|
| J1 | Ticket creation → assignment → dispatch | Critical |
| J2 | Customer portal → view ticket → add comment | Critical |
| J3 | Appointment booking → reminder → completion | Critical |
| J4 | Invoice generation → payment → receipt | High |
| J5 | Escalation → human review → resolution | High |

### 27.6 Test Infrastructure
| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| Local | Development | Synthetic | Developer |
| CI | PR validation | Synthetic, ephemeral | CI runner |
| Staging | Pre-release | Anonymized prod copy | Team |
| Production | Monitoring | Real (read-only) | On-call |

---

## 28. Deployment Standards

### 28.1 Current State (52/100 Production Readiness)
- **No Docker** — No Dockerfiles or docker-compose.yml anywhere
- **No CD pipeline** — Only CI exists (`.github/workflows/ci.yml`)
- **No staging environment**
- **No monitoring or alerting**
- **No backup/disaster recovery plan**

### 28.2 CI Pipeline (Current)
`.github/workflows/ci.yml` runs on push/PR to `main`:
1. Setup Node 22 + Python 3.13
2. Install all dependencies
3. Type-check all applications (`tsc --noEmit`)
4. Run all tests (Vitest + pytest)
5. Build all applications

### 28.3 Production Requirements (Planned)
- **Docker:** Multi-stage builds (Vite build → nginx:alpine for apps, Python runtime for functions)
- **docker-compose:** Local orchestration with all services
- **CD Pipeline:** Auto-deploy on merge to main
- **Monitoring:** Log aggregation, metrics, alerts
- **Backup:** Automated database backups with point-in-time recovery
- **DR:** Recovery Time Objective (RTO) < 1 hour for infrastructure

### 28.4 Deployment Targets
| Environment | Purpose | Deploy Trigger |
|-------------|---------|----------------|
| Local | Development | Manual (npm run dev) |
| Staging | Pre-release testing | Merge to develop |
| Production | Live system | Merge to main (after approval) |

### 28.5 Deployment Verification
- Health check endpoint responds
- All critical workflows execute successfully
- Zero TypeScript errors
- All tests pass (unit + integration + E2E)
- Performance tests within budget
- Security scan clean

---

## 29. Risk Register

| ID | Risk | Probability | Impact | Severity | Mitigation |
|:--:|------|:-----------:|:------:|:--------:|------------|
| R01 | **Lemma auth bug blocks SDK** | High | Critical | Critical | Tracked in Lemma SDK; CLI token bypass for dev; awaiting platform fix |
| R02 | **No Docker/containerization** | High | High | High | Phase 3 priority; manual deployment currently |
| R03 | **No production monitoring** | High | High | High | No observability in production; outages silent |
| R04 | **No backup/disaster recovery** | Medium | Critical | High | Data loss risk if pod fails |
| R05 | **V2 apps only scaffolded** | Medium | Medium | Medium | 9 apps built but no functionality; full implementation deferred |
| R06 | **V2 agents not implemented** | Medium | Medium | Medium | 49 agents planned but only 6 V1 exist |
| R07 | **V2 workflows not implemented** | Medium | Medium | Medium | 33 workflows planned but only 11 V1 exist |
| R08 | **Agent prompt drift** | Medium | Medium | Medium | Prompts stored in instruction.md; versioning manual |
| R09 | **Connector rate limit breaches** | Low | High | Medium | Circuit breakers implemented; production limits untested |
| R10 | **No E2E tests** | High | Medium | Medium | No Playwright tests; regression risk high |
| R11 | **Incomplete Python test coverage** | Medium | Medium | Medium | Some functions lack tests (fetch-upcoming-appointments, accept-appointment, track-notification) |
| R12 | **No CD pipeline** | High | Medium | Medium | Manual deployment error-prone |
| R13 | **Missing indexes on V2 tables** | Medium | Low | Low | Migrations need index review |
| R14 | **RLS not verified for V2 tables** | Medium | High | High | Cross-org data leak potential |
| R15 | **Dead code from V1 remnants** | Low | Low | Low | Some V1 functions may be superseded by V2 |

---

## 30. Technical Debt

### 30.1 Known Issues

| Issue | Priority | Impact | Effort | Status |
|-------|:--------:|:------:|:------:|--------|
| Lemma auth bug blocking SDK | Critical | SDK untestable | Unknown | Awaiting platform fix |
| No Docker/containerization | High | No reproducible deploys | 3-5 days | Planned Phase 3 |
| No production monitoring | High | Silent failures | 3-5 days | Planned Phase 3 |
| No CD pipeline | High | Manual deployment | 1-2 days | Planned Phase 3 |
| No E2E tests | High | Regression risk | 3-5 days | Planned Phase 4 |
| V2 apps not functional | High | 9 apps scaffolded only | 4-6 weeks | Phase 2 |
| V2 agents not implemented | Medium | 49 agents planned | 6-8 weeks | Phase 2/3 |
| V2 workflows not implemented | Medium | 33 workflows planned | 4-6 weeks | Phase 2/3 |
| No Playwright E2E tests | Medium | No browser automation | 2-3 days | Planned Phase 4 |
| Missing Python test coverage | Medium | Some untested functions | 1-2 days | Incremental |
| V2 table indexes missing | Low | Potential query perf issues | 1-2 days | Phase 2 |
| RLS for V2 tables unverified | High | Security risk | 1-2 days | Phase 2 |
| Agent prompt versioning manual | Low | Prompt drift | 1 day | Ongoing |
| Dead code (V1 remnants) | Low | Codebase clutter | 1 day | Ongoing |

### 30.2 Duplicate Code Patterns
- Technician selection algorithm (skill → availability → rating) duplicated in `request-classifier` and `support-reply-drafter`
- "No outbound messaging" guardrail repeated in 4/5 agents
- Status code tables follow identical pattern across all agents
- Input schema duplicated in both `instruction.md` and `input-schema.json`

### 30.3 Technical Debt Remediation Plan
1. **Phase 2.2:** Complete V2 function naming migration (V2 prefix convention), add missing indexes
2. **Phase 3:** Docker, monitoring, CD pipeline, backup/DR
3. **Phase 4:** E2E tests (Playwright), performance benchmarking, connector webhooks
4. **Ongoing:** Extract shared agent patterns, remove dead code, add missing tests

---

## 31. Future Roadmap

### Phase 1 — Foundation ✅ (Complete)
- Database schema with 9 core tables and seed data
- 66 production-ready Python serverless functions with test suites
- 6 AI agent definitions with typed schemas and permissions
- 11 Lemma workflow definitions as directed graph DAGs
- 5 React + Vite production applications (build-ready)

### Phase 2 — V2 Architecture 🔄 (In Progress)
- **Phase 2.0:** 9 next-gen applications scaffolded, @resqai/foundation shared package
- **Phase 2.1:** 10 engineering standards documents complete ✅
- **Phase 2.2:** 41 V2 database migrations with full FK relationships, CQRS function design
- **Phase 2.3:** RBAC across all applications, real-time subscription and sync architecture
- **Phase 2.4:** V2 agent hierarchy (49 agents), V2 workflow tier system (33 workflows)

### Phase 3 — Infrastructure 📋 (Pending)
- **Phase 3.0:** Docker containerization for all services
- **Phase 3.1:** Docker Compose for local development
- **Phase 3.2:** Production deployment configuration
- **Phase 3.3:** Monitoring and observability (logs, metrics, alerts)
- **Phase 3.4:** CI/CD pipeline enhancements (auto-deploy, staging environments)
- **Phase 3.5:** Backup and disaster recovery

### Phase 4 — Platform 📋 (Pending)
- **Phase 4.0:** Lemma authentication redirect fix (blocker)
- **Phase 4.1:** Agent runtime harness for local development
- **Phase 4.2:** End-to-end integration testing (Playwright)
- **Phase 4.3:** Performance benchmarking and optimization
- **Phase 4.4:** Connector webhook triggers (Facebook, Instagram, Gmail inbound)

### Phase 5 — Ecosystem 📋 (Planned)
- **Phase 5.0:** Customer self-service portal (V2)
- **Phase 5.1:** Technician mobile application
- **Phase 5.2:** API documentation and client SDK generation
- **Phase 5.3:** Plugin system for custom extensions
- **Phase 5.4:** Multi-tenant support

---

## 32. Implementation Roadmap

### 32.1 Gate System

| Gate | Criteria | Status |
|:----:|----------|--------|
| **G0** | All tables deployed, event bus operational, auth configured, CI/CD green | Partial |
| **G1** | 53 functions deployed, 6 connectors integrated, 90%+ coverage, V1/V2 gap closed | Partial |
| **G2** | 10 apps deployed, 3 cross-app journeys pass, a11y compliant, Lighthouse ≥ 85 | Pending |
| **G3** | 49 agents deployed, hallucination < 5%, cascade works, latency < 5s p95 | Pending |
| **G4** | 33 workflows deployed, full journey passes, rollback tested, audit logging verified | Pending |
| **G5** | All 150 components integrated, DR tested < 1h RTO, security scan clean | Pending |
| **G6** | Canary 10/50/100% passes, SLA 99.9% for 72h, zero P0/P1, production security clean | Pending |

### 32.2 Sprint Plan (High-Level)

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| S1 | **V2 Function Migration** | Rename 66 functions to V2 convention, add V2 prefixes, update all references |
| S2 | **V2 Database Indexing** | Review all 41 migrations, add missing indexes, verify FKs |
| S3 | **RLS Verification** | Write RLS policies for all V2 tables, write verification tests |
| S4 | **V2 App Implementation** | Begin functional implementation of Support Center V2, CRM Center V2 |
| S5 | **V2 Agent Foundation** | Implement system orchestrator agent, knowledge gateway agent |
| S6 | **V2 Workflow Foundation** | Implement Tier 0-1 workflows (autonomous + entry) |
| S7 | **Docker & CI/CD** | Dockerfiles for all apps/functions, docker-compose, CD pipeline |
| S8 | **Monitoring** | Log aggregation, metrics, alerts, health checks |
| S9 | **E2E Testing** | Playwright setup, critical journeys (J1-J5) |
| S10 | **Connector Webhooks** | Facebook/Instagram inbound triggers, Gmail inbound |
| S11 | **Performance Optimization** | Benchmarking, optimization, caching |
| S12 | **Production Hardening** | DR plan, backup verification, security audit |

### 32.3 Dependency Order

```
Tables (V2 migrations)
  └── Functions (read/write tables)
       ├── Agents (call functions)
       │    └── Workflows (orchestrate agents, functions)
       ├── Apps (call functions via SDK)
       └── Connectors (called by functions)
            └── Notifications (triggered by workflows)

Infrastructure:
  CI Pipeline → Docker → CD Pipeline → Monitoring → DR
```

### 32.4 Key Milestones

| Milestone | Target Date | Deliverable |
|-----------|:-----------:|-------------|
| V2 Function Migration Complete | 2026-Q3 | All 66 functions renamed and deployed |
| V2 Database Complete | 2026-Q3 | All 41 migrations verified, indexed, RLS-tested |
| V2 App Functional (Support+CRM) | 2026-Q3 | 2 V2 apps fully functional |
| Docker + CD Pipeline | 2026-Q4 | Containerized, automated deployments |
| E2E Tests Passing | 2026-Q4 | 5 critical journeys automated |
| Production Ready (75/100) | 2027-Q1 | All gates G0-G5 passed |
| Full V2 Complete (49 agents, 33 workflows) | 2027-Q2 | All 49 agents, 33 workflows deployed |

---

> **End of MASTER_PROJECT_BIBLE.md**
>
> This document is the official source of truth for the ResQAI V2 project.
> Last updated: 2026-06-30
> Version: 2.0.0
