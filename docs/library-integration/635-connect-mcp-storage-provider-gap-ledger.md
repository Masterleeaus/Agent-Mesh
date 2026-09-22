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
