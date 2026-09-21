# Titan Storage Fabric Mobile Execution Contract — Pass 56

## Purpose

Pass 56 implements the mobile execution side of Titan Storage Fabric without turning the phone into a competing storage authority.

Canonical topology, provider roles, residency, retention and recovery policy remain owned by Titan Core / Goal50.

## Data-class kinds

Every routed data class declares a kind:

- `transactional`
- `object`
- `document`
- `projection`

This prevents provider-category confusion.

Examples:

- jobs/customers/invoices → transactional
- photos/evidence/backups → object
- manuals/contracts/exported documents → document
- bounded mobile read models → projection

## Canonical ownership

Every routed data class has exactly one canonical endpoint.

A canonical endpoint is a policy/state fact, not a mobile write target.

Transactional canonical providers may include PostgreSQL, MySQL, SQLite, AWS RDS, customer VPS and Titan-managed database services.

Object canonical providers may include S3, S3-compatible stores, MinIO, NAS/local filesystem, customer VPS and Titan-managed object storage.

Document providers such as Google Drive, Dropbox, OneDrive and SharePoint may own document-class material, but they cannot be treated as transactional CRM databases.

## Mobile-executable roles

Mobile may execute only bounded roles such as:

- authorised projection
- cache
- evidence
- backup
- archive

Direct mobile execution of `canonical` or `replica` roles is rejected.

## Provider access modes

- `deviceLocal` — encrypted private app storage
- `delegatedHttps` — short-lived Core-authorised transfer ticket
- `localBridge` — reserved for trusted local-node mediation
- `statusOnly` — topology/health visibility only

Canonical and replica endpoints are `statusOnly` from the mobile execution perspective.

## No provider credentials on phone

Topology contains credential mode metadata only.

Raw provider access keys, passwords, cookies or Authorization headers are forbidden in delegated transfer tickets.

Provider access is delegated through short-lived, company/endpoint/role/object-bound transfer tickets.

## Transfer-host binding

Each delegated endpoint carries an allowed transfer-host list.

The ticket URL must match that canonical allowlist. A ticket that points to another host fails before any payload is sent.

Local-network tickets additionally pass Titan's private-network HTTPS policy.

## Integrity

Writes compute SHA-256 before transfer.

Reads optionally verify the expected SHA-256 supplied by the transfer ticket.

Ticket byte limits are enforced.

Every receipt records:

- endpoint
- provider
- role
- object reference
- SHA-256
- byte length
- egress class
- `authority_effect=none`
- completion time

## Cost/privacy

Storage transfer never silently switches to Titan-managed storage.

The selected endpoint is the endpoint authorised by the canonical topology.

Titan Cloud remains an optional managed endpoint, not an implicit fallback.
