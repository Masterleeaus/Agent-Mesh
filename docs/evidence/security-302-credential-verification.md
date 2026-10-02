# #302 trusted credential continuation evidence

Date: 2026-10-02. Existing claim `agent/issue-302`, draft PR #1183, **Refs #302**.
No merge, mission closure, production migration, persistent key creation, secret
rotation, server setting change or deployment. The original `1351a6c` registry
and selected-company protections are preserved.

## Outcome and changed ownership

The canonical security owner now verifies configured cryptographic credentials
before registry access, issues bounded durable sessions from authenticated
one-time assertions, and requires verified current credentials for switching and
revocation. DirectAdmin host namespaces, signed channel metadata, public-key
consumer composition and an explicit web migration adapter are supplied.

Newly authored paths for this continuation:

- `packages/titan-platform/src/security-session-credentials.ts`
- `packages/titan-platform/src/security-boundary.ts` (exports only)
- `packages/titan-platform/tests/security-session-credentials.test.mjs`
- `packages/titan-platform/package.json` and `pnpm-lock.yaml` (reuse existing pinned jose 6.1.3; no new transitive dependency)
- `apps/web/lib/auth/current-session.ts`
- `apps/web/lib/auth/__tests__/current-session.test.ts`
- `docs/contracts/authenticated-session-credentials.md`
- `docs/contracts/current-identity-session-registry.md` (links authenticated entry)
- this evidence record

No new identity store/schema is introduced. Existing raw registry commissioning
methods are not exposed as HTTP APIs. Missing/revoked memberships remain denied.
Web projection requires an explicit approved company-to-legacy-account mapping;
canonical company and account IDs are not assumed equal. Mapping exceptions are
sanitized, and exact session state is rechecked after asynchronous mapping.

Boundary changes are canonical package authentication → durable GLOBAL_REGISTRY
lookup → opt-in web projection. No business authority is conferred. Current
operation scope is `[context.company_id]`, never all switch choices.

Dependency provenance: merge `bd3075ef` consumes existing reviewed prerequisite
#1179 at `1b665ef846069c85e450943db1fb45156f88db16`, including Maps/Signal, worker
#1149 and inherited Workforce repairs. Those compiler/index/worker/host changes
are inherited, not newly authored #302 work. `main` was `ee1a3ee3` during the sync.
No alternative implementation claim was created.

## Executed verification

Environment: Node 24.19.0; pinned pnpm 9.12.0 installed under `/tmp/titan-pnpm`.
The environment's default pnpm was 11.19.0 and initially failed on an unwritable
home store; using the repository-pinned version and a writable temporary store
succeeded without changing repository policy or lockfile versions.

| Command | Result |
| --- | --- |
| `CI=true pnpm install --frozen-lockfile --offline --store-dir /tmp/titan-pnpm-store` | Pass |
| `pnpm -r --if-present typecheck` | Pass, including strict web/non-web |
| `pnpm --filter @titan-zero/titan-platform build` | Pass |
| Platform compilation using the existing NodeNext test command, then `node --test packages/titan-platform/tests/security-session-credentials.test.mjs packages/titan-platform/tests/security-session-registry.test.mjs packages/titan-platform/tests/security-boundary.test.mjs` | 121/121 pass (60 new credential tests + 61 preserved security tests) |
| `pnpm --filter @titan-zero/web exec vitest run lib/auth/__tests__/current-session.test.ts lib/auth/__tests__/session-context.test.ts lib/auth/__tests__/user-creation-session.test.ts` | 90/90 pass (27 adapter + 63 preserved tests) |
| `pnpm --filter @titan-zero/web exec tsc --noEmit --pretty false` | Pass on final adapter |
| `pnpm --filter @titan-zero/web exec eslint lib/auth/current-session.ts lib/auth/__tests__/current-session.test.ts` | Pass |
| `cd services/workforce && node --import tsx --test src/*.test.ts` | 21/21 pass |
| `pnpm --filter @titan-zero/titan-platform test` | 725 pass / 111 fail / 2 skip |
| Same platform build/test on detached prerequisite `1b665ef` | 606 pass / 111 fail / 2 skip; exact same 111 normalized failure names |
| `pnpm gate:fast` and `pnpm gate` | Both pass lint, then stop at existing duplicate migration prefixes; subsequent gate phases not reached |

The normalized sorted 111-failure name set on both builds has SHA-256
`50bd7d8d1a6efb7c75384ed0381c289da87af15c257baf05ae7f3a3471837244`.
An initial baseline run without its `dist` build had two additional missing-artifact
failures; rebuilding the prerequisite with the same build prerequisites removed
those and yielded exact equality. No baseline, compiler input or test was weakened.

Migration check output also matches the prerequisite exactly: duplicate prefixes
151, 152, 177, 178, 179, 180, 181, 182 and 183. Potentially applied migrations were
not renumbered. These aggregate blockers remain with existing convergence owners.

## Independent review

A separate read-only reviewer exercised disposable real-SQLite probes, including
13 invalid signature/issuer/audience/header/time/DA-channel cases rejected before
registry calls, concurrent exchange, replay after restart/switch/revoke, and
Ed25519/public-key-only consumer composition. Review found signing-pair failure
was detected after mutation. The implementation now preflights signing configuration
before assertion consumption or generation change, with regression coverage and
independent re-verification. Missing signing keys likewise cannot change state.

Final reviews cover detached Buffer key snapshots, mandatory legacy mappings,
required runtime expectations and signed-only selection discovery. No remaining
scoped authentication blocker was reported. This is independent code review,
not human PR approval or real-host security certification.

Tests use generated ephemeral cryptographic keys and actual disposable SQLite
files. They test crypto tampering, key/algorithm/issuer/audience denial, expiry,
legacy-token migration denial, issuer isolation, one-time exchange, revocation,
device/current membership/generation changes, atomic company switching, restart,
mapper exception redaction and asynchronous switch/revoke races. Existing tests
also exercise committed/uncommitted process death.

## Hosted status and limits

At intermediate published head `bd3075ef91222e32a23a1f09111a84b3c01af515`:
Canonical Workforce, Production Convergence, Browser Node, Personal Zero and Source
Index checks passed. Titan CI run 36952738166 passed install, strict types,
Forge/Maps/Signal, clean-package tests and worker regression tests; it failed the
web regression gate (108 reported failure entries versus baseline 86). All 72 auth
tests present at that intermediate head passed on Node 22 CI. Platform/build stages
were skipped by that failed workflow, not passed. Later final-head status belongs
in the PR checkpoint, not inferred from this earlier run.

Read actual consumer contracts at #1049 PR1204 `51b22e9` and #811 PR1201 `99cd1bf`.
The new service supports their required verified claims and selected context using
disposable keys/stores. Actual replacement of #1049's provisional verifier and
#811/#812 host wiring remains with those active owners. They must use the canonical
service, preserve DA CSRF/origin controls, and never relabel an audience. The
contract documents exact projection and public-key-only composition.

Real DirectAdmin authentication, an upstream assertion issuer, key-reference and
GLOBAL_REGISTRY commissioning, production web cutover, reviewed historical
identity/account mappings, durable backup anti-rollback/power-loss policy, and
live cross-surface tests remain unconfigured/unverified. Existing web login and
middleware intentionally retain the earlier fail-closed legacy path until an
explicit coordinated cutover. No historical membership is blanket backfilled.

Parent rollout choices remain concrete: commission only explicitly mapped test/
new identities first, or separately approve a reviewed historical mapping/recovery
cohort before switching login and consumers together. Missing/deleted memberships
must never be inferred as recoverable. This implementation executes neither choice.

Rollback withdraws the new opt-in composition while preserving additive registry
rows and revocation history. Do not automatically fall back from rejected durable
credentials to legacy authentication, delete session replay tombstones, or restore
an old identity backup without invalidating affected credentials.
