# Mobile ↔ DirectAdmin-hosted Titan Workforce boundary

Status: repository contracts are present, but DirectAdmin deployment and end-to-end mobile integration are not certified. This inventory records source evidence, not a production deployment claim.

Parent integration mission: #1169. Documentation slice: #1302.

## Canonical owners and current source

| Concern | Owner | Source evidence |
| --- | --- | --- |
| Mobile surface projections, command intents and conversation client | `apps/mobile` | `apps/mobile/lib/titan/services/titan_gateway.dart`, `http_titan_surface_transport.dart` |
| Surface schema and receipt validation | Titan Platform | `packages/titan-platform/src/surface/index.ts` |
| Hosted Workforce lifecycle and runtime composition | Workforce | `services/workforce/src/server.ts`, `hosted-runtime.ts`, `conversation-api.ts` |
| DirectAdmin control-plane gateway | Server Node | `services/workforce/src/server.ts`, `directadmin-workforce-owners.ts`, `apps/directadmin/server-node/` |
| Operator Workforce projection | Workforce Manager (#1050) | No deployed cockpit API verified by this source inventory |
| Identity and company bridge | #1049/#302/#812 | Workforce accepts operator-supplied dependency adapters; production deployment wiring is not proven here |
| Governed execution and evidence | #14/#913 and canonical runtime ports | Conversation path composes hosted auth, dispatch, recovery and cancellation; a provider acknowledgement is not an observed verified outcome |

## Current endpoint boundary

The Workforce HTTP server currently exposes:

- `GET /health` and `GET /ready`;
- `POST /v1/workforce/conversations`, handled by `conversation-api.ts`, with hosted runtime authentication, dispatch, recovery, cancellation and optional event-stream responses;
- `/v1/directadmin/*`, only when the operator-owned DirectAdmin gateway is configured.

The mobile conversation transport accepts an explicitly configured HTTPS endpoint and bearer credential. The source tree does not prove that a release bootstrap supplies this endpoint and a short-lived token from the canonical session bridge.

Mobile projection and command transports accept configured endpoint URIs, but the Workforce server does not currently implement dedicated `/v1/mobile/projections` or `/v1/mobile/commands` routes. Any route delivery must derive actor/company authority from authenticated server context, keep projections authority-neutral, and send consequential commands through the governed command path.

## Required trust boundary

- Server resolves actor, company membership, entitlements and context revision from the validated session. Client IDs are correlation/context assertions and never authority.
- Requests remain bound to canonical `zero|go|hub`, company, actor, device and current context revision.
- Go actions require current assignment/delegation; Hub projections enforce customer/object relationships; company and mode changes isolate caches and quarantine old-scope offline intents.
- Conversation reconnect/resume is bounded and cannot replay consequential commands.
- DirectAdmin roles, plugin credentials and provider identity never grant Titan business authority.
- Local/demo inference stays outside the release path. Missing hosted configuration fails closed.

## Remaining product slices

- #1160 covers secure mobile bootstrap and Zero/Go/Hub context isolation.
- #1303 adds authenticated mobile projection and command routes.
- #1304 implements the hosted conversation lifecycle beyond the current bounded endpoint.
- #1305 certifies cross-surface hosted continuity and release evidence.

Keep #1169 open until those product slices and its full hosted/mobile Done condition are verified.