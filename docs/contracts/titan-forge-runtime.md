# Titan Forge build and artifact runtime

Issue #1184 owns the shared build/generation boundary under `packages/titan-platform/src/titan-forge`. It is not a deployment engine, package store, capability registry, authority engine, task ledger, or business database.

## Donor disposition

The Library Titan Forge Master v0.9.0-alpha.9 donor was inventoried against current main:

| Donor area | Disposition | Current owner/boundary |
| --- | --- | --- |
| ForgeManager/build request/context/plan/step | Reuse semantics, replace runtime | `titan-forge/runtime.ts` |
| Sandbox generation and resource limits | Reuse safety intent, replace with fail-closed native adapter | `buildForgeCandidate` |
| Titan AI planning gateway | Defer as optional provider | `selectForgeProvider`; AI is never implicit |
| Artifact/release repositories | Reject a second store; emit immutable candidate records | #913 evidence and the caller's canonical store |
| Validation/risk/council/release gates | Reuse findings and governed handoff semantics | #14/#640 execution gateway |
| Provider health/fallback | Reuse policy, deterministic native provider first | `selectForgeProvider` |
| Workforce contribution adapters | Defer to existing Workforce/runtime owners | #812 and existing platform contracts |
| Rewind/reconstruction projections | Replace with deterministic hashes and rollback handoff plan | `planForgeRollback` |

## Contract and safety rules

`company_id` is mandatory and is the only logical company boundary. Request inputs reject credential-like keys recursively. Generated paths reject absolute paths, parent traversal, backslashes, and NULs. The default native provider has no network, secrets, or database access; limits cover bytes, files, and time. Generation is wrapped in a timeout and the generated reference is cleared on every terminal path.

Plans and artifact hashes are deterministic over the source digest, package identity, version, and inputs. The native provider can operate without Frappe or external AI. Optional AI providers require explicit `ai_allowed: true`; health selection never silently selects a paid/cloud provider.

Artifacts are scanned for hostile prompt/exfiltration instructions, credential-like content, and dependency licence violations. A candidate carries provenance, SBOM entries, findings, blockers, evidence references, rollback metadata, and `authority_effect: false`. Any high or critical finding rejects the candidate.

Forge can hand a non-blocked candidate to the governed execution gateway for preview/deployment/verification coordination. The handoff capability is not promotion, deployment, or rollback; the result is required to be `VERIFIED`, and promotion remains false. `planForgeRollback` creates a governed rollback handoff only.

## Verification matrix

The focused runtime tests cover deterministic plans, credential/path rejection, hostile artifacts, dependency licences, provenance, timeout cleanup, company validation, governed handoff, promotion denial, and rollback non-execution. Full workspace verification remains subject to the repository's dependency/network availability and current web baseline gate.

