# RESQAI V2 — Full Sequence Diagrams

> Phase B.9 — Enterprise End-to-End Integration  
> Chief Enterprise Integration Architect  
> Date: 2026-06-30

---

## Table of Contents

1. [Complete Ticket Lifecycle](#1-complete-ticket-lifecycle)
2. [Customer Self-Service → Support](#2-customer-self-service--support)
3. [Appointment Booking → Dispatch](#3-appointment-booking--dispatch)
4. [Technician Job Lifecycle](#4-technician-job-lifecycle)
5. [Dispute Resolution Process](#5-dispute-resolution-process)
6. [CRM Account Health Monitoring](#6-crm-account-health-monitoring)
7. [Analytics & Reporting Pipeline](#7-analytics--reporting-pipeline)
8. [Multi-Channel Notification Delivery](#8-multi-channel-notification-delivery)
9. [Escalation & SLA Breach Response](#9-escalation--sla-breach-response)
10. [User Provisioning & Permission Management](#10-user-provisioning--permission-management)
11. [Cross-Domain Urgent Dispatch with Work Order](#11-cross-domain-urgent-dispatch-with-work-order)
12. [Followup Slippage Detection & Recovery](#12-followup-slippage-detection--recovery)
13. [Retention Campaign Execution](#13-retention-campaign-execution)

---

## 1. Complete Ticket Lifecycle

```
Customer          Support Center        ticket-intake         Agent           Function          Notification
  │                    │               Workflow              Classifier       Layer               Layer
  │                    │                    │                    │               │                   │
  │  [Submit Ticket]   │                    │                    │               │                   │
  │───────────────────►│                    │                    │               │                   │
  │                    │                    │                    │               │                   │
  │                    │ ticket.created     │                    │               │                   │
  │                    │───────────────────►│                    │               │                   │
  │                    │                    │                    │               │                   │
  │                    │                    │ [Classify Request] │               │                   │
  │                    │                    │───────────────────►│               │                   │
  │                    │                    │                    │               │                   │
  │                    │                    │                    │──ticket.      │                   │
  │                    │                    │                    │  classified   │                   │
  │                    │                    │◄───────────────────│               │                   │
  │                    │                    │                    │               │                   │
  │                    │                    │ [Check Urgency]    │               │                   │
  │                    │                    │───────────────────────────────────►│                   │
  │                    │                    │                    │               │                   │
  │                    │                    │◄───────────────────────────────────│                   │
  │                    │                    │                    │               │                   │
  │             ┌──── Decision ────  routing = urgent/high ─────┐               │                   │
  │             │                    │                    │      │               │                   │
  │             │  [Coordinate Ops]  │                    │      │               │                   │
  │             │────────────────────│───────────────────►│      │               │                   │
  │             │                    │                    │      │               │                   │
  │             │◄───────────────────│────────────────────│      │               │                   │
  │             │                    │                    │      │               │                   │
  │             │     [Human Approval]                     │      │               │                   │
  │             │◄──── Manager reviews ticket ────────────│      │               │                   │
  │             │                    │                    │      │               │                   │
  │             │     [Resolution Advisory]               │      │               │                   │
  │             │────────────────────│───────────────────►│      │               │                   │
  │             │◄───────────────────│────────────────────│      │               │                   │
  │             │                    │                    │      │               │                   │
  │             │                    │ [Update Ticket]    │      │               │                   │
  │             │                    │───────────────────────────────────────────►│                   │
  │             │                    │                    │      │               │                   │
  │             │                    │                    │      │               │── ticket.status.   │
  │             │                    │                    │      │               │  changed           │
  │             │                    │                    │      │               │                   │
  │             │                    │ [Send Notification]│      │               │                   │
  │             │                    │───────────────────────────────────────────►│                   │
  │             │                    │                    │      │               │                   │
  │  [Receive Reply]                │                    │      │               │                   │
  │◄────────────────────────────────│────────────────────│──────│───────────────│───────────────────│
  │             │                    │                    │      │               │                   │
```

---

## 2. Customer Self-Service → Support

```
Customer          Customer Portal     Support Center     support-center      ticket-intake     Notification
                    (V2)               (V2)              Service Layer       Workflow           Layer
  │                    │                    │                    │               │                   │
  │  Login to Portal   │                    │                    │               │                   │
  │───────────────────►│                    │                    │               │                   │
  │                    │ authenticate-user  │                    │               │                   │
  │                    │───────────────────►│                    │               │                   │
  │                    │◄─── JWT Token ─────│                    │               │                   │
  │◄───────────────────│                    │                    │               │                   │
  │                    │                    │                    │               │                   │
  │  View My Tickets   │                    │                    │               │                   │
  │───────────────────►│                    │                    │               │                   │
  │                    │ listTickets()      │                    │               │                   │
  │                    │───────────────────►│                    │               │                   │
  │                    │◄── Ticket List ────│                    │               │                   │
  │◄───────────────────│                    │                    │               │                   │
  │                    │                    │                    │               │                   │
  │  Submit New Ticket │                    │                    │               │                   │
  │───────────────────►│                    │                    │               │                   │
  │                    │ createTicket()     │                    │               │                   │
  │                    │───────────────────►│                    │               │                   │
  │                    │                    │ ticket.created     │               │                   │
  │                    │                    │───────────────────────────────────►│                   │
  │                    │                    │                    │               │                   │
  │                    │                    │                    │     [Ticket Intake Workflow]    │
  │                    │                    │                    │               │                   │
  │                    │                    │ searchCustomers()  │               │                   │
  │                    │                    │◄───────────────────│               │                   │
  │                    │                    │                    │               │                   │
  │                    │◄── Ticket Created ─│                    │               │                   │
  │◄── Confirmation ───│                    │                    │               │                   │
  │                    │                    │                    │               │                   │
  │  [Receive Email]   │                    │                    │               │                   │
  │◄───────────────────────────────────────────────────────────────────────────────────────────│
  │                    │                    │                    │               │                   │
  │  Track Status      │                    │                    │               │                   │
  │───────────────────►│                    │ getTicketById()    │               │                   │
  │                    │───────────────────►│                    │               │                   │
  │                    │◄── Status Update ──│◄── workflow ───────│               │                   │
  │◄───────────────────│                    │                    │               │                   │
  │                    │                    │                    │               │                   │
```

---

## 3. Appointment Booking → Dispatch

```
Customer      Customer Portal    appointment-center   appointment-booking   Function: assign-     Notification
                                  (V2)                Workflow              appointment-technician   Layer
  │                    │                    │                    │                    │                │
  │  Request Appt      │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ appt.requested     │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │ appointment.created│                    │                │
  │                    │                    │───────────────────►│                    │                │
  │                    │                    │                    │                    │                │
  │                    │                    │ [Suggest Tech]     │                    │                │
  │                    │                    │───────────────────►│                    │                │
  │                    │                    │                    │                    │                │
  │                    │                    │                    │[assign-appointment- │                │
  │                    │                    │                    │  technician]        │                │
  │                    │                    │◄───────────────────│───────────────────►│                │
  │                    │                    │                    │                    │                │
  │                    │                    │[Create Reminder]   │                    │                │
  │                    │                    │── (parallel) ──────│────────────────────│────────────────│
  │                    │                    │                    │                    │                │
  │  [Confirmation]    │                    │                    │                    │                │
  │◄───────────────────│◄───────────────────│◄───────────────────│────────────────────│────────────────│
  │                    │                    │                    │                    │                │
  │  [SMS Reminder]    │                    │                    │                    │                │
  │◄─────────────────────────────────────────────────────────────────────────────────────────────────│
  │                    │                    │                    │                    │                │
  │  [Appointment Day] │                    │                    │                    │                │
  │◄── Technician Arrives ──────────────────│                    │                    │                │
  │                    │                    │                    │                    │                │
```

---

## 4. Technician Job Lifecycle

```
Technician    technician-portal_v2    operations-center   appointment-center   Function Layer    Notification
                                                           (appointment-                            Layer
                                                           completion)
  │                    │                    │                    │                    │                │
  │  View Jobs         │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ execute GET /api/jobs                    │                    │                │
  │◄─── Job List ──────│                    │                    │                    │                │
  │                    │                    │                    │                    │                │
  │  View Job Detail   │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ getJobById()       │                    │                    │                │
  │◄─── Full Detail ───│                    │                    │                    │                │
  │                    │                    │                    │                    │                │
  │  Accept Job        │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ job.accepted       │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │                    │                    │                │
  │  [En Route]        │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ dispatch.en_route  │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │                    │                    │                │
  │  [Arrive On Site]  │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ dispatch.on_site   │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │                    │                    │                │
  │  Upload Evidence   │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ evidence.uploaded  │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │                    │                    │                │
  │  Capture Signature │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ signature.captured │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │                    │                    │                │
  │  Complete Job      │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ dispatch.completed │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │ appointment.completed                   │                │
  │                    │                    │───────────────────►│                    │                │
  │                    │                    │                    │                    │                │
  │                    │                    │                    │ [create-work-order]│                │
  │                    │                    │                    │───────────────────►│                │
  │                    │                    │                    │                    │                │
  │                    │                    │                    │ [create-followup-  │                │
  │                    │                    │                    │  tasks]            │                │
  │                    │                    │                    │───────────────────►│                │
  │                    │                    │                    │                    │                │
  │                    │                    │  work_order.created│                    │                │
  │                    │                    │────────────────────│────────────────────│────────────────│
  │                    │                    │                    │                    │                │
  │  [Survey Sent]     │                    │                    │                    │                │
  │◄─────────────────────────────────────────────────────────────────────────────────────────────────│
  │                    │                    │                    │                    │                │
```

---

## 5. Dispute Resolution Process

```
Customer    resolution-center_v2    dispute-resolution    Agent: resolution-   Function:          Notification
                                      Workflow               advisor          resolve-dispute     Layer
  │                    │                    │                    │                    │                │
  │  File Dispute      │                    │                    │                    │                │
  │───────────────────►│                    │                    │                    │                │
  │                    │ dispute.created    │                    │                    │                │
  │                    │───────────────────►│                    │                    │                │
  │                    │                    │                    │                    │                │
  │                    │                    │ [Analyze Dispute]  │                    │                │
  │                    │                    │───────────────────►│                    │                │
  │                    │                    │                    │                    │                │
  │                    │                    │                    │──search Reddit ───│────────────────│
  │                    │                    │                    │   (research)      │                │
  │                    │                    │                    │                    │                │
  │                    │                    │◄── Recommendation ─│                    │                │
  │                    │                    │                    │                    │                │
  │                    │                    │ [Human Review]     │                    │                │
  │                    │                    │◄── Manager reviews ─────────────────────│────────────────│
  │                    │                    │                    │                    │                │
  │             ┌──── Decision: Approve or Reject ──────────────┐                    │                │
  │             │                    │                    │      │                    │                │
  │             │                    │ [Resolve Dispute]  │      │                    │                │
  │             │                    │───────────────────────────────────────────────►│                │
  │             │                    │                    │      │                    │                │
  │             │                    │                    │      │   dispute.resolved  │                │
  │             │                    │                    │      │                    │                │
  │  [Resolution Notice]            │                    │      │                    │                │
  │◄────────────────────────────────│────────────────────│──────│────────────────────│────────────────│
  │             │                    │                    │      │                    │                │
  │   [Followup Created]            │                    │      │                    │                │
  │◄─── CRM creates followup ───────│────────────────────│──────│────────────────────│────────────────│
  │             │                    │                    │      │                    │                │
```

---

## 6. CRM Account Health Monitoring

```
Schedule         account-health-scan    Function:          Function:               Function:           Agent: account-
(nightly)        Workflow               account-health-    update-account-         dispatch-           health-monitor
                                         scan              health-status           notifications
  │                    │                    │                    │                    │                    │
  │ [Cron Trigger]     │                    │                    │                    │                    │
  │───────────────────►│                    │                    │                    │                    │
  │                    │                    │                    │                    │                    │
  │                    │ [Read data]        │                    │                    │                    │
  │                    │── read disputes ───│───────────────────►│                    │                    │
  │                    │── read followups ──│───────────────────►│                    │                    │
  │                    │── read feedback ───│───────────────────►│                    │                    │
  │                    │── read tickets ────│───────────────────►│                    │                    │
  │                    │── read appts ──────│───────────────────►│                    │                    │
  │                    │                    │                    │                    │                    │
  │                    │ [Scan Complete]    │                    │                    │                    │
  │                    │◄───────────────────│                    │                    │                    │
  │                    │                    │                    │                    │                    │
  │             ┌── Health Score Changed? ──┐                    │                    │                    │
  │             │                    │      │                    │                    │                    │
  │             │  [Update Status]  │      │                    │                    │                    │
  │             │───────────────────────────│───────────────────►│                    │                    │
  │             │                    │      │                    │                    │                    │
  │             │                    │      │  account.health.   │                    │                    │
  │             │                    │      │  changed           │                    │                    │
  │             │                    │      │                    │                    │                    │
  │             │  [Flag Slipping    │      │                    │                    │                    │
  │             │   Followups]       │      │                    │                    │                    │
  │             │───────────────────────────│───────────────────►│                    │                    │
  │             │                    │      │                    │                    │                    │
  │             │            ┌── Slippage Found? ──┐            │                    │                    │
  │             │            │               │     │            │                    │                    │
  │             │            │  [Send Alert]  │     │            │                    │                    │
  │             │            │───────────────────────────────────────────────────────►│                    │
  │             │            │               │     │            │                    │                    │
  │  [CRM Alert]            │               │     │            │                    │                    │
  │◄────────────────────────│───────────────│─────│────────────│────────────────────│────────────────────│
  │             │            │               │     │            │                    │                    │
  │  [Agent Update]         │               │     │            │                    │                    │
  │◄── Account health monitor reviews ──────│─────│────────────│────────────────────│────────────────────│
  │             │            │               │     │            │                    │                    │
```

---

## 7. Analytics & Reporting Pipeline

```
Schedule        analytics-center_v2     trend-analysis      Functions:             report-generation    report-distribution
(hourly/daily)                          Workflow            batch-metric-           Workflow              Workflow
                                                            aggregation +
                                                            sync-events
  │                    │                    │                    │                    │                    │
  │ [Cron: Hourly]     │                    │                    │                    │                    │
  │───────────────────►│                    │                    │                    │                    │
  │                    │                    │                    │                    │                    │
  │                    │ [Trigger Trend]    │                    │                    │                    │
  │                    │───────────────────►│                    │                    │                    │
  │                    │                    │                    │                    │                    │
  │                    │                    │ [Batch Aggregation]│                    │                    │
  │                    │                    │───────────────────►│                    │                    │
  │                    │                    │                    │── read 40+ tables ─│                    │
  │                    │                    │                    │── compute metrics ─│                    │
  │                    │                    │                    │── write cache ─────│                    │
  │                    │                    │◄── Aggregated ─────│                    │                    │
  │                    │                    │                    │                    │                    │
  │                    │                    │ [Trend Identified] │                    │                    │
  │                    │◄── Trend Data ─────│                    │                    │                    │
  │                    │                    │                    │                    │                    │
  │                    │ [Cron: Daily]      │                    │                    │                    │
  │                    │─────────────────────────────────────────────────────────────►│                    │
  │                    │                    │                    │                    │                    │
  │                    │                    │                    │[generate-report-   │                    │
  │                    │                    │                    │ data]              │                    │
  │                    │                    │                    │───────────────────►│                    │
  │                    │                    │                    │                    │                    │
  │                    │                    │                    │◄── Report Data ────│                    │
  │                    │                    │                    │                    │                    │
  │                    │                    │                    │  report.generated  │                    │
  │                    │                    │                    │                    │───────────────────►│
  │                    │                    │                    │                    │                    │
  │                    │                    │                    │                    │[send-report]       │
  │                    │                    │                    │                    │── dispatch-        │
  │                    │                    │                    │                    │  notifications ────│
  │                    │                    │                    │                    │                    │
  │  [Report via Email]│                    │                    │                    │                    │
  │◄───────────────────│────────────────────│────────────────────│────────────────────│────────────────────│
  │                    │                    │                    │                    │                    │
```

---

## 8. Multi-Channel Notification Delivery

```
Workflow/Agent    dispatch-notifications    render-notification-    notification-channel-    Connector Layer
  (Caller)        Function                  template Function      optimizer Agent          (SMTP/SMS/Discord)
  │                    │                          │                       │                       │
  │  [Send: "New       │                          │                       │                       │
  │   Ticket #123"]    │                          │                       │                       │
  │───────────────────►│                          │                       │                       │
  │                    │                          │                       │                       │
  │                    │ [Validate Input]         │                       │                       │
  │                    │ [Check Idempotency Key]  │                       │                       │
  │                    │                          │                       │                       │
  │                    │[Read Template]           │                       │                       │
  │                    │─────────────────────────►│                       │                       │
  │                    │                          │                       │                       │
  │                    │◄── Rendered Body ────────│                       │                       │
  │                    │                          │                       │                       │
  │                    │ [Select Optimal Channel] │                       │                       │
  │                    │─────────────────────────────────────────────────►│                       │
  │                    │                          │                       │                       │
  │                    │◄── Channel: Email ───────│───────────────────────│                       │
  │                    │                          │                       │                       │
  │                    │ [Check Circuit Breaker]  │                       │                       │
  │                    │ [Rate Limiter Check]     │                       │                       │
  │                    │                          │                       │                       │
  │                    │ [Call Connector]         │                       │                       │
  │                    │───────────────────────────────────────────────────────────────►│
  │                    │                          │                       │                       │
  │                    │◄── Status: sent ─────────│───────────────────────│───────────────────────│
  │                    │                          │                       │                       │
  │                    │ [Write Notification]     │                       │                       │
  │                    │ [Emit notification.sent] │                       │                       │
  │                    │                          │                       │                       │
  │◄── Result: sent ───│                          │                       │                       │
  │                    │                          │                       │                       │
  │  [Provider Callback (async)]                  │                       │                       │
  │─────────────────────────────────────────────────────────────────────────────────────────►│
  │                    │                          │                       │                       │
  │  ◄── delivered ──────────────────────────────│───────────────────────│───────────────────────│
  │                    │                          │                       │                       │
```

---

## 9. Escalation & SLA Breach Response

```
sla-enforcement     Function:             Function:            ticket-escalation     notification-delivery
Workflow            batch-sla-check       check-sla-deadline   Workflow               Workflow
  │                    │                      │                     │                      │
  │ [Cron: 5min]       │                      │                     │                      │
  │───────────────────►│                      │                     │                      │
  │                    │                      │                     │                      │
  │                    │ [For Each Open Ticket]                     │                      │
  │                    │──────────────────────►│                     │                      │
  │                    │                      │                     │                      │
  │                    │◄── Status: OK/breach ─│                     │                      │
  │                    │                      │                     │                      │
  │            ┌── Breach Found? ──┐          │                     │                      │
  │            │              │    │          │                     │                      │
  │            │ [Emit ticket.  │    │          │                     │                      │
  │            │  sla_breached] │    │          │                     │                      │
  │            │              │    │          │                     │                      │
  │            │              │    │          │                     │                      │
  │            │              ▼    │          │                     │                      │
  │            │───────────────────────────────────────────────────►│                      │
  │            │              │    │          │                     │                      │
  │            │              │    │          │[Agent: escalation   │                      │
  │            │              │    │          │ manager reviews]    │                      │
  │            │              │    │          │                     │                      │
  │            │              │    │          │[Send Notification]  │                      │
  │            │              │    │          │───────────────────────────────────────────►│
  │            │              │    │          │                     │                      │
  │ [SLA Breach Alert]        │    │          │                     │                      │
  │◄──────────────────────────│────│──────────│─────────────────────│──────────────────────│
  │            │              │    │          │                     │                      │
  │            │ [Update Ticket] │            │                     │                      │
  │            │───────────────────────────────────────────────────►│                      │
  │            │              │    │          │  [Escalation Complete]                      │
  │            │              │    │          │                     │                      │
```

---

## 10. User Provisioning & Permission Management

```
Admin           admin-center_v2      Function:            user-provisioning     notification-delivery
                                      provision-user       Workflow               Workflow
  │                    │                    │                    │                      │
  │ [Create User]      │                    │                    │                      │
  │───────────────────►│                    │                    │                      │
  │                    │                    │                    │                      │
  │                    │[Assign Role]       │                    │                      │
  │                    │── read roles ──────│                    │                      │
  │                    │── set role ────────│                    │                      │
  │                    │                    │                    │                      │
  │                    │ user.created       │                    │                      │
  │                    │───────────────────────────────────────►│                      │
  │                    │                    │                    │                      │
  │                    │                    │ [provision-user]   │                      │
  │                    │                    │───────────────────►│                      │
  │                    │                    │                    │                      │
  │                    │                    │ [send welcome]     │                      │
  │                    │                    │───────────────────────────────────────────►│
  │                    │                    │                    │                      │
  │  [User Active]     │                    │                    │                      │
  │◄───────────────────│◄───────────────────│◄───────────────────│──────────────────────│
  │                    │                    │                    │                      │
  │  [Manage Permissions]                   │                    │                      │
  │───────────────────►│                    │                    │                      │
  │                    │[manage-permission  │                    │                      │
  │                    │ function]          │                    │                      │
  │                    │───────────────────►│                    │                      │
  │                    │                    │── read roles ──────│                      │
  │                    │                    │── write permissions│                      │
  │                    │◄── Updated ────────│                    │                      │
  │                    │                    │                    │                      │
  │                    │[assign-user-role   │                    │                      │
  │                    │ function]          │                    │                      │
  │                    │───────────────────►│                    │                      │
  │                    │◄── Role Assigned ──│                    │                      │
  │                    │                    │                    │                      │
  │  [Permission Confirmed]                │                    │                      │
  │◄───────────────────│                    │                    │                      │
  │                    │                    │                    │                      │
```

---

## 11. Cross-Domain Urgent Dispatch with Work Order

```
Ticket.created     urgent-dispatch       Agent:             Agent:           Function:          work-order-
(event)            Workflow              request-          tech-            finalize-dispatch   fulfillment
                                          classifier       suggester                            Workflow
  │                    │                    │                 │                  │                  │
  │  [ticket.created   │                    │                 │                  │                  │
  │   (urgent)]        │                    │                 │                  │                  │
  │───────────────────►│                    │                 │                  │                  │
  │                    │                    │                 │                  │                  │
  │                    │[Classify Ticket]   │                 │                  │                  │
  │                    │───────────────────►│                 │                  │                  │
  │                    │◄── classified ─────│                 │                  │                  │
  │                    │                    │                 │                  │                  │
  │                    │[Check Urgency]     │                 │                  │                  │
  │                    │── is_urgent = true ─────────────────│                  │                  │
  │                    │                    │                 │                  │                  │
  │                    │[Suggest Technician]│                 │                  │                  │
  │                    │───────────────────────────────────►│                  │                  │
  │                    │                    │                 │                  │                  │
  │                    │◄── pick_tech_name ─│─────────────────│                  │                  │
  │                    │                    │                 │                  │                  │
  │             ┌── Technician Found? ──────┐                │                  │                  │
  │             │                    │      │                 │                  │                  │
  │             │  [Coordinate Dispatch]    │                 │                  │                  │
  │             │────────────────────────────────────────────│                  │                  │
  │             │                    │      │                 │                  │                  │
  │             │  [Finalize Dispatch]      │                 │                  │                  │
  │             │───────────────────────────────────────────────────────────────►│                  │
  │             │                    │      │                 │                  │                  │
  │             │                    │      │                 │ dispatch.created  │                  │
  │             │                    │      │                 │                  │──────────────────►│
  │             │                    │      │                 │                  │                  │
  │             │                    │      │                 │ [Discord Alert]  │                  │
  │             │                    │      │                 │── to #support-   │                  │
  │             │                    │      │                 │  alerts          │                  │
  │             │                    │      │                 │                  │                  │
  │  [Dispatch Alert via Discord]    │      │                 │                  │                  │
  │◄────────────────────────────────│──────│─────────────────│──────────────────│──────────────────│
  │             │                    │      │                 │                  │                  │
  │                                     [Cross-Domain Handoff]                                    │
  │                                                                                               │
  │             │                    │      │                 │  [work-order-                      │
  │             │                    │      │                 │   fulfillment                     │
  │             │                    │      │                 │   workflow starts]                │
  │             │                    │      │                 │                  │                  │
  │             │                    │      │                 │                  │[Create Work Order]│
  │             │                    │      │                 │                  │──────────────────►│
  │             │                    │      │                 │                  │◄── Created ───────│
  │             │                    │      │                 │                  │                  │
  │             │                    │      │                 │                  │[Stage Progression]│
  │             │                    │      │                 │                  │──────────────────►│
  │             │                    │      │                 │                  │◄── Updated ───────│
  │             │                    │      │                 │                  │                  │
  │  [Work Order Complete]           │      │                 │                  │                  │
  │◄────────────────────────────────│──────│─────────────────│──────────────────│──────────────────│
  │             │                    │      │                 │                  │                  │
```

---

## 12. Followup Slippage Detection & Recovery

```
Schedule         followup-slippage-     Function:            Function:            notification-delivery
(daily)          detector Workflow      flag-slipping-       finalize-slippage-    Workflow
                                         followups            review
  │                    │                     │                     │                     │
  │ [Cron: Daily]      │                     │                     │                     │
  │───────────────────►│                     │                     │                     │
  │                    │                     │                     │                     │
  │                    │[Flag Slipping       │                     │                     │
  │                    │ Followups]          │                     │                     │
  │                    │────────────────────►│                     │                     │
  │                    │                     │                     │                     │
  │                    │◄── Slipping List ───│                     │                     │
  │                    │                     │                     │                     │
  │            ┌── Slippage Found? ──┐       │                     │                     │
  │            │               │     │       │                     │                     │
  │            │               │     │       │                     │                     │
  │            │  [Review Slippage] │       │                     │                     │
  │            │  Human reviews     │       │                     │                     │
  │            │  flagged items     │       │                     │                     │
  │            │               │     │       │                     │                     │
  │            │  [Finalize Review] │       │                     │                     │
  │            │               │     │       │                     │                     │
  │            │               ▼     │       │                     │                     │
  │            │──────────────────────────────────────────────────►│                     │
  │            │               │     │       │                     │                     │
  │            │               │     │[Send Alert]                 │                     │
  │            │               │     │──────────────────────────────────────────────────►│
  │            │               │     │       │                     │                     │
  │  [Slippage Alert]          │     │       │                     │                     │
  │◄───────────────────────────│─────│───────│─────────────────────│─────────────────────│
  │            │               │     │       │                     │                     │
  │  [Followup Tasks Created]  │     │       │                     │                     │
  │◄── CRM creates recover ────│─────│───────│─────────────────────│─────────────────────│
  │            │               │     │       │                     │                     │
```

---

## 13. Retention Campaign Execution

```
account.health.changed  retention-campaign   Function:            Agent:                notification-delivery
(event)                 Workflow             create-followup-     crm-retention-         Workflow
                                               tasks              specialist
  │                          │                     │                   │                     │
  │  [account.health.changed │                     │                   │                     │
  │   → risk_signal]         │                     │                   │                     │
  │─────────────────────────►│                     │                   │                     │
  │                          │                     │                   │                     │
  │                          │ [Evaluate Risk]     │                   │                     │
  │                          │─────────────────────│──────────────────►│                     │
  │                          │                     │                   │                     │
  │                          │◄── Campaign Plan ───│───────────────────│                     │
  │                          │                     │                   │                     │
  │                          │ [Create Followup    │                   │                     │
  │                          │  Tasks]             │                   │                     │
  │                          │────────────────────►│                   │                     │
  │                          │                     │                   │                     │
  │                          │◄── Tasks Created ───│                   │                     │
  │                          │                     │                   │                     │
  │                          │ [Outreach Start]    │                   │                     │
  │                          │─────────────────────────────────────────────────────────────►│
  │                          │                     │                   │                     │
  │  [Customer Outreach]     │                     │                   │                     │
  │◄─────────────────────────│─────────────────────│───────────────────│─────────────────────│
  │                          │                     │                   │                     │
  │  [Followup Completed]    │                     │                   │                     │
  │─────────────── account-health-scan workflow re-evaluates ─────────│                     │
  │                          │                     │                   │                     │
```

---

> **End of FULL_SEQUENCE_DIAGRAMS.md**
