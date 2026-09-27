# Titan Builder v0.9.2 — Permission Bootstrap Hotfix

## Root cause

The management routes introduced explicit checks such as `builder.read`, but the installed MagicAI database contained no Titan Builder permission rows. The supplied SQL confirms a Spatie-style permission schema while existing role-assignment tables may be empty. As a result, `user()->can('builder.read')` returned false even though the actor was authenticated and the Builder menu/route were valid.

## Fix

- Added an additive permission bootstrap migration.
- Registered six Builder abilities with guard `web`.
- Added idempotent mappings to `user`, `admin`, and `super_admin` roles when those shared host roles exist.
- Added legacy `users.type`/role-name compatibility in `BuilderAuthorization` after native `can()` checks.
- Ordinary users cannot obtain `builder.admin` from the compatibility map.
- Permission screen now reports effective Builder authorization rather than raw Spatie-only results.
- Added uninstall cleanup and permission-cache invalidation.

## Security boundary

No request field, company identifier, source surface, menu record, or PWA surface grants permissions. Authentication plus the host/legacy actor identity determines ability; `company_id` independently determines tenancy.

## Host verification boundary

Standalone/package verification can prove structure and static policy. Live host verification should still confirm the installed actor type/roles and cached permission behavior after upgrade.

## Standalone verification

Working-tree verification before final packaging:

- standalone PHP suites: 24/24 PASS
- JavaScript suites: 7/7 PASS
- integration checks: 22/22 PASS
- PHP lint: 161 files PASS
- JSON parse: 325 files PASS
- JavaScript syntax: 11 files PASS
- active legacy tenancy files: 0
- unsafe execution files: 0
- WorkCore token matches in active scan: 1, intentionally limited to `System/Migration/LegacyBusinessSpecMigrator.php` for deterministic v0.7 compatibility mapping; no WorkCore provider/model/runtime dependency is restored.

Host-only verification remains required for the installed account's real Spatie cache and role/type data.
