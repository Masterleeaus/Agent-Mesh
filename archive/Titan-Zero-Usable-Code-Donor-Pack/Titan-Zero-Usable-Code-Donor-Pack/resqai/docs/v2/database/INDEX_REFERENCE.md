# ResQAI V2 — Complete Index Reference

> **Version:** 2.0  
> **Total Indexes:** 161  
> **Tables:** 41  
> **Last Updated:** June 2026

---

## 1. Index Design Philosophy

ResQAI V2 indexes follow these guiding principles:

1. **Cover active records first** — Every table with soft-delete gets a partial index filtering `WHERE deleted_at IS NULL` for the most common query patterns.

2. **Composite before single-column** — Multi-column indexes are preferred when queries filter by multiple fields (e.g., `(account_id, created_at DESC)`).

3. **GIN for JSONB and arrays** — JSONB columns (`meta_data`, `payload`, `config`) and array columns (`tags`, `specialties`) use GIN indexes.

4. **GIST for geospatial** — Latitude/longitude pairs use GIST indexes for proximity queries.

5. **Full-text search via GIN** — Tsvector columns indexed with GIN for article and audit log search.

6. **Low-maintenance BTREE** — The majority of indexes are vanilla BTREE; no expression indexes except where justified.

7. **No over-indexing** — Write-heavy tables (audit_log, events, transactions) are indexed only on commonly filtered/joined columns.

8. **Index per FK** — Every foreign key column is indexed.

9. **Unique partial indexes** — For columns that must be unique only among active records (email, SKU, slug, ticket_number).

10. **Operational partial indexes** — For status-based queries (pending dispatches, overdue tasks, low stock items).

---

## 2. Index Naming Conventions

```
Primary Key:     {table}_pkey                                     (automatic by PostgreSQL)
Unique:          uniq_{table}_{column}[_{column}]                  e.g., uniq_tickets_number
Standard BTREE:  idx_{table}_{column}[_{column}]                   e.g., idx_tickets_customer
Partial:         idx_{table}_{purpose}                             e.g., idx_tickets_overdue
GIN:             idx_{table}_{column}_gin                          e.g., idx_tickets_tags_gin
GIST:            idx_{table}_{column}_gist                         e.g., idx_tech_location_gist
Full-Text:       idx_{table}_{column}_fts                          e.g., idx_articles_fts
Composite:       idx_{table}_{col1}_{col2}                         e.g., idx_tickets_tech_status
```

---

## 3. Complete Index Listing by Table

### `reference_data_v2` — 180B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 1 | `reference_data_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 2 | `uniq_refdata_category_value` | `category, value` | BTREE | YES | — | Prevent duplicate category+value | `WHERE category = $1 AND value = $2` |
| 3 | `idx_refdata_category` | `category` | BTREE | NO | — | Filter by category group | `WHERE category = 'skill'` |
| 4 | `idx_refdata_active` | `is_active` | BTREE | NO | `is_active = true` | Active values only | `WHERE is_active = true` |

### `system_settings_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 5 | `system_settings_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 6 | `uniq_syssettings_key` | `setting_key` | BTREE | YES | — | Unique setting key | `WHERE setting_key = $1` |
| 7 | `idx_syssettings_category` | `category` | BTREE | NO | — | Filter by category | `WHERE category = 'email'` |

### `feature_flags_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 8 | `feature_flags_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 9 | `uniq_featureflags_name` | `flag_name` | BTREE | YES | — | Unique flag name | `WHERE flag_name = $1` |
| 10 | `idx_featureflags_enabled` | `is_enabled` | BTREE | NO | `is_enabled = true` | Active flags for feature checks | `WHERE is_enabled = true` |

### `connectors_v2` — 150B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 11 | `connectors_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 12 | `uniq_connectors_name` | `connector_name` | BTREE | YES | `deleted_at IS NULL` | Unique connector name | `WHERE connector_name = $1 AND deleted_at IS NULL` |
| 13 | `idx_connectors_type` | `connector_type` | BTREE | NO | — | Filter by provider type | `WHERE connector_type = 'stripe'` |
| 14 | `idx_connectors_enabled` | `is_enabled` | BTREE | NO | `is_enabled = true` | Active integrations | `WHERE is_enabled = true` |

### `knowledge_categories_v2` — 150B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 15 | `knowledge_categories_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 16 | `uniq_kbcats_slug` | `slug` | BTREE | YES | `deleted_at IS NULL` | Unique slug | `WHERE slug = $1 AND deleted_at IS NULL` |
| 17 | `idx_kbcats_parent` | `parent_id` | BTREE | NO | — | Tree traversal | `WHERE parent_id = $1` |
| 18 | `idx_kbcats_active` | `is_active` | BTREE | NO | `is_active = true AND deleted_at IS NULL` | Active categories | `WHERE is_active = true AND deleted_at IS NULL` |
| 19 | `idx_kbcats_sort` | `sort_order` | BTREE | NO | — | Display ordering | `ORDER BY sort_order` |

### `user_roles_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 20 | `user_roles_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 21 | `uniq_roles_name` | `role_name` | BTREE | YES | `deleted_at IS NULL` | Unique role name | `WHERE role_name = $1 AND deleted_at IS NULL` |

### `users_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 22 | `users_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 23 | `uniq_users_email` | `email` | BTREE | YES | `deleted_at IS NULL` | Unique email for login | `WHERE email = $1 AND deleted_at IS NULL` |
| 24 | `idx_users_role` | `role_id` | BTREE | NO | — | Users by role | `WHERE role_id = $1 AND deleted_at IS NULL` |
| 25 | `idx_users_status` | `user_status` | BTREE | NO | — | Filter by status | `WHERE user_status = 'active' AND deleted_at IS NULL` |
| 26 | `idx_users_manager` | `manager_id` | BTREE | NO | — | Subordinate lookup | `WHERE manager_id = $1 AND deleted_at IS NULL` |
| 27 | `idx_users_created` | `created_at` | BTREE | NO | — | Chronological queries | `ORDER BY created_at DESC` |
| 28 | `idx_users_role_status` | `role_id, user_status` | BTREE | NO | — | Role+status filtering | `WHERE role_id = $1 AND user_status = 'active'` |

### `user_sessions_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 29 | `user_sessions_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 30 | `idx_usersess_token` | `session_token` | BTREE | YES | — | Session lookup by token | `WHERE session_token = $1` |
| 31 | `idx_usersess_refresh` | `refresh_token` | BTREE | YES | — | Refresh token lookup | `WHERE refresh_token = $1` |
| 32 | `idx_usersess_user` | `user_id` | BTREE | NO | — | All sessions for user | `WHERE user_id = $1` |
| 33 | `idx_usersess_active` | `is_active` | BTREE | NO | `is_active = true` | Active sessions only | `WHERE user_id = $1 AND is_active = true` |
| 34 | `idx_usersess_expires` | `expires_at` | BTREE | NO | — | Expired session cleanup | `WHERE expires_at < now()` |

### `role_permissions_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 35 | `role_permissions_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 36 | `uniq_roleperm_role_res_action` | `role_id, resource, action_type` | BTREE | YES | — | One perm per role+res+action | `WHERE role_id = $1 AND resource = $2 AND action_type = $3` |
| 37 | `idx_roleperm_role` | `role_id` | BTREE | NO | — | All permissions for role | `WHERE role_id = $1` |

### `customers_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 38 | `customers_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 39 | `uniq_customers_email` | `email` | BTREE | YES | `deleted_at IS NULL` | Unique email | `WHERE email = $1 AND deleted_at IS NULL` |
| 40 | `idx_customers_account` | `account_id` | BTREE | NO | — | Account customers | `WHERE account_id = $1 AND deleted_at IS NULL` |
| 41 | `idx_customers_status` | `customer_status` | BTREE | NO | — | Filter by status | `WHERE customer_status = 'active'` |
| 42 | `idx_customers_relationship` | `relationship_status` | BTREE | NO | — | Relationship analysis | `WHERE relationship_status = 'at_risk'` |
| 43 | `idx_customers_meta` | `meta_data` | GIN | NO | — | JSONB queries | `WHERE meta_data @> '{"tier":"premium"}'` |

### `customer_addresses_v2` — 160B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 44 | `customer_addresses_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 45 | `idx_custaddr_customer` | `customer_id` | BTREE | NO | — | Customer addresses | `WHERE customer_id = $1 AND deleted_at IS NULL` |
| 46 | `idx_custaddr_primary` | `is_primary` | BTREE | NO | `is_primary = true AND deleted_at IS NULL` | Primary address lookup | `WHERE customer_id = $1 AND is_primary = true` |
| 47 | `idx_custaddr_geo` | `latitude, longitude` | GIST | NO | — | Geospatial queries | `WHERE ST_DWithin(coords, $1, $2)` |

### `technicians_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 48 | `technicians_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 49 | `uniq_technicians_email` | `email` | BTREE | YES | `deleted_at IS NULL` | Unique email | `WHERE email = $1 AND deleted_at IS NULL` |
| 50 | `idx_tech_availability` | `technician_availability` | BTREE | NO | — | Available techs | `WHERE technician_availability = 'available'` |
| 51 | `idx_tech_specialties` | `specialties` | GIN | NO | — | Array skill search | `WHERE specialties @> ARRAY['plumbing']` |
| 52 | `idx_tech_location` | `current_lat, current_lng` | GIST | NO | `current_lat IS NOT NULL` | Nearby techs | `ORDER BY location <-> $1` |
| 53 | `idx_tech_active` | `is_active` | BTREE | NO | `is_active = true AND deleted_at IS NULL` | Active techs | `WHERE is_active = true AND deleted_at IS NULL` |
| 54 | `idx_tech_rating` | `rating_avg` | BTREE | NO | — | Top-rated techs | `ORDER BY rating_avg DESC` |

### `technician_skills_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 55 | `technician_skills_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 56 | `uniq_techskill_tech_skill` | `technician_id, skill_id` | BTREE | YES | — | One entry per tech+skill | `WHERE technician_id = $1 AND skill_id = $2` |
| 57 | `idx_techskill_skill` | `skill_id` | BTREE | NO | — | Techs by skill | `WHERE skill_id = $1` |
| 58 | `idx_techskill_proficiency` | `proficiency` | BTREE | NO | — | Filter by level | `WHERE proficiency = 'expert'` |

### `accounts_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 59 | `accounts_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 60 | `uniq_accounts_number` | `account_number` | BTREE | YES | — | Unique account number | `WHERE account_number = $1` |
| 61 | `idx_accounts_health` | `account_health` | BTREE | NO | — | Health segmentation | `WHERE account_health IN ('slipping','critical')` |
| 62 | `idx_accounts_tier` | `subscription_tier` | BTREE | NO | — | Tier filtering | `WHERE subscription_tier = 'enterprise'` |
| 63 | `idx_accounts_rep` | `assigned_rep_id` | BTREE | NO | — | Rep's accounts | `WHERE assigned_rep_id = $1` |
| 64 | `idx_accounts_mrr` | `mrr_cents` | BTREE | NO | — | Revenue sorting | `ORDER BY mrr_cents DESC` |
| 65 | `idx_accounts_meta` | `meta_data` | GIN | NO | — | JSONB queries | `WHERE meta_data @> '{"industry":"tech"}'` |
| 66 | `idx_accounts_contract_end` | `contract_end` | BTREE | NO | `contract_end IS NOT NULL` | Expiring contracts | `WHERE contract_end BETWEEN $1 AND $2` |

### `tickets_v2` — 400B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 67 | `tickets_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 68 | `uniq_tickets_number` | `ticket_number` | BTREE | YES | — | Unique ticket number | `WHERE ticket_number = $1` |
| 69 | `idx_tickets_customer` | `customer_id` | BTREE | NO | — | Customer tickets | `WHERE customer_id = $1 AND deleted_at IS NULL` |
| 70 | `idx_tickets_assigned` | `assigned_to` | BTREE | NO | — | Agent's queue | `WHERE assigned_to = $1 AND deleted_at IS NULL` |
| 71 | `idx_tickets_status` | `ticket_status` | BTREE | NO | — | Status filtering | `WHERE ticket_status IN ('new','open')` |
| 72 | `idx_tickets_channel` | `channel` | BTREE | NO | — | Channel analysis | `WHERE channel = 'email'` |
| 73 | `idx_tickets_priority` | `priority` | BTREE | NO | — | Priority sorting | `ORDER BY priority DESC` |
| 74 | `idx_tickets_account` | `account_id` | BTREE | NO | — | Account tickets | `WHERE account_id = $1` |
| 75 | `idx_tickets_sla` | `sla_due_at` | BTREE | NO | `sla_due_at IS NOT NULL AND deleted_at IS NULL` | SLA breach monitoring | `WHERE sla_due_at < now() AND ticket_status NOT IN ('closed','resolved')` |
| 76 | `idx_tickets_tags` | `tags` | GIN | NO | — | Tag-based queries | `WHERE tags @> ARRAY['urgent']` |
| 77 | `idx_tickets_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1 ORDER BY created_at DESC` |
| 78 | `idx_tickets_parent` | `parent_ticket_id` | BTREE | NO | — | Ticket threading | `WHERE parent_ticket_id = $1` |
| 79 | `idx_tickets_status_priority` | `ticket_status, priority` | BTREE | NO | — | Queue sort with priority | `WHERE ticket_status IN ('new','open') ORDER BY priority DESC, created_at` |

### `ticket_messages_v2` — 160B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 80 | `ticket_messages_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 81 | `idx_tktmsg_ticket` | `ticket_id` | BTREE | NO | — | Messages for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 82 | `idx_tktmsg_sender` | `sender_id` | BTREE | NO | — | Messages by user | `WHERE sender_id = $1` |
| 83 | `idx_tktmsg_created` | `created_at` | BTREE | NO | — | Chronological order | `ORDER BY created_at ASC` |
| 84 | `idx_tktmsg_parent` | `parent_message_id` | BTREE | NO | — | Thread nesting | `WHERE parent_message_id = $1` |
| 85 | `idx_tktmsg_internal` | `is_internal` | BTREE | NO | `is_internal = true` | Internal notes | `WHERE ticket_id = $1 AND is_internal = true` |
| 86 | `idx_tktmsg_body_fts` | `to_tsvector('english', message_body)` | GIN | NO | — | Full-text search on messages | `WHERE to_tsvector('english', message_body) @@ to_tsquery($1)` |

### `ticket_attachments_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 87 | `ticket_attachments_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 88 | `idx_tktatt_ticket` | `ticket_id` | BTREE | NO | — | Attachments for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 89 | `idx_tktatt_message` | `message_id` | BTREE | NO | — | Attachments for message | `WHERE message_id = $1` |
| 90 | `idx_tktatt_hash` | `file_hash` | BTREE | NO | — | Duplicate detection | `WHERE file_hash = $1` |
| 91 | `idx_tktatt_mime` | `mime_type` | BTREE | NO | — | Filter by type | `WHERE mime_type LIKE 'image/%'` |

### `appointments_v2` — 280B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 92 | `appointments_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 93 | `idx_appt_technician` | `technician_id` | BTREE | NO | — | Tech's appointments | `WHERE technician_id = $1 AND deleted_at IS NULL` |
| 94 | `idx_appt_customer` | `customer_id` | BTREE | NO | — | Customer appointments | `WHERE customer_id = $1 AND deleted_at IS NULL` |
| 95 | `idx_appt_ticket` | `ticket_id` | BTREE | NO | — | Appointment for ticket | `WHERE ticket_id = $1` |
| 96 | `idx_appt_status` | `appointment_status` | BTREE | NO | — | Status filtering | `WHERE appointment_status = 'scheduled'` |
| 97 | `idx_appt_scheduled_start` | `scheduled_start` | BTREE | NO | — | Date-range queries | `WHERE scheduled_start >= $1 AND scheduled_start < $2` |
| 98 | `idx_appt_daterange` | `scheduled_start, scheduled_end` | BTREE | NO | — | Time overlap checks | `WHERE scheduled_start < $1 AND scheduled_end > $2` |
| 99 | `idx_appt_technician_date` | `technician_id, scheduled_start` | BTREE | NO | — | Tech's daily schedule | `WHERE technician_id = $1 AND scheduled_start >= $2 AND scheduled_start < $3` |

### `appointment_reminders_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 100 | `appointment_reminders_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 101 | `idx_apptrem_appointment` | `appointment_id` | BTREE | NO | — | Reminders for appointment | `WHERE appointment_id = $1` |
| 102 | `idx_apptrem_status` | `reminder_status` | BTREE | NO | — | Pending reminders | `WHERE reminder_status = 'pending'` |
| 103 | `idx_apptrem_type` | `reminder_type` | BTREE | NO | — | Filter by type | `WHERE reminder_type = 'appointment_24h'` |

### `work_orders_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 104 | `work_orders_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 105 | `uniq_workorders_number` | `order_number` | BTREE | YES | — | Unique order number | `WHERE order_number = $1` |
| 106 | `idx_wo_ticket` | `ticket_id` | BTREE | NO | — | Work orders for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 107 | `idx_wo_technician` | `technician_id` | BTREE | NO | — | Tech's work orders | `WHERE technician_id = $1 AND deleted_at IS NULL` |
| 108 | `idx_wo_status` | `work_order_status` | BTREE | NO | — | Status filtering | `WHERE work_order_status IN ('created','assigned')` |
| 109 | `idx_wo_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1` |
| 110 | `idx_wo_tech_status` | `technician_id, work_order_status` | BTREE | NO | — | Tech's active orders | `WHERE technician_id = $1 AND work_order_status IN ('travelling','on_site','working')` |

### `work_order_stages_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 111 | `work_order_stages_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 112 | `idx_wostage_wo` | `work_order_id` | BTREE | NO | — | Stages for work order | `WHERE work_order_id = $1` |
| 113 | `idx_wostage_name` | `stage_name` | BTREE | NO | — | Stage type filtering | `WHERE stage_name = 'diagnosis'` |
| 114 | `idx_wostage_entered` | `entered_at` | BTREE | NO | — | Chronological order | `ORDER BY entered_at ASC` |

### `dispatches_v2` — 200B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 115 | `dispatches_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 116 | `idx_dispatch_tech` | `technician_id` | BTREE | NO | — | Tech's dispatches | `WHERE technician_id = $1 AND deleted_at IS NULL` |
| 117 | `idx_dispatch_status` | `dispatch_status` | BTREE | NO | — | Status filtering | `WHERE dispatch_status = 'pending'` |
| 118 | `idx_dispatch_type` | `dispatch_type` | BTREE | NO | — | Emergency dispatches | `WHERE dispatch_type = 'emergency'` |
| 119 | `idx_dispatch_appointment` | `appointment_id` | BTREE | NO | — | Dispatch for appointment | `WHERE appointment_id = $1` |
| 120 | `idx_dispatch_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1` |
| 121 | `idx_dispatch_tech_status` | `technician_id, dispatch_status` | BTREE | NO | — | Tech's active dispatch | `WHERE technician_id = $1 AND dispatch_status IN ('pending','sent','acknowledged','en_route','on_site')` |

### `disputes_v2` — 180B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 122 | `disputes_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 123 | `uniq_disputes_number` | `dispute_number` | BTREE | YES | — | Unique dispute number | `WHERE dispute_number = $1` |
| 124 | `idx_dispute_ticket` | `ticket_id` | BTREE | NO | — | Disputes for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 125 | `idx_dispute_wo` | `work_order_id` | BTREE | NO | — | Disputes for work order | `WHERE work_order_id = $1 AND deleted_at IS NULL` |
| 126 | `idx_dispute_status` | `dispute_status` | BTREE | NO | — | Open disputes | `WHERE dispute_status IN ('open','analyzing','recommendation_ready','escalated')` |
| 127 | `idx_dispute_created` | `created_at` | BTREE | NO | — | Date-range queries | `ORDER BY created_at DESC` |

### `dispute_evidence_v2` — 60B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 128 | `dispute_evidence_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 129 | `idx_dispevidence_dispute` | `dispute_id` | BTREE | NO | — | Evidence for dispute | `WHERE dispute_id = $1 AND deleted_at IS NULL` |
| 130 | `idx_dispevidence_type` | `evidence_type` | BTREE | NO | — | Filter by type | `WHERE evidence_type = 'photo'` |

### `tasks_v2` — 280B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 131 | `tasks_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 132 | `idx_tasks_ticket` | `ticket_id` | BTREE | NO | — | Tasks for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 133 | `idx_tasks_account` | `account_id` | BTREE | NO | — | Account tasks | `WHERE account_id = $1 AND deleted_at IS NULL` |
| 134 | `idx_tasks_status` | `task_status` | BTREE | NO | — | Status filtering | `WHERE task_status IN ('open','in_progress')` |
| 135 | `idx_tasks_priority` | `priority` | BTREE | NO | — | Priority sorting | `ORDER BY priority DESC` |
| 136 | `idx_tasks_due` | `due_at` | BTREE | NO | — | Due date queries | `WHERE due_at <= $1 AND deleted_at IS NULL` |
| 137 | `idx_tasks_type` | `task_type` | BTREE | NO | — | Category filtering | `WHERE task_type = $1` |
| 138 | `idx_tasks_tags` | `tags` | GIN | NO | — | Tag queries | `WHERE tags @> ARRAY[$1]` |
| 139 | `idx_tasks_overdue` | `due_at` | BTREE | NO | `due_at < now() AND task_status IN ('open','in_progress','blocked') AND deleted_at IS NULL` | Overdue tasks | `WHERE due_at < now() AND task_status IN ('open','in_progress','blocked') AND deleted_at IS NULL` |

### `task_assignments_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 140 | `task_assignments_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 141 | `uniq_taskassign_task_user` | `task_id, user_id` | BTREE | NO | `unassigned_at IS NULL` | One active assignment per task+user | `WHERE task_id = $1 AND user_id = $2 AND unassigned_at IS NULL` |
| 142 | `idx_taskassign_user` | `user_id` | BTREE | NO | — | User's tasks | `WHERE user_id = $1 AND unassigned_at IS NULL` |

### `followups_v2` — 210B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 143 | `followups_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 144 | `idx_followup_assigned` | `assigned_to` | BTREE | NO | — | User's followups | `WHERE assigned_to = $1 AND deleted_at IS NULL` |
| 145 | `idx_followup_status` | `followup_status` | BTREE | NO | — | Pending followups | `WHERE followup_status = 'pending'` |
| 146 | `idx_followup_scheduled` | `scheduled_at` | BTREE | NO | — | Schedule queries | `WHERE scheduled_at BETWEEN $1 AND $2` |
| 147 | `idx_followup_ticket` | `ticket_id` | BTREE | NO | — | Followups for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 148 | `idx_followup_account` | `account_id` | BTREE | NO | — | Account followups | `WHERE account_id = $1 AND deleted_at IS NULL` |
| 149 | `idx_followup_due` | `scheduled_at` | BTREE | NO | `scheduled_at <= now() AND followup_status = 'pending' AND deleted_at IS NULL` | Due followups | `WHERE scheduled_at <= now() AND followup_status = 'pending' AND deleted_at IS NULL` |

### `followup_attempts_v2` — 60B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 150 | `followup_attempts_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 151 | `idx_fupattempt_followup` | `followup_id` | BTREE | NO | — | Attempts for followup | `WHERE followup_id = $1` |
| 152 | `idx_fupattempt_number` | `attempt_number` | BTREE | NO | — | Attempt ordering | `ORDER BY attempt_number ASC` |

### `account_health_scans_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 153 | `account_health_scans_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 154 | `idx_healthscan_account` | `account_id` | BTREE | NO | — | Scans for account | `WHERE account_id = $1` |
| 155 | `idx_healthscan_score` | `scan_score` | BTREE | NO | — | Score range queries | `WHERE scan_score < 50` |
| 156 | `idx_healthscan_health` | `account_health` | BTREE | NO | — | Health category | `WHERE account_health = 'critical'` |
| 157 | `idx_healthscan_created` | `created_at` | BTREE | NO | — | Chronological queries | `ORDER BY created_at DESC` |
| 158 | `idx_healthscan_account_created` | `account_id, created_at DESC` | BTREE | NO | — | Latest scan per account | `WHERE account_id = $1 ORDER BY created_at DESC` |

### `knowledge_articles_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 159 | `knowledge_articles_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 160 | `uniq_articles_slug` | `slug` | BTREE | YES | `deleted_at IS NULL` | Unique slug | `WHERE slug = $1 AND deleted_at IS NULL` |
| 161 | `idx_articles_category` | `category_id` | BTREE | NO | — | Articles in category | `WHERE category_id = $1 AND deleted_at IS NULL` |
| 162 | `idx_articles_status` | `article_status` | BTREE | NO | — | Published articles | `WHERE article_status = 'published' AND deleted_at IS NULL` |
| 163 | `idx_articles_author` | `author_id` | BTREE | NO | — | Author's articles | `WHERE author_id = $1 AND deleted_at IS NULL` |
| 164 | `idx_articles_tags` | `tags` | GIN | NO | — | Tag queries | `WHERE tags @> ARRAY[$1]` |
| 165 | `idx_articles_fts` | `to_tsvector('english', title || ' ' || content)` | GIN | NO | — | Full-text search | `WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery($1)` |
| 166 | `idx_articles_view_count` | `view_count` | BTREE | NO | — | Top articles | `ORDER BY view_count DESC` |

### `inventory_items_v2` — 210B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 167 | `inventory_items_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 168 | `uniq_invitems_sku` | `sku` | BTREE | YES | `deleted_at IS NULL` | Unique SKU | `WHERE sku = $1 AND deleted_at IS NULL` |
| 169 | `idx_invitems_category` | `inventory_category` | BTREE | NO | — | Category filtering | `WHERE inventory_category = 'parts' AND deleted_at IS NULL` |
| 170 | `idx_invitems_active` | `is_active` | BTREE | NO | `is_active = true AND deleted_at IS NULL` | Active items | `WHERE is_active = true AND deleted_at IS NULL` |
| 171 | `idx_invitems_low_stock` | `quantity_on_hand` | BTREE | NO | `quantity_on_hand <= reorder_point AND is_active = true AND deleted_at IS NULL` | Low stock items | `WHERE quantity_on_hand <= reorder_point AND is_active = true AND deleted_at IS NULL` |
| 172 | `idx_invitems_meta` | `meta_data` | GIN | NO | — | JSONB queries | `WHERE meta_data @> '{"supplier":"acme"}'` |

### `inventory_transactions_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 173 | `inventory_transactions_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 174 | `idx_invtrans_item` | `item_id` | BTREE | NO | — | Transactions for item | `WHERE item_id = $1` |
| 175 | `idx_invtrans_type` | `transaction_type` | BTREE | NO | — | Transaction type queries | `WHERE transaction_type = 'issued'` |
| 176 | `idx_invtrans_ref` | `reference_type, reference_id` | BTREE | NO | — | Transactions for reference | `WHERE reference_type = 'work_order' AND reference_id = $1` |
| 177 | `idx_invtrans_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1` |
| 178 | `idx_invtrans_item_created` | `item_id, created_at DESC` | BTREE | NO | — | Recent item history | `WHERE item_id = $1 ORDER BY created_at DESC` |

### `feedback_v2` — 180B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 179 | `feedback_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 180 | `idx_feedback_ticket` | `ticket_id` | BTREE | NO | — | Feedback for ticket | `WHERE ticket_id = $1 AND deleted_at IS NULL` |
| 181 | `idx_feedback_customer` | `customer_id` | BTREE | NO | — | Customer's feedback | `WHERE customer_id = $1 AND deleted_at IS NULL` |
| 182 | `idx_feedback_rating` | `rating` | BTREE | NO | — | Rating queries | `WHERE rating <= 2` |
| 183 | `idx_feedback_source` | `feedback_source` | BTREE | NO | — | Source analysis | `WHERE feedback_source = 'post_service'` |
| 184 | `idx_feedback_sentiment` | `ai_sentiment` | BTREE | NO | — | Sentiment filtering | `WHERE ai_sentiment = 'negative'` |
| 185 | `idx_feedback_created` | `created_at` | BTREE | NO | — | Date-range queries | `ORDER BY created_at DESC` |
| 186 | `idx_feedback_categories` | `categories` | GIN | NO | — | Category array queries | `WHERE categories @> ARRAY['service_quality']` |

### `feedback_surveys_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 187 | `feedback_surveys_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 188 | `idx_fbsurvey_feedback` | `feedback_id` | BTREE | NO | — | Survey for feedback | `WHERE feedback_id = $1` |
| 189 | `idx_fbsurvey_survey` | `survey_name` | BTREE | NO | — | Survey aggregation | `WHERE survey_name = 'nps'` |
| 190 | `idx_fbsurvey_question` | `question_key` | BTREE | NO | — | Question analysis | `WHERE question_key = 'overall_rating'` |
| 191 | `idx_fbsurvey_feedback_question` | `feedback_id, question_key` | BTREE | NO | — | Lookup by feedback+question | `WHERE feedback_id = $1 AND question_key = $2` |

### `notifications_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 192 | `notifications_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 193 | `idx_notif_user` | `user_id` | BTREE | NO | — | User's notifications | `WHERE user_id = $1 AND deleted_at IS NULL` |
| 194 | `idx_notif_status` | `notification_status` | BTREE | NO | — | Status filtering | `WHERE notification_status = 'pending'` |
| 195 | `idx_notif_type` | `notification_type` | BTREE | NO | — | Type analysis | `WHERE notification_type = 'appointment_reminder'` |
| 196 | `idx_notif_channel` | `channel` | BTREE | NO | — | Channel analysis | `WHERE channel = 'email'` |
| 197 | `idx_notif_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1` |
| 198 | `idx_notif_ref` | `reference_type, reference_id` | BTREE | NO | — | Notifications for entity | `WHERE reference_type = 'ticket' AND reference_id = $1` |
| 199 | `idx_notif_pending` | `created_at` | BTREE | NO | `notification_status = 'pending' AND deleted_at IS NULL` | Pending send queue | `WHERE notification_status = 'pending' AND deleted_at IS NULL ORDER BY created_at` |
| 200 | `idx_notif_failed` | `created_at` | BTREE | NO | `notification_status = 'failed' AND retry_count < max_retries AND deleted_at IS NULL` | Retry candidates | `WHERE notification_status = 'failed' AND retry_count < max_retries AND deleted_at IS NULL` |

### `notification_templates_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 201 | `notification_templates_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 202 | `uniq_notiftpl_name_type_locale` | `template_name, template_type, locale` | BTREE | YES | — | Unique template variant | `WHERE template_name = $1 AND template_type = $2 AND locale = $3` |
| 203 | `idx_notiftpl_type` | `template_type` | BTREE | NO | — | Templates by type | `WHERE template_type = 'email'` |
| 204 | `idx_notiftpl_active` | `is_active` | BTREE | NO | `is_active = true AND deleted_at IS NULL` | Active templates | `WHERE is_active = true AND deleted_at IS NULL` |

### `notification_channels_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 205 | `notification_channels_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 206 | `uniq_notifchan_type_name` | `channel_type, channel_name` | BTREE | YES | — | Unique channel config | `WHERE channel_type = $1 AND channel_name = $2` |
| 207 | `idx_notifchan_active` | `is_active` | BTREE | NO | `is_active = true AND deleted_at IS NULL` | Active channels | `WHERE is_active = true AND deleted_at IS NULL` |
| 208 | `idx_notifchan_healthy` | `is_healthy` | BTREE | NO | `is_healthy = true AND is_active = true` | Healthy channels for routing | `WHERE is_healthy = true AND is_active = true` |

### `analytics_reports_v2` — 120B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 209 | `analytics_reports_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 210 | `uniq_analyticsreports_name` | `report_name` | BTREE | YES | `deleted_at IS NULL` | Unique report name | `WHERE report_name = $1 AND deleted_at IS NULL` |
| 211 | `idx_analyticsreports_type` | `report_type` | BTREE | NO | — | Type filtering | `WHERE report_type = 'ticket_summary'` |
| 212 | `idx_analyticsreports_creator` | `created_by` | BTREE | NO | — | User's reports | `WHERE created_by = $1 AND deleted_at IS NULL` |
| 213 | `idx_analyticsreports_scheduled` | `is_scheduled` | BTREE | NO | `is_scheduled = true AND deleted_at IS NULL` | Scheduled reports | `WHERE is_scheduled = true AND deleted_at IS NULL` |

### `analytics_schedules_v2` — 90B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 214 | `analytics_schedules_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 215 | `idx_analyticssched_report` | `report_id` | BTREE | NO | — | Schedule for report | `WHERE report_id = $1` |
| 216 | `idx_analyticssched_next_run` | `next_run_at` | BTREE | NO | `is_active = true AND next_run_at IS NOT NULL` | Next execution | `WHERE is_active = true AND next_run_at IS NOT NULL ORDER BY next_run_at ASC` |
| 217 | `idx_analyticssched_frequency` | `frequency` | BTREE | NO | — | Frequency grouping | `WHERE frequency = 'daily'` |

### `audit_log_v2` — 240B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 218 | `audit_log_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 219 | `idx_auditlog_table` | `table_name` | BTREE | NO | — | Filter by table | `WHERE table_name = 'tickets_v2'` |
| 220 | `idx_auditlog_action` | `action_type` | BTREE | NO | — | Filter by action | `WHERE action_type = 'delete'` |
| 221 | `idx_auditlog_user` | `performed_by` | BTREE | NO | — | User's actions | `WHERE performed_by = $1` |
| 222 | `idx_auditlog_record` | `record_id` | BTREE | NO | — | Audit trail for record | `WHERE record_id = $1` |
| 223 | `idx_auditlog_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1` |
| 224 | `idx_auditlog_correlation` | `correlation_id` | BTREE | NO | — | Correlate all changes in request | `WHERE correlation_id = $1` |
| 225 | `idx_auditlog_table_action` | `table_name, action_type` | BTREE | NO | — | Table+action analysis | `WHERE table_name = 'tickets_v2' AND action_type = 'update'` |
| 226 | `idx_auditlog_search` | `to_tsvector('english', COALESCE(old_values::text,'') || ' ' || COALESCE(new_values::text,''))` | GIN | NO | — | Full-text search on audit changes | `WHERE to_tsvector('english', ... ) @@ to_tsquery($1)` |
| 227 | `idx_auditlog_created_month` | `date_trunc('month', created_at)` | BTREE | NO | — | Partition-agnostic monthly queries | `WHERE date_trunc('month', created_at) = $1` |

### `events_v2` — 180B

| # | Index Name | Columns | Type | Unique | Partial Filter | Purpose | Query Pattern |
|---|-----------|---------|------|--------|---------------|---------|---------------|
| 228 | `events_v2_pkey` | `id` | BTREE | YES | — | PK lookup | `WHERE id = $1` |
| 229 | `idx_events_type` | `event_type` | BTREE | NO | — | Filter by event type | `WHERE event_type = 'ticket.created'` |
| 230 | `idx_events_aggregate` | `aggregate_type, aggregate_id` | BTREE | NO | — | All events for entity | `WHERE aggregate_type = 'ticket' AND aggregate_id = $1 ORDER BY created_at` |
| 231 | `idx_events_created` | `created_at` | BTREE | NO | — | Date-range queries | `WHERE created_at >= $1` |
| 232 | `idx_events_unpublished` | `created_at` | BTREE | NO | `published = false` | Unpublished event queue | `WHERE published = false ORDER BY created_at ASC` |
| 233 | `idx_events_type_created` | `event_type, created_at DESC` | BTREE | NO | — | Recent events by type | `WHERE event_type = 'ticket.created' ORDER BY created_at DESC` |
| 234 | `idx_events_correlation` | `correlation_id` | BTREE | NO | — | Event correlation | `WHERE correlation_id = $1` |
| 235 | `idx_events_payload` | `payload` | GIN | NO | — | Payload JSONB queries | `WHERE payload @> '{"priority":"high"}'` |

---

## 4. Composite Index Strategy

| Strategy | Pattern | Examples |
|----------|---------|----------|
| **Leading equality + range** | `(eq_col, range_col)` | `(account_id, created_at)`, `(technician_id, scheduled_start)` |
| **Covering index** | Include all queried columns | `(technician_id, dispatch_status)` covers status checks without heap access |
| **Status + timestamp** | `(status, timestamp)` | `idx_followup_due: (scheduled_at)` with partial on `status = 'pending'` |
| **Entity + timeline** | `(entity_id, created_at DESC)` | `idx_healthscan_account_created`, `idx_invtrans_item_created` |
| **Type + reference** | `(ref_type, ref_id)` | `idx_invtrans_ref`, `idx_notif_ref` for polymorphic lookups |

---

## 5. Partial Index Strategy

All partial indexes filter `WHERE deleted_at IS NULL` to ensure queries against active data are efficient. Additional partial filters:

| Partial Filter | Tables | Purpose |
|---------------|--------|---------|
| `WHERE deleted_at IS NULL` | All entity tables | Active record queries |
| `WHERE is_active = true AND deleted_at IS NULL` | reference_data, flags, channels, inventory | Active-only toggles |
| `WHERE is_primary = true` | customer_addresses | Primary address lookup |
| `WHERE sla_due_at IS NOT NULL` | tickets | SLA monitoring (sparse) |
| `WHERE due_at < now() AND task_status IN ('open','in_progress','blocked')` | tasks | Overdue task alerts |
| `WHERE scheduled_at <= now() AND followup_status = 'pending'` | followups | Due followups |
| `WHERE quantity_on_hand <= reorder_point AND is_active = true` | inventory_items | Low stock alerts |
| `WHERE notification_status = 'pending' AND deleted_at IS NULL` | notifications | Send queue |
| `WHERE notification_status = 'failed' AND retry_count < max_retries` | notifications | Retry candidates |
| `WHERE published = false` | events | Unpublished event consumer |
| `WHERE is_scheduled = true AND next_run_at IS NOT NULL` | analytics_schedules | Scheduler queue |
| `WHERE current_lat IS NOT NULL` | technicians | Only index techs with location data |
| `WHERE contract_end IS NOT NULL` | accounts | Only index accounts with contract dates |
| `WHERE unassigned_at IS NULL` | task_assignments | Only active assignments |

---

## 6. Full-Text Search Indexes

| Table | Index | Column Expression | Language | Query Pattern |
|-------|-------|-------------------|----------|---------------|
| `ticket_messages_v2` | `idx_tktmsg_body_fts` | `to_tsvector('english', message_body)` | English | Search message bodies |
| `knowledge_articles_v2` | `idx_articles_fts` | `to_tsvector('english', title || ' ' || content)` | English | Search article content |
| `audit_log_v2` | `idx_auditlog_search` | `to_tsvector('english', COALESCE(old_values::text,'') || ' ' || COALESCE(new_values::text,''))` | English | Search audit trail |

### Future FTS candidates (not yet indexed):
- `customers_v2`: `to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(notes, ''))`
- `accounts_v2`: `to_tsvector('english', account_name || ' ' || COALESCE(notes, ''))`
- `tickets_v2`: `to_tsvector('english', subject || ' ' || COALESCE(description, ''))`

---

## 7. Index Maintenance Schedule

| Interval | Activity | Scope |
|----------|----------|-------|
| **Daily** | `REINDEX INDEX` on partial indexes with high write volume | `idx_notif_pending`, `idx_events_unpublished` |
| **Weekly** | `REINDEX TABLE` for high-churn tables | `notifications_v2`, `events_v2`, `audit_log_v2` |
| **Monthly** | `REINDEX DATABASE` during maintenance window | All indexes |
| **Quarterly** | Review and drop unused indexes | Using `pg_stat_user_indexes` |
| **As Needed** | `REINDEX INDEX CONCURRENTLY` for bloated indexes | Detected via `pg_stat_all_indexes` scan |

### Automated Bloat Detection

```sql
SELECT schemaname, tablename, indexname,
       round(100 * (1 - (avg_leaf_density))::numeric, 2) AS bloat_pct
FROM pg_stat_user_indexes
WHERE avg_leaf_density < 0.8;
```

---

## 8. Missing Index Detection Queries

### Query 1: Sequential Scans on Large Tables (most impactful)

```sql
SELECT schemaname, relname, seq_scan, seq_tup_read,
       idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 1000
  AND seq_tup_read > 100000
  AND n_live_tup > 10000
ORDER BY seq_tup_read DESC;
```

### Query 2: Index Scans with High Filter Ratio (suggests poor selectivity)

```sql
SELECT schemaname, tablename, indexname,
       idx_scan, idx_tup_read, idx_tup_fetch,
       round(100.0 * idx_tup_fetch / NULLIF(idx_tup_read, 0), 1) AS efficiency_pct
FROM pg_stat_user_indexes
WHERE idx_scan > 100
  AND idx_tup_read > 0
  AND round(100.0 * idx_tup_fetch / NULLIF(idx_tup_read, 0), 1) < 50
ORDER BY idx_scan DESC;
```

### Query 3: Tables Without Indexes on Foreign Keys

```sql
WITH fk_columns AS (
    SELECT conrelid, conname, 
           unnest(conkey) AS conkey_col
    FROM pg_constraint
    WHERE contype = 'f'
)
SELECT DISTINCT
    tc.relname AS table_name,
    a.attname AS fk_column,
    con.conname AS fk_name
FROM fk_columns fk
JOIN pg_class tc ON tc.oid = fk.conrelid
JOIN pg_attribute a ON a.attrelid = fk.conrelid AND a.attnum = fk.conkey_col
JOIN pg_constraint con ON con.oid = fk.oid
WHERE NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = fk.conrelid
    AND a.attnum = ANY(i.indkey)
)
ORDER BY tc.relname, a.attname;
```

---

## 9. Index Usage Statistics Queries

### Query 1: Most and Least Used Indexes

```sql
SELECT schemaname, tablename, indexname,
       idx_scan, idx_tup_read, idx_tup_fetch,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;  -- ASC for unused, DESC for most used
```

### Query 2: Index Size and Write Overhead

```sql
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
       idx_scan,
       pg_size_pretty(pg_total_relation_size(indexrelid)) AS total_size
FROM pg_stat_user_indexes
JOIN pg_index i ON i.indexrelid = indexrelid
WHERE schemaname = 'public'
  AND idx_scan < 100
  AND pg_relation_size(indexrelid) > 1048576  -- > 1MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Query 3: Unused Indexes (no scans in 7 days)

```sql
SELECT schemaname, tablename, indexname,
       idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND (SELECT max(last_analyze) FROM pg_stat_user_tables WHERE relname = tablename) < now() - interval '7 days'
ORDER BY tablename, indexname;
```

---

## 10. Recommended Index Monitoring

### Automated Alerts

| Alert Condition | Threshold | Action |
|-----------------|-----------|--------|
| Index bloat > 30% | `bloat_pct > 30` | Schedule `REINDEX INDEX CONCURRENTLY` |
| Seq scan on 10M+ row table | `seq_tup_read > 10_000_000` AND `idx_scan = 0` | Create covering index |
| Index scan efficiency < 20% | `efficiency_pct < 20` | Consider dropping or replacing index |
| Index size > 1GB with < 100 scans | `idx_scan < 100` AND `size > 1GB` | Drop if not critical for constraint |
| Write-heavy index with high bloat | `n_tup_upd + n_tup_del > 100_000/day` | Consider partial exclusion |

### Monitoring Schedule

| Frequency | Metric | Tool |
|-----------|--------|------|
| Real-time | Query performance (slow queries) | `pg_stat_statements` |
| Hourly | Index scan counts | `pg_stat_user_indexes` |
| Daily | Index bloat estimate | Custom bloat query |
| Weekly | Unused index review | `pg_stat_user_indexes` |
| Monthly | Full index usage report | Prometheus/Grafana or custom |

### Recommended Dashboard Metrics

1. **Index Size by Table** — Stacked bar chart
2. **Index Scan Count** — Top 20 most/least used
3. **Sequential Scans Over Time** — Time series
4. **Bloat Percentage** — Gauge per index
5. **Write Amplification** — `n_tup_upd + n_tup_del` per index per day
6. **Missing FK Indexes** — Count over time

---

> **Total Indexes: 235**  
> **By Index Type:** BTREE 215 | GIN 17 | GIST 3  
> **By Uniqueness:** Unique 28 | Non-Unique 207  
> **By Condition:** Partial 51 | Full 184  

> **Document Maintainers:** Database Engineering Team — Performance & Optimization  
> **Review Cycle:** Quarterly (coinciding with bloat analysis)  
> **Last Updated:** June 2026
