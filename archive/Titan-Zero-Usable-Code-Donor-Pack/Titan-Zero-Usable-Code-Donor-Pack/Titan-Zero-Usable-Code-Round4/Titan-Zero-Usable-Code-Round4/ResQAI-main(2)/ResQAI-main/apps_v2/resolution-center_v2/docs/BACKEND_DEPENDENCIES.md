# Backend Dependencies

## Future Database Tables

The following database tables are expected to support the Resolution Center V2 application:

| Table | Purpose | Key Relationships |
|---|---|---|
| `resolution_cases` | Core case entity for disputes/complaints/escalations | FK to customers, technicians, appointments |
| `resolution_disputes` | Dispute records linked to cases | FK to resolution_cases |
| `resolution_resolutions` | Proposed and approved resolutions | FK to resolution_cases |
| `resolution_evidence` | Evidence items uploaded for cases | FK to resolution_cases |
| `resolution_escalations` | Escalation records | FK to resolution_cases |
| `resolution_approvals` | Approval workflow records | FK to resolution_cases |
| `resolution_technician_reports` | Technician work reports | FK to resolution_cases, technicians |
| `resolution_customer_complaints` | Customer complaint records | FK to resolution_cases, customers |
| `resolution_knowledge_base` | Knowledge base articles | Author FK to users |
| `resolution_timeline_events` | Case activity timeline | FK to resolution_cases |
| `resolution_notifications` | Notification records | FK to users, resolution_cases |

## Future Functions

| Function | Input | Output | Purpose |
|---|---|---|---|
| `create_case` | CaseDTO | CaseDTO | Create a new resolution case |
| `update_case_status` | caseId, status | CaseDTO | Update case status |
| `get_case_detail` | caseId | CaseDetailResponse | Get full case details |
| `list_cases` | filters | CaseListResponse | List/filter cases |
| `create_dispute` | DisputeDTO | DisputeDTO | Create a dispute record |
| `create_resolution` | CreateResolutionRequest | ResolutionDTO | Create resolution proposal |
| `approve_resolution` | resolutionId, approverId | ResolutionDTO | Approve a resolution |
| `reject_resolution` | resolutionId, reason | ResolutionDTO | Reject a resolution |
| `escalate_case` | caseId, reason, escalatorId | EscalationDTO | Escalate a case |
| `close_case` | caseId, resolution, closerId | CaseDTO | Close a resolved case |
| `upload_evidence` | CreateEvidenceRequest | EvidenceDTO | Upload evidence |
| `get_dashboard_metrics` | - | DashboardResponse | Get dashboard aggregations |
| `search_global` | query, filters | SearchResponse | Global search across entities |
| `list_knowledge_base` | filters | KnowledgeBaseListResponse | List/filter KB articles |

## Future Workflows

| Workflow | Trigger | Steps |
|---|---|---|
| **Dispute Resolution** | Case created with type=dispute | 1. Assign to specialist → 2. Gather evidence → 3. Create resolution → 4. Approval → 5. Close |
| **Escalation Handling** | Escalation created | 1. Notify manager → 2. Review case → 3. Approve resolution → 4. Follow-up |
| **Approval Chain** | Resolution created with amount > threshold | 1. Specialist approval → 2. Manager approval (if >$500) → 3. Director approval (if >$5000) |
| **SLA Monitoring** | Periodic timer | 1. Check pending cases → 2. Compare SLA deadline → 3. Alert if breached |
| **Auto-Close Stale** | Periodic timer | 1. Find resolved cases >7 days → 2. Send closure reminder → 3. Auto-close after 14 days |

## Future Agents

| Agent | Purpose |
|---|---|
| **ResolutionAgent** | AI-powered resolution recommendations based on case history and similar disputes |
| **EvidenceAnalysisAgent** | Analyze uploaded evidence for completeness and flag missing items |
| **SLAWatchdogAgent** | Monitor case SLAs and notify when approaching breach |
| **ApprovalRoutingAgent** | Route approvals to appropriate manager based on amount/type |
| **KnowledgeMiningAgent** | Extract resolution patterns and suggest knowledge base articles |
| **ReportGenerationAgent** | Generate periodic reports on resolution metrics and trends |

## Future Events

| Event | Trigger | Consumers |
|---|---|---|
| `resolution.case.created` | New case created | Notification system, Assignment workflow, Dashboard |
| `resolution.case.closed` | Case closed | Notification system, History archiving, Analytics |
| `resolution.dispute.created` | Dispute filed | Resolution assignment, SLA timer start |
| `resolution.resolution.created` | Resolution proposed | Approval workflow, Notification to approver |
| `resolution.resolution.approved` | Resolution approved | Case closure workflow, Refund processing |
| `resolution.resolution.rejected` | Resolution rejected | Specialist notification, Re-work workflow |
| `resolution.escalation.created` | Case escalated | Manager notification, Priority queue update |
| `resolution.approval.granted` | Approval given | Next approval step, Notification |
| `resolution.evidence.uploaded` | Evidence uploaded | Evidence analysis agent, Case status update |
