# Titan Server Node runtime

This is a **partial, fail-closed implementation**, not production commissioning or clean-host certification. It persists bounded node/control metadata only. Company operational data, authority, provider execution and accepted business evidence remain with their canonical owners.

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

DirectAdmin documents role plugin scripts and RAW mode in its [plugin structure guide](https://docs.directadmin.com/developer/plugins/structure.html) and [RAW mode guide](https://docs.directadmin.com/developer/plugins/raw_mode.html). The official [1.57.0 changelog](https://docs.directadmin.com/changelog/version-1.57.0.html) says headers_to_env=yes populates HEADERS with URL-encoded request headers. The official [1.53.0 changelog](https://docs.directadmin.com/changelog/version-1.53.0.html) says pipe_post=yes sends POST bytes to stdin and sets POST=stdin=true. Titan DA 1.711 exceeds those feature versions. The documented description does not define a detailed HEADERS escaping grammar; the relay accepts one percent-decoded CRLF or LF header block and rejects malformed or ambiguous forms. Disposable CGI-style tests cover that contract. Real DirectAdmin panel verification remains required.

### #1050 browser contract

Import the static helper from the Server Node plugin and inject it into the existing #1049 session. The helper translates only exact #1049 paths and methods; it does not parse identity, issue credentials, or create receipts.

    import { DirectAdminCockpitSession } from "titan-sdk";
    import { createDirectAdminRelayFetch } from "/CMD_PLUGINS/titan-server-node/images/directadmin-relay-client.mjs";
    const session = new DirectAdminCockpitSession(readCurrentCsrfValue, createDirectAdminRelayFetch());

The RAW endpoint is /CMD_PLUGINS/titan-server-node/directadmin-gateway.raw.

| SDK request | RAW selector | Required query flags |
| --- | --- | --- |
| GET /v1/directadmin/context | context | headers_to_env=yes |
| POST /v1/directadmin/logout | logout | headers_to_env=yes and pipe_post=yes |
| POST /v1/directadmin/company | company | headers_to_env=yes and pipe_post=yes |
| GET /v1/directadmin/titan_workforce/projection | workforce-projection | headers_to_env=yes |
| POST /v1/directadmin/titan_workforce/intents | workforce-intents | headers_to_env=yes and pipe_post=yes |

The helper also has fixed selectors for the existing Zero, Operations and Web routes. Unknown SDK paths, query strings, method changes and extra RAW query keys fail closed. #1050 still depends on its #1049 titan_workforce route allowlist addition; this relay does not edit either owner.

### Operator configuration and transport

The operator creates /etc/titan/server-node-directadmin-relay.json as a regular root-owned, non-group/world-writable file. It contains only origins, never credentials:

    {
      "schema": "titan.server-node.directadmin-relay.v1",
      "public_origin": "https://<operator-approved-control-plane-host>:2222",
      "workforce_origin": "http://127.0.0.1:3010"
    }

public_origin must exactly match #811's HostedWorkforceDependencies.directAdmin.publicOrigin. The upstream path and Host header are constructed from fixed code and that config. Use http://127.0.0.1:3010 only when Workforce is on the same host and its port is loopback-only; a separate Workforce host must use HTTPS to a private IP or .internal name with certificate validation and private DNS resolution. Public plain HTTP, redirects, caller-supplied targets/paths, and port-opening instructions are not supported. The config is absent until commissioning, so the RAW endpoint returns a sanitized 503.

The relay forwards the Titan __Host-titan-da-session cookie only, plus Origin, the #1049-required same-origin Sec-Fetch-Site, Referer when needed, X-Titan-CSRF, Accept and JSON content type. Other DirectAdmin cookies are dropped. It rejects duplicate headers/cookies/query keys/JSON keys, conflicting Titan identity headers, unsupported encoding, oversized bodies, malformed context payloads, and redirects. Content-Length is recomputed. Request bodies are capped at 64 KiB with a 5 second read deadline; upstream responses are capped at 1 MiB with a 10 second total deadline covering private DNS resolution, connection and complete response buffering. A lookup that completes after the deadline cannot start a late upstream request. The existing #1049 gateway bounds concurrent work and returns its busy response; the relay preserves that status/body as backpressure. It does not forward Authorization, user/role environment fields, or form data as identity.

The #811 mount validates the incoming Host against its HTTPS publicOrigin; this relay connects to the configured private origin but sets that fixed public Host value so the shared mount can reconstruct its canonical Fetch request. It does not open port 3010 or 3015 to the public Internet. No request/response headers, cookies, config contents, or bodies are logged.

Only the shared gateway's fixed JSON security headers are returned. A single valid Set-Cookie for __Host-titan-da-session is written as its own HTTP header line, after checking the Secure, HttpOnly, Path=/, SameSite=Strict, no-Domain attributes. This supports #1049 context switching and logout without coalescing the session cookie.

### Host isolation gate

Cookies do not isolate by port. The #1049 host-only __Host-titan-da-session; Path=/ cookie set on titanzero.io:2222 is also sent by browsers to titanzero.io:443. Same-origin on port 2222 does not protect the cookie from the 443 marketing handler. Before commissioning, use a dedicated control-plane hostname or verify the 443 handler strips this cookie before its application receives the request. No DNS, firewall, cookie, or live host configuration was changed for this PR. Do not record cookie values in diagnostics or verification evidence.

For commissioning diagnostics, verify cookie-name presence only: the browser sends the Titan cookie to the intended :2222 plugin request, and the :443 application receives no Titan cookie name after handler-level stripping (or the control plane has a separate hostname). Do not copy request headers, enable cookie/header tracing, or include values in screenshots, logs, or evidence. The automated fixture checks relay-side cookie filtering only; it cannot prove browser or 443-handler isolation.

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
2. **Verify protected configuration and private transport.** Only after the relay security review and operator approval, create `/etc/titan/server-node-directadmin-relay.json` as a regular root-owned file with no group/world write permission. Keep it limited to the three documented origin/schema fields. Set `public_origin` exactly to #811's `HostedWorkforceDependencies.directAdmin.publicOrigin`. Use loopback HTTP only for a Workforce gateway on this same host; use HTTPS with valid certificate verification and private DNS/IP checks for a separate host. Verify the target is not publicly reachable on 3010/3015 and make no firewall opening for those ports.
3. **Resolve the control hostname and cookie boundary.** Select an operator-approved dedicated control-plane hostname with a real Titan session issuer, or prove the 443 application strips `__Host-titan-da-session` before application code receives the request. A different port alone is insufficient. Use browser diagnostics that reveal cookie-name presence only: confirm the browser sends the Titan cookie to the intended `:2222` origin and that the `:443` application does not receive it. Never capture, log, export or screenshot cookie values or request headers.
4. **Prove true Titan bootstrap separately from Node availability.** Confirm the #811 Workforce gateway is running and configured with the exact public origin and private route. Confirm the real #302 source-credential/session exchange and #1049 session, CSRF and company-membership resolver are commissioned for the chosen hostname. Log in through the real Titan issuer and verify the context/company and read-only Workforce projection for that current membership. DirectAdmin UNIX UID, panel role, root privilege, supplied headers, the Node `/live` response and a relay response alone are not Titan identity, authorization, or business readiness.
5. **Exercise the actual DirectAdmin transport.** From the approved panel, verify the deployed `HEADERS` encoding with the panel's actual browser request, `headers_to_env=yes`, POST `pipe_post=yes`/`POST=stdin=true`, bounded stdin reads, HTTP response status and separate `Set-Cookie` header behavior. Confirm a missing config returns sanitized 503, rejected origins/routes do not reach Workforce, and only the Titan cookie name/value pair is forwarded. Use no real business mutation during transport verification.
6. **Record remaining release gates.** Attach the independent security review result and current-head checks; record sanitized host/version/artifact digests, exact target origin types, cookie-name-only isolation evidence, and results for the checks above. Keep the mission partial until canonical identity/authority, approved providers, observed outcomes, accepted evidence, recovery, estate projections and the full #812 verification are separately complete.

### Package and rollback

The archive includes the root plugin.conf, role user/index.html, executable user/directadmin-gateway.raw, static browser helper, and official scripts/install.sh, scripts/update.sh, and scripts/uninstall.sh lifecycle entrypoints. Those lifecycle wrappers forward explicit validation-only requests to the existing Server Node lifecycle scripts. The bounded relay module is staged and checksummed with the supervised runtime; update failure restores the previous module and service artifact. Its overall upstream deadline cancels Node's native DNS `Resolver` queries so the standalone RAW process can exit promptly; private-answer validation and address pinning remain in place. Persistent control metadata and operator configuration remain outside package-managed files and are preserved by uninstall/update.

Use the existing packager: node scripts/package-directadmin-plugin.mjs apps/directadmin/server-node dist/directadmin. It emits dist/directadmin/titan-server-node.tar.gz with a SHA-256. Package tests inspect the extracted archive root and modes; relay tests execute the extracted RAW entrypoint against a fake loopback Workforce gateway. These tests do not certify the actual DirectAdmin CGI environment, TLS termination, root file ownership, firewall, hostname, or production session issuer.
