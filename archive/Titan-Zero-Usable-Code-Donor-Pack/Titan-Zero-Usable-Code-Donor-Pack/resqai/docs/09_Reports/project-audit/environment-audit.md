# Environment Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Current .env (Root)

```
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai
```

---

## Current .env.example (Root)

```
# Lemma Platform Connection
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai
VITE_LEMMA_APP_ID=
VITE_LEMMA_CLIENT_ID=

# Server Configuration
PORT=5173

# Feature Flags
VITE_ENABLE_HEALTH_SCAN=true
VITE_ENABLE_SLIPPING_ALERTS=true
VITE_ENABLE_COORDINATOR=true

# Logging
LOG_LEVEL=info
```

---

## Per-App .env Files

All 5 apps have identical `.env` files:
```
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai
```

All 5 apps have identical `.env.example` files:
```
# Lemma Pod Configuration
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai
```

---

## Environment Variable Classification

| Variable | Required | Dev | Prod | Secret | Deprecated | Notes |
|----------|----------|-----|------|--------|------------|-------|
| VITE_LEMMA_POD_ID | **Required** | ✅ | ✅ | ⚠️ | — | Should be treated as secret (contains deployment UUID) |
| VITE_LEMMA_API_URL | **Required** | ✅ | ✅ | — | — | — |
| VITE_LEMMA_AUTH_URL | **Required** | ✅ | ✅ | — | — | — |
| VITE_LEMMA_APP_ID | **Optional** | ✅ | ✅ | — | — | Currently empty in example |
| VITE_LEMMA_CLIENT_ID | **Optional** | ✅ | ✅ | — | — | Currently empty in example |
| PORT | **Optional** | ✅ | — | — | — | Dev-only, production uses platform port |
| VITE_ENABLE_HEALTH_SCAN | **Optional** | ✅ | ✅ | — | — | Feature flag |
| VITE_ENABLE_SLIPPING_ALERTS | **Optional** | ✅ | ✅ | — | — | Feature flag |
| VITE_ENABLE_COORDINATOR | **Optional** | ✅ | ✅ | — | — | Feature flag |
| LOG_LEVEL | **Optional** | ✅ | — | — | — | Dev-only |

---

## Issues Found

| Issue | Details |
|-------|---------|
| **Live credentials in .env** | `.env` contained a real pod ID and API URL (now replaced with placeholders) |
| **5 duplicate .env files** | Root + 5 apps = 6 copies of same 3 variables |
| **Missing variables** | VITE_LEMMA_APP_ID, VITE_LEMMA_CLIENT_ID not set in any active .env |
| **Inconsistent example** | Root `.env.example` has full config, apps `.env.example` has minimal config |
| **Feature flags not used** | VITE_ENABLE_HEALTH_SCAN, VITE_ENABLE_SLIPPING_ALERTS, VITE_ENABLE_COORDINATOR are not referenced in any source code |
| **PORT not honored** | Each app uses hardcoded port in vite.config.ts, not from environment |
| **Input schema feature flags** | Feature flags use VITE_ prefix (client-side), but flags like LOG_LEVEL are server-side (no VITE_ prefix) — mixed concerns |

---

## Recommended .env.example Structure

```env
# ──────────────────────────────────────────────
# ResQAI — Root Environment Configuration
# ──────────────────────────────────────────────
# Copy this file to .env and fill in your values.
# See docs/setup.md for instructions.

# === Lemma Platform Connection (REQUIRED) ===
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai

# === Lemma Platform Connection (OPTIONAL) ===
VITE_LEMMA_APP_ID=
VITE_LEMMA_CLIENT_ID=

# === Feature Flags (OPTIONAL, default=true) ===
VITE_ENABLE_HEALTH_SCAN=true
VITE_ENABLE_SLIPPING_ALERTS=true
VITE_ENABLE_COORDINATOR=true

# === Development (OPTIONAL) ===
# PORT is configured per-app in vite.config.ts
# LOG_LEVEL is unused in current codebase
```

---

## Recommendations

1. **Immediately remove live `.env` from version control** — or ensure it's in `.gitignore` (it IS in .gitignore already ✅)
2. **Consolidate to single root `.env`** — remove per-app .env files; apps read from root via workspace
3. **Reconcile `.env.example` templates** — make root the canonical version, remove per-app .env.example files
4. **Remove unused feature flags** from .env.example — or implement them in code
5. **Add VITE_LEMMA_TOKEN** to .env.example — used in main.tsx for testing
