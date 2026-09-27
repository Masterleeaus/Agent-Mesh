# Titan Hub Production Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire and upgrade Titan Apps: Hub against the complete supplied Titan Apps Suite while preserving customer-safe domain boundaries.

**Architecture:** Hub builds deterministic semantic workspace specs, executes them through Interface Runtime, consumes Builder vocabulary through the runtime catalogue, receives visual execution through Interface Runtime -> Visual Runtime, and routes assistant/action intents through Interaction Engine. Core supplies canonical app identity/discovery when installed; provider/domain extensions remain business authority.

**Tech Stack:** PHP 8.2, Laravel 10 service-provider/container conventions, vanilla JavaScript PWA client, JSON manifests/contracts.

**Spec:** `app/Extensions/TitanHub/docs/superpowers/specs/2026-08-31-hub-production-convergence-design.md`

## Global Constraints
- `company_id` is the sole canonical tenant/company boundary.
- Canonical Hub surface is `hub`; `customer` is compatibility-only.
- No business/domain models or direct database access may be added to Hub.
- No arbitrary executable Generative UI output.
- No authenticated API/business response may be cached by Hub's service worker.
- Changes outside `TitanHub` require proven missing public contracts and must be documented.

---

### Task 1: Governed Hub Workspace Specs

**Files:**
- Create: `app/Extensions/TitanHub/System/Presentation/HubWorkspaceSpecFactory.php`
- Test: `app/Extensions/TitanHub/tests/HubWorkspaceSpecFactoryTest.php`

**Interfaces:**
- Consumes: customer-safe projection arrays and canonical Hub workspace ids.
- Produces: `build(string $workspace, array $projection): array` returning a safe `titan.workspace` semantic tree using approved Builder component ids.

- [ ] Write a failing standalone test proving home/book/inbox/more produce semantic component trees, actions are intents, and no scripts/raw HTML exist.
- [ ] Run the test and verify failure because the factory does not exist.
- [ ] Implement the minimal deterministic factory with workspace-specific child components and visual hints.
- [ ] Run the test and verify pass.

### Task 2: Canonical Interface Runtime Wiring

**Files:**
- Modify: `app/Extensions/TitanHub/System/Presentation/AdaptiveHubPresentationBridge.php`
- Modify: `app/Extensions/TitanHub/System/TitanHubServiceProvider.php`
- Test: `app/Extensions/TitanHub/tests/HubInterfaceRuntimeWiringTest.php`

**Interfaces:**
- Consumes: `HubWorkspaceSpecFactory::build()`, `TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime::execute()`.
- Produces: canonical semantic presentation result for Hub.

- [ ] Write a failing test asserting Hub uses `InterfaceRuntime::execute`, `InterfaceContext(surface: hub)`, and the workspace factory.
- [ ] Verify expected failure.
- [ ] Inject/register `HubWorkspaceSpecFactory` and replace hand-built `titan.workspace` spec with the factory output.
- [ ] Keep `compose`/`render` probes only below the canonical execution branch.
- [ ] Verify the test passes.

### Task 3: Suite Discovery and Readiness

**Files:**
- Create: `app/Extensions/TitanHub/System/Integration/HubSuiteReadiness.php`
- Modify: `app/Extensions/TitanHub/System/Health/HubHealthCheck.php`
- Modify: `app/Extensions/TitanHub/System/TitanHubServiceProvider.php`
- Test: `app/Extensions/TitanHub/tests/HubSuiteReadinessArchitectureTest.php`

**Interfaces:**
- Consumes public Core, Interaction Engine, Interface Runtime, Builder and Visual Runtime contract identifiers via the Laravel container.
- Produces `report(): array` with canonical Hub registration and suite wiring readiness.

- [ ] Write a failing architecture test requiring exact current suite public contract identifiers and Core `AppSurface::Hub` discovery.
- [ ] Verify failure.
- [ ] Implement readiness discovery with graceful optional dependency handling.
- [ ] Add readiness output to Hub health.
- [ ] Verify pass.

### Task 4: Governed Browser Component Renderer

**Files:**
- Replace: `app/Extensions/TitanHub/resources/js/hub.js`
- Test: `app/Extensions/TitanHub/tests/HubClientRendererContractTest.php`

**Interfaces:**
- Consumes Interface Runtime result tree.
- Produces accessible DOM using an allowlisted deterministic renderer; unknown components fall back to safe key/value presentation.

- [ ] Write failing static/client contract assertions proving raw JSON `<pre>` rendering is gone, unsafe `innerHTML` data interpolation is absent, known semantic components are handled, and offline fallback exists.
- [ ] Verify failure against current client.
- [ ] Implement DOM-node construction using `textContent`, known semantic component handlers, generic safe fallback, loading state, and offline state.
- [ ] Verify Node syntax and client contract test pass.

### Task 5: Offline/PWA Privacy Hardening

**Files:**
- Modify: `app/Extensions/TitanHub/System/Http/Controllers/HubPwaController.php`
- Modify: `app/Extensions/TitanHub/resources/views/shell.blade.php`
- Test: `app/Extensions/TitanHub/tests/HubOfflinePolicyTest.php`

**Interfaces:**
- Produces static-only service-worker cache policy and visible connectivity state.

- [ ] Write failing test proving `/api/` and navigation are network-only, only same-scope static assets can enter Cache Storage, old Hub caches are purged, and shell exposes online/offline events.
- [ ] Verify failure.
- [ ] Implement static-asset pre-cache for Hub JS only, cache-version cleanup, network-only navigation/API policy, and shell connectivity notification.
- [ ] Verify pass.

### Task 6: Provider Failure Isolation and Release Verification

**Files:**
- Modify if required: `app/Extensions/TitanHub/System/Integration/HubProviderIntegrationRegistrar.php`
- Modify: `app/Extensions/TitanHub/extension.manifest.json`
- Modify: `app/Extensions/TitanHub/extension.json`
- Modify: `app/Extensions/TitanHub/CHANGELOG.md`
- Modify: `app/Extensions/TitanHub/FILE-SHA256.json`
- Create: `app/Extensions/TitanHub/docs/UPGRADE-PASS-FULL-SUITE.md`
- Test: existing and new Hub tests plus suite integration tests.

**Interfaces:**
- Produces Titan Hub next cumulative release and true Hub-only delta.

- [ ] Add/adjust tests for provider absence, duplicate contribution behavior, company boundary, manifest dependencies and version consistency.
- [ ] Verify the new tests fail before release metadata changes where applicable.
- [ ] Apply only required provider isolation/release metadata changes.
- [ ] Run all Hub PHP syntax checks, JS syntax, JSON validation, Hub tests, relevant cross-suite integration tests, forbidden-ownership scan and integrity validation.
- [ ] Fresh-extract the produced ZIP and rerun verification.
