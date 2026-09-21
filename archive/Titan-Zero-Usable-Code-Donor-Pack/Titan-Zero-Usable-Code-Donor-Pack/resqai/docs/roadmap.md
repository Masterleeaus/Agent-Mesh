# ResQAI — Roadmap

## Status Summary

| Phase | Status |
|-------|--------|
| Phase 1: Database (DDL + seeds) | ✅ Complete |
| Phase 2: Functions (code + tests) | ✅ Complete |
| Phase 3: Agents (configs + schemas) | ✅ Complete |
| Phase 4: Applications (E2E React apps) | ✅ Complete |
| Phase 5: Infrastructure (Docker + CI/CD) | ⏳ Pending |
| Phase 6: Polish (testing, auth, production) | ⏳ Blocked on Lemma auth fix |

## Completed

### Database (Phase 1)
- 9 tables extracted with full schemas and ENUM definitions
- Seed data in `database/docs/` (109 records)
- One migration for tickets table

### Functions (Phase 2)
- `account-health-scan` — Python, 13 tests, scoring formula
- `flag-slipping-followups` — Python, 9 tests, severity classification

### Agents (Phase 3)
- 5 agents fully configured (instructions, schemas, permissions, tools)
- All agents documented with workflow roles

### Applications (Phase 4)
- 5 React + Vite apps passing type-check and build
- Shared SDK, types, config, and utils modules
- npm workspace setup

### Validation
- Cross-app validation with 100% reconstruction confidence
- Per-app live integration audits
- Gap analysis and recovery reports

## In Progress

- **Authentication** — Blocked on Lemma platform redirect bug
- **Documentation** — Active (this documentation effort)

## Pending

### Phase 5: Infrastructure
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Environment provisioning (dev/staging/prod)

### Phase 6: Polish
- AuthGuard integration after Lemma fix
- Cross-app end-to-end testing
- Production verification
- Performance testing
- Deployment

See `PHASE6_PREPARATION.md` for detailed Phase 6 planning.

## Effort Estimate

| Phase | Estimated Effort | Dependencies |
|-------|-----------------|--------------|
| Phase 5 | 2–3 days | None |
| Phase 6 | 3–5 days | Lemma auth fix |
| **Total** | **5–8 days** | |
