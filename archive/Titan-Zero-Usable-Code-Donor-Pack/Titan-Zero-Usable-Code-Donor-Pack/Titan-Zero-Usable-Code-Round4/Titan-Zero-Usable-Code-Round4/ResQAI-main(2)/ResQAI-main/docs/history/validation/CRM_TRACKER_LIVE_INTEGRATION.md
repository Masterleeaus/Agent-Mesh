# CRM Tracker — Live Integration Audit Report

**Pod**: ResQAI Customer Support Pod
**Date**: 2026-06-26
**Scope**: Live integration audit of reconstructed CRM Tracker against live Lemma pod tables, functions, and agent.

---

## 1. Tables Verified

| Table | Live Columns (count) | ENUM Columns | RLS | Matches Frontend |
|-------|---------------------|--------------|-----|------------------|
| `accounts` | 21 | `relationship_status` (8), `primary_service_type` (6), `health` (4) | No | Partial |
| `followups` | 16 | `type` (8), `status` (5), `priority` (4) | No | Partial |
| `customers` | 9 | `status` (5) | No | Yes |
| `appointments` | 8 | `service_type`, `status` | No | Not referenced |
| `disputes` | 12 | `recommended_resolution` (6), `status` (6) | No | Not referenced |
| `tasks` | 8 | `priority` (4), `status` (5) | No | Not referenced |
| `operations_log` | 7 | None | No | Yes |

---

## 2. Function Contract Verification

### `account_health_scan`

**Input schema** (live):

| Field | Type | Default | Frontend sends | Match |
|-------|------|---------|---------------|-------|
| `today` | `string?` | `null` | Not sent | ✓ (defaults to system date) |
| `lookback_days` | `integer` | `120` | `90` | ✓ (override allowed) |
| `write_back` | `boolean` | `true` | `true` | ✓ |
| `top_n_riskiest` | `integer` | `10` | `5` | ✓ (override allowed) |
| `relationship_overrides` | `object` | `{}` | Not sent | ✓ (defaults to empty) |

**Input verification**: Frontend payload matches the live input schema. No type mismatches.

**Output schema** (live):

| Field | Type | Frontend reads | Match |
|-------|------|---------------|-------|
| `today` | `string` | Not read | — |
| `totals` | `object` | `totals.scanned`, `totals.wrote_back` | ✓ |
| `by_health` | `object` | `by_health.healthy/watch/slipping/critical` | ✓ |
| `top_risk` | `AccountHealthRow[]` | `top_risk[].account_id/name/new_score/score_delta` | ✓ |
| `all_rows` | `AccountHealthRow[]` | Not read | — |
| `scan_params` | `object` | Not read | — |

**Output verification**: Every field the frontend accesses exists in the live output schema.

**Determinism**: Function is fully deterministic — no LLM calls, no random values. Scores derived from fixed rules and current data state. ✓

**Side effects**:
- writes to `accounts` table: `health`, `health_score`, `open_followups`, `overdue_followups`, `open_disputes` (when `write_back=true`)
- Creates one `operations_log` record per run

**Frontend expects side effects**: The `HealthScanPanel` reads `result.totals.wrote_back` to display how many rows were updated. This matches the live function output.

### `flag_slipping_followups`

**Input schema** (live):

| Field | Type | Default | Frontend sends | Match |
|-------|------|---------|---------------|-------|
| `today` | `string?` | `null` | Not sent | ✓ |
| `days_ahead` | `integer` | `7` | `14` | ✓ (override allowed) |
| `include_statuses` | `array<string>` | `["pending", "in_progress"]` | Not sent | ✓ (uses default) |
| `top_n` | `integer` | `20` | `30` | ✓ (override allowed) |

**Input verification**: Frontend payload matches the live input schema. No type mismatches.

**Output schema** (live):

| Field | Type | Frontend reads | Match |
|-------|------|---------------|-------|
| `today` | `string` | Not read | — |
| `window` | `object` | Not read | — |
| `counts` | `object` | `counts.slipping` | ✓ |
| `top` | `SlippingFollowup[]` | `top` (as `SlippingFollowupItem[]`) | ✓ |

**SlippingFollowup fields**:

| Field | Type | Frontend reads | Match |
|-------|------|---------------|-------|
| `followup_id` | `string` | `a.followup_id` | ✓ |
| `account_id` | `string` | `a.account_id` | ✓ |
| `customer_id` | `string` | Not read | — |
| `customer_name` | `string` | `a.customer_name` | ✓ |
| `subject` | `string` | `a.subject` | ✓ |
| `type` | `string` | `a.type` | ✓ |
| `status` | `string` | Not read | — |
| `priority` | `string` | `a.priority` | ✓ |
| `due_date` | `string` | Not read | — |
| `days_overdue` | `integer` | `a.days_overdue` | ✓ |
| `severity` | `Literal["critical","high","medium","low"]` | `a.severity` | ✓ |
| `bucket` | `Literal["overdue","due_today","due_soon"]` | `a.bucket` | ✓ |
| `owner` | `string?` | `a.owner` | ✓ |

**Determinism**: Fully deterministic — no LLM calls. Sort order is stable (bucket → severity → days_overdue → priority → due_date). ✓

**Side effects**: None in the live function. The function only reads data and returns results.

---

## 3. Agent Contract Verification

### `account_health_monitor`

**Input schema** (live):

| Field | Type | Default | Frontend usage |
|-------|------|---------|---------------|
| `today` | `string` | System date | Not called |
| `days_ahead` | `integer` | `7` | Not called |
| `lookback_days` | `integer` | `45` | Not called |
| `focus_account_id` | `string?` | `null` | Not called |
| `max_recommendations` | `integer` | `8` | Not called |
| `create_followup_tasks` | `boolean` | `true` | Not called |

**Frontend does NOT invoke the agent**. The CRM Tracker calls the two functions (`account_health_scan`, `flag_slipping_followups`) directly. The agent is a separate orchestration layer that wraps these functions and emits task recommendations. The frontend's decision to bypass it is intentional — the UI provides a direct function-call UX.

**Permissions** (live):
- Tables: `customers` (read), `accounts` (read, write), `followups` (read), `appointments` (read), `disputes` (read), `operations_log` (write), `tasks` (write)
- Functions: `account_health_scan` (read), `flag_slipping_followups` (read)

**Side effects**: Creates `tasks` records when `create_followup_tasks=true`. The frontend does not interact with these tasks.

**Assessment**: Agent contract is fully compatible with the live pod, but unused by this frontend.

---

## 4. CRM workflow Verification

| workflow Element | Live Pod | Frontend Behavior | Match |
|-----------------|---------|-------------------|-------|
| Health scan trigger | Manual / scheduled | Manual via "Run health scan" button | ✓ |
| Follow-up flagging | Manual / scheduled | Triggered alongside health scan | ✓ |
| Data refresh | N/A | Fetched on mount + after scan | ✓ |
| Audit logging | `operations_log` write in function | `logOperation` call in service | ✓ |

The `logOperation` in `crm-service.ts` writes a redundant `operations_log` entry in addition to the one already written by the function code itself. The function `account_health_scan` already creates one, and the frontend creates another. This means each scan run produces **two** audit log entries.

**ISSUE**: Double audit logging — the `account_health_scan` function writes its own log entry, and the frontend's `runAccountHealthScan` calls `logOperation` which creates a second entry.

---

## 5. Health Score Verification

Live `accounts.health` ENUM options (from `lemma tables get accounts`):

```
healthy, watch, slipping, critical
```

Frontend health values used for filtering/sorting (`useCrm.ts` + `CrmTrackerPage.tsx`):

| Value | Used in | Live `health` ENUM? |
|-------|---------|---------------------|
| `healthy` | `HEALTH_PRIORITY`, `computeKpiCounts`, `filterCounts`, `FilterBar`, `HEALTH_BADGE` | ✓ |
| `watch` | Same | ✓ |
| `slipping` | Same | ✓ |
| `critical` | Same | ✓ |
| `at_risk` | `HEALTH_PRIORITY`, `filterCounts`, `FilterBar`, `HEALTH_BADGE` | **✗** |
| `in_dispute` | `HEALTH_PRIORITY`, `filterCounts`, `FilterBar`, `HEALTH_BADGE` | **✗** |
| `dormant` | `HEALTH_PRIORITY`, `filterCounts`, `FilterBar`, `HEALTH_BADGE` | **✗** |

**MAJOR ISSUE**: The frontend treats `at_risk`, `in_dispute`, and `dormant` as valid `health` enum values. These are actually valid `relationship_status` ENUM values, not health values. The frontend confuses the `health` computed bucket with the `relationship_status` human-set field.

The `FilterBar` will always show 0 counts for `at_risk`, `in_dispute`, and `dormant` filters because no account's `health` column will ever contain these values.

The `HEALTH_PRIORITY` sorting in `useCrm.ts`: `{critical: 0, slipping: 1, watch: 2, at_risk: 3, in_dispute: 4, dormant: 5, healthy: 6}` — values 3, 4, 5 will never be matched, degrading to the catch-all `?? 99`.

---

## 6. Follow-up Verification

### Follow-up status ENUM (live):

```
pending, in_progress, completed, missed, cancelled
```

### Follow-up status values used in frontend:

| Value | where | Live ENUM? |
|-------|-------|-----------|
| `pending` | Not explicitly referenced | ✓ |
| `in_progress` | Not explicitly referenced | ✓ |
| `completed` | `computeKpiCounts`, `followupStatus`, `STATUS_CLASS` | ✓ |
| `missed` | Not referenced | ✓ |
| `cancelled` | `computeKpiCounts`, `STATUS_CLASS` | ✓ |
| `overdue` | `computeKpiCounts`, `followupStatus`, `STATUS_CLASS` | **✗** |
| `done` | `computeKpiCounts`, `followupStatus`, `STATUS_CLASS` | **✗** |
| `due` | `followupStatus`, `STATUS_CLASS` | **✗** |
| `future` | `followupStatus`, `STATUS_CLASS` | **✗** |

**ISSUE**: The frontend uses `'overdue'`, `'done'`, `'due'`, and `'future'` as follow-up status values. In the live schema, `followups.status` only accepts `pending`, `in_progress`, `completed`, `missed`, `cancelled`.

- `f.status === 'overdue'` in `computeKpiCounts` and `followupStatus` will never match — there is no `'overdue'` status in the table. The frontend correctly falls back to date-based logic (`f.due_date && new Date(f.due_date) < new Date()`) as a secondary check in `followupStatus`, but the `computeKpiCounts` function checks `f.status === 'overdue'` which is dead code.
- `f.status !== 'done'` in `computeKpiCounts` will never match — `'done'` is not a valid status. The frontend also checks `f.status !== 'completed'` which **is** correct.
- `f.status === 'done'` in `followupStatus` will never match — dead code path.

### Follow-up priority ENUM (live):

```
low, normal, high, urgent
```

The frontend uses `f.priority` directly in `AccountDetail.tsx` and `SlippingAlerts.tsx`. These are display-only and the values come from the function output which mirrors the table. ✓

### Follow-up type ENUM (live):

```
check_in, maintenance_reminder, post_service, dispute_followup, quote_followup, renewal, win_back, nps_survey
```

The frontend displays `f.type` directly. ✓

---

## 7. Status / Enum Verification

### `relationship_status` ENUM (live — `accounts` table):

```
new, active, watch, at_risk, in_dispute, dormant, won_back, churned
```

Frontend references `relationship_status` in `AccountList.tsx` (display badge) and `AccountDetail.tsx` (display value). Both treat it as a free-text string. ✓

### `health` ENUM (live — `accounts` table):

```
healthy, watch, slipping, critical
```

Frontend references `health` for filtering, sorting, KPIs, and display badges. **MISMATCH**: Frontend expects `at_risk`, `in_dispute`, `dormant` as valid health values.

### `primary_service_type` ENUM (live — `accounts` table):

```
hvac, plumbing, electrical, appliance, general_maintenance, multi
```

Frontend references `primary_service_type` as display-only. ✓

### Followup `status` ENUM (live — `followups` table):

```
pending, in_progress, completed, missed, cancelled
```

Frontend references `status` for KPI computation and display. **MISMATCH**: Frontend expects `overdue`, `done`, `due`, `future` as valid statuses.

---

## 8. Issues Found

### Critical

| # | Issue | File(s) | Description |
|---|-------|---------|-------------|
| 1 | **Health enum mismatch** | `components/FilterBar.tsx`, `components/AccountList.tsx`, `hooks/useCrm.ts`, `pages/CrmTrackerPage.tsx`, `state/atoms.ts` | Frontend filters and sorts by `at_risk`, `in_dispute`, `dormant` as health values. These are `relationship_status` ENUM values, not `health` ENUM values. The live `accounts.health` ENUM only allows `healthy`, `watch`, `slipping`, `critical`. |
| 2 | **Followup status mismatch** | `hooks/useCrm.ts`, `components/AccountDetail.tsx` | Frontend references `status === 'overdue'` and `status === 'done'`. The live `followups.status` ENUM only allows `pending`, `in_progress`, `completed`, `missed`, `cancelled`. Local status derivation in `followupStatus()` partially mitigates this but `computeKpiCounts` has dead code paths. |

### Medium

| # | Issue | File(s) | Description |
|---|-------|---------|-------------|
| 3 | **FilterBar filters that always return 0** | `pages/CrmTrackerPage.tsx` | `at_risk`, `in_dispute`, `dormant` filter counts will always be 0 because `account.health` never contains these values. |
| 4 | **Dead sorting priorities** | `hooks/useCrm.ts:15-23` | `HEALTH_PRIORITY` includes `at_risk: 3`, `in_dispute: 4`, `dormant: 5` which never match any account's `health` field. Not harmful but misleading. |
| 5 | **Missing `include_statuses` parameter** | `services/crm-service.ts:33-36` | `flag_slipping_followups` call does not pass `include_statuses`. The function default (`["pending", "in_progress"]`) is correct for CRM use, so this is technically correct but implicit. |

### Low

| # | Issue | File(s) | Description |
|---|-------|---------|-------------|
| 6 | **Missing `related_dispute_id` in Followup type** | `shared/types.ts:70-83` | The live `followups` table has a `related_dispute_id` column not represented in the frontend type. Not used by the frontend, but schema-incomplete. |
| 7 | **Missing `next_follow_up_due` in Account type** | `shared/types.ts:85-102` | The live `accounts` table has a `next_follow_up_due` column not represented in the frontend type. Not used by the frontend. |
| 8 | **Double audit logging** | `services/crm-service.ts:28` + function code | Both the `account_health_scan` function and the frontend's `runAccountHealthScan` write to `operations_log` for the same scan run, producing duplicate entries. |
| 9 | **`lookback_days` override** | `services/crm-service.ts:24` | Frontend sends `lookback_days: 90` vs function default `120`. Not incorrect, but worth noting if the business expects 120-day lookback. |
| 10 | **`top_n_riskiest` override** | `services/crm-service.ts:26` | Frontend sends `top_n_riskiest: 5` vs function default `10`. Limits the risk list displayed to 5. |
| 11 | **`top_n` override** | `services/crm-service.ts:35` | Frontend sends `top_n: 30` vs function default `20`. Shows up to 30 slipping alerts. |
| 12 | **Agent not used** | All | The `account_health_monitor` agent is never invoked by the frontend. The frontend calls functions directly, bypassing agent orchestration. This is a design choice, not a bug. |

---

## 9. Required Fixes

### Fix 1: Align health filter values with the live `health` ENUM

Remove `at_risk`, `in_dispute`, `dormant` from:
- `HealthFilter` type in `state/atoms.ts`
- `FILTERS` array in `components/FilterBar.tsx`
- `filterCounts` in `pages/CrmTrackerPage.tsx`
- `HEALTH_BADGE` in `components/AccountList.tsx`
- `HEALTH_PRIORITY` in `hooks/useCrm.ts`

If filtering by `relationship_status` is desired, add a separate filter mechanism for that field.

### Fix 2: Align follow-up status references with the live `status` ENUM

Replace all references to `f.status === 'overdue'` with the date-based derivation already present in `followupStatus()`:
- In `hooks/useCrm.ts:35`, replace `f.status === 'overdue'` with a date check `(f.due_date && new Date(f.due_date) < new Date())`
- In `hooks/useCrm.ts:36`, replace `f.status !== 'done'` with the existing date-based check or remove it
- Remove `f.status === 'done'` from `components/AccountDetail.tsx:33` — it can never match

### Fix 3 (Optional): Remove redundant `logOperation` call

Either remove the `logOperation` call in `crm-service.ts:28` (since the function logs itself), or accept the duplicate entries as intentional visibility.

### Fix 4 (Optional): Add `include_statuses` parameter

Pass `include_statuses: ['pending', 'in_progress']` explicitly to `flag_slipping_followups` for clarity.

---

## 10. Overall Assessment

| Category | Status |
|----------|--------|
| Table schema alignment | **Issues found** (enum mismatches) |
| Field name alignment | **Clean** — all field names match |
| Function input contracts | **Clean** — all payloads match schemas |
| Function output parsing | **Clean** — all accessed fields exist |
| Agent contracts | **N/A** — agent not used by frontend |
| Health score logic | **Issues found** (confused with relationship_status) |
| Follow-up workflow | **Issues found** (status enum mismatch) |
| Audit logging | **Clean** (minor duplicate) |
| Filter/sort logic | **Issues found** (dead filter values, dead sorting priorities) |

The CRM Tracker is **functionally operational** for the core use case: displaying accounts and follow-ups, running health scans, and showing slipping alerts. The two main issues (health enum mismatch and follow-up status mismatch) mean that some filters and KPI counts will be silently incorrect — certain filters will always show zero results, and follow-up status classification has dead code paths that never trigger.

---

## 11. Reconstruction Confidence: 82%

**Breakdown**:
- Table field mapping: 95% (all fields exist, two unused columns missing from types)
- Function contracts: 95% (all payloads valid, all response fields correctly accessed)
- Health score workflow: 60% (the `health` vs `relationship_status` confusion is systemic across filtering, sorting, KPI computation, and display)
- Follow-up classification: 70% (dead code in KPI computation, but the `followupStatus()` display logic works correctly using date derivation)
- Agent integration: 100% (not used, so no misalignment)
- Audit logging: 90% (duplicate writes but no data loss)
- UI rendering: 95% (all field displays work, no crashes)

**Docking factors**: The health enum confusion is the largest concern because it affects filtering, sorting, KPI dashboards, and badge display across 5+ files. The follow-up status mismatch affects KPI counts but not the main slipping alert display (which uses the function's computed output, not raw table statuses).
