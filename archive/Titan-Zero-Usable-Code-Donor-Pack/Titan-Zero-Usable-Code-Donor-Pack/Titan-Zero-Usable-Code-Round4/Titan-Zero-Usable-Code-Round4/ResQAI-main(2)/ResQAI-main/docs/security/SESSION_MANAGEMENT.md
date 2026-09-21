# ResQAI V2 — Session Management

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. Session Data Model

```sql
-- Source: database/migrations_v2/008_create_user_sessions_v2.sql
CREATE TABLE user_sessions_v2 (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users_v2(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,        -- Hashed session token
  ip_address      TEXT,                 -- Originating IP
  user_agent      TEXT,                 -- Browser/device user-agent
  expires_at      TIMESTAMPTZ,          -- Session expiration
  last_activity_at TIMESTAMPTZ,         -- Last request timestamp
  is_active       BOOLEAN DEFAULT true, -- Soft invalidation flag
  created_at      TIMESTAMPTZ
);
```

### Indexes

```sql
CREATE INDEX idx_sessions_user_id ON user_sessions_v2(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions_v2(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions_v2(expires_at);
CREATE INDEX idx_sessions_active ON user_sessions_v2(is_active) WHERE is_active = true;
```

---

## 2. Session Lifecycle

```
                    CREATION
                       │
                       ▼
                 ┌─────────────┐
                 │   ACTIVE    │
                 │  (24hr TTL) │
                 └──────┬──────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
     ┌──────────────┐      ┌──────────────┐
     │   EXPIRED    │      │ INVALIDATED  │
     │ (TTL passed) │      │ (logout/sec) │
     └──────────────┘      └──────────────┘
```

| State | Trigger | Behavior |
|-------|---------|----------|
| **Active** | Login / token creation | Allows authenticated requests |
| **Expired** | TTL exceeded (24h) | Requires re-authentication |
| **Invalidated** | Logout / security event | Immediately rejected |

---

## 3. Session Creation

Session is created in the `authenticate-user` function:

```python
now = datetime.utcnow()
session = pod.records.create("user_sessions", {
    "user_id": user["id"],
    "created_at": now.isoformat(),
    "expires_at": (now + timedelta(hours=24)).isoformat(),
    "is_active": True,
})
```

- Session token = session record ID (UUID v4)
- TTL: 24 hours from creation
- Token hash stored server-side for validation

---

## 4. Session Validation

Validation is performed by the `validate-session` function:

| Check | Logic | Response |
|-------|-------|----------|
| **Exists** | `pod.records.get("user_sessions", session_id)` | `false` if null |
| **Invalidated** | `session.is_invalidated === true` | `false` with reason |
| **Expired** | `session.expires_at < now` | `false` with reason |
| **Valid** | All checks pass | `true` with user_id |

---

## 5. Token Hashing

Tokens are stored as hashed values in the `token_hash` column:

- Algorithm: SHA-256 (or platform-defined)
- Raw tokens are never stored in the database
- Token hash enables server-side validation without exposing secrets

---

## 6. Session Invalidation

### Manual Logout

```typescript
// shared/src/state/AuthState.tsx
logout: () => {
  setState(INITIAL); // Clear auth state
  // Backend: invalidate session via function call
  await pod.records.update("user_sessions", sessionId, {
    "is_active": false,
  });
}
```

### Automatic Invalidation Triggers

| Event | Action |
|-------|--------|
| User logs out | Set `is_active = false` |
| Password change | Invalidate all sessions for user |
| Role change | Invalidate current session |
| Security breach | Bulk invalidate by user_id |
| Admin force-logout | Invalidate specific session |

---

## 7. Session Security Policies

### 7.1 Creation Rules

- One session per login
- No limit on concurrent sessions per user (configurable)
- Session ID is a cryptographically random UUIDv4
- `token_hash` is computed on the server

### 7.2 Validation Rules

- Every protected API call validates session
- Validation checks: existence, active flag, expiration
- Expired sessions return 401
- Invalidated sessions return 403

### 7.3 Cleanup

- Expired sessions remain in the database for audit purposes
- Periodic cleanup job recommended for soft-deleting sessions older than 90 days
- Index on `expires_at` enables efficient cleanup queries

---

## 8. Session Data in Frontend

```typescript
// shared/src/state/AuthState.tsx
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;          // Session token (not raw JWT)
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];             // Assigned role IDs/names
    permissions: string[];       // Flattened permission strings
  } | null;
}
```

The Lemma SDK manages the actual session token lifecycle. The frontend reads from `AuthStateContext`.

---

## 9. Session vs Token Comparison

| Aspect | Session (user_sessions_v2) | JWT Token |
|--------|---------------------------|-----------|
| Storage | Server-side DB | Client-side (Lemma SDK) |
| Revocation | Immediate (set is_active) | Must wait for expiry |
| Payload | User ID + metadata | Claims + user context |
| Lifetime | 24 hours | Varies (short-lived) |
| Rotation | New session on re-auth | Refresh token mechanism |
