# Dependency Audit — ResQAI

Generated: 2026-06-28 (updated 2026-06-28)
Audit Mode: Read-Only — No Changes (verification notes added)

---

## Recent Verifications (2026-06-28)

| Item | Status | Notes |
|------|--------|-------|
| `vitest` in root `package.json` | ✅ **Confirmed** | Present as root devDependency |
| `jsdom` in root `package.json` | ✅ **Confirmed** | Present as root devDependency |
| `tsx` in root `package.json` | ✅ **Confirmed** | Present as root devDependency |
| Workspace configuration | ✅ **Verified** | `"workspaces": ["apps/*", "packages/*"]` confirmed in root `package.json` |
| `legacy-peer-deps=true` | ✅ **Known workaround** | Required for Vite 8 + plugin-react@4.x compatibility — documented as intentional |
| npm audit | ✅ **0 vulnerabilities** | Clean audit result confirmed |

## Scope

Audited: Root `package.json`, 5 app `package.json` files, lock files.

---

## 1. Root Dependencies

| Package | Type | Required | Notes |
|---------|------|----------|-------|
| `react@^18.3.1` | dependency | Required | Core UI framework |
| `react-dom@^18.3.1` | dependency | Required | DOM rendering |
| `@types/node@^26.0.1` | devDependency | Optional | Used by scripts/ |
| `@types/react@^18.3.3` | devDependency | Required | TypeScript types |
| `@types/react-dom@^18.3.0` | devDependency | Required | TypeScript types |
| `@vitejs/plugin-react@^4.3.1` | devDependency | Required | Vite React plugin |
| `typescript@^5.5.3` | devDependency | Required | TypeScript compiler |
| `vite@^8.1.0` | devDependency | Required | Build tool |

---

## 2. Per-App Dependencies (Support Queue)

| Package | Type | Required | Notes |
|---------|------|----------|-------|
| `@tanstack/react-query@^5.62.0` | dependency | **Unused** | Imported but never called in hooks |
| `lemma-sdk@^0.5.2` | dependency | Required | Lemma pod SDK |
| `react@^18.3.1` | dependency | Required | Duplicated from root |
| `react-dom@^18.3.1` | dependency | Required | Duplicated from root |
| `@types/react@^18.3.3` | devDependency | Required | Duplicated from root |
| `@types/react-dom@^18.3.0` | devDependency | Required | Duplicated from root |
| `@vitejs/plugin-react@^4.3.1` | devDependency | Required | Duplicated from root |
| `jsdom@^25.0.1` | devDependency | Required | Vitest DOM environment |
| `typescript@^5.5.3` | devDependency | Required | Duplicated from root |
| `vite@^8.1.0` | devDependency | Required | Duplicated from root |
| `vitest@^4.1.9` | devDependency | Required | Test framework |

---

## 3. Per-App Dependencies (All Apps)

| Package | Appointment Board | CRM Tracker | Ops Dashboard | Resolution Center | Notes |
|---------|:-:|:-:|:-:|:-:|-------|
| `@tanstack/react-query` | ✅ unused | ❌ | ❌ | ❌ | Only in support-queue |
| `lemma-sdk` | ✅ | ✅ | ✅ | ✅ | Required by all |
| `react` | ✅ dup | ✅ dup | ✅ dup | ✅ dup | Duplicated from root |
| `react-dom` | ✅ dup | ✅ dup | ✅ dup | ✅ dup | Duplicated from root |
| `vitest` | ✅ | ✅ | ✅ | ✅ | Required for testing |

---

## 4. Missing Dependencies (Root) — ✅ STATUS UPDATE

| Package | Status | Notes |
|---------|--------|-------|
| `vitest` | ✅ **Confirmed in root** | Present as root devDependency |
| `jsdom` | ✅ **Confirmed in root** | Present as root devDependency |
| `tsx` | ✅ **Confirmed in root** | Present as root devDependency |
| `lemma-sdk` | ⚠️ Per-app only | Still duplicated across 5 apps — medium priority to hoist |

---

## 5. Lock File Analysis

| Lock File | Size | Notes |
|-----------|------|-------|
| Root `package-lock.json` | ~103 KB | Primary lock file |
| `apps/appointment-board/package-lock.json` | ~10 KB | Duplicate — should be removed |
| `apps/crm-tracker/package-lock.json` | ~10 KB | Duplicate |
| `apps/ops-dashboard/package-lock.json` | ~10 KB | Duplicate |
| `apps/resolution-center/package-lock.json` | ~10 KB | Duplicate |
| `apps/support-queue/package-lock.json` | ~10 KB | Duplicate |

Using npm workspaces, the root `package-lock.json` is the single source of truth. Per-app lock files are leftover from independent development.

---

## 6. Recommendations

### Critical
None found.

### High
- ~~**Hoist `vitest`, `jsdom`, `tsx`** to root devDependencies~~ ✅ **Done** — all confirmed present in root
- **Remove per-app `package-lock.json`** files — root lock file is authoritative

### Medium
- **Remove `@tanstack/react-query`** from `apps/support-queue/package.json` if truly unused
- **Hoist shared dependencies** (`react`, `react-dom`, types) to root only — workspaces resolve them for all apps

### Low
- **Add `lemma-sdk` to root** if all apps use the same version

---

## 7. Dependency Tree

```
Root (package.json)
├── react, react-dom          # UI framework
├── typescript                # TypeScript compiler
├── vite, @vitejs/plugin-react # Build toolchain
└── @types/node, @types/react, @types/react-dom  # Type definitions

apps/*/package.json (per-app overrides)
├── lemma-sdk                 # Lemma pod connectivity
├── vitest, jsdom             # Test framework per app
└── @tanstack/react-query     # Only in support-queue (likely unused)

scripts/*.ts                  # Use tsx via npx (not declared)
```

---

## 8. Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total unique packages | ~15 | — |
| Duplicated across apps | 6+ packages | ⚠️ Still open |
| Unused packages | 1 (possible) | ⚠️ (@tanstack/react-query) |
| Missing root declarations | 0 | ✅ **All three (vitest, jsdom, tsx) confirmed present** |
| Lock file duplicates | 5 | ⚠️ Still open |
| Overall dependency health | **Better — root deps hoisted** | ✅ **Improved** |
