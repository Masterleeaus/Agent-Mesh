# TZ-NEXT-015 Pass 1 — Existing Onboarding / Business Setup Inventory

Baseline: Manager Merge 42 (`1c4b6f...cc930`).

## Result

Merge42 contains **24 onboarding-named assets**, but no canonical Titan owner/business onboarding journey runtime or first-run state machine. The existing onboarding material is donor/static/template evidence, not an authority surface.

## Reuse instead of replacement

- Company boundary: `titan-local/kernel/company-context.mjs`, `titan-runtime/company-context.mjs`, and `titan-runtime/authority/company-boundary.mjs`. New onboarding state must be `company_id` scoped and fail closed on legacy tenant authority fields.
- Business persistence/authority: reuse `titan-local/storage/business-database.mjs`, `titan-local/storage/business-state-authority.mjs`, and the Manager business-state adapter.
- Settings: reuse the existing `titan-settings/control-plane/` authorities; onboarding should orchestrate them, not create a second preference database.
- Workforce: reuse Business Discovery / installation specifications as evidence and planning inputs only; onboarding must not grant execution authority.
- Service ownership: `titan-business-services/canonical-service-owners.json` remains the ownership map for CRM, jobs, payments, communications, workforce and other domains.

## Existing onboarding templates

- `titan-builder/pagestudio-donor/templates/customer-onboarding.json`
- `titan-builder/pagestudio-donor/templates/property-onboarding.json`
- `titan-builder/pagestudio-donor/templates/staff-onboarding.json`

These can inform later UI/journey wiring but are not promoted to canonical runtime authority by this pass.

## Pass 2 boundary

Pass 2 should define one resumable onboarding journey state scoped by `company_id`, with explicit completion/blocker projection and no automatic authority grant.
