# Titan Hub Production Convergence Design

## Goal
Upgrade Titan Apps: Hub from an evidence-reconstructed customer shell into a production-wired customer application that consumes the full Titan Apps Suite through stable public contracts while preserving provider/domain authority and `company_id` as the sole tenant boundary.

## Architecture
Hub remains the customer-facing application shell and owns customer presentation, navigation, trusted app context, customer assistant entry points, customer-safe action intent presentation, and PWA/offline shell behavior. It does not own CRM, bookings, jobs, invoices, payments, messaging, Builder, Interface Runtime, Interaction Engine, or Visual Runtime authority.

The canonical execution path is Hub -> Interaction Engine (intent/presentation planning) -> Interface Runtime (semantic execution) -> Builder catalogue (governed vocabulary) -> Visual Runtime (approved visual plan). Domain data enters Hub only through customer-safe contributor/gateway contracts. Core is used for canonical app identity/surface discovery where installed.

## Required changes
1. Add a pure Hub workspace specification factory that creates governed semantic component trees from customer-safe projections. It must use Builder-approved component identifiers and contain no executable code.
2. Upgrade `AdaptiveHubPresentationBridge` to use the workspace factory and the canonical Interface Runtime contract first, retaining historical adapters only as compatibility fallbacks.
3. Add suite capability discovery/readiness that verifies Core Hub registration and the public contracts for Interaction Engine, Interface Runtime, Builder, and Visual Runtime without hard physical coupling.
4. Upgrade Hub health reporting to expose suite wiring state and provider contribution availability.
5. Upgrade the browser renderer from raw JSON output to a deterministic renderer for governed semantic component trees, with safe fallback for unknown components and zero arbitrary HTML/script execution.
6. Improve PWA/offline behavior: cache only static Hub shell assets, never authenticated API/business data, expose offline state, and provide deterministic fallback presentation when workspace fetches fail.
7. Strengthen provider discovery/failure isolation and keep provider/domain logic outside Hub.
8. Add tests for company/customer boundary, canonical `hub` surface, Core/Builder/Interface/Visual wiring, generated UI safety, offline cache policy, unknown component fallback, and package integrity.

## Security invariants
- `company_id` is the only canonical tenant/company boundary.
- `tenant_id` and `tenant_company_id` are compatibility inputs only and cannot establish or override scope.
- Customer identity is trusted server context, never browser authority.
- Rendering never selects raw database fields.
- Hub only receives customer-safe projections.
- Generated UI cannot contain arbitrary JavaScript, Blade, React, Vue, CSS, SQL, credentials, raw destructive URLs, or unregistered actions.
- UI actions are intents; business execution remains governed by the platform/domain capability layer.
- Authenticated/API responses are never cached by the service worker.

## Compatibility
- Canonical app surface is `hub`.
- `customer` remains a compatibility alias through Core/runtime surface resolution.
- Existing `App\\Extensions\\TitanHub` namespace is preserved because current CRM integrations compile against it.
- Historical Interface Runtime adapter probing remains fallback-only.

## Acceptance
- Hub consumes the real public contracts available in the supplied eight-suite archive.
- Builder component catalogue is used indirectly through Interface Runtime and directly for readiness/catalogue evidence where safe.
- Visual Runtime is invoked only through Interface Runtime's visual bridge.
- Interaction Engine remains intent authority.
- Hub works in degraded/offline mode without caching private data.
- All Hub PHP/JS/JSON syntax and standalone/integration tests pass from fresh extraction.
