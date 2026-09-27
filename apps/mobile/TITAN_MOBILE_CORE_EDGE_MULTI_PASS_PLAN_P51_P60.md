# Titan Mobile Core + Edge Convergence Plan — Passes 51–60

This plan was generated after physically verifying canonical **Merge80** and reading live Agent Mesh roadmap **v96**.

It does not replace the official roadmap. It is the mobile execution plan bound to the official subgoals in Goals 47, 49, 50 and 51.

Goal 48 SG01 is already claimed by another Builder and is therefore treated as an upstream convergence dependency, not duplicated here.

## What the rescan changed

The mobile app has advanced faster than the canonical distributed Core. Merge80 already has strong reusable contracts for company execution context, Interaction Engine, Interface Runtime, LocalBrain, offline policy, operation identity, event ledger, autonomy contraction, capability policy/router, native storage, Knowledge Authority, workforce governance, Visual Runtime and local Ollama.

Merge80 does **not** yet have canonical Edge Fabric, role-based Storage Fabric or Device/Distributed Intelligence Runtime implementations. Those are now official Goals 49–51.

Therefore mobile follows this rule:

> Reuse Merge80 semantics immediately, but fail closed rather than inventing server authority for future distributed subsystems.

## Pass 51 — operation/context/causality convergence

Wire the Pass50 bridges through actual chat, capability, offline, server and Signal flows. One mobile action should keep the same request/operation/correlation/trace/idempotency identity from conversation through result.

## Pass 52 — canonical Edge enrollment

Connect Pass49's Edge node to the canonical Goal49 registry when its API is available. Add heartbeat, capability advertisement, limited/revoked/re-enrollment states and remote authority contraction.

## Pass 53 — Local Bridge

Add untrusted mDNS/Bonjour discovery, canonical key/certificate pairing, identity pinning and private HTTPS workload execution. LAN discovery never establishes trust.

## Pass 54 — real device inference

Put a real inference engine behind the existing provider boundary. Keep model manifests integrity checked and resource gated. No silent cloud fallback.

## Pass 55 — embeddings + Knowledge Authority RAG

Connect real local embeddings, encrypted vectors and hybrid retrieval. Sync only provenance/version/freshness-approved bounded knowledge. **Midpoint convergence checkpoint.**

## Pass 56 — Storage Fabric

Consume Goal50 canonical topology. Keep the phone a projection/cache/working-set/evidence-staging/RAG/model node, never an accidental competing canonical CRM.

## Pass 57 — Intelligence Router

Replace the temporary local route-policy source with canonical Goal51 routing. Enforce privacy minimisation, external-egress policy, BYO boundaries, Titan entitlement and explicit metered approval.

## Pass 58 — workforce + generated UI convergence

Use canonical workforce IDs/projections, governance evidence, LocalBrain/Capability Router, Builder output, Interface Runtime and Visual Runtime. Preserve exactly three home staff cards.

## Pass 59 — native lifecycle — COMPLETE

Completed bounded push/deep-link intake, background-refresh coordination and voice continuation through canonical Interaction contexts. Lifecycle transport is authority-neutral, company-scoped and requires server authority recheck for consequential work.

## Pass 60 — certification/release

Hardware-backed key path, remote revocation/wipe, incident repair, signed iOS/Android builds, store/update/rollback pipeline and physical-device low-connectivity/security/accessibility/performance certification.

## Non-negotiable gates

- `company_id` only.
- Canonical surfaces only: `zero`, `go`, `hub`.
- Device/model/provider identity never grants authority.
- Offline never elevates authority.
- Business mutation remains Command Bus governed.
- Signal remains the accepted-change/event path.
- No silent cloud or Titan-metered fallback.
- No surface/provider/device-specific workforce clones.
- Exactly three proactive home staff cards.


## Pass 51 — canonical operation causality
- Wired mobile conversations into Merge80-compatible operation, Interaction, Interface Runtime, LocalBrain-request and Capability Router proposal contracts at the shared gateway seam.
- Added encrypted noncanonical operation journaling so conversation, queued mutation, authoritative replay result and inbound Signal can be correlated without granting authority.
- Upgraded new offline commands to causality schema 3 while preserving `offline_contracted` and mandatory server recheck.
- Corrected the Flutter/Laravel replay-envelope mismatch: Laravel now unwraps the nested `command`, normalizes historical Dart `id` to `command_id`, and verifies operation header/body causality.
- Authoritative mutation/change/Signal paths now preserve operation/request/correlation/trace identity end to end.


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

## Pass 57 completion receipt
- Canonical intelligence-routing policy projection introduced.
- Missing/stale/cross-company policy fails closed to device/trusted-local routes only.
- BYO/customer/Titan external routes require canonical egress policy.
- Titan-metered route requires explicit metered approval.
- Private-data requests suppress external egress.
- Runtime/bootstrap now consume injected routing policy rather than treating temporary mobile defaults as canonical authority.
- Pass 58 is next: workforce + generated UI convergence.


## Pass 58 completion
- Added fail-closed generated UI envelope projection bound to company_id and canonical zero/go/hub surfaces.
- Builder artifact, Interface Runtime and Visual Runtime provenance are mandatory before mobile renders canonical generated UI.
- Generated UI is explicitly authority-neutral; business mutations remain Command Bus governed.
- Canonical workforce provenance is preserved, including agent_id where present.
- Home generated UI is hard-capped to three contextual workforce cards.
- Added focused convergence contract tests; Flutter SDK was unavailable, so runtime tests were not claimed.
- Pass 59 is next: native lifecycle, push/deep links/background wake/voice continuation.


## Pass 60 — certification/release convergence COMPLETE
- Added fail-closed mobile release certification matrix and evidence contract.
- Added canonical-receipt-scoped remote wipe/key destruction coordinator and incident repair gate.
- Added signed update/rollback policy validation.
- Source/static packaging validation completed; signed store builds and physical-device certification remain external release evidence and are not falsely claimed.
- P51–P60 implementation sequence is complete; unresolved physical/store gates remain explicit certification blockers.
