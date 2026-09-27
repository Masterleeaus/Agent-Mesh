# Trust, Governance, Receipts & Rollback UI

Pass 15 adds a presentation-only trust lifecycle over authoritative governance sources.

## Lifecycle

`proposal → risk / assurance / autonomy → approval → execution → receipt → rollback / recovery`

Interface Runtime renders these layers but does not calculate them. A source governance provider remains authoritative for risk level, assurance evidence, autonomy policy, approval status, execution state, receipt content and rollback/compensation availability.

## Provider boundary

Governance providers implement `GovernanceStateProviderContract` and are resolved through the soft container convention:

- `titan.interface.governance.{extension-key}`
- fallback: `titan.interface.governance`

The current host fallback is `TitanAIGovernanceStateProvider`, which talks only to TitanAI's `ApprovalQueue` contract. It never reads `titan_ai_*` tables directly and intentionally does not fabricate receipts that TitanAI has not exposed through an authority contract.

## Protected handoffs

Every UI action is emitted with `executable=false`.

For the current TitanAI host, pending approvals and receipt rollback use the authoritative routes:

- `dashboard.user.titan-ai.governance.approvals.approve`
- `dashboard.user.titan-ai.governance.approvals.reject`
- `dashboard.user.titan-ai.governance.receipts.rollback`

These are POST handoffs. The browser never supplies an arbitrary rollback capability; the rollback target is derived from authoritative receipt/governance state.

Generic sources may instead expose governed capability or Interaction Engine handoff references. Interface Runtime still does not execute those references itself.

## Receipts

`InterfaceReceipt` exposes source authority, status, receipt id, correlation/causation ids and source-declared rollback availability. `GovernanceReceiptPresenter` turns it into a reusable presentation node with change summary and reversibility metadata.

## Security invariants

- tenant and current-user identities are revalidated at the governance gateway;
- cross-tenant or cross-user provider results degrade and are excluded;
- action visibility still passes object, product-surface, permission and Hub customer-safety gates;
- governance failures do not become authorization grants;
- no governance/business persistence is owned by Interface Runtime;
- no risk, assurance or autonomy score is calculated locally;
- rendering can never auto-execute a recommendation, approval, action, rollback or compensation.
