# Agent 5 — Browser / MCP / Execution Convergence

Status: IMPLEMENTED CONTRACT SLICE — awaiting CI/integration audit
Issue: #43
Branch: `agent/43`
Base main: `173a8b7f0298b61bf061f25efd8cc72652f4054e`

## Implemented
- Provider-neutral `ExecutionGateway` with native / connected / operated classes.
- Explicit authority/risk precondition; provider availability never grants authority.
- Company-scoped provider selection, credential-handle guard, idempotency suppression, structured wait/failure states.
- Evidence envelope with execution/work/agent/company correlation and verified-outcome requirement.
- Titan Zero Browser Node provider contract with personal/agent/team/company/ephemeral session scopes, local-first provider shape, domain controls, MFA/login wait states and untrusted-page boundary.
- MCP adapter that separates discovery from authority and normalises external tools to stable Titan capabilities.
- Behavioural Node tests for authority, evidence, idempotency, credential isolation, browser domain/company boundary, prompt-injection trust boundary and MCP governance.

## Titan systems discovered
- `packages/tools/` is already the canonical registry/discovery area; `TOOL-REGISTRY.json`, census/launch maps and discovery bridges exist. KEEP; no second registry created.
- `packages/runtime/authority/` contains implemented authority evaluator/lease contracts. CONNECT; this pass accepts its approved/approval-required/denied result rather than rebuilding Trust/authority.
- `packages/provenance/` contains provenance contracts/indexes. CONNECT through the gateway evidence sink rather than inventing a second evidence store.
- Runtime contracts and worker/service layers exist and remain owned by other agents.

## OpenAcme donor findings
OpenAcme is MIT licensed. Useful implemented donor patterns:
- `packages/browser`: Playwright-core BrowserManager, local Chrome plus Browserbase/Browser-Use/Firecrawl providers, stable tab aliases, accessibility snapshots, screenshots, form/interaction operations and lazy persistent per-agent profile bindings.
- `packages/mcp-client`: stdio/SSE/streamable HTTP, per-server lifecycle/status, retries/backoff, tool discovery, OAuth handoff/token-store hooks and security sanitisation.

Titan does not adopt OpenAcme's hard-coded per-agent browser ownership assumption. Titan contract supports personal, agent, team, company and ephemeral ownership.

## Invariants
`tool available != agent authorised`
`browser authenticated != action authorised`
`MCP discovered != action authorised`

Canonical path remains Agent intent → Decision → Risk → Authority → Execution → Evidence.
