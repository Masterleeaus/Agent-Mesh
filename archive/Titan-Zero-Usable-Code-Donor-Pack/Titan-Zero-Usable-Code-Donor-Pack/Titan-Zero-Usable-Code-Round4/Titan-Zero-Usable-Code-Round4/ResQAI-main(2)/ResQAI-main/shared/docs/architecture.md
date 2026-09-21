# Shared Foundation — Architecture

## Overview

The `shared/` package (`@resqai/foundation`) is the platform foundation for all ResQAI V2 applications. It provides the design system, component library, layout system, navigation, permissions, state management, API client, event system, and utilities that every application depends on.

```
┌─────────────────────────────────────────────────────┐
│                    Applications                      │
│  appointment-board  crm-tracker  ops-dashboard ...  │
└───────────────────────┬─────────────────────────────┘
                        │ depends on
┌───────────────────────▼─────────────────────────────┐
│              @resqai/foundation (shared)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Design   │ │Components│ │ Layouts  │ │  Nav   │ │
│  │  System   │ │  (20+)   │ │   (5)    │ │  (5)   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Perms    │ │  State   │ │   API    │ │Events  │ │
│  │ (4 guards)│ │ (6 providers)│ │ (6 modules)│ │ (5 types)│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │                   Utils (6)                      │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| **design-system** | Theme tokens (colors, typography, spacing, elevation, borders, radius, animation, breakpoints), ThemeProvider, theme-aware style generator |
| **components** | 20+ reusable UI components (Button, Input, Card, Table, Dialog, Form, etc.) |
| **layouts** | Page-level layout components (Dashboard, Split, Detail, Wizard, Table) |
| **navigation** | Navigation components (AppSwitcher, Breadcrumbs, Sidebar, TopNav, RoleAwareNav) |
| **permissions** | Declarative access control (RoleGuard, PermissionGuard, FeatureGuard, ApplicationGuard) |
| **state** | React Context-based state providers (Global, Auth, User, Organization, Theme, Notification) |
| **api** | HTTP client with error handling, retries, auth middleware, request queue, caching |
| **events** | Typed event bus for cross-application communication (app, workflow, agent, notification events) |
| **utils** | Validation, formatting, date, search, logging, configuration |

## Dependency Graph

```
design-system  (no internal dependencies)
  └── components  (depends on design-system tokens)
  └── layouts     (depends on design-system tokens)
  └── navigation  (depends on components, design-system)
  └── permissions (depends on no UI, pure logic)
  └── state       (depends on design-system ThemeProvider)
  api             (no internal dependencies, pure TypeScript)
  events          (no internal dependencies, pure TypeScript)
  utils           (no internal dependencies, pure TypeScript)
```

## Key Design Decisions

1. **CSS Custom Properties** — All styling uses `var(--name, fallback)` for theme-agnostic component code. The ThemeProvider sets these on the document.

2. **Inline Styles** — No CSS-in-JS library, no CSS modules, no Tailwind. Every component uses React `style` objects. This eliminates build complexity and keeps components self-contained.

3. **React Context** — State management uses React Context + hooks. No Redux, no Zustand. Each domain (auth, user, org, etc.) gets its own context for granular subscriptions.

4. **Slot Pattern** — Layouts use React children/slots rather than routing. Applications compose layouts with their own content.

5. **Typed Events** — The EventBus uses mapped event types for type-safe emit/subscribe. Each domain (app, workflow, agent, notification) has a typed event map.

6. **No Build Step** — Like V1 packages, shared/ is imported as raw TypeScript source. Vite handles transpilation in each application.

## Testing Strategy

- **Unit tests** for utilities, API modules, event bus, state providers
- **Component tests** with @testing-library/react for each UI component
- **Integration tests** for state + component interactions
- **Visual regression** for design system tokens
