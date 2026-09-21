# CRM Tracker

## Purpose

Account health and follow-up tracking. Surfaces slipping follow-ups, runs health scans via deterministic Python functions, and provides a filtered, sortable view of all accounts by health status.

## Current Status

✅ Build-ready — passes `tsc --noEmit` and `vite build`
✅ Validated against Lemma pod data
❌ No unit tests
⚠️ Requires Lemma SDK authentication (blocked on auth redirect fix)

## Tables Used

| Table | Usage |
|-------|-------|
| `accounts` | Account records with health score, relationship status, metadata |
| `followups` | Follow-up items per account |
| `customers` | Customer names for alert display |

## Agents Used

| Agent | Trigger | Purpose |
|-------|---------|---------|
| `account-health-monitor` | "Run health scan" button | CRM health lead — calls both functions, creates tasks |

## Functions Used

| Function | Purpose |
|----------|---------|
| `account_health_scan` | Scans accounts, computes health scores, writes back |
| `flag_slipping_followups` | Identifies overdue and due-soon follow-ups |

## Data Flow

1. On mount, `useCrm` hook fetches accounts and followups in parallel
2. Accounts list is filterable by health status, sorted by severity (critical first)
3. "Run health scan" calls `account_health_scan`, then `flag_slipping_followups`, then refreshes all data
4. Slipping follow-up alerts are displayed in the right column, clickable to select associated account
5. Selecting an account shows detail panel with follow-ups table

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `StatsRow` | 6 KPI stat cards (critical, slipping, watch, healthy, overdue, open) |
| `FilterBar` | Health filter chips (all, healthy, watch, slipping, critical) |
| `AccountList` | Filtered/sorted account cards |
| `AccountDetail` | Account detail panel with follow-ups table |
| `SlippingAlerts` | Color-coded slipping follow-up alerts |
| `HealthScanPanel` | Agent panel with Run Health Scan button and results |

## Known Limitations

- No automated scheduling for health scans (must be triggered manually)
- No historical health score tracking (only current snapshot)
- No email notifications for critical accounts
- No batch customer outreach tools

## Future Improvements

- Scheduled nightly health scans
- Health score history and trends view
- Email/SMS alerts for critical account changes
- Bulk follow-up actions (mark complete, reassign)
- Integration with email marketing for win-back campaigns
