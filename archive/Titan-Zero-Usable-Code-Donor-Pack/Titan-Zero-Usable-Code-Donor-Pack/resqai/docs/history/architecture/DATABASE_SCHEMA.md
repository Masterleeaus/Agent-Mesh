# ResQAI — Database Schema (Extracted from Lemma Pod)

**Pod:** ResQAI Customer Support Pod
**Extracted:** 2026-06-25
**Tables:** 9 (all shared — `enable_rls: false`, `visibility: POD`)

---

## Table: `customers` (14 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | | |
| phone | text | | |
| email | text | | |
| address | text | | |
| status | enum | | See ENUMs below |
| notes | text | | |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `customers.status`:** `active`, `in_dispute`, `dormant`, `at_risk`, `service_due`

**Sample records:**
| Name | Status | Email | Phone | Notes |
|---|---|---|---|---|
| Marcus Patel | active | marcus.p@example.com | (415) 555-0524 | EV charger install, Level 2 |
| Yuki Tanaka | in_dispute | yuki.t@example.com | (415) 555-0188 | Third visit in 4 months for bathroom leak |
| Daniel Cooper | dormant | d.cooper@example.com | (650) 555-0357 | Outdoor outlet, out of pocket last spring |
| Angela Martinez | active | angela.m@example.com | (408) 555-0318 | Two remote-controlled ceiling fans |
| Christopher Lee | active | c.lee@example.com | (510) 555-0499 | Bosch dishwasher, 3 yrs old |

---

## Table: `technicians` (8 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| name | text | | |
| skill | enum | | See ENUMs below |
| availability | enum | | See ENUMs below |
| rating | float | | |
| status | enum | | See ENUMs below |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `technicians.skill`:** `plumbing`, `hvac`, `electrical`, `appliance`, `general_maintenance`
**ENUM `technicians.availability`:** `available`, `busy`, `off_shift`
**ENUM `technicians.status`:** `active`

**Sample records:**
| Name | Skill | Availability | Rating | Status |
|---|---|---|---|---|
| Diego Hernandez | plumbing | available | 4.8 | active |
| Anna Schultz | hvac | off_shift | 4.7 | active |
| Brandon wright | hvac | busy | 4.2 | active |
| Sofia Martinez | general_maintenance | available | 4.5 | active |
| Kevin O'Brien | appliance | available | 4.6 | active |

---

## Table: `tickets` (14 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| customer_name | text | | |
| channel | enum | | See ENUMs below |
| subject | text | | |
| message | text | | |
| request_type | enum | | See ENUMs below |
| urgency | enum | | See ENUMs below |
| suggested_owner | text | nullable | |
| owner | text | nullable | |
| draft_reply | text | nullable | |
| human_notes | text | nullable | |
| approved_to_send | boolean | nullable | |
| status | enum | | See ENUMs below |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `tickets.channel`:** `email`, `chat`, `sms`, `phone`, `web`
**ENUM `tickets.request_type`:** `new_booking`, `reschedule`, `cancellation`, `complaint`, `follow_up`, `general_inquiry`
**ENUM `tickets.urgency`:** `low`, `normal`, `high`, `urgent`
**ENUM `tickets.status`:** `new`, `classified`, `drafted`, `approved_to_send`, `sent`, `closed`

**Sample records:**
| Customer Name | Channel | Request Type | Urgency | Status |
|---|---|---|---|---|
| Marcus Patel | email | general_inquiry | normal | classified |
| James Rodriguez | email | general_inquiry | low | new |
| Mark Reilly | chat | general_inquiry | low | new |
| Sarah Mitchell | email | reschedule | normal | classified |
| Daniel Cooper | email | new_booking | low | new |

---

## Table: `appointments` (15 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| customer_id | uuid | FK → customers.id | |
| service_type | enum | | See ENUMs below |
| date | datetime | | |
| status | enum | | See ENUMs below |
| technician_id | uuid | nullable, FK → technicians.id | |
| notes | text | | |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `appointments.service_type`:** `ac_repair`, `ac_maintenance`, `appliance_repair`, `plumbing_repair`, `electrical_repair`, `general_maintenance`, `installation`
**ENUM `appointments.status`:** `scheduled`, `in_progress`, `completed`, `needs_followup`, `cancelled`

**Sample records:**
| Customer ID | Service Type | Date | Status | Technician ID |
|---|---|---|---|---|
| b7d3815c... | ac_maintenance | 2026-07-01 | scheduled | c000f9c1... |
| 82b49097... | electrical_repair | 2026-06-04 | completed | 895a7fc6... |
| 889138f7... | plumbing_repair | 2026-06-09 | completed | c123930c... |
| 889138f7... | plumbing_repair | 2026-06-19 | completed | c123930c... |
| 0068416b... | electrical_repair | 2026-06-29 | scheduled | null |

---

## Table: `disputes` (4 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|---|
| id | uuid | PK | |
| appointment_id | uuid | FK → appointments.id | |
| customer_claim | text | | |
| provider_claim | text | | |
| evidence_summary | text | | |
| recommended_resolution | enum | nullable | See ENUMs below |
| resolution_reason | text | nullable | |
| confidence | float | nullable | |
| status | enum | | See ENUMs below |
| human_notes | text | nullable | Human override notes (written by app) |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `disputes.status`:** `open`, `analyzing`, `recommendation_ready`, `approved`, `rejected`, `closed`
**ENUM `disputes.recommended_resolution` (from agent output spec):** `full_refund`, `partial_refund`, `redo_service`, `discount_credit`, `no_action`, `escalate_legal`

**All records:**
| Status | Appointment ID | Customer Claim Summary |
|---|---|---|
| recommendation_ready | 69766795... | Same circuit tripped 2 weeks after breaker replacement |
| open | 1fa5bb9e... | $320 diagnostic fee when quote was expected |
| analyzing | 9dd1d483... | Furnace still won't start after igniter replacement |
| open | 67cfb437... | Bathroom floor wet again 15 days after repair |

---

## Table: `tasks` (12 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| title | text | | |
| owner | text | | |
| priority | enum | | See ENUMs below |
| status | enum | | See ENUMs below |
| due_date | date | | |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `tasks.priority`:** `urgent`, `high`, `normal`, `low`
**ENUM `tasks.status`:** `open`, `in_progress`, `blocked`, `done`, `overdue`

**Sample records:**
| Title | Owner | Priority | Status | Due Date |
|---|---|---|---|---|
| Confirm dishwasher repair resolved for James Rodriguez | technician_lead | high | open | 2026-06-26 |
| Call Daniel Cooper (dormant) — urgent re-engagement | ops_manager | urgent | open | 2026-06-26 |
| Pull invoice history for Maria Chen for resolution | Zoe (billing) | high | open | 2026-06-24 |
| Review Yuki Tanaka dispute evidence | Marcus (manager) | urgent | open | 2026-06-24 |
| Compliance: file quarterly refrigerant log | office | high | open | 2026-06-23 |

---

## Table: `operations_log` (13 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| action | text | | Free-text action name |
| result | text | | Free-text result summary |
| timestamp | datetime | | when the action occurred |
| actor | text | | who/what performed the action |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**Sample records:**
| Action | Result | Actor |
|---|---|---|
| account_health_scan | scanned 14 accounts; healthy=13 watch=0 slipping=0 critical=1 | account_health_scan |
| account_health_scan | scanned 14 accounts; healthy=11 watch=2 slipping=0 critical=1 | account_health_scan |
| support-reply-drafter — drafted | Drafted apology + 4-hour ETA for Sarah Mitchell. | support-reply-drafter |

---

## Table: `accounts` (14 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| customer_id | uuid | FK → customers.id | |
| name | text | | |
| phone | text | nullable | |
| email | text | | |
| relationship_status | enum | | See ENUMs below |
| primary_service_type | enum | | See ENUMs below |
| owner | text | | |
| last_contact_date | date | | |
| last_service_date | date | | |
| next_follow_up_due | date | nullable | |
| lifetime_jobs | integer | | |
| lifetime_revenue_cents | integer | | |
| open_disputes | integer | | |
| open_followups | integer | | |
| overdue_followups | integer | | |
| health | enum | | See ENUMs below |
| health_score | float | | |
| notes | text | | |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `accounts.relationship_status`:** `active`, `watch`, `at_risk`, `in_dispute`, `dormant`, `won_back`, `churned` (also `new` from function code)
**ENUM `accounts.primary_service_type`:** `plumbing`, `electrical`, `hvac`, `appliance`, `general_maintenance`
**ENUM `accounts.health`:** `healthy`, `watch`, `slipping`, `critical`

**Sample records:**
| Name | Relationship | Health | Score | Lifetime Rev | Jobs |
|---|---|---|---|---|---|
| Yuki Tanaka | in_dispute | healthy | 0.85 | $1,250 | 4 |
| Daniel Cooper | dormant | critical | 0.207 | $185 | 1 |
| Angela Martinez | active | healthy | 0.95 | $420 | 2 |
| Christopher Lee | active | healthy | 1.0 | $380 | 3 |
| Marcus Patel | active | healthy | 1.0 | $890 | 3 |

---

## Table: `followups` (15 records)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| id | uuid | PK | |
| account_id | uuid | FK → accounts.id | |
| customer_id | uuid | FK → customers.id | |
| type | enum | | See ENUMs below |
| subject | text | | |
| status | enum | | See ENUMs below |
| priority | enum | | See ENUMs below |
| due_date | date | | |
| completed_at | datetime | nullable | |
| owner | text | | |
| related_appointment_id | uuid | nullable, FK → appointments.id | |
| related_ticket_id | uuid | nullable, FK → tickets.id | |
| related_dispute_id | uuid | nullable, FK → disputes.id | |
| notes | text | nullable | |
| created_at | timestamptz | system | |
| updated_at | timestamptz | system | |

**ENUM `followups.type`:** `post_service`, `maintenance_reminder`, `check_in`, `quote_followup`, `dispute_followup`, `win_back`, `renewal`, `nps_survey`
**ENUM `followups.status`:** `pending`, `in_progress`, `completed`, `missed` (from function code)
**ENUM `followups.priority`:** `urgent`, `high`, `normal`, `low`

**Sample records:**
| Type | Subject | Status | Priority | Due Date | Owner |
|---|---|---|---|---|---|
| post_service | Verify bathroom dry + no recurrence | pending | high | 2026-06-27 | csr |
| maintenance_reminder | Pre-cold-snap furnace check | pending | high | 2026-06-30 | technician_lead |
| quote_followup | Follow up on water heater replacement quote | pending | high | 2026-06-24 | csr |
| check_in | Confirm last visit resolved no-hot-water issue | pending | high | 2026-06-28 | csr |
| dispute_followup | Confirm updated evidence package sent to manager | pending | urgent | 2026-06-22 | ops_manager |

---

## Entity-Relationship Summary

```
customers ──┬──< appointments (customer_id FK)
            ├──< accounts (customer_id FK)
            └──< followups (customer_id FK)

technicians ──< appointments (technician_id FK)

appointments ──< disputes (appointment_id FK)
             └──< followups (related_appointment_id FK)

accounts ──< followups (account_id FK)

tickets ──< followups (related_ticket_id FK)

disputes ──< followups (related_dispute_id FK)
```

All tables use UUID primary keys and have `created_at`/`updated_at` timestamp columns. No RLS is enabled — all tables are pod-shared (`visibility: POD`).

## Indexes
Not yet extracted. Need to query `information_schema` or export DDL from the pod.

## Record Count Summary

| Table | Records |
|---|---|
| customers | 14 |
| technicians | 8 |
| tickets | 14 |
| appointments | 15 |
| disputes | 4 |
| tasks | 12 |
| operations_log | 13 |
| accounts | 14 |
| followups | 15 |
| **Total** | **109** |

---

*Source files: `database/docs/*.json` contain full record dumps per table.*
