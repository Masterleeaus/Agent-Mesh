# Current identity and session registry

Owner: [#302](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/302)

This is a bounded identity/control-plane implementation. It does not complete #302,
commission an authentication provider, migrate historical users, or wire the hosted
Workforce/DirectAdmin transports.

## Canonical owner and storage

The existing `@titan-zero/titan-platform/security-boundary` entry exports
`createIdentitySessionRegistry`, `IdentitySessionRegistry` and their current-session
contracts. It reuses `SessionBinding` and the canonical `@titan-zero/storage`
`StorageClient`; it does not introduce a database abstraction or authority system.

At trusted startup, pass a separately configured SQLite identity/control-plane
connection and `storage_role: 'GLOBAL_REGISTRY'`. Never pass a company-native
business connection, derive the location from a request, or discover identity by
opening an unknown company database. The role declaration makes the caller's
placement responsibility explicit; it does not prove physical placement. Hosted
bootstrap must independently verify its configured registry path and permissions.

Version 1 is a transactionally applied, additive migration containing six tables:

- `titan_security_actors`: stable global actor IDs and current status/revision
- `titan_security_companies`: canonical company IDs and status/revision
- `titan_security_memberships`: current actor/company relationship, role, status/revision
- `titan_security_devices`: device ownership, status/revision
- `titan_security_external_bindings`: explicit provider/subject to actor/company mapping
- `titan_security_sessions`: existing session binding, audience, current session revision and identity-generation snapshot

`titan_security_migrations` records the supported version. Initialization is
idempotent. A failed migration rolls back atomically; partial pre-existing tables
or unknown versions fail closed rather than being overwritten. It never queries
or backfills `users`, `accounts`, worker profiles, or company business records.


## Authenticated credential entry

The canonical [authenticated session credential service](authenticated-session-credentials.md)
now implements signature verification, bounded issuance, replay-resistant exchange,
current-state resolution, company switching and revocation over this registry.
Request-facing consumers must use that service rather than constructing raw proofs.
The low-level trusted registry primitives below remain commissioning/internal APIs.
Production issuer/host commissioning and historical migration remain unconfigured.

The fixed DA → Workforce/Zero derivation is an additive operation on the existing
`titan_security_sessions` rows. Its signed source reference is tied to the exact
deterministic child session ID, so lineage survives restart without a new table or
stored bearer. Resolution checks both source and child revisions and expires the
child no later than the source bearer/current session. Derived contexts expose
only their selected company and cannot switch independently.

## DirectAdmin pre-auth bootstrap nonce

The proof-to-assertion flow has a durable, single-use pre-auth challenge API in
this same `GLOBAL_REGISTRY` owner. It does not add another database, identity
authority, membership store, or session store. Its narrow challenge table is a
separately versioned add-on (`titan_security_directadmin_nonce_migrations` v2)
because the hosted Workforce readiness contract still pins the core
`titan_security_migrations` schema to v1. The nonce add-on is **not** created by
`createIdentitySessionRegistry` or by host startup. Its initializer is explicit:

```ts
await initializeDirectAdminBootstrapNonceStore({
  storage: globalRegistryStorage,
  storage_role: 'GLOBAL_REGISTRY',
});
```

No production registry was initialized or migrated by the local implementation.
The challenge table stores only SHA-256 nonce digests plus the configured
DirectAdmin issuer/origin, effective subject, authenticated real operator,
effective DirectAdmin role and impersonation state, canonically resolved actor,
selected company/device, current identity-generation snapshot, issue time,
expiry, and consumption time. The operator fields bind provenance only; they do
not grant Titan authority. The upstream `/api/session` contract exposes no
stable DirectAdmin session identifier, so this binds authenticated identity and
login-as context, not one exact DirectAdmin cookie/session. The raw cookie is
never stored. Lifetime defaults to 120 seconds and is capped at 300 seconds.
Wrong issuer, subject, operator, role, impersonation state or origin does not
burn a valid challenge; expired or stale current identity fails closed, and
stale-identity failure burns the challenge. The consumer updates the row
conditionally under the SQLite writer transaction, so independent connections
cannot redeem it twice. Contended writer admission is bounded and returns
unavailable; a retry after the winning transaction commits is denied as replay.
The earlier local v1 add-on is rejected by the v2 initializer; no automatic
backfill or live migration is provided.

The exact trusted issuer entrypoint is
`createDirectAdminBootstrapFlow({ registry, origin, node_id, upstream,
signing_key, ... })`. The #812 page-renderer/server composition must call its server-only
`issueNonce({ origin, cookie, authorization: null, company_id, device_id })`
with the ambient DirectAdmin `session` and `key` cookies and the single current company/device
selection obtained from trusted server context. `issueNonce` itself fetches the
configured host's HTTPS `/api/session`, derives the effective subject, real
operator, role and impersonation state from that authenticated response, and
then asks the registry to validate the subject's current actor, company
membership and device ownership before storing a nonce.
It accepts no caller-supplied actor, subject or session ID. When no trusted
preexisting company/device context is available, the first-session flow may call
`issueNonceForUniqueCurrentContext({ origin, cookie, authorization: null })`.
That authenticates `/api/session`, then atomically resolves and stores the
nonce only if the issuer/subject has exactly one active canonical
actor/company/membership/device combination. The result includes that single
company/device pair for trusted server use; the renderer must return only the
opaque nonce to the browser. Zero eligible pairs fail closed, and multiple
companies, devices, or distinct actor mappings fail with an explicit ambiguity
denial. It never picks a first row or exposes a list of switch choices. The
registry remains the authority for the active binding, membership and device.
If the context is ambiguous, #812 must use an independently authenticated
server-side selection source or fail closed; browser input, OS UID and
DirectAdmin role alone cannot resolve it.

Both nonce issuance and assertion redemption parse the Cookie header with the
same fixed allowlist: exactly one `session` and one `key` pair, no other cookie
names and no duplicates. They rebuild the upstream header as
`session=<value>; key=<value>` before calling `/api/session`; malformed or
unexpected cookies are rejected before any network request. The raw header is
never stored.

When implemented, the page renderer may return only the short-lived nonce in
its same-origin bootstrap challenge. At redemption, the current `provide` method requires an
allowlisted `session` and `key` cookies inside a trusted server call, reauthenticates them against the
fixed HTTPS `/api/session`, compares effective subject, real operator, role and
impersonation state, then consumes the nonce through the built-in
`createDirectAdminBootstrapNonceConsumer` before signing a `titan-login+jwt`.
The signed assertion is the proof passed server-to-server to the canonical
`createSessionCredentialService.issue()` verifier; the DirectAdmin cookie must
not be returned to the browser or forwarded through the generic Workforce relay.

The current #812 RAW relay and #1049 SDK now expose a fixed bootstrap POST, but
the RAW relay deliberately strips every Cookie before forwarding to the private
gateway. The #1049 bridge therefore constructs a proof with `cookie: null` on
that path, which this flow rejects before any DirectAdmin request. The SDK
browser client also reads its one-time nonce from a trusted HTML callback, but
no published page renderer issues that nonce or calls `issueNonce` with the
ambient DirectAdmin cookie and trusted selected company/device. No safe proof
currently reaches redemption.

A bounded server-side host composition is still required for nonce issuance and
redemption. It must keep the ambient DirectAdmin cookie within the trusted
DirectAdmin authentication boundary, derive only the `session` and `key` cookie
pairs there, and pass a verified/signed assertion and exact selected
company/device to the canonical #302 credential owner. The browser may receive
only the short-lived opaque nonce and resulting Titan session cookie/CSRF
contract. Do not forward the DirectAdmin Cookie through the generic RAW relay,
accept caller-supplied identity claims, or substitute the nonce alone for
upstream reauthentication. No host route or page renderer is implemented here.
The canonical session registry still performs its durable issuer/JTI single-use
exchange. Explicit nonce-store commissioning remains pending.

## Authentication and provisioning trust boundary

Registry lookup is not credential verification. Before issuing, resolving or
switching a session, the transport must verify the existing provider session or
signed credential and construct `VerifiedSessionIdentity` from that verified
result. `now` must come from the receiving service’s trusted clock, never a
request timestamp. A caller-supplied session ID, revision, DA account/role, header, or JSON
assertion is insufficient. `provider` is a trusted, issuer-scoped identity-provider
identifier, not a user-supplied product label: two independent DirectAdmin nodes
must not share a provider namespace merely because both use DirectAdmin.

The verified identity supplies provider/subject, session ID, device ID and exact
session revision. Expected audience is fixed by the receiving service. Expected
company and any actor/context assertions are checked against persisted current
state; they cannot create or replace state. Authentication must bind the verified
session revision/device to the credential, rather than accepting those fields
from unrelated request parameters. Authentication failures should be projected
as a generic denial at the transport boundary; do not expose registry diagnostics
or log raw proof/credential contents to the client.

Provisioning methods (`putActor`, `putCompany`, `putMembership`, `putDevice`,
`putExternalBinding`, `issueSession`, `revokeSession`) are trusted control-plane
operations, not public endpoints. Existing protected commissioning/governance
must authorize them. They accept only explicit non-secret metadata. Creation
requires an explicit null expected revision; updates require exact optimistic
revision and increment it. Device ownership and external binding identities are
immutable. No method automatically repairs missing membership or mapping.

External provider subjects may map the same global actor to several companies.
Multiple active mappings to distinct actors are ambiguous and fail closed, even
when a company hint might otherwise choose one. Each provider/subject/company
mapping is unique. Existing actor IDs are retained unchanged, preserving opaque
operational/history references.

## Current resolution and switching

`resolveCurrentSession(proof, expected, now)` reads a consistent, uncached
transactional snapshot before business storage is selected. It checks:

1. Existing session, valid explicit timestamps, positive safe revision, expiry,
   non-revocation, selected company, expected audience and verified device
2. Unique current external identity mapping and stable actor identity
3. Active actor, company, membership, external binding and actor-owned device
4. Exact generation snapshot for those records, plus an optional caller context revision

A status/role revision change invalidates the old context. Revoking and then
reactivating a membership/device/company/actor cannot revive an old credential.
Recovery requires protected re-authentication and issuance of a new session ID;
there is no automatic refresh/backfill fallback.

`switchCompany` first resolves the current session, verifies the new explicit
mapping and active membership, then atomically rotates the session revision and
binds the new company, membership role and identity generation. Old revisions and
old-company assertions fail. An unsuccessful or racing switch cannot partly
rebind context. The actor, device, audience and original expiry remain unchanged.
The transport must issue an appropriately verified replacement credential for
the new revision through its existing authentication owner.

`revokeSession` is terminal for that ID and increments revision. IDs cannot be
reissued. Every subsequent lookup observes current persisted revocation; no
long-lived token role/company snapshot or cached identity grants continued access.

`withCurrentSessionFence` requires a verified child proof containing its signed
source reference and bearer expiry. It creates one 500 ms monotonic deadline
before queueing for the GLOBAL_REGISTRY SQLite transaction. The storage wrapper
includes same-connection queue time and native `BEGIN IMMEDIATE` acquisition in
that budget by applying only the remaining time as a temporary connection-local
`busy_timeout`; ordinary transactions retain the configured five-second timeout.
Acquisition expiry is normalized to `session-fence-timeout` without invoking the
transaction callback. After acquisition, the registry samples its trusted clock
and revalidates source and child. The callback receives the same absolute deadline
plus an AbortSignal for the remaining budget. Workforce passes that unchanged
deadline to the control-store transaction, so it cannot obtain a fresh 500 ms
lock wait. Keep the callback to short local admission work: no provider/network
wait, readiness probe, or registry re-entry. Lock order is identity registry →
Workforce control store. Company-native reads and provider work run outside both
locks; do not hold them through a long adapter lifecycle.

On timeout the transaction releases and the callback may still run if it ignores
abort. A consumer must retain `UNCERTAIN`, avoid replay and await observed outcome;
the fence cannot cancel an already admitted external effect. A source switch or
revoke that commits first denies the callback. If the callback acquires the fence
first, it is admitted against the then-current identity and a later switch/revoke
does not roll back that in-flight effect.

## Consumer projections

The authority-neutral result contains canonical company/actor/device/session IDs,
current company role, numeric session revision, opaque string context revision,
audience, ISO expiry, external binding ID and currently available company IDs.
`allowed_company_ids` is only a list of eligible company-switch choices. It is
never the scope of the currently selected session: a company-bound operation
must use exactly `company_id`, after current resolution.
It deliberately contains no token, provider secret, raw path, entitlement or
business authority revision. Extra credential-shaped input properties are not
persisted or returned.

- #812 server-node runtime: its adapter must return `company_ids: [context.company_id]`,
  never spread `allowed_company_ids` into the scope of an already selected session.
- #1182/#1188 Workforce conversation: its authenticated resolver can project
  company, actor, device, session and `context_revision` after current lookup.
  Canonical surface selection (`zero`/`go`/`hub`) remains a separate governed
  transport concern, not an inference from identity or a DA role.
- #811 Workforce/Zero exchange path: retain `source_session` and
  `credential_expires_at` in the authenticated identity proof, call the canonical
  effect fence at its final effect boundary, and keep independent authority and
  UNCERTAIN handling. Source-bound `allowed_company_ids` contains only the
  selected company.
- #1049/#1204 DirectAdmin: project actor, current company IDs/selected company,
  stringified `session_revision`, and parsed expiry. Entitlement and effective
  authority must come from their independent canonical owners. Do not fabricate
  either from membership or host administrator privilege.

The current web JWT (`userId`, `accountId`, `role`) lacks the required durable
session/device/revision binding and cannot be silently treated as this contract.
The earlier selected-company fail-closed web fixes remain intact. Historical
identity migration needs reviewed source mappings, ambiguity handling and
recovery evidence under #302 before activation.

## Verification and remaining commissioning

Focused tests exercise actual canonical SQLite persistence, close/reopen,
company-bound recovery, cross-company denial, immediate revocation, generation
changes, ambiguous/missing mappings, wrong actor/audience/device, exact expiry,
invalid timestamps/revisions, optimistic update conflicts, racing switches,
migration rollback/idempotence/version rejection and absence of secret storage.

Restart/process-crash tests prove recovery of the same registry state. The
canonical SQLite connection currently uses WAL with `synchronous=NORMAL`; process
crash testing does not certify revocation persistence through OS/power failure.
Commissioning must select and verify the required durability/backup policy. They do not certify
restoring an older backup against current revocations. Production backup/restore
must protect the current identity revision/revocation history or invalidate and
re-authenticate affected sessions before use. An arbitrary database rollback is
not approved credential recovery.

Remaining gates: protected provider issuance/re-authentication, reviewed
historical mappings, identity registry commissioning/placement, real hosted
consumer integration, backup anti-rollback policy, and deployed cross-surface
adversarial verification. Authentication and storage connectivity still confer
no Titan business authority; consequential execution must traverse the existing
governed authority and execution boundaries.

## Rollback

Code rollback stops consumers and returns to their previous supported path; it
must not silently fall back to an identity path that skips current validation.
Keep the additive registry data intact. Older code cannot reinterpret a newer
schema. Never delete or rewrite persisted identities/revocations as a convenience
rollback. No company-native schema or applied historical migration is changed.
