# Component Tree

```
App
└── AppProvider
    └── AppLayout
        ├── Topbar (shared)
        └── Sidebar (shared/navigation)
            └── Routes
                ├── DashboardPage
                │   ├── Card (shared) x6 (stat cards)
                │   ├── TodayAppointments
                │   │   └── Card (shared)
                │   ├── UpcomingAppointments
                │   │   └── Card (shared)
                │   ├── OverdueAppointments
                │   │   └── Card (shared)
                │   ├── PendingAssignmentWidget
                │   │   └── Card (shared)
                │   ├── CompletedTodayWidget
                │   │   └── Card (shared)
                │   └── TechnicianAvailabilityWidget
                │       └── Card (shared)
                │
                ├── AppointmentQueuePage
                │   ├── Card (shared)
                │   ├── SearchBar (shared)
                │   ├── Filter (shared)
                │   ├── Button (shared)
                │   ├── Pagination (shared)
                │   ├── AppointmentQueueTable
                │   │   ├── Card (shared)
                │   │   └── Table (shared)
                │   └── Bulk action bar (inline)
                │
                ├── CalendarViewPage
                │   ├── Card (shared)
                │   ├── SearchBar (shared)
                │   ├── Filter (shared)
                │   ├── Button (shared)
                │   └── ScheduleCalendar
                │       └── AppointmentCard
                │           └── StatusBadge (shared)
                │
                ├── TimelineViewPage
                │   ├── Card (shared)
                │   ├── Input (shared)
                │   ├── SearchBar (shared)
                │   └── TimelineView
                │
                ├── NewAppointmentPage
                │   ├── BookingWizard
                │   │   ├── Card (shared)
                │   │   ├── ProgressIndicator (shared)
                │   │   └── Button (shared)
                │   ├── ServiceTypeSelector
                │   │   └── Dropdown (shared)
                │   ├── TimeSlotPicker
                │   ├── TechnicianPicker
                │   │   └── Dropdown (shared)
                │   ├── ConflictWarning
                │   └── Input (shared)
                │
                ├── AppointmentDetailPage
                │   ├── DetailLayout (shared/layouts)
                │   ├── Tabs (shared)
                │   ├── StatusBadge (shared)
                │   ├── Button (shared)
                │   ├── AppointmentTimeline
                │   ├── AppointmentHistoryTable
                │   └── CancelAppointmentDialog
                │       └── Dialog (shared)
                │
                ├── ReschedulePage
                │   ├── Card (shared)
                │   ├── Input (shared)
                │   ├── TimeSlotPicker (inline)
                │   └── Button (shared)
                │
                ├── AssignTechnicianPage
                │   ├── Card (shared)
                │   ├── Dropdown (shared)
                │   ├── Button (shared)
                │   └── AssignmentConfirmationDialog
                │       └── Dialog (shared)
                │
                ├── AppointmentHistoryPage
                │   ├── Card (shared)
                │   ├── Pagination (shared)
                │   └── History event items (inline)
                │
                ├── CancelledAppointmentsPage
                │   ├── Card (shared)
                │   ├── SearchBar (shared)
                │   ├── Pagination (shared)
                │   └── AppointmentQueueTable
                │
                ├── CompletedAppointmentsPage
                │   ├── Card (shared)
                │   ├── SearchBar (shared)
                │   ├── Pagination (shared)
                │   └── AppointmentQueueTable
                │
                ├── SearchPage
                │   ├── Card (shared)
                │   ├── SearchBar (shared)
                │   └── SearchResult items (inline)
                │
                ├── ReportsPage
                │   ├── Card (shared)
                │   ├── Input (shared)
                │   ├── Button (shared)
                │   └── Report sections (inline)
                │
                ├── TechnicianSchedulePage
                │   ├── Card (shared)
                │   ├── TechnicianDayView
                │   ├── Table (shared)
                │   ├── EmptyState (shared)
                │   └── StatusBadge (shared)
                │
                ├── ServiceTypesPage
                │   ├── Card (shared)
                │   ├── Table (shared)
                │   ├── Button (shared)
                │   ├── Dialog (shared)
                │   └── Input (shared)
                │
                └── ScheduleSettingsPage
                    ├── Card (shared)
                    ├── Input (shared)
                    └── Button (shared)
```

## Shared Components Used
All from `../../../shared/src/components`: Button, Input, Dropdown, Card, Table, Dialog, Form, SearchBar, Filter, StatusBadge, ProgressIndicator, Skeleton, EmptyState, ErrorState, Topbar, Tabs, Pagination

## Shared Layouts Used
DetailLayout from `../../../shared/src/layouts`

## Shared Navigation Used
Sidebar from `../../../shared/src/navigation`

## App-Specific Components (24 total)

### Widgets (6)
- TodayAppointments, UpcomingAppointments, OverdueAppointments, PendingAssignmentWidget, CompletedTodayWidget, TechnicianAvailabilityWidget

### Tables (2)
- AppointmentQueueTable, AppointmentHistoryTable

### Views (2)
- TimelineView, TechnicianDayView

### Forms/Wizards (5)
- BookingWizard, ServiceTypeSelector, TimeSlotPicker, TechnicianPicker, ConflictWarning

### Dialogs (4)
- CancelAppointmentDialog, AssignTechnicianDialog, AssignmentConfirmationDialog, CancellationConfirmationDialog

### Other (5)
- ScheduleCalendar, AppointmentCard, AppointmentTimeline, TechSuggestionCard, PermissionGuard

## State Approach
- AppContext for global state (currentUser, filters, viewMode, selectedIds, notifications, offline)
- Custom hooks for data fetching (11 hooks)
- Each hook returns { data, loading, error, refetch }
- Local useState for form inputs, search, pagination, dialog state
