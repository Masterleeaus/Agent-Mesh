# Titan Builder v0.4.0

## Company boundary

- Replaced active `tenant_id` persistence/authorization with canonical unsigned-bigint `company_id` across all Builder-owned tables.
- Added `CompanyContext`, resolving only trusted request-attribute/authenticated-user `company_id` values.
- Company-context conflicts and invalid IDs now fail closed.
- Replaced `BelongsToTenant` / `forTenant()` with `BelongsToCompany` / `forCompany()`.
- Renamed repository methods to company-specific contracts and changed company parameters to integers.
- Added `company_id` to immutable publish snapshot payloads.
- Company-scoped asset paths now use `titan-builder/<company_id>/<project_id>`.
- Chatbot import transformation now requires an explicit company ID.

## Database upgrades

- Fresh installs create `company_id` directly on all nine Builder tables.
- Added forward migration `2026_08_09_000200_migrate_titan_builder_to_company_boundary.php` for v0.3 databases.
- Numeric positive legacy IDs are copied safely.
- Any unresolved legacy identifier aborts the upgrade before the legacy boundary is removed.
- After every row has an authoritative `company_id`, the bridge removes `tenant_id`; runtime code never uses it.

## Verification

- Added standalone company-boundary contract checks.
- Added Laravel company isolation tests.
- Added company-context tests for trusted attribute, authenticated user, conflict rejection and explicit rejection of legacy fallback.
- Blueprint sidecar now declares `data.tenant_key = company_id`.
