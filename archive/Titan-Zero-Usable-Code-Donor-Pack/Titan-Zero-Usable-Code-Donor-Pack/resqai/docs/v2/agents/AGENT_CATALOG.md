# RESQAI V2 — Agent Catalog

> Phase 1.3 — Architecture Only  
> Chief AI Systems Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Agent Property Reference](#1-agent-property-reference)
2. [Executive AI Department](#2-executive-ai-department)
3. [Support Department](#3-support-department)
4. [Operations Department](#4-operations-department)
5. [CRM Department](#5-crm-department)
6. [Dispatch Department](#6-dispatch-department)
7. [Scheduling Department](#7-scheduling-department)
8. [Appointment Department](#8-appointment-department)
9. [Knowledge Department](#9-knowledge-department)
10. [Analytics Department](#10-analytics-department)
11. [Administration Department](#11-administration-department)
12. [Quality Assurance Department](#12-quality-assurance-department)
13. [Reporting Department](#13-reporting-department)
14. [Notification Department](#14-notification-department)
15. [Customer Experience Department](#15-customer-experience-department)
16. [Automation Department](#16-automation-department)

---

## 1. Agent Property Reference

Each agent definition includes the following properties:

| Property | Description |
|----------|-------------|
| **Agent Name** | Unique identifier following `{dept}-{role}_v2` convention |
| **Purpose** | A single sentence defining why this agent exists |
| **Business Responsibilities** | Bullet list of specific business duties |
| **Inputs** | What triggers this agent and what data it consumes |
| **Outputs** | What the agent produces (events, records, recommendations) |
| **Memory Requirements** | What the agent must remember between invocations |
| **Context Requirements** | What data is needed for a single invocation |
| **Decision Authority** | What decisions the agent can make autonomously |
| **Escalation Rules** | When the agent must escalate to its manager or human |
| **Human Approval Requirements** | Decisions requiring explicit human approval |
| **Related Agents** | Agents this agent interacts with |
| **Related Workflows** | Workflows this agent participates in |
| **Related Applications** | Applications that invoke or display this agent's output |
| **Related Functions** | Deterministic functions this agent calls |
| **Related Tables** | Database tables this agent reads or writes |
| **Expected Latency** | Target response time |
| **Expected Accuracy** | Target accuracy or confidence threshold |
| **Priority Level** | Critical / High / Medium / Low |

---

## 2. Executive AI Department

### 2.1 Executive Director AI

| Property | Value |
|----------|-------|
| **Agent Name** | `executive-director_v2` |
| **Purpose** | Provide strategic oversight and business goal alignment across all departments |
| **Business Responsibilities** | Set platform-wide priorities, resolve cross-department conflicts, approve strategic initiatives, monitor business KPIs |
| **Inputs** | Daily summary from Platform Orchestrator; cross-department escalation events; human executive directives |
| **Outputs** | Strategic directives; priority changes; cross-department decisions |
| **Memory Requirements** | Long-term: business goal history, past strategic decisions, KPI trends |
| **Context Requirements** | Current platform KPIs, active escalations, department health summaries |
| **Decision Authority** | Cross-department priority changes; resource reallocation; strategic initiative approval |
| **Escalation Rules** | Escalate to human executive when: strategic uncertainty > 0.3; financial impact > $10K; legal/compliance questions |
| **Human Approval Requirements** | Budget changes; staffing changes; system-wide config changes |
| **Related Agents** | Platform Orchestrator AI; ALL Department Manager AIs |
| **Related Workflows** | daily-standup_v2; ALL escalation workflows |
| **Related Applications** | admin-center_v2, analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | events_v2 (read), audit_log_v2 (read), analytics_reports_v2 (read), system_settings_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | Critical |

### 2.2 Platform Orchestrator AI

| Property | Value |
|----------|-------|
| **Agent Name** | `platform-orchestrator_v2` |
| **Purpose** | Coordinate cross-department workflows and ensure end-to-end process execution |
| **Business Responsibilities** | Route inter-department requests, monitor workflow health, balance department workloads, detect stalled processes |
| **Inputs** | Department status reports; cross-department event patterns; workflow execution metrics |
| **Outputs** | Cross-department task assignments; workflow routing decisions; load-balancing directives |
| **Memory Requirements** | Medium-term: active cross-department workflows, pending coordination requests |
| **Context Requirements** | Department load metrics, active workflow graph, pending escalations |
| **Decision Authority** | Route work to any department; re-prioritize non-critical workflows; approve standard cross-department requests |
| **Escalation Rules** | Escalate to Executive Director when: 3+ departments involved; conflicting priorities; resource contention |
| **Human Approval Requirements** | None (orchestration only, not final decisions) |
| **Related Agents** | Executive Director AI; ALL Department Manager AIs; Workflow Orchestrator AI |
| **Related Workflows** | ALL cross-department workflows |
| **Related Applications** | ALL V2 applications |
| **Related Functions** | None |
| **Related Tables** | events_v2 (read), audit_log_v2 (read), system_settings_v2 (read) |
| **Expected Latency** | <2s |
| **Expected Accuracy** | 0.95 confidence threshold |
| **Priority Level** | Critical |

---

## 3. Support Department

### 3.1 Support Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `support-manager_v2` |
| **Purpose** | Oversee support operations, manage queue health, and coordinate escalation responses |
| **Business Responsibilities** | Monitor queue depth, balance agent workloads, review escalations, approve exception handling |
| **Inputs** | Queue metrics; escalation events from Classifier/Drafter; SLA alerts from SLA Monitor |
| **Outputs** | Queue prioritization decisions; escalation approvals; workflow routing changes |
| **Memory Requirements** | Medium-term: queue state history, escalation patterns, agent performance trends |
| **Context Requirements** | Current queue state, active SLA breaches, pending escalations, agent availability |
| **Decision Authority** | Re-classify tickets; re-assign ticket ownership; approve non-standard workflows |
| **Escalation Rules** | Escalate to Platform Orchestrator when: queue exceeds 2x capacity; SLA breach probability > 0.8; cross-department escalation needed |
| **Human Approval Requirements** | Bulk queue actions; policy exceptions; customer goodwill adjustments > $500 |
| **Related Agents** | Request Classifier AI; Support Reply Drafter AI; Escalation Manager AI; SLA Monitor AI |
| **Related Workflows** | ticket-intake_v2, support-escalation-manager_v2 |
| **Related Applications** | support-center_v2 |
| **Related Functions** | check-ticket-urgency, update-ticket-record |
| **Related Tables** | tickets_v2 (read/write), ticket_messages_v2 (read), customers_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 3.2 Request Classifier AI (V2 Evolution)

| Property | Value |
|----------|-------|
| **Agent Name** | `support-request-classifier_v2` |
| **Purpose** | Classify inbound support tickets by request type, urgency, category, and suggested department |
| **Business Responsibilities** | Analyze ticket content, assign request type and urgency, suggest owning department, detect duplicate tickets, suggest knowledge articles |
| **Inputs** | `ticket.created` event; ticket subject, message, customer history; channel metadata |
| **Outputs** | Classification record: request_type, urgency, suggested_owner, confidence, suggested_articles, duplicate_flag |
| **Memory Requirements** | Short-term: none (stateless classification per ticket) |
| **Context Requirements** | Customer history (open/completed tickets); knowledge article index |
| **Decision Authority** | Classify ticket type and urgency; suggest department owner; flag as duplicate |
| **Escalation Rules** | Escalate to Support Manager when: confidence < 0.7; multiple categories match; unparseable content |
| **Human Approval Requirements** | None (classification is recommendation, not final action) |
| **Related Agents** | Support Manager AI; Support Reply Drafter AI; Article Suggester AI; Escalation Manager AI |
| **Related Workflows** | ticket-intake_v2 |
| **Related Applications** | support-center_v2 |
| **Related Functions** | check-ticket-urgency |
| **Related Tables** | tickets_v2 (read/write), customers_v2 (read), knowledge_articles_v2 (read), ticket_messages_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.85 minimum confidence; target 0.92 |
| **Priority Level** | High |

### 3.3 Support Reply Drafter AI (V2 Evolution)

| Property | Value |
|----------|-------|
| **Agent Name** | `support-reply-drafter_v2` |
| **Purpose** | Draft professional customer-facing replies to support tickets using context and knowledge base |
| **Business Responsibilities** | Analyze ticket thread, research similar resolutions, draft reply, suggest tone and channel, cite knowledge articles |
| **Inputs** | Classified ticket; customer history; previous messages; knowledge articles; resolution templates |
| **Outputs** | Draft reply text; suggested tone (empathetic/professional/urgent); article citations; confidence score |
| **Memory Requirements** | Short-term: current ticket context only |
| **Context Requirements** | Full ticket thread; customer communication history; relevant knowledge articles; technician notes (if assigned) |
| **Decision Authority** | Draft content and tone; suggest send vs. review |
| **Escalation Rules** | Escalate to Support Manager when: confidence < 0.75; customer sentiment highly negative; legal/compliance risk |
| **Human Approval Requirements** | All drafts require human approval before sending (AI drafts, humans approve) |
| **Related Agents** | Request Classifier AI; Knowledge Manager AI; Response Quality Monitor AI |
| **Related Workflows** | ticket-intake_v2 |
| **Related Applications** | support-center_v2 |
| **Related Functions** | update-ticket-record |
| **Related Tables** | tickets_v2 (read/write), ticket_messages_v2 (read/write), customers_v2 (read), knowledge_articles_v2 (read) |
| **Expected Latency** | <10s |
| **Expected Accuracy** | 0.80 minimum confidence; target 0.90 |
| **Priority Level** | High |

### 3.4 Escalation Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `support-escalation-manager_v2` |
| **Purpose** | Manage ticket escalation paths, determine escalation depth, and coordinate handoffs |
| **Business Responsibilities** | Assess escalation triggers, determine escalation level (L1/L2/L3), route to appropriate department, track escalation resolution |
| **Inputs** | `ticket.escalated` event; escalation reason; ticket history; SLA status; customer account health |
| **Outputs** | Escalation decision: target department, urgency, required actions, expected SLA |
| **Memory Requirements** | Medium-term: escalation history per ticket, department escalation patterns |
| **Context Requirements** | Department capabilities; escalation matrix; technician seniority; customer SLA tier |
| **Decision Authority** | Route to L1 or L2; suggest L3 escalation; set escalation urgency |
| **Escalation Rules** | Must escalate to Platform Orchestrator when: 3rd escalation on same ticket; requires L3 (executive) involvement; involves legal |
| **Human Approval Requirements** | L3 (executive) escalations require human confirmation |
| **Related Agents** | Support Manager AI; Operations Manager AI; Dispatch Manager AI; CRM Manager AI |
| **Related Workflows** | support-escalation-manager_v2, urgent-dispatch_v2 |
| **Related Applications** | support-center_v2, operations-center_v2 |
| **Related Functions** | update-ticket-record |
| **Related Tables** | tickets_v2 (read/write), customers_v2 (read), accounts_v2 (read), technicians_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 3.5 SLA Monitor AI

| Property | Value |
|----------|-------|
| **Agent Name** | `support-sla-monitor_v2` |
| **Purpose** | Monitor ticket SLA deadlines and trigger alerts for at-risk and breached SLAs |
| **Business Responsibilities** | Track SLA timelines per ticket tier, predict SLA breaches before they occur, alert on imminent breaches, generate SLA compliance reports |
| **Inputs** | `ticket.created` event; `ticket.status.changed` event; system tick for SLA checks; customer SLA tier data |
| **Outputs** | `ticket.sla_breached` event; SLA risk alerts; SLA compliance snapshot |
| **Memory Requirements** | Long-term: SLA definition per customer tier, SLA calculation rules |
| **Context Requirements** | Active ticket SLA deadlines; customer SLA tier; current time |
| **Decision Authority** | Flag SLA risk; emit SLA breach event |
| **Escalation Rules** | Escalate to Support Manager when: SLA breach probability > 0.7; SLA actually breached |
| **Human Approval Requirements** | None (monitoring only, no direct actions) |
| **Related Agents** | Support Manager AI; Escalation Manager AI; Notification Manager AI |
| **Related Workflows** | support-escalation-manager_v2 |
| **Related Applications** | support-center_v2 |
| **Related Functions** | None |
| **Related Tables** | tickets_v2 (read), customers_v2 (read), system_settings_v2 (read) |
| **Expected Latency** | <1s per check |
| **Expected Accuracy** | 0.95 prediction accuracy target |
| **Priority Level** | High |

---

## 4. Operations Department

### 4.1 Operations Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `operations-manager_v2` |
| **Purpose** | Oversee daily operations, prioritize tasks, and manage resource allocation |
| **Business Responsibilities** | Prioritize operations queue, balance technician workloads, approve overtime, coordinate with dispatch |
| **Inputs** | Department metrics; task completion rates; technician availability; escalation requests |
| **Outputs** | Priority assignments; resource allocations; shift adjustments |
| **Memory Requirements** | Medium-term: workload history, technician performance, task completion trends |
| **Context Requirements** | Active tasks, technician schedules, pending dispatches, urgent tickets |
| **Decision Authority** | Reprioritize tasks within department; approve standard overtime; adjust technician assignments |
| **Escalation Rules** | Escalate to Platform Orchestrator when: resource shortage > 20%; requires cross-department coordination; safety incident |
| **Human Approval Requirements** | Overtime budget approval; technician schedule overrides; safety-related decisions |
| **Related Agents** | Operations Coordinator AI; Work Order Manager AI; Dispatch Manager AI; Scheduling Manager AI |
| **Related Workflows** | daily-standup_v2, urgent-dispatch_v2 |
| **Related Applications** | operations-center_v2 |
| **Related Functions** | create-operations-tasks |
| **Related Tables** | tasks_v2 (read/write), tasks_assignments_v2 (read), technicians_v2 (read), work_orders_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 4.2 Operations Coordinator AI (V2 Evolution)

| Property | Value |
|----------|-------|
| **Agent Name** | `operations-coordinator_v2` |
| **Purpose** | Produce prioritized daily action lists and coordinate operational responses |
| **Business Responsibilities** | Read full operations state, produce prioritized action list (max 10 items), flag blockers, suggest task assignments |
| **Inputs** | All tasks, tickets, appointments, dispatches, technician status, operations log |
| **Outputs** | Prioritized action list; blocker report; assignment suggestions |
| **Memory Requirements** | Short-term: current day's operations snapshot |
| **Context Requirements** | Full operations state: tasks, tickets, appointments, dispatches, technicians, log |
| **Decision Authority** | Prioritize actions; suggest task ownership; flag overdue items |
| **Escalation Rules** | Escalate to Operations Manager when: 3+ critical items simultaneously; resource conflict detected; task blocked > 24h |
| **Human Approval Requirements** | All task assignments require human confirmation |
| **Related Agents** | Operations Manager AI; Task Manager AI; Work Order Manager AI; Dispatch Coordinator AI |
| **Related Workflows** | daily-standup_v2 |
| **Related Applications** | operations-center_v2 |
| **Related Functions** | create-operations-tasks |
| **Related Tables** | tickets_v2 (read), appointments_v2 (read), technicians_v2 (read), customers_v2 (read), tasks_v2 (read/write), operations_log (write) |
| **Expected Latency** | <15s (full scan); <5s (incremental) |
| **Expected Accuracy** | 0.85 recommendation accuracy target |
| **Priority Level** | High |

### 4.3 Work Order Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `operations-work-order-manager_v2` |
| **Purpose** | Manage work order lifecycle from creation through completion |
| **Business Responsibilities** | Generate work orders from appointments, track stage progression, flag stalled work orders, suggest followup actions |
| **Inputs** | `appointment.completed` event; `work_order.created` event; stage change events |
| **Outputs** | Work order status updates; followup suggestions; completion verification |
| **Memory Requirements** | Medium-term: work order stage timings, common bottlenecks |
| **Context Requirements** | Work order details, technician notes, parts used, customer feedback |
| **Decision Authority** | Update work order stage; flag for QA review; generate followup recommendations |
| **Escalation Rules** | Escalate to Operations Manager when: work order stalled > 48h; quality issue detected; parts shortage |
| **Human Approval Requirements** | Work order closure with open issues; non-standard completion |
| **Related Agents** | Operations Manager AI; Appointment Manager AI; Inventory Manager AI; QA Manager AI |
| **Related Workflows** | appointment-assignment_v2 |
| **Related Applications** | technician-portal_v2, operations-center_v2 |
| **Related Functions** | None |
| **Related Tables** | work_orders_v2 (read/write), work_order_stages_v2 (read/write), appointments_v2 (read), technicians_v2 (read), inventory_items_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | Medium |

---

## 5. CRM Department

### 5.1 CRM Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `crm-manager_v2` |
| **Purpose** | Oversee customer relationship management, account health strategy, and retention initiatives |
| **Business Responsibilities** | Monitor account health distribution, prioritize at-risk accounts, approve retention actions, coordinate with support/ops |
| **Inputs** | Account health scan results; risk signals; followup slippage alerts; customer feedback |
| **Outputs** | Retention strategy directives; account priority changes; followup policy adjustments |
| **Memory Requirements** | Long-term: account health history, retention campaign outcomes, customer lifetime value trends |
| **Context Requirements** | Health distribution, active risk signals, retention campaign metrics, open disputes |
| **Decision Authority** | Update account priority; approve standard retention actions; adjust followup schedules |
| **Escalation Rules** | Escalate to Platform Orchestrator when: multiple high-value accounts at risk; requires service discount > $1K; legal involvement needed |
| **Human Approval Requirements** | Account write-offs; service credits > $500; VIP customer escalations |
| **Related Agents** | Account Health Monitor AI; Followup Manager AI; Retention Specialist AI; CX Manager AI |
| **Related Workflows** | account-health-monitoring_v2, followup-slippage-detector_v2 |
| **Related Applications** | crm-center_v2 |
| **Related Functions** | update-account-health-status |
| **Related Tables** | accounts_v2 (read/write), account_health_scans_v2 (read), followups_v2 (read), customers_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 5.2 Account Health Monitor AI (V2 Evolution)

| Property | Value |
|----------|-------|
| **Agent Name** | `crm-account-health-monitor_v2` |
| **Purpose** | Analyze customer account health, detect risk signals, and generate health-driven actions |
| **Business Responsibilities** | Run health scans, detect risk signals (open disputes, overdue followups, negative feedback), flag deteriorating accounts, generate tasks for at-risk accounts |
| **Inputs** | Scheduled scan trigger; customer activity events; dispute status changes; followup slippage events |
| **Outputs** | Health score updates; risk signal records; account health change events; prioritized task list |
| **Memory Requirements** | Medium-term: previous health scores, risk signal history, account activity patterns |
| **Context Requirements** | Account records, customer activity summary, open disputes, overdue followups, recent feedback |
| **Decision Authority** | Update health scores and categories; flag risk signals; create health-related tasks |
| **Escalation Rules** | Escalate to CRM Manager when: health drops 2+ categories in one scan; high-value account at risk; multiple simultaneous risk signals |
| **Human Approval Requirements** | None (health scoring is analytical, not prescriptive) |
| **Related Agents** | CRM Manager AI; Followup Manager AI; Retention Specialist AI; Analytics Manager AI |
| **Related Workflows** | account-health-monitoring_v2 |
| **Related Applications** | crm-center_v2 |
| **Related Functions** | account-health-scan, flag-slipping-followups, update-account-health-status |
| **Related Tables** | accounts_v2 (read/write), account_health_scans_v2 (write), followups_v2 (read), customers_v2 (read), appointments_v2 (read), disputes_v2 (read), tasks_v2 (write), operations_log (write) |
| **Expected Latency** | <30s (full scan); <10s (single account) |
| **Expected Accuracy** | 0.85 risk detection accuracy target |
| **Priority Level** | High |

### 5.3 Followup Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `crm-followup-manager_v2` |
| **Purpose** | Manage followup lifecycle, detect slippage, and coordinate followup execution |
| **Business Responsibilities** | Create followups from triggers (post-service, post-dispute, health-driven), track due dates, detect slippage, suggest next actions |
| **Inputs** | `appointment.completed` event; `dispute.resolved` event; account health changes; customer events |
| **Outputs** | Followup records; slippage alerts; followup completion events; next-action suggestions |
| **Memory Requirements** | Medium-term: followup history per account, optimal followup timing patterns |
| **Context Requirements** | Account context, recent customer interactions, open followups, followup templates |
| **Decision Authority** | Create/complete followups; adjust followup priority; suggest followup type |
| **Escalation Rules** | Escalate to CRM Manager when: followup slippage > 7 days; customer requested no contact; repeated missed followups |
| **Human Approval Requirements** | None (followups are operational, not prescriptive) |
| **Related Agents** | CRM Manager AI; Account Health Monitor AI; Notification Manager AI; Appointment Manager AI |
| **Related Workflows** | followup-slippage-detector_v2 |
| **Related Applications** | crm-center_v2 |
| **Related Functions** | create-followup-tasks |
| **Related Tables** | followups_v2 (read/write), followup_attempts_v2 (write), accounts_v2 (read), customers_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | Medium |

### 5.4 Retention Specialist AI

| Property | Value |
|----------|-------|
| **Agent Name** | `crm-retention-specialist_v2` |
| **Purpose** | Design and execute customer retention campaigns for at-risk and churning accounts |
| **Business Responsibilities** | Analyze churn risk factors, design retention campaigns, suggest win-back offers, track campaign effectiveness |
| **Inputs** | Account health alerts; churn predictions; customer feedback; past campaign results |
| **Outputs** | Retention campaign plans; win-back offers; customer outreach sequence recommendations |
| **Memory Requirements** | Long-term: campaign history, offer effectiveness, customer segment response patterns |
| **Context Requirements** | Account health details, churn probability, customer history, past offers |
| **Decision Authority** | Design campaign structure; segment customers; suggest offer types |
| **Escalation Rules** | Escalate to CRM Manager when: campaign requires > $2K discount; VIP customer at churn risk; legal constraints identified |
| **Human Approval Requirements** | All financial offers require human approval |
| **Related Agents** | CRM Manager AI; Account Health Monitor AI; CX Manager AI; Notification Manager AI |
| **Related Workflows** | customer-satisfaction-monitor_v2 |
| **Related Applications** | crm-center_v2 |
| **Related Functions** | None |
| **Related Tables** | accounts_v2 (read), customers_v2 (read), followups_v2 (read), feedback_v2 (read), events_v2 (read) |
| **Expected Latency** | <10s |
| **Expected Accuracy** | 0.80 campaign effectiveness target |
| **Priority Level** | Medium |

---

## 6. Dispatch Department

### 6.1 Dispatch Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `dispatch-manager_v2` |
| **Purpose** | Oversee dispatch operations, manage technician routing, and handle dispatch escalations |
| **Business Responsibilities** | Monitor dispatch queue, approve dispatch reassignments, manage emergency protocols, coordinate with operations |
| **Inputs** | Dispatch created/sent/declined events; technician availability changes; emergency alerts |
| **Outputs** | Dispatch approval decisions; reassignment orders; escalation routing; emergency response directives |
| **Memory Requirements** | Medium-term: dispatch patterns, technician acceptance rates, optimal routing history |
| **Context Requirements** | Active dispatches, technician locations, customer urgency, traffic/weather data |
| **Decision Authority** | Approve dispatch reassignments; set dispatch priority; activate emergency protocols |
| **Escalation Rules** | Escalate to Operations Manager when: no available technician within 30min; 3+ declines on one dispatch; emergency situation |
| **Human Approval Requirements** | Emergency dispatch overrides; after-hours technician activation |
| **Related Agents** | Dispatch Coordinator AI; Technician Dispatcher AI; Emergency Response AI; Operations Manager AI |
| **Related Workflows** | urgent-dispatch_v2 |
| **Related Applications** | operations-center_v2 |
| **Related Functions** | dispatch-notifications, finalize-dispatch |
| **Related Tables** | dispatches_v2 (read/write), technicians_v2 (read), tickets_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | Critical |

### 6.2 Dispatch Coordinator AI

| Property | Value |
|----------|-------|
| **Agent Name** | `dispatch-coordinator_v2` |
| **Purpose** | Route urgent dispatches to the most appropriate technician based on proximity, skill, and availability |
| **Business Responsibilities** | Assess dispatch urgency, match technicians by skill/location/availability, generate dispatch proposals, track acknowledgment |
| **Inputs** | `ticket.classified` (urgent) event; technician location and availability; traffic data |
| **Outputs** | Technician dispatch match; dispatch proposal; acknowledgment tracking |
| **Memory Requirements** | Short-term: current dispatch session, technician locations |
| **Context Requirements** | Ticket details, customer location, technician list with skills/availability/rating, current traffic |
| **Decision Authority** | Select primary and backup technician; set dispatch time window |
| **Escalation Rules** | Escalate to Dispatch Manager when: no technician available within service area; all technicians declined; after-hours dispatch needed |
| **Human Approval Requirements** | None (dispatch recommendations, not final dispatch) |
| **Related Agents** | Dispatch Manager AI; Technician Dispatcher AI; Emergency Response AI; Technician Suggester AI |
| **Related Workflows** | urgent-dispatch_v2 |
| **Related Applications** | operations-center_v2 |
| **Related Functions** | dispatch-notifications, finalize-dispatch |
| **Related Tables** | dispatches_v2 (read/write), technicians_v2 (read), technician_skills_v2 (read), tickets_v2 (read), appointments_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 match accuracy target |
| **Priority Level** | Critical |

### 6.3 Technician Dispatcher AI

| Property | Value |
|----------|-------|
| **Agent Name** | `dispatch-technician-dispatcher_v2` |
| **Purpose** | Execute technician dispatch by sending notifications, tracking responses, and managing the dispatch lifecycle |
| **Business Responsibilities** | Send dispatch notifications, track acceptance/decline, manage timeout, trigger reassignment on decline, update dispatch state |
| **Inputs** | Dispatch proposal from Coordinator; technician response events; timeout triggers |
| **Outputs** | `dispatch.sent` event; `dispatch.acknowledged` update; `dispatch.declined` event; reassignment request |
| **Memory Requirements** | Short-term: dispatch lifecycle state per active dispatch |
| **Context Requirements** | Dispatch details, technician contact info, notification channel preferences |
| **Decision Authority** | Send dispatch notification; update dispatch state; trigger reassignment |
| **Escalation Rules** | Escalate to Dispatch Manager when: no acknowledgment within 10min; 2nd decline received; technical failure in notification delivery |
| **Human Approval Requirements** | None (execution agent) |
| **Related Agents** | Dispatch Coordinator AI; Dispatch Manager AI; Notification Manager AI; Channel Router AI |
| **Related Workflows** | urgent-dispatch_v2 |
| **Related Applications** | operations-center_v2, technician-portal_v2 |
| **Related Functions** | dispatch-notifications, finalize-dispatch |
| **Related Tables** | dispatches_v2 (read/write), technicians_v2 (read), notifications_v2 (write) |
| **Expected Latency** | <2s |
| **Expected Accuracy** | 0.99 (deterministic execution) |
| **Priority Level** | Critical |

### 6.4 Emergency Response AI

| Property | Value |
|----------|-------|
| **Agent Name** | `dispatch-emergency-response_v2` |
| **Purpose** | Handle emergency dispatch scenarios requiring immediate technician deployment |
| **Business Responsibilities** | Identify emergency-level tickets, activate emergency dispatch protocol, bypass standard queue, coordinate with nearest available technician, notify managers |
| **Inputs** | `ticket.created` (emergency) event; `dispatch.escalated` (emergency) event; system alerts |
| **Outputs** | Emergency dispatch activation; bypass routing; manager alert; expedited dispatch record |
| **Memory Requirements** | Short-term: emergency session state |
| **Context Requirements** | Emergency ticket details, nearest technician, manager contact info, emergency protocols |
| **Decision Authority** | Activate emergency protocol; bypass standard dispatch queue; directly assign nearest technician |
| **Escalation Rules** | Escalate simultaneously to Dispatch Manager AND Operations Manager AND Platform Orchestrator for ALL emergency events |
| **Human Approval Requirements** | Emergency protocol requires human co-sign within 5min or auto-escalation |
| **Related Agents** | Dispatch Manager AI; Dispatch Coordinator AI; Operations Manager AI; Platform Orchestrator AI; Notification Manager AI |
| **Related Workflows** | urgent-dispatch_v2 |
| **Related Applications** | operations-center_v2 |
| **Related Functions** | dispatch-notifications |
| **Related Tables** | dispatches_v2 (read/write), tickets_v2 (read), technicians_v2 (read), notifications_v2 (write) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.95 emergency identification |
| **Priority Level** | Critical |

---

## 7. Scheduling Department

### 7.1 Scheduling Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `scheduling-manager_v2` |
| **Purpose** | Oversee appointment scheduling operations and optimize resource utilization |
| **Business Responsibilities** | Monitor scheduling KPIs, balance technician load, approve schedule overrides, optimize time slot allocation |
| **Inputs** | Appointment queue metrics; technician utilization reports; schedule conflict alerts; customer preferences |
| **Outputs** | Scheduling policy adjustments; load-balancing directives; override approvals |
| **Memory Requirements** | Medium-term: utilization patterns, peak hour analysis, scheduling conflict history |
| **Context Requirements** | Current schedule load, technician availability, customer demand forecast |
| **Decision Authority** | Adjust time slot availability; approve same-day scheduling; modify scheduling rules |
| **Escalation Rules** | Escalate to Platform Orchestrator when: schedule utilization > 95%; requires cross-department coordination; system outage affecting scheduling |
| **Human Approval Requirements** | Out-of-hours scheduling; scheduling policy exceptions |
| **Related Agents** | Appointment Scheduler AI; Technician Suggester AI; Appointment Manager AI; Operations Manager AI |
| **Related Workflows** | appointment-assignment_v2 |
| **Related Applications** | appointment-center_v2 |
| **Related Functions** | assign-appointment-technician |
| **Related Tables** | appointments_v2 (read), technicians_v2 (read), technician_skills_v2 (read), system_settings_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 7.2 Appointment Scheduler AI

| Property | Value |
|----------|-------|
| **Agent Name** | `scheduling-appointment-scheduler_v2` |
| **Purpose** | Optimize appointment slot assignment to balance customer preference, technician availability, and business goals |
| **Business Responsibilities** | Match appointment requests to optimal time slots, minimize travel time between appointments, balance technician workload, suggest alternatives for conflicts |
| **Inputs** | `appointment.created` event; customer time preferences; technician schedules; travel time data |
| **Outputs** | Appointment slot recommendation; alternative suggestions; schedule optimization proposals |
| **Memory Requirements** | Medium-term: scheduling patterns, peak demand forecasts, travel time averages |
| **Context Requirements** | Customer preferences, technician schedules and skills, existing appointments, travel distances |
| **Decision Authority** | Suggest optimal time slot; propose technician assignment; suggest schedule adjustments |
| **Escalation Rules** | Escalate to Scheduling Manager when: no slot available within 48h of request; customer preference conflict; resource shortage |
| **Human Approval Requirements** | None (suggestions only, not confirmed scheduling) |
| **Related Agents** | Scheduling Manager AI; Technician Suggester AI; Appointment Manager AI; Reminder Coordinator AI |
| **Related Workflows** | appointment-assignment_v2 |
| **Related Applications** | appointment-center_v2 |
| **Related Functions** | assign-appointment-technician |
| **Related Tables** | appointments_v2 (read/write), technicians_v2 (read), technician_skills_v2 (read), customers_v2 (read) |
| **Expected Latency** | <5s (single appointment); <30s (batch optimization) |
| **Expected Accuracy** | 0.90 suggestion acceptance rate target |
| **Priority Level** | High |

### 7.3 Technician Suggester AI (V2 Evolution)

| Property | Value |
|----------|-------|
| **Agent Name** | `scheduling-technician-suggester_v2` |
| **Purpose** | Recommend the best technician for a service job based on skill match, workload, rating, and location |
| **Business Responsibilities** | Score technicians by skill match, workload balance, historical rating, scheduling conflicts, proximity, and language match |
| **Inputs** | Service request details; technician profiles and skills; current schedules; customer location; language preferences |
| **Outputs** | Ranked technician list (primary + 2 alternatives) with match scores and reasoning |
| **Memory Requirements** | Short-term: request context only |
| **Context Requirements** | Service type required, technician availability, skill certifications, customer location, current workload, rating history |
| **Decision Authority** | Rank technicians; suggest primary and alternatives |
| **Escalation Rules** | Escalate to Scheduling Manager when: no technician has skill match > 0.6; all technicians fully booked; geographic coverage gap |
| **Human Approval Requirements** | None (recommendation only) |
| **Related Agents** | Scheduling Manager AI; Appointment Scheduler AI; Dispatch Coordinator AI; Operations Manager AI |
| **Related Workflows** | appointment-assignment_v2, urgent-dispatch_v2 |
| **Related Applications** | appointment-center_v2 |
| **Related Functions** | assign-appointment-technician |
| **Related Tables** | technicians_v2 (read), technician_skills_v2 (read), appointments_v2 (read), tickets_v2 (read), dispatches_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 recommendation accuracy target |
| **Priority Level** | High |

---

## 8. Appointment Department

### 8.1 Appointment Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `appointment-manager_v2` |
| **Purpose** | Manage the full appointment lifecycle from booking to completion |
| **Business Responsibilities** | Track appointment state transitions, handle cancellations and reschedules, coordinate reminders, manage no-shows |
| **Inputs** | Appointment state change events; customer requests; technician status updates |
| **Outputs** | Appointment state updates; reschedule/cancel decisions; reminder schedules; no-show actions |
| **Memory Requirements** | Medium-term: appointment lifecycle patterns, cancellation trends, no-show predictors |
| **Context Requirements** | Appointment details, customer history, technician schedule, service type |
| **Decision Authority** | Process standard cancellations; approve reschedules within policy; initiate no-show protocol |
| **Escalation Rules** | Escalate to Scheduling Manager when: 3+ reschedules on same appointment; late cancellation (< 2h); VIP customer appointment |
| **Human Approval Requirements** | Non-standard cancellations; penalty waivers; emergency reschedules |
| **Related Agents** | Appointment Scheduler AI; Reminder Coordinator AI; No-Show Handler AI; Customer Satisfaction AI |
| **Related Workflows** | appointment-reminders_v2 |
| **Related Applications** | appointment-center_v2 |
| **Related Functions** | fetch-upcoming-appointments |
| **Related Tables** | appointments_v2 (read/write), appointment_reminders_v2 (read), customers_v2 (read), technicians_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 8.2 Reminder Coordinator AI

| Property | Value |
|----------|-------|
| **Agent Name** | `appointment-reminder-coordinator_v2` |
| **Purpose** | Orchestrate appointment reminders at optimal times across preferred channels |
| **Business Responsibilities** | Schedule reminder timing (24h, 2h, 30min), select optimal channel per customer, track delivery, handle failed reminders |
| **Inputs** | `appointment.confirmed` event; `appointment.rescheduled` event; reminder trigger (cron); customer channel preferences |
| **Outputs** | Reminder schedule; channel selection; delivery tracking; fallback actions on failure |
| **Memory Requirements** | Medium-term: reminder delivery history, channel preference patterns |
| **Context Requirements** | Appointment details, customer contact preferences, template availability, channel health |
| **Decision Authority** | Schedule reminder timing; select primary and fallback channels; retry on failure |
| **Escalation Rules** | Escalate to Appointment Manager when: all channels fail for critical reminder; customer previously opted out; reminder bounces repeatedly |
| **Human Approval Requirements** | None (reminder execution is operational) |
| **Related Agents** | Appointment Manager AI; Notification Manager AI; Channel Router AI; Template Manager AI |
| **Related Workflows** | appointment-reminders_v2 |
| **Related Applications** | appointment-center_v2 |
| **Related Functions** | dispatch-notifications, fetch-upcoming-appointments |
| **Related Tables** | appointment_reminders_v2 (read/write), appointments_v2 (read), notifications_v2 (write), notification_templates_v2 (read) |
| **Expected Latency** | <2s |
| **Expected Accuracy** | 0.95 delivery rate target |
| **Priority Level** | Medium |

### 8.3 No-Show Handler AI

| Property | Value |
|----------|-------|
| **Agent Name** | `appointment-no-show-handler_v2` |
| **Purpose** | Manage no-show situations by coordinating followup, rescheduling, and penalty application |
| **Business Responsibilities** | Detect no-show conditions, initiate customer contact, propose reschedule options, apply no-show penalties per policy, document incident |
| **Inputs** | `appointment.no_show` event; technician arrival confirmation; no-show policy rules |
| **Outputs** | No-show record; customer contact request; reschedule proposal; penalty recommendation |
| **Memory Requirements** | Short-term: no-show session; Medium-term: customer no-show history |
| **Context Requirements** | Appointment details, customer contact info, no-show policy, customer history (repeat no-show?), technician notes |
| **Decision Authority** | Classify as no-show vs. late arrival; propose reschedule; apply standard penalty |
| **Escalation Rules** | Escalate to Appointment Manager when: repeat no-show (> 2); customer disputes no-show; VIP customer; penalty waiver requested |
| **Human Approval Requirements** | Penalty waiver; no-show policy exception |
| **Related Agents** | Appointment Manager AI; Followup Manager AI; CRM Manager AI; Notification Manager AI |
| **Related Workflows** | appointment-reminders_v2 |
| **Related Applications** | appointment-center_v2 |
| **Related Functions** | dispatch-notifications |
| **Related Tables** | appointments_v2 (read/write), customers_v2 (read), followups_v2 (write), notifications_v2 (write) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 classification accuracy |
| **Priority Level** | Medium |

---

## 9. Knowledge Department

### 9.1 Knowledge Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `knowledge-manager_v2` |
| **Purpose** | Curate the knowledge base, maintain content quality, and identify knowledge gaps |
| **Business Responsibilities** | Review article quality, approve new articles, identify outdated content, analyze article usage metrics, prioritize content updates |
| **Inputs** | Article usage metrics; user feedback; content age reports; gap analysis from Knowledge Gap Analyzer |
| **Outputs** | Content curation decisions; update priorities; new article requests; archiving decisions |
| **Memory Requirements** | Long-term: content lifecycle, article performance trends, category taxonomy |
| **Context Requirements** | Knowledge base metrics, article quality scores, usage patterns, customer feedback on articles |
| **Decision Authority** | Approve/reject new articles; archive outdated content; update article priority; reorganize categories |
| **Escalation Rules** | Escalate to Platform Orchestrator when: knowledge gap causing support escalation increase; content quality consistently below threshold |
| **Human Approval Requirements** | Content policy changes; knowledge base restructuring |
| **Related Agents** | Knowledge Curator AI; Article Suggester AI; Request Classifier AI; Support Reply Drafter AI |
| **Related Workflows** | ticket-intake_v2 (article suggestions) |
| **Related Applications** | support-center_v2 |
| **Related Functions** | None |
| **Related Tables** | knowledge_articles_v2 (read/write), knowledge_categories_v2 (read/write) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | Medium |

### 9.2 Knowledge Curator AI

| Property | Value |
|----------|-------|
| **Agent Name** | `knowledge-curator_v2` |
| **Purpose** | Maintain knowledge article quality, update content, and ensure accuracy |
| **Business Responsibilities** | Review article drafts for accuracy and clarity, update articles based on new resolutions, tag articles with metadata, link related articles |
| **Inputs** | New article drafts; resolved tickets with new solutions; outdated article flags; user suggestions |
| **Outputs** | Article edits; metadata updates; related article links; quality scores |
| **Memory Requirements** | Medium-term: article version history, editorial decisions |
| **Context Requirements** | Article content, related tickets, reference materials, style guidelines |
| **Decision Authority** | Edit article content; update tags and categories; link related articles |
| **Escalation Rules** | Escalate to Knowledge Manager when: article requires major rewrite; conflicting information with existing articles; policy interpretation needed |
| **Human Approval Requirements** | Medical/legal/financial content requires human review |
| **Related Agents** | Knowledge Manager AI; Article Suggester AI; Support Reply Drafter AI |
| **Related Workflows** | None |
| **Related Applications** | support-center_v2 |
| **Related Functions** | None |
| **Related Tables** | knowledge_articles_v2 (read/write), knowledge_categories_v2 (read) |
| **Expected Latency** | <10s |
| **Expected Accuracy** | 0.90 accuracy target |
| **Priority Level** | Low |

### 9.3 Article Suggester AI

| Property | Value |
|----------|-------|
| **Agent Name** | `knowledge-article-suggester_v2` |
| **Purpose** | Suggest relevant knowledge articles for support tickets and customer inquiries |
| **Business Responsibilities** | Match ticket content to articles, rank by relevance, suggest articles in draft replies, identify when no article exists (gap) |
| **Inputs** | Ticket content (subject, message); classified request type; customer history |
| **Outputs** | Ranked article list with relevance scores; gap signal when no match > 0.5 |
| **Memory Requirements** | Short-term: none (stateless semantic search) |
| **Context Requirements** | Article corpus with embeddings, ticket content, request type classification |
| **Decision Authority** | Select and rank relevant articles |
| **Escalation Rules** | Escalate to Knowledge Curator when: no article matches with score > 0.5; repeated access attempts to same gap |
| **Human Approval Requirements** | None (suggestions only) |
| **Related Agents** | Knowledge Manager AI; Knowledge Curator AI; Request Classifier AI; Support Reply Drafter AI |
| **Related Workflows** | ticket-intake_v2 |
| **Related Applications** | support-center_v2, customer-portal_v2 |
| **Related Functions** | None |
| **Related Tables** | knowledge_articles_v2 (read), knowledge_categories_v2 (read), tickets_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.85 relevance precision target |
| **Priority Level** | Medium |

---

## 10. Analytics Department

### 10.1 Analytics Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `analytics-manager_v2` |
| **Purpose** | Oversee business intelligence operations and ensure data-driven decision making |
| **Business Responsibilities** | Prioritize analytics initiatives, approve report definitions, monitor data quality, coordinate with department managers on metric definitions |
| **Inputs** | Report usage metrics; data quality alerts; KPI trends; manager requests for analysis |
| **Outputs** | Analytics priorities; report approvals; metric definition changes; data quality directives |
| **Memory Requirements** | Long-term: KPI baselines and trends, report performance, data quality history |
| **Context Requirements** | KPI dashboard, data quality metrics, pending analysis requests, report catalog |
| **Decision Authority** | Approve new report definitions; set metric targets; prioritize analysis requests |
| **Escalation Rules** | Escalate to Platform Orchestrator when: data quality issues affecting multiple departments; metric targets consistently missed; requires platform-level data changes |
| **Human Approval Requirements** | Metric definition changes; external data sources; report distribution to external stakeholders |
| **Related Agents** | Trend Analyzer AI; Predictive Modeler AI; Report Generator AI; ALL Department Manager AIs |
| **Related Workflows** | daily-standup_v2 |
| **Related Applications** | analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | analytics_reports_v2 (read/write), analytics_schedules_v2 (read/write), events_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.95 confidence threshold |
| **Priority Level** | High |

### 10.2 Trend Analyzer AI

| Property | Value |
|----------|-------|
| **Agent Name** | `analytics-trend-analyzer_v2` |
| **Purpose** | Detect trends, anomalies, and patterns across all business metrics |
| **Business Responsibilities** | Monitor KPI streams, detect statistically significant changes, identify correlations between events and metrics, generate trend alerts |
| **Inputs** | ALL domain events; KPI time-series data; historical baselines |
| **Outputs** | Trend reports; anomaly alerts; correlation analysis; trend forecasts |
| **Memory Requirements** | Long-term: trend baselines, seasonal patterns, anomaly history |
| **Context Requirements** | Event stream, historical data, metric definitions, department context |
| **Decision Authority** | Flag significant trends; trigger anomaly alerts; suggest root cause correlations |
| **Escalation Rules** | Escalate to Analytics Manager when: anomaly severity > 3 sigma; correlated anomalies across 2+ departments; potential business impact > 5% |
| **Human Approval Requirements** | None (analytical, not prescriptive) |
| **Related Agents** | Analytics Manager AI; Predictive Modeler AI; Report Generator AI; ALL Department Manager AIs |
| **Related Workflows** | daily-standup_v2 |
| **Related Applications** | analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | events_v2 (read), analytics_reports_v2 (read) |
| **Expected Latency** | <30s (full analysis); <5s (incremental) |
| **Expected Accuracy** | 0.90 anomaly detection precision target |
| **Priority Level** | High |

### 10.3 Predictive Modeler AI

| Property | Value |
|----------|-------|
| **Agent Name** | `analytics-predictive-modeler_v2` |
| **Purpose** | Build and maintain predictive models for churn, demand, scheduling, and other business forecasts |
| **Business Responsibilities** | Train prediction models (churn, demand, no-show, SLA breach), evaluate model accuracy, retrain on new data, deploy updated model weights |
| **Inputs** | Historical events and outcomes; model performance metrics; retraining triggers |
| **Outputs** | Prediction scores per entity; model accuracy reports; retraining recommendations |
| **Memory Requirements** | Long-term: model versions, training data, accuracy history |
| **Context Requirements** | Feature data for predictions; current model weights; prediction targets |
| **Decision Authority** | Update prediction scores; trigger model retraining; deploy updated models |
| **Escalation Rules** | Escalate to Analytics Manager when: model accuracy drops > 10%; data drift detected; new feature engineering needed |
| **Human Approval Requirements** | New model deployment requires validation; model architecture changes |
| **Related Agents** | Analytics Manager AI; Trend Analyzer AI; Account Health Monitor AI; SLA Monitor AI; No-Show Handler AI |
| **Related Workflows** | account-health-monitoring_v2 |
| **Related Applications** | analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | events_v2 (read), accounts_v2 (read), tickets_v2 (read), appointments_v2 (read), feedback_v2 (read) |
| **Expected Latency** | <30s (batch prediction); <5s (single prediction) |
| **Expected Accuracy** | >0.85 model accuracy target |
| **Priority Level** | High |

---

## 11. Administration Department

### 11.1 Admin Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `admin-manager_v2` |
| **Purpose** | Oversee system administration, user management, and platform configuration |
| **Business Responsibilities** | Monitor system health, manage user lifecycle, review audit logs, approve configuration changes |
| **Inputs** | System health alerts; audit log events; user management requests; configuration change requests |
| **Outputs** | System configuration decisions; user provisioning approvals; security directives |
| **Memory Requirements** | Long-term: system configuration history, audit patterns, user activity trends |
| **Context Requirements** | System health dashboard, user accounts, role definitions, audit log summary |
| **Decision Authority** | Approve standard user provisioning; approve configuration changes; set feature flags |
| **Escalation Rules** | Escalate to Platform Orchestrator when: security incident detected; system health critical; configuration change  affecting 3+ departments |
| **Human Approval Requirements** | User deactivation; role/permission changes; security policy changes; connector credential resets |
| **Related Agents** | System Configuration AI; Connector Manager AI; ALL Department Manager AIs |
| **Related Workflows** | None |
| **Related Applications** | admin-center_v2 |
| **Related Functions** | None |
| **Related Tables** | users_v2 (read/write), user_roles_v2 (read/write), user_sessions_v2 (read), role_permissions_v2 (read/write), system_settings_v2 (read/write), feature_flags_v2 (read/write), audit_log_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.95 confidence threshold |
| **Priority Level** | High |

### 11.2 System Configuration AI

| Property | Value |
|----------|-------|
| **Agent Name** | `admin-system-config_v2` |
| **Purpose** | Manage system settings, feature flags, and platform configuration |
| **Business Responsibilities** | Apply configuration changes, manage feature flag lifecycle, validate config consistency, audit configuration history |
| **Inputs** | Configuration change requests; feature flag toggle requests; system defaults |
| **Outputs** | Configuration updates; feature flag changes; validation reports; config change audit records |
| **Memory Requirements** | Medium-term: configuration version history, default settings |
| **Context Requirements** | Current config, change request, impact analysis, dependency graph |
| **Decision Authority** | Apply routine configuration changes; toggle non-critical feature flags |
| **Escalation Rules** | Escalate to Admin Manager when: configuration change affects multiple apps; feature flag toggles core functionality; config validation fails |
| **Human Approval Requirements** | ALL configuration changes require human approval before application |
| **Related Agents** | Admin Manager AI; Connector Manager AI; System Configuration AI |
| **Related Workflows** | None |
| **Related Applications** | admin-center_v2 |
| **Related Functions** | None |
| **Related Tables** | system_settings_v2 (read/write), feature_flags_v2 (read/write), audit_log_v2 (write) |
| **Expected Latency** | <2s |
| **Expected Accuracy** | 0.99 (deterministic execution) |
| **Priority Level** | Medium |

### 11.3 Connector Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `admin-connector-manager_v2` |
| **Purpose** | Manage third-party connector configuration, health monitoring, and credential lifecycle |
| **Business Responsibilities** | Monitor connector health, rotate credentials, handle connector failures, update connector configurations |
| **Inputs** | Connector health check results; credential expiry alerts; connector failure events |
| **Outputs** | Connector health updates; credential rotation requests; connector config changes; failure escalation |
| **Memory Requirements** | Medium-term: connector health history, credential expiry schedule |
| **Context Requirements** | Connector configurations, health status, credential status, rate limits |
| **Decision Authority** | Retry failed connector calls; update non-credential config |
| **Escalation Rules** | Escalate to Admin Manager when: connector down > 15min; credential rotation fails; rate limit exceeded persistently |
| **Human Approval Requirements** | Credential changes; connector deactivation; new connector setup |
| **Related Agents** | Admin Manager AI; System Configuration AI; Notification Manager AI |
| **Related Workflows** | None |
| **Related Applications** | admin-center_v2 |
| **Related Functions** | None |
| **Related Tables** | connectors_v2 (read/write), audit_log_v2 (write), system_settings_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.95 connector health detection |
| **Priority Level** | Medium |

---

## 12. Quality Assurance Department

### 12.1 QA Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `qa-manager_v2` |
| **Purpose** | Oversee quality assurance across all customer-facing communications and resolutions |
| **Business Responsibilities** | Set quality standards, review quality scores, approve quality exceptions, track QA metrics |
| **Inputs** | Quality score reports; compliance violation alerts; audit triggers; feedback data |
| **Outputs** | Quality directives; exception approvals; training recommendations; QA metric reports |
| **Memory Requirements** | Medium-term: quality trends, common issue patterns, agent performance history |
| **Context Requirements** | Quality dashboard, active violations, pending audits, quality benchmarks |
| **Decision Authority** | Set quality thresholds; approve quality exceptions; recommend training |
| **Escalation Rules** | Escalate to Platform Orchestrator when: quality score drops below 70% for 3+ days; compliance violation with legal implications; systemic quality issue |
| **Human Approval Requirements** | Quality policy changes; personnel-related quality actions |
| **Related Agents** | Response Quality Monitor AI; Compliance Monitor AI; Support Manager AI; CX Manager AI |
| **Related Workflows** | support-escalation-manager_v2 |
| **Related Applications** | admin-center_v2, support-center_v2 |
| **Related Functions** | None |
| **Related Tables** | tickets_v2 (read), ticket_messages_v2 (read), disputes_v2 (read), feedback_v2 (read), audit_log_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 12.2 Response Quality Monitor AI

| Property | Value |
|----------|-------|
| **Agent Name** | `qa-response-quality-monitor_v2` |
| **Purpose** | Score the quality of AI-drafted and human-written responses for accuracy, tone, and completeness |
| **Business Responsibilities** | Analyze draft replies for quality metrics (accuracy, tone, completeness, compliance), flag low-quality drafts, calculate quality scores per agent |
| **Inputs** | Draft reply content; ticket context; quality criteria; historical scores |
| **Outputs** | Quality score (0-1); quality dimension breakdown; improvement suggestions; low-quality alerts |
| **Memory Requirements** | Medium-term: scoring patterns, common quality issues |
| **Context Requirements** | Full reply content, ticket thread, customer history, quality rubric |
| **Decision Authority** | Score response quality; flag below-threshold drafts |
| **Escalation Rules** | Escalate to QA Manager when: quality score < 0.5; repeated low scores from same agent; customer complaint about quality |
| **Human Approval Requirements** | None (scoring is analytical) |
| **Related Agents** | QA Manager AI; Compliance Monitor AI; Support Reply Drafter AI; Support Manager AI |
| **Related Workflows** | support-escalation-manager_v2 |
| **Related Applications** | support-center_v2 |
| **Related Functions** | None |
| **Related Tables** | tickets_v2 (read), ticket_messages_v2 (read), customers_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.85 quality score accuracy target |
| **Priority Level** | Medium |

### 12.3 Compliance Monitor AI

| Property | Value |
|----------|-------|
| **Agent Name** | `qa-compliance-monitor_v2` |
| **Purpose** | Ensure all communications and actions comply with regulatory requirements and company policies |
| **Business Responsibilities** | Scan content for policy violations, check dispute resolutions against compliance rules, monitor data access patterns, generate compliance reports |
| **Inputs** | Communications content; dispute resolutions; data access audit log; compliance rules |
| **Outputs** | Compliance violation alerts; compliance audit reports; remediation suggestions |
| **Memory Requirements** | Long-term: compliance rules, violation history, regulatory updates |
| **Context Requirements** | Compliance rule set, content to check, audit log, customer PII handling rules |
| **Decision Authority** | Flag compliance violations; block non-compliant content |
| **Escalation Rules** | Escalate IMMEDIATELY to QA Manager AND Admin Manager when: PII breach detected; regulatory violation; repeated compliance failures |
| **Human Approval Requirements** | ALL compliance violations require human review |
| **Related Agents** | QA Manager AI; Admin Manager AI; Response Quality Monitor AI; Support Manager AI |
| **Related Workflows** | None |
| **Related Applications** | admin-center_v2 |
| **Related Functions** | None |
| **Related Tables** | tickets_v2 (read), ticket_messages_v2 (read), disputes_v2 (read), audit_log_v2 (read), system_settings_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.95 violation detection target |
| **Priority Level** | Critical |

---

## 13. Reporting Department

### 13.1 Reporting Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `reporting-manager_v2` |
| **Purpose** | Oversee report generation, scheduling, and distribution to stakeholders |
| **Business Responsibilities** | Manage report catalog, approve report schedules, monitor report delivery, coordinate with departments on reporting needs |
| **Inputs** | Report generation requests; schedule change requests; delivery failure alerts; stakeholder feedback |
| **Outputs** | Report scheduling decisions; distribution approvals; catalog updates |
| **Memory Requirements** | Long-term: report catalog, schedule history, distribution preferences |
| **Context Requirements** | Report catalog, active schedules, delivery metrics, stakeholder list |
| **Decision Authority** | Approve/change report schedules; add/remove report subscribers; set report priorities |
| **Escalation Rules** | Escalate to Analytics Manager when: report delivery consistently fails; report data quality issues; new report requires new data sources |
| **Human Approval Requirements** | Report distribution to external parties; new report type approval |
| **Related Agents** | Report Generator AI; Report Distributor AI; Analytics Manager AI |
| **Related Workflows** | daily-standup_v2 |
| **Related Applications** | analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | analytics_reports_v2 (read/write), analytics_schedules_v2 (read/write) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.95 confidence threshold |
| **Priority Level** | Medium |

### 13.2 Report Generator AI

| Property | Value |
|----------|-------|
| **Agent Name** | `reporting-generator_v2` |
| **Purpose** | Generate scheduled and ad-hoc reports by aggregating data from across the platform |
| **Business Responsibilities** | Execute report queries, aggregate data, format results (tables, charts, summaries), validate data completeness |
| **Inputs** | Report definition; schedule trigger; ad-hoc request; data source references |
| **Outputs** | Generated report content; data validation status; rendering-complete signal |
| **Memory Requirements** | Short-term: none (stateless per report generation) |
| **Context Requirements** | Report definition, data sources, time range, filters, format template |
| **Decision Authority** | Execute report queries; choose optimal aggregation method; flag data anomalies |
| **Escalation Rules** | Escalate to Reporting Manager when: query timeout > 30s; data source unavailable; data quality check fails |
| **Human Approval Requirements** | None (execution agent) |
| **Related Agents** | Reporting Manager AI; Report Distributor AI; Analytics Manager AI |
| **Related Workflows** | daily-standup_v2 |
| **Related Applications** | analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | analytics_reports_v2 (read), analytics_schedules_v2 (read), events_v2 (read), ALL domain tables (read) |
| **Expected Latency** | <30s (standard); <5min (complex) |
| **Expected Accuracy** | 0.99 data accuracy (deterministic aggregation) |
| **Priority Level** | Medium |

### 13.3 Report Distributor AI

| Property | Value |
|----------|-------|
| **Agent Name** | `reporting-distributor_v2` |
| **Purpose** | Deliver generated reports to stakeholders through appropriate channels |
| **Business Responsibilities** | Route reports to subscribers, select delivery channel (email, in-app, Slack), track delivery, handle delivery failures, maintain distribution lists |
| **Inputs** | Completed report; subscriber list; channel preferences; distribution schedule |
| **Outputs** | Distributed report; delivery confirmation; failure alert |
| **Memory Requirements** | Medium-term: distribution history, subscriber preferences |
| **Context Requirements** | Report content, subscriber list, channel configuration, delivery templates |
| **Decision Authority** | Select delivery channel; retry failed deliveries; update distribution list |
| **Escalation Rules** | Escalate to Reporting Manager when: delivery failure to key stakeholder; distribution list needs update; channel unavailable |
| **Human Approval Requirements** | None (execution agent) |
| **Related Agents** | Reporting Manager AI; Report Generator AI; Notification Manager AI; Channel Router AI |
| **Related Workflows** | None |
| **Related Applications** | analytics-center_v2, notification-center_v2 |
| **Related Functions** | dispatch-notifications |
| **Related Tables** | analytics_reports_v2 (read), analytics_schedules_v2 (read), notifications_v2 (write) |
| **Expected Latency** | <10s |
| **Expected Accuracy** | 0.99 delivery rate target |
| **Priority Level** | Low |

---

## 14. Notification Department

### 14.1 Notification Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `notification-manager_v2` |
| **Purpose** | Oversee all outbound notification operations across channels and templates |
| **Business Responsibilities** | Monitor notification delivery rates, manage channel health, approve template changes, handle escalation of delivery failures |
| **Inputs** | Notification delivery metrics; channel health alerts; template requests; delivery failure events |
| **Outputs** | Channel routing policy; template approval decisions; delivery optimization directives |
| **Memory Requirements** | Medium-term: delivery rate trends, channel health history, template performance |
| **Context Requirements** | Delivery metrics, channel status, active failures, template library |
| **Decision Authority** | Adjust channel routing rules; approve standard template updates; modify retry policies |
| **Escalation Rules** | Escalate to Platform Orchestrator when: all channels down for > 5min; delivery rate drops below 90%; critical notification failure |
| **Human Approval Requirements** | Channel deactivation; new channel setup; mass notification approval |
| **Related Agents** | Channel Optimizer AI; Template Manager AI; ALL Worker Agents that trigger notifications |
| **Related Workflows** | ALL workflows (notification dispatch) |
| **Related Applications** | notification-center_v2 |
| **Related Functions** | dispatch-notifications |
| **Related Tables** | notifications_v2 (read/write), notification_channels_v2 (read/write), notification_templates_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.95 confidence threshold |
| **Priority Level** | High |

### 14.2 Channel Optimizer AI

| Property | Value |
|----------|-------|
| **Agent Name** | `notification-channel-optimizer_v2` |
| **Purpose** | Select the optimal communication channel for each notification based on recipient preferences, urgency, and channel health |
| **Business Responsibilities** | Evaluate channel availability, score channels by delivery probability, select primary/fallback channels, track per-recipient channel preference |
| **Inputs** | Notification request; recipient preferences; channel health status; delivery history |
| **Outputs** | Channel selection decision; fallback channel list; delivery routing |
| **Memory Requirements** | Medium-term: per-recipient channel effectiveness, channel delivery patterns |
| **Context Requirements** | Notification type, recipient preferences, channel health, urgency level, content length |
| **Decision Authority** | Select primary channel; order fallback channels; bypass underperforming channels |
| **Escalation Rules** | Escalate to Notification Manager when: preferred channel delivery probability < 0.7; all channels scoring below threshold; recipient has no reachable channel |
| **Human Approval Requirements** | None (routing optimization) |
| **Related Agents** | Notification Manager AI; Template Manager AI; ALL Worker Agents that trigger notifications |
| **Related Workflows** | ALL workflows |
| **Related Applications** | notification-center_v2 |
| **Related Functions** | dispatch-notifications |
| **Related Tables** | notification_channels_v2 (read), notifications_v2 (read), notification_templates_v2 (read) |
| **Expected Latency** | <1s |
| **Expected Accuracy** | 0.95 delivery probability target |
| **Priority Level** | High |

### 14.3 Template Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `notification-template-manager_v2` |
| **Purpose** | Manage notification templates, ensure consistency, and optimize content for each channel |
| **Business Responsibilities** | Create and update templates, ensure brand consistency, optimize content length per channel (SMS vs. email), test template rendering |
| **Inputs** | Template creation/update requests; channel format requirements; brand guidelines |
| **Outputs** | Template versions; rendering tests; consistency validation results |
| **Memory Requirements** | Medium-term: template version history |
| **Context Requirements** | Template content, channel format specs, brand guidelines, variable definitions |
| **Decision Authority** | Edit template content; create template variants per channel; merge variable definitions |
| **Escalation Rules** | Escalate to Notification Manager when: brand consistency check fails; template rendering error; variable mismatch |
| **Human Approval Requirements** | New template creation; brand-critical template changes |
| **Related Agents** | Notification Manager AI; Channel Optimizer AI; ALL Worker Agents using templates |
| **Related Workflows** | ALL workflows |
| **Related Applications** | notification-center_v2 |
| **Related Functions** | None |
| **Related Tables** | notification_templates_v2 (read/write), notification_channels_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.95 rendering accuracy |
| **Priority Level** | Low |

---

## 15. Customer Experience Department

### 15.1 CX Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `cx-manager_v2` |
| **Purpose** | Oversee customer satisfaction strategy and drive experience improvements across all touchpoints |
| **Business Responsibilities** | Monitor CSAT/NPS trends, prioritize experience improvements, approve survey campaigns, coordinate with departments on CX initiatives |
| **Inputs** | CSAT scores; NPS trends; feedback analysis; sentiment reports; survey response rates |
| **Outputs** | CX strategy directives; survey campaign approvals; improvement priorities; experience alerts |
| **Memory Requirements** | Long-term: CSAT trends, NPS history, survey campaign performance, feedback patterns |
| **Context Requirements** | CSAT dashboard, active feedback, survey performance, customer segment data |
| **Decision Authority** | Approve survey campaigns; prioritize CX initiatives; set CSAT targets |
| **Escalation Rules** | Escalate to Platform Orchestrator when: CSAT drops below 3.0; NPS drops below 0; major experience issue affecting multiple customers |
| **Human Approval Requirements** | CX policy changes; large-scale survey campaigns; customer compensation beyond policy |
| **Related Agents** | Satisfaction Survey AI; Feedback Analyzer AI; Win-Back Specialist AI; CRM Manager AI |
| **Related Workflows** | customer-satisfaction-monitor_v2 |
| **Related Applications** | customer-portal_v2, crm-center_v2 |
| **Related Functions** | None |
| **Related Tables** | feedback_v2 (read), feedback_surveys_v2 (read), customers_v2 (read), accounts_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.90 confidence threshold |
| **Priority Level** | High |

### 15.2 Satisfaction Survey AI

| Property | Value |
|----------|-------|
| **Agent Name** | `cx-satisfaction-survey_v2` |
| **Purpose** | Deploy and manage customer satisfaction surveys at optimal touchpoints |
| **Business Responsibilities** | Trigger surveys after service completion, select survey type (CSAT/NPS/CES), determine optimal send timing, track response rates |
| **Inputs** | `appointment.completed` event; `ticket.closed` event; `dispute.resolved` event; customer preferences |
| **Outputs** | Survey deployment decisions; survey records; response status tracking |
| **Memory Requirements** | Medium-term: optimal timing patterns, response rate trends |
| **Context Requirements** | Customer interaction context, past survey responses, channel preferences, survey templates |
| **Decision Authority** | Select survey type; set send timing; choose sending channel |
| **Escalation Rules** | Escalate to CX Manager when: response rate < 20% for a segment; negative feedback pattern detected; survey delivery failure |
| **Human Approval Requirements** | None (survey deployment is operational) |
| **Related Agents** | CX Manager AI; Feedback Analyzer AI; Notification Manager AI; Template Manager AI |
| **Related Workflows** | customer-satisfaction-monitor_v2 |
| **Related Applications** | customer-portal_v2 |
| **Related Functions** | None |
| **Related Tables** | feedback_surveys_v2 (read/write), feedback_v2 (read), customers_v2 (read), notifications_v2 (write) |
| **Expected Latency** | <2s |
| **Expected Accuracy** | 0.85 response rate optimization target |
| **Priority Level** | Medium |

### 15.3 Feedback Analyzer AI

| Property | Value |
|----------|-------|
| **Agent Name** | `cx-feedback-analyzer_v2` |
| **Purpose** | Analyze customer feedback to extract sentiment, identify themes, and generate actionable insights |
| **Business Responsibilities** | Classify feedback sentiment, extract topics and themes, detect emerging issues, quantify sentiment trends, generate insight reports |
| **Inputs** | `feedback.submitted` event; survey responses; open-ended comments; ticket closure notes |
| **Outputs** | Sentiment scores; topic clusters; trend reports; issue alerts; insight recommendations |
| **Memory Requirements** | Long-term: sentiment baselines, topic taxonomy, emerging issue history |
| **Context Requirements** | Feedback content, customer history, service context, historical baselines |
| **Decision Authority** | Classify sentiment; identify topics; flag emerging issues |
| **Escalation Rules** | Escalate to CX Manager when: sentiment drops > 20% in 24h; new negative topic emerges across 5+ customers; specific customer segment shows pattern |
| **Human Approval Requirements** | None (analytical) |
| **Related Agents** | CX Manager AI; Satisfaction Survey AI; Account Health Monitor AI; Trend Analyzer AI; CRM Manager AI |
| **Related Workflows** | customer-satisfaction-monitor_v2 |
| **Related Applications** | crm-center_v2, analytics-center_v2 |
| **Related Functions** | None |
| **Related Tables** | feedback_v2 (read), feedback_surveys_v2 (read), customers_v2 (read), tickets_v2 (read), appointments_v2 (read) |
| **Expected Latency** | <5s |
| **Expected Accuracy** | 0.85 sentiment accuracy; 0.80 topic classification |
| **Priority Level** | Medium |

### 15.4 Win-Back Specialist AI

| Property | Value |
|----------|-------|
| **Agent Name** | `cx-winback-specialist_v2` |
| **Purpose** | Design and execute customer win-back campaigns for churned or dormant accounts |
| **Business Responsibilities** | Identify win-back candidates, analyze churn reasons, design outreach sequences, track campaign effectiveness |
| **Inputs** | Account health alerts (churned/dormant); feedback history; service history; past campaign results |
| **Outputs** | Win-back campaign plans; outreach sequences; offer recommendations; effectiveness reports |
| **Memory Requirements** | Long-term: campaign history, offer effectiveness, segment response patterns |
| **Context Requirements** | Customer churn reason, service history, past interactions, customer value tier |
| **Decision Authority** | Segment candidates; design outreach sequence; suggest offer type |
| **Escalation Rules** | Escalate to CX Manager when: high-value customer churned; campaign requires > $2K incentive; multiple failed outreach attempts |
| **Human Approval Requirements** | All financial offers require human approval; VIP customer contact requires approval |
| **Related Agents** | CX Manager AI; CRM Manager AI; Retention Specialist AI; Notification Manager AI |
| **Related Workflows** | customer-satisfaction-monitor_v2 |
| **Related Applications** | crm-center_v2 |
| **Related Functions** | None |
| **Related Tables** | accounts_v2 (read), customers_v2 (read), feedback_v2 (read), followups_v2 (read), events_v2 (read) |
| **Expected Latency** | <10s |
| **Expected Accuracy** | 0.75 win-back success rate target |
| **Priority Level** | Medium |

---

## 16. Automation Department

### 16.1 Automation Manager AI

| Property | Value |
|----------|-------|
| **Agent Name** | `automation-manager_v2` |
| **Purpose** | Oversee workflow automation, event routing, and system orchestration |
| **Business Responsibilities** | Monitor workflow execution health, manage automation rules, handle workflow failures, optimize event routing |
| **Inputs** | Workflow execution metrics; failure events; performance data; rule change requests |
| **Outputs** | Automation policy decisions; routing rule updates; failure recovery directives |
| **Memory Requirements** | Medium-term: workflow execution patterns, failure modes, performance baselines |
| **Context Requirements** | Workflow execution dashboard, event throughput, failure rates, latency metrics |
| **Decision Authority** | Adjust routing rules; set retry policies; prioritize workflow executions |
| **Escalation Rules** | Escalate to Platform Orchestrator when: workflow failure rate > 5%; event backlog > 10K; system-wide automation issue |
| **Human Approval Requirements** | Automation policy changes; workflow topology changes |
| **Related Agents** | Workflow Orchestrator AI; Event Router AI; ALL Department Manager AIs |
| **Related Workflows** | ALL V2 workflows |
| **Related Applications** | ALL V2 applications |
| **Related Functions** | ALL functions (orchestration) |
| **Related Tables** | events_v2 (read), audit_log_v2 (read), system_settings_v2 (read), feature_flags_v2 (read) |
| **Expected Latency** | <3s |
| **Expected Accuracy** | 0.95 confidence threshold |
| **Priority Level** | Critical |

### 16.2 Workflow Orchestrator AI

| Property | Value |
|----------|-------|
| **Agent Name** | `automation-workflow-orchestrator_v2` |
| **Purpose** | Execute multi-step workflow graphs by routing events between agent nodes in the correct sequence |
| **Business Responsibilities** | Load workflow graph definitions, execute workflow nodes in order, manage state between steps, handle branching/conditional paths, manage retries and timeouts |
| **Inputs** | Workflow trigger event; workflow graph definition; node completion events |
| **Outputs** | Next-node activation events; workflow completion/failure signals; state checkpoints |
| **Memory Requirements** | Short-term: active workflow state (correlation ID, current node, execution path); Medium-term: workflow execution history |
| **Context Requirements** | Workflow graph, current execution state, node dependencies, timeout configs |
| **Decision Authority** | Route to next node; branch based on conditions; retry failed nodes; timeout stalled nodes |
| **Escalation Rules** | Escalate to Automation Manager when: node failure exceeds retry limit; workflow timeout; workflow graph error; circular dependency detected |
| **Human Approval Requirements** | None (execution orchestration) |
| **Related Agents** | Automation Manager AI; Event Router AI; ALL Master/Worker Agents (as workflow nodes) |
| **Related Workflows** | ALL V2 workflows |
| **Related Applications** | ALL V2 applications |
| **Related Functions** | ALL functions |
| **Related Tables** | events_v2 (read/write), audit_log_v2 (write) |
| **Expected Latency** | <100ms per routing decision |
| **Expected Accuracy** | 0.99 routing accuracy (deterministic) |
| **Priority Level** | Critical |

### 16.3 Event Router AI

| Property | Value |
|----------|-------|
| **Agent Name** | `automation-event-router_v2` |
| **Purpose** | Route domain events to the correct agent consumers based on subscription rules |
| **Business Responsibilities** | Maintain event subscription registry, match events to subscribers, route events with correlation IDs, handle event batching, manage event delivery guarantees |
| **Inputs** | ALL domain events; subscription registry changes; delivery status feedback |
| **Outputs** | Routed events to subscribers; delivery confirmations; undeliverable event alerts |
| **Memory Requirements** | Short-term: event buffer for batching; Medium-term: subscription registry |
| **Context Requirements** | Event payload, subscription registry, subscriber health, delivery queue status |
| **Decision Authority** | Route events; batch non-critical events; drop expired events |
| **Escalation Rules** | Escalate to Automation Manager when: subscriber queue backlog > 1K; subscriber unhealthy; event throughput anomaly |
| **Human Approval Requirements** | None (infrastructure routing) |
| **Related Agents** | Automation Manager AI; Workflow Orchestrator AI; ALL event-consuming agents |
| **Related Workflows** | ALL V2 workflows |
| **Related Applications** | ALL V2 applications |
| **Related Functions** | None |
| **Related Tables** | events_v2 (read/write) |
| **Expected Latency** | <50ms per event |
| **Expected Accuracy** | 0.99 delivery guarantee |
| **Priority Level** | Critical |

---

> **End of AGENT_CATALOG.md**  
> Next document: AGENT_INTERACTION_DIAGRAM.md
