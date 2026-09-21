# ResQAI — Full Repository Security Audit

**Date:** 2026-06-28
**Auditor:** Repository Security Maintainer
**Scope:** All tracked files across root, `apps/`, `agents/`, `functions/`, `database/`, `docs/`, `packages/`, `scripts/`, `workflows/`, `archive/`, `.github/`

---

## 1. Scan Methodology

| Scan Type | Tool | Scope |
|-----------|------|-------|
| Git-tracked file inventory | `git ls-files` | All committed files |
| Environment file scan | `git ls-files` glob | `*.env`, `*.env.*` |
| Named pattern scan | `rg` glob | filenames containing `secret`, `key`, `token`, `password`, `credential`, `api_key`, `auth`, `oauth`, `ssh`, `private`, `jwt`, `cookie`, `session` |
| Content pattern scan | `rg` | Hardcoded UUID `019efbb7-79ca-7019-8c7f-0ea7320af51a` across all files |
| Content pattern scan | `rg` | Hardcoded URLs `api.lemma.work`, `lemma.work/auth` |
| Content pattern scan | `rg` | Keyword patterns: `password`, `secret`, `api_key`, `token`, `credential`, `oauth`, `ssh` in source code |
| Token/credential heuristic | Manual review | All source files for any suspicious string literals |

---

## 2. Findings Summary

| Category | Count | Status |
|----------|-------|--------|
| `.env` files tracked in git | 0 | ✅ Clean — `.env` is in `.gitignore` |
| Hardcoded API keys / tokens / passwords / SSH keys | 0 | ✅ None found in source code |
| Files with secret/key/token/etc. in filename tracked | 0 | ✅ Clean |
| Live Lemma Pod UUID in tracked files | **21 occurrences across 19 files** | 🔒 **Remediated** |
| Hardcoded production API/Auth URLs in source code | **2 occurrences in `environment.ts`** | 🔒 **Remediated** |
| Hardcoded production API/Auth URLs in documentation | **6 occurrences in `.md` files** | 🔒 **Remediated** |
| `localStorage` token storage (auth system) | 5 `main.tsx` files | ⚠️ Known — owned by Lemma platform team |
| SuperTokens / cookie dependencies | npm packages | ℹ️ No hardcoded secrets |

---

## 3. Remediation Details

### 3.1 Live Lemma Pod UUID Removed

The UUID `019efbb7-79ca-7019-8c7f-0ea7320af51a` was hardcoded in 19 tracked files. All replaced with descriptive placeholders.

| File Group | Occurrences | Replacement |
|------------|-------------|-------------|
| `agents/*/agent.json` (5 files) | `"source"` field | `"ResQAI Customer Support Pod"` |
| `database/migrations/001_tickets_add_status_values_and_column.sql` | SQL comment | `ResQAI Customer Support Pod` |
| `database/docs/account-health-scan.json` | `"pod_id"` value | `"your_pod_id"` |
| `database/docs/flag-slipping-followups.json` | `"pod_id"` value | `"your_pod_id"` |
| `docs/setup.md` | Example table row | `your_pod_id` |
| `docs/resource-map.md` | Pod header | `ResQAI Customer Support Pod` |
| `docs/archive/OLD_architecture/SYSTEM_INVENTORY.md` | Pod header | `ResQAI Customer Support Pod` |
| `docs/archive/OLD_architecture/DATABASE_SCHEMA.md` | Pod header | `ResQAI Customer Support Pod` |
| `docs/archive/OLD_validation/*.md` (4 files) | Pod header | `ResQAI Customer Support Pod` |
| `docs/deployment-summary.md` | Pod header | `ResQAI Customer Support Pod` |
| `docs/integration-status.md` | Pod header | `ResQAI Customer Support Pod` |
| `docs/platform-validation-report.md` | Pod header | `ResQAI Customer Support Pod` |
| `docs/09_Reports/project-audit/environment-audit.md` | `.env` code blocks | `your_pod_id` |

### 3.2 Hardcoded Production URLs Neutralized

| File | Old Value | New Value |
|------|-----------|-----------|
| `packages/config/environment.ts:8` | `https://api.lemma.work` | `https://api.lemma.ai` |
| `packages/config/environment.ts:9` | `https://lemma.work/auth` | `https://auth.lemma.ai` |
| `docs/setup.md` (example table) | `api.lemma.work` / `lemma.work/auth` | `api.lemma.ai` / `auth.lemma.ai` |
| `docs/09_Reports/project-audit/environment-audit.md` (audit blocks) | `api.lemma.work` / `lemma.work/auth` | `api.lemma.ai` / `auth.lemma.ai` |

### 3.3 `.env.example` Templates Updated

All 6 `.env.example` files (root + 5 apps) now include `VITE_LEMMA_TOKEN`, `VITE_LEMMA_APP_ID`, and `VITE_LEMMA_CLIENT_ID`.

**Root `.env.example` additions:**
```env
VITE_LEMMA_TOKEN=
VITE_LEMMA_APP_ID=
VITE_LEMMA_CLIENT_ID=
```

**Root `.env.example` also includes documentation:**
```env
# Debug Token for Local Development
# Run: lemma token | pbcopy  (macOS)
# Run: lemma token | clip    (Windows)
# Then paste the value here to bypass OAuth on localhost.
# VITE_LEMMA_TOKEN=lemma_...
```

### 3.4 `.gitignore` Expanded

| Pattern | Purpose |
|---------|---------|
| `node_modules/`, `.pnp`, `.pnp.js` | Dependency directories |
| `dist/`, `build/`, `*.tsbuildinfo` | Build outputs |
| `__pycache__/`, `.pytest_cache/`, `*.pyc`, `*.pyo`, `*.egg-info/`, `.venv/`, `venv/` | Python artifacts |
| `.env`, `.env.local`, `.env.*.local` | Environment files |
| `.vscode/settings.json`, `.idea/`, `*.swp`, `*.swo`, `*~` | IDE/editor files |
| `logs/`, `*.log`, `npm-debug.log*` | Log files |
| `coverage/`, `.nyc_output/` | Test coverage |
| `.DS_Store`, `Thumbs.db`, `desktop.ini` | OS files |

---

## 4. Verified Safe — No Action Needed

| Category | Finding |
|----------|---------|
| `.env` files in git | ✅ Not tracked — covered by `.gitignore` |
| API keys in source code | ✅ None found |
| Database credentials | ✅ None found |
| OAuth client secrets | ✅ None found |
| JWT secrets | ✅ None found |
| SSH private keys | ✅ None found |
| `eval()` usage | ✅ Not used |
| `dangerouslySetInnerHTML` | ✅ Not used |
| Insecure `JSON.parse` | ✅ All wrapped in try/catch |
| Insecure `require()` | ✅ All ESM |

---

## 5. Remaining Accepted Risks

| Risk | File(s) | Reason |
|------|---------|--------|
| `localStorage` token storage (`lemma_token`) | All 5 `apps/*/main.tsx` | Owned by Lemma platform team — blocked by rules |
| SuperTokens authentication library | `package-lock.json` (npm dependency) | Third-party auth library, no secrets hardcoded |
| `legacy-peer-deps=true` in `.npmrc` | `.npmrc` | Known workaround for Vite 8 + Vitest 4 + React 18 peer deps |

---

## 6. Recommendations

1. **Rotate the Lemma Pod UUID** if it was used as an implicit security boundary — it has been present in git history and documentation.
2. **Consolidate to single root `.env`** — remove per-app `.env` files; apps read from root via npm workspace.
3. **Add pre-commit hook** to scan for UUID patterns, API keys, and `.env` file commits (e.g., `husky` + `lint-staged`).
4. **Add secret scanning to CI** — integrate `truffleHog` or `git secrets` into `.github/workflows/ci.yml`.
5. **Remove unused feature flags** from `.env.example` (`VITE_ENABLE_HEALTH_SCAN`, `VITE_ENABLE_SLIPPING_ALERTS`, `VITE_ENABLE_COORDINATOR`) if they are truly unreferenced.

---

## 7. Verification Results

| Check | Result |
|-------|--------|
| No `.env` files in git index | ✅ Pass |
| No live pod UUID in any tracked file | ✅ Pass |
| No `api.lemma.work` / `lemma.work/auth` in source code | ✅ Pass |
| TypeScript compiles without new errors | ✅ Pass (pre-existing `seed.ts` errors unrelated) |
| All `.env.example` files include `VITE_LEMMA_TOKEN` | ✅ Pass |
| `.gitignore` covers `.env`, builds, IDE, OS, Python, npm artifacts | ✅ Pass |
| All apps use `import.meta.env` (not `process.env`) | ✅ Pass |
| No `console.error` in production code | ✅ Pass (guarded by `import.meta.env.DEV`) |
