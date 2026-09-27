# Test Results

Verification is pending the branch CI run.

Target package gates:

```bash
pnpm --filter @titan-zero/workforce typecheck
pnpm --filter @titan-zero/workforce test
```

Repository gates to inspect through GitHub Actions after PR creation:

```bash
pnpm typecheck
pnpm test
```

Behavioural coverage authored for: create/assign/claim/start/complete, duplicate claim prevention, dependencies and cycle rejection, waiting/resume, delegation/manager decomposition, escalation, recurrence idempotency, dispatcher/runtime adapter, company isolation, fail/cancel, authority requirement preservation, evidence references, and human-vs-digital runtime separation.

Exact CI results will replace this pending section after GitHub reports checks.
