# Test Results

## Added behavioural tests
`services/workforce/src/index.test.ts` covers:
- create → READY → claim → start → complete + evidence
- dependency BLOCKED → prerequisite completion → READY + dispatcher wake
- cross-company dependency rejection
- direct circular dependency rejection
- delegation does not grant authority (`WAITING_APPROVAL`)
- duplicate claim prevention at service lifecycle boundary
- WAITING_EXTERNAL → explicit resume

## Execution status
Tests were **not executed in this connector session**. The available GitHub connector provides repository read/write operations but no shell/package runner. No passing result is claimed.

Commands for CI/local verification:
```bash
cd services/workforce
npm install
npm run typecheck
npm test
```

Agent 1 must additionally test restart persistence and transactional duplicate-claim behaviour against the canonical SQLite adapter. Agent 7 should run repository-wide gates after all seven branches converge.
