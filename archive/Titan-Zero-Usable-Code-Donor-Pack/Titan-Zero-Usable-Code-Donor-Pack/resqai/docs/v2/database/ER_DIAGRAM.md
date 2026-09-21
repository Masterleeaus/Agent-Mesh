# RESQAI V2 — Complete Entity Relationship Diagram

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Complete ER Diagram](#1-complete-er-diagram)
2. [Relationship Summary](#2-relationship-summary)
3. [Cardinality Notes](#3-cardinality-notes)
4. [Key Entity Clusters](#4-key-entity-clusters)

---

## 1. Complete ER Diagram

The diagram below shows all 41 V2 tables organized by functional cluster. All foreign key relationships are drawn with connecting lines.

```
+-----------------------------------------------------------------------------------------------------------------------+
|                                        RESQAI V2 — COMPLETE ENTITY RELATIONSHIP DIAGRAM                               |
|                                            All 41 Tables with FK Relationships                                        |
|                                                                                                                       |
|                                                                                                                       |
|  ======================    ======================    ======================    ======================                  |
|  ||   FOUNDATION      ||   ||     IDENTITY      ||   ||  CORE BUSINESS   ||   ||   OPERATIONAL     ||                 |
|  ||   (Phase 1)       ||   ||   (Phase 2)       ||   ||   (Phase 3)      ||   ||   (Phase 4)       ||                 |
|  ======================    ======================    ======================    ======================                  |
|                                                                                                                       |
|  +-------------------+    +-------------------+    +-------------------+    +-------------------+                     |
|  | reference_data_v2 |    |   user_roles_v2   |    |  customers_v2     |    |   tickets_v2      |                     |
|  +-------------------+    +---------+---------+    +--------+----------+    +--------+----------+                     |
|  | id (PK)           |    | id (PK) |           |           |                     |                                 |
|  | type              |          +-------+----------+       |                     |                                 |
|  | code              |          |               |          |                     |                                 |
|  | label             |          v               v          |                     v                                 |
|  | description       |    +-----------+  +---------------+ |             +--------------------+                      |
|  | sort_order        |    | users_v2  |  |role_perms_v2 | |             | ticket_messages_v2 |                      |
|  | is_active         |    +-----+-----+  +-------+-------+ |             +----------+---------+                      |
|  +-------------------+          |                  |       |                        |                                |
|                                 |                  |       |                        v                                |
|  +-------------------+          v                  |       |             +--------------------+                      |
|  | system_settings_v2|    +----------------+       |       |             |ticket_attachments_v2|                     |
|  +-------------------+    |user_sessions_v2|       |       |             +--------------------+                      |
|  | id (PK)           |    +----------------+       |       |                                                         |
|  | key               |                             |       |             +-------------------+                     |
|  | value             |    +-------------------+    |       |             |  appointments_v2  |                     |
|  | type              |    |notification_templ|    |       |             +--------+----------+                     |
|  | description       |    +--------+----------+    |       |                      |                                |
|  +-------------------+             |               |       |                      v                                |
|                                    v               |       |             +------------------------+                 |
|  +-------------------+    +-------------------+    |       |             | appointment_reminders_v2|                |
|  | feature_flags_v2  |    | notifications_v2 |    |       |             +------------------------+                 |
|  +-------------------+    +-------------------+    |       |                                                         |
|  | id (PK)           |                             |       |    +-------------------+                               |
|  | feature_group     |    +-------------------+    |       |    |  work_orders_v2   |                               |
|  | flag_name         |    |notification_chan  |    |       |    +--------+----------+                               |
|  | enabled           |    +-------------------+    |       |             |                                          |
|  | rollout_percentag |                             |       |             v                                          |
|  +-------------------+                             |       |    +------------------------+                          |
|                               +-------------------+-------+    | work_order_stages_v2   |                          |
|                               | connectors_v2     |       |    +------------------------+                          |
|                               +-------------------+       |                                                         |
|                               | knowledge_categories_v2    |    +-------------------+                               |
|                               +-----------+----------+       |    |   dispatches_v2   |                               |
|                                           |                  |    +---------+---------+                               |
|                                           v                  |              |                                       |
|                               +---------------------------+  |    +---------+---------+                               |
|                               | knowledge_articles_v2     |  |    |    disputes_v2    |                               |
|                               +---------------------------+  |    +---------+---------+                               |
|                                                              |              |                                       |
|                                                              |              v                                       |
|                                                              |    +------------------------+                          |
|                                                              |    | dispute_evidence_v2   |                          |
|                                                              |    +------------------------+                          |
|                                                              |                                                         |
|  ======================    ======================             |    +-------------------+                               |
|  || FIELD OPERATIONS ||   ||   MANAGEMENT      ||            |    |   feedback_v2     |                               |
|  ||   (Phase 5)       ||   ||   (Phase 6)       ||           |    +--------+----------+                               |
|  ======================    ======================             |             |                                          |
|                                                              |             v                                          |
|  (work_orders_v2,          +-------------------+             |    +------------------------+                          |
|   work_order_stages_v2,    |    account_health |             |    | feedback_surveys_v2   |                          |
|   dispatches_v2,           |    _scans_v2      |             |    +------------------------+                          |
|   disputes_v2,             +--------+----------+             |                                                         |
|   dispute_evidence_v2               |                       |    +-------------------+                               |
|   already shown above)              |                       |    |    followups_v2   |                               |
|                                     |                       |    +--------+----------+                               |
|  +-------------------+              |                       |             |                                          |
|  |   tasks_v2        |              |                       |             v                                          |
|  +--------+----------+              |                       |    +------------------------+                          |
|           |                         |                       |    | followup_attempts_v2  |                          |
|           v                         |                       |    +------------------------+                          |
|  +------------------------+         |                       |                                                         |
|  | task_assignments_v2   |         |                       |    +-------------------+                               |
|  +------------------------+         |                       |    |   accounts_v2     |                               |
|                                     |                       |    +--------+----------+                               |
|  ======================    ======================           |             |                                          |
|  || KNOWLEDGE & INV  ||   ||  INFRASTRUCTURE   ||           |    (account_health_scans_v2 depends on accounts_v2)   |
|  ||   (Phase 7)       ||   ||   (Phase 9)       ||          |    (followups_v2 depends on accounts_v2)              |
|  ======================    ======================           |                                                         |
|                                                             |  ======================    ======================       |
|  +-------------------+    +-------------------+             |  || ANALYTICS & AUDIT||   ||   FEEDBACK      ||      |
|  | inventory_items_v2|    | knowledge_articles|             |  ||   (Phase 10)     ||   ||   (Phase 8)     ||      |
|  +--------+----------+    | already shown     |             |  ======================    ======================       |
|           |               +-------------------+             |                                                         |
|           v                                                 |  +-------------------+    +-------------------+         |
|  +------------------------+                                 |  |analytics_reports |    |  feedback_v2     |         |
|  |inventory_transactions  |                                 |  |       _v2        |    |  already shown   |         |
|  |         _v2            |                                 |  +--------+----------+    +-------------------+         |
|  +------------------------+                                 |           |                                             |
|                                                             |           v                                             |
|                                                             |  +------------------------+                             |
|                                                             |  | analytics_schedules   |                             |
|                                                             |  |          _v2          |                             |
|                                                             |  +------------------------+                             |
|                                                             |                                                         |
|                                                             |  +-------------------+    +-------------------+         |
|                                                             |  |   audit_log_v2    |    |    events_v2      |         |
|                                                             |  +-------------------+    +-------------------+         |
|                                                             |                                                         |
+-----------------------------------------------------------------------------------------------------------------------+
|  LEGEND:                                                                                                              |
|    Tables are grouped by functional area and phase. Lines indicate FK relationships.                                   |
|    All FK relationships are one-to-many (1:N) unless noted otherwise.                                                  |
|                                                                                                                       |
|  KEY DEPENDENCIES:                                                                                                    |
|    customers_v2 --> tickets_v2 --> ticket_messages_v2, ticket_attachments_v2, dispatches_v2                            |
|    customers_v2 + technicians_v2 --> appointments_v2 --> appointment_reminders_v2, work_orders_v2                      |
|    work_orders_v2 --> work_order_stages_v2                                                                             |
|    appointments_v2 + customers_v2 + tickets_v2 --> disputes_v2 --> dispute_evidence_v2                                 |
|    accounts_v2 --> account_health_scans_v2, followups_v2 --> followup_attempts_v2                                      |
|    user_roles_v2 --> users_v2 --> user_sessions_v2                                                                     |
|    user_roles_v2 --> role_permissions_v2                                                                               |
|    knowledge_categories_v2 --> knowledge_articles_v2                                                                   |
|    inventory_items_v2 --> inventory_transactions_v2                                                                    |
|    analytics_reports_v2 --> analytics_schedules_v2                                                                     |
|    notification_templates_v2 --> notifications_v2                                                                      |
|    customers_v2 + tickets_v2 + appointments_v2 --> feedback_v2 --> feedback_surveys_v2                                  |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Relationship Summary

### 2.1 Parent -> Child Relationships

| # | Parent Table | Child Table | FK Column | ON DELETE | Relationship |
|:-:|-------------|-------------|-----------|:---------:|:------------:|
| 1 | user_roles_v2 | users_v2 | role_id | SET NULL | 1:N |
| 2 | user_roles_v2 | role_permissions_v2 | role_id | CASCADE | 1:N |
| 3 | users_v2 | user_sessions_v2 | user_id | CASCADE | 1:N |
| 4 | customers_v2 | customer_addresses_v2 | customer_id | CASCADE | 1:N |
| 5 | customers_v2 | accounts_v2 | customer_id | CASCADE | 1:1* |
| 6 | customers_v2 | tickets_v2 | customer_id | RESTRICT | 1:N |
| 7 | customers_v2 | appointments_v2 | customer_id | RESTRICT | 1:N |
| 8 | customers_v2 | work_orders_v2 | customer_id | RESTRICT | 1:N |
| 9 | customers_v2 | disputes_v2 | customer_id | RESTRICT | 1:N |
| 10 | customers_v2 | followups_v2 | customer_id | SET NULL | 1:N |
| 11 | customers_v2 | feedback_v2 | customer_id | RESTRICT | 1:N |
| 12 | technicians_v2 | technician_skills_v2 | technician_id | CASCADE | 1:N |
| 13 | technicians_v2 | appointments_v2 | technician_id | SET NULL | 1:N |
| 14 | technicians_v2 | work_orders_v2 | technician_id | SET NULL | 1:N |
| 15 | technicians_v2 | dispatches_v2 | technician_id | SET NULL | 1:N |
| 16 | tickets_v2 | ticket_messages_v2 | ticket_id | CASCADE | 1:N |
| 17 | tickets_v2 | ticket_attachments_v2 | ticket_id | CASCADE | 1:N |
| 18 | tickets_v2 | dispatches_v2 | ticket_id | SET NULL | 1:1* |
| 19 | tickets_v2 | disputes_v2 | ticket_id | SET NULL | 1:1* |
| 20 | tickets_v2 | feedback_v2 | ticket_id | SET NULL | 1:N |
| 21 | appointments_v2 | appointment_reminders_v2 | appointment_id | CASCADE | 1:N |
| 22 | appointments_v2 | work_orders_v2 | appointment_id | SET NULL | 1:1* |
| 23 | appointments_v2 | dispatches_v2 | appointment_id | SET NULL | 1:1* |
| 24 | appointments_v2 | disputes_v2 | appointment_id | RESTRICT | 1:1* |
| 25 | appointments_v2 | feedback_v2 | appointment_id | SET NULL | 1:N |
| 26 | accounts_v2 | account_health_scans_v2 | account_id | CASCADE | 1:N |
| 27 | accounts_v2 | followups_v2 | account_id | CASCADE | 1:N |
| 28 | work_orders_v2 | work_order_stages_v2 | work_order_id | CASCADE | 1:N |
| 29 | disputes_v2 | dispute_evidence_v2 | dispute_id | CASCADE | 1:N |
| 30 | followups_v2 | followup_attempts_v2 | followup_id | CASCADE | 1:N |
| 31 | tasks_v2 | task_assignments_v2 | task_id | CASCADE | 1:N |
| 32 | inventory_items_v2 | inventory_transactions_v2 | item_id | RESTRICT | 1:N |
| 33 | notification_templates_v2 | notifications_v2 | template_id | SET NULL | 1:N |
| 34 | knowledge_categories_v2 | knowledge_articles_v2 | category_id | SET NULL | 1:N |
| 35 | analytics_reports_v2 | analytics_schedules_v2 | report_id | CASCADE | 1:N |
| 36 | feedback_v2 | feedback_surveys_v2 | feedback_id | CASCADE | 1:N |
| 37 | knowledge_categories_v2 | knowledge_categories_v2 | parent_id | SET NULL | 1:N (self-ref) |

### 2.2 Independent Tables (No FK Dependencies)

These tables have no foreign key columns and exist independently:

| Table | Phase | Description |
|-------|:-----:|-------------|
| reference_data_v2 | 1 | Central lookup table for all enum-type values |
| system_settings_v2 | 1 | Key-value configuration store |
| feature_flags_v2 | 1 | Feature toggle management |
| connectors_v2 | 1 | Third-party connector configuration |
| notification_channels_v2 | 3 | Notification channel provider configuration |
| inventory_items_v2 | 7 | Parts and equipment inventory |
| tasks_v2 | 6 | Task records (not FK-dependent) |
| analytics_reports_v2 | 10 | Saved report configurations |
| audit_log_v2 | 10 | Append-only audit trail |
| events_v2 | 10 | Append-only event bus |

### 2.3 Leaf Tables (No Children)

These tables have no tables referencing them via FK:

| Table | Reason |
|-------|--------|
| audit_log_v2 | Append-only audit trail, no business logic depends on it |
| events_v2 | Append-only event bus |
| notification_channels_v2 | Infrastructure configuration leaf |
| system_settings_v2 | Key-value configuration leaf |
| feature_flags_v2 | Feature toggle leaf |
| connectors_v2 | Third-party config leaf |
| reference_data_v2 | Reference data leaf |
| work_order_stages_v2 | Stage history, no deeper detail |
| followup_attempts_v2 | Individual contact attempt log |
| inventory_transactions_v2 | Stock movement log |
| feedback_surveys_v2 | Survey response leaf |
| task_assignments_v2 | Assignment history leaf |
| ticket_attachments_v2 | File attachment metadata leaf |
| customer_addresses_v2 | Address data leaf |
| technician_skills_v2 | Skill data leaf |
| appointment_reminders_v2 | Reminder log leaf |
| dispute_evidence_v2 | Evidence file log leaf |
| user_sessions_v2 | Session tracking leaf |
| account_health_scans_v2 | Health scan history leaf |

---

## 3. Cardinality Notes

### 3.1 Cardinality by Type

| Cardinality | Count | Examples |
|:-----------:|:-----:|----------|
| 1:1 (one-to-one) | 4 | accounts_v2-customers_v2, dispatches_v2-tickets_v2, dispatches_v2-appointments_v2, work_orders_v2-appointments_v2 |
| 1:N (one-to-many) | 33 | All other FK relationships (primary pattern) |
| M:N (many-to-many) | 0 | All M:N relationships resolved via join tables |
| Self-referencing | 1 | knowledge_categories_v2 (parent_id -> id) |

### 3.2 Detailed Cardinality Descriptions

**1:1 Relationships** (enforced via business logic or unique constraint on FK):

| Parent | Child | Enforcement | Rationale |
|--------|-------|:-----------:|-----------|
| customers_v2 | accounts_v2 | 1:1 business rule | Each customer has exactly one account summary |
| tickets_v2 | dispatches_v2 | 1:1 implied | One dispatch per ticket at a time |
| appointments_v2 | dispatches_v2 | 1:1 implied | One dispatch per appointment at a time |
| appointments_v2 | work_orders_v2 | 1:1 implied | One work order per appointment |

**1:N Relationships** (standard FK pattern, no unique constraint on FK column):

| Parent | Child | Typical N | Growth |
|--------|-------|:---------:|:------:|
| customers_v2 | tickets_v2 | 5-50 | High |
| customers_v2 | appointments_v2 | 3-30 | High |
| customers_v2 | followups_v2 | 2-20 | Medium |
| tickets_v2 | ticket_messages_v2 | 2-20 | Medium |
| technicians_v2 | appointments_v2 | 1-5/day | High |
| accounts_v2 | followups_v2 | 5-50 | Medium |
| accounts_v2 | account_health_scans_v2 | 10-100 | Medium |
| disputes_v2 | dispute_evidence_v2 | 1-5 | Low |
| work_orders_v2 | work_order_stages_v2 | 3-5 | Low |
| followups_v2 | followup_attempts_v2 | 1-5 | Low |
| tasks_v2 | task_assignments_v2 | 1-3 | Low |
| inventory_items_v2 | inventory_transactions_v2 | 10-100 | Medium |
| knowledge_categories_v2 | knowledge_articles_v2 | 5-50 | Medium |
| analytics_reports_v2 | analytics_schedules_v2 | 0-2 | Very Low |
| feedback_v2 | feedback_surveys_v2 | 1-10 | Low |

### 3.3 Self-Referencing FK

**knowledge_categories_v2.parent_id** -> **knowledge_categories_v2.id**

This creates a tree hierarchy for knowledge base categories:

```
Root Category (parent_id = NULL)
+-- Sub-category A (parent_id = root)
|   +-- Leaf A1 (parent_id = sub A)
|   +-- Leaf A2 (parent_id = sub A)
+-- Sub-category B (parent_id = root)
    +-- Leaf B1 (parent_id = sub B)
```

Depth is limited to 3 levels maximum (root -> sub -> leaf).

### 3.4 Deleted-by Tables

Certain tables that use soft delete track which user performed the deletion:

| Table | deleted_by FK |
|-------|:-------------:|
| customers_v2 | deleted_by -> users_v2 |
| tickets_v2 | deleted_by -> users_v2 |
| appointments_v2 | deleted_by -> users_v2 |
| work_orders_v2 | deleted_by -> users_v2 |
| dispatches_v2 | deleted_by -> users_v2 |
| tasks_v2 | deleted_by -> users_v2 |
| accounts_v2 | deleted_by -> users_v2 |
| followups_v2 | deleted_by -> users_v2 |
| knowledge_articles_v2 | deleted_by -> users_v2 |
| inventory_items_v2 | deleted_by -> users_v2 |

---

## 4. Key Entity Clusters

### 4.1 Customer Cluster (accounts_v2, customers_v2, customer_addresses_v2, followups_v2)

```
Purpose: Complete customer lifecycle management

customers_v2 (root entity)
  +-- 1:1 --> accounts_v2 (account summary, health scores, lifetime value)
  +-- 1:N --> customer_addresses_v2 (multiple addresses per customer)
  +-- 1:N --> followups_v2 (follow-up activities, via accounts_v2 FK)
  +-- 1:N --> tickets_v2 (support tickets)
  +-- 1:N --> appointments_v2 (service appointments)
  +-- 1:N --> work_orders_v2 (work orders)
  +-- 1:N --> disputes_v2 (disputes)
  +-- 1:N --> feedback_v2 (feedback submissions)

Key query pattern:
  SELECT customers.id, customers.name, accounts.health, accounts.health_score
  FROM customers_v2 customers
  LEFT JOIN accounts_v2 accounts ON accounts.customer_id = customers.id
  WHERE customers.deleted_at IS NULL;
```

### 4.2 Ticket Cluster (tickets_v2, ticket_messages_v2, ticket_attachments_v2, dispatches_v2)

```
Purpose: End-to-end support ticket management

tickets_v2 (root entity)
  +-- 1:N --> ticket_messages_v2 (conversation threads)
  +-- 1:N --> ticket_attachments_v2 (file attachments)
  +-- 1:1 --> dispatches_v2 (dispatch record, if dispatched)
  +-- 1:1 --> disputes_v2 (dispute, if escalated to dispute)
  +-- 1:N --> feedback_v2 (post-resolution feedback)

Lifecycle:
  new -> open -> in_progress -> resolved -> closed
  new -> open -> escalated -> resolved -> closed

Key query pattern (ticket with latest message):
  SELECT t.*, tm.message_text AS last_message
  FROM tickets_v2 t
  LEFT JOIN LATERAL (
      SELECT message_text FROM ticket_messages_v2
      WHERE ticket_id = t.id
      ORDER BY created_at DESC LIMIT 1
  ) tm ON true
  WHERE t.deleted_at IS NULL
  ORDER BY t.created_at DESC;
```

### 4.3 Appointment Cluster (appointments_v2, appointment_reminders_v2, work_orders_v2, dispatches_v2)

```
Purpose: Service appointment scheduling and field execution

appointments_v2 (root entity)
  +-- 1:N --> appointment_reminders_v2 (reminder notifications)
  +-- 1:1 --> work_orders_v2 (field work execution)
  +-- 1:1 --> dispatches_v2 (dispatch coordination)
  +-- 1:1 --> disputes_v2 (dispute, if customer disputes service)

Lifecycle:
  scheduled -> confirmed -> in_progress -> completed -> billed
  scheduled -> cancelled

Technician assignment:
  appointments_v2.technician_id -> technicians_v2.id (SET NULL on tech delete)

Key query pattern (daily schedule):
  SELECT a.*, c.name AS customer_name, t.name AS technician_name
  FROM appointments_v2 a
  LEFT JOIN customers_v2 c ON c.id = a.customer_id
  LEFT JOIN technicians_v2 t ON t.id = a.technician_id
  WHERE a.scheduled_date::date = CURRENT_DATE
    AND a.deleted_at IS NULL
  ORDER BY a.arrival_window_start;
```

### 4.4 Work Order Cluster (work_orders_v2, work_order_stages_v2)

```
Purpose: Field service work execution and tracking

work_orders_v2 (root entity)
  +-- 1:N --> work_order_stages_v2 (stage timing and geolocation)

Stage lifecycle:
  created -> en_route -> on_site -> in_progress -> completed
  created -> cancelled

Key query pattern (work order with stage timeline):
  SELECT wo.*, jsonb_agg(
      jsonb_build_object(
          'stage', ws.stage_name,
          'entered_at', ws.entered_at,
          'duration_seconds', ws.duration_seconds
      ) ORDER BY ws.entered_at
  ) AS stages
  FROM work_orders_v2 wo
  LEFT JOIN work_order_stages_v2 ws ON ws.work_order_id = wo.id
  WHERE wo.deleted_at IS NULL
  GROUP BY wo.id;
```

### 4.5 Dispute Cluster (disputes_v2, dispute_evidence_v2)

```
Purpose: Service dispute resolution

disputes_v2 (root entity)
  +-- 1:N --> dispute_evidence_v2 (photo, video, document evidence)

Lifecycle:
  submitted -> under_review -> investigation -> resolved -> closed
  submitted -> under_review -> dismissed

AI Integration:
  resolution-advisor agent reads disputes_v2 when status = 'under_review'
  AI recommends resolution from dispute_resolution_type enum

Key query pattern:
  SELECT d.*, jsonb_agg(
      jsonb_build_object('type', de.evidence_type, 'file', de.file_path)
  ) AS evidence
  FROM disputes_v2 d
  LEFT JOIN dispute_evidence_v2 de ON de.dispute_id = d.id
  WHERE d.status = 'under_review'
  GROUP BY d.id;
```

### 4.6 Account Health Cluster (accounts_v2, account_health_scans_v2, followups_v2, followup_attempts_v2)

```
Purpose: CRM account health monitoring and follow-up tracking

accounts_v2 (root entity)
  +-- 1:N --> account_health_scans_v2 (health score snapshots over time)
  +-- 1:N --> followups_v2 (follow-up tasks/activities)
                +-- 1:N --> followup_attempts_v2 (individual contact attempts)

Health scoring:
  accounts_v2.health: risk, at_risk, stable, healthy, growing
  accounts_v2.health_score: 0.0 - 100.0 (calculated from multiple factors)

AI Integration:
  account-health-monitor agent processes health scores nightly
  Creates tasks for at-risk accounts and overdue followups

Key query pattern (declining health):
  SELECT a.id, a.name, a.health, a.health_score,
         hs.health_before, hs.health_after
  FROM accounts_v2 a
  JOIN account_health_scans_v2 hs ON hs.account_id = a.id
  WHERE hs.health_score_after < hs.health_score_before
    AND hs.scan_date > CURRENT_DATE - INTERVAL '30 days';
```

### 4.7 Identity Cluster (user_roles_v2, users_v2, user_sessions_v2, role_permissions_v2)

```
Purpose: User identity, authentication, and authorization

user_roles_v2 (root entity)
  +-- 1:N --> users_v2 (user accounts)
  +-- 1:N --> role_permissions_v2 (permission definitions)
                |
                v
  users_v2 --> user_sessions_v2 (session tokens)

RBAC Model:
  Role-based access control with resource-level permissions
  Permission scope: all, team, own

Key query pattern (user permissions):
  SELECT rp.resource, rp.action, rp.scope
  FROM users_v2 u
  JOIN role_permissions_v2 rp ON rp.role_id = u.role_id
  WHERE u.id = :user_id;
```

### 4.8 Knowledge Cluster (knowledge_categories_v2, knowledge_articles_v2)

```
Purpose: Knowledge base with hierarchical categorization

knowledge_categories_v2 (root entity, self-referencing)
  +-- 1:N --> knowledge_categories_v2 (parent_id for hierarchy)
  +-- 1:N --> knowledge_articles_v2 (articles in category)

Category hierarchy (tree, max depth 3):
  Root -> Sub-category -> Leaf

Key query pattern (articles by category tree):
  WITH RECURSIVE cat_tree AS (
      SELECT id, name, parent_id, 0 AS depth
      FROM knowledge_categories_v2
      WHERE parent_id IS NULL
      UNION ALL
      SELECT c.id, c.name, c.parent_id, ct.depth + 1
      FROM knowledge_categories_v2 c
      JOIN cat_tree ct ON ct.id = c.parent_id
  )
  SELECT ct.*, COUNT(ka.id) AS article_count
  FROM cat_tree ct
  LEFT JOIN knowledge_articles_v2 ka ON ka.category_id = ct.id
  GROUP BY ct.id, ct.name, ct.parent_id, ct.depth
  ORDER BY ct.depth, ct.name;
```

### 4.9 Inventory Cluster (inventory_items_v2, inventory_transactions_v2)

```
Purpose: Parts and equipment inventory tracking

inventory_items_v2 (root entity)
  +-- 1:N --> inventory_transactions_v2 (stock movement log)

Transaction types: inbound, outbound, adjustment, return
Stock tracking: quantity_on_hand, reorder_threshold, reorder_quantity

Key query pattern (low stock items):
  SELECT name, sku, quantity_on_hand, reorder_threshold
  FROM inventory_items_v2
  WHERE quantity_on_hand <= reorder_threshold
    AND deleted_at IS NULL;
```

### 4.10 Analytics & Audit Cluster (analytics_reports_v2, analytics_schedules_v2, audit_log_v2, events_v2)

```
Purpose: Reporting, scheduled report distribution, audit trail, and event bus

analytics_reports_v2 (report definitions)
  +-- 1:N --> analytics_schedules_v2 (scheduled delivery)

audit_log_v2 (independent - no FK dependencies)
  - Records all entity mutations
  - entity_type, entity_id, action, actor, previous_state, new_state
  - Append-only, never modified

events_v2 (independent - no FK dependencies)
  - Records system events for event-driven architecture
  - event_name, producer_app, payload, correlation_id
  - Append-only, auto-purged after 365 days

Key query pattern (audit trail for an entity):
  SELECT created_at, action, actor_type, actor_id,
         changed_fields, new_state
  FROM audit_log_v2
  WHERE entity_type = 'ticket' AND entity_id = :ticket_id
  ORDER BY created_at DESC;
```

---

## Relationship Summary Table

| Cardinality | Count | Description |
|:-----------:|:-----:|-------------|
| 1:1 via FK | 4 | Accounts/Customer, Dispatch/Ticket, Dispatch/Appt, WorkOrder/Appt |
| 1:N via FK | 28 | Standard parent-child FK relationships |
| 1:N via self-ref FK | 1 | knowledge_categories_v2 (parent_id) |
| N:M | 0 | Resolved via intermediate tables |
| Independent | 10 | Tables with zero FK dependencies |
| Leaf tables | 19 | Tables with no child FK references |

**Total tables: 41**
**Total FK relationships: 37** (including self-referencing)
**Total FK constraints: 49** (some tables have multiple FKs, e.g., appointments_v2 has 3 FKs)

---

> **End of ER_DIAGRAM.md**
