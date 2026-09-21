# ResQAI — Applications

## Overview

All 5 applications are React 18 + Vite single-page applications, each serving a distinct operational purpose. They share types via `shared/types/`, the Lemma SDK wrapper via `shared/sdk/`, and configuration via `shared/config/`.

Each app follows the same internal architecture:
- `pages/` — Page-level layout components
- `components/` — UI components
- `hooks/` — React hooks for state management
- `services/` — Data access layer calling the shared SDK
- `state/` — React context definitions
- `routes/` — Route exports

## Application Reference

| App | Purpose | Key Agents/Functions | Unique Features |
|-----|---------|---------------------|-----------------|
| **Support Queue** | Urgency-first ticket triage | `request-classifier`, `support-reply-drafter` | State machine (new → classified → drafted → approved_to_send → sent → closed) |
| **CRM Tracker** | Account health & follow-up alerts | `account-health-monitor`, `account_health_scan`, `flag_slipping_followups` | Health scan panel, slipping alerts |
| **Ops Dashboard** | Morning standup / KPI hub | `operations-coordinator` | Coordinator agent, urgent dispatch |
| **Appointment Board** | Technician scheduling | `operations-coordinator` | AI tech suggestion, grouped sections |
| **Resolution Center** | Dispute resolution | `resolution-advisor` | Evidence panel, recommendation card |

## Build Status

| App | TypeScript | Build | Tests |
|-----|-----------|-------|-------|
| support-queue | ✅ Passes | ✅ Passes | ✅ 9 tests |
| crm-tracker | ✅ Passes | ✅ Passes | ❌ None |
| ops-dashboard | ✅ Passes | ✅ Passes | ❌ None |
| appointment-board | ✅ Passes | ✅ Passes | ❌ None |
| resolution-center | ✅ Passes | ✅ Passes | ❌ None |

All apps pass `tsc --noEmit` and `vite build` with zero errors.

## Detailed Documentation

For per-app details, see:
- `docs/02_Applications/support-queue.md`
- `docs/02_Applications/crm-tracker.md`
- `docs/02_Applications/ops-dashboard.md`
- `docs/02_Applications/appointment-board.md`
- `docs/02_Applications/resolution-center.md`
