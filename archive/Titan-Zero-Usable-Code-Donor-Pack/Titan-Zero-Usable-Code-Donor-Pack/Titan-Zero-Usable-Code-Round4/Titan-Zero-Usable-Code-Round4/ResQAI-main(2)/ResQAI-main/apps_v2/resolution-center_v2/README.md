# Resolution Center V2

Enterprise dispute and resolution management application for ResQAI V2.

## Overview

Resolution Center V2 handles the complete resolution lifecycle: reviewing completed work, resolving customer issues, handling disputes, approving technician reports, managing escalations, and officially closing service requests.

## Pages (14)

| Page | Route | Description |
|---|---|---|
| Resolution Dashboard | `#/` | Summary dashboard with metric widgets |
| Pending Resolutions | `#/pending` | Pending resolution reviews |
| Dispute Queue | `#/disputes` | Active dispute queue with filters |
| Case Details | `#/disputes/:id` | Detailed case view with tabs |
| Evidence Review | `#/cases/:id/evidence` | Evidence review for a case |
| Technician Report Review | `#/cases/:id/technician-report` | Review and approve/reject technician reports |
| Customer Complaint Review | `#/cases/:id/complaint` | Review customer complaints |
| Approval Queue | `#/approvals` | Approve or reject resolution proposals |
| Escalation Review | `#/escalations` | Review escalated cases |
| Resolution History | `#/history` | Resolved and closed case history |
| Closed Cases | `#/closed` | Closed case archive |
| Knowledge Base | `#/knowledge-base` | Knowledge base articles |
| Reports | `#/reports` | Analytics and reporting |
| Search | `#/search` | Global search |

## Tech Stack

- React 18, TypeScript, Vite
- Inline styles (no Tailwind/CSS modules)
- Hash-based routing (no React Router)
- Shared component library at `../../../shared/src`

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  models/        — DTOs, view models, API types
  contracts/     — Event and permission constants
  services/      — Mock resolution service
  state/         — AppContext provider
  hooks/         — Data fetching hooks (10 hooks)
  components/    — Reusable UI components (7 components)
  pages/         — Route-level page components (14 pages)
  layouts/       — AppLayout (topbar + sidebar)
  routes/        — Hash-based route definitions
widgets/         — Standalone widget components (7 widgets)
docs/            — Architecture, navigation, component tree, and implementation docs
```
