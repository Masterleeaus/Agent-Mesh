<div align="center">

# ResQAI

### AI-Powered Field-Service Operations Platform

**ResQAI** is an open-source, AI-assisted field-service management platform built on the [Lemma](https://lemma.work) pod architecture. It orchestrates support tickets, account health monitoring, technician scheduling, service disputes, and operations KPIs through a unified event-driven system with human-in-the-loop AI agents.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)](.nvmrc)
[![MIT License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

![ResQAI Banner](https://placehold.co/1200x400/1a1a2e/e0e0e0?text=ResQAI+v2&font=montserrat)

**Build-ready · Type-safe · Event-driven · Human-in-the-loop**

</div>

---

## Vision

ResQAI aims to be the definitive open-source platform for field-service operations where AI augments every decision without replacing human judgment. Technicians get dispatched intelligently, support tickets are triaged before they pile up, account health is monitored proactively, and disputes are resolved fairly with AI-assisted analysis. All data stays under your control on your own Lemma pod.

---

## Features

- **AI-Driven Ticket Triage** — Automatically classify, prioritize, and route incoming support tickets by urgency, type, and required skill set.
- **Proactive Account Health Monitoring** — Continuous health scoring (0-1) across accounts with automated flagging of at-risk relationships.
- **Intelligent Technician Dispatch** — Skill-based technician matching with real-time availability checks and urgent-dispatch escalation.
- **Dispute Resolution Assistant** — AI-powered analysis of customer-provider claims with recommended resolutions and evidence tracking.
- **Operations KPI Dashboard** — Real-time metrics on ticket volumes, SLA adherence, technician utilization, and appointment completion rates.
- **Follow-up Slippage Detection** — Automated daily scans identifying overdue and at-risk follow-ups with escalation triggers.
- **Event-Driven Architecture** — Typed publish-subscribe event bus connecting applications, workflows, agents, and notifications.
- **Human-in-the-Loop AI** — Every agent produces recommendations, not actions. Humans approve, modify, or reject at every decision boundary.
- **Role-Based Access Control** — Granular permissions across applications, features, and data with RoleGuard and FeatureGuard components.
- **Monorepo with npm Workspaces** — Shared SDK, design system, types, and utilities across 5 production applications and 9 next-gen V2 applications.
- **66 Production-Ready Serverless Functions** — Fully tested Python async functions with Pydantic validation, audit logging, and event publishing.
- **11 Automated Workflows** — From ticket intake to urgent dispatch, each workflow is a directed graph of agents, functions, decisions, and human gates.

---

## Screenshots

| Application | Preview |
|-------------|---------|
| **Support Queue** | ![Support Queue](https://placehold.co/800x450/1e293b/94a3b8?text=Support+Queue) |
| **CRM Tracker** | ![CRM Tracker](https://placehold.co/800x450/1e293b/94a3b8?text=CRM+Tracker) |
| **Ops Dashboard** | ![Ops Dashboard](https://placehold.co/800x450/1e293b/94a3b8?text=Ops+Dashboard) |
| **Appointment Board** | ![Appointment Board](https://placehold.co/800x450/1e293b/94a3b8?text=Appointment+Board) |
| **Resolution Center** | ![Resolution Center](https://placehold.co/800x450/1e293b/94a3b8?text=Resolution+Center) |

---

## Architecture

```
APPLICATIONS (React 18 + Vite)
  Support Queue | CRM Tracker | Ops Dashboard
  Appointment Board | Resolution Center
  Customer Portal (V2) | Technician Portal (V2)
            |
SHARED LAYER (@resqai/foundation)
  SDK | Design System | Events | Navigation | Auth/RBAC
  State | Layouts | Utils | Permissions
            |
LEMMA POD PLATFORM
            |
  WORKFLOW LAYER (11 DAGs)
    ticket-intake -> daily-standup -> urgent-dispatch -> ...
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

The architecture follows a layered pattern: React applications consume the shared `@resqai/foundation` SDK which communicates with a Lemma pod. The pod hosts the database tables, Python serverless functions, AI agents, and workflow definitions. An event bus connects all layers with typed publish-subscribe semantics.

---

## Applications

### V1 Production Apps

| Application | Description | Routes | Status |
|-------------|-------------|--------|--------|
| **Support Queue** | Urgency-first ticket triage with AI classification, reply drafting, and escalation management. | /, /tickets/:id, /new | Build-ready |
| **CRM Tracker** | Account health monitoring with automated health scans, risk signals, and relationship tracking. | /, /accounts/:id, /health | Build-ready |
| **Ops Dashboard** | Morning standup KPI dashboard with AI coordinator, SLA metrics, and operations log. | /, /standup, /metrics | Build-ready |
| **Appointment Board** | Technician scheduling with AI skill-based suggestions, calendar view, and dispatch controls. | /, /appointments/:id, /schedule | Build-ready |
| **Resolution Center** | Service dispute resolution with AI analysis of claims, evidence management, and resolution tracking. | /, /disputes/:id, /resolved | Build-ready |

All V1 apps pass `tsc --noEmit` and `vite build` with zero errors.

### V2 Next-Gen Apps (Scaffolded)

| Application | Purpose |
|-------------|---------|
| **Support Center** | Unified multi-channel support with real-time ticket feed and SLA dashboards. |
| **CRM Center** | Advanced CRM with relationship graphs, health trends, and automated outreach. |
| **Operations Center** | Command center with real-time ops metrics, resource allocation, and incident management. |
| **Appointment Center** | Full appointment lifecycle management with calendar sync and scheduling optimization. |
| **Resolution Center V2** | Enhanced dispute resolution with evidence uploads, mediation workflows, and audit trails. |
| **Customer Portal** | Self-service portal for ticket submission, appointment booking, and dispute filing. |
| **Technician Portal** | Mobile-first workspace for job assignments, navigation, parts lookup, and check-in/out. |
| **Admin Center** | System configuration, user management, role administration, and audit log browsing. |
| **Analytics Center** | Custom report builder, KPI dashboards, scheduled exports, and trend analysis. |

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18.3 | UI component library |
| TypeScript 5.5 | Type-safe JavaScript |
| Vite 8.1 | Build tool and dev server |
| Vitest 4.1 | Unit and integration testing |
| ESLint + Prettier | Static analysis and code formatting |

### Backend / Serverless

| Technology | Purpose |
|------------|---------|
| Python 3.13 | Serverless function runtime |
| Pydantic 2+ | Input/output validation via data models |
| pytest 8+ | Function testing framework |
| lemma-sdk | Python SDK for pod interaction (`Pod.from_env()`) |

### Platform

| Technology | Purpose |
|------------|---------|
| Lemma Pod | Backend platform - tables, agents, functions, workflows, auth |
| Lemma CLI | CLI tool for pod management (import, deploy, sync) |

---

## AI Layer

Six AI agents operate within the Lemma pod, each with a defined role, typed input/output schema, table permissions, and workflow integration. Every agent follows the **AI-drafts-human-approves** pattern producing recommendations, never final actions.

| Agent | Role | Tables Read | Tables Written |
|-------|------|-------------|----------------|
| **request-classifier** | Classifies tickets by type, urgency, and suggested technician owner | tickets, technicians | tickets |
| **support-reply-drafter** | Drafts customer-facing replies based on ticket context and history | tickets, technicians, customers | tickets |
| **operations-coordinator** | Produces prioritized ops recommendations from standup data | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log |
| **resolution-advisor** | Analyzes disputes, evaluates evidence, recommends resolutions | disputes, customers, appointments, tickets, operations_log | disputes, operations_log |
| **account-health-monitor** | CRM health lead - calls health scan functions, flags at-risk accounts | accounts, followups, customers, appointments, disputes, tasks | tasks, operations_log |
| **tech-suggester** | Suggests best-fit technicians for urgent dispatches | technicians, tickets | tickets |

Each agent ships with `agent.json`, `instruction.md` (system prompt), input/output JSON Schema, `permissions.json`, `runtime.json`, and `workflow-role.md`.

### Agent Design Principles

- **Safe to re-run** — All agents are stateless and non-destructive
- **Idempotent** — Multiple invocations produce the same result
- **Workflow-first** — Agents are nodes in workflow DAGs, not standalone services
- **Schema-enforced** — Every agent validates I/O against JSON Schema
- **Observable** — Every decision is logged to `operations_log`

---

## Workflow Layer

Eleven Lemma workflows orchestrate business processes as directed acyclic graphs. Each workflow is triggered by an event (table INSERT/UPDATE), a CRON schedule, or a manual invocation. Nodes can be AGENT, FUNCTION, DECISION, or HUMAN (form-based approval).

| Workflow | Trigger | Node Chain |
|----------|---------|------------|
| **ticket-intake** | ticket.created event | AGENT(classifier) -> FUNCTION(check-urgency) -> DECISION -> HUMAN -> AGENT(drafter) -> FUNCTION(update-ticket) |
| **account-health-monitoring** | CRON 0 2 * * * | FUNCTION(health-scan) -> AGENT(health-monitor) -> DECISION -> FUNCTION(create-tasks) |
| **urgent-dispatch** | tickets INSERT/UPDATE | FUNCTION(check-urgency) -> AGENT(tech-suggester) -> HUMAN(dispatch-approval) |
| **dispute-resolution** | dispute.created event | AGENT(resolution-advisor) -> FUNCTION(resolve-dispute) -> HUMAN(final-approval) |
| **appointment-assignment** | appointment.created event | FUNCTION(assign-technician) -> HUMAN(confirm) -> FUNCTION(notify) |
| **appointment-reminders** | CRON 0 7 * * * | FUNCTION(list-upcoming) -> FUNCTION(dispatch-reminders) |
| **support-escalation-manager** | ticket.escalated event | DECISION -> AGENT(classifier) -> HUMAN -> FUNCTION(escalate-ticket) |
| **followup-slippage-detector** | CRON 0 6 * * 1-5 | FUNCTION(flag-slipping) -> DECISION -> FUNCTION(create-tasks) -> FUNCTION(notify) |
| **customer-satisfaction-monitor** | CRON 0 9 * * 1 | FUNCTION(collect-feedback) -> AGENT -> FUNCTION(update-metrics) |
| **daily-standup** | CRON 0 8 * * 1-5 | FUNCTION(aggregate-metrics) -> AGENT(coordinator) -> HUMAN(review) |
| **account-health** | health-score-changed event | DECISION -> FUNCTION(update-status) -> FUNCTION(notify) |

### Workflow Design Principles

1. **Event-First Execution** — Workflows start from table events or CRON; no polling
2. **Single Business Process** — Each workflow owns exactly one end-to-end process
3. **Deterministic Routing** — AI makes content decisions; routing is logic-based
4. **Fail Closed** — Errors halt execution with logged context
5. **Correlation ID Flow** — Every workflow instance carries a correlation ID through all nodes
6. **Human Gate at Boundaries** — Humans approve cross-boundary actions
7. **Idempotent by Design** — Re-running a completed workflow is a no-op
8. **Observable by Default** — Every node execution is logged with input, output, and duration

---

## Function Layer

**66 Python async serverless functions** organized by domain, each with Pydantic-validated I/O, audit logging, event publishing, and pytest test suites (288+ total test cases).

| Domain | Count | Examples |
|--------|-------|---------|
| **Support** | 9 | create_ticket, assign_ticket, escalate_ticket, check_ticket_urgency |
| **CRM** | 10 | create_customer, account_health_scan, update_account_health |
| **Operations** | 12 | finalize_dispatch, create_work_order, flag_slipping_followups |
| **Appointments** | 8 | create_appointment, assign_appointment_technician, complete_appointment |
| **Notifications** | 4 | dispatch_notifications, send_bulk_notification |
| **Analytics** | 5 | analytics_aggregation, dashboard_metrics, create_report |
| **Administration** | 9 | create_user, create_role, manage_permission, record_audit |
| **Technicians** | 4 | create_technician, update_technician_skills |
| **Disputes** | 3 | resolve_dispute, list_disputes |
| **Authentication** | 2 | authenticate_user, validate_session |

Each function follows a consistent pattern:

```
function-name/
  function.json         # Lemma platform metadata + permissions
  schemas/input.json    # Input JSON Schema
  schemas/output.json   # Output JSON Schema
  src/handler.py        # Async handler with business logic
  src/models.py         # Pydantic input/output models
  tests/test_*.py       # Pytest test suite
```

Handler signature pattern:

```python
async def function_name(ctx: FunctionContext, data: InputModel) -> OutputModel:
    pod = Pod.from_env()
    # Business logic with audit logging
```

---

## Database Layer

### V1 Schema (9 tables, 109 seed records)

| Table | Records | Key Columns |
|-------|---------|-------------|
| customers | 14 | id, name, phone, email, address, status |
| technicians | 8 | id, name, skill, availability, rating, status |
| tickets | 14 | id, customer_id, channel, subject, type, urgency, status |
| appointments | 15 | id, customer_id, technician_id, service_type, date, status |
| disputes | 4 | id, appointment_id, customer_claim, provider_claim, status |
| tasks | 12 | id, title, owner, priority, status, due_date |
| operations_log | 13 | id, action, result, timestamp, actor |
| accounts | 14 | id, customer_id, name, health_score, relationship_status |
| followups | 15 | id, account_id, type, subject, status, priority, due_date |

Foreign key relationships: appointments -> customers, appointments -> technicians, disputes -> appointments, accounts -> customers, followups -> accounts/customers/appointments/tickets/disputes.

### V2 Migration Schema (41 migrations)

The V2 schema extends the data model with tables for users, roles, permissions, notifications, work orders, inventory, knowledge articles, feedback, analytics reports, audit logs, and more. Each migration has a corresponding rollback script.

Full schema documentation in `docs/database.md` and `database/migrations_v2/`.

---

## Event Layer

A typed publish-subscribe event system built around `EventBus` connects all platform layers. Each domain publishes and subscribes to typed events.

### Event Modules

| Module | Events | Description |
|--------|--------|-------------|
| `EventBus.ts` | on(), emit(), off() | Core publish-subscribe event bus |
| `WorkflowEvents.ts` | workflow:* | Workflow lifecycle (started, stepCompleted, completed, failed, paused) |
| `ApplicationEvents.ts` | app:* | App lifecycle, routing, theme changes |
| `AgentEvents.ts` | agent:* | Agent conversation and execution events |
| `NotificationEvents.ts` | notification:* | Notification add, dismiss, clear |

### Event Naming Convention

All events follow the `domain:action` pattern:

- `app:routeChanged`, `app:themeToggled`
- `workflow:started`, `workflow:stepCompleted`, `workflow:failed`
- `agent:executionStarted`, `agent:responseReceived`
- `notification:added`, `notification:dismissed`

### Event-Driven Triggers

- **Table Events** — INSERT/UPDATE/DELETE on tables (e.g., ticket.created)
- **Scheduled Events** — CRON-based time triggers (nightly at 2AM)
- **Manual Events** — Human-initiated via UI (e.g., "Run health check")
- **Workflow Events** — Completion/failure of other workflows
- **External Webhooks** — Inbound from connectors

---

## Project Structure

```
ResQAI/
  apps/                        # 5 V1 production applications (React + Vite)
  apps_v2/                     # 9 V2 next-gen applications (scaffolded)
  packages/                    # Shared npm workspace packages
    sdk/                       #   Lemma client wrapper
    types/                     #   16 TypeScript interfaces
    config/                    #   Environment, constants, theme
    ui/                        #   13 reusable React components
    utils/                     #   String, number, date, filtering utils
  shared/                      # @resqai/foundation v2.0.0
    src/api/                   #   ApiClient, AuthMiddleware, CacheManager
    src/components/            #   21 design-system components
    src/design-system/         #   ThemeProvider, tokens, styles
    src/events/                #   EventBus, typed event modules
    src/layouts/               #   Dashboard, Detail, Split, Wizard layouts
    src/navigation/            #   Sidebar, Breadcrumbs, AppSwitcher
    src/permissions/           #   RoleGuard, FeatureGuard, PermissionGuard
    src/state/                 #   Auth, Global, Notification state
    src/utils/                 #   Config, date, formatting, logging
  agents/                      # 6 AI agent definitions
  workflows/                   # 11 Lemma workflow definitions (JSON)
  functions/                   # 66 Python serverless functions
  database/                    # 41 V2 migrations, 41 rollbacks, seed data
  scripts/                     # Build, dev, test, validate, seed, clean
  docs/                        # Full documentation suite
    v2/functions/              #   Function reference, catalog, tests
    v2/workflows/              #   Workflow architecture, build order
    v2/realtime/               #   Realtime architecture, sync policy
    v2/standards/              #   Engineering, coding, naming standards
  integration/                 # Cross-app integration contracts
  infrastructure/              # (Reserved) Docker, K8s, Terraform
  .github/workflows/ci.yml    # GitHub Actions CI pipeline
```

---

## Installation

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- Python 3.13+
- Access to a Lemma pod (with pod ID and API URL)
- Lemma CLI (optional, for pod management)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/resqai.git
cd resqai

# Install Node.js dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Lemma pod ID, API URL, and auth credentials

# Install Python function dependencies
cd functions
pip install -r requirements.txt
pip install -r requirements-dev.txt  # for testing
cd ..
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_LEMMA_POD_ID | Your Lemma pod UUID |
| VITE_LEMMA_API_URL | Lemma API endpoint (https://api.lemma.work) |
| VITE_LEMMA_AUTH_URL | Auth endpoint (https://lemma.work/auth) |
| VITE_LEMMA_APP_ID | Application ID for auth |
| VITE_LEMMA_CLIENT_ID | Client ID for auth |
| VITE_LEMMA_TOKEN | Lemma CLI token (dev only) |

Feature flags: `VITE_ENABLE_HEALTH_SCAN`, `VITE_ENABLE_SLIPPING_ALERTS`, `VITE_ENABLE_COORDINATOR`.

---

## Development

```bash
# Start all apps in development mode
npm run dev

# Start a specific app with CLI token injection
npx tsx scripts/dev.ts support-queue

# Type-check all apps
npm run validate

# Run all tests
npm run test

# Build all apps for production
npm run build

# Clean build artifacts
npm run clean

# List seed data
npm run seed
```

The dev script injects your Lemma CLI token to bypass OAuth on localhost for development convenience.

### Python Function Development

```bash
cd functions/function-name
pytest tests/ -v              # Run function tests
pytest --cov=src tests/       # Run with coverage
```

### CI Pipeline

The GitHub Actions CI (`.github/workflows/ci.yml`) runs on push/PR to `main`:

1. Setup Node 22 + Python 3.13
2. Install all dependencies
3. Type-check all applications (`tsc --noEmit`)
4. Run all tests
5. Build all applications

---

## Documentation Links

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Full system architecture and design decisions |
| [Database Schema](docs/database.md) | Table schemas, relationships, ER diagram |
| [Function Catalog](docs/functions.md) | All functions, their I/O, and invocation patterns |
| [Agent Specifications](docs/agents.md) | Agent roles, prompts, permissions, and integration |
| [Deployment Guide](docs/deployment.md) | Build artifacts, hosting options, deployment steps |
| [Workflow Design](docs/workflow-design.md) | Workflow patterns, node types, and examples |
| [V2 Functions](docs/v2/functions/) | Function reference, API endpoints, dependency graph |
| [V2 Workflows](docs/v2/workflows/) | Workflow architecture, build order, event catalog |
| [V2 Realtime](docs/v2/realtime/) | Realtime architecture, sync policy, subscriptions |
| [V2 Standards](docs/v2/standards/) | Engineering, coding, UI, AI, and testing standards |
| [V2 Implementation Plan](docs/v2/implementation/) | Build blueprint, sprint plan, roadmap, milestones |
| [Integration](integration/) | Cross-application contracts, models, permissions, routing |
| [Security](docs/security/) | Security documentation and best practices |
| [Testing](docs/testing/) | Testing strategy and coverage reports |
| [Contributing](CONTRIBUTING.md) | How to contribute to ResQAI |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community standards |
| [Changelog](CHANGELOG.md) | Release history and change notes |

---

## Future Roadmap

### Phase 1 — Foundation (Complete)
- Database schema with 9 core tables and seed data
- 66 production-ready Python serverless functions with test suites
- 6 AI agent definitions with typed schemas and permissions
- 11 Lemma workflow definitions as directed graph DAGs
- 5 React + Vite production applications (build-ready)

### Phase 2 — V2 Architecture (Scaffolded)
- 9 next-generation applications scaffolded
- `@resqai/foundation` shared package with design system, events, layouts
- 41 V2 database migrations with full FK relationships
- CQRS function design pattern
- Role-based access control across all applications
- Real-time subscription and sync architecture

### Phase 3 — Infrastructure (Pending)
- Docker containerization for all services
- Docker Compose for local development
- Production deployment configuration
- Monitoring and observability (logs, metrics, alerts)
- CI/CD pipeline enhancements (auto-deploy, staging environments)

### Phase 4 — Platform (Pending)
- Lemma authentication redirect fix (blocker)
- Agent runtime harness for local development
- End-to-end integration testing
- Performance benchmarking and optimization
- Connector integrations (email, SMS, Slack, social media)

### Phase 5 — Ecosystem (Planned)
- Customer self-service portal (V2)
- Technician mobile application
- API documentation and client SDK generation
- Plugin system for custom extensions
- Multi-tenant support

---

## Contributors

ResQAI is built and maintained by the Lemma community. Contributions are welcome!

See `CONTRIBUTING.md` for guidelines on how to submit issues, feature requests, and pull requests.

---

## License

[MIT License](LICENSE)

Copyright (c) 2026 ResQAI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.