# Titan Builder v0.9.1 — MagicAI Menu Registration Hotfix

## Root cause

Titan Builder v0.9.0 installed its Laravel routes and views but did not create rows in MagicAI's database-backed `menus` table. The host does not infer sidebar navigation from Laravel routes, so no Titan Builder links appeared after installation.

The supplied `admin_titan` database dump confirms the current host menu contract:

- table: `menus`
- primary key: `id`
- unique menu identity: `menus.key`
- hierarchy: `parent_id`
- route target: `route`
- display fields: `label`, `icon`, `order`, `is_active`, `type`
- extension-backed items use the `extension` field
- user navigation appears before the host Admin label; admin navigation appears after it

## Implemented

- Added additive migration `2026_08_09_000400_register_titan_builder_menus.php`.
- Uses `Schema::hasTable('menus')` and `updateOrInsert` for safe idempotent registration.
- Added one user Titan Builder parent and full child navigation.
- Added nested direct links for Titan Hub, Titan Go, Titan Command, and Titan Onboarding.
- Added one Super Admin Titan Builder parent and all management/admin children.
- Added four fixed application route aliases so the menu renderer never has to provide a `{surface}` route parameter.
- Declared `menus` as a shared host table in `extension.manifest.json`.
- Added uninstall cleanup for only `titan_builder*` keys.
- Added a fallback SQL patch in `docs/TITAN-BUILDER-MENU-HOTFIX.sql`.
- Bumped package version to `0.9.1`.

## Menu tree

### Company/User

Titan Builder
- Overview
- Projects
- Applications
  - Titan Hub
  - Titan Go
  - Titan Command
  - Titan Onboarding
- Assets
- Brand & Theme
- Integrations
- Permissions
- Settings

### Super Admin

Titan Builder
- Overview
- Integrations
- Registry
- Vertical Packs
- Permissions
- Diagnostics
- Settings

## Security

Menu visibility is not treated as authorization. Existing controller/API ability checks remain authoritative. `company_id` remains the only tenant boundary.

## Upgrade behavior

Upgrading from v0.9.0 to v0.9.1 runs the additive menu migration. Existing MagicAI menu rows are not rewritten. The unique Titan Builder keys make repeat registration idempotent.

If host menu/route caches remain stale after upgrade, clear the host caches. The fallback SQL patch is provided only for manual recovery after v0.9.1 code/routes are installed.

## Host verification boundary

The package is statically and standalone verified. Actual sidebar rendering still depends on the installed MagicAI host's current menu renderer and cache behavior, so visual host confirmation remains required after installation.
