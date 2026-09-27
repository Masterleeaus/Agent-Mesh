# Findings

## Pass 1

1. **Persistent agent runtime is real, not merely planned.** Current main contains `TitanAgentRuntime` plus a SQLite run store.
2. **Tenant normalization exists at runtime ingress.** `company_id` is canonical; legacy identifiers are accepted only through normalization with conflict rejection.
3. **Runtime already has the correct broad control seam.** Models request capabilities; capability resolution and `authorityGateway.authorize()` occur before `authorityGateway.execute()`.
4. **Runtime already models waiting/restart states.** This should be extended/converged, not replaced.
5. **Approval resume requires special attention.** A pending tool call is stored in `run.wait`, but generic `resume()` does not explicitly complete that pending governed action. End-to-end tracing is required before implementation.
6. **Zero path assumptions in old prompts/reports cannot be trusted literally.** Current main has `apps/web/app` and an existing owner application area; the canonical Zero integration point must be found from current routing/components/API.
7. **Previous agent convergence directories exist but are non-authoritative.** Their useful mechanics will be checked against current main before reuse.
