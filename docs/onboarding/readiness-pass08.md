# TZ-NEXT-015 Pass 8 — Onboarding readiness

Pass 8 adds a read-only readiness projection over the existing onboarding authorities. It does not add a second setup store and does not mutate business, cleaning, workforce, payments, communications, providers, notifications, customers, jobs, or imports.

The projection classifies each setup area as `configured`, `missing`, `blocked`, or `optional`.

Required readiness areas are the journey state, business setup, cleaning services, and workforce setup. Payments/communications and import staging remain optional; configuring them improves completeness but not configuring them does not block operational readiness.

A configured area becomes `blocked` when its persisted data is internally incomplete or exposes a forbidden authority/execution state. Read failures fail closed and surface `readiness_source_error` rather than being treated as configured.

The service remains `company_id` scoped and read-only. Readiness never activates workers, moves money, sends messages, dispatches notifications, applies imports, or grants execution authority.
