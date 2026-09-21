# Admin Center V2 — Architecture

## Application Architecture

The Admin Center is a React 18 + TypeScript single-page application within the ResQAI V2 micro-frontend ecosystem. It runs on Vite and follows the same architecture as all other V2 apps.

## Key Decisions

| Decision | Approach |
|----------|----------|
| Routing | Custom hash-based router (no React Router dependency) |
| State | React Context via `AppProvider` + `useAppContext` hook |
| Data Fetching | Custom hooks (`useUsers`, `useRoles`, etc.) calling mock service layer |
| Styling | Inline `React.CSSProperties`, dark theme across all pages |
| Components | `@resqai/foundation` shared library + local admin-specific components |
| Models | DTO / ViewModel / API Request / API Response separation |
| Services | Mock-based service layer, swappable to real API via `lemma-sdk` |
| Permissions | Permission string constants + `PermissionGuard` component |

## Layer Architecture

```
┌─────────────────────────────────────────────┐
│                  Pages                       │
│  (32 route-level page components)           │
├─────────────────────────────────────────────┤
│              Components                     │
│  (19 reusable admin-specific components)    │
├─────────────────────────────────────────────┤
│            Hooks + State                    │
│  (25 data hooks + AppContext)               │
├─────────────────────────────────────────────┤
│              Services                       │
│  (Mock API service layer)                   │
├─────────────────────────────────────────────┤
│        Models + Contracts                   │
│  (DTOs, VMs, API types, events, perms)     │
└─────────────────────────────────────────────┘
```

## Component Tree

```
<StrictMode>
  <ProtectedApp>
    <App>
      <AppProvider>
        <AppLayout>
          <Topbar />
          <Sidebar />   ← 26 navigation items
          <main>
            <Routes />  ← Hash-based router
              <Page />  ← Active page component
          </main>
        </AppLayout>
      </AppProvider>
    </App>
  </ProtectedApp>
</StrictMode>
```

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | Entry point, Lemma SDK bootstrap |
| `src/App.tsx` | Root component with Provider + Router |
| `src/routes/index.tsx` | Hash-based routing with parameter extraction |
| `src/layouts/AppLayout.tsx` | App shell with Sidebar + Topbar |
| `src/state/AppContext.tsx` | Global state for admin filters, pagination |
| `src/services/admin-service.ts` | Mock data + API service functions |
| `src/contracts/permissions.ts` | Permission string constants |
| `src/contracts/events.ts` | Event name constants + payload types |
