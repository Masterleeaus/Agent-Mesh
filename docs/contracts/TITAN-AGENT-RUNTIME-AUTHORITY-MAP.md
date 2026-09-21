# Titan Zero Agent Runtime, Tool & Authority Map

**Roadmap:** `TZ-ROADMAP-01-SG-01`  
**Source snapshot:** `7d061ef8b61677df476118967c42357bb34f0154`  
**Rule:** this document maps the existing runtime. It does **not** create a parallel agent runtime.

## Executive map

Titan Zero already has the main pieces of a governed agent operating kernel. The strongest current path is:

```text
interaction / request context
        ↓
native agent planning / DecisionPacket evidence
        ↓
capability + tool resolution
        ↓
delegation proposal / worker binding
        ↓
authority evaluation
        ↓
governed command envelope
        ↓
Titan Command Bus transport
        ↓
authoritative execution receipt
        ↓
post-action verification / evidence
```

The core authority posture is already fail-closed: **identity is not authority**, `company_id` is the canonical company boundary, high-risk work requires evidence/approval, critical mutation is denied, and governed execution binds replay/idempotency and authoritative receipts.

## Verified runtime boundaries

### 1. Interaction and correlation context

`InteractionContext.schema.json` defines an authority-neutral context with `company_id`, canonical `zero/go/hub` surface identity, and optional request/operation/correlation/conversation identifiers.

This is context only; `authority_neutral` is fixed to `true`.

### 2. Native agent planning

`packages/titan-platform/src/native-agents.ts` contains deterministic planning for dispatch, invoicing, rebooking, quoting and CRM.

Planning outputs proposals/commands. Where the proposal schema exposes authority flags, it explicitly keeps execution and authority false until later gates.

The web planning route also overwrites supplied company context from the authenticated session for the supported company-bound planners.

### 3. Capability and tool discovery

Current discovery is distributed across:

- `titan-capabilities/capability-registry.ts`
- `titan-tools/tool-registry.ts`
- atomic worker tool bindings
- Business Ops command catalogues
- Decision adapter registry

The tool registry enforces `company_id`, device-first cost routing, and `grants_execution_authority=false`. Atomic worker bindings likewise do not grant authority.

This is reusable infrastructure, but it is **not yet one canonical discovery authority**.

### 4. Decision and evidence layer

`DecisionPacket.schema.json` carries company, observation/evidence, risk, recommended actions and provider provenance.

Decision adapters correlate domain evidence into packets. A DecisionPacket may state that authority is required, but it is not itself an authority grant.

### 5. Authority evaluation

`authority-evaluator.ts` is the strongest canonical worker authority boundary currently present.

It binds:

- `company_id`
- worker identity
- capability / operation / action
- risk
- evidence
- approval
- autonomy snapshot
- authority freshness/supersession

Important fail-closed rules already present:

- critical risk → deny
- protected/high-risk work → approval/escalation/evidence gates
- self-approval forbidden
- identity/role/module activation does not grant authority
- stale/superseded authority decisions are rejected

`distributed/authority.ts` reinforces that model/provider/node/trust identity can constrain placement/eligibility but cannot create business authority.

### 6. Governed mutation boundary

`execution-boundary.ts` provides the canonical mutation envelope.

`prepareGovernedCommandEnvelope()` requires an allowed authority decision and binds:

- company
- actor
- action / capability / operation
- idempotency
- execution context
- authority decision/provenance
- approvals/evidence
- reversibility/compensation
- trace/correlation
- replay proof

The resulting envelope declares:

- `execution_transport: titan-command-bus`
- `direct_mutation: false`
- authoritative execution receipt required

Receipt and post-action verification contracts then bind observed effects back to the governed command.

### 7. Delegation boundary

Delegation routing is explicitly proposal-only. Worker/tool binding and organizational identity do not grant execution authority.

Atomic workers are non-delegating execution leaves and still require the later authority boundary.

### 8. Business Ops authority

Business Ops contains server-owned command/action catalogues and role affordances.

The domain authority contract explicitly states that a client-side allowed action is **not proof of authority**; server routes must enforce authorization themselves.

## Important gap found in the live web path

`apps/web/lib/titan/workforce-command-gateway.ts` currently validates the known command and role, stamps company/user context, assesses risk, then executes by direct same-origin `fetch()` to the native Business Ops API route.

That does **not** by itself prove that a mutating workforce command traversed `prepareGovernedCommandEnvelope()` / the canonical Titan Command Bus before execution.

This does **not** prove the downstream native route is insecure. It means the **canonical governed-mutation boundary is not demonstrated at this handoff**, so later convergence must not assume this path is already Command-Bus-complete.

## Remaining convergence owned by later subgoals

- **SG02 — invocation envelope:** unify InteractionContext, planning context, operation/correlation and execution context into one canonical agent invocation envelope.
- **SG03 — deterministic registry:** converge capability/tool/action discovery without creating another registry authority.
- **SG05 — approval/risk/reversibility:** ensure all mutating workforce paths demonstrably cross the governed authority/Command Bus boundary and preserve approval/evidence/reversibility semantics.

## Titan Code boundary

Titan Code is **not** part of this production runtime map. It remains private development/management tooling and must not become a Titan Zero runtime dependency.

## Conclusion

The current system does not need another agent runtime. The verified architecture already contains the necessary reusable primitives. The remaining work is **convergence and wiring**, especially around a unified invocation envelope, a single deterministic discovery authority, and proof that every mutation crosses the governed command boundary.
