# RESQAI V2 — Naming Conventions

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [General Rules](#1-general-rules)
2. [Applications](#2-applications)
3. [Application Pages](#3-application-pages)
4. [Components](#4-components)
5. [Widgets](#5-widgets)
6. [Layouts](#6-layouts)
7. [Tables](#7-tables)
8. [Functions](#8-functions)
9. [Agents](#9-agents)
10. [Workflows](#10-workflows)
11. [Events](#11-events)
12. [Connectors](#12-connectors)
13. [Notifications](#13-notifications)
14. [Permissions](#14-permissions)
15. [Reports](#15-reports)
16. [Packages](#16-packages)
17. [Environment Variables](#17-environment-variables)
18. [Git Branches](#18-git-branches)

---

## 1. General Rules

| Rule | Applies To | Standard |
|------|-----------|----------|
| Case | All identifiers | `camelCase` for JS/TS variables and functions; `PascalCase` for classes, components, types; `UPPER_SNAKE_CASE` for constants and env vars; `snake_case` for Python, tables, columns, events |
| Descriptiveness | All | Names must describe purpose. No abbreviations except industry-standard (e.g., `SMS`, `API`, `URL`). No single-letter names except loop indices |
| Length | All | Max 50 characters for identifiers. Max 100 characters for file paths |
| Language | All | American English. No transliteration. No mixed languages |
| Prefix | V2 resources | All V2 tables, apps, functions use `v2_` prefix or `_v2` suffix to distinguish from V1 |
| Reserved | All | Never use: `data`, `info`, `temp`, `tmp`, `stuff`, `misc`, `util` (too vague) |

## 2. Applications

### Pattern
`{domain}-{purpose}_v2`

### Examples
- `support-center_v2` — Support ticket management
- `operations-center_v2` — Operations dashboard
- `appointment-center_v2` — Appointment scheduling
- `technician-portal_v2` — Technician mobile/desktop portal
- `customer-portal_v2` — Customer self-service portal
- `resolution-center_v2` — Dispute resolution
- `crm-center_v2` — Customer relationship management
- `notification-center_v2` — Notification management
- `analytics-center_v2` — Analytics and reporting
- `admin-center_v2` — System administration

### Directory Name
Kebab-case matching app name: `apps/{domain}-center_v2/`

### App Route
`/v2/{domain}-{purpose}`

### Rules
- Use `-center` for management/dashboard apps
- Use `-portal` for self-service/customer-facing apps
- Suffix with `_v2` for V2 identity
- Max 3 hyphens in name

---

## 3. Application Pages

### Pattern
`{Resource}{Action}`

### Examples
- `TicketList`
- `TicketDetail`
- `TicketCreate`
- `TicketEdit`
- `CustomerProfile`
- `TechnicianSchedule`
- `AppointmentCalendar`
- `ReportBuilder`

### Directory Name
Pages live in `apps/{app-name}/src/pages/{resource}-{action}/`

### File Name
`index.tsx` for the page component

### Route
`/v2/{app}/{resource}/{action}`

### Rules
- Never use ambiguous names like `Dashboard`, `Home`, `Main` (use `Overview` instead)
- List pages: `{PluralResource}List`
- Detail pages: `{SingularResource}Detail`
- Create pages: `{SingularResource}Create`
- Edit pages: `{SingularResource}Edit`
- Nested routes: `{ParentResource}Detail/{ChildResource}List`

---

## 4. Components

### Pattern
`{Domain}{ComponentName}`

### Examples
- `TicketStatusBadge`
- `CustomerAvatar`
- `TechnicianAvailabilityCard`
- `AppointmentTimePicker`
- `NotificationBell`
- `MetricChart`
- `DataTable`
- `SearchInput`
- `ConfirmDialog`
- `EmptyState`

### Directory Name
`apps/{app-name}/src/components/{domain}/{ComponentName}/`

### File Name
Component file: `{ComponentName}.tsx`  
Styles: `{ComponentName}.styles.ts` (if needed, prefer Tailwind)  
Tests: `{ComponentName}.test.tsx`  
Story: `{ComponentName}.stories.tsx` (optional)

### Export Rules
- Named export for the component
- Default export for lazy-loaded route components only
- Index file (`index.ts`) re-exports public components

### Rules
- One component per directory (exception: tightly coupled helper components)
- Component name must match directory name
- Generic reusable components go in `packages/resqai-ui/src/components/{ComponentName}/`
- App-specific components stay in `apps/{app-name}/src/components/`

---

## 5. Widgets

### Pattern
`{Domain}{Purpose}Widget`

### Examples
- `TicketSummaryWidget`
- `TechnicianLoadWidget`
- `AppointmentStatsWidget`
- `CustomerHealthWidget`
- `MetricTrendWidget`
- `RecentActivityWidget`

### Directory Name
`apps/{app-name}/src/widgets/{Domain}{Purpose}Widget/`

### File Name
Widget: `{Domain}{Purpose}Widget.tsx`  
Widget config: `{Domain}{Purpose}Widget.config.ts`

### Rules
- Widgets are self-contained dashboard tiles
- Each widget has a config file defining grid position, refresh interval, data source
- Widgets must be independently testable with mock data
- Max 200 lines per widget (if larger, extract sub-components)

---

## 6. Layouts

### Pattern
`{LayoutType}Layout`

### Examples
- `AppLayout` — Standard sidebar + header + content
- `AuthLayout` — Login/signup centered layout
- `BlankLayout` — Full-page no chrome
- `SettingsLayout` — Settings sidebar + content
- `DashboardLayout` — Grid-based widget layout
- `SplitLayout` — Two-panel layout
- `WizardLayout` — Multi-step form layout

### Directory Name
`apps/{app-name}/src/layouts/{LayoutType}Layout/`

### File Name
Layout: `{LayoutType}Layout.tsx`

### Rules
- Layouts handle only chrome (header, sidebar, footer). Not page content.
- Layouts provide `<Outlet />` slots for nested routes
- Auth guards are implemented as layout wrappers, not in individual pages

---

## 7. Tables

### Pattern
`v2_{domain}_{entity}` (schema: `v2_{domain}`)

### Examples
- `v2_identity_users` (schema: `v2_identity`)
- `v2_identity_organizations`
- `v2_identity_roles`
- `v2_identity_role_permissions`
- `v2_core_tickets` (schema: `v2_core`)
- `v2_core_ticket_statuses`
- `v2_operations_work_orders` (schema: `v2_operations`)
- `v2_operations_technician_schedule`
- `v2_billing_invoices` (schema: `v2_billing`)
- `v2_settings_email_templates` (schema: `v2_settings`)

### Column Names
- `snake_case` — `ticket_id`, `customer_name`, `created_at`
- Primary key: `{singular_entity}_id` (e.g., `ticket_id`)
- Foreign key: `{referenced_singular_entity}_id` (e.g., `customer_id`)
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft delete)
- Status: `{entity}_status` (e.g., `ticket_status`)
- Boolean prefixes: `is_`, `has_`, `can_` (e.g., `is_active`, `has_attachments`)

### Enum Tables
Pattern: `v2_{domain}_{entity}_statuses`, `v2_{domain}_{entity}_types`

### Rules
- V1 tables keep original names; V2 tables use `v2_` prefix
- Always include `created_at`, `updated_at`, `updated_by`
- Soft delete uses `deleted_at` (nullable timestamp)
- Always include `org_id` for multi-tenant RLS
- Max 50 columns per table

---

## 8. Functions

### Pattern
`v2_{domain}_{action}_{entity}`

### Action Prefixes
| Prefix | Meaning |
|--------|---------|
| `det_` | Read (DET/GET) — `v2_core_det_ticket` |
| `wri_` | Write (WRI/POST/PUT) — `v2_core_wri_ticket` |
| `agg_` | Aggregate — `v2_core_agg_ticket_metrics` |
| `orc_` | Orchestrate — `v2_core_orc_dispatch_technician` |
| `tra_` | Transform — `v2_notification_tra_format_sms` |

### Examples
- `v2_identity_det_user` — GET user
- `v2_identity_wri_user` — CREATE/UPDATE user
- `v2_core_det_ticket` — GET ticket
- `v2_core_wri_ticket` — CREATE/UPDATE ticket
- `v2_core_agg_ticket_metrics` — Ticket statistics
- `v2_core_orc_dispatch_technician` — Dispatch workflow
- `v2_notification_tra_format_sms` — Format SMS

### File Name
Functions use the Lemma naming convention: `{function_name}.py`

### Rules
- One file per function
- Function name === file name
- Function file contains one main handler function named `handler`
- Helper functions are private (prefixed with `_`)

---

## 9. Agents

### Pattern
`v2_{domain}_{role}_agent`

### Examples
- `v2_system_orchestrator_agent` — System orchestrator
- `v2_knowledge_gateway_agent` — Knowledge retrieval
- `v2_ticket_agent` — Ticket domain
- `v2_customer_agent` — Customer domain
- `v2_technician_agent` — Technician domain
- `v2_appointment_agent` — Appointment domain
- `v2_dispatch_agent` — Dispatch domain
- `v2_billing_agent` — Billing domain
- `v2_notification_agent` — Notification domain
- `v2_escalation_agent` — Escalation domain

### Extended Agents
`v2_{domain}_{subrole}_agent`

- `v2_ticket_priority_agent` — Ticket prioritization
- `v2_ticket_routing_agent` — Ticket routing
- `v2_ticket_sla_agent` — SLA monitoring
- `v2_ticket_resolution_agent` — Resolution suggesting

### File Name
`v2_{domain}_{role}_agent.py`

### Rules
- Agent names start with `v2_` and end with `_agent`
- Executive agents: `v2_system_*` and `v2_knowledge_*`
- Core domain agents: `v2_{domain}` (12 domains)
- Extended domain agents: `v2_{domain}_{subrole}`

---

## 10. Workflows

### Pattern
`v2_{domain}_{action}_{entity}_wf`

### Examples
- `v2_core_create_ticket_wf`
- `v2_core_assign_technician_wf`
- `v2_core_resolve_ticket_wf`
- `v2_billing_generate_invoice_wf`
- `v2_notification_send_alert_wf`
- `v2_operations_dispatch_work_order_wf`

### Tier Prefixes (internal routing)
Not part of the visible name, but internal workflow metadata uses tier:
- Tier 0: `w_0_` — Autonomous (no human)
- Tier 1: `w_1_` — Entry (human-initiated)
- Tier 2: `w_2_` — Secondary
- Tier 3: `w_3_` — Execution
- Tier 4: `w_4_` — Notification
- Tier 5: `w_5_` — Reporting
- Tier 6: `w_6_` — Maintenance
- Tier 7: `w_7_` — System

### File Name
`v2_{domain}_{action}_{entity}_wf.py`

### Rules
- Workflow names end with `_wf`
- Use active verbs: `create`, `assign`, `resolve`, `generate`, `send`, `dispatch`
- Avoid `process`, `handle`, `manage` (too vague)

---

## 11. Events

### Pattern
`v2.{domain}.{entity}.{action}.{outcome}`

### Examples
- `v2.core.ticket.created` — Ticket created
- `v2.core.ticket.assigned` — Ticket assigned
- `v2.core.ticket.resolved` — Ticket resolved
- `v2.billing.invoice.generated` — Invoice generated
- `v2.operations.work_order.dispatched` — Work order dispatched
- `v2.notification.sms.sent` — SMS sent
- `v2.notification.email.failed` — Email failed

### Rules
- Dot-separated, lowercase, max 5 segments
- First segment: `v2`
- Second segment: domain (e.g., `core`, `billing`, `identity`)
- Third segment: entity (e.g., `ticket`, `invoice`)
- Fourth segment: action in past tense (e.g., `created`, `assigned`)
- Fifth segment: outcome (optional, e.g., `success`, `failed`)

---

## 12. Connectors

### Pattern
`v2_{provider}_connector`

### Examples
- `v2_twilio_connector` — SMS
- `v2_sendgrid_connector` — Email
- `v2_slack_connector` — Slack notifications
- `v2_mongodb_connector` — External MongoDB
- `v2_mapbox_connector` — Mapping/geocoding
- `v2_openai_connector` — LLM gateway

### File Name
`v2_{provider}_connector.py`

### Rules
- One file per connector
- Connector class: `{Provider}Connector` (PascalCase)
- Methods mirror external API actions: `send_sms()`, `send_email()`, `send_message()`, `query()`, `geocode()`, `chat_completion()`

---

## 13. Notifications

### Pattern
`v2_{channel}_{template_name}_notification`

### Channel Prefixes
| Prefix | Channel |
|--------|---------|
| `email_` | Email |
| `sms_` | SMS |
| `push_` | Push notification |
| `inapp_` | In-app notification |
| `slack_` | Slack message |

### Examples
- `v2_email_ticket_assigned_notification`
- `v2_inapp_ticket_assigned_notification`
- `v2_sms_appointment_reminder_notification`
- `v2_push_work_order_notification`
- `v2_slack_escalation_alert_notification`

### Template Names
Templates use the same pattern without `_notification` suffix: `v2_email_ticket_assigned.html`

### Rules
- Notification name describes the trigger event
- One notification can have multiple channel variants
- Template variables use `{{variable_name}}` syntax

---

## 14. Permissions

### Pattern
`v2:{domain}:{action}:{resource}`

### Actions
`create`, `read`, `update`, `delete`, `approve`, `assign`, `export`, `manage`

### Examples
- `v2:ticket:read:ticket` — Read tickets
- `v2:ticket:create:ticket` — Create tickets
- `v2:ticket:assign:ticket` — Assign tickets
- `v2:billing:read:invoice` — Read invoices
- `v2:billing:manage:invoice` — Full invoice control
- `v2:admin:manage:users` — User management
- `v2:admin:manage:system` — System configuration

### Role Names
- `v2_admin` — Full system access
- `v2_dispatch` — Dispatch operations
- `v2_technician` — Field technician
- `v2_customer` — Customer self-service
- `v2_readonly` — Read-only reporting

---

## 15. Reports

### Pattern
`v2_{domain}_{entity}_{metric}_report`

### Examples
- `v2_core_ticket_volume_report`
- `v2_core_sla_compliance_report`
- `v2_billing_revenue_report`
- `v2_operations_technician_productivity_report`
- `v2_customer_satisfaction_report`
- `v2_system_audit_log_report`

### Rules
- Report names describe what they measure
- Use `_report` suffix
- Avoid `summary`, `overview` (redundant)

---

## 16. Packages

### Pattern
`resqai-{purpose}` (internal packages)

### Examples
- `resqai-types` — Shared TypeScript interfaces
- `resqai-utils` — Shared utility functions
- `resqai-errors` — Shared error classes
- `resqai-config` — Shared configuration
- `resqai-ui` — Shared UI components
- `resqai-test-utils` — Shared test helpers

### Rules
- Scope: `@resqai/{purpose}` for npm packages
- Python packages: `resqai_{purpose}` (snake_case for Python)
- Version independently with semver

---

## 17. Environment Variables

### Pattern
`RESQAI_{COMPONENT}_{PROPERTY}`

### Examples
- `RESQAI_DB_HOST`
- `RESQAI_DB_PORT`
- `RESQAI_EVENT_BUS_TOPIC`
- `RESQAI_TWILIO_ACCOUNT_SID`
- `RESQAI_SENDGRID_API_KEY`
- `RESQAI_OPENAI_API_KEY`
- `RESQAI_LOG_LEVEL`
- `RESQAI_ENVIRONMENT`

### Rules
- Always uppercase with underscores
- Prefix with `RESQAI_`
- Component indicator: `DB_`, `EVENT_BUS_`, `TWILIO_`, `SENDGRID_`, etc.
- Never share environment variables between components

---

## 18. Git Branches

### Pattern
`{type}/{track}/{description}`

### Types
| Type | Purpose |
|------|---------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `refactor/` | Code refactoring |
| `docs/` | Documentation |
| `test/` | Testing |
| `chore/` | Build/config |
| `perf/` | Performance |

### Tracks
| Track | Team |
|-------|------|
| `platform/` | Platform team |
| `be/` | Backend team |
| `fe-alpha/` | Frontend Alpha |
| `fe-beta/` | Frontend Beta |
| `fe-gamma/` | Frontend Gamma |
| `agent/` | Agent team |
| `wf/` | Workflow team |

### Examples
- `feat/be/v2_core_wri_ticket`
- `fix/fe-alpha/support-center-routing`
- `refactor/agent/ticket-agent-prompt`
- `docs/platform/event-catalog-update`

### Rules
- Branch names are lowercase, hyphens between words
- Description is short (max 50 chars)
- Delete branch after merge
- Never commit directly to `main` or `develop`

---

> **End of NAMING_CONVENTIONS.md**
