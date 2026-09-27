# Titan Storage Fabric Mobile Topology Contract — Pass 56

## Boundary

Titan Core owns canonical Storage Fabric policy and topology.

Mobile receives an encrypted, bounded projection describing where data classes live and what non-canonical storage roles the device is permitted to use.

Mobile never becomes the canonical Storage Fabric registry.

## Canonical roles

The wire vocabulary is:

- `canonical`
- `replica`
- `authorised_projection`
- `cache`
- `evidence`
- `backup`
- `archive`

Each routed data class has exactly one canonical endpoint.

A topology containing multiple canonical endpoints for the same data class fails closed.

## Provider classes

Supported topology identities include:

- device encrypted storage
- local encrypted filesystem
- NAS
- S3
- S3-compatible
- MinIO
- Google Drive
- Dropbox
- OneDrive
- SharePoint
- PostgreSQL
- MySQL
- SQLite
- AWS RDS
- customer VPS
- optional Titan-managed storage

Provider identity never grants authority.

## Transactional restrictions

Google Drive, Dropbox, OneDrive and SharePoint cannot advertise `canonical` or transactional `replica` roles.

Canonical transactional roles require an appropriate transactional provider such as PostgreSQL, MySQL, SQLite, RDS/customer-hosted database or explicitly governed Titan-managed database.

Canonical endpoints are `status_only` from mobile.

The phone never connects directly to the authoritative transactional database.

## Topology identity

A topology is bound to:

- company ID
- monotonic sequence
- revision
- correlation ID
- issue time

New topology application rejects:

- company mismatch
- invalid identity
- stale/future payloads
- sequence regression
- conflicting replay
- duplicate endpoint IDs
- duplicate data-class routes
- unknown endpoint references
- role/provider mismatches
- raw long-lived provider credential declarations

An already accepted topology may remain readable offline after it becomes stale. Staleness reduces confidence/availability; it does not erase the last known topology or increase authority.

## Mobile projection

A device endpoint is matched by `node_id`.

Only bounded local roles are projected into the mobile storage manifest.

Even if a malformed topology attempted to make a phone canonical, topology validation rejects the configuration before projection.

`canonical_owner` on each mobile projection points back to the actual canonical endpoint ID.

## Sovereignty

Titan Cloud is not assumed to be the centre.

The canonical endpoint may be customer premises, customer cloud, VPS/RDS or an explicitly chosen managed service.

Mobile receives the same UX regardless of where the canonical owner lives.
