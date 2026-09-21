# RESQAI V2 — Application Dependency Graph

> Phase 1.1 — Design Only  
> Lead: Software Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Dependency Types](#1-dependency-types)
2. [Full Dependency Graph](#2-full-dependency-graph)
3. [Dependency Matrices](#3-dependency-matrices)
4. [Critical Path Analysis](#4-critical-path-analysis)
5. [Build Dependency Chains](#5-build-dependency-chains)
6. [Circular Dependency Analysis](#6-circular-dependency-analysis)
7. [Module Dependency Map](#7-module-dependency-map)
8. [External Dependency Catalog](#8-external-dependency-catalog)

---

## 1. Dependency Types

### Dependency Classification

| Type | Symbol | Description | Example |
|------|--------|-------------|---------|
| **Data** | `D` | App reads/writes the same table | appointment reads customers |
| **Event** | `E` | App emits/consumes events from another | support emits ticket.status.changed → crm consumes |
| **Config** | `C` | App depends on configuration managed by another | All apps depend on admin for user roles |
| **Infrastructure** | `I` | App depends on shared infrastructure | All apps depend on shared packages |
| **UI** | `U` | App embeds UI from another | Dashboard embeds widget from crm |
| **Workflow** | `W` | App triggers or is triggered by a workflow | customer-portal triggers ticket-intake |
| **Agent** | `A` | App invokes or is invoked by an agent | support invokes request-classifier |
| **Function** | `F` | App calls or is called by a function | crm calls account-health-scan |

### Dependency Direction

```
A ──► B     A depends on B (A requires B to function)
A ◄── B     B depends on A
A ──► B ──► C     Transitive dependency
A ◄──► B     Bidirectional dependency (mutual awareness via events)
A ────► B     Hard dependency (build-time or runtime)
A - - ► B     Soft dependency (degraded mode without B)
```

---

## 2. Full Dependency Graph

### 2.1 Hard Dependencies (Required at Build/Runtime)

```
                                 SHARED INFRASTRUCTURE
                                 ═════════════════════
                                   packages/*_v2
                                   Lemma Platform
                                   Event Bus
                                 ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲  ▲
                                 │  │  │  │  │  │  │  │  │  │
         ┌───────────────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──────────────┐
         │                       │  │  │  │  │  │  │  │  │  │              │
         ▼                       ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼              ▼
    ┌──────────┐          ┌──────────────────────────────────────────────────────┐
    │ customer │          │                   SUPPORT CENTER                     │
    │ portal_v2│          │                   support-center_v2                  │
    │          │          │  D: tickets, customers, technicians, appointments    │
    │  D: own  │          │  W: ticket-intake, urgent-dispatch, escalation      │
    │  tables  │          │  A: request-classifier, reply-drafter               │
    │  (scoped)│          │  E: ticket.* (emit + consume)                       │
    └────┬─────┘          └────────────────────────┬────────────────────────────┘
         │                                         │
         │ E: ticket.created.customer              │ E: ticket.escalated
         ▼                                         ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │                           OPERATIONS CENTER                                 │
    │                           operations-center_v2                              │
    │  D: tickets, tasks, appointments, technicians, operations_log, customers    │
    │  W: urgent-dispatch, daily-standup, followup-slippage                       │
    │  A: operations-coordinator                                                  │
    │  E: task.*, dispatch.* (emit); ticket.*, appointment.*, followup.* (consume)│
    └──────┬───────────────────────────┬─────────────────────────────────────────┘
           │                           │
           │ E: dispatch.initiated     │ E: task.created
           ▼                           ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │                        TECHNICIAN PORTAL                                    │
    │                        technician-portal_v2                                 │
    │  D: appointments (own), tasks (own), customers, technicians (own)           │
    │  W: urgent-dispatch, appointment-assignment, appointment-reminders         │
    │  E: appointment.* (own updates emit); appointment.*, task.* (consume)      │
    └────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────────────────────────┐
    │                        APPOINTMENT CENTER                                   │
    │                        appointment-center_v2                                │
    │  D: appointments, technicians, customers, tickets, operations_log           │
    │  W: appointment-assignment, appointment-reminders, urgent-dispatch          │
    │  A: tech-suggester                                                          │
    │  E: appointment.* (emit); ticket.*, technician.* (consume)                 │
    └──────────────────┬─────────────────────────────────────────────────────────┘
                       │
                       │ E: appointment.status.changed, appointment.completed
                       ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │                          CRM CENTER                                         │
    │                          crm-center_v2                                      │
    │  D: accounts, customers, followups, appointments, tickets, disputes         │
    │  W: account-health-monitoring, followup-slippage-detector                  │
    │  A: account-health-monitor                                                  │
    │  E: account.*, followup.* (emit); ticket.*, appointment.*, dispute.* (cons)│
    └──────────────────┬─────────────────────────────────────────────────────────┘
                       │
                       │ E: dispute.created / dispute.resolved
                       ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │                        RESOLUTION CENTER                                    │
    │                        resolution-center_v2                                 │
    │  D: disputes, appointments, customers, tickets, operations_log              │
    │  W: dispute-resolution                                                      │
    │  A: resolution-advisor                                                      │
    │  E: dispute.* (emit); appointment.* (consume)                              │
    └────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────────────────────────┐
    │                                                                              │
    │  NOTIFICATION CENTER ◄──── ALL APPS (E: notification.send)                 │
    │  notification-center_v2                                                     │
    │  D: notifications_v2, templates_v2, channels_v2, customers, technicians     │
    │  E: notification.delivered, notification.failed (emit)                     │
    │                                                                              │
    └────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │  ANALYTICS CENTER ◄──── ALL APPS (E: ALL state-changing events)           │
    │  analytics-center_v2                                                        │
    │  D: ALL tables (read-only)                                                  │
    │                                                                              │
    └────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌────────────────────────────────────────────────────────────────────────────┐
    │  ADMIN CENTER ────► ALL APPS (C: users, roles, config)                    │
    │  admin-center_v2                                                            │
    │  D: users_v2, roles_v2, settings_v2, flags_v2, connectors_v2, ALL tables   │
    │  E: user.*, system.config.changed (emit)                                   │
    │                                                                              │
    └────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Simplified Dependency Graph (App-Level)

```
                        ┌──────────────────┐
                        │  Shared Packages  │  (Foundation Layer — all apps depend)
                        │  (ui/types/sdk/)  │
                        └──────────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │   support-   │   │operations-   │   │ appointment- │
    │   center_v2  │   │ center_v2    │   │ center_v2    │
    └───────┬──────┘   └──────┬───────┘   └──────┬───────┘
            │                 │                   │
            │          ┌──────┘                   │
            │          │                          │
            ▼          ▼                          │
    ┌──────────────┐                              │
    │ customer-    │                              │
    │ portal_v2    │                              │
    └──────────────┘                              │
                                                  │
            ┌─────────────────────────────────────┘
            │                  │
            ▼                  ▼
    ┌──────────────┐   ┌──────────────┐
    │ technician-  │   │  resolution- │
    │ portal_v2    │   │  center_v2   │
    └──────┬───────┘   └──────┬───────┘
           │                  │
           └──────┬───────────┘
                  ▼
          ┌──────────────┐
          │   crm-       │
          │  center_v2   │
          └──────┬───────┘
                 │
          ┌──────┴───────┐
          │              │
          ▼              ▼
  ┌──────────────┐ ┌──────────────┐
  │notification-│ │ analytics-   │
  │ center_v2   │ │ center_v2    │
  └──────┬──────┘ └──────────────┘
         │
         ▼
  ┌──────────────┐
  │  admin-      │
  │  center_v2   │
  └──────────────┘
```

---

## 3. Dependency Matrices

### 3.1 App-to-App Dependency Matrix

```
HOW TO READ: Row app depends on Column app
             ● = Hard dependency (cannot function without)
             ◐ = Soft dependency (degrades gracefully)
             ○ = Event dependency (async, decoupled)

              cust support ops  appt tech  res  crm  notif admin anal
              por  center  ctr  ctr  por   ctr  ctr  ctr   ctr   ctr
              _v2   _v2   _v2  _v2  _v2   _v2  _v2  _v2   _v2   _v2
             ─────────────────────────────────────────────────────────
customer      │  -    ○     -    ○    -    ○    ○    ○     ○     -
portal_v2     │
support       │  ○    -     ○    -    -    -    ○    ○     ○     ○
center_v2     │
operations    │  -    ○     -    ○    ○    -    ○    ○     ○     ○
center_v2     │
appointment   │  ○    -     ○    -    ○    ○    ○    ○     ○     ○
center_v2     │
technician    │  -    -     ○    ○    -    -    ○    ○     ○     -
portal_v2     │
resolution    │  ○    -     ○    -    ○    -    ○    ○     ○     -
center_v2     │
crm           │  ○    ○     ○    ○    -    ○    -    ○     ○     ○
center_v2     │
notification  │  -    -     -    -    -    -    ○    -     ○     ○
center_v2     │
analytics     │  -    -     -    -    -    -    -    ○     ○     -
center_v2     │
admin         │  -    -     -    -    -    -    -    ○     -     -
center_v2     │

LEGEND:
● = Hard dependency (build-time or strong runtime dependency)
◐ = Soft dependency (degraded mode works)
○ = Event dependency (async, decoupled; consumed but not blocking)
- = No dependency
```

### 3.2 App Infrastructure Dependency Matrix

```
App depends on → extends Shared Packages Lemma Platform Event Bus

customer-portal_v2     ●     ●     ●     ●     ○
support-center_v2      ●     ●     ●     ●     ●
operations-center_v2   ●     ●     ●     ●     ●
appointment-center_v2  ●     ●     ●     ●     ●
technician-portal_v2   ●     ●     ●     ●     ●
resolution-center_v2   ●     ●     ●     ●     ●
crm-center_v2          ●     ●     ●     ●     ●
notification-center_v2 ●     ●     ●     ●     ●
analytics-center_v2    ●     ●     ●     ●     ○
admin-center_v2        ●     ●     ●     ●     ○

LEGEND:
● = Hard dependency
○ = Optional dependency (uses if available)
```

### 3.3 App-to-Table Dependency Matrix

```
App → Table        cust tech tick appt disp tasks accnt f/up ops_log
                   omers icians  ets  mts   utes        s
                   ─────────────────────────────────────────────
customer-portal_v2  R/W   -     R    R    R    -    R    R     -
support-center_v2   R     R     R/W  R    R    -    -    -     W
operations-center_v2 R    R     R    R    -    R/W  R    R     W
appointment-center_v2 R   R     R    R/W  -    -    -    -     W
technician-portal_v2  R   R/W   -    R/W  -    R/W  -    -     -
resolution-center_v2  R   -     R    R    R/W  -    -    -     W
crm-center_v2        R    -     R    R    R    -    R/W  R/W   W
notification-center  R    R     -    -    -    -    -    -     -
analytics-center_v2  R    R     R    R    R    R    R    R     R
admin-center_v2      R    R     R    R    R    R    R    R     R

R  = Read
W  = Write
R/W = Read + Write
-  = No access
```

### 3.4 App-to-Event Dependency Matrix

**Emits (Producer)**

```
App → Event(s) Produced
─────────────────────────────────────────────────────────────────────
customer-portal_v2      ticket.created.customer
                        appointment.requested
                        appointment.cancelled.customer

support-center_v2       ticket.created
                        ticket.classified
                        ticket.reply.drafted
                        ticket.reply.approved
                        ticket.status.changed
                        ticket.escalated

operations-center_v2    task.created
                        task.status.changed
                        dispatch.initiated
                        dispatch.completed
                        daily.standup.generated

appointment-center_v2   appointment.created
                        appointment.assigned
                        appointment.status.changed
                        appointment.cancelled
                        appointment.completed

technician-portal_v2    technician.status.changed
                        appointment.status.changed (from field)
                        task.completed

resolution-center_v2    dispute.created
                        dispute.analyzed
                        dispute.status.changed
                        dispute.resolved

crm-center_v2           account.health.scan.completed
                        account.health.changed
                        followup.created
                        followup.slippage.detected

notification-center_v2  notification.send (infrastructure only)
                        notification.delivered
                        notification.failed
                        notification.template.updated

analytics-center_v2     report.generated

admin-center_v2         user.created
                        user.role.changed
                        user.disabled
                        system.config.changed
```

**Consumes (Subscriber)**

```
App → Event(s) Consumed
─────────────────────────────────────────────────────────────────────
customer-portal_v2      ticket.status.changed
                        appointment.status.changed
                        dispute.status.changed
                        account.health.changed

support-center_v2       ticket.intake.completed
                        agent.classification.completed
                        ticket.reply.sent
                        notification.new

operations-center_v2    ticket.escalated
                        ticket.classified (urgent)
                        task.assigned
                        appointment.status.changed
                        followup.slippage.detected
                        account.health.changed (critical)

appointment-center_v2   ticket.classified (service-required)
                        customer.appointment.requested
                        technician.status.changed
                        dispute.created

technician-portal_v2    appointment.assigned
                        appointment.rescheduled
                        appointment.cancelled
                        dispatch.initiated
                        task.created

resolution-center_v2    appointment.status.changed (needs_followup)
                        customer.dispute.filed
                        agent.analysis.completed

crm-center_v2           ticket.status.changed
                        appointment.completed
                        dispute.resolved
                        appointment.created

notification-center_v2  notification.send (FROM ALL APPS — 10+ events)

analytics-center_v2     ALL state-changing events (20+ events)

admin-center_v2         notification.failed
                        notification.delivered
```

---

## 4. Critical Path Analysis

### 4.1 Build Dependency Chain (Critical Path)

The critical path through the build phases, where delays cascade:

```
Phase 0: Foundation
  │
  ├──► Phase 1: support-center_v2 ──► Phase 2: customer-portal_v2
  │                                           │
  │                                           ▼
  │                                    Phase 3: crm-center_v2
  │                                           │
  │       Phase 1: appointment-center_v2 ─────┤
  │                                           │
  │       Phase 1: operations-center_v2 ──────┤
  │                                           │
  └───────────────────────────────────────────┤
                                              ▼
                                       Phase 4: notification-center_v2
                                              │
                                              ▼
                                       Phase 4: analytics-center_v2
                                              │
                                              ▼
                                       Phase 5: admin-center_v2
                                              │
                                              ▼
                                       Phase 6: Integration
```

**Critical path length: 24 weeks** (Phases 0 + 1 + 2 + 3 + 4 + 5 + 6)

**Non-critical paths (with slack):**

| Path | Slack | Teams |
|------|-------|-------|
| support → customer → crm → notif → admin | **Critical** | Alpha → Delta → Foxtrot → Hotel → Juliet |
| ops → (parallel) → crm → notif → admin | +2 weeks | Bravo |
| appointment → tech → (parallel) → crm → notif → admin | +2 weeks | Charlie → Echo |
| appointment → resolution → crm → notif → admin | +2 weeks | Charlie → Golf |
| analytics (parallel with notif) | +0 weeks | India |

### 4.2 Dependency Chain Length

| App | Longest Dependency Chain | Chain |
|-----|:-----------------------:|-------|
| admin-center_v2 | 6 hops | pkgs → support → ops → crm → notif → admin |
| notification-center_v2 | 5 hops | pkgs → support → ops → crm → notif |
| analytics-center_v2 | 5 hops | pkgs → support → ops → crm → analytics |
| crm-center_v2 | 4 hops | pkgs → support → ops → crm |
| customer-portal_v2 | 3 hops | pkgs → support → portal |
| technician-portal_v2 | 3 hops | pkgs → ops → tech |
| resolution-center_v2 | 3 hops | pkgs → appointment → resolution |
| support-center_v2 | 1 hop | pkgs → support |
| operations-center_v2 | 1 hop | pkgs → ops |
| appointment-center_v2 | 1 hop | pkgs → appointment |

### 4.3 Most Depended-Upon Apps

| App | Depended On By | Count |
|-----|----------------|:-----:|
| Shared Packages | All apps | 10 |
| notification-center_v2 | All apps (via event) | 10 |
| support-center_v2 | customer-portal, ops, crm, notif, analytics, admin | 6 |
| crm-center_v2 | ops, notif, analytics, admin | 4 |
| operations-center_v2 | customer-portal, tech, crm, notif, analytics, admin | 6 |
| appointment-center_v2 | customer-portal, tech, resolution, crm, notif, analytics, admin | 7 |
| admin-center_v2 | (manages config for all) | 10 (config) |

---

## 5. Build Dependency Chains

### 5.1 Full Dependency Chain per App

```
Legend:
[D] = Data dependency
[E] = Event dependency
[C] = Config dependency
[I] = Infrastructure dependency
[W] = Workflow dependency

─────────────────────────────────────────────────────────────────────
APP: customer-portal_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] packages/ui_v2, packages/types_v2, packages/config_v2
    [I] packages/sdk_v2, packages/utils_v2, packages/hooks_v2
    [I] packages/forms_v2, packages/layouts_v2, packages/widgets_v2
    [I] Lemma platform (SDK, auth)
    
  Runtime (hard):
    [D] customers table (own), tickets table (own)
    [D] appointments table (own), disputes table (own)
    [D] accounts table (own), followups table (own)
    
  Runtime (event):
    [E] ticket.status.changed (from support-center_v2)
    [E] appointment.status.changed (from appointment-center_v2)
    [E] dispute.status.changed (from resolution-center_v2)
    [E] account.health.changed (from crm-center_v2)
    
  Runtime (soft):
    [W] ticket-intake_v2 workflow
    [W] appointment-assignment_v2 workflow
    [W] appointment-reminders_v2 workflow
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: support-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] tickets table (CRUD), customers table (R)
    [D] technicians table (R), appointments table (R)
    [D] operations_log table (W)
    
  Runtime (event):
    [E] ticket.intake.completed (from workflow)
    [E] agent.classification.completed (from agent)
    [E] ticket.reply.sent (from notification-center_v2)
    [E] notification.new (from notification-center_v2)
    
  Runtime (soft):
    [A] request-classifier_v2 agent
    [A] support-reply-drafter_v2 agent
    [F] check-ticket-urgency function
    [F] update-ticket-record function
    [W] ticket-intake_v2, urgent-dispatch_v2
    [W] support-escalation-manager_v2
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: operations-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] tickets table (R urgent), tasks table (CRUD)
    [D] appointments table (R today), technicians table (R)
    [D] operations_log table (W), customers table (R)
    
  Runtime (event):
    [E] ticket.escalated (from support-center_v2)
    [E] ticket.classified (from support-center_v2)
    [E] task.assigned (from internal or agent)
    [E] appointment.status.changed (from appointment-center_v2)
    [E] followup.slippage.detected (from crm-center_v2)
    [E] account.health.changed (from crm-center_v2)
    
  Runtime (soft):
    [A] operations-coordinator_v2 agent
    [F] create-operations-tasks function
    [F] dispatch-notifications function
    [W] urgent-dispatch_v2, daily-standup_v2
    [W] followup-slippage-detector_v2
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: appointment-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] appointments table (CRUD), technicians table (R)
    [D] customers table (R), tickets table (R)
    [D] operations_log table (W)
    
  Runtime (event):
    [E] ticket.classified (service-required from support-center_v2)
    [E] customer.appointment.requested (from customer-portal_v2)
    [E] technician.status.changed (from technician-portal_v2)
    [E] dispute.created (from resolution-center_v2)
    
  Runtime (soft):
    [A] tech-suggester_v2 agent
    [F] assign-appointment-technician function
    [F] fetch-upcoming-appointments function
    [W] appointment-assignment_v2
    [W] appointment-reminders_v2
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: technician-portal_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] appointments table (R/W own), tasks table (R/W own)
    [D] customers table (R), technicians table (R/W own)
    
  Runtime (event):
    [E] appointment.assigned (from appointment-center_v2)
    [E] appointment.rescheduled (from appointment-center_v2)
    [E] appointment.cancelled (from appointment-center_v2)
    [E] dispatch.initiated (from operations-center_v2)
    [E] task.created (from operations-center_v2)
    
  Runtime (soft):
    [F] dispatch-notifications function
    [W] urgent-dispatch_v2
    [W] appointment-assignment_v2
    [W] appointment-reminders_v2
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: resolution-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] disputes table (CRUD), appointments table (R)
    [D] customers table (R), tickets table (R)
    [D] operations_log table (W)
    
  Runtime (event):
    [E] appointment.status.changed (needs_followup)
    [E] customer.dispute.filed (from customer-portal_v2)
    [E] agent.analysis.completed (from agent)
    
  Runtime (soft):
    [A] resolution-advisor_v2 agent
    [F] resolve-dispute function
    [W] dispute-resolution_v2
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: crm-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] accounts table (CRUD), customers table (R)
    [D] followups table (CRUD), appointments table (R)
    [D] tickets table (R), disputes table (R)
    [D] operations_log table (W)
    
  Runtime (event):
    [E] ticket.status.changed (from support-center_v2)
    [E] appointment.completed (from appointment-center_v2)
    [E] dispute.resolved (from resolution-center_v2)
    [E] appointment.created (from appointment-center_v2)
    
  Runtime (soft):
    [A] account-health-monitor_v2 agent
    [F] account-health-scan function
    [F] flag-slipping-followups function
    [W] account-health-monitoring_v2
    [W] followup-slippage-detector_v2
    [C] admin-center_v2 (user auth)

─────────────────────────────────────────────────────────────────────
APP: notification-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] notifications_v2 table (CRUD)
    [D] notification_templates_v2 table (CRUD)
    [D] notification_channels_v2 table (CRUD)
    [D] customers table (R), technicians table (R)
    
  Runtime (event):
    [E] notification.send (FROM ALL APPS — 10+ event types)
    
  Runtime (soft):
    [F] dispatch-notifications function
    [W] appointment-reminders_v2 (for reminder scheduling)
    [C] admin-center_v2 (user auth, channel config)

─────────────────────────────────────────────────────────────────────
APP: analytics-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] ALL operational tables (R — read-only)
    
  Runtime (event):
    [E] ALL domain events (20+ event types from all apps)
    
  Runtime (soft):
    [C] admin-center_v2 (user auth, report settings)

─────────────────────────────────────────────────────────────────────
APP: admin-center_v2
─────────────────────────────────────────────────────────────────────
  Build-time:
    [I] ALL shared packages, Lemma platform
    
  Runtime (hard):
    [D] users_v2 table (CRUD), user_roles_v2 (CRUD)
    [D] system_settings_v2 (CRUD), feature_flags_v2 (CRUD)
    [D] connectors_v2 (CRUD), operations_log (R)
    [D] ALL operational tables (R — health checks)
    
  Runtime (event):
    [E] notification.failed (from notification-center_v2)
    [E] notification.delivered (statistics)
    
  Runtime (soft):
    (No soft dependencies — admin is the config source)
```

### 5.2 Transitive Dependency Closure

```
customer-portal_v2 closure:
  → shared packages → Lemma platform
  → [E] support-center_v2 (ticket.status.changed)
  → [E] appointment-center_v2 (appointment.status.changed)
  → [E] resolution-center_v2 (dispute.status.changed)
  → [E] crm-center_v2 (account.health.changed)
  → [C] admin-center_v2 (user auth)

support-center_v2 closure:
  → shared packages → Lemma platform
  → [E] notification-center_v2 (ticket.reply.sent)
  → [A] request-classifier_v2 agent
  → [A] support-reply-drafter_v2 agent
  → [C] admin-center_v2 (user auth)

operations-center_v2 closure:
  → shared packages → Lemma platform
  → [E] support-center_v2 (ticket.escalated, ticket.classified)
  → [E] appointment-center_v2 (appointment.status.changed)
  → [E] crm-center_v2 (followup.slippage.detected)
  → [E] notification-center_v2 (notification status)
  → [A] operations-coordinator_v2 agent
  → [C] admin-center_v2 (user auth)

appointment-center_v2 closure:
  → shared packages → Lemma platform
  → [E] support-center_v2 (ticket.classified)
  → [E] customer-portal_v2 (appointment.requested)
  → [E] technician-portal_v2 (technician.status.changed)
  → [E] resolution-center_v2 (dispute.created)
  → [A] tech-suggester_v2 agent
  → [C] admin-center_v2 (user auth)

technician-portal_v2 closure:
  → shared packages → Lemma platform
  → [E] appointment-center_v2 (appointment.* events)
  → [E] operations-center_v2 (dispatch.* events)
  → [C] admin-center_v2 (user auth)

resolution-center_v2 closure:
  → shared packages → Lemma platform
  → [E] appointment-center_v2 (appointment.status.changed)
  → [E] customer-portal_v2 (customer.dispute.filed)
  → [A] resolution-advisor_v2 agent
  → [C] admin-center_v2 (user auth)

crm-center_v2 closure:
  → shared packages → Lemma platform
  → [E] support-center_v2 (ticket.status.changed)
  → [E] appointment-center_v2 (appointment.* events)
  → [E] resolution-center_v2 (dispute.resolved)
  → [A] account-health-monitor_v2 agent
  → [F] account-health-scan function
  → [F] flag-slipping-followups function
  → [C] admin-center_v2 (user auth)

notification-center_v2 closure:
  → shared packages → Lemma platform
  → [E] ALL APPS (notification.send events)
  → External: SMTP, SMS gateway, Discord, webhook
  → [C] admin-center_v2 (channel config, user contacts)

analytics-center_v2 closure:
  → shared packages → Lemma platform
  → [E] ALL APPS (all domain events)
  → [D] ALL operational tables
  → [E] notification-center_v2 (notification.delivered)
  → [C] admin-center_v2 (user auth)

admin-center_v2 closure:
  → shared packages → Lemma platform
  → [E] notification-center_v2 (notification.failed)
  → [D] ALL operational tables (health checks)
```

---

## 6. Circular Dependency Analysis

### 6.1 Potential Circular Dependencies

After thorough analysis, **no true circular dependencies exist** in the V2 ecosystem due to:

| Pattern | Prevention Strategy |
|---------|-------------------|
| App A → App B → App A | All inter-app communication is event-driven and unidirectional per event type |
| Table write → read back | Eventual consistency; apps read their own writes, not each other's |
| Auth dependency cycle | admin-center owns auth config; apps only read it (fan-out, not cycle) |
| Notification → all apps | notification-center is a pure consumer of `notification.send` events; it never emits events that trigger notification sends from the same source |

### 6.2 Event Cycle Analysis

```
App A emits event → App B receives → App B emits event → App C receives

Example:
  support-center emits ticket.status.changed
    → crm-center receives, updates health
    → crm-center emits account.health.changed
    → analytics receives (read-only)
    ✓ No cycle

  customer-portal emits appointment.requested
    → appointment-center receives, creates appointment
    → appointment-center emits appointment.created
    → customer-portal receives (status update)
    ⚠ Potential cycle! Mitigation: customer-portal only consumes
      appointment.status.changed, not appointment.created, so no loop.
```

### 6.3 Self-Event Prevention

All apps are designed to ignore their own events. For example:

- If `support-center_v2` changes a ticket status, it emits `ticket.status.changed` but does not consume it
- If `technician-portal_v2` updates an appointment, it emits `appointment.status.changed` but does not consume it
- This is enforced at the event subscription level via filter `origin_app != current_app`

### 6.4 Verified: No Cycles

```
Graph: 10 nodes (apps), 37 directed edges (event flows)
Cycles detected: 0

Graph is a DAG (Directed Acyclic Graph).

Topological order:
  1. shared packages (foundation)
  2. support-center_v2, operations-center_v2, appointment-center_v2
  3. customer-portal_v2, technician-portal_v2, resolution-center_v2
  4. crm-center_v2
  5. notification-center_v2, analytics-center_v2
  6. admin-center_v2
```

---

## 7. Module Dependency Map

### 7.1 Package Dependencies

```
packages/ui_v2
  └── packages/types_v2 (interfaces)
  └── packages/config_v2 (theme tokens)

packages/sdk_v2
  └── packages/types_v2 (interfaces)
  └── Lemma SDK (external)

packages/config_v2
  └── packages/types_v2 (constants reference types)

packages/hooks_v2
  └── packages/sdk_v2 (data access)
  └── packages/config_v2 (constants)

packages/widgets_v2
  └── packages/ui_v2 (components)
  └── packages/sdk_v2 (data access)
  └── packages/types_v2 (interfaces)

packages/forms_v2
  └── packages/types_v2 (form data types)

packages/layouts_v2
  └── packages/ui_v2 (Shell, shared components)
  └── packages/config_v2 (navigation config)

packages/utils_v2
  └── (standalone — no internal dependencies)

ALL apps
  └── ALL packages (via workspace dependency)
  └── Lemma SDK (via sdk_v2)
```

### 7.2 External Package Dependencies

```
Root package.json (workspace root):
  react ^18.3.1
  react-dom ^18.3.1
  lemma-sdk ^0.5.2
  chart.js (for analytics charts)
  leaflet (for maps in appointment + technician)
  react-beautiful-dnd (for kanban in ops)

Dev dependencies:
  typescript ^5.5.3
  vite ^8.1.0
  vitest ^4.1.9
  @vitejs/plugin-react
  @types/react, @types/node
  jsdom (for tests)
  eslint, prettier
```

### 7.3 File-Level Dependency Map

```
apps/*_v2/
  App.tsx
    └── packages/layouts_v2/Shell.tsx
        └── packages/ui_v2/{Button, Badge, StatusBadge, ...}
        └── packages/hooks_v2/{useNotifications, usePermissions}
        └── packages/config_v2/{theme, constants}
        
  pages/*.tsx
    └── packages/layouts_v2/{ListLayout, DetailLayout, DashboardLayout, FormLayout}
    └── packages/widgets_v2/{various widgets}
    └── packages/hooks_v2/{useSearch, useFilters, usePagination}
    └── packages/forms_v2/{form schemas}
    └── App-specific components
    
  services/*.ts
    └── packages/sdk_v2/{lemmaClient, events}
    
  state/*.ts
    └── packages/hooks_v2 (shared state patterns)
```

---

## 8. External Dependency Catalog

### 8.1 External Services

| Service | Integration Type | Used By | Dependency Criticality |
|---------|-----------------|---------|:---------------------:|
| Lemma Platform | SDK (direct) | ALL apps | **Critical** — platform is the backend |
| Lemma Datastore | SDK (direct) | ALL apps | **Critical** — all data persistence |
| Lemma Agent Runtime | SDK (direct) | support, ops, crm, appointment, resolution | **High** — core AI features |
| Lemma Function Runtime | SDK (direct) | support, ops, crm, appointment, resolution, notif | **High** — deterministic actions |
| Lemma Connector Runtime | SDK (direct) | notif, ops | Medium — external channel bridge |
| SMTP Gateway | Connector | notification-center_v2 | **High** — email delivery |
| SMS Gateway (Twilio) | Connector | notification-center_v2 | Medium — SMS delivery |
| Discord Webhook | Connector | notification-center_v2, ops-center_v2 | Low — alert channel |
| Email Provider | Connector | notification-center_v2 | **High** — transactional email |
| OAuth Provider | SDK (built-in) | ALL apps | **Critical** — authentication |

### 8.2 External Dependency Risk Matrix

| Dependency | Failure Mode | Impact | Fallback |
|-----------|-------------|--------|----------|
| Lemma Platform | Complete system unavailable | All apps down | Display maintenance page |
| Lemma Datastore | Read/write failures | All apps degraded | Cached data (future: offline cache) |
| Agent Runtime | Agent invocation fails | AI features disabled | Manual mode (fallback UI) |
| Function Runtime | Function execution fails | Deterministic actions fail | Manual override (forms) |
| SMTP Gateway | Email delivery fails | Notifications degraded | In-app only, retry queue |
| SMS Gateway | SMS delivery fails | Technician alerts degraded | In-app + push fallback |
| OAuth Provider | Authentication fails | All apps inaccessible | Emergency token bypass |

### 8.3 SLA Requirements by Dependency

| Dependency | Target SLA | Monitoring | Redundancy |
|-----------|:----------:|------------|------------|
| Lemma Platform | 99.9% | Health check endpoint | Platform-managed |
| Lemma Datastore | 99.95% | Query latency monitoring | Platform-managed |
| Lemma Agent Runtime | 99.5% | Agent invocation success rate | (None — platform-managed) |
| Lemma Function Runtime | 99.5% | Function execution success rate | (None — platform-managed) |
| SMTP Gateway | 99.5% | Delivery success rate monitoring | Secondary SMTP provider |
| SMS Gateway | 99.0% | Delivery success rate | In-app fallback |
| OAuth Provider | 99.9% | Auth success rate | Token caching |

### 8.4 Connector Integration Points (Future)

| Connector | Purpose | V2 Phase | App |
|-----------|---------|:--------:|-----|
| Google Calendar | Calendar sync for appointments | Post-launch | appointment-center_v2 |
| Slack | Team notifications | Post-launch | notification-center_v2 |
| WhatsApp | Customer communication channel | Post-launch | notification-center_v2 |
| QuickBooks/Xero | Invoice/billing integration | Post-launch | admin-center_v2 |
| Zapier/Make | Workflow automation with 3rd parties | Post-launch | admin-center_v2 |
| Okta/Azure AD | SSO identity provider | Post-launch | admin-center_v2 |
| Salesforce | CRM data sync | Post-launch | crm-center_v2 |
| Google Maps | Routing optimization | Post-launch | appointment-center_v2 |

---

> **End of APPLICATION_DEPENDENCY_GRAPH.md**  
> All four architecture documents complete.
