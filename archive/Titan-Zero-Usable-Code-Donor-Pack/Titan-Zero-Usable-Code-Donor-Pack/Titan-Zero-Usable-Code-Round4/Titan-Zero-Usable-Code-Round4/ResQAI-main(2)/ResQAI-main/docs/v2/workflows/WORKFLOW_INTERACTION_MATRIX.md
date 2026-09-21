# RESQAI V2 — Workflow Interaction Matrix

> Phase 1.4 — Architecture Only  
> Chief Workflow Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Workflow-to-Workflow Interaction Matrix](#1-workflow-to-workflow-interaction-matrix)
2. [Workflow-to-Agent Matrix](#2-workflow-to-agent-matrix)
3. [Workflow-to-Function Matrix](#3-workflow-to-function-matrix)
4. [Workflow-to-Table Matrix](#4-workflow-to-table-matrix)
5. [Workflow-to-Application Matrix](#5-workflow-to-application-matrix)
6. [Workflow-to-Notification Matrix](#6-workflow-to-notification-matrix)
7. [Workflow-to-Human Matrix](#7-workflow-to-human-matrix)

---

## 1. Workflow-to-Workflow Interaction Matrix

### Legend
- **▶** = This workflow triggers the target workflow
- **◀** = This workflow is triggered by the target workflow
- **◆** = Shared event consumption
- **-** = No direct interaction

| Workflow Name (Producer) | auto-resp | ticket-intake | ticket-escal | sla-enforce | appt-book | appt-remind | appt-compl | std-dispatch | urg-dispatch | work-order-ful | work-order-ver | dispute-res | dispute-escal | acct-health | fol-mgmt | fol-slippage | retain-camp | cust-sat-mon | feedback-an | know-art-life | know-gap | notif-deliv | daily-stand | ops-coord | report-gen | report-dist | trend-an | anom-detect | qa-review | user-prov | sys-config | inv-reorder | wf-health |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ticket-auto-response** | - | ▶ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **ticket-intake** | - | - | ▶ | ◆ | ▶ | - | - | - | ▶ | - | - | - | - | ◆ | - | - | - | ◆ | - | - | ◆ | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **ticket-escalation** | - | - | - | - | - | - | - | - | - | - | - | - | - | ◆ | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **sla-enforcement** | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **appointment-booking** | - | - | - | - | - | ▶ | - | ▶ | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **appointment-reminders** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **appointment-completion** | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | ▶ | ▶ | - | - | ▶ | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **standard-dispatch** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **urgent-dispatch** | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **work-order-fulfillment** | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | ▶ | ◆ |
| **work-order-verification** | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | ▶ | ▶ | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **dispute-resolution** | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | ▶ | - | - | ▶ | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | ◆ | - | - | - | ◆ |
| **dispute-escalation** | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | ▶ | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **account-health-scan** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | ▶ | ▶ | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **followup-management** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | ▶ | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **followup-slippage-detector** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | ▶ | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **retention-campaign** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | ▶ | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **customer-satisfaction-monitor** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | ▶ | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **feedback-analysis** | - | - | - | - | - | - | - | - | - | - | - | - | - | ◆ | - | - | ▶ | - | - | - | ▶ | ▶ | - | - | ▶ | - | ◆ | ◆ | - | - | - | - | ◆ |
| **knowledge-article-lifecycle** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **knowledge-gap-detection** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **notification-delivery** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **daily-standup** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **operations-coordination** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **report-generation** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | ◆ | ◆ | - | - | - | - | ◆ |
| **report-distribution** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | - |
| **trend-analysis** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **anomaly-detection** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| **quality-review** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ◆ | ◆ | - | - | - | - | ◆ |
| **user-provisioning** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | - |
| **system-config-management** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | - |
| **inventory-reorder** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | - |
| **workflow-health-monitor** | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | ▶ | - | - | - | - | - | - | - | - | - | - | - |

---

## 2. Workflow-to-Agent Matrix

### Legend
- **P** = Primary agent for this workflow
- **S** = Supporting agent
- **-** = Not involved

| Workflow | Req Class | Reply Dr | Escal Mgr | SLA Mon | Ops Coord | Work Ord | Acct Hlth | Fol-up Mgr | Ret Spec | Dsp Coord | Tech Dsp | Emrg Resp | Tech Sug | Appt Sched | Appt Mgr | Rem Coord | NS Hndl | Know Mgr | Know Cur | Art Sug | Trend Anl | Pred Mod | QA Mgr | Resp Qual | Comp Mon | Rpt Gen | Rpt Dist | Notif Mgr | Chan Opt | CX Mgr | Sat Sur | Feed Anl | Win-Back | Auto Mgr | Work Orch |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ticket-auto-response | S | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S |
| ticket-intake | P | P | S | - | S | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | S | - | - | - | S | - | - | - | - | - | - | P |
| ticket-escalation | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | - | - | - | - | S | P |
| sla-enforcement | - | - | S | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | S |
| appointment-booking | - | - | - | - | - | - | - | - | - | - | - | - | P | P | S | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | P |
| appointment-reminders | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | P | - | - | - | - | - | - | - | - | - | - | - | S | P | - | - | - | - | - | P |
| appointment-completion | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P |
| standard-dispatch | - | - | - | - | - | - | - | - | - | S | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | S | - | - | - | - | - | P |
| urgent-dispatch | - | - | S | - | - | - | - | - | - | P | P | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | P |
| work-order-fulfillment | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P |
| work-order-verification | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | S | S | - | - | - | - | - | - | - | - | - | P |
| dispute-resolution | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - | P | - | - | S | - | - | - | - | - | - | P |
| dispute-escalation | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - | - | - | P | P |
| account-health-scan | - | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | S | - | - | - | - | - | - | P |
| followup-management | - | - | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | P |
| followup-slippage-detector | - | - | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | P |
| retention-campaign | - | - | - | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | P | - | P |
| customer-satisfaction-monitor | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | P | P | - | - | - | P |
| feedback-analysis | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - | - | - | - | - | - | - | - | S | - | P | - | - | P |
| knowledge-article-lifecycle | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P | - | - | - | S | - | - | - | - | - | - | - | - | - | - | - | P |
| knowledge-gap-detection | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P |
| notification-delivery | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P | - | - | - | - | - | P |
| daily-standup | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | - | - | - | - | - | - | - | P |
| operations-coordination | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P |
| report-generation | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | P | - | - | - | - | - | - | - | - | P |
| report-distribution | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | S | S | - | - | - | - | - | P |
| trend-analysis | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | - | - | - | - | - | - | - | - | - | - | - | - | - | P |
| anomaly-detection | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P | - | - | - | - | - | - | - | - | - | - | - | - | P |
| quality-review | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P | P | - | - | - | - | - | - | - | - | - | P |
| user-provisioning | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P |
| system-config-management | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P |
| inventory-reorder | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | S | - | - | - | - | - | - | P |
| workflow-health-monitor | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | P | P |

---

## 3. Workflow-to-Function Matrix

| Workflow | check-ticket-urgency | update-ticket-record | dispatch-notifications | assign-appt-technician | finalize-dispatch | account-health-scan | flag-slipping-followups | update-acct-health-status | resolve-dispute | create-followup-tasks | create-ops-tasks | fetch-upcoming-appts | collect-resolved-tickets | finalize-slippage-review |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ticket-auto-response | - | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - |
| ticket-intake | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - |
| ticket-escalation | - | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - |
| sla-enforcement | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| appointment-booking | - | - | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - |
| appointment-reminders | - | - | ✓ | - | - | - | - | - | - | - | - | ✓ | - | - |
| appointment-completion | - | - | - | - | - | - | - | - | - | ✓ | - | - | - | - |
| standard-dispatch | - | - | ✓ | - | ✓ | - | - | - | - | - | - | - | - | - |
| urgent-dispatch | - | - | ✓ | - | ✓ | - | - | - | - | - | - | - | - | - |
| work-order-fulfillment | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| work-order-verification | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| dispute-resolution | - | - | ✓ | - | - | - | - | - | ✓ | - | - | - | - | - |
| dispute-escalation | - | - | - | - | - | - | - | - | ✓ | - | - | - | - | - |
| account-health-scan | - | - | - | - | - | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| followup-management | - | - | - | - | - | - | - | - | - | ✓ | - | - | - | - |
| followup-slippage-detector | - | - | - | - | - | - | ✓ | - | - | - | - | - | - | ✓ |
| retention-campaign | - | - | - | - | - | - | - | - | - | ✓ | - | - | - | - |
| customer-satisfaction-monitor | - | - | ✓ | - | - | - | - | - | - | - | - | - | - | - |
| feedback-analysis | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| knowledge-article-lifecycle | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| knowledge-gap-detection | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| notification-delivery | - | - | ✓ | - | - | - | - | - | - | - | - | - | - | - |
| daily-standup | - | - | - | - | - | - | - | - | - | - | ✓ | - | ✓ | - |
| operations-coordination | - | - | - | - | - | - | - | - | - | - | ✓ | - | - | - |
| report-generation | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| report-distribution | - | - | ✓ | - | - | - | - | - | - | - | - | - | - | - |
| trend-analysis | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| anomaly-detection | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| quality-review | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| user-provisioning | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| system-config-management | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| inventory-reorder | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| workflow-health-monitor | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

---

## 4. Workflow-to-Table Matrix

### Legend
- **R** = Read
- **W** = Write
- **-** = No access

| Workflow | cust_v2 | addr_v2 | tech_v2 | tech_skill | tick_v2 | tick_msg | tick_att | appt_v2 | appt_rem | disp_v2 | disp_ev | wo_v2 | wo_stg | acct_v2 | hlth_scn | folup_v2 | folup_att | task_v2 | task_asgn | know_art | know_cat | notif_v2 | notif_tmpl | notif_chan | inv_v2 | inv_txn | fb_v2 | fb_surv | users_v2 | roles_v2 | perms_v2 | sys_set | feat_flg | con_v2 | events | audit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ticket-auto-response | R | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| ticket-intake | R | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| ticket-escalation | R | - | - | - | W | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| sla-enforcement | R | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | W | - |
| appointment-booking | R | - | R | R | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| appointment-reminders | - | - | - | - | - | - | - | R | W | - | - | - | - | - | - | - | - | - | - | - | - | W | R | - | - | - | - | - | - | - | - | - | - | - | W | - |
| appointment-completion | - | - | R | - | - | - | - | W | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| standard-dispatch | - | - | R | - | - | - | - | R | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| urgent-dispatch | - | - | R | R | R | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| work-order-fulfillment | - | - | R | - | - | - | - | - | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | - | - | W | - |
| work-order-verification | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | W | - |
| dispute-resolution | R | - | - | - | R | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| dispute-escalation | R | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| account-health-scan | R | - | - | - | - | - | - | R | - | - | - | - | - | W | W | R | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| followup-management | R | - | - | - | - | - | - | - | - | - | - | - | - | R | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| followup-slippage-detector | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| retention-campaign | R | - | - | - | - | - | - | - | - | - | - | - | - | R | - | R | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | W | - |
| customer-satisfaction-monitor | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | - | - | W | W | - | - | - | - | - | - | W | - |
| feedback-analysis | R | - | - | - | R | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | R | - | - | - | - | - | - | W | - |
| knowledge-article-lifecycle | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | W | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| knowledge-gap-detection | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| notification-delivery | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | R | R | - | - | - | - | - | - | - | - | - | - | W | - |
| daily-standup | R | - | R | - | R | - | - | R | - | - | - | - | - | R | - | R | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| operations-coordination | R | - | R | - | R | - | - | R | - | R | - | - | - | - | - | - | - | W | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| report-generation | R | - | R | R | R | R | - | R | - | R | - | R | - | R | R | R | - | R | - | R | R | - | - | - | R | R | R | R | - | - | - | - | - | - | W | - |
| report-distribution | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | R | R | - | - | - | - | R | - | - | - | - | - | W | - |
| trend-analysis | R | - | R | R | R | R | - | R | - | R | - | R | R | R | R | R | R | R | R | R | R | R | - | - | R | R | R | R | - | - | - | - | - | - | W | - |
| anomaly-detection | - | - | - | - | R | - | - | R | - | R | - | - | - | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - |
| quality-review | - | - | - | - | R | R | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | R | - | - | - | - | - | - | - | W | - |
| user-provisioning | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | W | W | - | - | - | W | - |
| system-config-management | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | W | - | W | - |
| inventory-reorder | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | - | - | R | R | - | - | - | - | - | - | - | - | W | - |
| workflow-health-monitor | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | W | R |

---

## 5. Workflow-to-Application Matrix

| Workflow | cust-portal | support-center | ops-center | appt-center | tech-portal | res-center | crm-center | notif-center | analytics-center | admin-center |
|---|---|---|---|---|---|---|---|---|---|---|
| ticket-auto-response | R | P | - | - | - | - | - | S | - | - |
| ticket-intake | R | P | - | - | - | - | - | S | - | - |
| ticket-escalation | - | P | S | - | - | - | - | S | - | - |
| sla-enforcement | - | P | - | - | - | - | - | S | - | - |
| appointment-booking | R | - | - | P | R | - | - | S | - | - |
| appointment-reminders | - | - | - | P | R | - | - | S | - | - |
| appointment-completion | - | - | S | R | P | - | - | - | - | - |
| standard-dispatch | - | - | P | - | R | - | - | S | - | - |
| urgent-dispatch | - | - | P | - | R | - | - | S | - | - |
| work-order-fulfillment | - | - | S | - | P | - | - | - | - | - |
| work-order-verification | - | - | S | - | P | - | R | - | - | - |
| dispute-resolution | R | - | - | - | - | P | - | S | - | - |
| dispute-escalation | - | - | - | - | - | P | - | S | - | P |
| account-health-scan | - | - | - | - | - | - | P | S | - | - |
| followup-management | - | - | - | - | - | - | P | S | - | - |
| followup-slippage-detector | - | - | - | - | - | - | P | S | - | - |
| retention-campaign | - | - | - | - | - | - | P | S | - | - |
| customer-satisfaction-monitor | R | - | - | - | - | - | S | S | - | - |
| feedback-analysis | - | - | - | - | - | - | S | - | S | - |
| knowledge-article-lifecycle | - | S | - | - | - | - | - | - | - | R |
| knowledge-gap-detection | - | P | - | - | - | - | - | - | - | - |
| notification-delivery | - | - | - | - | - | - | - | P | - | - |
| daily-standup | - | - | P | - | - | - | - | - | S | - |
| operations-coordination | - | - | P | - | - | - | S | - | - | - |
| report-generation | - | - | - | - | - | - | - | - | P | - |
| report-distribution | - | - | - | - | - | - | - | S | P | - |
| trend-analysis | - | - | - | - | - | - | - | - | P | - |
| anomaly-detection | - | - | - | - | - | - | - | - | P | - |
| quality-review | - | S | - | - | - | - | - | - | - | P |
| user-provisioning | - | - | - | - | - | - | - | - | - | P |
| system-config-management | - | - | - | - | - | - | - | - | - | P |
| inventory-reorder | - | - | P | - | - | - | - | - | - | - |
| workflow-health-monitor | - | - | - | - | - | - | - | - | - | P |

---

## 6. Workflow-to-Notification Matrix

| Workflow | Customer Notification | Technician Notification | Manager Alert | Department Alert | System Alert |
|---|---|---|---|---|---|
| ticket-auto-response | ✓ | - | - | - | - |
| ticket-intake | ✓ (confirmation + reply) | - | ✓ (escalation) | - | - |
| ticket-escalation | ✓ (status update) | - | ✓ (next level) | ✓ | - |
| sla-enforcement | ✓ (breach) | - | ✓ (breach) | - | - |
| appointment-booking | ✓ (confirmation) | ✓ (assignment) | - | - | - |
| appointment-reminders | ✓ (24h, 2h) | ✓ (2h, 30min) | - | - | - |
| appointment-completion | - | - | - | - | - |
| standard-dispatch | - | ✓ (dispatch) | - | - | - |
| urgent-dispatch | - | ✓ (urgent) | ✓ (escalation) | - | ✓ (emergency) |
| work-order-fulfillment | - | - | - | - | - |
| work-order-verification | ✓ (verification) | - | ✓ (QA issue) | - | - |
| dispute-resolution | ✓ (status update) | - | ✓ (resolution ready) | - | - |
| dispute-escalation | ✓ (escalated status) | - | ✓ (executive) | - | - |
| account-health-scan | - | - | ✓ (risk signal) | ✓ (health drop) | - |
| followup-management | - | - | ✓ (overdue) | - | - |
| followup-slippage-detector | - | - | ✓ (slippage) | - | - |
| retention-campaign | ✓ (win-back offer) | - | ✓ (campaign start) | - | - |
| customer-satisfaction-monitor | ✓ (survey) | - | ✓ (low score) | - | - |
| feedback-analysis | - | - | ✓ (insight) | ✓ (risk) | - |
| knowledge-article-lifecycle | - | - | ✓ (review needed) | - | - |
| knowledge-gap-detection | - | - | ✓ (gap detected) | - | - |
| notification-delivery | ✓ | ✓ | - | - | - |
| daily-standup | - | - | - | ✓ (standup ready) | - |
| operations-coordination | - | - | ✓ (blocker) | ✓ | - |
| report-generation | - | - | - | ✓ (report ready) | - |
| report-distribution | - | - | ✓ (key stakeholder) | - | - |
| trend-analysis | - | - | ✓ (significant trend) | ✓ | - |
| anomaly-detection | - | - | ✓ (anomaly) | ✓ | ✓ (critical) |
| quality-review | - | - | ✓ (violation) | - | - |
| user-provisioning | - | - | - | - | - |
| system-config-management | - | - | ✓ (config change) | - | - |
| inventory-reorder | - | - | ✓ (low stock) | - | - |
| workflow-health-monitor | - | - | ✓ (failure) | - | ✓ (critical) |

---

## 7. Workflow-to-Human Matrix

| Workflow | Human Role | Approval Type | Timeout | Escalation If Timeout |
|---|---|---|---|---|
| ticket-auto-response | None | N/A | N/A | N/A |
| ticket-intake | Support Agent | Approve/reject draft | 4h | Support Manager AI |
| ticket-escalation | Support Manager | Confirm escalation level | 2h | Platform Orchestrator |
| sla-enforcement | None | N/A | N/A | N/A |
| appointment-booking | None | N/A | N/A | N/A |
| appointment-reminders | None | N/A | N/A | N/A |
| appointment-completion | None | N/A | N/A | N/A |
| standard-dispatch | None | N/A | N/A | N/A |
| urgent-dispatch | Dispatch Manager (emergency) | Emergency override | 5min | Auto-activate |
| work-order-fulfillment | None (technician-driven) | N/A | N/A | N/A |
| work-order-verification | QA Analyst | Quality pass/fail | 48h | Auto-verify provisional |
| dispute-resolution | Resolution Manager | Approve/reject resolution | 24h | Reminder at 12h, escalate at 24h |
| dispute-escalation | Human Executive | Legal escalation | 48h | Platform Orchestrator |
| account-health-scan | None | N/A | N/A | N/A |
| followup-management | None | N/A | N/A | N/A |
| followup-slippage-detector | None | N/A | N/A | N/A |
| retention-campaign | CRM Manager | Financial offer > $500 | 24h | CRM Director |
| customer-satisfaction-monitor | None | N/A | N/A | N/A |
| feedback-analysis | None | N/A | N/A | N/A |
| knowledge-article-lifecycle | Knowledge Manager | New category approval | 7 days | Auto-publish with flag |
| knowledge-gap-detection | Knowledge Manager | Article content approval | 48h | Publish with provisional status |
| notification-delivery | None | N/A | N/A | N/A |
| daily-standup | None | N/A | N/A | N/A |
| operations-coordination | Ops Manager | Task assignment confirmation | 1h | Auto-assign based on coordinator suggestion |
| report-generation | None | N/A | N/A | N/A |
| report-distribution | None | N/A | N/A | N/A |
| trend-analysis | None | N/A | N/A | N/A |
| anomaly-detection | Analytics Manager | Critical anomaly investigation | 4h | Auto-escalate to department |
| quality-review | QA Manager | Compliance violation | 24h | Admin Manager |
| user-provisioning | Admin Manager | User deactivation | 4h | Auto-suspend + notify |
| system-config-management | Admin Manager | All config changes | 4h | Rollback + notify |
| inventory-reorder | Warehouse Manager | Purchase order approval | 24h | Auto-order with flag |
| workflow-health-monitor | Automation Manager | System-wide pause | 15min | Auto-pause non-critical workflows |

---

> **End of WORKFLOW_INTERACTION_MATRIX.md**  
> Next document: WORKFLOW_TRIGGER_MATRIX.md
