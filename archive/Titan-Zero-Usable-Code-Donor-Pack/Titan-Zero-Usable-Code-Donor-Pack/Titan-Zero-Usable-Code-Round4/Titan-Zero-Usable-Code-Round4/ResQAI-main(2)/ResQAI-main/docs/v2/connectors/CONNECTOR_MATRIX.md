# RESQAI V2 — Connector Matrix

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Connector-to-Function Matrix](#1-connector-to-function-matrix)
2. [Connector-to-Workflow Matrix](#2-connector-to-workflow-matrix)
3. [Connector-to-Application Matrix](#3-connector-to-application-matrix)
4. [Connector-to-Agent Matrix](#4-connector-to-agent-matrix)
5. [Connector-to-Notification Channel Matrix](#5-connector-to-notification-channel-matrix)

---

## 1. Connector-to-Function Matrix

Functions that use connectors (only ORCHESTRATOR type functions have direct connector access):

| Function | Connector(s) Used | Operation | Frequency |
|----------|:-----------------:|-----------|:---------:|
| dispatch-notifications | SMTP, Twilio SMS, Discord Webhook, Slack, Gmail | Send notification | Per notification event |
| rotate-credentials | All (via provider API) | Rotate credentials | Per schedule |
| provision-user | SMTP (welcome email) | Send welcome email | Per user creation |

All other functions (DETERMINISTIC, READER, WRITER, AGGREGATOR, TRANSFORMER) do NOT access connectors directly.

---

## 2. Connector-to-Workflow Matrix

| Workflow | Connector(s) Used | Purpose | Frequency |
|----------|:-----------------:|---------|:---------:|
| ticket-auto-response_v2 | SMTP, Twilio SMS | Send auto-response to customer | Per ticket.created (auto-response enabled) |
| ticket-intake_v2 | SMTP | Send confirmation | Per ticket |
| ticket-escalation_v2 | SMTP, Discord Webhook | Notify manager of escalation | Per escalation |
| sla-enforcement_v2 | SMTP, Discord Webhook | SLA breach notification | Per breach |
| appointment-booking_v2 | SMTP, Twilio SMS | Send booking confirmation | Per appointment |
| appointment-reminders_v2 | SMTP, Twilio SMS, Slack | Send reminders at 24h/2h/30min | Per appointment schedule |
| standard-dispatch_v2 | Twilio SMS, Slack | Notify technician of dispatch | Per dispatch |
| urgent-dispatch_v2 | Twilio SMS, Discord Webhook, Slack | Emergency notification + escalation | Per urgent dispatch |
| dispute-resolution_v2 | SMTP | Status update to customer | Per dispute resolution |
| dispute-escalation_v2 | SMTP, Discord Webhook | Executive escalation | Per executive escalation |
| customer-satisfaction-monitor_v2 | SMTP | Send survey | Per service completion |
| report-distribution_v2 | SMTP | Email report to subscribers | Per schedule |
| notification-delivery_v2 | ALL notification channels | General notification delivery | Per notification.send event |
| inventory-reorder_v2 | SMTP, Slack | Notify warehouse manager | Per low-stock event |
| workflow-health-monitor_v2 | Discord Webhook, Slack | Alert on workflow failure | Per failure |
| daily-standup_v2 | SMTP, Slack | Distribute standup report | Daily |
| account-health-scan_v2 | SMTP, Slack | Risk signal alert | Per health change |
| followup-management_v2 | SMTP, Slack | Overdue followup alert | Per slippage |
| system-config-management_v2 | SMTP, Discord Webhook | Config change notification to admin | Per config change |

---

## 3. Connector-to-Application Matrix

| Application | Connector(s) Used | Purpose |
|-------------|:-----------------:|---------|
| support-center_v2 | SMTP, Gmail | Send customer replies, receive inbound email |
| customer-portal_v2 | SMTP | Send notifications (via notification-center) |
| notification-center_v2 | SMTP, Twilio SMS, Discord Webhook, Slack, Gmail | All outbound notification dispatch |
| operations-center_v2 | Twilio SMS, Slack | Technician dispatch, team alerts |
| crm-center_v2 | SMTP | Account health alerts, retention campaigns |
| admin-center_v2 | All (configuration) | Connector management, health monitoring |
| resolution-center_v2 | SMTP | Dispute outcome notifications |

---

## 4. Connector-to-Agent Matrix

| Agent | Connector(s) Used | Purpose |
|-------|:-----------------:|---------|
| admin-connector-manager_v2 | All (config only) | Monitor health, rotate credentials, update config |
| notification-manager_v2 | All (via dispatch-notifications) | Manage channel routing and delivery |
| notification-channel-optimizer_v2 | All (read health status) | Select optimal channel per notification |
| dispatch-technician-dispatcher_v2 | Twilio SMS, Slack | Send technician dispatch (via dispatch-notifications) |
| appointment-reminder-coordinator_v2 | SMTP, Twilio SMS | Schedule reminder sends (via dispatch-notifications) |
| reporting-distributor_v2 | SMTP | Send report via email (via dispatch-notifications) |

---

## 5. Connector-to-Notification Channel Matrix

| Connector Type | Channel Name | Use Case | Rate Limited | Circuit Breaker | Fallback Chain |
|:--------------:|:------------:|----------|:------------:|:---------------:|:--------------:|
| smtp | Email (primary) | Transactional emails, reports | ✓ | ✓ | smtp → gmail → sms |
| gmail | Email (backup) | Customer email replies | ✓ | ✓ | gmail → smtp → sms |
| sms_twilio | SMS | Urgent notifications, reminders | ✓ | ✓ | sms → email → in-app |
| discord_webhook | Discord | Manager/executive alerts | ✓ | ✓ | discord → slack → email |
| slack | Slack | Team notifications, standup | ✓ | ✓ | slack → email → in-app |
| (in-app) | In-app | Non-urgent notifications | — | — | (always available) |

---

> **End of CONNECTOR_MATRIX.md**  
> Next document: SYSTEM_INTEGRATION_MATRIX.md
