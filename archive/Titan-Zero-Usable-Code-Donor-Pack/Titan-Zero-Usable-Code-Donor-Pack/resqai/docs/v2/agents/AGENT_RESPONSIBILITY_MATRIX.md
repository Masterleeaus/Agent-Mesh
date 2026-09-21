# RESQAI V2 — Agent Responsibility Matrix

> Phase 1.3 — Architecture Only  
> Chief AI Systems Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Agent Type Classification Matrix](#1-agent-type-classification-matrix)
2. [Agent vs. Business Responsibility Matrix](#2-agent-vs-business-responsibility-matrix)
3. [Agent vs. Table Access Matrix](#3-agent-vs-table-access-matrix)
4. [Agent vs. Event Matrix](#4-agent-vs-event-matrix)
5. [Agent vs. Workflow Matrix](#5-agent-vs-workflow-matrix)
6. [Agent vs. Application Matrix](#6-agent-vs-application-matrix)
7. [Decision Authority Matrix](#7-decision-authority-matrix)
8. [Latency and Priority Matrix](#8-latency-and-priority-matrix)

---

## 1. Agent Type Classification Matrix

| Agent | Department | Type | Sub-Type | Authority Level |
|-------|-----------|------|----------|----------------|
| Executive Director AI | Executive | Master | Strategic | Level 5 (Executive) |
| Platform Orchestrator AI | Executive | Master | Coordination | Level 4 (Director) |
| Support Manager AI | Support | Master | Department | Level 3 (Manager) |
| Request Classifier AI | Support | Worker | Classification | Level 1 (Task) |
| Support Reply Drafter AI | Support | Worker | Content | Level 1 (Task) |
| Escalation Manager AI | Support | Worker | Routing | Level 2 (Specialist) |
| SLA Monitor AI | Support | Observer | Monitoring | Level 1 (Monitor) |
| Operations Manager AI | Operations | Master | Department | Level 3 (Manager) |
| Operations Coordinator AI | Operations | Worker | Coordination | Level 2 (Specialist) |
| Work Order Manager AI | Operations | Worker | Tracking | Level 2 (Specialist) |
| CRM Manager AI | CRM | Master | Department | Level 3 (Manager) |
| Account Health Monitor AI | CRM | Observer | Monitoring | Level 2 (Specialist) |
| Followup Manager AI | CRM | Worker | Execution | Level 2 (Specialist) |
| Retention Specialist AI | CRM | Planning | Strategy | Level 2 (Specialist) |
| Dispatch Manager AI | Dispatch | Master | Department | Level 3 (Manager) |
| Dispatch Coordinator AI | Dispatch | Worker | Routing | Level 2 (Specialist) |
| Technician Dispatcher AI | Dispatch | Execution | Execution | Level 1 (Task) |
| Emergency Response AI | Dispatch | Worker | Emergency | Level 2 (Specialist) |
| Scheduling Manager AI | Scheduling | Master | Department | Level 3 (Manager) |
| Appointment Scheduler AI | Scheduling | Planning | Optimization | Level 2 (Specialist) |
| Technician Suggester AI | Scheduling | Planning | Recommendation | Level 1 (Task) |
| Appointment Manager AI | Appointment | Master | Department | Level 3 (Manager) |
| Reminder Coordinator AI | Appointment | Worker | Execution | Level 1 (Task) |
| No-Show Handler AI | Appointment | Worker | Resolution | Level 2 (Specialist) |
| Knowledge Manager AI | Knowledge | Master | Department | Level 3 (Manager) |
| Knowledge Curator AI | Knowledge | Worker | Content | Level 1 (Task) |
| Article Suggester AI | Knowledge | Worker | Recommendation | Level 1 (Task) |
| Analytics Manager AI | Analytics | Master | Department | Level 3 (Manager) |
| Trend Analyzer AI | Analytics | Observer | Monitoring | Level 2 (Specialist) |
| Predictive Modeler AI | Analytics | Observer | Modeling | Level 2 (Specialist) |
| Admin Manager AI | Administration | Master | Department | Level 3 (Manager) |
| System Configuration AI | Administration | Worker | Execution | Level 1 (Task) |
| Connector Manager AI | Administration | Worker | Maintenance | Level 2 (Specialist) |
| QA Manager AI | QA | Master | Department | Level 3 (Manager) |
| Response Quality Monitor AI | QA | Observer | Monitoring | Level 2 (Specialist) |
| Compliance Monitor AI | QA | Observer | Monitoring | Level 2 (Specialist) |
| Reporting Manager AI | Reporting | Master | Department | Level 3 (Manager) |
| Report Generator AI | Reporting | Execution | Execution | Level 1 (Task) |
| Report Distributor AI | Reporting | Worker | Distribution | Level 1 (Task) |
| Notification Manager AI | Notification | Master | Department | Level 3 (Manager) |
| Channel Optimizer AI | Notification | Planning | Optimization | Level 2 (Specialist) |
| Template Manager AI | Notification | Worker | Content | Level 1 (Task) |
| CX Manager AI | CX | Master | Department | Level 3 (Manager) |
| Satisfaction Survey AI | CX | Worker | Execution | Level 1 (Task) |
| Feedback Analyzer AI | CX | Observer | Analysis | Level 2 (Specialist) |
| Win-Back Specialist AI | CX | Planning | Strategy | Level 2 (Specialist) |
| Automation Manager AI | Automation | Master | Department | Level 3 (Manager) |
| Workflow Orchestrator AI | Automation | Execution | Orchestration | Level 2 (Specialist) |
| Event Router AI | Automation | Execution | Routing | Level 1 (Task) |

---

## 2. Agent vs. Business Responsibility Matrix

### Legend
- **P** = Primary Owner
- **S** = Supporting Role
- **C** = Consulted
- **I** = Informed

| Responsibility | Exec Dir | Plat Orch | Supp Mgr | Req Class | Reply Draft | Escal Mgr | SLA Mon | Ops Mgr | Ops Coord | CRM Mgr | Acct Hlth | Dsp Mgr | Dsp Coord | Sched Mgr | Appt Sched | KNow Mgr | QA Mgr | CX Mgr | Notif Mgr | Auto Mgr |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Strategic Planning | P | S | I | - | - | - | - | I | - | I | - | I | - | I | - | - | - | I | - | I |
| Cross-Dept Coordination | - | P | S | - | - | - | - | S | - | S | - | S | - | S | - | - | - | - | - | S |
| Ticket Classification | - | - | S | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Reply Drafting | - | - | S | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Escalation Mgmt | - | S | S | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| SLA Monitoring | - | - | S | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Ops Coordination | - | - | - | - | - | - | - | S | P | - | - | - | C | - | - | - | - | - | - | - |
| Dispatch Routing | - | - | - | - | - | C | - | C | - | - | - | S | P | - | - | - | - | - | - | - |
| Technician Dispatch | - | - | - | - | - | - | - | - | - | - | - | S | S | - | - | - | - | - | - | - |
| Appointment Scheduling | - | - | - | - | - | - | - | - | - | - | - | - | - | S | P | - | - | - | - | - |
| Tech Suggestion | - | - | - | - | - | - | - | - | C | - | - | - | C | S | C | - | - | - | - | - |
| Account Health | - | - | - | - | - | - | - | - | - | S | P | - | - | - | - | - | - | - | - | - |
| Followup Mgmt | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | - | - | - | - |
| Knowledge Mgmt | - | - | C | C | C | - | - | - | - | - | - | - | - | - | - | P | - | - | - | - |
| Quality Assurance | - | - | I | - | I | - | - | - | - | - | - | - | - | - | - | - | P | - | - | - |
| Compliance | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - |
| Customer Exp. | - | - | - | - | - | - | - | - | - | I | I | - | - | - | - | - | - | P | - | - |
| Analytics | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Reporting | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Notifications | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - |
| Workflow Orchestr. | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S |

---

## 3. Agent vs. Table Access Matrix

### Legend
- **R** = Read Only
- **W** = Read/Write
- **-** = No Access

| Agent | cust_v2 | addr_v2 | tech_v2 | tech_skill | tick_v2 | tick_msg | appt_v2 | appt_rem | disp_v2 | disp_ev | wo_v2 | wo_stg | acct_v2 | hlth_scn | folup_v2 | folup_att | task_v2 | task_asgn | know_art | know_cat | notif_v2 | notif_tmpl | notif_chan | events | audit | alerts | feeback | surveys | users | roles | perms | sys_set | feat_flg | con_v2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Exec Director | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | R | - | - |
| Plat Orchestrator | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | R | - | - |
| Support Mgr | R | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Req Classifier | R | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Reply Drafter | R | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Escal Mgr | R | - | - | - | W | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| SLA Monitor | R | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - |
| Ops Mgr | - | - | R | - | - | - | - | - | - | - | R | - | - | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Ops Coord | R | - | R | - | R | - | R | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Work Order Mgr | - | - | R | - | - | - | R | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| CRM Mgr | R | - | - | - | - | - | - | - | - | - | - | - | W | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Acct Health Mon | R | - | - | - | - | - | R | - | - | - | - | - | W | W | R | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Followup Mgr | R | - | - | - | - | - | - | - | - | - | - | - | R | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Retention Spec | R | - | - | - | - | - | - | - | - | - | - | - | R | - | R | - | - | - | - | - | - | - | - | R | - | - | R | - | - | - | - | - | - | - |
| Dispatch Mgr | - | - | R | - | R | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Dispatch Coord | - | - | R | R | R | - | R | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Tech Dispatcher | - | - | R | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Emergency Resp | - | - | R | - | R | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Sched Mgr | - | - | R | R | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - |
| Appt Scheduler | R | - | R | R | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Tech Suggester | - | - | R | R | R | - | R | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Appt Mgr | R | - | R | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Reminder Coord | - | - | - | - | - | - | R | W | - | - | - | - | - | - | - | - | - | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | - |
| No-Show Handler | R | - | - | - | - | - | W | - | - | - | - | - | - | - | W | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Know Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Know Curator | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Article Suggest | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Analytics Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | W | - | - | - | - | - |
| Trend Analyzer | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - |
| Pred Modeler | - | - | - | - | R | - | R | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | R | - | - | R | - | - | - | - | - | - | - |
| Admin Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | W | W | W | W | W | - |
| Sys Config | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | W | W | - |
| Connector Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | R | - | W |
| QA Mgr | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | R | - | - | - | - | - | - | - |
| Resp Quality Mon | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Compliance Mon | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | R | - | - |
| Reporting Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - |
| Report Gen | - | - | - | - | R | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - |
| Report Dist | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - |
| Notif Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | R | W | - | - | - | - | - | - | - | - | - | - | - |
| Channel Opt | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | R | - | - | - | - | - | - | - | - | - | - | - |
| Template Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - |
| CX Mgr | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - |
| Satisfaction Sur | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | W | - | - | - | - | - | - |
| Feedback Analyz | R | - | - | - | R | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - |
| Win-Back Spec | R | - | - | - | - | - | - | - | - | - | - | - | R | - | R | - | - | - | - | - | - | - | - | R | - | - | R | - | - | - | - | - | - | - |
| Auto Mgr | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | R | R | - |
| Workflow Orch | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | W | - | - | - | - | - | - | - | - | - |
| Event Router | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - |

---

## 4. Agent vs. Event Matrix

### Legend
- **P** = Produces
- **C** = Consumes
- **-** = Neither

| Event | Exe Dir | Plat Orch | Supp Mgr | Req Class | Reply Dr | Escal Mgr | SLA Mon | Ops Mgr | Ops Coord | Acct Hlth | Folup Mgr | Ret Spec | Dsp Mgr | Dsp Coord | Tech Dsp | Emerg Resp | Sched Mgr | Appt Sched | Tech Sugg | Appt Mgr | Rem Coord | NS Hndlr | Know Mgr | Art Sug | Anl Mgr | Trend Anl | Pred Mod | QA Mgr | Resp Qual | Comp Mon | Rpt Mgr | Rpt Gen | Notif Mgr | Chan Opt | CX Mgr | Sat Sur | Feed Anl | Win-Back | Auto Mgr | Work Orch | Evt Rout |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ticket.created | - | - | - | C | - | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C |
| ticket.classified | - | - | C | P | C | C | C | C | - | - | - | - | C | C | - | C | - | - | - | - | - | - | - | C | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| ticket.reply.drafted | - | - | C | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - | - | - | - | - |
| ticket.escalated | - | C | C | - | - | P | - | C | - | - | - | - | C | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - |
| ticket.sla_breached | - | - | C | - | - | C | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - |
| appointment.created | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | C | C | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C |
| appointment.assigned | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - | - | P | - | C | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - |
| appointment.completed | - | - | - | - | - | - | - | - | - | C | C | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | C | C | - | - | - | - |
| dispatch.created | - | - | - | - | - | - | - | C | C | - | - | - | P | P | - | - | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| dispatch.acknowledged | - | - | - | - | - | - | - | C | - | - | - | - | C | C | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| dispute.created | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C |
| account.health.changed | - | - | - | - | - | - | - | C | - | P | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | C | C | - | - | - | - | - | C | - | - | - | - | - | - | - | - |
| followup.slippage.detected | - | - | - | - | - | - | - | C | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - |
| feedback.submitted | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | - | - | - | - | - | - | - | - | C | - | C | - | - | - | - |
| notification.send | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | C | - | - | - | - | - | - | - |
| system.workflow.failed | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | P | - |
| analytics.anomaly.detected | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | C | P | - | C | - | - | C | - | C | - | C | - | - | - | - | - | - |

---

## 5. Agent vs. Workflow Matrix

### Legend
- **P** = Primary Participant
- **S** = Supporting Participant
- **-** = Not Involved

| Agent | ticket-intake | urgent-dispatch | dispute-resolution | acct-health-mon | appt-assignment | appt-reminders | daily-standup | followup-slippage | support-escalation | cust-satisfaction |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Executive Director AI | - | - | - | - | - | - | P | - | - | - |
| Platform Orchestrator AI | - | S | - | - | - | - | S | - | S | - |
| Support Manager AI | P | - | - | - | - | - | - | - | P | - |
| Request Classifier AI | P | S | - | - | - | - | - | - | - | - |
| Support Reply Drafter AI | P | - | - | - | - | - | - | - | - | - |
| Escalation Manager AI | - | S | - | - | - | - | - | - | P | - |
| SLA Monitor AI | S | - | - | - | - | - | - | - | S | - |
| Operations Manager AI | - | P | - | - | - | - | P | - | - | - |
| Operations Coordinator AI | - | - | - | - | - | - | P | - | - | - |
| Work Order Manager AI | - | - | - | - | S | - | - | - | - | - |
| CRM Manager AI | - | - | - | P | - | - | - | P | - | - |
| Account Health Monitor AI | - | - | - | P | - | - | - | S | - | - |
| Followup Manager AI | - | - | S | S | - | - | - | P | - | - |
| Retention Specialist AI | - | - | - | S | - | - | - | - | - | - |
| Dispatch Manager AI | - | P | - | - | - | - | - | - | - | - |
| Dispatch Coordinator AI | - | P | - | - | - | - | - | - | - | - |
| Technician Dispatcher AI | - | P | - | - | - | - | - | - | - | - |
| Emergency Response AI | - | S | - | - | - | - | - | - | - | - |
| Scheduling Manager AI | - | - | - | - | P | - | - | - | - | - |
| Appointment Scheduler AI | - | - | - | - | P | - | - | - | - | - |
| Technician Suggester AI | - | S | - | - | P | - | - | - | - | - |
| Appointment Manager AI | - | - | - | - | S | P | - | - | - | - |
| Reminder Coordinator AI | - | - | - | - | - | P | - | - | - | - |
| No-Show Handler AI | - | - | - | - | - | S | - | - | - | - |
| Knowledge Manager AI | S | - | - | - | - | - | - | - | - | - |
| Article Suggester AI | S | - | - | - | - | - | - | - | - | - |
| Analytics Manager AI | - | - | - | - | - | - | S | - | - | - |
| Trend Analyzer AI | - | - | - | - | - | - | S | - | - | - |
| Predictive Modeler AI | - | - | - | S | - | - | - | - | - | - |
| Admin Manager AI | - | - | - | - | - | - | - | - | - | - |
| QA Manager AI | - | - | P | - | - | - | - | - | S | - |
| Response Quality Monitor AI | S | - | - | - | - | - | - | - | S | - |
| Compliance Monitor AI | - | - | P | - | - | - | - | - | - | - |
| Reporting Manager AI | - | - | - | - | - | - | S | - | - | - |
| Report Generator AI | - | - | - | - | - | - | S | - | - | - |
| Notification Manager AI | S | S | S | S | S | S | - | S | S | - |
| CX Manager AI | - | - | - | - | - | - | - | - | - | P |
| Satisfaction Survey AI | - | - | - | - | - | - | - | - | - | P |
| Feedback Analyzer AI | - | - | - | - | - | - | - | - | - | P |
| Win-Back Specialist AI | - | - | - | - | - | - | - | - | - | S |
| Automation Manager AI | - | - | - | - | - | - | - | - | - | - |
| Workflow Orchestrator AI | P | P | P | P | P | P | P | P | P | P |
| Event Router AI | S | S | S | S | S | S | S | S | S | S |

---

## 6. Agent vs. Application Matrix

| Agent | cust-portal | support-center | ops-center | appt-center | tech-portal | res-center | crm-center | notif-center | analytics-center | admin-center |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Executive Director AI | - | - | - | - | - | - | - | - | R | R |
| Platform Orchestrator AI | - | - | R | - | - | - | - | - | R | R |
| Support Manager AI | - | P | - | - | - | - | - | - | - | - |
| Request Classifier AI | - | P | - | - | - | - | - | - | - | - |
| Support Reply Drafter AI | - | P | - | - | - | - | - | - | - | - |
| Escalation Manager AI | - | P | R | - | - | - | - | - | - | - |
| SLA Monitor AI | - | P | - | - | - | - | - | - | - | - |
| Operations Manager AI | - | - | P | - | - | - | - | - | - | - |
| Operations Coordinator AI | - | - | P | - | - | - | - | - | - | - |
| Work Order Manager AI | - | - | R | - | P | - | - | - | - | - |
| CRM Manager AI | - | - | - | - | - | - | P | - | - | - |
| Account Health Monitor AI | - | - | - | - | - | - | P | - | - | - |
| Followup Manager AI | - | - | - | - | - | - | P | - | - | - |
| Retention Specialist AI | - | - | - | - | - | - | P | - | - | - |
| Dispatch Manager AI | - | - | P | - | - | - | - | - | - | - |
| Dispatch Coordinator AI | - | - | P | - | - | - | - | - | - | - |
| Technician Dispatcher AI | - | - | P | - | P | - | - | - | - | - |
| Emergency Response AI | - | - | P | - | - | - | - | - | - | - |
| Scheduling Manager AI | - | - | - | P | - | - | - | - | - | - |
| Appointment Scheduler AI | - | - | - | P | - | - | - | - | - | - |
| Technician Suggester AI | - | - | - | P | - | - | - | - | - | - |
| Appointment Manager AI | - | - | - | P | - | - | - | - | - | - |
| Reminder Coordinator AI | - | - | - | P | - | - | - | - | - | - |
| No-Show Handler AI | - | - | - | P | - | - | - | - | - | - |
| Knowledge Manager AI | - | P | - | - | - | - | - | - | - | - |
| Knowledge Curator AI | - | P | - | - | - | - | - | - | - | - |
| Article Suggester AI | R | P | - | - | - | - | - | - | - | - |
| Analytics Manager AI | - | - | - | - | - | - | - | - | P | - |
| Trend Analyzer AI | - | - | - | - | - | - | - | - | P | - |
| Predictive Modeler AI | - | - | - | - | - | - | - | - | P | - |
| Admin Manager AI | - | - | - | - | - | - | - | - | - | P |
| System Configuration AI | - | - | - | - | - | - | - | - | - | P |
| Connector Manager AI | - | - | - | - | - | - | - | - | - | P |
| QA Manager AI | - | R | - | - | - | - | - | - | - | P |
| Response Quality Monitor AI | - | P | - | - | - | - | - | - | - | - |
| Compliance Monitor AI | - | - | - | - | - | - | - | - | - | P |
| Reporting Manager AI | - | - | - | - | - | - | - | - | P | - |
| Report Generator AI | - | - | - | - | - | - | - | - | P | - |
| Report Distributor AI | - | - | - | - | - | - | - | R | P | - |
| Notification Manager AI | - | - | - | - | - | - | - | P | - | - |
| Channel Optimizer AI | - | - | - | - | - | - | - | P | - | - |
| Template Manager AI | - | - | - | - | - | - | - | P | - | - |
| CX Manager AI | R | - | - | - | - | - | R | - | - | - |
| Satisfaction Survey AI | P | - | - | - | - | - | - | - | - | - |
| Feedback Analyzer AI | - | - | - | - | - | - | R | - | R | - |
| Win-Back Specialist AI | - | - | - | - | - | - | P | - | - | - |
| Automation Manager AI | - | - | - | - | - | - | - | - | - | R |
| Workflow Orchestrator AI | - | - | - | - | - | - | - | - | - | - |
| Event Router AI | - | - | - | - | - | - | - | - | - | - |

---

## 7. Decision Authority Matrix

| Authority Level | Description | Examples | Agents |
|----------------|-------------|---------|--------|
| **Level 1** | Execute predefined tasks | Send notification, update status, classify ticket | Request Classifier, Reply Drafter, Tech Dispatcher, Report Gen, Event Router, Template Mgr, Satisfaction Survey, Article Suggester, Knowledge Curator, System Config, Channel Optimizer, Report Distributor, Reminder Coord |
| **Level 2** | Make domain-specific decisions | Propose dispatch, prioritize tasks, flag risks | Escalation Mgr, Ops Coord, Health Monitor, Followup Mgr, Dispatch Coord, Emergency Resp, Appt Scheduler, No-Show Handler, Trend Analyzer, Pred Modeler, Response Quality Mon, Compliance Mon, Feedback Analyzer, Workflow Orch, Connector Mgr, Retention Spec |
| **Level 3** | Department management decisions | Approve exception handling, set department priorities | Support Mgr, Ops Mgr, CRM Mgr, Dispatch Mgr, Sched Mgr, Appt Mgr, Knowledge Mgr, Analytics Mgr, Admin Mgr, QA Mgr, Reporting Mgr, Notif Mgr, CX Mgr, Auto Mgr |
| **Level 4** | Cross-department coordination | Resolve inter-dept conflicts, route cross-dept work | Platform Orchestrator AI |
| **Level 5** | Executive strategic decisions | Set business priorities, approve strategic initiatives | Executive Director AI |

---

## 8. Latency and Priority Matrix

| Latency Requirement | Agents | Count |
|--------------------|--------|-------|
| **< 50ms** | Event Router AI | 1 |
| **< 100ms** | Workflow Orchestrator AI | 1 |
| **< 1s** | SLA Monitor AI, Channel Optimizer AI | 2 |
| **< 2s** | Technician Dispatcher AI, Reminder Coordinator AI, System Configuration AI, Satisfaction Survey AI | 4 |
| **< 3s** | Platform Orchestrator AI, Support Manager AI, Escalation Manager AI, Operations Manager AI, CRM Manager AI, Dispatch Manager AI, Scheduling Manager AI, Appointment Scheduler AI, Appointment Manager AI, Article Suggester AI, Notification Manager AI, Template Manager AI, Automation Manager AI, Compliance Monitor AI, Answer Quality Monitor AI, Connector Manager AI, Operations Coordinator AI | 17 |
| **< 5s** | Executive Director AI, Request Classifier AI, SLA Monitor AI, Knowledge Manager AI, Analytics Manager AI, Trend Analyzer AI, Predictive Modeler AI, QA Manager AI, Reporting Manager AI, CX Manager AI, Feedback Analyzer AI, No-Show Handler AI, Dispatch Coordinator AI, Emergency Response AI, Account Health Monitor AI | 15 |
| **< 10s** | Support Reply Drafter AI, Retention Specialist AI, Win-Back Specialist AI, Knowledge Curator AI, Followup Manager AI | 5 |
| **< 15s** | Operations Coordinator AI (full scan) | 1 |
| **< 30s** | Account Health Monitor AI (full scan), Appointment Scheduler AI (batch), Report Generator AI (standard), Predictive Modeler AI (batch) | 4 |

| Priority Level | Agents | Count |
|----------------|--------|-------|
| **Critical** | Executive Director AI, Platform Orchestrator AI, Dispatch Manager AI, Dispatch Coordinator AI, Technician Dispatcher AI, Emergency Response AI, Compliance Monitor AI, Automation Manager AI, Workflow Orchestrator AI, Event Router AI | 10 |
| **High** | Support Manager AI, Request Classifier AI, Support Reply Drafter AI, Escalation Manager AI, SLA Monitor AI, Operations Manager AI, Operations Coordinator AI, CRM Manager AI, Account Health Monitor AI, Scheduling Manager AI, Appointment Scheduler AI, Technician Suggester AI, Appointment Manager AI, Analytics Manager AI, Trend Analyzer AI, Predictive Modeler AI, Admin Manager AI, QA Manager AI, CX Manager AI, Notification Manager AI, Channel Optimizer AI | 21 |
| **Medium** | Work Order Manager AI, Followup Manager AI, Retention Specialist AI, No-Show Handler AI, Knowledge Manager AI, Article Suggester AI, System Configuration AI, Connector Manager AI, Response Quality Monitor AI, Reporting Manager AI, Report Generator AI, Satisfaction Survey AI, Feedback Analyzer AI, Win-Back Specialist AI | 14 |
| **Low** | Knowledge Curator AI, Report Distributor AI, Template Manager AI | 3 |

---

> **End of AGENT_RESPONSIBILITY_MATRIX.md**  
> Next document: AI_MEMORY_ARCHITECTURE.md
