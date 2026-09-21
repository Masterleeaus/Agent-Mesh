# Architecture Audit — ResQAI V2

**Phase:** B.10 Enterprise Production Readiness Validation
**Date:** 2026-06-30

---

## 1. System Overview

```
                  ┌─────────────────────────────────────────────────────┐
                  │                     Users                           │
                  │  (Support Agents / CRM / Ops / Techs / Customers)  │
                  └──────────┬────────────────┬────────────────┬───────┘
                             │                │                │
                    ┌────────▼───┐   ┌────────▼───┐   ┌───────▼────┐
                    │ Support    │   │ CRM        │   │ Ops        │
                    │ Queue (V1) │   │ Tracker(V1)│   │ Dashboard  │
                    └────────────┘   └────────────┘   │ (V1)       │
                    ┌────────────┐   ┌────────────┐   └────────────┘
                    │ Resolution │   │ Appt Board │   ┌────────────┐
                    │ Center (V1)│   │ (V1)       │   │ V2 Apps (9)│
                    └────────────┘   └────────────┘   │ (stubs)    │
                             │                │       └────────────┘
                             └────────┬───────┘
                                      │
                            ┌─────────▼────────────┐
                            │   Shared SDK Layer    │
                            │  (packages/sdk,types, │
                            │   config,ui,utils)    │
                            └─────────┬────────────┘
                                      │
                            ┌─────────▼────────────┐
                            │     Shared V2        │
                            │  (foundation)         │
                            │  design-system, state │
                            │  events, permissions  │
                            └─────────┬────────────┘
                                      │
                            ┌─────────▼──────────────────────┐
                            │        Lemma Pod Platform       │
                            │                                 │
                            │  ┌─────────┐  ┌──────────────┐  │
                            │  │ Agents  │  │  Functions    │  │
                            │  │ (6 AI)  │  │  (66 Python)  │  │
                            │  └─────────┘  └──────────────┘  │
                            │  ┌─────────┐  ┌──────────────┐  │
                            │  │Workflows│  │   Database    │  │
                            │  │ (11)    │  │ (41 V2 tables)│  │
                            │  └─────────┘  └──────────────┘  │
                            │  ┌──────────────────────────┐   │
                            │  │  Connectors (5)           │   │
                            │  │  Discord/FB/IG/Gmail/Reddit│  │
                            │  └──────────────────────────┘   │
                            └─────────────────────────────────┘
```

---

## 2. Architecture Strengths

### 2.1 Clean Layered Architecture
- **Presentation layer** (React apps) cleanly separated from **business logic** (agents/functions)
- **SDK layer** provides a consistent abstraction over Lemma platform primitives
- **V2 shared foundation** establishes design system, state management, events, permissions for next-gen apps

### 2.2 Agent-First Design
- All 6 agents follow a consistent configuration structure (agent.json, instruction.md, schemas, permissions)
- "AI drafts, humans approve" principle ensures human-in-the-loop for all outbound actions
- Structured output contracts with status codes enable workflow decision routing

### 2.3 Event-Driven Workflows
- `ticket.created` event triggers the intake pipeline
- DATASTORE triggers on INSERT/UPDATE for urgent dispatch and dispute resolution
- CRON schedules for periodic workflows (health monitoring, reminders, standup)

### 2.4 Comprehensive Permission Model
- Zero-access-by-default with explicit grants
- Table-level read/write separation per agent and function
- Role-based access control with RoleGuard/FeatureGuard components

---

## 3. Architecture Weaknesses

### 3.1 Missing Production Infrastructure
| Gap | Impact |
|-----|--------|
| No Docker/containerization | Cannot deploy to any production environment |
| No CI/CD pipeline | All deployment is manual |
| No health check endpoints | No readiness/liveness probes |
| No monitoring/observability | Zero production visibility |
| No secrets management | Credentials in plaintext .env |

### 3.2 V1/V2 Coexistence Without Migration Plan
- V1 apps in `apps/` and V2 stubs in `apps_v2/` with no formal migration strategy
- Two parallel schema versions (V1: 9 tables, V2: 41 tables)
- No documented cutover plan, data migration strategy, or backward compatibility guarantees

### 3.3 SDK Layer Uncertainty
- `packages/sdk/lemma-sdk.ts` is marked **"Frozen — Lemma auth bug"**
- Apps cannot authenticate in production until Lemma platform fixes auth redirect
- No fallback authentication strategy documented

### 3.4 Agents Have No Runtime
- All 6 agents are structurally complete but **cannot execute**
- Agent harness (`agents/harness/run.ts`) exists but is a dev harness, not a production runtime
- No agent monitoring, logging, or error handling infrastructure

### 3.5 Single Point of Failure: Lemma Pod
- Every component depends on the Lemma Pod for database, auth, agents, functions, workflows
- No offline mode for any application
- No caching layer or fallback data sources

### 3.6 Frontend Architecture Gaps
- No state management library (Redux, Zustand, etc.) — only React useState/useCallback
- No routing library (React Router absent in most apps)
- No API client abstraction beyond raw Lemma SDK calls
- No bundle splitting or lazy loading

---

## 4. Data Flow Analysis

### 4.1 Ticket Intake Pipeline (Primary Flow)
```
User submits ticket → support-queue UI → SDK createRecord(tickets)
  → Lemma pod → ticket.created event → ticket-intake workflow
    → request-classifier agent → update ticket status
    → support-reply-drafter agent → draft reply → awaiting_approval
    → Human reviews → approve/send/close
```

**Audit Findings:**
- ✅ Clear workflow definition with 7 nodes
- ✅ Status codes enable DECISION routing between nodes
- ⚠️ No SLA tracking from creation → response
- ❌ No fallback if agent fails mid-pipeline

### 4.2 Health Monitoring Pipeline
```
CRON trigger (2am) → account-health-monitoring workflow
  → account-health-monitor agent → call account_health_scan function
  → route_by_health (healthy/warning/crisis)
  → update_account_health_status / notify_ops / escalate
```

**Audit Findings:**
- ✅ Deterministic health scoring (0-1 range, 5 buckets)
- ✅ Scheduled execution confirmed
- ⚠️ No stale-data guard — may run on outdated account data
- ❌ No notification delivery confirmation

---

## 5. Technology Stack Assessment

| Component | Technology | Version | Status |
|-----------|-----------|---------|--------|
| Frontend Framework | React | 18.3.1 | ✅ |
| Build Tool | Vite | 8.x | ⚠️ legacy-peer-deps workaround |
| TypeScript | TypeScript | 5.x | ✅ Strict mode |
| Testing (JS) | Vitest + jsdom | Latest | ✅ |
| Testing (Python) | pytest 8 | 8.x | ✅ |
| Backend Runtime | Python | 3.13 | ✅ |
| Platform | Lemma | 0.5.2 | ⚠️ Auth redirect broken |
| Styling | Inline styles / CSS | — | ⚠️ No CSS framework |
| Package Manager | npm | 10+ | ⚠️ legacy-peer-deps=true |
| CI/CD | GitHub Actions | — | ⚠️ Present but minimal |

---

## 6. Architectural Recommendations

### Critical (Pre-Production)
1. **Resolve Lemma auth redirect** or implement alternative auth strategy
2. **Create runtime harness** for all 6 agents
3. **Remove `legacy-peer-deps=true`** — resolve underlying peer dependency conflicts

### High Priority
4. Add Dockerfiles / docker-compose for all apps
5. Implement health check endpoints (`GET /health`, `GET /ready`)
6. Add structured logging with log aggregation (Sentry, DataDog, or ELK)
7. Create V1→V2 migration plan with cutover criteria

### Medium Priority
8. Add client-side caching layer (React Query or SWR)
9. Add load testing to CI pipeline (k6 or artillery)
10. Document SLA targets and error budgets
11. Add pre-commit hooks (husky + lint-staged)

### Low Priority
12. Add Architecture Decision Records (ADRs)
13. Create C4 model diagrams
14. Evaluate adopting a CSS framework (Tailwind, styled-components)
