# Titan Builder Company-ID Boundary

## Canonical rule

Titan Builder v0.8.0 preserves **`company_id` as the single persisted authorization boundary** established in v0.4.0.

The value is an unsigned-bigint company identifier. In Titan Zero/MagicAI integration it must resolve to the authoritative company record used by the host. Titan Builder does not infer company ownership from a user ID, team ID, workspace slug, legacy tenant string or request payload.

## Runtime resolution

`System/Security/CompanyContext.php` resolves the company in this order:

1. trusted middleware request attribute `company_id`;
2. authenticated user's `company_id`.

If both are present they must match. If neither produces a positive integer, authorization fails closed. Query-string, form/body and route parameters are never accepted as the company boundary.

## Persistence rules

All nine Builder-owned tables use `company_id`:

- `titan_builder_projects`
- `titan_builder_versions`
- `titan_builder_pages`
- `titan_builder_page_specs`
- `titan_builder_themes`
- `titan_builder_templates`
- `titan_builder_assets`
- `titan_builder_publish_snapshots`
- `titan_builder_ai_generation_jobs`

Models use `BelongsToCompany` and `forCompany(int $companyId)`. Creation without a positive company ID is rejected.

## v0.3 -> v0.4 migration

Fresh v0.4 installations run `2026_08_09_000100_create_titan_builder_tables.php`, which creates `company_id` directly and does not create `tenant_id`.

Existing v0.3 installations then run `2026_08_09_000200_migrate_titan_builder_to_company_boundary.php`:

- add nullable `company_id` to each existing Builder table that lacks it;
- create company-scoped indexes/uniques for those upgraded tables;
- copy a legacy `tenant_id` only when its value is a positive numeric integer;
- detect non-numeric, empty or otherwise unresolved legacy identifiers and abort the migration;
- only after every row has a positive `company_id`, remove the legacy `tenant_id` column and create the company-scoped indexes.

**Runtime code never reads the legacy column.** A v0.4 upgrade is not considered successful while any Builder-owned row lacks an authoritative company mapping.

### Detect unresolved legacy rows

If the bridge migration reports unresolved rows, inspect each affected Builder table for rows where `company_id IS NULL`. Assign each one an operator-approved authoritative company ID, then rerun the migration. Do not enable v0.4 Builder traffic until the migration completes successfully.

Example inspection:

```sql
SELECT id, tenant_id
FROM titan_builder_projects
WHERE company_id IS NULL;
```

Apply the same check to every Builder-owned table. Do not guess or derive a company ID from a user ID.

## Host integration requirements

The MagicAI/Titan Zero host must establish `company_id` before Titan Builder routes execute. Preferred integration is middleware that resolves the authenticated actor's active company and places the validated ID in the request attributes. The user model's `company_id` is accepted as a secondary trusted source.

If host middleware and the authenticated user disagree, Titan Builder rejects the request rather than choosing one source.

## Asset and publishing isolation

Uploads are written beneath:

```text
titan-builder/<company_id>/<project_id>/...
```

Every `asset://<id>` reference is checked against both company and project. Publish versions and immutable snapshots are queried and created with `company_id`, and snapshot payloads record `company_id` explicitly. Rollback cannot activate another company's snapshot.

## Cleanup policy

The bridge keeps `tenant_id` only while ownership is unresolved. Once every legacy row has a verified `company_id`, the same migration removes `tenant_id`. A successfully upgraded Builder schema therefore has one persisted company boundary.

## v0.8 provisioning rule

The four-PWA provisioning APIs never accept a company identifier in their route or request payload. `ApplicationProvisioningController` obtains company authority from `CompanyContext`, while source-surface/correlation headers are audit metadata only. TitanAI receives the already-resolved positive `company_id` as structured context and proposals cannot change it.
