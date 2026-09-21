# RESQAI V2 — Blocker Register

> Phase 2.2 — Complete Build Readiness Audit  
> Chief Solution Architect & Release Manager  
> Date: 2026-06-29

---

## Table of Contents

1. [Blocker Summary](#1-blocker-summary)
2. [Critical Blockers](#2-critical-blockers)
3. [High Severity Blockers](#3-high-severity-blockers)
4. [Medium Severity Blockers](#4-medium-severity-blockers)
5. [Low Severity Blockers](#5-low-severity-blockers)
6. [Blocker Resolution Timeline](#6-blocker-resolution-timeline)

---

## 1. Blocker Summary

| Severity | Count | Must Fix Before |
|:--------:|:-----:|:---------------:|
| 🔴 Critical | 4 | Day 1 of implementation |
| 🟠 High | 6 | Sprint 1 start |
| 🟡 Medium | 8 | Sprint 3 start |
| 🟢 Low | 6 | Sprint 5 start |
| **Total** | **24** | |

### Blocker Distribution by Category

```
Category           Count
────────────────────────
Architecture         5   🔴🔴🟠🟡🟡
Security             4   🔴🟠🟡🟡
Data/Model           4   🟠🟠🟡🟡
Integration          4   🔴🟠🟡🟢
Documentation        4   🟠🟡🟡🟢
Operations           3   🟠🟠🟢
```

---

## 2. Critical Blockers

These blockers prevent **any** implementation work from beginning. Must be resolved before Sprint 1.

---

### B1 — Connector Architecture Divergence

| Field | Value |
|-------|-------|
| **ID** | B1 |
| **Severity** | 🔴 **Critical** |
| **Category** | Architecture |
| **Impact** | Architecturally Prevents: Connector implementation, notification system, fallback chains, circuit breaker config |
| **Root Cause** | CONNECTOR_ARCHITECTURE.md defines 6 providers (Twilio, SendGrid, Slack, MongoDB, Mapbox, OpenAI). IMPLEMENTATION_ORDER.md defines 6 different providers (SMTP, Twilio SMS, Discord, Slack, Gmail, Reddit). Only Twilio and Slack overlap. No decision record explaining the change. |
| **Affected Components** | `v2_*_connector` (6), `dispatch-notifications` function, 12 notification-related workflows, 9 notification-related agents, all notification templates |
| **Recommended Fix** | Convene architecture board. Make binding decision: adopt architecture providers OR implementation providers. Update all affected documents (CONNECTOR_ARCHITECTURE.md, CONNECTOR_MATRIX.md, IMPLEMENTATION_ORDER.md, SPRINT_PLAN.md, DEPENDENCY_GRAPH.md). Update trigger/event/dependency graphs. |
| **Priority** | P0 — Must fix before Sprint 1 |
| **Estimated Effort** | 1-2 weeks (1 architect + 1 BE engineer) |
| **Owner** | Chief Software Engineering Architect |
| **Status** | Open |

---

### B2 — Missing Permission Matrix

| Field | Value |
|-------|-------|
| **ID** | B2 |
| **Severity** | 🔴 **Critical** |
| **Category** | Security |
| **Impact** | Implementation-blocking: Cannot implement auth/RLS without permission mapping. Every function, app route, and agent action requires permission checks. |
| **Root Cause** | 5 roles defined. Permission naming pattern defined. But no matrix maps permissions to functions, tables, apps, or agents. Engineers will not know what permissions to require or check. |
| **Affected Components** | All 53 functions, all 10 apps, all 41 tables, all 49 agents |
| **Recommended Fix** | Create a comprehensive permission matrix document covering: (1) Per-function: required permissions, (2) Per-role: granted permissions, (3) Per-table: RLS rules, (4) Per-app-route: required permissions, (5) Per-agent-action: required permissions. Estimated 200+ permission entries across 150+ components. |
| **Priority** | P0 — Must fix before Sprint 1 |
| **Estimated Effort** | 1 week (1 security engineer + 1 architect) |
| **Owner** | Security Lead |
| **Status** | Open |

---

### B3 — Agent Naming Convention Violation

| Field | Value |
|-------|-------|
| **ID** | B3 |
| **Severity** | 🔴 **Critical** |
| **Category** | Architecture |
| **Impact** | Breaks agent registry, discovery, and routing. NAMING_CONVENTIONS.md defines `v2_{domain}_{role}_agent` (e.g., `v2_ticket_agent`). All 49 agents across all documents use `{role}_v2` (e.g., `support-manager_v2`). This is not cosmetic — agent registry, discovery service, and routing logic depend on consistent naming. |
| **Root Cause** | Either NAMING_CONVENTIONS was written after agent names were established, or agent names were created without referencing the convention. No decision record. |
| **Affected Components** | All 49 agents, agent registry service, agent discovery service, agent routing logic, SYSTEM_INTEGRATION_MATRIX.md, IMPLEMENTATION_ORDER.md |
| **Recommended Fix** | Choose direction: (A) Update NAMING_CONVENTIONS to match `{role}_v2` pattern and update agent registry logic accordingly, OR (B) Rename all 49 agents to `v2_{domain}_{role}_agent` pattern and update all 15+ documents. |
| **Priority** | P0 — Must fix before Sprint 10 (agent build sprint) |
| **Estimated Effort** | Option A: 2 days (documentation update only). Option B: 3-4 days (rename + documentation). |
| **Owner** | Chief Software Engineering Architect |
| **Status** | Open |

---

### B4 — Missing Notification Template Inventory

| Field | Value |
|-------|-------|
| **ID** | B4 |
| **Severity** | 🔴 **Critical** |
| **Category** | Data/Model |
| **Impact** | All notification workflows (12) cannot be built without template specifications. 30+ notifications referenced across documents but zero templates defined. |
| **Root Cause** | Notification templates were scoped out of Phase 1.x and Phase 2.0 documentation. No person or document owns template content. |
| **Affected Components** | 33 workflows, `dispatch-notifications` function, `render-notification-template` function, 6 connectors, all notification channels |
| **Recommended Fix** | Create notification template catalog with: (1) Template per notification type × channel, (2) Template variables and data sources, (3) Fallback channel mapping per template, (4) Character/length limits per channel, (5) Localization requirements. |
| **Priority** | P0 — Must fix before Sprint 5 (connectors start) |
| **Estimated Effort** | 1 week (1 content designer + 1 BE engineer) |
| **Owner** | Product Manager / Content Lead |
| **Status** | Open |

---

## 3. High Severity Blockers

These blockers must be resolved before the relevant sprint starts.

---

### B5 — Missing Billing & Payment Domain

| Field | Value |
|-------|-------|
| **ID** | B5 |
| **Severity** | 🟠 High |
| **Category** | Data/Model |
| **Impact** | Billing/invoicing referenced in architecture docs, events, workflows, and agents, but zero tables, functions, or workflows exist for billing. Events like `v2.billing.invoice.generated` have no source or consumer. |
| **Root Cause** | Billing domain was acknowledged in architecture planning but never migrated into table/function/workflow implementation plans. |
| **Affected Components** | `v2_billing_det_invoice` (missing), `v2_billing_wri_invoice` (missing), `v2_billing_generate_invoice_wf` (missing), invoices_v2 table (missing), billing-related events |
| **Recommended Fix** | (1) Decide: Is billing scope for V2 or V2.1? (2) If V2: Create billing tables, functions, events, and workflows. (3) Update all documents referencing billing. (4) If V2.1: Remove billing references from V2 scope to avoid confusion. |
| **Priority** | P1 — Must resolve before Sprint 3 (function design) |
| **Estimated Effort** | 2-3 weeks (if V2 scope) OR 2 days (if V2.1 scope) |
| **Owner** | Product Manager + CTO |
| **Status** | Open |

---

### B6 — Missing Disaster Recovery Plan

| Field | Value |
|-------|-------|
| **ID** | B6 |
| **Severity** | 🟠 High |
| **Category** | Operations |
| **Impact** | Gate 5 (Integration) requires DR within 1h RTO. No DR procedures documented. Production cannot be signed off. |
| **Root Cause** | RPO (5 min) and RTO (1h) targets set in MILESTONE_PLAN. Actual procedures, backup strategy, restore process, and drill schedule not documented. |
| **Affected Components** | All production infrastructure |
| **Recommended Fix** | Document: (1) Backup strategy (frequency, retention, type), (2) Restore procedures (step-by-step), (3) Failover plan (active-passive? multi-region?), (4) DR drill schedule, (5) DR team roles and contact list. |
| **Priority** | P1 — Must resolve before Sprint 14 (integration) |
| **Estimated Effort** | 1 week (1 platform engineer + 1 architect) |
| **Owner** | Platform Lead |
| **Status** | Open |

---

### B7 — Function Naming Inconsistency

| Field | Value |
|-------|-------|
| **ID** | B7 |
| **Severity** | 🟠 High |
| **Category** | Architecture |
| **Impact** | NAMING_CONVENTIONS §8: `v2_{domain}_{action}_{entity}` (snake_case). 7 Layer 1 functions use kebab-case without `v2_` prefix (e.g., `validate-ticket-input` instead of `v2_core_det_validate_ticket_input`). Remaining functions use kebab-case without `v2_` prefix (e.g., `check-ticket-urgency`, `update-ticket-record`). All 53 functions non-compliant. |
| **Root Cause** | Functions were named before NAMING_CONVENTIONS were finalized. No reconciliation pass was performed. |
| **Affected Components** | All 53 functions |
| **Recommended Fix** | Rename all 53 functions to `v2_{domain}_{action}_{entity}` pattern. Update all cross-references. |
| **Priority** | P1 — Must fix before Sprint 3 (function implementation) |
| **Estimated Effort** | 2-3 days (rename + document updates) |
| **Owner** | BE Lead |
| **Status** | Open |

---

### B8 — Agent-to-Function Dependency Gap

| Field | Value |
|-------|-------|
| **ID** | B8 |
| **Severity** | 🟠 High |
| **Category** | Dependencies |
| **Impact** | 24 of 49 agents (49%) list "none" for function calls. These agents have no defined tools. Without function dependencies, agents cannot perform actions, cannot be tested, and cannot qualify for Gate 3. |
| **Root Cause** | 24 agents were defined as "manager" or "observer" type agents that may not need direct function calls, but this was never validated. The agent-to-function mapping was never completed. |
| **Affected Components** | 24 agents (knowledge, analytics, admin, QA, reporting, CX departments + operations-work-order, crm-retention, executive, automation-event-router) |
| **Recommended Fix** | (1) For each of the 24 agents, define at minimum one function tool. (2) If agent is purely conversational (no tool access), document this explicitly with justification. (3) Update AGENT_RESPONSIBILITY_MATRIX.md and SYSTEM_INTEGRATION_MATRIX.md. |
| **Priority** | P1 — Must fix before Sprint 11 (agent build) |
| **Estimated Effort** | 1 week (1 architect + 1 agent engineer) |
| **Owner** | Agent Lead |
| **Status** | Open |

---

### B9 — No Event Schema Registry

| Field | Value |
|-------|-------|
| **ID** | B9 |
| **Severity** | 🟠 High |
| **Category** | Data/Model |
| **Impact** | 85+ events defined with names and sources but no payload schemas. Without schemas, publishers and consumers cannot agree on data contracts. Event-driven architecture will break on first integration. |
| **Root Cause** | Phase 1.x event architecture defined event catalog but deferred payload schema definition. Phase 2.0/2.1 did not address this gap. |
| **Affected Components** | All 85+ events, all event producers (functions/agents), all event consumers (workflows/agents) |
| **Recommended Fix** | Create event schema registry: (1) JSON Schema per event type, (2) Producer/consumer agreement on required fields, (3) Schema versioning strategy, (4) Backward compatibility rules. |
| **Priority** | P1 — Must fix before Sprint 3 (functions producing events) |
| **Estimated Effort** | 1 week (1 architect + all BE engineers for their events) |
| **Owner** | Chief Software Engineering Architect |
| **Status** | Open |

---

### B10 — Missing V1→V2 Data Migration Plan

| Field | Value |
|-------|-------|
| **ID** | B10 |
| **Severity** | 🟠 High |
| **Category** | Data/Model |
| **Impact** | V1 data must migrate to V2 tables before cutover. Migration 0-6 define target schemas but provide no source-to-target mapping, data transformation rules, or migration scripts. V1 coexistence strategy is defined but data migration is not. |
| **Root Cause** | Table migration scripts define only V2 schema. V1 data model was not analyzed for migration compatibility. |
| **Affected Components** | All 41 tables, V1 database schema, migration scripts |
| **Recommended Fix** | (1) Map each V1 table/column to its V2 equivalent, (2) Define data transformation rules (type changes, field splits, default values), (3) Create migration scripts or ETL pipeline, (4) Create reconciliation/validation queries. |
| **Priority** | P1 — Must fix before Sprint 1 (migration writing) |
| **Estimated Effort** | 2-3 weeks (1 data engineer + 1 BE lead) |
| **Owner** | BE Lead |
| **Status** | Open |

---

## 4. Medium Severity Blockers

Should be resolved before the affected sprint, but implementation can begin on independent work.

---

### B11 — Table-to-Function Mapping Missing

| Field | Value |
|-------|-------|
| **ID** | B11 |
| **Severity** | 🟡 Medium |
| **Category** | Documentation |
| **Impact** | 24 of 41 tables (58.5%) lack explicit DET+WRI function coverage. Engineers will discover during implementation whether data is accessible via the function layer. |
| **Recommended Fix** | Create table→function mapping matrix. For each table, identify: the function(s) that read from it, the function(s) that write to it, and any gaps. |
| **Estimated Effort** | 3 days (1 BE lead) |

---

### B12 — Agent Cascade Testing Not Defined

| Field | Value |
|-------|-------|
| **ID** | B12 |
| **Severity** | 🟡 Medium |
| **Category** | Testing |
| **Impact** | Gate 3 requires agent cascade testing (system→domain→sub-domain). No test scenarios defined for cascade behavior. |
| **Recommended Fix** | Define 5 cascade test scenarios covering: delegation, escalation, handoff, context preservation, error propagation. |
| **Estimated Effort** | 3 days (1 agent engineer) |

---

### B13 — No Runbooks for Production Operations

| Field | Value |
|-------|-------|
| **ID** | B13 |
| **Severity** | 🟡 Medium |
| **Category** | Operations |
| **Impact** | Gate 6 requires runbooks. Not written. Operations team cannot operate system. |
| **Recommended Fix** | Write runbooks for: deployment, rollback, scaling, backup, restore, incident response, health checks, log analysis. |
| **Estimated Effort** | 2 weeks (1 platform engineer) |

---

### B14 — No Monitoring Dashboard Definitions

| Field | Value |
|-------|-------|
| **ID** | B14 |
| **Severity** | 🟡 Medium |
| **Category** | Operations |
| **Impact** | Observability baseline requires dashboards. No dashboard specifications exist. |
| **Recommended Fix** | Define dashboard per component category: functions (latency, error rate, throughput), agents (confidence, escalation rate), workflows (execution time, failure rate), apps (page load, error rate), infrastructure (CPU, memory, network). |
| **Estimated Effort** | 1 week (1 platform engineer) |

---

### B15 — App Pages & Components Not Specified Per App

| Field | Value |
|-------|-------|
| **ID** | B15 |
| **Severity** | 🟡 Medium |
| **Category** | Documentation |
| **Impact** | 10 apps listed with high-level dependencies but no page inventory or component tree. FE teams will need to design pages during implementation, risking scope creep. |
| **Recommended Fix** | Create per-app page inventory with: route path, page component name, required data, user roles permitted, sub-components needed. |
| **Estimated Effort** | 1 week (1 architect + 1 FE lead) |

---

### B16 — No Test Data Generation Strategy

| Field | Value |
|-------|-------|
| **ID** | B16 |
| **Severity** | 🟡 Medium |
| **Category** | Testing |
| **Impact** | All testing requires realistic test data. No strategy for generating test data documented. |
| **Recommended Fix** | Define: test data factories, seed data scripts, data generation tools, test data lifecycle (create → use → cleanup). |
| **Estimated Effort** | 3 days (1 QA engineer + 1 BE engineer) |

---

### B17 — No CORS or CSP Configuration

| Field | Value |
|-------|-------|
| **ID** | B17 |
| **Severity** | 🟡 Medium |
| **Category** | Security |
| **Impact** | Frontend apps will fail in browser without CORS. CSP needed for XSS prevention. |
| **Recommended Fix** | Define CORS origins per environment. Define CSP policy. Implement in gateway/middleware layer. |
| **Estimated Effort** | 1 day (1 platform engineer) |

---

### B18 — No Penetration Testing Requirement

| Field | Value |
|-------|-------|
| **ID** | B18 |
| **Severity** | 🟡 Medium |
| **Category** | Security |
| **Impact** | Security baseline lacks pen testing. Production security cannot be fully validated. |
| **Recommended Fix** | Add pen test requirement to Gate 6 criteria. Budget + schedule external pen test. |
| **Estimated Effort** | 2 days (add to docs) + external vendor engagement |

---

## 5. Low Severity Blockers

Should be tracked and resolved during implementation, but do not block start.

---

### B19 — Workflow Tier Naming Inconsistency

| ID | Severity | Description | Effort |
|:--:|:--------:|-------------|:------:|
| B19 | 🟢 Low | IMPLEMENTATION_ORDER lists workflows in 4 tier groups (0, 1, 2-3, 4-5, 6-7). WORKFLOW_ARCHITECTURE uses 8 tiers (0-7). All 33 workflows should use consistent tier classification. | 1 day |

### B20 — Workflow Count Discrepancy

| ID | Severity | Description | Effort |
|:--:|:--------:|-------------|:------:|
| B20 | 🟢 Low | WORKFLOW_BUILD_ORDER.md lists 34 workflows (build order #1-34). IMPLEMENTATION_ORDER.md lists 33 workflows. One workflow is missing from implementation order. Needs reconciliation. | 1 day |

### B21 — No Incident Response Plan

| ID | Severity | Description | Effort |
|:--:|:--------:|-------------|:------:|
| B21 | 🟢 Low | Zero documents mention incident response procedures. Required for production operations. | 3 days |

### B22 — No Feature Flag Specification

| ID | Severity | Description | Effort |
|:--:|:--------:|-------------|:------:|
| B22 | 🟢 Low | Feature flag configuration mentioned in coding standards but no flags defined for any component. | 2 days |

### B23 — Agent Testing Budget Tight

| ID | Severity | Description | Effort |
|:--:|:--------:|-------------|:------:|
| B23 | 🟢 Low | Sprint 11-12: 49 agents in 4 weeks = ~6 agents/week/engineer. Agent testing adds overhead. Risk of incomplete test coverage. | 2 days (refine sprint plan) |

### B24 — V1 Decommission Plan Not Written

| ID | Severity | Description | Effort |
|:--:|:--------:|-------------|:------:|
| B24 | 🟢 Low | Post-production V1 decommission timeline (W32-36) referenced but no plan written. Can be written during Phase 7. | 1 week |

---

## 6. Blocker Resolution Timeline

```
Week 0: Implementation Freeze
  ├── B1  Connector divergence    ─── 2 weeks
  ├── B2  Permission matrix       ─── 1 week
  ├── B3  Agent naming            ─── 3 days
  ├── B4  Notification templates  ─── 1 week
  ├── B5  Billing scope decision  ─── 2 days
  ├── B7  Function naming         ─── 3 days
  ├── B9  Event schema registry   ─── 1 week
  ├── B10 V1→V2 migration plan    ─── 2-3 weeks
  └── B11 Table→function matrix   ─── 3 days

Week 2: Sprint 1 Start
  ├── B8  Agent dependencies       ─── 1 week
  └── B15 App page specs           ─── 1 week

Week 4: Sprint 3 Start
  ├── B6  DR plan                  ─── 1 week
  ├── B12 Agent cascade tests      ─── 3 days
  ├── B13 Runbooks                 ─── 2 weeks (start)
  ├── B14 Monitoring dashboards    ─── 1 week
  └── B16 Test data strategy       ─── 3 days

Week 8: Sprint 5 Start
  ├── B17 CORS/CSP                 ─── 1 day
  ├── B18 Pen testing              ─── 2 days
  ├── B19 Workflow tier naming     ─── 1 day
  └── B20 Workflow count check     ─── 1 day

Week 12: Sprint 6+ Start
  ├── B21 Incident response        ─── 3 days
  ├── B22 Feature flags            ─── 2 days
  ├── B23 Agent testing budget     ─── 2 days
  └── B24 V1 decommission plan     ─── 1 week (Phase 7)

Week 30: Production Gate
  └── All blockers must be resolved
```

---

> **End of BLOCKERS.md**
