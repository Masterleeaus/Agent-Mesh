# Titan Zero CI Debt Ledger

The canonical Titan Zero CI is green on GitHub `main` while explicitly tracking inherited Merge84 debt through exact regression baselines.

These baselines are **not exemptions from quality**. They are temporary ceilings: existing measured failures may decrease, but new failures or increases are rejected by CI.

## Canonical green reference

- GitHub Actions run: `35577244619`
- Canonical SHA: `8d4cc347e650f8f14aca0ac219311d752a772f6a`
- Result: **success**
- Passed layers:
  - repository/roadmap integrity guardrails
  - dependency install
  - strict non-web TypeScript typecheck
  - web TypeScript regression gate
  - strict tests for clean packages
  - worker test regression gate
  - web test regression gate
  - titan-platform test regression gate
  - strict non-web build

## Owned debt

### TZ-ROADMAP-52-SG-02 — Issue #78

**TypeScript compile/build dependency closure**

Owned baseline:

- `.github/ci/web-typecheck-baseline.json`
- Current measured debt: **111 TypeScript errors across 56 file+diagnostic-code pairs**

Additional SG-02 convergence debt still surfaced by CI:

- `pnpm install --no-frozen-lockfile` currently mutates `pnpm-lock.yaml`
- full web build remains gated behind eliminating the web TypeScript baseline

Exit condition:

1. web TypeScript baseline reaches zero;
2. baseline file is deleted;
3. CI uses strict web typecheck;
4. package manifests and `pnpm-lock.yaml` converge;
5. frozen-lockfile installation becomes strict;
6. full web build becomes a strict required gate.

### TZ-ROADMAP-52-SG-14 — Issue #64

**Test-suite baseline repair**

Owned baselines:

- `.github/ci/web-test-baseline.json`
  - **86 known failures**
  - **1,707 passing / 1,793 total web tests** at measurement
- `.github/ci/worker-test-baseline.json`
  - **24 known failures**
- `.github/ci/titan-platform-test-baseline.json`
  - **97 known failures**

Exit condition:

1. fix or correctly reclassify each recorded failure;
2. reduce baseline entries as fixes land;
3. reject all new/increased failures continuously;
4. delete each baseline once that suite reaches zero unexplained failures;
5. run all suites as strict CI gates.

## Rules

- Never increase a baseline merely to make CI green without first proving the new failure is inherited canonical debt.
- Never replace named failure identities with a wildcard/count-only allowance.
- Improvements should reduce the corresponding baseline in the same PR where practical.
- A baseline reaching zero must be removed rather than retained empty.
- Roadmap/issues own the debt; CI only enforces the measured boundary.
