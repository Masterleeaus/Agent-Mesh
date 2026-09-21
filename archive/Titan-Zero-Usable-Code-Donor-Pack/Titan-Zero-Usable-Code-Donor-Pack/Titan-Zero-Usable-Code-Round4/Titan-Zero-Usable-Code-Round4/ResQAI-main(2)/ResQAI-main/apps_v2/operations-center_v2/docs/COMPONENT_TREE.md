# Component Tree

```
<AppProvider>
  <AppLayout>
    <Topbar>                                    (shared)
    <Sidebar>                                   (shared)
    <main>
      <Routes>
        <OperationsDashboardPage>
          <ActiveTicketsWidget>
          <ActiveTechniciansWidget>
          <PendingDispatchWidget>
          <HighPriorityQueueWidget>
          <OverdueJobsWidget>
          <CompletedTodayWidget>
          <LiveMetricsWidget>
          <RegionalStatusWidget>

        <DispatchQueuePage>
          <SearchBar>                           (shared)
          <ManualDispatchForm>
          <DispatchQueueTable>
          <DispatchConfirmationDialog>

        <LiveOperationsBoardPage>
          <LiveMetricsWidget>
          <RegionalStatusWidget>

        <AssignmentBoardPage>
          <SearchBar>                           (shared)
          <ReassignTechnicianForm>
          <AssignmentQueueTable>
          <ReassignmentConfirmationDialog>

        <TechnicianMonitoringPage>
          <TechnicianStatusTable>

        <PendingAssignmentsPage>
          <Card>                                (shared)
          <EmptyState>                          (shared)

        <EscalationQueuePage>
          <EscalateOperationForm>
          <EscalationListTable>
          <EscalationConfirmationDialog>

        <OperationsTimelinePage>
          <OperationsTimelineTable>

        <DailyOperationsPage>
          <Input>                               (shared)
          <Button>                              (shared)
          <DispatchQueueTable>

        <RegionalOperationsPage>
          <Button>                              (shared)
          <DispatchQueueTable>

        <CompletedOperationsPage>
          <CompletedOperationsTable>

        <OperationsReportsPage>
          <Card>                                (shared)
          <EmptyState>                          (shared)

        <SearchPage>
          <SearchBar>                           (shared)
          <DispatchQueueTable>

  <NotificationCenter>                          (shared)
```

## Shared Components Used
Button, Input, Dropdown, Card, Table, Dialog, Form, SearchBar, Filter, StatusBadge, ProgressIndicator, Loader, Skeleton, EmptyState, ErrorState, Notification, NotificationCenter, Sidebar, Topbar, Tabs, Pagination

## Shared Layouts Used
None (uses only AppLayout)

## State Management
- **AppContext** (React Context): Current user, active filters, selected operation IDs
- **Custom hooks** (useOperations, useTechnicians, useDispatchQueue, etc.): Data fetching with loading/error/data states
