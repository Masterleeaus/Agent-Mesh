# ResQAI V2 — Secret Management

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. Secret Inventory

| Secret | Location | Storage | Rotated | Git-Tracked |
|--------|----------|---------|---------|-------------|
| Lemma Pod ID | `VITE_LEMMA_POD_ID` | `.env` | Per deployment | No |
| Lemma API URL | `VITE_LEMMA_API_URL` | `.env` | N/A (static) | No |
| Lemma Auth URL | `VITE_LEMMA_AUTH_URL` | `.env` | N/A (static) | No |
| Lemma App ID | `VITE_LEMMA_APP_ID` | `.env` | Per app | No |
| Lemma Client ID | `VITE_LEMMA_CLIENT_ID` | `.env` | Per app | No |
| Debug Token | `VITE_LEMMA_TOKEN` | `.env.local` | Frequently | No |
| Auth Provider Keys | Lemma Platform | Platform vault | Platform-managed | N/A |
| Database Credentials | Lemma Platform | Platform-managed | Platform-managed | N/A |
| API Keys (custom) | Admin Center | `connectors` table | Per key | No |

---

## 2. Secret Storage Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     ENVIRONMENT VARIABLES                   │
├────────────────────────────────────────────────────────────┤
│  .env (gitignored)          │  Per-environment secrets     │
│  .env.local (gitignored)    │  Local dev overrides         │
│  .env.example (tracked)     │  Template (placeholder vals) │
│  CI/CD Secrets              │  GitHub Actions secrets       │
│  Lemma Platform Vault       │  Managed secrets             │
└────────────────────────────────────────────────────────────┘
```

---

## 3. .gitignore Protections

The `.gitignore` covers:

```gitignore
.env
.env.local
.env.*.local
```

All environment files containing secrets are excluded from version control.

---

## 4. Environment File Template

```env
# Source: .env.example (tracked in git, contains only placeholders)
VITE_LEMMA_POD_ID=
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai
VITE_LEMMA_APP_ID=
VITE_LEMMA_CLIENT_ID=

# Debug Token for Local Development
# Run: lemma token | clip    (Windows)
# VITE_LEMMA_TOKEN=lemma_...
```

All `.env.example` files across root and 5 V1 apps include `VITE_LEMMA_TOKEN`, `VITE_LEMMA_APP_ID`, and `VITE_LEMMA_CLIENT_ID`.

---

## 5. Secret Access Patterns

| Pattern | Description | Used By |
|---------|-------------|---------|
| `import.meta.env.VITE_*` | Vite-injected env vars | React apps |
| `os.environ.get()` | Environment variables | Python functions |
| Lemma SDK `Pod.from_env()` | Platform-managed secrets | Python functions |
| `LemmaClient({podId, apiUrl, authUrl})` | Client initialization | TypeScript SDK |

### Frontend

```typescript
// packages/config/environment.ts
export function getEnvVar(key: string, fallback = ''): string {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : fallback;
}

export const environment = {
  podId: getEnvVar('VITE_LEMMA_POD_ID'),
  apiUrl: getEnvVar('VITE_LEMMA_API_URL', 'https://api.lemma.ai'),
  authUrl: getEnvVar('VITE_LEMMA_AUTH_URL', 'https://auth.lemma.ai'),
  appId: getEnvVar('VITE_LEMMA_APP_ID'),
  clientId: getEnvVar('VITE_LEMMA_CLIENT_ID'),
};
```

### Backend (Python Functions)

```python
# functions/authenticate-user/src/handler.py
from lemma_sdk import Pod
pod = Pod.from_env()  # Reads platform-managed secrets
```

---

## 6. Secret Rotation Policy

| Secret | Rotation Frequency | Method |
|--------|-------------------|--------|
| Lemma Pod ID | Per environment | Update `.env` |
| API Keys | Every 90 days (recommended) | Admin Center UI |
| Debug Tokens | Daily (development) | `lemma token` CLI |
| Auth Provider Secrets | Platform-managed | Lemma platform |
| Database Credentials | Platform-managed | Lemma platform |

---

## 7. CI/CD Secret Management

GitHub Actions secrets are used for CI/CD:

```yaml
# .github/workflows/ci.yml
env:
  VITE_LEMMA_POD_ID: ${{ secrets.LEMMA_POD_ID }}
  VITE_LEMMA_API_URL: ${{ secrets.LEMMA_API_URL }}
  VITE_LEMMA_AUTH_URL: ${{ secrets.LEMMA_AUTH_URL }}
```

Secrets are configured in the GitHub repository settings and are never exposed in logs or workflow output.

---

## 8. Secret Scanning

### Automated Scans

The repository security audit (`docs/security/SECURITY_AUDIT.md`) verified:

| Check | Result |
|-------|--------|
| No `.env` files in git index | ✅ Pass |
| No hardcoded API keys/tokens/passwords | ✅ Pass |
| No live Pod UUID in tracked files | ✅ Pass |
| No production URLs in source code | ✅ Pass |
| No SSH keys in repository | ✅ Pass |
| No database credentials in source | ✅ Pass |

### Recommended Additions

| Recommendation | Tool |
|----------------|------|
| Pre-commit secret scanning | `husky` + `lint-staged` |
| CI secret scanning | `truffleHog` or `git secrets` |
| UUID pattern scanning | Custom regex in CI |
| `.env` commit prevention | Pre-commit hook |

---

## 9. Principles of Secret Management

1. **Never commit secrets** — All secrets are in `.gitignore`-protected files or platform-managed
2. **Least privilege** — Each component only accesses its required secrets
3. **Separation of concerns** — Dev secrets ≠ production secrets
4. **Audit trail** — Secret access is logged in operations_log and audit_log
5. **Platform delegation** — Infrastructure secrets are managed by Lemma platform
6. **Environment isolation** — `.env` per environment, never shared
