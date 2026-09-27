# Titan Builder v0.9.2 — Permission Bootstrap Hotfix

## Fixed

- Registers Titan Builder abilities in MagicAI's shared `permissions` table.
- Maps company Builder abilities to the existing `user`, `admin`, and `super_admin` roles when Spatie role mappings are in use.
- Adds a constrained compatibility fallback for MagicAI installations that still authorize actors through `users.type` instead of populated `model_has_roles` rows.
- Keeps `builder.admin` unavailable to ordinary `user` actors.
- Uses the same effective authorization resolver on the company Permissions screen.
- Clears the Spatie permission cache after migration and permission cleanup when the package is available.
- Removes Titan Builder permission rows/role mappings on extension uninstall.

## Preserved

- `company_id` remains the only tenant boundary.
- Request/query/route company data never grants an ability.
- Native host `user()->can()` grants remain authoritative first.
- Menu registration from v0.9.1 remains idempotent.
