# Titan Mobile Storage Provider Execution Contract — Pass 56

## Execution classes

Mobile executes only non-canonical Storage Fabric roles:

- authorised projection
- cache
- evidence
- backup
- archive

Direct mobile execution against:

- `canonical`
- transactional `replica`

is prohibited.

## Device/local filesystem

`TitanDeviceEncryptedStorageAdapter` supports:

- device encrypted storage
- application-private local filesystem

Binary objects are encrypted with AES-256-GCM through Titan secure key storage.

Plain object bytes are not persisted to a temporary plaintext file during normal storage writes.

## Customer storage providers

NAS, S3, S3-compatible, MinIO, Google Drive, Dropbox, OneDrive, SharePoint and customer VPS object destinations use delegated transfer tickets.

Mobile does not store provider API keys, passwords or long-lived storage credentials.

The flow is:

1. mobile asks authenticated Titan Core for a bounded transfer ticket;
2. Core selects/authorises the configured customer endpoint;
3. Core returns an ephemeral object transfer grant;
4. mobile validates company, endpoint, provider, role, operation, object identity, expiry, byte limit and SHA-256;
5. mobile transfers directly to/from the authorised customer destination;
6. mobile records an authority-neutral transfer receipt.

## Transfer ticket restrictions

Tickets:

- are one-operation bounded;
- expire within one hour;
- require an exact object SHA-256;
- require an object reference;
- may not embed URL user-info credentials;
- may not contain Authorization/Cookie provider credentials;
- use HTTPS for customer-cloud transfers;
- use private/local HTTPS for `local_network` transfers.

HTTP redirects are not treated as success by Titan's HTTP client.

## Cost sovereignty

The default mobile adapter factory includes customer-controlled/local providers.

It intentionally does not insert a Titan-managed storage adapter.

Titan-managed storage therefore cannot become a hidden fallback or hidden free-tier cost.

## Evidence

Existing evidence upload remains the upload authority.

A Storage-Fabric-aware preflight now checks that the canonical topology contains a healthy authorised evidence destination before releasing staged evidence to the existing upload flow.

If the destination is unavailable, evidence remains staged locally.
