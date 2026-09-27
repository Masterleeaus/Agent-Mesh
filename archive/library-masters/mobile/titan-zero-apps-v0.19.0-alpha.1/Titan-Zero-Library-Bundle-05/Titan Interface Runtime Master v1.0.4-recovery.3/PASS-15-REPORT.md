# Pass 15 — Trust, Governance, Receipts & Rollback UI

Version **0.15.0** adds a reusable source-governed trust lifecycle without moving Risk, Assurance, Autonomy, approval, execution, receipt or rollback authority into Titan Interface Runtime.

## Added

- `GovernanceStateProviderContract` and soft `GovernanceStateGatewayContract`.
- Contributor-scoped governance provider binding convention plus a global fallback.
- `TitanAIGovernanceStateProvider` soft adapter over the current host's authoritative `ApprovalQueue` contract.
- Bounded normalization for proposal, risk, assurance, autonomy, approval, execution, receipt, rollback and provenance state.
- `GovernanceWorkspaceComposer` / `GovernanceWorkspaceSnapshot`.
- Reusable `GovernanceReceiptPresenter`.
- Protected governance handoff intents for approve, reject, execute and rollback.
- Current TitanAI authoritative POST route handoffs for approval and receipt rollback.
- Read-only governance workspace route.
- Runtime health diagnostics and configuration invariants.

## Security / authority

- No direct TitanAI or business SQL is executed by Interface Runtime.
- Cross-tenant and cross-user governance results degrade and are excluded.
- UI action intents always remain `executable=false`.
- Rollback target is derived from authoritative state; the caller cannot choose an arbitrary rollback capability.
- Risk, assurance and autonomy values are source data, never local calculations.
- Receipts are source-owned and Interface Runtime stores no durable receipt ledger.

## Current host compatibility

The supplied Website1408 TitanAI contains:

- `ApprovalQueue::pending/find`;
- `ActionReceiptRepository`;
- `RollbackExecutionService`;
- approval approve/reject routes;
- receipt rollback route.

Pass 15 verifies these contracts by snapshot compatibility test. TitanAI does not currently expose a generic receipt read port to Interface Runtime, so receipt display is available whenever a source provider supplies the receipt or an executing interaction returns it through a future authority adapter; Interface Runtime does not bypass that boundary with direct table reads.
