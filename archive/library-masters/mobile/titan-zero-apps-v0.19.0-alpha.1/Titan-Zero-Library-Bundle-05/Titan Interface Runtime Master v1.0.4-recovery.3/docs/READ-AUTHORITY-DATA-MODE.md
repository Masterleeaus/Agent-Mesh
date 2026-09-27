# Read Authority & Legacy Data Mode

Pass 8 makes every Interface Runtime data payload explicit about **where it came from** without making Interface Runtime a business-data authority.

## Read modes

Declared `view.data_source.mode` supports exactly:

- `read-model` — resolves a provider registered by the authoritative extension under `titan.interface.read-model.<authority>` and requires `InterfaceReadModelProviderContract`.
- `capability` — resolves through `CapabilityReadGatewayContract`; the default runtime binding is deliberately unavailable until a governed host gateway is supplied.
- `legacy-route` — resolves an existing named Laravel route to navigation metadata only. It does not execute or copy the legacy controller/query.

## Provenance

`ReadAuthorityRouter` stamps every successful result with the active tenant, authenticated user, product surface, domain, trace ID, correlation ID, query fingerprint and read mode. Adapter-supplied identity fields cannot override runtime identity.

Read caching is request-local only. Its cache key includes tenant, user, surface, domain, branch, workspace, team, authority, mode, reference and query fingerprint. Shared cross-tenant caching is intentionally unsupported.

## Query budget

`ReadQuery` bounds pagination, filters, sort fields, cursor/search size and accepted scalar filter values before a domain adapter is called. Pass 12 may add richer collection-state semantics, but it must preserve this authority and budget contract.

## View authorization

`AuthorizedViewReader` requires:

1. a registered view,
2. current product-surface visibility,
3. `customer_safe=true` for Hub,
4. every permission declared by the view,
5. an available adapter for the declared authority/mode.

A missing adapter or missing permission fails closed.

## Legacy Data mode

`legacy_data_surfaces` preserve existing expert/admin CRUD and table screens. The runtime returns same-origin named-route deep links by default. It does not duplicate the source controller, query builder, model, filters, policies or middleware.

Legacy Data mode is disabled on Hub. The original named route remains responsible for its own middleware/policy authorization in addition to Interface Runtime's contribution-level permission gate.

## Authority boundary

Interface Runtime may compose, filter and annotate read payloads. It must not query authoritative domain tables directly and must not treat a displayed route or read result as permission to mutate data.
