# Issue 1153: platform package regression prerequisite

This is a bounded CI/package slice, not full mission or runtime certification. The unchanged platform regression checker passes at **93 named failures / 97 allowed**. The complete test suite remains red: **694 pass, 93 fail, 2 existing skips**. Exact before/after names and per-failure disposition are in `platform-failure-inventory.json`.

## Source and coordination

- Canonical claim `agent/issue-1153` atomically created from main `ee1a3ee3709b9201fc728fc162067d9a5ab78e45`; issue open, no competing exact claim or PR at claim time.
- Consumed the explicitly requested reviewed #1179 prerequisite `743e70789b85571fa0eafb1029630f0cbc6b7eb6` through merge `d5a683f3`. Its finance/Workforce fixes and restored public exports are inherited, not newly authored here.
- Main's new Signal export and compiler entry were preserved by the merge. The sole conflict was Maps timestamp coverage; kept the prerequisite's canonical ISO/offset assertions. No independent changes to `src/index.ts` or `tsconfig.json` after dependency integration.
- No changes to DirectAdmin SDK #1049, security/session #302, hosted runtime #811, cockpit #1050, web #1152 or worker #1149 owner implementation.
- Read root/packages AGENTS, ai/INVARIANTS, Blueprint v3, Canonical Rules and Phase Map. `/workspace/.agents` is empty; repository `.agents` does not exist in this environment.

## Classification and repair

The 18 names above the existing baseline were examined before changing assertions:

- Incorrect `.test-dist/src` imports prevented real Business Ops, Prime, knowledge, Connect, credentials, cost and storage contracts from executing. They now target the actual compiler layout, with original assertions retained.
- The capability-registry parity test referenced a module outside the canonical compiler graph. `tsconfig.test.json` inherits every production compiler input and adds that one existing module. `tsc --listFilesOnly` proves 169 canonical platform source inputs are retained and test coverage grows to 170. Production build configuration is unchanged.
- Two Builder tests read stale/missing `dist` outputs. They now use the same fresh `.test-dist` generation as the rest of the suite; no prebuilt artifacts are required.
- Surface SDK `command` is compatibility ingress, normalized to canonical `zero` (see `docs/contracts/surface-context-revalidation.md`). The assertions now check that normalization, retaining expiry, company, receipt and authority denials.
- Hub privacy is fail-closed: visibility requires explicit boolean `customer_safe=true`, even for domains. The positive fixture now declares safety; additional tests reject missing, false and string markers. No runtime privacy rule was relaxed.
- Marketplace compatibility approval changed its diagnostic wording. The test checks the current error, rejects missing/false/string/numeric markers before any provider call, and confirms an approved marker is explicitly not canonical execution authority. The fake provider is a unit fixture only.
- Builder signal priority's exact-text company comparison regex predates normalized IDs. Executable tests cover normalized same-company scope, foreign company/surface rejection, malformed time, severity/freshness/bounded impact, stable ties, card limits, non-authority, unchanged actions and planner integration.
- Once loaded, the storage fixture revealed adapter/repository confusion. It now composes `createCompanyRepository` around `createMemoryStorageAdapter`, matching existing reconciler consumers. Negative foreign payload/read checks remain. This does not certify physical production company database placement.

Separately, actual Node package resolution rejected four public subpaths because their targets lacked `./`. Four targets are corrected without deleting or changing export names. The new 41-test export suite was **37 pass / 4 fail before**, **41 pass after**, and rejects undeclared private access.

The remaining 93 named failures are exactly retained allowed baseline entries. They include older generated-output assumptions (cleaning, licensed-trades, context/lifecycle/capacity/delegation/native Workforce, retriever), Builder source/UI assertions and public/profile contract gaps. Their names/imports are retained in the inventory. They are not reclassified as passing and no donor implementation is promoted to canonical authority. Shared compiler/public-barrel changes require #1084 coordination; domain semantics require their existing owners.

## Reproduction and results

Toolchain: Node **22.23.3**, pinned pnpm **9.12.0**. Both before and after use the repository-root command below, which runs tests in package cwd, after equivalent canonical platform builds:

```sh
pnpm --filter @titan-zero/titan-platform build
pnpm --filter @titan-zero/titan-platform test > platform.log 2>&1
status=$?
python3 .github/scripts/check-titan-platform-test-baseline.py \
  --baseline .github/ci/titan-platform-test-baseline.json \
  --log platform.log --command-status "$status"
```

- Integrated prerequisite before fixes: 606 pass / **111 fail** / 2 skip; regression checker fails with 18 new names.
- After fixes: 694 pass / **93 fail** / 2 skip; regression checker exits **0**. Exact resolved 18; introduced zero.
- After removing `dist` from the checkout and letting the same test command regenerate `.test-dist`: identical 694/93/2 and failure names; checker exits **0**.
- No baseline edits, deleted exports, removed tests, new skips, excluded compiler inputs or manufactured evidence.
- Frozen install passes. Initial native install failed because the default node-gyp cache path was not writable; retry with `npm_config_cache`, `npm_config_devdir` and `XDG_CACHE_HOME` under `/tmp` passes without changing dependency resolution or suppressing lifecycle scripts.
- Strict web and recursive non-web typechecks pass; platform build passes. Full suite executes the inherited public-entry, native, Forge, Maps and Signal coverage.
- `pnpm gate:fast` and `pnpm gate` both fail at the five existing worker `no-unused-expressions` lint errors (#1149); subsequent phases are not implied passing.

## Review and remaining limits

This slice changes packages/tests plus this evidence document; production domain, schemas, migrations, data and execution semantics are unchanged. Local review verifies no shared compiler/barrel changes after the prerequisite merge and an additive test compiler graph. Independent/human review remains required before integration. The authored repair commit can be consumed by #1179 after its owner reviews the bounded diff; do not replay the dependency merge into its own branch.

The complete CI matrix, web/worker regressions and the 93 existing platform failures remain separately visible; mission #1153 stays open. No commissioned DirectAdmin host, credential issuer, real provider, database recovery, deployment or live-device acceptance was run. Compatibility approval, memory fixtures and projection tests prove no production authority or accepted business outcome.

Rollback the authored package/test repair commit to restore prior behavior; no data rollback or migration is involved. Preserve dependency ancestry and coordinate shared owner files rather than replacing them.
