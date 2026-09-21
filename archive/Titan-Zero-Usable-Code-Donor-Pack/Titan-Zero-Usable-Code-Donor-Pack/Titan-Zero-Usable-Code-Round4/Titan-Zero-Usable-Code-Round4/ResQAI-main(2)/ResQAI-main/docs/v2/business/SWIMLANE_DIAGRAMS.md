# RESQAI V2 — Swimlane Diagrams

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [Swimlane Notation](#1-swimlane-notation)
2. [Ticket Lifecycle Swimlane](#2-ticket-lifecycle-swimlane)
3. [Appointment Lifecycle Swimlane](#3-appointment-lifecycle-swimlane)
4. [Technician Lifecycle Swimlane](#4-technician-lifecycle-swimlane)
5. [Customer Lifecycle Swimlane](#5-customer-lifecycle-swimlane)
6. [CRM Lifecycle Swimlane](#6-crm-lifecycle-swimlane)
7. [Resolution Lifecycle Swimlane](#7-resolution-lifecycle-swimlane)
8. [Escalation Lifecycle Swimlane](#8-escalation-lifecycle-swimlane)
9. [Notification Lifecycle Swimlane](#9-notification-lifecycle-swimlane)
10. [Reporting Lifecycle Swimlane](#10-reporting-lifecycle-swimlane)
11. [Administration Lifecycle Swimlane](#11-administration-lifecycle-swimlane)

---

## 1. Swimlane Notation

```
Legend:
  [START]   = Flow entry point
  [END]     = Flow termination point
  (action)  = Step performed by actor
  {event}   = Domain event emitted
  <system>  = System/automated action
  ?DEC?     = Decision point
  APPROVAL  = Human approval required
  ---->     = Handoff between lanes
  ....>     = Event/notification flow
```

---

## 2. Ticket Lifecycle Swimlane

```
CUSTOMER PORTAL v2     SUPPORT CENTER v2        OPERATIONS CENTER v2     NOTIFICATION CENTER v2
══════════════════     ════════════════════     ═════════════════════     ═══════════════════════

[START: ticket.created]

(Create Ticket)-----> (Classify: AI Agent)
                        |
                        | (Check Urgency)
                        |
                     ?DEC: Urgency?
                        |
                    [Urgent/Critical]-----> (Trigger Urgent Dispatch)
                        |                       |
                        |                    [TO DISPATCH SWIMLANE]
                        |
                    [Normal]
                        |
                        | (Draft Reply: AI Agent)
                        |
                     ?DEC: Confidence >= 0.75?
                        |
                    [YES]
                        |
                     APPROVAL: Human Approve?
                        |
                    [Approve]  [Reject]
                        |         |
                        |       (Re-draft)
                        |
                        | (Send Reply)
                        |
                     {ticket.sent} --------------------------------....> (Notify Customer)
                        |
                     ?DEC: Close?
                        |
                    [Yes]                                          
                        |
                        | (Close Ticket)
                        |
                     {ticket.closed} -------------------------------....> (Survey Trigger)
                        |
                     [TO CRM SWIMLANE]
                        |
                     [END]


ESCALATION PATH (from any step):
  ?DEC: SLA Breach? ------YES-----> (Auto-escalate)
                                      |
                                   [TO ESCALATION SWIMLANE]
```

---

## 3. Appointment Lifecycle Swimlane

```
CUSTOMER PORTAL v2   APPOINTMENT CENTER v2   TECHNICIAN PORTAL v2   OPERATIONS CENTER v2   NOTIFICATION CENTER v2
══════════════════   ═════════════════════   ════════════════════   ════════════════════   ═══════════════════════

[START: appointment.created]

(Book Appointment)---> (Suggest Technician: AI)
                        |
                        | (Assign Technician)
                        |
                        | {appointment.assigned} -------------> (Notify Technician)
                                                                   |
                                                                (View Schedule)
                                                                   |
                     (Send Confirmation) <---- (Customer Confirms)
                        |
                     ?DEC: Confirmed?
                        |
                    [Confirmed]     [Cancelled]
                        |               |
                        |               `---> [END]
                        |
                        | (Schedule Reminders)
                        |
                     [Confirmed] ----------------------------> (24h Reminder)
                                                                   |
                     [Confirmed] ----------------------------> (2h Reminder)
                                                                   |
                     [Confirmed] ----------------------------> (30min Reminder)
                                                                   |
                                          (Start Job) ------> (Generate Work Order)
                                                                   |
                                          (En Route)
                                                                   |
                                          (On Site)
                                                                   |
                                          (Complete Job)
                                                                   |
                                          (Submit Report)
                                                                   |
                                        {appointment.completed}----> (Create Followup)
                                                                   |
                                                                    [TO CRM SWIMLANE]
                                                                   |
                                                                   [END]
```

---

## 4. Technician Lifecycle Swimlane

```
TECHNICIAN PORTAL v2   APPOINTMENT CENTER v2   OPERATIONS CENTER v2   ADMIN CENTER v2   NOTIFICATION CENTER v2
════════════════════   ═════════════════════   ════════════════════   ════════════════   ═══════════════════════

[START: shift.start]

(Clock In)
  |
  | {technician.available}
  |
  |                    (Job Assigned) -----> (Notify Technician) ----> (Push notification)
  |
  |<-- (Accept Dispatch)
  |
  | (En Route)
  |   |
  |   | {work_order.travelling}
  |   |
  | (On Site)
  |   |
  |   | {work_order.on_site}
  |   |
  | (Start Work)
  |   |
  |   | {work_order.working}
  |   |
  | ?DEC: Parts needed?
  |   |
  | [Yes]--- (Use Parts) ----> (Inventory Deduction)
  |   |
  | [No]
  |   |
  | (Complete Job)
  |   |
  | ?DEC: Followup needed?
  |   |
  | [Yes]--- (Flag followup)
  |   |
  | [No]
  |   |
  | (Submit Report)
  |   |
  | (Upload Photos)
  |   |
  | {work_order.completed}           (Update Metrics)       (Log Activity)
  |                                                              |
  | (Clock Out)                                                {audit.entry}
  |   |
  | {technician.off_shift}
  |
  [END]
```

---

## 5. Customer Lifecycle Swimlane

```
CUSTOMER PORTAL v2   SUPPORT CENTER v2   APPOINTMENT CENTER v2   CRM CENTER v2   NOTIFICATION CENTER v2
══════════════════   ═════════════════   ═════════════════════   ════════════════   ═══════════════════════

[START: customer.created]

(Register)
  |
  | {customer.created}                              (Create Health Profile)
  |                                                     |
(Create Ticket)-----> (Service Delivered)               |
                        |                                |
                        | (Close Ticket)                 |
                        |                                |
                        | {ticket.closed}                |
                        |                                |
                        |              (Appointment)---  |
                        |                    |           |
                        |              (Completed)       |
                        |                    |           |
                        |              {appointment      |
                        |               .completed}      |
                        |                    |           |
                        |                    |           |
                        |         (Survey Sent)----------+----> (Send Survey)
                        |                    |           |        |
                        |<---- (Submit Feedback)         |        |
                        |                    |           |        |
                        |              {feedback        |        |
                        |               .submitted}     |        |
                        |                    |           |        |
                        |                    |        (Health Scan)
                        |                    |           |
                        |                    |        (Risk Assessment)
                        |                    |           |
                        |                    |        (Create Followup)
                        |                    |           |
                        |                    |        (Campaign?)
                        |                    |           |
                        |                    |     ?DEC: At Risk?
                        |                    |           |
                        |                    |     [Yes]--- (Retention Campaign)
                        |                    |                     |
                        |                    |                     +---> (Win-back Offer)
                        |                    |                     |
                        |                    |                     +---> (Create Followups)
                        |                    |                     |
                        |                    |     [No]--- (Continue monitoring)
                        |                    |
                        |                    |        [END]
```

---

## 6. CRM Lifecycle Swimlane

```
CRM CENTER v2          NOTIFICATION CENTER v2   SUPPORT CENTER v2   OPERATIONS CENTER v2   ANALYTICS CENTER v2
═════════════════      ═══════════════════════   ═════════════════   ═════════════════════   ════════════════════

[START: cron.daily.2AM]

(Schedule Health Scan)
  |
  | (Scan All Accounts)
  |   |
  |   +-- (Read tickets_v2)
  |   +-- (Read appointments_v2)
  |   +-- (Read disputes_v2)
  |   +-- (Read feedback_v2)
  |   +-- (Read followups_v2)
  |
  | (Identify Risk Signals)
  |   |
  | ?DEC: Risk detected?
  |   |
  | [Yes]-------> {account.risk.signal.detected}
  |                 |
  |                 +----> (Notify CRM Manager)
  |                 |        |
  |                 |     [SEND NOTIFICATION] -----> (Alert: In-app + Email)
  |                 |
  |                 +----> (Create Followups)
  |                          |
  |                          | {followup.created} -----> (Notify Followup Owner)
  |                          |                              |
  |                          |                           [SEND NOTIFICATION]
  |                          |
  |                          | (Track Followup Status)
  |                          |   |
  |                          |   | (Detect Slippage: cron.weekdays.6AM)
  |                          |   |   |
  |                          |   | ?DEC: Overdue?
  |                          |   |   |
  |                          |   | [Yes]------> {followup.slippage.detected}
  |                          |   |                 |
  |                          |   |              +---> (Slippage Alert)
  |                          |   |              |      |
  |                          |   |              |   [SEND NOTIFICATION]
  |                          |   |              |
  |                          |   |              +---> (Escalate if chronic)
  |                          |   |
  |                          |   | [No]-------> (Continue)
  |                          |
  |                          | (Complete Followup)
  |                            |
  |                            | {followup.completed}
  |
  | (Execute Retention Campaign if needed)
  |   |
  | ?DEC: Health critical and VIP?
  |   |
  | [Yes]-------> (Start Retention Campaign)
  |                 |           |
  |                 |        {campaign.started} -----> (Win-back Offer)
  |                 |                                      |
  |                 |                                   [SEND NOTIFICATION]
  |                 |
  |                 +----> (Schedule Outreach)
  |                 +----> (Track Response)
  |
  | [No]--------> (Standard Monitoring)
  |
  | (Update KPIs) -------------------------------------------> (Aggregate Metrics)
                                                                |
                                                             [END]
```

---

## 7. Resolution Lifecycle Swimlane

```
CUSTOMER PORTAL v2   RESOLUTION CENTER v2   CRM CENTER v2   NOTIFICATION CENTER v2   ADMIN CENTER v2
══════════════════   ═════════════════════   ═══════════════   ═════════════════════   ══════════════════

[START: dispute.created]

(File Dispute)------> (Collect Evidence)
                        |
                        | (AI Analysis: Resolution Advisor)
                        |
                     PARALLEL:
                        +-- (AI Analysis)
                        +-- (Compliance Check)
                        |
                     (Wait for both)
                        |
                     ?DEC: Confidence threshold?
                        |
                    [>= 0.80] --------> APPROVAL: QA Manager (Fast Track)
                        |                 |
                        |              ?DEC: Approved?
                        |                 |
                        |             [Approved]   [Rejected]
                        |                 |            |
                        |                 |         (Detailed Review)
                        |                 |
                    [0.50-0.79] ------> APPROVAL: Resolution Manager
                        |                 |
                        |              ?DEC: Approved?
                        |                 |
                        |             [Approved]   [Rejected]------> (Re-analyze with hints)
                        |                 |
                        |                 |                           (Loop back)
                    [< 0.50] ---------> ESCALATE: Resolution Manager (Urgent)
                        |                 |
                        |              (Full Manual Review)
                        |
                        | (Apply Resolution)
                        |
                     {dispute.resolved}
                        |
                        +----> (Update Health) --------> {account.health.changed}
                        |                                  |
                        |                               [TO CRM SWIMLANE]
                        |
                        +----> (Notify Customer) --------> [SEND NOTIFICATION]
                        |                                   |
                        |                                (Dispute Outcome)
                        |
                        +----> (Log to Audit) ------------> {audit.entry}
                        |
                     [END]


ESCALATION PATH:
  ?DEC: Re-opened 2nd time?
    |
  [Yes]-------> [TO ESCALATION SWIMLANE]
    |
  [No]--------> (Normal flow)
```

---

## 8. Escalation Lifecycle Swimlane

```
SUPPORT CENTER v2   OPERATIONS CENTER v2   RESOLUTION CENTER v2   ADMIN CENTER v2   NOTIFICATION CENTER v2
══════════════════   ════════════════════   ═════════════════════   ═════════════════   ═══════════════════════

[START: escalation.triggered]

(Escalation Trigger)
  |
  | (Determine Level)
  |
  | ?DEC: Emergency?
  |   |
  | [Yes]-----> PARALLEL ESCALATION:
  |                +-- L1: Support Manager AI (10min timeout)
  |                +-- L2: Operations Manager AI (30min timeout)
  |                +-- L3: Platform Orchestrator AI (2h timeout)
  |                +-- L4: Human Executive (24h timeout)
  |
  | [No]------> SEQUENTIAL ESCALATION:
  |               |
  |               +-> L1: Support Manager AI
  |               |     | 
  |               |  ?DEC: Resolved within 10min? ----> [YES] -> Delegate back -> [END]
  |               |     |
  |               |   [NO]
  |               |
  |               +-> L2: Operations Manager AI
  |               |     |
  |               |  ?DEC: Resolved within 30min? ----> [YES] -> Delegate back -> [END]
  |               |     |
  |               |   [NO]
  |               |
  |               +-> L3: Platform Orchestrator AI
  |               |     |
  |               |  ?DEC: Resolved within 2h? -------> [YES] -> Delegate back -> [END]
  |               |     |
  |               |   [NO]
  |               |
  |               +-> L4: Human Executive Director
  |                     |
  |                  ?DEC: Resolved within 24h? ------> [YES] -> Delegate back -> [END]
  |                     |
  |                   [NO]
  |                     |
  |                  (Legal Escalation)
  |
  | (Apply Resolution)
  |
  | (Delegate Back to Origin) ---> {escalation.resolved} ---> [SEND NOTIFICATION]
  |
  | (Audit Chain) ---------------------------------------------> {audit.entry}
  |
  [END]
```

---

## 9. Notification Lifecycle Swimlane

```
SOURCE APPLICATION    NOTIFICATION CENTER v2       EXTERNAL SERVICES
══════════════════    ═════════════════════════     ══════════════════════════

[START: notification.send]

(Send Notification)
  |
  | {notification.send}
  |
  | (Channel Optimization: AI Agent)
  |   |
  |   +-- Primary: In-app
  |   +-- Fallback 1: Email
  |   +-- Fallback 2: SMS
  |   +-- Last Resort: Discord
  |
  | (Template Rendering: AI Agent)
  |   |
  |   +-- Select template by type
  |   +-- Render with context data
  |   +-- Personalize recipient name/org
  |
  | (Attempt Primary Channel)
  |   |
  |   | ----------> (API Call: Email Provider)
  |   |                |
  |   | <---------- (Delivery Receipt)
  |   |
  | ?DEC: Delivered?
  |   |
  | [YES] ---------> {notification.delivered}
  |                    |
  |                    +----> (Track Read Status)
  |                    |
  |                    +----> (Log Delivery)
  |                    |
  |                    +----> (Callback to Source)
  |                    |
  |                  [END: SUCCESS]
  |
  | [NO] ----------> RETRY (3x with exponential backoff)
  |                    |
  |                    | ----------> (API Call: Retry)
  |                    |
  |                 ALL FAILED?
  |                    |
  | [NO] ----------> (Attempt Fallback Channel 1)
  |                    |
  |                    | ----------> (API Call: SMS Provider)
  |                    |
  |                 ALL FAILED?
  |                    |
  | [NO] ----------> (Attempt Fallback Channel 2)
  |                    |
  |                    | ----------> (API Call: Discord)
  |                    |
  |                 ALL FAILED?
  |                    |
  | [YES] --------> {notification.failed}
  |                    |
  |                    +----> (Escalate: Notification Manager AI)
  |                    |
  |                  [END: DEGRADED/FAILED]
```

---

## 10. Reporting Lifecycle Swimlane

```
SOURCE APPLICATIONS   ANALYTICS CENTER v2      NOTIFICATION CENTER v2   EXTERNAL
══════════════════    ════════════════════════  ═══════════════════════  ════════════════

[START: event.emitted]

(Emit ALL Domain Events)
  |
  | (Event Stream)
  |
  | (Aggregate Metrics: Cron/Scheduled)
  |   |
  |   +-- Ticket Volume
  |   +-- Appointment Rates
  |   +-- Technician Utilization
  |   +-- Health Distribution
  |   +-- Dispute Resolution Times
  |   +-- SLA Compliance %
  |   +-- CSAT/NPS Scores
  |
  | (Trend Analysis: Daily 4AM)
  |   |
  |   +-- Calculate month-over-month
  |   +-- Detect statistically significant trends
  |   +-- Generate insight report
  |   |
  | {analytics.trend.identified}
  |
  | (Anomaly Detection: Hourly)
  |   |
  |   +-- Check against 30-day baseline
  |   +-- Flag deviations > 2 standard deviations
  |   |
  | {analytics.anomaly.detected}
  |
  | (Generate Report: Scheduled/On-demand)
  |   |
  |   +-- Query domain tables
  |   +-- Apply report template
  |   +-- Render data (CSV/PDF/Chart)
  |   |
  | {report.generated}
  |
  | (Schedule Distribution)
  |   |
  |   +-- Determine subscriber list
  |   +-- Choose delivery channel
  |   +-- Send report package
  |   |
  |                    (Deliver Report) --------> [SEND EMAIL]
  |                       |                          |
  |                    {report.distributed}        (Report delivered)
  |                       |
  |                    [END]
```

---

## 11. Administration Lifecycle Swimlane

```
ADMIN CENTER v2      NOTIFICATION CENTER v2   ALL APPLICATIONS   EXTERNAL IdP
══════════════════    ═══════════════════════  ═════════════════  ══════════════════

[START: admin.action]

USER MANAGEMENT:
(Create User)
  |
  ?DEC: Valid email + unique?
  |
  [YES]----> (Provision User) -------> {user.created} -----> [WELCOME EMAIL]
  |             |                                                |
  |          (Assign Role)                                     (Email sent)
  |             |
  |          (Set Permissions)
  |             |
  |          [END]
  |
  [NO]-----> (Reject) ---> [END]

ROLE MANAGEMENT:
(Update Role)
  |
  ?DEC: Role elevation?
  |
  [YES]----> APPROVAL: Second Admin Required
  |             |
  |          ?DEC: Approved?
  |             |
  |          [YES]----> (Apply Role Change) ---> {user.role.changed}
  |             |                                    |
  |          [NO]-----> (Reject)                  [NOTIFY USER]
  |
  [NO]-----> (Apply Role Change) ---> [END]

CONFIGURATION MANAGEMENT:
(Change Setting)
  |
  APPROVAL: Admin Approval Required
  |
  ?DEC: Approved?
  |
  [YES]----> (Validate Setting)
  |             |
  |          ?DEC: Valid?
  |             |
  |          [YES]----> (Apply Change) ---> {system.config.changed}
  |             |                                |
  |          [NO]-----> (Reject)              [NOTIFY ALL APPS]
  |
  [NO]-----> (Reject) ---> [END]

SYSTEM HEALTH:
(Health Check: Cron)
  |
  (Read System Metrics)
  |
  ?DEC: Healthy?
  |
  [YES]----> (Log) ---> [END]
  |
  [NO]-----> ?DEC: Severity?
               |
            [Warning]----> (Alert Admin) ---> [NOTIFICATION]
            [Critical]----> (Alert ALL) -----> [NOTIFICATION + ESCALATE]
                            (Auto-recover if possible)
                            |
                         [END]
```

---

## Swimlane Legend

```
Symbol          Meaning
───────         ─────────────────────────────────
[START]         Flow entry point / trigger
[END]           Flow termination
(Single Line)   Action performed by actor in lane
?DEC?           Decision point with branches
APPROVAL        Human approval gate
---->           Handoff to next lane
....>           Event or notification flow
PARALLEL        Concurrent execution paths
{event}         Domain event emitted
```

---

> **End of SWIMLANE_DIAGRAMS.md**
> Next document: STATE_TRANSITIONS.md
