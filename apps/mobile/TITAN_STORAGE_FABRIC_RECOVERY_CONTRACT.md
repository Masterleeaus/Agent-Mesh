# Titan Storage Fabric Recovery Contract — Pass 56

## Recovery is not canonical promotion

A degraded canonical store does not make a backup canonical.

Mobile may:

1. inspect canonical endpoint state;
2. follow canonical recovery order;
3. read from an authorised healthy backup/archive/projection/cache source;
4. stage those bytes in Titan encrypted local storage;
5. present the staged candidate to Core/governed recovery.

Mobile may not:

- rewrite the topology to promote a backup;
- write restored bytes directly into a canonical database;
- elect a new canonical endpoint;
- replay business mutations;
- grant itself storage authority.

## Recovery order

Each data-class route can publish a recovery order.

Mobile skips unavailable/unhealthy/unreadable sources and selects the first source for which an authorised adapter exists.

Recovery plans explicitly record `canonicalPromotionAllowed=false`.

## Staged restore

Restore bytes are written to `TitanEncryptedFileVault`.

Restore metadata is stored in `TitanEncryptedJsonStore`.

A staged restore records source endpoint, provider, data class, object ID, digest, byte length and `authority_effect=none`.

Plaintext restore material is not persisted outside the encrypted vault.

## Offline behaviour

Previously synced topology may remain readable offline even after its freshness window, but stale topology cannot increase authority.

System diagnostics expose stale topology status and degraded canonical owners.

## Final recovery

Applying a staged restore to authoritative business state remains a Titan Core / Storage Fabric / Governance responsibility.
