# Mobile ↔ DirectAdmin-hosted Titan Workforce boundary

Status: integration contract and inventory only; production endpoint wiring remains gated on the canonical hosted Workforce/API owners.

This document is the issue #1169 boundary record. It is deliberately explicit about what exists in the current repository versus what is required from the hosted system. It must not be read as deployment evidence.

## Canonical owners

| Concern | Owner | Current repository evidence |
| --- | --- | --- |
| Mobile projection/client and command intent | `apps/mobile` | `apps/mobile/lib/titan/services/titan_gateway.dart`, `http_titan_surface_transport.dart` |
| Surface schema and receipt validation | Titan platform | `packages/titan-platform/src/surface/index.ts` |
| Workforce work identity/lifecycle | Workforce service | `services/workforce/src/index.ts`, `production-runtime-bootstrap.ts` |
| Persistent Workforce runtime | Workforce service + canonical runtime ports | `services/workforce/src/production-runtime-bootstrap.ts` |
| DirectAdmin control-plane adapter | DirectAdmin Server Node | `apps/directadmin/server-node/` |
| Operator Workforce projection | Workforce Manager mission #1050 | No deployed package/API verified in this repository |
| Identity/company bridge | Business Node SDK/auth owners #1049/#302/#812 | No deployed mobile-facing endpoint verified in this repository |
| Governance/evidence/verification | #14/#913 and canonical runtime ports | Bootstrap requires authority/evidence ports; provider acknowledgement is insufficient |

## Versioned boundary

The mobile-to-Titan boundary uses the existing Surface schema version `1.0`:

- Projection: `GET /v1/mobile/projections`
- Command intent: `POST /v1/mobile/commands`
- Conversation/continuation: owned by the hosted Workforce contract (#1159/#1182); do not invent a second mobile conversation API here.
- Authentication: short-lived server-issued bearer token. The server resolves actor, company, entitlements, surface and revision; client-supplied identity is context for correlation only and never authority.
- Required context: `company_id`, actor identity, device identity, canonical `zero|go|hub`, projection revision, request/operation/correlation/idempotency identity.
- Receipt: the Surface `SurfaceReceipt` contract; `authority_source=server`, with receipt/event/signal/evidence references as available.

The existing Flutter transport takes explicit endpoint URIs and refuses insecure non-local HTTP. The platform Surface contract enforces authority-neutral projections, capability checks, revision/expiry, company/surface binding and server receipts.

## Request/response obligations

Every endpoint implementation must:

1. derive and validate the authenticated Titan principal server-side;
2. reject missing, revoked, expired or ambiguous identity/company mappings;
3. enforce company scope and current surface/context revision;
4. keep commands on the governed Command Bus;
5. make idempotency durable before consequential execution;
6. distinguish accepted/provider-acknowledged from completed/verified outcomes;
7. return bounded, structured errors with a trace/correlation reference;
8. preserve privacy minimisation for Hub and least-necessary assignment scope for Go;
9. leave offline intents bound to their originating company, actor, device, surface and revision for reconnect revalidation.

## Inventory result and current gap

The repository contains:

- a contract-compliant mobile projection/command client;
- a canonical TypeScript Surface contract;
- a persistent SQLite-backed Workforce runtime bootstrap with required authority/context/model ports;
- DirectAdmin install/health shell scripts.

The repository does **not** currently contain:

- an authenticated mobile-facing route in `services/workforce/src/server.ts` (it currently serves only `/health` and `/ready`);
- a deployed DirectAdmin Server Node API/identity bridge;
- verified hosted Workforce conversation/stream/continuation endpoints;
- deployed cross-surface identity evidence connecting mobile, Workforce Manager and another canonical surface.

Therefore #1169 cannot honestly be closed from repository code alone yet. The remaining work is an integration dependency, not a documentation gap:

- #1159/#1182 must provide the canonical hosted conversation lifecycle;
- #1049/#302/#812 must provide the authenticated company/actor bridge;
- #1050/#811 must provide the actual persistent hosted Workforce endpoint and deployment evidence.

Until those contracts/endpoints are implemented and hosted verification is executed, mobile must remain fail-closed and no local/demo gateway may be promoted to production.
