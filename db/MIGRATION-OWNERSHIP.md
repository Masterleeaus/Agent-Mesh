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
