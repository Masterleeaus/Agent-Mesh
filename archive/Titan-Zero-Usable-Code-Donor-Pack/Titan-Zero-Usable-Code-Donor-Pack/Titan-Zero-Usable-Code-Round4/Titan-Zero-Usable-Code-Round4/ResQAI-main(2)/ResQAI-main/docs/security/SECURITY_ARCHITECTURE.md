# ResQAI V2 — Enterprise Security Architecture

**Version:** 2.0
**Date:** 2026-06-30
**Status:** Implemented

---

## 1. Architecture Overview

ResQAI V2 employs a **defense-in-depth** security architecture spanning four layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: APPLICATION SECURITY                     │
│  ApplicationGuard │ RoleGuard │ PermissionGuard │ FeatureGuard      │
│  Cross-App AuthZ  │ Navigation Guards │ Widget-Level Enforcement    │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 3: API & FUNCTION SECURITY                  │
│  Lemma SDK Auth Middleware │ Bearer Token Injection │ Function RLS  │
│  Connector Credential Vault │ Rate Limiting │ Input Validation      │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 2: AUTHENTICATION & SESSION                 │
│  Lemma Platform OAuth │ JWT │ Refresh Tokens │ Session Management   │
│  MFA (Platform) │ Token Rotation │ Session Invalidation              │
├─────────────────────────────────────────────────────────────────────┤
│                    LAYER 1: DATA & INFRASTRUCTURE                    │
│  PostgreSQL RLS │ Encryption at Rest │ TLS in Transit                │
│  Audit Logging │ Secret Vault │ Access Control Policies              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Identity & Access Management (IAM)

### 2.1 Identity Model

| Concept | Implementation | Location |
|---------|---------------|----------|
| **User Identity** | Lemma Platform users with `users_v2` table | `database/migrations_v2/007_create_users_v2.sql` |
| **Organization** | Multi-tenant via `OrganizationState` context | `shared/src/state/OrganizationState.tsx` |
| **Teams** | Grouping construct for role assignment | `shared/src/state/UserState.tsx` |
| **External Identity** | OAuth providers via `auth_provider` + `auth_provider_id` | `users_v2` schema |

### 2.2 Authentication Methods

| Method | Status | Notes |
|--------|--------|-------|
| Lemma Platform OAuth | **Implemented** | Primary auth via `lemma-sdk` `AuthGuard` |
| Email + Password | **Delegated** | Handled by Lemma platform |
| SSO / SAML | **Delegated** | Available via Lemma platform config |
| MFA / TOTP | **Delegated** | Enforced at Lemma platform layer |
| API Key | **Implemented** | `admin:manage_api_keys` permission defined |

### 2.3 Authorization Model

```
User ──assigned_to──> Role ──grants──> Permissions
  │                                       │
  └── belongs_to ──> Organization         └── resource + action + scope
```

- **RBAC** — Role-Based Access Control via `user_roles_v2` + `role_permissions_v2`
- **ABAC** — Attribute-Based Access Control via `scope` (own/team/all)
- **Scope Levels**: `own` (self), `team` (team-wide), `all` (global)

---

## 3. Authentication Flow

```
User → Browser → Lemma OAuth → Callback → Lemma SDK Initialization
                                              │
                                              ▼
                                        AuthGuard Check
                                              │
                                    ┌─────────┴──────────┐
                                    ▼                    ▼
                              Authenticated          Unauthenticated
                                    │                    │
                                    ▼                    ▼
                              App Content          Sign In View
                                    │                    │
                                    ▼                    ▼
                              AuthMiddleware         OAuth Redirect
                              (Bearer Token)
```

**Source files:**
- `packages/sdk/ProtectedApp.tsx` — AuthGuard wrapper
- `shared/src/api/AuthMiddleware.ts` — Bearer token injection
- `shared/src/state/AuthState.tsx` — Auth context provider

---

## 4. Permission Enforcement Points

### 4.1 Component-Level Guards

| Guard | Purpose | File |
|-------|---------|------|
| `RoleGuard` | Renders children based on user roles | `shared/src/permissions/RoleGuard/RoleGuard.tsx` |
| `PermissionGuard` | Renders children based on permissions | `shared/src/permissions/PermissionGuard/PermissionGuard.tsx` |
| `FeatureGuard` | Feature flag gating | `shared/src/permissions/FeatureGuard/FeatureGuard.tsx` |
| `ApplicationGuard` | Application access gating | `shared/src/permissions/ApplicationGuard/ApplicationGuard.tsx` |

### 4.2 Navigation-Level Enforcement

| Component | Purpose | File |
|-----------|---------|------|
| `RoleAwareNav` | Filters navigation items by role | `shared/src/navigation/RoleAwareNav/RoleAwareNav.tsx` |

### 4.3 API-Level Enforcement

| Component | Purpose | File |
|-----------|---------|------|
| `AuthMiddleware` | Bearer token injection + refresh | `shared/src/api/AuthMiddleware.ts` |

### 4.4 Function-Level Enforcement

| Function | Purpose | File |
|----------|---------|------|
| `authenticate-user` | User authentication + session creation | `functions/authenticate-user/src/handler.py` |
| `validate-session` | Session token validation | `functions/validate-session/src/handler.py` |
| `assign-user-role` | Role assignment | `functions/assign-user-role/src/handler.py` |
| `list-permissions` | Permission enumeration | `functions/list-permissions/src/handler.py` |
| `manage-permission` | Grant/revoke permissions | `functions/manage-permission/src/handler.py` |

---

## 5. Data Security

### 5.1 Encryption

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **In Transit** | TLS 1.2/1.3 for all HTTP traffic | Platform-managed |
| **At Rest** | PostgreSQL encryption | Platform-managed |
| **Secrets** | Environment variables (`VITE_*` prefixed) | Implemented |
| **Tokens** | Lemma SDK token management | Platform-managed |

### 5.2 Database-Level Protections

- Unique constraints on email (active only), auth provider pairs
- Cascade deletes on foreign keys (user sessions, role permissions)
- Partial indexes on active sessions
- Soft deletes via `deleted_at` timestamp pattern

---

## 6. Audit Infrastructure

| Component | Purpose | Location |
|-----------|---------|----------|
| `audit_log_v2` table | Immutable audit trail | `database/migrations_v2/040_create_audit_log_v2.sql` |
| `record-audit` function | Create audit entries | `functions/record-audit/src/handler.py` |
| `query-audit-log` function | Query audit trail | `functions/query-audit-log/src/handler.py` |
| `operations_log` table | Operational activity log | Created in authenticate-user flow |

---

## 7. Security Boundary Diagram

```
                        INTERNET
                           │
                     [TLS 1.2/1.3]
                           │
                    ┌──────▼──────┐
                    │  Lemma Auth  │  ← MFA, SSO, OAuth
                    │  Platform    │
                    └──────┬──────┘
                           │ (OAuth Token)
                    ┌──────▼──────┐
                    │  Lemma API  │  ← Token Validation, RLS
                    │  Gateway    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌────▼─────┐
       │  ResQAI V2  │ │ Python │ │Database  │
       │  React Apps │ │Functions│ │(RLS)     │
       │  (AuthGuard)│ │(Perms) │ │(Encrypt) │
       └─────────────┘ └────────┘ └──────────┘
```

---

## 8. Threat Model Summary

| Threat | Mitigation | Layer |
|--------|-----------|-------|
| Unauthorized access | AuthGuard + PermissionGuard + RoleGuard | App |
| Token theft | Short-lived JWTs + refresh rotation | Auth |
| Session hijacking | Token hash + IP/user-agent tracking | Session |
| Privilege escalation | RBAC with scope boundaries + audit | Authorization |
| Data exposure | RLS + field-level permissions | Data |
| API abuse | Rate limiting + token validation | API |
| Secret leakage | `.gitignore` + env vars + audit scanning | Build |
| Insider threat | Immutable audit log + separation of duties | Audit |
