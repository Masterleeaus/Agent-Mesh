# Build Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Configuration Files Inventory

| File | Location | Status |
|------|----------|--------|
| package.json | / | ✅ Root workspace config |
| tsconfig.json | / | ✅ Scripts compilation |
| .npmrc | / | ✅ legacy-peer-deps=true |
| .gitignore | / | ✅ Standard ignores |
| ResQAI.code-workspace | / | ✅ VS Code workspace |

### Per-App Configurations

| App | package.json | tsconfig.json | vite.config.ts | vite-env.d.ts |
|-----|-------------|---------------|----------------|---------------|
| appointment-board | ✅ | ✅ | ✅ | ✅ |
| crm-tracker | ✅ | ✅ | ✅ | ✅ |
| ops-dashboard | ✅ | ✅ | ✅ | ✅ |
| resolution-center | ✅ | ✅ | ✅ | ✅ |
| support-queue | ✅ | ✅ | ✅ | ✅ |

### Missing Configurations — ✅ STATUS UPDATE

| Config | Location | Impact | Status |
|--------|----------|--------|--------|
| eslint config | / | No linting configured | ✅ **Added** |
| prettier config | / | No formatter config (uses VS Code defaults) | ⚠️ Still missing |
| vitest config | / | No test framework config | ⚠️ Still missing |
| .editorconfig | / | No editor config | ⚠️ Still missing |

---

## package.json Analysis

### Workspace Configuration

```json
{
  "workspaces": ["apps/*"]
}
```

**Issues:**
- ✅ Workspaces are correctly configured
- ⚠️ `scripts` reference `npx tsx` for script execution, but `tsx` is not a declared dependency
- ⚠️ `lemma-sdk` is not in root dependencies (each app declares it individually)
- ⚠️ `vitest` is not declared anywhere (test.ts runs `npx vitest run` which relies on npx)

---

## tsconfig.json Analysis

### Root tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["scripts/**/*.ts"],
  "exclude": ["node_modules", "apps", "agents", "functions", "database", "docs"]
}
```

**Issues:**
- ❌ **Does NOT include shared/ directory** — shared code is not type-checked by root tsconfig
- ❌ **Excludes apps/ entirely** — each app has its own tsconfig, but there's no way to type-check all at once
- ⚠️ Root tsconfig only type-checks scripts/

### Per-App tsconfig.json (identical in all 5 apps)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Issues:**
- ⚠️ `noUnusedLocals: false` and `noUnusedParameters: false` — suppresses type checking for unused code
- ⚠️ All 5 apps have identical tsconfig — could be centralized

---

## vite.config.ts Analysis

### appointment-board (port 5173)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

### Other Apps

| App | Port | 
|-----|------|
| crm-tracker | 5175 |
| ops-dashboard | 5176 |
| resolution-center | 5177 |
| support-queue | 5174 |

**Issues:**
- ⚠️ Ports are hardcoded, not read from environment
- ⚠️ No `resolve.alias` configured for shared/ imports — relies on relative paths (e.g. `../../../shared/`)
- ✅ All use same plugin configuration

---

## Build Scripts Analysis

| Script | Command | Notes |
|--------|---------|-------|
| dev | npx tsx scripts/dev.ts | Starts Vite dev for specified app |
| build | npx tsx scripts/build.ts | Builds all/specified app |
| validate | npx tsx scripts/validate.ts | Type-checks all apps |
| test | npx tsx scripts/test.ts | Runs vitest + pytest |
| clean | npx tsx scripts/clean.ts | Removes build artifacts |
| seed | npx tsx scripts/seed.ts | Seeds database with fixture data |

### dev.cmd Usage

All 5 apps' `package.json` have `"dev": "..\\..\\scripts\\dev.cmd"` — uses a shared batch script to start Vite.

---

## Build Inconsistencies — ✅ STATUS UPDATE

| Issue | Details | Status |
|-------|---------|--------|
| ~~No `tsx` dependency~~ | All scripts use `npx tsx` but `tsx` is not in any package.json | ✅ **Resolved** — `tsx` confirmed in root devDependencies |
| ~~No `vitest` dependency~~ | Test script runs `npx vitest run` but `vitest` is not declared | ✅ **Resolved** — `vitest` confirmed in root devDependencies |
| Hardcoded ports | Ports hardcoded in vite.config.ts per app | ⚠️ Still open |
| Relative shared imports | All apps use `../../../shared/` paths — fragile | ⚠️ Still open |
| No build caching | No turborepo/nx/lage configured for monorepo | ⚠️ Still open |
| Python test dependency | Tests require `pytest` and `pydantic` not declared anywhere | ⚠️ Still open |

---

## Recommendations — ✅ STATUS UPDATE

1. ✅ **`tsx` and `vitest` as root devDependencies** — **DONE**
2. ✅ **`eslint` configuration** — **DONE**
3. **Centralize tsconfig base** — use `tsconfig.json` as a base config with per-app overrides
4. **Add `prettier` configuration** — currently missing
5. **Add Vite `resolve.alias`** for `@shared/` → `packages/` to avoid relative paths
6. **Remove per-app package-lock.json files** — use workspace-level lock only
7. **Add Python dependency file** (`requirements.txt` or `pyproject.toml`) for function dependencies
