# Issue #1170 mobile workflow matrix

Status: implementation pass in progress on agent/issue-1170. This document is an evidence index, not a completion claim.

## Boundary

The Flutter app is one presentation surface for Zero, Go and Hub. Titan Core and the hosted Workforce/DirectAdmin runtime remain authoritative for tenant scope, identity, capabilities, state transitions, approvals, evidence reconciliation and conversation responses. The mobile client must not replace a missing hosted contract with seeded business data or a local success state.

## Required workflow matrix

| Surface | Required workflow | Current mobile entry point | Missing or blocked evidence | Canonical owner |
| --- | --- | --- | --- | --- |
| Zero | hosted attention summary, conversation continuity, work/agent/team/approval/exception/evidence views | screens/titan_shell_screen.dart and generative cards | hosted projection and conversation endpoints are not exposed by services/workforce/src/server.ts; server-backed attention/work data is still unavailable | #1159, #1169, #1182 |
| Zero | governed review, approve, decline and escalate | generated actions plus command gateway | no hosted capability projection/receipt scenario proving authorization and conflict handling | #1049, #302, #812 |
| Zero | context, preferences, company and mode switch | no complete active UI flow | company/surface context is injected, but no active mode/company/preferences projection flow is wired | #1050, #811 |
| Go | assigned day, queue, scoped job/customer/site, schedule/route/arrival | titan_schedule_screen.dart, titan_job_screen.dart, titan_map_screen.dart | schedule/map/job screens seed Melbourne jobs and do not load an observed server projection | #1169, #1046, #1053 |
| Go | start/pause/resume/complete, checklist/SOP/forms/time/materials/mileage/notes/incidents/variations/contact | titan_job_screen.dart | commands exist, but local UI advances before a server receipt and several required field workflows have no UI/evidence | #1045, #1054, #1055 |
| Go | evidence capture, staging, upload and reconciliation | capture_screen.dart and EvidenceSyncService | current queue records command payloads; hosted binary upload/reconciliation scenario is not available | #1056, #1059, #809 |
| Go | deterministic offline replay and reconnect | offline queue/replay services and tests | hosted replay, conflict and reconnect scenario still required | #1169, #1059 |
| Hub | customer-safe history, bookings, requests, quotes, invoice/payment/support/profile | customer/commercial screens | relationship/privacy checks and hosted customer projection are not demonstrated; customer actions now fail closed without that projection | #1169, #1050 |
| Shared | loading, empty, error, stale, offline, auth, conflict and permission states | shell error state; screen-local states | coverage is incomplete and seeded data masks unavailable/empty states | #1170 with #1169 |
| Shared | accessibility, tablet/small-screen/orientation behavior | Flutter widgets | no hosted device/orientation evidence yet | #1170 |
| Shared | exactly three proactive staff cards and bounded generated UI | generative cards and context cards | server-backed card projection and fail-safe action evidence are not available | #1159, #1182 |

## Completed in this pass

- The splash bootstrap now requires an explicit hosted conversation endpoint in addition to projection and command endpoints.
- The hosted conversation transport is injected into SurfaceSdkTitanGateway; no local/demo conversation response is introduced.
- Missing runtime configuration now renders a retryable, explicit configuration state instead of throwing from a timer and leaving an uncaught failure.
- The stale counter smoke test was replaced with tests for the active Titan bootstrap and missing-configuration recovery.
- main.dart now boots the canonical Titan app shell directly and no longer initializes the legacy global AppData/theme shell.

## Acceptance evidence still required before closing #1170

1. A hosted Workforce/DirectAdmin runtime exposes the scoped projection, conversation, command receipt, evidence and replay contracts for Zero, Go and Hub.
2. Flutter flow tests cover each required workflow and every listed state, with no seeded business records standing in for server projections.
3. Hosted scenarios prove same IDs and company/audience isolation across Flutter, DirectAdmin, PWA and base app.
4. Failure, offline, conflict, auth-required and permission-denied paths are observable and recoverable.
5. Architecture and release documentation identify the single canonical authority and the exact runtime configuration.