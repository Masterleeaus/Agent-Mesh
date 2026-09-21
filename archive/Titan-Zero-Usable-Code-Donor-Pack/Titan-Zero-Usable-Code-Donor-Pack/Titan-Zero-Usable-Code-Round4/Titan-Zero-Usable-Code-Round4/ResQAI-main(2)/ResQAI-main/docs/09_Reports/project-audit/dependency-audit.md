# Dependency Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Root package.json Dependencies

### Production Dependencies

| Package | Version | Required | Classification | Notes |
|---------|---------|----------|---------------|-------|
| react | ^18.3.1 | Yes | Required | Core UI framework |
| react-dom | ^18.3.1 | Yes | Required | React DOM rendering |

### Dev Dependencies

| Package | Version | Required | Classification | Notes |
|---------|---------|----------|---------------|-------|
| @types/node | ^26.0.1 | Yes | Required | For script compilation |
| @types/react | ^18.3.3 | Yes | Required | React type definitions |
| @types/react-dom | ^18.3.0 | Yes | Required | React DOM type defs |
| @vitejs/plugin-react | ^4.3.1 | Yes | Required | Vite React plugin |
| typescript | ^5.5.3 | Yes | Required | TypeScript compiler |
| vite | ^8.1.0 | Yes | Required | Build tool |

### Missing from Root Dependencies

| Package | Used In | Why Missing |
|---------|---------|-------------|
| lemma-sdk | All apps (shared/sdk imports it) | NOT in root deps; each app declares it individually |
| @tanstack/react-query | appointment-board, crm-tracker | NOT in root deps; each app declares it individually |
| vitest | Not declared anywhere | No vitest config file found |
| tsx | scripts use `npx tsx` | Not in deps; executed via npx |

---

## Per-App package.json Dependencies

### appointment-board

| Package | Version | Classification | Notes |
|---------|---------|---------------|-------|
| @tanstack/react-query | ^5.62.0 | Optional | Imported but not actually used in code files |
| lemma-sdk | ^0.5.2 | Required | SDK wrapper |
| react | ^18.3.1 | Required | Hoisted from root |
| react-dom | ^18.3.1 | Required | Hoisted from root |
| @types/react | ^18.3.3 | Dev | Duplicated across all 5 apps |
| @types/react-dom | ^18.3.0 | Dev | Duplicated across all 5 apps |
| @vitejs/plugin-react | ^4.3.1 | Dev | Duplicated across all 5 apps |
| typescript | ^5.5.3 | Dev | Duplicated across all 5 apps |
| vite | ^8.1.0 | Dev | Duplicated across all 5 apps |

### crm-tracker — same packages (identical)

### ops-dashboard — same packages (identical)

### resolution-center — same packages (identical)

### support-queue — same packages (identical)

---

## Duplicated Dependencies

| Package | Root | appt-board | crm-tracker | ops-dash | res-center | support-queue | Total |
|---------|------|-----------|-------------|----------|------------|---------------|-------|
| react ^18.3.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| react-dom ^18.3.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| @types/react ^18.3.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| @types/react-dom ^18.3.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| @vitejs/plugin-react ^4.3.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| typescript ^5.5.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| vite ^8.1.0 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 6 |
| lemma-sdk ^0.5.2 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 5 |
| @tanstack/react-query ^5.62.0 | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | 2 |

---

## Unused Dependencies

| Package | Location | Reason |
|---------|----------|--------|
| @tanstack/react-query | appointment-board | Imported in package.json but never imported in any app file |
| @tanstack/react-query | crm-tracker | Imported in package.json but never imported in any app file |

---

## Recommendations

1. **Hoist all identical devDependencies to root** — `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite` are identical across all 6 package.json files.
2. **Add `lemma-sdk` to root dependencies** — it is used by all 5 apps.
3. **Remove `@tanstack/react-query`** from both apps that declare it — it is never imported or used.
4. **Add `vitest`** as a dev dependency — currently tests cannot run without installing it.
5. **Add `tsx`** as a dev dependency — scripts currently depend on `npx tsx` at runtime.
6. **Remove duplicate `package-lock.json` files** in each app directory — the root lock file should be the single source of truth.
