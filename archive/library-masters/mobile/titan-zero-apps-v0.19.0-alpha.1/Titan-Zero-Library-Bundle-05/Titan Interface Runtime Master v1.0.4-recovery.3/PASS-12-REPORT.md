# Pass 12 — Collection View Switching

Version **0.12.0** implements common collection projections over one governed read authority.

## Delivered

- Cards, Table, Board, Calendar, Timeline and Feed projection catalogue.
- Same-authority/source switch sets: views only switch when `data_source.authority`, `mode` and `reference` are identical.
- One `AuthorityReadResult` is reused for in-memory reprojection; switching cannot refetch or widen record scope.
- `ReadQuery` filter/sort/page/per-page/search state and fingerprint remain unchanged across reprojection.
- Session-scoped per-user/per-tenant/per-product-surface view preference with safe in-request fallback.
- Product-surface, Hub customer-safety and permission filtering inherited from the View Registry.
- Presentation mapping through Titan Builder vocabulary with safe fallback components.
- Read-only collection endpoint; no direct mutations or business persistence.
- Map is intentionally deferred to Pass 13 Spatial Workspace.

## Authority boundary

Interface Runtime changes presentation only. A view with a different authority or source is a different collection set and cannot be selected through reprojection.
