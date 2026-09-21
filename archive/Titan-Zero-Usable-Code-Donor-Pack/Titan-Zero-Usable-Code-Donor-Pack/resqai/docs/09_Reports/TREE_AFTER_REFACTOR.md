# Project Tree — After Refactor

```
ResQAI/
├── .env.example
├── .gitignore
├── DEPENDENCY_REPORT.md
├── UNUSED_FILES.md
├── CLEANUP_REPORT.md
├── TREE_AFTER_REFACTOR.md
├── REMAINING_wORK.md
├── PROJECT_HEALTH.md
├── package.json
├── ResQAI.code-workspace
│
├── agents/
│   ├── account-health-monitor/        [agent.json, schemas, instructions]
│   ├── operations-coordinator/        [agent.json, schemas, instructions]
│   ├── request-classifier/            [agent.json, schemas, instructions]
│   ├── resolution-advisor/            [agent.json, schemas, instructions]
│   └── support-reply-drafter/         [agent.json, schemas, instructions]
│
├── apps/
│   ├── appointment-board/             [React + Vite]
│   ├── crm-tracker/                   [React + Vite]
│   ├── ops-dashboard/                 [React + Vite]
│   ├── resolution-center/             [React + Vite]
│   └── support-queue/                 [React + Vite + Vitest]
│
├── archive/
│   └── apps/
│       └── shared/                    [moved — duplicate of root shared/]
│
├── database/
│   ├── docs/                          [JSON seed data for 11 tables]
│   └── migrations/
│       └── 001_tickets_add_status_values_and_column.sql
│
├── docs/
│   ├── architecture/                  [5 doc files]
│   ├── implementation/                [1 doc file]
│   ├── recovery/                      [2 doc files]
│   └── validation/                    [7 doc files]
│   └── README.md
│
├── functions/
│   ├── account-health-scan/           [Python — handler, logic, models, tests]
│   └── flag-slipping-followups/       [Python — handler, logic, models, tests]
│
├── infrastructure/                    [empty — reserved]
│
├── scripts/
│   ├── build.ts                       [Build all/specific app]
│   ├── clean.ts                       [Clean build artifacts]
│   ├── dev.ts                         [Start dev server]
│   ├── seed.ts                        [List seed data]
│   ├── test.ts                        [Run all tests]
│   └── validate.ts                    [Type-check all apps]
│
├── shared/
│   ├── config/                        [constants, environment, paths, theme]
│   ├── sdk/                           [lemma-sdk.ts — Lemma client wrapper]
│   ├── types/                         [All TypeScript interfaces]
│   └── utils/                         [date, filtering, number, sorting, string]
│
└── workflows/                         [empty — reserved]
```

## Totals

- **Agents**: 5
- **Applications**: 5
- **Functions**: 2 (Python)
- **Database tables**: 9 (recovered)
- **Scripts**: 6
- **Shared modules**: 4 (config, sdk, types, utils)
