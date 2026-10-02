# Certification evidence: first #1172 slice

Refs #1172; continues **merged PR #717**, preserving #500/#490 traceability.
This is the existing `certification-matrix.ts` owner and `titan.release-eligibility/v1`
lineage, not another release engine, capability registry, authority, or claim ledger.

## Trust boundary and incomplete production integration

The evaluator is an evidence validator. It cannot discover the complete production
scope, authenticate a test receipt, prove a command was executed, inspect an artifact,
or approve publication. Nonempty provenance strings are references, not signatures.
A trusted CI/release producer must independently load:

- #7 canonical registry membership and its immutable revision
- #718 `CompatibilityManifest`, affected/declared `ProjectionCell` scope and its revision
- the exact candidate commit and SHA-256 artifact digest
- test receipts bound to those inputs, including #1068 conformance outcomes

**That authoritative production producer is not implemented in this slice.**
Callers must never derive scope or the registry from submitted results, filter them
until tests pass, or treat synthetic fixture contexts as production scope. Revision
labels must identify authentic source snapshots; the evaluator checks equality and
shape, not repository/object existence. Full inherited scope dimensions (especially
Workforce class/tier, canonical surfaces and degradation-state applicability) still
need canonical producer mapping and real cross-host execution. Declared projection
coverage alone is not proof the complete production matrix was selected.

The dedicated workflow executes contract regressions and fixture-based CLI integration;
it does **not** certify a release. The actual 28-area source audit remains
`DENIED_MISSING_EVIDENCE`. Missing #718/#1068 receipts cannot be replaced with PASS
merely because manifests, source files, closed issues, or green contract tests exist.
No live release bypass was demonstrated: baseline symbol search found declaration
and barrel exports only, with no current evaluator consumers.

## Versioned independent coverage

`CertificationInputs` (`titan.certification-inputs/v1`, policy
`cross-host-required/v1`) consumes a read-only projection of existing owners.
Expected cells are independently derived on every evaluation from each unique #718
five-dimensional projection tuple. Required certification dimensions are inherited
from #717: discovery/schema, isolation/authority, governed operations, Workforce,
UI fallback, vertical projection, continuity/recovery, compatibility/propagation,
and distribution conformance. These are test dimensions, not copied product/host
catalogues. Receipts for one dimension cover the declared registry membership in
that projection. Real suites must prove that breadth; this function cannot inspect
whether a referenced test actually did so.

The canonical coverage key serializes policy, candidate/artifact, registry/scope
revisions, sorted registry identities, compatibility metadata, and sorted projection
tuples. It is deliberately **not a cryptographic signature or digest**. One
`titan.certification-results/v1` envelope carries that key once; all cells use the
bounded `coverage_ref: "declared-inputs"`. This avoids copying an entire large
matrix into every result. The 6,300-projection/56,700-cell regression enforces a
64 MiB serialized eligibility bound. Sorting uses codepoint ordering, not locale.

The registry and projection inputs must be nonempty, with unique, nonblank identities.
Schema/policy mismatch, missing revisions, invalid SHA-256 digest shape,
compatibility/registry mismatch, candidate mismatch, and contract mismatch deny.
Changing any bound input invalidates old evidence, even if the result IDs still match.

## Result and applicability semantics

- Every required expected cell needs exactly one `PASS`, correct mandatory flag,
  nonblank provenance and command reference, and the current shared coverage binding
- `FAIL`, `SKIPPED`, `NOT_RUN`, omissions and malformed/unknown statuses deny
- Duplicate results deny even when identical; undeclared result identities deny
- A result cannot make a required cell optional
- Extra advisory cells must have `advisory:` IDs, `mandatory: false`, valid shared
  binding, command and provenance; their failure does not widen or reduce required coverage
- v1 has **no** legitimate empty-scope or `NOT_APPLICABLE` exemption. All NA results
  deny, including advisory NA. Future exemptions require a versioned canonical
  applicability policy plus provenance. Do not infer them from empty lists or flags
- Unknown/unreadable input yields explicit denial evidence and CLI exit 1

Commands in evidence are recorded only; the CLI never runs arbitrary receipt commands.
Structural validity does not mean the referenced provenance or command is trustworthy.

## Compatibility and migration

The original function name, existing result fields, v1 schema string and one-argument
array call remain available. Security semantics intentionally tighten: legacy calls
can no longer return eligible because they lack independently known coverage and a
versioned results envelope. Existing callers must handle denial and migrate to:

1. Independently resolve `CertificationInputs` from canonical owners
2. Derive coverage and run actual required suites for those exact inputs
3. Supply `{ schema: 'titan.certification-results/v1', coverage_key, cells }` and the
   independently loaded inputs to `evaluateReleaseEligibility`
4. Inspect explicit `denial_reasons`; never fabricate results to satisfy the policy

New fields (`expected_cells`, `missing_result_cells`, `denial_reasons`,
`coverage_key`, `evidence_policy`, `authorityGranted`, `publication_state`) are additive.
Persisted old v1 objects are not grandfathered into eligibility: re-evaluate using
the current policy. Types add NOT_RUN/NOT_APPLICABLE for honest diagnostic reporting;
consumers with exhaustive status switches must migrate. No index exports or tsconfig
coverage were changed. New types/functions can be imported directly from the owner
until a coordinated public export decision is made.

## Executable consumer and #322 handoff

Node 24 or later is required for the bounded CLI's native TypeScript import:

```
node scripts/certify-release.mjs --inputs trusted-scope.json --results receipts.json --output evidence.json
```

Exit 0 means only eligible evidence for the supplied scope; any denied/malformed
input exits 1 and emits diagnostic evidence where the output is writable.
`titan.certification-evidence/v1` contains deterministic eligibility, input revisions
and a `titan.certification-handoff/v1` payload with exact candidate/artifact identities.
The handoff always records `authorityGranted: false`, `publication_state:
NOT_EVALUATED`, and `consumer_integration: NOT_IMPLEMENTED`.

#322's existing `packages/deployment/release-lifecycle.mjs` owns real activation.
This slice **does not wire or alter it**. A later coordinated consumer must compare
exact candidate/artifact hashes, authenticate provenance, revalidate compatibility
and current approvals, and reject denied/stale/missing evidence before lifecycle
advancement. Eligibility alone grants no authority or permission to publish.
Tests validate the handoff serialization, not deployment enforcement.

## Evidence-only 28-area audit

`tests/e2e/certification/release-readiness.audit.json` is an explicitly incomplete,
commit-bound source assessment under 28 user-requested headings. These headings
are presentation, not a runtime registry or expected release scope. The renderer
reads files at that exact Git revision, records SHA-256 source hashes and stable
links, and emits sibling `release-readiness-matrix.generated.json`.

The historical `critical-path-matrix.generated.json` remains unchanged and is
referenced, not copied or promoted. Source inspection, subsystem tests not run,
runtime unknown and deployment not run are separate fields. There are no invented
percentages. Separate Sites v39 metadata and the #1171 PWA source-scan report are
external evidence, not source bytes verified by this repository audit.

```
node scripts/generate-readiness-snapshot.mjs
node scripts/generate-readiness-snapshot.mjs --check
```

A deterministic stale check validates rendering against the recorded source commit;
it does not claim the audit covers later commits. The renderer rejects promotion
of this source-only audit into PASS/CERTIFIED/ELIGIBLE states. Real certification
belongs in the canonical evaluator, with actual trusted receipts.

## Acceptance map and remaining work

| #1172 outcome | First slice | Still open |
|---|---|---|
| Existing owner/schema and owner search | Existing evaluator hardened; #717/#718/#322 inspected | Full production consumer graph |
| Independent expected coverage | Derived from declared canonical input projection, not results | Authoritative complete-scope producer/applicability mapping |
| Negative evidence handling | Empty/skipped/omitted/duplicate/malformed/stale denial tests | Authenticated provenance and real external conformance |
| Optional/NA policy | Advisory semantics; NA and empty scope denied | Canonical versioned NA exemptions if required |
| Deterministic evidence | Revisions, expected/results, denials, commands and artifact identity | Actual candidate/test receipt collection |
| CI consumer | Dedicated least-privilege fixture regression workflow and exit-code consumer | Real upstream suite outputs and release-required CI wiring |
| #322 handoff | Serialized, tested, explicitly NOT_IMPLEMENTED consumer | Deployment owner integration; no live enforcement claim |
| Compatibility | Preserved lineage, documented fail-closed migration | External consumer migration if discovered |
| Inherited acceptance matrix | 28 source-audit headings plus nine check dimensions | Full cross-host/Workforce/surface/continuity proof |

This PR must use **Refs #1172**, not Closes. Green contract tests do not complete the
mission. Rollback is code-only; no migrations, business mutations or deployment
occur. Restoring the previous evaluator would restore known fail-open behavior and
is not a safe way to make legacy callers green.

## Executed verification for this slice

See [`certification-1172-verification.json`](../evidence/certification-1172-verification.json)
for exact commands, tested source hashes, environment, failure names and exclusions.

- 24 evaluator regressions, 8 CLI/snapshot tests, 11 adjacent contract tests pass
- Pinned pnpm 9.12 package typecheck and build pass
- Package suite after matching build: baseline 546 pass / 111 fail / 2 skip;
  slice 570 pass / the same 111 fail / 2 skip. The 24 new tests pass
- Clean-test versus build-then-test explains a 113 versus 111 failure discrepancy:
  two pre-existing tests read `dist/`, not `.test-dist/`. Neither was suppressed
- Both aggregate gates stop at five existing worker lint errors
- Frozen install fails on the existing web lockfile mismatch. Diagnostic install
  did not alter the lockfile. The native addon was rebuilt and storage's four tests pass
- The subsequent workspace suite stops at Workforce's `tsx` IPC `listen EPERM`
  in this sandbox. The supported `node --import tsx --test src/*.test.ts` fallback
  executes the same Workforce tests: 19 pass. This is additional targeted evidence,
  not a pass for the official workspace command. Full integration/E2E/live-host/device
  verification remains unrun

These failures are unresolved readiness blockers, not a green suite or a claim the
full mission is finished. Unrelated repair belongs to #648/#1084 and runtime owners;
this slice does not hide failures through exports, exclusions, baselines or skips.
