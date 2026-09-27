# MagicAI Menu Integration

Titan Builder v0.9.1 registers sidebar navigation in the host `menus` table because the current MagicAI/Titan menu is database-driven. Laravel routes alone do not create sidebar entries.

## Registration

Migration:

`database/migrations/2026_08_09_000400_register_titan_builder_menus.php`

Registration is idempotent and uses unique Titan Builder menu keys. Existing host menu records are not rewritten.

### Company/User navigation

- Titan Builder
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

### Super Admin navigation

- Titan Builder
  - Overview
  - Integrations
  - Registry
  - Vertical Packs
  - Permissions
  - Diagnostics
  - Settings

## Authorization

Menu visibility is not authorization. Titan Builder controllers continue to enforce `builder.read`, `builder.edit`, `builder.publish`, `builder.assets.manage`, and `builder.admin` as appropriate. Company context remains resolved only through trusted `company_id` context.

## Upgrade

Installing/upgrading to v0.9.1 runs the menu migration. If the host caches menus/routes, clear the host caches after upgrade.
