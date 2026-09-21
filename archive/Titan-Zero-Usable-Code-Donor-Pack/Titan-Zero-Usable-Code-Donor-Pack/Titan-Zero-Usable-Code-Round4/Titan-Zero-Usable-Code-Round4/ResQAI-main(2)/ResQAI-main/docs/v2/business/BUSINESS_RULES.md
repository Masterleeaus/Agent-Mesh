# RESQAI V2 — Business Rule Catalog

> Phase 3.4 — Enterprise Business Flow Specification
> Chief Enterprise Business Architect
> Date: 2026-06-29

---

## Table of Contents

1. [Rule Format](#1-rule-format)
2. [Ticket Domain Rules](#2-ticket-domain-rules)
3. [Appointment Domain Rules](#3-appointment-domain-rules)
4. [Technician Domain Rules](#4-technician-domain-rules)
5. [Dispatch Domain Rules](#5-dispatch-domain-rules)
6. [Work Order Domain Rules](#6-work-order-domain-rules)
7. [CRM & Account Health Rules](#7-crm--account-health-rules)
8. [Dispute Resolution Rules](#8-dispute-resolution-rules)
9. [Notification Rules](#9-notification-rules)
10. [Escalation Rules](#10-escalation-rules)
11. [Reporting & Analytics Rules](#11-reporting--analytics-rules)
12. [Administration & Security Rules](#12-administration--security-rules)
13. [Cross-Domain Rules](#13-cross-domain-rules)

---

## 1. Rule Format

Every business rule follows this contract:

| Field | Description |
|-------|-------------|
| **Rule ID** | Unique identifier (prefix: domain) |
| **Description** | What the rule enforces |
| **Trigger** | Event, state, or condition that activates this rule |
| **Validation** | Condition that must be checked |
| **Outcome** | Result when rule fires |
| **Priority** | Critical / High / Medium / Low |

---

## 2. Ticket Domain Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| TKT-001 | All tickets must be classified within 5min of creation | ticket.created | Time since created > 5min AND status = new | Auto-classify as "unclassified-urgent" and escalate to Support Manager AI | Critical |
| TKT-002 | Urgency must be set before reply is drafted | ticket.classified | urgency field IS NULL | Block draft; return to classification step | High |
| TKT-003 | Reply drafts require human approval before sending | ticket.reply.drafted | status = drafted AND no approval within 4h | Auto-escalate to Support Manager AI | Critical |
| TKT-004 | AI draft confidence < 0.70 must be escalated to human | ticket.reply.drafted | confidence < 0.70 | Route to human agent; bypass auto-approval | High |
| TKT-005 | AI draft confidence >= 0.90 and FAQ match can bypass human | ticket.created | confidence >= 0.90 AND channel supports auto-response | Auto-send reply without human review | Medium |
| TKT-006 | Tickets from VIP customers get priority queue placement | ticket.classified | customer_tier = 'VIP' | Set priority = high; reduce SLA by 50% | High |
| TKT-007 | Duplicate tickets within 24h are merged | ticket.created | Same customer_id AND subject similarity > 80% | Link to existing ticket; close as duplicate | Medium |
| TKT-008 | Tickets cannot transition out of "closed" state | ticket.closed | Any action attempted on closed ticket | Reject mutation; error code 409 | Critical |
| TKT-009 | Required fields: customer_id, subject, message, channel | ticket.created | Any required field missing | Block creation; return 400 validation error | Critical |
| TKT-010 | Empty/invalid reply content not allowed | ticket.reply.drafted | message_content empty or > 10000 chars | Reject draft; return validation error | High |

---

## 3. Appointment Domain Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| APT-001 | Appointments require confirmed customer before technician dispatch | appointment.assigned | status != confirmed AND dispatch requested | Block dispatch; return 409 | Critical |
| APT-002 | No double-booking: one technician per time slot | appointment.created | Technician already assigned in same time window | Return conflict warning; suggest alternate slot | Critical |
| APT-003 | Appointment must be confirmed within 24h of booking | appointment.created | No confirmation within 24h | Auto-cancel; notify customer | High |
| APT-004 | Cancellation within 2h of start incurs fee | appointment.cancelled | Time to appointment < 2h AND status = confirmed | Apply cancellation fee to account | Medium |
| APT-005 | Reminder sequence is fixed: 24h, 2h, 30min | appointment.confirmed | Confirmation timestamp | Schedule 3 reminders at fixed intervals | Medium |
| APT-006 | Technician must be available before assignment | appointment.assigned | technician availability != available | Block assignment; find alternate | Critical |
| APT-007 | Service address must be within technician service area | appointment.created | Customer address not in any tech service area | Flag for manual review; no auto-assignment | High |
| APT-008 | Reschedule limited to 3 attempts per appointment | appointment.scheduled | Reschedule count >= 3 | Lock appointment; require manager override | Medium |

---

## 4. Technician Domain Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| TCH-001 | Technician must hold required skill certification for job | appointment.assigned | technician_skills missing required skill | Block assignment; find alternate | Critical |
| TCH-002 | Technician max daily jobs: 8 | appointment.assigned | Daily job count >= 8 | Block assignment; suggest next-day | High |
| TCH-003 | Technician must clock in before accepting dispatches | dispatch.sent | technician availability = off_shift | Notify tech to clock in; auto-route to backup | High |
| TCH-004 | GPS location required for on-site verification | work_order.on_site | No GPS coordinates within 100m of service address | Flag for manager review; prevent completion | Critical |
| TCH-005 | Break time: minimum 30min after 4 consecutive hours | technician.status change | Shift hours >= 4 without break | Suggest break; manager notification if declined | Medium |
| TCH-006 | Overtime requires manager pre-approval | technician.status change | Shift hours > 8 | Request manager approval; auto-notify Ops | High |
| TCH-007 | No-show tracked: 3 no-shows in 30 days triggers review | dispatch.declined (no-show) | No-show count >= 3 in rolling 30 days | Escalate to Operations Manager for review | High |
| TCH-008 | Travel time between jobs: max 60min | appointment.assigned | Gap between jobs > 60min | Flag schedule conflict; suggest reorder | Medium |

---

## 5. Dispatch Domain Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| DSP-001 | Urgent dispatch acknowledgment required within 10min | dispatch.sent (urgent) | No acknowledgment within 10min | Auto-reassign to next available technician | Critical |
| DSP-002 | Standard dispatch acknowledgment required within 30min | dispatch.sent (standard) | No acknowledgment within 30min | Escalate to Dispatch Manager AI | High |
| DSP-003 | Max 2 declines before auto-escalation | dispatch.declined | Decline count >= 2 | Escalate to Dispatch Manager AI for reassignment | High |
| DSP-004 | Emergency dispatch triggers parallel broadcast to ALL techs | dispatch.escalated (emergency) | urgency = emergency | Broadcast to all available technicians simultaneously | Critical |
| DSP-005 | Dispatch must reach completed or cancelled state within 24h | dispatch.sent | Time since sent > 24h AND status in (pending/sent/acknowledged) | Auto-escalate to Platform Orchestrator | Critical |
| DSP-006 | No dispatch without valid ticket reference | dispatch.created | ticket_id IS NULL OR ticket not in valid state | Block dispatch creation | Critical |
| DSP-007 | Technician must be en route within 15min of acknowledgment | dispatch.acknowledged | No en_route status within 15min | Escalate to Dispatch Manager AI | High |

---

## 6. Work Order Domain Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| WOR-001 | Stage transitions must follow sequence: created→assigned→travelling→on_site→working→completed | work_order.stage.changed | Invalid transition for current state | Reject transition; return 409 | Critical |
| WOR-002 | Maximum stage duration: 4h | work_order.stage.changed | Time in current stage > 4h | Escalate to Work Order Manager AI | High |
| WOR-003 | Total work order duration: max 8h | work_order.created | Time since created > 8h AND not completed | Auto-escalate with Ops Manager notification | High |
| WOR-004 | Work order requires technician notes and photo for completion | work_order.completed | notes empty OR no photo uploaded | Flag as incomplete; require manager sign-off | Critical |
| WOR-005 | Parts used must be deducted from inventory | work_order.completed | Parts logged but inventory not updated | Trigger inventory transaction; auto-adjust stock | High |
| WOR-006 | Customer signature required for completion acknowledgment | work_order.completed | No digital signature captured | Block completion; require on-site resolution | Critical |

---

## 7. CRM & Account Health Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| CRM-001 | Health scan runs daily at 2:00 AM for all active accounts | Cron (daily 2AM) | Account status = active | Run full health scan; emit results | Critical |
| CRM-002 | Health score determines account category automatically | account.health.scan.completed | score >= 0.8 healthy, 0.6-0.79 watch, 0.3-0.59 slipping, < 0.3 critical | Auto-categorize; emit health.changed event | High |
| CRM-003 | Critical health automatically triggers retention campaign | account.health.changed (critical) | health = critical | Create followup; start retention-campaign_v2 | Critical |
| CRM-004 | Followups must be completed within 7 days of due date | followup.created | Due date + 7 days passed without completion | Auto-mark as missed; escalate to CRM Manager | High |
| CRM-005 | Slippage detection runs weekdays at 6:00 AM | Cron (weekdays 6AM) | Followups with due_date in past | Flag slipping; alert assigned owner | Medium |
| CRM-006 | VIP accounts have priority: health scan every 6h | account.created | customer_tier = VIP | Schedule additional scans; reduced interval | High |
| CRM-007 | Account dormant > 90 days automatically churned | Cron (weekly) | Last appointment > 90 days AND health = slipping | Set status = churned; start win-back campaign | Medium |
| CRM-008 | Retention campaign financial offers > $500 require human approval | campaign.created | offer_amount > 500 | Hold campaign; notify CRM Manager for approval | Critical |
| CRM-009 | Negative feedback (score < 3) triggers immediate CRM alert | feedback.submitted | score < 3 | Immediate notification to CRM Manager + CX Manager | Critical |

---

## 8. Dispute Resolution Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| DSR-001 | AI analysis required before any resolution decision | dispute.created | STATUS = open | Auto-invoke resolution-advisor_v2 agent | Critical |
| DSR-002 | AI confidence >= 0.80 enables fast-track approval | dispute.analyzed | confidence >= 0.80 | Route to QA Manager for quick review | High |
| DSR-003 | AI confidence 0.50-0.79 requires standard human review | dispute.analyzed | confidence between 0.50 and 0.79 | Route to Resolution Manager for standard review | High |
| DSR-004 | AI confidence < 0.50 requires urgent human escalation | dispute.analyzed | confidence < 0.50 | Urgent escalate to Resolution Manager | Critical |
| DSR-005 | ALL resolutions require human approval before execution | dispute.recommendation.ready | Any recommendation | Block execution until approved/rejected | Critical |
| DSR-006 | Human approval timeout: 24h — reminder at 12h, escalate at 24h | dispute.recommendation.ready | No response within 12h / 24h | Reminder at 12h; escalate to Platform Orchestrator at 24h | High |
| DSR-007 | Compliance check runs in parallel with AI analysis | dispute.analyzing | Compliance rules defined | Check against policy; flag violations | High |
| DSR-008 | Dispute can only be closed from approved or rejected state | dispute.closed | Status not approved or rejected | Block close; error 409 | Critical |
| DSR-009 | Re-opened dispute (2nd time) auto-escalates to Platform Orchestrator | dispute.resolved (re-opened) | Re-open count >= 2 | Escalate; bypass standard flow | Critical |
| DSR-010 | Compensation limit: $10K requires Executive Director approval | dispute.approved | compensation_amount > 10000 | Hold approval; escalate to Executive Director | Critical |

---

## 9. Notification Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| NTF-001 | Delivery required within 30s of trigger for critical notifications | notification.send (critical) | Delivery time > 30s | Escalate to Notification Manager AI | Critical |
| NTF-002 | Per-channel retry: 3 attempts with exponential backoff | notification.sent (failed) | Retry count < 3 | Retry with 1s/5s/15s backoff | High |
| NTF-003 | Channel fallback: up to 3 channels before permanent failure | notification.sent (failed) | Primary channel exhausted AND fallback available | Switch to next channel in priority order | High |
| NTF-004 | Customer opt-out must be respected across ALL channels | notification.send | Customer notification_preference = false for channel | Use permitted channel only; log skipped channel | Critical |
| NTF-005 | Notification preference changes take effect immediately | notification.preferences.updated | Preference record updated | Apply to next notification; no retroactive changes | Medium |
| NTF-006 | Rate limit: max 50 notifications per customer per hour | notification.send | Count in last hour >= 50 | Queue with delay; alert Notification Manager | Medium |
| NTF-007 | In-app notifications must mark as read when viewed | notification.read | Notification displayed in UI | Update read_at timestamp | Low |

---

## 10. Escalation Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| ESC-001 | Each escalation tier has a hard response timeout | ticket.escalated | L1: 10min, L2: 30min, L3: 2h, L4: 24h | Auto-escalate to next tier on timeout | Critical |
| ESC-002 | Emergency severity triggers parallel escalation to ALL tiers | ticket.escalated (emergency) | urgency = emergency | Notify L1-L4 simultaneously; shortest response wins | Critical |
| ESC-003 | Resolved escalation returns control to origin with notes | escalation.resolved | Resolution recorded | Delegate back with full resolution chain | High |
| ESC-004 | Escalation chain is immutable — cannot skip tiers | ticket.escalated | Attempted tier skip | Reject; enforce sequential tier progression | Critical |
| ESC-005 | Escalation must be resolvable within 7 days total | escalation.chain.started | Total time > 7 days AND not resolved | Escalate to Platform Orchestrator with executive alert | Critical |
| ESC-006 | L4 (Legal) escalation requires documented executive authorization | ticket.escalated (L4) | No executive authorization record | Block escalation; require signed authorization | Critical |
| ESC-007 | All escalation steps must produce audit log entries | ANY escalation step | Audit log missing | Flag compliance issue; retry audit | High |

---

## 11. Reporting & Analytics Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| RPT-001 | Standard reports must generate within 5min | report.generation.requested | Generation time > 5min | Escalate to Reporting Manager AI | Medium |
| RPT-002 | Complex reports must generate within 30min | report.generation.requested (complex) | Generation time > 30min | Escalate to Analytics Manager AI | Medium |
| RPT-003 | Trend analysis requires minimum 7 days of data | trend-analysis_v2 | Data window < 7 days | Skip analysis; log insufficient data | Low |
| RPT-004 | Anomaly detection requires 30-day baseline | anomaly-detection_v2 | Baseline < 30 days | Use provisional threshold; log warning | Medium |
| RPT-005 | Anomaly false positive rate must be < 5% | anomaly-detection_v2 | False positive rate > 5% | Auto-adjust sensitivity; alert Analytics Manager | High |
| RPT-006 | Report distribution must reach all subscribers within 1h | report.generated | Distribution > 1h | Escalate partial delivery to Reporting Manager | Medium |
| RPT-007 | Report data freshness indicator required on all exports | report.generated | Last aggregated > configured stale period | Mark report as "stale" in metadata | Low |

---

## 12. Administration & Security Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| ADM-001 | User must have at least one role assigned | user.created | No role assigned | Block creation; require role selection | Critical |
| ADM-002 | Email must be unique across the platform | user.created | Email already exists in users_v2 | Return 409 conflict; reject creation | Critical |
| ADM-003 | User deactivation requires secondary admin approval | user.disabled | No second admin approval | Hold deactivation; notify second admin | Critical |
| ADM-004 | Configuration changes require validation before apply | system.config.change.requested | Validation function fails | Reject change; return validation errors | Critical |
| ADM-005 | Configuration change rolls back automatically on system error | system.config.changed | Error detected within 5min of change | Restore previous value; notify Admin | Critical |
| ADM-006 | Role elevation (agent→admin) requires two-admin approval | user.role.changed | Role level increase AND single approval only | Block; require second approval | Critical |
| ADM-007 | Feature flag changes logged with before/after values | feature_flags_v2 UPDATE | Change applied | Log to audit_log_v2 with actor, before, after | High |
| ADM-008 | Audit log is immutable — no delete or update | audit_log_v2 INSERT | Any attempt to modify | Reject mutation; security alert | Critical |

---

## 13. Cross-Domain Rules

| Rule ID | Description | Trigger | Validation | Outcome | Priority |
|---------|-------------|---------|------------|---------|----------|
| XDM-001 | All cross-app handoffs must use domain events | ANY cross-app action | Direct DB cross-app access detected | Block; enforce event-based integration | Critical |
| XDM-002 | SLA timer pauses when entity is in escalation | ticket.sla.monitoring | escalation_level > 0 | Pause SLA countdown; resume on resolution | High |
| XDM-003 | Real-time events must be delivered within 5s | ANY domain event | Delivery time > 5s | Escalate to Platform Orchestrator | Critical |
| XDM-004 | Batch events have 30s delivery SLA | batch event | Delivery time > 30s | Escalate to Platform Orchestrator | Medium |
| XDM-005 | Workflow execution timeout: 30min standard, 4h human-review | ALL workflow executions | Execution time exceeds timeout | Auto-fail workflow; trigger recovery | Critical |
| XDM-006 | Audit trail required for ALL state mutations | ANY state change | Audit log entry missing | Retry; if persistent, escalate to Admin | Critical |
| XDM-007 | Human approval steps auto-expire: 4h standard, 24h disputes | ANY human approval | Approval timeout exceeded | Auto-escalate; notify next authority | High |

---

## Rule Priority Distribution

| Priority | Count | Description |
|----------|:-----:|-------------|
| Critical | 28 | System integrity, data loss prevention, SLA enforcement |
| High | 22 | Operational efficiency, escalation triggers, validation |
| Medium | 16 | Convenience, optimization, non-critical workflows |
| Low | 3 | Reporting, display, ancillary features |

**Total Rules: 69**

---

> **End of BUSINESS_RULES.md**
> Next document: SWIMLANE_DIAGRAMS.md
