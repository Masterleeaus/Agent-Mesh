# Titan Builder v0.9.1 — MagicAI Menu Registration Hotfix

## Fixed

- Registers Titan Builder user and Super Admin sidebar entries in MagicAI's database-backed `menus` table.
- Adds idempotent menu migration using unique `menus.key` values and `updateOrInsert`.
- Adds direct named routes for Titan Hub, Titan Go, Titan Command, and Titan Onboarding so menu links do not depend on unresolved route parameters.
- Removes Titan Builder menu rows cleanly on migration rollback.

## User menu

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

## Super Admin menu

Titan Builder
- Overview
- Integrations
- Registry
- Vertical Packs
- Permissions
- Diagnostics
- Settings

The migration is additive and does not modify existing MagicAI menu records.
