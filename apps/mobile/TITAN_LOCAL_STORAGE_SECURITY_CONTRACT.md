# Titan Mobile Local Storage Security Contract — Pass 33

## Scope
Pass 33 replaces plaintext persistence of sensitive Titan mobile state with authenticated encrypted local repositories across Titan Command/Zero, Titan Go and Titan Hub.

The canonical local isolation boundary remains:

`company_id + actor_id + device_id + surface`

Job evidence adds the job ID beneath that established session scope.

## Architecture

### Key material
Small encryption keys are stored through `flutter_secure_storage`.

- Android: encrypted shared preferences / Android Keystore-backed storage for the current compatibility baseline.
- iOS: Keychain with `first_unlock_this_device`, keeping key material device-bound while permitting access after the first unlock.
- Logical secure-store key names are SHA-256 hashed before they are handed to platform secure storage, so tenant, actor and device identifiers are not present in physical key names.
- A missing platform plugin in unit-test/unsupported runtimes fails secure into process memory. Other secure-storage errors propagate rather than causing plaintext fallback.

### Structured local state
`TitanEncryptedJsonStore` stores application state as AES-256-GCM authenticated ciphertext files under application-support storage.

Each logical repository record gets:
- a random 256-bit encryption key held in platform secure storage;
- a fresh random nonce on every write;
- AES-GCM authentication;
- associated authenticated data bound to the logical repository key;
- a hashed ciphertext filename, so the company/actor/device/surface scope is not visible in filenames;
- staged temp/backup replacement to reduce interrupted-write loss;
- authentication failure if ciphertext is modified or the key is unavailable.

### Evidence
Evidence binaries are imported into a separate encrypted vault:
- AES-256-GCM authenticated encryption;
- device secure-storage key material;
- hashed scope directory;
- hashed evidence filename;
- associated authenticated data binds the ciphertext to the vault scope and filename;
- encrypted evidence metadata is stored in `TitanEncryptedJsonStore`;
- after ciphertext and encrypted metadata commit successfully, Titan best-effort deletes the plaintext camera/scanner/signature source file;
- Command Bus metadata contains only `local_evidence_ref`, never the local path.

A camera or document-scanner plugin necessarily produces a temporary source file before Titan can encrypt it. Pass 33 minimizes that plaintext lifetime and never persists that path in Titan state or Command Bus payloads.

## Repositories moved to encrypted storage
Pass 33 moves the following sensitive state:
- offline Command Bus queue;
- owner/Go workforce conversations;
- Hub privacy-filtered conversations;
- Hub customer requests;
- trust/autonomy projection state;
- owner decision state;
- owner attention/snooze state;
- field-day action state;
- route/access/replan state;
- field handoff/customer-contact state;
- field job execution/evidence requirement state;
- evidence binary files;
- evidence metadata.

## Plaintext migration
Legacy SharedPreferences keys are now migration inputs only.

Migration rules:
1. Parse and validate the legacy record.
2. Apply current privacy/scope filtering where applicable.
3. Write the authenticated encrypted replacement.
4. Only after the encrypted write succeeds, delete the plaintext legacy key.

Corrupt legacy records may be discarded because they cannot be safely reconstructed. A secure-store/encrypted-write failure does **not** trigger deletion of an otherwise recoverable plaintext migration source.

## Hub
Hub retains all Pass 32 shielding before encryption:
- privacy sanitisation;
- authenticated customer binding;
- customer-only capability namespace;
- request payload allowlists;
- public workforce aliases;
- customer-safe actions/types;
- direct-data privacy contracts.

Encryption is an additional boundary, not a replacement for authorization or minimisation.

## Authority
Encrypted local storage does not make local state authoritative.

Server-side authorization and revalidation remain mandatory for:
- quote acceptance;
- payments;
- customer-facing external delivery;
- route/live schedule revalidation;
- autonomy elevation;
- authoritative business-state mutation on sync.

## Backup
Android application auto-backup is disabled in this build so encrypted local files are not restored without their corresponding device-bound key material.

## Compatibility pin
This project currently declares Dart `>=3.0.0` and Android `minSdkVersion 21`. Pass 33 therefore pins `flutter_secure_storage ^9.2.4` and `cryptography ^2.5.0` rather than silently raising the whole app's platform baseline during the storage-security pass.

A future platform-modernisation pass can move to the newer secure-storage major version after explicitly upgrading Android/Dart/Flutter constraints and testing its migration path.

## Outstanding certification
Pass 33 source-level security architecture is implemented, but this environment does not contain Flutter/Dart tooling. Before release:
- run `flutter pub get`;
- run analyzer and all Flutter tests;
- test Android Keystore persistence/reinstall/upgrade behavior;
- test iOS Keychain persistence/reinstall/upgrade behavior;
- test abrupt termination during encrypted writes and plaintext migration;
- test device lock/reboot behavior;
- test physical camera/document/signature evidence flows;
- test migration from Pass 32 stores on real devices.


## iOS Keychain entitlement
The Runner target now includes `Runner/Runner.entitlements` with the Keychain Sharing entitlement and points Debug, Release and Profile build configurations at it. This is required by the secure-storage plugin's iOS setup so Keychain-backed encryption keys persist correctly.


## Pass 34 queue/reconciliation extension
The Pass 33 encrypted storage boundary now also protects deterministic replay state:
- encrypted command queue v4;
- encrypted replay receipts;
- encrypted conflict records;
- replay attempt metadata;
- server revision/reconciliation metadata.

Pass 33 encrypted queue v3 data migrates into v4 without returning to plaintext. Older SharedPreferences v2 queues remain migration-only.


## Pass 36 — authenticated server sync and connectivity lifecycle
- Added an opt-in authenticated server-sync runtime. Without `TITAN_SERVER_BASE_URL`, Command/Go/Hub stay local-first and create no server-sync network traffic.
- Production server sync requires HTTPS. Plain HTTP is accepted only for explicitly enabled localhost development; embedded URL credentials are rejected.
- Added secure session access-token storage through Titan's platform secure-store boundary. Tokens are not accepted through dart-defines or URLs.
- Added injectable HTTP transport plus a concrete `dart:io` client with request/connect timeouts, redirect suppression and a 2 MiB response cap.
- Added authenticated health probing and server replay. Replay requests carry canonical command scope, deterministic idempotency and optional remote evidence bindings.
- Server responses must echo command ID, idempotency key and `company_id`; mismatches fail closed as retryable.
- Added encrypted durable lifecycle states for probing, online, replaying, reconciled, backoff and auth-required. Backoff timestamps/failure counts survive app restart.
- Authentication expiry is not treated as generic connectivity failure: replay stops in `authRequired` until credentials are updated.
- Added a Flutter lifecycle observer and host controller for start/resume plus explicit connectivity/credential events.
- Added an encrypted evidence upload registry and prepare → HTTPS upload → complete handshake before evidence-bearing command replay.
- Evidence upload includes byte length and SHA-256 digest, has a 25 MiB default ceiling, rejects credential-bearing upload-ticket headers, and never sends a local filesystem path.
- Evidence becomes locally `synced` only after the replayed command receives an authoritative server acceptance. A server-accepted/local-commit failure remains safely retryable through the same idempotency identity.
- Pass 35 reconciliation views now surface configured connection state. Local-only builds remain quiet; Hub receives only customer-safe lifecycle wording with no raw lifecycle enum or retry timestamp.


## Pass 37 — token refresh, re-authentication and inbound Signals
- Upgraded secure server credentials from a single access token to a v2 access/refresh session bundle with expiries, credential generation and legacy v1 migration.
- Added a shared single-flight refresh provider. Health, replay, evidence and Signal transports can refresh once after a 401/403 and retry the exact scoped operation.
- Refresh responses must echo the exact `company_id + actor_id + device_id + surface`; mismatched refreshed credentials are never persisted.
- Expired/revoked refresh credentials are cleared and the durable lifecycle enters `authRequired`. `SessionReauthenticationService` provides the integration boundary for real sign-in and can immediately resume reconciliation after new credentials are stored.
- Added authenticated cursor-based inbound Signal pulling after outbound replay.
- Inbound Signals are exact-scope and surface-authorised. Hub cannot receive workforce-internal Signal classes.
- Signal payloads cannot carry competing tenant/session scope, tokens, cookies or local filesystem paths.
- Signals never directly patch CRM/domain state. They create encrypted projection-refresh hints and rerun existing authorised surface loaders.
- Added a separate encrypted `ServerSignalRevisionRepository`; the bounded Signal inbox is no longer a second revision authority.
- Signal IDs deduplicate redelivery, stale revisions are ignored, revision gaps force projection refresh, and post-inbox/pre-cursor crashes self-heal when the page is redelivered.
- Projection refresh hints are monotonic and survive failed reloads. They clear only after the relevant Command/Go/Hub projection refresh succeeds.
- Pass 35 sync UX can show safe received-update counts. Hub still cannot see raw Signal IDs, payloads, revision gaps or internal lifecycle values.


## Pass 38 — authoritative server-backed read projections
- Added revisioned server projection reads for Command owner attention/decisions, Go workforce state, and Hub customer/commercial state.
- Projection responses are exact-scope validated and conditionally fetched with known revision + ETag.
- Added encrypted per-kind projection cache with freshness TTL, 304 revalidation and stale-cache offline fallback.
- Raw server payloads are decoded into existing typed Titan models and re-encoded canonically before cache persistence, dropping unknown fields.
- Go server snapshots are additionally bound to the authenticated worker and embedded action payloads are allowlisted.
- Hub server snapshots/commercial data continue through existing Hub privacy contracts.
- Configured-server mode no longer silently falls back to demo business truth when no authoritative/cache data is available.
- Server sync configuration is attached before initial business-data loaders run.
- Pass 37 Signal hints now refresh only relevant server projection kinds and remain durable until every required authoritative refresh plus surface reload succeeds.


## Pass 39 — projection freshness, partial reads and durable refresh
- Added per-kind freshness and hard-stale policies. Go workforce data now has a deliberately short offline lifetime; Command and Hub projections use longer surface-appropriate windows.
- Configured-server reads now distinguish current, recent encrypted cache, too-old cache and unavailable data.
- The existing sync/status strip exposes freshness without adding another home card. Hub receives safe freshness wording/counts but not exact server snapshot or refresh timestamps.
- Added authorised partial projection sections and strict section echo validation. Partial data merges into an existing canonical full cache and is revalidated/re-encoded before persistence.
- Signal invalidation now uses one canonical dependency graph and can refresh only the affected projection sections.
- Added encrypted per-kind refresh scheduling with durable success cadence and capped failure backoff.
- Added an app-active refresh loop that sleeps until the next due read and pauses while the app is inactive. It does not claim OS background execution while suspended.
- Added an encrypted per-entity read ledger separating latest observed Signal revision from latest revision actually resolved by successful projection refresh.


## Pass 40 — production read adapter/API contract
- Added shared `TitanAuthoritativeCrmReadAdapter` and `TitanMobileReadAuthorization` server contracts. `company_id` remains the only tenant boundary; row authorization is a separate mandatory stage.
- Projection builders now receive `TitanAuthorizedCrmReadAdapter`, never raw CRM access, preventing cross-actor aggregation in generated mobile projections.
- Added deterministic projection generation/ETag contracts and a CRM-backed Hub commercial reference builder.
- Added authenticated entity detail and paginated entity collection APIs with exact scope, conditional revision/ETag reads, bounded cursors and surface entity-type authorization.
- Added server- and client-side entity payload filtering plus encrypted entity detail cache and revision monotonicity.
- Signals can opportunistically prefetch an authorised changed entity before refreshing its aggregate projection.
- Split gateway business reads into explicit `LocalMvpBusinessReadSource` and `ServerAuthoritativeBusinessReadSource`; production-configured reads no longer contain hidden per-method demo fallback logic.
- Added executable reference API and JSON fixtures whose output is consumed by the real mobile transports/codecs/caches in end-to-end contract tests.


## Pass 42 — materialized read-model recovery
- Added a company-scoped ordered SHA-256 change-history chain so accepted mutations have a replayable recovery order, not just standalone change-event IDs.
- Materialized projections are now actor-bound and carry projection revision, source sequence, source event hash, payload checksum and materialization time.
- Added live materialization after accepted authoritative changes and a serving path that verifies checksums before returning full or partial projections.
- Added deterministic company recovery: verify history, replay projection impacts, reconstruct revision state, detect missing/corrupt checkpoints, and regenerate through the normal authorised projection builders.
- Added company rebuild leases and audited rebuild-run records.
- Signal outbox publication now has a target-local sequence/cursor for each company/actor/device/surface, with a client fail-closed guard for non-advancing server cursors.
- Accepted replay receipts now include the exact ordered `change_sequence`, connecting the mobile receipt to the historical recovery source.
- Added a MySQL 8 reference schema for receipts, change history, projection revisions/materializations, Signal outbox and rebuild control.


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
