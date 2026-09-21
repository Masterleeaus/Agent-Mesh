# ResQAI V2 — Developer Handbook

> **Version:** 2.0  
> **Last Updated:** 2026-06-30  
> **Audience:** All engineers contributing to ResQAI V2

---

## Table of Contents

1. [Architecture Rules](#1-architecture-rules)
2. [Folder Structure](#2-folder-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Coding Standards](#4-coding-standards)
5. [Git Strategy](#5-git-strategy)
6. [Branch Strategy](#6-branch-strategy)
7. [Pull Request Rules](#7-pull-request-rules)
8. [Code Review Rules](#8-code-review-rules)
9. [Testing Rules](#9-testing-rules)
10. [Deployment Rules](#10-deployment-rules)
11. [Contribution Rules](#11-contribution-rules)
12. [Compliance & Enforcement](#12-compliance--enforcement)

---

## 1. Architecture Rules

### 1.1 System Topology

ResQAI V2 is built on the **Lemma Platform** — a serverless, multi-tenant PaaS. The architecture follows a strict layered model:

```
┌──────────────────────────────────────────────────────────────┐
│                     Applications (React SPA)                  │
│  support-center_v2  |  ops-center_v2  |  customer-portal_v2  │
│  admin-center_v2    |  crm-center_v2  |  analytics-center_v2 │
│  appointment-center_v2 | resolution-center_v2 | tech-portal  │
├──────────────────────────────────────────────────────────────┤
│                     Shared Packages (@resqai/*)               │
│  ui  |  types  |  utils  |  config  |  sdk  |  errors        │
├──────────────────────────────────────────────────────────────┤
│                     Shared Library (shared/)                  │
│  design-system  |  events  |  layouts  |  navigation         │
│  permissions    |  state                                      │
├──────────────────────────────────────────────────────────────┤
│              AI Agents (Lemma Agent Runtime)                  │
│  request-classifier | support-reply-drafter | ops-coordinator │
│  resolution-advisor | account-health-monitor                  │
├──────────────────────────────────────────────────────────────┤
│              Workflows (Lemma Workflow Engine)                │
│  ticket-intake | dispute-resolution | appointment-assignment  │
│  urgent-dispatch | followup-detector | ...12 total            │
├──────────────────────────────────────────────────────────────┤
│           Python Functions (Lemma Serverless Runtime)          │
│  66 functions across: support | crm | appointments | ops     │
│  resolution | notifications | analytics | admin | auth        │
├──────────────────────────────────────────────────────────────┤
│            Database Tables (Lemma Datastore + RLS)            │
│  41 v2 migrations | 36+ tables | row-level security           │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Layer Rules

| Rule | Description |
|------|-------------|
| **Strict downward dependency** | Apps → Packages → Functions → Tables. Never the reverse. Functions never import from apps or packages. |
| **No circular dependencies** | Package A cannot depend on Package B if B depends on A. CI enforces this. |
| **API contracts first** | All inter-layer contracts (types, event schemas, function I/O) must be agreed before implementation. Frontend and backend can then build in parallel. |
| **RLS is mandatory** | Every table has `org_id` for multi-tenant isolation. Row-Level Security is enforced at the database layer. |
| **Event-driven communication** | Cross-component communication uses the Lemma Event Bus. Direct function-to-function calls are for read operations only. Mutations must emit events. |
| **Idempotency** | All write operations (WRI functions) are idempotent. Replaying the same event produces the same result. |
| **Circuit breakers** | Every external connector (Twilio, SendGrid, OpenAI, etc.) implements a circuit breaker: 5 failures → open circuit → 30s recovery → half-open → closed on success. |
| **AI drafts, humans approve** | Agents produce recommendations only. No agent takes destructive action autonomously. Human approval is required for all mutations. |

### 1.3 Application Architecture

Each v2 app is a standalone Vite + React SPA following the same internal structure:

```
src/
├── pages/          # Route-level page components (one per route)
├── components/     # App-specific UI components
├── hooks/          # Custom React hooks
├── services/       # API call layer (wraps lemma-sdk)
├── contracts/      # Events, permissions, types local to the app
├── models/         # DTOs, API request/response types
├── layouts/        # Page layout wrappers
├── routes/         # React Router route definitions
├── state/          # Zustand stores (minimal)
└── widgets/        # Dashboard tile components (self-contained)
```

### 1.4 Function Architecture

Each Python function follows a strict internal structure:

```
{function_name}.py
├── handler()          # Entry point — called by Lemma runtime
├── validate_input()   # Pydantic or manual validation
├── execute()          # Core business logic
├── format_response()  # Standard response envelope
└── _helpers()         # Private utility functions (prefixed _)
```

---

## 2. Folder Structure

### 2.1 Actual Repository Layout

```
ResQAI/
├── .github/workflows/ci.yml       # CI pipeline
├── agents/                         # AI agent definitions (JSON + Markdown)
│   ├── request-classifier/
│   ├── support-reply-drafter/
│   ├── operations-coordinator/
│   ├── resolution-advisor/
│   ├── account-health-monitor/
│   └── tech-suggester/
├── apps/                           # V1 frontends (React + Vite)
│   ├── appointment-board/
│   ├── crm-tracker/
│   ├── ops-dashboard/
│   ├── resolution-center/
│   └── support-queue/
├── apps_v2/                        # V2 frontends (same stack, new naming)
│   ├── admin-center_v2/
│   ├── analytics-center_v2/
│   ├── appointment-center_v2/
│   ├── crm-center_v2/
│   ├── customer-portal_v2/
│   ├── operations-center_v2/
│   ├── resolution-center_v2/
│   ├── support-center_v2/
│   └── technician-portal_v2/
├── database/                       # DB migrations, seeds, lookup data
│   ├── migrations/                 # V1 migration
│   ├── migrations_v2/              # 41 numbered SQL migrations
│   ├── rollbacks_v2/               # 41 matching rollbacks
│   ├── seeds/                      # V1 seed data (JSON)
│   ├── seeds_v2/                   # V2 demo seed data (JSON)
│   └── lookup_data/                # Reference data, settings, roles, perms
├── docs/                           # All documentation
│   ├── v2/standards/               # Engineering standards (10 docs)
│   ├── v2/architecture/            # System architecture docs
│   ├── v2/database/                # ERD, schema, state machine
│   ├── v2/events/                  # Event catalog, lifecycle
│   ├── security/                   # Auth, RBAC, token policy
│   └── ...                         # (See docs/README.md)
├── functions/                      # 66 Python serverless functions
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── shared/                     # Shared test utilities
│   └── {domain}_{action}_{entity}/ # Per-function directories
├── integration/                    # Cross-app integration reports
├── packages/                       # Shared npm packages
│   ├── config/                     # Theme, paths, environment, constants
│   ├── sdk/                        # lemma-sdk wrapper, ProtectedApp
│   ├── types/                      # Shared TypeScript types
│   ├── ui/                         # Shared UI components (Button, Card, etc.)
│   └── utils/                      # String, date, number, sorting, filtering
├── scripts/                        # Build, dev, test, seed tooling
├── shared/                         # Shared library (TS)
│   ├── design-system/              # Tokens, ThemeProvider
│   ├── events/                     # EventBus, application/agent/workflow events
│   ├── layouts/                    # Dashboard, Detail, Split, Table, Wizard
│   ├── navigation/                 # Sidebar, TopNav, Breadcrumbs, AppSwitcher
│   ├── permissions/                # PermissionGuard, RoleGuard, FeatureGuard
│   └── state/                      # Auth, Global, Organization, Theme, User
├── workflows/                      # 12 Lemma workflow definitions (JSON)
├── .editorconfig
├── .eslintrc.json
├── .github/workflows/ci.yml
├── .gitignore
├── .npmrc
├── .nvmrc                          # Node 22
├── .prettierrc
├── package.json                    # Root workspace config
├── tsconfig.json                   # Root TypeScript config
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                         # MIT
└── README.md
```

### 2.2 Required Files Per Directory

| Directory | Required Files |
|-----------|----------------|
| Root | `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `README.md`, `CONTRIBUTING.md` |
| Package (`packages/*`) | `package.json`, `tsconfig.json`, `src/index.ts` (barrel), `tests/` |
| App (`apps/*_v2/`) | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `README.md`, `.env.example` |
| Function (`functions/*/`) | `{name}.py`, `tests/test_{name}.py`, `function.json`, `schemas/` |
| Agent (`agents/*/`) | `agent.json`, `instruction.md`, `input-schema.json`, `output-schema.json`, `permissions.json`, `README.md` |

### 2.3 File Organization Rules

- **One thing per file** — One React component, one function, one type (or closely related group).
- **Max file length** — 300 lines (TypeScript), 400 lines (Python), 200 lines (SQL), 500 lines (Markdown).
- **Co-locate tests** — `{name}.test.tsx` sits next to `{name}.tsx`.
- **Barrel exports** — Every directory has an `index.ts` that re-exports only the public API.
- **No barrel exports for tests** — Tests import directly from the source file.

---

## 3. Naming Conventions

### 3.1 General Rules

| Construct | Convention | Example |
|-----------|-----------|---------|
| TypeScript identifiers | `camelCase` | `getTicketById` |
| TypeScript types/components | `PascalCase` | `TicketStatusBadge` |
| Constants (compile-time) | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Python identifiers | `snake_case` | `get_ticket_by_id` |
| Python classes | `PascalCase` | `ValidationError` |
| Database tables | `snake_case` | `v2_core_tickets` |
| Database columns | `snake_case` | `ticket_id`, `created_at` |
| Files/directories | `kebab-case` | `support-center_v2/` |
| Environment variables | `UPPER_SNAKE_CASE` | `RESQAI_DB_HOST` |
| Events | dot-separated | `v2.core.ticket.created` |
| Permissions | colon-separated | `v2:ticket:read:ticket` |

### 3.2 Domain-Specific Naming

| Resource | Pattern | Example |
|----------|---------|---------|
| App | `{domain}-{purpose}_v2` | `support-center_v2` |
| Package | `resqai-{purpose}` | `resqai-types` |
| Table | `v2_{domain}_{entity}` | `v2_core_tickets` |
| Function | `v2_{domain}_{action}_{entity}` | `v2_core_det_ticket` |
| Agent | `v2_{domain}_{role}_agent` | `v2_ticket_agent` |
| Workflow | `v2_{domain}_{action}_{entity}_wf` | `v2_core_create_ticket_wf` |
| Connector | `v2_{provider}_connector` | `v2_twilio_connector` |
| Component | `{Domain}{ComponentName}` | `TicketStatusBadge` |
| Widget | `{Domain}{Purpose}Widget` | `TicketSummaryWidget` |
| Layout | `{LayoutType}Layout` | `DashboardLayout` |
| Notification | `v2_{channel}_{template}` | `v2_email_ticket_assigned` |

### 3.3 Function Action Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `det_` | Read / GET | `v2_core_det_ticket` |
| `wri_` | Write / CREATE / UPDATE | `v2_core_wri_ticket` |
| `agg_` | Aggregate / statistics | `v2_core_agg_ticket_metrics` |
| `orc_` | Orchestrate / dispatch | `v2_core_orc_dispatch_technician` |
| `tra_` | Transform / format | `v2_notification_tra_format_sms` |

### 3.4 Prohibited Names

Never use: `data`, `info`, `temp`, `tmp`, `stuff`, `misc`, `util` as standalone names (too vague). Never use single-letter identifiers except `i`, `j`, `k` for loop indices.

---

## 4. Coding Standards

### 4.1 General Rules

- **Formatting:** Spaces, 2-space indent (4-space for Python). LF line endings. UTF-8. Max 100 char line length. No trailing whitespace. Trailing newline at EOF.
- **Enforcement:** ESLint + Prettier (TS/JS), ruff (Python). CI fails on violations.
- **No `eslint-disable` or `# noqa`** without an inline explanation comment.

### 4.2 Prohibited Patterns

| Pattern | Alternative |
|---------|-------------|
| `any` type | `unknown` with proper narrowing |
| `eval()` | Never |
| `// @ts-ignore` | `// @ts-expect-error` with justification |
| `console.log` in production | Logger (`logger.info`, etc.) |
| `process.env` direct access | Config loader (`packages/config`) |
| Magic numbers | Named constants |
| Deeply nested ternaries (> 1 level) | `if`/`else` or extracted function |
| `TODO` without ticket reference | `TODO(PROJ-###): description` |
| Global mutable state | Zustand store or context |

### 4.3 TypeScript Standards

- **Types over interfaces** — Prefer `type` for most declarations. Use `interface` only for extendable contracts (e.g., `PaginatedResponse<T>`).
- **Strict mode** — `tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **Null safety** — Use optional chaining (`?.`) and nullish coalescing (`??`). Never `if (x) return x` patterns.
- **Function signatures** — Named parameters (destructured object) for 2+ params.
- **`as const` objects over `enum`** — `const TicketStatus = { OPEN: 'open' } as const` + `type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]`.

### 4.4 React Standards

- **One hook per concern** — Custom hooks return named objects, never tuples.
- **No premature optimization** — `React.memo`, `useMemo`, `useCallback` only when profiling proves need.
- **Component props** — Defined as a `type` named `{ComponentName}Props` in the same file.
- **State management** — React Query (server state), Zustand (client state), URL params (route state).

### 4.5 Python Standards

- **PEP 8** enforced by ruff.
- **Type hints required** on all function signatures (parameters and return).
- **Docstrings:** Google style.
- **Function files** have one `handler()` entry point called by Lemma runtime.
- **Private helpers** prefixed with `_`.

### 4.6 Import Order

**TypeScript:**
```
1. Node built-ins     import path from 'node:path';
2. External packages  import { useQuery } from '@tanstack/react-query';
3. Internal packages  import { Ticket } from '@resqai/types';
4. Relative imports   import { TicketBadge } from '@/components/...';
5. Styles             import styles from './Foo.module.css';
```

**Python:**
```
1. Standard library   import logging
2. Third-party        import pytest
3. Internal           from resqai_errors import NotFoundError
```

### 4.7 Error Handling

- Every async operation has `.catch()` or `try/catch`.
- Typed error hierarchy: `AppError` base → `NotFoundError`, `ValidationError`, `AuthenticationError`, etc.
- Standard error response format:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {}, "correlationId": "uuid" } }
  ```
- Never `catch` without logging. Never `catch` and return `null`.
- Boundary components catch and display error states.

### 4.8 Logging

Structured JSON logging with required fields: `correlationId`, `component`, `timestamp`, `level`. Log levels: `error` (system degraded), `warn` (handled anomaly), `info` (business event), `debug` (dev only, never in prod).

---

## 5. Git Strategy

### 5.1 Commit Message Format

```
{type}({scope}): {short description}

{optional body — why, not what}

{optional footer — breaking changes, ticket reference}
```

### 5.2 Commit Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `docs` | Documentation |
| `test` | Adding/updating tests |
| `chore` | Build, CI, config, tooling |
| `perf` | Performance improvement |
| `style` | Formatting only (no logic change) |

### 5.3 Commit Scopes

| Scope | Area |
|-------|------|
| `platform` | Shared packages, CI/CD, root config |
| `be` | Backend functions, tables |
| `fe-alpha` | Support, operations, appointment apps |
| `fe-beta` | CRM, resolution, notification apps |
| `fe-gamma` | Admin, analytics, portals |
| `agent` | Agent definitions |
| `wf` | Workflow definitions |
| `docs` | Documentation only |

### 5.4 Commit Rules

- Short description: max 72 characters, lowercase, no period.
- Body explains **motivation** (why), not implementation (what) — the diff shows what.
- Reference tickets: `Closes PROJ-42` or `Fixes PROJ-87`.
- One logical change per commit.
- No `WIP`, `fixup!`, `squash!` commits on `main` or `develop`.
- Rebase to clean up history before opening a PR. No merge commits.

### 5.5 Git Hygiene

- `.gitignore` covers: `node_modules/`, `dist/`, `__pycache__/`, `.env`, `.env.local`, IDE files, OS files, logs, coverage.
- No `.env` files committed (secrets in Lemma Secrets Manager).
- No large binary files (> 5 MB) in repository.
- Use `.gitkeep` for empty directories that must exist in the repo.

---

## 6. Branch Strategy

### 6.1 Branch Hierarchy

```
main                        # Production — protected, no direct commits
└── develop                 # Integration — protected, no direct commits
    ├── feat/{track}/{desc} # Feature branches
    ├── fix/{track}/{desc}  # Bug fix branches
    ├── refactor/{track}/.. # Refactoring
    ├── docs/{track}/...    # Documentation
    ├── test/{track}/...    # Testing
    ├── chore/{track}/...   # Build/config
    └── perf/{track}/...    # Performance
```

### 6.2 Branch Naming

```
{type}/{track}/{kebab-case-description}

Examples:
  feat/be/v2-core-wri-ticket
  fix/fe-alpha/ticket-form-validation
  refactor/agent/ticket-classifier-prompt
  docs/platform/event-catalog-update
  chore/be/upgrade-pydantic
```

### 6.3 Track Owners

| Track | Team |
|-------|------|
| `platform` | Platform/infra |
| `be` | Backend |
| `fe-alpha` | Frontend Alpha (support, ops, appointments) |
| `fe-beta` | Frontend Beta (CRM, resolution, notifications) |
| `fe-gamma` | Frontend Gamma (admin, analytics, portals) |
| `agent` | Agent team |
| `wf` | Workflow team |

### 6.4 Branch Rules

| Rule | Detail |
|------|--------|
| Protected branches | `main` and `develop` — no direct pushes, PR required, CI must pass |
| Source | Always branch from `develop` |
| Lifespan | Max 2 weeks. Longer branches must be rebased and reviewed weekly |
| Deletion | Delete feature branch after merge to `develop` |
| Rebasing | Rebase onto `develop` before opening PR. No merge commits. |
| Squash merges | Allowed only for `chore` and `docs` branches. `feat`/`fix` require full merge commit. |

### 6.5 Release Flow

1. Feature branches merge to `develop` via PR
2. At sprint end, `develop` is merged to `main` via release PR
3. `main` is tagged with semver (`v2.0.0`, `v2.1.0`, `v2.0.1`)
4. Hotfixes branch from `main`, merge to both `main` and `develop`

---

## 7. Pull Request Rules

### 7.1 PR Requirements

Every PR MUST include:

| Element | Required | Details |
|---------|----------|---------|
| Title | Yes | `{type}({scope}): {description}` matching commit format |
| Description | Yes | What, why, how (3 paragraph max). Screenshots for UI changes. |
| Definition of Done checklist | Yes | Copy from `DEFINITION_OF_DONE.md` §12 |
| Ticket reference | Yes | `Closes PROJ-N` or `Related to PROJ-N` |
| Breaking changes notice | If applicable | Listed in description with migration guide |
| Test results | Yes | Screenshot or log excerpt showing tests pass |

### 7.2 PR Size Limits

| Metric | Limit | Action |
|--------|:-----:|--------|
| Files changed | 20 files | Split into multiple PRs |
| Lines changed | 500 lines | Split into multiple PRs |
| Commits | 15 commits | Squash trivial commits |
| Review time | 24h target | Reviewer assigned within 4h of creation |

### 7.3 PR Checklist (Author)

Before marking a PR as ready for review:

```
□ Code compiles (tsc --noEmit) and builds
□ All existing tests pass
□ New tests added for new/changed code
□ Lint passes (ESLint + Prettier + ruff)
□ TypeScript strict mode passes
□ No console.log, debugger, or commented-out code
□ No secrets, tokens, or credentials in code
□ Environment variables documented in .env.example
□ Public API documented (JSDoc/Google-style docstrings)
□ UI components tested at loading, empty, error, success states
□ Migration has both up.sql and down.sql
□ Architecture docs updated if interfaces changed
□ Cross-app integration verified (if applicable)
□ PR description includes Definition of Done checklist
```

### 7.4 PR Merge Rules

| Condition | Action |
|-----------|--------|
| CI fails | Cannot merge. Fix and re-trigger. |
| Pending review | Cannot merge. At least 1 approval required. |
| Changes requested | Cannot merge until re-approved. |
| Merge conflicts | Rebase onto develop, resolve conflicts. |
| WIP / Draft | Cannot merge. Set to Ready for Review first. |
| No ticket reference | Cannot merge. Add `Closes PROJ-N` or `Related to PROJ-N`. |

---

## 8. Code Review Rules

### 8.1 Reviewer Expectations

Every reviewer must:

- **Understand the change** — Read the description, related ticket, and linked docs.
- **Review the code** — Not just approve. Check logic, edge cases, error handling, security.
- **Be specific** — Reference exact lines. "L42: this comparison should use `===`" not "fix the bug".
- **Be constructive** — Suggest alternatives, don't just criticize. Explain the "why".
- **Respond within 24 hours** — If you cannot review, reassign or notify within 4 hours.

### 8.2 Review Checklist

```
□ Architecture — Does this violate any layer rule or architectural principle?
□ Correctness — Does the logic handle all edge cases (empty, null, error states)?
□ Security — Input validated? Auth enforced? RLS applied? No secrets exposed?
□ Performance — No N+1 queries? No unnecessary renders? Bundle impact acceptable?
□ Testing — Tests cover: happy path, error path, edge cases? Coverage maintained?
□ Style — Follows coding standards, naming conventions, file structure?
□ Documentation — API documented? README updated? Migration has rollback?
□ Observability — Logged appropriately? Correlation ID propagated?
```

### 8.3 Review Response Time SLAs

| Severity | First Response | Review Complete |
|----------|:-------------:|:---------------:|
| P0 (production fix) | 1 hour | 4 hours |
| P1 (critical bug) | 2 hours | 8 hours |
| P2 (feature) | 4 hours | 24 hours |
| P3 (chore/docs) | 8 hours | 48 hours |

### 8.4 Review Grading

| Grade | Meaning | Action Required |
|-------|---------|-----------------|
| **Approve** | Looks good, ship it | Merge allowed |
| **Approve with nits** | Minor suggestions, non-blocking | Author can merge after addressing |
| **Request changes** | Issues that must be fixed before merge | Must re-request review or get explicit approval on changes |
| **Block** | Architecture/security violation. Escalate. | Cannot merge. Escalate to lead. |

### 8.5 Review Etiquette

- **Author:** Respond to all comments. Thank reviewers. Don't take feedback personally.
- **Reviewer:** Focus on the code, not the author. Use "we" not "you". Avoid "obviously", "just", "simply".
- **Both:** Prefer sync communication for complex discussions (Slack huddle, 5 min call). Summarize outcome in PR.
- **No drive-by approvals** — Every approval implies the reviewer has read every changed line.

---

## 9. Testing Rules

### 9.1 Test Pyramid

```
        ╱╲
       ╱ E2E  ╲             3-5 critical business journeys (Playwright)
      ╱────────╲
     ╱Integration ╲          Cross-component, database, connector tests
    ╱──────────────╲
   ╱   Unit Tests    ╲       Functions, components, utils, validation
  ╱───────────────────╲
 ╱  Static Analysis     ╲    Lint, type check, formatting
╱────────────────────────╲
```

### 9.2 Coverage Targets

| Layer | Minimum | Tool |
|-------|:-------:|------|
| Python functions | 90% | pytest-cov |
| Frontend (TS) | 80% | vitest --coverage |
| Shared packages | 90% | vitest --coverage |
| Agents | 85% | pytest-cov |
| Workflows | 85% | pytest-cov |
| Connectors | 90% | pytest-cov |

### 9.3 Mandatory Test Cases Per Component

**Functions (Python):**
- Valid input → success response
- Missing required field → validation error
- Invalid format → validation error
- Non-existent entity → not-found error
- Unauthorized access → auth error
- Successful event emission (where applicable)

**Components (React):**
- Loading state renders
- Empty state renders
- Error state renders
- Success state with data renders
- User interaction triggers expected behavior
- Form validation displays errors

**Workflows:**
- Happy path completes all steps
- Invalid input rejected at step 1
- Function failure triggers retry
- Rollback/compensation executes on failure
- Timeout is handled

**Agents:**
- Intent classification (10 test queries)
- Tool selection is correct
- Escalation triggers at low confidence
- Out-of-scope queries routed correctly
- Safety guardrails reject harmful input

### 9.4 Testing Rules

| Rule | Detail |
|------|--------|
| **Test behavior, not implementation** | Test what code does, not how. Refactoring should not break tests. |
| **One assertion per test** | Each test validates exactly one behavior. |
| **Deterministic** | Same input → same output. No flaky tests. No shared mutable state between tests. |
| **Independent** | Tests can run in any order and in parallel. |
| **No test logic** | No `if`, `for`, `switch` in test files. |
| **Mocks at boundaries only** | Mock database, external APIs, event bus. Do not mock pure functions. |
| **Co-located tests** | Test file sits next to source file. |
| **Naming** | `{scenario}_expects_{outcome}` or `it('renders loading state')` |

### 9.5 Test Execution

| Scope | Frequency | Tool |
|-------|-----------|------|
| Static analysis | Every save | ESLint, Prettier, ruff |
| Unit tests | Every save | vitest (frontend), pytest (backend) |
| Integration tests | Every PR | pytest with Lemma test utils |
| E2E tests | Every merge to develop | Playwright |
| Performance tests | Every release candidate | k6 / Lighthouse CI |
| Security scans | Every PR | trufflehog, npm audit, semgrep |

### 9.6 What NOT to Test

- Database internals (test query results, not query construction)
- Framework behavior (test that your component renders, not that React works)
- Third-party API behavior (test your connector logic, mock the external API)
- Styling details (visual regression tests handle this)
- LLM response quality (separate evaluation pipeline)

---

## 10. Deployment Rules

### 10.1 Release Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`

| Bump | When |
|------|------|
| MAJOR | Breaking API contract changes, incompatible table changes |
| MINOR | New features, backward compatible |
| PATCH | Bug fixes, backward compatible |

### 10.2 Release Stages

| Stage | Branch | Environment | Audience |
|-------|--------|-------------|----------|
| Development | `develop` | Local / Dev | Developer |
| Integration | `develop` | Staging | QA team |
| Release candidate | `release/*` | Staging | QA + PM |
| Production | `main` | Production | End users |
| Hotfix | `hotfix/*` | Production | Emergency |

### 10.3 CI/CD Pipeline (GitHub Actions)

```
On push/PR to main:
  1. Checkout
  2. Setup Node 22 + Python 3.13
  3. npm ci
  4. TypeScript type-check (root + all apps)
  5. Run tests (vitest + pytest)
  6. Build all apps
  → All must pass before merge

On merge to main:
  1. (Future) CD workflow deploys to Lemma
  2. Runs E2E tests against staging
  3. Runs performance tests
```

### 10.4 Deployment Prerequisites

Before any deployment to production:

```
□ All CI checks green on main
□ Release branch merged and tagged (git tag v2.x.x)
□ CHANGELOG.md updated with release notes
□ Database migrations applied (up.sql) and verified
□ Rollback scripts tested (down.sql) and verified
□ Performance benchmarks show no regression (> 10%)
□ Security scan clean (zero critical, zero high)
□ E2E critical journeys pass (8/8)
□ Smoke test passes in staging (all 10 apps load)
□ Observability dashboards configured
□ On-call engineer notified of deployment
```

### 10.5 Deployment Windows

| Environment | Window | Approval |
|-------------|--------|----------|
| Staging | Any time (automated on merge to develop) | CI green |
| Production (standard) | Mon–Thu, 09:00–15:00 UTC | Lead engineer + PM |
| Production (hotfix) | Any time | Lead engineer + on-call |

### 10.6 Rollback Procedure

1. `git revert <merge-commit>` or `git checkout main@{1.day.ago}`
2. Apply rollback SQL: `lemma migration down <migration_id>`
3. Verify rollback in staging
4. Deploy reverted version to production
5. Notify team in #engineering Slack channel

### 10.7 Canary Deployments (Future)

When multi-instance support is live:
1. Deploy to 10% of traffic — monitor 15 min
2. Deploy to 50% of traffic — monitor 30 min
3. Deploy to 100% — monitor 60 min
4. Roll back immediately if error rate > 0.1% or latency p95 > 2× baseline

---

## 11. Contribution Rules

### 11.1 Getting Started

1. **Read the standards** — All 10 docs in `docs/v2/standards/` must be read before first contribution.
2. **Clone and install** — `npm install`, copy `.env.example` → `.env`, configure Lemma pod credentials.
3. **Run validation** — `npm run validate` to confirm TypeScript compiles, `npm test` to confirm tests pass.
4. **Pick a ticket** — All work is tracked in the project board. No unassigned changes to the codebase.

### 11.2 Workflow

```
1. Pick a ticket from the project board (assigned by lead)
2. Create a branch: feat/be/v2-core-wri-ticket
3. Implement changes (follow coding standards)
4. Write/update tests (meet coverage targets)
5. Run validation locally (tsc, lint, test)
6. Push branch and open PR to develop
7. Fill out PR template completely
8. Request review (assign reviewer from team)
9. Address review comments
10. Merge to develop (once approved + CI green)
11. Delete feature branch
```

### 11.3 What Constitutes a Valid Contribution

- **Bug fixes** — Any issue labeled `bug` in the project board.
- **Features** — Any issue labeled `feature` with acceptance criteria in the project board.
- **Refactoring** — Must not change behavior. Must maintain or improve test coverage.
- **Documentation** — Typos, clarifications, missing docs. Propose changes via PR.
- **Tests** — Additional test coverage always welcome.
- **NOT allowed** — Unrequested features, architecture changes, dependency upgrades without ticket.

### 11.4 Definition of Done

Every contribution must satisfy **all 7 categories** of the Definition of Done:

```
□ 1. CODE     — Code written, reviewed, merged
□ 2. TESTS    — All tests pass, coverage meets target
□ 3. DOCS     — Documentation written and reviewed
□ 4. SECURITY — No secrets, scan clean, input validated, auth verified
□ 5. QUALITY  — Lint, type check, CI all green
□ 6. CI/CD    — Pipeline green, build succeeds
□ 7. OBSERVABILITY — Logging, correlation ID, metrics implemented
```

See `docs/v2/standards/DEFINITION_OF_DONE.md` for the full checklist template.

### 11.5 Code of Conduct

All contributors must adhere to the project's Code of Conduct (`CODE_OF_CONDUCT.md`). Be respectful, constructive, and professional. Harassment, trolling, and personal attacks are not tolerated.

### 11.6 Licensing

By contributing, you agree that your contributions will be licensed under the MIT License (`LICENSE`).

---

## 12. Compliance & Enforcement

### 12.1 Automated Enforcement

| Check | Tool | When |
|-------|------|------|
| Code formatting | Prettier + ESLint | Every save + CI |
| TypeScript strict | `tsc --noEmit` | Pre-commit + CI |
| Python lint | ruff | CI |
| Secret detection | trufflehog | CI (every PR) |
| Dependency audit | npm audit | CI (weekly) |
| Coverage | vitest --coverage + pytest-cov | CI (every PR) |
| Branch protection | GitHub settings | Always |
| Commit message lint | commitlint | Pre-commit |

### 12.2 Manual Enforcement (Code Review)

Every PR is reviewed against the checklist in §8.2. Violations of standards are flagged as "Request Changes" — they must be fixed before merge. Structural or security violations are "Block" — they require lead engineer escalation.

### 12.3 Exception Process

Any exception to these rules requires:

1. **Written justification** in the PR description explaining why the standard cannot be followed
2. **Lead engineer approval** (code owner for the affected area)
3. **Tracking issue** created in the project board to revisit the exception

Exceptions are temporary. Every exception has an expiry date (max 1 sprint).

### 12.4 Standards Updates

These standards live in `docs/DEVELOPER_HANDBOOK.md`. Updates follow the same PR process:

1. PR with changes to this document
2. Explanation of change rationale
3. Review by at least 2 engineering leads
4. Approval from Chief Software Engineering Architect

---

## Reference: Standards Index

| Document | Path | Topics |
|----------|------|--------|
| Developer Handbook | `docs/DEVELOPER_HANDBOOK.md` | **This document** — all rules in one place |
| Engineering Guide | `docs/v2/standards/ENGINEERING_GUIDE.md` | Principles, tech stack, compliance |
| Coding Standards | `docs/v2/standards/CODING_STANDARDS.md` | Code style, error handling, logging, commits |
| Naming Conventions | `docs/v2/standards/NAMING_CONVENTIONS.md` | All naming rules for every resource type |
| Project Structure | `docs/v2/standards/PROJECT_STRUCTURE.md` | Folder layout, file organization |
| Testing Guidelines | `docs/v2/standards/TESTING_GUIDELINES.md` | Test pyramid, coverage, patterns |
| Backend Guidelines | `docs/v2/standards/BACKEND_GUIDELINES.md` | Functions, validation, transactions |
| UI Guidelines | `docs/v2/standards/UI_GUIDELINES.md` | Components, a11y, responsive |
| AI Guidelines | `docs/v2/standards/AI_GUIDELINES.md` | Agent prompts, context, fallback |
| Workflow Guidelines | `docs/v2/standards/WORKFLOW_GUIDELINES.md` | Workflow structure, triggers, retries |
| Definition of Done | `docs/v2/standards/DEFINITION_OF_DONE.md` | Done criteria, checklists |

---

> **End of DEVELOPER_HANDBOOK.md**  
> Every engineer must read this handbook before contributing code to ResQAI V2.
