# TZ-NEXT-015 Pass 4 — Cleaning service setup

Pass 4 does not create a second cleaning catalogue. `titan-modules/bundles/cleaning-workforce.bundle.json` / module `titan.workforce.cleaning` / projection `job-types` remains the canonical source for the seven cleaning job types and their checklists.

The onboarding authority persists only company-specific selections: enabled service/job type IDs, display labels, pricing inputs, and selected canonical checklist indexes. Stored records are scoped by `company_id`, reject legacy tenant aliases and cross-company payloads, support optimistic revisions, and explicitly grant no execution authority.

Pricing modes are bounded to fixed, hourly, or quote-required. Checklist items must resolve to the canonical installed checklist; onboarding cannot inject arbitrary checklist tasks through this path.
