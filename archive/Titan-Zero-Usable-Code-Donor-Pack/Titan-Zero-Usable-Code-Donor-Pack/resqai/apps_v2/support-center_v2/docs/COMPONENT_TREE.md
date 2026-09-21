# Component Tree

```
<AppProvider>
  <AppLayout>
    <Topbar>                                    (shared)
    <Sidebar>                                   (shared)
    <main>
      <Routes>
        <TicketQueuePage>
          <BulkActionBar>
          <SearchBar>                           (shared)
          <Filter>                              (shared)
          <TicketList>
            <Table> / Kanban view              (shared)
            <Skeleton>                          (shared)
            <EmptyState>                        (shared)
            <ErrorState>                        (shared)
          <Pagination>                          (shared)

        <TicketDetailPage ticketId>
          <DetailLayout>                        (shared)
          <TicketDetailPanel>
            <ClassificationBadges>
            <EscalationBanner>
            <StatusBadge>                       (shared)
          <Tabs>                                (shared)
          <MessageThread>
          <ReplyEditor>
          <TicketHistoryTimeline>
          <AIReplySuggestion>

        <NewTicketPage>
          <Form>                                (shared)
          <Input>                               (shared)
          <Dropdown>                            (shared)

        <MyTicketsPage>
          <TicketList>

        <EscalationsPage>
          <Table>                               (shared)
          <StatusBadge>                         (shared)

        <SLADashboardPage>
          <Card>                                (shared)
          <ProgressIndicator>                   (shared)
          <Table>                               (shared)

        <TemplatesPage>
          <Table>                               (shared)
          <Dialog>                              (shared)

        <QueueSettingsPage>
          <Form>                                (shared)
          <Input>                               (shared)
          <Dropdown>                            (shared)
  <NotificationCenter>                          (shared)
```

## Shared Components Used
Button, Input, Dropdown, Card, Table, Dialog, Form, SearchBar, Filter, StatusBadge, ProgressIndicator, Loader, Skeleton, EmptyState, ErrorState, Notification, NotificationCenter, Sidebar, Topbar, Tabs, Pagination

## Shared Layouts Used
DetailLayout

## State Management
- **AppContext** (React Context): Current user, active filters, selected ticket IDs, view mode (table/kanban)
- **Custom hooks** (useTickets, useTicketDetail, etc.): Data fetching with loading/error/data states
