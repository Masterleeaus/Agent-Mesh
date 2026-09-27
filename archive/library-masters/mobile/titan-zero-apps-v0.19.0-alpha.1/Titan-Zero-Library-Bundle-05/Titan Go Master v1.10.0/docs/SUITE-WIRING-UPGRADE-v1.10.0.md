# Titan Go v1.10.0 — Governed Action Gateway Wiring

Titan Go now owns the thin application adapter for worker action intents while execution authority remains in Titan Apps: Interaction Engine and domain providers.

## Implemented

- `InteractionEngineGoActionIntentGateway` implements Go's public `GoActionIntentGatewayInterface`.
- Go binds that adapter in its service provider instead of requiring the host to invent a second action gateway.
- Every action requires canonical `company_id`, actor identity, Go source surface and an explicit bounded idempotency key.
- Payloads cannot supply `company_id`, actor/role/scope/permission/entitlement/autonomy authority, credentials, or legacy tenant identifiers.
- Trusted server-side context may carry roles/scopes and approval evidence, but company/actor mismatches fail closed.
- Interaction Engine's `CapabilityIntentGatewayInterface` remains the governed execution boundary; Go performs no provider mutation itself.

## Ownership

Go owns worker UX and action-intent adaptation only. Interaction Engine owns capability routing/governed interaction execution. Provider extensions remain authoritative for business truth and mutations. `company_id` is the sole tenant/company boundary.
