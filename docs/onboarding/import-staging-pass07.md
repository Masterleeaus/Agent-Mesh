# TZ-NEXT-015 Pass 7 — rollback-safe import staging

Pass 7 adds a company-scoped onboarding staging authority for customer, job and historical-data imports.

## Existing authorities reused

- Customer target: `titan-business-services/workflows/new_customer.json` / `crm.customer.create`.
- Job target: `titan-business-services/workflows/create_job.json` / `crm.work_order.create`.
- Historical rows are evidence-only staging; they do not become canonical domain truth during onboarding.

## Safety model

The onboarding layer performs validation, duplicate detection, deterministic fingerprints, staging, inspection and discard only. It does not create customers, work orders or historical domain records. Applying staged data requires a later governed execution path using the canonical capabilities and normal authority checks.

Discard removes only the staging record and therefore affects zero live domain records. `company_id` is the sole company boundary; legacy tenant identifiers fail closed.
