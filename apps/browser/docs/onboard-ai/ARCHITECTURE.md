# Codee Onboard AI Architecture

Plan ID: `dfd7ac7b-82f0-4d59-8451-162b1f337025`

## Sovereignty rule

AI proposes. Codee observes, checks, governs, executes, and verifies.

`CodeeProviderGateway` is the only sanctioned inference entry point. The gateway normalizes every request to `codee.ai.request.v1`, selects only eligible provider adapters, and normalizes provider output to `codee.ai.response.v1`. Provider output always carries a fixed non-authoritative envelope; an adapter cannot grant itself plan, mutation, browser, backup, spending, artifact, or memory authority.

The existing `CodeeProviderRegistry` under `src/providers/` is the browser-conversation provider registry for ChatGPT/Claude page adapters. Onboard AI deliberately uses `CodeeAIProviderRegistry` so website automation and AI API/local-model providers remain separate systems.

## Pass 1 foundation

Pass 1 installs:

- `CodeeAISanitizer`
- `CodeeAIRequestContract`
- `CodeeAIResponseContract`
- `CodeeAIProviderContract`
- `CodeeAIProviderRegistry`
- `CodeeAIModelRegistry`
- `CodeeAIAuditLedger`
- `CodeeProviderGateway`
- `CodeeOnboardAIHostIntegration`

No live provider transport, API credentials, provider host permissions, direct fetch/XHR/WebSocket code, or paid inference is added in this pass. A zero-provider Codee remains fully functional and the Workforce gateway degrades to advisory-queue status.

## Request routing floor

Even before the later Free Router exists, the gateway enforces three hard floors:

1. Required capability matching. A provider lacking a requested capability is not eligible.
2. Privacy. `SECRET` and `LOCAL_ONLY` requests may use only `LOCAL` providers.
3. Cost. `FREE_ONLY` excludes paid provider lifecycle classes.

Later routing passes add quota, health, model quality, historical reliability, latency, budgets, failover and provider-specific discovery on top of these non-bypassable floors.

## Audit minimization

The Pass 1 audit ledger records bounded identity and outcome metadata only: request/plan/run/step/manager IDs, purpose, provider/model, privacy class, cost class/value, latency, outcome, finish reason, provider request ID and bounded failover metadata. Full prompts, raw repository evidence and provider credentials are not stored in the ledger.

Persistence, request cancellation, late-response rejection and cross-worker audit retention are delivered in the next Onboard AI pass.
