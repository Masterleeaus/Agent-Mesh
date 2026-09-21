# ResQAI V2 — Security Checklist

**Version:** 2.0
**Date:** 2026-06-30
**Owner:** Security Architect

---

## 1. Authentication

- [x] Lemma OAuth integration configured
- [x] AuthGuard wraps all protected application routes
- [x] Sign-in redirect to Lemma platform OAuth
- [x] AuthMiddleware injects Bearer token to API requests
- [x] Token refresh mechanism implemented
- [x] MFA available via Lemma platform (delegated)
- [x] SSO/SAML available via Lemma platform (delegated)
- [x] Debug token support for local development (`.env.local`)
- [x] `authenticate-user` function validates auth provider
- [x] `validate-session` function validates active sessions

## 2. Authorization

- [x] RBAC implemented with `user_roles_v2` + `role_permissions_v2`
- [x] ABAC via scope levels (`own`, `team`, `all`)
- [x] 8 system roles defined (super_admin through viewer)
- [x] 327 permission entries in seed data
- [x] `RoleGuard` component for role-based UI gating
- [x] `PermissionGuard` component for permission-based UI gating
- [x] `FeatureGuard` component for feature flag gating
- [x] `ApplicationGuard` component for app-level gating
- [x] `RoleAwareNav` for role-adaptive navigation
- [x] `assign-user-role` function for role assignment
- [x] `manage-permission` function for grant/revoke
- [x] `list-permissions` function for enumeration
- [x] 181 app-level permissions across 9 V2 applications
- [x] Cross-application permission check contracts defined
- [x] Agent-level permissions via `permissions.json` files

## 3. Session Management

- [x] `user_sessions_v2` table with token hashing
- [x] 24-hour session TTL
- [x] Session invalidation on logout
- [x] Expiration check in `validate-session`
- [x] IP address + user-agent tracking per session
- [x] `is_active` flag for soft invalidation
- [x] Foreign key cascade on user deletion
- [x] Partial index on active sessions for query performance
- [x] Index on `expires_at` for cleanup queries

## 4. Token Security

- [x] Bearer token pattern for API authorization
- [x] Token refresh on 401 responses
- [x] No raw tokens stored in database (hashed only)
- [x] No tokens in URLs
- [x] TLS 1.2+ for all token transmission
- [x] Token in memory (not localStorage) for JWT
- [x] Platform-managed refresh token rotation
- [x] `admin:manage_api_keys` for API key management
- [x] Debug tokens isolated to localhost only

## 5. Secret Management

- [x] `.env` files in `.gitignore`
- [x] `.env.example` with placeholder values (tracked)
- [x] No hardcoded secrets in source code
- [x] No hardcoded Pod UUID in tracked files
- [x] No hardcoded production URLs in source code
- [x] `import.meta.env` for Vite env var access (not `process.env`)
- [x] Platform-managed infrastructure secrets
- [x] CI/CD secrets in GitHub Actions
- [x] `Pod.from_env()` for Python function secrets
- [x] All `.env.example` files include required VITE_* vars

## 6. Audit Logging

- [x] `audit_log_v2` table with structured schema
- [x] `record-audit` function for creating entries
- [x] `query-audit-log` function with multi-filter support
- [x] JSONB snapshots for before/after state
- [x] `changed_fields` array for field-level tracking
- [x] `correlation_id` for request tracing
- [x] Indexes on entity, actor, action, timestamp
- [x] `operations_log` for lightweight operational audit
- [x] Append-only design (no update/delete for audit records)
- [x] `admin:view_audit` permission for access control
- [x] `admin:export_audit` permission for data export

## 7. API Security

- [x] Bearer token authentication
- [x] Token refresh with retry logic
- [x] Authorization error handling (401 → refresh → retry)
- [x] Input validation via Pydantic models (Python functions)
- [x] TypeScript strict mode for frontend type safety
- [x] No `eval()` usage
- [x] No `dangerouslySetInnerHTML` usage
- [x] Secure JSON parsing (wrapped in try/catch)

## 8. Data Protection

- [x] TLS in transit (Lemma platform-managed)
- [x] Encryption at rest (platform-managed)
- [x] Unique constraints on sensitive fields (email, auth provider)
- [x] Soft deletes via `deleted_at` pattern
- [x] Cascade deletes on foreign keys (sessions, permissions)
- [x] Partial unique indexes (active emails only)
- [x] Role-based data scoping (own/team/all)

## 9. Agent Security

- [x] Agent-specific table permissions (read/write separation)
- [x] AI-draft, human-approve workflow pattern
- [x] Stateless and idempotent agent design
- [x] No outbound messaging from agents
- [x] No fabricating data (hallucination guardrails)
- [x] Guard rails against destructive actions
- [x] Operations log recording for all agent actions

## 10. Deployment & CI/CD

- [x] `.npmrc` with `legacy-peer-deps` (known issue, documented)
- [x] `strict: true` in TypeScript config
- [x] CI workflow with type-check + test + build
- [x] No `.env` files in CI artifacts
- [x] Secrets injected via GitHub Actions

---

## 11. Open Recommendations

| # | Recommendation | Priority | Effort |
|---|---------------|----------|--------|
| 1 | Add pre-commit secret scanning hook (`husky` + `lint-staged`) | High | Small |
| 2 | Integrate `truffleHog` or `git-secrets` in CI pipeline | High | Small |
| 3 | Implement rate limiting on API/function endpoints | Medium | Medium |
| 4 | Add CSRF protection for state-changing operations | Medium | Medium |
| 5 | Implement session count limits per user (configurable) | Medium | Small |
| 6 | Add IP-based access controls for admin functions | Medium | Medium |
| 7 | Add confidence thresholds for AI agent outputs | Low | Small |
| 8 | Implement PII detection in agent inputs/outputs | Low | Large |
| 9 | Add automated audit anomaly detection | Low | Large |
| 10 | Consolidate to single root `.env` for all apps | Low | Small |
