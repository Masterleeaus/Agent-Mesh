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

## Convergence status
- **AI Core — complete for #633:** canonical provider-locality registry uses device → customer-hosted → BYO-cloud → Titan-managed ordering, canonical `company_id`, deterministic routing and no-authority registration semantics.
- **Decision Engine — complete for #633:** existing engine retained; recommendations explicitly remain authority-neutral and non-executable.
- **DecisionPacket — complete for #633:** canonical schema retained and hardened; no second packet format.
- **Model Council — complete for #633:** existing council retained; deterministic company-scoped consensus rejects cross-company votes and remains advisory.
- **Signal — complete for #633:** existing prioritisation retained; canonical company scope and advisory-only behavior are regression-covered.
- **Nexus — complete for #633:** repository audit found no canonical Nexus runtime, so the smallest authority-neutral, company-scoped orchestration contract was added without creating an execution host.
- **Prime — complete for #633:** existing Prime runtime retained and hardened. Mission envelopes require canonical `company_id` and bounded mission identity/objective, deterministically normalize evidence references, explicitly remain authority-neutral/non-executable, and declare Command Bus, governance and authority checks as mandatory. `PrimeMissionEnvelope.schema.json` now locks those guarantees and regression tests cover legacy tenant rejection, deterministic evidence and no-bypass/no-authority behavior.
- **Knowledge Authority — complete for #633:** existing Workforce Knowledge Authority retained. Sources now require explicit source identity in addition to provenance/version/freshness; shared-public and company-private scopes remain distinct; private knowledge is company-isolated; reasoning-use decisions and receipts explicitly remain non-authorizing/non-executable. Regression coverage locks source identity/provenance, legacy/cross-company rejection, scope separation and no-authority retrieval.
- **Final cross-system convergence — pending:** duplicate/tenant/authority/contracts/exports/imports/tests/donor-runtime audit.

## Prime evidence
- Runtime hardening: `packages/titan-platform/src/ported/titan-runtime/prime/index.ts`.
- Contract hardening: `packages/titan-platform/src/ported/titan-runtime/contracts/schemas/PrimeMissionEnvelope.schema.json`.
- Regression coverage: `packages/titan-platform/tests/prime-library-parity.test.mjs`.
- Runtime activation, mission creation, evidence attachment and mission state never confer execution authority.
- Prime declares `command_bus_required: true`, `governance_required: true`, and `authority_check_required: true`; these are invariants, not authority grants.


## Knowledge Authority evidence
- Canonical runtime remains `packages/titan-platform/src/ported/titan-workforce/knowledge/workforce-knowledge-authority-runtime.ts`, re-exporting the existing implementation from the handover runtime; no second store/RAG/authority engine was introduced.
- Source-identity hardening: `packages/titan-platform/src/ported/titan-workforce/handover/investigation-installation-handover.ts`.
- Regression coverage: `packages/titan-platform/tests/knowledge-authority-library-parity.test.mjs`.
- `SHARED_PUBLIC` knowledge has no company ownership; `COMPANY_PRIVATE` knowledge is bound to the requesting `company_id` and cross-company private sources fail closed.
- Knowledge can be allowed only for reasoning and still requires an independent authority decision; neither retrieval nor its receipt permits execution.
