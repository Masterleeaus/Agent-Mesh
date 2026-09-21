# Titan Base-App Rescan → Mobile Integration Gap Ledger — Pass 50

## Verified base

The rescan physically verified **Titan Zero Merge80** before comparing mobile contracts.

- Canonical: `Titan-Zero-CANONICAL-MERGE80-CUSTOMER-CARE-RUNTIME-CLOSURE-2026-09-17.zip`
- SHA-256: `81547400718aee217d574d0c012064cbe7c3df6b09a0fa8eec2232764013870c`
- ZIP integrity: passed
- Live roadmap inspected: version 96

Goal 48 SG01 is already claimed by Builder 5. Mobile does not duplicate or overwrite that convergence work.

## Strong Merge80 systems mobile should reuse

- canonical `company_id` execution context
- operation/request/correlation/trace/idempotency identity
- Interaction Engine + LocalBrain
- Interface Runtime + offline-sync policy
- Visual Runtime
- autonomy contraction
- capability policy + Capability Router
- event ledger
- native storage/reconciliation/backup
- Knowledge Authority
- workforce-native governance
- Titan Builder interface lineage
- local Ollama provider semantics

## Missing canonical distributed systems

The physical Merge80 scan did not find canonical implementation directories for:

- Titan Edge Fabric
- Titan Storage Fabric
- Device & Distributed Intelligence Runtime / Intelligence Router / model registry

These are now official roadmap Goals 49–51, so mobile must not invent competing server authority while those systems are being implemented.

## Mobile integration gaps

### 1. Operation identity and causality
Pass50 adds compatible bridges. Pass51 must wire them through every real chat/capability/offline/server/Signal path.

### 2. Interaction + Interface Runtime
Pass50 mirrors canonical context schemas. Remaining mobile-only chat/presentation semantics should converge onto those contexts rather than maintaining parallel business-state concepts.

### 3. Offline/autonomy
Pass50 mirrors `allowed / deferred / online_required` and contraction-only autonomy. Mobile still needs verified Core autonomy snapshots as the authority source.

### 4. Edge enrollment
Pass49 created the device Edge identity. Canonical enrollment/heartbeat/revocation must wait for Goal49 Core endpoints. Until then enrollment remains fail-closed.

### 5. Local Bridge
Pass50 adds explicit pairing URI, bootstrap proof validation, trusted peer identity verification and trusted HTTPS execution. Native mDNS/Bonjour discovery and canonical certificate/key handshake remain.

### 6. Real on-device inference
Model storage exists, but a real local inference runtime is not yet connected.

### 7. Embeddings/vector RAG
Pass50 adds encrypted vector storage/search/provider contracts and hybrid lexical fallback. Real platform embeddings plus Knowledge Authority sync remain.

### 8. Intelligence routing
Pass50 enforces the correct privacy/cost order locally. Goal51 must become the canonical policy source once implemented.

### 9. Storage Fabric
Mobile currently declares only non-canonical storage roles. Goal50 topology must eventually tell it where canonical, replica, evidence, backup and archive stores actually live.

### 10. Knowledge Authority
Pass50 bridges freshness/version/provenance/contradiction semantics. Automatic bounded knowledge ingestion/supersession remains.

### 11. Workforce governance
Pass50 bridges native governance evidence. Mobile still needs dynamic canonical workforce/agent projection instead of relying on hardcoded fallbacks where server workforce projections are available.

### 12. Builder / Interface / Visual convergence
Mobile needs a proper Flutter renderer for canonical Builder/Interface generated UI schema. Visual changes must stay authority-neutral.

### 13. Push/deep links/background/voice
Still outstanding OS-specific mobile work. Core provides domain/interaction semantics; Flutter must implement the device transports.

### 14. Hardware-backed identity/revocation
Current secure storage is real, but platform key-pair/attestation, remote sealing/wipe and re-enrollment need completing.

### 15. Release certification
Signed builds, store distribution and physical-device security/accessibility/low-connectivity/performance certification remain outstanding.

See `TITAN_MOBILE_CORE_EDGE_MULTI_PASS_PLAN_P51_P60.md` for the execution plan.


## Pass 53 — native Local Bridge federation lane
- Added Android DNS-SD and iOS Bonjour discovery for `_titan-edge._tcp`; discovery remains explicitly untrusted.
- Pairing-code/HMAC validation now creates only `pairingRequested`. Trust requires a second challenge over certificate-pinned private HTTPS.
- Raw Bridge session credentials are stored only in secure storage; peer metadata holds a token reference.
- Added pinned health/capability refresh, freshness-aware selection and explicit revocation.
- Private Bridge workload execution is read/compute-only, digest-bound and requires a receipt with `data_egress=local_network` and `authority_effect=none`.
- Mutation-shaped capabilities are rejected before network execution. Any business change still goes through Titan Command Bus.
- Hub cannot discover, pair or use private business Local Bridge nodes.
- Owner setup stays inside System detail; the exactly-three-home-cards invariant remains unchanged.


## Pass 54 — real on-device inference boundary
- Replaced the unavailable local-AI provider in the mobile Edge runtime with a GGUF/llama.cpp provider adapter.
- Local model execution is resource-gated, full-SHA verified immediately before use, run off the UI thread in a worker isolate, timeout-bounded and provenance-tagged as device/no-egress/customer-compute/authority-none.
- Added governed Ed25519-signed model-pack manifests with trusted issuer keys, exact size/hash binding and required licence identity.
- Corrected the authority boundary: purely local private RAG/LLM work may operate offline/unregistered, while revoked/compromised identities are blocked and distributed work still requires canonical Edge enrolment.
- Failure remains local. There is no automatic BYO/Titan/cloud fallback.
- Native llama.cpp binaries and physical-device execution remain release/platform packaging gates rather than being falsely represented as complete.
- Local embeddings remain deliberately unavailable until Pass55.


## Pass 55 — embeddings, encrypted hybrid RAG and Knowledge Authority sync
- Activated a real `llama_cpp_dart` embedding provider behind the existing local embedding contract.
- Added model-version/hash fingerprints so vector spaces cannot silently mix after model replacement.
- Extended encrypted vector storage to chunk-level records with chunk/content hashes and atomic document replacement.
- Hybrid retrieval now uses lexical + vector Reciprocal Rank Fusion, preserves semantic-only matches and deduplicates by document.
- Knowledge Authority mobile projections now enforce provenance, version, freshness, contradiction, expiry, company and surface rules at ingestion and again at retrieval.
- Added delete/supersede cleanup, complete-snapshot pruning, monotonic encrypted sync cursors and idempotent replay.
- Hub cannot ingest company-private business knowledge.
- Embedding/runtime failure remains local and degrades to encrypted lexical search; there is no cloud embedding fallback.
- Pass55 is the midpoint P51–P55 cumulative convergence checkpoint.


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


## Pass 56 — sovereign Storage Fabric execution
- Added canonical topology consumption with transactional/object/document/projection data-class kinds and exactly one canonical owner per routed class.
- Mobile can execute only bounded projection/cache/evidence/backup/archive roles; direct canonical/replica database access is denied.
- Added encrypted device/local-filesystem storage plus delegated HTTPS adapters for NAS, S3/S3-compatible, MinIO, customer VPS and customer document/archive providers.
- Delegated transfers require short-lived Core tickets, endpoint host allowlists, HTTPS/private-LAN policy, byte bounds and SHA-256 receipts.
- Drive/Dropbox/OneDrive/SharePoint may serve document/archive roles but cannot be treated as transactional CRM databases.
- Recovery reads authorised sources into encrypted staging only; the phone cannot promote a backup to canonical state.
- Evidence remains staged when no healthy authorised evidence destination exists.
- No automatic Titan-managed storage fallback was added.
