# Tenancy Audit

## Canonical boundary
`company_id` is the canonical persistence boundary. `tenant_id` and `tenant_company_id` are compatibility-ingress aliases only.

## Pass 1 observations
- Storage exposes `requireCompanyId` and ingress normalization.
- `SqliteRunStore.get` and `save` are keyed by both `company_id` and `run_id`.
- `SqliteWorkforceStore` work-item and worker reads/lists are company-scoped and tables use composite company keys.
- **Open:** `SqliteRunStore.recoverable(company_id?)` has a global fallback when company is omitted, and `TitanAgentRuntime.recover()` currently calls `store.recoverable()` without a company. This must be resolved after tracing production bootstrap/recovery callers so recovery remains functional without creating cross-company visibility.
- **Open:** full repository scan for unscoped SQL, first-owner/default-company assumptions, and legacy tenant identifiers.

## Pass 2

A reopened file backed RunStore rejects cross-company lookups. Its unscoped `recoverable()` remains available to a trusted supervisor; no production supervisor caller was found. Broader conversation, memory, authority and web query isolation remains unverified.
