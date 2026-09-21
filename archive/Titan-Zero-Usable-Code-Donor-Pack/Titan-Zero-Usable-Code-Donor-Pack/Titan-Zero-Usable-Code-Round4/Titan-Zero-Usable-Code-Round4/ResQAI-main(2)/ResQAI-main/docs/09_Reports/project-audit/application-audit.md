# Application Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Application Inventory

| # | Name | Port | Pages | SDK Init | Has dist/ | Has node_modules |
|---|------|------|-------|----------|-----------|-----------------|
| 1 | appointment-board | 5173 | 1 | ✅ | ✅ | ✅ |
| 2 | crm-tracker | 5175 | 1 | ✅ | ✅ | ✅ |
| 3 | ops-dashboard | 5176 | 1 | ✅ | ✅ | ✅ |
| 4 | resolution-center | 5177 | 1 | ✅ | ✅ | ✅ |
| 5 | support-queue | 5174 | 1 | ✅ | ✅ | ✅ |

---

## Completeness Matrix

### appointment-board

| Component | File | Status |
|-----------|------|--------|
| **App Shell** | App.tsx | ✅ |
| **Entry Point** | main.tsx | ✅ |
| **Config** | vite.config.ts | ✅ |
| **TypeScript** | tsconfig.json | ✅ |
| **HTML** | index.html | ✅ |
| **Styles** | App.css | ✅ |
| **Env** | .env, .env.example | ✅ |
| **Pages** | pages/AppointmentBoardPage.tsx | ✅ (1 page) |
| **Routes** | routes/index.tsx | ✅ |
| **Hooks** | hooks/useAppointments.ts | ✅ |
| **Services** | services/appointment-service.ts | ✅ |
| **State** | state/atoms.ts | ✅ |
| **Types** | types/index.ts | ✅ |
| **Components** | 4 components | ✅ |
| **Architecture Doc** | ARCHITECTURE.md | ✅ |
| **README** | README.md | ✅ |
| **vite-env** | vite-env.d.ts | ✅ |

**Completeness: 100%**

**Issues:**
- `suggestTechnician()` calls agent named `tech-suggester` but no such agent exists → runtime error
- `@tanstack/react-query` in package.json but never imported
- Shared UI components imported from shared/ui but there's no evidence they're used

---

### crm-tracker

| Component | File | Status |
|-----------|------|--------|
| **App Shell** | App.tsx | ✅ |
| **Entry Point** | main.tsx | ✅ |
| **Config** | vite.config.ts | ✅ |
| **TypeScript** | tsconfig.json | ✅ |
| **HTML** | index.html | ✅ |
| **Env** | .env, .env.example | ✅ |
| **Pages** | pages/CrmTrackerPage.tsx | ✅ (1 page) |
| **Routes** | routes/index.tsx | ✅ |
| **Hooks** | hooks/useCrm.ts | ✅ |
| **Services** | services/crm-service.ts | ✅ |
| **State** | state/atoms.ts | ✅ |
| **Types** | types/index.ts | ✅ |
| **Components** | 6 components | ✅ |
| **Architecture Doc** | ARCHITECTURE.md | ✅ |
| **README** | README.md | ✅ |
| **vite-env** | vite-env.d.ts | ✅ |

**Completeness: 100%**

**Issues:**
- `@tanstack/react-query` in package.json but never imported
- No App.css (unlike appointment-board) → no dark theme styling

---

### ops-dashboard

| Component | File | Status |
|-----------|------|--------|
| **App Shell** | App.tsx | ✅ |
| **Entry Point** | main.tsx | ✅ |
| **Config** | vite.config.ts | ✅ |
| **TypeScript** | tsconfig.json | ✅ |
| **HTML** | index.html | ✅ |
| **Env** | .env, .env.example | ✅ |
| **Pages** | pages/OpsDashboardPage.tsx | ✅ (1 page) |
| **Routes** | routes/index.tsx | ✅ |
| **Hooks** | hooks/useDashboard.ts | ✅ |
| **Services** | services/dashboard-service.ts | ✅ |
| **State** | state/atoms.ts | ✅ |
| **Types** | types/index.ts | ✅ |
| **Components** | 6 components | ✅ |
| **Architecture Doc** | ARCHITECTURE.md | ✅ |
| **README** | README.md | ✅ |
| **vite-env** | vite-env.d.ts | ✅ |

**Completeness: 100%**

**Issues:**
- No App.css

---

### resolution-center

| Component | File | Status |
|-----------|------|--------|
| **App Shell** | App.tsx | ✅ |
| **Entry Point** | main.tsx | ✅ |
| **Config** | vite.config.ts | ✅ |
| **TypeScript** | tsconfig.json | ✅ |
| **HTML** | index.html | ✅ |
| **Env** | .env, .env.example | ✅ |
| **Pages** | pages/ResolutionCenterPage.tsx | ✅ (1 page) |
| **Routes** | routes/index.tsx | ✅ |
| **Hooks** | hooks/useDisputes.ts | ✅ |
| **Services** | services/dispute-service.ts | ✅ |
| **State** | state/atoms.ts | ✅ |
| **Types** | types/index.ts | ✅ |
| **Components** | 3 components | ✅ |
| **Architecture Doc** | ARCHITECTURE.md | ✅ |
| **README** | README.md | ✅ |
| **vite-env** | vite-env.d.ts | ✅ |

**Completeness: 100%**

---

### support-queue

| Component | File | Status |
|-----------|------|--------|
| **App Shell** | App.tsx | ✅ |
| **Entry Point** | main.tsx | ✅ |
| **Config** | vite.config.ts | ✅ |
| **TypeScript** | tsconfig.json | ✅ |
| **HTML** | index.html | ✅ |
| **Env** | .env, .env.example | ✅ |
| **Pages** | pages/SupportQueuePage.tsx | ✅ (1 page) |
| **Routes** | routes/index.tsx | ✅ |
| **Hooks** | hooks/useQueue.ts | ✅ |
| **Services** | services/queue-service.ts | ✅ |
| **State** | state/atoms.ts | ✅ |
| **Types** | types/index.ts | ✅ |
| **Components** | 3 components | ✅ |
| **Architecture Doc** | ARCHITECTURE.md | ✅ |
| **README** | README.md | ✅ |
| **vite-env** | vite-env.d.ts | ✅ |

**Completeness: 100%**

**Issues:**
- Has extra `src/` directory not present in other apps
- No App.css

---

## Cross-Cutting Issues

| Issue | Board | CRM | Ops | Res | Queue |
|-------|-------|-----|-----|-----|-------|
| Broken agent ref (tech-suggester) | ❌ | — | — | — | — |
| Unused @tanstack/react-query dep | ❌ | ❌ | — | — | — |
| Missing App.css | — | ❌ | ❌ | ❌ | ❌ |
| Extra src/ directory | — | — | — | — | ❌ |
| Inconsistent port numbering (no :5174) | — | — | — | — | — |

---

## Application Dependencies

| App | Shared Config | Shared SDK | Shared Types | Shared UI | Shared Utils | Tables Used |
|-----|--------------|------------|-------------|-----------|-------------|-------------|
| appointment-board | ✅ | ✅ | ✅ | ✅ | ✅ | appointments, customers, technicians, operations_log |
| crm-tracker | ✅ | ✅ | ✅ | ❌ | ✅ | accounts, followups, customers, appointments, disputes, tasks, operations_log |
| ops-dashboard | ✅ | ✅ | ✅ | ❌ | ✅ | tickets, appointments, technicians, customers, tasks, operations_log |
| resolution-center | ✅ | ✅ | ✅ | ❌ | ✅ | disputes, customers, appointments, tickets, operations_log |
| support-queue | ✅ | ✅ | ✅ | ❌ | ✅ | tickets, customers, operations_log |

---

## Summary

| Metric | Value |
|--------|-------|
| Total applications | 5 |
| Fully structured (all components present) | 5/5 (100%) |
| With known broken references | 1/5 (appointment-board: tech-suggester agent) |
| With unused dependencies | 2/5 (appointment-board, crm-tracker) |
| With consistent styling | 1/5 (appointment-board has App.css) |
| With consistent structure | 4/5 (support-queue has extra src/) |
| With cross-app navigation | 1/5 (crm-tracker App.tsx has nav links to other apps) |
