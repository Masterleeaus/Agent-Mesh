# Pass 13 — Spatial Workspace

Version **0.13.0** adds a Maps-authoritative spatial workspace without transferring geospatial authority into Interface Runtime.

## Delivered

- Manifest-only discovery of `kind=map` views for any registered Titan object.
- Hard requirement that spatial views delegate to `titan-maps-intelligence` and use `read-model` or governed `capability` reads.
- Bounded normalization of layers, object pins, discovery candidates, routes, territory polygons and traffic summaries.
- Tenant-safe canonical object-pin validation through the Object Registry.
- Spatial presentation tree through the Titan Builder adapter with safe fallback.
- Manifest-declared `container_hint=map` action intents with product-surface, permission and Hub `customer_safe` filtering.
- All spatial actions remain `executable=false` and preserve capability/Interaction Engine execution authority.
- Invalid geometry/coordinates/cross-tenant pins are omitted rather than repaired or recalculated.
- Read-only `/spatial/{objectKey}` surface.
- Fixed latent `ObjectRegistryContract::find()` calls to the actual `get()` contract in view/legacy-data/Data-mode validation paths.

## Authority boundary

Titan Maps Intelligence owns spatial state and calculations. Interface Runtime consumes a declared Maps-owned read and composes a bounded map presentation only. No routing, traffic, territory, geocoding or candidate calculation is implemented here.

## Compatibility finding

Website1408 Titan Maps Intelligence `2.0.0-alpha.6.3` has the required spatial domain primitives and governed capabilities but has not yet adopted Interface Contribution v1.1. Pass 13 intentionally does not modify that extension.
