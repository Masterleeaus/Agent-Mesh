# ResQAI — Project Structure

## Purpose
This document defines the directory layout for the local ResQAI project,
mirroring every known component from the Lemma pod while keeping a clear
boundary between what can be built now and what must be extracted later.

## Directory Tree

```
resqai-local/
├── database/            # Table schemas, indexes, RLS policies, seed data
│   ├── tables/          # One file per table (columns, types, constraints)
│   ├── policies/        # Row-level-security / authorization rules
│   └── seeds/           # Development seed data stubs
│
├── agents/              # Agent definitions: prompts, tools, configurations
│   ├── request-classifier/
│   ├── support-reply-drafter/
│   ├── operations-coordinator/
│   ├── resolution-advisor/
│   └── account-health-monitor/
│
├── functions/           # Server-side (Edge/Custom) function code
│   ├── account_health_scan/
│   └── flag_slipping_followups/
│
├── apps/                # Front-end surface applications
│   ├── support-queue/
│   ├── ops-dashboard/
│   ├── appointment-board/
│   ├── resolution-center/
│   └── crm-tracker/
│
├── workflows/           # Automation schedules, triggers, multi-step flows
│
├── docs/                # Project documentation (this directory)
│
├── infrastructure/      # Deployment configs, container files, env templates
│
├── scripts/             # Utility scripts (migration, seed, extract, sync)
│
└── shared/              # Cross-cutting types, helpers, constants
    ├── types/
    └── utils/
```

## Current Extraction Status

| Pod Category | Items | Status |
|---|---|---|
| Tables | customers, technicians, tickets, appointments, disputes, tasks, operations_log, accounts, followups | **EXTRACTED** — schemas + records in `database/docs/` |
| Functions | account_health_scan, flag_slipping_followups | **EXTRACTED** — full Python source in `database/docs/` |
| Agents | request-classifier, support-reply-drafter, operations-coordinator, resolution-advisor, account_health_monitor | **SCHEMAS EXTRACTED** — prompts saved to `database/docs/` |
| Apps | support-queue, ops-dashboard, appointment-board, resolution-center, crm-tracker | **NOT EXTRACTED** |
| workflows | _(none in pod)_ | **NOT DEFINED** |

## Principles

1. **No application code yet.** Only folder scaffolding and documentation.
2. **One file per resource** within each subdirectory (e.g., `customers.table.sql`).
3. **Keep the Lemma pod as the source of truth.** All local files are reconstructions until verified against the pod.
4. **Every folder has a purpose.** Empty folders indicate known gaps.
