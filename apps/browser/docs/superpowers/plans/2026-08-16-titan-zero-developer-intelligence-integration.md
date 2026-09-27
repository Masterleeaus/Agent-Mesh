> **SUPERSEDED SCOPE NOTE:** This historical Pack-1 plan excluded `app/Extensions/**`. Mega Pack 2 supersedes that boundary; current Codee includes extension code and extension-owned schema/routes as first-class repository evidence while preserving secret/generated/donor exclusions.

# Titan Zero Developer Intelligence Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Integrate the Titan Zero Developer Intelligence Mega Pack v1.0.0 into Codee's existing Runner, Plans, Prompts, Skills, Settings, and Diagnostics surfaces without adding a second runtime or repository bridge.

**Architecture:** Preserve donor analyzers as local plain-JavaScript capability modules loaded by the MV3 service worker. Add one generic Codee capability registry as the receiving authority, then adapt the donor into it. Persist only Codee preferences and bounded derived Titan analysis; never persist raw repository snapshots or SQL row values.

**Tech Stack:** Chrome MV3, plain JavaScript, chrome.storage.local, Node.js assertion tests.

## Global Constraints

- `app/Extensions/*`, `integration-sources/*`, and `donor-extracted/*` are always excluded.
- `.env`, logs, `.git`, vendor, and node_modules are excluded.
- SQL row values are never surfaced or persisted; DDL/schema analysis only.
- Donor code cannot advance plans, mutate repositories, submit provider prompts, or execute commands.
- No new top-level Titan Zero page/tab.
- Existing Codee plan text remains exact; derived context is attached separately.

---

### Task 1: Canonical capability registry and donor loading
- [x] Add failing registration/count/authority tests.
- [x] Add generic Codee capability registry.
- [x] Copy donor runtime modules in declared load order and register through the donor receiver adapter.
- [x] Verify 35 prompts, 38 skills, 14 profiles, no duplicate runtime authority.

### Task 2: Safe snapshot analysis and Runner/Plan context
- [x] Add failing snapshot exclusion, SQL-value, graph, impact and matrix tests.
- [x] Add Titan host integration that filters snapshots, performs in-memory analysis and returns bounded derived context.
- [x] Add optional separate Runner/Plan context attachment without rewriting approved step text.

### Task 3: Existing Prompts/Skills/Settings/Diagnostics surfaces
- [x] Add failing UI/settings wiring tests.
- [x] Render donor prompts/skills on existing pages with search and Runner insertion.
- [x] Extend existing Codee settings persistence with a Titan Zero section and locked safety fields.
- [x] Extend existing Diagnostics with pack registration/latest sanitized analysis evidence.

### Task 4: Worker receiver API and verification
- [x] Add failing worker API tests.
- [x] Add registry/status/analyze/settings message handlers without adding repository/command authority.
- [x] Run all pre-existing Codee tests and all four donor tests.
- [x] Clean-package, re-extract, rerun complete tests, syntax, JSON, manifest/reference/security checks and SHA-256.
