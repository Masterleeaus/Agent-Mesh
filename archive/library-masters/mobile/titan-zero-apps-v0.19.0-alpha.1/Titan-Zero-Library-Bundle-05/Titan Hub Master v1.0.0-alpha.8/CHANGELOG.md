# Changelog


## 1.0.0-alpha.8 — Full-suite customer workspace upgrade

- Added provider-backed Hub capability discovery for Home, Book, Inbox and More availability.
- Added a private/no-store capabilities endpoint and accessible capability-aware navigation.
- Fixed Home aggregation so quotes and invoices are included alongside jobs and bookings.
- Fixed nested provider home-summary rendering to avoid array-to-string conversion warnings.
- Added bookings to the semantic Home workspace.
- Suppressed governed service-request controls when no unique provider action is registered.
- Preserved `company_id` as the sole canonical company boundary and provider authority ownership.

## 1.0.0-alpha.7 — full-suite Hub production convergence
- Wired Hub readiness to canonical Core, Interaction Engine, Interface Runtime, Builder and Visual Runtime public contracts.
- Added governed semantic workspace specifications using component IDs verified in the current Titan Builder catalogue.
- Replaced the reconstruction-era raw JSON browser renderer with a deterministic allowlisted semantic renderer using safe DOM text APIs.
- Added static-only Hub shell caching with explicit API/navigation network-only policy and offline connectivity presentation.
- Added plain-text customer assistant planning through Interaction Engine without granting direct business execution authority.
- Isolated read-only provider failures while preserving fail-closed single-provider semantics for governed writes.
- Corrected native Interaction Engine dependency identity to `interaction-engine`; legacy `extension.json` retains `titan-interaction-engine` compatibility slug.
- Required the five canonical Apps infrastructure dependencies in the native Hub manifest.
- Hub health now degrades when required suite public contracts or Core Hub registration are unavailable.
- `company_id` remains the sole canonical tenant/company boundary.

## 1.0.0-alpha.5 — Pass 5 final certification
- Added platform-native `extension.manifest.json` schema 2.2 for actual Titan Zero discovery/installability.
- Declared `company_id` as the sole manifest tenant key and preserved `customer -> hub` only as a surface compatibility alias.
- Declared public contracts, provider boundaries and native dependency metadata without moving domain authority into Hub.
- Preserved legacy `extension.json` as compatibility metadata and linked it to the native manifest.

## 1.0.0-alpha.4 — Pass 4 runtime/security hardening
- Require trusted `company_id` and customer identity before Hub customer operations.
- Preserve legacy tenant identifiers only as compatibility inputs resolving to `company_id`.
- Add regression coverage for customer/company scope requirements.

## 1.0.0-alpha.3 — company boundary hardening
- Enforced `company_id` as the sole canonical isolation boundary.
- Legacy `tenant_company_id` is accepted only from trusted server-side session state and resolves immediately to `company_id`.
- Reject conflicting canonical/legacy company identifiers instead of allowing fallback precedence to hide mismatches.
- Reject client-supplied `company_id`, `tenant_company_id`, and `tenant_id` as authority.
- Emit canonical `company_scoped` projection metadata; legacy tenant-scoped metadata is no longer emitted by Hub.

## 1.0.0-alpha.2 — Agent 3 integration hardening
- Fixed Hub → Interface Runtime integration to call the canonical `InterfaceRuntime::execute()` contract.
- Added runtime `InterfaceContext` construction with explicit Hub customer-safe projection metadata.
- Retained `compose()` / `render()` support only as historical compatibility adapters.
- Removed accidental optional `titan-field` package dependency; Hub consumes provider contracts instead of the field app.
- Added extracted-layout cross-extension integration coverage.

## 1.0.0-alpha.1 — evidence-backed reconstruction
- Rebuilt Titan Apps: Hub from surviving platform contracts after loss of the historical v0.22.1 source archive.
- Preserved CRM's compiled `CustomerOperationsGateway` integration contract.
- Established canonical `hub` surface with `customer` compatibility alias.
- Added provider contribution registry rather than copying domain business logic.
- Added trusted customer-context boundary rejecting browser tenant/company authority.
- Added Hub PWA shell, Home/Book/Inbox/More workspaces, customer API facade and assistant entry.
- Restored per-portal manifest/service-worker scope with private/API navigation network-only.
- Added Interface Runtime and Interaction Engine adaptive public-contract bridges.
- Added customer projection deny-list safety guard and governed action requirements.
