# Pass 5 — Canonical Connection Registry

Version: `2.6.0`
Master PLAN_ID: `5936f03e-03cf-4a37-bc08-b6127a69e761`

## Contract

`CodeeConnectionRegistry` is a read-only health projection. It never owns provider credentials, host tokens, MCP secrets, browser grants, mutation authority or plan progression.

Stable connection groups:

- `ai.providers` — non-local provider adapters
- `ai.local` — local provider adapters
- `mcp` — Titan MCP runtime and enabled saved connections
- `repository.host` — privileged Repository Host
- `artifact.host` — independent Artifact Verification Host
- `browser.runtime` — governed Browser execution runtime

States are exactly: `CONNECTED`, `DEGRADED`, `MISSING`, `AUTH_FAILED`, `DISABLED`, `RATE_LIMITED`, `UNAVAILABLE`.

## Evidence rules

- Provider: active `health()` probe.
- MCP: active `CodeeMcpRuntime.health(connectionId)` probe.
- Repository Host: explicit host `health()` probe; object presence alone is `DEGRADED`.
- Artifact Host: explicit host `health()` probe or accepted independent artifact verification receipt; object presence alone is `DEGRADED`.
- Browser: contract registration alone is `UNAVAILABLE`; executable runtime still requires probe evidence before `CONNECTED`.

Probe results are reduced to state/count/timestamp metadata. Raw probe payloads, credentials, bearer-token indicators and receipt IDs are not exported.

## Runtime integration

The service worker exposes `GET_CONNECTION_REGISTRY` and uses a short probe cache. Dashboard infrastructure and AI readiness consume the canonical registry, while preserving local-only operation.

No Chrome permissions or host permissions are added by this pass.
