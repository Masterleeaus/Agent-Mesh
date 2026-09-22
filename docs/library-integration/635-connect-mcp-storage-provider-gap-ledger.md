# #635 — Titan Connect, MCP, storage and provider masters

## Pass 1 — canonical and donor convergence

### Existing canonical implementation
- `packages/titan-platform/src/ported/titan-ai-core/provider-registry.ts` is the canonical AI provider-locality registry.
- Provider locality remains device → customer-hosted → byo-cloud → titan-managed.
- `company_id` is the only Titan tenant boundary.
- Existing runtime/company-context and governed mutation paths remain authoritative.
- No Titan Connect, generic MCP executor, or storage authority runtime was found in the current TypeScript platform tree; no duplicate executor was created.

### Library donor evidence
Validated Library architecture/discovery records identify:
- Titan MCP Master v1.5.14 — provider-neutral adapters, capability gates, encrypted credential storage, secret redaction, provider health and company-boundary tests.
- Titan Connect Master v0.10.7 — host manifest, permission catalogue, credential store/vault, channel health, provider registry, company-isolation probe and company rate limiting.
- Titan Command Bus Master v0.5.4 — existing governed execution boundary; connector registration/permission must not replace it.

### Adopted semantics
The donor PHP implementations are not directly portable into the TypeScript runtime without creating a second framework. Instead, the missing provider-neutral connector *contract* was ported:
- `packages/titan-platform/src/ported/titan-connect/connector-contract.ts`
- capability, permission and health descriptors
- mandatory `company_id`
- opaque credential reference only; credential material is never exposed
- registration/activation/execution are explicitly authority-neutral

Exports and focused regressions were added without creating a connector executor, credential vault, storage backend, or provider authority.

## Remaining
Deep-scan storage/offline/local bridge and MCP-specific current TypeScript implementations/donor evidence before adding any further code. Preserve existing offline/sync and provider registry systems; do not create parallel storage or MCP execution runtimes.

## Pass 2 — storage/offline convergence

The current TypeScript platform already contains a canonical Storage Fabric under `src/storage/`, plus offline mutation queue, sync, reconciliation, restart recovery and network resilience. These systems already enforce `company_id`, reject legacy tenant boundaries, use local-primary reconciliation, record explicit conflicts, and mark storage/offline outputs authority-neutral. No second storage backend or offline runtime was created.

Added focused regression coverage for legacy tenant rejection, cross-company payload rejection, and authority-neutral storage envelopes. Existing storage/offline implementations are therefore the canonical convergence target; donor storage semantics should be imported only where a later audit identifies a concrete gap.

## Pass 3 — MCP host negotiation convergence

Library discovery evidence confirms the mature Titan MCP donor has JSON-RPC transport, tools/resources/prompts, scoped authentication, capability gating, trusted-origin controls and mutation continuity, while the live TypeScript ChatGPT App supplies the preferred TypeScript host/client seam. The existing canonical TypeScript capability registry and MCP external-tool governance remain the authority sources.

The concrete missing cross-host semantic was a provider-neutral feature negotiation contract. Added `mcp-host-contract.ts` with MCP 2025-03-26 versioning, canonical `company_id`, host feature intersection, and explicit authority-neutral semantics. It does not execute tools, own credentials, or grant permissions. Added focused regression coverage. No PHP MCP server or duplicate tool catalogue was ported.

Remaining MCP work is transport/host wiring and security/provider credential semantics only if the current repository demonstrates a real gap; those must delegate to canonical capability, governance and Command Bus systems.

## Pass 4 — Cost Sovereignty / local-provider convergence

Deep-scan of Library evidence confirms Titan AI/Titan AI Core/Model Council already establish device/local/BYO/Titan routing, explicit credential resolution, company-scoped model access and a no-hidden-Titan-fallback contract. Existing canonical TypeScript provider locality registry remains the routing authority; no second provider registry was created.

The concrete missing provider-neutral TypeScript semantic was an explicit cost-sovereignty decision contract. Added cost-sovereignty.ts with canonical company_id, device/customer-hosted/BYO/Titan route vocabulary, local-only enforcement, explicit Titan entitlement or metered opt-in requirements, and an unconditional titan_funded_fallback=false guarantee. It is policy/decision metadata only and grants no execution authority. Added regression coverage and exports.

No credential material, provider SDK, Local Bridge server, or duplicate inference runtime was introduced. Local Bridge/Ollama remain provider/runtime implementations behind the canonical policy layer.

## Pass 5 — Credential-reference security convergence

Library evidence identifies encrypted credential storage, secret redaction, provider connection references and company-scoped access as mature donor semantics. The current connector descriptor already deliberately carries only an opaque credential_ref, so no vault or secret store was duplicated.

Added the missing explicit TypeScript credential-reference contract: `credential-contract.ts`. It binds references to `company_id` and provider, rejects malformed references, and guarantees secret material is not represented in the contract. Added exports and focused regressions. Actual credential storage/resolution remains outside this descriptive contract and must be implemented only through the canonical governed security/storage path if a later repository audit proves a gap.

## Pass 6 — cross-contract audit / defect fix

Reviewed the accumulated #635 contracts together rather than adding another subsystem. Found one genuine defect in the Cost Sovereignty policy: its Titan-managed entitlement check made the explicit metered-opt-in path unreachable. Corrected the predicate so either entitlement or explicit metered opt-in permits Titan-managed routing; absent both, the route escalates without hidden Titan funding. Added regression coverage for explicit `titan_metered_opt_in: false`.

Also verified the Connect, MCP host, credential-reference and Cost Sovereignty contracts remain descriptive/policy-only and do not create an execution gateway or authority path. No new runtime was introduced.

## Pass 7 — final package/build integration hardening

Final integration scan found the new #635 TypeScript contracts were exported from `src/index.ts` but were not included in the package `tsconfig.files` list or explicit package subpath exports. Corrected both so the contracts participate in the canonical platform typecheck/build surface. Strengthened Cost Sovereignty regression coverage for the explicit no-hidden-Titan-funded-fallback case.

No new runtime, tenant boundary, executor, vault or authority mechanism was introduced.
