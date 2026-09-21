# CRM Tracker

Account health and follow-up tracking for ResQAI.

## Features

- **Stats row** — Quick KPI overview: critical, slipping, watch, healthy accounts plus overdue and open follow-up counts.
- **Account list** — Filterable by health status (`all`, `healthy`, `watch`, `slipping`, `critical`, `at_risk`, `in_dispute`, `dormant`). Cards sorted by health priority (critical first). Shows name, service/relationship/health badges, score, and meta info (last contact, disputes, follow-ups).
- **Slipping follow-up alerts** — Color-coded by severity (critical/high/medium/low), showing customer name, subject, type, priority, owner, bucket, and days. Clickable to select the associated account.
- **Account detail panel** — Full account info (status, relationship, service type, health score, dates, dispute/follow-up counts, lifetime revenue, owner, notes) plus a follow-ups table with status badges.
- **Health scan panel** — "Run health scan" button triggers `account_health_scan` then `flag_slipping_followups`, refreshes all data, and displays scan summary with top risk accounts.
- **Toolbar** — User pill with animated pulse dot, "Run health scan" primary button, "Refresh" button.

## Theme

warm/light theme (not dark):

| Variable   | Value    |
|------------|----------|
| `--paper`  | `#f8f5ee` |
| `--card`   | `#fffefa` |
| `--ink`    | `#1a1813` |
| `--muted`  | `#6b6353` |
| `--gold`   | `#c9a227` |
| `--good`   | `#5c7a53` |
| `--warn`   | `#c2683f` |
| `--danger` | `#a23b3b` |
| `--line`   | `#e7e0cf` |

Fonts: **Fraunces** (serif) for headings, **Plus Jakarta Sans** for body, **JetBrains Mono** for numbers.

## Tables queried

- `accounts` — Account records with health scores and metadata
- `followups` — Follow-up items per account
- `customers` — Customer names for alert display

## Functions called

- `account_health_scan` — Scans accounts, computes/writes health scores
- `flag_slipping_followups` — Identifies overdue/due-soon follow-ups

## Agent invoked

- `account_health_monitor` — Health scan panel agent

## Usage

1. Open the CRM Tracker page.
2. Browse accounts in the left panel, filter by health status.
3. Click an account card to see its detail and follow-ups on the right.
4. Click slipping alert cards to jump to that account.
5. Click **Run health scan** to trigger a full scan cycle.
6. Click **Refresh** to reload data without scanning.

## Development

```bash
# Serve locally (via the ResQAI app shell)
npm run dev
```
