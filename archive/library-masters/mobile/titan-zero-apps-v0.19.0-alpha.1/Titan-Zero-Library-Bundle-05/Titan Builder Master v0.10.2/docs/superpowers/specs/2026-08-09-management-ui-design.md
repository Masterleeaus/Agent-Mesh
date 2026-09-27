# Titan Builder v0.9 Management UI Design

## Goal
Add complete, first-class management surfaces for Super Admin and company users without changing Titan Builder's CRM/TitanAI/Mobile authority boundaries.

## Architecture
The UI is a native extension management layer loaded from `routes/web.php` and the `titan-builder` Blade namespace. Controllers use the existing company-scoped models, `ApplicationProvisioningGateway`, `CapabilityDiscovery`, registries, publisher and validation services. Mutation-heavy app configuration continues through the existing authenticated API; Builder-specific UI preferences/settings use one additive settings table with explicit platform-global versus company scope.

The UI does not become an operational business backend. CRM remains authoritative for business data, TitanAI remains the AI runtime, Titan Mobile runs the PWAs, Interaction Engine owns onboarding state, and Chatbot/Titan Connect remain separate.

## Company/User Surface
Routes under `/titan-builder` provide:
- Dashboard with project/app/readiness summary.
- Projects list/create and project editor.
- Application provisioning overview and per-surface editor for Titan Hub, Titan Go, Titan Command and Titan Onboarding.
- Asset manager with company/project scoped uploads.
- Brand/theme management.
- Integration capability status.
- Company Builder settings.
- Permissions/ability visibility.

The project editor exposes page selection, validated JSON spec editing, TitanAI proposal, validation, preview, draft save, publish and rollback controls. It uses the existing Generative UI renderer and API contracts.

## Super Admin Surface
Routes under `/titan-builder/admin` require `builder.admin` and provide:
- Platform overview and package/version state.
- Integration health and capability discovery.
- Component/block/template/theme/surface registry browser.
- Ten canonical vertical-pack browser.
- Builder permission catalogue.
- Diagnostics and package integrity/runtime checks.
- Global Builder feature/settings editor.

Super Admin pages do not bypass company tenancy for company resources and do not imply CRM/TitanAI operational authority.

## Settings Persistence
Add `titan_builder_settings` with nullable `company_id`, explicit `scope` (`platform` or `company`), `owner_key`, setting key, JSON value, actor and timestamps. Company settings are always resolved from trusted `CompanyContext`; platform settings are only accessible under `builder.admin`. The `owner_key` provides deterministic uniqueness while `company_id` remains the tenant boundary for tenant-scoped settings.

## Authorization
Company pages require `builder.read`; mutations require existing `builder.edit`, `builder.publish`, or asset-specific host abilities when present. Admin pages require `builder.admin`. UI source/surface never grants authority.

## Styling/Frontend
Use extension-owned Blade, CSS and small vanilla JavaScript. No dependency on copied MagicAI core views. The shell is responsive, dark-mode aware, keyboard accessible and visually consistent with Titan's premium mobile language. All URLs and CSRF data are server-provided.

## Error Handling
Controllers fail closed on missing company context or ability. Company records are always queried via `forCompany()`. UI API failures surface status/error messages and never report success optimistically. Missing optional integrations render as unavailable rather than broken.

## Testing
Add standalone package/UI contracts that assert:
- `routes/web.php` and active views exist.
- Provider loads views/web routes and publishes management assets with extension-specific tag.
- Company and admin route separation/abilities.
- Settings storage scoping.
- All expected management pages exist.
- No `tenant_id` fallback or copied MagicAI core files.
- No unsafe JS execution (`eval`, `new Function`, `document.write`).
- Existing v0.8 behavior tests remain green.
