# Test Results

## Verification pass 1

GitHub Actions `Titan Zero CI` run `36295464340` on PR #787:

- repository guardrails: PASS
- dependency installation: PASS
- `@titan-zero/workforce` TypeScript typecheck: PASS
- overall strict non-web typecheck: FAIL because the pre-existing `services/worker` package still references unresolved legacy `@ai-fsm/*` packages / `mysql2/promise` and has existing workflow-event test signature/export errors.
- downstream repository test/build stages: SKIPPED by CI after the unrelated worker typecheck failure.

The earlier workforce-specific TypeScript failures were fixed in commits `9aea328a480b0a06e0e0839c9724a76aaf14637f`, `0123ff4d7456ea09fc29a98d877b3967ad697984` and `f6c88f338af77bb3ede2344f6d734dead76250ac`.

## Focused gate

A focused branch workflow now runs:

```bash
pnpm --filter @titan-zero/workforce typecheck
pnpm --filter @titan-zero/workforce test
```

Behavioural coverage: create/assign/claim/start/complete, duplicate claim prevention, dependencies and cycle rejection, waiting/resume including approval wait, delegation/manager decomposition, escalation, recurrence idempotency, dispatcher/runtime adapter, company isolation, fail/cancel, authority requirement preservation, evidence references, and human-vs-digital runtime separation.
