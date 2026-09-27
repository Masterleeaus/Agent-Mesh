# Titan Zero Browser Node

Titan Zero Browser Node is the browser execution surface for Titan Zero field-service operations.

It is **not** Titan Code, a coding IDE, a portfolio tool, or an Agent Mesh management console.

## Canonical purpose

Browser Node gives Titan Zero a governed way to observe and operate supported browser workflows on behalf of the current `company_id`, subject to Titan Trust, authority, evidence and outcome verification.

Canonical flow:

```text
ONE / ZERO / GO / HUB
        ↓
Interaction Engine
        ↓
Workforce / WorkItem
        ↓
Decision + Risk + Authority
        ↓
Execution Gateway
        ↓
Titan Zero Browser Node
        ↓
Browser action / observation
        ↓
Evidence + verified outcome
        ↓
ZERO
```

## Keep from Titan Code

The Browser Node may retain proven implementation pieces when they serve Titan Zero directly:

- governed browser perception and semantic snapshots
- screenshot capture
- navigation
- click, type, focus, clear and keyboard interaction
- viewport emulation
- JavaScript dialog handling
- console/network observability
- styles and React/source inspection where operationally useful
- bounded browser-compose sequencing
- exact tab/origin binding
- recovery and receiver health
- evidence receipts
- local/browser intelligence runtimes where they support field-service work
- WebLLM, Chrome built-in AI and local-model routing subject to Titan authority
- MCP/browser integration where governed by Titan execution authority

## Remove or demote from the Titan Zero product surface

These Titan Code concepts are not canonical Browser Node product features:

- coding-plan IDE workflows
- repository coding workspace as the main UI
- portfolio/developer-product branding
- Agent Mesh Manager UI or control plane
- private Titan Code manager/supervisor concepts
- coding-only prompt/skill catalogues as primary navigation
- development-only diagnostics that do not help operators, workers or customers
- any runtime that can invent execution authority

Reusable libraries can remain temporarily while convergence work removes dependencies, but they must not appear as Titan Zero product concepts.

## Titan Zero alignment

### Tenant

`company_id` is the canonical tenant boundary.

Legacy `tenant_id` or `tenant_company_id` may be accepted only at compatibility ingress and must be normalized before authority, storage, execution or evidence decisions.

### Surfaces

Browser Node serves Titan Zero's canonical surfaces:

- `zero` — owner/manager control through conversation and generated UI
- `go` — worker/field execution guidance
- `hub` — customer self-service and support

### Authority

Browser capability never creates authority by itself.

The node must preserve Titan's authority progression and enforcement. Browser actions execute only inside the authority envelope delivered by Titan's canonical decision/risk/execution systems.

### Evidence

Every meaningful browser mutation should produce evidence that can be correlated to:

- `company_id`
- actor / user
- surface
- conversation
- WorkItem / work id
- agent / worker
- decision
- execution
- outcome

Generated UI and browser state are projections, never a second source of truth.

## Field-service capability priorities

Browser Node should prioritise workflows that help run a real field-service business, including:

- customer enquiries and support portals
- booking and scheduling portals
- supplier/vendor portals
- quoting and procurement workflows
- job documentation
- web-based communications
- invoice/payment portal interactions
- compliance and evidence collection
- forms and submissions
- research and retrieval required by governed WorkItems
- operator-assisted browser tasks from Zero/Go/Hub

Repository-development features are secondary compatibility code and should be progressively removed from the production Browser Node surface.

## Convergence rule

Do not fork Titan Zero architecture inside the extension.

The Browser Node is an execution node, not a second workforce, second authority engine, second memory system, second tenant system, or second source of truth.
