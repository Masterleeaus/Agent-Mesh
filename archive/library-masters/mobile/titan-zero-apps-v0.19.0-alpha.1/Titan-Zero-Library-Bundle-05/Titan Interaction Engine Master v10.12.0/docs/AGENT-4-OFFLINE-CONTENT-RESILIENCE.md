# Agent 4 — Offline Content, Attachments and Resilience

## Scope

This pass extends the existing PWA without replacing the chatbot UI, sync API, vault, conflict policy or IndexedDB migration authority.

## Attachment pipeline

`workcore/attachments.js` now validates MIME type, extension and configured size limits; hashes files with SHA-256; detects duplicates; corrects browser-decoded image orientation; compresses large images; creates thumbnails; stores blobs in OPFS where supported; and protects unsynchronised files from cleanup.

Uploads use server-created sessions and `Content-Range` chunks. Each chunk is independently hashed and persisted in `attachment_chunks`, allowing a failed upload to resume from `uploaded_bytes`. The Laravel endpoint implementation remains an Agent 2/server integration dependency.

## Knowledge and offline packs

`knowledge.js` stores versioned role/category-aware articles and provides local full-text token matching, favourites, emergency priority, cursor refresh and revoked/obsolete removal.

`offline-packs.js` stores manifests with versions, record IDs, attachment IDs, knowledge IDs, status, refresh time, expiry, retention, pinning and storage footprint.

## Storage and readiness

`storage.js` reports estimated browser quota and category usage, requests persistent storage, previews cleanup and only removes synced, unpinned content. `readiness.js` checks shell availability, IndexedDB, vault status, cached content, pending work, storage, service-worker/database versions and real server reachability.

## Network behaviour

`network.js` combines browser online state, Network Information hints, save-data state and a real authenticated reachability probe. Large transfers pause under offline/weak conditions or a user-selected Wi-Fi-only policy.

## Service worker

The service worker uses a versioned manifest, installs the shell as a complete generation, excludes authenticated/sensitive routes and private responses, keeps one previous static generation for rollback, limits runtime caches, reports cache integrity and notifies clients of updates.

## Integration dependencies

The following endpoints must be supplied or mapped by the server owner:

- `HEAD /api/v1/workcore/offline/ping`
- `POST /api/v1/workcore/offline/attachments/sessions`
- `PUT /api/v1/workcore/offline/attachments/sessions/{id}/chunks`
- `POST /api/v1/workcore/offline/attachments/sessions/{id}/complete`
- `GET /api/v1/workcore/offline/knowledge`

All requests preserve same-origin credentials. Sensitive API responses are never service-worker cached.

## Pass 2 hardening

- Attachment files with strict binary formats are checked against magic-byte signatures before storage.
- Existing resumable upload sessions are reconciled with server-reported uploaded byte offsets before the next chunk is sent.
- Active uploads can be cancelled through `TitanWorkCore.attachments.cancelUpload(id)`.
- Knowledge article media is downloaded into the shared `knowledge_media` store and removed when its article is revoked.
- Storage reporting includes quota ratio and pressure state, plus an `ensureCapacity()` preflight for offline-pack downloads.
- Service-worker caching rejects additional authenticated-response markers and uses shell version `v7`.
