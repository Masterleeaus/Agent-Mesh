# RESQAI V2 — Lifecycle Reference

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [Lifecycle Overview](#1-lifecycle-overview)
2. [Ticket Lifecycle Reference](#2-ticket-lifecycle-reference)
3. [Appointment Lifecycle Reference](#3-appointment-lifecycle-reference)
4. [Technician Lifecycle Reference](#4-technician-lifecycle-reference)
5. [Customer Lifecycle Reference](#5-customer-lifecycle-reference)
6. [CRM Lifecycle Reference](#6-crm-lifecycle-reference)
7. [Resolution Lifecycle Reference](#7-resolution-lifecycle-reference)
8. [Escalation Lifecycle Reference](#8-escalation-lifecycle-reference)
9. [Notification Lifecycle Reference](#9-notification-lifecycle-reference)
10. [Reporting Lifecycle Reference](#10-reporting-lifecycle-reference)
11. [Administration Lifecycle Reference](#11-administration-lifecycle-reference)
12. [Cross-Lifecycle Interaction Map](#12-cross-lifecycle-interaction-map)
13. [Lifecycle Metrics & KPIs](#13-lifecycle-metrics--kpis)

---

## 1. Lifecycle Overview

| Lifecycle | Owner | Primary App | Avg Duration | Critical Path | Human Touchpoints |
|-----------|-------|:-----------:|:------------:|:-------------:|:-----------------:|
| Ticket | Support Manager | support-center_v2 | 24-72h | Creation → Classify → Draft → Approve → Send → Close | Classification, Approval |
| Appointment | Scheduling Manager | appointment-center_v2 | 48h-7 days | Book → Confirm → Dispatch → Execute → Complete | Confirmation, Job Execution |
| Technician | Ops Manager | technician-portal_v2 | 8-10h/shift | Clock In → Job → Travel → Work → Complete → Clock Out | All steps (self-directed) |
| Customer | CRM Manager | crm-center_v2 | Ongoing | Register → Engage → Monitor → Retain → Churn/Win-back | Registration, Feedback |
| CRM | CRM Manager | crm-center_v2 | 7-90 days | Scan → Assess → Followup → Campaign → Recover | Followup, Campaign Approval |
| Resolution | Resolution Manager | resolution-center_v2 | 24-72h | File → Analyze → Review → Approve → Resolve | Approval (ALL) |
| Escalation | System | multi-app | 10min-48h | Trigger → L1 → L2 → L3 → L4 → Resolve | L4 (Executive) |
| Notification | System Admin | notification-center_v2 | < 60s | Send → Optimize → Deliver → Track | None |
| Reporting | Business Analyst | analytics-center_v2 | 5-30min | Aggregate → Analyze → Generate → Distribute | Report Review |
| Administration | System Admin | admin-center_v2 | 15min-4h | Create → Provision → Configure → Monitor | Approval (ALL changes) |

---

## 2. Ticket Lifecycle Reference

### States (Ordered)
`new → classified → drafted → approved_to_send → sent → closed`

### Parallel States
`escalated` (can enter from new, classified, drafted, sent)

### Terminal States
`closed` (only terminal state)

### Average Duration By Urgency
| Urgency | Time to First Response | Time to Resolution |
|---------|:---------------------:|:------------------:|
| urgent | < 1h | < 4h |
| high | < 4h | < 24h |
| normal | < 24h | < 72h |
| low | < 48h | < 7 days |

### Owner Transition
`unassigned → assigned_agent → assigned_manager → unassigned (on close)`

### Key Events
ticket.created, ticket.classified, ticket.reply.drafted, ticket.reply.approved, ticket.reply.rejected, ticket.sent, ticket.closed, ticket.escalated, ticket.sla_breached, ticket.sla_warning

### Key Business Rules
TKT-001 through TKT-010 (see BUSINESS_RULES.md)

### SLA Tiers
| Tier | Response SLA | Resolution SLA | Warning at | Breach Action |
|:----:|:------------:|:--------------:|:----------:|:-------------:|
| 1 (Critical) | 15min | 1h | 75% | Auto-escalate L2 |
| 2 (High) | 1h | 4h | 75% | Auto-escalate L1 |
| 3 (Normal) | 4h | 24h | 75% | Notify Support Manager |
| 4 (Low) | 24h | 72h | 75% | Notify agent |

---

## 3. Appointment Lifecycle Reference

### States (Ordered)
`scheduled → confirmed → in_progress → completed`

### Parallel States
`cancelled` (can enter from scheduled, confirmed, on_hold)
`on_hold` (can enter from confirmed, return to confirmed)
`needs_followup` (alternative terminal)

### Terminal States
`completed`, `cancelled`, `needs_followup`

### Average Duration By Service Type
| Service Type | Avg Duration | Min Buffer | Max Allowed |
|:------------:|:------------:|:----------:|:-----------:|
| Standard | 1h | 30min | 2h |
| Complex | 3h | 1h | 6h |
| Emergency | 30min | 15min | 1h |

### Reminder Schedule
| Timing | Recipient | Channel | Fallback |
|:------:|:---------:|:-------:|:--------:|
| 24h before | Customer | Email | SMS |
| 2h before | Customer + Technician | Email + Push | SMS |
| 30min before | Technician | Push | SMS |

### Key Events
appointment.created, appointment.assigned, appointment.confirmed, appointment.started, appointment.completed, appointment.cancelled, appointment.rescheduled, appointment.on_hold

### Key Business Rules
APT-001 through APT-008 (see BUSINESS_RULES.md)

---

## 4. Technician Lifecycle Reference

### States (Availability)
`available → busy → on_break → off_shift → on_leave`

### Work Order States (Per Job)
`created → assigned → travelling → on_site → working → completed`

### Shift Configuration
| Parameter | Standard | Premium |
|-----------|:--------:|:-------:|
| Shift length | 8h | 10h |
| Max jobs per shift | 8 | 10 |
| Min break duration | 30min | 30min |
| Break after | 4h | 4h |
| Max travel between jobs | 60min | 45min |
| Overtime threshold | > 8h | > 10h |

### Average Stage Durations
| Stage | Avg Duration | Max Before Escalation |
|-------|:------------:|:--------------------:|
| travelling | 20min | 60min |
| on_site | 5min | 15min |
| working | 45min | 4h |

### Key Events
technician.availability.changed, work_order.travelling, work_order.on_site, work_order.working, work_order.completed, work_order.followup_needed

### Key Business Rules
TCH-001 through TCH-008 (see BUSINESS_RULES.md)

---

## 5. Customer Lifecycle Reference

### Relationship States (Ordered)
`new → active → [in_dispute | at_risk | service_due] → dormant → churned`

### Recovery States
`churned → won_back → active`
`dormant → active`

### Health Score Bands
| Category | Score Range | Action Required | Check Frequency |
|----------|:-----------:|:---------------:|:---------------:|
| Healthy | 0.80 – 1.00 | None (monitor) | Weekly |
| Watch | 0.60 – 0.79 | Schedule followup | Daily |
| Slipping | 0.30 – 0.59 | Immediate intervention | Daily |
| Critical | 0.00 – 0.29 | Retention campaign | Every 6h (VIP) / Daily |

### Lifetime Value Tiers
| Tier | Annual Spend | Priority | SLA Multiplier |
|:----:|:------------:|:--------:|:--------------:|
| VIP | > $50K | Critical | 2x (faster) |
| Premium | $10K – $50K | High | 1.5x |
| Standard | $1K – $10K | Normal | 1x |
| Basic | < $1K | Low | 0.75x |

### Key Events
customer.created, account.health.changed, account.risk.signal.detected, feedback.submitted

### Key Business Rules
CRM-001 through CRM-009 (see BUSINESS_RULES.md)

---

## 6. CRM Lifecycle Reference

### States
`healthy → watch → slipping → critical` (cyclic, no terminal)

### Followup States
`pending → in_progress → [completed | missed | cancelled]`

### Scan Schedule
| Scan Type | Frequency | Accounts | Trigger |
|-----------|:---------:|:--------:|:-------:|
| Full health scan | Daily (2AM) | ALL active | Cron |
| VIP priority scan | Every 6h | VIP accounts | Cron |
| On-demand scan | Manual | Single account | CRM Manager action |
| Risk signal scan | Weekdays (6AM) | ALL with followups | Cron |

### Campaign Types
| Campaign | Target | Duration | Channels | Offer Type |
|----------|:------:|:--------:|:--------:|:----------:|
| Standard Retention | Slipping accounts | 14 days | Email + SMS | Discount |
| Win-back | Churned accounts | 30 days | Email + SMS + Call | Special offer |
| VIP Retention | VIP accounts | 7 days | Phone + Email | Concierge service |
| Feedback Recovery | Negative feedback | 7 days | Email + SMS | Apology + credit |

### Key Events
account.health.scan.completed, account.health.changed, account.risk.signal.detected, followup.created, followup.completed, followup.slippage.detected, campaign.created, campaign.started, campaign.completed

### Key Business Rules
CRM-001 through CRM-009 (see BUSINESS_RULES.md)

---

## 7. Resolution Lifecycle Reference

### States (Ordered)
`open → analyzing → recommendation_ready → [approved | rejected] → closed`

### Parallel States
`escalated` (can enter from analyzing when confidence < 0.50)

### Terminal States
`closed` (only terminal state)

### Confidence Routing
| Confidence | Route | Human Required | Response Time | Reviewer |
|:----------:|:-----:|:--------------:|:-------------:|:--------:|
| >= 0.80 | Fast track | QA Manager | 4h | QA Manager AI |
| 0.50 – 0.79 | Standard | Resolution Manager | 24h | Resolution Manager |
| < 0.50 | Urgent | Resolution Manager | 2h | Resolution Manager |

### Resolution Types
| Type | Description | Compensation Impact | Approval Required |
|------|:-----------:|:-------------------:|:----------------:|
| Refund | Full/partial refund | Financial | Resolution Manager |
| Re-service | Free repeat service | Operational | Resolution Manager |
| Credit | Account credit | Financial | Resolution Manager |
| Waiver | Fee waiver | Financial | Resolution Manager |
| Apology | Formal apology | None | None |
| Escalation | Legal/compliance | Varies | Executive Director |

### Key Events
dispute.created, dispute.analyzing, dispute.analyzed, dispute.recommendation.ready, dispute.escalated, dispute.approved, dispute.rejected, dispute.resolved

### Key Business Rules
DSR-001 through DSR-010 (see BUSINESS_RULES.md)

---

## 8. Escalation Lifecycle Reference

### Escalation Tiers
| Tier | Title | Responsible | Response Time | Authority |
|:----:|:-----:|:-----------:|:-------------:|:---------:|
| L0 | Auto Escalation | Support Manager AI | Instant | SLA timer, queue priority |
| L1 | Supervisor | Support Manager AI | 10min | Reassignment, reprioritization |
| L2 | Operations | Operations Manager AI | 30min | Tech reassignment, schedule override |
| L3 | Platform Orchestrator | Platform Orchestrator AI | 2h | Cross-domain coordination |
| L4 | Executive | Human Executive Director | 24h | Financial approval > $10K |
| L5 | Legal | Legal Counsel | 48h | Legal action, settlement |

### Escalation Sources
| Source | Trigger | Initial Tier | Emergency Mode? |
|--------|:-------:|:------------:|:---------------:|
| SLA breach | Timeout | L1 | No |
| Low AI confidence | Classification confidence < 0.70 | L2 | No |
| Customer complaint | Explicit request | L1 | If "legal action" mentioned |
| System failure | Health check | L3 | Yes |
| Re-opened dispute | Second re-open | L3 | No |
| Financial threshold > $10K | Approval | L4 | No |
| Legal/compliance | Flagged | L5 | Yes |

### Key Events
ticket.escalated, ticket.escalated.level2, ticket.escalated.level3, ticket.escalated.executive, ticket.escalation.resolved, escalation.chain.completed

### Key Business Rules
ESC-001 through ESC-007 (see BUSINESS_RULES.md)

---

## 9. Notification Lifecycle Reference

### States
`pending → sent → [delivered | failed] → read`

### Channel Priority
| Priority | Channel | Delivery Rate | Cost | Latency |
|:--------:|:-------:|:-------------:|:----:|:-------:|
| 1 | In-app | 95% | Free | < 1s |
| 2 | Push | 90% | Low | < 5s |
| 3 | Email | 85% | Medium | < 30s |
| 4 | SMS | 98% | High | < 10s |
| 5 | Discord | 80% | Free | < 5s |

### Notification Categories
| Category | Volume Share | SLA | Channels |
|----------|:-----------:|:---:|:--------:|
| Transactional | 45% | 30s | Email, In-app |
| Alert | 25% | 10s | All channels |
| Reminder | 15% | 60s | Email, SMS |
| Marketing | 10% | 5min | Email |
| System | 5% | 5s | Discord, Email |

### Retry Strategy
| Attempt | Channel | Backoff | Cumulative Time |
|:-------:|:-------:|:-------:|:---------------:|
| 1 | Primary | 0s | 0s |
| 2 | Primary | 1s | 1s |
| 3 | Primary | 5s | 6s |
| 4 | Fallback 1 | 15s | 21s |
| 5 | Fallback 1 | 1s | 22s |
| 6 | Fallback 1 | 5s | 27s |
| 7 | Fallback 2 | 15s | 42s |
| 8 | Fallback 2 | 1s | 43s |
| 9 | Fallback 2 | 5s | 48s |
| 10 | — | 15s | 63s (permanent failure) |

### Key Events
notification.send, notification.sent, notification.delivered, notification.failed, notification.read

### Key Business Rules
NTF-001 through NTF-007 (see BUSINESS_RULES.md)

---

## 10. Reporting Lifecycle Reference

### Report Types
| Type | Max Generation Time | Data Sources | Distribution |
|:----:|:------------------:|:------------:|:------------:|
| Standard | 5min | 1-3 tables | Email + In-app |
| Complex | 30min | 4+ tables, joins | Email only |
| Ad-hoc | 10min | User-defined | In-app |

### Report Schedule
| Frequency | Reports | Typical Generation Time |
|:---------:|:-------:|:----------------------:|
| Real-time | Executive Dashboard | Continuous |
| Hourly | Operations Summary | :05 past hour |
| Daily (6AM) | SLA Compliance, Technician Utilization | 06:00 |
| Weekly (Mon 6AM) | Account Health, CSAT Summary | 06:00 |
| Monthly (1st 6AM) | Financial Impact, Trend Analysis | 06:00 |
| Quarterly | Executive Review, Strategic KPIs | 06:00 |

### Key Events
analytics.report.requested, report.generated, report.failed, report.distributed, analytics.trend.identified, analytics.anomaly.detected

### Key Business Rules
RPT-001 through RPT-007 (see BUSINESS_RULES.md)

---

## 11. Administration Lifecycle Reference

### User States
`pending → active → [suspended | disabled]`

### User Types
| Type | Default Role | Permissions | Self-Service |
|:----:|:------------:|:-----------:|:------------:|
| Admin | System Administrator | Full | No |
| Support Manager | Support Manager | Queue management | Yes |
| Support Agent | Support Agent | Ticket handling | Yes |
| Operations Manager | Ops Manager | Dispatch + tasks | Yes |
| Technician | Technician | Schedule + jobs | Yes |
| CRM Manager | CRM Manager | Accounts + followups | Yes |
| Resolution Manager | Resolution Manager | Disputes | Yes |
| Customer | Customer | Portal + tickets | Yes |

### Configuration Categories
| Category | Examples | Change Risk | Rollback Strategy |
|:--------:|:--------:|:-----------:|:-----------------:|
| SLA Rules | Timing, tiers | High | Immediate revert |
| Routing Rules | Assignment logic | Medium | Staged revert |
| Notification Templates | Content, channels | Low | Snapshot restore |
| Feature Flags | Toggle features | Medium | Toggle off |
| Connector Config | API keys, endpoints | High | Credential rotation |
| Permission Roles | Access levels | Critical | Snapshot restore |

### Key Events
user.created, user.role.changed, user.disabled, system.config.changed, system.health.report, connector.configured

### Key Business Rules
ADM-001 through ADM-008 (see BUSINESS_RULES.md)

---

## 12. Cross-Lifecycle Interaction Map

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                  CROSS-LIFECYCLE DEPENDENCIES                │
                    └─────────────────────────────────────────────────────────────┘

  TICKET ──(service-needed)──► APPOINTMENT ──(completed)──► TECHNICIAN (work order)
    │                               │                              │
    │                               │                              │
    ├──(SLA breach)──► ESCALATION   │                              │
    │                               │                              │
    └──(closed)──────► CUSTOMER ────┤                              │
                                    │                              │
                                    ▼                              ▼
                              CRM LIFECYCLE                  NOTIFICATION
                                    │                       LIFECYCLE (ALL)
                                    │
                                    ├──(health.changed)──► REPORTING
                                    │
                                    └──(campaign)────────► NOTIFICATION

  RESOLUTION ──(resolved)──► CRM ──► CUSTOMER (health update)
       │
       └──(escalated)──────► ESCALATION

  ADMIN ──(config.changed)──► ALL LIFECYCLES (settings applied)
  ADMIN ──(user.created)────► NOTIFICATION (welcome email)

  ALL LIFECYCLES ──(events)──► REPORTING (metrics ingested)
  ALL LIFECYCLES ──(notifications)──► NOTIFICATION (delivery)
```

---

## 13. Lifecycle Metrics & KPIs

### Ticket Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| First Response Time | < 1h (urgent), < 4h (normal) | Time from created to sent | tickets_v2 |
| Resolution Time | < 4h (urgent), < 72h (normal) | Time from created to closed | tickets_v2 |
| SLA Compliance | > 95% | % of tickets resolved within SLA | tickets_v2 |
| CSAT Score | > 4.0 / 5.0 | Average satisfaction rating | feedback_v2 |
| Escalation Rate | < 10% | % of tickets escalated | tickets_v2 |
| First Contact Resolution | > 70% | % closed without followup | tickets_v2 |

### Appointment Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| On-Time Arrival Rate | > 90% | % of arrivals within window | work_order_stages_v2 |
| Confirmation Rate | > 80% | % of appointments confirmed | appointments_v2 |
| Cancellation Rate | < 10% | % of appointments cancelled | appointments_v2 |
| No-Show Rate | < 5% | % of no-shows | appointments_v2 |
| First-Time Assignment Accuracy | > 90% | % correctly assigned first attempt | appointments_v2 |

### Technician Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| Jobs Per Day | 6-8 | Daily job count | work_orders_v2 |
| Average Job Duration | < 2h | Time from on_site to complete | work_order_stages_v2 |
| Utilization Rate | > 75% | Billable hours / shift hours | technicians_v2, work_orders_v2 |
| Dispatch Acceptance Rate | > 90% | Dispatches accepted / total | dispatches_v2 |

### Customer Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| Customer Lifetime Value (CLV) | Increasing | Total revenue / customer | accounts_v2, appointments_v2 |
| Churn Rate | < 5% annually | Customers churned / total | customers_v2 |
| Net Promoter Score (NPS) | > 50 | Survey response | feedback_v2 |
| Repeat Service Rate | > 40% | Customers with 2+ appointments | customers_v2, appointments_v2 |
| Account Health Distribution | > 60% healthy | % accounts in healthy | accounts_v2 |

### CRM Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| Followup Completion Rate | > 85% | Followups completed / total | followups_v2 |
| Followup Response Time | < 24h | Time from created to first attempt | followup_attempts_v2 |
| Retention Campaign Success Rate | > 30% | Accounts recovered / targeted | accounts_v2, campaigns |
| Health Score Accuracy | > 85% | Predicted vs actual churn | accounts_v2 |

### Resolution Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| Resolution Time | < 48h | Time from created to resolved | disputes_v2 |
| AI Accuracy Rate | > 90% | Human agreement with AI recommendation | disputes_v2 |
| Escalation Rate | < 15% | % of disputes escalated | disputes_v2 |
| Customer Satisfaction Post-Resolution | > 3.5 / 5.0 | Post-resolution survey | feedback_v2 |

### Notification Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| Delivery Rate | > 99% | Notifications delivered / sent | notifications_v2 |
| Delivery Time (Critical) | < 30s | Time from trigger to delivery | notifications_v2 |
| Channel Fallback Rate | < 5% | % using non-primary channel | notifications_v2 |
| Read Rate | > 60% (in-app) | Notifications read / delivered | notifications_v2 |

### Reporting Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| Report Generation Time | < 5min (standard) | Time from request to ready | analytics_reports_v2 |
| Distribution Success Rate | > 99% | Reports delivered / generated | notifications_v2 |
| Trend Detection Accuracy | > 90% | Validation rate of detected trends | events_v2 |

### Administration Lifecycle KPIs
| Metric | Target | Measurement | Source |
|--------|:------:|:-----------:|:------:|
| User Provisioning Time | < 15min | Time from request to active | users_v2 |
| Config Change Success Rate | > 99% | Successful changes / total | audit_log_v2 |
| System Uptime | > 99.9% | Time system operational | system health checks |
| Audit Log Completeness | 100% | All mutations logged | audit_log_v2 vs events_v2 |

---

> **End of LIFECYCLE_REFERENCE.md**
