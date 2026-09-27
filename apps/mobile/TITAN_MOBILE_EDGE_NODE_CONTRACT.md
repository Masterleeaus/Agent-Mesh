# Titan Mobile Edge Node Contract — Pass 49

## Role

Titan Mobile is now a **device-side Titan Edge Node runtime**, not a second Titan backend.

The mobile runtime supplies device-specific facts and capabilities. Canonical policy, routing, authority, storage ownership, governance and cross-node coordination remain owned by Titan Core.

## Identity

Each scoped mobile installation maintains an encrypted persistent Edge identity containing:

- `node_id`
- `company_id`
- `actor_id`
- `device_id`
- surface (`zero`, `go`, `hub`)
- node type
- registration state
- identity fingerprint/reference
- capability fingerprint

Private identity material is stored through Titan secure storage and is not serialized into the Edge identity object.

Registration states:

- unregistered
- enrolling
- active
- limited
- revoked
- compromised
- re-enrollment required

**Node identity is not business authority.**

Only an `active` node accepts externally routed Edge workloads, and even then business mutation authority remains in Titan Core/Command Bus.

## Canonical boundary

`company_id` remains the only tenant boundary.

`node_id`, `device_id`, `actor_id` and surface participate in execution scope but never become alternate tenant boundaries.

## Capability advertisement

Mobile currently advertises explicit capabilities including:

- `device.storage.encrypted`
- `device.rag.local`
- `device.llm.local`
- `device.embedding.local`
- `device.camera.capture`
- `device.location.read`
- `device.voice.capture`
- `device.network.local_bridge`

Availability is separate from capability.

For example, a phone can support local intelligence architecturally while reporting the local inference runtime/model unavailable.

## Resource state

Native Android/iOS probes report coarse device state:

- OS/platform
- architecture
- available memory band
- free-storage band
- battery band
- charging state
- low-power mode
- thermal band
- network class
- local-network availability
- secure-key-store support
- hardware-backed-key availability where known
- background execution support

Titan deliberately converts raw values to coarse resource bands before workload-routing use.

## Device storage

Mobile may use only these Storage Fabric roles in Pass 49:

- authorised projection
- cache
- working set
- evidence staging
- local RAG
- model store

Mobile storage entries **never self-declare canonical company ownership**.

Current local sensitive state uses the existing AES-256-GCM encrypted state system with keys protected by platform secure storage.

## Local model store

Pass 49 includes a model-file store that:

- uses application-private storage;
- requires a model ID;
- requires expected SHA-256;
- verifies bytes before activation;
- records version/format/quantisation/tasks;
- tracks health;
- supports uninstall;
- does not execute a format unless an on-device runtime explicitly supports it.

No cloud fallback occurs if local inference is unavailable.

The current Pass 49 runtime intentionally reports `on_device_inference_runtime_not_installed` until a real local inference engine is added.

## Local RAG

Pass 49 provides encrypted offline local knowledge storage with:

- company scope
- surface scope
- document ID
- revision
- provenance/source authority
- expiry
- local lexical retrieval

This creates immediately useful offline private knowledge lookup while preserving a clean path to later local embeddings.

Go, Hub and Command each use their own authorised scope.

## Local Bridge peers

Trusted Local Bridge/Desktop Edge Hub peers are kept in encrypted local state.

Discovery and trust are separate states.

A discovered LAN machine is **not** usable until it becomes an explicitly trusted peer.

Cross-company peer records are rejected.

Actual mDNS/pairing/remote workload transport remains for a later pass after the canonical TypeScript Edge Fabric endpoint is available.

## Edge control plane

Mobile exposes a canonical node-advertisement contract.

When the Core Edge control plane is not configured, the disconnected implementation returns:

`canonical_edge_control_plane_not_configured`

and never upgrades the node from `unregistered`.

This is deliberate fail-closed behavior.

## Workload execution

Pass 49 provides an allowlisted workload executor.

Supported foundation path:

- encrypted local RAG query;
- on-device LLM request interface.

Requests must match `company_id`.

Externally routed workloads require an active Edge registration state.

Unsupported capabilities are rejected.

On-device provider failure does not trigger a cloud provider automatically.

## Authority

Offline authority rules are unchanged:

> Offline reduces authority. Offline never elevates authority.

The Edge runtime does not create a new mutation path.

Business mutation still uses existing offline queue + server recheck + Command Bus architecture.

## Surfaces

Command, Go and Hub all instantiate the same shared Edge runtime.

Command/System displays owner-friendly local Edge status.

This does **not** add another home staff card; the exactly-three-card home invariant remains unchanged.


## Pass 50 — Merge80/mobile distributed-architecture convergence
- Physically re-verified canonical Merge80 and rescanned the live v96 roadmap before adding new mobile contracts.
- Added mobile compatibility bridges for Merge80 operation identity, Interaction Engine, Interface Runtime, offline policy, autonomy contraction, LocalBrain, event ledger, workforce governance, native storage, Knowledge Authority and Visual Runtime.
- Added trusted Local Bridge pairing/deep-link bootstrap, HTTPS identity verification and local Edge Hub intelligence client contracts.
- Added encrypted vector storage/search plus local embedding and hybrid-RAG contracts.
- Added a privacy/cost route planner enforcing device → trusted local computer → permitted external tiers, with explicit approval required for Titan-metered use.
- Recorded canonical gaps for Goals49–51 and created the Pass51–Pass60 mobile convergence plan without duplicating Builder 5's active Goal48 work.


## Pass 52 — canonical Edge client, fail closed until Goal49 exists
- Re-scanned the live Agent Mesh roadmap before implementation. Goal49 SG01/SG02 remained TODO and unclaimed, so mobile did not create a competing Edge registry.
- Local Edge identity can no longer self-promote to `active`; a verified canonical control-plane receipt is mandatory.
- Added opt-in enrollment/heartbeat transport, encrypted control-plane state, nonce-bound heartbeat receipts, capability fingerprint publication, revocation/compromise/re-enrollment directives and stale-heartbeat contraction.
- Distributed Edge workload execution now requires both local active identity and fresh canonical control-plane enrollment status.
- Foreground heartbeat pulse is lifecycle-bound to Zero/Go/Hub; background wake remains scheduled for Pass59.


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
