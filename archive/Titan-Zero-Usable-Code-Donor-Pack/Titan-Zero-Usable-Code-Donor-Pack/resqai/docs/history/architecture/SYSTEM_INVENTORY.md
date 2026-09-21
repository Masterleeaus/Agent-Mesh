# ResQAI — System Inventory (Updated with Extracted Data)

**Extracted from Lemma Pod:** 2026-06-25
**Pod:** ResQAI Customer Support Pod

---

## Tables

| Table | Columns | Records | RLS | PK | ENUMs |
|---|---|---|---|---|---|
| customers | id, name, phone, email, address, status, notes, created_at, updated_at | 14 | No | id | status: active, in_dispute, dormant, at_risk, service_due |
| technicians | id, name, skill, availability, rating, status, created_at, updated_at | 8 | No | id | skill: plumbing, hvac, electrical, appliance, general_maintenance; availability: available, busy, off_shift; status: active |
| tickets | id, customer_name, channel, subject, message, request_type, urgency, suggested_owner, owner, draft_reply, human_notes, status, created_at, updated_at | 14 | No | id | channel: email, chat, sms, phone, web; request_type: new_booking, reschedule, cancellation, complaint, follow_up, general_inquiry; urgency: low, normal, high, urgent; status: new, classified |
| appointments | id, customer_id, service_type, date, status, technician_id, notes, created_at, updated_at | 15 | No | id | service_type: ac_maintenance, ac_repair, appliance_repair, electrical_repair, plumbing_repair, installation; status: scheduled, completed, in_progress, needs_followup |
| disputes | id, appointment_id, customer_claim, provider_claim, evidence_summary, recommended_resolution, resolution_reason, confidence, status, created_at, updated_at | 4 | No | id | status: open, analyzing, recommendation_ready |
| tasks | id, title, owner, priority, status, due_date, created_at, updated_at | 12 | No | id | priority: urgent, high, normal, low; status: open, in_progress |
| operations_log | id, action, result, timestamp, actor, created_at, updated_at | 13 | No | id | (free text, no enums) |
| accounts | id, customer_id, name, phone, email, relationship_status, primary_service_type, owner, last_contact_date, last_service_date, next_follow_up_due, lifetime_jobs, lifetime_revenue_cents, open_disputes, open_followups, overdue_followups, health, health_score, notes, created_at, updated_at | 14 | No | id | relationship_status: new, active, watch, at_risk, in_dispute, dormant, won_back, churned; primary_service_type: plumbing, electrical, hvac, appliance, general_maintenance; health: healthy, watch, slipping, critical |
| followups | id, account_id, customer_id, type, subject, status, priority, due_date, completed_at, owner, related_appointment_id, related_ticket_id, related_dispute_id, notes, created_at, updated_at | 15 | No | id | type: post_service, maintenance_reminder, check_in, quote_followup, dispute_followup, win_back, renewal, nps_survey; priority: urgent, high, normal, low; status: pending, in_progress, completed, missed |

## Foreign Key Relationships

| Source | FK Column | Target |
|---|---|---|
| appointments | customer_id | customers.id |
| appointments | technician_id | technicians.id |
| disputes | appointment_id | appointments.id |
| accounts | customer_id | customers.id |
| followups | account_id | accounts.id |
| followups | customer_id | customers.id |
| followups | related_appointment_id | appointments.id |
| followups | related_ticket_id | tickets.id |
| followups | related_dispute_id | disputes.id |

## Functions

| Function | Type | Inputs | Outputs | Dependencies | Status |
|---|---|---|---|---|---|
| account_health_scan | API (Python) | today?, write_back, lookback_days, top_n_riskiest, relationship_overrides | AccountHealthScanResult (rows, totals, by_health, top_risk) | accounts, customers, followups, appointments, disputes, operations_log | **CODE EXTRACTED** |
| flag_slipping_followups | API (Python) | today?, top_n, days_ahead, include_statuses | FlagSlippingFollowupsResult (top, counts, window) | followups, accounts, customers | **CODE EXTRACTED** |

## Agents

| Agent | Description | Tool Access | Status |
|---|---|---|---|
| request-classifier | Classifies inbound requests into request_type + urgency, suggests technician | technicians (read), tickets (read/write) | **SCHEMA EXTRACTED** |
| support-reply-drafter | Drafts customer-facing replies, suggests owner by skill | customers (read), technicians (read), tickets (read/write) | **SCHEMA EXTRACTED** |
| operations-coordinator | Reads full ops state, produces prioritized actions | customers, tickets, appointments, technicians, tasks, operations_log (read) | **SCHEMA EXTRACTED** |
| resolution-advisor | Analyzes disputes, produces resolution recommendation | customers, disputes, appointments, technicians (read/write) | **SCHEMA EXTRACTED** |
| account_health_monitor | CRM health monitoring, calls both functions, creates tasks | accounts, customers, followups, appointments, disputes, tasks, operations_log | **SCHEMA EXTRACTED** |

## Apps (Surfaces)

| App | Description | Status |
|---|---|---|
| support-queue | Urgency-first ticket queue, draft replies, suggested owners, human approval | **NOT YET EXTRACTED** |
| ops-dashboard | Open tickets, active appointments, open disputes, overdue tasks | **NOT YET EXTRACTED** |
| appointment-board | Upcoming appointments, technician assignments, scheduling actions | **NOT YET EXTRACTED** |
| resolution-center | Service disputes, evidence summaries, recommended resolutions, human approval | **NOT YET EXTRACTED** |
| crm-tracker | Accounts, follow-ups, slipping relationships, operational reminders | **NOT YET EXTRACTED** |

## workflows

| Name | Nodes | Status |
|---|---|---|
| *(none listed)* | 0 | **Not defined in pod** |

## Schedules

| Name | Target | Status |
|---|---|---|
| *(none listed)* | — | **Not defined in pod** |
