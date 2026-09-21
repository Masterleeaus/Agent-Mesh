# Codee Repository & Coding Intelligence Mega Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a large Codee capability pack for repository intelligence, safe coding workflows, targeted verification, and MCP consumption without duplicating the Codee MCP runtime.

**Architecture:** Pure JavaScript analyzers and policy engines operate on snapshots/evidence supplied by Codee. A thin receiver adapter registers capabilities into existing surfaces. All privileged actions remain host-owned and backup-gated; plan advancement remains exclusively Codee core-owned.

**Tech Stack:** Chrome MV3-compatible plain JavaScript, Node.js built-in test/runtime APIs, no third-party runtime dependencies.

## Global Constraints

- Do not create an MCP transport/runtime; consume the other agent's MCP implementation through an adapter.
- Do not advance plan steps.
- Do not exclude `app/Extensions/**`.
- Block secret values from AI/provider context.
- Require verified backup receipts before mutation execution.
- Use exact paths and deterministic outputs where practical.
- Keep modules independently understandable and dependency-light.

---

### Task 1: Repository policy, inventory and search
**Files:** `src/repository/repository-policy.js`, `repository-inventory.js`, `repository-search.js`
- [ ] Write failing scope/sensitive-path tests.
- [ ] Verify failures are due to missing implementation.
- [ ] Implement path policy, inventory and bounded search.
- [ ] Run focused tests and verify pass.

### Task 2: Symbols, dependencies and Laravel tracing
**Files:** `symbol-index.js`, `dependency-graph.js`, `laravel-tracer.js`, `migration-guard.js`
- [ ] Write failing symbol/dependency/Laravel tests.
- [ ] Verify expected failures.
- [ ] Implement deterministic analyzers.
- [ ] Run focused tests and verify pass.

### Task 3: Diff, impact and change-set planning
**Files:** `diff-engine.js`, `impact-engine.js`, `change-set.js`, `rollback-planner.js`
- [ ] Write failing diff/impact tests.
- [ ] Verify expected failures.
- [ ] Implement line diff, impact ranking, change receipts and rollback plans.
- [ ] Run focused tests and verify pass.

### Task 4: Backup-gated mutation and command intelligence
**Files:** `mutation-envelope.js`, `command-policy.js`, `test-selector.js`, `verification-planner.js`
- [ ] Write failing backup-gate and command tests.
- [ ] Verify expected failures.
- [ ] Implement mutation envelopes, command classes and targeted verification selection.
- [ ] Run focused tests and verify pass.

### Task 5: Dependency, Git and runtime intelligence
**Files:** `dependency-analyzer.js`, `git-intelligence.js`, `log-analyzer.js`, `error-classifier.js`
- [ ] Write failing analyzer tests.
- [ ] Verify expected failures.
- [ ] Implement parsers/classifiers.
- [ ] Run focused tests and verify pass.

### Task 6: MCP consumer boundary and context broker
**Files:** `src/integration/mcp-adapter.js`, `remote-context-broker.js`, `host-capabilities.js`
- [ ] Write failing adapter contract tests.
- [ ] Verify expected failures.
- [ ] Implement adapter validation, calls and bounded evidence merging.
- [ ] Run focused tests and verify pass.

### Task 7: Codee integration catalogues
**Files:** `src/catalog/repository-prompts.js`, `repository-skills.js`, `repository-profiles.js`, `src/integration/receiver-adapter.js`, `src/repository/repository-coding-pack.js`
- [ ] Write failing registration/authority tests.
- [ ] Verify expected failures.
- [ ] Implement catalogues, descriptor and receiver integration.
- [ ] Run focused tests and verify pass.

### Task 8: Handoff, manifests and full verification
**Files:** `pack.json`, `README.md`, `INTEGRATION-CONTRACT.md`, `AGENT-INTEGRATION-PROMPT.md`, `VERIFICATION.md`
- [ ] Validate JS syntax for every source/test file.
- [ ] Run all regression suites.
- [ ] Verify no forbidden MCP transport implementation or plan-advance authority exists.
- [ ] Build ZIP, extract cleanly and rerun verification against exact artifact.
