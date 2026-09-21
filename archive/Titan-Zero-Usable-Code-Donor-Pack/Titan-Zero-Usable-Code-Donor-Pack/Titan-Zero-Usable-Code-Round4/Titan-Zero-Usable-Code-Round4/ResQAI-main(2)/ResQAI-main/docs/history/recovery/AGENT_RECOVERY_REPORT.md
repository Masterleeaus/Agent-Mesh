# ResQAI — Agent Recovery Report

**Date:** 2026-06-25
**Extraction Method:** `lemma agents get <name> --output json` with Python SDK
**Encoding:** UTF-8 (via `$env:PYTHONIOENCODING='utf-8'`)

---

## Recovery Status Summary

| Agent | Status | Missing Metadata |
|---|---|---|
| request-classifier | ✅ **Fully Recovered** | None |
| support-reply-drafter | ✅ **Fully Recovered** | None |
| operations-coordinator | ✅ **Fully Recovered** | None |
| resolution-advisor | ✅ **Fully Recovered** | None |
| account-health-monitor | ✅ **Fully Recovered** | None |

---

## Per-Agent Report

### 1. request-classifier

**Recovery Status:** ✅ Fully Recovered

**Recovered Artifacts:**
- ✅ Full agent metadata (id, name, description, timestamps)
- ✅ Full system prompt / instruction text
- ✅ Complete input schema with enum values
- ✅ Complete output schema with enum values
- ✅ Permissions with all table grants
- ✅ Toolset configuration (POD)

**Missing Metadata:**
- Model name — not exposed in the Lemma agent definition
- Temperature / max_tokens — not exposed in the Lemma agent definition
- Agent runtime — set to `null` in pod
- Icon URL / metadata — set to `null` in pod

**Notes:**
The agent's system prompt references a `workflow_intake` graph that is not
defined as a separate workflow in the pod. This is an orchestration concept
referenced in the prompt but not materialized as a workflow definition.

---

### 2. support-reply-drafter

**Recovery Status:** ✅ Fully Recovered

**Recovered Artifacts:**
- ✅ Full agent metadata
- ✅ Full system prompt / instruction text
- ✅ Complete input schema with channel_hint enum
- ✅ Complete output schema with draft_status enum
- ✅ Permissions with all table grants
- ✅ Toolset configuration (POD)

**Missing Metadata:**
- Model name — not exposed
- Temperature / max_tokens — not exposed
- Agent runtime — set to `null`
- Icon URL / metadata — set to `null`

**Notes:**
Fully recovered. The instruction explicitly prohibits connector calls even
when channel is sms/email. The "never send" rule is the strongest constraint
in the pod.

---

### 3. operations-coordinator

**Recovery Status:** ✅ Fully Recovered

**Recovered Artifacts:**
- ✅ Full agent metadata
- ✅ Full system prompt / instruction text
- ✅ Complete input schema (scope enum: daily/weekly/urgent_only)
- ✅ Complete output schema with recommendation type enum, coordination_status
- ✅ Permissions with all 6 table grants
- ✅ Toolset configuration (POD)

**Missing Metadata:**
- Model name — not exposed
- Temperature / max_tokens — not exposed
- Agent runtime — set to `null`
- Icon URL / metadata — set to `null`

**Notes:**
Recovered fully. Note: the agent has `datastore.record.write` on `appointments`
but the instruction says DO NOT mutate appointments directly. The write grant
may be for future use or for a specific edge case.

---

### 4. resolution-advisor

**Recovery Status:** ✅ Fully Recovered

**Recovered Artifacts:**
- ✅ Full agent metadata
- ✅ Full system prompt / instruction text
- ✅ Complete input schema (dispute_id, force_reanalysis)
- ✅ Complete output schema with 6 resolution enums, 6 analysis_status enums
- ✅ Permissions with all 5 table grants
- ✅ Toolset configuration (POD)

**Missing Metadata:**
- Model name — not exposed
- Temperature / max_tokens — not exposed
- Agent runtime — set to `null`
- Icon URL / metadata — set to `null`

**Notes:**
The `disputes.recommended_resolution` enum values (`full_refund`, `partial_refund`,
`redo_service`, `discount_credit`, `no_action`, `escalate_legal`) are defined only
in the agent's output schema. The database column itself accepts nullable text
(values seen as NULL in all sample records). The agent enforces the enum at the
application layer.

The system prompt references a `workflow_dispute` graph that is not defined as a
separate workflow in the pod — similar to the intake workflow reference in
request-classifier.

---

### 5. account-health-monitor

**Recovery Status:** ✅ Fully Recovered

**Recovered Artifacts:**
- ✅ Full agent metadata
- ✅ Full system prompt / instruction text
- ✅ Complete input schema (today, days_ahead, lookback_days, focus_account_id, etc.)
- ✅ Complete output schema with 7 recommendation types, 4 coordination statuses
- ✅ Permissions with 7 table grants + 2 function grants
- ✅ Toolset configuration (POD)

**Missing Metadata:**
- Model name — not exposed
- Temperature / max_tokens — not exposed
- Agent runtime — set to `null`
- Icon URL / metadata — set to `null`

**Notes:**
This is the most complex agent with dependencies on two deterministic functions.
Both function grants are mirrored onto the agent permissions. The agent heavily
relies on the deterministic function outputs for numerical accuracy.

---

## Encoding Note

All extracted JSON files were saved with UTF-8 encoding. The system prompts
contain Unicode characters (→ bullet arrows, ≤, ∈) that caused rendering issues
with the default windows cp1252 encoder when using `--output json` directly.
These characters rendered correctly when extracted with
`$env:PYTHONIOENCODING='utf-8'`.

---

## Cross-Cutting Missing Metadata

| Field | Reason Missing |
|---|---|
| Model identifier | Lemma does not expose model config in agent get response |
| Temperature | Not in agent definition schema |
| Max tokens | Not in agent definition schema |
| Agent runtime | `null` in all definitions |
| Few-shot examples | Not present in any agent definition |
| workflow graph definitions | Referenced in prompts but not materialized in pod |
