# ResQAI V2 — Authentication Flow

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. High-Level Auth Flow

```
┌──────────┐       ┌──────────────┐       ┌────────────┐       ┌──────────┐
│  Browser │       │  Lemma Auth  │       │  Lemma API │       │  ResQAI  │
│          │       │  Platform    │       │  Gateway   │       │  App     │
└────┬─────┘       └──────┬───────┘       └─────┬──────┘       └────┬─────┘
     │                    │                      │                   │
     │  1. Access App     │                      │                   │
     │───────────────────>│                      │                   │
     │                    │                      │                   │
     │  2. Check Session  │                      │                   │
     │<───────────────────│                      │                   │
     │                    │                      │                   │
     │  3. No Session     │                      │                   │
     │  ─────────────────>│                      │                   │
     │                    │                      │                   │
     │  4. OAuth Redirect │                      │                   │
     │<───────────────────│                      │                   │
     │                    │                      │                   │
     │  5. Authenticate   │                      │                   │
     │  (credentials/SSO) │                      │                   │
     │───────────────────>│                      │                   │
     │                    │                      │                   │
     │  6. Auth Callback  │                      │                   │
     │<───────────────────│                      │                   │
     │                    │                      │                   │
     │  7. Initialize     │                      │                   │
     │  LemmaClient       │                      │                   │
     │──────────────────────────────────────────>│                   │
     │                    │                      │                   │
     │  8. AuthGuard      │                      │                   │
     │  Check Complete    │                      │                   │
     │──────────────────────────────────────────────────────────────>│
     │                    │                      │                   │
     │  9. App Content    │                      │                   │
     │<──────────────────────────────────────────────────────────────│
```

---

## 2. Frontend Auth Implementation

### 2.1 Lemma SDK Initialization

```typescript
// packages/sdk/lemma-sdk.ts
const client = new LemmaClient({
  podId: environment.podId,    // VITE_LEMMA_POD_ID
  apiUrl: environment.apiUrl,  // VITE_LEMMA_API_URL
  authUrl: environment.authUrl,// VITE_LEMMA_AUTH_URL
});
await client.initialize();
```

### 2.2 AuthGuard Wrapper

```typescript
// packages/sdk/ProtectedApp.tsx
<AuthGuard
  client={client}
  unauthenticatedFallback={<SignInView client={client} />}
>
  {children}
</AuthGuard>
```

- `AuthGuard` from `lemma-sdk/react` checks for valid session
- Unauthenticated users see the `SignInView` component
- Sign-in redirects to Lemma OAuth with optional `app_id` and `client_id` params

### 2.3 Auth State Context

```typescript
// shared/src/state/AuthState.tsx
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
  } | null;
}
```

---

## 3. Backend Auth Flow (Serverless Functions)

### 3.1 authenticate-user

```python
# functions/authenticate-user/src/handler.py
async def authenticate_user(ctx, data):
    # 1. Look up user by email
    users = pod.records.list("users", {"email": data.email})

    # 2. Validate auth provider match
    if data.auth_provider and user.get("auth_provider") != data.auth_provider:
        return error("Auth provider mismatch")

    # 3. Record last login timestamp
    pod.records.update("users", user["id"], {"last_login_at": now})

    # 4. Create user session (24hr TTL)
    session = pod.records.create("user_sessions", {
        "user_id": user["id"],
        "expires_at": (now + timedelta(hours=24)).isoformat(),
    })

    # 5. Log authentication event
    pod.records.create("operations_log", {
        "action": "user authentication",
        "result": f"user_id={user['id']}",
    })

    # 6. Return session token
    return { token: session["id"], user_id, name, email, role }
```

### 3.2 validate-session

```python
# functions/validate-session/src/handler.py
async def validate_session(ctx, data):
    # 1. Fetch session by ID
    session = pod.records.get("user_sessions", data.session_id)

    # 2. Check existence
    if not session: return { valid: False, error: "Session not found" }

    # 3. Check invalidation flag
    if session.get("is_invalidated"): return { valid: False, error: "Invalidated" }

    # 4. Check expiration
    if datetime.utcnow() > expiry: return { valid: False, error: "Expired" }

    # 5. Return valid
    return { valid: True, user_id: session["user_id"] }
```

---

## 4. MFA (Multi-Factor Authentication)

MFA is **delegated to the Lemma platform** and is not implemented within ResQAI application code.

| Feature | Provider | Status |
|---------|----------|--------|
| TOTP / Authenticator | Lemma Platform | Available |
| SMS Codes | Lemma Platform | Available |
| Recovery Codes | Lemma Platform | Available |
| Remember Device | Lemma Platform | Available |

MFA enforcement policies are configured at the Lemma platform level per organization.

---

## 5. Auth Error Handling

```typescript
// shared/src/api/AuthMiddleware.ts
export class AuthMiddleware {
  async apply(client: ApiClient): Promise<void> {
    const token = this.config.getToken();
    if (token) {
      client.setConfig({ headers: { Authorization: `Bearer ${token}` } });
    }
  }

  async handleAuthError(client: ApiClient): Promise<boolean> {
    if (this.config.refreshToken) {
      const newToken = await this.config.refreshToken();
      if (newToken) {
        client.setConfig({ headers: { Authorization: `Bearer ${newToken}` } });
        return true; // Retry the request
      }
    }
    this.config.onTokenExpired?.(); // Trigger re-auth
    return false;
  }
}
```

---

## 6. Auth Environment Configuration

```env
VITE_LEMMA_POD_ID=your_pod_id
VITE_LEMMA_API_URL=https://api.lemma.ai
VITE_LEMMA_AUTH_URL=https://auth.lemma.ai
VITE_LEMMA_APP_ID=your_app_id
VITE_LEMMA_CLIENT_ID=your_client_id
VITE_LEMMA_TOKEN=                 # Debug token for localhost development
```

**Source:** `packages/config/environment.ts`, `.env.example`

---

## 7. Auth Sequence per Request

```
1. App Component mounts
2. AuthGuard checks LemmaClient for valid session
3. If no session → show SignInView → redirect to Lemma OAuth
4. If session exists → render ProtectedApp content
5. API calls go through AuthMiddleware
6. AuthMiddleware injects Bearer token from LemmaClient
7. On 401 → AuthMiddleware.handleAuthError() → refresh or logout
8. On refresh success → retry request
9. On refresh failure → onTokenExpired() → redirect to login
```
