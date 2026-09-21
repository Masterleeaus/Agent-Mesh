# Appointment Board — Live Integration Report

**Generated:** 2026-06-26
**Pod:** ResQAI Customer Support Pod
**Scope:** Schema alignment, agent contract, scheduling logic, status/enum values, side effects

---

## Tables Verified

### `appointments`

| Column | Pod Type | App Ref | Status |
|--------|----------|---------|--------|
| `id` | UUID (PK, auto) | `Appointment.id` | ✅ |
| `customer_id` | UUID (FK → customers.id, **required**) | `Appointment.customer_id` | ✅ |
| `service_type` | **ENUM** — see below | `Appointment.service_type` | ✅ |
| `date` | DATETIME (**required**) | `Appointment.date` | ✅ |
| `status` | **ENUM** — see below | `Appointment.status` | ✅ |
| `technician_id` | UUID (FK → technicians.id, optional) | `Appointment.technician_id` | ✅ |
| `notes` | TEXT (max 2000, optional) | `Appointment.notes` | ✅ |
| `created_at` | DATETIME (system) | — | ✅ |
| `updated_at` | DATETIME (system) | — | ✅ |

### `customers`

| Column | Pod Type | App Ref | Status |
|--------|----------|---------|--------|
| `id` | UUID (PK, auto) | `Customer.id` | ✅ |
| `name` | TEXT (max 120, **required**) | `Customer.name` | ✅ |
| `phone` | TEXT (max 32, optional) | `Customer.phone?` | ✅ |
| `email` | TEXT (max 180, optional) | `Customer.email?` | ✅ (unused) |
| `address` | TEXT (max 240, optional) | `Customer.address?` | ✅ (unused) |
| `status` | **ENUM** — see below | `Customer.status?` | ✅ (unused) |
| `notes` | TEXT (max 2000, optional) | `Customer.notes?` | ✅ (unused) |
| `created_at` | DATETIME (system) | — | ✅ |
| `updated_at` | DATETIME (system) | — | ✅ |

### `technicians`

| Column | Pod Type | App Ref | Status |
|--------|----------|---------|--------|
| `id` | UUID (PK, auto) | `Technician.id` | ✅ |
| `name` | TEXT (max 120, **required**) | `Technician.name` | ✅ |
| `skill` | **ENUM** — see below | `Technician.skill` | ✅ |
| `availability` | **ENUM** (**required**) | `Technician.availability?` | ⚠️ optional in app |
| `rating` | FLOAT (optional) | `Technician.rating?` | ✅ (unused) |
| `status` | **ENUM** — see below | `Technician.status` | ✅ |
| `created_at` | DATETIME (system) | — | ✅ |
| `updated_at` | DATETIME (system) | — | ✅ |

> **⚠️ availability:** The pod defines `availability` as `ENUM` **required** (`available`/`busy`/`off_shift`/`on_leave`). The app types mark it `string?` (optional). The runtime fallback `t.availability || 'unknown'` handles nulls but the type annotation is inaccurate.

### `operations_log`

| Column | Pod Type | App Ref | Status |
|--------|----------|---------|--------|
| `id` | UUID (PK, auto) | — | ✅ |
| `action` | TEXT (**required**) | `logOperation(action, …)` | ✅ |
| `result` | TEXT (optional) | `logOperation(…, result, …)` | ✅ |
| `timestamp` | DATETIME (**required**) | `new Date().toISOString()` | ⚠️ type conversion |
| `actor` | TEXT (**required**) | `logOperation(…, …, actor)` | ✅ |
| `created_at` | DATETIME (system) | — | ✅ |
| `updated_at` | DATETIME (system) | — | ✅ |

> **⚠️ timestamp:** The app writes `new Date().toISOString()` (an ISO-8601 string) into a `DATETIME` column. Most backends coerce this, but it should be verified at runtime.

---

## Agent Contract Verification

### Agent: `operations-coordinator`

**App invocation pattern** (`appointment-service.ts:82–86`):
```ts
runAgent('operations-coordinator', prompt, 'Tech Suggestion')
```
The prompt asks the agent to pick the best technician for a single appointment and return `{ pick_tech_name, score, rationale, alternatives }`.

**Agent's actual contract** (`input_schema`):
```json
{
  "scope": "daily" | "weekly" | "urgent_only",
  "today": "YYYY-MM-DD",
  "max_actions": "integer (1-25)",
  "create_tasks": "boolean"
}
```

**Agent's actual contract** (`output_schema`):
- `summary` (required string)
- `recommendations[]` (required) — each with `type` (enum), `summary`, `priority` (enum), `rationale`, `target_id`, `task_id`
- `tasks_created[]`
- `summary_counts` (5 counters)
- `coordination_status` (enum)

### ⛔ ISSUE: Agent invocation contract mismatch

| Dimension | App Expects | Agent Delivers | Gap |
|-----------|-------------|----------------|-----|
| Input | Free-text prompt with appointment details | Structured `{ scope, today, max_actions, create_tasks }` | Agent is invoked conversationally — the prompt becomes a user message and the agent will respond, but it ignores the structured input schema intended for programmatic calls |
| Output | `{ pick_tech_name, score, rationale, alternatives }` | `{ summary, recommendations[], tasks_created[], summary_counts, coordination_status }` | **Complete mismatch.** The app parses the agent's output as `AISuggestion`, but the agent emits an operational board summary. JSON parse will almost certainly fail or return unexpected structure. |
| Role | Tech-suggester for one appointment | Chief of staff reading the full board | **Semantic mismatch.** The agent reads all tickets, appointments, technicians, customers, tasks, and operations_log to produce multi-item recommendations — not a single tech pick for one appointment. |
| Side effects | None expected (read-only suggestion) | writes `operations_log` + `tasks` rows per run | **Side-effect leak.** Each invocation creates unwanted log entries and possibly tasks. |

The agent will likely respond to the free-form prompt (LLMs are flexible), but:
1. The response format won't match `AISuggestion`
2. The agent reads the entire board instead of focusing on the single appointment
3. The agent creates `operations_log` entries and possibly `tasks` rows on every call

---

## Scheduling Verification

### Data fetching (`appointment-service.ts`)

| Table | Call | Limit | Filtering | The app fetches ALL records with no filters |
|-------|------|-------|-----------|----------------------------------------------|
| `appointments` | `listRecords('appointments', 500)` | 500 | None | At scale, 500 may be insufficient |
| `customers` | `listRecords('customers', 500)` | 500 | None | ✅ |
| `technicians` | `listRecords('technicians', 200)` | 200 | None | ✅ |

No server-side filters, sorts, or pagination are used. All grouping and filtering is client-side.

### Client-side grouping (`useAppointments.ts:38–90`)

| Group | Condition |
|-------|-----------|
| Today | `isToday(a.date)` AND status NOT `needs_followup`/`needs_follow_up` |
| Upcoming | date >= today AND status NOT `cancelled`/`completed` AND not in other groups |
| Needs follow-up | status === `needs_followup` OR `needs_follow_up` |
| Past | date < today AND not in other groups (last 10) |

### ⚠️ ISSUE: `needs_follow_up` dead check

The app checks for `needs_follow_up` (with underscore) in two places:
- `useAppointments.ts:51` — grouping
- `useAppointments.ts:201` — KPI count

The pod ENUM for `appointments.status` defines only `needs_followup` (no underscore). The app never writes `needs_follow_up` — it only writes `needs_followup` via action buttons (`AppointmentDetail.tsx:29`). The `needs_follow_up` check is dead code that never matches at runtime.

**Impact:** Minimal — it doesn't cause bugs today, but it's misleading and could mask issues if data arrives from other sources with the wrong value.

### Technician filter (`TechnicianPicker.tsx:15`)

```ts
technicians.filter((t) => t.status === 'active')
```

The pod's technician status ENUM is `active` | `training` | `suspended`. Filtering to `active` only is correct and expected.

---

## Status / Enum Verification

### `appointments.status` — ENUM options

| Pod Value | Default | App Uses | App writes | Match |
|-----------|---------|----------|------------|-------|
| `scheduled` | ✅ (default) | ✅ display, filter, group | ✅ via action | ✅ |
| `in_progress` | — | ✅ display, filter, group | ✅ "Start visit" | ✅ |
| `completed` | — | ✅ display, filter, group | ✅ "Mark complete" | ✅ |
| `needs_followup` | — | ✅ display, filter, group | ✅ "Needs follow-up" | ✅ |
| `cancelled` | — | ✅ display, filter, group | ✅ "Cancel" | ✅ |

### `appointments.service_type` — ENUM options

| Pod Value | App Label | Match |
|-----------|-----------|-------|
| `ac_repair` | `SERVICE_LABELS.ac_repair` → "AC repair" | ✅ |
| `ac_maintenance` | → "AC maintenance" | ✅ |
| `appliance_repair` | → "Appliance repair" | ✅ |
| `plumbing_repair` | → "Plumbing repair" | ✅ |
| `electrical_repair` | → "Electrical repair" | ✅ |
| `general_maintenance` | → "General maintenance" | ✅ |
| `installation` | → "Installation" | ✅ |

### `technicians.skill` — ENUM options

| Pod Value | App Uses | Match |
|-----------|----------|-------|
| `hvac` | ✅ displayed in picker | ✅ |
| `plumbing` | ✅ displayed in picker | ✅ |
| `electrical` | ✅ displayed in picker | ✅ |
| `appliance` | ✅ displayed in picker | ✅ |
| `general_maintenance` | ✅ displayed in picker | ✅ |

### `technicians.availability` — ENUM options

| Pod Value | Default | Notes |
|-----------|---------|-------|
| `available` | ✅ (default) | |
| `busy` | — | |
| `off_shift` | — | |
| `on_leave` | — | |

App fallback: `t.availability || 'unknown'` (displays "unknown" for missing values).

### `technicians.status` — ENUM options

| Pod Value | Default | App Filter |
|-----------|---------|------------|
| `active` | ✅ (default) | ✅ `t.status === 'active'` |
| `training` | — | ❌ excluded (correct) |
| `suspended` | — | ❌ excluded (correct) |

### `customers.status` — ENUM options

| Pod Value | Default | App Uses |
|-----------|---------|----------|
| `active` | ✅ (default) | ❌ unused |
| `service_due` | — | ❌ unused |
| `at_risk` | — | ❌ unused |
| `in_dispute` | — | ❌ unused |
| `dormant` | — | ❌ unused |

The app types `Customer.status` as `string?` — this is technically correct (it's a string) but loses the enum constraint. Not a runtime issue since the app never reads or writes this field.

---

## Issues Found

### Critical

1. **Agent invocation contract mismatch** (`appointment-service.ts:82–86`)
   - App sends a free-text prompt asking the agent to pick a technician
   - Agent expects structured input (`{ scope, today, max_actions, create_tasks }`)
   - Agent outputs operational board recommendations (`summary`, `recommendations[]`, etc.)
   - App parses output as `AISuggestion` (`{ pick_tech_name, score, rationale, alternatives }`)
   - **will likely fail at runtime** — JSON parse will produce null, and the suggestion feature silently degrades

2. **Agent side-effect leak**
   - Agent is instructed to write `operations_log` entries per run
   - Agent has `datastore.record.write` permission on `operations_log`, `tasks`, and `appointments`
   - Each "Suggest tech (AI)" call creates unwanted `operations_log` records and possibly `tasks` rows
   - The app expects no side effects from the suggestion feature

### Medium

3. **`needs_follow_up` dead code** (`useAppointments.ts:51, 201`)
   - App checks for `needs_follow_up` (underscore variant) alongside `needs_followup`
   - Pod only defines `needs_followup` (no underscore)
   - App never writes the underscore variant
   - Dead code that could mask data quality issues

4. **`availability` marked optional in types, required in schema**
   - `Technician.availability?: string` vs pod's `availability: ENUM (required)`
   - Runtime fallback `|| 'unknown'` handles nulls
   - Type definition should be updated to reflect reality

5. **`timestamp` string vs DATETIME**
   - `operations_log.timestamp` is `DATETIME` type
   - App writes `new Date().toISOString()` (ISO string)
   - Likely works (most datastores coerce) but unverified

### Minor

6. **Unused fields in type definitions**
   - `Customer.email`, `Customer.address`, `Customer.status`, `Customer.notes`
   - `Technician.rating`
   - All exist in pod schema but are never read/written by the app
   - Not bugs, but dead references

7. **No pagination on bulk reads**
   - `appointments` capped at 500, not paginated
   - At scale, records beyond 500 are invisible to the app

---

## Required Fixes

| # | Priority | Fix | File(s) |
|---|----------|-----|---------|
| 1 | **Critical** | Replace `operations-coordinator` agent usage with a lightweight agent or LLM call designed for tech suggestion. The `operations-coordinator` is a board-level chief-of-staff, not a single-appointment suggester. Either create a dedicated `tech-suggester` agent or use a direct LLM call with no write permissions. | `services/appointment-service.ts:82–86` |
| 2 | **Critical** | If continuing to use `operations-coordinator`, update the prompt to match its input schema (send the structured fields instead of free text) and parse the `recommendations[]` output instead of the `AISuggestion` shape. | `services/appointment-service.ts:62–91` |
| 3 | **Medium** | Remove `needs_follow_up` checks — the pod ENUM only has `needs_followup`. | `hooks/useAppointments.ts:51,201` |
| 4 | **Medium** | Update `Technician.availability` type from `string?` to `string` (required). Verify runtime fallback `|| 'unknown'` is still needed for legacy records. | `apps/shared/types.ts:15` |
| 5 | **Low** | Add pagination cursor to `listRecords` calls for `appointments` to handle >500 records. | `services/appointment-service.ts:12` |

---

## Overall Assessment

**Tables:** The four tables (`appointments`, `customers`, `technicians`, `operations_log`) are correctly identified and their schemas align well with the app's type definitions. No missing fields, no incorrect column types.

**Enums:** All 5 enums used by the app (`appointments.status`, `appointments.service_type`, `technicians.skill`, `technicians.availability`, `technicians.status`) match the pod definitions exactly. The `needs_follow_up` dead code is the only enum-related issue.

**Agent:** The `operations-coordinator` integration is **broken by design**. The app uses a free-text prompt asking for a single tech suggestion, but the agent is a board-level chief-of-staff agent that:
- Accepts structured params (`scope`, `today`, `max_actions`, `create_tasks`)
- Emits multi-item recommendations with a different output schema
- Has side effects (creates tasks, writes operations_log)

This is the single most impactful issue. The suggestion feature either silently fails (JSON parse → null) or produces unexpected results with side-effect pollution.

**Scheduling/Assignment:** The client-side grouping, filtering, and technician assignment logic is sound. The status transition flow (`scheduled → in_progress → completed`, with lateral moves to `needs_followup`/`cancelled`) is consistent with the pod ENUM.

**Verdict:** The Appointment Board is structurally aligned with the pod schema (tables, columns, enums) but has a **critical agent integration flaw** that renders the AI suggestion feature non-functional and potentially harmful (unwanted writes). The app should either use a dedicated agent for tech suggestion or stop using `operations-coordinator` for this purpose.
