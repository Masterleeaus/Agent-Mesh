# Global Work Trays

Pass 10 implements five cross-domain trays: `continue`, `attention`, `approvals`, `inbox`, and `sync`.

## Contribution model

Extensions declare entries in `global_work` with `tray`, `provider_ref`, and `product_surfaces`. The runtime resolves each provider through a contributor-scoped binding:

`titan.interface.global-work.<extension-key>.<provider_ref>`

(without spaces: `titan.interface.global-work.<extension-key>.<provider_ref>`).

The bound service must implement `GlobalWorkProviderContract`. The contributor scope prevents one extension from impersonating another extension's provider name.

## Reference-only boundary

Providers return `GlobalWorkItemReference` objects, not authoritative domain rows or mutable workflow state. A reference contains lightweight presentation metadata plus source authority/reference and optional object, Interaction Engine, or governed action references. `executable` is always false.

The runtime independently rechecks `tenant_company_id`, required capabilities, tray identity, and canonical object-reference tenant scope. It does not trust provider filtering as the only authorization boundary.

## Aggregation

Items are sorted by priority, then recency, then deterministic source identity. Duplicate `(tray, source_authority, source_reference)` items are collapsed. Provider failures are isolated and represented as source health rather than exceptions that collapse the whole tray.

Tray states are:

- `ready` — at least one visible reference and every source is healthy;
- `empty` — sources are healthy but no references are visible;
- `degraded` — one or more registered sources are degraded/unavailable, with any healthy-source items still returned.

## Authority

Continue state remains owned by Interaction/domain engines, Attention by its source signal/domain authority, Approvals by governance/risk/domain systems, Inbox by communications authorities, and Sync by offline/sync authorities. Interface Runtime aggregates presentation references only.
