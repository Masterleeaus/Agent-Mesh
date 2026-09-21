# customer-portal_v2 — Architecture

## Purpose

The Customer Portal V2 is the only customer-facing interface of ResQAI V2. It provides enterprise-grade self-service capabilities including support request management, appointment scheduling, technician tracking, billing, and account management.

## Tech Stack

| Component          | Technology                     |
|--------------------|--------------------------------|
| Framework          | React 18                       |
| Language           | TypeScript (strict)            |
| Build Tool         | Vite 5+                        |
| Styling            | Inline CSS + CSS custom properties |
| Routing            | Custom hash-based routing      |
| State Management   | React Context                  |
| Shared UI Library  | `@resqai/foundation` (../../../shared/src) |
| Testing            | Vitest (jsdom)                 |
| Auth/SDK           | lemma-sdk                      |

## Folder Structure

```
customer-portal_v2/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .env.example
  docs/
    ARCHITECTURE.md
    NAVIGATION.md
    COMPONENT_TREE.md
    ROUTES.md
    STATE.md
    API_CONTRACTS.md
    BACKEND_DEPENDENCIES.md
  src/
    App.tsx              — Root shell (theme provider, context wrapper)
    main.tsx             — Entry point (Lemma SDK init, ProtectedApp)
    vite-env.d.ts
    routes/
      index.tsx          — Hash-based route switch (30+ routes)
      useNavigate.ts     — Navigation helper
    layouts/
      AppLayout.tsx      — Responsive app shell (sidebar + topbar + main)
    state/
      AppContext.tsx     — React Context (customer ID, filters, notifications)
    models/
      dto.ts             — 30+ DTOs (Ticket, Appointment, Invoice, etc.)
      view-models.ts     — 20+ UI view models
      api-requests.ts    — 15+ request types
      api-responses.ts   — 20+ response types
      index.ts
    contracts/
      events.ts          — 12 domain events with typed payloads
      permissions.ts     — 26 permission constants
      index.ts
    services/
      customer-service.ts — Mock API service (50+ methods)
    hooks/
      useDashboard.ts
      useCustomerTickets.ts
      useTicketDetail.ts
      useCustomerAppointments.ts
      useAppointmentDetail.ts
      useAvailableSlots.ts
      useCustomerDisputes.ts
      useDisputeDetail.ts
      useCustomerProfile.ts
      useAccountHealth.ts
      useInvoices.ts
      useInvoiceDetail.ts
      usePayments.ts
      useMessages.ts
      useTicketMessages.ts
      useNotifications.ts
      useFeedback.ts
      useKnowledgeBaseSearch.ts
      useKnowledgeBaseArticle.ts
      useDownloads.ts
      useServiceHistory.ts
      useTechnicianTracking.ts
      useLiveTechnicianStatus.ts
      useSecuritySettings.ts
      useHelpCenter.ts
      useCustomerSatisfaction.ts
      useAppointmentCalendar.ts
      index.ts
    components/
      index.ts
      CustomerSidebar.tsx   — Sidebar navigation (sections, mobile overlay)
      AccountSummaryCard.tsx
      AppointmentCalendar.tsx
      AppointmentCard.tsx
      DisputeStatusCard.tsx
      NotificationPreferences.tsx
      ProfileEditor.tsx
      QuickTicketForm.tsx
      SelfServiceBooking.tsx
      ServiceHistoryList.tsx
      TicketStatusTimeline.tsx
      widgets/
        OpenTicketsWidget.tsx
        UpcomingAppointmentsWidget.tsx
        RecentActivityWidget.tsx
        TechnicianETAWidget.tsx
        NotificationsWidget.tsx
        CustomerSatisfactionWidget.tsx
        QuickActionsWidget.tsx
      forms/
        CreateTicketForm.tsx
        UpdateTicketForm.tsx
        RescheduleAppointmentForm.tsx
        CancelAppointmentForm.tsx
        SubmitFeedbackForm.tsx
        UpdateProfileForm.tsx
        ChangePasswordForm.tsx
      dialogs/
        AppointmentConfirmationDialog.tsx
        CancellationConfirmationDialog.tsx
        PaymentConfirmationDialog.tsx
        FeedbackConfirmationDialog.tsx
      states/
        OfflineState.tsx
        PermissionDeniedState.tsx
        ValidationErrorsState.tsx
        NoServiceHistoryState.tsx
    pages/
      index.ts
      CustomerDashboardPage.tsx
      HomeDashboardPage.tsx (legacy)
      MyTicketsPage.tsx
      NewTicketPage.tsx (legacy)
      CreateSupportRequestPage.tsx
      TicketDetailPage.tsx
      AppointmentsPage.tsx
      AppointmentDetailPage.tsx
      BookAppointmentPage.tsx
      AppointmentCalendarPage.tsx
      TrackTechnicianPage.tsx
      LiveStatusPage.tsx
      MessagesPage.tsx
      NotificationsPage.tsx
      ServiceHistoryPage.tsx
      InvoicesPage.tsx
      InvoiceDetailPage.tsx
      PaymentsPage.tsx
      FeedbackPage.tsx
      KnowledgeBasePage.tsx
      KnowledgeBaseArticlePage.tsx
      DownloadsPage.tsx
      ProfilePage.tsx
      SettingsPage.tsx
      SecurityPage.tsx
      HelpCenterPage.tsx
      DisputesPage.tsx
      DisputeDetailPage.tsx
      AccountPage.tsx (legacy)
      AccountHealthPage.tsx
    types/
      index.ts — Shared type re-exports
  tests/
    setup.ts
```

## Key Architectural Decisions

1. **Hash-based routing**: Zero-dependency, simple, enables direct URL sharing without server config.
2. **React Context over Redux**: Appropriate for this app's state complexity. App-wide state is minimal (customerId, filters, notification count).
3. **Custom hooks for data fetching**: Consistent pattern (data/loading/error/refetch) across all domains. Each hook encapsulates its own service call and state.
4. **Inline styles exclusively**: No CSS preprocessors or CSS-in-JS libraries. All styling via inline `style` objects. Theme tokens via CSS custom properties.
5. **Mock service layer**: `customer-service.ts` provides realistic mock data with simulated network delays. All methods return promises matching real API contracts.
6. **Component composition over inheritance**: Pages compose widgets, forms, and shared components. No deep component hierarchies.

## Event Flow

```
User Action → Page/Form Component → Service Method → Mock Response → Hook State Update → Re-render
```

## Dependencies

- React 18 (via workspace root)
- `@resqai/foundation` — Shared UI components (Button, Card, Table, etc.)
- `lemma-sdk` — Authentication and API client
- `@resqai/config` — Environment configuration
