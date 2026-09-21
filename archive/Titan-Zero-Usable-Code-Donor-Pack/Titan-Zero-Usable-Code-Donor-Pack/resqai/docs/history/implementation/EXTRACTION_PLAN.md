# ResQAI — Extraction Plan

**Last Execution:** 2026-06-25
**Status:** Phases 1-3 COMPLETE. Phases 4-5 PENDING.

## Purpose
Define the step-by-step process for extracting all resource definitions from
the Lemma pod into the local project. Each extraction phase produces a set of
files that can be reviewed, version-controlled, and re-imported.

---

## Phase 1 — Table Schemas (Database) ✅ COMPLETE

### Method
Used `lemma tables get --full`, `lemma query run SELECT DISTINCT`, and
`lemma records list --output json` to extract all schemas, ENUMs, and data.

### Targets
- customers ✅
- technicians ✅
- tickets ✅
- appointments ✅
- disputes ✅
- tasks ✅
- operations_log ✅
- accounts ✅
- followups ✅

### Output
- `database/docs/SCHEMA.md` — full documentation with columns, types, ENUMs, FKs, sample data
- `database/docs/*.json` — raw record dumps per table

### Remaining
- DDL export (CREATE TABLE with indexes) still pending
- Not needed immediately for schema understanding

---

## Phase 2 — Function Code ✅ COMPLETE

### Method
Used `lemma functions get --full` and `lemma functions get --output json`.

### Targets
- `account_health_scan` ✅ — **Full Python source extracted**
- `flag_slipping_followups` ✅ — **Full Python source extracted**

### Output
- `database/docs/account_health_scan.json` — full code + schema
- `database/docs/flag_slipping_followups.json` — full code + schema

### Key Findings
- Both are deterministic (no LLM calls)
- Both use `lemma_sdk` with `FunctionContext` + `Pod.from_env()`
- Both run in Python (Pydantic models for I/O)

---

## Phase 3 — Agent Configurations ⚠️ PARTIALLY COMPLETE

### Method
Used `lemma agents get --full` and `lemma agents get --output json`. JSON
dumps succeeded; terminal rendering hit Unicode encoding limits on windows.

### Targets
- request-classifier ✅ — Schema + Prompt saved
- support-reply-drafter ✅ — Schema + Prompt saved
- operations-coordinator ✅ — Schema + Prompt saved
- resolution-advisor ✅ — Schema + Prompt saved
- account_health_monitor ✅ — Schema + Prompt saved

### Output
- `database/docs/<agent-name>.json` — full agent definition (prompt + schema + permissions)

### Notes
- System prompts contain Unicode characters (→, ≤, ∈) that caused rendering issues
- JSON files were saved successfully and contain complete content
- Model names and temperature settings were not visible in the agent definition
- All agents use `POD` toolset (access to all tables)

---

## Phase 4 — App Definitions ❌ NOT STARTED

### Method
Need to inspect each app surface using lemma SDK or CLI.

### Targets
- support-queue
- ops-dashboard
- appointment-board
- resolution-center
- crm-tracker

### Required Actions
- Use `lemma apps list` / `lemma apps get` to inspect app definitions
- Document layout structure and data bindings
- Extract widget configuration

---

## Phase 5 — workflows & Infrastructure ❌ N/A

### Findings
- **Zero workflows** defined in the pod
- **Zero schedules** defined in the pod
- **No connectors** configured
- workflow orchestration is implied in agent prompts (agents reference a
  `workflow_intake` graph), but the graph itself is not in the pod

### Remaining
- If apps are web surfaces, they may have been built externally
- Need to check if apps are Lemma-native widgets or external React apps

---

## Priority Order (Updated)

| Priority | Phase | Status | Rationale |
|---|---|---|---|
| 1 | Phase 1 — Tables | ✅ DONE | Everything depends on the data model |
| 2 | Phase 3 — Agents | ✅ DONE | Core business logic lives in agent prompts |
| 3 | Phase 2 — Functions | ✅ DONE | Stateless logic called by agents and apps |
| 4 | **Phase 4 — Apps** | **❌ NEXT** | UI surfaces depend on data + agent APIs |
| 5 | Phase 5 — workflows | ❌ N/A | Not defined in pod |
