# RESQAI V2 — Gap Analysis

> Phase 2.2 — Complete Build Readiness Audit  
> Chief Solution Architect & Release Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Gap Classification](#1-gap-classification)
2. [Architecture Gaps](#2-architecture-gaps)
3. [Data Model Gaps](#3-data-model-gaps)
4. [Security Gaps](#4-security-gaps)
5. [Testing Gaps](#5-testing-gaps)
6. [Documentation Gaps](#6-documentation-gaps)
7. [Operations Gaps](#7-operations-gaps)
8. [Integration Gaps](#8-integration-gaps)
9. [Gap Resolution Priority Matrix](#9-gap-resolution-priority-matrix)

---

## 1. Gap Classification

| Category | Code | Count | Description |
|----------|:----:|:-----:|-------------|
| Architecture | A- | 5 | Missing or contradictory architectural specifications |
| Data Model | D- | 4 | Missing tables, functions, or data artifacts |
| Security | S- | 6 | Missing security controls or policies |
| Testing | T- | 3 | Missing test specifications or coverage |
| Documentation | DC- | 5 | Missing documents or incomplete specifications |
| Operations | O- | 5 | Missing operational procedures or configurations |
| Integration | I- | 4 | Missing cross-component connections |

---

## 2. Architecture Gaps

### A-1: Connector Provider Inconsistency

| Field | Value |
|-------|-------|
| Gap | CONNECTOR_ARCHITECTURE.md + CONNECTOR_MATRIX.md specify Twilio, SendGrid, Slack, MongoDB, Mapbox, OpenAI. IMPLEMENTATION_ORDER.md specifies SMTP, Twilio SMS, Discord, Slack, Gmail, Reddit. |
| Impact | Notification pipeline cannot be built. Fallback chains, circuit breaker configs, rate limits all depend on specific providers. |
| Resolution | Architecture board must make binding decision. See BLOCKER B1. |
| Effort | 1-2 weeks |

### A-2: Billing Domain Absence

| Field | Value |
|-------|-------|
| Gap | Billing/invoicing referenced in events (`v2.billing.invoice.generated`), agents (billing agent), and workflows. Zero billing tables, zero billing functions, zero billing workflows in implementation plan. |
| Impact | Events referencing billing have no source. Customer-facing billing workflows cannot execute. |
| Resolution | Decision required: V2 or V2.1 scope? See BLOCKER B5. |
| Effort | 2-3 weeks (if V2) or 2 days (if V2.1) |

### A-3: No Event Schema Registry

| Field | Value |
|-------|-------|
| Gap | 85+ events defined by name, source, and consumers. Zero events have defined payload schemas. |
| Impact | Publisher-consumer contract undefined. Integration will fail on first incompatible payload. |
| Resolution | Create JSON Schema per event. See BLOCKER B9. |
| Effort | 1 week |

### A-4: Agent Naming Non-Compliance

| Field | Value |
|-------|-------|
| Gap | NAMING_CONVENTIONS §9: `v2_{domain}_{role}_agent`. All 49 agents: `{role}_v2`. |
| Impact | Agent registry, discovery, and routing depend on naming convention. |
| Resolution | Fix convention or rename agents. See BLOCKER B3. |
| Effort | 3-4 days |

### A-5: Function Naming Non-Compliance

| Field | Value |
|-------|-------|
| Gap | NAMING_CONVENTIONS §8: `v2_{domain}_{action}_{entity}` (snake_case). All 53 functions: kebab-case without `v2_` prefix. |
| Impact | Function registry and documentation will reference different names. |
| Resolution | Rename all 53 functions. See BLOCKER B7. |
| Effort | 2-3 days |

---

## 3. Data Model Gaps

### D-1: Table-to-Function Coverage Gaps

| Field | Value |
|-------|-------|
| Gap | 24 of 41 tables (58.5%) lack explicit DET+WRI function coverage. |
| Impact | Data in these tables may not be accessible via the function layer, forcing apps to bypass functions and access tables directly — violating the architecture principle that all data access goes through functions. |
| Tables Affected | customers_v2, customer_addresses_v2, technicians_v2, technician_skills_v2, accounts_v2, inventory_items_v2, ticket_attachments_v2, feedback_surveys_v2, user_sessions_v2, connectors_v2, reference_data_v2, system_settings_v2, feature_flags_v2, knowledge_categories_v2, user_roles_v2, knowledge_articles_v2, notification_templates_v2, notification_channels_v2, notifications_v2, analytics_reports_v2, analytics_schedules_v2, events_v2, audit_log_v2, operations_log |
| Resolution | Create table→function mapping matrix. Add missing DET+WRI functions where gaps exist. |
| Effort | 3 days (analysis) + 2-4 weeks (function creation) |

### D-2: Agent-to-Function Dependency Gaps

| Field | Value |
|-------|-------|
| Gap | 24 of 49 agents (49%) list zero function dependencies. |
| Impact | 24 agents cannot perform actions, cannot be tested with real data, cannot be validated against Gate 3 criteria. |
| Agents Affected | See BLOCKER B8 for full list. |
| Resolution | Assign function tools to each agent or document justification. |
| Effort | 1 week |

### D-3: Missing Notification Templates

| Field | Value |
|-------|-------|
| Gap | 30+ notifications referenced, 0 templates defined. |
| Impact | Notification workflows, `render-notification-template` function, and 6 connectors cannot be implemented. |
| Resolution | Create notification template catalog. See BLOCKER B4. |
| Effort | 1 week |

### D-4: Missing Permission Matrix

| Field | Value |
|-------|-------|
| Gap | 5 roles named, zero permissions mapped to functions, tables, apps, or agents. |
| Impact | Auth/RLS cannot be implemented. Every function, app route, and agent action requires permission mapping. |
| Resolution | Create per-function × per-role permission matrix. See BLOCKER B2. |
| Effort | 1 week |

---

## 4. Security Gaps

### S-1: No RLS Policy Documents

| Field | Value |
|-------|-------|
| Gap | BACKEND_GUIDELINES defines RLS pattern. Zero policy SQL files exist. |
| Impact | Tables deployed without RLS = data accessible to any authenticated user. |
| Resolution | Write `backend/tables/policies/*.sql` with RLS rules for all 41 tables × 5 roles. |
| Effort | 3 days |

### S-2: No CORS Configuration

| Field | Value |
|-------|-------|
| Gap | CORS mentioned as requirement. No allowed origins defined. |
| Impact | Frontend apps blocked by browser CORS policy. |
| Resolution | Define allowed origins per environment. |
| Effort | 1 day |

### S-3: No CSP Policy

| Field | Value |
|-------|-------|
| Gap | CSP mentioned as requirement. No policy defined. |
| Impact | XSS vulnerability. |
| Resolution | Define Content Security Policy header. |
| Effort | 1 day |

### S-4: No Penetration Testing

| Field | Value |
|-------|-------|
| Gap | Zero documents mention penetration testing. |
| Impact | Security baseline incomplete. |
| Resolution | Add pen test to Gate 6 criteria. |
| Effort | 2 days |

### S-5: No Incident Response Plan

| Field | Value |
|-------|-------|
| Gap | Zero documents mention incident response. |
| Impact | Delayed breach response. |
| Resolution | Document incident response procedures. |
| Effort | 3 days |

### S-6: No Vulnerability Disclosure Process

| Field | Value |
|-------|-------|
| Gap | Zero documents mention vulnerability disclosure. |
| Impact | Security researchers cannot responsibly report findings. |
| Resolution | Document disclosure process. |
| Effort | 2 days |

---

## 5. Testing Gaps

### T-1: Agent Cascade Test Scenarios Missing

| Field | Value |
|-------|-------|
| Gap | Gate 3 requires agent cascade testing. Zero cascade test scenarios defined. |
| Impact | Cascade behavior cannot be validated. |
| Resolution | Define 5 cascade test scenarios: delegation, escalation, handoff, context, error. |
| Effort | 3 days |

### T-2: Test Data Generation Strategy Missing

| Field | Value |
|-------|-------|
| Gap | No strategy for generating realistic test data across 41 tables. |
| Impact | Tests will use ad-hoc data. Results not reproducible. |
| Resolution | Define test data factories and seed scripts. |
| Effort | 3 days |

### T-3: E2E Test Environment Not Specified

| Field | Value |
|-------|-------|
| Gap | 8 business journeys (J1-J8) defined. Environment for running E2E tests not specified. |
| Impact | E2E test execution blocked. |
| Resolution | Define: staging URL, test accounts, data setup, CI integration. |
| Effort | 2 days |

---

## 6. Documentation Gaps

### DC-1: Missing Runbooks

| Field | Value |
|-------|-------|
| Gap | Zero operational runbooks documented. |
| Impact | Production operations cannot proceed. |
| Resolution | Write runbooks for all operational tasks. See BLOCKER B13. |
| Effort | 2 weeks |

### DC-2: Missing App Page Specifications

| Field | Value |
|-------|-------|
| Gap | 10 apps have high-level descriptions but zero specify pages, components, or routes. |
| Impact | FE teams will design during implementation — scope creep risk. |
| Resolution | Create page inventory per app. See BLOCKER B15. |
| Effort | 1 week |

### DC-3: Missing Monitoring Dashboard Definitions

| Field | Value |
|-------|-------|
| Gap | Observability baseline requires dashboards. None specified. |
| Impact | Cannot observe system health. |
| Resolution | Define dashboard per component category. See BLOCKER B14. |
| Effort | 1 week |

### DC-4: Missing V1→V2 Migration Plan

| Field | Value |
|-------|-------|
| Gap | Migration 0-6 define V2 schemas. No V1 source-to-target mapping. |
| Impact | Data migration cannot be executed. |
| Resolution | Create V1→V2 data mapping. See BLOCKER B10. |
| Effort | 2-3 weeks |

### DC-5: Missing Disaster Recovery Plan

| Field | Value |
|-------|-------|
| Gap | RTO/RPO set. No procedures. |
| Impact | Cannot recover from disaster. |
| Resolution | Document DR plan. See BLOCKER B6. |
| Effort | 1 week |

---

## 7. Operations Gaps

### O-1: On-Call Schedule Not Established

| Field | Value |
|-------|-------|
| Gap | Gate 6 requires on-call rotation. Not established. |
| Impact | No coverage for production incidents. |
| Resolution | Establish on-call schedule, escalation matrix, contact list. |
| Effort | 3 days |

### O-2: Infrastructure Requirements Not Specified

| Field | Value |
|-------|-------|
| Gap | No document specifies production infrastructure needs (compute, storage, network, scaling). |
| Impact | Cannot provision production environment. |
| Resolution | Define infrastructure spec per environment. |
| Effort | 1 week |

### O-3: No Backup/Restore Strategy

| Field | Value |
|-------|-------|
| Gap | Backup mentioned but no strategy documented. |
| Impact | Data loss exposure. |
| Resolution | Document backup schedule, retention, restore procedure. |
| Effort | 3 days |

### O-4: No Scaling Strategy

| Field | Value |
|-------|-------|
| Gap | Event bus throughput mentioned (100 events/s). Database, agent, workflow scaling not addressed. |
| Impact | System may not handle peak load. |
| Resolution | Document horizontal scaling strategy per component. |
| Effort | 1 week |

### O-5: No Feature Flag Configuration

| Field | Value |
|-------|-------|
| Gap | Coding standards mention feature flags. No flags defined for any component. |
| Impact | Cannot safely roll out features with gradual exposure. |
| Resolution | Define feature flags per component. See BLOCKER B22. |
| Effort | 2 days |

---

## 8. Integration Gaps

### I-1: Cross-App Navigation Not Specified

| Field | Value |
|-------|-------|
| Gap | Gate 2 requires cross-app navigation. Navigation map between 10 apps not documented. |
| Impact | Users cannot navigate between apps. |
| Resolution | Create app navigation map showing all inter-app links. |
| Effort | 2 days |

### I-2: Notification Pipeline Not Testable

| Field | Value |
|-------|-------|
| Gap | Connector divergence (Gap A-1) blocks notification pipeline integration. |
| Impact | 12 notification-allied workflows cannot be integrated. |
| Resolution | Resolve B1 first. Then define integration test for notification pipeline. |
| Effort | Part of B1 resolution |

### I-3: No End-to-End Journey Test Data

| Field | Value |
|-------|-------|
| Gap | 8 business journeys (J1-J8) defined. No seed data sets exist to support these journeys. |
| Impact | E2E tests blocked by data setup. |
| Resolution | Create seed data scripts for each business journey. |
| Effort | 3 days |

### I-4: V1/V2 Dual-Write Verification Not Specified

| Field | Value |
|-------|-------|
| Gap | V1 coexistence requires data consistency checks. No verification queries defined. |
| Impact | V1/V2 data divergence undetected during cutover. |
| Resolution | Define reconciliation queries to compare V1 and V2 data during cutover. |
| Effort | 3 days |

---

## 9. Gap Resolution Priority Matrix

```
Impact →
     │ Low (1)   Med (2)    High (3)   Critical(4)
E    ├─────────────────────────────────────────────
f     │ DC-5      O-3       O-4        A-2       Low Effort (1)
f     │ T-3       S-2 S-3   D-3 D-4    A-3 A-4   Med Effort (2)
o     │ O-5       S-4 S-5   S-1 T-2    A-1       High Effort (3)
r     │           S-6 T-1   O-2 DC-2   D-1        Very High (4)
t  →  │           I-1 I-4   DC-3       D-2 DC-1
      │           O-1                  DC-4
      │
      │ 1-2 = Defer   3-4 = Sprint       6-8 = Critical   9+ = Stop ship
      │               (resolve this sprint)

Priority Key:
  ┌─────────────────────────────────────────────┐
  │ 1-2: Monitor   │ 3-4: Sprint    │ 6-8: Track │
  │ (low urgency)  │ (resolve now)  │ (critical) │
  │─────────────────────────────────────────────┤
  │ 9+: STOP SHIP — Must resolve before any work │
  └─────────────────────────────────────────────┘
```

### Priority Assignments

| Gap | Score | Action |
|:---:|:-----:|--------|
| A-1 | 12 | 🛑 STOP SHIP — Connector architecture divergence |
| D-4 | 8 | 🔴 Track critical — Permission matrix missing |
| D-3 | 8 | 🔴 Track critical — Notification templates missing |
| A-2 | 6 | 🔴 Track — Billing domain absent |
| A-3 | 6 | 🔴 Track — Event schema registry |
| D-1 | 6 | 🔴 Track — Table→function coverage gaps |
| D-2 | 6 | 🔴 Track — Agent→function dependency gaps |
| A-4 | 6 | 🔴 Track — Agent naming non-compliance |
| A-5 | 6 | 🔴 Track — Function naming non-compliance |
| S-1 | 6 | 🔴 Track — No RLS policy documents |
| DC-4 | 6 | 🔴 Track — V1→V2 migration plan |
| S-5 | 4 | 🟡 Sprint — Incident response plan |
| O-4 | 4 | 🟡 Sprint — Scaling strategy |
| DC-1 | 4 | 🟡 Sprint — Runbooks |
| DC-2 | 4 | 🟡 Sprint — App page specifications |
| DC-3 | 4 | 🟡 Sprint — Monitoring dashboards |
| O-2 | 4 | 🟡 Sprint — Infrastructure requirements |
| T-1 | 3 | 🟡 Sprint — Agent cascade test scenarios |
| T-2 | 3 | 🟡 Sprint — Test data strategy |
| S-2 | 3 | 🟢 Monitor — CORS config |
| S-3 | 3 | 🟢 Monitor — CSP policy |
| S-4 | 3 | 🟢 Monitor — Pen testing requirement |
| S-6 | 2 | 🟢 Monitor — Vulnerability disclosure |
| O-1 | 2 | 🟢 Monitor — On-call schedule |
| I-1 | 2 | 🟢 Monitor — Cross-app navigation map |
| I-4 | 2 | 🟢 Monitor — V1/V2 dual-write verification |
| O-5 | 2 | 🟢 Monitor — Feature flags |
| T-3 | 2 | 🟢 Monitor — E2E test environment |
| DC-5 | 2 | 🟢 Monitor — DR plan |

---

> **End of GAP_ANALYSIS.md**
