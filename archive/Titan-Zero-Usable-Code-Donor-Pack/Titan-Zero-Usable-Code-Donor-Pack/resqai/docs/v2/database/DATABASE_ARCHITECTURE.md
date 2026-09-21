# RESQAI V2 — Database Architecture

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Naming Conventions](#2-naming-conventions)
3. [Data Types](#3-data-types)
4. [Indexing Strategy](#4-indexing-strategy)
5. [Audit Architecture](#5-audit-architecture)
6. [Soft Delete Strategy](#6-soft-delete-strategy)
7. [Migration Strategy](#7-migration-strategy)
8. [Security Architecture](#8-security-architecture)
9. [Performance Architecture](#9-performance-architecture)
10. [Disaster Recovery](#10-disaster-recovery)

---

## 1. Design Principles

### 1.1 Core Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Single Source of Truth** | Every piece of data lives in exactly one table. Denormalization only for read models. |
| 2 | **Domain Ownership** | Each table has exactly one owning domain/application that creates it. |
| 3 | **Eventual Consistency** | Cross-domain data is synchronized via events, not distributed transactions. |
| 4 | **Audit Everything** | Every CREATE, UPDATE, and DELETE is recorded with actor, timestamp, and previous state. |
| 5 | **Immutable History** | Once written, audit records are never modified. State changes create new rows. |
| 6 | **Referential Integrity** | All cross-table relationships use foreign keys. No orphaned references. |
| 7 | **Status as State Machine** | Every lifecycle is a documented state machine with permitted transitions. |
| 8 | **Index by Query Pattern** | Indexes are created based on known query patterns, not guessed. |
| 9 | **V2 Coexistence** | V2 tables use `_v2` suffix and coexist with V1 tables without conflict. |
| 10 | **Forward Compatibility** | Schema design anticipates future extensions without breaking changes. |

### 1.2 V1-to-V2 Migration Philosophy

| Aspect | V1 (Existing) | V2 (New) |
|--------|---------------|----------|
| Table names | `customers`, `tickets` | `customers_v2`, `tickets_v2` |
| Status enums | Embedded in table | Separate `_status` or `_type` lookup tables |
| Audit | `operations_log` (free-text) | `audit_log_v2` (structured with entity_type, entity_id, old/new values) |
| Indexes | None | Comprehensive index strategy |
| Foreign keys | Partial | Full referential integrity |
| Soft delete | None | `deleted_at` nullable timestamp |
| RLS | Disabled (POD visibility) | Enabled for customer-scoped data |

### 1.3 V2 Tables vs V1 Tables

```
V1 TABLES (UNTOUCHED - reference only):
  customers
  technicians
  tickets
  appointments
  disputes
  tasks
  operations_log
  accounts
  followups

V2 TABLES (NEW - all with _v2 suffix):
  customers_v2              — Enhanced customer records
  customer_addresses_v2     — Multiple addresses per customer
  technicians_v2            — Enhanced technician records
  technician_skills_v2      — Many-to-many skills per technician
  tickets_v2                — Enhanced ticket records
  ticket_messages_v2        — Message thread per ticket
  ticket_attachments_v2     — File attachments per ticket
  appointments_v2           — Enhanced appointment records
  appointment_reminders_v2  — Generated reminders
  disputes_v2               — Enhanced dispute records
  dispute_evidence_v2       — Evidence items per dispute
  tasks_v2                  — Enhanced task records
  task_assignments_v2       — Task assignment history
  work_orders_v2            — NEW: Field work orders
  work_order_stages_v2      — Work order stage timeline
  dispatches_v2             — NEW: Dispatch records
  accounts_v2               — Enhanced account records
  account_health_scans_v2   — Health scan history
  followups_v2              — Enhanced followup records
  followup_attempts_v2      — Followup attempt history
  notifications_v2          — NEW: Notification queue
  notification_templates_v2 — NEW: Notification templates
  notification_channels_v2  — NEW: Channel configuration
  knowledge_articles_v2     — NEW: Knowledge base articles
  knowledge_categories_v2   — NEW: Article categories
  inventory_items_v2        — NEW: Parts/equipment inventory
  inventory_transactions_v2 — NEW: Inventory movement log
  feedback_v2               — NEW: Customer feedback
  feedback_surveys_v2       — NEW: Survey responses
  users_v2                  — NEW: User accounts
  user_roles_v2             — NEW: Role definitions
  user_sessions_v2          — NEW: Session tracking
  role_permissions_v2       — NEW: Permission definitions
  system_settings_v2        — NEW: Configuration store
  feature_flags_v2          — NEW: Feature toggle management
  connectors_v2             — NEW: Third-party connector config
  audit_log_v2              — NEW: Structured audit log
  events_v2                 — NEW: Event bus log
  analytics_reports_v2      — NEW: Saved report configs
  analytics_schedules_v2    — NEW: Report schedules
  reference_data_v2         — NEW: Common reference tables
```

---

## 2. Naming Conventions

### 2.1 Table Naming

| Rule | Example |
|------|---------|
| Lowercase with underscores | `tickets_v2`, `work_orders_v2` |
| Plural nouns | `customers_v2`, `technicians_v2` |
| Join tables: both entity names | `technician_skills_v2` |
| History tables: `_history` suffix | `ticket_status_history_v2` |
| Audit tables: `_log` suffix | `audit_log_v2` |
| Reference/lookup tables: singular | `service_type_v2`, `ticket_channel_v2` |

### 2.2 Column Naming

| Rule | Example |
|------|---------|
| Primary key: `id` | `id UUID PRIMARY KEY` |
| Foreign key: `{referenced_table}_id` | `customer_id`, `technician_id` |
| Timestamps: `_at` suffix | `created_at`, `updated_at`, `deleted_at` |
| Dates: `_date` suffix | `due_date`, `completed_date` |
| Booleans: `is_` or `has_` prefix | `is_active`, `has_attachments` |
| Counts: `_count` suffix | `attempt_count`, `open_count` |
| Money: `_cents` suffix | `amount_cents`, `revenue_cents` |
| JSON: `_config` or `_data` suffix | `preferences_config`, `meta_data` |
| Soft delete: `deleted_at` | `deleted_at TIMESTAMPTZ` |

### 2.3 Enum/Lookup Naming

| Convention | Example |
|------------|---------|
| Stored as TEXT with CHECK constraints | `status TEXT CHECK (status IN ('new', 'open', 'closed'))` |
| Lookup tables for extensible values | `service_type_v2` table for service types |

### 2.4 Index Naming

```
idx_{table}_{column}
idx_{table}_{col1}_{col2}
uniq_{table}_{column}
```

Examples:
- `idx_tickets_v2_status`
- `idx_tickets_v2_customer_id`
- `idx_tickets_v2_customer_id_status`
- `uniq_users_v2_email`

---

## 3. Data Types

### 3.1 Column Type Standards

| Concept | Type | Justification |
|---------|------|---------------|
| Primary Key | `UUID` | Globally unique, no sequential guessing, supports distributed systems |
| Foreign Key | `UUID` | Matching PK type |
| Short text (<256 chars) | `TEXT` (with CHECK length) | Consistent text type throughout |
| Long text | `TEXT` | Unlimited length |
| Enums (fixed) | `TEXT` with CHECK | Portable, readable in queries |
| Enums (extensible) | FK to lookup table | Supports future values |
| Small integers | `INTEGER` | Simple, efficient |
| Monetary values | `INTEGER` (cents) | Avoids floating-point rounding |
| Floating point | `DOUBLE PRECISION` | For scores, ratings |
| Dates (no time) | `DATE` | Self-documenting |
| Timestamps | `TIMESTAMPTZ` | Timezone-aware |
| Booleans | `BOOLEAN` | Standard |
| JSON | `JSONB` | Indexable, supports queries |
| Phone | `TEXT` | Preserves formatting, supports international |
| Email | `TEXT` (with CHECK pattern) | Universal format |

### 3.2 Common Column Definitions

```sql
-- Every table
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at      TIMESTAMPTZ  -- NULL = active, set = soft-deleted

-- Audit-enabled tables
created_by      UUID REFERENCES users_v2(id)
updated_by      UUID REFERENCES users_v2(id)
deleted_by      UUID REFERENCES users_v2(id)

-- Versioned tables
version         INTEGER NOT NULL DEFAULT 1
valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW()
valid_to        TIMESTAMPTZ  -- NULL = current
```

---

## 4. Indexing Strategy

### 4.1 Index Categories

| Type | Purpose | Coverage |
|------|---------|----------|
| **Primary Key** | Row uniqueness and lookup | Every table: `PRIMARY KEY (id)` |
| **Foreign Key** | Join performance | Every FK column |
| **Status Filter** | List views filtered by status | Every status column |
| **Date Range** | Time-based queries | Every date/timestamp column |
| **Composite** | Multi-column query patterns | Status + date, customer + status, etc. |
| **Unique** | Business identity constraints | Email, phone, name+type |
| **Full-Text** | Search performance | Subject, message, name, description |
| **Partial** | Filtered index for active rows | `WHERE deleted_at IS NULL` |

### 4.2 Standard Index Mapping

Every table gets these indexes unless otherwise noted:

```sql
-- 1. Primary key (built-in with PK constraint)
-- 2. Foreign key indexes
CREATE INDEX idx_{table}_{fk_col} ON {table}({fk_col});

-- 3. Status filter indexes  
CREATE INDEX idx_{table}_status ON {table}(status) WHERE deleted_at IS NULL;

-- 4. Date range indexes
CREATE INDEX idx_{table}_created_at ON {table}(created_at);

-- 5. Composite status + date (for list views sorted by date)
CREATE INDEX idx_{table}_status_created_at ON {table}(status, created_at DESC) WHERE deleted_at IS NULL;

-- 6. Owner/assignee filter
CREATE INDEX idx_{table}_assigned_to ON {table}(assigned_to) WHERE deleted_at IS NULL;
```

### 4.3 Table-Specific Indexes

See the ENTITY_RELATIONSHIP_DIAGRAM.md and each table definition for table-specific indexes.

---

## 5. Audit Architecture

### 5.1 audit_log_v2 Structure

```sql
CREATE TABLE audit_log_v2 (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT NOT NULL,          -- 'ticket', 'appointment', 'dispute', etc.
    entity_id       UUID NOT NULL,          -- ID of the record that changed
    action          TEXT NOT NULL,          -- 'created', 'updated', 'deleted', 'status_changed'
    actor_type      TEXT NOT NULL,          -- 'user', 'agent', 'function', 'system', 'workflow'
    actor_id        TEXT NOT NULL,          -- User ID, agent name, function name
    previous_state  JSONB,                  -- Full record before change
    new_state       JSONB,                  -- Full record after change
    changed_fields  TEXT[],                 -- Array of column names that changed
    ip_address      TEXT,                   -- Client IP (for user actions)
    user_agent      TEXT,                   -- Browser/device info
    correlation_id  TEXT,                   -- Links related audit entries
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_v2_entity ON audit_log_v2(entity_type, entity_id);
CREATE INDEX idx_audit_log_v2_entity_type ON audit_log_v2(entity_type, created_at DESC);
CREATE INDEX idx_audit_log_v2_actor ON audit_log_v2(actor_type, actor_id);
CREATE INDEX idx_audit_log_v2_action ON audit_log_v2(action);
CREATE INDEX idx_audit_log_v2_created_at ON audit_log_v2(created_at);
CREATE INDEX idx_audit_log_v2_correlation ON audit_log_v2(correlation_id);
```

### 5.2 Audit Trigger Pattern

```sql
-- Template for audit trigger on every auditable table
CREATE OR REPLACE FUNCTION audit_trigger_v2()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log_v2(
            entity_type, entity_id, action, actor_type, actor_id,
            new_state, changed_fields, correlation_id
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'created',
            current_setting('app.actor_type', TRUE)::TEXT,
            current_setting('app.actor_id', TRUE)::TEXT,
            row_to_json(NEW)::JSONB,
            ARRAY(SELECT jsonb_object_keys(row_to_json(NEW)::JSONB)),
            current_setting('app.correlation_id', TRUE)::TEXT
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log_v2(
            entity_type, entity_id, action, actor_type, actor_id,
            previous_state, new_state, changed_fields, correlation_id
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'updated',
            current_setting('app.actor_type', TRUE)::TEXT,
            current_setting('app.actor_id', TRUE)::TEXT,
            row_to_json(OLD)::JSONB,
            row_to_json(NEW)::JSONB,
            audit_changed_columns(OLD, NEW),
            current_setting('app.correlation_id', TRUE)::TEXT
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log_v2(
            entity_type, entity_id, action, actor_type, actor_id,
            previous_state, correlation_id
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'deleted',
            current_setting('app.actor_type', TRUE)::TEXT,
            current_setting('app.actor_id', TRUE)::TEXT,
            row_to_json(OLD)::JSONB,
            current_setting('app.correlation_id', TRUE)::TEXT
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 System Context

Applications set session-level context before mutations:

```sql
SELECT set_config('app.actor_type', 'user', TRUE);
SELECT set_config('app.actor_id', 'user_abc123', TRUE);
SELECT set_config('app.correlation_id', 'corr_xyz789', TRUE);
```

---

## 6. Soft Delete Strategy

### 6.1 Standard Pattern

All primary business tables support soft delete:

```sql
ALTER TABLE {table}_v2 ADD COLUMN deleted_at TIMESTAMPTZ;
```

- `deleted_at IS NULL` = active record
- `deleted_at IS NOT NULL` = soft-deleted
- Queries include `WHERE deleted_at IS NULL` by default
- Applications can include deleted records for admin views

### 6.2 Behavior by Entity

| Entity | Soft Delete | Hard Delete | Retention |
|--------|:-----------:|:-----------:|-----------|
| customers_v2 | Yes | Never | Permanent |
| technicians_v2 | Yes | Never | Permanent |
| tickets_v2 | Yes | Never | Permanent |
| appointments_v2 | Yes | Never | Permanent |
| disputes_v2 | Yes | Never | Permanent |
| work_orders_v2 | Yes | Never | Permanent |
| dispatches_v2 | Yes | Never | Permanent |
| tasks_v2 | Yes | Never | Permanent |
| accounts_v2 | Yes | Never | Permanent |
| followups_v2 | Yes | Never | Permanent |
| notifications_v2 | No | After 90 days | 90 days |
| audit_log_v2 | No | Never | Permanent |
| events_v2 | No | After 365 days | 365 days |
| user_sessions_v2 | No | After expiry + 30 days | Session expiry + 30 days |

---

## 7. Migration Strategy

### 7.1 Migration File Naming

```
{VERSION}_{DESCRIPTION}.sql
```

Examples:
```
001_create_customers_v2.sql
002_create_technicians_v2.sql
003_create_tickets_v2.sql
...
015_add_indexes_v2.sql
016_seed_reference_data_v2.sql
```

### 7.2 Migration Directory Structure

```
database/
├── migrations/           -- V1 migrations (untouched)
│   └── 001_tickets_add_status_values_and_column.sql
├── seeds/                -- V1 seed data (untouched)
│   ├── customers.json
│   └── ...
├── migrations_v2/         -- V2 migrations
│   ├── 001_create_customers_v2.sql
│   ├── 002_create_technicians_v2.sql
│   ├── ...
│   ├── 040_create_indexes_v2.sql
│   └── 041_seed_reference_data_v2.sql
├── seeds_v2/              -- V2 seed data
│   ├── customers_v2.json
│   ├── technicians_v2.json
│   └── ...
└── functions_v2/          -- V2 migration helper functions
    ├── seed_ref_data.sql
    └── install_triggers.sql
```

### 7.3 Migration Order

```
PHASE 1: Foundation Tables (no foreign key dependencies)
  001 — users_v2
  002 — user_roles_v2
  003 — role_permissions_v2
  004 — system_settings_v2
  005 — feature_flags_v2
  006 — reference_data_v2 (service types, ticket channels, etc.)
  007 — knowledge_categories_v2

PHASE 2: Core Domain Tables (depend on foundation)
  008 — customers_v2
  009 — customer_addresses_v2
  010 — technicians_v2
  011 — technician_skills_v2
  012 — accounts_v2
  013 — account_health_scans_v2

PHASE 3: Operational Tables (depend on core)
  014 — tickets_v2
  015 — ticket_messages_v2
  016 — ticket_attachments_v2
  017 — appointments_v2
  018 — appointment_reminders_v2
  019 — disputes_v2
  020 — dispute_evidence_v2
  021 — tasks_v2
  022 — task_assignments_v2

PHASE 4: Field Operations (depend on operational)
  023 — work_orders_v2
  024 — work_order_stages_v2
  025 — dispatches_v2
  026 — followups_v2
  027 — followup_attempts_v2

PHASE 5: Knowledge & Inventory (independent)
  028 — knowledge_articles_v2
  029 — inventory_items_v2
  030 — inventory_transactions_v2

PHASE 6: Feedback (depend on operational)
  031 — feedback_v2
  032 — feedback_surveys_v2

PHASE 7: Infrastructure (depend on foundation)
  033 — notifications_v2
  034 — notification_templates_v2
  035 — notification_channels_v2
  036 — connectors_v2

PHASE 8: Analytics (depend on all business tables)
  037 — analytics_reports_v2
  038 — analytics_schedules_v2

PHASE 9: Audit & Events (final)
  039 — audit_log_v2
  040 — events_v2
  041 — user_sessions_v2

PHASE 10: Performance & Seeds
  042 — create_indexes_v2
  043 — install_audit_triggers_v2
  044 — seed_reference_data_v2
  045 — seed_demo_data_v2
```

---

## 8. Security Architecture

### 8.1 Row-Level Security (RLS)

All customer-scoped data uses RLS:

```sql
-- Enable RLS on customer-scoped tables
ALTER TABLE customers_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_v2 ENABLE ROW LEVEL SECURITY;

-- Customer can see their own data only
CREATE POLICY customer_self_access ON customers_v2
    FOR ALL
    USING (id = current_setting('app.user_customer_id')::UUID);

-- Agent/manager can see all
CREATE POLICY staff_full_access ON customers_v2
    FOR ALL
    USING (current_setting('app.user_role') IN ('admin', 'manager', 'agent'));
```

### 8.2 Column-Level Security

Sensitive columns are protected:

```sql
-- Technicians can't see customer financial data
CREATE POLICY technicians_restricted ON accounts_v2
    FOR SELECT
    USING (current_setting('app.user_role') != 'technician'
           OR id IN (
               SELECT account_id FROM followups_v2
               WHERE assigned_to = current_setting('app.user_id')::UUID
           ));
```

### 8.3 Encryption Strategy

| Data Type | Encryption | Method |
|-----------|:----------:|--------|
| Passwords | Yes | bcrypt (at application layer) |
| API keys/secrets | Yes | AES-256 encrypted in connectors_v2 |
| PII (email, phone) | At rest | Lemma platform-managed encryption |
| Session tokens | Yes | JWT with RS256 signing |

---

## 9. Performance Architecture

### 9.1 Expected Data Volumes

| Table | Year-1 Estimate | Year-3 Estimate | Growth Rate |
|-------|:---------------:|:---------------:|:-----------:|
| customers_v2 | 5,000 | 50,000 | 10x |
| technicians_v2 | 100 | 500 | 5x |
| tickets_v2 | 50,000 | 500,000 | 10x |
| appointments_v2 | 30,000 | 300,000 | 10x |
| disputes_v2 | 2,000 | 20,000 | 10x |
| work_orders_v2 | 25,000 | 250,000 | 10x |
| dispatches_v2 | 5,000 | 50,000 | 10x |
| tasks_v2 | 15,000 | 150,000 | 10x |
| accounts_v2 | 5,000 | 50,000 | 10x |
| followups_v2 | 20,000 | 200,000 | 10x |
| notifications_v2 | 200,000 | 2,000,000 | 10x |
| audit_log_v2 | 500,000 | 5,000,000 | 10x |
| events_v2 | 500,000 | 5,000,000 | 10x |
| ticket_messages_v2 | 150,000 | 1,500,000 | 10x |

### 9.2 Partitioning Strategy

Tables requiring partitioning at Year-2 volumes:

| Table | Partition Key | Partition Type | Threshold |
|-------|--------------|----------------|-----------|
| audit_log_v2 | created_at | Monthly | > 1M rows |
| events_v2 | created_at | Monthly | > 1M rows |
| notifications_v2 | created_at | Monthly | > 1M rows |
| ticket_messages_v2 | created_at | Quarterly | > 500K rows |

### 9.3 Caching Strategy

| Data | Cache Type | TTL | Invalidation |
|------|-----------|:---:|-------------|
| Reference data (service types, etc.) | Application cache | 1 hour | On update event |
| User/role permissions | Application cache | 15 minutes | On role change event |
| Account health scores | Application cache | 5 minutes | On health scan event |
| Active ticket counts | Dashboard cache | 30 seconds | On ticket event |
| Technician availability | Real-time | Immediate | On status change event |

---

## 10. Disaster Recovery

### 10.1 Backup Strategy

| Data | Frequency | Retention | Type |
|------|:---------:|:---------:|------|
| All tables | Daily | 30 days | Full backup |
| All tables | Weekly | 12 months | Full backup |
| audit_log_v2 | Daily incremental | 7 days | Incremental |
| Configuration tables | On-change | 30 versions | Point-in-time |

### 10.2 Recovery Objectives

| Tier | RPO | RTO | Scope |
|:----:|:---:|:---:|-------|
| Critical | 5 minutes | 1 hour | Tickets, appointments, dispatches |
| Important | 1 hour | 4 hours | Customers, accounts, work orders |
| Normal | 24 hours | 24 hours | Audit, events, notifications |
| Low | 7 days | 7 days | Historical analytics data |

---

> **End of DATABASE_ARCHITECTURE.md**  
> Next document: BUSINESS_DOMAINS.md
