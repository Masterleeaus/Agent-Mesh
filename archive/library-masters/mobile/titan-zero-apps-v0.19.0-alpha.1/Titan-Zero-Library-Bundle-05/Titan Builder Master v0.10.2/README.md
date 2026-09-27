# Titan Builder v0.9.0

**CRM + TitanAI + Four-PWA Provisioning + Titan Onboarding Release**

Titan Builder is Titan Zero's company-scoped, schema-driven application configuration and provisioning engine. It builds and versions presentation configuration; Titan Mobile runs the applications.


## v0.9 Management UI

v0.9 adds the missing first-class management experience on top of the v0.8 CRM/TitanAI/four-PWA engine: company dashboards/projects/editor/app provisioning/assets/brand/integrations/permissions/settings plus a separate `builder.admin` Super Admin surface for registry, vertical packs, diagnostics and platform settings. See `docs/MANAGEMENT-UI.md`.

## Canonical boundary

`company_id` remains the only tenant boundary. It is resolved only from trusted middleware context or the authenticated user's `company_id`; mismatches and missing context fail closed. Builder never accepts request company IDs as authority.

## v0.8 architecture

- **CRM** owns customers, services, work orders, appointments, invoices, payments, staff, business hours and authoritative company/vertical business configuration.
- **TitanAI** proposes governed Builder specs through `TitanAiRuntimeGateway`; no model-provider orchestration is embedded here.
- **Interaction Engine** owns onboarding wizard state/branching/approvals.
- **Titan Builder** owns app/page/navigation/theme/component configuration, preview, versioning, publishing, assets and provisioning definitions.
- **Titan Mobile** owns the runtime/offline/device layer for Titan Hub, Titan Go, Titan Command and Titan Onboarding.
- **Titan Connect** owns communication credentials/providers/webhooks.
- **Chatbot Builder** remains a separate product-specific configuration system.

## Four PWA surfaces

Existing persisted IDs remain compatible:

- `customer` → **Titan Hub**
- `field` → **Titan Go**
- `owner` → **Titan Command**
- `onboarding` → **Titan Onboarding**

Provisioning is configuration-driven: one runtime per product, company-specific validated Builder definitions, no source-code fork per customer.

## Preserved v0.7 Premium baseline

v0.8 preserves all 125 registered components (71 core + 54 Premium/Mobilekit-derived), 26 blocks, the ten original templates, 29 original pages, 25 original specs, dark mode, RTL, reduced-motion support, mobile/tablet/desktop preview, versioned publishing, immutable snapshots, rollback, asset isolation and ten Field/Home Services vertical packs. v0.8 adds four-PWA provisioning resources on top.

## Start here

- `docs/ARCHITECTURE.md`
- `docs/CRM-INTEGRATION.md`
- `docs/TITANAI-INTEGRATION.md`
- `docs/TITAN-ONBOARDING-INTEGRATION.md`
- `docs/APPLICATION-PROVISIONING.md`
- `docs/TITAN-MOBILE-CONTRACT.md`
- `docs/FOUR-PWA-SURFACES.md`
- `docs/COMPANY-ID-BOUNDARY.md`
- `docs/UPGRADE-0.7-TO-0.8.md`
- `docs/KNOWN-LIMITATIONS.md`
- `docs/DEVELOPMENT_REPORT-v0.8.0.md`

## Standalone verification

Run `php tests/standalone/*.php`, the JavaScript donor/runtime suites, `python tests/donor/generative-ui/verify_integration.py`, PHP lint, JSON parse, and the hardened MagicAI Blueprint v3.1 validator/security scanner. Full host certification still requires the actual Titan Zero/MagicAI Laravel installation.

## Current Titan installer packaging

The distributable ZIP uses the `titan-extension-v1` root manifest contract. `extension.json` is authoritative for installation; `extension.manifest.json` remains the richer lifecycle/capability sidecar. The ZIP must expose `extension.json` and `System/` at archive root, and the provider publishes using the extension-specific `titan-builder` tag. See `docs/CURRENT-TITAN-INSTALLER-CONTRACT.md`.

## MagicAI sidebar menus

Titan Builder v0.9.1 registers company/user and Super Admin menu trees in MagicAI's database-backed `menus` table through an additive, idempotent migration. The registration uses unique `titan_builder*` keys and does not rewrite existing host menu records. See `docs/MENU-INTEGRATION.md`.


## v0.9.2 permission bootstrap

Titan Builder v0.9.2 registers the Builder permission set in MagicAI's shared permission tables and provides a constrained compatibility fallback for existing MagicAI accounts that still rely on `users.type`. See `docs/PERMISSION-BOOTSTRAP.md`.
