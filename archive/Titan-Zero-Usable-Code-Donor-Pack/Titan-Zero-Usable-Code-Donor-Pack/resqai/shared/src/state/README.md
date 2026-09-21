# ResQAI V2 — State Layer

## Overview

The state layer provides a set of React Context providers for managing application-wide state. Each context is independently usable, allowing fine-grained subscriptions to avoid unnecessary re-renders.

## Providers

| Provider | Purpose |
|---|---|
| `GlobalStateProvider` | App-level loading, error, and initialization state |
| `AuthStateProvider` | Authentication state (token, user, login/logout) |
| `UserStateProvider` | Current user profile and preferences |
| `OrganizationStateProvider` | Current organization/settings |
| `ThemeStateProvider` | Theme mode, sidebar collapse, font size, dense mode |
| `NotificationStateProvider` | Toast/notification queue with auto-dismiss |

## Provider Hierarchy

```
<NotificationStateProvider>
  <ThemeStateProvider>
    <GlobalStateProvider>
      <AuthStateProvider>
        <UserStateProvider>
          <OrganizationStateProvider>
            <App />
          </OrganizationStateProvider>
        </UserStateProvider>
      </AuthStateProvider>
    </GlobalStateProvider>
  </ThemeStateProvider>
</NotificationStateProvider>
```

- `NotificationStateProvider` wraps everything so notifications work globally.
- `ThemeStateProvider` at top so all UI responds to theme changes.
- `GlobalStateProvider` before auth so login loading states work.
- `AuthStateProvider ` before user/org because those depend on auth.

## Usage

```tsx
import { useGlobalState } from '../state';

function MyComponent() {
  const { state, setLoading } = useGlobalState();
  // ...
}
```

## Testing

Wrap components with required providers in tests:

```tsx
import { render } from '@testing-library/react';
import { GlobalStateProvider, AuthStateProvider } from '../state';

render(
  <GlobalStateProvider>
    <AuthStateProvider>
      <MyComponent />
    </AuthStateProvider>
  </GlobalStateProvider>
);
```
