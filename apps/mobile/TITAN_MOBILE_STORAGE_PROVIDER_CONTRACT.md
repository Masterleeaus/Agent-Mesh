# Titan Mobile Storage Provider Contract — Pass 49

The phone is a Storage Fabric participant but not automatically the company's canonical database.

Pass 49 formally classifies its storage as:

- authorised projection
- cache
- working set
- evidence staging
- local RAG
- model store

Examples:

## Titan Go

- assigned work → authorised projection
- offline commands → working set
- evidence before canonical upload → evidence staging
- job/SOP knowledge → local RAG

## Titan Hub

- customer-owned services/account view → authorised projection
- local conversation/offline state → cache/working set

## Titan Command

- owner business view → authorised projection
- offline commands → working set

All sensitive structured state continues using Titan's AES-256-GCM encrypted local store.

The storage manifest includes an explicit canonical-policy reference and always reports `canonical=false` for mobile entries.

This prevents device-first architecture from turning into multiple conflicting business databases.


## Pass 50 — Merge80/mobile distributed-architecture convergence
- Physically re-verified canonical Merge80 and rescanned the live v96 roadmap before adding new mobile contracts.
- Added mobile compatibility bridges for Merge80 operation identity, Interaction Engine, Interface Runtime, offline policy, autonomy contraction, LocalBrain, event ledger, workforce governance, native storage, Knowledge Authority and Visual Runtime.
- Added trusted Local Bridge pairing/deep-link bootstrap, HTTPS identity verification and local Edge Hub intelligence client contracts.
- Added encrypted vector storage/search plus local embedding and hybrid-RAG contracts.
- Added a privacy/cost route planner enforcing device → trusted local computer → permitted external tiers, with explicit approval required for Titan-metered use.
- Recorded canonical gaps for Goals49–51 and created the Pass51–Pass60 mobile convergence plan without duplicating Builder 5's active Goal48 work.


## Pass 56 — Storage Fabric topology + sovereign provider execution
- Mobile now consumes a versioned, company-scoped Storage Fabric topology instead of assuming Titan Cloud or the phone owns business data.
- Each data class must resolve to exactly one canonical transactional endpoint; mobile treats canonical and transactional replica endpoints as status-only and never connects to them directly.
- Google Drive, Dropbox, OneDrive and SharePoint are enforced as non-transactional document/archive/backup-style destinations.
- Added encrypted device/local-filesystem binary storage plus Core-issued ephemeral transfer-ticket execution for NAS, S3, S3-compatible, MinIO, customer VPS and customer document/archive providers.
- Provider API keys/passwords remain outside mobile. Transfers are operation-, endpoint-, role-, object-, expiry-, size- and SHA-256-bound.
- Backup/evidence/archive failover is allowed only among endpoints already authorised by canonical topology. Restore is staging only; mobile cannot promote any source to canonical.
- Existing evidence upload authority is reused behind a Storage Fabric destination-health preflight.
- The default mobile provider factory deliberately excludes Titan-managed storage, preventing hidden managed-storage fallback/cost.
- Repaired an inherited malformed Knowledge Authority method splice found in the Pass55 cumulative source before Pass56 implementation.
