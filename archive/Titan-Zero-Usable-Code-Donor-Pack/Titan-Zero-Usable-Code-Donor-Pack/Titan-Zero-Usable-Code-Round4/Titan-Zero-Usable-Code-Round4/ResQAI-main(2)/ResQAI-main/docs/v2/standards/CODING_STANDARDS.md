# RESQAI V2 — Coding Standards

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [General Rules](#1-general-rules)
2. [TypeScript Standards](#2-typescript-standards)
3. [Python Standards](#3-python-standards)
4. [React Standards](#4-react-standards)
5. [Imports](#5-imports)
6. [Error Handling](#6-error-handling)
7. [Logging](#7-logging)
8. [Configuration](#8-configuration)
9. [Secrets Management](#9-secrets-management)
10. [Environment Variables](#10-environment-variables)
11. [Comments](#11-comments)
12. [Commit Messages](#12-commit-messages)
13. [Branch Strategy](#13-branch-strategy)
14. [Versioning](#14-versioning)
15. [File Organization](#15-file-organization)

---

## 1. General Rules

### 1.1 Formatting
- Tabs for indentation. Width: 2 spaces
- Max line length: 100 characters
- Trailing newline at end of every file
- No trailing whitespace
- UTF-8 encoding
- LF line endings (Unix-style)

### 1.2 Enforcement
- ESLint + Prettier for JS/TS (auto-fix on save)
- ruff for Python (auto-fix on save)
- CI fails on any linting violation
- No `eslint-disable` or `# noqa` without explanation comment

### 1.3 Prohibited Patterns
- `any` type in TypeScript (use `unknown` if necessary)
- `eval()` in any form
- `// @ts-ignore` (use `// @ts-expect-error` with justification)
- Global mutable state
- `console.log` in production code (use logger)
- `process.env` direct access in production code (use config loader)
- Magic numbers (define as named constants)
- Deeply nested ternaries (max 1 level)
- `TODO` without a ticket reference

---

## 2. TypeScript Standards

### 2.1 Types Over Interfaces
```typescript
// Preferred
export type Ticket = {
  id: string;
  title: string;
  status: TicketStatus;
};

// Acceptable (extendable contracts)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 2.2 Strict Mode
- `strict: true` in `tsconfig.json`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

### 2.3 Null Safety
```typescript
// Bad
function getName(user: User | null): string {
  return user ? user.name : '';
}

// Good
function getName(user: User | null): string {
  return user?.name ?? '';
}
```

### 2.4 Function Signatures
```typescript
// Named parameters for functions with 2+ params
function createTicket({ title, description, priority, customerId }: CreateTicketInput): Promise<Ticket>;
```

### 2.5 Generics
```typescript
function getById<T extends { id: string }>(items: T[], id: string): T | undefined;
```

### 2.6 Enums
Prefer `as const` objects over `enum`:
```typescript
export const TicketStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
```

---

## 3. Python Standards

### 3.1 Style
- Follow PEP 8 (enforced by ruff)
- Type hints required on all function signatures
- Docstrings: Google style

### 3.2 Type Hints
```python
from typing import Optional

def get_ticket(ticket_id: str, org_id: str) -> Optional[dict]:
    """Retrieve a ticket by ID.

    Args:
        ticket_id: The ticket UUID.
        org_id: The organization UUID for RLS.

    Returns:
        Ticket dict if found, None otherwise.
    """
```

### 3.3 Function Structure
```python
# Standard function structure
import logging
from typing import Optional

from resqai_errors import NotFoundError, ValidationError
from resqai_utils.date import parse_iso_date

logger = logging.getLogger(__name__)

def handler(input_data: dict, context: dict) -> dict:
    """Function entry point.

    Args:
        input_data: validated input payload.
        context: execution context (auth, correlation_id, org_id).

    Returns:
        Standard response dict.

    Raises:
        ValidationError: if input is invalid.
        NotFoundError: if entity not found.
    """
```

---

## 4. React Standards

### 4.1 Component Structure
```typescript
// Standard component pattern
type TicketStatusBadgeProps = {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
};

export function TicketStatusBadge({ status, size = 'md' }: TicketStatusBadgeProps) {
  // No logic here — call hooks at top
  // Render only
}
```

### 4.2 Hooks Rules
- One hook per concern (not one mega-hook)
- Custom hooks start with `use`
- Hooks return named object, never array tuple
- Hooks are pure (no side effects outside React lifecycle)

### 4.3 State Management
- Server state: React Query (`useQuery`, `useMutation`)
- Client state: Zustand (minimal, no unnecessary stores)
- URL state: React Router search params
- Form state: React Hook Form

### 4.4 Performance
- `React.memo` only for components that render often with same props
- `useMemo` only for expensive calculations
- `useCallback` only when passing callbacks to memoized children
- No premature optimization

---

## 5. Imports

### 5.1 Import Order (TypeScript)
```typescript
// 1. Node built-ins
import path from 'node:path';

// 2. External packages
import { useQuery } from '@tanstack/react-query';

// 3. Internal packages (@resqai scope)
import { Ticket } from '@resqai/types';
import { formatDate } from '@resqai/utils';

// 4. Relative imports (app-internal)
import { TicketStatusBadge } from '@/components/TicketStatusBadge';

// 5. Style imports
import styles from './TicketList.module.css';
```

### 5.2 Import Order (Python)
```python
# 1. Standard library
import logging
from typing import Optional

# 2. Third-party
import pytest

# 3. Internal
from resqai_errors import NotFoundError
from resqai_utils.date import parse_iso_date
```

### 5.3 Barrel Exports
- Each directory has an `index.ts` or `__init__.py` barrel
- Barrel exports only what is public API
- Internal helpers NOT re-exported

### 5.4 Prohibited
- No `import *` (TypeScript or Python)
- No circular imports (CI checks for these)
- No unused imports (linter enforces)

---

## 6. Error Handling

### 6.1 Error Hierarchy (TypeScript)
```typescript
// packages/resqai-errors/src/base-error.ts
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly correlationId?: string;

  constructor(message: string, code: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific errors
export class NotFoundError extends AppError { /* code: 'NOT_FOUND', statusCode: 404 */ }
export class ValidationError extends AppError { /* code: 'VALIDATION_ERROR', statusCode: 400 */ }
export class AuthenticationError extends AppError { /* code: 'UNAUTHORIZED', statusCode: 401 */ }
export class AuthorizationError extends AppError { /* code: 'FORBIDDEN', statusCode: 403 */ }
export class ConflictError extends AppError { /* code: 'CONFLICT', statusCode: 409 */ }
export class RateLimitError extends AppError { /* code: 'RATE_LIMITED', statusCode: 429 */ }
export class TimeoutError extends AppError { /* code: 'TIMEOUT', statusCode: 504 */ }
export class InternalError extends AppError { /* code: 'INTERNAL_ERROR', statusCode: 500 */ }
```

### 6.2 Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ticket_id is required",
    "details": {
      "field": "ticket_id",
      "reason": "missing"
    },
    "correlationId": "c4a8e3f2-..."
  }
}
```

### 6.3 Error Handling Rules
- Every async operation has `.catch()` or `try/catch`
- Boundary components catch errors and show error state
- API error interceptor converts HTTP errors to typed errors
- Never `catch` without logging
- Never `catch` and return `null` (throw or handle explicitly)

---

## 7. Logging

### 7.1 Structured Logging
```typescript
// TypeScript
logger.info('Ticket created', {
  correlationId: 'abc-123',
  ticketId: 'ticket-456',
  customerId: 'cust-789',
  duration: 245,
});

// Python
logger.info('Ticket created', extra={
    'correlation_id': 'abc-123',
    'ticket_id': 'ticket-456',
    'customer_id': 'cust-789',
    'duration': 245,
});
```

### 7.2 Log Levels
| Level | Usage |
|-------|-------|
| `error` | System is degraded, needs human attention |
| `warn` | Unexpected but handled, may need investigation |
| `info` | Normal business events (entity created, state changed) |
| `debug` | Development troubleshooting only (not in production) |

### 7.3 Required Fields Per Log Entry
- `correlationId` — Trace across components
- `component` — Which function/app/agent/workflow
- `timestamp` — ISO 8601 UTC
- `level` — Log level

---

## 8. Configuration

### 8.1 Configuration Loading
```typescript
// packages/resqai-config/src/env.ts
export function loadConfig(): AppConfig {
  return {
    environment: getEnvOrThrow('RESQAI_ENVIRONMENT'),
    db: {
      host: getEnvOrThrow('RESQAI_DB_HOST'),
      port: parseInt(getEnvOrThrow('RESQAI_DB_PORT'), 10),
    },
    logLevel: getEnvOrDefault('RESQAI_LOG_LEVEL', 'info'),
  };
}
```

### 8.2 Configuration Rules
- All config loaded at startup, never at runtime
- Config is immutable after load
- No `process.env` access outside config loader
- Sensible defaults for non-critical config

---

## 9. Secrets Management

### 9.1 Rules
- No secrets in source code. Ever.
- No secrets in `.env` files committed to git
- Secrets stored in Lemma Secrets Manager
- Access via `lemma secrets get {key}` in deployment
- API keys rotated every 90 days minimum

### 9.2 What is a Secret
- Database passwords
- API keys (Twilio, SendGrid, OpenAI, Mapbox, Slack)
- JWT signing keys
- Encryption keys
- OAuth client secrets

### 9.3 Detection
- `.env` is in `.gitignore`
- `trufflehog` runs on every PR
- CI fails if any secret-like string detected

---

## 10. Environment Variables

### 10.1 Required Variables
```
RESQAI_ENVIRONMENT=development|staging|production
RESQAI_LOG_LEVEL=debug|info|warn|error
RESQAI_DB_HOST=
RESQAI_DB_PORT=5432
RESQAI_EVENT_BUS_TOPIC=v2-events
```

### 10.2 Variable Naming
- Prefix: `RESQAI_`
- Component: `DB_`, `EVENT_BUS_`, `TWILIO_`, `SENDGRID_`, `OPENAI_`
- Property: `HOST`, `PORT`, `API_KEY`, `ACCOUNT_SID`

---

## 11. Comments

### 11.1 When to Comment
- Complex business logic that is not self-documenting
- Workarounds for third-party bugs (include ticket reference)
- Public API / exported function documentation
- Non-obvious performance decisions

### 11.2 When NOT to Comment
- Obvious code (`// Increment counter` above `i++`)
- Implementation details that change frequently
- Commented-out code (delete it, git history preserves it)

### 11.3 Comment Format (TypeScript)
```typescript
/**
 * Calculates SLA deadline based on priority and creation time.
 *
 * SLA targets: critical=1h, high=4h, medium=8h, low=24h
 * Excludes weekends for non-critical.
 */
function calculateSlaDeadline(createdAt: Date, priority: Priority): Date;
```

### 11.4 Comment Format (Python)
```python
def calculate_sla_deadline(created_at: datetime, priority: Priority) -> datetime:
    """Calculate SLA deadline based on priority and creation time.

    SLA targets: critical=1h, high=4h, medium=8h, low=24h
    Excludes weekends for non-critical.
    """
```

---

## 12. Commit Messages

### 12.1 Format
```
{type}({scope}): {short description}

{optional body — why this change was made, not what}

{optional footer — breaking changes, ticket references}
```

### 12.2 Types
| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `docs` | Documentation |
| `test` | Adding/updating tests |
| `chore` | Build, CI, config |
| `perf` | Performance improvement |
| `style` | Formatting (no logic change) |

### 12.3 Scope
| Scope | Area |
|-------|------|
| `platform` | Shared packages, CI/CD, config |
| `be` | Backend functions |
| `fe-alpha` | Frontend Alpha apps |
| `fe-beta` | Frontend Beta apps |
| `fe-gamma` | Frontend Gamma apps |
| `agent` | Agent system |
| `wf` | Workflow system |
| `docs` | Documentation |

### 12.4 Examples
```
feat(be): add v2_core_wri_ticket function

- CREATE/UPDATE for tickets with full validation
- Emits v2.core.ticket.created / v2.core.ticket.updated
- RLS enforced via org_id from auth context

Closes PROJ-42
```

```
fix(fe-alpha): support-center pagination resets on filter

Pagination state was not preserved when filter parameters changed.
Fixed by storing page in URL search params instead of component state.

Fixes PROJ-87
```

### 12.5 Rules
- Short description: max 72 characters, lowercase, no period
- Body: wrap at 72 characters, explain motivation
- Reference tickets: `Closes PROJ-42` or `Fixes PROJ-87`
- One logical change per commit
- No `WIP`, `fixup!`, `squash!` commits on main

---

## 13. Branch Strategy

### 13.1 Branch Hierarchy
```
main                    # Production — protected, no direct commits
├── develop             # Integration — protected, no direct commits
│   ├── feat/*          # Feature branches
│   ├── fix/*           # Bug fix branches
│   ├── refactor/*      # Refactoring
│   ├── docs/*          # Documentation
│   ├── test/*          # Testing
│   ├── chore/*         # Build/config
│   └── perf/*          # Performance
```

### 13.2 Workflow
1. Branch from `develop`
2. Implement changes
3. Open PR to `develop`
4. PR review + CI passes
5. Merge to `develop`
6. Release: `develop` → `main` (sprint-end merge)

### 13.3 Branch Naming
```
{type}/{track}/{description}

Examples:
feat/platform/migration-0-schema
feat/be/v2-core-wri-ticket
fix/fe-alpha/ticket-form-validation
docs/platform/event-catalog
```

### 13.4 Rules
- `develop` and `main` are protected (require PR, require CI pass)
- Feature branches deleted after merge
- No long-lived feature branches (> 2 weeks)
- Rebase before opening PR (no merge commits)

---

## 14. Versioning

### 14.1 Schema
Semantic versioning: `MAJOR.MINOR.PATCH`

| Bump | When |
|------|------|
| MAJOR | Breaking changes (API contract changes, incompatible table changes) |
| MINOR | New features, backward compatible |
| PATCH | Bug fixes, backward compatible |

### 14.2 Version Sources
- Packages: `package.json` `version` field
- Functions: Versioned individually by Lemma
- APIs: Versioned via URL path (`/v2/`)
- Documentation: Versioned by git tag

### 14.3 Git Tags
```
v2.0.0-alpha    # Alpha release
v2.0.0-beta     # Beta release
v2.0.0          # Production release
v2.0.1          # Patch
v2.1.0          # Minor feature
```

---

## 15. File Organization

### 15.1 One Thing Per File
- One React component per file
- One function per file (backend)
- One type/interface per file (if complex, otherwise group related types)
- One test file per source file

### 15.2 Max File Lengths
| Language | Max Lines | Action |
|----------|:---------:|--------|
| TypeScript (.ts/.tsx) | 300 | Extract into sub-modules |
| Python (.py) | 400 | Split into separate functions/modules |
| SQL (.sql) | 200 | Split migration into multiple files |
| Markdown (.md) | 500 | Split document |

### 15.3 Directory Structure Per Component
```
TicketStatusBadge/
├── TicketStatusBadge.tsx      # Component
├── TicketStatusBadge.test.tsx # Tests
├── TicketStatusBadge.stories.tsx # Storybook (optional)
└── index.ts                   # Re-export
```

---

> **End of CODING_STANDARDS.md**
