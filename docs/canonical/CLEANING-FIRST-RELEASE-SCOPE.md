# Cleaning First-Release Scope

This supplement sets Cleaning as the first-release product focus and `apps/web` public presentation. The authenticated first-run profile selector and setup-route/database round-trip remain separate acceptance work tracked by #1385 and #1380. This scope does not remove other verticals, replace native FSM ownership, or change the canonical Titan surface model.

## Intended default cleaning profile

Use the existing `titan.cleaning-workforce-pack` bundle and its `titan.workforce.cleaning` `job-types` projection. The first-release job types are:

- `domestic_recurring` (the bundle's declared default)
- `deep_clean`
- `bond_end_of_lease`
- `airbnb_turnover`
- `commercial`
- `move_in`
- `office`

The bundle declares `evidence_strict: true`. This is a workflow setting; it is not a compliance certification or a promise that evidence alone proves a service outcome. Service selections map through the cleaning catalogue's `retained_job_type_id` and are saved by the existing cleaning setup authority as configuration.

## Pricing and operations

Companies supply their own fixed prices and hourly rates. A fixed or hourly selection cannot be saved until its required amount is configured. Quote-required services remain quote-required. Catalogue hints are not prices, and setup does not calculate or invent amounts.

Recurring frequencies and the selected job types that support them are saved as company configuration (`custom` maps to the runtime value `custom_recurring`). This setup does not create scheduled visits.

Use the existing native company-scoped job, schedule, visit, checklist and evidence flows for cleaning operations. Setup configures a company's service offer; it does not grant authority or replace those business owners.

## Product boundaries

- `apps/web` remains Titan's separate full base web application.
- The PWA and native mobile app remain one app each with governed Zero, Go and Hub modes.
- DirectAdmin Workforce remains the persistent operations/control-plane owner; setup does not create another workforce runtime.
- Frappe remains an optional provider for deliberately delegated capabilities.
- Other vertical source, IDs and explicit future selection paths remain intact. They are outside the cleaning first-release default path.
