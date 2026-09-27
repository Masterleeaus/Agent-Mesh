# Titan Hub Full-Suite Production Convergence — 1.0.0-alpha.7

## Scope
Hub-only implementation upgrade against `Titan-Apps-Eight-Suite-Interface-Recovery-Rebase-Pass4-CUMULATIVE.zip`. No implementation files in Core, Zero, Go, Builder, Interface Runtime, Interaction Engine, or Visual Runtime were modified. Suite integration evidence/version expectations were updated for the Hub release.

## Wiring
- Core: `TitanAppsApplicationRegistry`, canonical `AppSurface::Hub`.
- Interaction Engine: `PublicInteractionEngineInterface`, `CapabilityIntentGatewayInterface`.
- Interface Runtime: canonical `InterfaceRuntime::execute()` with Hub `InterfaceContext`.
- Builder: semantic component IDs are verified against current Builder catalogue; Interface Runtime remains catalogue consumer/execution boundary.
- Visual Runtime: Hub emits visual metadata only; detailed visual execution stays behind Interface Runtime -> Visual Runtime.

## Customer/domain authority
CRM and domain providers remain truth/writes. Hub aggregates customer-safe reads and exposes actions as governed intents. Read-only contributor failures are isolated; governed writes still require exactly one provider and fail closed on zero or ambiguity.

## Company boundary
`company_id` is the only canonical tenant/company boundary. Legacy `tenant_company_id` remains trusted server-side compatibility input only and cannot override a conflicting `company_id`. Browser-supplied company/tenant identifiers remain rejected.

## Client/PWA
The browser now renders governed semantic component trees with deterministic DOM construction and `textContent`; no arbitrary script/HTML execution is introduced. The service worker caches only the Hub static JS shell asset. Authenticated navigation and `/api/` routes are network-only/no-store.

## Known verification boundary
The legacy six-suite verifier is stale in the supplied source and fails before this Hub pass due to pre-existing Core/Zero/Interaction Engine version expectations. The current eight-suite verifier passes after updating only the Hub expected version and integration evidence. Full installed Laravel host boot is not claimed because the archive is a suite package rather than a configured host deployment.
