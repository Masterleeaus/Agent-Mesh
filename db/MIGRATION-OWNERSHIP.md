# Database migration ownership under the Titan Business Node architecture

The files in `db/migrations/` are immutable historical migrations for the full base-web / AI-FSM field-service database. **Do not edit, renumber or delete applied migrations.**

They are not, as a directory, the canonical Titan Runtime storage model.

## Current classification

### NATIVE_TITAN_FSM — preserve and converge

The majority of the historical schema belongs here, including families for:

- accounts/users/business memberships and legacy `account_id` tenancy;
- clients/customers, properties/sites and portal records;
- booking requests/intake;
- jobs/projects, work orders, visits/appointments and tasks/checklists;
- estimates/quotes, price book, pricing, change orders;
- invoices, payments, deposits and receivables;
- expenses, mileage, vehicles and material/inventory records;
- technician availability/skills/vehicle assignments;
- time clocks/business days and human operational records;
- maintenance plans/assets/property-condition business records;
- business communications logs/notifications where superseded by canonical Communications/Channels providers.

These migrations remain part of the native Titan FSM lineage. Do not migrate them to Frappe merely because ERPNext has similar entities. Converge PostgreSQL-specific assumptions, duplicate runtime mechanisms and legacy naming while preserving useful native behavior. Frappe/#1051 is used only for capabilities deliberately delegated or added as extensions.

### TITAN_RUNTIME_CONTROL_EVIDENCE — canonical owner must be proven individually

Some later tables/columns may contain reusable Titan-native runtime/control/evidence semantics, for example:

- trace/correlation/audit metadata;
- workflow/reliable outbox concepts;
- capture/field-completion evidence;
- runtime login/context boundaries;
- idempotency/replay metadata;
- attention/read-model state where explicitly projection-only.

Do **not** assume that a table is canonical merely because it is technical. Before retaining it as permanent Titan storage, bind it to a current owner such as #811 runtime, #913 Evidence, #14 execution, #639 Workforce, #21 Interaction or another canonical mission and prove current reachability.

Where a canonical runtime already has its own SQLite/store/schema under `packages/runtime/**` or another owner, converge rather than duplicate the old DB table.

### LOCAL_OFFLINE_PROJECTION

PWA/mobile/Edge local caches, queues and projections are not defined by these server migrations. They have separate bounded schemas and reconciliation contracts.

### RETIRED_DONOR

Dovetails/Home Assistant/property-vault and other historical product-specific schema that has no current reachable consumer becomes donor/provenance material after compatibility consumers are removed.

## Migration rule

For each business family:

```
native FSM implementation
  -> preserve behavior
  -> classify ownership
  -> extract shared contracts where useful
  -> improve portability/runtime boundaries
  -> verify parity + cross-company + restart behavior
  -> retire only duplicate/dead/obsolete implementation
```

Never point Frappe directly at this schema or attempt a table-for-DocType 1:1 rewrite without semantic mapping.

## New migration policy

New files under `db/migrations/` require an explicit current storage owner in the migration header/PR and must state one of:

- `owner: legacy-base-web-compatibility`
- `owner: titan-runtime:<canonical-owner>`

New native FSM schema changes are allowed when they extend a Titan-owned mature capability and declare their storage/domain owner. Frappe is not the default owner simply because a similar ERPNext DocType exists.

`company_id` is Titan's canonical logical company identity. Existing `account_id` columns remain compatibility schema until migrated and do not redefine canonical tenancy.

## Immutable legacy PostgreSQL sequence

`db/migrations/MANIFEST.json` is the reviewed inventory for the legacy
PostgreSQL compatibility stream. Each entry binds an exact filename to its
numeric-prefix sort position and SHA-256. The runner validates the manifest
before database access, then executes that explicit sequence. Migration
identity remains the filename because deployed `schema_migrations` tables use
`filename` as their primary key; filenames and SQL are not renamed to repair
duplicate numbers.

The 16 duplicate-prefix groups are explicitly resolved for deterministic
ordering by exact filename. Their actual applied status is recorded as
**unverified** because no deployed `schema_migrations` snapshots are available
in this repository. Existing filename-only rows remain checksum-unverified;
the runner does not invent a checksum for them. Newly applied rows record the
manifest checksum, and a later checksum mismatch fails before applying further
migrations. Pending SQL and its ledger insert run in a single PostgreSQL
transaction. Legacy no-ledger adoption seeds all filenames in one transaction,
so an interrupted seed cannot look like a partial established history.
Migration 088's explicit top-level transaction markers are removed only in the
generated execution wrapper so its unchanged, checksum-verified source
participates in the same transaction. Migration 089 is split at its enum-add
statement because PostgreSQL requires that enum value to be committed before
later statements can use it. Its earlier writes are idempotent upserts; if the
final transaction fails, the manifest ledger remains absent and a retry safely
replays those stages. Before certifying a supported historical deployment,
collect a sanitized per-company filename inventory and schema fingerprint, then classify
each pair as applied/not applied for that installation. Do not infer live
history from the repository manifest.

To collect sanitized evidence from a supported installation, set
`MIGRATION_DATABASE_URL` through the host's protected environment and run
`node scripts/export-migration-history-evidence.mjs`. It emits migration
filenames, recorded checksums/status, duplicate-pair status, and a SHA-256 of a
schema-only dump. It does not emit the connection URL, database name, applied
timestamps, or company rows. Share only this JSON artifact; do not provide a
full database dump for history classification.

The manifest covers only `db/migrations/`, the legacy PostgreSQL compatibility
stream. It does not certify the mixed `db/sqlite/` stream or supply the
owner-classified `COMPANY_NATIVE_FSM` manifest required for per-company
provisioning; those paths must not be conflated.
