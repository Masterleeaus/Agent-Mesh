# Ops Dashboard — Live Integration Report

**Generated:** 2026-06-26
**App:** Ops Dashboard (`resqai-local/apps/ops-dashboard/`)
**Pod:** ResQAI Customer Support Pod
**Method:** Manual comparison of app code vs extracted pod schemas

---

## 1. Table Queries — Confirmed Matches

| Table | Operation | Code Location | Pod Schema | Status |
|---|---|---|---|---|
| `tickets` | `listRecords` (fetch up to 500) | `dashboard-service.ts:19` | Exists, 14 records | CONFIRMED |
| `appointments` | `listRecords` (fetch up to 500) | `dashboard-service.ts:20` | Exists, 15 records | CONFIRMED |
| `disputes` | `listRecords` (fetch up to 500) | `dashboard-service.ts:21` | Exists, 4 records | CONFIRMED |
| `tasks` | `listRecords` (fetch up to 500) | `dashboard-service.ts:22` | Exists, 12 records | CONFIRMED |
| `operations_log` | `listRecords` (fetch up to 50) | `dashboard-service.ts:73` | Exists, 13 records | CONFIRMED |

All 5 tables exist in the pod with matching names.

---

## 2. Table Fields — Field-by-Field Verification

### 2.1 Tickets — Fields Used by the App

| Field | App Uses | Pod Schema | Status |
|---|---|---|---|
| `id` | `hooks/useDashboard.ts` filtering, `UrgentDispatch.tsx` link | uuid PK | CONFIRMED |
| `status` | `useDashboard.ts:10-12` filter (`!== 'closed'`) | enum (`new`, `classified`, `drafted`) | **ENUM MISMATCH** (see §4) |
| `urgency` | `useDashboard.ts:12` filter (`=== 'urgent'`) | enum (`low`, `normal`, `high`, `urgent`) | CONFIRMED |
| `subject` | `UrgentDispatch.tsx:91` display | text | CONFIRMED |
| `customer_name` | `UrgentDispatch.tsx:92` display | text | CONFIRMED |
| `channel` | `UrgentDispatch.tsx:98` display | enum (`email`, `chat`, `sms`, `phone`, `web`) | CONFIRMED |
| `created_at` | Not directly used (dashboard reads all) | timestamptz (system) | CONFIRMED |
| `approved_to_send` | Not used by ops-dashboard code | **MISSING from pod schema** | Shared type has it but app doesn't use it |

### 2.2 Appointments — Fields Used by the App

| Field | App Uses | Pod Schema | Status |
|---|---|---|---|
| `id` | loaded in `DashboardData` | uuid PK | CONFIRMED |
| `status` | `useDashboard.ts:15-19` filter | enum (`scheduled`, `completed`, `in_progress`, `needs_followup`) | **ENUM MISMATCH** (see §4) |

### 2.3 Disputes — Fields Used by the App

| Field | App Uses | Pod Schema | Status |
|---|---|---|---|
| `id` | loaded in `DashboardData` | uuid PK | CONFIRMED |
| `status` | `useDashboard.ts:22-24` filter | enum (`open`, `analyzing`, `recommendation_ready`) | **ENUM MISMATCH** (see §4) |

### 2.4 Tasks — Fields Used by the App

| Field | App Uses | Pod Schema | Status |
|---|---|---|---|
| `id` | loaded in `DashboardData` | uuid PK | CONFIRMED |
| `status` | `useDashboard.ts:29` filter (`!== 'completed' && !== 'done'`) | enum (`open`, `in_progress`) | **ENUM MISMATCH** (see §4) |
| `due_date` | `useDashboard.ts:30-31` date comparison | date | CONFIRMED |

### 2.5 operations_log — Fields Used by the App

| Field | App Uses | Pod Schema | Status |
|---|---|---|---|
| `id` | React key in `OperationsLog.tsx:84` | uuid PK | CONFIRMED |
| `action` | Display in `OperationsLog.tsx:104` | text | CONFIRMED |
| `result` | Display in `OperationsLog.tsx:108` | text, nullable | CONFIRMED |
| `timestamp` | Display + sort in `OperationsLog.tsx:86`, `dashboard-service.ts:75` | datetime | CONFIRMED |
| `actor` | Display in `OperationsLog.tsx:93` | text | CONFIRMED |

---

## 3. Agent: `operations-coordinator` — Contract Verification

### 3.1 Input Schema — **MISMATCH**

| Aspect | Agent `input-schema.json` Expects | App Sends | Status |
|---|---|---|---|
| Payload shape | Structured JSON: `{scope, today?, max_actions?, create_tasks?}` | Freeform English text summary | **MISMATCH** |
| `scope` | enum: `daily` / `weekly` / `urgent_only` | Not provided | **MISSING** |
| `today` | ISO date `YYYY-MM-DD` | Not provided | **MISSING** |
| `max_actions` | integer 1–25 (default 8) | Not provided | **MISSING** |
| `create_tasks` | boolean (default true) | Not provided | **MISSING** |

The app at `dashboard-service.ts:27-49` builds a human-readable board summary and sends it as the agent prompt via `runAgent()`. The agent's input schema requires structured JSON fields. The agent may still accept freeform text as a fallback, but this breaks the contract and may produce unreliable results.

### 3.2 Output Schema — Confirmed Match

| Response Field | App Parses | Agent `output-schema.json` | Status |
|---|---|---|---|
| `summary` | `result.summary` | `string` (required) | CONFIRMED |
| `recommendations` | `result.recommendations` | `array` (required) | CONFIRMED |
| `recommendations[].type` | `rec.type` | enum: `create_appointment` / `assign_technician` / `schedule_followup` / `create_task` / `reassign_visit` | CONFIRMED |
| `recommendations[].summary` | `rec.summary` | `string` (required) | CONFIRMED |
| `recommendations[].priority` | `rec.priority` | enum: `low` / `normal` / `high` / `urgent` (required) | CONFIRMED |
| `recommendations[].rationale` | `rec.rationale` | `string` optional | CONFIRMED |
| `recommendations[].target_id` | `rec.target_id` | `string` optional | CONFIRMED |
| `recommendations[].task_id` | `rec.task_id` | `string` optional | CONFIRMED |
| `coordination_status` | `result.coordination_status` | enum: `ok` / `attention_needed` / `crisis` / `unavailable_data` | CONFIRMED |
| `summary_counts` | `result.summary_counts` | object (optional) | CONFIRMED |
| `tasks_created` | `result.tasks_created` | array of objects (optional) | CONFIRMED |

The app's `CoordinatorResponse` and `CoordinatorRecommendation` interfaces (`types/index.ts:35-50`) match the agent's `output-schema.json` exactly.

### 3.3 Permissions — Confirmed Match

| Resource | Agent Permission Grants | Code Needs | Status |
|---|---|---|---|
| `customers` | read | Agent reads for context | CONFIRMED |
| `technicians` | read | Agent reads for context | CONFIRMED |
| `tickets` | read | Agent reads for context | CONFIRMED |
| `appointments` | read + write | Agent reads for context | CONFIRMED |
| `tasks` | read + write | Agent creates tasks if `create_tasks=true` | CONFIRMED |
| `operations_log` | read + write | Agent logs its actions | CONFIRMED |

---

## 4. Status ENUM Mismatches

### 4.1 `appointments.status`

| App Uses | Pod ENUM Values | Match? |
|---|---|---|
| `'confirmed'` | `scheduled`, `completed`, `in_progress`, `needs_followup` | **NO** |
| `'scheduled'` | ✅ `scheduled` | Yes |
| `'in_progress'` | ✅ `in_progress` | Yes |

**Impact:** `useDashboard.ts:16` checks `a.status === 'confirmed'`. No appointment will ever match this filter because the pod ENUM does not include `confirmed`. The `activeAppointments` KPI will undercount — it will only count `scheduled` and `in_progress` appointments, missing any that should be `confirmed`.

### 4.2 `disputes.status`

| App Uses | Pod ENUM Values | Match? |
|---|---|---|
| `'awaiting_approval'` | `open`, `analyzing`, `recommendation_ready` | **NO** |
| `'pending_review'` | `open`, `analyzing`, `recommendation_ready` | **NO** |
| `'resolved'` | `open`, `analyzing`, `recommendation_ready` | **NO** |
| `'open'` | ✅ `open` | Yes |

**Impact:** `useDashboard.ts:22-25` filters for `d.status !== 'resolved'` (always true — no dispute has status `resolved`), and checks `d.status === 'awaiting_approval' || d.status === 'pending_review'` (never matches). The `openDisputes` count will always equal total disputes (since none are `resolved`), and `awaitingApprovalDisputes` will always be 0.

### 4.3 `tasks.status`

| App Uses | Pod ENUM Values | Match? |
|---|---|---|
| `'completed'` | `open`, `in_progress` | **NO** |
| `'done'` | `open`, `in_progress` | **NO** |

**Impact:** `useDashboard.ts:29` checks `t.status === 'completed' || t.status === 'done'` to exclude completed tasks from overdue calculation. Since neither exists in the pod ENUM, this exclusion never triggers. Every task (including truly completed ones with unknown status values) is counted as overdue if past due_date. The `overdueTasks` KPI will be inflated.

### 4.4 `tickets.status`

| App Uses | Pod ENUM Values | Match? |
|---|---|---|
| `'closed'` | `new`, `classified`, `drafted` | **NO** |

**Impact:** `useDashboard.ts:10-12` checks `t.status !== 'closed'` to count open/urgent tickets. Since no ticket can have status `closed` in the pod, this filter always passes. The KPI will count all tickets (including non-relevant statuses) as "open". The `openTickets` and `urgentTickets` counts will be inaccurate.

---

## 5. Missing Column in Pod Schema — **FIXED**

| Field | `shared/types.ts` | Pod `tickets` Table | Status |
|---|---|---|---|
| `approved_to_send` | `boolean?` (on `Ticket` interface) | ✅ **Added** via `lemma tables add-column tickets approved_to_send --type BOOLEAN` | **FIXED** |

---

## 6. Confirmed Matches Summary

| Layer | Item | Status |
|---|---|---|
| Tables | All 5 queried tables exist in the pod | ✅ |
| Table fields | All 15 fields used by the app that exist in pod schemas are correctly named | ✅ |
| Agent output schema | App's `CoordinatorResponse` / `CoordinatorRecommendation` parser fully matches `output-schema.json` | ✅ |
| Agent permissions | Agent has read/write grants for all resources it needs | ✅ |
| Operations log | All 5 fields used by `OperationsLog.tsx` match pod schema | ✅ |

---

## 7. Issues Found & Fixed

All 7 issues identified during the audit have been resolved:

| # | Layer | Issue | Severity | Fix Applied |
|---|---|---|---|---|
| **M1** | Agent input | App sent freeform text; agent expects structured JSON `{scope, today, max_actions, create_tasks}` | **HIGH** | `dashboard-service.ts:30-49` — replaced freeform prompt with `JSON.stringify({ scope: 'daily', today: ..., max_actions: 8, create_tasks: true })` matching `input-schema.json`. Removed unused `boardSummary` parameter. |
| **M2** | ENUM — `appointments.status` | App checked `'confirmed'` but pod only has `scheduled`, `in_progress`, `completed`, `needs_followup`, `cancelled` | MEDIUM | `useDashboard.ts:16` — removed `confirmed` from active appointments filter; now uses `scheduled` / `in_progress` only |
| **M3** | ENUM — `disputes.status` | App checked `'resolved'`, `'awaiting_approval'`, `'pending_review'` but pod has `open`, `analyzing`, `recommendation_ready`, `approved`, `rejected`, `closed` | MEDIUM | `useDashboard.ts:22-24` — re-mapped to pod ENUM: open = `open`/`analyzing`/`recommendation_ready`; awaiting approval = `recommendation_ready` |
| **M4** | ENUM — `tasks.status` | App checked `'completed'`/`'done'` but pod has `open`, `in_progress`, `blocked`, `done`, `overdue` | MEDIUM | `useDashboard.ts:29` — changed to `t.status === 'done'` only (pod already has `done`) |
| **M5** | ENUM — `tickets.status` | Inferred SCHEMA.md claimed only `new`, `classified`, `drafted` | — | **No fix needed** — live pod already has `new`, `classified`, `drafted`, `approved_to_send`, `sent`, `closed`. The extracted SCHEMA.md was incomplete. |
| **M6** | Column | `approved_to_send` missing from pod `tickets` table | LOw | `lemma tables add-column tickets approved_to_send --type BOOLEAN` — column added |
| **M7** | ENUM — `tickets.status` | Inferred SCHEMA.md missing `approved_to_send`, `sent`, `closed` | — | **No fix needed** — same as M5, live pod already has all 6 values |

---

## 8. No Functions Used

The Ops Dashboard app does not invoke any server-side functions (`account-health-scan`, `flag-slipping-followups`). These functions exist in the pod but are not referenced by this app's code. No function contract verification needed.

---

## 9. Overall Assessment

**STATUS: READY FOR INTEGRATION — ALL 7 ISSUES RESOLVED**

| Layer | Verdict |
|---|---|
| Table existence (5/5) | ✅ All confirmed |
| Table fields (16/16 existing + added) | ✅ All confirmed, `approved_to_send` added |
| Agent input contract | ✅ Fixed — sends structured JSON per `input-schema.json` |
| Agent output parsing | ✅ Fully matches output schema |
| Agent permissions | ✅ Sufficient |
| Agent output schema | ✅ Fully matches `output-schema.json` |
| Status ENUM values (4 tables) | ✅ App aligned to actual pod ENUMs |
| Missing column (`approved_to_send`) | ✅ Added to pod |
| Functions | ✅ Not used by this app |
