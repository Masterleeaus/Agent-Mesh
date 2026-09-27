# MagicAI / Titan Host Integration — Titan Builder

## Current installer deployment

The current Titan installer reads root-level `extension.json`, verifies its package contract, deploys the archive into `app/Extensions/TitanBuilder/`, autoloads the declared provider, and can run the extension-specific publish tag.

The package ZIP must therefore contain at archive root:

- `extension.json`
- `System/TitanBuilderServiceProvider.php`
- `routes/`
- `resources/`
- `database/migrations/`
- other extension-owned directories

It must not be wrapped in an extra `TitanBuilder/` folder.

Provider identity is exactly:

`App\Extensions\TitanBuilder\System\TitanBuilderServiceProvider`

## Publishing

Run the extension-specific publish tag when host installation policy publishes assets/config:

`php artisan vendor:publish --tag=titan-builder --force`

Do not use the generic `extension` tag.

## Required company boundary

The host establishes authoritative `company_id` from trusted middleware and/or the authenticated user's company membership. Request route/query/form company IDs are not tenant authority.

If trusted and authenticated company sources disagree, Builder fails closed.

## Host verification sequence

1. Install through the current Titan installer into `app/Extensions/TitanBuilder`.
2. Confirm provider autoload succeeds from the manifest-declared class.
3. Run `php artisan vendor:publish --tag=titan-builder --force` if the installer does not invoke declared publish tags itself.
4. Run migrations using normal host migration controls.
5. Run `php artisan optimize:clear`.
6. Inspect `php artisan route:list` for `titan-builder/api/*`.
7. Verify authenticated middleware establishes a trusted positive `company_id`.
8. Run the packaged/host PHPUnit suite.
9. Verify company/project asset isolation.
10. Publish and rollback a test application and prove snapshot activation cannot cross companies.
11. Run uninstall twice and confirm it is idempotent while retained company data remains.

## Lifecycle sidecar

`extension.manifest.json` remains available for richer Titan capability/lifecycle tooling. The root `extension.json` is authoritative for current installer deployment.

## Production certification boundary

Standalone package checks prove archive structure, syntax, manifest/provider identity, integrity hashes and static architecture. Only the real MagicAI/Titan host can certify service-container resolution, middleware, database behavior, storage and coexistence with CRM/TitanAI/Interaction Engine/Mobile/Chatbot/Connect.

## v0.9 management routes

Titan Builder v0.9 loads `routes/web.php` in addition to its API routes and registers the Blade namespace `titan-builder`.

Stable entry points:

- Company Builder: `titan-builder.manage.dashboard` (`/titan-builder` by default)
- Super Admin: `titan-builder.admin.dashboard` (`/titan-builder/admin` by default)

The extension provides its own navigation shell. A host may add either named route to its global menu without copying Builder views. Super Admin entry must remain restricted by `builder.admin`.

Published management assets:

- `vendor/titan-builder/management/titan-builder-management.css`
- `vendor/titan-builder/management/titan-builder-management.js`
