# Titan Storage Fabric Provider Adapter Contract — Pass 56

## Encrypted device adapters

Titan mobile directly supports:

- `deviceEncrypted`
- app-private `localFilesystem`

Both paths remain encrypted with Titan's AES-GCM file vault.

They are suitable for bounded projections, caches, evidence staging, backups or archives.

They are not mobile canonical transactional databases.

## Delegated customer storage

Titan mobile can execute object transfers for customer-controlled endpoints through short-lived delegated HTTPS tickets.

Provider kinds currently represented by the generic delegated adapter include:

- NAS gateway
- S3
- S3-compatible
- MinIO
- Google Drive
- Dropbox
- OneDrive
- SharePoint
- customer VPS/object service

No provider SDK credentials are embedded in the app.

The canonical Core side prepares a temporary upload/download session and returns a credential-free transfer ticket.

## Database providers

PostgreSQL, MySQL and AWS RDS are intentionally absent from the mobile direct adapter factory.

Mobile sees their canonical/replica status through topology and bounded projections; it does not connect directly to their database ports.

## Local NAS

A NAS can be represented through a customer-controlled private HTTPS gateway or trusted local-node service.

A `local_network` ticket must still use HTTPS and satisfy Titan private-network endpoint validation.

Raw SMB/NFS credentials are not introduced into the mobile runtime.

## Document stores

Google Drive, Dropbox, OneDrive and SharePoint can be document/archive/backup destinations.

They must never be treated as live multi-user transactional CRM databases.
