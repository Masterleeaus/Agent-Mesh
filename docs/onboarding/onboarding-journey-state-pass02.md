# TZ-NEXT-015 Pass 2 — Canonical resumable onboarding journey state

Pass 2 adds one small onboarding **progress projection**, not a new business/settings/identity authority.

## Boundary and persistence

- Canonical boundary: `company_id` only.
- `tenant_id` and `tenant_company_id` fail closed.
- Storage key is company-isolated: `tz.onboarding.company.<company_id>.owner-business-setup`.
- State supports resume through persisted status, current step, completed/skipped steps, timestamps and optimistic `revision`.
- Every public store and state object declares `grants_authority: false`.

## Journey

The stable journey covers business identity, operations, cleaning services, workforce, optional payments/communications, optional import, and readiness. Later passes populate those sections through their existing authorities; this module records progress only.

## Safety

Required steps cannot be skipped. Completion is blocked until every required step is complete. Cross-company access is prevented by separate canonical storage keys and strict company validation. No execution permission is inferred from onboarding completion.
