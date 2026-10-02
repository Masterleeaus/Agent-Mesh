# Hosted Workforce composition (#811)

The launched `services/workforce/src/server.ts` composes the existing native
`createFieldServiceRuntime`, which calls `createProductionRuntimeBootstrap`.
There is one canonical dispatcher, run store, Workforce store, authority gateway
and native work-order completion owner. `apps/web` remains the full native FSM;
Frappe is not required by this slice.

## Commissioning contract

Set `WORKFORCE_DEPENDENCIES_MODULE` to an absolute operator-owned module path.
The module exports async `createWorkforceDependencies()` returning the
`HostedWorkforceDependencies` contract in `hosted-runtime.ts`:

- `identityStoragePath`: the separately provisioned GLOBAL_REGISTRY SQLite file;
- `credentialVerifier.verify(authorization)`: authenticate the credential
  cryptographically and return its bound issuer/subject/session/device/revision,
  `audience: workforce`, and authorized Zero/Go/Hub surface;
- `workOrders.complete/read`: resolve current registered physical company storage
  and call the existing native business owner / independent observed-state read;
- `readiness`: actual authentication, authority, provider and evidence observations;
- optional `close`: dispose provider resources after accepted requests drain.

The factory is trusted commissioning code, never an HTTP-selectable module or a
credential issuer. No default verifier, sample credential, business fixture,
authority grant or successful provider fallback ships. Missing configuration
prevents launcher startup. Library callers without dependencies can inspect
liveness/storage, but readiness stays 503 and conversation ingress stays disabled.
The old VPS smoke assumes an unconfigured host is ready; this is no longer a valid
production acceptance claim and must be commissioned by the deployment owner.

`WORKFORCE_SQLITE_PATH` selects runtime/control/evidence storage. It is not a
company business database. Do not configure it to the identity file. Native
business providers must resolve distinct physical company databases; request
fields never select a filesystem path. Startup creates only the existing
owner-specific runtime/control schemas; it does not migrate native business tables
or issue actors, sessions, permissions, grants, field proofs or approvals.

## Authentication and authority

`POST /v1/workforce/conversations` reuses #1182 / PR #1188 transport source at
`3ec9100ac0f8b44fafd4a4a80bc09e96279e08af`. The verified credential is resolved
through #302's current registry on every request, including replay, resume and
cancel. Payload identity assertions must match; headers/session IDs alone never
authenticate. Only whitelisted credential-free identity bindings enter durable
work/run metadata. The response excludes external principal proof metadata.

The native authority path rereads the durable run identity and current registry
before authorization, execution reauthorization, and provider mutation. Revoked
membership/session, switched company/context, expired session or mismatched
actor fail closed. Identity never grants execution authority: the existing
worker access, policy, risk, assurance, evidence and approval owners still decide.

Work/run identity preserves company, actor, conversation, interaction, request,
operation, trace, correlation and idempotency values. Conflicting start replay
is rejected; continuation receipts live in the canonical run payload and are
claimed atomically. Cancellation is cooperative: it prevents later execution
steps and stale completion writes, but cannot undo an already invoked provider.
Provider effects still require observed verification and factual evidence.

## Lifecycle and evidence

Readiness requires actual runtime tables, current identity storage and all
required dependency observations. Probe requests coalesce and time out; liveness
remains independent. Shutdown stops ingress, drains delegated requests (including
requests whose clients disconnected), then closes dependencies and stores.
A provider or verifier promise that never settles currently prevents graceful drain;
request-body timeouts do not cancel consequential provider execution. A stuck
readiness dependency keeps its shared probe unavailable until it settles or the
process restarts. Bounded cancellable provider contracts remain a commissioning
requirement. A supervisor must allow an adequate drain window; a forced kill can leave a run
in an explicit recovery-required state. This implementation never blindly replays
uncertain in-flight effects on restart.

Native execution persists gateway receipts with canonical AcceptedEvidenceLedger
normalization in the existing evidence table. Projection rebuilds from accepted
history and independently reads the business outcome. Provider acknowledgement
alone is not verified completion. Existing accepted rows are append-only through
this path; the change introduces no alternate evidence ledger class or business
state store.

The inherited SSE response is a bounded completed-event projection with
Last-Event-ID filtering, **not live incremental streaming**. #1182 remains owner
of real incremental streaming and broader surface lifecycle. Host/VPS reboot,
backup anti-rollback, live credentials/providers, DirectAdmin installation and
second-surface acceptance remain commissioning evidence, not unit-test claims.

## Dependency provenance and rollback

Preserved #1179 prerequisite `ad43d010d50ba262c02beaf0ed892b656174ff58`,
including #811 readiness, malformed URL protection, restored exports and compiler
coverage; integrated #302 resolver `68e4804f594503f3a205d2caefdb2f9f75701ee4`.
No edits to the DirectAdmin identity bridge or Server Node runtime owners.

Rollback stops ingress and restores the prior service artifact. Retain durable
runtime, identity/revocation and evidence files; never erase or replay them to
make an older host appear ready. The unconfigured health-only artifact cannot
be described as a production replacement. Keep #811 and draft #1201 open until
full acceptance or explicitly approved administrative handoff.
