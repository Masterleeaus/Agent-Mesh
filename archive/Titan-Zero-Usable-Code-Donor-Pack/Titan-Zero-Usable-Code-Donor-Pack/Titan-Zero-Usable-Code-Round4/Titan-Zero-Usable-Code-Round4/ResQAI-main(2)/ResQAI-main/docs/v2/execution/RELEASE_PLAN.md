# RESQAI V2 — Release Plan

> Phase 3.5 — Execution Plan
> Chief Technical Program Manager
> Date: 2026-06-29

---

## Table of Contents

1. [Release Strategy Overview](#1-release-strategy-overview)
2. [Alpha Release](#2-alpha-release)
3. [Internal Beta Release](#3-internal-beta-release)
4. [Closed Beta Release](#4-closed-beta-release)
5. [Release Candidate](#5-release-candidate)
6. [Production Release](#6-production-release)
7. [Release Governance](#7-release-governance)
8. [Post-Release Plan](#8-post-release-plan)

---

## 1. Release Strategy Overview

### 1.1 Release Phases

```
Phase           Week    Scope                   Audience
────────────    ────    ─────────────────────   ──────────────────────
Alpha           W4      Foundation + Functions  Internal engineering team
Internal Beta   W12     All Functions + Apps    Internal stakeholders + QA
Closed Beta     W18     All Apps + Core Agents  Select customer accounts (5-10)
RC              W28     All 150+ Components     Full staging validation
Production      W30+    All V2 in production    100% customer traffic
V1 Decomm       W36     V1 shutdown             Post-production cleanup
```

### 1.2 Release Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Incremental value** | Each release delivers testable, deployable value |
| 2 | **No big-bang** | Never release everything at once; canary every deployment |
| 3 | **Coexistence first** | V2 runs alongside V1 until full cutover validated |
| 4 | **Rollback ready** | Every release has a documented, tested rollback plan |
| 5 | **Feature-flag gated** | New features behind feature flags for gradual rollout |

---

## 2. Alpha Release

**Target Week:** 4 | **Status:** Internal Only

### 2.1 Scope

| Component | Status | Notes |
|-----------|:------:|-------|
| Shared Packages | ✓ | types_v2, config_v2, utils_v2, sdk_v2, ui_v2, hooks_v2, forms_v2, layouts_v2 |
| Database (41 tables) | ✓ | All 6 migration scripts applied |
| Event Bus | ✓ | 14 pub/sub channels operational |
| Auth System | ✓ | RLS enforced on all tables |
| CI/CD Pipeline | ✓ | Build, lint, test, deploy |
| 7 DET Functions | ✓ | validate-ticket-input, check-ticket-urgency, classify-ticket-sla-tier, check-reminder-window, calculate-dispatch-priority, validate-config-change, validate-permissions |

### 2.2 Release Criteria

| Criterion | Status | Notes |
|-----------|:------:|-------|
| Package unit tests ≥ 90% | ✓ | Verified per package |
| Migration integrity verified | ✓ | 41 tables, FK intact, indexes created |
| Event bus tested (3 events) | ✓ | Publish → consume → replay |
| Auth matrix passes | ✓ | All roles × all tables |
| CI/CD green on dev branch | ✓ | Zero failures |

### 2.3 Audience

- Internal engineering team (100 engineers)
- CTO and Architecture Board (for Gate G0 review)

### 2.4 Deployment

```
Environment:    Dev
Target:         lemma platform dev workspace
URL:            https://dev.resqai.app/v2/
Access:         VPN + dev credentials
```

### 2.5 Duration

- Active: Week 4 only
- Iteration: Engineering continues to Phase 1 immediately after

---

## 3. Internal Beta Release

**Target Week:** 12 | **Status:** Internal Stakeholders

### 3.1 Scope

| Component | Status | Notes |
|-----------|:------:|-------|
| ALL 53 functions | ✓ | DET + REA + WRI + AGG + TRA + ORC |
| ALL 6 connectors | ✓ | SMTP, Twilio, Discord, Slack, Gmail, Reddit |
| support-center_v2 | ✓ | Ticket Queue, SLA Dashboard, Classification Panel |
| operations-center_v2 | ✓ | Dashboard, Task Kanban, Dispatch Queue |
| appointment-center_v2 | ✓ | Schedule Board, Booking Wizard, Reminders |
| technician-portal_v2 | ✓ | My Day, Work Orders, Inventory |

### 3.2 Release Criteria

| Criterion | Status | Notes |
|-----------|:------:|-------|
| All 53 functions pass integration | ✓ | 159 tests |
| Connector smoke tests pass (6/6) | ✓ | All channels |
| Core apps deployed (4/10) | ✓ | support, ops, appointment, tech |
| 90%+ function coverage | ✓ | Verified |
| V1/V2 gap analysis complete | ✓ | 0 gaps |
| No P0/P1 bugs | ✓ | Bug tracker clean |

### 3.3 Audience

- Internal stakeholders (product, support, operations teams)
- QA team for extended testing
- Select power users within organization (10-20 users)

### 3.4 Testing Focus

- Stakeholder feedback on app usability
- QA full regression suite
- Performance baseline measurement

### 3.5 Deployment

```
Environment:    Staging
Target:         lemma platform staging workspace
URL:            https://staging.resqai.app/v2/
Access:         Company credentials + V2 role
```

### 3.6 Duration

- Active: Weeks 12-18
- Feedback integration: Ongoing (next sprint)
- Go/No-Go at Gate G1: Proceed if exit criteria met

---

## 4. Closed Beta Release

**Target Week:** 18 | **Status:** External — Select Customers

### 4.1 Scope

| Component | Status | Notes |
|-----------|:------:|-------|
| ALL 10 V2 apps | ✓ | All apps deployed |
| customer-portal_v2 | ✓ | Customer-facing self-service |
| resolution-center_v2 | ✓ | Dispute management |
| crm-center_v2 | ✓ | Account health + followups |
| notification-center_v2 | ✓ | Multi-channel notifications |
| analytics-center_v2 | ✓ | Dashboards + reports |
| admin-center_v2 | ✓ | User/role/configuration management |
| 26 Core Agents | ✓ | Executive + Support + Ops + Dispatch + Scheduling + Appointment + CRM |

### 4.2 Release Criteria

| Criterion | Status | Notes |
|-----------|:------:|-------|
| All 10 apps deployed | ✓ | Verified via smoke tests |
| 80%+ FE coverage | ✓ | Per-app coverage |
| Cross-app journeys verified | ✓ | 3 critical journeys pass |
| Lighthouse ≥ 85 | ✓ | On all apps |
| WCAG 2.1 AA passes | ✓ | Automated + manual |
| Core agents operational | ✓ | 26 agents, Q/A tested |
| No P0/P1 bugs | ✓ | Bug tracker clean |

### 4.3 Audience

- 5-10 select customer accounts (volunteer participants)
- Accounts chosen for diversity of use cases (SMB, Enterprise, Field Service)
- NDA-protected feedback loop

### 4.4 Testing Focus

- Real-world customer workflows
- Edge cases discovered by real users
- Performance under real (non-synthetic) usage patterns
- Customer feedback on customer-portal_v2 and technician-portal_v2

### 4.5 Deployment

```
Environment:    Production (restricted accounts)
Target:         V2 apps behind feature flag for beta accounts
URL:            https://app.resqai.app/v2/ (beta accounts only)
Access:         Beta account flag in admin-center_v2
Data:           Real customer data (V2 reads from V2 `_v2` tables; V1 unaffected)
```

### 4.6 Support Model

| Channel | Response SLA | Escalation |
|---------|:------------:|------------|
| In-app feedback | 4 hours | Beta support team |
| Email (beta@resqai.app) | 2 hours | Beta support lead |
| P0/P1 issues | 15 min | On-call engineer |
| Feature requests | 1 week | Product team triage |

### 4.7 Duration

- Active: Weeks 18-28
- Feedback collected via in-app feedback widget
- Weekly beta sync call with customer contacts
- Real-time monitoring of V2 performance and errors

---

## 5. Release Candidate

**Target Week:** 28 | **Status:** Full Staging Validation

### 5.1 Scope

| Component | Status | Notes |
|-----------|:------:|-------|
| ALL 53 functions | ✓ | Full production configuration |
| ALL 6 connectors | ✓ | Production credentials configured |
| ALL 10 V2 apps | ✓ | All features complete |
| ALL 49 agents | ✓ | Core + Extended |
| ALL 33 workflows | ✓ | Tier 0-7 |
| Event bus | ✓ | Full event catalog (85+ events) |
| Monitoring | ✓ | All dashboards, alerts, logging |

### 5.2 Release Criteria

| Criterion | Status | Notes |
|-----------|:------:|-------|
| All 150+ components operational | ✓ | Smoke tested |
| 165 workflow smoke tests pass | ✓ | Verified |
| Full journey E2E (3 journeys) passes | ✓ | Verified |
| Load test: 200 users, 30 min, no SLA violation | ✓ | Verified |
| Security: 0 critical, 0 high | ✓ | DAST + SAST + dependency |
| DR drill: < 1h RTO | ✓ | Verified |
| Rollback procedures tested (Tier 1-5) | ✓ | Verified in staging |
| Monitoring dashboards complete | ✓ | All components |
| Runbooks documented | ✓ | All ops procedures |
| No P0/P1 bugs | ✓ | Bug tracker clean |

### 5.3 Deployment

```
Environment:    Staging (production-mirror)
Target:         Full V2 system
URL:            https://preprod.resqai.app/v2/
Access:         All internal users + beta customers
Data:           Anonymized production-mirror dataset (50K+ tickets, 10K customers)
```

### 5.4 Validation Activities

| Activity | Duration | Participants |
|----------|:--------:|--------------|
| Full regression suite | 2 days | QA team |
| Load test (200 users, 30 min) | 3 runs | Performance engineer |
| Security penetration test | 5 days | External security firm |
| DR drill | 1 day | Platform team |
| Beta customer final feedback | 2 weeks | 5-10 beta customers |
| Stakeholder demo | 1 session | All teams + stakeholders |
| Production readiness review | 1 session | CTO + all leads |

### 5.5 Go/No-Go for Production

**Go if:**
- All RC exit criteria met
- Beta customer feedback positive (no blocking issues)
- Performance within target
- Security clean
- Rollback tested and ready
- CTO + VP Engineering approve

**No-Go if:**
- Any P0/P1 bug open
- Performance below target
- Security finding > high
- Rollback not validated

---

## 6. Production Release

**Target Week:** 30-32 | **Status:** Full Production

### 6.1 Canary Rollout Plan

```
Stage 1: Canary (10%) ─────── Day 1-3   ── 72h monitoring
Stage 2: Ramp (50%) ──────── Day 4-10   ── 1 week monitoring
Stage 3: Full (100%) ─────── Day 11+     ── 30 day monitoring
```

### 6.2 Stage 1: Canary (10%)

| Parameter | Value |
|-----------|-------|
| Traffic percentage | 10% of total customer traffic |
| Duration | 72 hours minimum |
| Target accounts | Random 10% sample |
| Monitored metrics | Error rate, latency, throughput, notification delivery |
| Rollback trigger | Any P0, P1 affecting > 1% of canary users |
| Approval | CTO sign-off after 72h without incident |

### 6.3 Stage 2: Ramp (50%)

| Parameter | Value |
|-----------|-------|
| Traffic percentage | Increase to 50% |
| Duration | 1 week minimum |
| Target accounts | Gradual increase, all account types represented |
| Monitored metrics | Same as Stage 1 + data consistency V1 vs V2 |
| Rollback trigger | Data inconsistency > 5 min lag, SLA violation |
| Approval | CTO sign-off after 1 week without incident |

### 6.4 Stage 3: Full Production (100%)

| Parameter | Value |
|-----------|-------|
| Traffic percentage | 100% of customer traffic |
| V1 state | Read-only fallback mode |
| Duration | 30 days before V1 decommission |
| Monitored metrics | All production SLAs |
| Rollback trigger | SLA below 99.9% for > 1h, any P0 |
| Approval | CEO + CTO + VP Eng sign-off |

### 6.5 Production Deployment Runbook

| Step | Action | Duration | Owner |
|:----:|--------|:--------:|-------|
| 1 | Run final migration verification | 10 min | Platform Lead |
| 2 | Deploy all 53 functions | 15 min | BE Lead |
| 3 | Configure 6 connectors with prod credentials | 10 min | BE Connector Lead |
| 4 | Deploy all 10 V2 apps | 15 min | FE Lead |
| 5 | Deploy all 49 agents | 10 min | Agent Lead |
| 6 | Deploy all 33 workflows | 10 min | Workflow Lead |
| 7 | Run health check (all components) | 5 min | Platform Lead |
| 8 | Enable V2 DNS (10% traffic) | 1 min | Platform Lead |
| 9 | Monitor for 72h (Stage 1) | 72h | All leads |
| 10 | Increase to 50% traffic | 1 min | Platform Lead |
| 11 | Monitor for 1 week (Stage 2) | 1 week | All leads |
| 12 | Increase to 100% traffic | 1 min | Platform Lead |
| 13 | Set V1 to read-only | 1 min | Platform Lead |
| 14 | Monitor for 30 days | 30 days | All leads |
| 15 | V1 decommission | 1 day | Platform + BE |

### 6.6 Rollback Procedures

| Tier | Scope | Action | ETA | Owner |
|:----:|-------|--------|:---:|-------|
| 1 | Full system | DNS switch back to V1 | < 5 min | Platform Lead |
| 2 | Single app | Revert Vite build version | < 15 min | FE Lead |
| 3 | Single function | Revert function version | < 15 min | BE Lead |
| 4 | Data | Run V1 data restore | < 2h | BE Lead |
| 5 | Complete rollback | Full V1 restoration | < 1 day | CTO |

---

## 7. Release Governance

### 7.1 Release Authority

| Release Type | Approver | Required Sign-Offs |
|--------------|----------|-------------------|
| Alpha | CTO | QA Lead |
| Internal Beta | CTO + VP Eng | QA Lead, BE Lead, FE Lead |
| Closed Beta | CTO + VP Eng + VP Product | All leads + Security Lead |
| RC | CTO + VP Eng + VP Product | All leads |
| Production (Stage 1) | CTO | All leads |
| Production (Stage 2) | CTO + VP Eng | All leads |
| Production (Stage 3) | CEO + CTO + VP Eng | All leads + Security Lead |
| V1 Decommission | CEO + CTO | CTO + BE Lead |

### 7.2 Release Checklist

```
Pre-Release Checklist (ALL releases):
  [ ] All exit criteria for current release met
  [ ] All tests pass (unit + integration + E2E)
  [ ] No P0/P1 bugs open
  [ ] Security scan clean (or findings accepted with mitigation)
  [ ] Rollback plan documented and tested
  [ ] Monitoring dashboards configured
  [ ] On-call rotation established
  [ ] Release notes prepared
  [ ] Stakeholders notified
  [ ] Release approved by required authority

Post-Release Checklist (ALL releases):
  [ ] Deployment verified (health checks pass)
  [ ] Error rates within normal range
  [ ] Latency within SLA
  [ ] No P0/P1 incidents within first hour
  [ ] Monitoring dashboards showing expected data
  [ ] Incident response team on standby
  [ ] Post-release review scheduled (within 48h)
```

### 7.3 Release Communication

| Release Type | Announcement To | Channel | Format |
|--------------|----------------|---------|--------|
| Alpha | Engineering teams | Slack #eng-v2 | Brief notes + known limitations |
| Internal Beta | All employees | Email + Slack | Feature overview + how to access |
| Closed Beta | Beta customers | Email + In-app | Release notes + known issues |
| RC | All stakeholders | Email + Meeting | Full release notes + demo |
| Production | All customers | Email + In-app banner | Announcement + migration guide |

---

## 8. Post-Release Plan

### 8.1 V1 Decommission (Week 36+)

| Step | Action | Duration | Verification |
|:----:|--------|:--------:|-------------|
| 1 | V1 set to read-only | Immediate | Verify no V1 writes |
| 2 | Data reconciliation (V1 ↔ V2) | 24h | Zero data inconsistencies |
| 3 | V1 data archival | 1 week | Archive verified, checksummed |
| 4 | V1 read-only disabled | 30 days after production | V1 returns 503 |
| 5 | V1 tables dropped | 35 days after production | Schema verified empty |
| 6 | V1 DNS removed | 36 days after production | DNS cleanup verified |

### 8.2 V2.1 Planning

| Area | Candidates | Timeline |
|------|------------|:--------:|
| Additional connectors | Google Calendar, WhatsApp, QuickBooks, Zapier | Post V2 + 3 months |
| Enhanced analytics | ML-powered forecasting, anomaly detection | Post V2 + 6 months |
| Agent improvements | Improved RAG, multi-modal support | Post V2 + 3 months |
| Mobile SDK | Native iOS/Android apps | Post V2 + 6 months |
| Marketplace | Third-party app integrations | Post V2 + 12 months |

### 8.3 Success Metrics (Post-Production)

| Metric | Target | Measurement Window |
|--------|:------:|:------------------:|
| Uptime | 99.9% | Monthly |
| API response (p95) | < 2s | Daily |
| Agent response (p95) | < 5s | Daily |
| Notification delivery | > 99% within 30s | Daily |
| User satisfaction (NPS) | > 50 | Monthly survey |
| Feature adoption | > 80% of V1 features used | Monthly |
| Bug introduction rate | < 5 P0/P1 per month | Monthly |
| LLM cost per conversation | < $0.05 | Monthly |

---

> **End of RELEASE_PLAN.md**
