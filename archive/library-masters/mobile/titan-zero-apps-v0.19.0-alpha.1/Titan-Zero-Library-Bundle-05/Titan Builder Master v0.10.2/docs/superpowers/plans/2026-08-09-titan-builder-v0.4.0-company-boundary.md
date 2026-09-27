# Titan Builder v0.4.0 Company Boundary Implementation Plan

**Goal:** Make `company_id` the only active Titan Builder tenant boundary while preserving a fail-closed upgrade path for v0.3 data.

**Architecture:** Resolve company identity from trusted authenticated context, persist it as unsigned-bigint `company_id` on every Builder-owned record, scope every repository/publisher/asset query by company, and retain legacy columns only for explicit migration mapping. No runtime fallback to `tenant_id` is permitted.

## Tasks

- [x] Add failing company-boundary regression.
- [x] Replace request `TenantContext` with strict `CompanyContext`.
- [x] Replace model/repository/publisher tenant scopes with company scopes.
- [x] Convert fresh schema to `company_id`.
- [x] Add forward-only v0.3 bridge migration.
- [x] Update manifests, tests, docs and package verifier.
- [x] Execute complete package/Blueprint/JS verification and repack.
