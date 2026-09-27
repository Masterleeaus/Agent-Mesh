# Titan Apps: Visual Runtime v1.2.0

- Adds deterministic visual capability negotiation and explicit fallback planning.
- Adds provider-facing VisualContributionSource registration with provider ownership collision protection.
- Rejects visual metadata that attempts to carry permissions, authorization, entitlement, autonomy, risk, cost, privacy, credentials, or executable payloads.
- Adds auditable degradation reasons for reduced motion, low power, missing capability, and offline media.
- Preserves semantic meaning and explicitly reports that Visual Runtime does not authorize actions.

## v1.3.0 — Pass 4
- Deterministic visual state-transition planning.
- Reduced-motion/low-power transition suppression.
- Deterministic provider visual-contribution precedence and ambiguity rejection.
- No transition may alter business meaning.

## v1.4.0 — Pass 5
- Aligns Visual Runtime authority-key rejection with Builder.
- Adds SHA-256 resource-integrity verification.
- Adds deterministic offline visual cache planning.
- Adds explicit Builder visual metadata contract v1.0 compatibility.
- Binds Pass 4 transition/contribution resolvers through DI.
- Resource definitions may carry declarative SHA-256, byte-size and offline-critical metadata.

## v1.5.0 — Pass 6
- Pins Builder visual metadata schema fingerprint `3e8078fc6be89e534948a4a17ec49878ec1813e75dfba7f327326a8644abfbe1`.
- Adds tenant-aware visual contribution isolation with global fallback.
- Enforces a 1000-entry contribution registry capacity.
- Adds deterministic offline visual cache byte-budget enforcement.
- Keeps all resolution non-authoritative and business-meaning preserving.

## v1.6.0 — Pass 7
- Adds deterministic contribution snapshots with SHA-256 fingerprints.
- Adds strict Visual Runtime package-manifest validation.
- Adds final integration checklist and release evidence.
- Preserves tenant isolation, offline budgets and Builder contract fingerprinting.

## v1.6.1 — company_id boundary correction
- Enforces `company_id` as the sole canonical visual contribution company/tenant boundary.
- Legacy `tenantId` / `tenant_id` are compatibility inputs only and normalize immediately to `company_id`.
- Rejects conflicting canonical and legacy identifiers.
- Deterministic snapshots expose `company_id` only.

## v1.7.0 — Upgrade Pass
- Adds semantic contribution versioning with downgrade rejection.
- Adds deterministic visual resource freshness/expiry evaluation.
- Adds explicit capability degradation ordering.
- Advances Builder visual metadata contract support to v1.1.
- Preserves `company_id` as the sole canonical tenant/company boundary.

## v1.8.0 — Eight-Suite Integration Upgrade
- Adds explicit compatibility with recovered Interface Runtime `InstalledVisualRuntimeBridge`.
- Normalizes both live bridge request aliases and newer Builder v1.1 visual fields.
- Preserves the stable `VisualRuntime::plan(array, VisualEnvironment, VisualPreferences)` public signature.
- Adds suite-runtime compatibility evidence against Core, Interface Runtime, Interaction Engine, Zero, Go and Hub.
- Keeps `company_id` as the sole canonical tenant/company boundary and retains zero business authority.

## v1.9.0 — Runtime Health and Company Scope Upgrade
- Adds VisualRuntimeHealth and fail-closed compatibility negotiation.
- Adds explicit VisualCompanyScope with canonical integer `company_id`.
- Extends VisualEnvironment with an optional trailing companyId field without breaking the supplied live Interface Runtime adapter constructor.
- Does not infer company scope when Interface Runtime has not supplied it.
- Runtime plans expose company scope state and preserve zero business authority.
