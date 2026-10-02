# Issue #1084 current-main closeout evidence

**Issue body SHA-256:** `39570ea16aba7796e9c1e2f645eaaafef9e03a76a75bbbe6f72f39154c7b6503`  
**Current main evidence head:** `c063a96dd9e2f6b73a2f199882ab6a710ff6c7d9`

## Executed current-main evidence

Titan Zero CI run [36970706820](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36970706820) passed on `main` at the evidence head above. The `validate` job is [110723888784](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36970706820/job/110723888784); its **Web typecheck regression gate** step 12 passed.

Exact typecheck command:
```sh
pnpm --filter @titan-zero/web typecheck
```

The step generated route types successfully and its baseline checker printed:

```text
Web typecheck baseline: current=0, baseline=16, pairs=0/15
Baseline improvements detected (safe to reduce baseline in follow-up):
  - ../../packages/titan-platform/src/ported/titan-revenue-journey/booking-job-origin-evidence.ts::TS2322: 1 -> 0
  - ../../packages/titan-platform/src/ported/titan-revenue-journey/invoice-payment-evidence.ts::TS2322: 1 -> 0
  - ../../packages/titan-platform/src/ported/titan-revenue-journey/quote-lifecycle-evidence.ts::TS2322: 1 -> 0
Web typecheck is clean; baseline can be deleted and strict typecheck enabled.
Web TypeScript baseline is fully clean.
```

The typecheck baseline configured in `.github/ci/web-typecheck-baseline.json` remains 16 in this run, matching the 16-error baseline stated in the original issue. The three evidence modules remain compiler inputs: the same baseline report found each prior TS2322 pair and reduced its current count from 1 to 0.

Relevant implementation paths already on current main from merged PR [#1179](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1179):

- `apps/web/app/app/capture/CaptureRecorder.tsx`
- `apps/web/app/api/v1/captures/route.ts`
- `apps/web/lib/db/portable.ts`
- `packages/titan-platform/src/index.ts`
- `packages/titan-platform/src/workforce-native/jobs.ts`
- `packages/titan-platform/src/ported/titan-revenue-journey/booking-job-origin-evidence.ts`
- `packages/titan-platform/src/ported/titan-revenue-journey/invoice-payment-evidence.ts`
- `packages/titan-platform/src/ported/titan-revenue-journey/quote-lifecycle-evidence.ts`

## Separate frozen-install provenance

The current-main push workflow's dependency step is configured as `pnpm install --no-frozen-lockfile` in [`.github/workflows/titan-ci.yml`](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/blob/c063a96dd9e2f6b73a2f199882ab6a710ff6c7d9/.github/workflows/titan-ci.yml). Run 36970706820 therefore supplies current-main typecheck evidence, not frozen-install evidence.

The frozen install remains a separate, author-recorded local check in the #1084/#1179 history: [PR #1179 verification update](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1179#issuecomment-5944917736) records this exact command as passed with pnpm 9.12.0:

```sh
CI=true COREPACK_HOME=/tmp/titan-corepack npm_config_cache=/tmp/titan-1084-verify-npm-cache corepack pnpm install --frozen-lockfile --store-dir=/tmp/titan-1084-verify-store
```

This provenance is kept distinct from the current-main hosted typecheck run.

## Scope

This record covers #1084's web typecheck acceptance only. The issue's separate owners remain #1152 (raw web test failures), #648 (migration history and repository convergence), #302 (restricted-role identity/RLS), and #811/#812/#322 (DirectAdmin runtime, ingress, and host commissioning). No broader product readiness or deployment certification is claimed here.
