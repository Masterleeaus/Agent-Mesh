# ResQAI V2 — Component Data Mapping

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Total Components Mapped:** 143  

---

## 1. support-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| TicketList | tickets_v2: id, ticket_number, subject, ticket_status, priority, urgency, channel, customer_id, assigned_to, created_at, sla_due_at | — | priority_from_urgency, sla_remaining, age | customers_v2(name), users_v2(agent name) | — |
| TicketDetailPanel | tickets_v2: all fields | ticket_status, assigned_to, priority, internal_notes | time_in_status, sla_breach_percent | ticket_messages_v2, ticket_attachments_v2, customers_v2 | status must follow lifecycle |
| MessageThread | ticket_messages_v2: sender_type, sender_id, message_body, message_type, created_at | — | is_agent, is_customer, time_ago | tickets_v2(id), users_v2(sender) | — |
| ReplyEditor | ticket_messages_v2: message_body | message_body (rich text) | character_count | tickets_v2(id) | min_length=1, max_length=10000 |
| SLAStopwatch | tickets_v2: sla_due_at, ticket_status, created_at | — | time_remaining_pct, is_breached, breach_in | — | — |
| BulkActionBar | tickets_v2: ids[] | ticket_status, assigned_to | selected_count | — | selection required |
| AIReplySuggestion | — | draft_reply | confidence_score | tickets_v2(id), customers_v2 | — |
| ClassificationBadges | tickets_v2: request_type, urgency, channel | — | badge_color, icon | reference_data_v2 | — |
| TemplateSelector | tickets_v2: id | selected_template | — | ticket_messages_v2 | — |
| OwnerAssigner | tickets_v2: assigned_to | assigned_to | — | users_v2(role=agent) | must be agent role |
| EscalationBanner | tickets_v2: ticket_status, priority | — | is_escalated, escalation_level | — | — |
| UrgencyIndicator | tickets_v2: urgency, priority | — | color, icon, sort_weight | — | — |
| TicketHistoryTimeline | tickets_v2: ticket_status, created_at, updated_at | — | status_transitions, time_in_each | ticket_messages_v2 | — |
| FilterBar (Support) | tickets_v2: ticket_status, priority, channel, assigned_to, date_range | filter values | active_filter_count | reference_data_v2 | — |
| KanbanView | tickets_v2: id, ticket_status, title, customer_id, priority | ticket_status (drag) | — | customers_v2 | status must follow lifecycle |
| PermissionGuard | role_permissions_v2: resource, action | — | has_permission | users_v2(role_id) | — |

## 2. appointment-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| AppointmentCard | appointments_v2: id, customer_id, technician_id, scheduled_start, scheduled_end, appointment_status, address_id | — | duration_formatted, tech_name, customer_name | customers_v2, technicians_v2, customer_addresses_v2 | — |
| AppointmentQueueTable | appointments_v2: all list fields | appointment_status (batch) | queue_position, wait_time | customers_v2, technicians_v2 | — |
| AppointmentStatusBadge | appointments_v2: appointment_status | — | badge_color, icon, next_states | — | — |
| AppointmentTimeline | appointments_v2: appointment_status, created_at, updated_at | — | status_sequence, time_in_stage | appointment_reminders_v2, dispatches_v2 | — |
| AppointmentHistoryTable | appointments_v2: id, scheduled_start, appointment_status, customer_id, technician_id | — | — | customers_v2, technicians_v2 | — |
| AssignTechnicianDialog | technicians_v2: id, name, technician_availability, rating_avg | technician_id | available_today, job_count | technician_skills_v2 | must be available |
| TechnicianPicker | technicians_v2: id, name, rating_avg, specialties | selected_tech_id | match_score, availability | technician_skills_v2, reference_data_v2 | — |
| TechSuggestionCard | technicians_v2: id, name, rating_avg, specialties | — | match_score, conflict_warning | appointments_v2(schedule) | — |
| ScheduleCalendar | appointments_v2: scheduled_start, scheduled_end, appointment_status, technician_id | — | day_view, week_view, month_view | technicians_v2 | — |
| TimeSlotPicker | appointments_v2 | selected_slot | available_slots, conflicts | technicians_v2, customer_addresses_v2 | must be in future |
| BookingWizard | appointments_v2: customer_id, service_type, scheduled_start, technician_id | all booking fields | — | customers_v2, technicians_v2, customer_addresses_v2, tickets_v2 | all required |
| ServiceTypeSelector | reference_data_v2: category='service_type' | selected_type | duration, price | — | — |
| ConflictWarning | appointments_v2: scheduled_start, scheduled_end, technician_id | — | overlapping_appts | appointments_v2(technician_id, time) | — |
| CancelAppointmentDialog | appointments_v2: id, appointment_status | cancellation_reason | is_cancellable | — | reason required |
| AssignmentConfirmationDialog | appointments_v2: id, technician_id | — | — | technicians_v2 | — |
| TechnicianAvailabilityWidget | technicians_v2: id, name, technician_availability, current_lat, current_lng | — | is_available, distance | appointments_v2(schedule) | — |
| PendingAssignmentWidget | appointments_v2 | — | count, oldest | technicians_v2 | — |
| UpcomingAppointments | appointments_v2: scheduled_start, scheduled_end, customer_id, technician_id | — | time_until | customers_v2, technicians_v2 | — |
| TodayAppointments | appointments_v2 | — | completed_ct, pending_ct | technicians_v2 | — |
| OverdueAppointments | appointments_v2: scheduled_start, appointment_status | — | overdue_duration | customers_v2 | — |
| CompletedTodayWidget | appointments_v2: appointment_status='completed' | — | count, avg_duration | technicians_v2 | — |
| TechnicianDayView | technicians_v2: id, name, appointments_v2 | technician_id | schedule_grid | appointments_v2 | — |
| TimelineView | appointments_v2 | — | timeline_events | customers_v2, technicians_v2 | — |
| PermissionGuard | role_permissions_v2: resource, action | — | has_permission | users_v2(role_id) | — |
| Dialogs (Appt) | — | — | — | — | — |
| ReportsPage | appointments_v2 | — | aggregated_stats | — | date range required |

## 3. operations-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| DispatchQueueTable | dispatches_v2: id, technician_id, dispatch_status, dispatch_type, sent_at, appointment_id, work_order_id | dispatch_status | time_since_created | technicians_v2, appointments_v2, work_orders_v2 | — |
| AssignmentQueueTable | work_orders_v2: id, order_number, work_order_status, technician_id, ticket_id, scope_of_work | technician_id | unassigned_duration | technicians_v2, tickets_v2 | tech must be available |
| TechnicianStatusTable | technicians_v2: id, name, technician_availability, current_lat, current_lng, is_active | — | is_online, current_job, last_location_age | dispatches_v2 | — |
| ActiveTechniciansWidget | technicians_v2: id, name, technician_availability | — | count, by_status | dispatches_v2 | — |
| ActiveTicketsWidget | tickets_v2: id, ticket_number, ticket_status, priority | — | count, by_priority, oldest | — | — |
| LiveMetricsWidget | dispatches_v2 | — | active_dispatch_ct, avg_response, sla_pct | work_orders_v2 | — |
| HighPriorityQueueWidget | dispatches_v2: dispatch_type='urgent'|'emergency' | — | count, oldest | technicians_v2 | — |
| PendingDispatchWidget | dispatches_v2: dispatch_status='pending' | — | count, avg_wait | — | — |
| OverdueJobsWidget | work_orders_v2: work_order_status, created_at | — | overdue_count, max_overdue | — | — |
| EscalationListTable | work_orders_v2: id, ticket_id, work_order_status | — | escalation_reason, time | tickets_v2 | — |
| OperationsTimelineTable | work_order_stages_v2: work_order_id, stage_name, entered_at, exited_at, duration_seconds | — | current_stage, total_duration | work_orders_v2 | — |
| RegionalStatusWidget | work_orders_v2, technicians_v2 | — | regional_counts, status_by_region | — | — |
| CompleteOperationForm | work_orders_v2: id, completed_at, labor_hours, cost_cents, materials_used, notes | completed fields | total_cost | work_order_stages_v2 | labor_hours > 0 |
| CloseOperationForm | work_orders_v2: id | sign_off, notes | — | — | sign_off required |
| UpdateOperationStatusForm | work_orders_v2: work_order_status | status | — | — | must follow lifecycle |
| ReassignTechnicianForm | work_orders_v2: id, technician_id | technician_id, reason | — | technicians_v2 | reason required |
| ManualDispatchForm | dispatches_v2: technician_id, dispatch_type, notes | all fields | — | technicians_v2, appointments_v2, work_orders_v2 | all required |
| EscalateOperationForm | work_orders_v2: id | escalation_reason, level | — | tickets_v2 | reason required |
| DispatchConfirmationDialog | dispatches_v2: id, technician_id | — | — | technicians_v2 | — |
| ReassignmentConfirmationDialog | work_orders_v2: id, technician_id(old/new) | — | — | technicians_v2 | — |
| ConflictWarningDialog | dispatches_v2: technician_id, time | — | conflicts | appointments_v2, dispatches_v2 | — |
| PendingDispatchWidget | dispatches_v2 | — | count, oldest | — | — |
| PermissionGuard | role_permissions_v2: resource, action | — | has_permission | users_v2(role_id) | — |

## 4. technician-portal_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| PermissionGuard | role_permissions_v2: resource, action | — | has_permission | users_v2(role_id) | — |

## 5. resolution-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| CaseListTable | disputes_v2: id, dispute_number, dispute_status, dispute_reason, amount_cents, customer_id, ticket_id, created_at | — | age, status_color | customers_v2, tickets_v2 | — |
| DisputeListTable | disputes_v2: id, dispute_number, dispute_status, dispute_reason, raised_by, created_at | dispute_status | age, days_in_status | customers_v2, users_v2(raised_by) | — |
| ResolutionForm | disputes_v2: id, resolution_notes, dispute_status | resolution_notes, status | — | dispute_evidence_v2 | notes required for resolution |
| EvidenceViewer | dispute_evidence_v2: id, evidence_type, file_path, file_name, description, created_at | — | file_icon, is_image | disputes_v2 | — |
| Timeline (Resolution) | disputes_v2: dispute_status, created_at, updated_at, resolved_at | — | status_sequence, time_in_stage | dispute_evidence_v2 | — |
| WidgetCard | — | — | metric_value, trend | — | — |
| PermissionGuard | role_permissions_v2: resource, action | — | has_permission | users_v2(role_id) | — |

## 6. crm-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| AccountHealthCard | accounts_v2: account_health, health_score, account_name | — | health_color, health_icon, score_pct | account_health_scans_v2 | — |
| AccountQuickActions | accounts_v2: id | action_type | — | — | — |
| AccountSearchDropdown | accounts_v2: account_name, account_number, id | — | — | customers_v2 | min_search_chars=2 |
| AccountTimeline | accounts_v2: id | — | events_by_date | customers_v2, tickets_v2, appointments_v2, followups_v2 | — |
| FollowupList | followups_v2: id, followup_type, followup_status, scheduled_at, assigned_to, customer_id | followup_status | overdue, due_soon | accounts_v2, customers_v2, tickets_v2 | — |
| HealthCategoryBar | account_health_scans_v2: scan_score, account_health | — | healthy%, watch%, slipping%, critical% | accounts_v2 | — |
| HealthGauge | account_health_scans_v2: scan_score | — | gauge_angle, color | accounts_v2 | 0-100 range |
| HealthScanResultCard | account_health_scans_v2: scan_score, previous_score, score_delta, scan_factors, risk_indicators | — | trend_direction, delta_formatted | accounts_v2 | — |
| RiskSignalCard | account_health_scans_v2: risk_indicators | — | severity, signal_type | accounts_v2 | — |
| SlippingAlertBanner | accounts_v2: account_health, account_name, mrr_cents | — | mrr_at_risk, days_declining | account_health_scans_v2 | — |
| Dialogs (CRM) | — | — | — | — | — |
| PermissionGuard | role_permissions_v2: resource, action | — | has_permission | users_v2(role_id) | — |

## 7. customer-portal_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| AccountSummaryCard | customers_v2, accounts_v2 | — | health_status, tier_label | accounts_v2(customer_id) | — |
| AppointmentCalendar | appointments_v2: scheduled_start, scheduled_end, appointment_status | — | month_grid, days_with_appts | — | — |
| AppointmentCard (Portal) | appointments_v2: id, scheduled_start, scheduled_end, appointment_status, technician_id | — | date_formatted, tech_name, duration | technicians_v2 | — |
| CustomerSidebar | customers_v2, accounts_v2 | — | open_tickets, upcoming_appts | tickets_v2, appointments_v2 | — |
| DisputeStatusCard | disputes_v2: dispute_status, dispute_number, created_at | — | status_timeline, days_open | dispute_evidence_v2 | — |
| NotificationPreferences | users_v2: settings_config | notification_channels | — | — | — |
| ProfileEditor | customers_v2: first_name, last_name, email, phone | profile fields | full_name | users_v2 | email format, phone E.164 |
| QuickTicketForm | tickets_v2: subject, description, request_type, urgency | ticket fields | — | customers_v2 | subject required |
| SelfServiceBooking | appointments_v2: service_type, scheduled_start, address_id | booking fields | available_slots | customer_addresses_v2, technicians_v2 | future date required |
| ServiceHistoryList | work_orders_v2, appointments_v2 | — | completed_count, total_spent | feedback_v2 | — |
| TicketStatusTimeline | tickets_v2: ticket_status, created_at, updated_at, resolved_at, closed_at | — | status_sequence, current_stage_pct | ticket_messages_v2 | — |

## 8. analytics-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| KpiDashboardGrid | tickets_v2, appointments_v2, accounts_v2, disputes_v2 | — | kpi_values, trends | — | — |
| LiveKPICards | dispatches_v2, work_orders_v2 | — | realtime_kpis | — | — |
| MetricCard (Analytics) | — | — | metric_value, change_pct, sparkline | — | — |
| TimeSeriesChart | tickets_v2, appointments_v2, disputes_v2 | — | aggregated_by_period | — | — |
| BarChart | — | — | grouped_values | — | — |
| AreaChart | — | — | cumulative, stacked | — | — |
| PieChart | — | — | distribution_pct | — | — |
| HeatMap | — | — | density_grid | — | — |
| TrendGraph | — | — | trend_line, confidence_band | — | — |
| DrillDownLink | — | — | drill_query | — | — |
| AnalyticsFilterBar | — | date_range, filters | active_filter_count | — | date range required |
| DateRangeNavigator | — | period | preset_buttons | — | — |
| ComparePeriodsForm | — | compare_to | comparison_metrics | — | — |
| ReportBuilderCanvas | analytics_reports_v2: query_definition, visual_config | all builder fields | preview | — | at least one metric |
| ChartConfigPanel | analytics_reports_v2: visual_config | chart_type, axes, colors | — | — | — |
| GenerateReportForm | analytics_reports_v2: report_name, report_type, query_definition | report fields | — | — | name required |
| ExportReportForm | analytics_reports_v2: id | format, schedule | — | — | format required |
| ScheduleReportForm | analytics_schedules_v2: frequency, time_of_day, recipients, format | schedule fields | next_run | analytics_reports_v2 | recipients required |
| ScheduledReportCard | analytics_schedules_v2: frequency, next_run_at, format | — | is_active, runs_in | analytics_reports_v2 | — |
| ScheduleConfirmationDialog | analytics_schedules_v2: id | — | — | analytics_reports_v2 | — |
| ExportConfirmationDialog | analytics_reports_v2: id | format | estimated_size | — | — |
| ExportHistoryTable | — | — | export_list | — | — |
| DataExportButton | analytics_reports_v2: id | format | — | — | — |
| DataFreshnessIndicator | analytics_reports_v2: updated_at | — | freshness_label, needs_refresh | — | — |
| CustomerMetricsTable | customers_v2, feedback_v2, accounts_v2 | — | aggregated_metrics | — | — |
| KpiReportTable | analytics_reports_v2 | — | report_data | — | — |
| SLAReportsTable | tickets_v2 | — | sla_metrics | — | — |
| HistoricalMetricsTable | tickets_v2, appointments_v2 | — | period_comparison | — | — |
| TechnicianRankingsTable | technicians_v2, work_orders_v2, feedback_v2 | — | rank_score | — | — |
| Leaderboard | technicians_v2 | — | ranked_list | work_orders_v2 | — |
| DeleteReportDialog | analytics_reports_v2: id | — | — | analytics_schedules_v2 | confirmation required |
| FilterAnalyticsForm | — | filter criteria | — | — | — |

## 9. admin-center_v2 Components

| Component | Bound Fields | Editable | Computed | Relationships | Validation |
|-----------|-------------|:--------:|:--------:|:-------------:|:----------:|
| UserForm | users_v2: first_name, last_name, email, role_id, user_status | all user fields | full_name | user_roles_v2 | email required, valid role |
| UserTable | users_v2: id, email, first_name, last_name, role_id, user_status, last_login_at | — | full_name, role_name, days_since_login | user_roles_v2 | — |
| PermissionCheckboxTree | role_permissions_v2: resource, action_type, is_granted | is_granted | grouped_by_resource | user_roles_v2 | — |
| RolePermissionTree | role_permissions_v2: resource, action_type, is_granted | is_granted | tree_structure | user_roles_v2 | — |
| FeatureFlagToggle | feature_flags_v2: flag_name, is_enabled, rollout_percentage, targeting_rules | is_enabled, rollout_pct, rules | is_active | — | rollout 0-100 |
| ConfigEditor | system_settings_v2: setting_key, setting_value, setting_type | setting_value | parsed_value | — | type-appropriate |
| AuditLogTable | audit_log_v2: created_at, table_name, action_type, record_id, performed_by, changed_fields | — | time_ago | users_v2(performed_by) | — |
| SystemHealthCard | system_settings_v2, connectors_v2 | — | health_status, uptime_pct | — | — |
| MetricCard (Admin) | — | — | metric_value, change | — | — |
| ActiveSessionList | user_sessions_v2: user_id, ip_address, device_info, started_at, last_activity_at, is_active | — | session_duration, is_expired | users_v2 | — |
| AgentStatusBadge | — | — | status_color, last_active | — | — |
| ApplicationCard | connectors_v2 | — | health_indicator | — | — |
| ConnectorCard | connectors_v2: connector_name, connector_type, health_status, last_sync_at | is_enabled | is_healthy, sync_age | — | — |
| ErrorSeverityBadge | — | — | severity_color | — | — |
| EventVolumeChart | events_v2: event_type, created_at | — | volume_by_type, volume_over_time | — | — |
| FunctionStatusBadge | — | — | status_color | — | — |
| NotificationBell | notifications_v2 | — | unread_count | — | — |
| WorkflowStatusBadge | — | — | status_color | — | — |

---

> **End of COMPONENT_DATA_MAPPING.md**
