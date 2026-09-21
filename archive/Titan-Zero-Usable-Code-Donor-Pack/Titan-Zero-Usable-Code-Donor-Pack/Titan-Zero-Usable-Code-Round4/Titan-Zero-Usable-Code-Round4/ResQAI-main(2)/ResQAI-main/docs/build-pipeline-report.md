# Build Pipeline Report — ResQAI

Generated: 2026-06-28
Audit Mode: Read-Only

---

## 1. Current Build Pipeline

```
Root Scripts (npm run *)
├── dev        → npx tsx scripts/dev.ts
├── build      → npx tsx scripts/build.ts
├── validate   → npx tsx scripts/validate.ts
├── test       → npx tsx scripts/test.ts
├── clean      → npx tsx scripts/clean.ts
└── seed       → npx tsx scripts/seed.ts

Per-App Scripts (apps/*/package.json)
├── dev        → calls root scripts/dev.cmd
├── build      → tsc && vite build
├── preview    → vite preview
└── test       → vitest run
```

---

## 2. Script Analysis

### Root Scripts

| Script | File | Lang | What It Does |
|--------|------|------|-------------|
| `dev` | `scripts/dev.ts` | TypeScript | Starts dev server for a specific app |
| `build` | `scripts/build.ts` | TypeScript | Builds all apps with Vite |
| `validate` | `scripts/validate.ts` | TypeScript | Runs `tsc --noEmit` on all apps |
| `test` | `scripts/test.ts` | TypeScript | Runs all tests (Python + JS) |
| `clean` | `scripts/clean.ts` | TypeScript | Removes build artifacts from apps |
| `seed` | `scripts/seed.ts` | TypeScript | Lists seed data |

### Per-App Scripts

| Script | Implementation | Notes |
|--------|---------------|-------|
| `dev` | `..\\..\\scripts\\dev.cmd` | Calls batch file (Windows-specific) |
| `build` | `tsc && vite build` | Inline — no shared build config |
| `preview` | `vite preview` | Standard Vite preview |
| `test` | `vitest run` | Per-app test runner |

---

## 3. Issues Identified

### Critical
| Issue | Detail | Impact |
|-------|--------|--------|
| Windows-specific dev script | `scripts/dev.cmd` only works on Windows | Blocks macOS/Linux development |
| Missing tsx dependency | Used via `npx tsx` but not in package.json | May fail if npx cache is empty |

### High
| Issue | Detail | Impact |
|-------|--------|--------|
| No shared Vite config | Each app has independent vite.config.ts | Inconsistent build behavior |
| No build caching | No turborepo, nx, or similar | All apps rebuild on every run |
| Python tests not integrated | Only JS tests run via root `npm test` | Python tests may be missed |
| No .env validation | Build/validate succeed even without .env | Runtime failures on deployment |

### Medium
| Issue | Detail | Impact |
|-------|--------|--------|
| Per-app test commands | Must run `npm test` in each app | No single `npm test` at root |
| TypeScript config duplication | Root + 5 app tsconfig.json | Drift risk |
| No build output directory naming convention | Apps output to `dist/` in their own dir | May conflict with workspace tools |
| No production build optimization | No code splitting config, no bundle analysis | Larger builds than necessary |

### Low
| Issue | Detail | Impact |
|-------|--------|--------|
| No lint step | No ESLint/Prettier integration in build | Quality gaps |
| No type-check-only script | validate runs tsc but not separately | Slow iteration |
| `scripts/dev.cmd` references parent dir | Uses `..\..\` path traversal | Fragile path |
| No `.nvmrc` or `.node-version` | Node version not pinned | Version mismatch risk |

---

## 4. CI Readiness

| Requirement | Status | Notes |
|-------------|--------|-------|
| CI config file | ✅ | `.github/workflows/ci.yml` exists |
| Test execution | ❌ | No test step in CI config |
| Lint check | ❌ | No lint step |
| Build verification | ✅ | Build step present |
| TypeScript validation | ❌ | No validate step |
| Caching | ❌ | No dependency caching |
| Matrix strategy | ❌ | Single OS/node config |
| Artifact upload | ❌ | Build artifacts not saved |

---

## 5. Recommended Pipeline

```
npm install
  → npm run validate     (type-check all apps)
  → npm run lint         (ESLint check)
  → npm test             (Vitest + pytest)
  → npm run build        (Vite production build)
  → Upload dist/          (CI artifact / deploy)
```

---

## 6. Python Build Pipeline

| Aspect | Status |
|--------|--------|
| Dependency management | None (no requirements.txt) |
| Test runner | pytest (4 functions have tests) |
| Linting | None |
| Type checking | None |
| CI integration | Not configured |

---

## 7. Summary

| Category | Score | Key Action |
|----------|:----:|------------|
| Build speed | 5/10 | No caching, serial builds |
| Dev experience | 6/10 | Windows-specific script |
| CI readiness | 4/10 | Minimal CI config |
| Test integration | 3/10 | Python tests not in npm pipeline |
| Production readiness | 5/10 | No optimization, no env validation |
| **Overall** | **5/10** | Needs standardization |
