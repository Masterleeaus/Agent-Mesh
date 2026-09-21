# ResQAI V2 — Function-to-Workflow Matrix

> **Version:** 2.0.0  
> **Generated:** 2026-06-30

| Function | Workflow | Trigger Type | Role in Workflow |
|----------|----------|-------------|------------------|
| validate-ticket-input (V2) | ticket-intake_v2 | Event (ticket.created) | Validate input fields before processing |
| validate-ticket-input (V2) | ticket-auto-response_v2 | Event (ticket.created) | Pre-validation before auto-response |
| check-ticket-urgency | ticket-intake_v2 | Event (ticket.created) | Determine urgency for routing decision |
| check-ticket-urgency | urgent-dispatch_v2 | Event (ticket.escalated + urgent) | Confirm urgency before dispatch |
| check-ticket-urgency | ticket-auto-response_v2 | Event (ticket.created) | Route to auto-response or human |
| update-ticket-record | ticket-intake_v2 | Event (ticket.classified) | Write classification results to ticket |
| update-ticket-record | support-escalation-manager_v2 | Event (ticket.escalated) | Update escalation level and status |
| update-ticket-record | customer-satisfaction-monitor_v2 | Schedule | Update satisfaction tracking fields |
| update-ticket-record | ticket-auto-response_v2 | Event (ticket.created) | Save auto-response draft |
| classify-ticket-sla-tier (V2) | ticket-intake_v2 | Event (ticket.created) | Assign SLA tier and deadlines |
| classify-ticket-sla-tier (V2) | sla-enforcement_v2 | Schedule | Re-classify on SLA tier changes |
| check-sla-deadline (V2) | sla-enforcement_v2 | Schedule (every min) | Check individual ticket SLA status |
| batch-sla-check (V2) | sla-enforcement_v2 | Schedule (every min) | Batch check all active SLA deadlines |
| collect-resolved-tickets | customer-satisfaction-monitor_v2 | Schedule (daily) | Gather resolved tickets for review |
| collect-resolved-tickets | daily-standup_v2 | Schedule (weekdays 8AM) | Collect resolution metrics for standup |
| assign-appointment-technician | appointment-assignment_v2 | Event (appointment.created) | Assign technician to appointment |
| assign-appointment-technician | appointment-booking_v2 | Event (appointment.created) | Initial tech assignment during booking |
| fetch-upcoming-appointments | appointment-reminders_v2 | Schedule (every 30min) | Fetch appointments needing reminders |
| schedule-appointment-reminders (V2) | appointment-reminders_v2 | Event (appointment.confirmed) | Create reminder schedule entries |
| check-reminder-window (V2) | appointment-reminders_v2 | Schedule (every 30min) | Check if reminder window is open |
| finalize-dispatch | urgent-dispatch_v2 | Event (ticket.classified urgent) | Finalize and send dispatch |
| finalize-dispatch | standard-dispatch_v2 | Event (dispatch.created) | Complete standard dispatch process |
| calculate-dispatch-priority (V2) | urgent-dispatch_v2 | Event (ticket.classified urgent) | Compute dispatch priority score |
| calculate-dispatch-priority (V2) | standard-dispatch_v2 | Event (dispatch.created) | Determine standard dispatch priority |
| create-work-order | work-order-fulfillment_v2 | Event (appointment.completed) | Create work order from completed appointment |
| update-work-order-stage (V2) | work-order-fulfillment_v2 | Event (work_order.created) | Track work order stage progression |
| complete-work-order (V2) | work-order-fulfillment_v2 | Event (work_order.stage.changed) | Finalize and close work order |
| resolve-dispute | dispute-resolution_v2 | Event (dispute.created) | Resolve dispute with outcome |
| resolve-dispute | dispute-escalation_v2 | Event (dispute.escalated) | Resolve escalated dispute |
| resolve-dispute-v2 | dispute-resolution_v2 | Event (dispute.created) | V2 resolution with typed outcomes |
| resolve-dispute-v2 | dispute-escalation_v2 | Event (dispute.escalated) | V2 resolution on escalated disputes |
| account-health-scan | account-health-scan_v2 | Schedule (daily 2AM) | Execute full health scan |
| account-health-scan | account-health-monitoring_v2 | Schedule (daily 2AM) | Run health scan for monitoring |
| update-account-health-status | account-health-monitoring_v2 | Event (scan.completed) | Update account health category |
| update-account-health-status | account-health-scan_v2 | Event (scan.completed) | Persist health status changes |
| flag-slipping-followups | followup-slippage-detector_v2 | Schedule (weekdays 6AM) | Detect overdue followups |
| flag-slipping-followups | account-health-scan_v2 | Schedule (daily 2AM) | Include slippage in health scan |
| create-followup-tasks | account-health-scan_v2 | Event (risk.signal.detected) | Create remediation tasks |
| create-followup-tasks | followup-management_v2 | Event (followup.created) | Generate followup task records |
| create-followup-tasks | retention-campaign_v2 | Event (campaign.started) | Create retention campaign tasks |
| finalize-slippage-review | followup-slippage-detector_v2 | Event (slippage reviewed) | Finalize review outcome |
| generate-account-score | account-health-scan_v2 | Event (scan.triggered) | Compute numeric health score |
| process-feedback-survey (V2) | feedback-analysis_v2 | Event (feedback.submitted) | Store survey response |
| process-feedback-survey (V2) | customer-satisfaction_v2 | Event (survey.submitted) | Process satisfaction survey |
| analyze-feedback-sentiment (V2) | feedback-analysis_v2 | Event (feedback.submitted) | Analyze sentiment and themes |
| extract-knowledge-gap (V2) | knowledge-gap-detection_v2 | Schedule (weekly) | Identify knowledge gaps |
| search-knowledge-articles | ticket-intake_v2 | Event (ticket.created) | Find relevant articles for ticket |
| suggest-knowledge-article | ticket-intake_v2 | Event (ticket.created) | Suggest articles for draft reply |
| render-notification-template (V2) | notification-delivery_v2 | Event (notification.send) | Render template for dispatch |
| dispatch-notifications | notification-delivery_v2 | Event (notification.send) | Send notification via connectors |
| dispatch-notifications | appointment-reminders_v2 | Schedule (every 30min) | Dispatch appointment reminders |
| dispatch-notifications | user-provisioning_v2 | Event (user.created) | Send welcome notification |
| dispatch-notifications | report-distribution_v2 | Event (report.generated) | Deliver report to subscribers |
| dispatch-notifications | ticket-intake_v2 | Event (ticket.created) | Send ticket confirmation |
| dispatch-notifications | urgent-dispatch_v2 | Event (dispatch.sent) | Notify technician of dispatch |
| dispatch-notifications | standard-dispatch_v2 | Event (dispatch.created) | Notify technician of standard dispatch |
| dispatch-notifications | dispute-resolution_v2 | Event (dispute.resolved) | Notify of resolution outcome |
| dispatch-notifications | customer-satisfaction-monitor_v2 | Schedule (daily) | Send survey invitations |
| dispatch-notifications | followup-management_v2 | Event (followup.created) | Send followup notifications |
| dispatch-notifications | retention-campaign_v2 | Event (campaign.started) | Send retention offers |
| dispatch-notifications | sla-enforcement_v2 | Event (sla_breached) | Send SLA breach alerts |
| dispatch-notifications | inventory-reorder_v2 | Event (reorder.created) | Send reorder notifications |
| process-notification-delivery (V2) | notification-delivery_v2 | Event (provider.callback) | Process delivery status callbacks |
| create-operations-tasks | daily-standup_v2 | Schedule (weekdays 8AM) | Create tasks from standup actions |
| create-operations-tasks | operations-coordination_v2 | Manual | Create tasks from coordination output |
| generate-standup-report (V2) | daily-standup_v2 | Schedule (weekdays 8AM) | Generate daily standup report |
| generate-standup-report (V2) | operations-coordination_v2 | Manual | Generate ops coordination report |
| generate-report-data (V2) | report-generation_v2 | Schedule / Manual | Execute report queries |
| send-report (V2) | report-generation_v2 | Event (report.generated) | Send report to recipients |
| send-report (V2) | report-distribution_v2 | Event (report.generated) | Distribute report via channels |
| sync-events-analytics (V2) | trend-analysis_v2 | Schedule (daily 4AM) | Sync events to analytics |
| calculate-metric-trend (V2) | trend-analysis_v2 | Schedule (daily 4AM) | Compute metric trends |
| calculate-metric-trend (V2) | anomaly-detection_v2 | Schedule (hourly) | Detect anomalies in trends |
| batch-metric-aggregation (V2) | trend-analysis_v2 | Schedule (daily 4AM) | Batch compute aggregations |
| batch-metric-aggregation (V2) | anomaly-detection_v2 | Schedule (hourly) | Batch metrics for anomaly detection |
| provision-user (V2) | user-provisioning_v2 | Event (user.created) | Provision user with role and permissions |
| deactivate-user (V2) | user-provisioning_v2 | Event (deactivation.requested) | Deactivate user and invalidate sessions |
| validate-config-change (V2) | system-config-management_v2 | Manual / Event | Validate configuration change |
| apply-config-change (V2) | system-config-management_v2 | Event (validation.passed) | Apply configuration change |
| check-inventory-level (V2) | inventory-reorder_v2 | Schedule (daily 6AM) | Check stock levels |
| reorder-inventory (V2) | inventory-reorder_v2 | Event (low_stock.detected) | Create reorder request |
| record-inventory-transaction (V2) | inventory-reorder_v2 | Event (reorder.received) | Record inventory transaction |
| record-inventory-transaction (V2) | work-order-fulfillment_v2 | Event (parts.used) | Record parts consumption |
| evaluate-quality-score (V2) | quality-review_v2 | Event (qa.audit.triggered) | Score quality of response |
| flag-quality-violation (V2) | quality-review_v2 | Event (score.below_threshold) | Flag quality compliance violations |
| verify-workflow-health (V2) | workflow-health-monitor_v2 | Schedule (every 5min) | Check workflow execution health |
| recover-workflow-instance (V2) | workflow-health-monitor_v2 | Event (workflow.failed) | Attempt workflow recovery |
| reset-circuit-breaker (V2) | workflow-health-monitor_v2 | Event (circuit.open) | Reset circuit breaker after cooldown |
| validate-permissions (V2) | ALL V2 workflows | On each workflow node | Authorize function execution |
| log-audit-event | ALL V2 workflows | After each mutation | Record audit trail |
