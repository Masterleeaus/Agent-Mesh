# Layouts

Reusable page layout components for consistent application structure.

## Available Layouts

- **DashboardLayout** — sidebar + topbar + content area (standard app shell)
- **SplitLayout** — resizable left/right or top/bottom split panes
- **DetailLayout** — detail/record view with breadcrumbs, header, tabs, sidebar
- **WizardLayout** — multi-step form wizard with step progress indicator
- **TableLayout** — data table page with search, filters, actions, pagination

## Architecture

Each layout uses a slot-based pattern (React children/slots) rather than routing. The consuming application composes the layout with the appropriate child components.

## Dependencies

- React 18+
- `@resqai/foundation` design system tokens
