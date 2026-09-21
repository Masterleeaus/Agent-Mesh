# ResQAI V2 — Search Index Requirements

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Purpose:** Define search capabilities required per table across all applications

---

## 1. Full-Text Search (FTS) Requirements

| Table | FTS Columns | Index Type | Applications | Query Pattern |
|-------|------------|:----------:|:-------------|:--------------|
| tickets_v2 | subject, description, ticket_number | GIN tsvector | support-center_v2, customer-portal_v2, operations-center_v2 | `WHERE to_tsvector('english', subject || ' ' || COALESCE(description, '')) @@ plainto_tsquery($1)` |
| ticket_messages_v2 | message_body | GIN tsvector | support-center_v2, customer-portal_v2 | `WHERE to_tsvector('english', message_body) @@ plainto_tsquery($1)` |
| customers_v2 | first_name, last_name, email, notes | GIN tsvector | support-center_v2, crm-center_v2, customer-portal_v2, appointment-center_v2, operations-center_v2 | `WHERE to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(notes, '')) @@ plainto_tsquery($1)` |
| accounts_v2 | account_name, account_number, notes | GIN tsvector | crm-center_v2, analytics-center_v2 | `WHERE to_tsvector('english', account_name || ' ' || COALESCE(account_number, '') || ' ' || COALESCE(notes, '')) @@ plainto_tsquery($1)` |
| knowledge_articles_v2 | title, content | GIN tsvector | resolution-center_v2, customer-portal_v2 | `WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery($1)` |
| work_orders_v2 | order_number, scope_of_work, internal_notes | GIN tsvector | operations-center_v2, technician-portal_v2 | `WHERE to_tsvector('english', COALESCE(order_number, '') || ' ' || COALESCE(scope_of_work, '') || ' ' || COALESCE(internal_notes, '')) @@ plainto_tsquery($1)` |
| disputes_v2 | dispute_number, dispute_reason, resolution_notes | GIN tsvector | resolution-center_v2 | `WHERE to_tsvector('english', dispute_number || ' ' || COALESCE(dispute_reason, '') || ' ' || COALESCE(resolution_notes, '')) @@ plainto_tsquery($1)` |
| appointments_v2 | notes, cancellation_reason | GIN tsvector | appointment-center_v2 | `WHERE to_tsvector('english', COALESCE(notes, '') || ' ' || COALESCE(cancellation_reason, '')) @@ plainto_tsquery($1)` |
| audit_log_v2 | old_values, new_values | GIN tsvector | admin-center_v2 | `WHERE to_tsvector('english', COALESCE(old_values::text, '') || ' ' || COALESCE(new_values::text, '')) @@ plainto_tsquery($1)` |
| followups_v2 | notes, outcome | GIN tsvector | crm-center_v2 | `WHERE to_tsvector('english', COALESCE(notes, '') || ' ' || COALESCE(outcome, '')) @@ plainto_tsquery($1)` |
| inventory_items_v2 | name, sku, description | GIN tsvector | technician-portal_v2 | `WHERE to_tsvector('english', name || ' ' || COALESCE(sku, '') || ' ' || COALESCE(description, '')) @@ plainto_tsquery($1)` |

## 2. Lookup Search (Partial Match)

| Table | Search Columns | Index Type | Applications | Query Pattern |
|-------|---------------|:----------:|:-------------|:--------------|
| customers_v2 | first_name, last_name, email | BTREE (LIKE) | support-center_v2, appointment-center_v2, technician-portal_v2 | `WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1) AND deleted_at IS NULL` |
| accounts_v2 | account_name | BTREE (LIKE) | crm-center_v2 | `WHERE account_name ILIKE $1 AND deleted_at IS NULL` |
| technicians_v2 | first_name, last_name | BTREE (LIKE) | appointment-center_v2, operations-center_v2 | `WHERE (first_name ILIKE $1 OR last_name ILIKE $1) AND deleted_at IS NULL` |
| tickets_v2 | ticket_number | BTREE (equal) | support-center_v2, customer-portal_v2 | `WHERE ticket_number = $1 AND deleted_at IS NULL` |
| work_orders_v2 | order_number | BTREE (equal) | operations-center_v2, technician-portal_v2 | `WHERE order_number = $1 AND deleted_at IS NULL` |
| disputes_v2 | dispute_number | BTREE (equal) | resolution-center_v2 | `WHERE dispute_number = $1 AND deleted_at IS NULL` |
| inventory_items_v2 | sku | BTREE (equal) | technician-portal_v2 | `WHERE sku = $1 AND deleted_at IS NULL` |
| knowledge_articles_v2 | slug | BTREE (equal) | customer-portal_v2, resolution-center_v2 | `WHERE slug = $1 AND deleted_at IS NULL` |

## 3. Filter/Sort Index Requirements

| Table | Filter Columns | Sort Columns | Partial Filter | Applications |
|-------|---------------|:------------:|:--------------:|:-------------|
| tickets_v2 | ticket_status, priority, channel, assigned_to, customer_id, created_at | created_at DESC, priority DESC, sla_due_at ASC | WHERE deleted_at IS NULL | support-center_v2, operations-center_v2 |
| appointments_v2 | appointment_status, technician_id, customer_id, scheduled_start | scheduled_start ASC, created_at DESC | WHERE deleted_at IS NULL | appointment-center_v2, technician-portal_v2 |
| work_orders_v2 | work_order_status, technician_id, created_at | created_at DESC, priority DESC | WHERE deleted_at IS NULL | operations-center_v2, technician-portal_v2 |
| dispatches_v2 | dispatch_status, technician_id, dispatch_type | created_at ASC, updated_at DESC | WHERE deleted_at IS NULL | operations-center_v2 |
| disputes_v2 | dispute_status, created_at, raised_by | created_at DESC, updated_at ASC | WHERE deleted_at IS NULL | resolution-center_v2 |
| tasks_v2 | task_status, priority, due_at, assigned_to | due_at ASC, priority DESC | WHERE deleted_at IS NULL | crm-center_v2 |
| followups_v2 | followup_status, assigned_to, scheduled_at | scheduled_at ASC, created_at DESC | WHERE deleted_at IS NULL | crm-center_v2 |
| accounts_v2 | account_health, subscription_tier, mrr_cents | mrr_cents DESC, account_name ASC | WHERE deleted_at IS NULL | crm-center_v2 |
| customers_v2 | customer_status, relationship_status, customer_tier | created_at DESC, last_name ASC | WHERE deleted_at IS NULL | crm-center_v2 |
| users_v2 | user_status, role_id | last_name ASC, created_at DESC | WHERE deleted_at IS NULL | admin-center_v2 |
| notifications_v2 | notification_status, user_id, notification_type | created_at DESC | WHERE deleted_at IS NULL | customer-portal_v2, technician-portal_v2 |

## 4. Global Search Requirements

| Application | Entities Searched | Search Type | Result Limit |
|:-----------:|:-----------------:|:-----------:|:------------:|
| appointment-center_v2 | appointments_v2, customers_v2, technicians_v2 | Cross-entity FTS | 20 |
| operations-center_v2 | work_orders_v2, dispatches_v2, technicians_v2 | Cross-entity FTS | 20 |
| resolution-center_v2 | disputes_v2, knowledge_articles_v2 | Cross-entity FTS | 20 |
| crm-center_v2 | accounts_v2, customers_v2, followups_v2 | Cross-entity FTS | 20 |
| customer-portal_v2 | tickets_v2, knowledge_articles_v2 | Cross-entity FTS | 20 |
| analytics-center_v2 | analytics_reports_v2 | Single-entity FTS | 20 |
| admin-center_v2 | users_v2, audit_log_v2 | Cross-entity search | 50 |

---

## 5. Index Implementation Priority

| Priority | Index | Rationale | Affected Queries |
|:--------:|:-----:|:----------|:-----------------|
| P0 | idx_tickets_fts | Primary search target across 3 apps | Queue search, portal search |
| P0 | idx_customers_fts | Most-searched entity across 5 apps | Customer lookup, global search |
| P0 | idx_articles_fts | Customer-facing KB search | KB search, help center |
| P1 | idx_work_orders_fts | Ops and tech portal search | Operations search |
| P1 | idx_disputes_fts | Resolution center search | Dispute lookup |
| P1 | idx_accounts_fts | CRM account search | Account lookup |
| P1 | idx_inventory_items_fts | Parts search | Parts lookup |
| P2 | idx_followups_fts | CRM followup search | Followup lookup |
| P2 | idx_appointments_fts | Appointment search | Schedule lookup |
| P2 | idx_tktmsg_body_fts | Message search (existing) | Message lookup |
| P2 | idx_auditlog_search | Audit search (existing) | Audit analysis |

---

## 6. Search Performance Targets

| Metric | Target | Measurement |
|--------|:------:|:------------|
| FTS Response Time | < 200ms | p95 latency |
| Lookup Search Response Time | < 50ms | p95 latency |
| Cross-entity Search Response Time | < 500ms | p95 latency |
| Filter + Sort Response Time | < 100ms | p95 latency |
| Search Result Count Limit | 20-50 | Configurable per page |
| Search Index Refresh | Real-time (triggers) | On INSERT/UPDATE |

---

> **Note:** Existing indexes from INDEX_REFERENCE.md should be preserved. New FTS indexes should be added as GIN tsvector indexes with `to_tsvector('english', ...)` expressions.

> **End of SEARCH_INDEXES.md**
