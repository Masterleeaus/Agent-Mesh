# Findings

## Preserved systems
- `packages/tools/execution-gateway.mjs`: canonical ExecutionGateway.
- `packages/tools/mcp-provider-contract.mjs`: existing MCP-to-Titan capability adapter.
- `packages/tools/browser-node-contract.mjs`: existing Browser Node provider boundary.
- `packages/tools/TOOL-REGISTRY.json`: existing tool/capability registry; no parallel registry will be created.
- `packages/runtime/authority/`: existing authority evaluator/leases; no parallel authority engine will be created.
- `packages/provenance/`: existing provenance/evidence area; gateway evidence must converge here rather than create a second evidence architecture.

## Pass 4 current-main findings
1. Canonical domain ownership is explicit in `packages/business-services/canonical-service-owners.json`: Titan Field owns jobs/work orders and dispatch operational state; Titan CRM owns customers and invoice/receivable truth; Titan Connect owns messaging/channel execution. Provider lineage is metadata and must not be treated as runtime authority.
2. `packages/domain/src/business-ops-commands.ts` is a governed UI/action-handoff contract. It resolves create/send/record commands to Business Ops routes and required actions, but it is not itself a native mutation service and must not be bound to ExecutionGateway as if navigation were business completion.
3. `apps/web/app/api/booking/route.ts` performs a real transactional booking/intake write, but it is a public booking ingress scoped by `BOOKING_ACCOUNT_ID`; it is not a safe generic Zero native-execution adapter. It also still uses account-oriented storage context internally, so it should remain ingress/domain-owned rather than become canonical execution authority.
4. A concrete communications receipt path exists at `apps/web/app/api/internal/sms/outbound/route.ts`. It requires canonical `company_id`, authenticates tenant SMS webhook credentials, preserves `communication_id`, `conversation_id`, and `correlation_id` for delivered/failed callbacks, records delivery/failure state, and suppresses duplicate send events by external provider id.
5. SMS receipt persistence demonstrates the correct verification source for governed messaging: queued/sent is not completion; delivery callbacks can supply independently observed delivery state. ExecutionGateway should verify against this canonical communication state rather than treating provider send acknowledgement as VERIFIED.
6. The current web app exposes push and SMS internal surfaces, but no evidence from this pass justifies inventing an email provider or a generic native mutation adapter. Those must be bound only after their canonical service implementations are located.
7. Current code search did not surface a named `updateJob`, `assignWorker`, or `scheduleVisit` mutation API. This is evidence to keep tracing Titan Field/runtime ownership rather than introducing replacement mutations.

## Safety invariant
Provider availability, MCP discovery, browser authentication, route navigation, queue acceptance, and provider acknowledgement never create authority and never imply verified outcome.
