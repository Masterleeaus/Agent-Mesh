# Issue #66 — business-capability coverage and donor disposition

Audit basis: current `main` at `bfc1773f9f76dc2f564e439b13486225bec4f259`, repository execution contract in `AGENTS.md`, and `docs/architecture/CANONICAL-RULES.md`. This is an evidence matrix, not a new product runtime.

## Coverage matrix

| Capability / transition | Canonical owner | Implementation path or evidence | Verification status | Remaining work |
| --- | --- | --- | --- | --- |
| Company identity, authority, governed execution | #14 | `packages/runtime/authority/`, `packages/tools/execution-gateway.mjs`, `docs/contracts/governed-execution-recovery.md` | VERIFIED for the bounded recovery contract; authority is still required at execution time | Broader production convergence remains with #811/#648 |
| Evidence identity, accepted factual history, deterministic projections | #913 | `packages/tools/accepted-evidence-ledger.mjs`, `docs/contracts/accepted-evidence-ledger.md` | VERIFIED for the accepted-evidence ledger contract and focused tests | Broader adoption remains with domain owners |
| Invocation, durable context, delegation handoff | #21 | `packages/runtime/authority/invocation-context.mjs`, `docs/contracts/invocation-context-handoff.md` | VERIFIED for the company/context/causation/ceiling contract | Existing open claim PRs for #21 remain coordination records and are not duplicated |
| Existing-business discovery, installation planning, commissioning, verified outcomes | #29 | `packages/tools/business-commissioning-lifecycle.mjs`, `docs/contracts/business-commissioning-lifecycle.md`, onboarding/discovery contracts | VERIFIED for the staged lifecycle and fail-closed gates | Full provider installation and live-host certification remain outside this bounded lifecycle |
| Evidence acquisition and provider substitution | #58 | `packages/tools/evidence-provider-network.mjs`, `docs/contracts/evidence-provider-network.md` | VERIFIED for bounded provider selection, privacy/egress/cost gates, normalization and uncertainty | Browser execution remains #643; Decision consumption remains #59 |
| Persistent Decision Packet, alternatives, re-evaluation and bounded prediction | #59 | `packages/tools/decision-lifecycle.mjs`, `docs/contracts/decision-lifecycle.md`, ported decision modules under `packages/titan-platform/src/ported/titan-intelligence/decision/` | VERIFIED for the bounded lifecycle slice | Broader investigation/value/predictive integration remains with #59 consumers |
| CRM/reception-to-cash field-service lifecycle | #183 | `apps/web/` domain routes and canonical CRM/field-service contracts | OPEN / owner exists | Implement and certify the remaining CRM lifecycle; do not add a CRM here |
| Finance, payments, reconciliation and recovery | #263 | `apps/web/lib/`, `db/migrations/`, finance/evidence contracts | OPEN / owner exists | Converge provider acknowledgements with verified financial outcomes |
| Reception, customer access and booking recovery | #333 | reception/booking routes and customer access contracts | OPEN / owner exists | Complete governed booking/recovery transitions |
| Sales, quote conversion and revenue recovery | #343 | estimate/quote routes and revenue-journey evidence contracts | OPEN / owner exists | Complete quote conversion and verified revenue recovery |
| Scheduling, dispatch, capacity and field fulfilment | #353 | Workforce scheduling/dispatch contracts and `services/workforce/` | OPEN / owner exists | Complete resilient assignment, capacity and recovery path |
| Inventory, procurement, assets and first-time-fix readiness | #383 | inventory runtime and workforce inventory evidence paths | OPEN / owner exists | Complete inventory/asset continuity; no second inventory runtime |
| Workforce identity, hierarchy, ownership and coverage | #639 | `packages/workforce/`, `services/workforce/`, workforce registry contracts | OPEN / owner exists | Complete identity/coverage closure and hosted composition |
| Repository convergence, CI and application boundaries | #648 | `AGENTS.md`, Blueprint/Canonical Rules, CI and repository audit ledger | OPEN / owner exists | Finish exhaustive repository/CI/production convergence audit |
| Persistent hosted Titan Runtime/Workforce | #811 | `services/workforce/`, runtime stores and deployment composition | OPEN / owner exists | Add hosted persistence, recovery, idempotency and deployment certification |
| Channels, endpoints, providers, APIs, MCP and connectivity | #1060 | channel/provider registries and integration contracts | OPEN / owner exists | Complete channel/provider convergence without creating another API owner |
| Business standards, knowledge, SOPs, compliance, quality and training | #1065 | standards/knowledge/onboarding contracts | OPEN / owner exists | Complete standards lifecycle and competency evidence |

The matrix identifies no material capability with no owner. Therefore this audit creates no new issue and adds no business runtime to #66.

## Donor and history disposition

| Source | State | Disposition | Reason |
| --- | --- | --- | --- |
| #722 fieldflow-ai | CLOSED archive donor | ARCHIVE / evidence only | Its useful concepts are evaluated against current canonical owners; no production reachability is assumed. |
| #724 FieldServicePro | CLOSED archive donor | ARCHIVE / evidence only | Preserve provenance for comparison; adopt only through the relevant existing domain owner. |
| #765 GitHub archaeology and historical recovery | CLOSED audit/history | SUPERSEDED as an implementation source | Current `main`, canonical contracts and active mission owners are authoritative; archaeology cannot become a parallel roadmap. |

## Audit conclusion

All material business capabilities identified in the current mission set are either verified under a bounded canonical contract or assigned to an existing open owner. Donor/history material has an explicit archive/superseded disposition. #66 owns this coverage evidence only; it does not own CRM, scheduling, finance, inventory, communications, Workforce, authority, evidence, Decision, provider, or onboarding runtime behavior.

