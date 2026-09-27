# Titan Builder Management UI

Titan Builder v0.9.0 adds two extension-owned management surfaces without copying MagicAI core views.

## Company/User Builder

Base route: `/titan-builder`

Pages:
- Home dashboard
- Projects
- Project/page editor
- Applications
- Per-application configuration for Titan Hub / Titan Go / Titan Command / Titan Onboarding
- Assets
- Brand & theme
- Integrations
- Permissions
- Settings

The project editor delegates to existing Builder APIs for Generative UI validation, TitanAI proposals, validated preview, draft persistence, publish and rollback. It does not execute CRM business operations.

Company pages resolve the tenant boundary only through `CompanyContext`. Tenant identifiers are never accepted from management form/query data.

## Super Admin

Base route: `/titan-builder/admin`

Pages:
- Platform overview
- Integration/capability status
- Registry browser
- Ten vertical packs
- Builder permission catalogue
- Diagnostics
- Platform settings

Every Super Admin controller method requires `builder.admin`. The UI does not grant host roles or permissions; assignments remain owned by the host authorization system.

## Settings

`titan_builder_settings` stores Builder-specific preferences only.

Company settings are keyed by trusted `company_id` and `owner_key=company:<id>`. Platform-global settings have `company_id=NULL`, `scope=platform`, and require `builder.admin` to mutate.

The table does not store CRM data, TitanAI secrets, OAuth credentials, device identities or business operational state.

## Host Navigation

The extension provides its own complete sidebar once a user enters Titan Builder. Automatic insertion into a specific MagicAI global sidebar is host-version-specific and remains an integration concern. The stable named routes are available for the host to link:

- `titan-builder.manage.dashboard`
- `titan-builder.admin.dashboard`

## Assets

Management assets publish under the extension-specific `titan-builder` tag to:

- `public/vendor/titan-builder/management/titan-builder-management.css`
- `public/vendor/titan-builder/management/titan-builder-management.js`
