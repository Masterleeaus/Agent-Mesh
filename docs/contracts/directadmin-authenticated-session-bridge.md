# DirectAdmin authenticated session bridge — #1049

Status: implemented adapter and disposable integration evidence; **not commissioned on a DirectAdmin host**. PR #1204 remains draft/non-closing. This contract depends on #302 / PR #1183 (`1351a6ccb0b73c3a15879e23ddda01435ef25559`) and its inherited #1084/#1179 prerequisite (`ad43d010d50ba262c02beaf0ed892b656174ff58`). Dependency changes are merged with provenance, not reimplemented here.

## Owners and composition

- `packages/titan-platform/src/directadmin-session-bridge.ts`: cryptographic session verification and adaptation to the canonical `IdentitySessionRegistry` exported by `security-boundary.ts`.
- `directadmin-gateway.ts`: bounded Fetch Request/Response handler; no listener, CLI, deployment or new authority engine.
- `directadmin-cockpit.ts`: one browser session lifecycle and accessible text-only projection renderer shared by `apps/directadmin/{zero-core,operations-hub,brand-studio}/cockpit.mjs`.
- `directadmin-plugin.ts`: public SDK entry point. The earlier injectable `resolveDirectAdminTitanContext` is deprecated presentation compatibility, **not authentication**. Its exposed company list is now selected-company-only too.
- #811/#1201 and #812/#1211 own launch, reverse proxy, commissioned issuer configuration, capability routing, and execution integration. #1182/#1188 owns conversation transport. This continuation adds no changes to their server/bootstrap files. Such changes visible in the PR diff are inherited dependency commits.

`createDirectAdminGateway(bridge, owners)` receives canonical projection and governed-intent owners from the launched host composition. Projection callbacks receive only the authenticated selected-company context, never arbitrary caller headers. The adapter revalidates before and after reads. `requestIntent` receives a revalidation function; the execution owner **must call it at authorization and immediately before effects**, and preserve/revalidate the original company context for queued work. The SDK does not grant effective authority or execute providers. Its 202 response says `REQUESTED`, not authorized or verified.

Inspected #811/#1201 head `99cd1bf86fa75c4c0a4e2ec45b39e9baccbe16fd`: `hosted-runtime.ts` requires a credential verifier returning a verified identity with audience `workforce` and a canonical `zero`/`go`/`hub` surface; it persists the authenticated identity into the run and rechecks #302 before native effects. A DirectAdmin credential configured for a separate audience cannot be forwarded to that route or relabelled as `workforce`. Parent-coordinated composition must establish an authenticated audience-bound handoff and explicit business surface through canonical owners. This patch neither introduces such an exchange nor alters the conversation owner. Its per-request revalidation closure alone is not a durable queued-work credential.

## Credential and browser contract

The host must commission an authentication issuer before enabling these routes. This repository does not assume that DirectAdmin emits this credential natively. The issuer must independently authenticate the actual DirectAdmin session/human, rotate login state to resist fixation, and use the canonical #302 mapping/session rather than script ownership, role, headers or a bare session ID. It may sign only the authenticated session binding. No persistent signing keys or credentials are created by this implementation or its tests.

Ownership update: #302 is implementing canonical Titan credential issuance/verification. The verifier here is restricted to the DirectAdmin **provider attestation boundary**, not an alternative canonical Titan token service. Its format below is provisional/uncommissioned and must be reconciled with #302's exported verifier before host integration. #1049 must not mint a competing Titan credential, create a signing-key store, blanket-backfill memberships, or bypass #302. Required handoff to that owner: cryptographically verified issuer/provider, subject, session ID, device ID, session revision, fixed audience/node and expiry, plus selected-company/context and CSRF/session binding. The stable #302 current-state resolver remains mandatory after cryptographic verification.

The bridge verifies compact JWS using pinned **public Ed25519** keys. The protected header is exactly `alg: EdDSA`, `typ: titan-da-session+jwt`, and a configured `kid`; remote key discovery, alternate algorithms and extra header parameters are rejected. Key rotation replaces commissioned bridge configuration. Upstream private keys stay outside plugins/browser code.

Signed claims:

| Claim | Binding |
| --- | --- |
| `iss`, `sub` | Configured issuer and authenticated external subject; passed to canonical provider/subject mapping |
| `aud`, `node_id` | Exact configured audience and node, never request-selected |
| `session_id`, `device_id`, `session_revision` | Exact persisted current session/device/revision |
| `actor_id`, `company_id`, `context_revision` | Exact canonical selected actor/company and current identity generation |
| `iat`, `exp` | Integer Unix seconds; no future issuance, maximum lifetime 300 seconds, expiry checked on every revalidation |
| `csrf_sha256` | Base64url SHA-256 of a separate random browser CSRF nonce (at least 32 random bytes) |
| `da_role` | `admin`, `reseller` or `user`; presentation only |

Credential delivery must use `__Host-titan-da-session` with **Secure; HttpOnly; SameSite=Strict; Path=/** and no Domain. The separately authenticated HTML/bootstrap supplies the CSRF nonce to `DirectAdminCockpitSession`; never put the credential into JavaScript, local storage, URLs or diagnostic payloads. Cookie values are not minted/set by this SDK. It clears the cookie after successful switch/logout.

Every gateway call requires the cookie, `X-Titan-CSRF`, `Sec-Fetch-Site: same-origin`, and the configured HTTPS request origin. POST requires an exact Origin header. Browser GET may instead use an exact same-origin Referer when Origin is absent. No forwarded header changes the configured origin. A missing browser signal fails closed. The real proxy must preserve trusted request-origin metadata and restrict direct gateway access; host-specific proxy behavior is unverified.

Responses are no-store JSON with nosniff, no-referrer, same-origin framing, and restrictive CSP. HTML entrypoints must independently apply their corresponding additive Evolution-compatible headers; API response headers alone do not protect a parent HTML document. The handler limits bodies to 64 KiB and five seconds, and admits at most 32 concurrent requests. The launched host must still configure total request/header deadlines, connection limits and authentication rate limiting. Browser fetches time out at ten seconds.

## Company rotation and replay

The public context contains `company_ids: [current.company_id]` only. #302's `allowed_company_ids` are switch choices, not current authorization scope; they are not copied into this context. No Frappe/provider mapping is required for native Titan FSM.

POST `/v1/directadmin/company` validates the old proof, performs the canonical switch, increments the persisted revision, and clears the credential cookie. All plugins invalidate immediately, including failed switch attempts. The upstream issuer must authenticate again and bind a fresh credential to the new revision before reads resume. Old credentials and in-flight projection responses are rejected by canonical revision checks. Logout revokes the durable session, not just the cookie.

One shared `DirectAdminCockpitSession` must be supplied to all mounted consumers. It purges rendered data on switch/logout/expiry and suppresses stale asynchronous completions. Browser instances use an origin-local BroadcastChannel to propagate **invalidation only**, never identity or authority. Such a message cannot select a company. Requests never rebind a queued intent to the newly selected company. Governed ingress must enforce canonical operation idempotency/replay rules; these reusable short-lived session cookies are not one-use execution authorizations.

## Routes and actual consumers

- GET `/v1/directadmin/context`
- GET `/v1/directadmin/{titan_zero,titan_operations,titan_web}/projection`
- POST `/v1/directadmin/{titan_zero,titan_operations,titan_web}/intents`
- POST `/v1/directadmin/company` with `{ "company_id": "..." }`
- POST `/v1/directadmin/logout`

The three consumer modules execute the same SDK renderer with different canonical data schemas (`titan.zero-cockpit.v1`, `titan.operations-health.v1`, `titan.brand-publication.v1`). They render source/freshness/evidence fields, isolate an unavailable plugin, and use DOM textContent rather than executable HTML. They are source modules ready for the owning plugin's bundler/entrypoint, **not installed DirectAdmin packages**. No copied authentication clients, hardcoded privileged API tokens or provider credentials are introduced.

## Evidence and residual work

Executed in the continuation workspace:

```sh
node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit
node_modules/.bin/tsc -p packages/titan-platform/tsconfig.json --noEmit false --outDir packages/titan-platform/.test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false
node --test packages/titan-platform/tests/directadmin-bridge.test.mjs packages/titan-platform/tests/directadmin-plugin.test.mjs packages/titan-platform/tests/security-boundary.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs scripts/package-directadmin-plugin.test.mjs scripts/validate-directadmin-plugin.test.mjs
```

122 tests pass: 45 new bridge/consumer cases, 12 SDK cases, 61 canonical security/session cases, and 4 package cases. Tests generate ephemeral signing keys and use the real canonical SQLite registry; the cross-plugin test calls the actual three consumer modules through a disposable loopback HTTP listener. Rendering uses a minimal DOM fixture, not a real Evolution browser. The native SQLite test dependency was built locally; no persistent credentials or host deployment occurred.

Independent read-only review found a microtask invalidation race between network settlement and accepting context. It was fixed with pre-accept epoch/disposal checks; all four regression variants and independent follow-up probes pass. Additional independent probes verified redacted exceptions, concurrency-slot recovery and stalled-body cancellation. This does not replace required independent PR authentication review before merge.

Required `pnpm gate:fast` and `pnpm gate` were attempted, including retry with writable XDG/store locations after an initial `/home/agent/.local/share/pnpm` error. Both remain blocked before gate execution by `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`: locked `resend@6.32.0` was published at `2026-10-01T20:28:20Z`, inside the configured package-age cutoff. The lockfile and security policy were preserved; no allowlist/bypass was added. Focused TypeScript and Node verification above ran directly. Repository-wide lint/build/integration/E2E are not claimed passed.

Not proven: real DirectAdmin authentication/issuer commissioning, secured browser access and OS details, role entrypoint packaging/migration, real Evolution rendering and headers, production reverse proxy, launched #811/#812 routes, canonical downstream authorization/effect integration, durable queued-intent recovery, host revocation/logout propagation, live install/upgrade/rollback and the remaining broad #1049 acceptance criteria. Those requirements remain open. The uncommissioned #812 CLI stays fail-closed. No production deployment or PR merge is authorized by this evidence.

Rollback: withdraw the new gateway routes and three consumer modules; no SDK database migration or new credential store exists. Do not revert the separately owned #302 identity schema or other inherited prerequisite work as part of SDK rollback.
