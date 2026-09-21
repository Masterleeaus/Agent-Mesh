# RESQAI V2 — Engineering Guide

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [Tech Stack](#3-tech-stack)
4. [Engineering Principles](#4-engineering-principles)
5. [Standards Index](#5-standards-index)
6. [Compliance](#6-compliance)

---

## 1. Purpose

This engineering handbook defines the standards, conventions, and guidelines for all ResQAI V2 development. Every engineer working on ResQAI V2 must read and comply with these standards before writing any code.

These standards are the **single source of truth** for engineering practices. Any deviation requires written approval from the Chief Software Engineering Architect.

---

## 2. Scope

This handbook covers all V2 resources:

| Category | Count | Documents |
|----------|:-----:|-----------|
| Tables | 41 | PROJECT_STRUCTURE.md, NAMING_CONVENTIONS.md, BACKEND_GUIDELINES.md |
| Functions | 53 | BACKEND_GUIDELINES.md, CODING_STANDARDS.md |
| Connectors | 6 | BACKEND_GUIDELINES.md |
| Applications | 10 | UI_GUIDELINES.md, CODING_STANDARDS.md |
| Agents | 49 | AI_GUIDELINES.md |
| Workflows | 33 | WORKFLOW_GUIDELINES.md |
| Events | 85+ | BACKEND_GUIDELINES.md, WORKFLOW_GUIDELINES.md |
| Notifications | 30+ | WORKFLOW_GUIDELINES.md |

---

## 3. Tech Stack

### Frontend
- **Framework:** React 18+ with TypeScript 5+
- **Build:** Vite 5+
- **Styling:** Tailwind CSS 3+
- **State:** Zustand (lightweight), React Query (server state)
- **Testing:** Vitest, React Testing Library, Playwright
- **Linting:** ESLint + Prettier
- **Package Manager:** npm 10+

### Backend (Lemma)
- **Runtime:** Python 3.11+
- **Tables:** Lemma ORM with RLS
- **Functions:** Lemma functions (Python)
- **Events:** Lemma event bus
- **Agents:** Lemma agent runtime
- **Workflows:** Lemma workflow engine
- **Testing:** pytest, lemma test utilities
- **Linting:** ruff, mypy

### Infrastructure
- **Hosting:** Lemma Cloud
- **CI/CD:** GitHub Actions
- **Monitoring:** Lemma Observability
- **Secrets:** Lemma Secrets Manager

---

## 4. Engineering Principles

### 4.1 Principle 1: Consistency Over Cleverness
Write predictable code. Follow patterns exactly. No clever one-liners. No framework gymnastics. Every file in a category should look structurally identical.

### 4.2 Principle 2: No Duplication
Every business rule exists exactly once — in a function. Apps render UI. Agents orchestrate conversations. Workflows sequence steps. If you need the same logic in two places, extract it to a function.

### 4.3 Principle 3: Testability First
Every function must be testable in isolation. Dependency injection everywhere. No globals. No side effects in constructors. If you cannot unit test a piece of code, redesign it.

### 4.4 Principle 4: Fail Explicitly
Never silently swallow errors. Never return `null` when you mean `error`. Never catch and ignore. Every failure must be logged, traced, and surfaced.

### 4.5 Principle 5: Security by Default
No endpoint is public by default. No table row is readable by default. No function is callable by default. Every access must be explicitly permitted.

### 4.6 Principle 6: Observability Everywhere
Every component emits structured logs. Every cross-component call carries a correlation ID. Every error has a trace. If you cannot see it in dashboards, it does not exist.

### 4.7 Principle 7: Document as You Build
No PR merges without documentation. Every function gets an OpenAPI spec. Every app gets a README. Every workflow gets a sequence diagram. Documentation blocking is implementation blocking.

### 4.8 Principle 8: Parallel Tracks, Serial Dependencies
Frontend and backend can build in parallel as long as contracts (types, API specs) are agreed first. No frontend team waits for backend — they use mock data matching the agreed spec.

---

## 5. Standards Index

| Document | Path | Covers |
|----------|------|--------|
| ENGINEERING_GUIDE.md | `docs/v2/standards/ENGINEERING_GUIDE.md` | This document |
| NAMING_CONVENTIONS.md | `docs/v2/standards/NAMING_CONVENTIONS.md` | All naming rules |
| PROJECT_STRUCTURE.md | `docs/v2/standards/PROJECT_STRUCTURE.md` | Folder layout, file organization |
| CODING_STANDARDS.md | `docs/v2/standards/CODING_STANDARDS.md` | Code style, imports, error handling, logging, config |
| UI_GUIDELINES.md | `docs/v2/standards/UI_GUIDELINES.md` | UI components, layout, a11y, responsive |
| BACKEND_GUIDELINES.md | `docs/v2/standards/BACKEND_GUIDELINES.md` | Functions, validation, transactions, caching |
| AI_GUIDELINES.md | `docs/v2/standards/AI_GUIDELINES.md` | Agent prompts, context, memory, fallback |
| WORKFLOW_GUIDELINES.md | `docs/v2/standards/WORKFLOW_GUIDELINES.md` | Workflow structure, triggers, retries |
| TESTING_GUIDELINES.md | `docs/v2/standards/TESTING_GUIDELINES.md` | All testing types, coverage targets |
| DEFINITION_OF_DONE.md | `docs/v2/standards/DEFINITION_OF_DONE.md` | Done criteria for all work |

---

## 6. Compliance

### Mandatory Reading
Every engineer must read all 10 standards documents before writing their first line of code.

### Automated Enforcement
- ESLint + Prettier enforce code style
- `ruff` + `mypy` enforce Python style
- Custom Lemma lint rules enforce naming conventions
- CI/CD pipeline runs all linters on every PR

### Code Review Checklist
Every PR must include a self-certification that all applicable standards are met. Reviewers check standard compliance as part of the review.

### Exception Process
Any exception to these standards requires:
1. Written justification in the PR description
2. Approval from the Chief Software Engineering Architect
3. A tracking issue in the project board

### Updates
Standards are updated via PR to `docs/v2/standards/`. Changes require:
1. PR description explaining the change rationale
2. Review by at least 2 engineering leads
3. Approval from the Chief Software Engineering Architect

---

> **End of ENGINEERING_GUIDE.md**
