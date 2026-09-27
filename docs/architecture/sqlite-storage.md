# SQLite-first persistence

SQLite is the canonical persistence layer for an ordinary Titan Zero node. Local/device/edge operation must not require PostgreSQL or Redis.

## Boundary

Domain code should depend on the Titan storage contract, not a database driver. `company_id` is the canonical company boundary. `tenant_id` and `tenant_company_id` are compatibility inputs only and must normalize before authorization, storage, projections, decisions, execution, evidence or authority evaluation.

SQLite has no PostgreSQL RLS. Company isolation therefore belongs in repository/storage contracts: company-scoped operations require a validated company context and every company-owned table carries `company_id`. PostgreSQL RLS may remain in the optional server adapter as defense in depth.

## Local profile

Default database: `.titan/data/titan-zero.db` (override with `SQLITE_PATH`). Connections enable foreign keys, WAL, a 5s busy timeout and `synchronous=NORMAL`. Write transactions use `BEGIN IMMEDIATE`, giving predictable single-node write serialization while WAL permits concurrent readers.

## Semantics

UUIDs are application-generated strings rather than database sequences. JSON is stored as canonical JSON text; validation remains an application/domain responsibility. UTC timestamps use ISO-compatible SQLite text defaults. Queued durable work uses the local SQLite queue; ephemeral in-process coordination need not be persisted. Redis is optional for future distributed adapters, never a local prerequisite.

Decision, authority and evidence are separate tables. Persisting intelligence, recommendations, decisions, tasks or events does not create authority and does not imply execution permission.

## Migrations and recovery

`pnpm db:migrate` applies `db/sqlite/*.sql` transactionally and runs `PRAGMA integrity_check`. Historical PostgreSQL migrations remain as migration evidence and for the optional server compatibility path (`pnpm db:migrate:server`). Existing PostgreSQL installations require an explicit export/import transform; direct blind SQL translation is not supported.

For backup, checkpoint or stop writers before copying the database, or use SQLite's online backup API in deployment tooling. Keep the database plus any required WAL/SHM files together when copying a live database.

## Synchronisation

Synchronization is intentionally outside this convergence pass. `operational_events.synced_at` provides a minimal durable seam for later encrypted Storage Fabric replication without making remote storage part of normal operation.
