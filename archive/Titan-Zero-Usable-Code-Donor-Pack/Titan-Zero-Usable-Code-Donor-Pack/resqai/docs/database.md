# ResQAI — Database

## Overview

9 tables with 109 total records. All tables are shared (`enable_rls: false`, `visibility: POD`). Schemas and seed data were extracted from the Lemma pod and stored in `database/docs/`.

## Entity-Relationship Diagram

```
customers ──< appointments >── technicians
    │              │
    │              └──< disputes
    │
    └──< accounts ──< followups
```

## Table Reference

### customers (14 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| phone | text | |
| email | text | |
| address | text | |
| status | enum | active, in_dispute, dormant, at_risk, service_due |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### technicians (8 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| skill | enum | plumbing, hvac, electrical, appliance, general_maintenance |
| availability | enum | available, busy, off_shift |
| rating | float | |
| status | enum | active |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### tickets (14 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_name | text | |
| channel | enum | email, chat, sms, phone, web |
| subject | text | |
| message | text | |
| request_type | enum | new_booking, reschedule, cancellation, complaint, follow_up, general_inquiry |
| urgency | enum | low, normal, high, urgent |
| suggested_owner | text | |
| owner | text | |
| draft_reply | text | |
| human_notes | text | |
| approved_to_send | boolean | |
| status | enum | new, classified, drafted, approved_to_send, sent, closed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### appointments (15 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers.id |
| service_type | enum | ac_repair, ac_maintenance, appliance_repair, plumbing_repair, electrical_repair, general_maintenance, installation |
| date | timestamptz | |
| status | enum | scheduled, in_progress, completed, needs_followup, cancelled |
| technician_id | uuid | FK → technicians.id |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### disputes (4 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| appointment_id | uuid | FK → appointments.id |
| customer_claim | text | |
| provider_claim | text | |
| evidence_summary | text | |
| recommended_resolution | enum | full_refund, partial_refund, redo_service, discount_credit, no_action, escalate_legal |
| resolution_reason | text | |
| confidence | float | |
| status | enum | open, analyzing, recommendation_ready, approved, rejected, closed |
| human_notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### tasks (12 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| owner | text | |
| priority | enum | urgent, high, normal, low |
| status | enum | open, in_progress, blocked, done, overdue |
| due_date | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### operations_log (13 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| action | text | |
| result | text | |
| timestamp | timestamptz | |
| actor | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### accounts (14 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| customer_id | uuid | FK → customers.id |
| name | text | |
| phone | text | |
| email | text | |
| relationship_status | enum | new, active, watch, at_risk, in_dispute, dormant, won_back, churned |
| primary_service_type | enum | plumbing, electrical, hvac, appliance, general_maintenance |
| owner | text | |
| last_contact_date | timestamptz | |
| last_service_date | timestamptz | |
| next_follow_up_due | timestamptz | |
| lifetime_jobs | integer | |
| lifetime_revenue_cents | integer | |
| open_disputes | integer | |
| open_followups | integer | |
| overdue_followups | integer | |
| health | enum | healthy, watch, slipping, critical |
| health_score | float | |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### followups (15 records)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| account_id | uuid | FK → accounts.id |
| customer_id | uuid | FK → customers.id |
| type | enum | post_service, maintenance_reminder, check_in, quote_followup, dispute_followup, win_back, renewal, nps_survey |
| subject | text | |
| status | enum | pending, in_progress, completed, missed |
| priority | enum | urgent, high, normal, low |
| due_date | timestamptz | |
| completed_at | timestamptz | |
| owner | text | |
| related_appointment_id | uuid | FK → appointments.id |
| related_ticket_id | uuid | FK → tickets.id |
| related_dispute_id | uuid | FK → disputes.id |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Foreign Key Relationships

| Source | FK Column | Target |
|--------|-----------|--------|
| appointments | customer_id | customers.id |
| appointments | technician_id | technicians.id |
| disputes | appointment_id | appointments.id |
| accounts | customer_id | customers.id |
| followups | account_id | accounts.id |
| followups | customer_id | customers.id |
| followups | related_appointment_id | appointments.id |
| followups | related_ticket_id | tickets.id |
| followups | related_dispute_id | disputes.id |

## Migration

One migration exists at `database/migrations/001_tickets_add_status_values_and_column.sql` — adds `approved_to_send`, `sent`, `closed` ENUM values and `approved_to_send` boolean column to the tickets table.

## Seed Data

Raw JSON record dumps are stored in `database/seeds/` for all 9 tables plus 2 function export files.

---

## Database Review Summary

*Derived from `docs/DATABASE_REVIEW.md` (archived).*

### Naming Consistency: 7/10
All table names are lowercase plural, columns are `snake_case`, primary keys are `id` (uuid). Inconsistencies: `operations_log` uses underscore while others are simple plural; `done` in tasks vs `completed` in other tables.

### Field Consistency: 8/10
Well normalized. Minor gaps: `appointments` missing denormalized `customer_name`; `operations_log` missing `entity_type`/`entity_id` for linking operations to records.

### Enum Consistency: 6/10
Each table's `status` field has different allowed values despite same name. Tasks use `done` for completion, others use `completed`. Tickets start as `new`, disputes and tasks start as `open`.

### Indexes: 3/10
No migration-defined indexes. ~17-20 indexes recommended based on query patterns (status filters, date sorts, foreign key joins across tickets, appointments, disputes, accounts, followups).

### Migration Coverage: 2/10
Only 1 migration exists for 9 tables (`001_tickets_add_status_values_and_column.sql`).

### Overall Assessment
| Category | Score | Key Issue |
|----------|-------|-----------|
| Naming | 7/10 | `operations_log` naming, `done` vs `completed` |
| Fields | 8/10 | Minor denormalization opportunities |
| Nullable | 9/10 | All correctly optional in TypeScript types |
| Enums | 6/10 | Inconsistent initial statuses |
| Indexes | 3/10 | No indexes for any query pattern |
| Migrations | 2/10 | Only 1 migration for 9 tables | 
