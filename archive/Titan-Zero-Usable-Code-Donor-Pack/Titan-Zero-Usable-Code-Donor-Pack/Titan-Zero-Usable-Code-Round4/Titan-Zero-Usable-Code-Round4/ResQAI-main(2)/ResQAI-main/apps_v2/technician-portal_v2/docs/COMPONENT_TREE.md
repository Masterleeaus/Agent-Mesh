# Component Tree

```
<AppProvider>
  <AppLayout>
    <Topbar>                                    (shared)
    <Sidebar>                                   (shared)
    <main>
      <Routes>
        <DashboardPage>
          <Card>                                (shared)
          <StatusBadge>                         (shared)
          <JobCard> (inline)
          <Skeleton>                            (shared)
          <EmptyState>                          (shared)
          <ErrorState>                          (shared)
          <Button>                              (shared)

        <TodayJobsPage>
          <SearchBar>                           (shared)
          <Filter>                              (shared)
          <Card>                                (shared)
          <StatusBadge>                         (shared)
          <Pagination>                          (shared)

        <AssignedJobsPage> / <UpcomingJobsPage> / <CompletedJobsPage> / <JobHistoryPage>
          <SearchBar>                           (shared)
          <Card>                                (shared)
          <StatusBadge>                         (shared)
          <Pagination>                          (shared)

        <JobDetailPage>
          <Tabs>                                (shared)
          <Card>                                (shared)
          <StatusBadge>                         (shared)
          <Button>                              (shared)
          <PermissionGuard>                     (custom)

        <JobChecklistPage>
          <Card>                                (shared)
          <ProgressIndicator>                   (shared via inline)
          <Checkbox input>                      (native)

        <ServiceNotesPage>
          <Card>                                (shared)
          <textarea>                            (native)

        <PhotoUploadPage> / <VideoUploadPage>
          <Card>                                (shared)
          <file input>                          (native)

        <SignatureCapturePage>
          <canvas>                              (native)
          <Card>                                (shared)

        <PartsUsedPage>
          <table>                               (native)
          <Card>                                (shared)

        <InventoryRequestPage>
          <Card>                                (shared)
          <form inputs>                         (native)

        <PauseJobPage> / <ResumeJobPage> / <EscalateJobPage> / <CompleteJobPage>
          <Card>                                (shared)
          <textarea>                            (native)

        <CustomerDetailsPage>
          <Card>                                (shared)
          <Button>                              (shared)

        <NavigationPage>
          <Card>                                (shared)
          <Button>                              (shared)

        <NotificationsPage>
          <Card>                                (shared)
          <Button>                              (shared)

        <MessagesPage>
          <Card>                                (shared)
          <Button>                              (shared)

        <TechnicianProfilePage>
          <Card>                                (shared)
          <Button>                              (shared)

        <SettingsPage>
          <Card>                                (shared)
          <Button>                              (shared)
          <Toggle switch>                       (native)
  <NotificationCenter>                          (shared)
```

## Shared Components Used
Button, Card, Tabs, StatusBadge, SearchBar, Filter, Pagination, Skeleton, EmptyState, ErrorState, Topbar, Sidebar, NotificationCenter

## Custom Components
PermissionGuard — Declarative permission guard for permission-aware UI

## Offline/Sync UI States
- Network indicator in Topbar (Online/Offline/Syncing)
- Sync warning on upload pages when offline
- GPS disabled indicator when location unavailable
- Pending sync count in AppContext state
