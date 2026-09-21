# Resolution Center

Service disputes management app for the ResQAI platform.

## Features

- **KPI Dashboard** — Three metric cards showing awaiting approval count, total open disputes, and resolved count
- **Dispute List** — Sortable table (by status priority) showing status badge, customer name + service type + date, recommended resolution, confidence bar with color-coded thresholds, and age
- **Evidence Panel** — 3-column grid displaying customer claim, provider claim, and evidence summary
- **AI Recommendations** — Card showing AI-generated resolution type, confidence bar (red < 60%, yellow < 85%, green >= 85%), and reasoning text
- **Action Buttons**:
  - **Analyze (AI)** — Invokes the `resolution-advisor` agent on open disputes
  - **Approve resolution** — Marks dispute approved and updates customer status
  - **Reject** — Sets status to rejected
  - **Close dispute** — Sets status to closed
  - **Override resolution** — Textarea for override notes, logs to operations_log

## Setup

1. Ensure the Lemma SDK is loaded on the page (`LemmaClient` in `window`)
2. The component auto-initializes on mount
3. Navigation uses anchor tags — configure routing at the app shell level

## Dependencies

- React 18+
- `../../shared/types` — Shared type definitions
- `../../shared/lemma-sdk` — Lemma client wrapper for data access

## Usage

```tsx
import { ResolutionCenterRoutes } from './routes';

// In your router:
<Route path="/resolution-center" element={<ResolutionCenterRoutes />} />
```
