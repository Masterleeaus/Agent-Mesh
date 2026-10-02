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
  `audience: workforce`, and `surface: zero`; the bounded native manager host
  rejects Go/Hub until their authority-aware dispatch contracts are implemented;
- `workOrders.complete/read`: resolve current registered physical company storage
  and call the existing native business owner / independent observed-state read;
- `readiness`: actual authentication, authority, provider and evidence observations;
- optional `adapterTimeoutMs` (1–120000ms, default30000) bounds external calls;
- optional `close({signal})`: dispose provider resources after accepted requests drain.
Credential verification and readiness receive `{signal}`; native provider input
also carries `signal` and an ephemeral `authorityFence.assertCurrent()` guard.
Adapters must invoke that guard immediately before the actual mutation, as the
canonical native completion owner does. An adapter that ignores abort can still cause a late effect;
Titan records uncertainty and never treats its deadline as proof of non-execution.

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

At the effect boundary a SQLite `BEGIN IMMEDIATE` transaction rereads canonical
control authority and cancellation, then holds that authority fence through the
bounded provider call. A separate connection cannot commit revocation between
that read and effect. Identity is revalidated before this transaction; business
data stays in its physical company database. The optional trusted
`completeInControlTransaction` port is only for the existing legacy same-store
web composition; hosted providers receive no control transaction. This is not an
atomic transaction across identity, control and company databases. The ephemeral
guard also checks abort and authority expiry immediately before native mutation.

Work/run identity preserves company, actor, conversation, interaction, request,
operation, trace, correlation and idempotency values. Conflicting start replay
is rejected; continuation receipts live in the canonical run payload and are
claimed atomically. Cancellation is cooperative: it prevents later execution
steps and stale completion writes, but cannot undo an already invoked provider.
Provider effects still require observed verification and factual evidence.

## Lifecycle and evidence

Readiness requires actual runtime tables, current identity storage and all
required dependency observations. Probe requests coalesce; the canonical bounded
adapter call aborts and releases an expired probe so a later probe can retry.
Liveness remains independent. Shutdown stops ingress and grants accepted work a
bounded drain interval (default5000ms). At the deadline it aborts adapter signals
and closes connections, waits for the bounded handlers to persist recovery state,
then closes dependencies and stores. Dependency cleanup itself is bounded.

Canonical ExecutionGateway now distinguishes UNCERTAIN from FAILED/VERIFIED.
Timeout, abort, exception after dispatch, missing verifier and an unverified
acknowledgement never prove non-execution. The canonical governed-execution
lifecycle has atomic SQLite records/events, stable company/operation binding,
and compare-and-swap claims. An interrupted RUNNING or UNCERTAIN operation can
only reconcile by observed verification; it cannot invoke the provider again.
An explicitly proven non-executed failure is a different recovery case.

`action` must be a primitive string. `continue`, `resume`, and `cancel` require
a continuation token; `start` forbids one. Authenticated `resume` is the explicit
verification-only recovery route, distinct from normal user continuation. It
preserves the work/run/session binding and revalidates current session and
authority. No startup scan automatically takes ownership of another live run.
A locally active driver rejects recovery. Shared-store multi-process ownership
still requires commissioning discipline: recovery does not establish that another
host is dead, and compare-and-swap conflicts never authorize another effect.

Real process tests interrupt the native provider before mutation and after a
committed mutation but before acknowledgement. Both remain uncertain across
SIGKILL/restart until explicit verification; the first never retries and the
second verifies without a second mutation. These are process-interruption tests,
not VPS power-loss or backup anti-rollback certification.

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

Preserved #1179 prerequisite `743e70789b85571fa0eafb1029630f0cbc6b7eb6`,
including #811 readiness, malformed URL protection, restored exports and compiler
coverage; integrated #302 resolver `68e4804f594503f3a205d2caefdb2f9f75701ee4`.
No edits to the DirectAdmin identity bridge or Server Node runtime owners.

Rollback stops ingress and restores the prior service artifact. Retain durable
runtime, identity/revocation and evidence files; never erase or replay them to
make an older host appear ready. The unconfigured health-only artifact cannot
be described as a production replacement. Keep #811 and draft #1201 open until
full acceptance or explicitly approved administrative handoff.
