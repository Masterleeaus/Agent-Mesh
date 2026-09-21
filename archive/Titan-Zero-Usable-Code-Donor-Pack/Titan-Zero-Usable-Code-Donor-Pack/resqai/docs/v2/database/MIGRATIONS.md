# RESQAI V2 — Migration Reference

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Migration Philosophy](#1-migration-philosophy)
2. [Migration Directory Structure](#2-migration-directory-structure)
3. [Migration File Naming](#3-migration-file-naming)
4. [Complete Migration Inventory](#4-complete-migration-inventory)
5. [Migration Execution Strategy](#5-migration-execution-strategy)
6. [Rollback Strategy](#6-rollback-strategy)
7. [Migration Verification](#7-migration-verification)
8. [Seed Data Loading Order](#8-seed-data-loading-order)
9. [Migration Error Recovery](#9-migration-error-recovery)

---

## 1. Migration Philosophy

### 1.1 Forward-Only

All V2 migrations are **forward-only by design**. Once a migration has been applied to an environment, it is never modified. Fixes to a migration are delivered as a *new* migration, not an edit to an existing one.

| Rule | Rationale |
|------|-----------|
| Never edit an applied migration | Breaks consistency across environments |
| Never reorder migration files | Version tracking depends on sort order |
| Never delete a migration file | Rollback requires the original DDL |
| New column? New migration | Add-only pattern preserves history |

### 1.2 Immutable History

The `migrations_v2/` directory is treated as append-only. Every migration carries a date, purpose header, and verify commands. The files themselves serve as the canonical record of every schema change.

### 1.3 Version Tracking

Version = migration number (001–041). The sequence is strict: migration N+1 may only be applied after migration N has completed successfully. Version numbers never skip and never reuse.

```
001 -> 002 -> 003 -> ... -> 041
```

Internal state tracking (applied vs. pending) is stored in the deployment tool's state (e.g., a `_migrations` tracking table or Lemma resource metadata).

---

## 2. Migration Directory Structure

```
database/
+-- migrations_v2/            # Forward migrations (001-041)
|   +-- 001_create_reference_data_v2.sql
|   +-- 002_create_system_settings_v2.sql
|   +-- ...
|   +-- 041_create_events_v2.sql
|
+-- rollbacks_v2/             # Rollback files (001-041)
|   +-- 001_rollback_reference_data_v2.sql
|   +-- 002_rollback_system_settings_v2.sql
|   +-- ...
|   +-- 041_rollback_events_v2.sql
|
+-- seeds_v2/                 # Demo/seed data (loaded post-migration)
|   +-- demo_customers_v2.json
|   +-- demo_technicians_v2.json
|   +-- demo_tickets_v2.json
|   +-- demo_appointments_v2.json
|
+-- lookup_data/              # Reference/lookup data (loaded post-migration)
|   +-- reference_data_v2.json
|   +-- user_roles_v2.json
|   +-- role_permissions_v2.json
|   +-- system_settings_v2.json
|   +-- feature_flags_v2.json
|
+-- functions_v2/             # Database helper functions (loaded post-migration)
|   (currently empty - reserved for future PL/pgSQL functions)
|
+-- migrations/               # V1 migrations (untouched - legacy)
+-- seeds/                    # V1 seed data (untouched - legacy)
```

---

## 3. Migration File Naming

### 3.1 Pattern

```
{VERSION}_{DESCRIPTION}.sql
```

- **VERSION**: Zero-padded 3-digit number (001–041)
- **DESCRIPTION**: Lowercase snake_case summary of the migration's purpose
- **Extension**: `.sql`

### 3.2 Examples

| File | Description |
|------|-------------|
| `001_create_reference_data_v2.sql` | Creates the reference_data_v2 lookup table |
| `017_create_tickets_v2.sql` | Creates the tickets_v2 operational table |
| `041_create_events_v2.sql` | Creates the events_v2 event bus table |

### 3.3 Rollback File Naming

Rollback files follow the same version scheme with a `rollback_` prefix:

```
{VERSION}_rollback_{DESCRIPTION}.sql
```

Example: `017_rollback_tickets_v2.sql`

---

## 4. Complete Migration Inventory

### 4.1 Legend

| Column | Description |
|--------|-------------|
| **#** | Migration number |
| **Name** | Brief description from filename |
| **Table** | Primary table created |
| **Phase** | Grouping phase (1-10) |
| **Dependencies** | Tables that must exist before this migration |
| **Est. Time** | Estimated execution time |
| **Rollback** | Corresponding rollback file |

Estimated times assume a PostgreSQL-compatible database on moderate hardware with <100ms network latency.

---

### PHASE 1: Foundation Tables (Migrations 001-006)

Phase 1 establishes the foundational infrastructure tables. These tables have **no foreign key dependencies** on any business entity and can all be created in parallel.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 001 | Create reference_data_v2 | reference_data_v2 | None | 2s | 001_rollback_reference_data_v2.sql |
| 002 | Create system_settings_v2 | system_settings_v2 | None | 1s | 002_rollback_system_settings_v2.sql |
| 003 | Create feature_flags_v2 | feature_flags_v2 | None | 1s | 003_rollback_feature_flags_v2.sql |
| 004 | Create connectors_v2 | connectors_v2 | None | 1s | 004_rollback_connectors_v2.sql |
| 005 | Create knowledge_categories_v2 | knowledge_categories_v2 | None (self-ref FK) | 1s | 005_rollback_knowledge_categories_v2.sql |
| 006 | Create user_roles_v2 | user_roles_v2 | None | 1s | 006_rollback_user_roles_v2.sql |

**Dependency summary**: reference_data_v2, system_settings_v2, feature_flags_v2, connectors_v2, knowledge_categories_v2, user_roles_v2 all have zero FK dependencies. Knowledge_categories_v2 has a self-referencing FK (parent_id) but that does not block creation.

**Parallelizable**: Yes - all 6 can run concurrently.

---

### PHASE 2: Identity (Migrations 007-009)

Phase 2 builds the identity and access management layer.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 007 | Create users_v2 | users_v2 | user_roles_v2 (006) | 2s | 007_rollback_users_v2.sql |
| 008 | Create user_sessions_v2 | user_sessions_v2 | users_v2 (007) | 1s | 008_rollback_user_sessions_v2.sql |
| 009 | Create role_permissions_v2 | role_permissions_v2 | user_roles_v2 (006) | 1s | 009_rollback_role_permissions_v2.sql |

**Dependency chain**: 006 -> 007 -> 008; 006 -> 009
**Parallelizable**: 007 must run before 008. 009 can run in parallel with 008.

---

### PHASE 3: Core Business (Migrations 010-016)

Phase 3 creates the core domain entities.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 010 | Create notification_templates_v2 | notification_templates_v2 | None | 1s | 010_rollback_notification_templates_v2.sql |
| 011 | Create notification_channels_v2 | notification_channels_v2 | None | 1s | 011_rollback_notification_channels_v2.sql |
| 012 | Create customers_v2 | customers_v2 | users_v2 (007, for created_by/updated_by) | 2s | 012_rollback_customers_v2.sql |
| 013 | Create customer_addresses_v2 | customer_addresses_v2 | customers_v2 (012) | 1s | 013_rollback_customer_addresses_v2.sql |
| 014 | Create technicians_v2 | technicians_v2 | None | 2s | 014_rollback_technicians_v2.sql |
| 015 | Create technician_skills_v2 | technician_skills_v2 | technicians_v2 (014) | 1s | 015_rollback_technician_skills_v2.sql |
| 016 | Create accounts_v2 | accounts_v2 | customers_v2 (012) | 2s | 016_rollback_accounts_v2.sql |

**Dependency chain**: None (010, 011); 007 -> 012 -> 013; 012 -> 016; 014 -> 015
**Parallelizable**: 010, 011, 012, 014 can run in parallel. 013 waits for 012. 015 waits for 014. 016 waits for 012.

---

### PHASE 4: Operational (Migrations 017-021)

Phase 4 creates the core operational entities for ticket management and appointment scheduling.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 017 | Create tickets_v2 | tickets_v2 | customers_v2 (012) | 2s | 017_rollback_tickets_v2.sql |
| 018 | Create ticket_messages_v2 | ticket_messages_v2 | tickets_v2 (017) | 1s | 018_rollback_ticket_messages_v2.sql |
| 019 | Create ticket_attachments_v2 | ticket_attachments_v2 | tickets_v2 (017) | 1s | 019_rollback_ticket_attachments_v2.sql |
| 020 | Create appointments_v2 | appointments_v2 | customers_v2 (012), technicians_v2 (014) | 2s | 020_rollback_appointments_v2.sql |
| 021 | Create appointment_reminders_v2 | appointment_reminders_v2 | appointments_v2 (020) | 1s | 021_rollback_appointment_reminders_v2.sql |

**Dependency chain**: 012 -> 017 -> 018; 017 -> 019; 012+014 -> 020 -> 021
**Parallelizable**: 017 and 020 can run in parallel. 018/019 wait for 017. 021 waits for 020.

---

### PHASE 5: Field Operations (Migrations 022-026)

Phase 5 extends operations with field work management and dispute resolution.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 022 | Create work_orders_v2 | work_orders_v2 | appointments_v2 (020), technicians_v2 (014), customers_v2 (012) | 2s | 022_rollback_work_orders_v2.sql |
| 023 | Create work_order_stages_v2 | work_order_stages_v2 | work_orders_v2 (022) | 1s | 023_rollback_work_order_stages_v2.sql |
| 024 | Create dispatches_v2 | dispatches_v2 | tickets_v2 (017), appointments_v2 (020), technicians_v2 (014) | 2s | 024_rollback_dispatches_v2.sql |
| 025 | Create disputes_v2 | disputes_v2 | appointments_v2 (020), customers_v2 (012), tickets_v2 (017) | 2s | 025_rollback_disputes_v2.sql |
| 026 | Create dispute_evidence_v2 | dispute_evidence_v2 | disputes_v2 (025) | 1s | 026_rollback_dispute_evidence_v2.sql |

**Dependency chain**: 012+014+020 -> 022 -> 023; 014+017+020 -> 024; 012+017+020 -> 025 -> 026
**Parallelizable**: 022, 024, 025 can run in parallel if their deps are met. 023 waits for 022. 026 waits for 025.

---

### PHASE 6: Management (Migrations 027-031)

Phase 6 creates task management, follow-up tracking, and account health monitoring.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 027 | Create tasks_v2 | tasks_v2 | None | 1s | 027_rollback_tasks_v2.sql |
| 028 | Create task_assignments_v2 | task_assignments_v2 | tasks_v2 (027) | 1s | 028_rollback_task_assignments_v2.sql |
| 029 | Create followups_v2 | followups_v2 | accounts_v2 (016), customers_v2 (012) | 2s | 029_rollback_followups_v2.sql |
| 030 | Create followup_attempts_v2 | followup_attempts_v2 | followups_v2 (029) | 1s | 030_rollback_followup_attempts_v2.sql |
| 031 | Create account_health_scans_v2 | account_health_scans_v2 | accounts_v2 (016) | 1s | 031_rollback_account_health_scans_v2.sql |

**Dependency chain**: 027 -> 028; 012+016 -> 029 -> 030; 016 -> 031
**Parallelizable**: 027 and 029 can run in parallel. 028 waits for 027. 030 waits for 029. 031 waits for 016.

---

### PHASE 7: Knowledge & Inventory (Migrations 032-034)

Phase 7 creates knowledge management and inventory tracking.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 032 | Create knowledge_articles_v2 | knowledge_articles_v2 | knowledge_categories_v2 (005) | 2s | 032_rollback_knowledge_articles_v2.sql |
| 033 | Create inventory_items_v2 | inventory_items_v2 | None | 1s | 033_rollback_inventory_items_v2.sql |
| 034 | Create inventory_transactions_v2 | inventory_transactions_v2 | inventory_items_v2 (033) | 1s | 034_rollback_inventory_transactions_v2.sql |

**Dependency chain**: 005 -> 032; 033 -> 034
**Parallelizable**: 032 can run independently once 005 is done. 033 can run any time. 034 waits for 033.

---

### PHASE 8: Feedback (Migrations 035-036)

Phase 8 creates the customer feedback system.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 035 | Create feedback_v2 | feedback_v2 | customers_v2 (012), tickets_v2 (017), appointments_v2 (020) | 2s | 035_rollback_feedback_v2.sql |
| 036 | Create feedback_surveys_v2 | feedback_surveys_v2 | feedback_v2 (035) | 1s | 036_rollback_feedback_surveys_v2.sql |

**Dependency chain**: 012+017+020 -> 035 -> 036
**Parallelizable**: No internal parallelism (single chain of 2).

---

### PHASE 9: Infrastructure (Migrations 037)

Phase 9 creates the notification delivery infrastructure.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 037 | Create notifications_v2 | notifications_v2 | notification_templates_v2 (010) | 2s | 037_rollback_notifications_v2.sql |

**Dependency chain**: 010 -> 037
**Parallelizable**: N/A (single migration).

---

### PHASE 10: Analytics & Audit (Migrations 038-041)

The final phase creates analytics, reporting, audit, and event infrastructure.

| # | Name | Table | Deps | Est. Time | Rollback |
|:-:|------|-------|:----:|:---------:|:--------:|
| 038 | Create analytics_reports_v2 | analytics_reports_v2 | None | 1s | 038_rollback_analytics_reports_v2.sql |
| 039 | Create analytics_schedules_v2 | analytics_schedules_v2 | analytics_reports_v2 (038) | 1s | 039_rollback_analytics_schedules_v2.sql |
| 040 | Create audit_log_v2 | audit_log_v2 | None | 1s | 040_rollback_audit_log_v2.sql |
| 041 | Create events_v2 | events_v2 | None | 1s | 041_rollback_events_v2.sql |

**Dependency chain**: 038 -> 039; 040, 041 are independent
**Parallelizable**: 038, 040, 041 in parallel. 039 waits for 038.

---

## 5. Migration Execution Strategy

### 5.1 Parallel Groups

The dependency DAG allows 6 parallel groups across 11 sequential steps:

```
Step 1  [GROUP A - 6 in parallel]
        001 reference_data_v2
        002 system_settings_v2
        003 feature_flags_v2
        004 connectors_v2
        005 knowledge_categories_v2
        006 user_roles_v2

Step 2  [GROUP B - 1 migration]
        007 users_v2                      (depends on 006)

Step 3  [GROUP C - 2 in parallel]
        008 user_sessions_v2              (depends on 007)
        009 role_permissions_v2            (depends on 006)

Step 4  [GROUP D - 4 in parallel]
        010 notification_templates_v2     (independent)
        011 notification_channels_v2      (independent)
        012 customers_v2                  (depends on 007)
        014 technicians_v2                (independent)

Step 5  [GROUP E - 3 in parallel]
        013 customer_addresses_v2         (depends on 012)
        015 technician_skills_v2          (depends on 014)
        016 accounts_v2                   (depends on 012)

Step 6  [GROUP F - 3 in parallel]
        017 tickets_v2                    (depends on 012)
        020 appointments_v2               (depends on 012, 014)
        027 tasks_v2                      (independent)
        032 knowledge_articles_v2          (depends on 005)
        033 inventory_items_v2            (independent)
        038 analytics_reports_v2          (independent)
        040 audit_log_v2                  (independent)
        041 events_v2                     (independent)

Step 7  [GROUP G - 4 in parallel]
        018 ticket_messages_v2            (depends on 017)
        019 ticket_attachments_v2         (depends on 017)
        021 appointment_reminders_v2      (depends on 020)
        022 work_orders_v2                (depends on 020, 014, 012)
        024 dispatches_v2                 (depends on 017, 020, 014)
        025 disputes_v2                   (depends on 020, 012, 017)
        029 followups_v2                  (depends on 016, 012)
        031 account_health_scans_v2       (depends on 016)
        034 inventory_transactions_v2     (depends on 033)
        035 feedback_v2                   (depends on 012, 017, 020)
        037 notifications_v2              (depends on 010)
        039 analytics_schedules_v2        (depends on 038)

Step 8  [GROUP H - 2 in parallel]
        023 work_order_stages_v2          (depends on 022)
        026 dispute_evidence_v2           (depends on 025)
        030 followup_attempts_v2          (depends on 029)

Step 9  [GROUP I - 1 migration]
        028 task_assignments_v2           (depends on 027)

Step 10 [GROUP J - 1 migration]
        036 feedback_surveys_v2           (depends on 035)
```

### 5.2 Minimum Steps

| Metric | Value |
|--------|-------|
| Total migrations | 41 |
| Sequential steps | 11 (with parallelization) |
| Serial execution steps | 41 |
| Max parallel in a single step | 8 (Step 6) |
| Estimated serial time | ~60s |
| Estimated parallel time | ~15s |

### 5.3 Estimated Total Execution Time

| Phase | Migrations | Serial Est. | Parallel Est. |
|:-----:|:----------:|:-----------:|:-------------:|
| 1 | 001-006 | ~7s | ~2s |
| 2 | 007-009 | ~4s | ~2s |
| 3 | 010-016 | ~10s | ~4s |
| 4 | 017-021 | ~7s | ~3s |
| 5 | 022-026 | ~8s | ~4s |
| 6 | 027-031 | ~6s | ~3s |
| 7 | 032-034 | ~4s | ~2s |
| 8 | 035-036 | ~3s | ~2s |
| 9 | 037 | ~2s | ~2s |
| 10 | 038-041 | ~4s | ~2s |
| **Total** | **001-041** | **~55s** | **~26s** |

---

## 6. Rollback Strategy

### 6.1 Rollback Order

Rollback runs in **strict reverse order** of forward migrations:

```
041 -> 040 -> 039 -> 038 -> 037 -> ... -> 001
```

The rollback of migration N may only run after rollback N+1 has completed successfully.

### 6.2 Data Preservation Before Rollback

Before any rollback executes, the following safety measures are taken:

1. **Data dump**: All rows in the target table are exported to a temporary backup
2. **FK check**: Verify no child tables still reference the target table
3. **Dependency check**: Confirm all dependent migrations have already been rolled back

### 6.3 Rollback Safety Checks

Each rollback file should include these checks:

```sql
-- Safety check: verify no active dependencies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM child_table WHERE child_fk IN (SELECT id FROM target_table)) THEN
        RAISE EXCEPTION 'Cannot rollback: child_table has references to target_table';
    END IF;
END $$;

-- Data preservation
CREATE TABLE backup_schema.target_table_rollback_YYYYMMDD AS SELECT * FROM target_table;

-- Drop table
DROP TABLE IF EXISTS target_table CASCADE;
```

### 6.4 Rollback File Inventory

Every forward migration (001-041) has a corresponding rollback file in `database/rollbacks_v2/`:

| Forward | Rollback | Action |
|:-------:|:--------:|--------|
| 001_create_reference_data_v2.sql | 001_rollback_reference_data_v2.sql | DROP TABLE reference_data_v2 |
| 002 ... | 002_rollback_system_settings_v2.sql | DROP TABLE system_settings_v2 |
| ... | ... | ... |
| 041_create_events_v2.sql | 041_rollback_events_v2.sql | DROP TABLE events_v2 |

---

## 7. Migration Verification

### 7.1 Verify Commands in Each Migration

Every migration file includes verify commands (commented out) that should be run after successful execution:

```sql
-- Verify: lemma table describe reference_data_v2
-- Verify: lemma table indexes reference_data_v2
-- Expected: idx_refdata_type_code, idx_refdata_type_sort, idx_refdata_is_active
-- Expected: uq_refdata_type_code (unique on type + code)
```

Standard verification for every migration:
1. **Table exists**: `lemma table describe {table_name}`
2. **Columns present**: Verify expected columns
3. **Indexes created**: `lemma table indexes {table_name}` or `lemma table list-indexes {table_name}`
4. **Constraints correct**: FK, unique, CHECK constraints

### 7.2 Post-Migration Health Checks

After all 41 migrations complete:

1. **Table count**: Verify 41 tables exist
   ```
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE '%_v2';
   -- Expected: 41
   ```

2. **Index count**: Verify indexes exist on all FK columns
   ```
   SELECT COUNT(*) FROM pg_indexes WHERE tablename LIKE '%_v2';
   ```

3. **Constraint check**: Verify all FK constraints are valid
   ```
   SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE constraint_type = 'FOREIGN KEY' AND table_name LIKE '%_v2';
   ```

4. **Schema integrity**: Run `lemma resource list` or equivalent to verify all resources are registered

### 7.3 Data Integrity Validation

After seed data loading:

1. **Reference data**: `SELECT type, COUNT(*) FROM reference_data_v2 GROUP BY type;` - verify 11 types present
2. **Roles**: `SELECT COUNT(*) FROM user_roles_v2;` - expected 8
3. **Settings**: `SELECT COUNT(*) FROM system_settings_v2;` - expected 29
4. **Feature flags**: `SELECT COUNT(*) FROM feature_flags_v2;` - expected 12
5. **Permissions**: `SELECT COUNT(*) FROM role_permissions_v2;` - expected ~80

---

## 8. Seed Data Loading Order

Seed files must be loaded in dependency order after all 41 migrations complete:

```
Step 1: reference_data_v2.json        (no dependencies)
Step 2: user_roles_v2.json            (no dependencies)
Step 3: system_settings_v2.json       (no dependencies)
Step 4: role_permissions_v2.json      (depends on user_roles_v2)
Step 5: feature_flags_v2.json         (no dependencies)
Step 6: demo_customers_v2.json        (no dependencies, but after reference_data_v2 for lookup codes)
Step 7: demo_technicians_v2.json      (no dependencies)
Step 8: demo_tickets_v2.json          (depends on demo_customers_v2)
Step 9: demo_appointments_v2.json     (depends on demo_customers_v2, demo_technicians_v2)
```

All seed operations must be **idempotent** - safe to re-run without creating duplicates.

---

## 9. Migration Error Recovery

### 9.1 Error Types and Responses

| Error Type | Symptom | Recovery Action |
|------------|---------|-----------------|
| FK violation | `foreign key constraint` | Verify dependency table exists and seeded first |
| Duplicate key | `unique constraint` | Check for partial application; idempotency guard |
| Syntax error | `syntax error at or near` | Fix file, rerun single migration |
| Timeout | `canceling statement due to statement timeout` | Increase timeout, retry |
| Connection loss | `connection refused` | Verify pod/DB is running, retry |
| Resource conflict | `already exists` | Migration was partially applied; skip with state update |

### 9.2 Recovery Procedure

1. **Stop the migration run** - Do not continue if an error occurs
2. **Identify the failed migration** from the error message
3. **Assess state**:
   - Was the table created? Check `information_schema.tables`
   - Were indexes created? Check `pg_indexes`
   - Were constraints created? Check `information_schema.table_constraints`
4. **Choose recovery path**:
   - **Table not created**: Fix issue (syntax, timeout, etc.) and retry the migration
   - **Table partially created**: Run rollback for that migration, fix, retry
   - **Table fully created but seed failed**: Skip DDL, retry seed step
5. **Update version tracker** to mark the migration as applied/failed as appropriate
6. **Resume from the failed migration** - never skip forward

### 9.3 Partial Application Detection

```sql
-- Check if a specific table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'customers_v2'
);

-- Check if a specific index exists
SELECT EXISTS (
    SELECT FROM pg_indexes
    WHERE indexname = 'idx_customers_v2_status'
);
```

### 9.4 Idempotent Re-run Wrapper

Migration scripts should include guards for idempotent re-execution:

```sql
-- Idempotency guard
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reference_data_v2') THEN
        RAISE NOTICE 'Table reference_data_v2 already exists, skipping';
        RETURN;
    END IF;
    -- CREATE TABLE statement here
END $$;
```

---

> **End of MIGRATIONS.md**
