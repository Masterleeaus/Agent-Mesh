# TASK-153: Titan Zero Evolution and Business Reality convergence

Status:
In Progress

Phase:
cross-cutting

Problem:
Titan Zero has historical OnboardingPro v6 mechanisms for continuous observation, Business Reality, semantic reconfiguration, governed provisioning, consent, outcome measurement and rollback evidence, but they are not yet converged into the current TypeScript architecture. Rebuilding them as a parallel application would duplicate authority and state ownership.

Business Value:
Titan Zero can continuously understand how a business changes, propose bounded configuration changes, verify their effects and learn from outcomes while preserving one authoritative Reality model and the existing governance/execution spine.

Scope:
- Deep-scan current TypeScript ownership before implementation and retain canonical implementations where they already exist.
- Converge only superior or missing donor semantics from OnboardingPro v6 into current TypeScript owners.
- Preserve Business Reality separately from Personal Zero; Zero inference is evidence/candidate input and cannot silently rewrite authoritative Business Reality.
- Support incremental observation freshness and meaningful-change detection.
- Preserve provenance/confidence for Reality facts, nodes, edges and observations.
- Preserve semantic configuration diff, no-op rejection, impact preview and approval snapshot/fingerprint.
- Keep reconfiguration/provisioning idempotent, verified and routed through existing Risk, Assurance, Governance, Autonomy/Trust and Command Bus authority.
- Preserve purpose-bound, revocable, expiry-aware discovery consent.
- Feed verified outcomes, unintended effects and rollback signals into canonical Experience/Rewind/Signal/Learning owners without creating a second authority path.
- Use `company_id` as the only canonical company tenant boundary.

Out of Scope:
- Recreating OnboardingPro as an application or PHP runtime.
- A second Business Reality Graph, observation engine, reconfiguration engine, provisioning authority, rollback authority, Personal Zero store or Command Bus.
- Letting learning, prediction, confidence or Zero inference grant authority.
- Titan Code as a production dependency.

Acceptance Criteria:
- [ ] Current TypeScript Reality/Evolution owners and overlaps are documented before implementation.
- [ ] One canonical Business Reality/Evolution lifecycle implements discover → configure → observe → detect change → reassess → diagnose → propose → approve where required → reconfigure → verify → measure → learn → repeat.
- [ ] Company isolation and legacy tenant aliases fail closed.
- [ ] Observation freshness and meaningful/non-meaningful change behavior are tested.
- [ ] Reality provenance/confidence and candidate-to-authoritative promotion are tested.
- [ ] Semantic diff/no-op rejection and exact approval snapshot integrity are tested.
- [ ] Governed reconfiguration is idempotent and verification failure produces attention/escalation rather than silent success.
- [ ] Consent purpose, expiry and revocation are tested.
- [ ] Outcome delta/confidence and reversible rollback signals are bounded and tested.
- [ ] Zero/learning inputs cannot silently rewrite Reality or grant authority.
- [ ] Donor provenance and rejected duplicate components are recorded.
- [ ] Relevant scoped TypeScript typecheck/unit tests pass.

Notes:
Implements GitHub issue #767. Donor evidence: OnboardingPro Master v6.0.0-rc.4. Dependencies/adjacent owners include #31, #153, #633, #759, Personal Zero #768, Knowledge Authority, Rewind, Signal, Risk, Assurance, Governance, Autonomy/Trust and Command Bus.
