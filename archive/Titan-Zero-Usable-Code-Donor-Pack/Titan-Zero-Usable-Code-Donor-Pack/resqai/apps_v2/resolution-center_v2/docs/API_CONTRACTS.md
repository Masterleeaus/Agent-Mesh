# API Contracts

## Base Types

### Case Types
```typescript
type CaseType = 'dispute' | 'complaint' | 'technician_report' | 'evidence_review' | 'escalation';
type CaseStatus = 'pending_review' | 'in_review' | 'evidence_gathering' | 'pending_approval' | 'resolved' | 'closed' | 'escalated';
type Priority = 'low' | 'normal' | 'high' | 'critical';
```

### Dispute Types
```typescript
type DisputeReason = 'billing' | 'service_quality' | 'damage' | 'no_show' | 'incomplete_work' | 'other';
type DisputeStatus = 'open' | 'investigating' | 'pending_resolution' | 'resolved' | 'escalated';
```

### Resolution Types
```typescript
type ResolutionType = 'full_refund' | 'partial_refund' | 'rework' | 'credit' | 'apology' | 'other';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';
type EscalationStatus = 'pending_review' | 'under_review' | 'resolved' | 'dismissed';
```

## Core DTOs

| DTO | Key Fields |
|---|---|
| CaseDTO | id, type, status, priority, customerId, customerName, technicianId, summary, description |
| DisputeDTO | id, caseId, reason, description, status, priority, amount |
| ResolutionDTO | id, caseId, type, status, createdBy, resolution, amount |
| EvidenceDTO | id, caseId, type, title, description, url, uploadedBy |
| EscalationDTO | id, caseId, reason, status, escalatedBy, escalatedTo |
| ApprovalDTO | id, caseId, type, status, requestedBy, approvedBy, comments |
| TechnicianReportDTO | id, caseId, technicianId, summary, findings, actionsTaken, partsUsed |
| CustomerComplaintDTO | id, caseId, customerId, subject, description, desiredOutcome |
| KnowledgeBaseDTO | id, title, content, category, tags |

## API Requests

| Request | Key Fields |
|---|---|
| CaseListFilters | type[], status[], priority[], search, page, pageSize |
| DisputeListFilters | reason[], status[], priority[], search, page, pageSize |
| CreateResolutionRequest | caseId, type, resolution, notes?, amount? |
| ApproveResolutionRequest | resolutionId, comments? |
| RejectResolutionRequest | resolutionId, reason, comments? |
| EscalateCaseRequest | caseId, reason, escalateTo, notes? |
| CloseCaseRequest | caseId, resolution, notes? |
| CreateEvidenceRequest | caseId, type, title, description, url |
| SearchRequest | query, types?, page, pageSize |
| KnowledgeBaseFilters | category?, tags?, search?, page, pageSize |

## API Responses

| Response | Data Shape |
|---|---|
| CaseListResponse | { data: CaseDTO[], total, page, pageSize } |
| CaseDetailResponse | { case, dispute?, resolution?, evidence[], escalations[], approvals[], technicianReport?, customerComplaint?, timeline[] } |
| DisputeListResponse | { data: DisputeDTO[], total, page, pageSize } |
| DashboardResponse | { totalPending, totalDisputes, pendingApprovals, highPriorityCases, slaCompliancePercent, averageResolutionTimeHours, recentlyClosedCount, pendingReviews } |
| SearchResponse | { cases: CaseDTO[], disputes: DisputeDTO[], knowledge: KnowledgeBaseDTO[], total } |
| ApiError | { code, message, details? } |

## Permission Constants

All permissions follow the pattern `resolution:<action>`:
- `resolution:view_dashboard`, `resolution:view_pending`, `resolution:view_disputes`, `resolution:view_cases`
- `resolution:view_evidence`, `resolution:view_technician_reports`, `resolution:view_complaints`
- `resolution:view_approvals`, `resolution:view_escalations`, `resolution:view_history`, `resolution:view_closed`
- `resolution:view_knowledge_base`, `resolution:view_reports`, `resolution:view_search`
- `resolution:create_resolution`, `resolution:approve_resolution`, `resolution:reject_resolution`
- `resolution:escalate_case`, `resolution:close_case`, `resolution:request_info`, `resolution:manage_knowledge_base`

## Event Contracts

Events follow the pattern `resolution.<entity>.<action>`:
- `resolution.case.created`, `resolution.case.status.changed`, `resolution.case.closed`
- `resolution.dispute.created`, `resolution.dispute.resolved`
- `resolution.resolution.created`, `resolution.resolution.approved`, `resolution.resolution.rejected`
- `resolution.escalation.created`, `resolution.escalation.resolved`
- `resolution.approval.created`, `resolution.approval.granted`, `resolution.approval.denied`
- `resolution.evidence.uploaded`
