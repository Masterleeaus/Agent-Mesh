# Codee Onboard AI Brain Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Establish the single governed AI inference entry point and provider-independent contracts without enabling any live provider transport yet.

**Architecture:** `CodeeProviderGateway` accepts normalized `codee.ai.request.v1`, consults `CodeeAIProviderRegistry` and `CodeeAIModelRegistry`, enforces authority/privacy/cost policy, then delegates only to registered adapter objects. Responses are normalized to `codee.ai.response.v1`. The existing Workforce `requestAdvisory()` path becomes a compatibility wrapper around the new gateway.

**Tech Stack:** Chrome MV3 JavaScript, existing Codee capability/workforce registry, Node regression tests, no direct `fetch`/XHR/WebSocket in this pass.

## Global Constraints

- No live provider network transport in Pass 1.
- No credential storage in Pass 1.
- No AI result can gain plan/mutation/browser/artifact/spend authority.
- Existing deterministic Codee behavior must remain functional when the gateway has zero providers.
- Existing browser-site `CodeeProviderRegistry` must not be overwritten.

---

### Task 1: Request/Response Contracts

**Files:**
- Create: `src/ai/ai-request-contract.js`
- Create: `src/ai/ai-response-contract.js`
- Test: `tests/test-ai-request-response-contract-pass1.js`

**Interfaces:**
- Produces: `CodeeAIRequestContract.create(input)` and `CodeeAIResponseContract.create(input)`.

- [x] Write failing tests proving IDs, purpose/task, privacy, cost policy, required capabilities, schema, tools and authority fields are normalized/bounded and immutable.
- [x] Run the focused test and verify RED.
- [x] Implement the minimal contracts with deep immutability and no secrets/credentials fields.
- [x] Run focused test and verify GREEN.

### Task 2: Universal Provider Contract + Registries

**Files:**
- Create: `src/ai/provider-contract.js`
- Create: `src/ai/ai-provider-registry.js`
- Create: `src/ai/model-registry.js`
- Test: `tests/test-ai-provider-model-registry-pass1.js`

**Interfaces:**
- Produces: `CodeeAIProviderContract.validateAdapter(adapter)`, `CodeeAIProviderRegistry.register/get/list/status`, `CodeeAIModelRegistry.upsert/get/list`.

- [x] Write failing tests for universal provider operation declarations, duplicate-id replacement safety, immutable registry results, provider lifecycle states, and model capability metadata.
- [x] Verify RED.
- [x] Implement registry/contract logic with bounded immutable records and no transport calls.
- [x] Verify GREEN.

### Task 3: Provider Gateway Authority Fence

**Files:**
- Create: `src/ai/provider-gateway.js`
- Test: `tests/test-ai-provider-gateway-authority-pass1.js`

**Interfaces:**
- Produces: `CodeeProviderGateway.request(request)`, `requestAdvisory(request)`, `status()`, `registerProvider(adapter)`.

- [x] Write failing tests proving no-provider degradation, advisory-only results, forbidden authority fields stripped, unknown/disabled provider rejection, and provider adapters cannot return plan/mutation/browser authority.
- [x] Verify RED.
- [x] Implement gateway using normalized request/response contracts and AI registries.
- [x] Verify GREEN.

### Task 4: Capability Registry + Workforce Compatibility Wiring

**Files:**
- Create: `src/lib/onboard-ai-host-integration.js`
- Modify: `src/lib/service-worker.js`
- Modify: `src/lib/workforce-host-integration.js`
- Test: `tests/test-ai-workforce-gateway-wiring-pass1.js`
- Test: `tests/test-ai-service-worker-status-pass1.js`

**Interfaces:**
- Produces read-only `ai.gateway.status` capability and `GET_AI_GATEWAY_STATUS` worker message.
- Existing Workforce `workforce.ai.request` continues to call `CodeeProviderGateway.requestAdvisory()`.

- [x] Write failing wiring tests.
- [x] Verify RED.
- [x] Import AI modules before Workforce runtime, register status capability/diagnostics metadata, preserve fail-open no-AI behavior.
- [x] Verify GREEN.

### Task 5: Documentation + Full Release Verification

**Files:**
- Modify: `README.md`
- Create: `docs/onboard-ai/ARCHITECTURE.md`
- Create: `docs/onboard-ai/PROVIDER-CONTRACT.md`
- Modify: `source-manifest.json` via generator.

- [x] Document the authority boundary, provider adapter contract and zero-provider degradation.
- [x] Run `npm run source-manifest`.
- [x] Run `npm test` and require `CODEE_FULL_VERIFY: PASS`.
- [x] Run additional gateway fuzz/immutability tests.
- [x] Package cumulative ZIP and verify a clean extraction with the full verifier.
