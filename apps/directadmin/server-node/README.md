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

Installation is an explicit privileged host/package-administrator action, not an API authority grant. Root is required to create `titan-node`, create protected code/config/state directories, install the systemd unit and enable/restart the service. A non-root invocation only validates and reports that it did not install/update. No live root installation was performed for this change.

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
