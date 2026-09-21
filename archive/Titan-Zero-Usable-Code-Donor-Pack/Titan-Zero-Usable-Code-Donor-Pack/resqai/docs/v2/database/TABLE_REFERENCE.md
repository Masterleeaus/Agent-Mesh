# ResQAI V2 — Complete Table Reference

> **Version:** 2.0  
> **Tables:** 41  
> **Last Updated:** June 2026

---

## Domain: Customer Management

---

### `customers_v2`

**Purpose:** Stores customer profiles and metadata for all platform customers (B2C and B2B contacts).  
**Phase:** 3 | **Migration:** 010

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| account_id        | UUID           | YES      | NULL                     | FK to accounts_v2 (null for B2C) |
| first_name        | TEXT           | NO       | -                        | Customer first name |
| last_name         | TEXT           | NO       | -                        | Customer last name |
| email             | TEXT           | NO       | -                        | Email (encrypted at rest) |
| phone             | TEXT           | YES      | NULL                     | Phone (E.164, encrypted) |
| customer_status   | TEXT           | NO       | `'active'`               | Status: active, inactive, at_risk, dormant, churned |
| relationship_status | TEXT         | NO       | `'new'`                  | Relationship: new, active, in_dispute, at_risk, service_due, dormant, churned, won_back |
| customer_tier     | TEXT           | NO       | `'standard'`             | Tier: standard, premium, enterprise |
| referral_source   | TEXT           | YES      | NULL                     | How customer was acquired |
| notes             | TEXT           | YES      | NULL                     | Internal notes |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| last_contacted_at | TIMESTAMPTZ    | YES      | NULL                     | Last communication timestamp |
| avatar_url        | TEXT           | YES      | NULL                     | Profile image URL |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | Record created timestamp |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | Record updated timestamp |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | Soft delete timestamp |
| created_by        | UUID           | YES      | NULL                     | FK to users_v2 |
| updated_by        | UUID           | YES      | NULL                     | FK to users_v2 |

**Foreign Keys:** `account_id → accounts_v2(id)`, `created_by → users_v2(id)`, `updated_by → users_v2(id)`  
**Indexes:** PK (BTREE), `idx_customers_email` (UNIQUE, partial `WHERE deleted_at IS NULL`), `idx_customers_account` (BTREE), `idx_customers_status` (BTREE), `idx_customers_relationship` (BTREE), `idx_customers_meta` (GIN)  
**Unique Constraints:** email (unique across active records)  
**RLS:** Tenant isolation on `account_id`, self-service for own profile, admin full access  
**Example Query:**
```sql
SELECT c.id, c.first_name, c.last_name, c.email, a.name AS account_name
FROM customers_v2 c
LEFT JOIN accounts_v2 a ON a.id = c.account_id
WHERE c.customer_status = 'active' AND c.deleted_at IS NULL
ORDER BY c.created_at DESC;
```
**Lifecycle/Retention:** Active records retained indefinitely. Soft-deleted records purged after 7 years. Churned customers anonymized after 3 years.

---

### `customer_addresses_v2`

**Purpose:** Address book entries linked to customers, supporting multiple addresses per customer (billing, service, shipping).  
**Phase:** 3 | **Migration:** 011

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| customer_id       | UUID           | NO       | -                        | FK to customers_v2 |
| address_type      | TEXT           | NO       | `'service'`              | Type: billing, service, shipping |
| address_line1     | TEXT           | NO       | -                        | Street address line 1 |
| address_line2     | TEXT           | YES      | NULL                     | Apartment, suite, etc. |
| city              | TEXT           | NO       | -                        | City |
| state_province    | TEXT           | NO       | -                        | State or province |
| postal_code       | TEXT           | NO       | -                        | ZIP / postal code |
| country           | TEXT           | NO       | `'US'`                   | ISO 3166-1 alpha-2 |
| latitude          | DOUBLE PRECISION| YES     | NULL                     | Geocoded latitude |
| longitude         | DOUBLE PRECISION| YES     | NULL                     | Geocoded longitude |
| is_primary        | BOOLEAN        | NO       | `false`                  | Flag for primary address |
| notes             | TEXT           | YES      | NULL                     | Delivery instructions, etc. |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** `customer_id → customers_v2(id)`  
**Indexes:** PK, `idx_custaddr_customer` (BTREE), `idx_custaddr_primary` (BTREE, partial `WHERE is_primary = true AND deleted_at IS NULL`), `idx_custaddr_geo` (GIST on `(latitude, longitude)`)  
**Unique Constraints:** One primary address per customer (partial unique index)  
**RLS:** Inherited from customers_v2 via customer_id  
**Example Query:**
```sql
SELECT ca.address_line1, ca.city, ca.state_province, ca.postal_code
FROM customer_addresses_v2 ca
WHERE ca.customer_id = $1 AND ca.is_primary = true AND ca.deleted_at IS NULL;
```
**Lifecycle/Retention:** Cascade soft-delete with customer. Orphaned addresses purged after 90 days.

---

## Domain: Support Operations

---

### `tickets_v2`

**Purpose:** Core support ticket lifecycle — tracks all customer issues from creation through resolution.  
**Phase:** 4 | **Migration:** 015

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_number     | TEXT           | NO       | -                        | Human-readable ticket ID (e.g., TKT-0001234) |
| account_id        | UUID           | YES      | NULL                     | FK to accounts_v2 |
| customer_id       | UUID           | NO       | -                        | FK to customers_v2 |
| assigned_to       | UUID           | YES      | NULL                     | FK to users_v2 (assigned agent) |
| parent_ticket_id  | UUID           | YES      | NULL                     | Self-ref FK for ticket threading |
| subject           | TEXT           | NO       | -                        | Ticket subject line |
| description       | TEXT           | YES      | NULL                     | Detailed description |
| ticket_status     | TEXT           | NO       | `'new'`                  | new, classified, drafted, approved_to_send, sent, escalated, closed |
| channel           | TEXT           | NO       | -                        | email, chat, sms, phone, web, portal |
| request_type      | TEXT           | NO       | -                        | new_booking, reschedule, cancellation, complaint, follow_up, general_inquiry, billing |
| urgency           | TEXT           | NO       | `'normal'`               | low, normal, high, urgent |
| priority          | TEXT           | NO       | `'normal'`               | low, normal, high, urgent, critical |
| source            | TEXT           | YES      | NULL                     | Origination source identifier |
| tags              | TEXT[]         | NO       | `'{}'::text[]`           | Array of tag strings |
| has_attachments   | BOOLEAN        | NO       | `false`                  | Whether attachments exist |
| internal_notes    | TEXT           | YES      | NULL                     | Internal agent notes |
| first_response_at | TIMESTAMPTZ    | YES      | NULL                     | Time of first agent response |
| resolved_at       | TIMESTAMPTZ    | YES      | NULL                     | Time of resolution |
| closed_at         | TIMESTAMPTZ    | YES      | NULL                     | Time ticket was closed |
| sla_due_at        | TIMESTAMPTZ    | YES      | NULL                     | SLA deadline timestamp |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `account_id → accounts_v2(id)`, `customer_id → customers_v2(id)`, `assigned_to → users_v2(id)`, `parent_ticket_id → tickets_v2(id)`, `created_by → users_v2(id)`, `updated_by → users_v2(id)`  
**Indexes:** PK, `uniq_tickets_number` (UNIQUE), `idx_tickets_customer` (BTREE), `idx_tickets_assigned` (BTREE), `idx_tickets_status` (BTREE), `idx_tickets_channel` (BTREE), `idx_tickets_priority` (BTREE), `idx_tickets_account` (BTREE), `idx_tickets_sla` (BTREE, partial `WHERE sla_due_at IS NOT NULL AND deleted_at IS NULL`), `idx_tickets_tags` (GIN), `idx_tickets_created` (BTREE), `idx_tickets_parent` (BTREE)  
**Unique Constraints:** `ticket_number` globally unique  
**RLS:** Tenant isolation on account_id, assigned agent access, customer self-access  
**Example Query:**
```sql
SELECT t.ticket_number, t.subject, t.ticket_status, t.priority,
       CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
       u.email AS assigned_agent
FROM tickets_v2 t
JOIN customers_v2 c ON c.id = t.customer_id
LEFT JOIN users_v2 u ON u.id = t.assigned_to
WHERE t.ticket_status IN ('new','classified','drafted','approved_to_send','sent','escalated')
  AND t.deleted_at IS NULL
ORDER BY t.priority DESC, t.created_at ASC;
```
**Lifecycle/Retention:** Active tickets retained indefinitely. Closed tickets archived after 1 year. Soft-deleted purged after 7 years.

---

### `ticket_messages_v2`

**Purpose:** Stores all messages/threads within a ticket, including internal notes and customer replies.  
**Phase:** 4 | **Migration:** 016

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_id         | UUID           | NO       | -                        | FK to tickets_v2 |
| parent_message_id | UUID           | YES      | NULL                     | Self-ref FK for thread nesting |
| sender_id         | UUID           | YES      | NULL                     | FK to users_v2 (null = system/customer) |
| sender_type       | TEXT           | NO       | `'agent'`                | agent, customer, system, webhook |
| message_body      | TEXT           | NO       | -                        | Message content |
| message_type      | TEXT           | NO       | `'public'`               | public, internal_note, system_note |
| is_internal       | BOOLEAN        | NO       | `false`                  | Shorthand for internal notes |
| has_attachments   | BOOLEAN        | NO       | `false`                  | Whether message has files |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `parent_message_id → ticket_messages_v2(id)`, `sender_id → users_v2(id)`  
**Indexes:** PK, `idx_tktmsg_ticket` (BTREE), `idx_tktmsg_sender` (BTREE), `idx_tktmsg_created` (BTREE), `idx_tktmsg_parent` (BTREE), `idx_tktmsg_internal` (BTREE, partial `WHERE is_internal = true`), `idx_tktmsg_body_fts` (GIN, tsvector)  
**Unique Constraints:** None  
**RLS:** Inherited from tickets_v2; internal messages filtered by role  
**Example Query:**
```sql
SELECT tm.message_body, tm.created_at, tm.sender_type
FROM ticket_messages_v2 tm
WHERE tm.ticket_id = $1 AND tm.deleted_at IS NULL AND tm.is_internal = false
ORDER BY tm.created_at ASC;
```
**Lifecycle/Retention:** Cascade delete with ticket. Internal notes retained per ticket policy.

---

### `ticket_attachments_v2`

**Purpose:** File attachments linked to tickets and optionally to specific messages.  
**Phase:** 4 | **Migration:** 017

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_id         | UUID           | NO       | -                        | FK to tickets_v2 |
| message_id        | UUID           | YES      | NULL                     | FK to ticket_messages_v2 |
| file_name         | TEXT           | NO       | -                        | Original filename |
| file_path         | TEXT           | NO       | -                        | Storage path / key |
| file_size_bytes   | INTEGER        | NO       | -                        | File size in bytes |
| mime_type         | TEXT           | YES      | NULL                     | MIME content type |
| file_hash         | TEXT           | NO       | -                        | SHA-256 hash of file |
| is_image          | BOOLEAN        | NO       | `false`                  | Whether file is an image |
| thumbnail_path    | TEXT           | YES      | NULL                     | Thumbnail storage path |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | Soft delete |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `message_id → ticket_messages_v2(id)`  
**Indexes:** PK, `idx_tktatt_ticket` (BTREE), `idx_tktatt_message` (BTREE), `idx_tktatt_hash` (BTREE), `idx_tktatt_mime` (BTREE)  
**Unique Constraints:** None (same file can appear in multiple tickets)  
**RLS:** Inherited from tickets_v2  
**Example Query:**
```sql
SELECT ta.file_name, ta.file_size_bytes, ta.mime_type, ta.file_path
FROM ticket_attachments_v2 ta
WHERE ta.ticket_id = $1 AND ta.deleted_at IS NULL;
```
**Lifecycle/Retention:** Files stored in S3-compatible object store. DB records purged 90 days after ticket deletion. Actual files GC'd after 30-day grace period.

---

## Domain: Scheduling

---

### `appointments_v2`

**Purpose:** Scheduled appointment slots linking tickets to technicians with time windows.  
**Phase:** 4 | **Migration:** 018

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_id         | UUID           | YES      | NULL                     | FK to tickets_v2 |
| customer_id       | UUID           | NO       | -                        | FK to customers_v2 |
| technician_id     | UUID           | YES      | NULL                     | FK to technicians_v2 |
| appointment_status| TEXT           | NO       | `'scheduled'`            | scheduled, confirmed, in_progress, completed, needs_followup, cancelled, on_hold |
| scheduled_start   | TIMESTAMPTZ    | NO       | -                        | Scheduled start time |
| scheduled_end     | TIMESTAMPTZ    | NO       | -                        | Scheduled end time |
| actual_start      | TIMESTAMPTZ    | YES      | NULL                     | Actual arrival time |
| actual_end        | TIMESTAMPTZ    | YES      | NULL                     | Actual completion time |
| timezone          | TEXT           | NO       | `'America/New_York'`     | IANA timezone |
| duration_minutes  | SMALLINT       | NO       | -                        | Expected duration |
| address_id        | UUID           | YES      | NULL                     | FK to customer_addresses_v2 |
| notes             | TEXT           | YES      | NULL                     | Technician instructions |
| cancellation_reason| TEXT          | YES      | NULL                     | Why cancelled |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `customer_id → customers_v2(id)`, `technician_id → technicians_v2(id)`, `address_id → customer_addresses_v2(id)`  
**Indexes:** PK, `idx_appt_technician` (BTREE), `idx_appt_customer` (BTREE), `idx_appt_ticket` (BTREE), `idx_appt_status` (BTREE), `idx_appt_scheduled_start` (BTREE), `idx_appt_daterange` (BTREE, composite: `scheduled_start, scheduled_end`), `idx_appt_technician_date` (BTREE, composite: `technician_id, scheduled_start`)  
**Unique Constraints:** None (partial unique on technician + time to prevent double-booking via application)  
**RLS:** Tenant isolation, technician self-access, customer self-access  
**Example Query:**
```sql
SELECT a.scheduled_start, a.scheduled_end, a.appointment_status,
       CONCAT(t.first_name, ' ', t.last_name) AS technician_name
FROM appointments_v2 a
JOIN technicians_v2 t ON t.id = a.technician_id
WHERE a.technician_id = $1
  AND a.scheduled_start >= $2
  AND a.scheduled_start <  $3
  AND a.deleted_at IS NULL
ORDER BY a.scheduled_start;
```
**Lifecycle/Retention:** Past appointments retained for 2 years. Cancelled appointments purged after 90 days.

---

### `appointment_reminders_v2`

**Purpose:** Tracks reminder notifications sent for appointments (SMS, email, push).  
**Phase:** 4 | **Migration:** 019

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| appointment_id    | UUID           | NO       | -                        | FK to appointments_v2 |
| reminder_type     | TEXT           | NO       | -                        | appointment_24h, appointment_2h, dispatch_alert, followup_due |
| channel           | TEXT           | NO       | -                        | email, sms, push |
| recipient_address | TEXT           | NO       | -                        | Email or phone number |
| reminder_status   | TEXT           | NO       | `'pending'`              | pending, sent, delivered, failed |
| sent_at           | TIMESTAMPTZ    | YES      | NULL                     | When sent |
| delivered_at      | TIMESTAMPTZ    | YES      | NULL                     | When delivered |
| failed_at         | TIMESTAMPTZ    | YES      | NULL                     | When failure occurred |
| error_message     | TEXT           | YES      | NULL                     | Delivery error detail |
| notification_id   | UUID           | YES      | NULL                     | FK to notifications_v2 |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `appointment_id → appointments_v2(id)`, `notification_id → notifications_v2(id)`  
**Indexes:** PK, `idx_apptrem_appointment` (BTREE), `idx_apptrem_status` (BTREE), `idx_apptrem_type` (BTREE)  
**Unique Constraints:** None  
**RLS:** Inherited from appointments_v2  
**Example Query:**
```sql
SELECT ar.reminder_type, ar.channel, ar.reminder_status, ar.sent_at
FROM appointment_reminders_v2 ar
WHERE ar.appointment_id = $1
ORDER BY ar.created_at DESC;
```
**Lifecycle/Retention:** Purged 30 days after appointment completion. Failed reminders retained for retry analysis (90 days).

---

## Domain: Technicians

---

### `technicians_v2`

**Purpose:** Technician profiles including certifications, availability, and payroll metadata.  
**Phase:** 3 | **Migration:** 012

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| user_id           | UUID           | YES      | NULL                     | FK to users_v2 (nullable for external) |
| first_name        | TEXT           | NO       | -                        | First name |
| last_name         | TEXT           | NO       | -                        | Last name |
| email             | TEXT           | NO       | -                        | Email (encrypted) |
| phone             | TEXT           | YES      | NULL                     | Phone (E.164, encrypted) |
| technician_availability | TEXT    | NO       | `'available'`            | available, busy, on_break, off_shift, on_leave |
| specialties       | TEXT[]         | NO       | `'{}'::text[]`           | Array of specialty tags |
| certification_details | JSONB     | NO       | `'{}'::jsonb`            | Certifications, expiry dates |
| service_area      | TEXT           | YES      | NULL                     | Geographic service area |
| max_daily_jobs    | SMALLINT       | NO       | `8`                      | Max appointments per day |
| current_lat       | DOUBLE PRECISION| YES     | NULL                     | Live location latitude |
| current_lng       | DOUBLE PRECISION| YES     | NULL                     | Live location longitude |
| location_updated_at| TIMESTAMPTZ   | YES      | NULL                     | Last location update |
| rating_avg        | NUMERIC(3,2)   | NO       | `0.00`                   | Average customer rating |
| total_jobs        | INTEGER        | NO       | `0`                      | Lifetime job count |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether technician is active |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `user_id → users_v2(id)`  
**Indexes:** PK, `uniq_technicians_email` (UNIQUE, partial), `idx_tech_availability` (BTREE), `idx_tech_specialties` (GIN), `idx_tech_location` (GIST, partial `WHERE current_lat IS NOT NULL`), `idx_tech_active` (BTREE, partial `WHERE is_active = true AND deleted_at IS NULL`)  
**Unique Constraints:** email (active records)  
**RLS:** Self-service for own profile, admin full access, tenant access for dispatchers  
**Example Query:**
```sql
SELECT t.id, t.first_name, t.last_name, t.rating_avg, t.total_jobs,
       t.technician_availability
FROM technicians_v2 t
WHERE t.technician_availability = 'available'
  AND t.is_active = true AND t.deleted_at IS NULL
ORDER BY t.rating_avg DESC;
```
**Lifecycle/Retention:** Inactive technicians retained for 3 years. Deleted records purged after 7 years.

---

### `technician_skills_v2`

**Purpose:** Junction table linking technicians to skills (stored in reference_data_v2).  
**Phase:** 3 | **Migration:** 013

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| technician_id     | UUID           | NO       | -                        | FK to technicians_v2 |
| skill_id          | UUID           | NO       | -                        | FK to reference_data_v2 (skill type) |
| proficiency       | TEXT           | NO       | `'intermediate'`         | beginner, intermediate, advanced, expert |
| certified         | BOOLEAN        | NO       | `false`                  | Whether certified in this skill |
| certified_at      | TIMESTAMPTZ    | YES      | NULL                     | Certification date |
| certification_expiry | TIMESTAMPTZ | YES      | NULL                     | Certification expiry |
| notes             | TEXT           | YES      | NULL                     | Additional notes |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `technician_id → technicians_v2(id)`, `skill_id → reference_data_v2(id)`  
**Indexes:** PK, `uniq_techskill_tech_skill` (UNIQUE: `technician_id, skill_id`), `idx_techskill_skill` (BTREE), `idx_techskill_proficiency` (BTREE)  
**Unique Constraints:** One skill entry per technician (unique composite)  
**RLS:** Inherited from technicians_v2  
**Example Query:**
```sql
SELECT rd.value AS skill_name, ts.proficiency, ts.certified
FROM technician_skills_v2 ts
JOIN reference_data_v2 rd ON rd.id = ts.skill_id
WHERE ts.technician_id = $1
ORDER BY ts.proficiency DESC;
```
**Lifecycle/Retention:** Cascade delete with technician.

---

## Domain: Dispatch & Field

---

### `dispatches_v2`

**Purpose:** Dispatch request and response flow — connects scheduling to field execution.  
**Phase:** 5 | **Migration:** 022

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| appointment_id    | UUID           | YES      | NULL                     | FK to appointments_v2 |
| work_order_id     | UUID           | YES      | NULL                     | FK to work_orders_v2 |
| technician_id     | UUID           | NO       | -                        | FK to technicians_v2 |
| dispatcher_id     | UUID           | YES      | NULL                     | FK to users_v2 (dispatcher) |
| dispatch_status   | TEXT           | NO       | `'pending'`              | pending, sent, acknowledged, declined, en_route, on_site, completed, cancelled |
| dispatch_type     | TEXT           | NO       | `'scheduled'`            | urgent, scheduled, emergency |
| sent_at           | TIMESTAMPTZ    | YES      | NULL                     | When dispatch was sent |
| acknowledged_at   | TIMESTAMPTZ    | YES      | NULL                     | When technician acknowledged |
| en_route_at       | TIMESTAMPTZ    | YES      | NULL                     | When technician started travel |
| on_site_at        | TIMESTAMPTZ    | YES      | NULL                     | When technician arrived |
| completed_at      | TIMESTAMPTZ    | YES      | NULL                     | When job completed |
| declined_reason   | TEXT           | YES      | NULL                     | Why technician declined |
| eta_minutes       | SMALLINT       | YES      | NULL                     | Estimated time of arrival |
| distance_miles    | NUMERIC(8,2)   | YES      | NULL                     | Distance to site |
| notes             | TEXT           | YES      | NULL                     | Dispatch notes |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** `appointment_id → appointments_v2(id)`, `work_order_id → work_orders_v2(id)`, `technician_id → technicians_v2(id)`, `dispatcher_id → users_v2(id)`  
**Indexes:** PK, `idx_dispatch_tech` (BTREE), `idx_dispatch_status` (BTREE), `idx_dispatch_type` (BTREE), `idx_dispatch_appointment` (BTREE), `idx_dispatch_created` (BTREE), `idx_dispatch_tech_status` (BTREE, composite: `technician_id, dispatch_status`)  
**Unique Constraints:** None  
**RLS:** Technician self-access, dispatcher tenant access, admin full access  
**Example Query:**
```sql
SELECT d.dispatch_status, d.dispatch_type, d.sent_at, d.acknowledged_at,
       CONCAT(t.first_name, ' ', t.last_name) AS tech_name
FROM dispatches_v2 d
JOIN technicians_v2 t ON t.id = d.technician_id
WHERE d.technician_id = $1
  AND d.created_at >= $2
ORDER BY d.created_at DESC;
```
**Lifecycle/Retention:** Completed dispatches retained for 2 years. Declined/cancelled purged after 90 days.

---

### `work_orders_v2`

**Purpose:** Field work order lifecycle — detailed scope of work for onsite technician visits.  
**Phase:** 5 | **Migration:** 020

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| order_number      | TEXT           | NO       | -                        | Human-readable number (e.g., WO-0005678) |
| ticket_id         | UUID           | YES      | NULL                     | FK to tickets_v2 |
| technician_id     | UUID           | YES      | NULL                     | FK to technicians_v2 |
| work_order_status | TEXT           | NO       | `'created'`              | created, assigned, travelling, on_site, working, completed, needs_followup |
| scope_of_work     | TEXT           | YES      | NULL                     | Description of work to be done |
| customer_notes    | TEXT           | YES      | NULL                     | Notes visible to customer |
| internal_notes    | TEXT           | YES      | NULL                     | Internal instructions |
| materials_used    | JSONB          | NO       | `'{}'::jsonb`            | Materials/parts consumed |
| labor_hours       | NUMERIC(5,2)   | YES      | NULL                     | Total labor hours |
| cost_cents        | INTEGER        | YES      | NULL                     | Total cost in cents |
| signed_off_by     | TEXT           | YES      | NULL                     | Customer name who signed |
| signed_off_at     | TIMESTAMPTZ    | YES      | NULL                     | Sign-off timestamp |
| completed_at      | TIMESTAMPTZ    | YES      | NULL                     | Time of completion |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `technician_id → technicians_v2(id)`  
**Indexes:** PK, `uniq_workorders_number` (UNIQUE), `idx_wo_ticket` (BTREE), `idx_wo_technician` (BTREE), `idx_wo_status` (BTREE), `idx_wo_created` (BTREE), `idx_wo_tech_status` (BTREE, composite: `technician_id, work_order_status`)  
**Unique Constraints:** `order_number` globally unique  
**RLS:** Technician self-access, dispatcher/manager tenant access  
**Example Query:**
```sql
SELECT wo.order_number, wo.work_order_status, wo.scope_of_work,
       wo.labor_hours, wo.cost_cents,
       t.ticket_number
FROM work_orders_v2 wo
LEFT JOIN tickets_v2 t ON t.id = wo.ticket_id
WHERE wo.technician_id = $1 AND wo.deleted_at IS NULL
ORDER BY wo.created_at DESC;
```
**Lifecycle/Retention:** Completed work orders retained for 3 years. Active orders retained indefinitely. Purged after 7 years.

---

### `work_order_stages_v2`

**Purpose:** Stage-tracking for work order progress — creates a timestamped audit of each phase transition.  
**Phase:** 5 | **Migration:** 021

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| work_order_id     | UUID           | NO       | -                        | FK to work_orders_v2 |
| stage_name        | TEXT           | NO       | -                        | Stage identifier (e.g., 'arrival', 'diagnosis', 'repair', 'testing', 'signoff') |
| entered_at        | TIMESTAMPTZ    | NO       | `now()`                  | When this stage began |
| exited_at         | TIMESTAMPTZ    | YES      | NULL                     | When this stage ended |
| duration_seconds  | INTEGER        | YES      | NULL                     | Computed duration |
| notes             | TEXT           | YES      | NULL                     | Stage-specific notes |
| entered_by        | UUID           | YES      | NULL                     | FK to users_v2/technicians_v2 |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `work_order_id → work_orders_v2(id)`  
**Indexes:** PK, `idx_wostage_wo` (BTREE), `idx_wostage_name` (BTREE), `idx_wostage_entered` (BTREE)  
**Unique Constraints:** Unique `(work_order_id, stage_name)` — one entry per stage per work order  
**RLS:** Inherited from work_orders_v2  
**Example Query:**
```sql
SELECT ws.stage_name, ws.entered_at, ws.exited_at, ws.duration_seconds
FROM work_order_stages_v2 ws
WHERE ws.work_order_id = $1
ORDER BY ws.entered_at ASC;
```
**Lifecycle/Retention:** Cascade delete with work order.

---

## Domain: Dispute Resolution

---

### `disputes_v2`

**Purpose:** Tracks disputes and chargebacks raised against work orders or tickets.  
**Phase:** 5 | **Migration:** 023

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| dispute_number    | TEXT           | NO       | -                        | Human-readable number (e.g., DSP-000123) |
| ticket_id         | UUID           | YES      | NULL                     | FK to tickets_v2 |
| work_order_id     | UUID           | YES      | NULL                     | FK to work_orders_v2 |
| raised_by         | UUID           | YES      | NULL                     | FK to users_v2 |
| dispute_status    | TEXT           | NO       | `'open'`                 | open, analyzing, recommendation_ready, escalated, approved, rejected, closed |
| dispute_reason    | TEXT           | NO       | -                        | Reason for dispute |
| amount_cents      | INTEGER        | YES      | NULL                     | Disputed amount (if monetary) |
| resolution_notes  | TEXT           | YES      | NULL                     | Resolution details |
| resolved_by       | UUID           | YES      | NULL                     | FK to users_v2 (who resolved) |
| resolved_at       | TIMESTAMPTZ    | YES      | NULL                     | When resolved |
| escalated_to      | TEXT           | YES      | NULL                     | Escalation path |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `work_order_id → work_orders_v2(id)`, `raised_by → users_v2(id)`, `resolved_by → users_v2(id)`  
**Indexes:** PK, `uniq_disputes_number` (UNIQUE), `idx_dispute_ticket` (BTREE), `idx_dispute_wo` (BTREE), `idx_dispute_status` (BTREE), `idx_dispute_created` (BTREE)  
**Unique Constraints:** `dispute_number` globally unique  
**RLS:** Tenant access, admin full access, owner access for raiser  
**Example Query:**
```sql
SELECT d.dispute_number, d.dispute_status, d.dispute_reason,
       d.amount_cents, d.resolved_at
FROM disputes_v2 d
WHERE d.work_order_id = $1 AND d.deleted_at IS NULL
ORDER BY d.created_at DESC;
```
**Lifecycle/Retention:** Resolved disputes retained for 3 years. Pending disputes retained indefinitely. Purged after 7 years.

---

### `dispute_evidence_v2`

**Purpose:** Evidence files and statements linked to disputes.  
**Phase:** 5 | **Migration:** 024

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| dispute_id        | UUID           | NO       | -                        | FK to disputes_v2 |
| evidence_type     | TEXT           | NO       | -                        | photo, document, audio, video, statement, receipt |
| file_path         | TEXT           | YES      | NULL                     | Storage path |
| file_name         | TEXT           | YES      | NULL                     | Original filename |
| file_size_bytes   | INTEGER        | YES      | NULL                     | File size |
| mime_type         | TEXT           | YES      | NULL                     | MIME type |
| description       | TEXT           | YES      | NULL                     | Evidence description |
| uploaded_by       | UUID           | YES      | NULL                     | FK to users_v2 |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** `dispute_id → disputes_v2(id)`, `uploaded_by → users_v2(id)`  
**Indexes:** PK, `idx_dispevidence_dispute` (BTREE), `idx_dispevidence_type` (BTREE)  
**Unique Constraints:** None  
**RLS:** Inherited from disputes_v2  
**Example Query:**
```sql
SELECT de.evidence_type, de.file_name, de.description, de.created_at
FROM dispute_evidence_v2 de
WHERE de.dispute_id = $1 AND de.deleted_at IS NULL;
```
**Lifecycle/Retention:** Cascade delete with dispute. Physical files GC'd 30 days after dispute purge.

---

## Domain: CRM & Accounts

---

### `accounts_v2`

**Purpose:** Account/company records for B2B customers — represents organizations with multiple contacts.  
**Phase:** 3 | **Migration:** 014

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| account_name      | TEXT           | NO       | -                        | Company/account name |
| account_number    | TEXT           | NO       | -                        | Internal account number |
| account_health    | TEXT           | NO       | `'healthy'`              | healthy, watch, slipping, critical |
| industry          | TEXT           | YES      | NULL                     | Industry vertical |
| website           | TEXT           | YES      | NULL                     | Company website |
| phone             | TEXT           | YES      | NULL                     | Main phone (E.164) |
| email             | TEXT           | YES      | NULL                     | Main email |
| billing_address_id| UUID          | YES      | NULL                     | FK to customer_addresses_v2 |
| subscription_tier | TEXT           | NO       | `'standard'`             | standard, premium, enterprise |
| contract_start    | DATE           | YES      | NULL                     | Contract start date |
| contract_end      | DATE           | YES      | NULL                     | Contract end date |
| mrr_cents         | INTEGER        | NO       | `0`                      | Monthly recurring revenue in cents |
| lifetime_value_cents| INTEGER      | NO       | `0`                      | Customer LTV in cents |
| assigned_rep_id   | UUID           | YES      | NULL                     | FK to users_v2 (account rep) |
| notes             | TEXT           | YES      | NULL                     | Internal account notes |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `assigned_rep_id → users_v2(id)`  
**Indexes:** PK, `uniq_accounts_number` (UNIQUE), `idx_accounts_health` (BTREE), `idx_accounts_tier` (BTREE), `idx_accounts_rep` (BTREE), `idx_accounts_mrr` (BTREE), `idx_accounts_meta` (GIN), `idx_accounts_contract_end` (BTREE, partial `WHERE contract_end IS NOT NULL`)  
**Unique Constraints:** `account_number` globally unique  
**RLS:** Tenant managers and admins only (no customer self-access on account-level data)  
**Example Query:**
```sql
SELECT a.account_name, a.account_health, a.subscription_tier,
       a.mrr_cents, a.contract_end,
       u.email AS account_rep
FROM accounts_v2 a
LEFT JOIN users_v2 u ON u.id = a.assigned_rep_id
WHERE a.account_health IN ('watch','slipping','critical')
  AND a.deleted_at IS NULL
ORDER BY a.mrr_cents DESC;
```
**Lifecycle/Retention:** Active accounts retained indefinitely. Churned accounts anonymized after 5 years. Purged after 10 years.

---

### `account_health_scans_v2`

**Purpose:** Periodic account health assessment snapshots — stores the output of automated scoring runs.  
**Phase:** 6 | **Migration:** 029

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| account_id        | UUID           | NO       | -                        | FK to accounts_v2 |
| scan_score        | SMALLINT       | NO       | -                        | 0-100 health score |
| previous_score    | SMALLINT       | YES      | NULL                     | Previous scan score (for trend) |
| score_delta       | SMALLINT       | YES      | NULL                     | Change from previous scan |
| account_health    | TEXT           | NO       | -                        | healthy, watch, slipping, critical |
| scan_factors      | JSONB          | NO       | `'{}'::jsonb`            | Breakdown of scoring factors |
| risk_indicators   | TEXT[]         | NO       | `'{}'::text[]`           | List of detected risk flags |
| recommendations   | TEXT[]         | NO       | `'{}'::text[]`           | Auto-generated recommendations |
| scanned_by        | TEXT           | NO       | -                        | 'system' or 'manual' |
| notes             | TEXT           | YES      | NULL                     | Human notes |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `account_id → accounts_v2(id)`  
**Indexes:** PK, `idx_healthscan_account` (BTREE), `idx_healthscan_score` (BTREE), `idx_healthscan_health` (BTREE), `idx_healthscan_created` (BTREE), `idx_healthscan_account_created` (BTREE, composite: `account_id, created_at DESC`)  
**Unique Constraints:** None  
**RLS:** Inherited from accounts_v2  
**Example Query:**
```sql
SELECT hs.scan_score, hs.account_health, hs.scan_factors,
       hs.created_at
FROM account_health_scans_v2 hs
WHERE hs.account_id = $1
ORDER BY hs.created_at DESC
LIMIT 10;
```
**Lifecycle/Retention:** Retained for 2 years. Automated weekly cleanup of scans older than 2 years.

---

### `followups_v2`

**Purpose:** Follow-up scheduling and tracking — ensures no customer or ticket falls through the cracks.  
**Phase:** 6 | **Migration:** 027

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_id         | UUID           | YES      | NULL                     | FK to tickets_v2 |
| account_id        | UUID           | YES      | NULL                     | FK to accounts_v2 |
| customer_id       | UUID           | YES      | NULL                     | FK to customers_v2 |
| assigned_to       | UUID           | NO       | -                        | FK to users_v2 |
| followup_status   | TEXT           | NO       | `'pending'`              | pending, in_progress, completed, missed, cancelled |
| followup_type     | TEXT           | NO       | -                        | call, email, site_visit, review |
| scheduled_at      | TIMESTAMPTZ    | NO       | -                        | Scheduled follow-up time |
| completed_at      | TIMESTAMPTZ    | YES      | NULL                     | When completed |
| notes             | TEXT           | YES      | NULL                     | Follow-up notes |
| outcome           | TEXT           | YES      | NULL                     | Outcome description |
| attempt_count     | SMALLINT       | NO       | `0`                      | Number of attempts made |
| max_attempts      | SMALLINT       | NO       | `3`                      | Maximum allowed attempts |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `account_id → accounts_v2(id)`, `customer_id → customers_v2(id)`, `assigned_to → users_v2(id)`  
**Indexes:** PK, `idx_followup_assigned` (BTREE), `idx_followup_status` (BTREE), `idx_followup_scheduled` (BTREE), `idx_followup_ticket` (BTREE), `idx_followup_account` (BTREE), `idx_followup_due` (BTREE, partial `WHERE scheduled_at <= now() AND followup_status = 'pending' AND deleted_at IS NULL`)  
**Unique Constraints:** None  
**RLS:** Assigned user access, manager tenant access, admin full access  
**Example Query:**
```sql
SELECT f.id, f.followup_type, f.scheduled_at, f.followup_status,
       t.ticket_number
FROM followups_v2 f
LEFT JOIN tickets_v2 t ON t.id = f.ticket_id
WHERE f.assigned_to = $1
  AND f.followup_status IN ('pending','in_progress')
  AND f.deleted_at IS NULL
ORDER BY f.scheduled_at ASC;
```
**Lifecycle/Retention:** Completed followups retained for 1 year. Missed followups retained for 90 days. Purged after 3 years.

---

### `followup_attempts_v2`

**Purpose:** Logs each attempt made on a follow-up (calls made, emails sent, etc.).  
**Phase:** 6 | **Migration:** 028

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| followup_id       | UUID           | NO       | -                        | FK to followups_v2 |
| attempt_number    | SMALLINT       | NO       | -                        | 1-based attempt number |
| attempt_type      | TEXT           | NO       | -                        | call, email, sms, visit |
| contacted_at      | TIMESTAMPTZ    | YES      | NULL                     | When contact was made |
| response_received | BOOLEAN        | NO       | `false`                  | Whether response obtained |
| response_summary  | TEXT           | YES      | NULL                     | Summary of response |
| duration_seconds  | INTEGER        | YES      | NULL                     | Duration of call/visit |
| outcome           | TEXT           | YES      | NULL                     | reached, voicemail, no_answer, busy, wrong_number |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `followup_id → followups_v2(id)`  
**Indexes:** PK, `idx_fupattempt_followup` (BTREE), `idx_fupattempt_number` (BTREE)  
**Unique Constraints:** Unique composite: `(followup_id, attempt_number)`  
**RLS:** Inherited from followups_v2  
**Example Query:**
```sql
SELECT fa.attempt_number, fa.attempt_type, fa.contacted_at,
       fa.response_received, fa.outcome
FROM followup_attempts_v2 fa
WHERE fa.followup_id = $1
ORDER BY fa.attempt_number ASC;
```
**Lifecycle/Retention:** Cascade delete with followup.

---

## Domain: Tasks

---

### `tasks_v2`

**Purpose:** General task management — supports internal tasks linked to tickets, accounts, or standalone.  
**Phase:** 6 | **Migration:** 025

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_id         | UUID           | YES      | NULL                     | FK to tickets_v2 |
| account_id        | UUID           | YES      | NULL                     | FK to accounts_v2 |
| title             | TEXT           | NO       | -                        | Task title |
| description       | TEXT           | YES      | NULL                     | Detailed description |
| task_status       | TEXT           | NO       | `'open'`                 | open, in_progress, blocked, done, overdue, cancelled |
| priority          | TEXT           | NO       | `'normal'`               | low, normal, high, urgent, critical |
| task_type         | TEXT           | NO       | -                        | Category identifier |
| due_at            | TIMESTAMPTZ    | YES      | NULL                     | Due date |
| completed_at      | TIMESTAMPTZ    | YES      | NULL                     | When completed |
| estimated_hours   | NUMERIC(5,2)   | YES      | NULL                     | Estimated effort |
| actual_hours      | NUMERIC(5,2)   | YES      | NULL                     | Actual effort |
| is_recurring      | BOOLEAN        | NO       | `false`                  | Whether task repeats |
| recurrence_rule   | TEXT           | YES      | NULL                     | RRULE string |
| tags              | TEXT[]         | NO       | `'{}'::text[]`           | Tag array |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `account_id → accounts_v2(id)`  
**Indexes:** PK, `idx_tasks_ticket` (BTREE), `idx_tasks_account` (BTREE), `idx_tasks_status` (BTREE), `idx_tasks_priority` (BTREE), `idx_tasks_due` (BTREE), `idx_tasks_type` (BTREE), `idx_tasks_tags` (GIN), `idx_tasks_overdue` (BTREE, partial `WHERE due_at < now() AND task_status IN ('open','in_progress','blocked') AND deleted_at IS NULL`)  
**Unique Constraints:** None  
**RLS:** Assigned user access, manager tenant access, admin full access  
**Example Query:**
```sql
SELECT t.title, t.task_status, t.priority, t.due_at,
       t.estimated_hours, t.actual_hours
FROM tasks_v2 t
WHERE t.task_status IN ('open','in_progress','blocked')
  AND t.deleted_at IS NULL
ORDER BY t.priority DESC, t.due_at ASC;
```
**Lifecycle/Retention:** Completed tasks retained for 1 year. Cancelled tasks purged after 90 days. Purged after 3 years.

---

### `task_assignments_v2`

**Purpose:** Maps users to tasks — supports multiple assignees per task.  
**Phase:** 6 | **Migration:** 026

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| task_id           | UUID           | NO       | -                        | FK to tasks_v2 |
| user_id           | UUID           | NO       | -                        | FK to users_v2 |
| is_lead           | BOOLEAN        | NO       | `false`                  | Whether this user is task lead |
| assigned_at       | TIMESTAMPTZ    | NO       | `now()`                  | When assigned |
| unassigned_at     | TIMESTAMPTZ    | YES      | NULL                     | When unassigned |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `task_id → tasks_v2(id)`, `user_id → users_v2(id)`  
**Indexes:** PK, `uniq_taskassign_task_user` (UNIQUE: `task_id, user_id, unassigned_at IS NULL`), `idx_taskassign_user` (BTREE)  
**Unique Constraints:** One active assignment per user per task  
**RLS:** Inherited from tasks_v2  
**Example Query:**
```sql
SELECT u.email, ta.is_lead, ta.assigned_at
FROM task_assignments_v2 ta
JOIN users_v2 u ON u.id = ta.user_id
WHERE ta.task_id = $1 AND ta.unassigned_at IS NULL
ORDER BY ta.is_lead DESC, ta.assigned_at ASC;
```
**Lifecycle/Retention:** Cascade delete with task. Historical assignments retained for audit trail.

---

## Domain: Knowledge

---

### `knowledge_articles_v2`

**Purpose:** Knowledge base articles for internal and customer-facing documentation.  
**Phase:** 7 | **Migration:** 030

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| category_id       | UUID           | YES      | NULL                     | FK to knowledge_categories_v2 |
| title             | TEXT           | NO       | -                        | Article title |
| slug              | TEXT           | NO       | -                        | URL-friendly identifier |
| content           | TEXT           | NO       | -                        | Article body (Markdown) |
| excerpt           | TEXT           | YES      | NULL                     | Short summary |
| article_status    | TEXT           | NO       | `'draft'`                | draft, published, archived |
| author_id         | UUID           | YES      | NULL                     | FK to users_v2 (author) |
| is_internal       | BOOLEAN        | NO       | `false`                  | Internal-only article |
| tags              | TEXT[]         | NO       | `'{}'::text[]`           | Tag array |
| view_count        | INTEGER        | NO       | `0`                      | Total views |
| helpful_count     | INTEGER        | NO       | `0`                      | Helpful votes |
| not_helpful_count | INTEGER        | NO       | `0`                      | Not helpful votes |
| published_at      | TIMESTAMPTZ    | YES      | NULL                     | When published |
| archived_at       | TIMESTAMPTZ    | YES      | NULL                     | When archived |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `category_id → knowledge_categories_v2(id)`, `author_id → users_v2(id)`  
**Indexes:** PK, `uniq_articles_slug` (UNIQUE, partial `WHERE deleted_at IS NULL`), `idx_articles_category` (BTREE), `idx_articles_status` (BTREE), `idx_articles_author` (BTREE), `idx_articles_tags` (GIN), `idx_articles_fts` (GIN, tsvector on `title || ' ' || content`), `idx_articles_view_count` (BTREE)  
**Unique Constraints:** slug (unique per active record)  
**RLS:** Public articles accessible to all; internal articles restricted by role  
**Example Query:**
```sql
SELECT ka.title, ka.slug, ka.excerpt, ka.view_count,
       kc.name AS category_name
FROM knowledge_articles_v2 ka
JOIN knowledge_categories_v2 kc ON kc.id = ka.category_id
WHERE ka.article_status = 'published' AND ka.deleted_at IS NULL
ORDER BY ka.view_count DESC
LIMIT 20;
```
**Lifecycle/Retention:** Published articles retained indefinitely. Archived articles retained for 3 years. Drafts purged after 1 year of inactivity.

---

### `knowledge_categories_v2`

**Purpose:** Hierarchical categories for knowledge articles with parent-child self-reference.  
**Phase:** 1 | **Migration:** 005

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| parent_id         | UUID           | YES      | NULL                     | Self-ref FK for hierarchy |
| name              | TEXT           | NO       | -                        | Category name |
| slug              | TEXT           | NO       | -                        | URL-friendly identifier |
| description       | TEXT           | YES      | NULL                     | Category description |
| icon              | TEXT           | YES      | NULL                     | Icon identifier |
| sort_order        | SMALLINT       | NO       | `0`                      | Display order |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether category is active |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `parent_id → knowledge_categories_v2(id)`  
**Indexes:** PK, `uniq_kbcats_slug` (UNIQUE, partial), `idx_kbcats_parent` (BTREE), `idx_kbcats_active` (BTREE, partial `WHERE is_active = true AND deleted_at IS NULL`), `idx_kbcats_sort` (BTREE)  
**Unique Constraints:** slug (active records)  
**RLS:** Admin/managers full access, all users read access  
**Example Query:**
```sql
SELECT kc.name, kc.slug, kc.sort_order,
       parent.name AS parent_name
FROM knowledge_categories_v2 kc
LEFT JOIN knowledge_categories_v2 parent ON parent.id = kc.parent_id
WHERE kc.is_active = true AND kc.deleted_at IS NULL
ORDER BY kc.sort_order;
```
**Lifecycle/Retention:** Cascade soft-delete to children. Inactive categories retained for 1 year.

---

## Domain: Inventory

---

### `inventory_items_v2`

**Purpose:** Master catalog of inventory items — parts, supplies, equipment, and tools.  
**Phase:** 7 | **Migration:** 032

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| sku               | TEXT           | NO       | -                        | Stock keeping unit |
| name              | TEXT           | NO       | -                        | Item name |
| description       | TEXT           | YES      | NULL                     | Item description |
| inventory_category| TEXT           | NO       | -                        | parts, supplies, equipment, tools |
| unit_of_measure   | TEXT           | NO       | `'each'`                 | each, box, lb, ft, liter, etc. |
| quantity_on_hand  | INTEGER        | NO       | `0`                      | Current stock level |
| quantity_committed| INTEGER        | NO       | `0`                      | Reserved/allocated quantity |
| reorder_point     | INTEGER        | NO       | `0`                      | Min stock before reorder |
| reorder_quantity  | INTEGER        | NO       | `0`                      | Qty to reorder |
| unit_cost_cents   | INTEGER        | YES      | NULL                     | Cost per unit in cents |
| unit_price_cents  | INTEGER        | YES      | NULL                     | Selling price in cents |
| supplier_info     | JSONB          | NO       | `'{}'::jsonb`            | Supplier details |
| location          | TEXT           | YES      | NULL                     | Warehouse/bin location |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether item is tracked |
| min_stock_level   | INTEGER        | NO       | `0`                      | Minimum stock alert level |
| max_stock_level   | INTEGER        | YES      | NULL                     | Maximum stock capacity |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_invitems_sku` (UNIQUE, partial `WHERE deleted_at IS NULL`), `idx_invitems_category` (BTREE), `idx_invitems_active` (BTREE, partial `WHERE is_active = true AND deleted_at IS NULL`), `idx_invitems_low_stock` (BTREE, partial `WHERE quantity_on_hand <= reorder_point AND is_active = true AND deleted_at IS NULL`), `idx_invitems_meta` (GIN)  
**Unique Constraints:** sku (active records)  
**RLS:** Admin/managers full CRUD, technicians read-only, viewers read-only  
**Example Query:**
```sql
SELECT ii.sku, ii.name, ii.quantity_on_hand, ii.quantity_committed,
       ii.reorder_point, ii.inventory_category
FROM inventory_items_v2 ii
WHERE ii.is_active = true AND ii.deleted_at IS NULL
  AND ii.quantity_on_hand <= ii.reorder_point
ORDER BY (ii.quantity_on_hand - ii.reorder_point) ASC;
```
**Lifecycle/Retention:** Active items retained indefinitely. Inactive items retained for 3 years. Deleted items purged after 5 years.

---

### `inventory_transactions_v2`

**Purpose:** Immutable log of all inventory movements — receipts, issues, returns, transfers, adjustments.  
**Phase:** 7 | **Migration:** 033

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| item_id           | UUID           | NO       | -                        | FK to inventory_items_v2 |
| transaction_type  | TEXT           | NO       | -                        | received, issued, returned, transferred, adjusted |
| quantity          | INTEGER        | NO       | -                        | Signed quantity (+/-) |
| reference_type    | TEXT           | YES      | NULL                     | Entity type (work_order, ticket, etc.) |
| reference_id      | UUID           | YES      | NULL                     | FK to the relevant entity |
| unit_cost_cents   | INTEGER        | YES      | NULL                     | Cost at time of transaction |
| batch_number      | TEXT           | YES      | NULL                     | Batch/lot number |
| notes             | TEXT           | YES      | NULL                     | Transaction notes |
| performed_by      | UUID           | YES      | NULL                     | FK to users_v2 |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `item_id → inventory_items_v2(id)`, `performed_by → users_v2(id)`  
**Indexes:** PK, `idx_invtrans_item` (BTREE), `idx_invtrans_type` (BTREE), `idx_invtrans_ref` (BTREE), `idx_invtrans_created` (BTREE), `idx_invtrans_item_created` (BTREE, composite: `item_id, created_at DESC`)  
**Unique Constraints:** None (immutable log)  
**RLS:** Admin full access, managers read-only  
**Example Query:**
```sql
SELECT it.transaction_type, it.quantity, it.notes, it.created_at,
       u.email AS performed_by_name
FROM inventory_transactions_v2 it
LEFT JOIN users_v2 u ON u.id = it.performed_by
WHERE it.item_id = $1
ORDER BY it.created_at DESC
LIMIT 50;
```
**Lifecycle/Retention:** Immutable — never deleted. Retained for 7 years, then archived to cold storage.

---

## Domain: Feedback

---

### `feedback_v2`

**Purpose:** Customer feedback records linked to tickets and work orders.  
**Phase:** 8 | **Migration:** 034

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| ticket_id         | UUID           | YES      | NULL                     | FK to tickets_v2 |
| customer_id       | UUID           | NO       | -                        | FK to customers_v2 |
| feedback_source   | TEXT           | NO       | -                        | post_service, followup, survey, portal, email |
| rating            | SMALLINT       | YES      | NULL                     | 1-5 rating scale |
| comment           | TEXT           | YES      | NULL                     | Free-text feedback |
| is_public         | BOOLEAN        | NO       | `false`                  | Can be displayed publicly |
| categories        | TEXT[]         | NO       | `'{}'::text[]`           | Feedback categories |
| ai_sentiment      | TEXT           | YES      | NULL                     | Sentiment analysis: positive, neutral, negative |
| ai_summary        | TEXT           | YES      | NULL                     | AI-generated summary |
| acknowledged      | BOOLEAN        | NO       | `false`                  | Whether management acknowledged |
| acknowledged_by   | UUID           | YES      | NULL                     | FK to users_v2 |
| acknowledged_at   | TIMESTAMPTZ    | YES      | NULL                     | When acknowledged |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** `ticket_id → tickets_v2(id)`, `customer_id → customers_v2(id)`, `acknowledged_by → users_v2(id)`  
**Indexes:** PK, `idx_feedback_ticket` (BTREE), `idx_feedback_customer` (BTREE), `idx_feedback_rating` (BTREE), `idx_feedback_source` (BTREE), `idx_feedback_sentiment` (BTREE), `idx_feedback_created` (BTREE), `idx_feedback_categories` (GIN)  
**Unique Constraints:** One feedback per ticket (application-enforced, not DB)  
**RLS:** Customer self-access, manager tenant access, admin full access  
**Example Query:**
```sql
SELECT f.rating, f.comment, f.feedback_source, f.ai_sentiment,
       t.ticket_number
FROM feedback_v2 f
JOIN tickets_v2 t ON t.id = f.ticket_id
WHERE f.rating IS NOT NULL AND f.deleted_at IS NULL
ORDER BY f.created_at DESC
LIMIT 20;
```
**Lifecycle/Retention:** Retained for 3 years. Anonymized after 2 years (customer_id removed). Purged after 5 years.

---

### `feedback_surveys_v2`

**Purpose:** Structured survey response data linked to feedback records.  
**Phase:** 8 | **Migration:** 035

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| feedback_id       | UUID           | NO       | -                        | FK to feedback_v2 |
| survey_name       | TEXT           | NO       | -                        | Survey identifier |
| question_key      | TEXT           | NO       | -                        | Question identifier |
| question_text     | TEXT           | NO       | -                        | Full question text |
| response_type     | TEXT           | NO       | -                        | rating, boolean, text, choice, multiple_choice |
| response_value    | TEXT           | YES      | NULL                     | Raw response value |
| rating_value      | SMALLINT       | YES      | NULL                     | Numeric rating (if applicable) |
| choice_values     | TEXT[]         | YES      | NULL                     | Selected choices |
| sort_order        | SMALLINT       | NO       | `0`                      | Question order |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `feedback_id → feedback_v2(id)`  
**Indexes:** PK, `idx_fbsurvey_feedback` (BTREE), `idx_fbsurvey_survey` (BTREE), `idx_fbsurvey_question` (BTREE), `idx_fbsurvey_feedback_question` (BTREE, composite: `feedback_id, question_key`)  
**Unique Constraints:** Unique composite: `(feedback_id, question_key)`  
**RLS:** Inherited from feedback_v2  
**Example Query:**
```sql
SELECT fs.question_text, fs.response_value, fs.rating_value
FROM feedback_surveys_v2 fs
WHERE fs.feedback_id = $1
ORDER BY fs.sort_order ASC;
```
**Lifecycle/Retention:** Cascade delete with feedback. Anonymized with parent feedback record.

---

## Domain: Notifications

---

### `notifications_v2`

**Purpose:** Outbound notification queue — tracks delivery lifecycle for all notification types.  
**Phase:** 9 | **Migration:** 036

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| user_id           | UUID           | YES      | NULL                     | FK to users_v2 (target) |
| template_id       | UUID           | YES      | NULL                     | FK to notification_templates_v2 |
| channel_id        | UUID           | YES      | NULL                     | FK to notification_channels_v2 |
| notification_type | TEXT           | NO       | -                        | Type discriminator |
| title             | TEXT           | YES      | NULL                     | Notification title |
| body              | TEXT           | YES      | NULL                     | Notification body content |
| channel           | TEXT           | NO       | -                        | email, sms, push, in_app |
| recipient_address | TEXT           | NO       | -                        | Email/phone/device token |
| notification_status| TEXT          | NO       | `'pending'`              | pending, sent, delivered, failed, read |
| sent_at           | TIMESTAMPTZ    | YES      | NULL                     | When sent |
| delivered_at      | TIMESTAMPTZ    | YES      | NULL                     | When delivered |
| read_at           | TIMESTAMPTZ    | YES      | NULL                     | When read (in-app) |
| failed_at         | TIMESTAMPTZ    | YES      | NULL                     | When failure occurred |
| error_message     | TEXT           | YES      | NULL                     | Delivery error |
| retry_count       | SMALLINT       | NO       | `0`                      | Current retry count |
| max_retries       | SMALLINT       | NO       | `3`                      | Max retries allowed |
| reference_type    | TEXT           | YES      | NULL                     | Related entity type |
| reference_id      | UUID           | YES      | NULL                     | Related entity ID |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** `user_id → users_v2(id)`, `template_id → notification_templates_v2(id)`, `channel_id → notification_channels_v2(id)`  
**Indexes:** PK, `idx_notif_user` (BTREE), `idx_notif_status` (BTREE), `idx_notif_type` (BTREE), `idx_notif_channel` (BTREE), `idx_notif_created` (BTREE), `idx_notif_ref` (BTREE), `idx_notif_pending` (BTREE, partial `WHERE notification_status = 'pending' AND deleted_at IS NULL`), `idx_notif_failed` (BTREE, partial `WHERE notification_status = 'failed' AND retry_count < max_retries AND deleted_at IS NULL`)  
**Unique Constraints:** None  
**RLS:** Self-service for own notifications, admin full access  
**Example Query:**
```sql
SELECT n.notification_type, n.title, n.channel, n.notification_status,
       n.sent_at, n.read_at
FROM notifications_v2 n
WHERE n.user_id = $1 AND n.deleted_at IS NULL
ORDER BY n.created_at DESC
LIMIT 50;
```
**Lifecycle/Retention:** Delivered/read notifications purged after 90 days. Failed notifications retained for 30 days for retry. Pending notifications retained for 7 days.

---

### `notification_templates_v2`

**Purpose:** Reusable notification message templates with variable substitution.  
**Phase:** 9 | **Migration:** 037

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| template_name     | TEXT           | NO       | -                        | Template identifier |
| template_type     | TEXT           | NO       | -                        | email, sms, push, in_app |
| subject           | TEXT           | YES      | NULL                     | Subject line (email/in-app) |
| body_text         | TEXT           | YES      | NULL                     | Plain-text body |
| body_html         | TEXT           | YES      | NULL                     | HTML body (email) |
| variables         | TEXT[]         | NO       | `'{}'::text[]`           | Expected variable names |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether template is in use |
| locale            | TEXT           | NO       | `'en'`                   | ISO 639-1 language code |
| version           | INTEGER        | NO       | `1`                      | Template version |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_notiftpl_name_type_locale` (UNIQUE: `template_name, template_type, locale`), `idx_notiftpl_type` (BTREE), `idx_notiftpl_active` (BTREE, partial `WHERE is_active = true AND deleted_at IS NULL`)  
**Unique Constraints:** Name + type + locale unique  
**RLS:** Admin/managers full access  
**Example Query:**
```sql
SELECT nt.template_name, nt.template_type, nt.subject, nt.is_active, nt.locale
FROM notification_templates_v2 nt
WHERE nt.is_active = true AND nt.deleted_at IS NULL
ORDER BY nt.template_name;
```
**Lifecycle/Retention:** Retained indefinitely. Inactive templates retained for 3 years.

---

### `notification_channels_v2`

**Purpose:** Channel configuration and provider credentials for notification delivery.  
**Phase:** 9 | **Migration:** 038

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| channel_name      | TEXT           | NO       | -                        | Human-readable name |
| channel_type      | TEXT           | NO       | -                        | email_smtp, email_api, sms_twilio, sms_aws, push_fcm, push_apns |
| provider_config   | JSONB          | NO       | `'{}'::jsonb`            | Provider credentials/endpoints (encrypted) |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether channel is active |
| default_sender    | TEXT           | YES      | NULL                     | Default from-address |
| rate_limit_per_minute | INTEGER | NO       | `60`                     | Max sends per minute |
| priority          | SMALLINT       | NO       | `10`                     | Channel priority (lower = higher) |
| last_health_check | TIMESTAMPTZ    | YES      | NULL                     | Last connectivity test |
| is_healthy        | BOOLEAN        | NO       | `true`                   | Health status |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_notifchan_type_name` (UNIQUE: `channel_type, channel_name`), `idx_notifchan_active` (BTREE, partial `WHERE is_active = true AND deleted_at IS NULL`), `idx_notifchan_healthy` (BTREE, partial `WHERE is_healthy = true AND is_active = true`)  
**Unique Constraints:** channel_type + channel_name unique  
**RLS:** Admin only  
**Example Query:**
```sql
SELECT nc.channel_name, nc.channel_type, nc.is_active, nc.is_healthy,
       nc.rate_limit_per_minute
FROM notification_channels_v2 nc
WHERE nc.deleted_at IS NULL
ORDER BY nc.priority ASC;
```
**Lifecycle/Retention:** Retained indefinitely. Inactive channels retained for 1 year.

---

## Domain: Administration

---

### `users_v2`

**Purpose:** All platform user accounts — agents, technicians, admins, managers, and customer portal users.  
**Phase:** 2 | **Migration:** 007

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| role_id           | UUID           | NO       | -                        | FK to user_roles_v2 |
| manager_id        | UUID           | YES      | NULL                     | Self-ref FK for hierarchy |
| email             | TEXT           | NO       | -                        | Login email (encrypted) |
| password_hash     | TEXT           | NO       | -                        | Argon2id hash |
| first_name        | TEXT           | NO       | -                        | First name |
| last_name         | TEXT           | NO       | -                        | Last name |
| phone             | TEXT           | YES      | NULL                     | Phone (E.164, encrypted) |
| avatar_url        | TEXT           | YES      | NULL                     | Profile image URL |
| user_status       | TEXT           | NO       | `'active'`               | active, inactive, suspended, locked |
| is_email_verified | BOOLEAN        | NO       | `false`                  | Email verified flag |
| is_mfa_enabled    | BOOLEAN        | NO       | `false`                  | MFA enabled flag |
| mfa_secret        | TEXT           | YES      | NULL                     | TOTP secret (encrypted) |
| last_login_at     | TIMESTAMPTZ    | YES      | NULL                     | Last successful login |
| last_login_ip     | INET           | YES      | NULL                     | IP of last login |
| login_count       | INTEGER        | NO       | `0`                      | Total login count |
| password_changed_at| TIMESTAMPTZ   | YES      | NULL                     | Last password change |
| locale            | TEXT           | NO       | `'en'`                   | ISO 639-1 language |
| timezone          | TEXT           | NO       | `'America/New_York'`     | IANA timezone |
| settings_config   | JSONB          | NO       | `'{}'::jsonb`            | User preferences |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** `role_id → user_roles_v2(id)`, `manager_id → users_v2(id)`  
**Indexes:** PK, `uniq_users_email` (UNIQUE, partial `WHERE deleted_at IS NULL`), `idx_users_role` (BTREE), `idx_users_status` (BTREE), `idx_users_manager` (BTREE), `idx_users_created` (BTREE), `idx_users_role_status` (BTREE, composite: `role_id, user_status`)  
**Unique Constraints:** email (active records)  
**RLS:** Self-service for profile, admin full access, manager access for subordinates  
**Example Query:**
```sql
SELECT u.email, u.first_name, u.last_name, u.user_status,
       ur.role_name, u.last_login_at
FROM users_v2 u
JOIN user_roles_v2 ur ON ur.id = u.role_id
WHERE u.deleted_at IS NULL
ORDER BY ur.role_name, u.last_name;
```
**Lifecycle/Retention:** Active users retained indefinitely. Suspended users retained for 3 years. Deleted users anonymized after 30 days, purged after 7 years.

---

### `user_roles_v2`

**Purpose:** Role definitions for the RBAC system.  
**Phase:** 1 | **Migration:** 006

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| role_name         | TEXT           | NO       | -                        | super_admin, admin, manager, agent, technician, dispatcher, customer, viewer |
| description       | TEXT           | YES      | NULL                     | Role description |
| is_system_role    | BOOLEAN        | NO       | `false`                  | System-managed role (not deletable) |
| priority          | SMALLINT       | NO       | `0`                      | Higher = more privileges |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_roles_name` (UNIQUE, partial `WHERE deleted_at IS NULL`)  
**Unique Constraints:** role_name (active records)  
**RLS:** Admin full access, all users read-only  
**Example Query:**
```sql
SELECT ur.role_name, ur.description, ur.priority,
       COUNT(u.id) AS user_count
FROM user_roles_v2 ur
LEFT JOIN users_v2 u ON u.role_id = ur.id AND u.deleted_at IS NULL
WHERE ur.deleted_at IS NULL
GROUP BY ur.id, ur.role_name, ur.description, ur.priority
ORDER BY ur.priority DESC;
```
**Lifecycle/Retention:** System roles never purged. Custom roles retained for 3 years after last use.

---

### `role_permissions_v2`

**Purpose:** Granular permission assignments — maps roles to specific action/resource combinations.  
**Phase:** 2 | **Migration:** 009

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| role_id           | UUID           | NO       | -                        | FK to user_roles_v2 |
| resource          | TEXT           | NO       | -                        | Resource name (e.g., 'tickets', 'work_orders') |
| action_type       | TEXT           | NO       | -                        | create, read, update, delete, manage |
| is_granted        | BOOLEAN        | NO       | `true`                   | true = grant, false = deny |
| conditions        | JSONB          | YES      | NULL                     | Optional condition expression |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `role_id → user_roles_v2(id)`  
**Indexes:** PK, `uniq_roleperm_role_res_action` (UNIQUE: `role_id, resource, action_type`), `idx_roleperm_role` (BTREE)  
**Unique Constraints:** One permission per role + resource + action  
**RLS:** Admin full access  
**Example Query:**
```sql
SELECT rp.resource, rp.action_type, rp.is_granted
FROM role_permissions_v2 rp
WHERE rp.role_id = $1
ORDER BY rp.resource, rp.action_type;
```
**Lifecycle/Retention:** Cascade delete with role. Retained indefinitely.

---

### `user_sessions_v2`

**Purpose:** Active session tracking for authentication and security monitoring.  
**Phase:** 2 | **Migration:** 008

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| user_id           | UUID           | NO       | -                        | FK to users_v2 |
| session_token     | TEXT           | NO       | -                        | Hashed session token |
| refresh_token     | TEXT           | YES      | NULL                     | Hashed refresh token |
| ip_address        | INET           | YES      | NULL                     | Client IP |
| user_agent        | TEXT           | YES      | NULL                     | User agent string |
| device_info       | TEXT           | YES      | NULL                     | Device description |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether session is active |
| started_at        | TIMESTAMPTZ    | NO       | `now()`                  | Session start |
| expires_at        | TIMESTAMPTZ    | NO       | -                        | Session expiry |
| last_activity_at  | TIMESTAMPTZ    | NO       | `now()`                  | Last request timestamp |
| ended_at          | TIMESTAMPTZ    | YES      | NULL                     | When session ended |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `user_id → users_v2(id)`  
**Indexes:** PK, `idx_usersess_user` (BTREE), `idx_usersess_active` (BTREE, partial `WHERE is_active = true`), `idx_usersess_expires` (BTREE), `idx_usersess_token` (BTREE, UNIQUE), `idx_usersess_refresh` (BTREE, UNIQUE)  
**Unique Constraints:** session_token unique, refresh_token unique  
**RLS:** Self-service (own sessions only), admin full access  
**Example Query:**
```sql
SELECT us.ip_address, us.device_info, us.started_at, us.last_activity_at
FROM user_sessions_v2 us
WHERE us.user_id = $1 AND us.is_active = true
ORDER BY us.last_activity_at DESC;
```
**Lifecycle/Retention:** Expired sessions purged after 24 hours. Logged-out sessions retained for 7 days for audit.

---

## Domain: Configuration

---

### `system_settings_v2`

**Purpose:** Global system configuration key-value store with typed values.  
**Phase:** 1 | **Migration:** 002

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| setting_key       | TEXT           | NO       | -                        | Unique setting key |
| setting_value     | JSONB          | NO       | -                        | Typed value (string, number, bool, object) |
| setting_type      | TEXT           | NO       | `'string'`               | string, number, boolean, json, array |
| description       | TEXT           | YES      | NULL                     | Setting description |
| category          | TEXT           | NO       | `'general'`              | Setting category |
| is_encrypted      | BOOLEAN        | NO       | `false`                  | Whether value is encrypted |
| is_public         | BOOLEAN        | NO       | `false`                  | Exposed via public API |
| version           | INTEGER        | NO       | `1`                      | Optimistic lock |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_by        | UUID           | YES      | NULL                     | FK to users_v2 |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_syssettings_key` (UNIQUE), `idx_syssettings_category` (BTREE)  
**Unique Constraints:** setting_key unique  
**RLS:** Admin full access, public settings read-only for all authenticated users  
**Example Query:**
```sql
SELECT ss.setting_key, ss.setting_value, ss.setting_type
FROM system_settings_v2 ss
WHERE ss.category = 'email' AND ss.is_encrypted = false
ORDER BY ss.setting_key;
```
**Lifecycle/Retention:** Retained indefinitely. Audit trail kept via audit_log_v2.

---

### `feature_flags_v2`

**Purpose:** Feature toggle management for gradual rollouts and A/B testing.  
**Phase:** 1 | **Migration:** 003

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| flag_name         | TEXT           | NO       | -                        | Unique flag name |
| flag_description  | TEXT           | YES      | NULL                     | Description of feature |
| is_enabled        | BOOLEAN        | NO       | `false`                  | Master toggle |
| rollout_percentage| SMALLINT       | NO       | `100`                    | 0-100 rollout percentage |
| targeting_rules   | JSONB          | NO       | `'{}'::jsonb`            | User/account targeting rules |
| enabled_for_roles | TEXT[]         | NO       | `'{}'::text[]`           | Roles that see this feature |
| enabled_for_accounts| UUID[]       | NO       | `'{}'::uuid[]`           | Specific accounts |
| expires_at        | TIMESTAMPTZ    | YES      | NULL                     | Auto-disable date |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_by        | UUID           | YES      | NULL                     | FK to users_v2 |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_featureflags_name` (UNIQUE), `idx_featureflags_enabled` (BTREE, partial `WHERE is_enabled = true`)  
**Unique Constraints:** flag_name unique  
**RLS:** Admin full access, all users read-only  
**Example Query:**
```sql
SELECT flag_name, is_enabled, rollout_percentage
FROM feature_flags_v2
WHERE is_enabled = true;
```
**Lifecycle/Retention:** Expired flags retained for 90 days after expiration. Retained indefinitely for audit.

---

### `connectors_v2`

**Purpose:** Third-party integration connection configurations (secret store).  
**Phase:** 1 | **Migration:** 004

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| connector_name    | TEXT           | NO       | -                        | Human-readable name |
| connector_type    | TEXT           | NO       | -                        | Type: stripe, quickbooks, hubspot, slack, zapier, custom |
| api_key           | BYTEA          | YES      | NULL                     | Encrypted API key |
| secret            | BYTEA          | YES      | NULL                     | Encrypted API secret |
| endpoint_url      | TEXT           | YES      | NULL                     | Custom endpoint |
| config            | JSONB          | NO       | `'{}'::jsonb`            | Connector-specific config |
| is_enabled        | BOOLEAN        | NO       | `true`                   | Whether connector is active |
| last_sync_at      | TIMESTAMPTZ    | YES      | NULL                     | Last data sync timestamp |
| sync_frequency    | TEXT           | YES      | NULL                     | daily, hourly, realtime |
| health_status     | TEXT           | NO       | `'unknown'`              | healthy, degraded, down, unknown |
| error_log         | JSONB          | NO       | `'[]'::jsonb`            | Recent error log |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_connectors_name` (UNIQUE, partial `WHERE deleted_at IS NULL`), `idx_connectors_type` (BTREE), `idx_connectors_enabled` (BTREE, partial `WHERE is_enabled = true`)  
**Unique Constraints:** connector_name (active records)  
**RLS:** Admin only (all operations)  
**Example Query:**
```sql
SELECT cn.connector_name, cn.connector_type, cn.health_status,
       cn.last_sync_at, cn.is_enabled
FROM connectors_v2 cn
WHERE cn.deleted_at IS NULL
ORDER BY cn.connector_type, cn.connector_name;
```
**Lifecycle/Retention:** Retained indefinitely while active. Disabled connectors retained for 1 year. Secrets purged on deletion. Full purge after 3 years.

---

### `reference_data_v2`

**Purpose:** Extensible lookup values for all enum-like data across the system.  
**Phase:** 1 | **Migration:** 001

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| category          | TEXT           | NO       | -                        | Group identifier (e.g., 'skill', 'industry', 'region') |
| value             | TEXT           | NO       | -                        | Unique value within category |
| label             | TEXT           | NO       | -                        | Display label |
| description       | TEXT           | YES      | NULL                     | Meaning of value |
| sort_order        | SMALLINT       | NO       | `0`                      | Display sort order |
| is_active         | BOOLEAN        | NO       | `true`                   | Whether value is in use |
| meta_data         | JSONB          | NO       | `'{}'::jsonb`            | Extensible metadata |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| created_by        | UUID           | YES      | NULL                     | - |
| updated_by        | UUID           | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_refdata_category_value` (UNIQUE: `category, value`), `idx_refdata_category` (BTREE), `idx_refdata_active` (BTREE, partial `WHERE is_active = true`)  
**Unique Constraints:** category + value unique  
**RLS:** Admin full CRUD, all users read-only  
**Example Query:**
```sql
SELECT rd.value, rd.label, rd.sort_order
FROM reference_data_v2 rd
WHERE rd.category = 'skill' AND rd.is_active = true
ORDER BY rd.sort_order, rd.label;
```
**Lifecycle/Retention:** Retained indefinitely. Values are never hard-deleted; marked is_active = false instead.

---

## Domain: Analytics

---

### `analytics_reports_v2`

**Purpose:** Stored report definitions with saved parameters and scheduling info.  
**Phase:** 10 | **Migration:** 039

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| report_name       | TEXT           | NO       | -                        | Report name |
| report_type       | TEXT           | NO       | -                        | Type: ticket_summary, technician_perf, customer_health, financial, custom |
| description       | TEXT           | YES      | NULL                     | Description |
| query_definition  | JSONB          | NO       | -                        | Report query parameters |
| visual_config     | JSONB          | NO       | `'{}'::jsonb`            | Chart/table configuration |
| parameters        | JSONB          | NO       | `'{}'::jsonb`            | Default report parameters |
| is_scheduled      | BOOLEAN        | NO       | `false`                  | Whether report is scheduled |
| created_by        | UUID           | YES      | NULL                     | FK to users_v2 |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| deleted_at        | TIMESTAMPTZ    | YES      | NULL                     | - |

**Foreign Keys:** None  
**Indexes:** PK, `uniq_analyticsreports_name` (UNIQUE, partial `WHERE deleted_at IS NULL`), `idx_analyticsreports_type` (BTREE), `idx_analyticsreports_creator` (BTREE), `idx_analyticsreports_scheduled` (BTREE, partial `WHERE is_scheduled = true AND deleted_at IS NULL`)  
**Unique Constraints:** report_name (active records)  
**RLS:** Owner access, manager tenant access, admin full access  
**Example Query:**
```sql
SELECT ar.report_name, ar.report_type, ar.is_scheduled,
       u.email AS created_by_email
FROM analytics_reports_v2 ar
JOIN users_v2 u ON u.id = ar.created_by
WHERE ar.deleted_at IS NULL
ORDER BY ar.report_type, ar.report_name;
```
**Lifecycle/Retention:** Retained indefinitely. Orphaned reports (creator deleted) retained for 1 year.

---

### `analytics_schedules_v2`

**Purpose:** Scheduling configuration for automated report generation and delivery.  
**Phase:** 10 | **Migration:** 040

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| report_id         | UUID           | NO       | -                        | FK to analytics_reports_v2 |
| frequency         | TEXT           | NO       | -                        | daily, weekly, biweekly, monthly, quarterly, yearly |
| cron_expression   | TEXT           | YES      | NULL                     | Custom cron expression |
| day_of_week       | SMALLINT       | YES      | NULL                     | 0=Sun, 6=Sat |
| day_of_month      | SMALLINT       | YES      | NULL                     | 1-31 |
| time_of_day       | TIME           | NO       | -                        | HH:MM in system timezone |
| timezone          | TEXT           | NO       | `'America/New_York'`     | IANA timezone |
| recipients        | TEXT[]         | NO       | `'{}'::text[]`           | Email recipient list |
| format            | TEXT           | NO       | `'pdf'`                  | pdf, csv, xlsx, html |
| include_charts    | BOOLEAN        | NO       | `true`                   | Include visualizations |
| last_run_at       | TIMESTAMPTZ    | YES      | NULL                     | Last execution time |
| next_run_at       | TIMESTAMPTZ    | YES      | NULL                     | Next scheduled run |
| is_active         | BOOLEAN        | NO       | `true`                   | Schedule active flag |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |
| updated_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `report_id → analytics_reports_v2(id)`  
**Indexes:** PK, `idx_analyticssched_report` (BTREE), `idx_analyticssched_next_run` (BTREE, partial `WHERE is_active = true AND next_run_at IS NOT NULL`), `idx_analyticssched_frequency` (BTREE)  
**Unique Constraints:** One schedule per report  
**RLS:** Inherited from analytics_reports_v2  
**Example Query:**
```sql
SELECT ar.report_name, asched.frequency, asched.next_run_at,
       asched.format, asched.recipients
FROM analytics_schedules_v2 asched
JOIN analytics_reports_v2 ar ON ar.id = asched.report_id
WHERE asched.is_active = true
ORDER BY asched.next_run_at ASC;
```
**Lifecycle/Retention:** Cascade delete with report. Inactive schedules retained for 90 days.

---

## Domain: Audit

---

### `audit_log_v2`

**Purpose:** Immutable audit trail for all data-modifying operations across the platform.  
**Phase:** 10 | **Migration:** 041

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| event_id          | UUID           | YES      | NULL                     | FK to events_v2 |
| table_name        | TEXT           | NO       | -                        | Affected table |
| record_id         | UUID           | NO       | -                        | Affected record PK |
| action_type       | TEXT           | NO       | -                        | create, read, update, delete, manage |
| old_values        | JSONB          | YES      | NULL                     | Snapshot before change |
| new_values        | JSONB          | YES      | NULL                     | Snapshot after change |
| changed_fields    | TEXT[]         | YES      | NULL                     | List of changed column names |
| performed_by      | UUID           | YES      | NULL                     | FK to users_v2 |
| performed_by_role | TEXT           | YES      | NULL                     | Role at time of action |
| ip_address        | INET           | YES      | NULL                     | Source IP |
| user_agent        | TEXT           | YES      | NULL                     | User agent |
| session_id        | UUID           | YES      | NULL                     | FK to user_sessions_v2 |
| correlation_id    | TEXT           | YES      | NULL                     | Request correlation ID |
| context           | JSONB          | NO       | `'{}'::jsonb`            | Additional context |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** `event_id → events_v2(id)`, `performed_by → users_v2(id)`  
**Indexes:** PK, `idx_auditlog_table` (BTREE), `idx_auditlog_action` (BTREE), `idx_auditlog_user` (BTREE), `idx_auditlog_record` (BTREE), `idx_auditlog_created` (BTREE), `idx_auditlog_correlation` (BTREE), `idx_auditlog_table_action` (BTREE, composite: `table_name, action_type`), `idx_auditlog_search` (GIN on `(to_tsvector('english', COALESCE(old_values::text, '') || ' ' || COALESCE(new_values::text, '')))`), `idx_auditlog_created_month` (BTREE, on `date_trunc('month', created_at)`)  
**Unique Constraints:** None  
**RLS:** Admin full access, manager read-only for tenant scope  
**Example Query:**
```sql
SELECT al.table_name, al.action_type, al.record_id, al.changed_fields,
       al.created_at, u.email AS performed_by_email
FROM audit_log_v2 al
LEFT JOIN users_v2 u ON u.id = al.performed_by
WHERE al.table_name = 'tickets_v2'
  AND al.created_at >= $1
ORDER BY al.created_at DESC
LIMIT 100;
```
**Lifecycle/Retention:** Retained for 7 years. Partitioned by month. Archived to cold storage after 7 years. Never deleted.

---

### `events_v2`

**Purpose:** Domain event store — records all business events for eventual consistency, webhooks, and replay.  
**Phase:** 10 | **Migration:** 042

| Column            | Type           | Nullable | Default                  | Description |
|-------------------|----------------|----------|--------------------------|-------------|
| id                | UUID           | NO       | `gen_random_uuid()`      | Primary key |
| event_type        | TEXT           | NO       | -                        | Fully qualified event name (e.g., 'ticket.created') |
| event_version     | SMALLINT       | NO       | `1`                      | Event schema version |
| aggregate_type    | TEXT           | NO       | -                        | Entity type (ticket, customer, etc.) |
| aggregate_id      | UUID           | NO       | -                        | Entity ID |
| payload           | JSONB          | NO       | -                        | Event data payload |
| metadata          | JSONB          | NO       | `'{}'::jsonb`            | Event metadata (source, causation, etc.) |
| correlation_id    | TEXT           | YES      | NULL                     | Request correlation ID |
| causation_id      | UUID           | YES      | NULL                     | ID of the event that caused this |
| published         | BOOLEAN        | NO       | `false`                  | Whether published to event bus |
| published_at      | TIMESTAMPTZ    | YES      | NULL                     | When published |
| created_at        | TIMESTAMPTZ    | NO       | `now()`                  | - |

**Foreign Keys:** None  
**Indexes:** PK, `idx_events_type` (BTREE), `idx_events_aggregate` (BTREE), `idx_events_created` (BTREE), `idx_events_unpublished` (BTREE, partial `WHERE published = false`), `idx_events_type_created` (BTREE, composite: `event_type, created_at DESC`), `idx_events_correlation` (BTREE), `idx_events_payload` (GIN)  
**Unique Constraints:** None  
**RLS:** Admin full access, managers read-only  
**Example Query:**
```sql
SELECT e.event_type, e.event_version, e.aggregate_type, e.aggregate_id,
       e.payload, e.created_at
FROM events_v2 e
WHERE e.aggregate_type = 'ticket' AND e.aggregate_id = $1
ORDER BY e.created_at ASC;
```
**Lifecycle/Retention:** Retained for 30 days for active processing. Archived to event store (Kafka/S3) after 30 days. DB records purged after 90 days.

---

> **Document Maintainers:** Database Engineering Team  
> **Review Cycle:** Quarterly  
> **Last Updated:** June 2026
