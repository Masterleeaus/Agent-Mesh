# ResQAI V2 — Enterprise AI Agent Catalog

## Agent Index

### Existing Agents (6)

| # | Agent | ID | Status | Priority |
|---|---|---|---|---|
| 1 | request-classifier | `019efbc9-be4f-7643-b910-ea56fd4d3390` | Active | P0 |
| 2 | support-reply-drafter | `019efbc9-bf53-76ec-9603-bd32144e9e02` | Active | P0 |
| 3 | operations-coordinator | `019efbc9-be16-7243-95ec-1bf6e54169d3` | Active | P0 |
| 4 | resolution-advisor | `019efbc9-bf15-72cf-9b4c-c59593d631da` | Active | P0 |
| 5 | account-health-monitor | `019efd33-4653-7357-bc4e-df5f8b82c258` | Active | P0 |
| 6 | tech-suggester | — | Active | P0 |

### Future Agents (10)

| # | Agent | Status | Priority | Planned Phase |
|---|---|---|---|---|
| 7 | notification-assistant | Planned | P1 | Phase C |
| 8 | crm-assistant | Planned | P1 | Phase C |
| 9 | appointment-assistant | Planned | P1 | Phase C |
| 10 | analytics-assistant | Planned | P1 | Phase C |
| 11 | customer-support-assistant | Planned | P2 | Phase D |
| 12 | knowledge-assistant | Planned | P2 | Phase D |
| 13 | admin-assistant | Planned | P2 | Phase D |
| 14 | audit-assistant | Planned | P2 | Phase D |
| 15 | security-assistant | Planned | P3 | Phase E |
| 16 | forecast-assistant | Planned | P3 | Phase E |

---

## Agent Definitions

### 1. request-classifier

| Field | Value |
|---|---|
| **Purpose** | First-line triage agent that classifies inbound customer requests into request_type, urgency, and suggested owner |
| **Business Responsibility** | Ensure every incoming ticket is categorized before human review; route urgent/complaint tickets for priority handling |
| **Owned Domain** | Ticket classification — request_type, urgency, suggested_owner |
| **Input Contracts** | `{ ticket_id: string }` or `{ message: string, channel: string, customer_name: string, ticket_id: string }` |
| **Output Contracts** | `{ request_type, urgency, suggested_owner, classification_status, recommended_next_action, reasoning }` |
| **Consumed Events** | `ticket.created` (via workflow trigger) |
| **Produced Events** | `ticket.classified` |
| **Consumed Tables** | tickets (read), technicians (read) |
| **Referenced Tables** | tickets (write), technicians (read) |
| **Published Events** | `ticket.classified` — `{ ticketId, classifiedType, confidence }` |
| **Prompt Strategy** | Zero-shot classification with enumerated output types. Decision tree for urgency (safety keywords → high/urgent). |
| **Reasoning Strategy** | Rule-based pattern matching over message text + explicit priority rules (safety > complaint > inquiry) |
| **Confidence Strategy** | Self-assessed confidence derived from signal clarity. Ambiguous inputs or one-word messages produce confidence < 0.70. |
| **Fallback Strategy** | `classification_status: "unparseable"` when input is empty/unknown ticket_id. Workflow routes to intake FORM. |
| **Human Escalation Strategy** | `needs_human_review` when urgency is `urgent` OR complaint with very little signal (one-word subject). |
| **Safety Rules** | Never classify as non-urgent when safety keywords detected (sparking, flooding, no heat). Never fabricate technician names. |
| **Memory Strategy** | Ephemeral — no cross-session memory. Each invocation is stateless. |
| **Context Windows** | One ticket + technicians table. Max 1 ticket per invocation. |
| **Conversation Limits** | Single-turn classification. No conversation state. |
| **Caching** | Re-classify on same ticket overwrites previous values. No read cache. |
| **Retry Policy** | Max 3 retries with exponential backoff (1s, 2s, 4s). Fail after 3rd attempt. |
| **Timeouts** | 30s total execution timeout. 10s per table read. |
| **Observability** | Emits `agent:started`, `agent:completed`, `agent:failed` events. |
| **Logging** | `operations_log` row per run: `actor: "request-classifier"`, `action: "classification"`, `result: "<request_type>/<urgency>"` |
| **Audit Trail** | Classification overwrite history captured in `tickets` row versioning. |

### 2. support-reply-drafter

| Field | Value |
|---|---|
| **Purpose** | Drafts first customer-facing reply for classified tickets. Never sends — human approval required. |
| **Business Responsibility** | Produce high-quality, human-sounding draft replies that reduce human drafting time by 80%+ |
| **Owned Domain** | Reply drafting — draft_reply text, suggested_owner, draft_status |
| **Input Contracts** | `{ ticket_id: string, channel_hint?: string, override_technician?: string }` |
| **Output Contracts** | `{ draft_reply, suggested_owner, owner_rationale, draft_status, confidence, alternatives_considered }` |
| **Consumed Events** | `ticket.classified` (via workflow) |
| **Produced Events** | `ticket.reply.drafted` |
| **Consumed Tables** | tickets (read), technicians (read), customers (read) |
| **Referenced Tables** | tickets (write — draft_reply, suggested_owner, status) |
| **Published Events** | `ticket.reply.drafted` — `{ ticketId, replyBody }` |
| **Prompt Strategy** | Few-shot prompting with specific tone/length/style rules. Anti-pattern rules (never "Thank you for reaching out"). |
| **Reasoning Strategy** | Channel-aware tone selection. Skill → availability → rating technician matching. |
| **Confidence Strategy** | ≥ 0.85 when skill/availability/urgency match is unambiguous. < 0.70 when weak signal or no clear tech match. |
| **Fallback Strategy** | `draft_status: "needs_rewrite"` when ticket missing classification. `needs_human_call` when no available technician. |
| **Human Escalation Strategy** | `needs_human_call` → ops manager notified. All drafts require human approval before send. |
| **Safety Rules** | Never send messages (approved_to_send flag enforced by workflow, not agent). Never fabricate technician name. |
| **Memory Strategy** | Ephemeral — no conversation memory. Reads current ticket state only. |
| **Context Windows** | One ticket + technicians + customers match. Max context: ~4K tokens. |
| **Conversation Limits** | Single-turn draft. No multi-turn. |
| **Caching** | Idempotent — re-run overwrites draft. Only re-write when input changed. |
| **Retry Policy** | Max 3 retries with exponential backoff. Fail on connector timeout. |
| **Timeouts** | 45s total. 15s for connector reads (Gmail, Reddit). |
| **Observability** | Emits `agent:completed` with draft_status. |
| **Logging** | `operations_log` row per draft: `action: "draft created"`, `result: "<draft_status>"` |
| **Audit Trail** | All draft versions overwritten on same ticket. Version history in tickets table. |

### 3. operations-coordinator

| Field | Value |
|---|---|
| **Purpose** | Chief of staff for operations — reads full operational board, produces prioritized recommendations and tasks |
| **Business Responsibility** | Ensure operations team always has a prioritized, actionable list of next steps each morning |
| **Owned Domain** | Operational coordination — recommendations, task creation, coordination_status |
| **Input Contracts** | `{ scope?: "daily"|"weekly"|"urgent_only", today?: string, max_actions?: int, create_tasks?: bool }` |
| **Output Contracts** | `{ summary, recommendations[], tasks_created[], summary_counts, coordination_status }` |
| **Consumed Events** | `ticket.created`, `ticket.escalated`, `appointment.created`, `operation.created` |
| **Produced Events** | `operation.created` (via tasks) |
| **Consumed Tables** | tickets, appointments, technicians, customers, tasks, operations_log |
| **Referenced Tables** | tasks (write), operations_log (write) |
| **Published Events** | None directly — writes to tasks table, workflow picks up changes |
| **Prompt Strategy** | Decision tree reasoning with 6 priority tiers. Always emit ≤ 8 recommendations. |
| **Reasoning Strategy** | Multi-factor priority ranking: urgent safety → stuck customers → imminent appointments → slipping relationships → overdue tasks → capacity balancing |
| **Confidence Strategy** | Not applicable — output is deterministic prioritization of observed data. No confidence score needed for coordination status. |
| **Fallback Strategy** | `coordination_status: "unavailable_data"` if any required table returns no rows. |
| **Human Escalation Strategy** | `coordination_status: "crisis"` if urgent_count > 0 → Discord alert to ops channel. All recommendations are suggestions. |
| **Safety Rules** | Never mutate appointments, close tickets, or resolve disputes. Never send customer messages. |
| **Memory Strategy** | Ephemeral — reads full board fresh each run. No cross-run memory. |
| **Context Windows** | Full operational board: all open tickets + today's appointments + available technicians + open tasks. |
| **Conversation Limits** | Single-turn analysis. |
| **Caching** | Idempotent — only creates task rows when no open task with same title + target_id exists. |
| **Retry Policy** | Max 2 retries. Fail if any read returns error. |
| **Timeouts** | 60s total. 10s per table read (6 tables). |
| **Observability** | Emits `agent:completed` with coordination_status. Discord connector actions. |
| **Logging** | `operations_log` row per run: `action: "coordinator recommendations run"`, `result: "<counts + summary>"` |
| **Audit Trail** | Recommendations logged in operations_log. Tasks created in tasks table. |

### 4. resolution-advisor

| Field | Value |
|---|---|
| **Purpose** | Analyzes service disputes and recommends resolution from fixed enum |
| **Business Responsibility** | Produce fair, defensible resolution recommendations that reduce human analysis time and ensure consistent outcomes |
| **Owned Domain** | Dispute resolution — recommended_resolution, confidence, analysis_status |
| **Input Contracts** | `{ dispute_id: string, force_reanalysis?: boolean }` |
| **Output Contracts** | `{ analysis_status, recommended_resolution, resolution_reason, confidence, reasoning, alternative_resolutions[], next_steps[], requires_human_call? }` |
| **Consumed Events** | `resolution.case.created` (via workflow) |
| **Produced Events** | None directly — writes to disputes table |
| **Consumed Tables** | disputes, tickets, appointments, customers, operations_log |
| **Referenced Tables** | disputes (write), operations_log (write) |
| **Published Events** | `resolution.resolution.created` (via workflow after human approval) |
| **Prompt Strategy** | Evidence-weighing prompt with fixed resolution enum. Quotable prose requirement. |
| **Reasoning Strategy** | Read both sides → weigh evidence against 6 options → consider defaults → produce quotable reason |
| **Confidence Strategy** | ≥ 0.85: unambiguous evidence. 0.60–0.84: best fit but debatable. < 0.60: lean toward escalate_legal. |
| **Fallback Strategy** | `insufficient_evidence` if both sides vague. `blocked` if dispute_id unknown or already finalized. |
| **Human Escalation Strategy** | `safety_escalation` for property damage/health hazard → immediate ops manager. `legal_escalation` for >$5k or misconduct → legal counsel. `requires_human_call` if confidence < 0.60. |
| **Safety Rules** | Never set dispute to `approved` or `closed`. Only set to `recommendation_ready`. Never produce resolution for already-finalized disputes. |
| **Memory Strategy** | Ephemeral — reads evidence fresh each analysis. |
| **Context Windows** | One dispute + linked ticket + linked appointment + customer history. Max context: ~6K tokens. |
| **Conversation Limits** | Single-turn analysis. Idempotent re-run guarded by force_reanalysis flag. |
| **Caching** | Skip re-analysis if already `recommendation_ready` and force_reanalysis is false. |
| **Retry Policy** | Max 3 retries. Fail on connector error. |
| **Timeouts** | 45s total. |
| **Observability** | Emits `agent:completed` with analysis_status. |
| **Logging** | `operations_log` row per analysis: `actor: "resolution-advisor"`, `action: "dispute analysis"`, `result: "<resolution> (conf <score>)"` |
| **Audit Trail** | Analysis history in disputes table. Operations_log captures every analysis run. |

### 5. account-health-monitor

| Field | Value |
|---|---|
| **Purpose** | CRM health lead — reads CRM signal, calls deterministic helpers, emits prioritized action set |
| **Business Responsibility** | Prevent customer churn by identifying at-risk accounts and surfacing actionable next-touch recommendations |
| **Owned Domain** | Account health monitoring — health scans, follow-up detection, win-back identification |
| **Input Contracts** | `{ today?: string, days_ahead?: int, lookback_days?: int, focus_account_id?: string, max_recommendations?: int, create_followup_tasks?: bool }` |
| **Output Contracts** | `{ summary, scan, recommendations[], tasks_created[], critical_count, slipping_count, overdue_count, coordination_status }` |
| **Consumed Events** | `account.health.changed`, `followup.slippage.detected` |
| **Produced Events** | `account.health.scan.completed`, `followup.slippage.detected` (via helpers) |
| **Consumed Tables** | accounts, followups, customers, appointments, disputes, tasks |
| **Referenced Tables** | accounts (write — via account_health_scan function), followups (write — via flag_slipping_followups function), tasks (write), operations_log (write) |
| **Published Events** | `account.health.scan.completed` — `{ scanId, accountsScanned, criticalCount }` |
| **Prompt Strategy** | Deterministic function-first: call helpers before reasoning. Then apply priority ordering. |
| **Reasoning Strategy** | 6-tier priority: critical accounts → slipping follow-ups → at-risk no-touch → dormant win-back → workload balance → no-action guard |
| **Confidence Strategy** | Not applicable — recommendation priority is rule-based. Confidence derived from function output quality. |
| **Fallback Strategy** | `no_action_needed` if all accounts healthy. Still emit ≥1 `no_action` recommendation to keep queue in sync. |
| **Human Escalation Strategy** | `coordination_status: "crisis"` if critical_count > 0 → Discord alert. All recommendations are suggestions. |
| **Safety Rules** | Never send customer messages. Never resolve disputes. Never mutate appointments. |
| **Memory Strategy** | Ephemeral — reads fresh state each run. No cross-run memory. |
| **Context Windows** | All accounts + followups + linked appointments/disputes. |
| **Conversation Limits** | Single-turn analysis. |
| **Caching** | Idempotent — only creates task rows for new recommendation titles. |
| **Retry Policy** | Max 2 retries on function calls. |
| **Timeouts** | 90s total (includes two function calls). |
| **Observability** | Emits `agent:completed` with coordination_status. Discord connector actions. |
| **Logging** | `operations_log` row per run: `action: "account_health_monitor run"`. |
| **Audit Trail** | Health scans in account_health_scans_v2 table. Tasks created in tasks_v2 table. |

### 6. tech-suggester

| Field | Value |
|---|---|
| **Purpose** | Suggests best technician for a service ticket based on skill match, workload, and availability |
| **Business Responsibility** | Ensure optimal technician assignment by scoring candidates on skill/availability/load/rating |
| **Owned Domain** | Technician suggestion — scored candidate ranking, no_available_tech detection |
| **Input Contracts** | `{ ticket_id: string, force_resuggest?: boolean }` |
| **Output Contracts** | `{ suggested_technician_id, suggested_technician_name, alternatives[], assignment_rationale, confidence, suggestion_status, requires_human_review? }` |
| **Consumed Events** | `ticket.classified` (via workflow) |
| **Produced Events** | None — writes suggestion to workflow context |
| **Consumed Tables** | tickets (read), technicians (read), schedules (read) |
| **Referenced Tables** | None directly — output is returned to workflow, not written to table |
| **Published Events** | None — output consumed by workflow DECISION node |
| **Prompt Strategy** | Scoring algorithm: prune → score (+3/+2/+1) → rank → tiebreak. |
| **Reasoning Strategy** | Deterministic scoring: exact skill match (+3), light load (+2), high rating (+1), no conflict (+1). |
| **Confidence Strategy** | ≥ 0.85: clear skill + availability match, light load. 0.60–0.84: matches skill but moderate load. < 0.60: weak match. |
| **Fallback Strategy** | `no_match` if no technician passes pruning. `blocked` if unknown ticket_id or closed ticket. |
| **Human Escalation Strategy** | `requires_human_review: true` when confidence < 0.60 or urgent ticket with no highly-rated tech available. |
| **Safety Rules** | Never dispatch or assign. Never send messages. Never fabricate technician data. |
| **Memory Strategy** | Ephemeral — reads ticket + technicians + schedules fresh each invocation. |
| **Context Windows** | One ticket + all technicians + schedules for relevant window. |
| **Conversation Limits** | Single-turn suggestion. |
| **Caching** | Idempotent — skip re-suggestion if already_assigned and force_resuggest is false. |
| **Retry Policy** | Max 3 retries. |
| **Timeouts** | 30s total. |
| **Observability** | Emits `agent:completed` with suggestion_status. |
| **Logging** | No operations_log write — output returned to workflow. |
| **Audit Trail** | Suggestion history tracked through workflow instance data. |

---

## Future Agent Definitions

### 7. notification-assistant

| Field | Value |
|---|---|
| **Purpose** | Intelligent notification routing and personalization across channels |
| **Business Responsibility** | Ensure notifications reach the right person via the right channel at the right time |
| **Owned Domain** | Notification orchestration — routing, timing, channel selection, template selection |
| **Input Contracts** | `{ notification_type: string, payload: object, target: object, priority?: string }` |
| **Output Contracts** | `{ channel: string, rendered_content: string, scheduled_time: string, delivery_status: string }` |
| **Consumed Events** | All domain events that require notification |
| **Produced Events** | `notification.dispatched` |
| **Consumed Tables** | notification_templates_v2, notification_channels_v2, users_v2, user_preferences |
| **Referenced Tables** | notifications_v2 (write) |
| **Published Events** | `notification.dispatched` |
| **Prompt Strategy** | Channel-aware template selection with personalization |
| **Human Escalation Strategy** | Escalate to admin-assistant if notification delivery fails persistently |

### 8. crm-assistant

| Field | Value |
|---|---|
| **Purpose** | Customer relationship analysis, interaction summarization, sentiment tracking |
| **Business Responsibility** | Maintain relationship health by surfacing key interaction insights |
| **Owned Domain** | Customer relationship intelligence — sentiment, interaction patterns, relationship scoring |
| **Input Contracts** | `{ account_id?: string, customer_id?: string, scope?: string }` |
| **Output Contracts** | `{ relationship_summary, sentiment_trend, key_events[], recommended_actions[] }` |
| **Consumed Events** | `customer.updated`, `interaction.logged`, `feedback.submitted` |
| **Produced Events** | `crm.insight.ready` |
| **Consumed Tables** | accounts_v2, customers_v2, feedback_v2, interactions |
| **Human Escalation Strategy** | Escalate to human CRM manager when sentiment drops below threshold |

### 9. appointment-assistant

| Field | Value |
|---|---|
| **Purpose** | Appointment scheduling optimization, conflict detection, route optimization |
| **Business Responsibility** | Maximize schedule efficiency while respecting technician load and customer preferences |
| **Owned Domain** | Appointment intelligence — scheduling suggestions, conflict resolution, route planning |
| **Input Contracts** | `{ appointment_id?: string, technician_id?: string, date_window?: object }` |
| **Output Contracts** | `{ suggested_slots[], conflicts_detected[], optimization_suggestions[] }` |

### 10. analytics-assistant

| Field | Value |
|---|---|
| **Purpose** | Natural language query interface for analytics data, automatic insight generation |
| **Business Responsibility** | Make data accessible to non-technical users through natural language |
| **Owned Domain** | Analytics intelligence — NL queries, insight generation, report interpretation |
| **Input Contracts** | `{ query: string, domain?: string, date_range?: object }` |
| **Output Contracts** | `{ interpreted_query, results_summary, visualization_type, insights[] }` |

### 11. customer-support-assistant

| Field | Value |
|---|---|
| **Purpose** | Customer-facing conversational support for common inquiries |
| **Business Responsibility** | Handle tier-1 customer inquiries autonomously with human handoff for complex issues |
| **Owned Domain** | Customer self-service — FAQ answering, ticket status, basic troubleshooting |
| **Input Contracts** | `{ customer_id: string, message: string, conversation_id?: string }` |
| **Output Contracts** | `{ reply: string, requires_human: boolean, confidence: number, suggested_actions[] }` |

### 12. knowledge-assistant

| Field | Value |
|---|---|
| **Purpose** | Knowledge base article authoring, search enhancement, content quality |
| **Business Responsibility** | Maintain and improve knowledge base quality and discoverability |
| **Owned Domain** | Knowledge management — article generation, search optimization, content gap analysis |
| **Input Contracts** | `{ action: "search"|"summarize"|"suggest"|"author", query?: string, context?: object }` |
| **Output Contracts** | `{ articles[], gap_analysis?, suggested_article?, search_improvements[] }` |

### 13. admin-assistant

| Field | Value |
|---|---|
| **Purpose** | Platform administration automation — user management, settings, system status |
| **Business Responsibility** | Reduce administrative overhead through natural language admin commands |
| **Owned Domain** | Administrative intelligence — user management, system configuration, health monitoring |
| **Input Contracts** | `{ command: string, resource_type: string, action: string, parameters?: object }` |
| **Output Contracts** | `{ action_result: string, affected_resources[], warnings[], next_steps[] }` |

### 14. audit-assistant

| Field | Value |
|---|---|
| **Purpose** | Audit log analysis, compliance monitoring, anomaly detection in system events |
| **Business Responsibility** | Ensure platform compliance and detect suspicious patterns |
| **Owned Domain** | Audit intelligence — log analysis, compliance checks, pattern detection |
| **Input Contracts** | `{ query: object, date_range?: object, compliance_framework?: string }` |
| **Output Contracts** | `{ findings[], compliance_status, anomalies[], recommendations[] }` |

### 15. security-assistant

| Field | Value |
|---|---|
| **Purpose** | Security threat detection, access pattern analysis, incident response |
| **Business Responsibility** | Protect platform from unauthorized access and data breaches |
| **Owned Domain** | Security intelligence — threat detection, access review, incident analysis |
| **Input Contracts** | `{ alert_type?: string, user_id?: string, session_id?: string, time_range?: object }` |
| **Output Contracts** | `{ risk_level: string, findings[], blocked_actions[], recommendations[] }` |

### 16. forecast-assistant

| Field | Value |
|---|---|
| **Purpose** | Predictive analytics — demand forecasting, resource planning, trend prediction |
| **Business Responsibility** | Enable proactive resource allocation through accurate demand prediction |
| **Owned Domain** | Forecasting intelligence — demand prediction, resource planning, trend analysis |
| **Input Contracts** | `{ metric: string, horizon: string, granularity?: string, filters?: object }` |
| **Output Contracts** | `{ forecast_data[], confidence_intervals, seasonal_patterns[], recommendations[] }` |
