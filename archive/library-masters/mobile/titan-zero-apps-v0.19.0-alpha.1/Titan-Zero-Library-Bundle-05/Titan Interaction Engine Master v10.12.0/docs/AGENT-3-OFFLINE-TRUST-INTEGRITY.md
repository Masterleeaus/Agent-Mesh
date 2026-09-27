# Agent 3 — Offline Trust, Conflict and Integrity Layer

## Scope

This implementation adds the Agent 3 layer without replacing the chatbot builder, message UI, service worker, or future Laravel sync transport.

## Public API

Available at `window.chatbotPwa.security`:

- `classifyConflict(input)`
- `createConflict(input)`
- `resolveConflict(conflictUuid, action, options)`
- `initialiseVault(pin, options)`
- `unlockVault(pin)` / `lockVault(reason)`
- `vaultSet(key, value)` / `vaultGet(key)`
- `rotateVaultKey(oldPin, newPin)`
- `cacheIdentity(profile, options)`
- `offlineSession()` / `canOffline(permission, action)`
- `localLogout(reason)` / `applyRevocation(payload)`
- `audit(eventType, detail)`
- `integrityCheck()`
- `exportPendingBackup()`
- `safeReset(options)`

## IndexedDB schema

Database: `chatbot-pwa`, version 4.

Stores: `tasks`, `conflicts`, `audit`, `identity`, `permissions`, `vault`, `meta`, `backups`.

The migration is additive and preserves the original `tasks` store. Migration checkpoints and current schema version are written to `meta`.

## Conflict policy

Append-only records (`message`, `note`, `attachment`, `timeline_event`) are automatically merged. Customer, ownership, booking, assignment, quote, invoice and payment conflicts require manual review. Other records use field-level merging.

Resolved conflicts emit `chatbot:pwa-conflict-resolved` with `{ canonical, retry: true }`, allowing Agent 2 to requeue the operation.

## Security model

PINs are never stored. PBKDF2-SHA-256 with a unique 128-bit salt and 310,000 iterations derives a non-exportable AES-256-GCM key. Each encrypted item receives a unique 96-bit nonce. Authentication failure or data corruption causes GCM verification failure.

The vault locks manually, after inactivity, when the document is backgrounded, on logout, and on device revocation. Five failed unlock attempts trigger a 15-minute in-memory lockout.

Biometric support is exposed only as a platform authenticator capability hook; no biometric secrets are stored by the extension.

## Offline identity and permissions

Cached sessions have a configurable offline expiry. Permission snapshots expire with the session. High-risk actions return `provisional: true` and must be revalidated by Agent 2 after reconnection.

## Reset and recovery

`safeReset()` refuses an unconfirmed reset when pending tasks exist. It first creates a backup containing unresolved conflicts and unsynchronised tasks. `mode: 'cache-only'` preserves trust, queue, vault and audit stores. Full reset preserves recovery backups and performs a post-reset integrity check.

## Integration events

- `chatbot:pwa-security-ready`
- `chatbot:pwa-conflict-created`
- `chatbot:pwa-conflict-resolved`
- `chatbot:pwa-vault-locked`
- `chatbot:pwa-vault-unlocked`
- `chatbot:pwa-device-revoked`
- `chatbot:pwa-logout`
- `chatbot:pwa-audit`
- `chatbot:pwa-error`

## Known boundary

The uploaded extension did not contain the described Agent 1 repositories or Agent 2 bidirectional sync engine. This layer therefore supplies stable events and APIs for those agents but does not fabricate or replace their ownership areas.

## Pass 2 hardening

Schema version 5 adds a quarantine store and explicit migration-step evidence. Failed PIN counters and lockout expiry are persisted in IndexedDB metadata so reloading the page cannot bypass lockout. Append-only conflict merging now de-duplicates arrays instead of using a shallow object overwrite. The conflict centre exposes per-field selection for manual merge. Integrity checks now detect orphan task dependencies, identity/permission tenant mismatches, incomplete vault configuration and malformed records. Repairable malformed records are quarantined rather than silently deleted.

## Pass 3 hardening

- IndexedDB schema version 6 aligns every opener with the security database.
- Audit records form a SHA-256 hash chain with monotonic sequence numbers and a persisted chain head.
- Audit writes use the Web Locks API when available to serialise writes across tabs, with an in-tab promise queue fallback.
- `verifyAuditChain()` detects altered entries, missing links, sequence gaps, and a mismatched chain head.
- `BroadcastChannel` propagates vault locks, device revocation, and reset observation across open tabs without transferring encryption keys.
- A browser harness exercises schema opening, vault round trips, locked reads, conflict resolution, audit verification, backup export, and integrity reporting.

## Pass 4 — frozen integration contracts

Schema version 7 freezes Agent 3's understanding of the shared four-agent contract. The security API now publishes the canonical status list, record metadata fields and operation-envelope fields, plus validators that reject drift before records reach conflict, permission or recovery workflows.

Permission snapshots are bound to the same tenant, user and device identifiers as the cached session. Offline permission checks fail closed when any of those identifiers are absent or inconsistent. Integrity checks report the mismatch without attempting destructive repair.
