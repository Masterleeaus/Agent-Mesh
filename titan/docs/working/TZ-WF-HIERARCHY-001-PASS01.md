# TZ-WF-HIERARCHY-001 — Pass 1

Pass 1 inventories the current standalone Titan Zero workforce hierarchy and establishes a single native contract without replacing existing runtimes.

## Existing semantics retained

- The canonical workforce graph is derived and does not grant authority.
- Manager/Supervisor runtime semantics remain coordination-only.
- Decision rights remain distinct from execution authority.
- Delegation remains a governed proposal that requires authority evaluation and capability resolution.
- Atomic workers remain least-authority execution units and cannot delegate.
- The standalone Business Ops command gateway remains the route/business-truth authority for operational commands.
- `company_id` remains the canonical company boundary.

## Native contract

The native standalone hierarchy is now expressed as:

`Manager -> Supervisor -> Agent -> Worker`

This intentionally maps the older five-tier donor model into the current product language: legacy orchestrator/manager coordination semantics feed the Manager tier, specialist/standalone-agent semantics feed Agent, and atomic workers remain Worker. No identity, parentage, hierarchy membership, delegation, or decision right grants execution authority.

## Pass 1 change

Added `packages/titan-platform/src/workforce-hierarchy/contract.ts`, a machine-readable inventory, an app-facing re-export, and focused contract tests. No existing workforce UI, business route, authority evaluator, graph, delegation runtime, or atomic worker binding was replaced.
