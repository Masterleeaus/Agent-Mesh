# Plan Runner Recovery Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the comprehensive Plan Runner recovery behavior from v2.0.20 into v2.8.0 and fix off-screen conversations that fail to advance.

**Architecture:** Wrap all bound-conversation content operations in a recovery-aware transport that can wake/focus/reload the exact tab and restore prior focus. Restore parser/debugging-plan features separately, while leaving strict artifact verification and all v2.8 platform authorities intact.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript, `chrome.tabs`, `chrome.alarms`, `chrome.storage`, Node `node:test` regression harness.

**Spec:** `docs/superpowers/specs/2026-08-22-plan-runner-recovery-convergence-design.md`

## Global Constraints
- Do not add `scripting`, debugger, or broad new host permissions.
- Do not replace Titan MCP 1.5, Dashboard, Capability Registry, Connections, Repository Intelligence, Workforce, or current navigation.
- Strict signature-v2 completion requires independently verified artifact evidence.
- Recovery must use the exact bound conversation, preserve exactly-once semantics, and restore prior active tab.
- Every production behavior change begins with a failing test.

---

### Task 1: Restore comprehensive plan parsing
**Files:** `src/sidebar/sidebar.js`; tests copied/adapted from v2.0.20 parser regressions.
**Produces:** `parsePlanText()` support for Step/Task/Pass headings, `Pass N of M`, `Pass N/M`, 30-pass numbered inline plans, fenced-code and nested-list safety.
- [ ] Copy/adapt legacy parser tests and verify they fail against v2.8.0.
- [ ] Port only parser logic needed to satisfy those regressions.
- [ ] Run focused parser tests and existing sidebar parser suite.

### Task 2: Add recovery-aware content transport and off-screen dispatch repair
**Files:** `src/lib/service-worker.js`, `src/content-script.js`; background/watchdog tests adapted from v2.0.20.
**Produces:** `withRunnableConversationTab`, `withFocusedConversationTab`, `sendContentMessageWithWatchdog`, `ensureComposerReady` and recovery-aware `getPageSnapshot`/`dispatchCurrentStep`/sweep.
- [ ] Add failing tests for frozen, discarded, inactive, missing-composer, busy-provider, focus-restore and exact-target behavior.
- [ ] Add recovery preference normalization/storage without `scripting` reinjection.
- [ ] Wake/focus exact bound tab, prevent auto-discard, wait for runnable state, probe composer, targeted reload only when idle, restore previous active tab.
- [ ] Route snapshot, prompt dispatch and recovery sweep content messages through watchdog transport.
- [ ] Revalidate conversation identity after recovery before sending.
- [ ] Run focused exactly-once/retry/recovery tests.

### Task 3: Add Debugging Plan generation and optional Next nudger
**Files:** `src/sidebar/sidebar.html`, `src/sidebar/sidebar.js`, `src/content-script.js`, `src/lib/service-worker.js`.
**Produces:** generated 10-pass debugging plan, debugging mode flag, recovery settings, optional five-minute Next nudger.
- [ ] Add failing tests for generation, deep-scan prompt contract, five-minute cadence, draft protection and no plan advancement.
- [ ] Add Generate Debugging Plan action that fills a deterministic ten-pass plan.
- [ ] Add per-plan debugging mode and next-nudger preference.
- [ ] Implement `SEND_NEXT_NUDGE` only when composer is empty, provider idle and plan remains awaiting artifact.
- [ ] Run focused UI/content/worker tests.

### Task 4: Preserve strict artifact authority and certify release
**Files:** `src/lib/service-worker.js`, release metadata, source manifest, README, regression tests.
**Produces:** v2.8.1 cumulative hotfix.
- [ ] Add failing guard proving visible legacy ZIP candidates cannot advance signature-v2 plans without verified receipt.
- [ ] Keep legacy candidate discovery diagnostic/recovery-only for modern plans.
- [ ] Run all top-level regressions, donor suites and `npm test`.
- [ ] Bump version to 2.8.1, regenerate source manifest and update README/release metadata.
- [ ] Build cumulative ZIP, compute parent/new SHA-256 and file delta.
- [ ] Fresh-extract the exact ZIP and rerun `npm test`; release only on `CODEE_FULL_VERIFY: PASS`.
