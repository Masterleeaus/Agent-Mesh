# Getting Started with @resqai/foundation

## Installation

The `shared` package is already part of the npm workspaces monorepo. To use it in a V2 application:

1. Add `"@resqai/foundation": "*"` to the application's `package.json` dependencies
2. Import modules by path:

```tsx
import { ThemeProvider, Button, Card, DashboardLayout } from '@resqai/foundation';
import { useAuthState, AuthStateProvider } from '@resqai/foundation/state';
import { ApiClient } from '@resqai/foundation/api';
import { EventBus } from '@resqai/foundation/events';
```

## Quick Start

### 1. Wrap your app with providers

```tsx
import { ThemeProvider } from '@resqai/foundation';
import { AuthStateProvider } from '@resqai/foundation/state';
import { GlobalStateProvider } from '@resqai/foundation/state';

function AppRoot() {
  return (
    <ThemeProvider defaultMode="light">
      <GlobalStateProvider>
        <AuthStateProvider>
          <YourApp />
        </AuthStateProvider>
      </GlobalStateProvider>
    </ThemeProvider>
  );
}
```

### 2. Use the dashboard layout

```tsx
import { DashboardLayout, Sidebar, Topbar } from '@resqai/foundation';

function YourApp() {
  return (
    <DashboardLayout
      sidebar={<Sidebar items={navItems} activeId={activeId} onNavigate={handleNav} />}
      topbar={<Topbar right={<UserMenu />} />}
    >
      <YourPage />
    </DashboardLayout>
  );
}
```

### 3. Use components

```tsx
import { Button, Card, Table, StatusBadge } from '@resqai/foundation';

function TicketList() {
  return (
    <Card variant="elevated">
      <Table
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'status', header: 'Status', render: v => <StatusBadge variant={v === 'open' ? 'warning' : 'success'}>{v}</StatusBadge> },
        ]}
        data={tickets}
        onRowClick={handleSelect}
      />
    </Card>
  );
}
```

### 4. Guard access

```tsx
import { RoleGuard, PermissionGuard, FeatureGuard, ApplicationGuard } from '@resqai/foundation/permissions';

<RoleGuard roles={['admin', 'manager']} userRoles={user.roles}>
  <AdminPanel />
</RoleGuard>
```

### 5. Use state and events

```tsx
import { useNotificationState } from '@resqai/foundation/state';
import { applicationEvents } from '@resqai/foundation/events';

function YourComponent() {
  const { addNotification } = useNotificationState();

  useEffect(() => {
    const unsub = applicationEvents.on('app:routeChange', ({ to }) => {
      addNotification({ type: 'info', title: 'Navigated to ' + to });
    });
    return unsub;
  }, []);
}
```

## Provider Hierarchy

```
ThemeProvider
└── GlobalStateProvider
    └── AuthStateProvider
        └── UserStateProvider
            └── OrganizationStateProvider
                └── ThemeStateProvider (depends on ThemeProvider)
                    └── NotificationStateProvider
                        └── <Application>
```

## Import Paths

| Import | Path |
|--------|------|
| Everything | `@resqai/foundation` |
| Design System | `@resqai/foundation/design-system` |
| Components | `@resqai/foundation/components` |
| Layouts | `@resqai/foundation/layouts` |
| Navigation | `@resqai/foundation/navigation` |
| Permissions | `@resqai/foundation/permissions` |
| State | `@resqai/foundation/state` |
| API | `@resqai/foundation/api` |
| Events | `@resqai/foundation/events` |
| Utils | `@resqai/foundation/utils` |
