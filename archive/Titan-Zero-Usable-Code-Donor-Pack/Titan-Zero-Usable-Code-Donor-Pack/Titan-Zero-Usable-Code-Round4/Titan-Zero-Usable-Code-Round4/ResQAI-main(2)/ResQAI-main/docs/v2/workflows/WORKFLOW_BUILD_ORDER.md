# RESQAI V2 — Workflow Build Order

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Build Philosophy](#1-build-philosophy)
2. [Build Phases Overview](#2-build-phases-overview)
3. [Phase 0: Infrastructure & Foundation](#3-phase-0-infrastructure--foundation)
4. [Phase 1: Tier 0 — Autonomous Workflows](#4-phase-1-tier-0--autonomous-workflows)
5. [Phase 2: Tier 1 — Entry Workflows](#5-phase-2-tier-1--entry-workflows)
6. [Phase 3: Tier 2-3 — Secondary & Tertiary Workflows](#6-phase-3-tier-2-3--secondary--tertiary-workflows)
7. [Phase 4: Tier 4-5 — Execution & Post-Processing Workflows](#7-phase-4-tier-4-5--execution--post-processing-workflows)
8. [Phase 5: Tier 6-7 — Reporting, Analytics & Quality Workflows](#8-phase-5-tier-6-7--reporting-analytics--quality-workflows)
9. [Cross-Phase Concerns](#9-cross-phase-concerns)
10. [Risk Assessment](#10-risk-assessment)
11. [Testing Strategy](#11-testing-strategy)
12. [Rollback Strategy](#12-rollback-strategy)
13. [Release Criteria](#13-release-criteria)

---

## 1. Build Philosophy

### 1.1 Grounding Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | **Build bottom-up from the dependency graph** | No workflow is built before all workflows it depends on are operational |
| 2 | **Infrastructure before logic** | Event bus, workflow registry, and orchestrator must exist before any workflow executes |
| 3 | **High-risk first** | Workflows with the most downstream impact are built and tested earliest (Tier 0-1) |
| 4 | **Autonomous before human-gated** | Fully automated workflows ship first; human-approval workflows ship after automation is proven |
| 5 | **Notification delivery last in every phase** | All workflows funnel through `notification-delivery_v2`; it ships after at least one producing workflow is ready to test |
| 6 | **Parallel within tiers** | Workflows within the same tier can be built concurrently since they share no dependency |
| 7 | **Read-only before read-write** | Analytics workflows (trend, anomaly) read events; they can be built alongside Tier 0 without blocking |
| 8 | **Every phase is independently testable** | Each phase ends with all workflows in that phase passing integration tests against mock upstream events |

### 1.2 Dependency-Tier to Build-Phase Mapping

| Dependency Tier | Build Phase | Workflows | Dependency Justification |
|:---------------:|:-----------:|-----------|--------------------------|
| — | Phase 0 | Infrastructure | Everything depends on this |
| 0 | Phase 1 | 8 autonomous | No upstream workflow deps |
| 1 | Phase 2 | 6 entry | Triggered by external events |
| 2-3 | Phase 3 | 7 secondary/tertiary | Depend on Tier 1 output events |
| 4-5 | Phase 4 | 9 execution/post-processing | Depend on Tier 2-3 output events |
| 6-7 | Phase 5 | 3 reporting/analytics/quality | Depend on all lower-tier events |

---

## 2. Build Phases Overview

```
Phase 0: Infrastructure ─────────────────────────────────────────────────
    │
    ▼
Phase 1: Tier 0 (Autonomous) ──── 8 workflows ────────────────────────
    │
    ▼
Phase 2: Tier 1 (Entry) ──────── 6 workflows ─────────────────────────
    │
    ▼
Phase 3: Tier 2-3 (Secondary) ─── 7 workflows ────────────────────────
    │
    ▼
Phase 4: Tier 4-5 (Execution) ─── 9 workflows ────────────────────────
    │
    ▼
Phase 5: Tier 6-7 (Reporting) ──── 3 workflows ───────────────────────
```

### Phase Summary

| Phase | Name | Workflows | Est. Duration | Cumulative | Risk Level |
|:-----:|------|:---------:|:-------------:|:----------:|:----------:|
| 0 | Infrastructure | — | 4 weeks | 4 weeks | High |
| 1 | Tier 0 Autonomous | 8 | 6 weeks | 10 weeks | Medium |
| 2 | Tier 1 Entry | 6 | 5 weeks | 15 weeks | Medium |
| 3 | Tier 2-3 Secondary | 7 | 5 weeks | 20 weeks | Low |
| 4 | Tier 4-5 Execution | 9 | 6 weeks | 26 weeks | Low |
| 5 | Tier 6-7 Reporting | 3 | 3 weeks | 29 weeks | Low |

**Total estimated build time:** ~29 weeks (7 months)

---

## 3. Phase 0: Infrastructure & Foundation

### 3.1 Purpose

Establish the foundational infrastructure that every workflow depends on. No workflow can execute until this phase is complete.

### 3.2 Deliverables

| Component | Description | Criticality | Estimated Effort |
|-----------|-------------|:-----------:|:----------------:|
| Event Bus | Event ingestion, routing, delivery, dead-letter queue | Critical | 2 weeks |
| Workflow Registry | Central store of workflow definitions, versions, metadata | Critical | 1 week |
| Workflow Orchestrator AI | Core engine that loads graph definitions and executes nodes | Critical | 3 weeks |
| Correlation ID Generator | Service that creates and propagates correlation IDs | High | 0.5 week |
| Audit Log Writer | Standardized audit record creation for every state transition | High | 1 week |
| Notification Channel Config | Provider configuration for email, SMS, push, in-app | High | 1 week |
| Idempotency Store | Key-value store with TTL for idempotency key dedup | Critical | 1 week |

### 3.3 Dependencies

| Component | Depends On |
|-----------|------------|
| Workflow Orchestrator AI | Event Bus, Workflow Registry, Idempotency Store |
| Correlation ID Generator | Event Bus |
| Audit Log Writer | Event Bus |
| Notification Channel Config | None (external) |

### 3.4 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Event bus design wrong | All workflows blocked | Use proven message broker (RabbitMQ/NATS/Kafka) with at-least-once semantics |
| Orchestrator AI not capable | Workflow graphs cannot execute | Build orchestrator as deterministic engine first; add AI capabilities iteratively |
| Idempotency key collision | Duplicate processing | Use UUID v4 + node_id + input_hash with 24h TTL |

### 3.5 Phase 0 Exit Criteria

- [ ] Event bus can route events with at-least-once delivery
- [ ] Workflow Registry stores and retrieves graph definitions
- [ ] Orchestrator can load a graph, execute all node types, and emit completion events
- [ ] Correlation ID flows through a test workflow end-to-end
- [ ] Audit log entries are created for all state transitions
- [ ] Idempotency store rejects duplicate event processing
- [ ] Notification channel integrations (email, SMS) return success/failure

---

## 4. Phase 1: Tier 0 — Autonomous Workflows

### 4.1 Workflows in This Phase

| # | Workflow | Category | Trigger | Has Human Gate? | Est. Effort |
|:-:|----------|----------|---------|:---------------:|:-----------:|
| 1 | `ticket-auto-response_v2` | Ticket Lifecycle | `ticket.created` | No | 2 weeks |
| 2 | `sla-enforcement_v2` | SLA Lifecycle | `ticket.created` + 1min cron | No | 3 weeks |
| 3 | `trend-analysis_v2` | Analytics Lifecycle | Daily cron 4AM | No | 2 weeks |
| 4 | `anomaly-detection_v2` | Analytics Lifecycle | Hourly cron + events | No | 2 weeks |
| 5 | `workflow-health-monitor_v2` | Automation Lifecycle | 5min cron + events | Yes (system pause) | 3 weeks |
| 6 | `user-provisioning_v2` | Administration | `user.created` | Yes (deactivation) | 2 weeks |
| 7 | `system-config-management_v2` | Administration | Manual UI | Yes (all changes) | 2 weeks |
| 8 | `inventory-reorder_v2` | Inventory Lifecycle | Daily cron 6AM | Yes (PO approval) | 2 weeks |

### 4.2 Build Order Within Phase

```
Week 1-2:  ticket-auto-response_v2 (simplest, standalone)
           sla-enforcement_v2 (highest downstream impact)
           Parallel: user-provisioning_v2, inventory-reorder_v2

Week 3-4:  workflow-health-monitor_v2 (monitors all others — build early)
           system-config-management_v2
           Parallel: trend-analysis_v2, anomaly-detection_v2

Week 5-6:  Integration testing across all 8 Tier-0 workflows
           End-to-end tests with mock events
```

### 4.3 Shared Infrastructure Requirements

| Requirement | Provided By |
|-------------|-------------|
| Cron scheduler | Workflow Orchestrator (cron trigger type) |
| Event subscription | Event Bus |
| Template rendering | notification-delivery_v2 (not yet built — use direct send in this phase) |

### 4.4 Unique Challenges

| Workflow | Challenge | Mitigation |
|----------|-----------|------------|
| `sla-enforcement_v2` | Continuous monitoring loop — not event-driven | Implement as cron-based polling with 1min interval; each tick checks all active SLA timers |
| `trend-analysis_v2` | Large data volumes; statistical computation | Batch processing with configurable window; paginated queries |
| `workflow-health-monitor_v2` | Must bootstrap before other workflows produce real events | Ship with synthetic test data; verify recovery logic |

### 4.5 Notification Strategy (Phase 1)

Since `notification-delivery_v2` ships in Phase 3, Phase 1 workflows send notifications via direct provider calls. These will be migrated to `notification-delivery_v2` in Phase 4.

### 4.6 Phase 1 Exit Criteria

- [ ] All 8 Tier-0 workflows execute without error against test data
- [ ] `ticket-auto-response_v2` correctly matches FAQ articles and sends auto-response
- [ ] `sla-enforcement_v2` detects SLA breach within 1min of deadline
- [ ] `trend-analysis_v2` produces trend report from 30 days of synthetic events
- [ ] `anomaly-detection_v2` detects injected anomaly patterns
- [ ] `workflow-health-monitor_v2` detects simulated workflow failures and triggers recovery
- [ ] `user-provisioning_v2` provisions test user with correct roles
- [ ] `system-config-management_v2` applies and rolls back config changes
- [ ] `inventory-reorder_v2` triggers reorder when stock drops below threshold
- [ ] All human gates functional (approve/reject/timeout)

---

## 5. Phase 2: Tier 1 — Entry Workflows

### 5.1 Workflows in This Phase

| # | Workflow | Category | Trigger | Has Human Gate? | Est. Effort | Depends On |
|:-:|----------|----------|---------|:---------------:|:-----------:|------------|
| 1 | `ticket-intake_v2` | Ticket Lifecycle | `ticket.created` | Yes (draft approval) | 4 weeks | Tier 0 infrastructure |
| 2 | `appointment-booking_v2` | Appointment Lifecycle | `appointment.created` | No | 3 weeks | Tier 0 infrastructure |
| 3 | `dispute-resolution_v2` | Resolution Lifecycle | `dispute.created` | Yes (all resolutions) | 3 weeks | Tier 0 infrastructure |
| 4 | `knowledge-article-lifecycle_v2` | Knowledge Lifecycle | Manual + cron | Yes (category approval) | 2 weeks | Tier 0 infrastructure |
| 5 | `daily-standup_v2` | Operations Monitoring | Cron weekdays 8AM | No | 2 weeks | Tier 0 infrastructure |
| 6 | `operations-coordination_v2` | Operations Monitoring | Manual UI | Yes (task assignment) | 2 weeks | Tier 0 infrastructure |

### 5.2 Build Order Within Phase

```
Week 1-2:  ticket-intake_v2 (highest complexity, most downstream impact)
           Parallel: knowledge-article-lifecycle_v2, daily-standup_v2

Week 3-4:  appointment-booking_v2
           dispute-resolution_v2
           Parallel: operations-coordination_v2

Week 5:    Integration testing
           Cross-workflow chains (ticket → appointment)
```

### 5.3 Agent Dependencies

| Workflow | Agents Required | Agent Status |
|----------|----------------|-------------|
| `ticket-intake_v2` | `support-request-classifier_v2`, `support-reply-drafter_v2`, `knowledge-article-suggester_v2` | V1 exists, needs V2 upgrade |
| `appointment-booking_v2` | `scheduling-technician-suggester_v2`, `scheduling-appointment-scheduler_v2` | New V2 agents |
| `dispute-resolution_v2` | `resolution-advisor_v2`, `qa-compliance-monitor_v2` | V1 exists, needs V2 upgrade |
| `knowledge-article-lifecycle_v2` | `knowledge-manager_v2`, `knowledge-curator_v2` | New V2 agents |
| `daily-standup_v2` | `operations-coordinator_v2` | V1 exists, needs V2 upgrade |
| `operations-coordination_v2` | `operations-coordinator_v2` | V1 exists, needs V2 upgrade |

**Agent build must be partially completed before or alongside Phase 2.** Agents with V1 existence (classifier, reply-drafter, resolution-advisor, coordinator) can be used with V2 upgrades; new V2 agents must be built from scratch.

### 5.4 Unique Challenges

| Workflow | Challenge | Mitigation |
|----------|-----------|------------|
| `ticket-intake_v2` | Most complex workflow in the system; 4 agents + 3 functions + human gate | Build incrementally: classification → drafting → approval → notification |
| `dispute-resolution_v2` | Dual-path confidence routing; compliance check in parallel | Implement deterministic routing first; add parallel compliance in second iteration |

### 5.5 Phase 2 Exit Criteria

- [ ] All 6 Tier-1 workflows execute without error
- [ ] `ticket-intake_v2` completes end-to-end (classify → draft → human approve → reply sent)
- [ ] `ticket-intake_v2` correctly triggers `urgent-dispatch_v2` event for critical tickets
- [ ] `ticket-intake_v2` correctly triggers `appointment-booking_v2` event for service-needed tickets
- [ ] `appointment-booking_v2` assigns technician and sends confirmation
- [ ] `dispute-resolution_v2` analyzes dispute, routes based on confidence, applies resolution after approval
- [ ] `daily-standup_v2` generates KPI summary from live data
- [ ] `operations-coordination_v2` produces priority-ordered action list
- [ ] All human gates functional across all workflows

---

## 6. Phase 3: Tier 2-3 — Secondary & Tertiary Workflows

### 6.1 Workflows in This Phase

| # | Workflow | Category | Tier | Trigger | Has Human Gate? | Est. Effort | Depends On |
|:-:|----------|----------|:----:|---------|:---------------:|:-----------:|------------|
| 1 | `notification-delivery_v2` | Notification Lifecycle | T2 | `notification.send` | No | 3 weeks | Phase 0 infrastructure |
| 2 | `ticket-escalation_v2` | Ticket Lifecycle | T2 | `ticket.escalated` | Yes (L3+ escalation) | 2 weeks | `ticket-intake_v2` events |
| 3 | `urgent-dispatch_v2` | Dispatch Lifecycle | T2 | `ticket.classified` (urgent) | Yes (emergency override) | 3 weeks | `ticket-intake_v2` events |
| 4 | `appointment-reminders_v2` | Appointment Lifecycle | T3 | `appointment.confirmed` | No | 2 weeks | `appointment-booking_v2` events |
| 5 | `standard-dispatch_v2` | Dispatch Lifecycle | T3 | `appointment.assigned` | No | 2 weeks | `appointment-booking_v2` events |
| 6 | `followup-management_v2` | CRM Lifecycle | T3 | `followup.created` + events | No | 3 weeks | `appointment-booking_v2` + `dispute-resolution_v2` events |
| 7 | `customer-satisfaction-monitor_v2` | Customer Experience | T3 | `appointment.completed`, `ticket.closed`, `dispute.resolved` | No | 2 weeks | Events from Phase 2 workflows |

### 6.2 Build Order Within Phase

```
Week 1-2:  notification-delivery_v2 (ALL workflows depend on this)
           Parallel: ticket-escalation_v2, standard-dispatch_v2

Week 3-4:  urgent-dispatch_v2 (critical path — emergency response)
           appointment-reminders_v2
           Parallel: followup-management_v2, customer-satisfaction-monitor_v2

Week 5:    Integration testing
           End-to-end chains through all 3 tiers
           Migrate Phase 1-2 direct notification calls to notification-delivery_v2
```

### 6.3 Critical Migration: Notification Consolidation

This phase includes the `notification-delivery_v2` workflow. After it ships, ALL Phase 1 and Phase 2 workflows must be updated to emit `notification.send` events instead of calling notification providers directly.

| Phase | Workflows to Migrate | Migration Effort |
|-------|---------------------|:----------------:|
| Phase 1 | `ticket-auto-response_v2`, `sla-enforcement_v2`, `user-provisioning_v2`, `system-config-management_v2`, `inventory-reorder_v2` | 1 week |
| Phase 2 | `ticket-intake_v2`, `appointment-booking_v2`, `dispute-resolution_v2`, `daily-standup_v2`, `operations-coordination_v2` | 1 week |

### 6.4 Unique Challenges

| Workflow | Challenge | Mitigation |
|----------|-----------|------------|
| `urgent-dispatch_v2` | Real-time response requirements; multi-level escalation with timeouts | Build deterministic dispatch loop first (acknowledge → reject → reassign); add emergency protocol second |
| `notification-delivery_v2` | Single point of failure for all outbound communication | Hot-standby instance; channel fallback chain; circuit breaker on provider failure |
| `followup-management_v2` | Consumes events from 4+ different sources; complex state model | Build core followup lifecycle first; add multi-source event handling incrementally |

### 6.5 Phase 3 Exit Criteria

- [ ] `notification-delivery_v2` delivers all notification types across all channels
- [ ] `notification-delivery_v2` handles channel fallback and retry correctly
- [ ] All Phase 1-2 workflows migrated to use `notification-delivery_v2`
- [ ] `urgent-dispatch_v2` dispatches technician within 60min worst-case
- [ ] `urgent-dispatch_v2` escalates correctly on no-acknowledgment and multiple rejects
- [ ] `appointment-reminders_v2` sends all 3 reminder types at correct intervals
- [ ] `followup-management_v2` creates, tracks, and completes followups from all source events
- [ ] `customer-satisfaction-monitor_v2` sends survey within 5min of service completion
- [ ] Complete critical path: ticket → dispatch → notification works end-to-end

---

## 7. Phase 4: Tier 4-5 — Execution & Post-Processing Workflows

### 7.1 Workflows in This Phase

| # | Workflow | Category | Tier | Trigger | Has Human Gate? | Est. Effort | Depends On |
|:-:|----------|----------|:----:|---------|:---------------:|:-----------:|------------|
| 1 | `appointment-completion_v2` | Appointment Lifecycle | T4 | `appointment.completed` | No | 2 weeks | Phase 3 workflows |
| 2 | `work-order-fulfillment_v2` | Work Order Lifecycle | T4 | `work_order.created` | No | 3 weeks | `appointment-completion_v2` |
| 3 | `dispute-escalation_v2` | Resolution Lifecycle | T4 | `dispute.escalated` | Yes (legal escalation) | 2 weeks | `dispute-resolution_v2` |
| 4 | `knowledge-gap-detection_v2` | Knowledge Lifecycle | T4 | `knowledge.gap.detected` | Yes (article approval) | 2 weeks | `ticket-intake_v2` events |
| 5 | `feedback-analysis_v2` | Customer Experience | T4 | `feedback.submitted` | No | 2 weeks | `customer-satisfaction-monitor_v2` |
| 6 | `work-order-verification_v2` | Work Order Lifecycle | T5 | `work_order.completed` | Yes (QA issue) | 2 weeks | `work-order-fulfillment_v2` |
| 7 | `account-health-scan_v2` | CRM Lifecycle | T5 | Daily cron 2AM | No | 3 weeks | Phase 2-3 events |
| 8 | `followup-slippage-detector_v2` | CRM Lifecycle | T5 | Cron weekdays 6AM | No | 2 weeks | `followup-management_v2` events |
| 9 | `retention-campaign_v2` | CRM Lifecycle | T5 | `account.health.changed` (critical) | Yes (offers > $500) | 3 weeks | `account-health-scan_v2` + `feedback-analysis_v2` |

### 7.2 Build Order Within Phase

```
Week 1-2:  appointment-completion_v2 (gateway to work order lifecycle)
           feedback-analysis_v2
           Parallel: knowledge-gap-detection_v2, dispute-escalation_v2

Week 3-4:  work-order-fulfillment_v2 (depends on appointment-completion)
           account-health-scan_v2 (daily cron — standalone but complex)
           followup-slippage-detector_v2
           Parallel: retention-campaign_v2

Week 5-6:  work-order-verification_v2 (depends on fulfillment)
           End-to-end integration: full ticket→appt→work-order→verification chain
           CRM health chain: scan→slippage→retention
```

### 7.3 Complex Workflow Chains

#### Chain 1: Full Service Resolution (longest critical path)
```
ticket-auto-response_v2 (T0)
  → ticket-intake_v2 (T1)
    → appointment-booking_v2 (T1)
      → appointment-reminders_v2 (T3)
      → appointment-completion_v2 (T4)
        → work-order-fulfillment_v2 (T4)
          → work-order-verification_v2 (T5)
            → customer-satisfaction-monitor_v2 (T3)
              → feedback-analysis_v2 (T4)
                → account-health-scan_v2 (T5)
                  → retention-campaign_v2 (T5)
```

#### Chain 2: Dispute Resolution
```
dispute-resolution_v2 (T1)
  → dispute-escalation_v2 (T4)
    → followup-management_v2 (T3)
      → followup-slippage-detector_v2 (T5)
        → account-health-scan_v2 (T5)
          → retention-campaign_v2 (T5)
```

#### Chain 3: CRM Health Monitoring
```
account-health-scan_v2 (T5) [daily cron]
  → followup-management_v2 (T3)
  → followup-slippage-detector_v2 (T5)
    → retention-campaign_v2 (T5)
```

### 7.4 Unique Challenges

| Workflow | Challenge | Mitigation |
|----------|-----------|------------|
| `work-order-fulfillment_v2` | Stage-tracking with technician-driven transitions; no AI orchestration | Build as deterministic state machine; stage transitions are technician events, not AI decisions |
| `account-health-scan_v2` | Heavy data volume (all accounts); batch processing with per-account scoring | Implement paginated batch processing; configurable batch size; retry failed accounts individually |
| `retention-campaign_v2` | Multi-channel outreach with 14-day campaign window; escalation at multiple points | Build campaign state machine first; add multi-channel orchestration second; hard timeout at 14 days |

### 7.5 Phase 4 Exit Criteria

- [ ] All 9 workflows execute without error
- [ ] Full ticket→appointment→work-order chain completes end-to-end
- [ ] Dispute chain: resolution → escalation → followup works correctly
- [ ] CRM health chain: scan → slippage detection → retention campaign works
- [ ] `work-order-fulfillment_v2` tracks all stage transitions from travelling to completed
- [ ] `account-health-scan_v2` scores all accounts and correctly detects risk signals
- [ ] `retention-campaign_v2` executes multi-channel outreach with correct timing
- [ ] All human gates across all workflows functional with correct timeout behavior
- [ ] No circular dependencies exist in running system

---

## 8. Phase 5: Tier 6-7 — Reporting, Analytics & Quality Workflows

### 8.1 Workflows in This Phase

| # | Workflow | Category | Tier | Trigger | Has Human Gate? | Est. Effort | Depends On |
|:-:|----------|----------|:----:|---------|:---------------:|:-----------:|------------|
| 1 | `report-generation_v2` | Reporting Lifecycle | T6 | Cron + manual + events | No | 3 weeks | All lower-tier events |
| 2 | `report-distribution_v2` | Reporting Lifecycle | T6 | `report.generated` | No | 2 weeks | `report-generation_v2` |
| 3 | `quality-review_v2` | Quality Lifecycle | T7 | `qa.audit.triggered` + events | Yes (all violations) | 3 weeks | Events from all tiers |

### 8.2 Build Order Within Phase

```
Week 1-2:  report-generation_v2
           Parallel: quality-review_v2

Week 3:    report-distribution_v2
           Full system integration testing
           End-to-end regression: all chains, all tiers
```

### 8.3 Unique Challenges

| Workflow | Challenge | Mitigation |
|----------|-----------|------------|
| `report-generation_v2` | Must query ALL domain tables; performance at scale | Pre-aggregated materialized views for standard reports; time-bounded queries for ad-hoc |
| `quality-review_v2` | Reviews content from multiple upstream sources (replies, disputes, feedback) | Implement review queue per source; parallel reviewers; auto-close expired reviews |

### 8.4 Phase 5 Exit Criteria

- [ ] All 3 workflows execute without error
- [ ] `report-generation_v2` generates all 10 defined report types
- [ ] `report-distribution_v2` delivers reports to all subscribers via correct channels
- [ ] `quality-review_v2` reviews AI-generated content and flags violations
- [ ] Full system 24h stability test passes — no workflow failures, no event loss, no circular triggers

---

## 9. Cross-Phase Concerns

### 9.1 Agent Build Dependencies

Agents required by each phase (from WORKFLOW_INTERACTION_MATRIX section 2):

| Phase | Primary Agents Required | Build Status |
|-------|------------------------|--------------|
| Phase 0 | None | — |
| Phase 1 | `support-sla-monitor_v2`, `support-manager_v2`, `trend-analyzer_v2`, `predictive-modeler_v2`, `operations-manager_v2`, `automation-manager_v2`, `workflow-orchestrator_v2`, `admin-manager_v2`, `admin-system-config_v2` | 5 exist as V1, 4 are new V2 |
| Phase 2 | `support-request-classifier_v2`, `support-reply-drafter_v2`, `knowledge-article-suggester_v2`, `scheduling-technician-suggester_v2`, `scheduling-appointment-scheduler_v2`, `appointment-manager_v2`, `resolution-advisor_v2`, `qa-compliance-monitor_v2`, `qa-manager_v2`, `knowledge-manager_v2`, `knowledge-curator_v2`, `operations-coordinator_v2` | 4 exist as V1, 8 are new V2 |
| Phase 3 | `support-escalation-manager_v2`, `dispatch-coordinator_v2`, `dispatch-technician-dispatcher_v2`, `dispatch-emergency-response_v2`, `notification-channel-optimizer_v2`, `notification-template-manager_v2`, `appointment-reminder-coordinator_v2`, `crm-followup-manager_v2`, `cx-satisfaction-survey_v2` | 9 are new V2 |
| Phase 4 | `operations-work-order-manager_v2`, `cx-feedback-analyzer_v2`, `trend-analyzer_v2`, `crm-account-health-monitor_v2`, `crm-retention-specialist_v2`, `cx-winback-specialist_v2` | 6 are new V2 |
| Phase 5 | `reporting-generator_v2`, `reporting-distributor_v2`, `notification-channel-optimizer_v2`, `qa-response-quality-monitor_v2`, `qa-compliance-monitor_v2`, `qa-manager_v2` | 6 are new V2 |

**Key constraint:** Agent build team must be 1-2 phases ahead of workflow build team. By the time Phase 2 workflows are ready to test, the Phase 2 agent set must already be trained and deployed.

### 9.2 Function Build Dependencies

| Phase | Functions Required | Status |
|-------|-------------------|--------|
| Phase 1 | `check-ticket-urgency`, `update-ticket-record`, `account-health-scan`, `flag-slipping-followups`, `update-account-health-status`, `dispatch-notifications` | 6 new V2 functions |
| Phase 2 | `dispatch-notifications`, `assign-appointment-technician`, `resolve-dispute` | 3 new V2 functions |
| Phase 3 | `dispatch-notifications`, `finalize-dispatch`, `create-followup-tasks`, `fetch-upcoming-appointments` | 4 new V2 functions |
| Phase 4 | `create-operations-tasks`, `collect-resolved-tickets`, `finalize-slippage-review`, `dispatch-notifications` | 4 new V2 functions |
| Phase 5 | `dispatch-notifications` | 1 new V2 function |

### 9.3 Table Schema Readiness

| Phase | New Tables Required | Existing V2 Tables |
|-------|-------------------|-------------------|
| Phase 0 | Event store, workflow registry, idempotency store | — |
| Phase 1 | Minimal — reads existing V2 tables | `tickets_v2`, `customers_v2`, `technicians_v2`, `knowledge_articles_v2`, `inventory_items_v2`, `inventory_transactions_v2` |
| Phase 2 | `appointment_reminders_v2` (write), `dispute_evidence_v2` (read) | `appointments_v2`, `disputes_v2`, `work_orders_v2` |
| Phase 3 | `dispatches_v2` (new fields for V2), `appointment_reminders_v2` (full), `followup_attempts_v2` | `notifications_v2`, `notification_templates_v2`, `notification_channels_v2` |
| Phase 4 | `work_order_stages_v2`, `account_health_scans_v2`, `feedback_surveys_v2` | `work_orders_v2`, `accounts_v2`, `feedback_v2` |
| Phase 5 | `analytics_reports_v2`, `analytics_schedules_v2` | Existing |

### 9.4 Migration from V1

| V1 Component | V2 Replacement | Migration Phase | Strategy |
|-------------|----------------|:--------------:|----------|
| V1 agents (5 agents) | V2 agents (35 agents) | Phase 1-4 | Dual-run: V1 handles production; V2 runs shadow mode for 30 days |
| V1 workflows (11 JSON) | V2 workflows (33 graph defs) | Phase 1-5 | Build V2 alongside V1; cut over per workflow category after validation |
| V1 tables (no suffix) | V2 tables (`_v2` suffix) | Phase 0 | New tables coexist; migration scripts copy V1 data to V2 |
| V1 functions (Python) | V2 functions (Python) | Phase 1-4 | Rewrite/refactor to match V2 schema and event contracts |

### 9.5 Notification Migration

Post-Phase 3, all Phase 1 and Phase 2 workflows must be updated to route through `notification-delivery_v2`:

| Workflow | Current Method | Migration To | Effort |
|----------|---------------|-------------|:------:|
| `ticket-auto-response_v2` | Direct provider | `notification.send` event | 2 days |
| `ticket-intake_v2` | Direct provider | `notification.send` event | 2 days |
| `sla-enforcement_v2` | Direct provider | `notification.send` event | 1 day |
| `user-provisioning_v2` | Direct provider | `notification.send` event | 1 day |
| `system-config-management_v2` | Direct provider | `notification.send` event | 1 day |
| `inventory-reorder_v2` | Direct provider | `notification.send` event | 1 day |
| `appointment-booking_v2` | Direct provider | `notification.send` event | 2 days |
| `dispute-resolution_v2` | Direct provider | `notification.send` event | 2 days |
| `daily-standup_v2` | Direct provider | `notification.send` event | 1 day |
| `operations-coordination_v2` | Direct provider | `notification.send` event | 1 day |

---

## 10. Risk Assessment

### 10.1 Risk Matrix

| ID | Risk | Phase | Probability | Impact | Severity | Mitigation |
|:--:|------|:-----:|:-----------:|:------:|:--------:|------------|
| R1 | Event bus becomes single point of failure | 0 | Low | Critical | High | Hot-standby instance; circuit breaker; dead-letter queue |
| R2 | Orchestrator AI cannot execute complex graphs | 0 | Medium | Critical | High | Build deterministic execution engine first; AI layer is additive |
| R3 | Agent quality insufficient for production | 1-2 | Medium | High | High | Rigorous prompt engineering; confidence thresholds; human fallback |
| R4 | Dual-running V1 and V2 confuses operations | All | Medium | Medium | Medium | Clear UI indicators for V1 vs V2; separate dashboards |
| R5 | Notification migration misses edge cases | 3 | Medium | Medium | Medium | Full notification audit pre- and post-migration |
| R6 | Circular dependency discovered at runtime | 4 | Low | Critical | High | Design-time graph validation; runtime cycle detection |
| R7 | Account health scan performance at scale | 4 | Medium | Medium | Medium | Batch processing with configurable size; parallel per-account |
| R8 | Retention campaign 14-day window creates long-lived state | 4 | Medium | Low | Low | Campaign state persistence; crash recovery resume |
| R9 | Third-party notification provider downtime | 3 | Medium | High | High | Multi-provider fallback chain; provider health monitoring |
| R10 | Workflow graph version drift between phases | All | Low | Medium | Medium | Workflow Registry enforces version compatibility checks |

### 10.2 Risk Heat Map

```
Probability
    │
High  │          R3
      │
Med   │    R5 R7      R4 R9
      │          R8
Low   │ R1     R6 R10
      │    R2
      └─────────────────────────►
         Low   Med    High   Critical
                     Impact
```

### 10.3 Top 3 Critical Risks

| Rank | Risk | Why Critical | Owner |
|:----:|------|-------------|-------|
| 1 | R2: Orchestrator AI cannot execute complex graphs | Every workflow depends on the orchestrator. If it fails, the entire system is blocked. | Automation Architect |
| 2 | R3: Agent quality insufficient for production | If agents produce low-confidence results, human gates reject outputs, destroying the automation value proposition. | AI/ML Team Lead |
| 3 | R6: Circular dependency at runtime | Would cause infinite loops, event storms, and system instability. WARNING: cannot happen if design-time rules are enforced. | Workflow Architect |

---

## 11. Testing Strategy

### 11.1 Test Levels Per Phase

| Level | Description | Per Phase | Tools |
|-------|-------------|:---------:|-------|
| **Unit** | Individual node execution (agent, function, decision) | All | Jest/Vitest + pytest |
| **Integration** | Workflow graph executes end-to-end with mock events | All | Workflow Orchestrator test harness |
| **Chain** | Multi-workflow chain across 2-3 tiers | Phase 2+ | Event bus test harness |
| **System** | Full end-to-end across all tiers | Phase 4-5 | Staging environment |
| **Performance** | Load test under production-simulated volume | Phase 4-5 | k6 / Artillery |
| **Chaos** | Random failures, network partitions, provider downtime | Phase 5 | Chaos Monkey |

### 11.2 Test Data Strategy

| Phase | Data Source | Volume | Approach |
|:-----:|-------------|:------:|----------|
| Phase 0-1 | Synthetic | 100-1K records | Generated by test scripts; covers all states and transitions |
| Phase 2-3 | V1 production copy (anonymized) | 10K-100K records | Snapshot of V1 data migrated to V2 schema |
| Phase 4-5 | Full V1 production copy (anonymized) | 1M+ records | Full data migration; run V2 in shadow mode alongside V1 |

### 11.3 Testing Milestones

| Milestone | Phase | Criteria |
|-----------|:-----:|----------|
| Infrastructure validated | 0 | Orchestrator executes test graph; event bus routes all test events |
| Tier 0 green | 1 | All 8 autonomous workflows pass integration tests |
| Critical chain green | 2 | Ticket→Appointment chain works end-to-end |
| Notification validated | 3 | All channels deliver; fallback works; V1-V2 notification parity confirmed |
| Full chain green | 4 | All 4 critical paths pass (ticket, dispatch, dispute, CRM health) |
| System green | 5 | 24h stability test; no errors, no circular triggers, no event loss |

### 11.4 V1/V2 Shadow Mode Testing (Phase 3-5)

For each workflow category, run V1 and V2 in shadow mode for 30 days before cutover:

| Workflow Category | V1 Comparison Metric | Shadow Duration | Cutover Condition |
|-------------------|---------------------|:---------------:|-------------------|
| Ticket Lifecycle | Classification accuracy, response time | 30 days | V2 matches or exceeds V1 accuracy + 10% margin |
| Appointment Lifecycle | Tech assignment accuracy, confirmation rate | 30 days | V2 assignment accuracy > 90% |
| Dispatch Lifecycle | Dispatch time, acknowledgment rate | 30 days | V2 dispatch time <= V1 |
| Resolution Lifecycle | Resolution confidence, human approval rate | 30 days | V2 approval rate > 80% |
| CRM Lifecycle | Health scan accuracy, followup completion | 30 days | V2 risk detection > 85% accuracy |

---

## 12. Rollback Strategy

### 12.1 Per-Phase Rollback

| Phase | Rollback Action | Impact | Recovery Time |
|:-----:|----------------|--------|:-------------:|
| 0 | Disable event bus new routing; revert to V1 message handling | All V2 workflows stop | 1h |
| 1 | Disable Tier-0 workflow triggers; V1 handles | Ticket auto-response, SLA, inventory handled by V1 | 2h |
| 2 | Disable Tier-1 workflow triggers; V1 Support Queue handles tickets | V1 agents resume classification and drafting | 4h |
| 3 | Disable notification delivery V2; revert to direct provider calls | Notification quality degrades (no fallback) | 2h |
| 4 | Disable Tier 4-5 workflow triggers | Work order, CRM, retention handled manually | 8h |
| 5 | Disable report generation/quality review | Reports and QA paused; no data loss | 1h |

### 12.2 Rollback Prerequisites

- [ ] Every phase must have a documented rollback procedure before going live
- [ ] V1 system must be kept operational until Phase 5 is fully validated
- [ ] All V2 state changes must be reversible (database transactions, compensation events)
- [ ] Rollback drill performed in staging before each phase cutover

### 12.3 Emergency Rollback

If a critical defect is discovered post-cutover:

1. **Immediate:** Disable V2 workflow trigger in Workflow Registry
2. **Within 5min:** Route all events to V1 processors
3. **Within 15min:** Revert any V2-only database changes
4. **Within 1h:** Incident post-mortem begins

---

## 13. Release Criteria

### 13.1 Per-Phase Release Gate

| Gate | Criteria | Reviewers |
|------|----------|-----------|
| Design Review | Workflow graph definition peer-reviewed | Workflow Architect + Automation Manager |
| Code Review | All nodes implemented and reviewed | Tech Lead + Senior Developer |
| Integration Test | Workflow passes all test scenarios | QA Lead |
| Chain Test | Multi-workflow chain passes (where applicable) | QA Lead + Workflow Architect |
| Performance Test | Workflow executes within latency/SLA targets | Performance Engineer |
| Security Review | No privilege escalation; data access correct | Security Engineer |
| Documentation | Workflow documented in this build order | Technical Writer |

### 13.2 Phase Completion Gates

| Phase | Gate | Criteria |
|:-----:|------|----------|
| 0 | Infrastructure Ready | All 6 infrastructure components pass integration tests |
| 1 | Tier 0 Complete | All 8 workflows pass; 24h stability test with synthetic data |
| 2 | Tier 1 Complete | All 6 workflows pass; ticket→appointment chain verified |
| 3 | Tier 2-3 Complete | All 7 workflows pass; notification migration complete; urgent dispatch < 80min |
| 4 | Tier 4-5 Complete | All 9 workflows pass; all 4 critical paths verified; CRM health chain verified |
| 5 | System Complete | All 33 workflows pass; 24h full-system stability test; V1/V2 parity confirmed |

### 13.3 Production Cutover Criteria

The entire V2 workflow system goes live when:

- [ ] All 33 workflows pass system integration tests
- [ ] All 4 critical paths verified end-to-end (ticket→resolution, urgent dispatch, dispute resolution, CRM health)
- [ ] 30 days of shadow mode testing completed with no critical discrepancies
- [ ] Rollback procedure tested in staging
- [ ] All 35 V2 agents trained and validated
- [ ] All 14 V2 functions implemented and tested
- [ ] Notification migration complete — all workflows use `notification-delivery_v2`
- [ ] Operations team trained on V2 workflow monitoring (dashboards, alerts, escalation)
- [ ] Support team trained on V2 human approval workflows
- [ ] V1 system ready as fallback

---

## Appendix A: Build Order Summary Table

| Build Order | Workflow | Phase | Tier | Effort | Depends On | Human Gate |
|:-----------:|----------|:-----:|:----:|:------:|------------|:----------:|
| 1 | Infrastructure (event bus, orchestrator, registry) | 0 | — | 4 wks | — | No |
| 2 | `ticket-auto-response_v2` | 1 | T0 | 2 wks | Infrastructure | No |
| 3 | `sla-enforcement_v2` | 1 | T0 | 3 wks | Infrastructure | No |
| 4 | `trend-analysis_v2` | 1 | T0 | 2 wks | Infrastructure | No |
| 5 | `anomaly-detection_v2` | 1 | T0 | 2 wks | Infrastructure | No |
| 6 | `workflow-health-monitor_v2` | 1 | T0 | 3 wks | Infrastructure | Yes |
| 7 | `user-provisioning_v2` | 1 | T0 | 2 wks | Infrastructure | Yes |
| 8 | `system-config-management_v2` | 1 | T0 | 2 wks | Infrastructure | Yes |
| 9 | `inventory-reorder_v2` | 1 | T0 | 2 wks | Infrastructure | Yes |
| 10 | `ticket-intake_v2` | 2 | T1 | 4 wks | Infrastructure | Yes |
| 11 | `appointment-booking_v2` | 2 | T1 | 3 wks | Infrastructure | No |
| 12 | `dispute-resolution_v2` | 2 | T1 | 3 wks | Infrastructure | Yes |
| 13 | `knowledge-article-lifecycle_v2` | 2 | T1 | 2 wks | Infrastructure | Yes |
| 14 | `daily-standup_v2` | 2 | T1 | 2 wks | Infrastructure | No |
| 15 | `operations-coordination_v2` | 2 | T1 | 2 wks | Infrastructure | Yes |
| 16 | `notification-delivery_v2` | 3 | T2 | 3 wks | Infrastructure | No |
| 17 | `ticket-escalation_v2` | 3 | T2 | 2 wks | `ticket-intake_v2` events | Yes |
| 18 | `urgent-dispatch_v2` | 3 | T2 | 3 wks | `ticket-intake_v2` events | Yes |
| 19 | `appointment-reminders_v2` | 3 | T3 | 2 wks | `appointment-booking_v2` events | No |
| 20 | `standard-dispatch_v2` | 3 | T3 | 2 wks | `appointment-booking_v2` events | No |
| 21 | `followup-management_v2` | 3 | T3 | 3 wks | Phase 1-2 events | No |
| 22 | `customer-satisfaction-monitor_v2` | 3 | T3 | 2 wks | Phase 1-2 events | No |
| 23 | `appointment-completion_v2` | 4 | T4 | 2 wks | Phase 3 events | No |
| 24 | `work-order-fulfillment_v2` | 4 | T4 | 3 wks | `appointment-completion_v2` | No |
| 25 | `dispute-escalation_v2` | 4 | T4 | 2 wks | `dispute-resolution_v2` | Yes |
| 26 | `knowledge-gap-detection_v2` | 4 | T4 | 2 wks | `ticket-intake_v2` events | Yes |
| 27 | `feedback-analysis_v2` | 4 | T4 | 2 wks | `customer-satisfaction-monitor_v2` | No |
| 28 | `work-order-verification_v2` | 4 | T5 | 2 wks | `work-order-fulfillment_v2` | Yes |
| 29 | `account-health-scan_v2` | 4 | T5 | 3 wks | Phase 2-3 events | No |
| 30 | `followup-slippage-detector_v2` | 4 | T5 | 2 wks | `followup-management_v2` | No |
| 31 | `retention-campaign_v2` | 4 | T5 | 3 wks | `account-health-scan_v2` + `feedback-analysis_v2` | Yes |
| 32 | `report-generation_v2` | 5 | T6 | 3 wks | All lower-tier events | No |
| 33 | `report-distribution_v2` | 5 | T6 | 2 wks | `report-generation_v2` | No |
| 34 | `quality-review_v2` | 5 | T7 | 3 wks | Events from all tiers | Yes |

---

## Appendix B: V1-to-V2 Workflow Mapping

| V1 Workflow | V2 Equivalent | Migration Status |
|-------------|---------------|:----------------:|
| `ticket-intake` | `ticket-intake_v2` | Full redesign: 4 agents, 3 functions, human gate |
| `ticket-escalation` | `ticket-escalation_v2` | L2/L3/L4 escalation levels, executive path |
| `appointment-booking` | `appointment-booking_v2` | Agent-suggested tech + parallel scheduling |
| `appointment-reminders` | `appointment-reminders_v2` | V2 adds technician reminders + channel optimization |
| `appointment-completion` | `appointment-completion_v2` | Work order creation + feedback trigger |
| `standard-dispatch` | `standard-dispatch_v2` | Same concept, V2 adds acknowledgment tracking |
| `urgent-dispatch` | `urgent-dispatch_v2` | Emergency protocol, multi-level escalation |
| `work-order-fulfillment` | `work-order-fulfillment_v2` | Stage-tracking state machine |
| `work-order-verification` | `work-order-verification_v2` | QA integration, auto-verify provisional |
| `dispute-resolution` | `dispute-resolution_v2` | Dual-path confidence routing |
| `account-health-scan` | `account-health-scan_v2` | Batch processing, risk signal detection |
| — | `ticket-auto-response_v2` | **New:** FAQ auto-responder |
| — | `followup-management_v2` | **New:** Full followup lifecycle |
| — | `followup-slippage-detector_v2` | **New:** Proactive slippage detection |
| — | `retention-campaign_v2` | **New:** Automated retention campaigns |
| — | `customer-satisfaction-monitor_v2` | **New:** Survey deployment + CSAT/NPS tracking |
| — | `feedback-analysis_v2` | **New:** Sentiment + theme extraction |
| — | `knowledge-article-lifecycle_v2` | **New:** Full knowledge article lifecycle |
| — | `knowledge-gap-detection_v2` | **New:** Automated gap detection + article requests |
| — | `notification-delivery_v2` | **New:** Centralized notification with channel fallback |
| — | `daily-standup_v2` | **New:** Automated KPI briefing |
| — | `operations-coordination_v2` | **New:** Cross-dept blocker detection |
| — | `sla-enforcement_v2` | **New:** Real-time SLA monitoring |
| — | `report-generation_v2` | **New:** Scheduled + ad-hoc reports |
| — | `report-distribution_v2` | **New:** Automated report distribution |
| — | `trend-analysis_v2` | **New:** Cross-domain trend detection |
| — | `anomaly-detection_v2` | **New:** Real-time anomaly detection |
| — | `quality-review_v2` | **New:** AI content QA |
| — | `user-provisioning_v2` | **New:** User lifecycle management |
| — | `system-config-management_v2` | **New:** Config change with rollback |
| — | `inventory-reorder_v2` | **New:** Automated inventory reorder |
| — | `workflow-health-monitor_v2` | **New:** Workflow execution health |
| — | `dispute-escalation_v2` | **New:** Escalated dispute handling |

---

> **End of WORKFLOW_BUILD_ORDER.md**  
> This completes Phase 1.4 — Enterprise Workflow Ecosystem documentation.  
> 7 documents produced, 33 workflows defined across 17 categories, 6 build phases.

