# Pass 6 — Connections Workspace

Version: `2.7.0`
Master PLAN_ID: `5936f03e-03cf-4a37-bc08-b6127a69e761`

## Purpose
Expose the Pass 5 canonical connection registry as the operational front door for Codee dependencies without creating a second connection/configuration authority.

## Sections
- Free AI
- Local AI
- Premium / BYO AI
- Titan MCP
- Repository Host
- Artifact Verification Host
- Browser

## Actions
- Test: force a fresh canonical health probe.
- Reconnect: force a fresh canonical probe/recovery attempt.
- Configure: available only when an existing subsystem-owned trusted configuration surface exists.
- Disable: unavailable unless the owning subsystem provides a canonical disable control.

## Security
The workspace receives only bounded provider identity/lifecycle/transport and normalized health state. It never renders tokens, credential metadata, raw probe payloads, raw host payloads or artifact receipt IDs.

## Authority
The workspace is read-only with respect to plan progression, repository mutation, browser permission, artifact verification and provider credentials. Unsupported actions fail closed.
