# customer-portal_v2 — Component Tree

## Full Component Hierarchy

```
<App>
  <AppProvider>
    <AppLayout>
      <CustomerSidebar>
        <Sidebar> x4 (Main, Services, Resources, Account)
      </CustomerSidebar>
      <Topbar>
        [Logo, NotificationsButton, HelpButton, UserAvatar]
      </Topbar>
      <main>
        <Routes>
          ─ <CustomerDashboardPage>
              <AccountSummaryCard>
                <ProgressIndicator>
                <StatusBadge>
              </AccountSummaryCard>
              <OpenTicketsWidget>
                <Card>
              </OpenTicketsWidget>
              <UpcomingAppointmentsWidget | CustomerSatisfactionWidget>
              <RecentActivityWidget>
                <Card>
              </RecentActivityWidget>
              <QuickActionsWidget>
                <Card>
              </QuickActionsWidget>

          ─ <MyTicketsPage>
              <SearchBar>
              <Filter>
              <Table>
              <StatusBadge>
              <Pagination>
              <EmptyState | ErrorState | Skeleton>

          ─ <CreateSupportRequestPage>
              <CreateTicketForm>
                <Card>
                <Form>
                <Input> x4
                <Dropdown> x2
                <Button>

          ─ <TicketDetailPage>
              <Button> (back)
              <Tabs>
              <StatusBadge>
              <Card>
              <TicketStatusTimeline>
                <Card>
              <UpdateTicketForm>
                <Form>
                <Input>
                <Button>
              <LoadingSkeleton>

          ─ <AppointmentsPage>
              <Filter>
              <Table>
              <StatusBadge>
              <Pagination>
              <EmptyState>

          ─ <AppointmentDetailPage>
              <StatusBadge>
              <Card>
              <Button> (reschedule, cancel)
              <RescheduleAppointmentForm> | <CancelAppointmentForm>

          ─ <BookAppointmentPage>
              <SelfServiceBooking> (multi-step wizard)

          ─ <AppointmentCalendarPage>
              <Card>
              <Button> (month nav)
              <EventList>

          ─ <TrackTechnicianPage>
              <Dropdown> (appointment selector)
              <Card>
              <StatusBadge>
              <TechnicianETAWidget>
              <LiveTracking>

          ─ <MessagesPage>
              <Table>
              <SearchBar>
              <Pagination>

          ─ <NotificationsPage>
              <Button> (Mark all read)
              <NotificationList>
              <Pagination>

          ─ <ServiceHistoryPage>
              <Table>
              <StatusBadge>
              <Pagination>

          ─ <InvoicesPage>
              <Table>
              <StatusBadge>
              <Pagination>

          ─ <InvoiceDetailPage>
              <Card> (summary)
              <Card> (line items)
              <Button> (Pay Now)
              <PaymentConfirmationDialog>

          ─ <PaymentsPage>
              <Table>
              <StatusBadge>
              <Pagination>

          ─ <FeedbackPage>
              <SubmitFeedbackForm>
                <Dropdown>
                <Rating>
                <Input>
                <Button>
              <FeedbackHistory>
              <FeedbackConfirmationDialog>

          ─ <KnowledgeBasePage>
              <SearchBar>
              <Card> x N (article cards)

          ─ <KnowledgeBaseArticlePage>
              <Card> (content)
              <Card> (helpful/not helpful)

          ─ <DownloadsPage>
              <Card> x N (download items)

          ─ <ProfilePage>
              <UpdateProfileForm>
              <NotificationPreferences>
              <Card> (security link)

          ─ <SettingsPage>
              <Card> x 4 (settings sections)

          ─ <SecurityPage>
              <Card> (password)
              <ChangePasswordForm>
              <Card> (2FA)
              <Card> (active sessions)

          ─ <HelpCenterPage>
              <SearchBar>
              <Card> x N (FAQ categories)
              <Card> (contact support CTA)

          ─ <DisputesPage>
              <Table>
              <StatusBadge>

          ─ <DisputeDetailPage>
              <DisputeStatusCard>
                <ProgressIndicator>
              <Card>
        </Routes>
      </main>
    </AppLayout>
  </AppProvider>
</App>
```

## Shared Components Used (from `@resqai/foundation`)

| Component          | Usage                                      |
|--------------------|--------------------------------------------|
| Card               | Every page (content containers)            |
| Button             | Actions, navigation                        |
| Input              | Forms (text, email, tel, password)         |
| Dropdown           | Select inputs (service type, category)    |
| Form               | Form layout wrapper                        |
| Table              | Data tables (tickets, appointments, etc.)  |
| StatusBadge        | Status indicators                          |
| Tabs               | Tab-based content switching                |
| Filter             | List filtering by attributes               |
| SearchBar          | Text search inputs                         |
| Pagination         | Page navigation for lists                  |
| Skeleton           | Loading placeholders                       |
| EmptyState         | Empty data states                          |
| ErrorState         | Error states with retry                    |
| Loader             | Spinner/loading indicator                  |
| ProgressIndicator  | Health score + progress                    |
| Sidebar            | Navigation sidebar                         |
| Topbar             | App header bar                             |
| Dialog             | Modal dialogs (base)                       |

## State Management Notes

- **CustomerDashboardPage** uses `useDashboard`, `useCustomerTickets`, `useCustomerSatisfaction`
- **TicketDetailPage** uses `useTicketDetail` + local state for message input
- **AppointmentDetailPage** uses `useAppointmentDetail` + local state for cancel/reschedule
- **Notification state** is managed in `useNotifications` hook with optimistic updates
- **Form state** is managed locally within each form component (useState)
- **Sidebar active state** is derived from `window.location.hash`
