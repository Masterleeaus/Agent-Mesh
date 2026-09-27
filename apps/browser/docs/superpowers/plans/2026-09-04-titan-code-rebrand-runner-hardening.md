# Titan Code Rebrand and Runner Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the user-facing Codee extension as Titan Code while preserving legacy runtime/protocol compatibility and make initial/periodic Next delivery recover a missing provider content receiver reliably.

**Architecture:** Keep all `CODEE_*`, `Codee*`, storage keys, artifact protocol names and authoritative plan-state contracts unchanged where they are machine interfaces. Rebrand only product-facing UI/package metadata. Harden both standalone Next Runner and authoritative plan nudger through one explicit receiver readiness/recovery path and require truthful degraded status when the initial send is not acknowledged.

**Tech Stack:** Chrome Extension Manifest V3, vanilla JavaScript, Chrome tabs/alarms/storage APIs, Node.js built-in test runner.

**Spec:** User-approved continuation request in this conversation.

## Global Constraints

- Preserve the existing authoritative plan engine and exact conversation identity boundary.
- Do not grant a second plan-advance authority.
- Do not add broad Chrome permissions solely for recovery.
- Preserve existing UI structure/style; edit in place.
- Every pass scans Library for newer cumulative/delta artifacts first.
- Every pass runs focused runner diagnostics plus the full verifier before packaging.
- Produce cumulative and minimal delta ZIPs.

---

### Task 1: Titan Code user-facing identity

**Files:**
- Modify: `manifest.json`
- Modify: `package.json`
- Modify: `src/sidebar/sidebar.html`
- Modify: `src/sidebar/sidebar.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: existing UI IDs, storage keys and protocol constants.
- Produces: Titan Code visible naming while retaining legacy machine identifiers.

- [x] **Step 1:** Add a regression assertion for Titan Code manifest/sidebar branding.
- [x] **Step 2:** Verify the branding assertion fails against the previous cumulative.
- [x] **Step 3:** Change only user-facing product names and package metadata.
- [x] **Step 4:** Preserve `CODEE_ARTIFACT`, `CodeeProviderGateway`, storage keys and runtime globals.
- [x] **Step 5:** Run focused syntax/tests.

### Task 2: Initial Next delivery receiver gate

**Files:**
- Modify: `src/lib/service-worker.js`
- Test: `tests/test-titan-code-runner-start-gate.js`
- Test: `tests/test-next-runner-receiver-recovery-runtime.js`

**Interfaces:**
- Consumes: `waitForContentScriptReady`, `recoverMissingContentReceiver`, exact tab/conversation binding.
- Produces: `ensureNextRunnerReceiverReady(tabId)` and explicit `initialDeliveryVerified` start status.

- [x] **Step 1:** Reproduce the missing-receiver initial send contract as a failing test.
- [x] **Step 2:** Add `ensureNextRunnerReceiverReady(tabId)` with bounded reload/cooldown recovery.
- [x] **Step 3:** Make explicit receiver recovery work even when the general background watchdog is disabled.
- [x] **Step 4:** Require standalone Next sends to pass the receiver readiness gate.
- [x] **Step 5:** Expose `initialDeliveryVerified` and degraded health when initial delivery is unverified.
- [x] **Step 6:** Verify runtime recovery reloads once and sends exactly one `next` after acknowledgement.

### Task 3: Authoritative plan nudger parity

**Files:**
- Modify: `src/lib/service-worker.js`
- Test: `tests/test-titan-code-runner-start-gate.js`

**Interfaces:**
- Consumes: existing `attemptNextNudge` exact step/run/token authority.
- Produces: missing-receiver recovery without changing plan progression authority.

- [x] **Step 1:** Assert the plan nudger opts into receiver recovery.
- [x] **Step 2:** Pass `recoverMissingReceiver:true` through the existing governed send path.
- [x] **Step 3:** Preserve all step identity and artifact advancement checks.
- [x] **Step 4:** Run focused runner suites and full verification.

### Task 4: Release verification and packaging

**Files:**
- Modify: `source-manifest.json`
- Create: cumulative ZIP, minimal delta ZIP, SHA-256 report.

**Interfaces:**
- Consumes: all completed tasks.
- Produces: reproducible Titan Code release artifacts.

- [ ] **Step 1:** Regenerate `source-manifest.json`.
- [ ] **Step 2:** Run `npm test` and require zero failures.
- [ ] **Step 3:** Build cumulative and minimal delta ZIPs.
- [ ] **Step 4:** Re-extract cumulative ZIP into a clean directory.
- [ ] **Step 5:** Run `npm test` against exact packaged bytes.
- [ ] **Step 6:** Publish SHA-256 hashes and changed-file manifest.
