# ResQAI V2 — Shared State

## Overview

Complete cross-application shared state architecture. Defines every shared React Context, global state slice, and inter-app state synchronization contract.

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SHARED STATE LAYER (shared/src/state/)            │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │ GlobalState  │  │  AuthState  │  │  UserState  │  │  OrgState  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │                │          │
│  ┌──────┴──────┐  ┌──────┴──────┐                     ┌────┴──────┐  │
│  │ ThemeState  │  │ Notification│                     │ CrossApp  │  │
│  │             │  │   State     │                     │   State   │  │
│  └────────────┘  └─────────────┘                     └───────────┘  │
│                                                                      │
│                     React Context Providers                          │
└─────────────────────────────────────────────────────────────────────┘
          ▲                    ▲                    ▲
          │ provides to       │ provides to        │ provides to
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ support-center  │  │ appointment-    │  │ operations-     │
│ AppContext       │  │ center AppContext│  │ center AppContext│
└─────────────────┘  └─────────────────┘  └─────────────────┘
          ── each app has its own AppContext extending shared state ──
```

---

## 2. Shared State Definitions

### GlobalState (`shared/src/state/GlobalState.tsx`)

```typescript
interface GlobalState {
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Used by: ALL apps
// Cross-app contract: When any app transitions to error, it can emit
// a notification to other apps if the error is platform-wide
```

### AuthState (`shared/src/state/AuthState.tsx`)

```typescript
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Used by: ALL apps
// Cross-app contract: Single auth provider wraps all apps.
// Token is shared via localStorage or cross-origin postMessage.
// User.role determines cross-app navigation visibility.
```

### UserState (`shared/src/state/UserState.tsx`)

```typescript
interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  sessions: UserSession[];
  updateProfile: (data: Partial<UserProfile>) => void;
  updatePreferences: (data: Partial<UserPreferences>) => void;
}

// Used by: ALL apps
// Cross-app contract: Preferences (theme, locale, sidebar state)
// are synced across all apps via localStorage.
```

### OrganizationState (`shared/src/state/OrganizationState.tsx`)

```typescript
interface OrganizationState {
  current: Organization | null;
  teams: Team[];
  switchOrg: (orgId: string) => void;
}

// Used by: ALL apps (multi-tenant)
// Cross-app contract: Org switch broadcasts to all apps via
// globalEventBus: 'organization:changed'
```

### ThemeState (`shared/src/state/ThemeState.tsx`)

```typescript
interface ThemeState {
  mode: 'light' | 'dark';
  toggle: () => void;
  setMode: (mode: 'light' | 'dark') => void;
}

// Used by: ALL apps
// Cross-app contract: Theme choice is stored in localStorage
// and shared across all apps. No provider nesting required.
```

### NotificationState (`shared/src/state/NotificationState.tsx`)

```typescript
interface NotificationState {
  list: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  markRead: (id: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  sourceApp: string;            // Which app generated this
  targetApps?: string[];         // If set, only show in specified apps
  actionUrl?: string;           // Deep link URL
  read: boolean;
  createdAt: string;
}

// Used by: ALL apps
// Cross-app contract:
// - addNotification(): Called by EventBus handlers to show in-app toasts
// - sourceApp: Set to current app identity when emitting
// - actionUrl: Deep link to take user to relevant entity in source app
```

---

## 3. CrossApp State (NEW — Proposed)

A new shared state slice for cross-application communication:

```typescript
// shared/src/state/CrossAppState.tsx (NEW)

interface CrossAppState {
  // Current app identity
  currentApp: {
    id: string;
    label: string;
    version: string;
  };

  // Cross-app navigation history
  navigationHistory: CrossAppNavEntry[];

  // Active breadcrumb trail (from source app)
  activeBreadcrumbs: CrossAppBreadcrumb[];

  // Cross-app filters (inherited from source app)
  inheritedFilters: Record<string, CrossAppFilterSet>;

  // Active cross-app search
  activeSearch: {
    query: string;
    scope: CrossAppSearchScope;
    results: CrossAppSearchResult[];
    searching: boolean;
  };

  // Federated activity timeline
  activityTimeline: {
    events: CrossAppTimelineEvent[];
    loading: boolean;
    filters: CrossAppTimelineFilter;
  };

  // Cross-app entity links currently displayed
  activeEntityLinks: CrossAppEntityRef[];
}

interface CrossAppNavEntry {
  fromApp: string;
  fromRoute: string;
  toApp: string;
  toRoute: string;
  entityType?: string;
  entityId?: string;
  timestamp: number;
}

// Context provider wraps all apps at the shell level
export function useCrossAppState(): CrossAppStateContextValue {
  // Returns: currentApp, navigationHistory, activeBreadcrumbs,
  //          inheritedFilters, activeSearch, activityTimeline, activeEntityLinks,
  //          navigateToApp, pushBreadcrumb, setInheritedFilters,
  //          searchAcrossApps, fetchTimeline, linkEntity
}
```

---

## 4. Per-App Local State vs. Shared State

| State Concern | Stored In | Sync Mechanism |
|---|---|---|
| Auth token | AuthState (shared) | localStorage + Context |
| User profile | UserState (shared) | Context |
| Organization context | OrganizationState (shared) | Context + EventBus |
| Theme preference | ThemeState (shared) | localStorage + Context |
| Notifications | NotificationState (shared) | Context + EventBus |
| Cross-app navigation | CrossAppState (shared) | Context + EventBus + URL |
| Active breadcrumbs | CrossAppState (shared) | URL query params |
| Inbound filters | CrossAppState (shared) | URL query params |
| Ticket list filters | AppContext (local) | Local state only |
| Appointment calendar view | AppContext (local) | Local state only |
| Selected entity IDs | AppContext (local) | Local state only |
| Sidebar collapsed state | AppContext (local) → UserState (shared) | localStorage |
| View mode (table/kanban) | AppContext (local) | Local state only |
| Offline/network status | AppContext (local) | Local state only |

---

## 5. Cross-App State Synchronization

### Sync Mechanism: CrossAppBridge

```typescript
// shared/src/state/CrossAppBridge.ts (NEW)

class CrossAppBridge {
  private static instance: CrossAppBridge;

  // Synchronize filters across apps
  propagateFilters(sourceApp: string, filters: CrossAppFilterSet): void {
    const payload = { sourceApp, filters, timestamp: Date.now() };
    // Write to shared localStorage key
    localStorage.setItem('cross-app:filters', JSON.stringify(payload));
    // Emit event for active subscribers in other apps
    globalEventBus.emit('crossapp:filters.changed', payload);
  }

  // Read inherited filters (called on mount by target app)
  readInheritedFilters(): CrossAppFilterSet | null {
    const raw = localStorage.getItem('cross-app:filters');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire filters older than 5 minutes
    if (Date.now() - parsed.timestamp > 300000) {
      localStorage.removeItem('cross-app:filters');
      return null;
    }
    return parsed.filters;
  }

  // Push breadcrumb to target app
  pushBreadcrumb(trail: CrossAppBreadcrumb[]): void {
    const encoded = encodeURIComponent(JSON.stringify(trail));
    // Appended to cross-app navigation URL
    // Target app reads from URL params on mount
  }

  // Cross-app search dispatch
  async searchAcrossApps(request: CrossAppSearchRequest): Promise<CrossAppSearchResult[]> {
    // Query each app's search handler
    const results = await Promise.all(
      this.getSearchableApps(request.scope).map(app =>
        app.searchHandler(request)
      )
    );
    return results.flat().sort((a, b) => b.score - a.score);
  }
}
```

---

## 6. State Flow for Key Cross-App Scenarios

### Scenario: Customer rep views a ticket then navigates to CRM

```
1. support-center (TicketDetailPage)
   ├── Loads TicketDTO from local service
   ├── Shows "View Customer" EntityLink
   └── onClick:
       ├── Writes to CrossAppBridge:
       │   - filters: { customerId, accountId }
       │   - breadcrumbs: [{ app: 'Support Center', route: '/tickets/123',
       │                    label: 'Ticket #123' }]
       └── Opens crm-center_v2/index.html#/accounts/456
             ?source=support
             &customerId=cust_123
             &breadcrumbs=<encoded>

2. crm-center (AccountDetailPage on mount)
   ├── Reads ?source=support → sets breadcrumbs
   ├── Reads ?customerId=cust_123 → filters account view
   └── Renders breadcrumb: Support Center › Ticket #123 › Acme Corp
```

### Scenario: Technician completes job, notification sent to support

```
1. technician-portal (CompleteJobPage)
   ├── Calls technician-service.completeJob(id)
   ├── Emits: globalEventBus.emit('job.completed', {
   │     sourceApp: 'technician-portal_v2',
   │     entity: { jobId, completionNotes }
   │   })
   └── CrossAppBridge notification to support-center:
       addNotification({
         sourceApp: 'technician-portal_v2',
         type: 'success',
         title: 'Job Completed',
         message: 'Job #789 completed by John',
         actionUrl: '../technician-portal_v2/index.html#/jobs/789'
       })

2. support-center (NotificationState subscriber)
   ├── Receives notification via shared NotificationState
   ├── Shows toast notification
   └── User clicks → navigates to technician portal job detail
```

### Scenario: Global search from any app

```
1. ANY app (SearchBar)
   ├── User types query, selects scope
   ├── CrossAppBridge.searchAcrossApps({ query, scope })
   │   ├── Queries support-center search handler
   │   ├── Queries appointment-center search handler
   │   ├── Queries crm-center search handler
   │   └── ...
   └── Results aggregated by relevance score

2. Results display with source app badge and deep link URL
   User clicks → navigates to source app entity detail
```

---

## 7. Shared State Provider Hierarchy

```tsx
// Shell application layer (wraps all apps in monorepo shell)
<GlobalStateProvider>
  <AuthStateProvider>
    <UserStateProvider>
      <OrganizationStateProvider>
        <ThemeStateProvider>
          <NotificationStateProvider>
            <CrossAppStateProvider>
              {children}  {/* Individual app mounts here */}
            </CrossAppStateProvider>
          </NotificationStateProvider>
        </ThemeStateProvider>
      </OrganizationStateProvider>
    </UserStateProvider>
  </AuthStateProvider>
</GlobalStateProvider>
```

Currently, each app maintains its own provider tree. The integration layer standardizes this by lifting shared providers to a common shell.

---

## 8. State Backward Compatibility

| Existing State | Migration Path |
|---|---|
| `AppContext.currentUser` | → `AuthState.user` (shared) |
| `AppContext.notifications` | → `NotificationState` (shared) |
| `AppContext.activeFilters` | → `CrossAppState.inheritedFilters` (shared) when cross-app; keep local when in-app only |
| `AppContext.selectedTicketIds` | Keep local (app-only concern) |
| `AppContext.viewMode` | Keep local (app-only concern) |
| `AppContext.sidebarCollapsed` | → `UserState.preferences` (shared across apps) |
| `AppContext.offline` | Keep local (tech-portal specific) |
