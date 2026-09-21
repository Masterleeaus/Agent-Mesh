# Risk Register — ResQAI V2

**Phase:** B.10 Enterprise Production Readiness Validation
**Date:** 2026-06-30

---

## Risk Rating Matrix

| Rating | Likelihood | Impact | Color |
|:------:|-----------|-------|:-----:|
| **Critical** | Almost certain | Severe business impact | 🔴 |
| **High** | Likely | Significant business impact | 🟠 |
| **Medium** | Possible | Moderate business impact | 🟡 |
| **Low** | Unlikely | Minor business impact | 🟢 |

---

## Risk Register

### R001 — Lemma Auth Redirect Unresolved

| Field | Value |
|-------|-------|
| **Risk** | Lemma platform OAuth redirect bug prevents all user authentication |
| **Category** | Platform Dependency |
| **Likelihood** | Almost certain (bug confirmed, no fix ETA) |
| **Impact** | Severe — zero users can log in |
| **Rating** | 🔴 **Critical** |
| **Current Mitigation** | `VITE_LEMMA_TOKEN` bypass for localhost only |
| **Contingency** | Implement custom auth service independent of Lemma redirect |
| **Owner** | Lemma Platform Team + ResQAI Lead |
| **Target Close** | Before go-live |
| **Status** | Open — blocked externally |

---

### R002 — Agent Runtime Not Available

| Field | Value |
|-------|-------|
| **Risk** | All 6 AI agents cannot execute; core workflows non-functional |
| **Category** | Platform / Implementation |
| **Likelihood** | Almost certain (no runtime built) |
| **Impact** | Severe — ticket intake, dispute resolution, health monitoring, ops coordination all blocked |
| **Rating** | 🔴 **Critical** |
| **Current Mitigation** | None |
| **Contingency** | Build agent runtime service; alternatively implement function-based fallbacks for critical workflows |
| **Owner** | ResQAI Development Team |
| **Target Close** | Before go-live |
| **Status** | Open — not started |

---

### R003 — No Production Infrastructure

| Field | Value |
|-------|-------|
| **Risk** | No Docker, CI/CD, or deployment environments — cannot deploy to production |
| **Category** | Infrastructure |
| **Likelihood** | Almost certain (nothing built) |
| **Impact** | Severe — no deployment path |
| **Rating** | 🔴 **Critical** |
| **Current Mitigation** | None |
| **Contingency** | Create Dockerfiles and CI/CD pipeline as phase C priority |
| **Owner** | DevOps / Platform Team |
| **Target Close** | Before go-live |
| **Status** | Open — not started |

---

### R004 — Credential Exposure

| Field | Value |
|-------|-------|
| **Risk** | All credentials in plaintext `.env` files; no secrets manager |
| **Category** | Security |
| **Likelihood** | Likely (no protection mechanism) |
| **Impact** | Major — connector API keys, OAuth secrets, database credentials exposed |
| **Rating** | 🔴 **Critical** |
| **Current Mitigation** | `.env` is gitignored; `.env.example` has placeholder values |
| **Contingency** | Integrate Doppler or HashiCorp Vault before production deployment |
| **Owner** | Security / DevOps Team |
| **Target Close** | Before go-live |
| **Status** | Open — not started |

---

### R005 — Zero Production Monitoring

| Field | Value |
|-------|-------|
| **Risk** | No error tracking, structured logging, or alerting — production issues invisible |
| **Category** | Observability |
| **Likelihood** | Almost certain (nothing implemented) |
| **Impact** | Major — outages undetected; debugging impossible |
| **Rating** | 🔴 **Critical** |
| **Current Mitigation** | None |
| **Contingency** | Add Sentry error tracking and structured logging before go-live |
| **Owner** | ResQAI Development Team |
| **Target Close** | Before go-live |
| **Status** | Open — not started |

---

### R006 — Untested Functions Fail in Production

| Field | Value |
|-------|-------|
| **Risk** | 56 of 66 backend functions have no tests; likely to contain undetected bugs |
| **Category** | Testing / Quality |
| **Likelihood** | Likely (majority untested) |
| **Impact** | Moderate — business logic errors in production |
| **Rating** | 🟠 **High** |
| **Current Mitigation** | Pydantic input validation on all functions |
| **Contingency** | Prioritize test coverage for functions on critical code paths; add integration tests |
| **Owner** | QA Team |
| **Target Close** | Phase C |
| **Status** | Open — 10/66 suites implemented |

---

### R007 — Legacy Peer Deps Cause Build Failure

| Field | Value |
|-------|-------|
| **Risk** | `legacy-peer-deps=true` masks dependency conflicts that may surface in production builds |
| **Category** | Build / Dependencies |
| **Likelihood** | Possible |
| **Impact** | Moderate — production build fails or has runtime errors |
| **Rating** | 🟠 **High** |
| **Current Mitigation** | Workaround documented; builds currently succeed |
| **Contingency** | Resolve Vite/plugin-react peer dependency conflict |
| **Owner** | ResQAI Development Team |
| **Target Close** | Phase C |
| **Status** | Open — documented |

---

### R008 — Data Loss on Infrastructure Failure

| Field | Value |
|-------|-------|
| **Risk** | No database backup strategy, no disaster recovery plan |
| **Category** | Data / Operations |
| **Likelihood** | Possible |
| **Impact** | Severe — permanent data loss |
| **Rating** | 🔴 **Critical** |
| **Current Mitigation** | None |
| **Contingency** | Implement automated database backups with RPO < 1 hour |
| **Owner** | DevOps / Platform Team |
| **Target Close** | Before go-live |
| **Status** | Open — not started |

---

### R009 — Platform Dependency on Lemma

| Field | Value |
|-------|-------|
| **Risk** | Entire system depends on Lemma Pod availability; no offline mode or fallback |
| **Category** | Architecture |
| **Likelihood** | Medium (Lemma could have outages) |
| **Impact** | Severe — complete system outage if Lemma is down |
| **Rating** | 🟠 **High** |
| **Current Mitigation** | None — no fault tolerance |
| **Contingency** | Document Lemma SLAs; add caching layer; design degraded-mode operation |
| **Owner** | Architecture Team |
| **Target Close** | Phase C |
| **Status** | Open — acknowledged |

---

### R010 — Connector API Rate Limits / Changes

| Field | Value |
|-------|-------|
| **Risk** | External connector APIs (Discord, Facebook, Instagram, Gmail, Reddit) may change or rate-limit |
| **Category** | Integration |
| **Likelihood** | Medium |
| **Impact** | Moderate — connector operations fail |
| **Rating** | 🟡 **Medium** |
| **Current Mitigation** | Agent instructions reference connector behavior; no programmatic handling |
| **Contingency** | Add connector health checks and rate limit monitoring |
| **Owner** | Integration Team |
| **Target Close** | Phase C |
| **Status** | Open — acknowledged |

---

### R011 — Insufficient Test Coverage for Compliance

| Field | Value |
|-------|-------|
| **Risk** | No security, accessibility, or load testing — may fail compliance audits |
| **Category** | Compliance / Quality |
| **Likelihood** | Possible |
| **Impact** | Moderate — compliance failure, legal risk |
| **Rating** | 🟡 **Medium** |
| **Current Mitigation** | None |
| **Contingency** | Add security and load tests before compliance audit |
| **Owner** | QA / Compliance Team |
| **Target Close** | Phase C |
| **Status** | Open — not started |

---

### R012 — V1/V2 Schema Drift

| Field | Value |
|-------|-------|
| **Risk** | V1 (9 tables) and V2 (41 tables) schemas may diverge; no migration plan |
| **Category** | Data / Architecture |
| **Likelihood** | Likely (no governance) |
| **Impact** | Moderate — data inconsistency, migration difficulty |
| **Rating** | 🟡 **Medium** |
| **Current Mitigation** | None |
| **Contingency** | Freeze V1 schema; create V1→V2 migration plan with automated validation |
| **Owner** | Data / Architecture Team |
| **Target Close** | Phase C |
| **Status** | Open — acknowledged |

---

### R013 — Windows-Only Tooling Alienates Contributors

| Field | Value |
|-------|-------|
| **Risk** | Dev scripts and documentation target Windows only |
| **Category** | Developer Experience |
| **Likelihood** | Likely (no cross-platform testing) |
| **Impact** | Minor — reduced contributor pool |
| **Rating** | 🟢 **Low** |
| **Current Mitigation** | None |
| **Contingency** | Make scripts cross-platform; add macOS/Linux CI |
| **Owner** | Development Team |
| **Target Close** | Phase C |
| **Status** | Open — acknowledged |

---

## Risk Summary

| Rating | Count | % of Total |
|:------:|:-----:|:----------:|
| 🔴 Critical | 6 | 46% |
| 🟠 High | 3 | 23% |
| 🟡 Medium | 3 | 23% |
| 🟢 Low | 1 | 8% |
| **Total** | **13** | **100%** |

## Risk Trend

| Metric | Previous | Current | Delta |
|--------|:--------:|:-------:|:-----:|
| Critical risks | 5 | 6 | +1 |
| High risks | 4 | 3 | -1 |
| Medium risks | 3 | 3 | 0 |
| Low risks | 2 | 1 | -1 |
| **Overall risk level** | **High** | **Critical** | **Increased** |

*Note: New critical risks identified (no backup/DR, no agent runtime) were previously unassessed. Resolved issues (.env, TS errors) removed from register.*
