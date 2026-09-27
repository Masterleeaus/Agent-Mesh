# Pass 02 — Unified Intelligence Catalogue

Status: COMPLETE

Titan Code now has one read-only intelligence catalogue spanning its two intentionally distinct provider authorities: webpage automation (`CodeeProviderRegistry`) and governed inference (`CodeeAIProviderRegistry` / `CodeeProviderGateway`). The catalogue does not merge their authority or allow webpage adapters to execute inference.

## Added
- `src/ai/intelligence-catalogue.js`
- locality taxonomy: ON_DEVICE, BROWSER_PAGE, EXTENSION_WORKER, LOCAL_DEVICE, CUSTOMER_HOSTED, SUBSCRIPTION, BYO_API, TITAN_MANAGED
- cost-sovereignty ordering for inference candidates
- unified provider/model discovery and status
- routing candidate view without creating a second execution gateway
- explicit `company_id` tenant-boundary declaration
- regression test `tests/test-intelligence-catalogue-convergence-pass02.js`

## Preserved authorities
- inference execution: `CodeeProviderGateway`
- inference registration: `CodeeAIProviderRegistry`
- model facts: `CodeeAIModelRegistry`
- webpage automation identity/control: `CodeeProviderRegistry`

## Verification
Targeted convergence, provider/model registry, provider wiring tests pass. Source manifest regenerated.

Next: Pass 03 — browser-native/on-device AI convergence behind the existing browser-model runtime.
