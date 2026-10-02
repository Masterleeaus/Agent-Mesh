# Issue #1153 completion evidence

## Current result

Verified against current main `15d8b1be1584ce07259762527f9abfe040c9d504` (tree `efdc118bf38a5c573e9be7fe18bc06046b03327e`). The platform regression repair is already present in main as commit [`8e4c7f2a9bd40ea73aa62ebdab76371208719c87`](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/commit/8e4c7f2a9bd40ea73aa62ebdab76371208719c87), cherry-picked from the reviewed repair `09ef7a003f233f31247b460b47c6f4af75e0cb1e`.

The unchanged platform baseline is 97 named failures. The matched package-cwd comparison recorded in [README.md](README.md) reduced the first reviewed tree from 111 to 93 named failures without changing the baseline, removing tests/exports, or excluding compiler inputs. On current main plus a separate storage-only delta, the platform gate reports 72 failures against the same 97-entry baseline and succeeds. The raw platform suite still has allowed baseline failures; this evidence does not claim zero raw test failures.

## Acceptance map

1. **Identify the common package cause rather than increasing the baseline.** The failures above baseline came from invalid Node export targets, stale generated-output paths, one omitted existing test source, and stale or inconsistent consumer fixtures. Repairs are confined to package manifest/test harness and contract assertions; production public exports and compiler coverage are preserved.
2. **Make the platform test gate return to baseline or better.** The unchanged 97-name baseline checker passes on the current-main tree.
3. **Re-run the complete Titan Zero CI matrix and retain all currently green supporting gates.** The exact latest current-main base is `15d8b1be1584ce07259762527f9abfe040c9d504`. PR #1254 is based on that commit and changes only `packages/storage/src/company-placement-persistence.test.ts` and `packages/storage/src/company-placement-registry.ts`; its Titan Zero CI, source-evidence, and production-convergence workflows all passed.
4. **Then unblock PR #1151 and close this issue with evidence.** PR #1151 was closed unmerged as superseded by the current scoped implementations; it was not represented as merged. The current main matrix is green with the platform repair integrated, so #1151 no longer blocks convergence. See its disposition comment: https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1151#issuecomment-5948251779.

## Exact hosted verification

On PR #1254 head `e8402a089d941d9f08e739e2bd0aa5818a3929f9`, based on current main `15d8b1be1584ce07259762527f9abfe040c9d504`:

- [Titan Zero CI run 37031721833](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/37031721833) completed successfully. Its log reports worker `current=0, baseline=24`, web `current=85, baseline=86`, and platform `current=72, baseline=97`; the platform log says no regression beyond the recorded baseline.
- [Titan Zero Source Evidence Index run 37031721894](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/37031721894) passed.
- [Production Convergence Verification run 37031722000](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/37031722000) passed.

The #1254 delta is confined to the two storage files named above; it does not edit platform manifests, compiler inputs, tests, or CI. This provides a current-main validation of the package gate without changing the issue-owned platform artifacts.

## Scope and limits

No product runtime, database schema, migration, or persisted data changed for this issue. No DirectAdmin host or provider was activated; live-host certification is outside this CI regression issue's acceptance. The evidence-only PR records the completed acceptance against already-merged code. Human review remains required before merging the closure PR.
