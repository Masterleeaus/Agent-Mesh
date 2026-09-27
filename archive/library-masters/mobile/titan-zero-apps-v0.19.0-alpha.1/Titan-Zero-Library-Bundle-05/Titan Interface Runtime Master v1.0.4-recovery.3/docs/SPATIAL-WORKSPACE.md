# Spatial Workspace — Pass 13

Titan Interface Runtime owns **spatial presentation composition only**. Titan Maps Intelligence remains authoritative for geocoding, routing, route matrices, traffic, discovery candidates, territories, spatial calculations and map-location state.

## Manifest opt-in

A domain opts into a spatial workspace by contributing a normal Interface Contribution v1.1 `view` with:

- `kind: map`
- `applies_to` containing the target object key
- product-surface, Hub-safety and permission declarations
- `data_source.authority: titan-maps-intelligence`
- `data_source.mode: read-model` or `capability`
- an authority-owned read reference

No Interface Runtime hard-coded domain allow-list is used. A CRM, Work, Crew, Gear or other object can become spatially presentable only through this declaration.

## Authoritative spatial payload

The selected Maps-owned read may return these optional top-level lists:

- `layers` — declared presentation layers (`points`, `polygons`, `lines`, `routes`, `traffic`, `candidates`, `heatmap`, `custom`)
- `pins` — point locations with optional canonical Titan `object_ref`
- `candidates` — discovery candidate point summaries
- `routes` — authoritative polyline/path geometry and optional distance/duration
- `territories` — authoritative closed polygons and analysis type
- `traffic` — route traffic summaries and optional segment geometry

Interface Runtime bounds and validates this payload for presentation. It **does not geocode, calculate routes, infer territories, estimate traffic, rank candidates or repair invalid geometry**.

## Safety and limits

- Layer limit: 50
- Pin limit: 1,000
- Candidate limit: 500
- Route limit: 100
- Territory limit: 100
- Traffic item limit: 500
- Geometry limit: 5,000 vertices per route/territory/traffic segment
- Coordinates must be finite WGS84 latitude/longitude values.
- Tenant-scoped `object_ref` pins are resolved through the Object Registry and dropped on tenant mismatch.
- Unsafe/invalid records are omitted and counted in diagnostics rather than being repaired by Interface Runtime.
- Raw authority payloads are not copied into the presentation tree; only bounded normalized spatial fields are exposed.

## Spatial actions

Only manifest-declared actions with `container_hint: map` are surfaced. They remain `executable=false` presentation intents and must reference a governed capability or Interaction Engine interaction for mutation/execution. Hub additionally requires `customer_safe=true`.

## Current Titan Maps Intelligence snapshot

The supplied Website1408 Maps snapshot (`2.0.0-alpha.6.3`) already contains routing services/providers, traffic provider contracts, map locations, discovery candidates, territory analysis and governed Maps capabilities. It does **not yet declare Interface Contribution v1.1**, so this runtime does not synthesize or silently infer a Maps contribution. Maps can adopt the contract in a later Maps-specific upgrade without changing Interface Runtime.
