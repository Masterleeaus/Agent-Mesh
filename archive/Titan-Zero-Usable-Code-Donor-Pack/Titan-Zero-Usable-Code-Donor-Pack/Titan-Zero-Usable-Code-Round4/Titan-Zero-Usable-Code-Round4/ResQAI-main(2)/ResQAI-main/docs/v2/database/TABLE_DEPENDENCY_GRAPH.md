# RESQAI V2 — Table Dependency Graph

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Dependency Types](#1-dependency-types)
2. [Full Dependency Graph](#2-full-dependency-graph)
3. [Migration Order Dependencies](#3-migration-order-dependencies)
4. [Data Ownership Matrix](#4-data-ownership-matrix)
5. [Cross-Table Read/Write Analysis](#5-cross-table-readwrite-analysis)
6. [Table Dependency Chains](#6-table-dependency-chains)
7. [Circular Dependency Analysis](#7-circular-dependency-analysis)
8. [Referential Action Mapping](#8-referential-action-mapping)

---

## 1. Dependency Types

| Symbol | Type | Description |
|:------:|------|-------------|
| FK | Foreign Key | Table A references Table B via foreign key column |
| EV | Event | Table A's mutations emit events consumed by Table B's owning app |
| DR | Data Read | Table B reads data from Table A (read-only cross-reference) |
| CF | Config | Table A provides configuration that Table B consumes |
| AL | Audit Log | Table A's mutations are recorded in audit_log_v2 |
| TX | Transactional | Tables A and B are updated in the same transaction |

---

## 2. Full Dependency Graph

### 2.1 Graphical Dependency Map

```
TIER 0 (Foundation — no dependencies)
═════════════════════════════════════════════════════════════════
  reference_data_v2             user_roles_v2
  system_settings_v2            feature_flags_v2
  knowledge_categories_v2       connectors_v2

TIER 1 (Identity — depend on foundation)
═════════════════════════════════════════════════════════════════
  users_v2 ────FK──► user_roles_v2
  user_sessions_v2 ────FK──► users_v2

TIER 2 (Core Business — depend on identity)
═════════════════════════════════════════════════════════════════
  customers_v2
  technicians_v2
  technician_skills_v2 ────FK──► technicians_v2
  customer_addresses_v2 ────FK──► customers_v2
  knowledge_articles_v2 ────FK──► knowledge_categories_v2

TIER 3 (Operational — depend on core business)
═════════════════════════════════════════════════════════════════
  accounts_v2 ────FK──► customers_v2
  tickets_v2 ────FK──► customers_v2
  appointments_v2 ────FK──► customers_v2, technicians_v2
  inventory_items_v2

TIER 4 (Detailed Operations — depend on operational)
═════════════════════════════════════════════════════════════════
  ticket_messages_v2 ────FK──► tickets_v2
  ticket_attachments_v2 ────FK──► tickets_v2
  account_health_scans_v2 ────FK──► accounts_v2
  followups_v2 ────FK──► accounts_v2, customers_v2
  appointment_reminders_v2 ────FK──► appointments_v2
  work_orders_v2 ────FK──► appointments_v2, technicians_v2, customers_v2
  disputes_v2 ────FK──► appointments_v2, customers_v2, tickets_v2

TIER 5 (Nested Details — depend on Tier 4)
═════════════════════════════════════════════════════════════════
  dispute_evidence_v2 ────FK──► disputes_v2
  work_order_stages_v2 ────FK──► work_orders_v2
  followup_attempts_v2 ────FK──► followups_v2
  tasks_v2
  task_assignments_v2 ────FK──► tasks_v2
  dispatches_v2 ────FK──► tickets_v2, appointments_v2, technicians_v2
  feedback_v2 ────FK──► customers_v2, tickets_v2, appointments_v2
  inventory_transactions_v2 ────FK──► inventory_items_v2, technicians_v2

TIER 6 (Infrastructure — depend on all)
═════════════════════════════════════════════════════════════════
  notifications_v2 ────FK──► notification_templates_v2
  notification_templates_v2
  notification_channels_v2
  role_permissions_v2 ────FK──► user_roles_v2

TIER 7 (Analytics — depend on all)
═════════════════════════════════════════════════════════════════
  analytics_reports_v2
  analytics_schedules_v2 ────FK──► analytics_reports_v2

TIER 8 (Audit — depend on all)
═════════════════════════════════════════════════════════════════
  audit_log_v2                    (no FK dependencies — independent)
  events_v2                       (no FK dependencies — independent)
  feedback_surveys_v2 ────FK──► feedback_v2
```

### 2.2 Linear Dependency DAG

```
reference_data_v2
      │
      ▼
users_v2 ──────────────────────────────────────────────────────────────┐
      │                                                                 │
      ├──► user_sessions_v2                                            │
      │                                                                 │
      ├──► role_permissions_v2 ──► user_roles_v2                      │
      │                                                                 │
      ▼                                                                 │
customers_v2                                                    technicians_v2
      │                                                                 │
      ├──► customer_addresses_v2                                       ├──► technician_skills_v2
      ├──► accounts_v2                                                 │
      ├──► tickets_v2                                                  │
      │     ├──► ticket_messages_v2                                     ├──► appointments_v2 ◄──────┐
      │     ├──► ticket_attachments_v2                                  │         │                  │
      │     └──► dispatches_v2                                          │         ├──► appointment_reminders
      │                                                                 │         ├──► work_orders_v2
      ├──► appointments_v2 (via FK) ────────────────────────────────────┘              │
      │     └──► work_orders_v2                                                        └──► work_order_stages_v2
      │     └──► disputes_v2
      │           └──► dispute_evidence_v2                              inventory_items_v2
      │                                                                       │
      └──► accounts_v2                                                       └──► inventory_transactions_v2
            └──► account_health_scans_v2
            └──► followups_v2
                  └──► followup_attempts_v2


notification_templates_v2 ──► notifications_v2

knowledge_categories_v2 ──► knowledge_articles_v2

analytics_reports_v2 ──► analytics_schedules_v2

feedback_v2 ──► feedback_surveys_v2

audit_log_v2 (independent — no FK to any table)
events_v2 (independent — no FK to any table)
system_settings_v2 (independent)
feature_flags_v2 (independent)
connectors_v2 (independent)
tasks_v2 ──► task_assignments_v2
```

---

## 3. Migration Order Dependencies

### 3.1 Strict Build Order

Tables must be created in this order due to FK constraints:

```
ORDER  TABLES                                  REASON
─────  ──────────────────────────────────────  ──────────────────────────────────
  1    reference_data_v2                        Foundation — no dependencies
  2    system_settings_v2                       Foundation — no dependencies
  3    feature_flags_v2                         Foundation — no dependencies
  4    connectors_v2                            Foundation — no dependencies
  5    knowledge_categories_v2                  Foundation — no dependencies
  6    user_roles_v2                            Foundation — no dependencies
  7    users_v2                                 FK → user_roles_v2
  8    user_sessions_v2                         FK → users_v2
  9    role_permissions_v2                      FK → user_roles_v2
 10    notification_templates_v2                Foundation — no business FK
 11    notification_channels_v2                 Foundation — no business FK
 12    customers_v2                             Foundation — no FK
 13    customer_addresses_v2                    FK → customers_v2
 14    technicians_v2                           Foundation — no FK (except self)
 15    technician_skills_v2                     FK → technicians_v2
 16    accounts_v2                              FK → customers_v2
 17    tickets_v2                               FK → customers_v2
 18    appointments_v2                          FK → customers_v2, technicians_v2
 19    inventory_items_v2                       Foundation — no FK
 20    knowledge_articles_v2                    FK → knowledge_categories_v2
 21    tasks_v2                                 Foundation — no FK
 22    ticket_messages_v2                       FK → tickets_v2
 23    ticket_attachments_v2                    FK → tickets_v2
 24    account_health_scans_v2                  FK → accounts_v2
 25    followups_v2                             FK → accounts_v2, customers_v2
 26    appointment_reminders_v2                 FK → appointments_v2
 27    work_orders_v2                           FK → appointments_v2, technicians_v2, customers_v2
 28    disputes_v2                              FK → appointments_v2, customers_v2, tickets_v2
 29    dispatches_v2                            FK → tickets_v2, appointments_v2, technicians_v2
 30    feedback_v2                              FK → customers_v2, tickets_v2, appointments_v2
 31    dispute_evidence_v2                      FK → disputes_v2
 32    work_order_stages_v2                     FK → work_orders_v2
 33    followup_attempts_v2                     FK → followups_v2
 34    task_assignments_v2                      FK → tasks_v2
 35    inventory_transactions_v2                FK → inventory_items_v2
 36    notifications_v2                         FK → notification_templates_v2
 37    feedback_surveys_v2                      FK → feedback_v2
 38    analytics_reports_v2                     Foundation — no FK
 39    analytics_schedules_v2                   FK → analytics_reports_v2
 40    audit_log_v2                             No FK — independent
 41    events_v2                                No FK — independent
```

### 3.2 Parallelizable Migration Groups

| Group | Tables | Can Run In Parallel? |
|-------|--------|:-------------------:|
| 1 | reference_data_v2, system_settings_v2, feature_flags_v2, connectors_v2, knowledge_categories_v2, user_roles_v2 | **Yes** (6 independent tables) |
| 2 | users_v2 (depends on group 1) | No |
| 3 | user_sessions_v2, role_permissions_v2 | **Yes** (both depend on different parts of group 1-2) |
| 4 | notification_templates_v2, notification_channels_v2, customers_v2, technicians_v2, inventory_items_v2, tasks_v2, analytics_reports_v2 | **Yes** (7 independent tables) |
| 5 | customer_addresses_v2, technician_skills_v2, accounts_v2, tickets_v2 | **Yes** (all depend on group 4) |
| 6 | appointments_v2 | No (depends on customers + technicians) |
| 7 | knowledge_articles_v2, ticket_messages_v2, ticket_attachments_v2, account_health_scans_v2, followups_v2 | **Yes** (depend on various group 4-6 tables) |
| 8 | appointment_reminders_v2, work_orders_v2, disputes_v2, dispatches_v2, feedback_v2 | **Yes** (depend on group 6) |
| 9 | dispute_evidence_v2, work_order_stages_v2, followup_attempts_v2, task_assignments_v2, inventory_transactions_v2, notifications_v2 | **Yes** (all depend on tier 5+ tables) |
| 10 | feedback_surveys_v2, analytics_schedules_v2 | **Yes** |
| 11 | audit_log_v2, events_v2 | **Yes** |

**Minimum sequential steps: 11** (with 6 parallel groups)

---

## 4. Data Ownership Matrix

### 4.1 Table → Application Ownership

| Table | Owner App | Create | Update | Delete | Read By |
|-------|-----------|:------:|:------:|:------:|---------|
| customers_v2 | crm-center_v2 | ✓ | ✓ | ✓ | ALL apps |
| customer_addresses_v2 | crm-center_v2 | ✓ | ✓ | ✓ | support, appt, tech portals |
| technicians_v2 | technician-portal_v2 | admin | ✓ | admin | ALL apps |
| technician_skills_v2 | technician-portal_v2 | ✓ | ✓ | ✓ | appt, ops |
| tickets_v2 | support-center_v2 | ✓ | ✓ | ✓ | ALL apps |
| ticket_messages_v2 | support-center_v2 | ✓ | (system) | never | support, customer portal |
| ticket_attachments_v2 | support-center_v2 | ✓ | never | never | support, customer portal |
| appointments_v2 | appointment-center_v2 | ✓ | ✓ | ✓ | ALL apps |
| appointment_reminders_v2 | appointment-center_v2 | system | system | system | appt, ops |
| work_orders_v2 | technician-portal_v2 | ✓ | ✓ | never | ops, crm, appt |
| work_order_stages_v2 | technician-portal_v2 | system | never | never | ops, analytics |
| dispatches_v2 | operations-center_v2 | ✓ | ✓ | admin | tech, ops, support |
| disputes_v2 | resolution-center_v2 | ✓ | ✓ | admin | ALL apps |
| dispute_evidence_v2 | resolution-center_v2 | ✓ | never | admin | resolution, support |
| tasks_v2 | operations-center_v2 | ✓ | ✓ | ✓ | ALL apps |
| task_assignments_v2 | operations-center_v2 | system | system | never | ops, tech |
| accounts_v2 | crm-center_v2 | system | ✓ | admin | ALL apps |
| account_health_scans_v2 | crm-center_v2 | system | never | never | crm, analytics |
| followups_v2 | crm-center_v2 | ✓ | ✓ | ✓ | ops, crm, customer portal |
| followup_attempts_v2 | crm-center_v2 | ✓ | never | never | crm |
| knowledge_articles_v2 | support-center_v2 | ✓ | ✓ | ✓ | support, customer portal, tech |
| knowledge_categories_v2 | support-center_v2 | ✓ | ✓ | ✓ | support |
| inventory_items_v2 | operations-center_v2 | ✓ | ✓ | admin | ops, tech |
| inventory_transactions_v2 | operations-center_v2 | system | never | never | ops, analytics |
| feedback_v2 | crm-center_v2 | ✓ (system) | never | admin | crm, analytics |
| feedback_surveys_v2 | crm-center_v2 | system | never | never | crm, analytics |
| notifications_v2 | notification-center_v2 | system | system | auto-purge | ALL apps |
| notification_templates_v2 | notification-center_v2 | ✓ | ✓ | ✓ | admin |
| notification_channels_v2 | notification-center_v2 | ✓ | ✓ | ✓ | admin |
| users_v2 | admin-center_v2 | ✓ | ✓ | ✓ | ALL apps (limited) |
| user_roles_v2 | admin-center_v2 | ✓ | ✓ | ✓ | ALL apps (read) |
| role_permissions_v2 | admin-center_v2 | ✓ | ✓ | ✓ | admin (rw), ALL (read) |
| user_sessions_v2 | admin-center_v2 | system | system | auto-purge | admin |
| system_settings_v2 | admin-center_v2 | ✓ | ✓ | ✓ | ALL apps (read) |
| feature_flags_v2 | admin-center_v2 | ✓ | ✓ | ✓ | ALL apps (read) |
| connectors_v2 | admin-center_v2 | ✓ | ✓ | ✓ | admin |
| analytics_reports_v2 | analytics-center_v2 | ✓ | ✓ | ✓ | ALL apps (read) |
| analytics_schedules_v2 | analytics-center_v2 | ✓ | ✓ | ✓ | analytics |
| audit_log_v2 | admin-center_v2 | system | never | never | admin, auditor |
| events_v2 | admin-center_v2 | system | never | auto-purge | admin, analytics |
| reference_data_v2 | admin-center_v2 | ✓ | ✓ | ✓ | ALL apps (read) |

### 4.2 Write Ownership Map

No table should be mutated by more than 2 applications:

```
Table                     Write Mutations By
────────────────────────  ─────────────────────────────────
customers_v2              crm-center_v2, customer-portal_v2 (limited)
tickets_v2                support-center_v2, customer-portal_v2 (create only)
appointments_v2           appointment-center_v2, technician-portal_v2 (status only)
work_orders_v2            technician-portal_v2 (create + update)
dispatches_v2             operations-center_v2 (manage), technician-portal_v2 (status)
disputes_v2               resolution-center_v2 (manage), customer-portal_v2 (create)
followups_v2              crm-center_v2 (manage), technician-portal_v2 (complete)
tasks_v2                  operations-center_v2 (manage), technician-portal_v2 (update)
feedback_v2               crm-center_v2 (create via system)
accounts_v2               crm-center_v2 (via health scans)
All other tables          Single owner only
```

---

## 5. Cross-Table Read/Write Analysis

### 5.1 Read Intensity by Table

```
Table                     Reads/day (est. Y1)  Read Pattern
────────────────────────  ──────────────────  ─────────────────────────
tickets_v2                50,000+              Status filters, search, customer lookup
appointments_v2           30,000+              Date range, technician filter, customer lookup
accounts_v2               15,000+              Health filter, customer lookup, risk detection
customers_v2              20,000+              Search, ID lookup, status filter
followups_v2              10,000+              Status filter, due date, assigned to
notifications_v2          20,000+              Recipient lookup, status, date range
tasks_v2                  8,000+               Status filter, assigned to, due date
technicians_v2            8,000+               Availability filter, skill filter
work_orders_v2            5,000+               Technician filter, date range, status
audit_log_v2              3,000+               Entity lookup, date range, actor
disputes_v2               3,000+               Status filter, appointment lookup
ticket_messages_v2        20,000+              By ticket ID, chronological
dispatches_v2             3,000+               Status filter, technician filter
inventory_items_v2        2,000+               Category filter, low stock
reference_data_v2         50,000+              Cached heavily — high read, low write
users_v2                  5,000+               Auth lookup, role filter
```

### 5.2 Write Intensity by Table

```
Table                     Writes/day (est. Y1)  Write Pattern
────────────────────────  ───────────────────  ─────────────────────────
notifications_v2          5,000+               Append-heavy — created, status updates
events_v2                 5,000+               Append-only — system events
audit_log_v2              3,000+               Append-only — mutations
ticket_messages_v2        500+                 Append-only — message threads
tickets_v2                500+                 Lifecycle updates
appointments_v2           200+                 CRUD operations
followups_v2              150+                 CRUD operations
tasks_v2                  100+                 CRUD operations
inventory_transactions_v2 200+                 Append-only — stock movements
feedback_v2               50+                  Append-only — customer feedback
```

### 5.3 Hot Tables (High Read + High Write)

| Table | Read Volume | Write Volume | Impact | Mitigation |
|-------|:-----------:|:------------:|--------|------------|
| tickets_v2 | 50K/day | 500/day | Status queries, owner filter | Index on (status, created_at DESC) WHERE deleted_at IS NULL |
| appointments_v2 | 30K/day | 200/day | Date range queries | Index on (status, scheduled_date) |
| notifications_v2 | 20K/day | 5K/day | Recipient badge queries | Index on (recipient_type, recipient_id, status) |
| ticket_messages_v2 | 20K/day | 500/day | Thread loading | Index on (ticket_id, created_at ASC) |

---

## 6. Table Dependency Chains

### 6.1 Deepest Chains

```
Chain 1 (Customer → Full Path — 6 levels):
  reference_data_v2 ──► customers_v2 ──► tickets_v2 ──► dispatches_v2
                                                      ──► ticket_messages_v2
                                                      ──► ticket_attachments_v2

Chain 2 (Customer → Appointment → Work Order — 5 levels):
  reference_data_v2 ──► customers_v2 ──► appointments_v2 ──► work_orders_v2
                                                              └──► work_order_stages_v2

Chain 3 (Customer → Appointment → Dispute — 5 levels):
  reference_data_v2 ──► customers_v2 ──► appointments_v2 ──► disputes_v2
                                                              └──► dispute_evidence_v2

Chain 4 (Customer → Account → Followup — 5 levels):
  reference_data_v2 ──► customers_v2 ──► accounts_v2 ──► followups_v2
                                                          └──► followup_attempts_v2

Chain 5 (Technician → Appointment → Work Order — 5 levels):
  reference_data_v2 ──► technicians_v2 ──► appointments_v2 ──► work_orders_v2
                                                    ──► appointment_reminders_v2

Chain 6 (Role → Permission — 3 levels):
  reference_data_v2 ──► user_roles_v2 ──► role_permissions_v2
                      ──► users_v2
```

### 6.2 Leaf Tables (No Children)

Tables that have no FK references from other tables:

| Table | Reason |
|-------|--------|
| audit_log_v2 | Append-only audit trail |
| events_v2 | Append-only event log |
| notification_channels_v2 | Infrastructure config |
| system_settings_v2 | Key-value config |
| feature_flags_v2 | Feature toggles |
| connectors_v2 | External connection config |
| reference_data_v2 | Lookup values |
| work_order_stages_v2 | Stage history — no deeper detail |
| followup_attempts_v2 | Individual contact attempts |
| inventory_transactions_v2 | Stock movement log |
| feedback_surveys_v2 | Survey responses |
| task_assignments_v2 | Assignment history |
| ticket_attachments_v2 | File metadata |

---

## 7. Circular Dependency Analysis

### 7.1 Potential Cycles

After thorough analysis of all 40+ tables and their FK relationships:

**No circular dependencies exist.**

The dependency graph is a strict Directed Acyclic Graph (DAG) with no cycles.

### 7.2 Why No Cycles Exist

| Pattern | Prevention |
|---------|------------|
| Table A → Table B → Table A | All FK relationships are strictly hierarchical. No bidirectional FK pairs. |
| Self-referencing FK | Only `knowledge_categories_v2.parent_id` is self-referencing (category hierarchy) — this is a tree, not a cycle. |
| User → Role → Permission → User | `users_v2.role_id → user_roles_v2`, `role_permissions_v2.role_id → user_roles_v2` — both reference user_roles_v2, but user_roles_v2 has no FK back. |
| Mutual dependency | No two tables have FK references to each other. |

### 7.3 Topological Depth

| Depth | Tables |
|:-----:|--------|
| 0 | reference_data_v2, system_settings_v2, feature_flags_v2, connectors_v2, knowledge_categories_v2, user_roles_v2, notification_templates_v2, notification_channels_v2, inventory_items_v2, analytics_reports_v2 |
| 1 | users_v2, customers_v2, technicians_v2, knowledge_articles_v2 |
| 2 | customer_addresses_v2, technician_skills_v2, accounts_v2, tickets_v2, user_sessions_v2, role_permissions_v2 |
| 3 | appointments_v2, ticket_messages_v2, ticket_attachments_v2, account_health_scans_v2, followups_v2, tasks_v2, notifications_v2, analytics_schedules_v2 |
| 4 | appointment_reminders_v2, work_orders_v2, disputes_v2, dispatches_v2, feedback_v2, task_assignments_v2, inventory_transactions_v2, followup_attempts_v2 |
| 5 | work_order_stages_v2, dispute_evidence_v2, feedback_surveys_v2 |
| — | audit_log_v2, events_v2 (depth 0 — no dependencies) |

---

## 8. Referential Action Mapping

### 8.1 ON DELETE Actions

| FK Column | Parent | Child | ON DELETE | Rationale |
|-----------|--------|-------|:---------:|-----------|
| customer_addresses_v2.customer_id | customers_v2 | customer_addresses_v2 | CASCADE | If customer deleted, addresses are meaningless |
| technician_skills_v2.technician_id | technicians_v2 | technician_skills_v2 | CASCADE | Skills deleted with technician |
| tickets_v2.customer_id | customers_v2 | tickets_v2 | RESTRICT | Prevent deletion of customers with active tickets |
| appointments_v2.customer_id | customers_v2 | appointments_v2 | RESTRICT | Prevent deletion of customers with appointments |
| appointments_v2.technician_id | technicians_v2 | appointments_v2 | SET NULL | Keep appointment if technician removed |
| accounts_v2.customer_id | customers_v2 | accounts_v2 | CASCADE | Account deleted with customer |
| followups_v2.account_id | accounts_v2 | followups_v2 | CASCADE | Followups deleted with account |
| followups_v2.customer_id | customers_v2 | followups_v2 | SET NULL | Keep followup record if customer reference lost |
| ticket_messages_v2.ticket_id | tickets_v2 | ticket_messages_v2 | CASCADE | Messages deleted with ticket |
| ticket_attachments_v2.ticket_id | tickets_v2 | ticket_attachments_v2 | CASCADE | Attachments deleted with ticket |
| appointment_reminders_v2.appointment_id | appointments_v2 | appointment_reminders_v2 | CASCADE | Reminders deleted with appointment |
| work_orders_v2.appointment_id | appointments_v2 | work_orders_v2 | SET NULL | Keep work order if appointment deleted |
| work_orders_v2.technician_id | technicians_v2 | work_orders_v2 | SET NULL | Keep work order if technician removed |
| work_orders_v2.customer_id | customers_v2 | work_orders_v2 | RESTRICT | Prevent deletion of customers with work orders |
| work_order_stages_v2.work_order_id | work_orders_v2 | work_order_stages_v2 | CASCADE | Stages deleted with work order |
| dispatches_v2.ticket_id | tickets_v2 | dispatches_v2 | SET NULL | Keep dispatch if ticket deleted |
| dispatches_v2.appointment_id | appointments_v2 | dispatches_v2 | SET NULL | Keep dispatch if appointment deleted |
| dispatches_v2.technician_id | technicians_v2 | dispatches_v2 | SET NULL | Keep dispatch if technician removed |
| disputes_v2.appointment_id | appointments_v2 | disputes_v2 | RESTRICT | Prevent deletion of appointments with active disputes |
| disputes_v2.customer_id | customers_v2 | disputes_v2 | RESTRICT | Prevent deletion of customers with disputes |
| disputes_v2.ticket_id | tickets_v2 | disputes_v2 | SET NULL | Keep dispute if ticket deleted |
| dispute_evidence_v2.dispute_id | disputes_v2 | dispute_evidence_v2 | CASCADE | Evidence deleted with dispute |
| followup_attempts_v2.followup_id | followups_v2 | followup_attempts_v2 | CASCADE | Attempts deleted with followup |
| task_assignments_v2.task_id | tasks_v2 | task_assignments_v2 | CASCADE | Assignments deleted with task |
| inventory_transactions_v2.item_id | inventory_items_v2 | inventory_transactions_v2 | RESTRICT | Prevent deletion of items with transaction history |
| notifications_v2.template_id | notification_templates_v2 | notifications_v2 | SET NULL | Keep notification if template deleted |
| feedback_surveys_v2.feedback_id | feedback_v2 | feedback_surveys_v2 | CASCADE | Surveys deleted with feedback |
| analytics_schedules_v2.report_id | analytics_reports_v2 | analytics_schedules_v2 | CASCADE | Schedules deleted with report |
| users_v2.role_id | user_roles_v2 | users_v2 | SET NULL | Keep user if role deleted |
| user_sessions_v2.user_id | users_v2 | user_sessions_v2 | CASCADE | Sessions deleted with user |
| role_permissions_v2.role_id | user_roles_v2 | role_permissions_v2 | CASCADE | Permissions deleted with role |

### 8.2 Action Type Summary

| Action | Count | Tables |
|:------:|:-----:|--------|
| CASCADE | 20 | Child records automatically removed |
| RESTRICT | 7 | Parent deletion blocked if children exist |
| SET NULL | 10 | Child FK set to null if parent deleted |
| NO ACTION | 4 | audit_log_v2, events_v2, system_settings_v2, reference_data_v2 (no FK dependencies) |

---

> **End of TABLE_DEPENDENCY_GRAPH.md**  
> All six database architecture documents complete.
