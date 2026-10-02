# Issue #1153 completion evidence

## Current result

Verified against current main `14163faa316ac6236e88167b7c8d8a5e95007c7e` (tree `feb539995421ca9949f9230a223942b698d19343`). The platform regression repair is already present in main as commit [`8e4c7f2a9bd40ea73aa62ebdab76371208719c87`](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/commit/8e4c7f2a9bd40ea73aa62ebdab76371208719c87), cherry-picked from the reviewed repair `09ef7a003f233f31247b460b47c6f4af75e0cb1e`.

The unchanged platform baseline is 97 named failures. The matched package-cwd comparison recorded in [README.md](README.md) reduced the first reviewed tree from 111 to 93 named failures without changing the baseline, removing tests/exports, or excluding compiler inputs. The newer exact-main CI run reports 72 failures against the same 97-entry baseline and succeeds the regression check. The raw platform suite still has allowed baseline failures; this evidence does not claim zero raw test failures.

## Acceptance map

1. **Identify the common package cause rather than increasing the baseline.** The failures above baseline came from invalid Node export targets, stale generated-output paths, one omitted existing test source, and stale or inconsistent consumer fixtures. Repairs are confined to package manifest/test harness and contract assertions; production public exports and compiler coverage are preserved.
2. **Make the platform test gate return to baseline or better.** The unchanged 97-name baseline checker passes on the current-main tree with 72 current failures.
3. **Re-run the complete Titan Zero CI matrix and retain all currently green supporting gates.** Exact PR head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488` has the same tree as current main (the only commit difference is the merge commit). Its Titan Zero CI and the triggered supporting workflows below all completed successfully.
4. **Then unblock PR #1151 and close this issue with evidence.** PR #1151 was closed unmerged as superseded by the current scoped implementations; it was not represented as merged. The current main matrix is green with the platform repair integrated, so #1151 no longer blocks convergence. See its disposition comment: https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1151#issuecomment-5948251779.

## Exact hosted verification

- [Titan Zero CI run 36975004969](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975004969), exact head `25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488`: passed. Its log reports `titan-platform test baseline: current=72, baseline=97, failures=72/97` and `No titan-platform test regression beyond the recorded Merge84 baseline.`
- Supporting workflows on that same head: [Canonical Workforce Verification 36975004973](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975004973), [Titan Zero Source Evidence Index 36975004968](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975004968), [Production Convergence Verification 36975005015](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975005015), [Personal Zero Verification 36975004986](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975004986), [PWA Package 36975004979](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975004979), and [VPS SQLite production smoke 36975005004](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36975005004): all passed.
- [Tree comparison](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/compare/14163faa316ac6236e88167b7c8d8a5e95007c7e...25005f4f4d860e2ec1dddb9f0a2c4aa152fd0488) reports zero changed files and zero ahead commits; the tested PR head and current main have the same file tree.

## Scope and limits

No product runtime, database schema, migration, or persisted data changed for this issue. No DirectAdmin host or provider was activated; live-host certification is outside this CI regression issue's acceptance. The evidence-only PR records the completed acceptance against already-merged code. Human review remains required before merging the closure PR.
