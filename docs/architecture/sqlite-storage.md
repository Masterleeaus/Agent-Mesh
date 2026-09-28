# SQLite local and runtime persistence

SQLite is the canonical local/runtime persistence target where the current owner defines it. Local/device/edge operation must not require PostgreSQL or Redis. The Business Evidence Ledger (#913) owns factual history; mapped operational CRM, jobs, assets, inventory and finance domains use Titan Domain APIs over the #1051 Frappe/ERPNext Business Engine, with per-company sites/databases by default. SQLite business tables in the inherited application are migration/compatibility donors until behavior and provider parity are certified. See `TITAN-ZERO-BLUEPRINT-V3.md` and `ai/INVARIANTS.md` for ownership.

## Boundary

Local/runtime storage consumers should depend on their canonical storage contract, not a database driver. Business-domain surfaces depend on Titan Domain APIs rather than these local tables or Frappe DocTypes. `company_id` is the canonical company boundary. `tenant_id` and `tenant_company_id` are compatibility inputs only and must normalize before authorization, storage, projections, decisions, execution, evidence or authority evaluation.

SQLite has no PostgreSQL RLS. Company isolation therefore belongs in repository/storage contracts: company-scoped operations require a validated company context and every company-owned table carries `company_id`. PostgreSQL RLS may remain in the optional server adapter as defense in depth.

## Existing local profile

The checked-in SQLite adapter defaults to database: `.titan/data/titan-zero.db` (override with `SQLITE_PATH`). Connections enable foreign keys, WAL, a 5s busy timeout and `synchronous=NORMAL`. Write transactions use `BEGIN IMMEDIATE`, giving predictable single-node write serialization while WAL permits concurrent readers.

## Semantics

UUIDs are application-generated strings rather than database sequences. JSON is stored as canonical JSON text; validation remains an application/domain responsibility. UTC timestamps use ISO-compatible SQLite text defaults. Queued durable work uses the local SQLite queue; ephemeral in-process coordination need not be persisted. Redis is optional for future distributed adapters, never a local prerequisite.

Decision, authority and evidence are separate tables. Persisting intelligence, recommendations, decisions, tasks or events does not create authority and does not imply execution permission.

## Migrations and recovery

For the checked-in local SQLite schema, `pnpm db:migrate` applies `db/sqlite/*.sql` transactionally and runs `PRAGMA integrity_check`. The PostgreSQL server migration command (`pnpm db:migrate:server`) remains for inherited compatibility deployments. Neither migration command commissions a #1051 per-company Frappe site or certifies Evidence Ledger provenance. Existing PostgreSQL installations require an explicit mapped export/import and verification path; direct blind SQL translation is not supported.

For backup, checkpoint or stop writers before copying the database, or use SQLite's online backup API in deployment tooling. Keep the database plus any required WAL/SHM files together when copying a live database.

## Synchronisation

The existing `operational_events.synced_at` column is a local synchronization seam, not by itself the canonical #913 Business Evidence Ledger or proof of encrypted Storage Fabric replication. Sync behavior must follow its owning contract and verify accepted evidence and outcomes.
