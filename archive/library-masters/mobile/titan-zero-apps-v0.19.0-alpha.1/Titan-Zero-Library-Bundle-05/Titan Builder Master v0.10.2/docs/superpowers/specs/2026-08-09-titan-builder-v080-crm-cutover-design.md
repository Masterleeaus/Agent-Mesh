# Titan Builder v0.8.0 CRM Cutover Design

**Release:** Titan Builder v0.8.0 — CRM + TitanAI + Four-PWA Provisioning + Titan Onboarding

## Goal
Preserve the v0.7 Premium Application Patterns implementation while removing active WorkCore architecture, adopting CRM capability/read-model contracts, adding a fail-closed TitanAI adapter, and making Builder the company-scoped provisioning/configuration engine for Titan Hub, Titan Go, Titan Command and Titan Onboarding.

## Locked boundaries
- `company_id` is the only tenant boundary.
- Builder remains presentation-only and never mutates CRM business records.
- CRM is the authoritative business-data provider.
- TitanAI reasons/proposes; Builder validates and versions.
- Interaction Engine owns wizard progression.
- Titan Mobile runtimes execute the four PWAs; Builder publishes definitions only.
- Chatbot Builder remains separate.
- Titan Connect owns communications transport and secrets.
- No tenant-specific application source-code forks.

## Persistence
Reuse the nine v0.7 Builder tables. A provisioned PWA is represented by one company-scoped Builder project per surface. Application identity/configuration lives in the project `meta.application` envelope; pages continue using Builder pages/specs; versions/snapshots remain the production lifecycle. No additional provisioning table is required.

## Integration contracts
- `ApplicationProvisioningGateway`: governed surface-level application CRUD/configuration/preview/readiness/publish/rollback.
- `ApplicationReadinessService`: capability-aware ready/warning/blocked assessment.
- `MobileApplicationDefinitionPublisher`: emits a schema-versioned DTO/JSON contract without exposing Builder models.
- `CapabilityDiscovery`: host-supplied machine-readable capability availability with fail-closed fallback.
- `CrmBuilderDataSourceProvider`: read-only CRM data-source definitions, never CRM Eloquent models.
- `TitanAIAiUiGenerator`: delegates to a host-bound TitanAI gateway; `UnavailableAiUiGenerator` remains fallback.
- `LegacyWorkCoreSpecMigrator`: deterministic v0.7 normalization with unresolved-action review markers.

## Four surfaces
Internal compatibility IDs remain `customer`, `field`, `owner`; add `onboarding`.
Product identities become Titan Hub, Titan Go, Titan Command, Titan Onboarding. Each surface declares its connectivity/offline contract and required capabilities.

## Governance
AI proposals pass normalisation, Generative UI validation, action catalog, data-source catalog and asset reference validation before preview/save. Unknown components/actions/data sources and raw executable content fail closed.

## Compatibility
Do not rename persisted customer/field/owner IDs. Existing v0.7 projects remain readable. Deterministic WorkCore actions/read-models are migrated; ambiguous `workcore.properties.create` and `workcore.inventory.reserve` are flagged for migration review rather than silently remapped.

## Verification
Standalone/static tests must prove: preserved resource counts, zero active WorkCore runtime/resource dependencies, company isolation architecture, CRM catalogs, TitanAI fallback/adapter selection contract, four surfaces, provisioning idempotency design, vertical-pack schema cutover, mobile DTO independence, Chatbot boundary and package security. Real MagicAI/Titan host certification remains explicitly unverified unless actually run.
