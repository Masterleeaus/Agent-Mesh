# ResQAI — Architecture

## Overview

ResQAI is a field-service operations platform built on the Lemma pod platform. It consists of 5 React applications, 5 AI agents, 2 Python functions, and a shared SDK layer — all working against a common set of 9 database tables.

## System Diagram

```
┌───────────────────────────────────────────────────────────┐
│                      APPLICATIONS                         │
│  support-queue  │  crm-tracker  │  ops-dashboard          │
│  appointment-board  │  resolution-center                  │
└──────────────────────┬────────────────────────────────────┘
                       │ (Lemma SDK)
┌──────────────────────▼────────────────────────────────────┐
│                     SHARED SDK                             │
│  initLemmaClient()  │  listRecords()  │  runAgent()       │
│  getRecord()  │  createRecord()  │  updateRecord()        │
│  runFunction()  │  logOperation()                         │
└──────────────────────┬────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────┐
│              LEMMA POD (lemma.work)                        │
│                                                           │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐   │
│  │   AGENTS     │  │   FUNCTIONS    │  │    TABLES    │   │
│  │ (5 agents)   │  │ (2 Python)     │  │  (9 tables)  │   │
│  └─────────────┘  └────────────────┘  └──────────────┘   │
└───────────────────────────────────────────────────────────┘
```

## Shared SDK (`packages/sdk/lemma-sdk.ts`)

A centralized wrapper around the `LemmaClient` browser SDK. All applications import from this single module.

**Exported functions (11):**

| Function | Purpose |
|----------|---------|
| `initLemmaClient()` | Loads SDK script, authenticates, configures from env |
| `getClient()` | Returns the initialized client instance |
| `listRecords<T>()` | List records from a table with optional limit/filters |
| `getRecord<T>()` | Get a single record by ID |
| `createRecord()` | Create a new record |
| `updateRecord()` | Update an existing record |
| `bulkUpdateRecords()` | Bulk update multiple records |
| `runAgent()` | Invoke an agent with a prompt |
| `waitForAgentResponse()` | Poll for agent completion (timeout: 135s) |
| `runFunction<T>()` | Execute a server-side function |
| `logOperation()` | Append an entry to `operations_log` |

**Authentication flow:**
1. Set `window.__LEMMA_CONFIG__` from environment variables
2. Load `lemma-client.js` SDK script dynamically
3. Instantiate `LemmaClient` and call `initialize()`
4. If not authenticated on localhost → show error (use CLI token)
5. If not authenticated on production → redirect to OAuth

## Shared Types (`packages/types/index.ts`)

16 TypeScript interfaces shared across all applications:

| Interface | Description |
|-----------|-------------|
| `Customer` | Customer contact info and status |
| `Technician` | Technician skill, availability, rating |
| `Appointment` | Service appointment with date, status, assignment |
| `Ticket` | Support ticket with classification, urgency, draft |
| `Dispute` | Service dispute with claims, evidence, recommendation |
| `Task` | Operational task with priority, owner, due date |
| `Account` | Customer account with health score and relationship status |
| `Followup` | Follow-up item with type, priority, severity |
| `OperationsLogEntry` | Audit trail entry |
| `SlippingFollowupItem` | Overdue/due follow-up with severity classification |
| `AccountHealthScanResult` | Health scan function output |
| `AccountHealthRow` | Per-account health row with risk signals |
| `AccountRiskSignal` | Named risk signal with weight |
| `FlagSlippingFollowupsResult` | Slipping follow-up function output |
| `AgentConversation` | Agent conversation reference |
| `AgentMessage` | Agent message with role and metadata |

## Shared Config (`packages/config/`)

| File | Contents |
|------|----------|
| `constants.ts` | `SERVICE_LABELS`, `STATUS_VARIANTS`, `RESOLUTION_LABELS`, `STATUS_wEIGHT`, `TABLES`, `AGENTS`, `FUNCTIONS` |
| `environment.ts` | `getEnvVar()`, `environment` object (podId, apiUrl, authUrl, appId, clientId) |
| `paths.ts` | `PATHS` object with paths to all project directories |
| `theme.ts` | `THEME` object with colors, spacing, fontSize |

## workspace Layout

```
ResQAI/
├── apps/*              # 5 React + Vite applications
├── agents/             # 5 AI agent definitions
├── functions/          # 2 Python serverless functions
├── database/           # Table schemas, migrations, seed data
├── shared/             # Cross-cutting SDK, types, config, utils
├── scripts/            # Utility scripts (dev, build, test, validate, clean, seed)
├── docs/               # Documentation
├── workflows/          # (empty — reserved)
├── infrastructure/     # (empty — reserved)
└── archive/            # Archived duplicates and superseded reports
```

## Applications

All 5 apps follow the same internal pattern:
- `pages/` — Page-level components
- `components/` — Reusable UI components
- `hooks/` — State management hooks
- `services/` — Data access layer (SDK calls)
- `state/` — React context definitions
- `routes/` — Route exports

See `docs/applications.md` for per-app details.

## Functions

Both Python functions follow the same pattern:
- `handler.py` — Entrypoint, data loading, orchestration
- `logic.py` — Deterministic business logic
- `models.py` — Pydantic input/output models
- `tests/test_logic.py` — Unit tests

See `docs/functions.md` for details.

## Agents

All agents share the same configuration structure:
- `agent.json` — Agent metadata and configuration
- `instruction.md` — System prompt
- `input-schema.json` / `output-schema.json` — JSON Schema contracts
- `permissions.json` — Table read/write permissions
- `tool-access.md` — Tool capabilities
- `workflow-role.md` — workflow integration role
- `README.md` — Human-readable documentation

See `docs/agents.md` for details.

## Database

9 tables with 109 total records. All tables use `enable_rls: false` and `visibility: POD`. See `docs/database.md` for full schema.

## Data Flow

1. **User action** triggers a React component in one of the 5 apps
2. **Service layer** calls the shared SDK (`lemma-sdk.ts`)
3. **SDK** initializes or reuses the `LemmaClient` connection
4. **LemmaClient** sends request to the Lemma pod API
5. **Pod** routes to the appropriate table/agent/function
6. **Response** flows back through the same chain
7. **Hook** updates React state → UI re-renders

Mutations additionally write audit entries to `operations_log` via `logOperation()`.

---

## Detailed Architecture Assessment

*Derived from `docs/ARCHITECTURE_V2.md` (archived).*

### Strengths
- **Modular monorepo** — 5 independent apps sharing dependencies through `packages/`
- **Consistent app pattern** — every app follows the same `components/`, `pages/`, `hooks/`, `services/`, `state/`, `types/` structure
- **Shared types and config** — entity types, lookup tables, agent names centralized in `packages/`
- **Audit trail** — `logOperation()` provides consistent logging across all services

### Weaknesses
| Area | Issue |
|------|-------|
| Duplicate code | ~36 instances of duplicate logic across apps — shared utilities exist but go unused |
| UI components | No shared component library — all apps use raw `style={{}}` with different CSS variables |
| State management | Inconsistent — `appointment-board` uses multiple `useState` calls, others use single state objects |
| Error handling | Every hook duplicates loading/error/try-catch — no shared `useAsync` wrapper |
| Caching | No in-memory cache, SwR, or stale-while-revalidate — parallel fetches hit API redundantly |

### Architecture Score: 5.0/10
| Dimension | Score |
|-----------|-------|
| Modularity | 7 |
| Consistency | 6 |
| Performance | 4 |
| Scalability | 3 |
| Deployability | 2 |
| Maintainability | 6 |
| Testability | 5 |
| Security | 7 |

### Recommended Next Steps
1. Create shared UI component library (Button, Card, Badge, Table)
2. Add pagination to all list queries
3. Create shared `useAsync` hook
4. Centralize status/badge color mappings in `packages/config/constants.ts`
5. Memoize derived state in `useAppointments` 
