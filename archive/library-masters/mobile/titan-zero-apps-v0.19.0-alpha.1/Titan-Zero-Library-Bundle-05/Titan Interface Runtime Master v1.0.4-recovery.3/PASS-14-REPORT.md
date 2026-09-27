# Pass 14 — Decide & Scenario Workspace

Version **0.14.0** adds first-class Decide surfaces and Scenario workspaces without transferring recommendation, prediction, pricing, scheduling, risk or execution authority into Interface Runtime.

## Delivered

- Deterministic `providers.decisions` registry with contributor-scoped container bindings.
- Tenant/user revalidation at the decision-provider gateway boundary.
- Manifest-declared `kind=scenario` views over the existing governed Read Authority router.
- Composed observation, recommendation, scenario, assumption and choice layers.
- Bounded normalization for observations, recommendations, assumptions, scenario outcomes and consequences.
- Explicit source/provenance list for scenario-view and decision-provider inputs.
- Product-surface, object permission, action permission and Hub `customer_safe` filtering.
- Scenario/action references resolve only through the global Action Registry.
- All decision/action choices remain `executable=false` and retain capability or Interaction Engine execution authority.
- `recommendation_is_not_execution=true` and `auto_execute=false` are carried in both the snapshot and Presentation Model tree.
- Provider failure/cross-tenant responses degrade that provider without contaminating healthy scenario-view data.
- Read-only `/decide/{objectKey}` endpoint.
- Fixed a latent duplicate `registerRoutes()` invocation in the service provider so route registration remains idempotent.

## Authority boundary

Interface Runtime does not calculate a recommendation, prediction, margin, schedule, risk score or approval decision. It displays structured outputs supplied by authoritative read models/capabilities/decision providers and presents declared governed choices. Rendering a preferred/recommended option never executes that option.
