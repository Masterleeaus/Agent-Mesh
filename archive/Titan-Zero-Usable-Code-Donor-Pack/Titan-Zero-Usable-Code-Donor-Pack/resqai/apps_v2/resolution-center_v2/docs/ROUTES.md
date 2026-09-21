# Routes

## Route Definitions

All routes are defined in `src/routes/index.tsx` using hash-based routing.

| Hash Route | Page Component | Route Pattern | Params |
|---|---|---|---|
| `#/` | ResolutionDashboardPage | exact | - |
| `#/dashboard` | ResolutionDashboardPage | exact | - |
| `#/pending` | PendingResolutionsPage | exact | - |
| `#/disputes` | DisputeQueuePage | exact | - |
| `#/disputes/:id` | CaseDetailsPage | param | `id` |
| `#/cases/:id/evidence` | EvidenceReviewPage | param | `id` |
| `#/cases/:id/technician-report` | TechnicianReportReviewPage | param | `id` |
| `#/cases/:id/complaint` | CustomerComplaintReviewPage | param | `id` |
| `#/approvals` | ApprovalQueuePage | exact | - |
| `#/escalations` | EscalationReviewPage | exact | - |
| `#/history` | ResolutionHistoryPage | exact | - |
| `#/closed` | ClosedCasesPage | exact | - |
| `#/knowledge-base` | KnowledgeBasePage | exact | - |
| `#/reports` | ReportsPage | exact | - |
| `#/search` | SearchPage | exact | - |

## Navigation Helpers

```typescript
// Navigate to case detail
window.location.hash = '#/disputes/case-001';
// Navigate to evidence review
window.location.hash = '#/cases/case-001/evidence';
// Navigate to approval queue
window.location.hash = '#/approvals';
```

## Default Route
The default route (`#/`) renders the ResolutionDashboardPage. Any unrecognized route also falls back to the dashboard.

## Route Parser Logic
The `parseHash()` function in `src/routes/index.tsx` splits the hash by `/`, filters empty segments, and matches against known patterns. Parameterized routes (e.g., `disputes/:id`) are identified by segment length and position.
