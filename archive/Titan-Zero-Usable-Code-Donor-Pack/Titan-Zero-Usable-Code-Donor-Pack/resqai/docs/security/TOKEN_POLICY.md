# ResQAI V2 — Token Policy

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. Token Architecture

ResQAI V2 relies on the Lemma platform for token management. There are three token categories:

```
┌─────────────────────────────────────────────┐
│             LEMMA PLATFORM TOKENS            │
├─────────────────────────────────────────────┤
│ 1. OAuth Access Token (short-lived JWT)      │
│ 2. Refresh Token (long-lived, rotating)      │
│ 3. Session Token (server-side session ID)    │
└─────────────────────────────────────────────┘
```

---

## 2. Token Types

### 2.1 Lemma OAuth Access Token

| Property | Value |
|----------|-------|
| **Type** | JWT (JSON Web Token) |
| **Lifetime** | Platform-defined (typically 15-60 minutes) |
| **Storage** | Lemma SDK internal (memory) |
| **Transmission** | `Authorization: Bearer <token>` header |
| **Rotation** | Via refresh token |

**Usage in code:**
```typescript
// shared/src/api/AuthMiddleware.ts
client.setConfig({ headers: { Authorization: `Bearer ${token}` } });
```

### 2.2 Lemma Refresh Token

| Property | Value |
|----------|-------|
| **Type** | Opaque token |
| **Lifetime** | Platform-defined (typically 7-30 days) |
| **Storage** | Lemma SDK internal (secure storage) |
| **Rotation** | Rotation on each refresh (old token invalidated) |

**Refresh flow:**
```typescript
// Auto-managed by Lemma SDK AuthMiddleware
const newToken = await this.config.refreshToken();
if (newToken) {
  client.setConfig({ headers: { Authorization: `Bearer ${newToken}` } });
}
```

### 2.3 Session Token (ResQAI Server-Side)

| Property | Value |
|----------|-------|
| **Type** | UUID v4 (session record ID) |
| **Lifetime** | 24 hours |
| **Storage** | `user_sessions_v2` table (hashed) |
| **Validation** | `validate-session` function |

---

## 3. Token Lifecycle

```
User Login
    │
    ▼
Lemma OAuth Flow ──> Access Token (JWT) + Refresh Token
    │
    ▼
Lemma SDK Initialization
    │
    ├── AuthGuard checks access token validity
    ├── AuthMiddleware injects Bearer token
    │
    ▼
Token Expiry
    │
    ├── AuthMiddleware.handleAuthError()
    │   ├── refreshToken() → new Access Token
    │   └── onTokenExpired() → redirect to login
    │
    ▼
Logout / Revoke
    │
    ├── Clear SDK token cache
    ├── Invalidate server session
    └── Redirect to login
```

---

## 4. Token Storage

| Location | Token Type | Storage Mechanism |
|----------|-----------|-------------------|
| Browser memory | JWT Access Token | Lemma SDK internal state |
| Secure storage (localStorage) | Refresh Token | Lemma platform managed |
| Server database (hashed) | Session Token | `user_sessions_v2.token_hash` |

**Security note:** The Lemma SDK manages token storage. The application only interacts via the `getToken()` callback.

---

## 5. Token Refresh Flow

```typescript
async handleAuthError(client: ApiClient): Promise<boolean> {
  // 1. Attempt token refresh
  const newToken = await this.config.refreshToken();

  if (newToken) {
    // 2. Update Authorization header
    client.setConfig({ headers: { Authorization: `Bearer ${newToken}` } });
    return true; // Signal caller to retry
  }

  // 3. Refresh failed → trigger re-authentication
  this.config.onTokenExpired?.();
  return false;
}
```

### Retry Logic

| Attempt | Behavior |
|---------|----------|
| Token valid | Request proceeds normally |
| Token expired | Refresh attempted automatically |
| Refresh succeeds | Original request retried with new token |
| Refresh fails | User redirected to login |

---

## 6. Token Validation

### Client-Side

- Lemma SDK AuthGuard validates token before rendering
- AuthMiddleware intercepts 401 responses

### Server-Side

- `validate-session` function checks:
  1. Session record exists
  2. Session is not invalidated (`is_invalidated = false`)
  3. Session has not expired

---

## 7. API Key Tokens

For machine-to-machine communication:

| Property | Value |
|----------|-------|
| **Permission** | `admin:manage_api_keys` |
| **Generation** | Admin Center |
| **Lifetime** | Configurable (recommended max 365 days) |
| **Rotation** | Manual via Admin Center |
| **Scope** | Specific permission set |

---

## 8. Token Security Policies

| Policy | Rule |
|--------|------|
| Minimum key length | 32 characters (API keys) |
| Hash storage | Session tokens SHA-256 hashed |
| Transmission | HTTPS only (TLS 1.2+) |
| Header format | `Authorization: Bearer <token>` |
| Refresh limit | Configurable (default: no limit) |
| Concurrent sessions | Unlimited (configurable per org) |
| Token in URLs | Prohibited |
| Token in logs | Redacted / excluded |

---

## 9. Debug Token (Local Development)

```env
# .env or .env.local
VITE_LEMMA_TOKEN=lemma_xxx  # Debug token for localhost
```

- Bypasses OAuth on localhost
- Should never be committed to version control
- `.gitignore` already covers `.env` and `.env.local`
