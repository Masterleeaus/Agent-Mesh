# ResQAI V2 — Shared Components Catalog

## Overview

Complete catalog of shared components from `shared/src/components/`, `shared/src/layouts/`, and `shared/src/navigation/`. Each entry defines the **component interface**, **consuming apps**, **cross-application usage context**, and **extension points**.

---

## 1. Shared UI Components (`shared/src/components/`)

| Component | File | Props Interface | Apps Using | Cross-App Use Case |
|---|---|---|---|---|
| **Button** | `Button/` | `ButtonProps` { variant, size, loading, disabled, onClick, children } | ALL | Cross-app navigation triggers, form submission |
| **Input** | `Input/` | `InputProps` { size, error, placeholder, value, onChange } | ALL | Search bars, forms |
| **Dropdown** | `Dropdown/` | `DropdownProps` { options, value, onChange, multi } | ALL | Cross-app entity selectors |
| **Card** | `Card/` | `CardProps` { padding, variant, onClick, children } | ALL | Dashboard widgets, entity cards |
| **Table** | `Table/` | `TableProps` { columns, rows, sortable, filterable, onRowClick } | ALL | Cross-app data drill-down tables |
| **Dialog** | `Dialog/` | `DialogProps` { open, onClose, title, size, children } | ALL | Cross-app confirmation dialogs |
| **Form** | `Form/` | `FormProps` { fields, sections, onSubmit, validation } | ALL | Cross-entity forms |
| **SearchBar** | `SearchBar/` | `SearchBarProps` { value, onChange, onSearch, placeholder } | ALL | Global cross-app search trigger |
| **Filter** | `Filter/` | `FilterProps` { groups, activeFilters, onChange } | ALL | Cross-app filter synchronization |
| **StatusBadge** | `StatusBadge/` | `StatusBadgeProps` { status, variant, size } | ALL | Status display for cross-app entities |
| **Tabs** | `Tabs/` | `TabsProps` { tabs, activeTab, onChange } | ALL | Cross-app detail view navigation |
| **Pagination** | `Pagination/` | `PaginationProps` { page, totalPages, onChange } | ALL | Cross-app list pagination |
| **Navigation** | `Navigation/` | `NavigationProps` { items, activePath, onNavigate } | ALL | In-app navigation sidebar |
| **Sidebar** | `Sidebar/` | `SidebarProps` { items, collapsed, onToggle } | ALL | Application sidebar |
| **Topbar** | `Topbar/` | `TopbarProps` { navItems, userInfo, onNav } | ALL | Top navigation bar |
| **Loader** | `Loader/` | `LoaderProps` { size, variant } | ALL | Cross-app data loading |
| **Skeleton** | `Skeleton/` | `SkeletonProps` { width, height, count } | ALL | Cross-app loading skeleton |
| **EmptyState** | `EmptyState/` | `EmptyStateProps` { title, description, action } | ALL | Cross-app empty data states |
| **ErrorState** | `ErrorState/` | `ErrorStateProps` { error, onRetry } | ALL | Cross-app error handling |
| **Notification** | `Notification/` | `NotificationProps` { toast, variant, onDismiss } | ALL | Cross-app notification display |
| **NotificationCenter** | `Notification/` | `NotificationCenterProps` { notifications, onDismiss } | ALL | Cross-app notification aggregation |
| **ProgressIndicator** | `ProgressIndicator/` | `ProgressIndicatorProps` { value, max, label } | ALL | Job/appointment progress |
| **Card** (multi-variant) | `Card/` | extended | ALL | Metric cards, detail cards |

---

## 2. Shared Layouts (`shared/src/layouts/`)

| Layout | File | Props Interface | Apps Using | Cross-App Use Case |
|---|---|---|---|---|
| **DashboardLayout** | `DashboardLayout/` | `DashboardLayoutProps` { sidebar, topbar, widgets } | ALL (9/9) | All dashboard pages |
| **DetailLayout** | `DetailLayout/` | `DetailLayoutProps` { entity, sections, actions, breadcrumbs } | ALL (9/9) | Detail views (ticket, appointment, case, etc.) |
| **SplitLayout** | `SplitLayout/` | `SplitLayoutProps` { left, right, defaultRatio } | ALL (9/9) | Side-by-side views (queue + detail) |
| **TableLayout** | `TableLayout/` | `TableLayoutProps` { toolbar, table, pagination, filters } | ALL (9/9) | List/table pages |
| **WizardLayout** | `WizardLayout/` | `WizardLayoutProps` { steps, currentStep, onNext, onBack } | 6/9 (create flows) | Multi-step creation wizards |

---

## 3. Shared Navigation Components (`shared/src/navigation/`)

| Component | File | Props Interface | Apps Using | Cross-App Use Case |
|---|---|---|---|---|
| **ApplicationSwitcher** | `ApplicationSwitcher/` | `{ apps, currentAppId, onSelect }` | ALL (9/9) | Primary cross-app navigation dropdown |
| **Breadcrumbs** | `Breadcrumbs/` | `{ items, separator, maxItems }` | ALL (9/9) | Cross-app breadcrumb trail |
| **TopNavigation** | `TopNavigation/` | `{ items, activeId, onNavigate }` | ALL (9/9) | Top-level nav bar |
| **Sidebar** | `Sidebar/` | `{ items, collapsed, onToggle, onNav }` | ALL (9/9) | Application sidebar |
| **RoleAwareNav** | `RoleAwareNav/` | `{ items, roles, permissions, fallback }` | ALL (9/9) | Role-based nav filtering |

---

## 4. Cross-Application Component Contracts

### ApplicationSwitcher Configuration

```typescript
// Each app embeds ApplicationSwitcher in its AppLayout
// The switcher renders all 9 V2 apps and handles cross-app navigation

interface AppLink {
  id: string;            // e.g. 'support-center_v2'
  label: string;         // e.g. 'Support Center'
  icon?: JSX.Element;    // App icon
  description?: string;  // Tooltip text
  badge?: number;        // Notification count
  disabled?: boolean;    // Disabled state
  url?: string;          // Deep link URL
}
```

### Breadcrumb Contract for Cross-App Navigation

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;         // Cross-app href: `../target-app/index.html#/route`
  icon?: JSX.Element;
}

// When navigating from support-center to crm-center:
// [ Support Center › Ticket #123 › Customer: Acme Corp ]
// The middle item href navigates back to support-center ticket
```

### Cross-App Entity Link Component

```typescript
// NEW shared component to be used across ALL apps:
interface EntityLinkProps {
  entityType: 'ticket' | 'appointment' | 'operation' | 'job' | 'case' | 'account' | 'user';
  entityId: string;
  label?: string;
  sourceApp?: string;   // Current app identifier
}

// Renders as a clickable link that navigates to the canonical entity page
// in the appropriate source app, preserving context via query params
```

---

## 5. Shared Component Usage by Application

| App | Layout Primary | Nav Primary | Key Shared Components |
|---|---|---|---|
| support-center_v2 | SplitLayout, TableLayout | Sidebar + ApplicationSwitcher | StatusBadge, Filter, SearchBar, Pagination, Table |
| appointment-center_v2 | DashboardLayout, TableLayout | Sidebar + ApplicationSwitcher | Calendar (app-specific), StatusBadge, Filter, Card |
| operations-center_v2 | DashboardLayout, SplitLayout | Sidebar + ApplicationSwitcher | StatusBadge, ProgressIndicator, Filter, Table |
| technician-portal_v2 | DashboardLayout, DetailLayout | Sidebar + ApplicationSwitcher | StatusBadge, ProgressIndicator, Loader, Card |
| resolution-center_v2 | SplitLayout, DetailLayout | Sidebar + ApplicationSwitcher | StatusBadge, Filter, SearchBar, Table, Tabs |
| crm-center_v2 | DashboardLayout, DetailLayout | Sidebar + ApplicationSwitcher | StatusBadge, SearchBar, Filter, Card, Table |
| analytics-center_v2 | DashboardLayout | Sidebar + ApplicationSwitcher | Chart (app-specific), Card, Filter, Table, Tabs |
| customer-portal_v2 | DashboardLayout, DetailLayout | Sidebar + ApplicationSwitcher | StatusBadge, Card, SearchBar, ProgressIndicator |
| admin-center_v2 | TableLayout, DetailLayout | Sidebar + ApplicationSwitcher | StatusBadge, Table, Filter, Dialog, SearchBar |

---

## 6. Extension Points for Cross-App Integration

| Component | Extension | Purpose |
|---|---|---|
| **Table** | `onRowClick` → `buildCrossAppUrl()` | Navigate to entity detail in source app |
| **StatusBadge** | Click handler → navigate to entity timeline | Show cross-app status context |
| **Card** | `actions` slot → cross-app action buttons | Trigger operations in other apps |
| **Notification** | Click → navigate to source app detail | Cross-app notification to action |
| **SearchBar** | `onSearch` → cross-app search bridge | Federated search across apps |
| **Filter** | `onChange` → shared filter state | Cross-app filter synchronization |
| **Breadcrumbs** | Items include cross-app hrefs | Navigate back to calling app |
| **Dialog** | Cross-app confirmation flows | Execute operations in another app |
