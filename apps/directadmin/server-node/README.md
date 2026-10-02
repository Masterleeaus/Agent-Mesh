# Titan Server Node runtime

This is a **partial, fail-closed implementation**, not production commissioning or clean-host certification. It persists bounded node/control metadata only. Company operational data, authority, provider execution and accepted business evidence remain with their canonical owners.

The packaged DirectAdmin relay `0.3.0` is experimental and is not approved for host installation. The source now rejects production relay requests on every hostname with sanitized 503 `cookie_boundary_unverified` before reading a config file or connecting upstream. No v1/v2 file, marker, CGI variable, or request header enables production forwarding. The test suite exercises the relay core with an explicit in-process config-loader injection; the extracted RAW executable uses the disabled production loader. This source correction is not included in package `0.3.0` or Library archive version 4. Version `0.2.0` / Library archive version 3 is historical. Do not install either archive.

No same-hostname cookie-isolation design has been selected. Existing v1/v2 relay config files and the former `cookie_boundary` marker are ignored by the production RAW handler; test forwarding is available only through explicit in-process dependency injection.

## Runtime modes and health

- `node runtime.mjs` preserves the read-only health bridge on `127.0.0.1:3099`: `/healthz` is liveness and `/v1/status` probes configured dependencies. `TITAN_SERVER_NODE_PORT`, `TITAN_SERVER_NODE_BIND`, `APP_PORT`, `WORKFORCE_PORT` and `TITAN_SERVER_NODE_DEPENDENCIES` retain their existing meanings. Targets must be loopback HTTP, with no credentials, redirects or query strings and at most 16 dependencies. Proxy-free bounded/coalesced observations, overload handling and IPv4/IPv6 behavior from current main are retained.
- `node runtime.mjs --serve` starts the bounded control API on `127.0.0.1:3015` (`TITAN_NODE_PORT`). `/live` reports process liveness and PID only. `/ready` requires healthy mandatory dependencies, writable locked state, configured authentication and a commissioned canonical adapter. Unknown, absent or failed dependencies are never ready. Default real probes observe web and Workforce; Redis/database/DirectAdmin/evidence/backups remain explicitly unknown until owned probes are configured.
- The installed systemd service runs as `titan-node`. Durable state is `/var/lib/titan/server-node/control.json`, consistently set by the unit and runtime default; `TITAN_NODE_STORE_PATH` can explicitly select another permitted path. Executable code remains supervisor-owned. The runtime requires Node 20+ and Linux util-linux `flock`; privileged installation verifies the unit's actual `/usr/bin/node` executable, not merely a different Node on PATH.

## API and trust boundary

The contract is `titan.server-node/v1`. Requests require `x-titan-schema-version: 1`, a bounded caller reference, correlation ID and bearer authentication. Read-only `/v1/bootstrap`, `/v1/health` and `/v1/dependencies` use the node transport token. This token and a caller header do **not** establish a company principal or business authority.

**The shipped CLI has no commissioned canonical adapter. All consequential intent/checkpoint/restore submissions return unavailable/refused; no unconsumed pending queue or fake successful lifecycle action is created.** Bootstrap does not advertise mutation capabilities in this state. A live process can therefore correctly remain not-ready.

An embedding composition root may supply `canonicalAdapter` with these trusted server-side ports. Tests supply fixtures; these are not production grants:

1. `authenticate({ bearerToken, caller_ref })` resolves the actual credential through the canonical identity/session owner, returning current `caller_id` and `company_ids`. Caller-supplied identity, role and company references are assertions only. Revoked/expired sessions and ambiguous mapping must fail closed. Credentials never enter persisted metadata or evidence.
2. `authorize({ node_id, caller_id, correlation_id, intent, intent_digest })` loads/revalidates current canonical authority. Its response must explicitly bind `allowed`, node, principal, company, capability, complete intent digest, authority-decision reference and a valid future UTC expiry. Request-provided `approved` booleans or reference strings are never authority. Authorization is repeated on replay and immediately before dispatch.
3. `execute(request)` routes the exact retained action/opaque target through the existing Command Bus/ExecutionGateway, registered capability provider and observed verifier. It must revalidate current authority at the actual effect boundary. Raw callbacks named `governedExecutor`/`evidenceSink` no longer activate the ingress.
4. `recordEvidence(event)` uses the canonical evidence owner and returns a durable accepted receipt/reference. Evidence failure before dispatch prevents execution. Provider acknowledgement remains unverified; only a verified result with a verification reference and accepted result evidence can produce a verified receipt.

Intents are restricted to bounded metadata/opaque references, not arbitrary business records or secrets. Company header and body must agree. Invalid UTC timestamps, unavailable capabilities, foreign identity/company, stale authority, changed-payload idempotency reuse and unregistered action kinds fail closed.

## Persistence, replay and recovery

The existing control metadata store serializes atomic 0600 writes, fsyncs file/directory and acquires a kernel-held single-writer lock. A unique temporary file prevents concurrent rename races. A reservation containing the complete original action/target and fingerprint is durable **before** provider dispatch. Concurrent duplicates reuse the reservation. Linux process death releases the advisory lock; recovered RESERVED/EXECUTING entries become UNCERTAIN. An ambiguous result, lost evidence or after-effect error never automatically re-executes. Canonical reconciliation is required. This is not a claim of exactly-once arbitrary external effects, and the file is not a second business ledger.

Snapshots require an explicit company scope and retain fingerprints, original intents and receipts. A SHA-256 digest covers the canonicalized complete snapshot content (all object keys sorted; `snapshot_digest` omitted from the hash). Validation checks digest, schema, same-node identity, company scope, duplicate records and conflicting live metadata. A checksum proves integrity, not authorization. The offline/canonical-provider merge helper is additive only: it cannot erase newer work, replace differing receipts or overwrite another company's state. Relocating a node requires separately governed recovery tooling, not changing a snapshot node ID.

HTTP recovery requests validate scope/integrity then cross the same trusted identity/authority/execution/evidence boundary. The HTTP handler never directly replaces live state. A real recovery provider and end-to-end recovery evidence are still required. Empty/corrupt state fails startup rather than silently creating another node. Legacy entries lacking original intent/receipt metadata are preserved but require canonical reconciliation, not re-execution.

## Install, update and rollback

Installation is an explicit privileged host/package-administrator action, not an API authority grant. Root is required to create `titan-node`, create protected code/config/state directories, install the systemd unit and enable/restart the service. `--validate-only` is the only validation-only mode and reports `installation_attempted:false`, `installed:null` (not checked), and `updated:false`; ordinary install, update and uninstall requests fail nonzero when their privileged host action cannot run. No live root installation was performed for this change.

First install stages and validates the runtime and unit before promoting either, refuses an unexpected pre-existing unit, and validates any existing token file with `lstat` (regular, single-link, root-owned, mode `0600`) without printing or replacing it. If activation or liveness verification fails, the hook stops and verifies the service before removing only this attempt's checksum-matching runtime and unit. If stop/rollback cannot be verified, it retains the service artifacts and reports `install-failed`; token and control state are retained for recovery. Uninstall must successfully disable/stop the service and confirm `inactive` plus `disabled`, then reports the retained unit/runtime/token/state explicitly. Stop or verification failures return nonzero and never claim uninstall success.

Updates validate a complete staged runtime and unit, quiesce the old service, promote the staged files, verify installed hashes and correlate `/live` PID with systemd MainPID. Process liveness is distinct from business readiness. Root-only rollback artifacts are retained at `/usr/local/titan/server-node-backups/release.*`: prior `runtime/`, prior unit and `SHA256SUMS`; failed deployments additionally retain `failed-runtime/`. Restart/liveness failure restores and verifies the prior artifact, reporting rollback failure explicitly if restoration cannot be verified. State and credential configuration are not replaced. Snapshots may need operator retention management.

## Package and automated verification

`node scripts/package-directadmin-plugin.mjs apps/directadmin/server-node dist/directadmin` emits `titan-server-node.tar.gz` and SHA-256 with the archive-root manifest, required unit/package files, fixed allowlist, normalized timestamps/ownership and executable lifecycle modes. Symlink and malformed-source inputs fail closed. This remains the existing packager, not a competing portfolio release pipeline.

Run:

```sh
npm --prefix apps/directadmin/server-node test
node --test scripts/package-directadmin-plugin.test.mjs
node scripts/validate-directadmin-plugin.mjs apps/directadmin/server-node
bash -n apps/directadmin/server-node/{install,update,uninstall,health}.sh
```

The runtime tests cover fabricated identity/authority, invalid expiry, absent dependencies, concurrent replay, persistence/evidence failures, abrupt SIGKILL recovery, corrupt state, snapshot integrity/scope and retained receipts. Lifecycle tests use disposable paths, a fixture supervisor and actual Node HTTP probes; they verify copying, wrong-PID refusal and rollback failures without touching host systemd, credentials or security settings. Read-only health tests include actual loopback processes. These tests do not certify DirectAdmin installation, reboot or real provider effects.

## Remaining production integration and commissioning

Keep the existing mission open. No successor or duplicate host is created by this repair.

- **Identity (#302/#1049):** bind the Server Node transport to the canonical principal/session→membership resolver; a shared host token cannot substitute. Reuse the identity/bootstrap owner and registered company context.
- **Authority/execution (#14/#811):** compose `packages/runtime/authority/{authority-context-resolver,runtime-authority-gateway,sqlite-authority-store}.mjs` and `packages/tools/execution-gateway.mjs` behind the canonical host composition in `services/workforce/src/production-runtime-bootstrap.ts`. Actual Server Node allowlisted host providers, durable provider idempotency, current decision lookup and observed verification are missing. Do not expose the gateway's request-supplied authority status as an authorization API.
- **Evidence/recovery (#913/#812):** commission the accepted-evidence writer and metadata restore provider; record durable request/decision/dispatch/observed-result/recovery provenance with company isolation. `packages/tools/accepted-evidence-ledger.mjs` is an existing bounded evidence owner, not a generic claim that all node outcomes are already integrated.
- **Hosted runtime (#811):** active claim `agent/issue-811` / PR #1201 owns Workforce host work. Its storage-aware readiness slice still declares missing production bootstrap/dispatch/provider integration. Coordinate there; do not create another Workforce service. Server Node composition remains within this existing #1155/#812 mission.
- **Estate discovery (#812/#1045):** supply owned health/dependency projections for optional Frappe, databases, Redis, DNS/TLS, email, apps, devices and backups; absent observations must remain unknown.
- **Certification (#812/#1157):** on an explicitly authorized disposable supported host, verify OS/DirectAdmin/Node/systemd/util-linux prerequisites and exact artifact checksum; install as the package administrator; prove service-user permissions and blocked out-of-state writes; reboot/crash and recheck identity/receipts; exercise real scoped authority revocation and two-company denials; execute one harmless allowlisted lifecycle operation with independent observation and accepted evidence; rehearse governed snapshot recovery; stage a different artifact and inject restart failure to verify exact rollback. Record host, OS, versions, source/artifact digests and sanitized evidence. No such clean-host run has occurred.

## Browser to private Workforce gateway relay

The DirectAdmin listener owns HTTPS on port 2222. A browser on that origin must call the Server Node role RAW endpoint, which forwards only a fixed route set to the optional #811 Workforce directAdmin Fetch gateway. Apache 443 configuration cannot install a handler on DirectAdmin's port 2222.

DirectAdmin documents role plugin scripts and RAW mode in its [plugin structure guide](https://docs.directadmin.com/developer/plugins/structure.html) and [RAW mode guide](https://docs.directadmin.com/developer/plugins/raw_mode.html). The official [1.57.0 changelog](https://docs.directadmin.com/changelog/version-1.57.0.html) says `headers_to_env=yes` populates `HEADERS` with URL-encoded request headers. The official [1.53.0 changelog](https://docs.directadmin.com/changelog/version-1.53.0.html) says `pipe_post=yes` sends POST bytes to stdin and sets `POST=stdin=true`. Titan DA 1.711 exceeds those feature versions. DirectAdmin does not document the precise escaping or line-separator grammar. The extracted RAW entrypoint is exercised with percent-encoded CRLF, form-style `+` spaces, LF, fragmented piped POST bytes, and malformed inputs; these are disposable DA-like compatibility fixtures, not claims about the panel's actual serializer. Verify the exact `HEADERS`, stdin, status and separate `Set-Cookie` behavior on a disposable real panel before commissioning.

### #1050 browser contract

Import the static helper from the Server Node plugin and inject it into the shared #1049 browser session. #1049 owns the connect/resume/bootstrap flow, the one-time nonce lifecycle, in-memory CSRF state, and session invalidation. This transport only maps exact #1049 paths and methods; it does not parse identity, issue credentials, or create receipts.

    import { DirectAdminCockpitSession } from "titan-sdk";
    import { createDirectAdminRelayFetch } from "/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs";
    const session = new DirectAdminCockpitSession(readTrustedBootstrapNonce, createDirectAdminRelayFetch());

The RAW endpoint is /CMD_PLUGINS/titan-server-node/directadmin-gateway.raw.

| SDK request | RAW selector | Required query flags |
| --- | --- | --- |
| POST /v1/directadmin/bootstrap | bootstrap | headers_to_env=yes and pipe_post=yes (empty body only) |
| GET /v1/directadmin/context | context | headers_to_env=yes |
| POST /v1/directadmin/logout | logout | headers_to_env=yes and pipe_post=yes |
| POST /v1/directadmin/company | company | headers_to_env=yes and pipe_post=yes |
| GET /v1/directadmin/titan_workforce/projection | workforce-projection | headers_to_env=yes |
| POST /v1/directadmin/titan_workforce/intents | workforce-intents | headers_to_env=yes and pipe_post=yes |

The transport also has fixed selectors for the existing Zero, Operations and Web routes. `readTrustedBootstrapNonce` reads the one-time nonce supplied by the trusted DirectAdmin page integration; the shared #1049 session validates it and marks it used locally before a bootstrap attempt, then keeps the returned CSRF token only in memory. The server-side one-time proof and nonce consumption remain #302 responsibilities. The transport itself never generates a nonce or sends a request body or identity header for bootstrap. Unknown SDK paths, query strings, method changes, missing/invalid nonces, caller bodies and extra RAW query keys fail closed. #1050 must use the shared #1049 session and the #1049 `titan_workforce` route allowlist; this relay does not edit either owner.

For transport-level testing, `createDirectAdminRelayFetch()` accepts `POST /v1/directadmin/bootstrap` with the nonce supplied by the shared #1049 session. This low-level adapter only maps the fixed request to RAW; nonce reuse tracking, context resume/bootstrap flow, browser CSRF state and invalidation remain in `DirectAdminCockpitSession`. #1050 should consume the published #1049 helper rather than copy its state machine.

### Initial browser-session bootstrap seam

The current #1049 draft [PR #1252](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1252), head `aff115212281fb555d0c7bc804635e88713f2ec5`, adds `POST /v1/directadmin/bootstrap` to `createDirectAdminGateway`, calls `DirectAdminSessionBridge.bootstrapBrowserSession(request, resolveInput)`, and publishes the shared `DirectAdminCockpitSession` browser helper. The request is an empty body with exact configured `Origin`, `Sec-Fetch-Site: same-origin`, no existing `__Host-titan-da-session` cookie, and a 43–128 character URL-safe `X-Titan-DA-Bootstrap-CSRF` nonce. The resolver callback receives exactly `{ origin, cookie, authorization, csrf_nonce }` and must return `{ login_assertion, company_id, device_id, csrf_token }`. The bridge delegates signed assertion verification/session issue and reauthentication to #302. The draft has fixture-level signed-assertion and provider stubs; it does not publish a trusted DirectAdmin proof provider or a nonce issuer. Production still needs #302 to prove atomic one-time use, short expiry and binding to the authenticated operator, origin, company and device. Success returns `{ csrf_token }` and one hardened session cookie with a lifetime no greater than 300 seconds; denial is 401 without a cookie, and provider outage is 503 without a cookie. The PR is still a draft and is not a release or commissioning signal.

This #812 source adds only a fixed `bootstrap` selector and browser fetch mapping for that exact path. It validates the empty POST and nonce, rejects an incoming Titan session cookie, and strips **all** incoming cookies before the private gateway; Authorization is rejected and never forwarded. The upstream request carries only the fixed public Host, exact Origin, same-origin Fetch Metadata, JSON Accept, the nonce and `Content-Length: 0`; it does not carry the ordinary `X-Titan-CSRF`, Referer, Cookie, caller identity, or body. The relay accepts only the exact 200 `{csrf_token}` plus one valid hardened session `Set-Cookie` with `Max-Age` from 1 through 300 seconds, 401 `{"error":"directadmin-session-rejected","read_only":true}` without a cookie, or 503 `{"error":"directadmin-bootstrap-unavailable","read_only":true}` without a cookie. Other status/body/cookie combinations fail with sanitized 502. The `DirectAdminCockpitSession` requires a trusted HTML nonce callback, but #1049 does not issue or render that nonce and no production page/nonce-source contract is published. #1050 owns Workforce page/client integration; #302 owns trusted proof validation and server-side atomic nonce consumption. The relay neither creates a nonce nor asserts a DirectAdmin identity.

The #811 host adapter must expose this fixed route on its private gateway and reconstruct the SDK request using the operator-pinned public origin plus the exact `/v1/directadmin/bootstrap` path before calling `createDirectAdminGateway`; it must not trust a caller URL or Host to choose the target. A current #811 seam still blocks that mounted flow: `services/workforce/src/server.ts`'s `directAdminForwardHeaders` allowlist does not yet include `x-titan-da-bootstrap-csrf`, so `directAdminRequest()` drops the nonce before the SDK. This was reported to #811; that owner must add and test the header. #302 has not published the trusted provider/nonce issuer. The relay's production config loader still returns 503 before opening any config file or making a request, so the passing route test is only the packaged browser helper → extracted RAW → fake loopback upstream flow. The new cross-owner acceptance also remains open: atomic concurrent nonce consumption, expiry and operator/origin/company/device binding; pinned issuer/audience/algorithm/key and unique-jti/CSRF-digest checks through the actual provider; forged caller/CGI identity denials; and cookie-free failures/revocation/orphan expiry through the actual integrated path. Do not route an initial-session request through `context`, weaken the cookie requirement for existing routes, accept a browser-supplied role, UID, session ID, company/device authority or unverified assertion, or open public Workforce ports. Real issuer, protected private transport, cookie boundary and panel behavior remain uncommissioned.

### Operator configuration and transport

Production relay configuration is disabled in source. The RAW handler's default config loader immediately returns sanitized 503 `cookie_boundary_unverified`; it does not read `/etc/titan/server-node-directadmin-relay.json`, any other path, or environment-selected test paths. Existing v1/v2 schemas and the former `cookie_boundary` marker do not authorize forwarding. Do not create a production relay config. A future approved config contract must use a fixed operator-configured private target and match #811's `HostedWorkforceDependencies.directAdmin.publicOrigin`; it requires an approved cookie-isolation design, reviewed source, and private authenticated transport. No public 3010/3015 opening is allowed.

The test suite packages and extracts the role, then drives its browser helper through the extracted RAW module to a fake loopback upstream. This dependency seam is not selected by CGI headers, query fields, `NODE_ENV`, or a config-path variable. The extracted RAW executable uses the disabled production loader and has no fake-upstream requests. Ordinary-session routes forward only the Titan session cookie and required #1049 browser headers; bootstrap forwards no cookies. Tests enforce body/response caps, deadlines, exact bootstrap status/body/cookie combinations, redirect refusal, identity rejection and separate session `Set-Cookie` handling. These core tests are not production commissioning.

### Host isolation gate

Cookies do not isolate by port: [RFC 6265 §8.5](https://www.rfc-editor.org/rfc/rfc6265.html#section-8.5) notes that cookies for a host are shared across ports. The #1049 host-only `__Host-titan-da-session; Path=/` cookie set on `titanzero.io:2222` is also sent to `titanzero.io:443`. Same-origin on port 2222 does not isolate the cookie from the 443 marketing handler.

A disposable Apache 2.4.68 runtime test found the candidate `RequestHeader` filter fails open for separate `Cookie` fields when the unrelated cookie is first and Titan cookie second. Reversing the field order removed the full header. A synthetic earlier `SetEnvIf` module also observed the Titan cookie before the late request-header filter. The candidate Apache template was removed. No replacement hostname or cookie-isolation design has been selected. Keep production relay forwarding disabled until the #1049/#302/#811 owners approve and verify a boundary and an independently reviewed source change enforces it. Do not include cookie values or raw headers in logs or evidence.

The operator has since reported that the already-existing `https://server-216-219-85-159.da.direct:2222/` loads the DirectAdmin login without redirecting to `titanzero.io`. This is a candidate hostname, not a commissioned cookie boundary. It is a separate hostname from `titanzero.io`, but a host-only `Path=/` cookie remains shared with every port on `server-216-219-85-159.da.direct`, including `:443`. The direct origin's `:443` content/certificate and public reachability of `3010`/`3015` still require an authorized direct-network check. A browser observation on `:2222` does not establish those facts.

### Read-only host-boundary handoff

Use the repository verifier from a direct-network workstation and, separately, on the DirectAdmin host after the operator authorizes read-only access:

```sh
python3 apps/directadmin/server-node/verify-host-boundary.py external
python3 apps/directadmin/server-node/verify-host-boundary.py panel \
  --workforce-origin 'https://<operator-supplied-private-workforce-host>:<port>'
```

The `external` mode bypasses environment proxies, performs anonymous GET `/` requests on `:443` and `:2222` without following redirects or sending cookies, and makes data-free TCP probes to `3010`/`3015`. It resolves the candidate once, rejects any non-global or reserved DNS answer, and pins each probe to the validated address while preserving the hostname for TLS SNI and HTTP Host. It reports certificate metadata, status/content type, a bounded body sample hash, a same-origin redirect boolean, a hash of any HTML title, and cookie names only; it never prints response bodies, redirect paths, title text, query strings, or cookie values. Run it from an independent network with outbound access. A timeout is **unknown**, not proof that a port is closed.

The `panel` mode reads `ss -H -ltn` listener addresses and only the `TCP_IN`/`TCP6_IN` entries from `/etc/csf/csf.conf`. Those entries describe configured CSF ingress, not effective firewall state. If the #811 owner supplies the exact private Workforce origin, the verifier checks that HTTP is literal loopback only, HTTPS resolves exclusively to private addresses, pins a validated address, and verifies TLS without sending an HTTP request or credential. It does not modify host state. Exit codes are `0` for observations only, `1` for incomplete evidence, and `2` for an unsafe finding; even exit `0` never authorizes relay enablement.

The verifier cannot attest the live #302 issuer registration or #1049/#811 startup config. Those existing owners must confirm the exact shared origin `https://server-216-219-85-159.da.direct:2222` and provider `directadmin:https://server-216-219-85-159.da.direct:2222`; #811 must provide its fixed private target and protected transport. If any of those checks is unavailable, preserve the production RAW 503 and attach the sanitized verifier reports to this issue/PR for the owners. Do not create relay config, change DNS/TLS/firewall/host settings, or open `3010`/`3015`.

### DirectAdmin 1.711 commissioning checklist

This checklist is for a later, separately authorized commissioning window. It is not evidence that the target panel, Workforce host, DNS, firewall, session issuer, or production identity path has been configured.

**User-supplied read-only host report (not independently verified by this workspace):** AlmaLinux 9.8 x86_64, kernel `5.14.0-687.41.1.el9_8`, glibc 2.34; DirectAdmin 1.711, Apache 2.4.68, MariaDB 10.6.28, PHP-FPM 7.4/8.3, CSF/LFD enabled; one CPU, 28.3 GB free disk, 1.7 GiB RAM with about 908 MiB available, and 1 GiB swap with about 303 MiB used. `/usr/bin/node` reports v16.20.2, below this runtime's Node 20 minimum. systemd 252 and `flock` 2.37.4 are present. The report also observed UID/EUID 0 with `CapEff=0`, `NoNewPrivs=1`, `Seccomp=2`, and a denied systemd bus. That is a constrained sandbox, not unrestricted host-root access. Live site/service state and the RPM owner/module/repository/dependency chain remain unknown. Preserve Apache, CSF/LFD, MariaDB and the web stack. Use prebuilt x86_64 payloads in any future approved work; do not compile on this one-CPU, low-memory host. No live command, package, setting, service, credential, DNS or firewall change was made.

**Current blocker:** the reported `/usr/bin/node` v16.20.2 fails the Node 20+ runtime prerequisite. Do not overwrite `/usr/bin/node`, install over its package-owned files, enable DirectAdmin's NGINX Unit Node module, or change the web stack. First identify the installed package owner, enabled module stream, enabled repositories and reverse dependencies using an operator-authorized read-only host shell. The commands below are prepared for that later operator session; they have not been run here. Keep `dnf -C` (`--cacheonly`) so missing metadata is reported instead of downloaded, and stop if any command would require repository or package changes.

#### Minimum read-only Node/RPM preflight

```sh
cat /etc/os-release
uname -m
uname -r
getconf GNU_LIBC_VERSION
free -h
swapon --show
df -h / /usr /var
type -a node nodejs
readlink -e /usr/bin/node
/usr/bin/node --version
rpm -qf /usr/bin/node "$(readlink -e /usr/bin/node)"
node_package="$(rpm -qf --qf '%{NAME}\n' "$(readlink -e /usr/bin/node)")"
rpm -qi "$node_package"
rpm -ql "$node_package"
rpm -q --requires "$node_package"
rpm -q --whatrequires "$node_package"
dnf -C info --installed "$node_package"
dnf -C module list nodejs --all
dnf -C module list --enabled nodejs
dnf -C repolist --enabled
```

Record the owner and version of both `/usr/bin/node` and its resolved path, package vendor/repository, file list, requirements/reverse dependencies, active Node module stream, enabled repositories, and current memory/disk. If the RPM owner, module state, or dependency information cannot be read from cached metadata, stop and ask the host operator; do not refresh metadata, add a repository, or infer ownership from the version string.

#### Later Node 22 plan — separate approval required

The AlmaLinux 9.8 release notes list an updated Node.js 24 module stream; they do not establish which stream or package owns this host's Node 16 binary. Node.js 22 is currently an LTS line, and NodeSource documents a prebuilt Node 22 RPM path for Enterprise Linux. DirectAdmin's CustomBuild `nodesource-22` option remains specific to the NGINX Unit Node module and is not the host runtime. See the [AlmaLinux 9.8 release notes](https://wiki.almalinux.org/release-notes/9.8.html), [Node.js release schedule](https://nodejs.org/en/about/previous-releases), and [NodeSource Enterprise Linux RPM instructions](https://github.com/nodesource/distributions/blob/master/DEV_README.md#rpm-installation-instructions).

Only after a separate approval for a named maintenance window and after the read-only owner/dependency report is reviewed:

1. Choose and record the approved vendor/repository. If NodeSource is selected, retrieve its Node 22 setup script from the official source as a file, inspect and pin the exact script/repository metadata and signing key before executing it; do not pipe an unreviewed script to a shell. Do not run a repository setup script under this preflight.
2. Use the vendor's signed prebuilt x86_64 RPMs; do not compile from source or replace `/usr/bin/node` with a copied tarball. After repository setup is separately approved, preview the exact package transaction with `dnf --assumeno install nodejs`. Review every install, upgrade, erase, file conflict and dependency; stop if it proposes changes to DirectAdmin, Apache, PHP-FPM, MariaDB, CSF/LFD or another unapproved service. Do not use `--allowerasing` to force a transaction.
3. Back up the current package identity and configuration, then execute only the reviewed package-manager transaction under its separate approval. Let RPM own the resulting `/usr/bin/node`; do not manually overwrite package-owned files. Preserve an explicit rollback path to the recorded prior package/version.
4. Verify the installed package owner with `rpm -qf /usr/bin/node`, verify RPM files with `rpm -V <approved-node-package>`, confirm `/usr/bin/node --version` is Node 22, and check required shared libraries and the Server Node service's configured executable before any authorized service restart. Recheck memory/disk and stop if the package plan exceeds the host's approved resource budget.

This is a future plan, not installation approval. Until then, the Server Node plugin and RAW relay remain uncommissioned because the required standalone `/usr/bin/node` version is not met. No Node package transaction or service operation was performed.

1. **Confirm host prerequisites and artifact identity.** Recheck the approved host facts and resource readings. Verify the selected archive SHA-256 before extraction. Confirm `/usr/bin/node` meets the Node 20+ runtime prerequisite, plus the existing systemd and `flock` prerequisites; Node 16.20.2 does not pass. Confirm the RAW and plugin lifecycle scripts have mode 0755 and that DirectAdmin executes them as the expected Unix account.
2. **Keep production forwarding disabled pending an approved cookie-isolation contract.** Relevant owners must choose and verify the boundary and update #811/#1049/#302 contracts. This correction does not select a hostname or authorize DNS/TLS/routing changes.
3. **Do not create production relay configuration.** Source rejects every production configuration before reading a file or opening an upstream connection. Enabling it requires an approved boundary, reviewed source, protected fixed target configuration, verified private transport and separately authorized commissioning. Keep ports 3010/3015 off public firewall paths.
4. **Prove true Titan bootstrap separately from Node availability.** Confirm the #811 Workforce gateway is running and configured with the exact public origin and private route. Confirm the real #302 source-credential/session exchange and #1049 session, CSRF and company-membership resolver are commissioned for the chosen hostname. Log in through the real Titan issuer and verify the context/company and read-only Workforce projection for that current membership. DirectAdmin UNIX UID, panel role, root privilege, supplied headers, the Node `/live` response and a relay response alone are not Titan identity, authorization, or business readiness.
5. **Verify transport only after a future reviewed enablement.** The current extracted RAW role stays disabled on every production host and returns 503 before any upstream connection. If a later approved source change enables forwarding, use an authorized disposable panel to verify actual `HEADERS` encoding, `headers_to_env=yes`, POST `pipe_post=yes`/`POST=stdin=true`, bounded stdin reads, status and separate `Set-Cookie` behavior. Do not treat these requirements or the current fake-upstream core tests as live verification.
6. **Record remaining release gates.** Attach the independent security review result and current-head checks; record sanitized host/version/artifact digests, exact target origin types, cookie-name-only isolation evidence, and results for the checks above. Keep the mission partial until canonical identity/authority, approved providers, observed outcomes, accepted evidence, recovery, estate projections and the full #812 verification are separately complete.

### Package and rollback

The archive includes the root plugin.conf, role user/index.html, executable user/directadmin-gateway.raw, static browser helper, and official scripts/install.sh, scripts/update.sh, and scripts/uninstall.sh lifecycle entrypoints. Those lifecycle wrappers forward explicit validation-only requests to the existing Server Node lifecycle scripts. The bounded relay module is staged and checksummed with the supervised runtime; update failure restores the previous module and service artifact. Its overall upstream deadline cancels Node's native DNS `Resolver` queries so the standalone RAW process can exit promptly; private-answer validation and address pinning remain in place. Persistent control metadata and operator configuration remain outside package-managed files and are preserved by uninstall/update.

Use the existing packager: node scripts/package-directadmin-plugin.mjs apps/directadmin/server-node dist/directadmin. It emits dist/directadmin/titan-server-node.tar.gz with a SHA-256. Package tests inspect the extracted archive root and modes; relay-core tests import the extracted module and inject a fake config loader and loopback Workforce gateway. Separate extracted-shell tests confirm the production RAW entrypoint returns 503 with no upstream request, even when test-like environment/header fields and legacy config files are present. These tests do not certify the actual DirectAdmin CGI serializer, TLS termination, root file ownership, firewall, hostname, or production session issuer.
