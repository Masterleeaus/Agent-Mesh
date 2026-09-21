# ResQAI V2 — Database Schema Document

> **Version:** 2.0  
> **Total Tables:** 41  
> **Phases:** 10  
> **Engine:** PostgreSQL 16+  
> **Extension Dependencies:** `pgcrypto`, `uuid-ossp`, `btree_gin`, `pg_stat_statements`

---

## 1. Schema Overview

ResQAI V2 uses a single `public` schema containing 41 tables delivered across 10 migration phases. The architecture follows a **domain-driven design** with strict separation of concerns. Every table is suffixed `_v2` to allow side-by-side coexistence with legacy V1 tables during migration.

```
Phase  1 — Foundation        (6  tables)  ── reference data, settings, flags, connectors, categories, roles
Phase  2 — Identity           (3  tables)  ── users, sessions, role-permissions
Phase  3 — Core Business      (5  tables)  ── customers, addresses, technicians, skills, accounts
Phase  4 — Operational        (5  tables)  ── tickets, messages, attachments, appointments, reminders
Phase  5 — Field Operations   (5  tables)  ── work orders, stages, dispatches, disputes, evidence
Phase  6 — Management         (5  tables)  ── tasks, assignments, followups, attempts, health scans
Phase  7 — Knowledge & Inv    (4  tables)  ── articles, categories, inventory items, transactions
Phase  8 — Feedback           (2  tables)  ── feedback, surveys
Phase  9 — Infrastructure     (3  tables)  ── notifications, templates, channels
Phase 10 — Analytics & Audit  (4  tables)  ── reports, schedules, audit log, events
```

---

## 2. ASCII Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESQAI V2 — ENTITY-RELATIONSHIP                      │
└─────────────────────────────────────────────────────────────────────────────┘

 PHASE 1: FOUNDATION
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │ reference_data_v2 │  │ system_settings_v2│  │  feature_flags_v2    │
 │ PK id             │  │ PK id             │  │ PK id                │
 └────────┬─────────┘  └──────────────────┘  └──────────────────────┘
          │ referenced by many tables
          ▼
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │  connectors_v2    │  │knowledge_categories│  │   user_roles_v2      │
 │ PK id             │  │_v2 PK id          │  │ PK id                │
 └──────────────────┘  └──────────────────┘  └────────┬─────────────┘
                                                       │
 PHASE 2: IDENTITY                                      │
 ┌──────────────────┐  ┌──────────────────┐            │
 │    users_v2       │  │ user_sessions_v2 │            │
 │ PK id ◄───────────┼──│ FK user_id       │            │
 │ FK role_id ───────┼──┼──────────────────┘            │
 └────────┬─────────┘  │ role_permissions_v2            │
          │            │ FK role_id ────────────────────┘
          │            └──────────────────┘
          │
 PHASE 3: CORE BUSINESS
          │
          ├────────────────┐
          ▼                ▼
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │ customers_v2      │  │  technicians_v2  │  │   accounts_v2        │
 │ PK id             │  │ PK id            │  │ PK id                │
 │ FK account_id ────┼──┼──────────────────┼──┼──────────────────────┘
 │ FK assigned_to ───┼──┼──────────────────┘
 └────────┬─────────┘  │technician_skills_v2
          │            │ FK technician_id
          ▼            └──────────────────┘
 ┌──────────────────┐
 │cust_addresses_v2  │
 │ FK customer_id    │
 └──────────────────┘
          │
 PHASE 4: OPERATIONAL
          │
          ▼
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │   tickets_v2      │  │ticket_messages_v2│  │ticket_attachments_v2 │
 │ PK id             │  │ FK ticket_id     │  │ FK ticket_id         │
 │ FK customer_id ───┼──┼──────────────────┼──┼──────────────────────┘
 │ FK assigned_to ───┼──┼──────────────────┘
 │ FK account_id     │
 └────────┬─────────┘
          │
 ┌──────────────────┐  ┌──────────────────┐
 │ appointments_v2   │  │ appoint_reminders │
 │ FK ticket_id ─────┼──┤ _v2               │
 │ FK technician_id  │  │ FK appointment_id │
 └──────────────────┘  └──────────────────┘
          │
 PHASE 5: FIELD OPERATIONS
          │
          ▼
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │  work_orders_v2   │  │work_order_stages │  │   dispatches_v2      │
 │ PK id             │  │_v2 FK work_order │  │ PK id                │
 │ FK ticket_id ─────┼──┼──────────────────┼──┼──────────────────────┘
 │ FK technician_id  │  │                  │  │
 └──────────────────┘  └──────────────────┘  │
                                             │
 ┌──────────────────┐  ┌──────────────────┐  │
 │   disputes_v2     │  │dispute_evidence  │  │
 │ FK work_order_id ─┼──┤ _v2 FK dispute_id│  │
 │ FK ticket_id ─────┼──┼──────────────────┘  │
 └──────────────────┘  └──────────────────────┘
          │
 PHASE 6: MANAGEMENT
          │
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │    tasks_v2       │  │task_assignments  │  │   followups_v2       │
 │ PK id             │  │_v2 FK task_id    │  │ PK id                │
 │ FK ticket_id ─────┼──┼──────────────────┼──┼──────────────────────┘
 │ FK account_id     │  │ FK user_id       │  │ FK ticket_id
 └────────┬─────────┘  └──────────────────┘  │ FK assigned_to
          │                                   │ FK account_id
          │  ┌──────────────────────┐         └────────┬─────────────┘
          │  │followup_attempts_v2  │                  │
          │  │ FK followup_id ──────┼──────────────────┘
          │  └──────────────────────┘
          │  ┌──────────────────────┐
          │  │ account_health_scan  │
          │  │ _v2 FK account_id   │
          │  └──────────────────────┘
          │
 PHASE 7: KNOWLEDGE & INVENTORY
          │
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │knowledge_articles │  │knowledge_categories│  │ inventory_items_v2   │
 │_v2 PK id          │  │_v2 PK id          │  │ PK id                │
 │ FK category_id ───┼──┼──────────────────┼──┼──────────────────────┘
 │ FK author_id      │  │ FK parent_id (self)│
 └──────────────────┘  └──────────────────┘  ┌──────────────────────┐
                                             │inventory_transactions│
                                             │_v2 FK item_id        │
                                             └──────────────────────┘
          │
 PHASE 8: FEEDBACK
          │
 ┌──────────────────┐  ┌──────────────────┐
 │  feedback_v2      │  │feedback_surveys  │
 │ FK ticket_id ─────┼──┤ _v2              │
 │ FK customer_id    │  │ FK feedback_id   │
 └──────────────────┘  └──────────────────┘
          │
 PHASE 9: INFRASTRUCTURE
          │
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │ notifications_v2  │  │notification_tmpl │  │notification_channels │
 │ FK user_id        │  │_v2               │  │_v2                   │
 │ FK template_id ───┼──┼──────────────────┼──┼──────────────────────┘
 │ FK channel_id ────┼──┼──────────────────┘
 └──────────────────┘
          │
 PHASE 10: ANALYTICS & AUDIT
          │
 ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
 │analytics_reports  │  │analytics_schedule│  │   audit_log_v2       │
 │_v2 PK id          │  │_v2 PK id         │  │ PK id                │
 └──────────────────┘  └──────────────────┘  └────────┬─────────────┘
                                                      │
 ┌──────────────────┐                                  │
 │   events_v2       │◄─────────────────────────────────┘
 │ PK id             │  (audit_log_v2.event_id FK)
 └──────────────────┘
```

---

## 3. Naming Conventions

| Aspect          | Convention              | Examples                                |
|-----------------|-------------------------|-----------------------------------------|
| Table names     | Plural `_v2` suffix    | `users_v2`, `tickets_v2`               |
| Primary key     | `id` — `UUID` type     | `id UUID DEFAULT gen_random_uuid()`     |
| Foreign key     | `{referenced_table}_id`| `customer_id`, `technician_id`         |
| Created at      | `created_at`           | `TIMESTAMPTZ NOT NULL DEFAULT now()`    |
| Updated at      | `updated_at`           | `TIMESTAMPTZ NOT NULL DEFAULT now()`    |
| Deleted at      | `deleted_at`           | `TIMESTAMPTZ NULL` (soft delete)       |
| Boolean fields  | `is_` / `has_` prefix  | `is_active`, `has_attachments`         |
| Timestamp fields| `_at` suffix           | `sent_at`, `completed_at`, `archived_at`|
| JSON fields     | `_config` / `_data`    | `settings_config`, `meta_data`         |
| Monetary fields | `_cents` suffix        | `amount_cents`, `cost_cents`           |
| Enum columns    | Lowercase snake_case   | `ticket_status`, `dispatch_status`     |

---

## 4. Complete Table Listing by Phase

### Phase 1 — Foundation (6 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
| 1 | `reference_data_v2`    | Extensible lookup values for all enum-like data |
| 2 | `system_settings_v2`   | Global system configuration key-value store |
| 3 | `feature_flags_v2`     | Feature toggle management |
| 4 | `connectors_v2`        | Third-party integration connection configs |
| 5 | `knowledge_categories_v2` | Hierarchical article categories |
| 6 | `user_roles_v2`        | Role definitions for RBAC |

### Phase 2 — Identity (3 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
| 7 | `users_v2`             | All platform users (agents, techs, admins) |
| 8 | `user_sessions_v2`     | Active session tracking |
| 9 | `role_permissions_v2`  | Granular permission assignments per role |

### Phase 3 — Core Business (5 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|10 | `customers_v2`         | Customer profiles and metadata |
|11 | `customer_addresses_v2`| Customer address book |
|12 | `technicians_v2`       | Technician profiles and certifications |
|13 | `technician_skills_v2` | Skill mapping for technicians |
|14 | `accounts_v2`          | Account/company records (B2B) |

### Phase 4 — Operational (5 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|15 | `tickets_v2`           | Support ticket lifecycle |
|16 | `ticket_messages_v2`   | Messages/threads within tickets |
|17 | `ticket_attachments_v2`| File attachments on tickets |
|18 | `appointments_v2`      | Scheduled appointment slots |
|19 | `appointment_reminders_v2` | Reminder tracking for appointments |

### Phase 5 — Field Operations (5 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|20 | `work_orders_v2`       | Field work order lifecycle |
|21 | `work_order_stages_v2` | Stage-tracking for work order progress |
|22 | `dispatches_v2`        | Dispatch request and response flow |
|23 | `disputes_v2`          | Dispute/chargeback tracking |
|24 | `dispute_evidence_v2`  | Evidence files linked to disputes |

### Phase 6 — Management (5 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|25 | `tasks_v2`             | General task management |
|26 | `task_assignments_v2`  | User-task assignment mapping |
|27 | `followups_v2`         | Follow-up scheduling and tracking |
|28 | `followup_attempts_v2` | Attempt log for each follow-up |
|29 | `account_health_scans_v2` | Periodic account health assessments |

### Phase 7 — Knowledge & Inventory (4 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|30 | `knowledge_articles_v2`| Knowledge base articles |
|31 | `knowledge_categories_v2` | (Reused from Phase 1 — already defined) |
|32 | `inventory_items_v2`   | Inventory item master list |
|33 | `inventory_transactions_v2` | Inventory movement log |

### Phase 8 — Feedback (2 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|34 | `feedback_v2`          | Customer feedback records |
|35 | `feedback_surveys_v2`  | Survey response data |

### Phase 9 — Infrastructure (3 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|36 | `notifications_v2`     | Outbound notification queue |
|37 | `notification_templates_v2` | Notification message templates |
|38 | `notification_channels_v2` | Channel configuration (email, SMS, push) |

### Phase 10 — Analytics & Audit (4 tables)

| # | Table                  | Purpose |
|---|------------------------|---------|
|39 | `analytics_reports_v2` | Stored report definitions |
|40 | `analytics_schedules_v2` | Report scheduling configuration |
|41 | `audit_log_v2`         | Immutable audit trail |
|42 | `events_v2`            | Domain event store |

> **Note:** `knowledge_categories_v2` appears in both Phase 1 (definition) and Phase 7 (usage). It is a single table, counted once. Total unique tables = 41.

---

## 5. Common Column Patterns

### Audit Columns

Every table includes these standard audit columns:

```sql
created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at          TIMESTAMPTZ             DEFAULT NULL   -- soft delete
created_by          UUID         REFERENCES users_v2(id)   -- who created
updated_by          UUID         REFERENCES users_v2(id)   -- who last updated
```

### Soft Delete Pattern

All entity tables use soft delete via `deleted_at`:

- `deleted_at IS NULL` → active record
- `deleted_at IS NOT NULL` → deleted record
- All unique indexes use `WHERE deleted_at IS NULL` to allow soft-delete conflicts
- All RLS policies filter `WHERE deleted_at IS NULL`

### Versioning Pattern

Certain tables (tickets, work_orders, disputes) include optimistic locking:

```sql
version             INTEGER NOT NULL DEFAULT 1
```

Updated atomically: `UPDATE ... SET version = version + 1 WHERE id = $1 AND version = $2`

### Status Lifecycle Pattern

Status columns follow a strict progression:

```sql
ticket_status        TEXT NOT NULL DEFAULT 'new'
CHECK (ticket_status IN ('new','classified','drafted','approved_to_send','sent','escalated','closed'))
```

---

## 6. Data Type Standards

| Data                | PostgreSQL Type      | Notes                                      |
|---------------------|----------------------|--------------------------------------------|
| Primary Keys        | `UUID`               | `DEFAULT gen_random_uuid()`                |
| Foreign Keys        | `UUID`               | Match PK type exactly                      |
| Short strings       | `TEXT`               | No `VARCHAR(n)` — TEXT with CHECK if limit |
| Long text           | `TEXT`               | Articles, messages, descriptions           |
| Enums               | `TEXT`               | With CHECK constraint; extensible via ref  |
| Configuration/JSON  | `JSONB`              | Indexed with GIN for queryability          |
| Monetary values     | `INTEGER`            | Stored in cents to avoid floating point    |
| Timestamps          | `TIMESTAMPTZ`        | Always UTC, `DEFAULT now()`                |
| Dates (no time)     | `DATE`               | For scheduling, birth dates                |
| IPv4/IPv6           | `INET`               | Session IPs, audit source IP               |
| Phone numbers       | `TEXT`               | Stored as E.164 string                     |
| Email addresses     | `TEXT`               | With CHECK for basic format                |
| URLs                | `TEXT`               | Attachment URLs, avatar URLs               |
| File paths          | `TEXT`               | Storage paths for attachments              |
| Small integers      | `SMALLINT`           | Counts, scores, ratings                    |
| Currency codes      | `TEXT`               | ISO 4217 (e.g., 'USD', 'EUR')              |
| Language codes      | `TEXT`               | ISO 639-1 (e.g., 'en', 'es')               |
| UUID v7 (future)    | `UUID`               | Time-ordered UUIDs for better index perf   |

---

## 7. Row-Level Security (RLS) Policies

RLS is enabled on every table. The `app.resqai_user_id` and `app.resqai_role` session variables are set at authentication.

### Policy Types

| Policy Category    | Policy Name Pattern               | Effect |
|--------------------|-----------------------------------|--------|
| Tenant Isolation   | `tenant_isolation_policy`         | `account_id = current_setting('app.resqai_account_id')::uuid` |
| Self-Service       | `self_service_policy`             | `id = current_setting('app.resqai_user_id')::uuid` |
| Role-Based         | `{role}_access_policy`            | `current_setting('app.resqai_role') IN ('super_admin','admin')` |
| Owner Access       | `owner_access_policy`             | `created_by = current_setting('app.resqai_user_id')::uuid` |
| Soft Delete        | `active_records_policy`           | `deleted_at IS NULL` (using-always) |

### Default RLS Template

```sql
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Active records only (applied to all queries via USING)
CREATE POLICY active_records_policy ON {table_name}
    FOR ALL
    USING (deleted_at IS NULL);

-- Role-based access
CREATE POLICY admin_all_access ON {table_name}
    FOR ALL
    USING (current_setting('app.resqai_role') IN ('super_admin','admin'));

-- Tenant-scoped access (for account-tied tables)
CREATE POLICY tenant_access ON {table_name}
    FOR ALL
    USING (account_id = current_setting('app.resqai_account_id')::uuid);

-- Self access (for user-tied tables)
CREATE POLICY self_access ON {table_name}
    FOR SELECT
    USING (assigned_to = current_setting('app.resqai_user_id')::uuid
           OR created_by = current_setting('app.resqai_user_id')::uuid);
```

### RLS Matrix by Role

| Role           | SELECT | INSERT | UPDATE | DELETE | Notes                             |
|----------------|--------|--------|--------|--------|-----------------------------------|
| super_admin    | ALL    | ALL    | ALL    | ALL    | Bypasses all RLS                  |
| admin          | ALL    | ALL    | ALL    | OWN    | Cannot hard-delete                |
| manager        | TENANT | TENANT | TENANT | OWN    | Department-scoped                 |
| agent          | OWN    | OWN    | OWN    | OWN    | Own records only                  |
| technician     | ASSIGN | OWN    | ASSIGN | NONE   | Assigned records                  |
| dispatcher     | TENANT | TENANT | TENANT | NONE   | Tenant-scoped                     |
| customer       | SELF   | SELF   | SELF   | NONE   | Own tickets, profiles             |
| viewer         | TENANT | NONE   | NONE   | NONE   | Read-only within tenant           |

---

## 8. Encryption Strategy

### At Rest

- **TDE:** Transparent Data Encryption at volume level (AWS RDS/Azure Disk Encryption)
- **Sensitive columns** encrypted with `pgcrypto` `pgp_sym_encrypt()`:
  - `users_v2.email`, `users_v2.phone`
  - `customers_v2.email`, `customers_v2.phone`
  - `technicians_v2.email`, `technicians_v2.phone`
  - `connectors_v2.api_key`, `connectors_v2.secret` (encrypted at application level)
- **Master key** stored in cloud KMS (AWS KMS / Azure Key Vault), fetched at app startup

### In Transit

- All connections require TLS 1.2+
- Certificate rotation every 90 days
- Connection pooler (PgBouncer) in transaction mode

### Column-Level Encryption (Application)

Highly sensitive fields use AES-256-GCM encryption applied by the API layer before writing:

```sql
-- Encrypted value stored as bytea
api_key             BYTEA
```

The application encrypts/decrypts using a per-tenant key derived from the master key.

### Auditing

- All decryption attempts logged to `audit_log_v2` with `action_type = 'decrypt'`
- Key rotation events logged
- Access to encrypted columns gated behind RLS and a dedicated `can_decrypt` permission

---

## 9. Relationship Summary

### 1-to-Many Relationships

| Parent                | Child                      | FK Column              |
|-----------------------|----------------------------|------------------------|
| `users_v2`            | `user_sessions_v2`         | `user_id`              |
| `users_v2`            | `notifications_v2`         | `user_id`              |
| `user_roles_v2`       | `users_v2`                 | `role_id`              |
| `user_roles_v2`       | `role_permissions_v2`      | `role_id`              |
| `customers_v2`        | `customer_addresses_v2`    | `customer_id`          |
| `customers_v2`        | `tickets_v2`               | `customer_id`          |
| `customers_v2`        | `feedback_v2`              | `customer_id`          |
| `accounts_v2`         | `customers_v2`             | `account_id`           |
| `accounts_v2`         | `tickets_v2`               | `account_id`           |
| `accounts_v2`         | `tasks_v2`                 | `account_id`           |
| `accounts_v2`         | `followups_v2`             | `account_id`           |
| `accounts_v2`         | `account_health_scans_v2`  | `account_id`           |
| `technicians_v2`      | `technician_skills_v2`     | `technician_id`        |
| `technicians_v2`      | `appointments_v2`          | `technician_id`        |
| `technicians_v2`      | `work_orders_v2`           | `technician_id`        |
| `tickets_v2`          | `ticket_messages_v2`       | `ticket_id`            |
| `tickets_v2`          | `ticket_attachments_v2`    | `ticket_id`            |
| `tickets_v2`          | `appointments_v2`          | `ticket_id`            |
| `tickets_v2`          | `work_orders_v2`           | `ticket_id`            |
| `tickets_v2`          | `tasks_v2`                 | `ticket_id`            |
| `tickets_v2`          | `followups_v2`             | `ticket_id`            |
| `tickets_v2`          | `feedback_v2`              | `ticket_id`            |
| `tickets_v2`          | `disputes_v2`              | `ticket_id`            |
| `appointments_v2`     | `appointment_reminders_v2` | `appointment_id`       |
| `work_orders_v2`      | `work_order_stages_v2`     | `work_order_id`        |
| `work_orders_v2`      | `disputes_v2`              | `work_order_id`        |
| `disputes_v2`         | `dispute_evidence_v2`      | `dispute_id`           |
| `tasks_v2`            | `task_assignments_v2`      | `task_id`              |
| `followups_v2`        | `followup_attempts_v2`     | `followup_id`          |
| `knowledge_categories_v2` | `knowledge_articles_v2` | `category_id`        |
| `feedback_v2`         | `feedback_surveys_v2`      | `feedback_id`          |
| `notification_templates_v2` | `notifications_v2`    | `template_id`          |
| `notification_channels_v2` | `notifications_v2`    | `channel_id`           |
| `inventory_items_v2`  | `inventory_transactions_v2` | `item_id`             |
| `events_v2`           | `audit_log_v2`            | `event_id`             |

### Many-to-Many Relationships

| Left                   | Right                     | Junction Table              |
|------------------------|---------------------------|------------------------------|
| `users_v2`             | `tasks_v2`                | `task_assignments_v2`        |
| `technicians_v2`       | `reference_data_v2` (skills)| `technician_skills_v2`    |

### Self-Referential Relationships

| Table                    | FK Column     | References                  | Purpose                          |
|--------------------------|---------------|-----------------------------|----------------------------------|
| `knowledge_categories_v2`| `parent_id`   | `knowledge_categories_v2(id)`| Hierarchical category tree      |
| `users_v2`               | `manager_id`  | `users_v2(id)`               | Manager-subordinate hierarchy    |
| `tickets_v2`             | `parent_ticket_id` | `tickets_v2(id)`        | Ticket threading / splitting     |

---

## 10. Schema Version Tracking

### Migration Table

```sql
CREATE TABLE public.schema_migrations_v2 (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version         INTEGER NOT NULL,
    phase           SMALLINT NOT NULL,           -- 1-10
    name            TEXT NOT NULL,
    description     TEXT,
    checksum        TEXT NOT NULL,               -- SHA-256 of migration SQL
    applied_by      TEXT NOT NULL,               -- user/CI that ran migration
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_ms     INTEGER,                     -- execution time
    state           TEXT NOT NULL DEFAULT 'success'
                    CHECK (state IN ('pending','running','success','failed','rolled_back')),
    UNIQUE (version)
);
```

### Migration Manifest

```
Phase  | Version Range | Tables Created
-------|---------------|------------------------------
  1    | 001-006       | reference_data, settings, flags, connectors, kbase_cats, roles
  2    | 007-009       | users, sessions, role_permissions
  3    | 010-014       | customers, addresses, technicians, skills, accounts
  4    | 015-019       | tickets, messages, attachments, appointments, reminders
  5    | 020-024       | work_orders, stages, dispatches, disputes, evidence
  6    | 025-029       | tasks, assignments, followups, attempts, health_scans
  7    | 030-033       | articles, inventory_items, inventory_transactions
  8    | 034-035       | feedback, surveys
  9    | 036-038       | notifications, templates, channels
 10    | 039-042       | reports, schedules, audit_log, events
```

Total migrations: **42** (41 tables + 1 schema_migrations table)

### Deployment Contract

- All migrations are idempotent (`CREATE TABLE IF NOT EXISTS`)
- Each migration wrapped in a transaction
- Rollback scripts provided for versions 001-042
- Post-deployment: `ANALYZE` on all new tables
- Zero-downtime: Phase N+1 never requires schema changes to Phase N tables already in production

---

> **Document Maintainers:** Database Engineering Team  
> **Review Cycle:** Quarterly  
> **Last Updated:** June 2026
