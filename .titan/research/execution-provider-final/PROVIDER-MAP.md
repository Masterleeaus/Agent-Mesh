# Provider Map

| Capability area | Canonical owner / current surface | Execution status | Verification source / next binding |
|---|---|---|---|
| Governed execution | `packages/tools/execution-gateway.mjs` | Canonical gateway hardened | Provider-independent verifier required before VERIFIED |
| Jobs / work orders / dispatch | Titan Field per `packages/business-services/canonical-service-owners.json` | Owner identified; concrete mutation adapter still being traced | Re-read Titan Field canonical job/work-order state |
| Schedule / visits | CRM revenue journey + Titan Bookings/Quotes lifecycle; Field for operational dispatch | Ownership identified; Business Ops currently exposes action handoff, not execution | Re-read canonical booking/visit/dispatch state |
| Worker assignment | Titan Field operational dispatch + Titan People workforce identity | Concrete mutation service not yet proven in current-main scan | Re-read assignment from canonical Field state and validate worker company scope |
| Customer updates | Titan CRM | Owner identified; generic mutation adapter not yet proven | Re-read CRM customer/contact state |
| Invoice/payment follow-up preparation | Titan CRM revenue document/receivable authority | Business Ops handoff exists; native preparation mutation still being traced | Re-read canonical invoice/receivable/follow-up state |
| SMS | Titan Connect ownership; concrete receipt surface `apps/web/app/api/internal/sms/outbound/route.ts` | Delivery/failure receipt persistence exists | Verify communication state by `company_id` + communication/conversation/correlation identity + provider external id |
| Push | Internal push routes exist in web app | Surface located; delivery semantics still require provider trace | Provider receipt/state where supported; queue acceptance is insufficient |
| Email | Titan Connect owner | Not yet concretely traced in this pass | Locate canonical provider + delivery/bounce state before binding |
| MCP | `packages/tools/mcp-provider-contract.mjs` | Contract present/hardened | Query resulting resource/state independently |
| Browser Node | `packages/tools/browser-node-contract.mjs` | Contract present/hardened | Concrete executor + independent resulting page/business-state read |
| Evidence | gateway `evidenceSink` + provenance | Lifecycle/correlation contract present | Converge durable sink with canonical provenance/persistence owners |

## Non-providers
`packages/domain/src/business-ops-commands.ts` is a governed navigation/action-handoff contract. A resolved route or opened UI is not a native business mutation and must never satisfy execution verification.

Discovery and provider availability are descriptive only. They never grant authority.
