# RESQAI V2 — Agent Interaction Diagram

> Phase 1.3 — Architecture Only  
> Chief AI Systems Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Interaction Design Principles](#1-interaction-design-principles)
2. [Department-Level Interaction Diagram](#2-department-level-interaction-diagram)
3. [Agent-Level Interaction Diagrams](#3-agent-level-interaction-diagrams)
4. [Primary Workflow Agent Chains](#4-primary-workflow-agent-chains)
5. [Event Flow Between Agents](#5-event-flow-between-agents)
6. [Agent Handshake Protocol](#6-agent-handshake-protocol)
7. [Cross-Department Collaboration Patterns](#7-cross-department-collaboration-patterns)

---

## 1. Interaction Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Event-Only Communication** | Agents never call each other directly. All communication happens through domain events on the event bus. |
| 2 | **Correlation ID Propagation** | Every event carries a correlation ID that chains back to the originating request, enabling end-to-end tracing. |
| 3 | **Asynchronous Handoff** | An agent emits an output event and immediately returns to idle. Downstream agents pick up the event when ready. |
| 4 | **Single Responsibility per Event** | Each event type has exactly one producing agent and one or more consuming agents. |
| 5 | **Idempotent Consumption** | All agents handle duplicate events safely (same event processed multiple times produces same result). |
| 6 | **Synchronous Only for Humans** | Direct agent-to-agent synchronous calls are forbidden. Only human interfaces may make synchronous agent requests. |
| 7 | **Timeout-Based Escalation** | If no agent consumes an event within its SLA, a timeout mechanism escalates to the next level. |

---

## 2. Department-Level Interaction Diagram

```
                      ┌─────────────────────────────────────┐
                      │          Executive AI Dept          │
                      │  Executive Director AI ──── Human   │
                      │         │                           │
                      │  Platform Orchestrator AI           │
                      └─────────┬───────────────────────────┘
                                │ strategic directives, cross-dept coordination
                                ▼
                  ┌─────────────────────────────┐
                  │      Automation Dept         │
                  │  Automation Manager AI       │
                  │    │            │            │
                  │  Workflow      Event         │
                  │  Orchestrator  Router        │
                  └─────────┬───────────────────┘
                            │ routes events between agents
          ┌─────────────────┼──────────────────────┐
          │                 │                       │
          ▼                 ▼                       ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐
  │  Support Dept  │ │ Operations    │ │    CRM Dept       │
  │                │ │ Dept          │ │                   │
  │ Support        │ │ Operations    │ │ CRM Manager AI    │
  │ Manager AI     │ │ Manager AI    │ │    │              │
  │    │           │ │    │          │ │    ├── Account    │
  │    ├──Request  │ │    ├──Coord   │ │    │   Health     │
  │    │  Classif. │ │    │  inator  │ │    │   Monitor    │
  │    ├──Reply    │ │    ├──Work    │ │    ├──Followup    │
  │    │  Drafter  │ │    │  Order   │ │    │  Manager     │
  │    ├──Escal.   │ │    │  Manager │ │    └──Retention   │
  │    │  Manager  │ │    └───────────│        Specialist  │
  │    └──SLA      │ └───────────────┘ └───────────────────┘
  │      Monitor   │         │                   │
  └────────────────┘         │                   │
          │                  ▼                   │
          │          ┌───────────────┐           │
          │          │ Dispatch Dept  │           │
          │          │                │           │
          ├──────────►Dispatch        │           │
          │          │ Manager AI     │           │
          │          │    │           │           │
          │          │    ├──Dispatch │           │
          │          │    │  Coord.   │           │
          │          │    ├──Tech     │           │
          │          │    │  Dispatch │           │
          │          │    └──Emerg.   │           │
          │          │      Response  │           │
          │          └───────────────┘           │
          │                  │                   │
          ▼                  ▼                   ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐
  │ Scheduling    │ │ Appointment   │ │   Knowledge Dept   │
  │ Dept          │ │ Dept          │ │                    │
  │               │ │               │ │ Knowledge          │
  │ Scheduling    │ │ Appointment   │ │ Manager AI         │
  │ Manager AI    │ │ Manager AI    │ │    │               │
  │    │          │ │    │          │ │    ├──Curator      │
  │    ├──Appt.   │ │    ├──Remind  │ │    └──Article      │
  │    │ Sched.   │ │    │  Coord.  │ │       Suggester   │
  │    └──Tech    │ │    └──No-Show │ └───────────────────┘
  │      Suggester│ │      Handler  │          │
  └───────────────┘ └───────────────┘          │
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │ Notification Dept     │
                  │ Notification Mgr AI   │
                  │    │                  │
                  │    ├──Channel Opt.   │
                  │    └──Template Mgr    │
                  └──────────┬───────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
  │Analytics Dept│ │ Reporting    │ │ Customer Exp.    │
  │              │ │ Dept         │ │ Dept             │
  │Analytics     │ │              │ │                  │
  │ Manager AI   │ │ Reporting    │ │ CX Manager AI    │
  │    │         │ │ Manager AI   │ │    │             │
  │    ├──Trend  │ │    │         │ │    ├──Survey     │
  │    │ Analyzer│ │    ├──Report │ │    ├──Feedback   │
  │    └──Pred.  │ │    │ Gen.    │ │    │  Analyzer  │
  │      Modeler │ │    └──Report │ │    └──Win-Back   │
  └──────────────┘ │    Distrib. │ │      Specialist  │
          │        └──────────────┘ └──────────────────┘
          │                │                  │
          └────────────────┼──────────────────┘
                           ▼
                  ┌──────────────────────┐
                  │  Administration Dept  │
                  │  Admin Manager AI     │
                  │    │                  │
                  │    ├──System Config  │
                  │    └──Connector Mgr  │
                  └──────────────────────┘
                           │
                           ▼
                  ┌──────────────────────┐
                  │  Quality Assurance   │
                  │  Dept                │
                  │  QA Manager AI       │
                  │    │                 │
                  │    ├──Response Qual.│
                  │    └──Compliance     │
                  │       Monitor        │
                  └──────────────────────┘
```

---

## 3. Agent-Level Interaction Diagrams

### 3.1 Ticket Intake Pipeline

```
CUSTOMER PORTAL / EMAIL / SOCIAL
         │
         │ ticket.created
         ▼
┌────────────────────┐
│ Event Router AI    │
│ (routes to support)│
└────────┬───────────┘
         │ ticket.created (routed)
         ▼
┌────────────────────┐
│ Request Classifier │──── (read) ────► knowledge_articles_v2
│ AI                 │◄── (results) ── Article Suggester AI (if gap)
└────────┬───────────┘
         │ ticket.classified
         ▼
┌────────────────────┐
│ Support Reply      │──── (read) ────► tickets_v2, customers_v2
│ Drafter AI         │──── (read) ────► knowledge_articles_v2
└────────┬───────────┘
         │ ticket.reply.drafted
         ▼
┌────────────────────┐
│ Response Quality   │
│ Monitor AI         │─── scores draft quality
└────────┬───────────┘
         │ (if quality >= threshold)
         ▼
┌────────────────────┐
│ Support Manager AI │── route for human approval
└────────┬───────────┘
         │ ticket.reply.approved / ticket.reply.rejected
         ▼
┌────────────────────┐
│ Notification Dept  │── send to customer
└────────────────────┘
```

### 3.2 Urgent Dispatch Pipeline

```
┌────────────────────┐
│ Request Classifier │── ticket.classified (urgency = urgent/critical)
└────────┬───────────┘
         │
         ├──► Support Escalation Manager AI (if critical)
         │
         ▼
┌────────────────────┐
│ Dispatch           │
│ Coordinator AI     │──── (read) ────► technicians_v2, tickets_v2
└────────┬───────────┘
         │ dispatch proposal
         ▼
┌────────────────────┐
│ Technician         │
│ Dispatcher AI      │── (call) ────► dispatch-notifications function
└────────┬───────────┘
         │ dispatch.sent
         ▼
    ┌─────────┐
    │Technician│◄── SMS / Push Notification
    │ (Human)  │── dispatch.acknowledged OR dispatch.declined
    └─────────┘
         │
         ├── acknowledged ──► Appointment Scheduler AI (update schedule)
         │
         └── declined ──► Dispatch Coordinator AI (reassign)
                           │
                           ▼
                      ┌────────────────────┐
                      │ Dispatch Manager AI │── if 2+ declines
                      └────────────────────┘
```

### 3.3 Account Health Monitoring Pipeline

```
SCHEDULED TRIGGER (cron 0 2 * * *)
         │
         ▼
┌────────────────────┐
│ Account Health     │── (call) ────► account-health-scan function
│ Monitor AI         │── (call) ────► flag-slipping-followups function
└────────┬───────────┘
         │
         ├── account.health.scan.completed
         │
         ├── account.health.changed
         │     │
         │     ├── (if health dropped) ──► CRM Manager AI
         │     │
         │     ├── (if critical) ──► Notification Manager AI
         │     │
         │     └── (if risk signal) ──► Retention Specialist AI
         │
         ├── followup.slippage.detected
         │     │
         │     └──► Followup Manager AI
         │
         └── account.risk.signal.detected
               │
               └──► Trend Analyzer AI
```

### 3.4 Dispute Resolution Pipeline

```
┌────────────────────┐
│ Event Router AI    │── dispute.created
└────────┬───────────┘
         ▼
┌────────────────────┐
│ Resolution Advisor │── (read) ────► disputes_v2, appointments_v2
│ AI (V2 evolved)    │── (read) ────► customers_v2, tickets_v2
└────────┬───────────┘
         │ dispute.analyzed (confidence >= 0.8)
         │     OR     dispute.escalated (confidence < 0.8)
         ▼
┌────────────────────┐
│ Compliance Monitor │── checks resolution against policy
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ QA Manager AI      │── quality review
└────────┬───────────┘
         │ dispute.approved / dispute.rejected
         ▼
┌────────────────────┐
│ Followup Manager   │── creates followup if needed
│ AI                 │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Account Health     │── updates health after resolution
│ Monitor AI         │
└────────────────────┘
```

### 3.5 Appointment Lifecycle Pipeline

```
(CUSTOMER PORTAL / AGENT)
         │
         │ appointment.created
         ▼
┌────────────────────┐
│ Technician         │
│ Suggester AI       │── ranked technician list
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Appointment        │
│ Scheduler AI       │── optimal time slot + tech assignment
└────────┬───────────┘
         │ appointment.assigned
         ▼
┌────────────────────┐
│ Notification Dept  │── notify customer + technician
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Reminder           │── schedule 24h/2h reminders
│ Coordinator AI     │
└────────┬───────────┘
         │ appointment.reminder.sent
         ▼
    ┌─────────┐
    │Technician│── appointment.started
    │ (Human)  │── appointment.completed
    └─────────┘
         │ appointment.completed
         ▼
┌────────────────────┐
│ Work Order Manager │── generate work order
│ AI                 │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Satisfaction       │── send CSAT survey
│ Survey AI          │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Followup Manager   │── create post-service followup
│ AI                 │
└────────────────────┘
```

### 3.6 Reporting and Analytics Pipeline

```
SCHEDULED TRIGGER / HUMAN REQUEST
         │
         ▼
┌────────────────────┐
│ Report Generator   │── (read) ────► ALL domain tables
│ AI                 │
└────────┬───────────┘
         │ report.generated
         ▼
┌────────────────────┐
│ Report Distributor │── (call) ────► dispatch-notifications function
│ AI                 │
└────────┬───────────┘
         │ report distributed
         ▼
┌────────────────────┐
│ Trend Analyzer AI  │── (watch) ────► ALL domain events
│                    │── detects anomalies, trends
└────────┬───────────┘
         │ analytics.anomaly.detected
         ▼
┌────────────────────┐
│ Analytics Manager  │── evaluate severity
│ AI                 │
└────────┬───────────┘
         │
         ├── (severity > threshold) ──► Notification Manager AI
         │
         └── (trend identified) ──► Report Generator AI
```

---

## 4. Primary Workflow Agent Chains

### 4.1 Ticket Intake (ticket-intake_v2)

```
Event Router AI
  → Request Classifier AI
    → Article Suggester AI (parallel, if article match needed)
    → Support Reply Drafter AI
      → Response Quality Monitor AI
        → Support Manager AI (if escalation needed)
          → HUMAN APPROVAL
            → Support Reply Drafter AI (if revisions needed)
              → Notification Manager AI
```

### 4.2 Urgent Dispatch (urgent-dispatch_v2)

```
Request Classifier AI (classifies urgent)
  → Escalation Manager AI (if critical)
    → Emergency Response AI (if emergency)
      → Dispatch Coordinator AI
        → Technician Dispatcher AI
          → HUMAN TECHNICIAN (acknowledges/declines)
            → Dispatch Coordinator AI (if declined, reassign)
              → Dispatch Manager AI (if 2+ declines)
                → Notification Manager AI
```

### 4.3 Account Health Monitoring (account-health-monitoring_v2)

```
Account Health Monitor AI (triggered by schedule)
  → (calls) account-health-scan function
  → (calls) flag-slipping-followups function
  → Followup Manager AI (for slippage)
    → CRM Manager AI (for health drops)
      → Retention Specialist AI (for at-risk accounts)
        → Notification Manager AI
```

### 4.4 Dispute Resolution (dispute-resolution_v2)

```
Event Router AI
  → Resolution Advisor AI
    → Compliance Monitor AI
      → QA Manager AI
        → HUMAN APPROVAL
          → Followup Manager AI
            → Account Health Monitor AI
```

### 4.5 Appointment Assignment (appointment-assignment_v2)

```
Event Router AI
  → Technician Suggester AI
    → Appointment Scheduler AI
      → Appointment Manager AI
        → Notification Manager AI
          → Event Router AI (confirmation received)
            → Reminder Coordinator AI
              → Work Order Manager AI (after completion)
                → Satisfaction Survey AI
                  → Followup Manager AI
```

### 4.6 Customer Satisfaction Monitoring (customer-satisfaction-monitor_v2)

```
Event Router AI (appointment.completed / ticket.closed)
  → Satisfaction Survey AI
    → Feedback Analyzer AI (after response received)
      → CX Manager AI
        → Retention Specialist AI (if negative)
          → Win-Back Specialist AI (if churned)
            → CRM Manager AI
```

---

## 5. Event Flow Between Agents

### 5.1 Support Domain Events

```
Producer                   Event                        Consumers
──────────────────────     ──────────────────────       ──────────────────────
Request Classifier AI      ticket.classified            Support Reply Drafter AI
                                                         Article Suggester AI
                                                         SLA Monitor AI
                                                         Dispatch Coordinator AI (urgent)
                                                         Request Classifier AI
                                                         Trend Analyzer AI

Support Reply Drafter AI   ticket.reply.drafted         Response Quality Monitor AI
                                                         Notification Manager AI

Escalation Manager AI      ticket.escalated             Platform Orchestrator AI
                                                         Dispatch Coordinator AI
                                                         Support Manager AI

SLA Monitor AI             ticket.sla_breached          Support Manager AI
                                                         Escalation Manager AI
                                                         Notification Manager AI
```

### 5.2 Operations Domain Events

```
Producer                   Event                        Consumers
──────────────────────     ──────────────────────       ──────────────────────
Dispatch Coordinator AI    dispatch.created             Workflow Orchestrator AI
                                                         Technician Dispatcher AI
                                                         Appointment Scheduler AI
                                                         Trend Analyzer AI

Technician Dispatcher AI   dispatch.sent                Technician (Human)
                                                         Notification Manager AI
                                                         Scheduling Manager AI

Work Order Manager AI      work_order.completed         Account Health Monitor AI
                                                         Satisfaction Survey AI
                                                         Followup Manager AI
```

### 5.3 CRM Domain Events

```
Producer                   Event                        Consumers
──────────────────────     ──────────────────────       ──────────────────────
Account Health Monitor AI  account.health.changed       CRM Manager AI
                                                         Notification Manager AI
                                                         Retention Specialist AI
                                                         Trend Analyzer AI

Followup Manager AI        followup.slippage.detected   CRM Manager AI
                                                         Operations Manager AI
                                                         Notification Manager AI

Retention Specialist AI    campaign.started             Notification Manager AI
                                                         Trend Analyzer AI
```

### 5.4 Cross-Cutting Events

```
Producer                   Event                        Consumers
──────────────────────     ──────────────────────       ──────────────────────
Trend Analyzer AI          analytics.anomaly.detected   Analytics Manager AI
                                                         CX Manager AI
                                                         QA Manager AI
                                                         Notification Manager AI

Report Generator AI        report.generated             Report Distributor AI
                                                         Analytics Manager AI
                                                         Notification Manager AI

Compliance Monitor AI      qa.compliance.violation      QA Manager AI
                                                         Admin Manager AI
                                                         Notification Manager AI

Workflow Orchestrator AI   system.workflow.failed       Automation Manager AI
                                                         Platform Orchestrator AI
                                                         Notification Manager AI
```

---

## 6. Agent Handshake Protocol

### 6.1 Standard Handshake (Event-Driven)

```
Agent A                   Event Bus                  Agent B
   │                         │                          │
   │── emit(event, {corr})──►│                          │
   │                         │── deliver(event, {corr})─►│
   │                         │                          │── process event
   │                         │                          │── emit(result, {corr})
   │                         │◄── deliver(result, {corr})│
   │                         │                          │
   │── (correlation complete)│                          │
```

### 6.2 Timeout-Based Handshake

```
Agent A                   Event Bus                  Agent B
   │                         │                          │
   │── emit(event) ─────────►│── deliver ──────────────►│
   │                         │                          │ (agent B is busy/down)
   │                         │                          │
   │── timeout T seconds ────│                          │
   │                         │                          │
   │── emit(escalate) ──────►│── deliver to Manager ───►│ Manager AI
   │                         │                          │ (handles escalation)
```

### 6.3 Guaranteed Delivery Protocol

```
Producer Agent            Event Bus                 Consumer Agent(s)
   │                         │                           │
   │── emit(event) ─────────►│                           │
   │                         │── store in events_v2 ────►│ (persisted)
   │                         │                           │
   │                         │── attempt delivery ──────►│
   │                         │◄── ack (or nack) ─────────│
   │                         │                           │
   │                         │ (if nack or timeout)      │
   │                         │── retry (up to 3x) ──────►│
   │                         │                           │
   │                         │ (if all retries fail)     │
   │                         │── emit to dead-letter ───►│ Automation Manager AI
```

---

## 7. Cross-Department Collaboration Patterns

### 7.1 Fan-Out Pattern (One Event, Multiple Consumers)

```
┌────────────────┐
│  Agent A       │
│  (Producer)    │
└───────┬────────┘
        │ event.E
        ▼
┌──────────────────────────────────────┐
│         Event Router AI              │
│  (matches subscribers for event.E)   │
└───────┬────────┬────────┬────────────┘
        │        │        │
        ▼        ▼        ▼
   ┌────────┐┌────────┐┌────────┐
   │Agent B ││Agent C ││Agent D │
   │(Dept X)││(Dept Y)││(Dept Z)│
   └────────┘└────────┘└────────┘
```

### 7.2 Sequential Chain Pattern

```
┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│Agent A │───►│Agent B │───►│Agent C │───►│Agent D │
│Worker  │    │Worker  │    │Worker  │    │Worker  │
└────────┘    └────────┘    └────────┘    └────────┘
     │             │             │             │
     └──► Event Router AI routes each output to next subscriber
```

### 7.3 Split-and-Join Pattern

```
                 ┌──────────┐
                 │  Agent A │
                 └────┬─────┘
                      │
            ┌─────────┼─────────┐
            │         │         │
            ▼         ▼         ▼
        ┌────────┐┌────────┐┌────────┐
        │Agent B ││Agent C ││Agent D │
        └────┬───┘└────┬───┘└────┬───┘
            │         │         │
            └─────────┼─────────┘
                      │ (all complete)
                      ▼
                 ┌──────────┐
                 │  Agent E │ (join)
                 └──────────┘
```

### 7.4 Escalation Pattern

```
        ┌──────────┐
        │  Agent A │ (Worker)
        └────┬─────┘
             │ confidence < threshold
             ▼
        ┌──────────┐
        │  Agent B │ (Department Manager)
        └────┬─────┘
             │ outside authority
             ▼
        ┌──────────┐
        │  Agent C │ (Platform Orchestrator)
        └────┬─────┘
             │ strategic decision
             ▼
        ┌──────────┐
        │ HUMAN    │ (Executive)
        └──────────┘
```

### 7.5 Monitoring Pattern (Observer Chain)

```
        ┌──────────────┐
        │ Observer AI  │
        │ (Agent A)    │
        └──────┬───────┘
               │ threshold breached
               ▼
        ┌──────────────┐
        │ Worker AI    │
        │ (Agent B)    │── investigates
        └──────┬───────┘
               │ confirmed issue
               ▼
        ┌──────────────┐
        │ Master AI    │
        │ (Agent C)    │── decides action
        └──────┬───────┘
               │ action required
               ▼
        ┌──────────────┐
        │ Execution AI │
        │ (Agent D)    │── executes action
        └──────────────┘
```

---

> **End of AGENT_INTERACTION_DIAGRAM.md**  
> Next document: AGENT_RESPONSIBILITY_MATRIX.md
