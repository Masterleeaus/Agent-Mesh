# RESQAI V2 — State Contracts

> Phase 3.3 — Integration Contracts  
> Principal Enterprise Solution Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [State Architecture Principles](#1-state-architecture-principles)
2. [Global State Contracts](#2-global-state-contracts)
3. [Application State Contracts](#3-application-state-contracts)
4. [Page State Contracts](#4-page-state-contracts)
5. [Widget State Contracts](#5-widget-state-contracts)
6. [Temporary State Contracts](#6-temporary-state-contracts)
7. [Persistent State Contracts](#7-persistent-state-contracts)

---

## 1. State Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Global state is shared, not duplicated** | Auth, user, org, theme, notifications exist once in GlobalState |
| 2 | **Application state is scoped** | Each app manages its own domain state independently |
| 3 | **Page state is ephemeral** | Page-level state resets on navigation unless persisted to URL or app state |
| 4 | **Widget state is isolated** | Widgets receive input via props and communicate output via callbacks |
| 5 | **Temporary state is local** | Form drafts, unsaved edits, UI toggles live in component state |
| 6 | **Persistent state survives refresh** | User preferences, saved filters, draft content stored in localStorage |
| 7 | **State transitions trigger events** | Every meaningful state change emits a domain event |
| 8 | **Loading/Error/Empty are first-class states** | Every data-fetching component manages all four states |

### State Classification

| Layer | Scope | Duration | Storage | Update Mechanism |
|-------|-------|----------|---------|-----------------|
| Global | Cross-app | Session + persistent | Context + localStorage | Auth events, config events |
| Application | Single app | Session | Context | API responses, event subscriptions |
| Page | Single page | Navigation lifecycle | Context or useState | API responses, user interactions |
| Widget | Single component | Component lifecycle | useState or useReducer | Props, callbacks, subscriptions |
| Temporary | Single interaction | Milliseconds to minutes | useState | User input, timers |
| Persistent | Cross-session | Indefinite | localStorage, API | User saves, auto-save |

---

## 2. Global State Contracts

### AuthState

**Scope:** All applications
**Duration:** Session (tokens) + persistent (refresh token)

| Field | Type | Source | Mutation Trigger |
|-------|------|--------|-----------------|
| isAuthenticated | boolean | Lemma SDK auth check | login, logout, token refresh |
| user | UserVM \| null | Lemma SDK user profile | login, user.profile.updated event |
| accessToken | string \| null | Lemma SDK | login, token refresh |
| refreshToken | string \| null | Lemma SDK | login, refresh |
| tokenExpiresAt | ISO8601 \| null | Lemma SDK | login, token refresh |
| permissions | string[] | user_roles_v2 (API) | login, user.role.changed event |

**Events Consumed for Refresh:** system.config.changed (permission check), user.role.changed

### UserState

**Scope:** All applications
**Duration:** Session

| Field | Type | Source | Mutation Trigger |
|-------|------|--------|-----------------|
| id | uuid | Auth token | login |
| email | string | Auth token | login |
| fullName | string | User profile API | login, profile update |
| roleId | uuid | User profile API | login, role change |
| roleName | string | User profile API | login, role change |
| department | string \| null | User profile API | login |
| avatarUrl | string \| null | User profile API | login, upload |
| preferences | UserPreferences | User profile API | login, preferences save |

**Events Consumed:** user.role.changed, user.disabled (force logout)

### OrganizationState

**Scope:** All applications
**Duration:** Session + persistent

| Field | Type | Source | Mutation Trigger |
|-------|------|--------|-----------------|
| id | uuid | Auth token | login |
| name | string | Org profile API | login |
| settings | OrgSettings | Org settings API | login, system.config.changed |
| features | FeatureFlags | Feature flags API | login, feature flag toggle |

**Events Consumed:** system.config.changed, org.settings.updated

### ThemeState

**Scope:** All applications
**Duration:** Persistent (localStorage)

| Field | Type | Source | Mutation Trigger |
|-------|------|--------|-----------------|
| mode | enum (light\|dark\|system) | localStorage | user toggle |
| primaryColor | string | System config | system.config.changed |
| fontSize | enum (small\|medium\|large) | localStorage | user toggle |
| reducedMotion | boolean | localStorage | user toggle |

### NotificationState

**Scope:** All applications
**Duration:** Session

| Field | Type | Source | Mutation Trigger |
|-------|------|--------|-----------------|
| unreadCount | integer | GET /api/v2/notifications?unread=true | poll, notification.new event |
| notifications | NotificationVM[] | GET /api/v2/notifications | poll, notification.new event |
| isOpen | boolean | UI toggle | bell click |
| lastFetched | ISO8601 | local | fetch |

**Events Consumed:** notification.new (all apps), notification.sent, notification.delivered, notification.failed

---

## 3. Application State Contracts

### support-center_v2 State

**Scope:** support-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| ticketFilters | status[], urgency[], channel[], requestType[], assignedOwner, dateRange, search, sortBy, sortOrder | Yes (localStorage) | User changes filters |
| ticketPagination | page, pageSize | No | Page navigation |
| selectedTicketId | uuid \| null | No | Ticket selection |
| activeTab | string | No | Tab click |
| templateList | TemplateVM[], loading, error | No | API fetch, template CRUD |
| slaSummary | SLASummaryVM, loading, error | No | API fetch, sla events |
| escalations | EscalationVM[], loading, error | No | API fetch, escalation events |
| myTickets | TicketVM[], loading, error | No | API fetch, ticket events |

**Events Consumed:** ticket.created, ticket.status.changed, ticket.classified, ticket.assigned, ticket.sla_breached, notification.new

### operations-center_v2 State

**Scope:** operations-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| dashboardKPIs | KPI[], loading, error | No (cache: 60s) | Auto-refresh, event triggers |
| taskFilters | status[], priority[], assignedTo, dateRange, category, search | Yes (localStorage) | User changes |
| taskBoard | TaskVM[][], loading, error | No | API fetch, task events |
| selectedTaskId | uuid \| null | No | Task selection |
| dispatchQueue | DispatchVM[], loading, error | No | API fetch, dispatch events |
| selectedDispatchId | uuid \| null | No | Dispatch selection |
| standupData | StandupVM, loading, error | No | API fetch, daily generation |
| techWorkload | TechnicianLoadVM[], loading, error | No | API fetch |

**Events Consumed:** ticket.escalated, ticket.classified (urgent), task.created, task.status.changed, appointment.status.changed, followup.slippage.detected, account.health.changed (critical), dispatch.*, technician.availability.changed

### appointment-center_v2 State

**Scope:** appointment-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| calendarConfig | viewMode (month\|week\|day), currentDate | Yes (localStorage) | User navigation |
| appointments | AppointmentVM[], loading, error | No (cache: 30s) | API fetch, appointment events |
| selectedAppointmentId | uuid \| null | No | Appointment click |
| technicianAvailability | TechnicianScheduleVM[], loading, error | No | API fetch, availability events |
| serviceTypes | ServiceTypeVM[], loading, error | No | API fetch, CRUD |
| conflictWarnings | ConflictVM[] | No | Booking action, real-time check |
| bookingWizard | WizardStep, draftData | No (temp) | Wizard navigation |

**Events Consumed:** appointment.created, appointment.assigned, appointment.status.changed, appointment.cancelled, ticket.classified (service-required), technician.availability.changed

### technician-portal_v2 State

**Scope:** technician-portal_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| daySchedule | AppointmentVM[], loading, error | No (cache: 30s) | API fetch, appointment events |
| selectedJobId | uuid \| null | No | Job click |
| jobStatus | JobStatusStepper state | No | Status transition |
| taskList | TaskVM[], loading, error | No | API fetch, task events |
| selectedTaskId | uuid \| null | No | Task click |
| notifications | NotificationVM[], loading, error | No | API fetch, notification.new |
| availability | enum | Yes (localStorage) | Toggle |
| photoUploadQueue | UploadItem[] | No (temp) | User selection, upload complete |

**Events Consumed:** appointment.assigned, appointment.rescheduled, appointment.cancelled, dispatch.initiated, dispatch.acknowledged, task.created, task.assigned, notification.new

### resolution-center_v2 State

**Scope:** resolution-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| disputeFilters | status[], severity[], type[], dateRange, search | Yes (localStorage) | User changes |
| disputeList | DisputeVM[], loading, error | No | API fetch, dispute events |
| selectedDisputeId | uuid \| null | No | Dispute click |
| pendingApprovals | DisputeVM[], loading, error | No | API fetch, analysis events |
| resolutionHistory | DisputeVM[], loading, error | No | API fetch |
| trendData | TrendVM[], loading, error | No | API fetch |
| analysisResult | AnalysisVM \| null | No (temp) | AI analysis completion |

**Events Consumed:** dispute.created, dispute.analyzed, dispute.status.changed, dispute.resolved, appointment.status.changed (needs_followup)

### crm-center_v2 State

**Scope:** crm-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| dashboardData | AccountDashboardVM, loading, error | No (cache: 120s) | API fetch, health events |
| accountFilters | healthCategory[], status[], dateRange, search | Yes (localStorage) | User changes |
| accountList | AccountVM[], loading, error | No | API fetch |
| selectedAccountId | uuid \| null | No | Account click |
| accountDetail | AccountDetailVM, loading, error | No | API fetch, account events |
| followupFilters | status[], type[], assignedTo, dueDateRange, search | Yes (localStorage) | User changes |
| followupList | FollowupVM[], loading, error | No | API fetch, followup events |
| healthScanHistory | HealthScanVM[], loading, error | No | API fetch |
| riskSignals | RiskSignalVM[], loading, error | No | API fetch |

**Events Consumed:** ticket.status.changed, appointment.completed, appointment.created, dispute.resolved, feedback.submitted, account.health.changed, followup.created, followup.slippage.detected

### analytics-center_v2 State

**Scope:** analytics-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| dateRange | from, to, granularity | Yes (localStorage) | User changes |
| executiveMetrics | MetricVM[], loading, error | No (cache: 300s) | API fetch, periodic refresh |
| domainCharts | ChartVM[], loading, error | No | API fetch, metric selection |
| reportConfig | ReportConfigVM | No (temp) | Builder actions |
| reportList | ReportVM[], loading, error | No | API fetch |
| scheduledReports | ScheduledReportVM[], loading, error | No | API fetch |
| dataFreshness | FreshnessVM | No | API fetch |

**Events Consumed:** ALL domain events (used to refresh dashboard data, not stored directly)

### customer-portal_v2 State

**Scope:** customer-portal_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| dashboard | CustomerDashboardVM, loading, error | No (cache: 60s) | API fetch, domain events |
| ticketFilters | status[], dateRange, search | Yes (localStorage) | User changes |
| ticketList | TicketVM[], loading, error | No | API fetch, ticket events |
| selectedTicketId | uuid \| null | No | Ticket click |
| appointmentList | AppointmentVM[], loading, error | No | API fetch, appointment events |
| selectedAppointmentId | uuid \| null | No | Appointment click |
| bookingWizard | WizardStep, draftBookingData | No (temp) | Wizard navigation |
| disputeList | DisputeVM[], loading, error | No | API fetch, dispute events |
| selectedDisputeId | uuid \| null | No | Dispute click |
| profile | ProfileVM, loading, error | No | API fetch, save |
| notificationPrefs | NotificationPreferences | Yes (localStorage, API) | Save |
| accountHealth | AccountHealthVM, loading, error | No | API fetch |

**Events Consumed:** ticket.status.changed, appointment.status.changed, dispute.status.changed, notification.new, account.health.changed

### admin-center_v2 State

**Scope:** admin-center_v2 only
**Duration:** Session

| Slice | Fields | Persisted | Updates On |
|-------|--------|-----------|------------|
| userFilters | roleId[], status[], department, search | Yes (localStorage) | User changes |
| userList | UserVM[], loading, error | No | API fetch, user events |
| selectedUserId | uuid \| null | No | User click |
| roleList | RoleVM[], loading, error | No | API fetch |
| selectedRoleId | uuid \| null | No | Role click |
| auditFilters | entityType, entityId, actorId, action, dateRange, search | Yes (localStorage) | User changes |
| auditLog | AuditEntryVM[], loading, error | No | API fetch |
| settings | SettingVM[], loading, error | No | API fetch |
| featureFlags | FeatureFlagVM[], loading, error | No | API fetch |
| connectors | ConnectorVM[], loading, error | No | API fetch |
| eventBusMonitor | EventVM[], loading, error | No | Event subscription |
| systemHealth | SystemHealthVM, loading, error | No (cache: 60s) | API fetch, health events |

**Events Consumed:** user.created, user.disabled, user.role.changed, notification.failed, notification.delivered (stats), system.health.alert

---

## 4. Page State Contracts

Every page follows this contract pattern:

| State Variable | Type | Initial | Transitions |
|----------------|------|---------|-------------|
| data | ViewModel \| null | null | loading → data / empty / error |
| loading | boolean | true | true → false (on resolve) |
| error | ErrorVM \| null | null | null → error (on fail) |
| empty | boolean | false | false → true (if data.length === 0) |

### Page State Transitions

```
                    ┌────────────┐
                    │  LOADING   │
                    └─────┬──────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │  DATA   │ │  EMPTY  │ │  ERROR  │
        └────┬────┘ └─────────┘ └────┬────┘
             │                       │
             └───────────┬───────────┘
                         ▼
                    ┌────────────┐
                    │  LOADING   │ (retry / refresh)
                    └────────────┘
```

### Page-Specific State Variations

**TicketDetailPage, AppointmentDetailPage, AccountDetailPage:**
- Additional state: `notFound` (boolean) — when ID doesn't match any record

**NewTicketPage, NewAppointmentPage, CreateUserPage:**
- Additional state: `submitting` (boolean), `submitError` (ErrorVM | null), `submitSuccess` (boolean)

**ReportBuilderPage, BookingWizard (customer-portal):**
- Additional state: `wizardStep` (integer), `draftData` (object), `validationErrors` (field-wise)

**All list pages (TicketQueue, DisputeQueue, UserManagement, etc.):**
- Additional state: `selectedItems` (Set<uuid>), `bulkActionInProgress` (boolean)

---

## 5. Widget State Contracts

### Widget Lifecycle States

Every widget manages its own lifecycle via this contract:

| State | Description | Recovery |
|-------|-------------|----------|
| initial | Never loaded | Trigger initial fetch |
| loading | Fetch in progress | Render skeleton |
| data | Data available | Render content |
| empty | No data to display | Render EmptyState |
| error | Fetch failed | Render ErrorState with retry |
| stale | Data available but outdated | Render content + stale indicator |
| refreshing | Data being refreshed while showing stale data | Render content + subtle loading indicator |

### Shared Widget States

##### KpiCardWidget

| State | Fields | Source |
|-------|--------|--------|
| Props | title, metric, previousPeriodMetric, format (number\|currency\|percent\|duration) | Parent |
| Internal | value, trend, changePct, loading, error | API |
| Refresh | Poll interval: 60s; Event-driven on domain events | — |
| Cache | 60s TTL in app state | — |
| Offline | Show last known value with stale indicator | — |

##### SearchBarWidget

| State | Fields | Source |
|-------|--------|--------|
| Props | placeholder, entityTypes, onSelect, minQueryLength | Parent |
| Internal | query, results (grouped by type), loading, isOpen, selectedIndex | User input |
| Refresh | Debounce 300ms on query change | — |
| Cache | Result cache: 120s per query | sessionStorage |
| Offline | Search disabled; show offline message | — |

##### FilterBarWidget

| State | Fields | Source |
|-------|--------|--------|
| Props | filterDefinitions, activeFilters, onFilterChange | Parent |
| Internal | availableOptions, selectedValues, isDropdownOpen | User interaction |
| Persistence | Filter values stored in localStorage per page | — |
| Refresh | Options fetched on mount | — |

##### ActivityFeedWidget

| State | Fields | Source |
|-------|--------|--------|
| Props | entityType, entityId, maxItems | Parent |
| Internal | events, loading, hasMore, error | API + subscription |
| Refresh | Real-time via event subscription; scroll load-more | — |
| Cache | 120s TTL | In-memory |
| Offline | Show cached events with stale indicator | — |

##### NotificationBellWidget

| State | Fields | Source |
|-------|--------|--------|
| Props | — | — |
| Internal | unreadCount, notifications, isOpen, loading | API + notification.new event |
| Refresh | Real-time via notification.new event; poll every 60s | — |
| Cache | 60s TTL | In-memory |

---

## 6. Temporary State Contracts

### Form Draft State

**Scope:** Single form
**Duration:** Until submission or discard
**Storage:** useState (default) or localStorage (auto-save for long forms)

| Field | Type | Description |
|-------|------|-------------|
| values | Record<string, any> | Current form field values |
| errors | Record<string, string[]> | Field-level validation errors |
| touched | Record<string, boolean> | Fields that have been blurred |
| isDirty | boolean | True if any field differs from initial |
| isSubmitting | boolean | Submission in progress |
| submitError | ErrorVM \| null | Last submission error |
| autoSaveVersion | integer \| null | Auto-save revision counter |

### Wizard State

**Scope:** Multi-step wizard (booking, report builder, dispute flow)
**Duration:** Until completion or discard
**Storage:** useState + auto-save to localStorage

| Field | Type | Description |
|-------|------|-------------|
| currentStep | integer | 0-indexed step number |
| totalSteps | integer | Total steps |
| stepsCompleted | Set<integer> | Completed steps |
| stepData | Record<step, object> | Per-step collected data |
| validationErrors | Record<step, Record<string, string[]>> | Per-step field errors |
| canProceed | boolean | Current step valid |
| isSubmitting | boolean | Final submission in progress |

### UI Toggle State

**Duration:** Single interaction
**Storage:** useState

| Type | Examples |
|------|----------|
| Dropdown open | filter dropdown, user menu, notification panel |
| Modal open | confirm dialog, detail modal |
| Tooltip visible | info tooltip, help icon |
| Accordion expanded | timeline section, detail panel |
| Sidebar collapsed | nav sidebar, filter sidebar |
| Tab active | tab group selection |
| Sort config | table header sort direction |
| Selected items | checkbox selection in list |

---

## 7. Persistent State Contracts

### localStorage Key Conventions

```
resqai_v2:{app}:{slice}:{version}
```

Examples:
- `resqai_v2:support:ticketFilters:v1`
- `resqai_v2:crm:accountFilters:v1`
- `resqai_v2:admin:userFilters:v1`
- `resqai_v2:global:themePrefs:v1`
- `resqai_v2:customer:notificationPrefs:v1`

### User Preferences (Persistent)

| Key | Scope | Type | Default |
|-----|-------|------|---------|
| ui.theme | global | enum | system |
| ui.fontSize | global | enum | medium |
| ui.reducedMotion | global | boolean | false |
| notifications.email | per-app | boolean | true |
| notifications.sms | per-app | boolean | false |
| notifications.push | per-app | boolean | true |
| page.defaultPageSize | per-app | integer | 25 |
| page.savedFilters | per-app | Record<string, FilterConfig> | {} |
| calendar.defaultView | appointment | enum | week |
| dashboard.defaultTab | per-app | string | first tab |

### Session State (SessionStorage)

| Key | Scope | Description |
|-----|-------|-------------|
| auth.redirectPath | global | URL to redirect after login |
| form.draft.{formId} | per-form | Auto-saved form draft |
| wizard.draft.{wizardId} | per-wizard | Wizard progress |
| search.lastQuery | global | Last search term for quick re-search |

### Cache Invalidation Rules

| Trigger | Invalidated |
|---------|-------------|
| Application mount | All stale cache entries > maxAge |
| Mutation response | Related query cache |
| Event received | Related app state caches |
| User logout | All persistent state except preferences |
| Token refresh | Auth-related state |
| system.config.changed | Feature flags, system settings cache |
| user.role.changed | Permission cache |
| Explicit refresh action | Specific query cache |

### Cache TTLs by Data Type

| Data Type | Default TTL | Max TTL | Stale-While-Revalidate |
|-----------|-------------|---------|------------------------|
| Reference data (service types, templates) | 5 minutes | 30 minutes | Yes |
| List data (paginated records) | 1 minute | 5 minutes | Yes |
| Single record detail | 30 seconds | 2 minutes | Yes |
| KPI/metric values | 1 minute | 5 minutes | Yes |
| Dashboard aggregations | 2 minutes | 10 minutes | Yes |
| User profile | 5 minutes | 30 minutes | Yes |
| Search results | 2 minutes | 10 minutes | No (always refetch) |
| Real-time subscriptions | 0 (live) | 0 | N/A |
