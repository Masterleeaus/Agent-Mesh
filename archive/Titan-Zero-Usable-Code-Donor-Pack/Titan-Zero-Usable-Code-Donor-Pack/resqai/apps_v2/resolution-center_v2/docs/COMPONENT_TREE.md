# Component Tree

```
<AppProvider>
  <AppLayout>
    <Topbar>                                    (shared)
    <Sidebar>                                   (shared)
    <main>
      <Routes>
        <ResolutionDashboardPage>
          <WidgetCard> x7                       (custom)
          <Skeleton>                             (shared)
          <EmptyState>                           (shared)
          <ErrorState>                           (shared)

        <PendingResolutionsPage>
          <SearchBar>                            (shared)
          <Filter>                               (shared)
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Pagination>                           (shared)
          <Skeleton>                             (shared)
          <EmptyState>                           (shared)
          <ErrorState>                           (shared)

        <DisputeQueuePage>
          <SearchBar>                            (shared)
          <Filter>                               (shared)
          <DisputeListTable>                     (custom)
          <Pagination>                           (shared)

        <CaseDetailsPage caseId>
          <StatusBadge>                          (shared)
          <Tabs>                                 (shared)
          <EvidenceViewer>                       (custom)
          <Timeline>                             (custom)
          <ResolutionForm>                       (custom)
          <Dialog> (Escalate, Close)            (shared)
          <Button>                               (shared)

        <EvidenceReviewPage caseId>
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Button>                               (shared)

        <TechnicianReportReviewPage caseId>
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Button> (Approve/Reject)             (shared)

        <CustomerComplaintReviewPage caseId>
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Button>                               (shared)

        <ApprovalQueuePage>
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Button> (Approve/Reject)             (shared)
          <Pagination>                           (shared)

        <EscalationReviewPage>
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Pagination>                           (shared)

        <ResolutionHistoryPage>
          <SearchBar>                            (shared)
          <Filter>                               (shared)
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Pagination>                           (shared)

        <ClosedCasesPage>
          <SearchBar>                            (shared)
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Pagination>                           (shared)

        <KnowledgeBasePage>
          <SearchBar>                            (shared)
          <Filter>                               (shared)
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
          <Pagination>                           (shared)

        <ReportsPage>
          <WidgetCard> x4                        (custom)
          <Card> (breakdown tables)             (shared)
          <StatusBadge>                          (shared)

        <SearchPage>
          <SearchBar>                            (shared)
          <Card>                                 (shared)
          <StatusBadge>                          (shared)
  <NotificationCenter>                           (shared)
```

## Shared Components Used
Button, Input, Dropdown, Card, Table, Dialog, Form, SearchBar, Filter, StatusBadge, ProgressIndicator, Loader, Skeleton, EmptyState, ErrorState, Notification, NotificationCenter, Sidebar, Topbar, Tabs, Pagination

## Custom Components (in src/components/)
| Component | Purpose |
|---|---|
| PermissionGuard | Permission-based rendering guard |
| CaseListTable | Reusable case list table with loading/empty/error states |
| DisputeListTable | Reusable dispute list table |
| EvidenceViewer | Evidence display panel |
| Timeline | Event timeline display |
| WidgetCard | Dashboard metric widget card |
| ResolutionForm | Resolution creation form |

## Widget Components (in widgets/)
| Component | Purpose |
|---|---|
| PendingReviews | Pending review count widget |
| Disputes | Active disputes count widget |
| ApprovalQueue | Pending approvals count widget |
| HighPriorityCases | High priority cases count widget |
| ResolutionSLA | SLA compliance percentage widget |
| AverageResolutionTime | Average resolution time widget |
| RecentlyClosedCases | Recently closed cases count widget |

## State Management
- **AppContext** (React Context): Current user, active filters, selected case IDs, view mode
- **Custom hooks**: useCases, useCaseDetail, useDisputes, useDashboard, useResolutions, useApprovals, useEscalations, useEvidence, useSearch, useKnowledgeBase
