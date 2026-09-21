# Navigation

## Route Map
| Route | Page Component | Description |
|---|---|---|
| `/` | ResolutionDashboardPage | Summary dashboard with metric widgets |
| `/dashboard` | ResolutionDashboardPage | Alias for dashboard |
| `/pending` | PendingResolutionsPage | Pending resolution reviews |
| `/disputes` | DisputeQueuePage | Active dispute queue |
| `/disputes/:id` | CaseDetailsPage | Detailed case view with tabs |
| `/cases/:id/evidence` | EvidenceReviewPage | Evidence review for a case |
| `/cases/:id/technician-report` | TechnicianReportReviewPage | Technician report review |
| `/cases/:id/complaint` | CustomerComplaintReviewPage | Customer complaint review |
| `/approvals` | ApprovalQueuePage | Resolution approval queue |
| `/escalations` | EscalationReviewPage | Escalated cases review |
| `/history` | ResolutionHistoryPage | Resolved and closed case history |
| `/closed` | ClosedCasesPage | Closed cases listing |
| `/knowledge-base` | KnowledgeBasePage | Knowledge base articles |
| `/reports` | ReportsPage | Reports and analytics |
| `/search` | SearchPage | Global search across cases/disputes/knowledge |

## Sidebar Structure
```
Resolution Center (brand)
├── Resolution Dashboard    (/)               - Metric summary
├── Pending Resolutions     (/pending)        - Pending resolution reviews
├── Dispute Queue           (/disputes)       - Active dispute cases
├── Approval Queue          (/approvals)      - Pending approvals
├── Escalations             (/escalations)    - Escalated cases
├── Resolution History      (/history)        - Historical records
├── Closed Cases            (/closed)         - Closed case archive
├── Knowledge Base          (/knowledge-base) - KB articles
├── Reports                 (/reports)        - Analytics & reporting
└── Search                  (/search)         - Global search
```

## Breadcrumb Patterns
- `Home > Dispute Queue > Case #case-001`
- `Home > Pending Resolutions`
- `Home > Approval Queue`
- `Home > Knowledge Base`

## Hash-based Routing
All routes use the `#` prefix for hash-based navigation (e.g., `#/disputes/case-001`). The `Routes` component listens for `hashchange` events and renders the matching page component.
