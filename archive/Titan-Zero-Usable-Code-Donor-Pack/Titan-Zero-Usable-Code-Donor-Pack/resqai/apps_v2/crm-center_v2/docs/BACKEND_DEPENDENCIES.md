# CRM Center v2 — Backend Dependencies

## Database Tables Required

| Table | Entity | Purpose |
|---|---|---|
| `accounts` | AccountDTO | Core account records with health scores |
| `customers` | CustomerDTO | Customer contact data and lifecycle status |
| `followups` | FollowupDTO | Follow-up items per account/customer |
| `interactions` | InteractionDTO | Communication history log |
| `notes` | NoteDTO | Account/customer notes |
| `tasks` | TaskDTO | CRM tasks with assignments |
| `feedback` | FeedbackDTO | Customer feedback records |
| `satisfaction` | SatisfactionDTO | Satisfaction survey responses |
| `opportunities` | OpportunityDTO | Renewal, upsell, cross-sell pipeline |
| `health_scans` | HealthScanDTO | Health scan run history |
| `risk_signals` | RiskSignalDTO | Detected risk signals per account |
| `operations_log` | OperationsLogEntry | Audit trail for all CRM actions |

## Functions Required

| Function | Purpose | Status |
|---|---|---|
| `account_health_scan` | Scans accounts, computes health scores | Already exists |
| `flag_slipping_followups` | Identifies overdue/due follow-ups | Already exists |
| `calculate_satisfaction_trends` | Aggregates satisfaction score trends | Not implemented |
| `identify_renewal_opportunities` | Identifies accounts due for renewal | Not implemented |
| `flag_upsell_candidates` | Scores accounts for upsell readiness | Not implemented |
| `compute_retention_metrics` | Computes churn risk and retention rates | Not implemented |
| `merge_customer_records` | Merges duplicate customer records | Not implemented |

## Agents Required

| Agent | Purpose | Status |
|---|---|---|
| `account-health-monitor` | CRM health lead — calls functions, creates tasks | Already exists |
| `renewal-opportunity-spotter` | Identifies renewal opportunities from account data | Not implemented |
| `upsell-recommender` | Recommends upsell/cross-sell opportunities | Not implemented |

## Workflows Required

| Workflow | Trigger | Purpose |
|---|---|---|
| `nightly_health_scan` | Schedule (nightly) | Run health scans on all accounts |
| `followup_slippage_alert` | Event (`followup.slippage.detected`) | Alert owner on overdue follow-ups |
| `retention_alert` | Event (`retention.alert`) | Notify team on at-risk accounts |
| `renewal_reminder` | Schedule (daily) | Remind of upcoming renewals |
| `feedback_acknowledgment` | Event (`feedback.recorded`) | Auto-acknowledge customer feedback |

## Events Consumed

| Event | Source | Purpose |
|---|---|---|
| `account.health.scan.completed` | Health scan function | Refresh dashboard after scan |
| `account.health.changed` | Health scan function | Update health badge in UI |
| `followup.created` | Create follow-up action | Add to follow-up queue |
| `followup.slippage.detected` | Slippage function | Show alert banner |
| `interaction.created` | Log interaction action | Update interaction history |
| `feedback.recorded` | Record feedback action | Refresh feedback list |
| `opportunity.created` | Create opportunity action | Update pipeline views |
| `customer.merged` | Merge function | Refresh customer data |

## Permissions Required

| Permission | Scope |
|---|---|
| `crm:view_dashboard` | Read-only dashboard access |
| `crm:view_accounts` | Read accounts list |
| `crm:manage_accounts` | CRUD accounts |
| `crm:view_customers` | Read customer directory |
| `crm:manage_customers` | CRUD customers, merge |
| `crm:manage_followups` | CRUD follow-ups |
| `crm:view_followups` | Read follow-ups |
| `crm:run_scans` | Trigger health scans |
| `crm:view_risks` | Read risk signals |
| `crm:view_interactions` | Read interaction history |
| `crm:log_interactions` | Create interactions |
| `crm:view_notes` | Read notes |
| `crm:manage_notes` | CRUD notes |
| `crm:view_tasks` | Read tasks |
| `crm:manage_tasks` | CRUD tasks |
| `crm:view_feedback` | Read feedback |
| `crm:record_feedback` | Create feedback |
| `crm:view_satisfaction` | Read satisfaction scores |
| `crm:view_opportunities` | Read opportunities |
| `crm:manage_opportunities` | CRUD opportunities |
| `crm:view_communications` | Read communication center |
| `crm:view_reports` | Read reports |
| `crm:search` | Global search |
| `crm:merge_customers` | Merge customer records |

Total: 24 permissions.
