# RESQAI V2 — Seed Data Reference

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Seed Data Philosophy](#1-seed-data-philosophy)
2. [Seed Data Directory Structure](#2-seed-data-directory-structure)
3. [Reference Data](#3-reference-data)
4. [Demo Data](#4-demo-data)
5. [Seed Loading Procedure](#5-seed-loading-procedure)
6. [Data Dependencies](#6-data-dependencies)
7. [Idempotency](#7-idempotency)
8. [Customizing Seed Data](#8-customizing-seed-data)
9. [Clearing Seed Data](#9-clearing-seed-data)

---

## 1. Seed Data Philosophy

### 1.1 Minimum Viable Data for Development

Seed data provides just enough reference and demo information to make the application functional in a development or staging environment. The goal is to:

- Make the app immediately usable after a fresh migration
- Provide realistic data shapes for UI development
- Enable meaningful API testing without manual data entry
- Avoid overwhelming developers with excessive test data

**Principle**: _Ship with what a developer needs to verify the schema works, no more._

### 1.2 Realistic Demo Data

Demo data models real-world service business scenarios:

| Scenario | Purpose |
|----------|---------|
| Multiple customer types | Test type-based filtering and display |
| Mixed ticket statuses | Verify status workflows and transitions |
| Assigned and unassigned tickets | Test assignment logic and UI states |
| Upcoming, active, and completed appointments | Verify calendar views and scheduling |
| Technicians with varied skills | Test skill-matching and dispatch |
| Full permission matrix | Verify RBAC across all resource/action combinations |

---

## 2. Seed Data Directory Structure

```
database/
+-- lookup_data/                     # Reference/lookup data (always loaded)
|   +-- reference_data_v2.json       # 60 reference values, 11 types
|   +-- user_roles_v2.json           # 8 roles
|   +-- role_permissions_v2.json     # ~80 permission entries
|   +-- system_settings_v2.json      # 29 configuration settings
|   +-- feature_flags_v2.json        # 12 feature flags
|
+-- seeds_v2/                        # Demo/seed data (loaded on-demand)
|   +-- demo_customers_v2.json       # 10 customer records
|   +-- demo_technicians_v2.json     # 5 technician records
|   +-- demo_tickets_v2.json         # 12 ticket records
|   +-- demo_appointments_v2.json    # 8 appointment records
|
+-- seeds/                           # V1 seed data (untouched)
+-- migrations/                      # V1 migrations (untouched)
+-- migrations_v2/                   # V2 forward migrations
+-- rollbacks_v2/                    # V2 rollback files
```

### 2.1 File Format

All seed files use JSON array format:

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "type": "service_type",
    "code": "general_repair",
    "label": "General Repair",
    "description": "Standard repair service",
    "sort_order": 1,
    "is_active": true
  },
  ...
]
```

---

## 3. Reference Data

### 3.1 reference_data_v2.json — 60 Values Across 11 Types

The reference_data_v2 table uses a single-table-with-type-discriminator pattern. All lookup values share one table, differentiated by the `type` column.

| Type | Count | Codes | Used By |
|------|:-----:|-------|---------|
| service_type | 5 | general_repair, maintenance, installation, inspection, consultation | appointments_v2, work_orders_v2 |
| ticket_channel | 7 | email, chat, sms, phone, web, social, api | tickets_v2 |
| ticket_request_type | 6 | new_booking, reschedule, cancellation, billing, complaint, general_inquiry | tickets_v2 |
| dispute_resolution_type | 5 | full_refund, partial_refund, re-service_no_charge, re-service_discounted, customer_credit | disputes_v2 |
| followup_type | 5 | check_in, satisfaction, renewal, feedback_request, service_reminder | followups_v2 |
| inventory_category | 6 | parts, consumables, tools, equipment, safety, supplies | inventory_items_v2 |
| notification_type | 5 | appointment_reminder, ticket_update, dispatch_alert, dispute_resolution, account_health | notifications_v2 |
| work_order_stage | 5 | created, en_route, on_site, in_progress, completed | work_order_stages_v2 |
| customer_type | 4 | residential, commercial, industrial, government | customers_v2 |
| skill_name | 5 | hvac, plumbing, electrical, general, appliance | technician_skills_v2 |
| evidence_type | 5 | photo, video, document, audio, statement | dispute_evidence_v2 |
| feedback_source | 2 | post_service, followup_survey | feedback_v2 |
| dispatch_type | 3 | urgent, scheduled, emergency | dispatches_v2 |

**Total: 60 reference value rows across 11 distinct types** (dispatch_type, feedback_source, evidence_type, skill_name, customer_type, work_order_stage, notification_type, inventory_category, followup_type, dispute_resolution_type, ticket_request_type, ticket_channel, service_type)

### 3.2 user_roles_v2.json — 8 Roles

| ID (suffix) | Name | Description | Is System |
|:-----------:|------|-------------|:---------:|
| 101 | super_admin | Full system access with all permissions | true |
| 102 | admin | System administrator with configuration access | true |
| 103 | manager | Operations manager with team oversight | false |
| 104 | agent | Support agent handling tickets and customers | false |
| 105 | technician | Field technician managing work orders | false |
| 106 | customer | Customer accessing self-service portal | false |
| 107 | auditor | Read-only access for compliance auditing | false |
| 108 | api_service | Service account for API integrations | true |

### 3.3 role_permissions_v2.json — ~80 Permission Entries

Permission entries define which roles can perform which actions on which resources.

| Resource | Actions | Roles |
|----------|---------|-------|
| tickets | create, read, update, delete | super_admin: all; admin/manager/agent: CRU; technician: R; customer: R (own) |
| appointments | create, read, update, delete | super_admin: all; admin/manager: CRU; technician: RU; customer: R (own) |
| customers | create, read, update, delete | super_admin: all; admin/manager/agent: CRU; customer: R (own) |
| technicians | create, read, update, delete | super_admin: all; admin/manager: CRU |
| accounts | create, read, update | super_admin/admin/manager: all; agent: R |
| work_orders | create, read, update | super_admin: all; manager/technician: RU |
| dispatches | create, read, update | super_admin: all; manager: CRU |
| disputes | create, read, update, resolve | super_admin: all; manager/agent: CRU |
| tasks | create, read, update, delete | super_admin: all; manager/technician: CRU |
| followups | create, read, update, complete | super_admin: all; manager/agent: CRU |
| inventory | create, read, update | super_admin: all; manager/technician: R |
| notifications | create, read, update | super_admin: all; manager/agent: R |
| analytics | create, read, update, delete | super_admin/admin: all; manager: R |
| audit_log | read | super_admin/admin: CRU; auditor: R |
| system_settings | create, read, update, delete | super_admin: all; admin: RU |
| feature_flags | create, read, update, delete | super_admin: all |
| connectors | create, read, update, delete | super_admin: all |
| user_management | create, read, update, delete | super_admin: all; admin: RU |

**Scope values**: `all` (all records), `own` (own records only), `team` (team-scoped records)

### 3.4 system_settings_v2.json — 29 Configuration Settings

| Category | Keys | Description |
|----------|------|-------------|
| Application | app.name, app.version, app.timezone, app.locale | Core app configuration |
| Notifications | notifications.default_channel, notifications.retry_count, notifications.retry_interval | Notification behavior |
| Scheduling | scheduling.default_duration, scheduling.arrival_window, scheduling.max_daily_jobs_per_tech | Appointment defaults |
| SLA | sla.ticket_response_hours, sla.urgent_response_hours, sla.escalation_hours | Service level agreements |
| Disputes | disputes.auto_escalation_days, disputes.max_evidence_items | Dispute rules |
| Followups | followups.default_due_days, followups.max_attempts | Follow-up defaults |
| Inventory | inventory.low_stock_threshold, inventory.default_reorder_qty | Inventory management |
| Security | security.max_login_attempts, security.session_timeout_minutes, security.password_min_length | Auth security |
| Analytics | analytics.default_report_format, analytics.retention_days | Reporting defaults |
| UI | ui.items_per_page, ui.date_format, ui.time_format | Interface preferences |

### 3.5 feature_flags_v2.json — 12 Feature Flags

| Feature Group | Flag Name | Enabled | Rollout % | Description |
|---------------|-----------|:-------:|:---------:|-------------|
| support-center-v2 | ai_classification | Yes | 100% | AI-powered ticket classification |
| support-center-v2 | ai_drafting | Yes | 50% | AI-assisted response drafting |
| support-center-v2 | ticket_attachments | Yes | 100% | File attachments on tickets |
| support-center-v2 | customer_portal | Yes | 100% | Customer self-service portal |
| appointment-center-v2 | auto_scheduling | Yes | 75% | AI-optimized appointment scheduling |
| appointment-center-v2 | sms_reminders | Yes | 100% | SMS appointment reminders |
| operations-center-v2 | auto_dispatch | Yes | 50% | Automated technician dispatch |
| operations-center-v2 | inventory_tracking | Yes | 100% | Real-time inventory tracking |
| crm-center-v2 | health_scoring | Yes | 100% | Automated account health scoring |
| crm-center-v2 | followup_automation | Yes | 50% | Automated follow-up scheduling |
| resolution-center-v2 | ai_resolution | Yes | 25% | AI-powered dispute resolution |
| admin-center-v2 | export_api | Yes | 100% | Data export API access |

---

## 4. Demo Data

### 4.1 demo_customers_v2.json — 10 Customers

| # | Name | Type | Phone | Email | Status |
|:-:|------|:----:|-------|-------|:------:|
| 1 | Alice Johnson | Residential | +1-555-0101 | alice.johnson@example.com | active |
| 2 | Bob Smith | Residential | +1-555-0102 | bob.smith@example.com | active |
| 3 | Carol Williams | Residential | +1-555-0103 | carol.williams@example.com | active |
| 4 | David Brown | Commercial | +1-555-0104 | david.brown@example.com | active |
| 5 | Eva Martinez | Commercial | +1-555-0105 | eva.martinez@example.com | active |
| 6 | Frank Davis | Residential | +1-555-0106 | frank.davis@example.com | inactive |
| 7 | Grace Lee | Industrial | +1-555-0107 | grace.lee@example.com | active |
| 8 | Henry Wilson | Commercial | +1-555-0108 | henry.wilson@example.com | active |
| 9 | Irene Taylor | Residential | +1-555-0109 | irene.taylor@example.com | active |
| 10 | Jack Anderson | Government | +1-555-0110 | jack.anderson@example.com | active |

**Mix**: 5 residential, 3 commercial, 1 industrial, 1 government. 9 active, 1 inactive.

### 4.2 demo_technicians_v2.json — 5 Technicians

| # | Name | Skills | Max Daily Jobs | Status |
|:-:|------|--------|:--------------:|:------:|
| 1 | Mike Johnson | hvac, general | 4 | available |
| 2 | Sarah Connor | plumbing, general | 3 | available |
| 3 | Tom Baker | electrical, hvac | 4 | on_job |
| 4 | Lisa Cooper | appliance, general | 5 | available |
| 5 | Ray Singh | electrical, plumbing | 3 | off_duty |

### 4.3 demo_tickets_v2.json — 12 Tickets

| # | Customer | Channel | Request Type | Urgency | Status |
|:-:|----------|:-------:|:------------:|:-------:|:------:|
| 1 | Alice Johnson | phone | new_booking | normal | new |
| 2 | Bob Smith | email | complaint | high | open |
| 3 | Carol Williams | web | general_inquiry | low | new |
| 4 | David Brown | email | billing | high | open |
| 5 | Eva Martinez | chat | reschedule | normal | in_progress |
| 6 | Frank Davis | phone | cancellation | low | closed |
| 7 | Grace Lee | email | new_booking | urgent | open |
| 8 | Henry Wilson | web | general_inquiry | normal | new |
| 9 | Irene Taylor | chat | complaint | high | in_progress |
| 10 | Jack Anderson | email | billing | normal | open |
| 11 | Alice Johnson | web | new_booking | low | new |
| 12 | Bob Smith | sms | reschedule | normal | closed |

**Status distribution**: 4 new, 4 open, 2 in_progress, 2 closed

### 4.4 demo_appointments_v2.json — 8 Appointments

| # | Customer | Technician | Service Type | Date | Status |
|:-:|----------|:----------:|:------------:|:----:|:------:|
| 1 | Alice Johnson | Mike Johnson | general_repair | 2026-07-01 | scheduled |
| 2 | Carol Williams | Sarah Connor | plumbing | 2026-07-02 | scheduled |
| 3 | David Brown | Tom Baker | electrical | 2026-07-01 | in_progress |
| 4 | Eva Martinez | Lisa Cooper | maintenance | 2026-07-03 | scheduled |
| 5 | Grace Lee | Mike Johnson | installation | 2026-07-01 | completed |
| 6 | Henry Wilson | Ray Singh | inspection | 2026-07-04 | scheduled |
| 7 | Irene Taylor | Sarah Connor | general_repair | 2026-06-30 | completed |
| 8 | Jack Anderson | Tom Baker | electrical | 2026-07-05 | scheduled |

**Status distribution**: 5 scheduled, 1 in_progress, 2 completed

---

## 5. Seed Loading Procedure

### 5.1 Load Order

Seeds must be loaded in the following strict order:

```
Step 1: reference_data_v2.json          # Reference data - no FK dependencies
Step 2: user_roles_v2.json              # Roles - no FK dependencies
Step 3: system_settings_v2.json         # Settings - no FK dependencies
Step 4: role_permissions_v2.json        # Permissions - FK to user_roles_v2
Step 5: feature_flags_v2.json           # Feature flags - no FK dependencies
Step 6: demo_customers_v2.json          # Customers - no FK dependencies on seed data
Step 7: demo_technicians_v2.json        # Technicians - no FK dependencies on seed data
Step 8: demo_tickets_v2.json            # Tickets - FK to customers (demo_customers_v2)
Step 9: demo_appointments_v2.json       # Appointments - FK to customers + technicians
```

### 5.2 Loading Commands

Each seed file is loaded using the Lemma CLI `table insert` command:

```bash
# Load reference data
lemma table insert reference_data_v2 --file database/lookup_data/reference_data_v2.json

# Load roles
lemma table insert user_roles_v2 --file database/lookup_data/user_roles_v2.json

# Load settings
lemma table insert system_settings_v2 --file database/lookup_data/system_settings_v2.json

# Load permissions (must be after roles)
lemma table insert role_permissions_v2 --file database/lookup_data/role_permissions_v2.json

# Load feature flags
lemma table insert feature_flags_v2 --file database/lookup_data/feature_flags_v2.json

# Load demo customers
lemma table insert customers_v2 --file database/seeds_v2/demo_customers_v2.json

# Load demo technicians
lemma table insert technicians_v2 --file database/seeds_v2/demo_technicians_v2.json

# Load demo tickets (must be after customers)
lemma table insert tickets_v2 --file database/seeds_v2/demo_tickets_v2.json

# Load demo appointments (must be after customers + technicians)
lemma table insert appointments_v2 --file database/seeds_v2/demo_appointments_v2.json
```

### 5.3 Post-Seed Verification

After all seed data is loaded, run these verification queries:

```sql
-- 1. Verify reference data counts by type
SELECT type, COUNT(*) AS count FROM reference_data_v2 GROUP BY type ORDER BY type;

-- 2. Verify role count
SELECT COUNT(*) AS role_count FROM user_roles_v2;

-- 3. Verify permission count
SELECT COUNT(*) AS permission_count FROM role_permissions_v2;

-- 4. Verify settings count
SELECT COUNT(*) AS settings_count FROM system_settings_v2;

-- 5. Verify feature flags count
SELECT COUNT(*) AS flag_count FROM feature_flags_v2;

-- 6. Verify demo customer count
SELECT COUNT(*) AS customer_count FROM customers_v2 WHERE deleted_at IS NULL;

-- 7. Verify demo technician count
SELECT COUNT(*) AS technician_count FROM technicians_v2 WHERE deleted_at IS NULL;

-- 8. Verify demo ticket count
SELECT COUNT(*) AS ticket_count FROM tickets_v2 WHERE deleted_at IS NULL;

-- 9. Verify demo appointment count
SELECT COUNT(*) AS appointment_count FROM appointments_v2 WHERE deleted_at IS NULL;

-- 10. Verify FK integrity (no orphaned references)
SELECT 'tickets with missing customer' AS check_name, COUNT(*) AS issues
FROM tickets_v2 t WHERE t.customer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM customers_v2 c WHERE c.id = t.customer_id);
```

**Expected post-seed state**:

| Check | Expected |
|-------|:--------:|
| Reference data types | 11 distinct types |
| Total reference rows | 60 |
| Roles | 8 |
| Permissions | ~80 |
| Settings | 29 |
| Feature flags | 12 |
| Customers | 10 |
| Technicians | 5 |
| Tickets | 12 |
| Appointments | 8 |
| FK violations | 0 |

---

## 6. Data Dependencies

### 6.1 Seed File Dependency Graph

```
reference_data_v2.json  (no dependencies)
  |
  +---> demo_customers_v2.json  (no dependencies)
  |       |
  |       +---> demo_tickets_v2.json  (FK customer_id -> customers_v2)
  |       |
  |       +---> demo_appointments_v2.json  (FK customer_id -> customers_v2)
  |
  +---> demo_technicians_v2.json  (no dependencies)
          |
          +---> demo_appointments_v2.json  (FK technician_id -> technicians_v2)

user_roles_v2.json  (no dependencies)
  |
  +---> role_permissions_v2.json  (FK role_id -> user_roles_v2)

system_settings_v2.json  (no dependencies)
feature_flags_v2.json  (no dependencies)
```

### 6.2 FK Column Mapping

| Seed File | FK Column | References | Must Load After |
|-----------|-----------|------------|:---------------:|
| role_permissions_v2.json | role_id | user_roles_v2.id | user_roles_v2.json |
| demo_tickets_v2.json | customer_id | customers_v2.id | demo_customers_v2.json |
| demo_appointments_v2.json | customer_id | customers_v2.id | demo_customers_v2.json |
| demo_appointments_v2.json | technician_id | technicians_v2.id | demo_technicians_v2.json |

---

## 7. Idempotency

### 7.1 Idempotent Loading Principle

All seed operations **must be safe to re-run** multiple times. Re-running seed data should never:

- Create duplicate records
- Violate unique constraints
- Overwrite manually entered production data
- Produce error messages (beyond informational notices)

### 7.2 Idempotency Patterns

Each seed file uses one of these patterns:

**Pattern A: INSERT IGNORE (preferred)**

```sql
INSERT INTO reference_data_v2 (id, type, code, label, description, sort_order, is_active)
SELECT * FROM jsonb_to_recordset(?)
ON CONFLICT (type, code) DO NOTHING;
```

**Pattern B: UPSERT (for mutable reference data)**

```sql
INSERT INTO system_settings_v2 (key, value, type, description)
VALUES (?, ?, ?, ?)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();
```

### 7.3 Conflict Targets

| Table | Unique Constraint | Conflict Action |
|-------|------------------|:---------------:|
| reference_data_v2 | (type, code) | DO NOTHING |
| user_roles_v2 | (name) | DO NOTHING |
| role_permissions_v2 | (role_id, resource, action) | DO NOTHING |
| system_settings_v2 | (key) | DO UPDATE |
| feature_flags_v2 | (feature_group, flag_name) | DO NOTHING |
| customers_v2 | (id) | DO NOTHING |
| technicians_v2 | (id) | DO NOTHING |
| tickets_v2 | (id) | DO NOTHING |
| appointments_v2 | (id) | DO NOTHING |

### 7.4 Safe to Re-Run Verification

Running any seed file twice should produce:

```
NOTICE: 1 row inserted
NOTICE: 59 rows already exist, skipped
Total: 60 rows in reference_data_v2
```

---

## 8. Customizing Seed Data

### 8.1 Adding New Reference Values

To add a new reference value to an existing type:

```bash
lemma table insert reference_data_v2 '{
    "id": "gen_random_uuid()",
    "type": "service_type",
    "code": "emergency_repair",
    "label": "Emergency Repair",
    "description": "Urgent after-hours repair service",
    "sort_order": 6,
    "is_active": true
}'
```

### 8.2 Adding New Types

To add a new reference type (new category of lookup data):

1. Add entries to `reference_data_v2.json` with the new `type` value
2. Update the `docs/v2/database/SEED_DATA.md` reference data table
3. Update any application code that uses the new type

### 8.3 Adding Demo Records

When adding new demo records:

1. Generate a deterministic UUID in the reserved range (`00000000-0000-0000-0000-00000000xxxx`)
2. Ensure FK references point to existing demo record IDs
3. Maintain the realism of the data scenario
4. Add the record to the appropriate JSON file in `seeds_v2/` or `lookup_data/`
5. Add verification count check to post-seed verification

### 8.4 Reserved ID Ranges

| Range | Purpose |
|:-----:|---------|
| ...000001 - ...000060 | reference_data_v2 rows |
| ...000101 - ...000108 | user_roles_v2 rows |
| ...000201 - ...000299 | role_permissions_v2 rows (auto) |
| ...000301 - ...000329 | system_settings_v2 rows |
| ...000701 - ...000712 | feature_flags_v2 rows |
| ...001001 - ...001010 | demo_customers_v2 rows |
| ...002001 - ...002005 | demo_technicians_v2 rows |
| ...003001 - ...003012 | demo_tickets_v2 rows |
| ...004001 - ...004008 | demo_appointments_v2 rows |

---

## 9. Clearing Seed Data

### 9.1 Removing Seed Data for Fresh Import

To clear all seed data and re-import:

```bash
# Remove demo data (dependent tables first, then parent tables)
lemma table delete appointments_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"
lemma table delete tickets_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"
lemma table delete customers_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"
lemma table delete technicians_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"

# Remove reference data
lemma table delete feature_flags_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"
lemma table delete role_permissions_v2 --filter "role_id LIKE '00000000-0000-0000-0000-0000%'"
lemma table delete system_settings_v2 --filter "key LIKE 'app.%' OR key LIKE 'notifications.%' OR ..."

# Remove roles (must be last due to FK)
lemma table delete user_roles_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"
lemma table delete reference_data_v2 --filter "id LIKE '00000000-0000-0000-0000-0000%'"
```

### 9.2 Delete Order (Reverse of Insert)

```
DELETE order:
  1. demo_appointments_v2      (children of customers + technicians)
  2. demo_tickets_v2           (children of customers)
  3. demo_customers_v2         (parents of tickets + appointments)
  4. demo_technicians_v2       (parents of appointments)
  5. role_permissions_v2       (children of user_roles_v2)
  6. feature_flags_v2          (no dependencies)
  7. system_settings_v2        (no dependencies)
  8. user_roles_v2             (parents of role_permissions_v2)
  9. reference_data_v2         (no dependencies, no references from seed data)
```

### 9.3 Complete Purge

For a full environment reset (migrations + seeds):

```bash
# Step 1: Rollback all migrations (reverse order)
for i in 41..001; do
    lemma migration run rollbacks_v2/${i}_rollback_*.sql
done

# Step 2: Re-apply all migrations forward
for i in 001..041; do
    lemma migration run migrations_v2/${i}_create_*.sql
done

# Step 3: Re-load all seed data in order
# (see Section 5.2)
```

---

> **End of SEED_DATA.md**
