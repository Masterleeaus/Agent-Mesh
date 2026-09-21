# Library Master Integration — AI / Decision / Intelligence

Issue: #633

## Canonical integration rule
1. Current TypeScript main remains authoritative.
2. Library masters are semantic/source donors unless a canonical implementation is absent.
3. Do not create parallel AI, Decision, Signal, Model Council, Nexus, Prime or Knowledge Authority engines.
4. `company_id` is the sole tenant boundary.
5. Intelligence outputs do not grant execution authority by identity, registration, recommendation, prediction or activation.
6. Reuse canonical DecisionPacket and authority contracts.

## Existing main evidence
- Decision Engine: `packages/titan-platform/src/ported/titan-runtime/decision-engine/index.ts`.
- Decision intelligence: `packages/titan-platform/src/ported/titan-intelligence/decision/*`.
- DecisionPacket schema: `packages/titan-platform/src/ported/titan-runtime/contracts/schemas/DecisionPacket.schema.json`.
- Prime: `packages/titan-platform/src/ported/titan-runtime/prime/index.ts` plus `PrimeMissionEnvelope.schema.json`.
- Workforce Knowledge Authority integration: `packages/titan-platform/src/ported/titan-workforce/knowledge/workforce-knowledge-authority-runtime.ts`.
- Authority decision schemas/tests already exist under `packages/runtime/authority` and the ported runtime.

## Gap audit sequence
- AI Core provider registry/routing/locality parity.
- Decision Engine / DecisionPacket boundary parity.
- Signal semantics and deterministic prioritisation.
- Model Council recommendation/consensus boundary.
- Nexus/Prime orchestration without authority escalation.
- Knowledge Authority provenance/private-public separation.
- Add only missing reusable TypeScript semantics and regression tests.
